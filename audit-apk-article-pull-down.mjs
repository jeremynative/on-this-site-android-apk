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

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function swipe(start, end, steps = 8) {
  await evaluate(`(() => {
    const target = document.elementFromPoint(${start.x}, ${start.y});
    if (!target) return false;
    const point = (x, y) => new Touch({ identifier: 41, target, clientX: x, clientY: y, screenX: x, screenY: y, pageX: x, pageY: y, radiusX: 5, radiusY: 5, force: 1 });
    const dispatch = (type, touches, changedTouches) => target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches, targetTouches: touches, changedTouches }));
    const first = point(${start.x}, ${start.y});
    dispatch("touchstart", [first], [first]);
    for (let index = 1; index <= ${steps}; index += 1) {
      const progress = index / ${steps};
      const next = point(${start.x} + ((${end.x} - ${start.x}) * progress), ${start.y} + ((${end.y} - ${start.y}) * progress));
      dispatch("touchmove", [next], [next]);
    }
    const last = point(${end.x}, ${end.y});
    dispatch("touchend", [], [last]);
    return true;
  })()`);
  await wait(320);
}

const prepareArticle = () => evaluate(`(async () => {
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
  await wait(260);
  if (!window.NLI_NATIVE_MAP_BRIDGE?.openFeature?.("site", "mas-house")) return { error: "Native map bridge rejected the article." };
  const detail = document.querySelector("#detail");
  const body = document.querySelector("#detail-body");
  const ready = await waitFor(() => detail?.classList.contains("open")
    && detail.classList.contains("drawer-half")
    && !body?.querySelector(".detail-loading-status")
    && body?.querySelector("p")?.textContent.trim().length > 20, 20000);
  if (!ready) return { error: "The article did not reach its half-drawer state." };
  body.scrollTop = 0;
  await wait(80);
  const bodyRect = body.getBoundingClientRect();
  const paragraphRect = body.querySelector("p").getBoundingClientRect();
  const y = Math.min(bodyRect.bottom - 80, Math.max(bodyRect.top + 80, paragraphRect.top + Math.min(40, paragraphRect.height / 2)));
  return { x: bodyRect.left + (bodyRect.width * 0.5), y, bodyTop: bodyRect.top, bodyBottom: bodyRect.bottom, innerWidth: window.innerWidth, innerHeight: window.innerHeight, pixelRatio: window.devicePixelRatio };
})()`);

const snapshot = () => evaluate(`(() => {
  const detail = document.querySelector("#detail");
  const body = document.querySelector("#detail-body");
  return {
    open: Boolean(detail?.classList.contains("open")),
    collapsed: Boolean(detail?.classList.contains("drawer-collapsed")),
    half: Boolean(detail?.classList.contains("drawer-half")),
    expanded: Boolean(detail?.classList.contains("drawer-expanded")),
    height: detail?.getBoundingClientRect().height || 0,
    scrollTop: body?.scrollTop || 0,
    scrollHeight: body?.scrollHeight || 0,
    clientHeight: body?.clientHeight || 0,
    title: document.querySelector("#detail-title h2")?.textContent.trim() || "",
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio
  };
})()`);

if (process.env.GESTURE_MODE === "snapshot") {
  console.log(`APK article drawer snapshot: ${JSON.stringify(await snapshot())}`);
  socket.close();
  process.exit(0);
}

const first = await prepareArticle();
if (first?.error) throw new Error(first.error);
if (process.env.GESTURE_MODE === "prepare") {
  console.log(`APK article pull-down prepared: ${JSON.stringify(first)}`);
  socket.close();
  process.exit(0);
}
await swipe(first, { x: first.x, y: Math.min(first.bodyBottom - 12, first.y + 190) });
const collapsed = await snapshot();

socket.close();
const report = { first, collapsed };
const failures = [];
if (!collapsed.open || !collapsed.collapsed) failures.push("a moderate article-body pull did not collapse the drawer");
if (failures.length) throw new Error(`APK article pull-down audit failed: ${failures.join("; ")}\n${JSON.stringify(report)}`);
console.log(`APK article pull-down audit passed: ${JSON.stringify(report)}`);
