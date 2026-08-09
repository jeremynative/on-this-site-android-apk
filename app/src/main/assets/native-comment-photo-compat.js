(function () {
  if (window.__otsNativeCommentPhotoCompatibilityInstalled) return true;
  window.__otsNativeCommentPhotoCompatibilityInstalled = true;

  let activeDiscussion = null;

  function setStatus(section, message, tone) {
    const status = section && section.querySelector("[data-comment-photo-status]");
    if (!status) return;
    status.textContent = message || "";
    status.hidden = !message;
    status.dataset.tone = tone || "";
  }

  window.__otsReceiveNativeCommentPhoto = function (ok, message, base64, mimeType, filename) {
    const section = activeDiscussion || document.querySelector(".discussion-section");
    activeDiscussion = null;
    if (!section) return false;
    if (!ok) {
      setStatus(section, message || "Photo was cancelled.", "error");
      return true;
    }
    const input = section.querySelector("[data-discussion-image]");
    if (!input || !base64 || typeof DataTransfer !== "function" || typeof File !== "function") return false;
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      const file = new File(
        [bytes],
        filename || `comment-photo-${Date.now()}.jpg`,
        { type: mimeType || "image/jpeg" }
      );
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      setStatus(section, "Preparing captured photo...");
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (error) {
      setStatus(section, "Could not prepare that captured photo.", "error");
      return false;
    }
  };

  document.addEventListener("click", function (event) {
    const target = event.target && event.target.closest ? event.target : null;
    const takeButton = target && target.closest("[data-take-comment-photo]");
    const chooseButton = target && target.closest("[data-choose-comment-photo]");
    if (!takeButton && !chooseButton) return;
    const bridge = window.AndroidApp;
    const hasAction = takeButton
      ? bridge && typeof bridge.takeCommentPhoto === "function"
      : bridge && typeof bridge.chooseCommentPhoto === "function";
    if (!hasAction) return;

    activeDiscussion = target.closest(".discussion-section") || document.querySelector(".discussion-section");
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus(activeDiscussion, takeButton ? "Opening camera..." : "Opening photo library...");
    if (takeButton) bridge.takeCommentPhoto();
    else bridge.chooseCommentPhoto();
  }, true);

  return true;
})();
