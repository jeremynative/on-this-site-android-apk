const endpoint = process.env.CDP_ENDPOINT || "http://127.0.0.1:9222/json";
const targets = await fetch(endpoint).then(response => response.json());
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
      await wait(40);
    }
    return null;
  };
  await waitFor(() => {
    const loading = document.querySelector("#loading-screen");
    return !loading || loading.hidden || getComputedStyle(loading).display === "none";
  }, 45000);
  document.querySelector("#mobile-startup-spotlight-close")?.click();
  document.querySelector("#close-detail")?.click();
  await wait(250);
  const opened = window.NLI_NATIVE_MAP_BRIDGE?.openFeature?.("site", "mas-house");
  if (!opened) return { error: "Native map bridge did not accept the test article." };
  const detail = document.querySelector("#detail");
  const body = document.querySelector("#detail-body");
  const ready = await waitFor(() => detail?.classList.contains("open")
    && !body?.querySelector(".detail-loading-status")
    && body?.querySelector(".article-sticky-hero")
    && body?.querySelector("p")?.textContent.trim().length > 20, 20000);
  if (!ready) return { error: "The image article did not finish rendering." };
  const hero = body.querySelector(".article-sticky-hero");
  const intro = body.querySelector("p");
  const heroHeight = hero.getBoundingClientRect().height;
  const threshold = Math.max(96, Math.round(heroHeight * 0.72));
  const sample = label => ({
    label,
    scrollTop: body.scrollTop,
    introTop: intro.getBoundingClientRect().top,
    heroInBody: body.contains(hero),
    heroDocked: Boolean(document.querySelector(".detail-hero-dock")?.contains(hero)),
    placeholderHeight: body.querySelector(".article-sticky-hero-placeholder")?.getBoundingClientRect().height || 0
  });
  body.scrollTop = 1;
  body.dispatchEvent(new Event("scroll"));
  await wait(260);
  const firstPixel = sample("first-pixel");
  body.scrollTop = threshold - 1;
  body.dispatchEvent(new Event("scroll"));
  await wait(260);
  const beforeDock = sample("before-dock");
  body.scrollTop = threshold + 1;
  body.dispatchEvent(new Event("scroll"));
  await wait(300);
  const afterDock = sample("after-dock");
  return {
    title: document.querySelector("#detail-title h2")?.textContent.trim() || "",
    heroHeight,
    threshold,
    introText: intro.textContent.trim().slice(0, 120),
    firstPixel,
    beforeDock,
    afterDock,
    dockIntroDelta: afterDock.introTop - beforeDock.introTop
  };
})()`);

socket.close();
if (report?.error) throw new Error(report.error);
const failures = [];
if (report.firstPixel?.heroDocked || !report.firstPixel?.heroInBody) failures.push("hero docked on the first scroll pixel");
if (report.beforeDock?.heroDocked || !report.beforeDock?.heroInBody) failures.push("hero docked before its threshold");
if (!report.afterDock?.heroDocked || report.afterDock?.heroInBody) failures.push("hero did not dock after its threshold");
if (Math.abs(report.afterDock?.placeholderHeight - report.heroHeight) > 1) failures.push("placeholder did not preserve hero height");
if (Math.abs(report.dockIntroDelta + 2) > 3) failures.push(`intro jumped during docking (${report.dockIntroDelta}px)`);
if (failures.length) throw new Error(`APK article intro scroll audit failed: ${failures.join("; ")}\n${JSON.stringify(report)}`);
console.log(`APK article intro scroll audit passed: ${JSON.stringify(report)}`);
