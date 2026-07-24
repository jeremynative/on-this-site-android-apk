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
  await wait(180);
  const state = await evaluate(`(() => {
    const panel = document.querySelector(${JSON.stringify(panelSelector)});
    if (!panel) return { missingPanel: true };
    const rect = panel.getBoundingClientRect();
    return {
      missingPanel: false,
      open: panel.classList.contains("open"),
      visible: rect.width > 0 && rect.height > 0 && getComputedStyle(panel).display !== "none",
      top: Math.round(rect.top),
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
    menu.querySelector("summary")?.click();
    return { missing: false, opened, closed: !menu.open };
  })()`);
  menus.push({ name, ...state });
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

const overlapAudit = await evaluate(`(() => {
  const selectors = [
    "#mobile-activity-open",
    "#mobile-notifications-open",
    "#mobile-map-locate",
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
  ...panels.filter(item => item.missing || item.missingPanel || !item.open || !item.visible || item.openSheets !== 1),
  ...menus.filter(item => item.missing || !item.opened || !item.closed),
  ...(timeline.buttonMissing || !timeline.visible || !timeline.previousExists || !timeline.nextExists ? [timeline] : []),
  ...overlapAudit.overlaps,
];

console.log(JSON.stringify({
  url: target.url,
  readiness,
  controls,
  panels,
  menus,
  timeline,
  overlaps: overlapAudit.overlaps,
  pass: failures.length === 0,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
