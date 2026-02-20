/* Modern Vanilla Widgets - minimal replacement for edaplotjs.Widgets
   Implements:
   - createCustomTab({ selector })
   - setCustomDropdown($uiElement, settings)
   - createCustomDialog(settings)
   - setCustomLegend($uiElement, settings)
   - copyText(element_id)
   Usage: new window.edaplotjs.Widgets() as before.
*/

(function () {
  "use strict";

  class VanillaWidgets {
    constructor() {}

    // helper
    _q(sel, root=document) { return root.querySelector(sel); }
    _qa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }

    // Tabs: expects .custom-tab-menu-item[data-content="name"] and .custom-tab-content[data-content="name"]
    createCustomTab(settings) {
      settings = settings || {};
      const root = (typeof settings.selector === 'string') ? document.querySelector(settings.selector) : settings.selector;
      if (!root) {
        console.error("createCustomTab: selector not found", settings.selector);
        return false;
      }
      const menuItems = this._qa(".custom-tab-menu-item", root);
      const contents = this._qa(".custom-tab-content", root);
      menuItems.forEach(mi => {
        mi.addEventListener("click", () => {
          const key = mi.getAttribute("data-content");
          contents.forEach(c => c.style.display = "none");
          const target = root.querySelector(`.custom-tab-content[data-content="${CSS.escape(key)}"]`);
          if (target) target.style.display = "flex";
          menuItems.forEach(m=>m.classList.remove("active"));
          mi.classList.add("active");
        });
      });
      // trigger initial active
      const initial = root.querySelector(".custom-tab-menu-item.active") || menuItems[0];
      if (initial) initial.click();
    }

    // Simple dropdown: $uiElement can be a selector string or an element
    setCustomDropdown($uiElement, settings) {
      settings = settings || {};
      const el = (typeof $uiElement === 'string') ? document.querySelector($uiElement) : $uiElement;
      if (!el) { console.error("setCustomDropdown: element not found"); return el; }
      const items = settings.items || [];
      const initText = settings.init_text;
      const initIndex = settings.init_index;
      const onItemClick = settings.on_item_click_callback;
      const onItemCreate = settings.on_item_create_callback;

      // Expect structure: <div class="custom-dropdown"><a ...><span></span></a><div></div></div>
      const button = el.querySelector("a");
      const buttonSpan = el.querySelector("a > span");
      const menu = el.querySelector("div");
      menu.innerHTML = "";

      if (typeof initText !== "undefined") {
        buttonSpan.textContent = initText;
      } else if (typeof initIndex !== "undefined" && items[initIndex]) {
        buttonSpan.textContent = items[initIndex];
      }

      // Populate menu
      items.forEach((txt, i) => {
        const a = document.createElement("a");
        a.href = "javascript:void(0)";
        a.textContent = txt;
        a.setAttribute("role", "menuitem");
        a.addEventListener("click", (e) => {
          e.preventDefault();
          buttonSpan.textContent = txt;
          if (typeof onItemClick === "function") onItemClick(a, i);
          menu.classList.add("force-hide");
          button.blur();
        });
        a.addEventListener("mouseover", () => { a.classList.add("hover"); });
        a.addEventListener("mouseout", () => { a.classList.remove("hover"); });
        menu.appendChild(a);
        if (typeof onItemCreate === "function") onItemCreate(a, i);
      });

      // Accessibility + show/hide on focus
      button.addEventListener("focus", () => menu.classList.remove("force-hide"));
      button.addEventListener("blur", () => {
        // small timeout to allow click handler to run
        setTimeout(()=> menu.classList.add("force-hide"), 150);
      });

      // ensure initial hidden
      menu.classList.add("force-hide");
      return el;
    }

    // Simple accordion (collapsible legend)
    setCustomLegend($uiElement, settings) {
      const el = (typeof $uiElement === 'string') ? document.querySelector($uiElement) : $uiElement;
      if (!el) { console.error("setCustomLegend: element not found"); return el; }
      // convert child headers into toggles
      Array.from(el.querySelectorAll(".legend-title")).forEach(header => {
        header.style.cursor = "pointer";
        const content = header.nextElementSibling;
        if (!content) return;
        // initial
        content.style.display = content.style.display || "block";
        header.addEventListener("click", () => {
          content.style.display = (content.style.display === "none") ? "block" : "none";
        });
      });
      return el;
    }

    // Modal dialog - simplified replacement for jQuery UI dialog
    createCustomDialog(settings) {
      settings = settings || {};
      const selector = settings.selector || null;
      // If selector is a string, use it to find element; otherwise if it's an element use that one
      let dialogEl;
      if (typeof selector === "string") dialogEl = document.querySelector(selector);
      else if (selector instanceof HTMLElement) dialogEl = selector;
      else {
        dialogEl = document.createElement("div");
        document.body.appendChild(dialogEl);
      }
      if (!dialogEl) { console.error("createCustomDialog: selector not found"); return null; }

      // create overlay and wrapper if not already present
      let overlay = document.createElement("div");
      overlay.className = "vd-overlay";
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);display:none;z-index:9998;";
      let wrapper = document.createElement("div");
      wrapper.className = "vd-wrapper";
      wrapper.style.cssText = "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9999;display:none;max-width:90%;";

      // style the dialog element
      dialogEl.classList.add("vd-dialog");
      dialogEl.style.maxWidth = (settings.width || 400) + "px";
      dialogEl.style.boxSizing = "border-box";

      // create footer with buttons
      const footer = document.createElement("div");
      footer.style.marginTop = "1em;display:flex;gap:0.5em;justify-content:flex-end;";

      const hasAction = typeof settings.action_callback === "function";
      const actionText = settings.action_text || "Confirm";
      const hasCancel = (typeof settings.cancel_callback === "function") || true;
      const cancelText = settings.cancel_text || (hasAction ? "Cancel" : "Ok");

      // optionally reverse positions
      const reverse = !!settings.reverse_button_positions;

      const makeBtn = (text, cls, cb) => {
        const b = document.createElement("button");
        b.className = cls;
        b.textContent = text;
        b.addEventListener("click", (e) => {
          e.preventDefault();
          if (cb) cb();
          if (settings.close_dialog_on_action !== false && cls.indexOf("action")>=0) closeDialog();
          if (settings.close_dialog_on_cancel !== false && cls.indexOf("cancel")>=0) closeDialog();
        });
        return b;
      };

      const actionBtn = hasAction ? makeBtn(actionText, "vd-action-button", settings.action_callback) : null;
      const cancelBtn = makeBtn(cancelText, "vd-cancel-button", settings.cancel_callback);

      if (reverse) {
        if (actionBtn) footer.appendChild(actionBtn);
        footer.appendChild(cancelBtn);
      } else {
        footer.appendChild(cancelBtn);
        if (actionBtn) footer.appendChild(actionBtn);
      }

      // build wrapper
      wrapper.appendChild(dialogEl);
      wrapper.appendChild(footer);
      document.body.appendChild(overlay);
      document.body.appendChild(wrapper);

      // functions to open/close
      function openDialog() {
        overlay.style.display = "block";
        wrapper.style.display = "block";
        document.body.style.top = `-${window.scrollY}px`;
        document.body.classList.add("vd-no-scroll");
      }
      function closeDialog() {
        overlay.style.display = "none";
        wrapper.style.display = "none";
        document.body.classList.remove("vd-no-scroll");
        const top = document.body.style.top;
        document.body.style.top = "";
        if (top) window.scrollTo(0, parseInt(top || "0") * -1);
      }

      // return object with open/close compatible interface
      return {
        dialog: () => {},
        open: openDialog,
        close: closeDialog,
        on: (ev, cb) => { /* minimal stub to support dialog("open") events if needed */ }
      };
    }

    // copy text
    copyText(element_id) {
      const el = document.getElementById(element_id);
      if (!el) return;
      const text = el.value || el.textContent || "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          // fallback
          el.select ? el.select() : null;
          document.execCommand("copy");
        });
      } else {
        if (el.select) {
          el.select();
          document.execCommand("copy");
        } else {
          // fallback create temporary textarea
          const t = document.createElement("textarea");
          t.value = text;
          document.body.appendChild(t);
          t.select();
          document.execCommand("copy");
          document.body.removeChild(t);
        }
      }
    }
  }

  // export under same namespace
  if (window.edaplotjs) {
    window.edaplotjs.Widgets = VanillaWidgets;
  } else {
    window.edaplotjs = { Widgets: VanillaWidgets };
  }
})();