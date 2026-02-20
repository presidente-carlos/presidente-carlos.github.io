/*************************************************************************
 * custom.js — modernized
 *************************************************************************/

(function () {
  "use strict";

  let widgets = null;

  const createShareButtonAndDialog = () => {
    const $shareUrlCopyPrompt = $("#share-url-copy-prompt");
    const $shareDialogSel = $("#share-dialog");

    if (!$shareDialogSel.length) return;

    // Create the share dialog via widgets (guard if widgets not ready)
    const $shareDialog = widgets.createCustomDialog({
      selector: "#share-dialog",
      full_width_button: true,
      action_text: "Copy to clipboard",
      close_dialog_on_action: false,
      show_cancel_btn: false,
      action_callback: () => {
        // widget helper expected to copy text from an element with id "share-url"
        widgets.copyText("share-url");
        $shareUrlCopyPrompt.show();
        // For accessibility, set focus back to the copy button or inform user
        $shareDialog.find(".ui-dialog-buttonpane .ui-button").first().focus();
      }
    });

    // Hide prompt when dialog closes
    $shareDialog.on("dialogclose", () => {
      $shareUrlCopyPrompt.hide();
    });

    // Set events for the share url textbox (select on focus/click)
    const $shareUrl = $("#share-url");
    $shareUrl.on("focus click", function () {
      $(this).select();
    }).on("mouseup", (e) => {
      // Prevent deselection on mouseup (classic workaround)
      e.preventDefault();
    });

    // Wire up the share button (if present)
    $("#share-btn").on("click", () => {
      $shareDialog.dialog("open");
    });
  };

  const createGalleryIfNeeded = () => {
    const $gallery = $(".gallery");
    if (!$gallery.length) return;

    // If you want lazy loading later, add loading="lazy" attributes
    for (let i = 0; i < 8; i++) {
      const item = $(`
        <a href="javascript:void(0)" class="flex-column" role="button" aria-label="Gallery image ${i + 1}">
          <img src="img/dummay-img.png" alt="Image caption ${i + 1}">
          <div>Image Caption</div>
        </a>
      `);
      $gallery.append(item);
    }
  };

  const initDialogs = () => {
    // Only create dialogs if the selectors exist on the page
    if ($("#dialog-1").length) {
      const $dialog1 = widgets.createCustomDialog({
        selector: "#dialog-1",
        full_width_button: true
      });
      $("#dialog-btn-1").on("click", () => $dialog1.dialog("open"));
    }

    if ($("#dialog-2").length) {
      const $dialog2 = widgets.createCustomDialog({
        selector: "#dialog-2",
        action_callback: () => console.log("confirm"),
        cancel_callback: () => console.log("cancel")
      });
      $("#dialog-btn-2").on("click", () => $dialog2.dialog("open"));
    }

    if ($("#dialog-3").length) {
      const $dialog3 = widgets.createCustomDialog({
        selector: "#dialog-3",
        parent: $(".content"),
        show_cancel_btn: false,
        cancel_callback: () => console.log("cancel")
      });
      $("#dialog-btn-3").on("click", () => $dialog3.dialog("open"));
    }

    if ($("#dialog-4").length) {
      const $dialog4 = widgets.createCustomDialog({
        selector: "#dialog-4",
        action_text: "Action",
        reverse_button_positions: true,
        full_width_button: true,
        action_callback: () => console.log("action"),
        cancel_text: "Back",
        cancel_callback: () => console.log("back")
      });
      $("#dialog-btn-4").on("click", () => $dialog4.dialog("open"));
    }
  };

  const initDropdownsAndRadios = () => {
    // init widgets object dropdowns if present
    const $dd1 = $("#custom-dropdown");
    if ($dd1.length) {
      widgets.setCustomDropdown($dd1, {
        items: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
        init_text: "Dropdown Menu (With JavaScript)",
        on_item_click_callback: ($ui) => console.log($ui.text())
      });
    }

    const $ddLarge = $("#custom-dropdown-large");
    if ($ddLarge.length) {
      widgets.setCustomDropdown($ddLarge, {
        items: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
        init_text: "Large Dropdown Menu (With JavaScript)",
        on_item_click_callback: ($ui) => console.log($ui.text())
      });
    }

    // custom radio change handler (if radios exist)
    $("input:radio[name='playback-speed']").on("change", function () {
      console.log($(this).val());
    });
  };

  const initMisc = () => {
    // custom tabs
    if ($("#custom-tab").length) {
      widgets.createCustomTab({ selector: "#custom-tab" });
    }

    // custom legend
    if ($("#custom-legend").length) {
      widgets.setCustomLegend($("#custom-legend"));
    }
  };

  const init = () => {
    // Create the widget object (guard in case edaplotjs is not present)
    if (!window.edaplotjs || !window.edaplotjs.Widgets) {
      // If widgets library missing, avoid JS errors and fail gracefully
      // Optionally log in dev only
      if (window.console) console.warn("edaplotjs.Widgets not found — widgets disabled.");
      return;
    }
    widgets = new window.edaplotjs.Widgets();

    initDropdownsAndRadios();
    initDialogs();
    createShareButtonAndDialog();
    createGalleryIfNeeded();
    initMisc();
  };

  // Run on DOM ready
  $(init);
})();