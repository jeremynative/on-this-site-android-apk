const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222/json";

const targets = await fetch(endpoint).then(response => response.json());
const target = targets.find(item => item.type === "page" && item.webSocketDebuggerUrl);
if (!target) throw new Error("No debuggable APK WebView was found.");

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

const response = await send("Runtime.evaluate", {
  expression: `(async () => {
    const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
    const started = performance.now();
    while (!window.NLI_APK_SITE_CAMERA_AUDIT && performance.now() - started < 20000) await wait(100);
    if (!window.NLI_APK_SITE_CAMERA_AUDIT) return { error: "APK camera audit did not become ready." };
    document.querySelector("#mobile-startup-spotlight-close")?.click();
    document.querySelector("[data-close-sheet]")?.click();
    const snapshot = window.NLI_APK_SITE_CAMERA_AUDIT.setCamera([-72.229162, 40.939064], 13.8);
    await wait(1500);
    return { ...snapshot, expectedLabel: "Georgica Pond" };
  })()`,
  awaitPromise: true,
  returnByValue: true
});
socket.close();

if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "WebView evaluation failed.");
const report = response.result?.value;
if (report?.error || !Array.isArray(report?.center) || Math.abs(report.center[0] + 72.229162) > 0.01 || report.zoom < 13) {
  throw new Error(`Could not focus the native map for water-label QA: ${JSON.stringify(report)}`);
}
console.log(JSON.stringify(report, null, 2));
