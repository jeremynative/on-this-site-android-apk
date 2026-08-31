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

const result = await evaluate(`(async () => {
  const header = document.querySelector(".mobile-header-instruction");
  const loader = document.getElementById("loading-screen");
  const wikiResponse = await fetch("assets/data/mobile-wiki-index.json", { cache: "no-store" });
  const wikiPayload = wikiResponse.ok ? await wikiResponse.json() : null;
  const eventResponse = await fetch(
    "https://directus.nativelongisland.com/items/calendar_events?limit=1&fields=id,title",
    { cache: "no-store" }
  );
  const eventPayload = eventResponse.ok ? await eventResponse.json() : null;
  return {
    url: location.href,
    offline: document.body.classList.contains("offline-text-mode"),
    loaderHidden: !loader || loader.hidden || loader.classList.contains("hidden"),
    siteCards: document.querySelectorAll(".site-card[data-slug]").length,
    wikiCards: document.querySelectorAll(".site-card[data-wiki-slug]").length,
    nativeBridgeReady: typeof window.NLI_NATIVE_MAP_BRIDGE?.openFeature === "function",
    headerText: header?.textContent?.trim() || "",
    wikiIndexStatus: wikiResponse.status,
    wikiIndexRows: Array.isArray(wikiPayload?.rows) ? wikiPayload.rows.length : 0,
    calendarStatus: eventResponse.status,
    calendarRows: Array.isArray(eventPayload?.data) ? eventPayload.data.length : 0
  };
})()`);

socket.close();

if (result.offline) throw new Error(`APK remained in offline mode after online startup: ${result.url}`);
if (!result.loaderHidden) throw new Error("APK live loading screen is still visible.");
if (result.siteCards < 1 && !result.nativeBridgeReady) {
  throw new Error("APK live shell rendered neither site cards nor a ready native map bridge.");
}
if (result.wikiIndexStatus !== 200 || result.wikiIndexRows < 1) {
  throw new Error(`APK wiki index is unavailable (${result.wikiIndexStatus}, ${result.wikiIndexRows} rows).`);
}
if (result.calendarStatus !== 200) {
  throw new Error(`APK calendar endpoint is unavailable (${result.calendarStatus}).`);
}

console.log(JSON.stringify(result, null, 2));
