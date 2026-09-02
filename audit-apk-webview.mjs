const targets = await fetch("http://127.0.0.1:9222/json").then(response => response.json());
const target = targets.find(item => item.type === "page" && item.webSocketDebuggerUrl);
if (!target) throw new Error("No debuggable APK WebView was found on forwarded port 9222.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let messageId = 0;

socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  if (message.error) waiter.reject(new Error(message.error.message));
  else waiter.resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function send(method, params = {}) {
  const id = ++messageId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || "WebView evaluation failed.");
  }
  return response.result?.value;
}

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const readiness = await evaluate(`new Promise(resolve => {
  const startedAt = Date.now();
  const check = () => {
    const loading = document.querySelector("#loading-screen");
    const loadingStyle = loading ? getComputedStyle(loading) : null;
    const loadingRect = loading?.getBoundingClientRect();
    const loadingVisible = Boolean(
      loading
      && loadingStyle
      && loadingStyle.display !== "none"
      && loadingStyle.visibility !== "hidden"
      && Number(loadingStyle.opacity || 1) > 0.01
      && loadingRect
      && loadingRect.width > 0
      && loadingRect.height > 0
    );
    const mapReady = Boolean(
      document.querySelector("#map .mapboxgl-canvas, #map .maplibregl-canvas")
      || (document.documentElement.classList.contains("nli-native-map") && document.querySelector("#map"))
    );
    if (!loadingVisible && mapReady) {
      resolve({ ready: true, elapsedMs: Date.now() - startedAt });
      return;
    }
    if (Date.now() - startedAt >= 45000) {
      resolve({ ready: false, elapsedMs: Date.now() - startedAt, loadingVisible, mapReady });
      return;
    }
    setTimeout(check, 200);
  };
  check();
})`);
if (!readiness.ready) {
  throw new Error(`APK WebView did not become interactive: ${JSON.stringify(readiness)}`);
}

const startupPanel = await evaluate(`(() => {
  const app = document.querySelector(".app");
  const timeline = document.querySelector(".mobile-timeline");
  const nearby = document.querySelector(".list-panel");
  const box = element => {
    const rect = element?.getBoundingClientRect();
    const style = element ? getComputedStyle(element) : null;
    return {
      width: Math.round(rect?.width || 0),
      height: Math.round(rect?.height || 0),
      visibility: style?.visibility || "",
      pointerEvents: style?.pointerEvents || ""
    };
  };
  return {
    native: document.body.classList.contains("native-android-app"),
    timelineMode: Boolean(app?.classList.contains("panel-timeline")),
    collapsed: Boolean(app?.classList.contains("panel-collapsed")),
    timeline: box(timeline),
    nearby: box(nearby)
  };
})()`);

const safeArea = await evaluate(`(() => {
  const bridgeValue = name => {
    try {
      return Math.max(0, Number(window.AndroidApp?.[name]?.()) || 0);
    } catch {
      return 0;
    }
  };
  const cssValue = name => {
    if (typeof cssPixelValue === "function") return cssPixelValue(name, 0);
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    const values = String(raw || "").match(/-?\\d+(?:\\.\\d+)?px/g) || [];
    return Math.max(0, ...values.map(value => Number.parseFloat(value)).filter(Number.isFinite));
  };
  const native = {
    top: bridgeValue("getSafeInsetTop"),
    right: bridgeValue("getSafeInsetRight"),
    bottom: bridgeValue("getSafeInsetBottom"),
    left: bridgeValue("getSafeInsetLeft")
  };
  const app = {
    top: cssValue("--app-top-safe"),
    right: cssValue("--app-right-safe"),
    bottom: cssValue("--app-bottom-safe"),
    left: cssValue("--app-left-safe")
  };
  return {
    native,
    app,
    viewport: [innerWidth, innerHeight],
    rect: {
      left: app.left,
      top: app.top,
      right: innerWidth - app.right,
      bottom: innerHeight - app.bottom
    },
    propagated: ["top", "right", "bottom", "left"].every(side => app[side] + 0.5 >= native[side])
  };
})()`);

// Startup promos resolve 1.6 seconds after the app becomes idle. Inspect the
// card and dismiss it before auditing controls that are intentionally covered
// by the card while it is open.
await wait(1900);
const startupSpotlight = await evaluate(`(() => {
  const safe = ${JSON.stringify(safeArea.rect)};
  const card = document.querySelector("#mobile-startup-spotlight");
  const cardRect = card?.getBoundingClientRect();
  const cardStyle = card ? getComputedStyle(card) : null;
  const visible = Boolean(
    card
    && !card.hidden
    && cardRect
    && cardRect.width > 0
    && cardRect.height > 0
    && cardStyle
    && cardStyle.display !== "none"
    && cardStyle.visibility !== "hidden"
  );
  const close = document.querySelector("#mobile-startup-spotlight-close");
  const closeRect = close?.getBoundingClientRect();
  const locate = document.querySelector("#mobile-map-locate");
  const locateRect = locate?.getBoundingClientRect();
  const locateStyle = locate ? getComputedStyle(locate) : null;
  const result = {
    visible,
    bounds: cardRect
      ? [Math.round(cardRect.left), Math.round(cardRect.top), Math.round(cardRect.right), Math.round(cardRect.bottom)]
      : null,
    cardSafe: !visible || Boolean(
      cardRect
      && cardRect.left >= safe.left - 1
      && cardRect.top >= safe.top - 1
      && cardRect.right <= safe.right + 1
      && cardRect.bottom <= safe.bottom + 1
    ),
    closeSafe: !visible || Boolean(
      closeRect
      && closeRect.width >= 40
      && closeRect.height >= 40
      && closeRect.left >= safe.left - 1
      && closeRect.top >= safe.top - 1
      && closeRect.right <= safe.right + 1
      && closeRect.bottom <= safe.bottom + 1
    ),
    locateVisible: Boolean(
      visible
      && locate
      && !locate.hidden
      && locateRect
      && locateRect.width > 0
      && locateRect.height > 0
      && locateStyle
      && locateStyle.display !== "none"
      && locateStyle.visibility !== "hidden"
    )
  };
  if (visible) close?.click();
  return result;
})()`);
if (startupSpotlight.visible) await wait(220);

await evaluate(`(() => {
  document.querySelector("#close-detail")?.click();
  document.querySelectorAll(".sheet.open [data-close-sheet]").forEach(button => button.click());
  document.querySelectorAll("details[open]").forEach(details => details.removeAttribute("open"));
  return true;
})()`);
await wait(220);

const controls = await evaluate(`(() => {
  const safe = ${JSON.stringify(safeArea.rect)};
  const selectors = [
    "#login-open",
    "[data-app-page='about']",
    "#feedback-open",
    "#mobile-layer-menu > summary",
    ".mobile-more-menu > summary",
    "#mobile-activity-open",
    "#mobile-notifications-open",
    "#mobile-tab-timeline",
    "#mobile-tab-nearby",
    "#collapse-list",
    "#mobile-panel-size-toggle",
    "#mobile-map-locate"
  ];
  return selectors.map(selector => {
    const element = document.querySelector(selector);
    if (!element) return { selector, missing: true };
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(centerX, centerY);
    return {
      selector,
      text: (element.textContent || element.getAttribute("aria-label") || "").trim().replace(/\\s+/g, " "),
      visible: rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none",
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      centerCss: [Math.round(centerX), Math.round(centerY)],
      centerDevice: [Math.round(centerX * devicePixelRatio), Math.round(centerY * devicePixelRatio)],
      hit: hit ? (hit.id ? "#" + hit.id : hit.tagName.toLowerCase()) : null,
      hitOk: Boolean(hit && (hit === element || element.contains(hit))),
      safeBoundsOk: rect.left >= safe.left - 1
        && rect.top >= safe.top - 1
        && rect.right <= safe.right + 1
        && rect.bottom <= safe.bottom + 1,
    };
  });
})()`);

const panelTests = [
  ["login", "#login-open", "#login-sheet", "#login-sheet [data-close-sheet]"],
  ["feedback", "#feedback-open", "#feedback-sheet", "#feedback-sheet [data-close-sheet]"],
  ["activity", "#mobile-activity-open", "#activity-sheet", "#activity-sheet [data-close-sheet]"],
  ["notifications", "#mobile-notifications-open", "#notifications-sheet", "#notifications-sheet [data-close-sheet]"],
];

const panels = [];
for (const [name, openSelector, panelSelector, closeSelector] of panelTests) {
  const opened = await evaluate(`(() => {
    const button = document.querySelector(${JSON.stringify(openSelector)});
    if (!button) return { missing: true };
    button.click();
    return { missing: false };
  })()`);
  await wait(1100);
  const state = await evaluate(`(() => {
    const safe = ${JSON.stringify(safeArea.rect)};
    const panel = document.querySelector(${JSON.stringify(panelSelector)});
    if (!panel) return { missingPanel: true };
    const rect = panel.getBoundingClientRect();
    const body = panel.querySelector(".sheet-body");
    if (body) body.scrollTop = body.scrollHeight;
    const lastContent = body
      ? [...body.children].reverse().find(element => {
          const bounds = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return bounds.width > 0 && bounds.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        })
      : null;
    const lastContentRect = lastContent?.getBoundingClientRect();
    return {
      missingPanel: false,
      open: panel.classList.contains("open"),
      visible: rect.width > 0 && rect.height > 0 && getComputedStyle(panel).display !== "none",
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      viewport: [innerWidth, innerHeight],
      inBounds: rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1,
      detailPanels: document.querySelectorAll("#detail.open").length,
      openSheets: document.querySelectorAll(".sheet.open").length,
      scrollProbe: body ? {
        reachedBottom: body.scrollHeight - body.scrollTop - body.clientHeight <= 2,
        lastContent: lastContent
          ? (lastContent.textContent || lastContent.getAttribute("aria-label") || lastContent.tagName).trim().replace(/\\s+/g, " ").slice(0, 80)
          : null,
        lastBounds: lastContentRect ? {
          left: Math.round(lastContentRect.left),
          top: Math.round(lastContentRect.top),
          right: Math.round(lastContentRect.right),
          bottom: Math.round(lastContentRect.bottom)
        } : null,
        lastBottomSafe: Boolean(lastContentRect
          && lastContentRect.left >= safe.left - 1
          && lastContentRect.right <= safe.right + 1
          && lastContentRect.bottom <= safe.bottom + 1)
      } : null
    };
  })()`);
  panels.push({ name, ...opened, ...state });
  await evaluate(`document.querySelector(${JSON.stringify(closeSelector)})?.click()`);
  await wait(120);
}

const menus = [];
for (const [name, selector] of [
  ["labels", "#mobile-layer-menu"],
  ["more", ".mobile-more-menu"],
]) {
  const state = await evaluate(`(() => {
    const safe = ${JSON.stringify(safeArea.rect)};
    const menu = document.querySelector(${JSON.stringify(selector)});
    if (!menu) return { missing: true };
    menu.querySelector("summary")?.click();
    const opened = menu.open;
    const panel = menu.querySelector(${JSON.stringify(name === "labels" ? ".mobile-layer-panel" : ".mobile-more-grid")});
    const isMore = ${JSON.stringify(name === "more")};
    const adminMenu = isMore ? panel?.querySelector("#mobile-admin-menu") : null;
    const adminWasHidden = Boolean(adminMenu?.hidden);
    if (adminMenu) {
      adminMenu.hidden = false;
      adminMenu.open = true;
    }
    const adminAvailable = Boolean(adminMenu);
    const adminExpanded = Boolean(adminMenu?.open);
    const panelRect = panel?.getBoundingClientRect();
    const visibleInteractive = () => panel
      ? [...panel.querySelectorAll("button, a[href], input, select, summary, label")].filter(element => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        })
      : [];
    const targetRect = element => (element?.closest("label") || element)?.getBoundingClientRect();
    const initialInteractive = visibleInteractive();
    const initialRects = initialInteractive.map(targetRect).filter(Boolean);
    const initialControlsSafe = Boolean(panelRect
      && initialRects.length
      && initialRects.every(rect => (
        rect.left >= safe.left - 1
        && rect.top >= safe.top - 1
        && rect.right <= safe.right + 1
        && rect.bottom <= safe.bottom + 1
        && rect.left >= panelRect.left - 1
        && rect.top >= panelRect.top - 1
        && rect.right <= panelRect.right + 1
        && rect.bottom <= panelRect.bottom + 1
      )));
    const initialScrollRange = panel ? Math.max(0, panel.scrollHeight - panel.clientHeight) : null;
    const gridColumnCount = panel
      ? getComputedStyle(panel).gridTemplateColumns.split(/\\s+/).filter(Boolean).length
      : 0;
    if (panel) panel.scrollTop = panel.scrollHeight;
    const interactive = visibleInteractive();
    const lastControl = interactive.at(-1);
    const lastControlRect = targetRect(lastControl);
    const floatingControlsHidden = [
      "#mobile-activity-open",
      "#mobile-notifications-open"
    ].every(controlSelector => {
      const control = document.querySelector(controlSelector);
      if (!control) return true;
      const rect = control.getBoundingClientRect();
      const style = getComputedStyle(control);
      return !rect.width
        || !rect.height
        || style.display === "none"
        || style.visibility === "hidden";
    });
    if (adminMenu) {
      adminMenu.open = false;
      adminMenu.hidden = adminWasHidden;
    }
    menu.querySelector("summary")?.click();
    return {
      missing: false,
      opened,
      adminAvailable,
      adminExpanded,
      initialControlsSafe,
      initialScrollRange,
      gridColumnCount,
      floatingControlsHidden,
      panelBounds: panelRect ? {
        left: Math.round(panelRect.left),
        top: Math.round(panelRect.top),
        right: Math.round(panelRect.right),
        bottom: Math.round(panelRect.bottom)
      } : null,
      panelSafeBounds: Boolean(panelRect
        && panelRect.left >= safe.left - 1
        && panelRect.top >= safe.top - 1
        && panelRect.right <= safe.right + 1
        && panelRect.bottom <= safe.bottom + 1),
      lastControl: lastControl
        ? (lastControl.textContent || lastControl.getAttribute("aria-label") || lastControl.getAttribute("name") || lastControl.tagName).trim().replace(/\\s+/g, " ")
        : null,
      lastControlBounds: lastControlRect ? {
        left: Math.round(lastControlRect.left),
        top: Math.round(lastControlRect.top),
        right: Math.round(lastControlRect.right),
        bottom: Math.round(lastControlRect.bottom)
      } : null,
      lastControlSafe: Boolean(lastControlRect
        && lastControlRect.left >= safe.left - 1
        && lastControlRect.top >= safe.top - 1
        && lastControlRect.right <= safe.right + 1
        && lastControlRect.bottom <= safe.bottom + 1),
      closed: !menu.open
    };
  })()`);
  menus.push({ name, ...state });
}

const contentPages = [];
for (const [name, selector, expectedTitle, expectedItems] of [
  ["learn", "#mobile-learn-open", "Learning Paths", "[data-mobile-learning-path-open]"],
  ["blog", "[data-app-page='blog']", "Blog", "[data-blog-index]"],
]) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  await wait(name === "blog" ? 3500 : 2500);
  const state = await evaluate(`(() => {
    const panel = document.querySelector("#detail");
    const rect = panel?.getBoundingClientRect();
    const title = document.querySelector("#detail-title")?.textContent?.trim().replace(/\\s+/g, " ") || "";
    const bodyText = document.querySelector("#detail-body")?.textContent?.trim().replace(/\\s+/g, " ") || "";
    return {
      open: Boolean(panel?.classList.contains("open")),
      visible: Boolean(rect && rect.width > 0 && rect.height > 0),
      title,
      itemCount: document.querySelectorAll(${JSON.stringify(expectedItems)}).length,
      loadFailed: /could not be loaded|not available/i.test(bodyText)
    };
  })()`);
  contentPages.push({ name, ...state, expectedTitle });
  await evaluate(`document.querySelector("#close-detail")?.click()`);
  await wait(120);
}

await evaluate(`document.querySelector("#mobile-tab-timeline")?.click()`);
await wait(350);
const timeline = await evaluate(`(() => {
  const safe = ${JSON.stringify(safeArea.rect)};
  const button = document.querySelector("#mobile-tab-timeline");
  const panel = document.querySelector(".mobile-timeline");
  const feed = document.querySelector("#mobile-timeline-current");
  const panelRect = panel?.getBoundingClientRect();
  const feedRect = feed?.getBoundingClientRect();
  const boundsFor = element => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(
      rect.left + (rect.width / 2),
      rect.top + (rect.height / 2)
    );
    const hitOk = hit === element || element.contains(hit);
    const insideFeed = !feedRect || (
      rect.left >= feedRect.left - 1
      && rect.top >= feedRect.top - 1
      && rect.right <= feedRect.right + 1
      && rect.bottom <= feedRect.bottom + 1
    );
    return {
      id: element.id || element.textContent?.trim() || element.tagName,
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      hitOk,
      insideFeed,
      safe: hitOk
        && insideFeed
        && rect.left >= safe.left - 1
        && rect.top >= safe.top - 1
        && rect.right <= safe.right + 1
        && rect.bottom <= safe.bottom + 1
    };
  };
  const fullyVisibleActionBounds = selector => [...document.querySelectorAll(selector)]
    .filter(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0
        && rect.height > 0
        && style.display !== "none"
        && style.visibility !== "hidden"
        && (!feedRect || (
          rect.left >= feedRect.left - 1
          && rect.top >= feedRect.top - 1
          && rect.right <= feedRect.right + 1
          && rect.bottom <= feedRect.bottom + 1
        ));
    })
    .map(boundsFor);
  const firstCardAction = document.querySelector(".mobile-timeline .learning-card-actions button");
  if (feed && firstCardAction && feedRect) {
    const actionRect = firstCardAction.getBoundingClientRect();
    feed.scrollTop += actionRect.top - feedRect.top - ((feed.clientHeight - actionRect.height) / 2);
  }
  const cardActionBounds = fullyVisibleActionBounds(".mobile-timeline .learning-card-actions button");
  if (feed) feed.scrollTop = feed.scrollHeight;
  const loadMoreBounds = fullyVisibleActionBounds(".mobile-timeline [data-timeline-show-more]");
  const actionBounds = [...cardActionBounds, ...loadMoreBounds];
  const panelStyle = panel ? getComputedStyle(panel) : null;
  const feedStyle = feed ? getComputedStyle(feed) : null;
  const app = document.querySelector(".app");
  const appRect = app?.getBoundingClientRect();
  const appStyle = app ? getComputedStyle(app) : null;
  const cards = [...document.querySelectorAll(".mobile-timeline [data-timeline-id]")];
  const firstCardRect = cards[0]?.getBoundingClientRect();
  const result = {
    buttonMissing: !button,
    visible: panel ? panel.getBoundingClientRect().height > 0 : false,
    role: feed?.getAttribute("role") || "",
    cardCount: cards.length,
    legacyControlsAbsent: !document.querySelector("#mobile-timeline-prev, #mobile-timeline-next, .timeline-step"),
    loadMoreExists: Boolean(document.querySelector("[data-timeline-show-more]")),
    firstCard: firstCardRect ? {
      left: Math.round(firstCardRect.left),
      top: Math.round(firstCardRect.top),
      right: Math.round(firstCardRect.right),
      bottom: Math.round(firstCardRect.bottom)
    } : null,
    panel: panelRect ? {
      bounds: [
        Math.round(panelRect.left),
        Math.round(panelRect.top),
        Math.round(panelRect.right),
        Math.round(panelRect.bottom)
      ],
      clientHeight: panel.clientHeight,
      scrollHeight: panel.scrollHeight,
      scrollTop: panel.scrollTop,
      overflowY: panelStyle?.overflowY || ""
    } : null,
    feed: feedRect ? {
      bounds: [
        Math.round(feedRect.left),
        Math.round(feedRect.top),
        Math.round(feedRect.right),
        Math.round(feedRect.bottom)
      ],
      clientHeight: feed.clientHeight,
      scrollHeight: feed.scrollHeight,
      scrollTop: feed.scrollTop,
      overflowY: feedStyle?.overflowY || "",
      scrollable: feed.scrollHeight > feed.clientHeight + 1,
      reachedBottom: feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 2
    } : null,
    app: appRect ? {
      bounds: [
        Math.round(appRect.left),
        Math.round(appRect.top),
        Math.round(appRect.right),
        Math.round(appRect.bottom)
      ],
      gridTemplateRows: appStyle?.gridTemplateRows || "",
      overflowY: appStyle?.overflowY || ""
    } : null,
    actionBounds,
    controlsSafe: actionBounds.length > 0 && actionBounds.every(item => item.safe)
  };
  document.querySelector("#mobile-tab-nearby")?.click();
  return result;
})()`);

const nearbyHidden = await evaluate(`(() => {
  const safe = ${JSON.stringify(safeArea.rect)};
  document.querySelector("#mobile-tab-nearby")?.click();
  const collapse = document.querySelector("#collapse-list");
  collapse?.click();
  const app = document.querySelector(".app");
  const controls = ["#mobile-tab-timeline", "#mobile-tab-nearby", "#collapse-list", "#mobile-panel-size-toggle"].map(selector => {
    const element = document.querySelector(selector);
    const rect = element?.getBoundingClientRect();
    return {
      selector,
      missing: !element,
      bounds: rect ? [Math.round(rect.left), Math.round(rect.top), Math.round(rect.right), Math.round(rect.bottom)] : null,
      safe: Boolean(rect
        && rect.left >= safe.left - 1
        && rect.top >= safe.top - 1
        && rect.right <= safe.right + 1
        && rect.bottom <= safe.bottom + 1)
    };
  });
  const hidden = Boolean(app?.classList.contains("panel-collapsed"));
  return { hidden, controls, controlsSafe: controls.every(item => !item.missing && item.safe) };
})()`);

const promos = await evaluate(`(() => {
  const card = document.querySelector("#mobile-startup-spotlight");
  const cardVisible = Boolean(card && !card.hidden && card.getBoundingClientRect().height > 0);
  const mapRect = document.querySelector("#map")?.getBoundingClientRect();
  const locate = document.querySelector("#mobile-map-locate");
  const locateRect = locate?.getBoundingClientRect();
  const locateStyle = locate ? getComputedStyle(locate) : null;
  const dock = document.querySelector("#mobile-promo-dock");
  const dockRect = dock?.getBoundingClientRect();
  const locateVisible = Boolean(
    locate
    && !locate.hidden
    && locateRect
    && locateRect.width > 0
    && locateRect.height > 0
    && locateStyle
    && locateStyle.display !== "none"
    && locateStyle.visibility !== "hidden"
  );
  const buttons = [...document.querySelectorAll("[data-mobile-promo-kind]")].map(button => {
    const rect = button.getBoundingClientRect();
    const style = getComputedStyle(button);
    return {
      kind: button.dataset.mobilePromoKind || "",
      hidden: button.hidden,
      visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden",
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      inMapBounds: Boolean(
        mapRect
        && rect.left >= mapRect.left - 1
        && rect.top >= mapRect.top - 1
        && rect.right <= mapRect.right + 1
        && rect.bottom <= mapRect.bottom + 1
      )
    };
  });
  return {
    buttons,
    availableKinds: typeof availableMobilePromoKinds === "function" ? availableMobilePromoKinds() : [],
    cardVisible,
    locateVisible,
    dockBottomGap: mapRect && dockRect ? Math.round(mapRect.bottom - dockRect.bottom) : null,
    dockLeftGap: mapRect && dockRect ? Math.round(dockRect.left - mapRect.left) : null,
    cardLabel: document.querySelector("#mobile-startup-spotlight-label")?.textContent?.trim() || ""
  };
})()`);

const overlapAudit = await evaluate(`(() => {
  const selectors = [
    "#mobile-activity-open",
    "#mobile-notifications-open",
    "#mobile-map-locate",
    ".mobile-promo-dock",
    ".mapboxgl-ctrl-logo",
    ".mobile-view-tabs",
    ".mapboxgl-ctrl-zoom-in",
    ".mapboxgl-ctrl-zoom-out",
    ".research-question-shell-mobile .research-question-prompt:not([hidden])"
  ];
  const items = selectors.map(selector => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (!rect.width || !rect.height || style.display === "none" || style.visibility === "hidden") return null;
    return { selector, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
  }).filter(Boolean);
  const overlaps = [];
  const intentionalOverlaps = [];
  for (let first = 0; first < items.length; first += 1) {
    for (let second = first + 1; second < items.length; second += 1) {
      const a = items[first];
      const b = items[second];
      const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const area = Math.round(width * height);
      if (area <= 4) continue;
      const pair = [a.selector, b.selector].sort();
      if (pair[0] === ".mapboxgl-ctrl-logo" && pair[1] === ".mobile-promo-dock") {
        intentionalOverlaps.push([a.selector, b.selector, area]);
        continue;
      }
      overlaps.push([a.selector, b.selector, area]);
    }
  }
  return { items, overlaps, intentionalOverlaps };
})()`);

socket.close();

const landscape = safeArea.viewport[0] > safeArea.viewport[1];
const minimumControlSize = landscape ? 32 : 40;
const nativeInsetsValid = landscape
  ? safeArea.app.top > 0 && (safeArea.app.right > 0 || safeArea.app.bottom > 0 || safeArea.app.left > 0)
  : safeArea.app.top > 0 && safeArea.app.bottom > 0;
const failures = [
  ...(!safeArea.propagated || !nativeInsetsValid ? [{ safeArea, landscape, nativeInsetsValid }] : []),
  ...(startupPanel.native && (startupPanel.timelineMode || !startupPanel.collapsed
    || startupPanel.timeline.height > 1 || startupPanel.nearby.height > 1)
    ? [{ startupPanel }]
    : []),
  ...(!startupSpotlight.cardSafe || !startupSpotlight.closeSafe || startupSpotlight.locateVisible
    ? [startupSpotlight]
    : []),
  ...controls.filter(item => item.missing || (item.visible && (item.width < minimumControlSize || item.height < minimumControlSize)) || (item.visible && (!item.hitOk || !item.safeBoundsOk))),
  ...panels.filter(item => item.missing || item.missingPanel || !item.open || !item.visible || !item.inBounds || item.openSheets !== 1
    || !item.scrollProbe?.reachedBottom || !item.scrollProbe?.lastBottomSafe),
  ...menus.filter(item => item.missing || !item.opened || !item.floatingControlsHidden || !item.panelSafeBounds
    || !item.lastControlSafe || !item.closed
    || (item.name === "more" && (!item.initialControlsSafe || item.initialScrollRange > 1 || item.gridColumnCount < 2
      || (item.adminAvailable && !item.adminExpanded)))),
  ...contentPages.filter(item => !item.open || !item.visible || !item.title.includes(item.expectedTitle) || item.itemCount < 1 || item.loadFailed),
  ...(timeline.buttonMissing
    || !timeline.visible
    || timeline.role !== "feed"
    || timeline.cardCount < 1
    || timeline.cardCount > 50
    || !timeline.legacyControlsAbsent
    || !timeline.loadMoreExists
    || !timeline.feed?.scrollable
    || !timeline.feed?.reachedBottom
    || !timeline.controlsSafe
    ? [timeline]
    : []),
  ...(!nearbyHidden.hidden || !nearbyHidden.controlsSafe ? [nearbyHidden] : []),
  ...(promos.buttons.some(button => button.visible) && (promos.dockBottomGap === null
    || promos.dockBottomGap < 4 || promos.dockBottomGap > 12 || promos.dockLeftGap < 4 || promos.dockLeftGap > 16)
    ? [{ promos }]
    : []),
  ...promos.buttons.filter(item => promos.cardVisible
    ? item.visible
    : (!item.hidden && (!item.visible || item.width < 36 || item.height < 36 || !item.inMapBounds))),
  ...(promos.cardVisible && promos.locateVisible
    ? [{ selector: "#mobile-map-locate", issue: "visible beneath startup spotlight" }]
    : []),
  ...overlapAudit.overlaps,
];

console.log(JSON.stringify({
  url: target.url,
  readiness,
  safeArea,
  startupPanel,
  startupSpotlight,
  controls,
  panels,
  menus,
  contentPages,
  timeline,
  nearbyHidden,
  promos,
  overlaps: overlapAudit.overlaps,
  intentionalOverlaps: overlapAudit.intentionalOverlaps,
  pass: failures.length === 0,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
