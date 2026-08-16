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

const readiness = await evaluate(`new Promise(resolve => {
  const startedAt = Date.now();
  const check = () => {
    const loading = document.querySelector("#loading-screen");
    const visible = Boolean(loading && !loading.hidden && getComputedStyle(loading).display !== "none");
    const status = document.querySelector(".mobile-header-instruction")?.textContent || "";
    const counts = status.match(/(\\d+)\\s+listings,\\s*(\\d+)\\s+wiki articles[\\s\\S]*loaded\\./i);
    const ready = !visible && Number(counts?.[1] || 0) > 0 && Number(counts?.[2] || 0) > 0;
    if (ready || Date.now() - startedAt > 45000) return resolve({ ready, elapsedMs: Date.now() - startedAt, status });
    setTimeout(check, 200);
  };
  check();
})`);
if (!readiness.ready) throw new Error(`APK search test could not reach the loaded archive: ${JSON.stringify(readiness)}`);

const result = await evaluate(`(async () => {
  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  document.querySelector("#mobile-startup-spotlight-close")?.click();
  document.querySelector("#close-detail")?.click();
  if (document.querySelector(".app")?.classList.contains("panel-maximized")) {
    document.querySelector("#mobile-panel-size-toggle")?.click();
    await wait(180);
  }
  const input = document.querySelector("#search");
  const suggestions = document.querySelector("#search-suggestions");
  if (!input || !suggestions) return { error: "Search controls are missing." };
  const setQuery = async value => {
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { key: value.slice(-1), bubbles: true }));
    await wait(260);
    return [...suggestions.querySelectorAll("[data-search-suggestion]")].map(button => button.textContent.trim().replace(/\\s+/g, " "));
  };
  const steps = [];
  for (const query of ["m", "ma", "mas", "ma's"]) steps.push({ query, suggestions: await setQuery(query) });
  const lois = await setQuery("lois hunter");
  await setQuery("ma's house");
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
  await wait(750);
  const title = document.querySelector(".list-head .list-title strong")?.textContent?.trim() || "";
  const listText = document.querySelector("#site-list")?.textContent?.replace(/\\s+/g, " ").trim() || "";
  const submittedValue = input.value;
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.blur();
  return { steps, lois, title, listText: listText.slice(0, 800), submittedValue };
})()`);

socket.close();

if (result.error) throw new Error(result.error);
console.log(JSON.stringify({ diagnostic: result }, null, 2));
const masStep = result.steps.find(step => step.query === "mas");
if (!masStep?.suggestions.some(text => /ma['’]s house/i.test(text))) throw new Error("Typing mas did not suggest Ma's House.");
if (!/ma['’]s house/i.test(masStep.suggestions[0] || "")) throw new Error("Ma's House was not the first project suggestion for mas.");
if (!result.lois.some(text => /lois/i.test(text))) throw new Error("Multi-term typing did not suggest the Lois Hunter article.");
if (result.title !== "Search results" || !/ma['’]s house/i.test(result.listText)) throw new Error("Android keyboard submission did not open Ma's House search results.");

console.log(JSON.stringify({
  url: target.url,
  readiness,
  progression: result.steps.map(step => ({ query: step.query, first: step.suggestions[0] || "", count: step.suggestions.length })),
  loisFirst: result.lois[0] || "",
  mapStableWhileTyping: "covered by source regression verifier",
  submittedTitle: result.title,
  submittedValue: result.submittedValue,
  pass: true
}, null, 2));
