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
    throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || "WebView evaluation failed.");
  }
  return response.result?.value;
}

const audit = await evaluate(`(async () => {
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  const waitFor = async (check, timeoutMs = 45000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (check()) return true;
      await wait(200);
    }
    return false;
  };
  const ready = await waitFor(() => (
    document.querySelector("#mobile-map-locate")
    && window.NLI_APK_LOCATION_CONTROL_AUDIT?.snapshot?.().ready
  ), 15000);
  if (!ready) {
    return {
      passed: false,
      reason: "Map, device location, or updated location-control code did not become ready.",
      url: location.href,
      hasAndroidBridge: Boolean(window.AndroidApp),
      debugBuild: window.AndroidApp?.isDebugBuild?.(),
      hasAuditHook: Boolean(window.NLI_APK_LOCATION_CONTROL_AUDIT),
      auditSnapshot: window.NLI_APK_LOCATION_CONTROL_AUDIT?.snapshot?.() || null,
      hasMapCanvas: Boolean(document.querySelector("#map .mapboxgl-canvas")),
      locationButtonDisabled: document.querySelector("#mobile-map-locate")?.disabled ?? null,
      loadingVisible: document.querySelector("#loading-screen")?.hidden === false,
      title: document.title,
      bodyText: document.body?.innerText?.slice(0, 240) || ""
    };
  }

  const button = document.querySelector("#mobile-map-locate");
  const snapshot = label => ({ label, ...window.NLI_APK_LOCATION_CONTROL_AUDIT.snapshot() });
  const press = async label => {
    const startedAt = performance.now();
    button.click();
    const centeredWithinBudget = await waitFor(
      () => window.NLI_APK_LOCATION_CONTROL_AUDIT.snapshot().centered && !button.disabled,
      900
    );
    const elapsedMs = Math.round(performance.now() - startedAt);
    await wait(80);
    return { ...snapshot(label), centeredWithinBudget, elapsedMs };
  };

  window.NLI_APK_LOCATION_CONTROL_AUDIT.moveAway();
  await wait(150);
  const awayBeforeFirstPress = snapshot("away-before-first-press");
  const recentered = await press("recentered");
  const zoomedOnce = await press("zoomed-once");
  const zoomedTwice = await press("zoomed-twice");

  window.NLI_APK_LOCATION_CONTROL_AUDIT.moveAway();
  await wait(150);
  window.NLI_APK_LOCATION_CONTROL_AUDIT.clearKnownLocation();
  const cachedRecenter = await press("native-cached-recenter");

  window.NLI_APK_LOCATION_CONTROL_AUDIT.moveAway();
  await wait(150);
  const awayBeforeReset = snapshot("away-before-reset");
  const resetRecenter = await press("reset-recenter");

  const near = (actual, expected, tolerance = 0.08) => Math.abs(actual - expected) <= tolerance;
  const passed = (
    !awayBeforeFirstPress.centered
    && recentered.centered
    && recentered.centeredWithinBudget
    && near(recentered.zoom, 10.5)
    && zoomedOnce.centered
    && near(zoomedOnce.zoom, recentered.zoom + 1)
    && zoomedTwice.centered
    && near(zoomedTwice.zoom, zoomedOnce.zoom + 1)
    && cachedRecenter.centered
    && cachedRecenter.centeredWithinBudget
    && near(cachedRecenter.zoom, 10.5)
    && !awayBeforeReset.centered
    && resetRecenter.centered
    && resetRecenter.centeredWithinBudget
    && near(resetRecenter.zoom, 10.5)
  );

  return {
    passed,
    appVersion: window.AndroidApp?.getBuildId?.() || "",
    steps: [
      awayBeforeFirstPress,
      recentered,
      zoomedOnce,
      zoomedTwice,
      cachedRecenter,
      awayBeforeReset,
      resetRecenter
    ]
  };
})()`);

socket.close();
console.log(JSON.stringify(audit, null, 2));
if (!audit?.passed) process.exitCode = 1;
