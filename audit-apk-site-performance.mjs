const targets = await fetch(process.env.CDP_ENDPOINT || "http://127.0.0.1:9222/json").then(response => response.json());
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

const report = await evaluate(`(async () => {
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  const waitFor = async (test, timeout = 15000) => {
    const startedAt = performance.now();
    while (performance.now() - startedAt < timeout) {
      const value = test();
      if (value) return value;
      await wait(25);
    }
    return null;
  };
  const loading = document.querySelector("#loading-screen");
  await waitFor(() => {
    const loaderHidden = !loading || loading.hidden || getComputedStyle(loading).display === "none";
    const status = document.querySelector(".mobile-header-instruction")?.textContent || "";
    return loaderHidden && /\\d+\\s+listings[\\s\\S]*loaded/i.test(status);
  }, 45000);
  document.querySelector("#mobile-startup-spotlight-close")?.click();
  document.querySelector("#close-detail")?.click();
  if (document.querySelector(".app")?.classList.contains("panel-maximized")) {
    document.querySelector("#mobile-panel-size-toggle")?.click();
    await wait(180);
  }
  const input = document.querySelector("#search");
  const suggestions = document.querySelector("#search-suggestions");
  const siteList = document.querySelector("#site-list");
  const detail = document.querySelector("#detail");
  const detailBody = document.querySelector("#detail-body");
  const detailTitle = document.querySelector("#detail-title");
  if (!input || !suggestions || !siteList || !detail || !detailBody || !detailTitle) return { error: "Required site controls are missing." };

  const openSite = async ({ title, slug }) => {
    input.blur();
    document.querySelector("#close-detail")?.click();
    await wait(560);
    performance.clearResourceTimings();
    const map = document.querySelector("#map");
    const layoutSnapshot = () => {
      const tabs = document.querySelector(".mobile-view-tabs");
      const tabsRect = tabs?.getBoundingClientRect();
      const header = document.querySelector(".app > header");
      const headerRect = header?.getBoundingClientRect();
      const headerChildren = header ? [...header.children].map(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { className: element.className, display: style.display, hidden: element.hidden, top: rect.top, height: rect.height };
      }) : [];
      return {
        innerHeight: window.innerHeight,
        visualHeight: window.visualViewport?.height || 0,
        mapHeightVariable: getComputedStyle(document.documentElement).getPropertyValue("--map-height"),
        bodyClass: document.body.className,
        appClass: document.querySelector(".app")?.className || "",
        tabsDisplay: tabs ? getComputedStyle(tabs).display : "",
        tabsRect: tabsRect ? { top: tabsRect.top, height: tabsRect.height } : null,
        headerRect: headerRect ? { top: headerRect.top, height: headerRect.height } : null,
        headerChildren
      };
    };
    const layoutBefore = layoutSnapshot();
    const beforeRect = map?.getBoundingClientRect();
    const rectSamples = [];
    const rectTimer = window.setInterval(() => {
      const rect = map?.getBoundingClientRect();
      if (rect) rectSamples.push({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }, 16);
    const startedAt = performance.now();
    const opened = window.NLI_NATIVE_MAP_BRIDGE?.openFeature?.("site", slug);
    if (!opened) return { title, error: "Native map bridge did not accept the site." };
    const shell = await waitFor(() => {
      const value = detailTitle.querySelector("h2")?.textContent?.trim() || "";
      return detail.classList.contains("open") && value.toLowerCase().includes(title.toLowerCase()) ? value : "";
    }, 3000);
    const shellMs = performance.now() - startedAt;
    const complete = await waitFor(() => !detailBody.querySelector(".detail-loading-status") && detailBody.textContent.trim().length > 180, 15000);
    const completeMs = performance.now() - startedAt;
    await wait(640);
    window.clearInterval(rectTimer);
    const resources = performance.getEntriesByType("resource")
      .filter(entry => entry.startTime >= startedAt - 5)
      .map(entry => ({
        name: String(entry.name).replace(/^https?:\\/\\/[^/]+/, ""),
        durationMs: Math.round(entry.duration),
        transferSize: entry.transferSize || 0
      }));
    const hero = detailBody.querySelector("img.hero, .site-hero-carousel img");
    const mapRect = map?.getBoundingClientRect();
    const mapRectMaxDelta = beforeRect ? Math.max(0, ...rectSamples.flatMap(rect => [
      Math.abs(rect.top - beforeRect.top),
      Math.abs(rect.left - beforeRect.left),
      Math.abs(rect.width - beforeRect.width),
      Math.abs(rect.height - beforeRect.height)
    ])) : null;
    return {
      title,
      shell,
      shellMs: Math.round(shellMs),
      complete: Boolean(complete),
      completeMs: Math.round(completeMs),
      textLength: detailBody.textContent.trim().length,
      heroReady: !hero || (hero.complete && hero.naturalWidth > 0),
      mapVisible: Boolean(mapRect && mapRect.width > 100 && mapRect.height > 100),
      mapRectMaxDelta: mapRectMaxDelta == null ? null : Math.round(mapRectMaxDelta * 10) / 10,
      mapRectBefore: beforeRect ? { top: Math.round(beforeRect.top * 10) / 10, left: Math.round(beforeRect.left * 10) / 10, width: Math.round(beforeRect.width * 10) / 10, height: Math.round(beforeRect.height * 10) / 10 } : null,
      mapRectAfter: mapRect ? { top: Math.round(mapRect.top * 10) / 10, left: Math.round(mapRect.left * 10) / 10, width: Math.round(mapRect.width * 10) / 10, height: Math.round(mapRect.height * 10) / 10 } : null,
      layoutBefore,
      layoutAfter: layoutSnapshot(),
      resources
    };
  };

  const openWiki = async ({ title, slug }) => {
    document.querySelector("#close-detail")?.click();
    await wait(260);
    performance.clearResourceTimings();
    const map = document.querySelector("#map");
    const beforeRect = map?.getBoundingClientRect();
    const rectSamples = [];
    const rectTimer = window.setInterval(() => {
      const rect = map?.getBoundingClientRect();
      if (rect) rectSamples.push({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }, 16);
    const startedAt = performance.now();
    const opened = window.NLI_NATIVE_MAP_BRIDGE?.openFeature?.("wiki", slug);
    if (!opened) return { title, error: "Native map bridge did not accept the knowledgebase article." };
    const shell = await waitFor(() => {
      const value = detailTitle.querySelector("h2")?.textContent?.trim() || "";
      return detail.classList.contains("open") && value.toLowerCase().includes(title.toLowerCase()) ? value : "";
    }, 3000);
    const shellMs = performance.now() - startedAt;
    const complete = await waitFor(() => !detailBody.querySelector(".detail-loading-status") && detailBody.textContent.trim().length > 180, 15000);
    const completeMs = performance.now() - startedAt;
    await wait(320);
    window.clearInterval(rectTimer);
    const mapRect = map?.getBoundingClientRect();
    const mapRectMaxDelta = beforeRect ? Math.max(0, ...rectSamples.flatMap(rect => [
      Math.abs(rect.top - beforeRect.top),
      Math.abs(rect.left - beforeRect.left),
      Math.abs(rect.width - beforeRect.width),
      Math.abs(rect.height - beforeRect.height)
    ])) : null;
    return {
      title,
      shell,
      shellMs: Math.round(shellMs),
      complete: Boolean(complete),
      completeMs: Math.round(completeMs),
      textLength: detailBody.textContent.trim().length,
      mapVisible: Boolean(mapRect && mapRect.width > 100 && mapRect.height > 100),
      mapRectMaxDelta: mapRectMaxDelta == null ? null : Math.round(mapRectMaxDelta * 10) / 10,
      resources: performance.getEntriesByType("resource")
        .filter(entry => entry.startTime >= startedAt - 5)
        .map(entry => ({
          name: String(entry.name).replace(/^https?:\\/\\/[^/]+/, ""),
          durationMs: Math.round(entry.duration),
          transferSize: entry.transferSize || 0
        }))
    };
  };

  const rows = [];
  for (const site of [
    { title: "Ma's House", slug: "mas-house" },
    { title: "Shinnecock Presbyterian Church", slug: "shinnecock-presbyterian-church" },
    { title: "Coopers Beach", slug: "coopers-beach-shinnecock-access" }
  ]) {
    rows.push(await openSite(site));
  }
  rows.push(await openSite({ title: "Ma's House", slug: "mas-house" }));
  const wikiRows = [];
  for (const wiki of [
    { title: "Sunksqua Weany", slug: "sunksqua-weany-pametsechs" },
    { title: "Elizabeth Thunder Bird Haile", slug: "elizabeth-thunder-bird-haile-shinnecock" },
    { title: "Sachem Tackapousha", slug: "sachem-tackapousha" },
    { title: "Wyandanch", slug: "wyandanch" }
  ]) {
    wikiRows.push(await openWiki(wiki));
  }
  return { href: location.href, rows, wikiRows };
})()`);

socket.close();
if (report?.error) throw new Error(report.error);
console.log(JSON.stringify({
  href: report.href,
  sites: (report.rows || []).map(row => ({
    title: row.title,
    shellMs: row.shellMs,
    completeMs: row.completeMs,
    mapRectMaxDelta: row.mapRectMaxDelta
  })),
  biographies: (report.wikiRows || []).map(row => ({
    title: row.title,
    shellMs: row.shellMs,
    completeMs: row.completeMs,
    mapRectMaxDelta: row.mapRectMaxDelta,
    detailResources: (row.resources || []).map(resource => resource.name).filter(name => /wiki-details|wiki_articles/.test(name))
  }))
}, null, 2));
for (const row of report.rows || []) {
  if (row.error || !row.shell || !row.complete || !row.mapVisible || Number(row.mapRectMaxDelta || 0) > 1) {
    throw new Error(`Site-open audit failed: ${JSON.stringify(row)}`);
  }
}
for (const row of report.wikiRows || []) {
  const resources = row.resources || [];
  const usedBundledDetail = resources.some(resource => /\/assets\/data\/wiki-details\/wiki-/.test(resource.name));
  const usedDirectusDetail = resources.some(resource => /\/items\/wiki_articles/.test(resource.name));
  if (row.error || !row.shell || !row.complete || !row.mapVisible || Number(row.mapRectMaxDelta || 0) > 1
      || row.completeMs > 1200 || !usedBundledDetail || usedDirectusDetail) {
    throw new Error(`Knowledgebase-open audit failed: ${JSON.stringify(row)}`);
  }
}
