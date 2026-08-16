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
    const offline = document.body?.classList.contains("offline-text-mode");
    const firstResult = document.querySelector(".site-card[data-slug], .site-card[data-wiki-slug]");
    if (offline && firstResult) {
      resolve({ ready: true, elapsedMs: Date.now() - startedAt });
      return;
    }
    if (Date.now() - startedAt >= 30000) {
      resolve({ ready: false, elapsedMs: Date.now() - startedAt, offline, firstResult: Boolean(firstResult) });
      return;
    }
    setTimeout(check, 200);
  };
  check();
})`);
if (!readiness.ready) {
  throw new Error(`Offline APK archive did not become interactive: ${JSON.stringify(readiness)}`);
}

const result = await evaluate(`(() => {
  const bridgeValue = name => {
    try {
      return Math.max(0, Number(window.AndroidApp?.[name]?.()) || 0);
    } catch {
      return 0;
    }
  };
  const cssValue = name => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    const values = String(raw || "").match(/-?\\d+(?:\\.\\d+)?px/g) || [];
    return Math.max(0, ...values.map(value => Number.parseFloat(value)).filter(Number.isFinite));
  };
  const native = {
    top: bridgeValue("getSafeInsetTop"),
    right: bridgeValue("getSafeInsetRight"),
    bottom: bridgeValue("getSafeInsetBottom"),
    left: bridgeValue("getSafeInsetLeft")
  };
  const appSafe = {
    top: cssValue("--app-top-safe"),
    right: cssValue("--app-right-safe"),
    bottom: cssValue("--app-bottom-safe"),
    left: cssValue("--app-left-safe")
  };
  const safe = {
    left: appSafe.left,
    top: appSafe.top,
    right: innerWidth - appSafe.right,
    bottom: innerHeight - appSafe.bottom
  };
  const app = document.querySelector(".app");
  const appStyle = getComputedStyle(app);
  const firstResult = document.querySelector(".site-card[data-slug], .site-card[data-wiki-slug]");
  firstResult?.click();
  const detail = document.querySelector("#detail:not([hidden])");
  const card = detail?.querySelector(".detail-card");
  const close = detail?.querySelector(".detail-close");
  const detailRect = detail?.getBoundingClientRect();
  const cardRect = card?.getBoundingClientRect();
  const closeRect = close?.getBoundingClientRect();
  const closeCenter = closeRect
    ? [closeRect.left + closeRect.width / 2, closeRect.top + closeRect.height / 2]
    : null;
  const closeHit = closeCenter ? document.elementFromPoint(...closeCenter) : null;
  return {
    url: location.href,
    viewport: [innerWidth, innerHeight],
    screen: [screen.width, screen.height],
    native,
    appSafe,
    safe,
    appPadding: {
      top: Number.parseFloat(appStyle.paddingTop) || 0,
      right: Number.parseFloat(appStyle.paddingRight) || 0,
      bottom: Number.parseFloat(appStyle.paddingBottom) || 0,
      left: Number.parseFloat(appStyle.paddingLeft) || 0
    },
    detail: {
      open: Boolean(detail),
      bounds: detailRect ? [detailRect.left, detailRect.top, detailRect.right, detailRect.bottom].map(Math.round) : null,
      cardBounds: cardRect ? [cardRect.left, cardRect.top, cardRect.right, cardRect.bottom].map(Math.round) : null,
      closeBounds: closeRect ? [closeRect.left, closeRect.top, closeRect.right, closeRect.bottom].map(Math.round) : null,
      closeHit: Boolean(closeHit && close && (closeHit === close || close.contains(closeHit))),
      safe: Boolean(detailRect && cardRect && closeRect
        && detailRect.left >= safe.left - 1
        && detailRect.top >= safe.top - 1
        && detailRect.right <= safe.right + 1
        && detailRect.bottom <= safe.bottom + 1
        && cardRect.left >= safe.left - 1
        && cardRect.right <= safe.right + 1
        && cardRect.bottom <= safe.bottom + 1
        && closeRect.left >= safe.left - 1
        && closeRect.top >= safe.top - 1
        && closeRect.right <= safe.right + 1
        && closeRect.bottom <= safe.bottom + 1)
    }
  };
})()`);

socket.close();

const landscape = result.viewport[0] > result.viewport[1];
const bridgeInsetsValid = landscape
  ? result.native.top > 0 && (result.native.right > 0 || result.native.bottom > 0 || result.native.left > 0)
  : result.native.top > 0 && result.native.bottom > 0;
const viewportExclusion = {
  horizontal: Math.max(0, result.screen[0] - result.viewport[0]),
  vertical: Math.max(0, result.screen[1] - result.viewport[1])
};
// Some WebView/device combinations are laid out inside the system bars, so
// Android correctly reports zero content insets. In that mode the excluded
// screen area is the safety boundary and adding CSS padding would double it.
const viewportAlreadyInset = viewportExclusion.horizontal >= 20 || viewportExclusion.vertical >= 20;
const nativeInsetsValid = bridgeInsetsValid || viewportAlreadyInset;
const propagated = ["top", "right", "bottom", "left"]
  .every(side => result.appSafe[side] + 0.5 >= result.native[side]);
const padded = ["top", "right", "bottom", "left"]
  .every(side => result.appPadding[side] + 0.5 >= result.appSafe[side]);
const pass = nativeInsetsValid && propagated && padded && result.detail.open && result.detail.safe && result.detail.closeHit;

console.log(JSON.stringify({
  targetUrl: target.url,
  readiness,
  landscape,
  bridgeInsetsValid,
  viewportAlreadyInset,
  viewportExclusion,
  nativeInsetsValid,
  propagated,
  padded,
  ...result,
  pass,
}, null, 2));

if (!pass) process.exitCode = 1;
