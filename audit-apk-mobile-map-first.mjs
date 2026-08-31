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
  const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "WebView evaluation failed.");
  return response.result?.value;
}

const inspect = () => evaluate(`(() => {
    const app = document.querySelector(".app");
    const loading = document.querySelector("#loading-screen");
    const loadingVisible = Boolean(loading && !loading.hidden && getComputedStyle(loading).display !== "none");
    const locationState = window.NLI_APK_LOCATION_CONTROL_AUDIT?.snapshot?.() || {};
    return {
      url: window.location.href,
      classes: app?.className || "",
      panelCollapsed: Boolean(app?.classList.contains("panel-collapsed")),
      nearbySelected: Boolean(app?.classList.contains("panel-nearby")),
      contentOpen: Boolean(document.querySelector(".detail.open, .sheet.open")),
      timelineHidden: document.querySelector(".mobile-timeline")?.getAttribute("aria-hidden"),
      nearbyHidden: document.querySelector(".list-panel")?.getAttribute("aria-hidden"),
      locationReady: Boolean(locationState.ready),
      locationCentered: Boolean(locationState.centered),
      zoom: Number(locationState.zoom || 0),
      androidUserAgent: /Android/i.test(navigator.userAgent),
      bridgeReady: Boolean(window.AndroidApp),
      locationPermission: window.AndroidApp?.hasLocationPermission?.() ?? null,
      startupLocationAudit: window.NLI_STARTUP_LOCATION_AUDIT || null,
      loadingVisible
    };
})()`);

let result = {};
for (let attempt = 0; attempt < 60; attempt += 1) {
  result = await inspect();
  if (!result.loadingVisible && result.locationReady && result.locationCentered) break;
  await new Promise(resolve => setTimeout(resolve, 500));
}

socket.close();

const failures = [];
if (!result.panelCollapsed) failures.push("content panel is not collapsed");
if (!result.nearbySelected) failures.push("Nearby is not the hidden selected panel");
if (result.contentOpen) failures.push("a detail or sheet is already open");
if (result.timelineHidden !== "true" || result.nearbyHidden !== "true") failures.push("a content feed is visible");
if (!result.locationReady) failures.push("user location did not become ready");
if (!result.locationCentered) failures.push("map is not centered on the user");
if (result.loadingVisible) failures.push("startup loading screen is still visible");
if (failures.length) throw new Error(`APK mobile map-first audit failed: ${failures.join("; ")}\n${JSON.stringify(result)}`);

console.log(`APK mobile map-first audit passed: ${JSON.stringify(result)}`);
