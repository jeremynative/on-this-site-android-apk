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
      sheetOpen: Boolean(document.querySelector("#login-sheet.open, #profiles-sheet.open")),
      markers: document.querySelectorAll(".mobile-profile-progress-marker").length,
      numberedActivity: document.querySelectorAll(".profile-feed-row[data-profile-map-stop]").length
    };
  };
  const accountButton = document.querySelector("#login-open");
  let profileKey = "";
  let closeProfile = null;
  if (/Jeremy Dennis/i.test(accountButton?.textContent || "")) {
    closeProfile = () => accountButton.click();
  } else {
    document.querySelector("#profiles-open")?.click();
    const publicProfileReady = await waitFor(() => [...document.querySelectorAll("[data-toggle-mobile-profile]")]
      .some(button => /Jeremy Dennis/i.test(button.textContent || "")));
    if (!publicProfileReady) {
      return { passed: false, reason: "Jeremy Dennis was unavailable in the public contributor directory.", buttonText: accountButton?.textContent || "" };
    }
    const publicButton = [...document.querySelectorAll("[data-toggle-mobile-profile]")]
      .find(button => /Jeremy Dennis/i.test(button.textContent || ""));
    profileKey = publicButton?.dataset.toggleMobileProfile || "";
    closeProfile = () => document.querySelector('[data-toggle-mobile-profile="' + CSS.escape(profileKey) + '"]')?.click();
  }
  const before = snapshot("before");
  if (profileKey) closeProfile();
  else accountButton.click();
  const profileReady = await waitFor(() => document.body.classList.contains("mobile-profile-map-mode")
    && document.querySelectorAll(".mobile-profile-progress-marker").length > 0
    && document.querySelectorAll(".profile-feed-row[data-profile-map-stop]").length > 0);
  if (!profileReady) return {
    passed: false,
    reason: "Contributor progress map did not become interactive.",
    before,
    current: snapshot("profile-timeout"),
    feedRows: [...document.querySelectorAll(".profile-feed-row")].slice(0, 8).map(row => ({
      className: row.className,
      stop: row.dataset.profileMapStop || "",
      text: (row.textContent || "").trim().slice(0, 180)
    }))
  };
  const during = snapshot("during");
  const nativeTapOpened = window.NLI_NATIVE_MAP_BRIDGE?.openFeature?.("profile", "0") === true;
  await wait(260);
  const nativeTap = {
    opened: nativeTapOpened,
    card: Boolean(document.querySelector(".mobile-profile-progress-card")),
    selectedRows: document.querySelectorAll(".profile-feed-row.is-map-selected").length,
    selectedStops: [...new Set([...document.querySelectorAll(".profile-feed-row.is-map-selected")]
      .map(row => Number(row.dataset.profileMapStop || 0)).filter(Boolean))],
    activeMarkers: document.querySelectorAll(".mobile-profile-progress-marker.is-active").length,
    activeStop: Number(document.querySelector(".mobile-profile-progress-marker.is-active")?.dataset.profileMapStop || 0)
  };
  const numberedRows = [...document.querySelectorAll(".profile-feed-row[data-profile-map-stop]")];
  const targetRow = numberedRows.find(row => row !== document.querySelector(".profile-feed-row.is-map-selected")) || numberedRows[0];
  const targetStop = Number(targetRow?.dataset.profileMapStop || 0);
  targetRow?.querySelector("[data-profile-map-stop-button]")?.click();
  await wait(760);
  const linkedTap = {
    targetStop,
    selectedStop: Number(document.querySelector(".profile-feed-row.is-map-selected")?.dataset.profileMapStop || 0),
    activeStop: Number(document.querySelector(".mobile-profile-progress-marker.is-active")?.dataset.profileMapStop || 0),
    popupText: document.querySelector(".mobile-profile-progress-card")?.textContent || "",
    camera: window.NLI_APK_SITE_CAMERA_AUDIT.snapshot()
  };
  const resizer = document.querySelector(".mobile-profile-sheet-resizer");
  resizer?.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
  await wait(120);
  const expandedSize = document.querySelector("#login-sheet.profile-progress-active, #profiles-sheet.profile-progress-active")?.dataset.profileSheetSize || "";
  resizer?.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
  await wait(120);
  const compactSize = document.querySelector("#login-sheet.profile-progress-active, #profiles-sheet.profile-progress-active")?.dataset.profileSheetSize || "";
  await wait(8800);
  const popupDismissed = !document.querySelector(".mobile-profile-progress-card");
  closeProfile();
  await wait(360);
  const after = snapshot("after");
  const sameNumber = (a, b, tolerance = 0.001) => Math.abs(Number(a) - Number(b)) <= tolerance;
  const sameRect = value => ["left", "top", "width", "height"].every(key => sameNumber(value.rect[key], before.rect[key]));
  const sameCamera = (value, expected = before.camera) => (
    value.camera.center?.length === 2
    && expected.center?.length === 2
    && sameNumber(value.camera.center[0], expected.center[0], 0.000001)
    && sameNumber(value.camera.center[1], expected.center[1], 0.000001)
    && sameNumber(value.camera.zoom, expected.zoom, 0.0001)
    && sameNumber(value.camera.bearing, expected.bearing, 0.0001)
    && sameNumber(value.camera.pitch, expected.pitch, 0.0001)
  );
  return {
    passed: sameRect(during) && sameRect(after)
      && sameCamera(during) && sameCamera(after, linkedTap.camera)
      && during.profileMode && during.sheetOpen && during.markers > 0
      && during.numberedActivity > 0
      && nativeTap.opened && nativeTap.card && nativeTap.selectedRows > 0 && nativeTap.activeMarkers === 1
      && nativeTap.selectedStops.length === 1 && nativeTap.selectedStops[0] === nativeTap.activeStop
      && targetStop > 0 && linkedTap.selectedStop === targetStop && linkedTap.activeStop === targetStop
      && linkedTap.popupText.includes("Stop " + targetStop)
      && expandedSize === "expanded" && compactSize === "compact" && popupDismissed
      && !after.profileMode && !after.sheetOpen && after.markers === 0,
    before,
    during,
    nativeTap,
    linkedTap,
    expandedSize,
    compactSize,
    popupDismissed,
    after
  };
})()`);

socket.close();
console.log(JSON.stringify(result, null, 2));
if (!result?.passed) process.exitCode = 1;
