const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222/json";

async function targets() {
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`CDP target request failed: ${response.status}`);
  return response.json();
}

async function evaluate(webSocketDebuggerUrl, expression) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketDebuggerUrl);
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("Timed out waiting for the APK WebView."));
    }, 8000);
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: { expression, awaitPromise: true, returnByValue: true }
      }));
    });
    socket.addEventListener("message", event => {
      const payload = JSON.parse(event.data);
      if (payload.id !== 1) return;
      clearTimeout(timeout);
      socket.close();
      if (payload.result?.exceptionDetails) {
        reject(new Error(payload.result.exceptionDetails.text || "WebView evaluation failed."));
        return;
      }
      resolve(payload.result?.result?.value);
    });
    socket.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("Could not connect to the APK WebView debugger."));
    });
  });
}

const action = String(process.argv[2] || "").toLowerCase();
const closeDetail = action === "close";
const gesture = action === "tilt" || action === "rotate" ? action : "";
const zoom = gesture ? null : Number(action || 0);
if (!closeDetail && !gesture && (!Number.isFinite(zoom) || zoom < 1 || zoom > 20)) {
  throw new Error("Pass a target zoom between 1 and 20, close, or tilt/rotate.");
}
const page = (await targets()).find(target => target.type === "page");
if (!page?.webSocketDebuggerUrl) throw new Error("No APK WebView page is available.");
const result = await evaluate(page.webSocketDebuggerUrl, closeDetail ? `(() => {
  document.querySelector("#close-detail")?.click();
  return { ok: true, action: "close", href: location.href };
})()` : gesture ? `(() => {
  const token = String(window.__NLI_ANDROID_BRIDGE_TOKEN || "");
  const bridge = window.AndroidApp;
  if (!token || typeof bridge?.runNativeMapGestureDiagnostic !== "function") return { ok: false };
  return { ok: bridge.runNativeMapGestureDiagnostic(token, ${JSON.stringify(gesture)}), gesture: ${JSON.stringify(gesture)}, href: location.href };
})()` : `(() => {
  const token = String(window.__NLI_ANDROID_BRIDGE_TOKEN || "");
  const bridge = window.AndroidApp;
  if (!token || typeof bridge?.syncNativeMapCameraPose !== "function") return { ok: false };
  bridge.syncNativeMapCameraPose(token, -72.43, 40.88, ${JSON.stringify(zoom)}, 0, 0);
  window.NLI_NATIVE_MAP_BRIDGE?.cameraChanged?.(-72.43, 40.88, ${JSON.stringify(zoom)}, 0, 0);
  return { ok: true, zoom: ${JSON.stringify(zoom)}, href: location.href };
})()`);
console.log(JSON.stringify(result, null, 2));
