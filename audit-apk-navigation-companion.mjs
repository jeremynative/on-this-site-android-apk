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

const mode = process.env.COMPANION_MODE || "enable";
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
  await waitFor(() => {
    const loading = document.querySelector("#loading-screen");
    return !loading || loading.hidden || getComputedStyle(loading).display === "none";
  }, 45000);
  const settingsButton = await waitFor(() => document.getElementById("settings-open"));
  settingsButton?.click();
  const toggle = await waitFor(() => document.getElementById("navigation-companion-toggle"));
  if (!toggle) return { error: "Navigation companion toggle was not installed." };
  const before = {
    checked: toggle.checked,
    nativeEnabled: window.AndroidApp.isNavigationCompanionEnabled(String(window.__NLI_ANDROID_BRIDGE_TOKEN || ""))
  };
  const targetEnabled = ${JSON.stringify(mode !== "disable")};
  if (toggle.checked !== targetEnabled) {
    toggle.checked = targetEnabled;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
  }
  await wait(1200);
  return {
    before,
    after: {
      checked: toggle.checked,
      nativeEnabled: window.AndroidApp.isNavigationCompanionEnabled(String(window.__NLI_ANDROID_BRIDGE_TOKEN || "")),
      status: document.getElementById("navigation-companion-status")?.textContent.trim() || "",
      undoVisible: !document.getElementById("navigation-companion-undo")?.hidden,
      settingsOpen: document.getElementById("settings-sheet")?.classList.contains("open") || false
    }
  };
})()`);

socket.close();
if (report?.error) throw new Error(report.error);
const expectedEnabled = mode !== "disable";
if (report?.after?.nativeEnabled !== expectedEnabled || report?.after?.checked !== expectedEnabled) {
  throw new Error(`APK navigation companion audit failed: ${JSON.stringify(report)}`);
}
if (expectedEnabled && !report.after.undoVisible) {
  throw new Error(`APK navigation companion did not expose immediate undo: ${JSON.stringify(report)}`);
}
console.log(`APK navigation companion ${mode} audit passed: ${JSON.stringify(report)}`);
