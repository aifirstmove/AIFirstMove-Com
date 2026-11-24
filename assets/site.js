/* aifirstmove.com shared script.
   Email links: a plain mailto link only works when the visitor's device has an email
   program set up. Clicking an email link here opens a small menu instead, so people
   who use webmail (Gmail, Outlook.com, Yahoo) can open a new message there, use their
   own email app, or copy the address. Without JavaScript the links stay ordinary
   mailto links.
   The script also writes the shared header menu and footer (see below). */
(function () {
  "use strict";

  /* Shared header and footer. The header links and the whole footer are written here, in
     one place, and placed on every page when it loads. To change a header link, the
     company details, a footer link or a social link, change it here and nowhere else.
     Each page still carries a plain header and footer in its own HTML, which is what a
     visitor sees if JavaScript is off.
     An entry with "items" is a drop-down: on a wide screen its links open under its name;
     on a phone the whole menu opens from the Menu button and the links are listed under
     the name. To add a page, add one line to NAV or to a drop-down's items. */
  var NAV = [
    { name: "Home", path: "" },
    { name: "Blog", path: "blog/" },
    { name: "Guides", items: [
      { name: "Glossary", path: "glossary/" },
      { name: "Spell Check", path: "spell-check/" },
      { name: "Wallet Passes", path: "wallet-passes/" },
      { name: "AI Video", path: "ai-video/" }
    ] }
  ];
  var FOOT_LINKS = [
    { name: "About Us", path: "about/" },
    { name: "Contact Us", path: "contact/" },
    { name: "Privacy Policy", path: "privacy/" },
    { name: "Terms of Service", path: "terms/" }
  ];
  var SOCIAL = [
    { name: "Facebook", href: "https://www.facebook.com/aifirstmove", mark: "f" },
    { name: "Instagram", href: "https://www.instagram.com/ai_first_move/", mark: "camera" },
    { name: "X", href: "https://x.com/aifirstmove", mark: "X" },
    { name: "Pinterest", href: "https://www.pinterest.com/aifirstmove", mark: "P" }
  ];
  var CAMERA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M8 6l1.5-2.5h5L16 6"/><circle cx="12" cy="13" r="3.5"/></svg>';

  /* The site root, worked out from this script's own address, so links are right at any depth. */
  var self = document.currentScript || document.querySelector('script[src*="assets/site.js"]');
  var root = self ? (self.getAttribute("src") || "").replace(/assets\/site\.js.*$/, "") : "";
  function to(path) { return (root + path) || "./"; }
  function pathOf(href) { var a = document.createElement("a"); a.href = href; return a.pathname.replace(/index\.html$/, ""); }
  var here = location.pathname.replace(/index\.html$/, "");

  var BARS = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" ' +
    'stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var CARET = '<svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 4l4 4 4-4"/></svg>';

  function navLink(entry) {
    var a = document.createElement("a");
    a.href = to(entry.path);
    a.textContent = entry.name;
    var target = pathOf(a.href);
    if (entry.path === "" ? here === target : here.indexOf(target) === 0) a.setAttribute("aria-current", "page");
    return a;
  }

  var page = document.documentElement;
  var nav = document.querySelector(".site-header .nav");
  var toggle = null;
  var groups = [];
  var phone = window.matchMedia ? window.matchMedia("(max-width: 760px)") : null;

  function closeGroups(except) {
    for (var g = 0; g < groups.length; g++) {
      if (groups[g] === except) continue;
      groups[g].box.classList.remove("is-open");
      if (!(phone && phone.matches)) groups[g].btn.setAttribute("aria-expanded", "false");
    }
  }
  function setNav(open) {
    page.classList.toggle("nav-open", open);
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  /* On a phone a drop-down's links are always listed, so its name is a label, not a button. */
  function fitGroups() {
    var small = !!(phone && phone.matches);
    for (var g = 0; g < groups.length; g++) {
      groups[g].box.classList.remove("is-open");
      groups[g].btn.setAttribute("aria-expanded", small ? "true" : "false");
      if (small) groups[g].btn.setAttribute("tabindex", "-1"); else groups[g].btn.removeAttribute("tabindex");
    }
    if (!small) setNav(false);
  }

  if (nav) {
    nav.textContent = "";
    nav.id = nav.id || "site-nav";
    for (var n = 0; n < NAV.length; n++) {
      if (!NAV[n].items) { nav.appendChild(navLink(NAV[n])); continue; }
      var box = document.createElement("div");
      box.className = "nav-group";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-group-btn";
      btn.innerHTML = "<span></span>" + CARET;
      btn.firstChild.textContent = NAV[n].name;
      var sub = document.createElement("div");
      sub.className = "nav-sub";
      sub.id = "site-nav-" + n;
      btn.setAttribute("aria-controls", sub.id);
      for (var k = 0; k < NAV[n].items.length; k++) {
        var subLink = navLink(NAV[n].items[k]);
        if (subLink.getAttribute("aria-current")) btn.classList.add("is-current");
        sub.appendChild(subLink);
      }
      box.appendChild(btn);
      box.appendChild(sub);
      nav.appendChild(box);
      groups.push({ box: box, btn: btn });
    }
    for (var b = 0; b < groups.length; b++) {
      (function (group) {
        group.btn.addEventListener("click", function () {
          if (phone && phone.matches) return;
          var open = !group.box.classList.contains("is-open");
          closeGroups(group);
          group.box.classList.toggle("is-open", open);
          group.btn.setAttribute("aria-expanded", open ? "true" : "false");
        });
      })(groups[b]);
    }

    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.innerHTML = BARS + "<span>Menu</span>";
    toggle.setAttribute("aria-controls", nav.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", function () { setNav(!page.classList.contains("nav-open")); });
    nav.parentNode.insertBefore(toggle, nav);

    page.classList.add("has-menu");
    fitGroups();
    if (phone) {
      if (phone.addEventListener) phone.addEventListener("change", fitGroups);
      else if (phone.addListener) phone.addListener(fitGroups);
    }
    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target)) closeGroups(null);
      if (page.classList.contains("nav-open") && !nav.contains(e.target) && !toggle.contains(e.target)) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      for (var g = 0; g < groups.length; g++) {
        if (groups[g].box.classList.contains("is-open")) { closeGroups(null); groups[g].btn.focus(); return; }
      }
      if (page.classList.contains("nav-open")) { setNav(false); toggle.focus(); }
    });
  }

  var foot = document.querySelector(".site-footer .wrap");
  if (foot) {
    var social = "";
    for (var s = 0; s < SOCIAL.length; s++) {
      social += '<li><a href="' + SOCIAL[s].href + '" target="_blank" rel="noopener" title="' + SOCIAL[s].name +
        '" aria-label="AI First Move on ' + SOCIAL[s].name + ' (opens in a new tab)">' +
        (SOCIAL[s].mark === "camera" ? CAMERA : '<span aria-hidden="true">' + SOCIAL[s].mark + "</span>") + "</a></li>";
    }
    var footLinks = "";
    for (var f = 0; f < FOOT_LINKS.length; f++) {
      footLinks += '<li><a href="' + to(FOOT_LINKS[f].path) + '">' + FOOT_LINKS[f].name + "</a></li>";
    }
    foot.innerHTML =
      "<div><strong>AI First Move</strong>" +
      "<address>A DBA of Effinsoftware.com INC<br>2232 Dell Range Blvd, Suite 245-3069<br>Cheyenne, WY 82009<br>" +
      '<a href="mailto:info@aifirstmove.com">info@aifirstmove.com</a></address>' +
      '<ul class="foot-social" aria-label="AI First Move on social media">' + social + "</ul></div>" +
      '<ul class="foot-links">' + footLinks + "</ul>" +
      '<p class="copyright">&copy; ' + new Date().getFullYear() + " Effinsoftware.com INC. All rights reserved.</p>";
  }

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
})();
