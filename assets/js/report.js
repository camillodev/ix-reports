/**
 * Impact X — shared report behavior: tabs + back navigation + URL hash.
 */
(function () {
  "use strict";

  function panelId(panel) {
    return (
      panel.getAttribute("data-tab") ||
      panel.getAttribute("data-ix-tab") ||
      panel.id ||
      ""
    );
  }

  function getPanels() {
    return Array.from(
      document.querySelectorAll(".tab-panel, .tab-content, .tc")
    ).filter(function (el) {
      return panelId(el);
    });
  }

  function getButtons() {
    return Array.from(document.querySelectorAll(".tab-btn, button.tb"));
  }

  function activateTab(tabId, opts) {
    opts = opts || {};
    if (!tabId) return;

    var panels = getPanels();
    var found = false;
    panels.forEach(function (p) {
      var match = panelId(p) === tabId;
      if (match) found = true;
      p.classList.toggle("active", match);
      p.setAttribute("aria-hidden", match ? "false" : "true");
    });
    if (!found) return;

    getButtons().forEach(function (b) {
      var bid = b.getAttribute("data-tab") || b.getAttribute("data-ix-tab");
      var isActive = bid === tabId;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (opts.updateHash !== false && history.replaceState) {
      var base = location.pathname + location.search;
      history.replaceState(null, "", base + "#" + encodeURIComponent(tabId));
    }
  }

  function readInitialTab() {
    var hash = (location.hash || "").replace(/^#/, "");
    if (hash) {
      try {
        hash = decodeURIComponent(hash);
      } catch (e) {
        /* keep raw */
      }
    }
    if (hash && getPanels().some(function (p) { return panelId(p) === hash; })) {
      return hash;
    }
    var firstBtn = getButtons().find(function (b) {
      return b.classList.contains("active");
    });
    if (firstBtn) {
      return firstBtn.getAttribute("data-tab") || firstBtn.getAttribute("data-ix-tab");
    }
    var firstPanel = getPanels().find(function (p) {
      return p.classList.contains("active");
    });
    if (firstPanel) return panelId(firstPanel);
    var p0 = getPanels()[0];
    return p0 ? panelId(p0) : "";
  }

  function wireTabs() {
    getButtons().forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-tab") || btn.getAttribute("data-ix-tab");
        if (id) activateTab(id, { updateHash: true });
      });
    });

    var initial = readInitialTab();
    if (initial) activateTab(initial, { updateHash: false });

    window.addEventListener("hashchange", function () {
      var h = (location.hash || "").replace(/^#/, "");
      try {
        h = decodeURIComponent(h);
      } catch (e) {}
      if (h && getPanels().some(function (p) { return panelId(p) === h; })) {
        activateTab(h, { updateHash: false });
      }
    });
  }

  function wireBack() {
    document.querySelectorAll(".back-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = "/";
        }
      });
    });
  }

  /**
   * Optional: [data-auto-tabs] on a container — builds tabs from section[id] or child sections.
   */
  function autoTabs() {
    var root = document.querySelector("[data-auto-tabs]");
    if (!root || root.getAttribute("data-auto-tabs-built")) return;

    var sections = root.querySelectorAll("section[id]");
    if (!sections.length) return;

    var nav = document.createElement("nav");
    nav.className = "tab-nav";
    nav.setAttribute("role", "tablist");

    sections.forEach(function (sec, i) {
      var id = sec.id;
      if (!id) return;
      var labelEl = sec.querySelector("h1, h2");
      var label = labelEl ? labelEl.textContent.trim().replace(/\s+/g, " ") : id;
      if (label.length > 42) label = label.slice(0, 40) + "…";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab-btn" + (i === 0 ? " active" : "");
      btn.setAttribute("data-tab", id);
      btn.setAttribute("role", "tab");
      btn.textContent = label;
      nav.appendChild(btn);

      sec.classList.add("tab-panel");
      sec.setAttribute("data-tab", id);
      sec.classList.toggle("active", i === 0);
      sec.setAttribute("aria-hidden", i === 0 ? "false" : "true");
    });

    root.insertBefore(nav, root.firstChild);
    root.setAttribute("data-auto-tabs-built", "1");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    autoTabs();
    if (getPanels().length && getButtons().length) {
      wireTabs();
    }
    wireBack();
  }
})();
