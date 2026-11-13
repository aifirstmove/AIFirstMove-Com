/* aifirstmove.com Spell Check page.
   Looks a word up through spellcheck.aifirstmove.com, keeps the free-try count in this browser,
   and offers three more checks in return for a name and email. */
(function () {
  "use strict";
  var API = "https://spellcheck.aifirstmove.com";
  var LIVE = /(^|\.)aifirstmove\.com$/.test(location.hostname);
  var FREE = 3, MORE = 3, RESET_MS = 48 * 3600 * 1000, KEY = "afm-spellcheck-v1";
  var VOICE_LANGS = [["en-US", "English (US)"], ["en-GB", "English (UK)"], ["es-ES", "Español (España)"], ["es-MX", "Español (México)"], ["fr-FR", "Français"], ["de-DE", "Deutsch"], ["it-IT", "Italiano"], ["pt-BR", "Português (Brasil)"], ["pt-PT", "Português (Portugal)"], ["nl-NL", "Nederlands"], ["pl-PL", "Polski"], ["sv-SE", "Svenska"], ["tr-TR", "Türkçe"], ["ru-RU", "Русский"], ["uk-UA", "Українська"], ["ar-SA", "العربية"], ["he-IL", "עברית"], ["hi-IN", "हिन्दी"], ["zh-CN", "中文 (普通话)"], ["ja-JP", "日本語"], ["ko-KR", "한국어"], ["vi-VN", "Tiếng Việt"], ["id-ID", "Bahasa Indonesia"]];

  var $ = function (id) { return document.getElementById(id); };
  var form = $("sc-form"), input = $("sc-word"), checkBtn = $("sc-check"), micBtn = $("sc-mic"), langSel = $("sc-lang"),
      voiceRow = $("sc-voice-row"), status = $("sc-status"), results = $("sc-results"), meter = $("sc-meter"),
      offer = $("sc-offer"), offerForm = $("sc-offer-form"), offerMsg = $("sc-offer-msg"), notice = $("sc-notice"), hello = $("sc-hello");
  if (!form) return;

  /* ---------- state kept in this browser ---------- */
  var mem = {};
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return mem; } }
  function save(s) { mem = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function state() {
    var s = load();
    if (s.lead) { if (s.day !== today()) { s.day = today(); s.used = 0; save(s); } }
    else if (s.start && Date.now() - s.start >= RESET_MS) { s.n = 0; s.start = 0; s.dismissed = 0; s.tokens = []; save(s); }
    return s;
  }
  function left(s) { return s.lead ? Math.max(0, FREE + MORE - (s.used || 0)) : Math.max(0, FREE - (s.n || 0)); }
  function resetText(s) {
    var ms = (s.start || Date.now()) + RESET_MS - Date.now(), h = Math.ceil(ms / 3600000);
    if (h > 36) return "Tries reset in 2 days.";
    if (h > 1) return "Tries reset in about " + h + " hours.";
    return "Tries reset within the hour.";
  }

  /* ---------- small helpers ---------- */
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function show(node, on) { node.hidden = !on; }
  function say(text, kind) { status.textContent = text || ""; status.className = "sc-status" + (kind ? " is-" + kind : ""); }
  function firstName(n) { return String(n || "").trim().split(/\s+/)[0] || ""; }

  function paint() {
    var s = state(), n = left(s);
    if (s.lead) {
      hello.textContent = "Welcome back, " + firstName(s.lead.name) + ".";
      show(hello, !justJoined);
      meter.textContent = n > 0 ? n + " of " + (FREE + MORE) + " checks left today" : "You have used today's " + (FREE + MORE) + " checks. Come back tomorrow for more.";
      show(offer, false); show(notice, false);
    } else {
      show(hello, false);
      meter.textContent = n > 0 ? n + " of " + FREE + " free checks left" : "You have used your " + FREE + " free checks.";
      if (n === 0) {
        if (s.dismissed) { notice.firstChild.textContent = resetText(s) + " "; show(notice, true); show(offer, false); }
        else { show(offer, true); show(notice, false); }
      } else { show(offer, false); show(notice, false); }
    }
    checkBtn.disabled = n === 0;
    input.disabled = n === 0;
    if (micBtn) micBtn.disabled = n === 0;
  }

  /* ---------- the lookup ---------- */
  var MOCK = {
    recieve: { language: "English", language_code: "en", results: [{ spelling: "receive", definition: "To get or be given something." }] },
    nesesario: { language: "Spanish", language_code: "es", results: [{ spelling: "necesario", definition: "Que hace falta o es indispensable para algo." }] },
    desert: { language: "English", language_code: "en", results: [{ spelling: "desert", definition: "A dry area of land with very little rain." }, { spelling: "dessert", definition: "A sweet dish eaten at the end of a meal." }] }
  };
  function post(path, body) {
    if (!LIVE) {
      return new Promise(function (res) {
        setTimeout(function () {
          if (path === "/lead") return res({ ok: true, returning: false });
          var w = String(body.word).toLowerCase(), m = MOCK[w] || { language: "English", language_code: "en", results: [{ spelling: body.word, definition: "Sample definition. On the live site this text is written by AI in the word's own language." }] };
          res({ ok: true, valid: true, language: m.language, language_code: m.language_code, results: m.results, token: "preview" });
        }, 600);
      });
    }
    return fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: "server" }; }); });
  }
  var ERR = {
    one_word: "Enter one word, with no spaces or numbers.",
    slow_down: "That was quick. Wait a minute and try again.",
    busy: "The spell check is busy today. Please try again tomorrow.",
    lookup_failed: "We could not check that word just now. Please try again.",
    name_email: "Enter your name and a valid email address.",
    no_words: "Check a word first, then sign up.",
    server: "Something went wrong on our side. Please try again."
  };

  function render(word, data) {
    results.textContent = "";
    if (!data.valid || !data.results.length) {
      results.appendChild(el("p", "sc-none", "We could not recognize “" + word + "” as a word. Check it and try again."));
      return;
    }
    var many = data.results.length > 1;
    var exact = !many && data.results[0].spelling.toLowerCase() === word.toLowerCase();
    results.appendChild(el("p", "sc-result-label", many ? "Did you mean one of these?" : exact ? "Spelled correctly" : "Correct spelling"));
    data.results.forEach(function (r) {
      var card = el("article", "sc-card");
      var h = el("h2", "sc-spelling", r.spelling); if (data.language_code) h.lang = data.language_code;
      var d = el("p", "sc-definition", r.definition); if (data.language_code) d.lang = data.language_code;
      card.appendChild(h); card.appendChild(d);
      if ("speechSynthesis" in window) {
        var b = el("button", "sc-listen", "Listen"); b.type = "button";
        b.addEventListener("click", function () { speak(r.spelling + ". " + r.definition, data.language_code); });
        card.appendChild(b);
      }
      results.appendChild(card);
    });
    results.appendChild(el("p", "sc-foot", (data.language ? data.language + ". " : "") + "Definition written by AI, not taken from a published dictionary."));
  }

  var byVoice = false, busy = false, justJoined = false;
  function check(word) {
    var s = state();
    if (busy) return;
    if (left(s) === 0) { paint(); return; }
    word = String(word || "").trim();
    if (!word || /\s/.test(word) || word.length > 40) { say(ERR.one_word, "error"); input.focus(); return; }
    busy = true; checkBtn.disabled = true; say("Checking…");
    var body = { word: word };
    if (s.lead) { body.email = s.lead.email; body.name = s.lead.name; }
    post("/lookup", body).then(function (data) {
      busy = false;
      if (!data || !data.ok) { say(ERR[data && data.error] || ERR.server, "error"); paint(); return; }
      say("");
      render(word, data);
      if (data.valid) {
        s = state();
        if (s.lead) { s.used = (s.used || 0) + 1; }
        else { if (!s.start) s.start = Date.now(); s.n = (s.n || 0) + 1; s.tokens = (s.tokens || []).concat(data.token ? [data.token] : []).slice(-FREE); }
        save(s);
        if (byVoice && data.results[0]) speak(data.results[0].spelling + ". " + data.results[0].definition, data.language_code);
      }
      byVoice = false;
      paint();
    }).catch(function () { busy = false; byVoice = false; say(ERR.server, "error"); paint(); });
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); byVoice = false; check(input.value); });

  /* ---------- voice out ---------- */
  function speak(text, code) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      if (code) {
        u.lang = code;
        var base = code.toLowerCase().split("-")[0];
        var v = window.speechSynthesis.getVoices().filter(function (x) { return x.lang && x.lang.toLowerCase().replace("_", "-").split("-")[0] === base; })[0];
        if (v) u.voice = v;
      }
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }

  /* ---------- voice in ---------- */
  var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Rec && micBtn && langSel) {
    var nav = (navigator.language || "en-US"), pick = "en-US";
    VOICE_LANGS.forEach(function (l) { var o = el("option", "", l[1]); o.value = l[0]; langSel.appendChild(o); });
    VOICE_LANGS.some(function (l) { if (l[0].toLowerCase() === nav.toLowerCase()) { pick = l[0]; return true; } return false; }) ||
      VOICE_LANGS.some(function (l) { if (l[0].split("-")[0] === nav.split("-")[0].toLowerCase()) { pick = l[0]; return true; } return false; });
    langSel.value = pick;
    show(voiceRow, true); show(micBtn, true);
    var rec = null;
    micBtn.addEventListener("click", function () {
      if (rec) { try { rec.stop(); } catch (e) {} return; }
      rec = new Rec(); rec.lang = langSel.value; rec.interimResults = false; rec.maxAlternatives = 1;
      micBtn.classList.add("is-on"); micBtn.setAttribute("aria-pressed", "true"); say("Listening… say one word.");
      rec.onresult = function (ev) {
        var t = String(ev.results[0][0].transcript || "").trim().replace(/[.,!?;:。]+$/, "");
        if (/\s/.test(t)) { input.value = t; say("We heard more than one word. Say just one word, or edit the box.", "error"); return; }
        input.value = t; byVoice = true; check(t);
      };
      rec.onerror = function (ev) { say(ev.error === "not-allowed" ? "Microphone access was blocked. You can still type the word." : "We did not catch that. Try again or type the word.", "error"); };
      rec.onend = function () { rec = null; micBtn.classList.remove("is-on"); micBtn.setAttribute("aria-pressed", "false"); if (status.textContent.indexOf("Listening") === 0) say(""); };
      try { rec.start(); } catch (e) { rec = null; }
    });
  }

  /* ---------- the offer ---------- */
  offerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("sc-name").value.trim(), email = $("sc-email").value.trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { offerMsg.textContent = ERR.name_email; return; }
    var s = state(), btn = $("sc-offer-btn");
    btn.disabled = true; offerMsg.textContent = "One moment…";
    post("/lead", { name: name, email: email, tokens: s.tokens || [] }).then(function (data) {
      btn.disabled = false;
      if (!data || !data.ok) { offerMsg.textContent = ERR[data && data.error] || ERR.server; return; }
      s = state(); s.lead = { name: name, email: email }; s.day = today(); s.used = FREE; s.tokens = []; s.dismissed = 0; save(s);
      offerMsg.textContent = "";
      justJoined = true;
      paint();
      say((data.returning ? "Welcome back, " : "Thanks, ") + firstName(name) + ". You have " + MORE + " more checks today.", "ok");
      input.focus();
    }).catch(function () { btn.disabled = false; offerMsg.textContent = ERR.server; });
  });
  $("sc-dismiss").addEventListener("click", function () { var s = state(); s.dismissed = Date.now(); save(s); paint(); });
  $("sc-reopen").addEventListener("click", function () { var s = state(); s.dismissed = 0; save(s); paint(); $("sc-name").focus(); });

  paint();
})();
