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
    awaitPromise: true
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || "WebView evaluation failed.");
  }
  return response.result?.value;
}

const marker = `Codex APK emulator delivery test ${new Date().toISOString()}`;
await evaluate(`(() => {
  window.__nliFeedbackAuditResponse = null;
  if (!window.__nliFeedbackAuditFetchInstalled) {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const input = args[0];
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.includes("feedback-email.php") || url.includes("/flows/trigger/5ff12770-f45c-4df1-b0e4-1420229b46af")) {
        const text = await response.clone().text();
        let body = null;
        try { body = text ? JSON.parse(text) : null; } catch {}
        window.__nliFeedbackAuditResponse = { status: response.status, ok: response.ok, body };
      }
      return response;
    };
    window.__nliFeedbackAuditFetchInstalled = true;
  }
  document.querySelector("#mobile-startup-spotlight-close")?.click();
  document.querySelector("#feedback-open")?.click();
  const name = document.querySelector("#feedback-name");
  const email = document.querySelector("#feedback-email");
  const message = document.querySelector("#feedback-message");
  if (name) name.value = "Codex emulator audit";
  if (email) email.value = "";
  if (message) message.value = ${JSON.stringify(marker + ". Please close as test feedback; this verifies APK screenshot and delivery after the UI refactor.")};
  document.querySelector("#feedback-capture")?.click();
  return true;
})()`);

const capture = await evaluate(`new Promise(resolve => {
  const startedAt = Date.now();
  const check = () => {
    const status = document.querySelector("#feedback-screenshot-status")?.textContent?.trim() || "";
    const removeVisible = !document.querySelector("#feedback-remove-screenshot")?.hidden;
    if (removeVisible || /captured/i.test(status)) return resolve({ ok: true, status });
    if (/could not|failed|unavailable/i.test(status) || Date.now() - startedAt > 25000) {
      return resolve({ ok: false, status });
    }
    setTimeout(check, 250);
  };
  check();
})`);
if (!capture.ok) throw new Error(`APK feedback screenshot capture failed: ${capture.status}`);

await evaluate(`document.querySelector("#feedback-submit")?.click()`);
const delivery = await evaluate(`new Promise(resolve => {
  const startedAt = Date.now();
  const check = () => {
    const banner = document.querySelector("#banner")?.textContent?.trim() || "";
    const response = window.__nliFeedbackAuditResponse;
    if (/Feedback sent/i.test(banner) && response) {
      return resolve({
        ok: Boolean(response.ok && response.status >= 200 && response.status < 300),
        status: response.status,
        banner,
        responseKeys: response.body && typeof response.body === "object" ? Object.keys(response.body) : []
      });
    }
    if (/could not|failed/i.test(banner) || Date.now() - startedAt > 30000) {
      return resolve({ ok: false, status: response?.status || 0, banner });
    }
    setTimeout(check, 250);
  };
  check();
})`);

socket.close();
if (!delivery.ok) throw new Error(`APK feedback delivery failed: ${JSON.stringify(delivery)}`);
console.log(JSON.stringify({ marker, capture, delivery }, null, 2));
