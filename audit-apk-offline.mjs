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
    awaitPromise: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || "WebView evaluation failed.");
  }
  return response.result?.value;
}

const readiness = await evaluate(`new Promise(resolve => {
  const startedAt = Date.now();
  const check = () => {
    const ready = document.body?.classList.contains("offline-text-mode")
      && Boolean(document.querySelector(".offline-map-index"))
      && Boolean(document.querySelector(".site-card[data-slug], .site-card[data-wiki-slug]"));
    if (ready) {
      resolve({ ready: true, elapsedMs: Date.now() - startedAt });
      return;
    }
    if (Date.now() - startedAt >= 30000) {
      resolve({
        ready: false,
        elapsedMs: Date.now() - startedAt,
        title: document.title,
        bodyClass: document.body?.className || "",
        summary: document.querySelector("#offline-summary")?.textContent || "",
        resultCount: document.querySelector("#result-count")?.textContent || "",
        bodyText: (document.body?.innerText || "").slice(0, 500),
      });
      return;
    }
    setTimeout(check, 150);
  };
  check();
})`);

if (!readiness.ready) {
  throw new Error(`Offline archive did not become ready: ${JSON.stringify(readiness)}`);
}

const shell = await evaluate(`(() => {
  const summary = document.querySelector("#offline-summary")?.textContent || "";
  const countText = document.querySelector("#result-count")?.textContent || "";
  return {
    offlineFlag: window.NLI_APK_OFFLINE_TEXT_MODE === true,
    offlineClass: document.body.classList.contains("offline-text-mode"),
    hasOfflineIndex: Boolean(document.querySelector(".offline-map-index")),
    regionButtons: document.querySelectorAll("[data-offline-region]").length,
    hasListingCount: /\\b\\d+\\s+listings\\b/i.test(summary),
    hasWikiCount: /\\b\\d+\\s+wiki articles\\b/i.test(summary),
    hasSavedResultCount: /\\b\\d+\\s+saved\\b/i.test(countText),
    hasOfflineCanvas: Boolean(document.querySelector("#offline-map")),
    mapCanvasCount: document.querySelectorAll(".mapboxgl-canvas").length,
    visibleMediaCount: Array.from(document.querySelectorAll("img,video,audio,iframe,picture")).filter(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }).length,
    onlineOnlyVisible: Array.from(document.querySelectorAll("[data-requires-online]")).filter(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }).length,
  };
})()`);

const regions = [];
for (const region of ["west", "central", "east", "all"]) {
  const result = await evaluate(`new Promise(resolve => {
    const button = document.querySelector('[data-offline-region="${region}"]');
    if (!button) {
      resolve({ region: "${region}", missing: true });
      return;
    }
    button.click();
    setTimeout(() => {
      const cards = Array.from(document.querySelectorAll(".site-card[data-slug], .site-card[data-wiki-slug]"))
        .filter(card => !card.hidden && card.getBoundingClientRect().height > 0);
      resolve({
        region: "${region}",
        missing: false,
        active: button.getAttribute("aria-pressed") === "true",
        visibleCards: cards.length,
      });
    }, 400);
  })`);
  regions.push(result);
}

const search = await evaluate(`new Promise(resolve => {
  const input = document.querySelector("#search");
  if (!input) {
    resolve({ missing: true });
    return;
  }
  input.focus();
  input.value = "coopers";
  input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "coopers" }));
  setTimeout(() => {
    const cards = Array.from(document.querySelectorAll(".site-card[data-slug], .site-card[data-wiki-slug]"))
      .filter(card => !card.hidden);
    const match = cards.find(card => /Coopers Beach/i.test(card.textContent || ""));
    match?.click();
    setTimeout(() => {
      const detail = document.querySelector("#detail");
      resolve({
        missing: false,
        inputValue: input.value,
        resultCount: cards.length,
        found: Boolean(match),
        savedCount: document.querySelector("#result-count")?.textContent?.trim() || "",
        listText: (document.querySelector("#site-list")?.innerText || "").trim().slice(0, 220),
        detailOpen: Boolean(detail && !detail.hidden),
        detailTitle: document.querySelector("#detail-title")?.textContent?.trim() || "",
        detailTextLength: (document.querySelector("#detail-body")?.innerText || "").trim().length,
        detailVisibleMedia: detail
          ? Array.from(detail.querySelectorAll("img,video,audio,iframe,picture")).filter(element => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
            }).length
          : 0,
      });
    }, 500);
  }, 700);
})`);

socket.close();

const failures = [
  ...Object.entries(shell)
    .filter(([key, value]) => (
      ["offlineFlag", "offlineClass", "hasOfflineIndex", "hasListingCount", "hasWikiCount", "hasSavedResultCount", "hasOfflineCanvas"].includes(key) && value !== true
    ) || (
      ["mapCanvasCount", "visibleMediaCount", "onlineOnlyVisible"].includes(key) && value !== 0
    ) || (key === "regionButtons" && value !== 4))
    .map(([key, value]) => ({ key, value })),
  ...regions.filter(region => region.missing || !region.active || region.visibleCards < 1),
  ...(search.missing || !search.found || !search.detailOpen || !/Coopers Beach/i.test(search.detailTitle)
    || search.detailTextLength < 80 || search.detailVisibleMedia !== 0 ? [search] : []),
];

console.log(JSON.stringify({
  url: target.url,
  readiness,
  shell,
  regions,
  search,
  pass: failures.length === 0,
  failures,
}, null, 2));

if (failures.length) process.exitCode = 1;
