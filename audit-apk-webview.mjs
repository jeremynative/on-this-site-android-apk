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
    const mapReady = Boolean(document.querySelector("#map .mapboxgl-canvas"));
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

if (process.env.AUDIT_CLOSE_SPOTLIGHT === "1") {
  await evaluate(`document.querySelector("#mobile-startup-spotlight-close")?.click()`);
  await wait(180);
}

await evaluate(`(() => {
  document.querySelector("#close-detail")?.click();
  document.querySelectorAll(".sheet.open [data-close-sheet]").forEach(button => button.click());
  document.querySelectorAll("details[open]").forEach(details => details.removeAttribute("open"));
  return true;
})()`);
await wait(220);

const controls = await evaluate(`(() => {
  const selectors = [
    "#login-open",
    "#locate",
    "[data-app-page='about']",
    "#feedback-open",
    "#mobile-layer-menu > summary",
    ".mobile-more-menu > summary",
    "#mobile-activity-open",
    "#mobile-notifications-open",
    "#mobile-tab-timeline",
    "#mobile-tab-nearby",
    "#collapse-list",
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
      centerCss: [Math.round(centerX), Math.round(centerY)],
      centerDevice: [Math.round(centerX * devicePixelRatio), Math.round(centerY * devicePixelRatio)],
      hit: hit ? (hit.id ? "#" + hit.id : hit.tagName.toLowerCase()) : null,
      hitOk: Boolean(hit && (hit === element || element.contains(hit))),
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
  await wait(650);
  const state = await evaluate(`(() => {
    const panel = document.querySelector(${JSON.stringify(panelSelector)});
    if (!panel) return { missingPanel: true };
    const rect = panel.getBoundingClientRect();
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
      openSheets: document.querySelectorAll(".sheet.open").length
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
    const menu = document.querySelector(${JSON.stringify(selector)});
    if (!menu) return { missing: true };
    menu.querySelector("summary")?.click();
    const opened = menu.open;
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
    menu.querySelector("summary")?.click();
    return { missing: false, opened, floatingControlsHidden, closed: !menu.open };
  })()`);
  menus.push({ name, ...state });
}

const contentPages = [];
for (const [name, selector, expectedTitle, expectedItems] of [
  ["learn", "#mobile-learn-open", "Knowledgebase", "[data-wiki-slug]"],
  ["blog", "[data-app-page='blog']", "Blog", "[data-blog-index]"],
]) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  await wait(name === "blog" ? 850 : 350);
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

const timeline = await evaluate(`(() => {
  const button = document.querySelector("#mobile-tab-timeline");
  button?.click();
  const panel = document.querySelector(".mobile-timeline");
  const result = {
    buttonMissing: !button,
    visible: panel ? panel.getBoundingClientRect().height > 0 : false,
    previousExists: Boolean(document.querySelector("#mobile-timeline-prev")),
    nextExists: Boolean(document.querySelector("#mobile-timeline-next"))
  };
  document.querySelector("#mobile-tab-nearby")?.click();
  return result;
})()`);

const promos = await evaluate(`(() => {
  const card = document.querySelector("#mobile-startup-spotlight");
  const cardVisible = Boolean(card && !card.hidden && card.getBoundingClientRect().height > 0);
  const buttons = [...document.querySelectorAll("[data-mobile-promo-kind]")].map(button => {
    const rect = button.getBoundingClientRect();
    const style = getComputedStyle(button);
    return {
      kind: button.dataset.mobilePromoKind || "",
      hidden: button.hidden,
      visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden",
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  });
  return {
    buttons,
    availableKinds: typeof availableMobilePromoKinds === "function" ? availableMobilePromoKinds() : [],
    cardVisible,
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
    ".mobile-tabs",
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
  for (let first = 0; first < items.length; first += 1) {
    for (let second = first + 1; second < items.length; second += 1) {
      const a = items[first];
      const b = items[second];
      const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      if (width * height > 4) overlaps.push([a.selector, b.selector, Math.round(width * height)]);
    }
  }
  return { items, overlaps };
})()`);

socket.close();

const failures = [
  ...controls.filter(item => item.missing || (item.visible && (item.width < 40 || item.height < 40)) || (item.visible && !item.hitOk)),
  ...panels.filter(item => item.missing || item.missingPanel || !item.open || !item.visible || !item.inBounds || item.openSheets !== 1),
  ...menus.filter(item => item.missing || !item.opened || !item.floatingControlsHidden || !item.closed),
  ...contentPages.filter(item => !item.open || !item.visible || !item.title.includes(item.expectedTitle) || item.itemCount < 1 || item.loadFailed),
  ...(timeline.buttonMissing || !timeline.visible || !timeline.previousExists || !timeline.nextExists ? [timeline] : []),
  ...promos.buttons.filter(item => promos.cardVisible
    ? item.visible
    : (!item.hidden && (!item.visible || item.width < 36 || item.height < 36))),
  ...(promos.cardVisible && controls.find(item => item.selector === "#mobile-map-locate")?.visible
    ? [{ selector: "#mobile-map-locate", issue: "visible beneath startup spotlight" }]
    : []),
  ...overlapAudit.overlaps,
];

console.log(JSON.stringify({
  url: target.url,
  readiness,
  controls,
  panels,
  menus,
  contentPages,
  timeline,
  promos,
  overlaps: overlapAudit.overlaps,
  pass: failures.length === 0,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
