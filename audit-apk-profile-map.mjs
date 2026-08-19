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
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || "WebView evaluation failed.");
  }
  return response.result?.value;
}

const result = await evaluate(`(async () => {
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  const waitFor = async (check, timeoutMs = 20000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (check()) return true;
      await wait(120);
    }
    return false;
  };
  const ready = await waitFor(() => window.NLI_APK_SITE_CAMERA_AUDIT?.snapshot?.().ready && document.querySelector("#login-open"));
  if (!ready) return { passed: false, reason: "Profile/camera audit hooks did not become ready." };
  document.querySelectorAll(".sheet.open [data-close-sheet]").forEach(button => button.click());
  document.querySelector("#close-detail")?.click();
  await wait(180);
  const snapshot = label => {
    const rect = document.querySelector("#map").getBoundingClientRect();
    return {
      label,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      camera: window.NLI_APK_SITE_CAMERA_AUDIT.snapshot(),
      body: document.body.className,
      profileMode: document.body.classList.contains("mobile-profile-map-mode"),
      sheetOpen: Boolean(document.querySelector("#login-sheet.open")),
      markers: document.querySelectorAll(".mobile-profile-progress-marker").length
    };
  };
  const before = snapshot("before");
  const accountButton = document.querySelector("#login-open");
  if (!/Jeremy Dennis/i.test(accountButton?.textContent || "")) {
    return { passed: false, reason: "The signed-in username/points button was not rendered.", before, buttonText: accountButton?.textContent || "" };
  }
  accountButton.click();
  await wait(700);
  const during = snapshot("during");
  accountButton.click();
  await wait(360);
  const after = snapshot("after");
  const sameNumber = (a, b, tolerance = 0.001) => Math.abs(Number(a) - Number(b)) <= tolerance;
  const sameRect = value => ["left", "top", "width", "height"].every(key => sameNumber(value.rect[key], before.rect[key]));
  const sameCamera = value => (
    value.camera.center?.length === 2
    && before.camera.center?.length === 2
    && sameNumber(value.camera.center[0], before.camera.center[0], 0.000001)
    && sameNumber(value.camera.center[1], before.camera.center[1], 0.000001)
    && sameNumber(value.camera.zoom, before.camera.zoom, 0.0001)
    && sameNumber(value.camera.bearing, before.camera.bearing, 0.0001)
    && sameNumber(value.camera.pitch, before.camera.pitch, 0.0001)
  );
  return {
    passed: sameRect(during) && sameRect(after)
      && sameCamera(during) && sameCamera(after)
      && during.profileMode && during.sheetOpen && during.markers > 0
      && !after.profileMode && !after.sheetOpen && after.markers === 0,
    before,
    during,
    after
  };
})()`);

socket.close();
console.log(JSON.stringify(result, null, 2));
if (!result?.passed) process.exitCode = 1;
