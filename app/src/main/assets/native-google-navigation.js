(() => {
  if (window.__nliGoogleNavigationInstalled) return true;
  window.__nliGoogleNavigationInstalled = true;
  const bridge = window.AndroidApp;
  const token = window.__NLI_ANDROID_BRIDGE_TOKEN;
  if (!token || !bridge?.isInAppGoogleNavigationAvailable || !bridge?.startInAppGoogleNavigation) return false;

  const available = () => {
    try { return bridge.isInAppGoogleNavigationAvailable(token) === true; } catch { return false; }
  };
  const destinationFromHref = href => {
    try {
      const value = new URL(href, location.href).searchParams.get("destination") || "";
      const parts = decodeURIComponent(value).split(",").map(Number);
      return parts.length === 2 && parts.every(Number.isFinite)
        ? { latitude: parts[0], longitude: parts[1] }
        : null;
    } catch { return null; }
  };
  const currentTitle = anchor => anchor.closest(".detail")?.querySelector("h2")?.textContent?.trim()
    || document.querySelector("#detail-title h2")?.textContent?.trim()
    || "On This Site destination";
  const currentSlug = () => {
    try { return new URL(location.href).searchParams.get("site") || ""; } catch { return ""; }
  };
  const decorate = root => {
    if (!available()) return;
    (root || document).querySelectorAll?.("a.action[href*='google.com/maps/dir/']").forEach(anchor => {
      if (anchor.dataset.nliGoogleNavigation === "1") return;
      const destination = destinationFromHref(anchor.href);
      if (!destination) return;
      anchor.dataset.nliGoogleNavigation = "1";
      anchor.textContent = "Navigate";
      anchor.removeAttribute("target");
      anchor.addEventListener("click", event => {
        let opened = false;
        try {
          opened = bridge.startInAppGoogleNavigation(
            token,
            currentTitle(anchor),
            currentSlug(),
            destination.latitude,
            destination.longitude
          ) === true;
        } catch {}
        if (opened) event.preventDefault();
      });
    });
  };
  decorate(document);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === 1) decorate(node);
  }))).observe(document.documentElement, { childList: true, subtree: true });
  return true;
})()
