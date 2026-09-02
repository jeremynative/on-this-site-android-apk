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

  const styleOf = element => element ? {
    tag: element.tagName,
    text: element.textContent.trim().slice(0, 80),
    fontSize: getComputedStyle(element).fontSize,
    lineHeight: getComputedStyle(element).lineHeight,
    marginTop: getComputedStyle(element).marginTop,
    marginBottom: getComputedStyle(element).marginBottom,
    padding: getComputedStyle(element).padding,
  } : null;

  const sample = async (kind, slug) => {
    document.querySelector("#close-detail")?.click();
    await wait(400);
    let accepted = Boolean(window.NLI_NATIVE_MAP_BRIDGE?.openFeature?.(kind, slug));
    if (!accepted) {
      const search = document.querySelector("#search");
      if (search) {
        search.value = kind === "site" ? "William Floyd Estate" : "Sunksqua Weany";
        search.dispatchEvent(new Event("input", { bubbles: true }));
        search.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
        await wait(700);
        const selector = kind === "site" ? '.site-card[data-slug="' + slug + '"]' : '.site-card[data-wiki-slug="' + slug + '"]';
        const card = document.querySelector(selector);
        card?.click();
        accepted = Boolean(card);
      }
    }
    const openedAt = performance.now();
    while (accepted && performance.now() - openedAt < 15000) {
      const scope = document.querySelector("#detail-body.content-entry-body");
      if (scope?.querySelector(".section-content p")) break;
      await wait(100);
    }
    const scope = document.querySelector("#detail-body.content-entry-body");
    const headings = Array.from(scope?.querySelectorAll(".section-content h1,.section-content h2,.section-content h3,.section-content h4") || []);
    const actions = Array.from(scope?.querySelectorAll("button.action,a.action") || []);
    return {
      kind,
      slug,
      accepted: Boolean(accepted),
      scopeClass: scope?.className || "",
      paragraph: styleOf(scope?.querySelector(".section-content p")),
      headings: headings.slice(0, 4).map(styleOf),
      actions: actions.slice(0, 8).map(styleOf),
      hasRedundantSectionsHeading: Array.from(scope?.querySelectorAll("h3") || []).some(element => element.textContent.trim() === "Sections"),
      hasStaleCheckinCopy: /Check in nearby|Checked In!/.test(scope?.innerText || ""),
    };
  };

  return {
    viewport: [innerWidth, innerHeight],
    runtime: {
      readyState: document.readyState,
      bridgeType: typeof window.NLI_NATIVE_MAP_BRIDGE,
      loadingText: document.querySelector("#loading-screen")?.innerText?.slice(0, 200) || "",
      bodyText: document.body.innerText.slice(0, 500),
      scripts: Array.from(document.scripts).map(script => script.src).filter(Boolean).slice(-5),
    },
    rows: [
      await sample("site", "william-floyd-estate"),
      await sample("wiki", "sunksqua-weany-pametsechs"),
    ],
  };
})()`);

socket.close();
console.log(JSON.stringify(report, null, 2));

for (const row of report?.rows || []) {
  if (!row.accepted || !row.scopeClass.includes("content-entry-body") || !row.paragraph) {
    throw new Error(`Content panel did not render through the shared formatting layer: ${JSON.stringify(row)}`);
  }
  if (row.paragraph.fontSize !== "15px" || row.paragraph.lineHeight !== "23.25px") {
    throw new Error(`Content paragraph typography is inconsistent: ${JSON.stringify(row.paragraph)}`);
  }
  for (const heading of row.headings) {
    const expectedSize = heading.tag === "H1" || heading.tag === "H2" ? "18px" : heading.tag === "H3" ? "16px" : "15px";
    if (heading.fontSize !== expectedSize) throw new Error(`Content heading typography is inconsistent: ${JSON.stringify(heading)}`);
  }
  for (const action of row.actions.filter(item => !item.text.startsWith("i"))) {
    if (action.fontSize !== "13px") throw new Error(`Content action typography is inconsistent: ${JSON.stringify(action)}`);
  }
  if (row.hasRedundantSectionsHeading || row.hasStaleCheckinCopy) {
    throw new Error(`Content panel retained redundant or stale copy: ${JSON.stringify(row)}`);
  }
}
