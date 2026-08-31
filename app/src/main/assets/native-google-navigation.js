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
  const destinationFromDataset = element => {
    const parts = String(element?.dataset?.nav || "").split(",").map(Number);
    return parts.length === 2 && parts.every(Number.isFinite)
      ? { latitude: parts[0], longitude: parts[1] }
      : null;
  };
  const currentTitle = anchor => anchor.closest(".detail")?.querySelector("h2")?.textContent?.trim()
    || document.querySelector("#detail-title h2")?.textContent?.trim()
    || "On This Site destination";
  const currentSlug = () => {
    try { return new URL(location.href).searchParams.get("site") || ""; } catch { return ""; }
  };
  const startNavigation = (title, slug, destination) => {
    if (!destination) return false;
    try {
      return bridge.startInAppGoogleNavigation(
        token,
        title || "Custom destination",
        slug || "",
        destination.latitude,
        destination.longitude
      ) === true;
    } catch {
      return false;
    }
  };
  const decorateDirections = root => {
    if (!available()) return;
    (root || document).querySelectorAll?.("a.action[href*='google.com/maps/dir/']").forEach(anchor => {
      if (anchor.dataset.nliGoogleNavigation === "1") return;
      const destination = destinationFromHref(anchor.href);
      if (!destination) return;
      anchor.dataset.nliGoogleNavigation = "1";
      anchor.textContent = "Navigate";
      anchor.removeAttribute("target");
      anchor.addEventListener("click", event => {
        if (startNavigation(currentTitle(anchor), currentSlug(), destination)) event.preventDefault();
      });
    });
  };
  const addTopListingNavigation = () => {
    if (!available()) return;
    const detailTitle = document.querySelector("#detail-title");
    const source = document.querySelector("#detail-body > .actions a.action[href*='google.com/maps/dir/']");
    if (!detailTitle || !source || detailTitle.querySelector("[data-nli-navigation-placement='top']")) return;
    const topAction = document.createElement("a");
    topAction.className = "action nli-listing-top-navigation";
    topAction.href = source.href;
    topAction.rel = "noreferrer";
    topAction.dataset.nliNavigationPlacement = "top";
    topAction.setAttribute("aria-label", `Navigate to ${currentTitle(source)}`);
    topAction.textContent = "Navigate";
    detailTitle.appendChild(topAction);
    decorateDirections(detailTitle);
  };
  const decorateCustomDestinations = root => {
    if (!available()) return;
    (root || document).querySelectorAll?.("[data-result-slug='address-result'][data-nav]").forEach(card => {
      if (card.dataset.nliCustomNavigation === "1") return;
      const destination = destinationFromDataset(card);
      const actions = card.querySelector(".learning-card-actions");
      if (!destination || !actions) return;
      card.dataset.nliCustomNavigation = "1";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "primary nli-custom-navigation";
      button.textContent = "Navigate";
      const title = card.querySelector("h2")?.textContent?.trim() || "Custom destination";
      button.setAttribute("aria-label", `Navigate to ${title}`);
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        startNavigation(title, "", destination);
      });
      actions.appendChild(button);
    });
  };
  const installStyles = () => {
    if (document.getElementById("nli-google-navigation-styles")) return;
    const style = document.createElement("style");
    style.id = "nli-google-navigation-styles";
    style.textContent = `
      #detail-title .nli-listing-top-navigation {
        width: fit-content;
        min-height: 38px;
        margin-top: 8px;
        padding: 0 14px;
        touch-action: manipulation;
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);
  };
  const refresh = root => {
    installStyles();
    decorateDirections(root || document);
    decorateCustomDestinations(root || document);
    addTopListingNavigation();
  };
  refresh(document);
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        decorateDirections(node);
        decorateCustomDestinations(node);
      }
    }));
    decorateDirections(document);
    decorateCustomDestinations(document);
    addTopListingNavigation();
  }).observe(document.documentElement, { childList: true, subtree: true });
  return true;
})()
