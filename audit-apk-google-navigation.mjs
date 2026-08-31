const targets = await fetch(process.env.CDP_ENDPOINT || "http://127.0.0.1:9222/json").then(response => response.json());
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

const report = await evaluate(`(async () => {
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  const waitFor = async (test, timeout = 30000) => {
    const startedAt = performance.now();
    while (performance.now() - startedAt < timeout) {
      const value = test();
      if (value) return value;
      await wait(50);
    }
    return null;
  };
  await waitFor(() => window.__nliGoogleNavigationInstalled === true, 45000);
  const available = window.AndroidApp.isInAppGoogleNavigationAvailable(String(window.__NLI_ANDROID_BRIDGE_TOKEN || ""));
  const fixture = document.createElement("section");
  fixture.className = "detail";
  fixture.hidden = true;
  fixture.innerHTML = '<h2>Navigation audit destination</h2><a class="action" href="https://www.google.com/maps/dir/?api=1&destination=40.9123%2C-72.3912&travelmode=driving" target="_blank">Directions</a>';
  document.body.appendChild(fixture);
  await wait(250);
  const anchor = fixture.querySelector("a");
  const output = {
    installed: window.__nliGoogleNavigationInstalled === true,
    available,
    bridgeAvailabilityMethod: typeof window.AndroidApp.isInAppGoogleNavigationAvailable,
    bridgeStartMethod: typeof window.AndroidApp.startInAppGoogleNavigation,
    oldCompanionTogglePresent: Boolean(document.getElementById("navigation-companion-toggle")),
    fixtureText: anchor?.textContent || "",
    fixtureDecorated: anchor?.dataset.nliGoogleNavigation === "1",
    targetRemoved: !anchor?.hasAttribute("target")
  };
  fixture.remove();
  return output;
})()`);

if (!report?.installed || report.bridgeAvailabilityMethod !== "function" || report.bridgeStartMethod !== "function") {
  throw new Error(`APK Google navigation bridge was not installed: ${JSON.stringify(report)}`);
}
if (report.oldCompanionTogglePresent) {
  throw new Error(`Rejected notification companion still appears: ${JSON.stringify(report)}`);
}
if (report.available && (!report.fixtureDecorated || report.fixtureText !== "Navigate" || !report.targetRemoved)) {
  throw new Error(`Configured Google navigation link was not converted: ${JSON.stringify(report)}`);
}
if (!report.available && (report.fixtureDecorated || report.fixtureText !== "Directions")) {
  throw new Error(`Keyless build must preserve the Google Maps fallback: ${JSON.stringify(report)}`);
}
if (process.env.NAVIGATION_AUDIT_OPEN === "1") {
  if (!report.available) throw new Error("The current build does not expose in-app Google navigation.");
  const opened = await evaluate(`window.AndroidApp.startInAppGoogleNavigation(
    String(window.__NLI_ANDROID_BRIDGE_TOKEN || ""),
    "Ma's House",
    "mas-house",
    40.887388,
    -72.389993
  )`);
  if (!opened) throw new Error("The native Google navigation activity did not open.");
}
socket.close();
console.log(`APK in-app Google navigation audit passed: ${JSON.stringify(report)}`);
