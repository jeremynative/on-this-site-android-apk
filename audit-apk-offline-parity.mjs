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

const result = await evaluate(`new Promise(resolve => {
  const startedAt = Date.now();
  const wait = () => {
    if (document.querySelector('.site-card[data-slug],.site-card[data-wiki-slug]')) {
      resolve((async () => {
        const frame = () => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
        const rect = element => {
          const value = element?.getBoundingClientRect();
          return value ? { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height } : null;
        };
        const app = document.querySelector('.offline-shell');
        const header = app.querySelector('header');
        const map = document.querySelector('#offline-map-section');
        const tabs = document.querySelector('.mobile-view-tabs');
        const panel = document.querySelector('#offline-archive-section');
        const mapTab = document.querySelector('#offline-tab-map');
        const savedTab = document.querySelector('#offline-tab-saved');
        const collapse = document.querySelector('#offline-collapse');
        const full = document.querySelector('#offline-full');
        const search = document.querySelector('#search');
        const status = document.querySelector('#status');
        const landscape = innerWidth > innerHeight;
        const initial = { header: rect(header), map: rect(map), tabs: rect(tabs), panel: rect(panel) };
        const sharedStylesheet = [...document.styleSheets].some(sheet => String(sheet.href || '').endsWith('/assets/css/mobile-app.css'));
        const fixedViewport = document.documentElement.scrollWidth <= innerWidth + 1
          && document.body.scrollWidth <= innerWidth + 1
          && document.documentElement.scrollHeight <= innerHeight + 1
          && document.body.scrollHeight <= innerHeight + 1;
        const stacked = initial.header.bottom <= initial.map.top + 1
          && initial.map.bottom <= initial.tabs.top + 1
          && initial.tabs.bottom <= initial.panel.top + 1;
        const split = initial.header.right <= initial.panel.left + 1
          && initial.map.right <= initial.panel.left + 1
          && initial.panel.bottom <= initial.tabs.top + 1;

        collapse.click();
        await frame();
        const collapsed = {
          classSet: app.classList.contains('panel-collapsed'),
          panel: rect(panel),
          map: rect(map),
          label: collapse.textContent.trim(),
        };

        savedTab.click();
        await frame();
        const restored = {
          collapsed: app.classList.contains('panel-collapsed'),
          panel: rect(panel),
          savedPressed: savedTab.getAttribute('aria-pressed'),
        };

        full.click();
        await frame();
        const maximized = {
          classSet: app.classList.contains('panel-maximized'),
          header: rect(header),
          map: rect(map),
          panel: rect(panel),
          expanded: full.getAttribute('aria-expanded'),
        };
        full.click();
        await frame();

        const west = document.querySelector('[data-offline-region="west"]');
        west.click();
        await frame();
        const region = {
          pressed: west.getAttribute('aria-pressed'),
          status: status.textContent.trim(),
        };
        document.querySelector('[data-offline-region="all"]').click();

        search.focus();
        search.value = "ma's";
        search.dispatchEvent(new Event('input', { bubbles: true }));
        await frame();
        const searchTitle = document.querySelector('.learning-card h2')?.textContent?.trim() || '';
        const suggestions = document.querySelector('#search-suggestions');
        const searchState = {
          value: search.value,
          count: document.querySelector('#result-count')?.textContent?.trim() || '',
          titles: [...document.querySelectorAll('.learning-card h2')].slice(0, 5).map(item => item.textContent.trim()),
          suggestionsVisible: Boolean(suggestions && !suggestions.hidden),
          suggestionTitles: [...(suggestions?.querySelectorAll('strong') || [])].map(item => item.textContent.trim()),
          suggestionSubtitles: [...(suggestions?.querySelectorAll('span') || [])].map(item => item.textContent.trim()),
        };
        search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        await frame();
        searchState.keyboardSubmitMaximized = app.classList.contains('panel-maximized');
        searchState.suggestionsDismissed = Boolean(suggestions?.hidden);
        full.click();
        await frame();
        search.value = '';
        search.dispatchEvent(new Event('input', { bubbles: true }));
        await frame();

        document.querySelector('[data-result-open]')?.click();
        await frame();
        const detail = document.querySelector('#detail:not([hidden])');
        const close = detail?.querySelector('.detail-close');
        const closeRect = rect(close);
        const closeHit = closeRect ? document.elementFromPoint(closeRect.left + closeRect.width / 2, closeRect.top + closeRect.height / 2) : null;
        const drawer = {
          open: Boolean(detail?.classList.contains('open')),
          bounds: rect(detail),
          closeText: close?.textContent?.trim() || '',
          closeHit: Boolean(close && closeHit && (closeHit === close || close.contains(closeHit))),
        };
        close?.click();
        await frame();
        drawer.closed = detail?.hidden === true && !detail?.classList.contains('open');

        return {
          url: location.href,
          viewport: [innerWidth, innerHeight],
          landscape,
          sharedStylesheet,
          fixedViewport,
          stacked,
          split,
          layoutValid: landscape ? split : stacked,
          initial,
          collapsed,
          restored,
          maximized,
          region,
          searchTitle,
          searchState,
          drawer,
          lowercaseClose: document.querySelector('.detail-close')?.textContent?.trim() === 'x',
          hasOnlineShellStructure: Boolean(document.querySelector('.title-row .offline-pill')
            && document.querySelector('.search-autocomplete .search')
            && document.querySelector('.quick-actions')
            && document.querySelector('.mobile-map-shell')
            && document.querySelector('.mobile-view-tabs')
            && document.querySelector('.list-panel .learning-card')),
        };
      })());
      return;
    }
    if (Date.now() - startedAt > 30000) {
      resolve({ timeout: true });
      return;
    }
    setTimeout(wait, 200);
  };
  wait();
})`);

socket.close();

const pass = !result.timeout
  && result.sharedStylesheet
  && result.fixedViewport
  && result.layoutValid
  && result.hasOnlineShellStructure
  && result.lowercaseClose
  && result.collapsed.classSet
  && result.collapsed.panel.height === 0
  && (result.landscape
    ? result.collapsed.map.width > result.initial.map.width
    : result.collapsed.map.height > result.initial.map.height)
  && result.collapsed.label === "Open"
  && !result.restored.collapsed
  && result.restored.panel.height > 0
  && result.restored.savedPressed === "true"
  && result.maximized.classSet
  && (result.landscape
    ? result.maximized.header.height <= 12 && result.maximized.map.height > 0 && result.maximized.map.height <= 60
    : result.maximized.header.height === 0 && result.maximized.map.height === 0)
  && (result.landscape
    ? result.maximized.panel.width > result.initial.panel.width
    : result.maximized.panel.height > result.initial.panel.height)
  && result.maximized.expanded === "true"
  && result.region.pressed === "true"
  && /in this area$/i.test(result.region.status)
  && /ma's house/i.test(result.searchTitle)
  && (result.landscape || (
    result.searchState.suggestionsVisible
    && result.searchState.suggestionTitles.some(title => /ma's house/i.test(title))
    && result.searchState.suggestionSubtitles[0] === "Community Resource"
  ))
  && result.searchState.keyboardSubmitMaximized
  && result.searchState.suggestionsDismissed
  && result.drawer.open
  && result.drawer.closeText === "x"
  && result.drawer.closeHit
  && result.drawer.closed;

console.log(JSON.stringify({ targetUrl: target.url, ...result, pass }, null, 2));
if (!pass) process.exitCode = 1;
