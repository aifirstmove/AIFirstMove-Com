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
})();
