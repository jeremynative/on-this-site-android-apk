const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222/json";
const slug = process.env.SITE_SLUG || "corchaug-ancestral-land";
const query = process.env.SITE_QUERY || "Corchaug Ancestral Land";

const targets = await fetch(endpoint).then(response => response.json());
const target = targets.find(item => item.type === "page" && item.title && item.webSocketDebuggerUrl);
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

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "WebView evaluation failed.");
  return response.result?.value;
}

const report = await evaluate(`(async () => {
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  const waitFor = async (test, timeout = 20000) => {
    const started = performance.now();
    while (performance.now() - started < timeout) {
      const value = test();
      if (value) return value;
      await wait(50);
    }
    return null;
  };

  document.querySelector("[data-close-sheet]")?.click();
  document.querySelector("#mobile-startup-spotlight-close")?.click();
  await wait(250);
  history.pushState({ polygonEdgeAudit: true }, "", location.pathname + "?site=${slug}");
  window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
  const title = await waitFor(() => {
    const element = document.querySelector("#detail-title");
    const value = element?.textContent?.trim() || "";
    return value.toLowerCase().includes(${JSON.stringify(query.toLowerCase())}) ? value : "";
  });
  if (!title) return { error: "Target site route did not open." };
  await wait(1200);
  const geometry = await fetch("assets/data/mobile-site-geometry.json?v=20260831-shoreline-edge-audit-v4", { cache: "no-cache" })
    .then(response => response.json());
  const row = (geometry.rows || []).find(item => item.slug === ${JSON.stringify(slug)});
  return {
    title,
    slug: row?.slug || "",
    geometryType: row?.display_geojson?.type || row?.geojson?.type || "",
    geometryBytes: JSON.stringify(row?.display_geojson || row?.geojson || null).length,
    geometryRows: geometry.rows?.length || 0,
    detailedRows: (geometry.rows || []).filter(item => item.display_geojson).length,
    nativeMap: document.documentElement.classList.contains("nli-native-map") || document.body.classList.contains("native-android-app")
  };
})()`);

socket.close();
if (report?.error) throw new Error(JSON.stringify(report));
if (report?.geometryRows !== 439 || report?.detailedRows < 16 || !report?.geometryType) {
  throw new Error(`Audited polygon geometry was not available: ${JSON.stringify(report)}`);
}
console.log(JSON.stringify(report, null, 2));
