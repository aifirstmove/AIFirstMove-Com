/* aifirstmove.com shared script.
   Email links: a plain mailto link only works when the visitor's device has an email
   program set up. Clicking an email link here opens a small menu instead, so people
   who use webmail (Gmail, Outlook.com, Yahoo) can open a new message there, use their
   own email app, or copy the address. Without JavaScript the links stay ordinary
   mailto links. */
(function () {
  "use strict";
  var menu = null;
  var opener = null;

  function closeMenu() {
    if (menu) { menu.remove(); menu = null; }
    if (opener) { opener.setAttribute("aria-expanded", "false"); opener = null; }
  }

  function item(label, href, onClick) {
    var el = document.createElement(href ? "a" : "button");
    el.textContent = label;
    el.setAttribute("role", "menuitem");
    if (href) {
      el.href = href;
      if (href.indexOf("mailto:") !== 0) { el.target = "_blank"; el.rel = "noopener"; }
    } else {
      el.type = "button";
    }
    el.style.cssText = "display:block;width:100%;text-align:left;padding:10px 14px;border:0;background:none;" +
      "font:inherit;font-size:.95rem;color:var(--navy,#0B2243);text-decoration:none;cursor:pointer;border-radius:8px;";
    el.addEventListener("mouseenter", function () { el.style.background = "var(--gold-tint,#FBF5EC)"; });
    el.addEventListener("mouseleave", function () { el.style.background = "none"; });
    el.addEventListener("click", function (e) {
      if (onClick) { e.preventDefault(); onClick(el); } else { setTimeout(closeMenu, 0); }
    });
    return el;
  }

  function copy(address, el) {
    function done() { el.textContent = "Copied"; setTimeout(closeMenu, 900); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(done, function () { window.prompt("Copy this address:", address); closeMenu(); });
    } else {
      window.prompt("Copy this address:", address);
      closeMenu();
    }
  }

  function openMenu(link) {
    closeMenu();
    var address = decodeURIComponent(link.getAttribute("href").replace(/^mailto:/i, "").split("?")[0]);
    var to = encodeURIComponent(address);
    menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Email " + address);
    menu.style.cssText = "position:absolute;z-index:50;min-width:230px;padding:6px;background:var(--white,#fff);" +
      "border:1px solid var(--line,#E4E8EF);border-radius:12px;box-shadow:0 18px 40px -18px rgba(11,34,67,.45);";
    menu.appendChild(item("Open in Gmail", "https://mail.google.com/mail/?view=cm&fs=1&to=" + to));
    menu.appendChild(item("Open in Outlook.com", "https://outlook.live.com/mail/0/deeplink/compose?to=" + to));
    menu.appendChild(item("Open in Yahoo Mail", "https://compose.mail.yahoo.com/?to=" + to));
    menu.appendChild(item("Use my email app", "mailto:" + address));
    menu.appendChild(item("Copy address", null, function (el) { copy(address, el); }));
    document.body.appendChild(menu);

    var r = link.getBoundingClientRect();
    var width = menu.offsetWidth;
    var left = Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - width - 8));
    var top = r.bottom + window.scrollY + 6;
    if (r.bottom + menu.offsetHeight + 12 > window.innerHeight && r.top > menu.offsetHeight + 12) {
      top = r.top + window.scrollY - menu.offsetHeight - 6;
    }
    menu.style.left = left + "px";
    menu.style.top = top + "px";
    opener = link;
    link.setAttribute("aria-expanded", "true");
    var first = menu.querySelector("a,button");
    if (first) first.focus();
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="mailto:"]') : null;
    if (link && !(menu && menu.contains(link))) {
      e.preventDefault();
      if (opener === link) { closeMenu(); } else { openMenu(link); }
      return;
    }
    if (menu && !menu.contains(e.target)) closeMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu) { var back = opener; closeMenu(); if (back) back.focus(); }
  });

  var links = document.querySelectorAll('a[href^="mailto:"]');
  for (var i = 0; i < links.length; i++) {
    links[i].setAttribute("aria-haspopup", "menu");
    links[i].setAttribute("aria-expanded", "false");
  }

  /* Glossary links: <a class="term" href=".../glossary/#term-id"> shows that term's short
     definition on hover or keyboard focus; a click goes to the Glossary page. The text is
     read from the Glossary page itself, so each definition is written in one place.
     Without JavaScript, and on touch screens, the link simply opens the Glossary. */
  var tip = null;
  var tipFor = null;
  var defs = null;
  var loading = null;

  function loadDefs(url) {
    if (defs) return Promise.resolve(defs);
    if (!loading) {
      loading = fetch(url).then(function (r) { return r.ok ? r.text() : ""; }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var entries = doc.querySelectorAll(".term-entry[id]");
        var out = {};
        for (var j = 0; j < entries.length; j++) {
          var name = entries[j].querySelector("dt");
          var text = entries[j].querySelector(".term-def");
          if (name && text) out[entries[j].id] = { name: name.textContent, text: text.textContent };
        }
        defs = out;
        return out;
      }).catch(function () { defs = {}; return defs; });
    }
    return loading;
  }

  function hideTip() {
    if (tip) { tip.remove(); tip = null; }
    if (tipFor) { tipFor.removeAttribute("aria-describedby"); tipFor = null; }
  }

  function showTip(link) {
    var href = link.getAttribute("href") || "";
    var hash = href.indexOf("#");
    if (hash < 0 || tipFor === link) return;
    hideTip();
    tipFor = link;
    loadDefs(href.slice(0, hash)).then(function (d) {
      var entry = d[href.slice(hash + 1)];
      if (tipFor !== link || !entry) return;
      tip = document.createElement("div");
      tip.className = "term-tip";
      tip.id = "term-tip";
      tip.setAttribute("role", "tooltip");
      var name = document.createElement("strong");
      name.textContent = entry.name;
      var more = document.createElement("span");
      more.textContent = "Click for the full entry";
      tip.appendChild(name);
      tip.appendChild(document.createTextNode(entry.text));
      tip.appendChild(more);
      document.body.appendChild(tip);
      link.setAttribute("aria-describedby", "term-tip");
      var r = link.getBoundingClientRect();
      var left = Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - tip.offsetWidth - 8));
      var top = r.bottom + window.scrollY + 8;
      if (r.bottom + tip.offsetHeight + 12 > window.innerHeight && r.top > tip.offsetHeight + 12) {
        top = r.top + window.scrollY - tip.offsetHeight - 8;
      }
      tip.style.left = left + "px";
      tip.style.top = top + "px";
    });
  }

  function termLink(target) { return target && target.closest ? target.closest("a.term") : null; }

  if (window.fetch && window.DOMParser) {
    document.addEventListener("mouseover", function (e) { var l = termLink(e.target); if (l) showTip(l); });
    document.addEventListener("mouseout", function (e) { if (termLink(e.target)) hideTip(); });
    document.addEventListener("focusin", function (e) { var l = termLink(e.target); if (l) showTip(l); });
    document.addEventListener("focusout", function (e) { if (termLink(e.target)) hideTip(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); });
  }

  /* Footer social links: one list, written here, added under the company address in the
     footer of every page. The addresses live in this one place. A page that already
     carries a .foot-social list in its own HTML is left alone. */
  var SOCIAL = [
    { name: "Facebook", href: "https://www.facebook.com/aifirstmove", mark: "f" },
    { name: "Instagram", href: "https://www.instagram.com/ai_first_move/", mark: "camera" },
    { name: "X", href: "https://x.com/aifirstmove", mark: "X" },
    { name: "Pinterest", href: "https://www.pinterest.com/aifirstmove", mark: "P" }
  ];
  var CAMERA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M8 6l1.5-2.5h5L16 6"/><circle cx="12" cy="13" r="3.5"/></svg>';

  var footAddress = document.querySelector(".site-footer address");
  if (footAddress && !document.querySelector(".site-footer .foot-social")) {
    var list = document.createElement("ul");
    list.className = "foot-social";
    list.setAttribute("aria-label", "AI First Move on social media");
    for (var s = 0; s < SOCIAL.length; s++) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = SOCIAL[s].href;
      a.target = "_blank";
      a.rel = "noopener";
      a.title = SOCIAL[s].name;
      a.setAttribute("aria-label", "AI First Move on " + SOCIAL[s].name + " (opens in a new tab)");
      if (SOCIAL[s].mark === "camera") {
        a.innerHTML = CAMERA;
      } else {
        var mark = document.createElement("span");
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = SOCIAL[s].mark;
        a.appendChild(mark);
      }
      li.appendChild(a);
      list.appendChild(li);
    }
    footAddress.insertAdjacentElement("afterend", list);
  }
})();
