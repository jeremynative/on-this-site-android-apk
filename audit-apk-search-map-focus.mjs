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
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "WebView evaluation failed.");
  return response.result?.value;
}

const result = await evaluate(`new Promise(resolve => {
  const startedAt = Date.now();
  const run = async () => {
    const wait = milliseconds => new Promise(done => setTimeout(done, milliseconds));
    const status = document.querySelector(".mobile-header-instruction")?.textContent || "";
    if (!/(?:listings|places)[\\s\\S]*loaded\\./i.test(status) && Date.now() - startedAt < 45000) {
      setTimeout(run, 250);
      return;
    }
    document.querySelector("#mobile-startup-spotlight-close")?.click();
    document.querySelector("#close-detail")?.click();
    const mapPrototype = window.mapboxgl?.Map?.prototype;
    window.__qaSearchFocusCalls = [];
    for (const method of ["easeTo", "flyTo"]) {
      const original = mapPrototype?.[method];
      if (typeof original !== "function" || original.__qaWrapped) continue;
      const wrapped = function(options) {
        window.__qaSearchFocusCalls.push({ method, options: { center: options?.center, zoom: options?.zoom, duration: options?.duration } });
        return original.call(this, options);
      };
      wrapped.__qaWrapped = true;
      mapPrototype[method] = wrapped;
    }
    const input = document.querySelector("#search");
    if (!input) return resolve({ error: "Search input is missing.", status });
    input.focus();
    input.value = "Whale's Fin";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(900);
    const suggestion = document.querySelector('.search-suggestion[data-search-site="whales-fin"]');
    if (!suggestion) return resolve({ error: "Whale's Fin autocomplete result is missing.", status, suggestions: document.querySelector("#search-suggestions")?.innerText?.slice(0, 600) });
    const searchBeforeClick = input.value;
    suggestion.click();
    await wait(1350);
    const calls = window.__qaSearchFocusCalls || [];
    const camera = window.__nliMobileMapCameraSnapshot?.() || null;
    resolve({
      status,
      searchBeforeClick,
      title: document.querySelector("#detail-title")?.textContent?.trim() || "",
      articleOpen: Boolean(document.querySelector("#detail.open")),
      pulseCount: document.querySelectorAll(".search-result-map-pulse").length,
      focusCalls: calls,
      camera,
      closeFocus: Math.abs(Number(
        camera?.zoom !== null && Number.isFinite(Number(camera?.zoom)) ? camera.zoom : camera?.requestedSearchFocusCamera?.zoom
      ) - 14.5) < 0.08
    });
  };
  run();
})`);

socket.close();
if (result.error) throw new Error(result.error);
if (!result.closeFocus) throw new Error(`Search result did not request zoom 14.5: ${JSON.stringify(result)}`);
if (result.camera?.searchResultHighlightSlug !== "whales-fin") throw new Error(`Search result did not activate its map glow: ${JSON.stringify(result)}`);
if (!result.articleOpen || !/whale['’]s fin/i.test(result.title)) throw new Error(`Search result did not open the selected article: ${JSON.stringify(result)}`);

console.log(JSON.stringify({ url: target.url, ...result, pass: true }, null, 2));
