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
  const loading = document.querySelector("#loading-screen");
  const startedAt = performance.now();
  while (performance.now() - startedAt < 45000) {
    const style = loading ? getComputedStyle(loading) : null;
    if (!loading || loading.hidden || style?.display === "none" || style?.visibility === "hidden") break;
    await wait(100);
  }
  document.querySelectorAll(".sheet.open").forEach(sheet => sheet.classList.remove("open"));
  document.querySelector("#close-detail")?.click();
  await wait(460);

  const sampleOpen = async (kind, slug) => {
    const map = document.querySelector("#map");
    const detail = document.querySelector("#detail");
    if (!map || !detail) return { kind, slug, error: "Required map/detail elements are missing." };
    const before = map.getBoundingClientRect();
    const samples = [];
    const sample = () => {
      const rect = map.getBoundingClientRect();
      samples.push({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    };
    const sampleTimer = setInterval(sample, 10);
    const accepted = window.NLI_NATIVE_MAP_BRIDGE?.openFeature?.(kind, slug);
    await wait(560);
    clearInterval(sampleTimer);
    const after = map.getBoundingClientRect();
    const maxDelta = Math.max(0, ...samples.flatMap(rect => [
      Math.abs(rect.left - before.left),
      Math.abs(rect.top - before.top),
      Math.abs(rect.width - before.width),
      Math.abs(rect.height - before.height),
    ]));
    const detailRect = detail.getBoundingClientRect();
    const result = {
      kind,
      slug,
      accepted: Boolean(accepted),
      sampleCount: samples.length,
      mapRectMaxDelta: Math.round(maxDelta * 10) / 10,
      mapBefore: [before.left, before.top, before.width, before.height].map(value => Math.round(value * 10) / 10),
      mapAfter: [after.left, after.top, after.width, after.height].map(value => Math.round(value * 10) / 10),
      detailRect: [detailRect.left, detailRect.top, detailRect.width, detailRect.height].map(value => Math.round(value * 10) / 10),
    };
    document.querySelector("#close-detail")?.click();
    await wait(460);
    return result;
  };

  return {
    viewport: [window.innerWidth, window.innerHeight],
    tabletLandscape: document.documentElement.dataset.nativeTabletLandscape === "true",
    rows: [
      await sampleOpen("site", "mas-house"),
      await sampleOpen("wiki", "sunksqua-weany-pametsechs"),
    ],
  };
})()`);

socket.close();
console.log(JSON.stringify(report, null, 2));
for (const row of report?.rows || []) {
  if (row.error || !row.accepted || row.mapRectMaxDelta > 1) {
    throw new Error(`Map panel-transition audit failed: ${JSON.stringify(row)}`);
  }
}
