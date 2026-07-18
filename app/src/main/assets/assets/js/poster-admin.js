(function () {
  const DIRECTUS = "https://directus.nativelongisland.com";
  const STORAGE_KEY = "nli-poster-session";
  const COOKIE_SESSION_TOKEN = "__poster_cookie_session__";
  const ENDPOINT = "/poster/poster-action.php";
  const PLATFORM_LABELS = {
    facebook: "Facebook",
    instagram: "Instagram",
    instagram_story: "Stories",
    twitter: "X / Twitter",
    threads: "Threads",
    bluesky: "Bluesky",
    mastodon: "Mastodon",
    webhook: "Webhook"
  };

  const state = {
    token: "",
    refreshToken: "",
    user: null,
    posts: [],
    logs: [],
    accounts: [],
    calendar: [],
    metaStorage: null,
    activePostId: "",
    activeCalendarId: "",
    filter: "",
    activeTab: "queue",
    calendarMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    loginBusy: false,
    sessionVersion: 0
  };

  const $ = selector => document.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function formatMonthTitle(date) {
    return date.toLocaleString([], { month: "long", year: "numeric" });
  }

  function toDateTimeLocal(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function fromDateTimeLocal(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  function platformLabels(platforms = []) {
    return (platforms || []).map(platform => PLATFORM_LABELS[platform] || platform).join(", ") || "No platform selected";
  }

  function calendarMediaUrls(entry = {}) {
    const urls = [];
    const add = url => {
      const clean = String(url || "").trim();
      if (!clean || urls.includes(clean)) return;
      urls.push(clean);
    };
    const raw = entry.media_urls;
    if (Array.isArray(raw)) {
      raw.forEach(add);
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) parsed.forEach(add);
        } catch {
          trimmed.split(/[\n,]+/).forEach(add);
        }
      } else {
        trimmed.split(/[\n,]+/).forEach(add);
      }
    }
    add(entry.image_url);
    return urls.slice(0, 10);
  }

  function calendarEntryPreview(entry = {}) {
    const media = calendarMediaUrls(entry);
    return [
      entry.title,
      media.length ? `${media.length} carousel image${media.length === 1 ? "" : "s"}` : "",
      entry.caption,
      entry.notes
    ].filter(Boolean).join("\n\n").slice(0, 420);
  }

  function calendarEntriesForDay(month, day) {
    return state.calendar.filter(entry => Number(entry.month) === Number(month) && Number(entry.day) === Number(day));
  }

  function datePartsForCalendar() {
    const date = state.calendarMonth;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      firstWeekday: new Date(date.getFullYear(), date.getMonth(), 1).getDay(),
      days: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    };
  }

  function connectionStatusLabel(status = "") {
    return String(status || "disconnected").replace(/_/g, " ");
  }

  function accountCapabilities(capabilities = []) {
    if (!Array.isArray(capabilities) || !capabilities.length) return "No enabled uses selected";
    const labels = {
      feed: "Feed posts",
      story: "Stories",
      media: "Media uploads",
      link: "Link posts"
    };
    return capabilities.map(item => labels[item] || item).join(", ");
  }

  function safeAccountUrl(value = "") {
    const url = String(value || "").trim();
    return /^https?:\/\//i.test(url) ? url : "";
  }

  function showView(name) {
    $$("[data-view]").forEach(view => {
      view.hidden = view.dataset.view !== name;
    });
  }

  function setText(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value || "";
  }

  function wait(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  function encodeSessionCookie(value) {
    try {
      return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch {
      return "";
    }
  }

  function decodeSessionCookie(value) {
    try {
      const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
      return decodeURIComponent(escape(atob(padded)));
    } catch {
      return "";
    }
  }

  function getCookie(name) {
    const prefix = `${name}=`;
    return document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith(prefix))?.slice(prefix.length) || "";
  }

  function storageGet(storage) {
    try {
      return storage.getItem(STORAGE_KEY);
    } catch {
      return "";
    }
  }

  function storageRemove(storage) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {}
  }

  function setSessionCookie(payload) {
    const encoded = encodeSessionCookie(payload);
    if (encoded) {
      document.cookie = `nli_poster_session=${encoded}; Max-Age=604800; Path=/; SameSite=Lax; Secure`;
    }
  }

  function clearSessionCookie() {
    document.cookie = "nli_poster_session=; Max-Age=0; Path=/; SameSite=Lax; Secure";
  }

  function timeoutError(message, timeoutMs, onTimeout = () => {}) {
    let timer = null;
    const promise = new Promise((resolve, reject) => {
      timer = window.setTimeout(() => {
        onTimeout();
        reject(new Error(message));
      }, timeoutMs);
    });
    return { promise, cancel: () => timer && window.clearTimeout(timer) };
  }

  async function withTimeout(promise, message, timeoutMs, onTimeout = () => {}) {
    const timeout = timeoutError(message, timeoutMs, onTimeout);
    try {
      return await Promise.race([promise, timeout.promise]);
    } finally {
      timeout.cancel();
    }
  }

  function retryDelayFrom(response, body, attempt = 0) {
    const header = Number(response?.headers?.get?.("retry-after") || 0);
    if (Number.isFinite(header) && header > 0) return Math.min(header * 1000, 8000);
    const message = String(body?.errors?.[0]?.message || body?.error || "");
    const match = message.match(/retry after\s+(\d+)\s*ms/i);
    if (match) return Math.min(Number(match[1]) + 250, 8000);
    return Math.min(900 + attempt * 850, 8000);
  }

  function loadSession() {
    if (window.NLI_POSTER_AUTHENTICATED) {
      state.token = COOKIE_SESSION_TOKEN;
      state.user = { email: window.NLI_POSTER_AUTH_SOURCE || "php-session" };
      return;
    }
    const cookieSession = decodeSessionCookie(getCookie("nli_poster_session"));
    const candidates = [
      ["session", storageGet(sessionStorage)],
      ["local", storageGet(localStorage)],
      ["cookie", cookieSession]
    ];
    for (const [source, raw] of candidates) {
      if (!raw) continue;
      let saved = null;
      try {
        saved = JSON.parse(raw);
      } catch {
        if (source === "session") storageRemove(sessionStorage);
        if (source === "local") storageRemove(localStorage);
        if (source === "cookie") clearSessionCookie();
        continue;
      }
      if (saved?.token) {
        state.token = saved.token;
        state.refreshToken = saved.refreshToken || "";
        state.user = saved.user || null;
        return;
      }
    }
    if (getCookie("nli_poster_session")) {
      state.token = COOKIE_SESSION_TOKEN;
      state.user = { email: "server-cookie" };
    }
  }

  function describeStoredSession() {
    const parts = [];
    for (const [source, storage] of [["session", sessionStorage], ["local", localStorage]]) {
      try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) {
          parts.push(`${source}: empty`);
          continue;
        }
        try {
          const parsed = JSON.parse(raw);
          parts.push(`${source}: JSON ${parsed?.token ? "with token" : "without token"} (${raw.length} chars)`);
        } catch {
          parts.push(`${source}: unreadable JSON (${raw.slice(0, 18)})`);
        }
      } catch (error) {
        parts.push(`${source}: blocked`);
      }
    }
    const rawCookie = getCookie("nli_poster_session");
    if (!rawCookie) {
      parts.push("cookie: empty");
    } else {
      const decoded = decodeSessionCookie(rawCookie);
      if (!decoded) {
        parts.push(`cookie: unreadable (${rawCookie.length} chars)`);
      } else {
        try {
          const parsed = JSON.parse(decoded);
          parts.push(`cookie: JSON ${parsed?.token ? "with token" : "without token"} (${decoded.length} chars)`);
        } catch {
          parts.push(`cookie: decoded but invalid JSON (${decoded.slice(0, 18)})`);
        }
      }
    }
    return parts.join("; ");
  }

  function saveSession() {
    const payload = JSON.stringify({
      token: state.token,
      refreshToken: state.refreshToken,
      user: state.user
    });
    state.sessionVersion += 1;
    sessionStorage.setItem(STORAGE_KEY, payload);
    localStorage.setItem(STORAGE_KEY, payload);
    setSessionCookie(payload);
  }

  function clearSession() {
    state.sessionVersion += 1;
    state.token = "";
    state.refreshToken = "";
    state.user = null;
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    clearSessionCookie();
  }

  function isPosterLoginExpired(error) {
    const message = String(error?.message || "");
    return error?.posterLoginExpired === true
      || /Directus login expired|Log in with an admin account first|Log in first/i.test(message);
  }

  function posterErrorFromResponse(response, body, fallback) {
    const error = new Error(body?.error || fallback || `Poster request failed ${response.status}`);
    error.status = response.status;
    error.posterLoginExpired = (response.status === 401 || response.status === 403)
      && /Directus login expired|Log in with an admin account first/i.test(error.message);
    return error;
  }

  function showLoginExpired(message = "Your Poster login expired. Please log in again.", expectedSessionVersion = state.sessionVersion) {
    if (expectedSessionVersion !== state.sessionVersion) return;
    if (window.NLI_POSTER_AUTHENTICATED === true && state.token === COOKIE_SESSION_TOKEN) {
      showDashboardWithQueueWarning(message || "Poster access needs a refresh. The server session is still active; refresh the queue or log out and back in.");
      return;
    }
    clearSession();
    fillPostForm({});
    showView("login");
    setText("[data-login-status]", message);
  }

  function handlePosterError(error, fallbackMessage, statusSelector = "[data-form-status]", expectedSessionVersion = state.sessionVersion) {
    if (isPosterLoginExpired(error)) {
      showLoginExpired("Your Poster login expired. Please log in again.", expectedSessionVersion);
      return true;
    }
    setText(statusSelector, error?.message || fallbackMessage);
    return false;
  }

  async function directusLogin(email, password, onStatus = () => {}) {
    let lastBody = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      let timer = null;
      let response;
      let text = "";
      try {
        const request = (async () => {
          const result = await fetch(ENDPOINT, {
            method: "POST",
            cache: "no-store",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "login", email, password }),
            signal: controller?.signal
          });
          return { response: result, text: await result.text() };
        })();
        const timeout = timeoutError("Login timed out while contacting the poster endpoint. Please refresh and try again.", 15000, () => {
          try {
            controller?.abort();
          } catch {}
        });
        timer = timeout.cancel;
        ({ response, text } = await Promise.race([request, timeout.promise]));
      } finally {
        if (timer) timer();
      }
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {}
      lastBody = body;
      if (response.status === 202 && /sgcaptcha|Robot Challenge|SiteGround/i.test(text)) {
        throw new Error("SiteGround security is challenging the poster login endpoint. Refresh the page and try again.");
      }
      if (response.ok) {
        const data = body?.data || {};
        state.token = data.access_token || "";
        state.refreshToken = data.refresh_token || "";
        if (!state.token) throw new Error("Directus did not return a login token.");
        state.user = { email };
        saveSession();
        return;
      }
      if (response.status !== 429 || attempt === 4) break;
      const delay = retryDelayFrom(response, body, attempt);
      onStatus(`Directus is busy. Retrying login in ${Math.ceil(delay / 1000)} second${delay >= 1500 ? "s" : ""}...`);
      await wait(delay);
    }
    throw new Error(lastBody?.error || lastBody?.errors?.[0]?.message || `Login failed`);
  }

  async function refreshToken() {
    if (state.token === COOKIE_SESSION_TOKEN) return false;
    if (!state.refreshToken) return false;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${DIRECTUS}/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh_token: state.refreshToken, mode: "json" })
      }).catch(() => null);
      if (!response) return false;
      const text = await response.text();
      const body = text ? JSON.parse(text) : null;
      if (response.ok) {
        const data = body?.data || {};
        if (!data.access_token) return false;
        state.token = data.access_token;
        state.refreshToken = data.refresh_token || state.refreshToken;
        saveSession();
        return true;
      }
      if (response.status !== 429 || attempt === 3) return false;
      await wait(retryDelayFrom(response, body, attempt));
    }
    return false;
  }

  async function posterRequest(action, payload = {}, options = {}) {
    if (!state.token) throw new Error("Log in first.");
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutMs = Number(options.timeout || 18000);
    let hardTimer = null;
    let result;
    try {
      const request = (async () => {
        const headers = { "content-type": "application/json" };
        if (state.token !== COOKIE_SESSION_TOKEN) {
          headers.authorization = `Bearer ${state.token}`;
          headers["x-directus-token"] = state.token;
        }
        const response = await fetch(ENDPOINT, {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers,
          body: JSON.stringify({ action, ...payload }),
          signal: controller?.signal
        });
        const text = await response.text();
        return { response, text };
      })();
      const timeout = new Promise((resolve, reject) => {
        hardTimer = window.setTimeout(() => {
          try {
            controller?.abort();
          } catch {}
          reject(new Error(options.timeoutMessage || "Poster request timed out. Please refresh and try again."));
        }, timeoutMs);
      });
      result = await Promise.race([request, timeout]);
    } catch (error) {
      if (error?.name === "AbortError") throw new Error(options.timeoutMessage || "Poster request timed out. Please refresh and try again.");
      throw error;
    } finally {
      if (hardTimer) window.clearTimeout(hardTimer);
    }
    const { response, text } = result;
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      const looksLikeChallenge = /sgcaptcha|captcha|well-known/i.test(text || "");
      throw new Error(looksLikeChallenge
        ? "SiteGround security challenged the Poster endpoint. Refresh the page and try again."
        : `Poster returned an unreadable response (${response.status}). Refresh and try again.`);
    }
    if (response.status === 429 && Number(options.rateLimitRetries || 0) < 4) {
      await wait(retryDelayFrom(response, body, Number(options.rateLimitRetries || 0)));
      return posterRequest(action, payload, { ...options, rateLimitRetries: Number(options.rateLimitRetries || 0) + 1 });
    }
    if ((response.status === 401 || response.status === 403) && !options.retried && await refreshToken()) {
      return posterRequest(action, payload, { ...options, retried: true });
    }
    if (!response.ok || body?.error) throw posterErrorFromResponse(response, body, `Poster request failed ${response.status}`);
    return body;
  }

  async function posterUploadRequest(action, formData, options = {}) {
    if (!state.token) throw new Error("Log in first.");
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutMs = Number(options.timeout || 60000);
    let hardTimer = null;
    let result;
    formData.set("action", action);
    try {
      const request = (async () => {
        const headers = {};
        if (state.token !== COOKIE_SESSION_TOKEN) {
          headers.authorization = `Bearer ${state.token}`;
          headers["x-directus-token"] = state.token;
        }
        const response = await fetch(ENDPOINT, {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers,
          body: formData,
          signal: controller?.signal
        });
        const text = await response.text();
        return { response, text };
      })();
      const timeout = new Promise((resolve, reject) => {
        hardTimer = window.setTimeout(() => {
          try {
            controller?.abort();
          } catch {}
          reject(new Error(options.timeoutMessage || "Image upload timed out. Try a smaller image."));
        }, timeoutMs);
      });
      result = await Promise.race([request, timeout]);
    } catch (error) {
      if (error?.name === "AbortError") throw new Error(options.timeoutMessage || "Image upload timed out. Try a smaller image.");
      throw error;
    } finally {
      if (hardTimer) window.clearTimeout(hardTimer);
    }
    const { response, text } = result;
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Poster returned an unreadable upload response (${response.status}).`);
    }
    if ((response.status === 401 || response.status === 403) && !options.retried && await refreshToken()) {
      return posterUploadRequest(action, formData, { ...options, retried: true });
    }
    if (!response.ok || body?.error) throw posterErrorFromResponse(response, body, `Poster upload failed ${response.status}`);
    return body;
  }

  function collectPostForm(statusOverride = "") {
    const form = $("[data-post-form]");
    const formData = new FormData(form);
    const platforms = $$("input[name='platforms']:checked").map(input => input.value);
    const scheduledAt = fromDateTimeLocal(formData.get("scheduled_at"));
    const status = statusOverride || formData.get("status") || "draft";
    const mediaUrls = String(formData.get("media_urls") || "")
      .split(/[\n,]+/)
      .map(url => url.trim())
      .filter(Boolean);
    return {
      id: formData.get("id") || null,
      post: {
        title: formData.get("title"),
        status,
        source_type: formData.get("source_type"),
        source_slug: formData.get("source_slug"),
        post_url: formData.get("post_url"),
        scheduled_at: scheduledAt || null,
        message_default: formData.get("message_default"),
        message_facebook: formData.get("message_facebook"),
        message_instagram: formData.get("message_instagram"),
        message_instagram_story: formData.get("message_instagram_story"),
        message_twitter: formData.get("message_twitter"),
        message_threads: formData.get("message_threads"),
        message_bluesky: formData.get("message_bluesky"),
        media_url: formData.get("media_url"),
        media_urls: mediaUrls,
        hashtags: formData.get("hashtags"),
        platforms,
        internal_notes: formData.get("internal_notes")
      }
    };
  }

  function fillPostForm(post = {}) {
    const form = $("[data-post-form]");
    form.reset();
    form.elements.id.value = post.id || "";
    form.elements.title.value = post.title || "";
    form.elements.status.value = post.status || "draft";
    form.elements.source_type.value = post.source_type || "manual";
    form.elements.source_slug.value = post.source_slug || "";
    form.elements.scheduled_at.value = toDateTimeLocal(post.scheduled_at);
    form.elements.post_url.value = post.post_url || "";
    form.elements.message_default.value = post.message_default || "";
    form.elements.message_facebook.value = post.message_facebook || "";
    form.elements.message_instagram.value = post.message_instagram || "";
    form.elements.message_instagram_story.value = post.message_instagram_story || "";
    form.elements.message_twitter.value = post.message_twitter || "";
    form.elements.message_threads.value = post.message_threads || "";
    form.elements.message_bluesky.value = post.message_bluesky || "";
    form.elements.media_url.value = post.media_url || "";
    form.elements.media_urls.value = Array.isArray(post.media_urls) ? post.media_urls.join("\n") : "";
    form.elements.hashtags.value = post.hashtags || "";
    form.elements.internal_notes.value = post.internal_notes || "";
    const selected = new Set(Array.isArray(post.platforms) ? post.platforms : []);
    $$("input[name='platforms']").forEach(input => {
      input.checked = selected.has(input.value);
    });
    state.activePostId = post.id || "";
    $("[data-composer-title]").textContent = post.id ? `Editing ${post.title || "post"}` : "New social draft";
    setText("[data-form-status]", "");
  }

  function renderCounts() {
    const counts = state.posts.reduce((next, post) => {
      const key = post.status || "draft";
      next[key] = (next[key] || 0) + 1;
      return next;
    }, {});
    ["draft", "scheduled", "needs_connection", "posted"].forEach(key => {
      const node = $(`[data-count="${key}"]`);
      if (node) node.textContent = counts[key] || 0;
    });
  }

  function renderPosts() {
    const list = $("[data-post-list]");
    const posts = state.filter ? state.posts.filter(post => post.status === state.filter) : state.posts;
    if (!posts.length) {
      list.innerHTML = `<p class="muted">No posts in this view.</p>`;
      return;
    }
    list.innerHTML = posts.map(post => `
      <article class="queue-card ${String(post.id) === String(state.activePostId) ? "active" : ""}">
        <button type="button" data-edit-post="${escapeHtml(post.id)}">
          <span class="queue-title">${escapeHtml(post.title || "Untitled post")}</span>
          <span class="queue-meta">${escapeHtml(post.status || "draft")} ${post.scheduled_at ? `- ${escapeHtml(formatDate(post.scheduled_at))}` : ""}</span>
          <span class="queue-platforms">${escapeHtml(platformLabels(post.platforms))}</span>
        </button>
      </article>
    `).join("");
  }

  function renderLogs() {
    const list = $("[data-log-list]");
    if (!state.logs.length) {
      list.innerHTML = `<p class="muted">No posting attempts logged yet.</p>`;
      return;
    }
    list.innerHTML = state.logs.slice(0, 40).map(log => `
      <article class="log-row">
        <strong>${escapeHtml(PLATFORM_LABELS[log.platform] || log.platform || "System")}</strong>
        <span>${escapeHtml(log.status || "logged")} ${log.attempted_at ? `- ${escapeHtml(formatDate(log.attempted_at))}` : ""}</span>
        <p>${escapeHtml(log.message || "")}</p>
      </article>
    `).join("");
  }

  function renderConnectionAlerts() {
    const panel = $("[data-connection-alerts]");
    if (!panel) return;
    const accountAlerts = state.accounts
      .filter(account => account.status && account.status !== "connected")
      .map(account => ({
        platform: account.platform,
        message: `${account.label || account.account_name || account.platform || "Account"} is ${connectionStatusLabel(account.status)}.`
      }));
    const logAlerts = state.logs
      .filter(log => ["needs_connection", "failed"].includes(log.status))
      .filter(log => /connect|account|login|cookie|reconnect|connector|instagram|facebook/i.test(`${log.platform || ""} ${log.message || ""}`))
      .slice(0, 5)
      .map(log => ({
        platform: log.platform,
        message: log.message || "Connection needs attention.",
        attempted_at: log.attempted_at
      }));
    const alerts = [...accountAlerts, ...logAlerts].slice(0, 6);
    panel.hidden = alerts.length === 0;
    panel.innerHTML = alerts.length ? alerts.map(alert => `
      <article class="connection-alert">
        <strong>${escapeHtml(PLATFORM_LABELS[alert.platform] || alert.platform || "Connection")}</strong>
        <span>${escapeHtml(alert.message)}</span>
        ${alert.attempted_at ? `<small>${escapeHtml(formatDate(alert.attempted_at))}</small>` : ""}
      </article>
    `).join("") : "";
  }

  function renderAccounts() {
    const list = $("[data-account-list]");
    const overview = $("[data-connection-overview]");
    if (overview) {
      const counts = state.accounts.reduce((next, account) => {
        const key = account.status || "disconnected";
        next[key] = (next[key] || 0) + 1;
        return next;
      }, {});
      overview.innerHTML = `
        <article><span>Connected</span><strong>${counts.connected || 0}</strong></article>
        <article><span>Needs reconnect</span><strong>${counts.needs_connection || 0}</strong></article>
        <article><span>Disconnected</span><strong>${counts.disconnected || 0}</strong></article>
        <article><span>Private token files</span><strong>${state.metaStorage?.token_file_count ?? "?"}</strong></article>
      `;
    }
    if (!state.accounts.length) {
      list.innerHTML = `<p class="muted">No accounts or connection notes saved yet.</p>`;
      return;
    }
    list.innerHTML = state.accounts.map(account => `
      <article class="account-row ${escapeHtml(account.status || "disconnected")}">
        <div class="account-row-head">
          <strong>${escapeHtml(account.label || account.account_name || PLATFORM_LABELS[account.platform] || account.platform || "Account")}</strong>
          <span class="status-pill">${escapeHtml(connectionStatusLabel(account.status))}</span>
        </div>
        <span>${escapeHtml(PLATFORM_LABELS[account.platform] || account.platform || "")}${account.connection_type ? ` - ${escapeHtml(connectionStatusLabel(account.connection_type))}` : ""}</span>
        ${account.account_name || account.account_id ? `<p>${escapeHtml([account.account_name, account.account_id].filter(Boolean).join(" / "))}</p>` : ""}
        ${safeAccountUrl(account.account_url) ? `<a href="${escapeHtml(safeAccountUrl(account.account_url))}" target="_blank" rel="noopener">Open account</a>` : ""}
        <small>${escapeHtml(accountCapabilities(account.capabilities))}</small>
        ${account.notes ? `<p class="account-notes">${escapeHtml(account.notes)}</p>` : ""}
      </article>
    `).join("");
  }

  function renderTabs() {
    $$("[data-tab-target]").forEach(button => {
      button.classList.toggle("active", button.dataset.tabTarget === state.activeTab);
    });
    $$("[data-tab-section]").forEach(section => {
      section.hidden = section.dataset.tabSection !== state.activeTab;
    });
  }

  function renderCalendar() {
    const grid = $("[data-calendar-grid]");
    const title = $("[data-calendar-month-title]");
    if (!grid || !title) return;
    const parts = datePartsForCalendar();
    title.textContent = formatMonthTitle(state.calendarMonth);
    const cells = [];
    for (let index = 0; index < parts.firstWeekday; index += 1) {
      cells.push(`<div class="calendar-day empty" aria-hidden="true"></div>`);
    }
    for (let day = 1; day <= parts.days; day += 1) {
      const entries = calendarEntriesForDay(parts.month, day);
      const primary = entries[0] || null;
      const preview = primary ? calendarEntryPreview(primary) : "No annual post saved for this day.";
      const media = primary ? calendarMediaUrls(primary) : [];
      const thumbnail = media[0] ? `<img src="${escapeHtml(media[0])}" alt="">` : `<span>${primary ? "Text" : "+"}</span>`;
      const mediaCount = media.length > 1 ? `<span class="calendar-media-count">${media.length}</span>` : "";
      const extraCount = entries.length > 1 ? `<small>+${entries.length - 1}</small>` : "";
      const captionPreview = primary?.caption ? `<p>${escapeHtml(primary.caption).slice(0, 110)}</p>` : "";
      cells.push(`
        <button type="button" class="calendar-day ${primary ? "has-entry" : ""} ${String(primary?.id || "") === String(state.activeCalendarId) ? "active" : ""}" data-calendar-day="${day}" title="${escapeHtml(preview)}">
          <strong>${day}</strong>
          <div class="calendar-thumb">${thumbnail}${mediaCount}</div>
          <em>${escapeHtml(primary?.title || "Add")}</em>
          ${captionPreview}
          ${extraCount}
        </button>
      `);
    }
    grid.innerHTML = cells.join("");
  }

  function calendarFormMediaUrls(form = $("[data-calendar-form]")) {
    if (!form) return [];
    return calendarMediaUrls({
      image_url: form.elements.image_url?.value || "",
      media_urls: form.elements.media_urls?.value || ""
    });
  }

  function setCalendarFormMediaUrls(urls = [], options = {}) {
    const form = $("[data-calendar-form]");
    if (!form) return;
    const cleanUrls = [];
    urls.forEach(url => {
      const clean = String(url || "").trim();
      if (clean && !cleanUrls.includes(clean)) cleanUrls.push(clean);
    });
    form.elements.media_urls.value = cleanUrls.join("\n");
    form.elements.image_url.value = cleanUrls[0] || "";
    if (options.render !== false) renderCalendarMediaManager();
  }

  function renderCalendarMediaManager() {
    const preview = $("[data-calendar-image-preview]");
    if (!preview) return;
    const urls = calendarFormMediaUrls();
    if (!urls.length) {
      preview.innerHTML = `<span>No image uploaded</span>`;
      return;
    }
    preview.innerHTML = `
      <div class="calendar-media-list">
        ${urls.map((url, index) => `
          <article class="calendar-media-item" data-calendar-media-index="${index}">
            <div class="calendar-media-thumb-large"><img src="${escapeHtml(url)}" alt=""></div>
            <div class="calendar-media-details">
              <strong>${index + 1}. ${index === 0 ? "Cover / story image" : "Carousel image"}</strong>
              <span>${escapeHtml(url)}</span>
            </div>
            <div class="calendar-media-controls" aria-label="Image ${index + 1} controls">
              <button type="button" data-calendar-media-move="up" data-calendar-media-index="${index}" ${index === 0 ? "disabled" : ""} aria-label="Move image ${index + 1} earlier">Up</button>
              <button type="button" data-calendar-media-move="down" data-calendar-media-index="${index}" ${index === urls.length - 1 ? "disabled" : ""} aria-label="Move image ${index + 1} later">Down</button>
              <button type="button" class="danger-mini" data-calendar-media-remove="${index}" aria-label="Remove image ${index + 1}">X</button>
            </div>
          </article>
        `).join("")}
      </div>
      <p class="muted">The first image becomes the Instagram carousel cover and story image. Reorder images before saving the day.</p>
    `;
  }

  function updateCalendarImagePreview(url = "") {
    const form = $("[data-calendar-form]");
    if (form && url) setCalendarFormMediaUrls([url], { render: false });
    renderCalendarMediaManager();
  }

  async function uploadCalendarImage(input) {
    const form = $("[data-calendar-form]");
    const status = $("[data-calendar-status]");
    const files = Array.from(input?.files || []);
    if (!form || !files.length) return;
    const month = Number(form.elements.month.value || 0);
    const day = Number(form.elements.day.value || 0);
    if (!month || !day) {
      if (status) status.textContent = "Choose the month and day before uploading images.";
      input.value = "";
      return;
    }
    const invalid = files.find(file => !/^image\/jpeg$/i.test(file.type || ""));
    if (invalid) {
      if (status) status.textContent = "Upload JPEG images only.";
      input.value = "";
      return;
    }
    const oversized = files.find(file => file.size > 15 * 1024 * 1024);
    if (oversized) {
      if (status) status.textContent = "Use images under 15 MB.";
      input.value = "";
      return;
    }
    const nextUrls = calendarFormMediaUrls();
    if (nextUrls.length + files.length > 10) {
      if (status) status.textContent = "Use up to 10 carousel images for one calendar day.";
      input.value = "";
      return;
    }
    if (status) status.textContent = `Uploading and compressing ${files.length} image${files.length === 1 ? "" : "s"}...`;
    input.disabled = true;
    try {
      for (const file of files) {
        const upload = new FormData();
        upload.set("month", String(month));
        upload.set("day", String(day));
        upload.set("slot", String(nextUrls.length + 1));
        upload.set("image", file, file.name || `calendar-${month}-${day}-${nextUrls.length + 1}.jpg`);
        const body = await posterUploadRequest("upload_calendar_image", upload, {
          timeout: 70000,
          timeoutMessage: "Image upload timed out. Try a smaller image."
        });
        const url = body?.upload?.url || "";
        if (!url) throw new Error("Poster upload did not return an image URL.");
        if (!nextUrls.includes(url)) nextUrls.push(url);
        if (!form.elements.image_alt.value.trim()) {
          form.elements.image_alt.value = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        }
      }
      setCalendarFormMediaUrls(nextUrls);
      if (status) status.textContent = `${files.length} image${files.length === 1 ? "" : "s"} uploaded. Save the calendar day to keep this carousel order.`;
    } catch (error) {
      if (!handlePosterError(error, "Could not upload image.", "[data-calendar-status]") && status) {
        status.textContent = error.message || "Could not upload image.";
      }
    } finally {
      input.disabled = false;
      input.value = "";
    }
  }

  function collectCalendarForm() {
    const form = $("[data-calendar-form]");
    const formData = new FormData(form);
    const mediaUrls = calendarFormMediaUrls(form);
    return {
      id: formData.get("id") || null,
      entry: {
        title: formData.get("title"),
        enabled: formData.get("enabled") === "on",
        month: formData.get("month"),
        day: formData.get("day"),
        scheduled_time: formData.get("scheduled_time") || "10:00",
        caption: formData.get("caption"),
        story_caption: formData.get("story_caption"),
        image_url: mediaUrls[0] || formData.get("image_url"),
        image_alt: formData.get("image_alt"),
        media_urls: mediaUrls,
        post_url: formData.get("post_url"),
        source_slug: formData.get("source_slug"),
        source_type: formData.get("source_type"),
        hashtags: formData.get("hashtags"),
        platforms: $$("input[name='calendar_platforms']:checked", form).map(input => input.value),
        notes: formData.get("notes")
      }
    };
  }

  function fillCalendarForm(entry = {}) {
    const form = $("[data-calendar-form]");
    if (!form) return;
    const parts = datePartsForCalendar();
    form.reset();
    form.elements.id.value = entry.id || "";
    form.elements.month.value = entry.month || parts.month;
    form.elements.day.value = entry.day || 1;
    form.elements.scheduled_time.value = entry.scheduled_time || "10:00";
    form.elements.enabled.checked = entry.enabled !== false;
    form.elements.title.value = entry.title || "";
    form.elements.caption.value = entry.caption || "";
    form.elements.story_caption.value = entry.story_caption || "";
    if (form.elements.calendar_image_upload) form.elements.calendar_image_upload.value = "";
    setCalendarFormMediaUrls(calendarMediaUrls(entry), { render: false });
    renderCalendarMediaManager();
    form.elements.image_alt.value = entry.image_alt || "";
    form.elements.post_url.value = entry.post_url || "";
    form.elements.source_slug.value = entry.source_slug || "";
    form.elements.source_type.value = entry.source_type || "manual";
    form.elements.hashtags.value = entry.hashtags || "#OnThisDay #OnThisSite #NativeLongIsland";
    form.elements.notes.value = entry.notes || "";
    const selected = new Set(Array.isArray(entry.platforms) && entry.platforms.length ? entry.platforms : ["instagram", "instagram_story"]);
    $$("input[name='calendar_platforms']", form).forEach(input => {
      input.checked = selected.has(input.value);
    });
    state.activeCalendarId = entry.id || "";
    const heading = entry.id ? (entry.title || `${entry.month}/${entry.day}`) : `New item for ${form.elements.month.value}/${form.elements.day.value}`;
    const title = $("[data-calendar-editor-title]");
    if (title) title.textContent = heading;
    setText("[data-calendar-status]", "");
    renderCalendar();
  }

  function selectCalendarDay(day) {
    const parts = datePartsForCalendar();
    const entries = calendarEntriesForDay(parts.month, day);
    fillCalendarForm(entries[0] || { month: parts.month, day, enabled: true, scheduled_time: "10:00" });
  }

  async function saveCalendarDay(event) {
    event.preventDefault();
    const status = $("[data-calendar-status]");
    const button = event.currentTarget.querySelector("button[type='submit']");
    if (status) status.textContent = "Saving calendar day...";
    if (button) button.disabled = true;
    try {
      const body = await posterRequest("save_calendar_day", collectCalendarForm());
      await loadQueue();
      fillCalendarForm(body.entry || {});
      if (status) status.textContent = "Calendar day saved.";
    } catch (error) {
      if (!handlePosterError(error, "Could not save calendar day.", "[data-calendar-status]") && status) {
        status.textContent = error.message || "Could not save calendar day.";
      }
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function deleteCalendarDay() {
    const form = $("[data-calendar-form]");
    const id = form?.elements.id.value || "";
    const status = $("[data-calendar-status]");
    if (!id) {
      if (status) status.textContent = "Nothing saved for this day yet.";
      return;
    }
    if (status) status.textContent = "Deleting calendar day...";
    try {
      await posterRequest("delete_calendar_day", { id });
      state.activeCalendarId = "";
      await loadQueue();
      const month = Number(form.elements.month.value || state.calendarMonth.getMonth() + 1);
      const day = Number(form.elements.day.value || 1);
      fillCalendarForm({ month, day, enabled: true, scheduled_time: "10:00" });
      if (status) status.textContent = "Calendar day deleted.";
    } catch (error) {
      if (!handlePosterError(error, "Could not delete calendar day.", "[data-calendar-status]") && status) {
        status.textContent = error.message || "Could not delete calendar day.";
      }
    }
  }

  function renderAll() {
    renderTabs();
    renderCounts();
    renderPosts();
    renderLogs();
    renderConnectionAlerts();
    renderAccounts();
    renderCalendar();
  }

  function showDashboardWithQueueWarning(message) {
    state.posts = [];
    state.logs = [];
    state.accounts = [];
    state.calendar = [];
    showView("dashboard");
    renderAll();
    setText("[data-form-status]", message || "Poster queue could not load yet. Refresh the queue in a moment.");
  }

  function refreshQueueInBackground(expectedSessionVersion = state.sessionVersion) {
    loadQueue().catch(error => {
      if (isPosterLoginExpired(error)) {
        showLoginExpired(undefined, expectedSessionVersion);
        return;
      }
      showDashboardWithQueueWarning(error.message || "Poster queue could not load yet. Refresh the queue in a moment.");
    });
  }

  function checkAdminAccessInBackground(expectedSessionVersion = state.sessionVersion) {
    checkAdminAccess().catch(error => {
      if (isPosterLoginExpired(error)) {
        showLoginExpired(undefined, expectedSessionVersion);
        return;
      }
      showDashboardWithQueueWarning(error.message || "Admin access could not be confirmed yet. Server-side protection is still active on every save and publish action.");
    });
  }

  async function loadQueue() {
    const body = await posterRequest("list", {}, {
      timeout: 12000,
      timeoutMessage: "Admin access worked, but the poster queue timed out while loading. Please refresh and try again."
    });
    state.posts = body.posts || [];
    state.logs = body.logs || [];
    state.accounts = body.accounts || [];
    state.calendar = body.calendar || [];
    state.metaStorage = body.meta_storage || null;
    showView("dashboard");
    renderAll();
    if (Array.isArray(body.warnings) && body.warnings.length) {
      setText("[data-form-status]", body.warnings.join(" "));
    }
  }

  async function checkAdminAccess() {
    return posterRequest("admin_check", {}, {
      timeout: 9000,
      timeoutMessage: "Admin access check timed out. Please refresh and try again."
    });
  }

  async function validatePosterSession() {
    return posterRequest("auth_probe", {}, {
      timeout: 9000,
      timeoutMessage: "Poster login check timed out. Please refresh and try again."
    });
  }

  async function savePost(statusOverride = "") {
    const status = $("[data-form-status]");
    status.textContent = "Saving...";
    const payload = collectPostForm(statusOverride);
    const body = await posterRequest("save_post", payload);
    status.textContent = "Saved.";
    const saved = body.post || {};
    await loadQueue();
    fillPostForm(saved);
  }

  async function publishNow() {
    const status = $("[data-form-status]");
    status.textContent = "Saving and creating publish attempt logs...";
    const payload = collectPostForm("queued");
    const saved = await posterRequest("save_post", payload);
    const postId = saved.post?.id;
    if (!postId) throw new Error("Post was not saved.");
    const result = await posterRequest("publish_now", { id: postId });
    status.textContent = result.message || "Publish attempt logged.";
    await loadQueue();
    fillPostForm(result.post || saved.post || {});
  }

  async function saveAccount(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    const status = $("[data-account-status]");
    const formData = new FormData(form);
    const capabilities = $$("input[name='capabilities']:checked", form).map(input => input.value);
    if (status) status.textContent = "Saving account connection...";
    if (button) button.disabled = true;
    try {
      await posterRequest("save_account", {
        account: {
          platform: formData.get("platform"),
          label: formData.get("label"),
          status: formData.get("status"),
          account_name: formData.get("account_name"),
          account_id: formData.get("account_id"),
          account_url: formData.get("account_url"),
          connection_type: formData.get("connection_type"),
          capabilities,
          notes: formData.get("notes")
        }
      });
      form.reset();
      await loadQueue();
      if (status) status.textContent = "Account connection saved.";
    } catch (error) {
      if (status) status.textContent = error.message || "Could not save account connection.";
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function connectAccountByLogin(event) {
    const button = event?.currentTarget || $("[data-connect-account]");
    const platform = button?.dataset.connectPlatform || "instagram";
    const status = $("[data-connect-status]");
    if (status) status.textContent = "Opening account login...";
    if (button) button.disabled = true;
    try {
      const body = await posterRequest("connect_account", { platform }, {
        timeout: 9000,
        timeoutMessage: "Meta connect setup timed out. Refresh and try again."
      });
      if (body.auth_url) {
        if (status) status.textContent = "Opening Meta login...";
        window.location.href = body.auth_url;
        return;
      }
      if (body.setup_required) {
        showMetaSetup(body);
      }
      if (status) status.textContent = body.message || "Meta login is not configured yet.";
    } catch (error) {
      if (status) status.textContent = error.message || "Could not open account login.";
    } finally {
      if (button) button.disabled = false;
    }
  }

  function showMetaSetup(details = {}) {
    const form = $("[data-meta-setup]");
    if (!form) return;
    form.hidden = false;
    if (details.redirect_uri && form.elements.redirect_uri) form.elements.redirect_uri.value = details.redirect_uri;
    if (details.graph_version && form.elements.graph_version) form.elements.graph_version.value = details.graph_version;
    form.elements.app_id?.focus();
  }

  async function saveMetaSetup(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    const status = $("[data-meta-setup-status]");
    const formData = new FormData(form);
    if (status) status.textContent = "Saving Meta setup...";
    if (button) button.disabled = true;
    try {
      await posterRequest("save_meta_config", {
        config: {
          app_id: formData.get("app_id"),
          app_secret: formData.get("app_secret"),
          graph_version: formData.get("graph_version"),
          redirect_uri: formData.get("redirect_uri")
        }
      });
      form.elements.app_secret.value = "";
      form.hidden = true;
      if (status) status.textContent = "";
      setText("[data-connect-status]", "Meta setup saved. Click Connect Instagram / Facebook again.");
    } catch (error) {
      if (status) status.textContent = error.message || "Could not save Meta setup.";
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function connectInstagramByLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    const status = $("[data-instagram-login-status]");
    const formData = new FormData(form);
    let slowTimer = null;
    if (status) status.textContent = "Checking Instagram login method...";
    if (button) button.disabled = true;
    try {
      slowTimer = window.setTimeout(() => {
        if (status) status.textContent = "Still checking Instagram. No account will be saved unless the connection fully succeeds.";
      }, 8000);
      const body = await posterRequest("instagram_login_connect", {
        login: {
          username: formData.get("username"),
          password: formData.get("password"),
          two_factor_code: formData.get("two_factor_code"),
          proxy_url: formData.get("proxy_url")
        }
      }, {
        timeout: 45000,
        timeoutMessage: "Instagram login method timed out. No account was saved. Try the cookie method or reconnect later."
      });
      if (form.elements.password) form.elements.password.value = "";
      if (form.elements.two_factor_code) form.elements.two_factor_code.value = "";
      if (status) status.textContent = body.message || "Instagram login method request saved.";
      await loadQueue();
    } catch (error) {
      if (form.elements.password) form.elements.password.value = "";
      if (status) status.textContent = error.message || "Could not use Instagram login method.";
    } finally {
      if (slowTimer) window.clearTimeout(slowTimer);
      if (button) button.disabled = false;
    }
  }

  async function connectInstagramByCookie(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button[type='submit']");
    const status = $("[data-instagram-cookie-status]");
    const formData = new FormData(form);
    if (status) status.textContent = "Importing Instagram session...";
    if (button) button.disabled = true;
    try {
      const body = await posterRequest("instagram_cookie_connect", {
        cookie: {
          cookie_sessionid: formData.get("cookie_sessionid"),
          cookie_ds_user_id: formData.get("cookie_ds_user_id"),
          cookie_csrf_token: formData.get("cookie_csrf_token"),
          mid: formData.get("mid"),
          ig_did: formData.get("ig_did")
        }
      }, {
        timeout: 15000,
        timeoutMessage: "Instagram cookie import timed out. Refresh and try again."
      });
      if (form.elements.cookie_sessionid) form.elements.cookie_sessionid.value = "";
      if (status) status.textContent = body.message || "Instagram session imported.";
      await loadQueue();
    } catch (error) {
      if (form.elements.cookie_sessionid) form.elements.cookie_sessionid.value = "";
      if (status) status.textContent = error.message || "Could not import Instagram session.";
    } finally {
      if (button) button.disabled = false;
    }
  }

  function bindEvents() {
    const loginForm = $("[data-login-form]");
    if (loginForm?.dataset.jsLogin === "true") loginForm.addEventListener("submit", async event => {
      event.preventDefault();
      if (state.loginBusy) return;
      state.loginBusy = true;
      const status = $("[data-login-status]");
      const submit = event.currentTarget.querySelector("button[type='submit']");
      const formData = new FormData(event.currentTarget);
      try {
        if (submit) submit.disabled = true;
        status.textContent = "Logging in...";
        let elapsed = 0;
        const progress = window.setInterval(() => {
          elapsed += 5;
          status.textContent = `Logging in through the site endpoint... ${elapsed}s`;
        }, 5000);
        try {
          await withTimeout(
            directusLogin(formData.get("email"), formData.get("password"), message => {
              status.textContent = message;
            }),
            "Login did not finish. Refresh the page and try again; the request is not allowed to stay stuck.",
            24000
          );
        } finally {
          window.clearInterval(progress);
        }
        showDashboardWithQueueWarning("Loading poster queue...");
        await loadQueue();
      } catch (error) {
        if (state.token && !isPosterLoginExpired(error)) {
          showDashboardWithQueueWarning(error.message || "Poster queue could not load yet. Refresh the queue in a moment.");
        } else if (isPosterLoginExpired(error)) {
          showLoginExpired("Your Poster login expired. Please log in again.", state.sessionVersion);
        } else {
          clearSession();
          showView("login");
          status.textContent = error.message || "Could not log in.";
        }
      } finally {
        state.loginBusy = false;
        if (submit) submit.disabled = false;
      }
    });

    $("[data-post-form]")?.addEventListener("submit", async event => {
      event.preventDefault();
      try {
        await savePost();
      } catch (error) {
        handlePosterError(error, "Could not save post.");
      }
    });

    $("[data-save-scheduled]")?.addEventListener("click", async () => {
      try {
        await savePost("scheduled");
      } catch (error) {
        handlePosterError(error, "Could not schedule post.");
      }
    });

    $("[data-publish-now]")?.addEventListener("click", async () => {
      try {
        await publishNow();
      } catch (error) {
        handlePosterError(error, "Could not publish post.");
      }
    });

    $("[data-new-post]")?.addEventListener("click", () => fillPostForm({}));
    $("[data-refresh]")?.addEventListener("click", () => loadQueue().catch(error => {
      handlePosterError(error, "Poster queue could not load yet. Refresh the queue in a moment.");
    }));
    $("[data-logout]")?.addEventListener("click", () => {
      if (state.token === COOKIE_SESSION_TOKEN) {
        posterRequest("logout", {}).catch(() => {});
      }
      clearSession();
      fillPostForm({});
      showView("login");
    });

    $("[data-status-filter]")?.addEventListener("change", event => {
      state.filter = event.currentTarget.value;
      renderPosts();
    });

    $$("[data-tab-target]").forEach(button => button.addEventListener("click", event => {
      state.activeTab = event.currentTarget.dataset.tabTarget || "queue";
      renderTabs();
      renderCalendar();
    }));

    $("[data-calendar-prev]")?.addEventListener("click", () => {
      state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
      state.activeCalendarId = "";
      renderCalendar();
    });

    $("[data-calendar-next]")?.addEventListener("click", () => {
      state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
      state.activeCalendarId = "";
      renderCalendar();
    });

    $("[data-calendar-today]")?.addEventListener("click", () => {
      const now = new Date();
      state.calendarMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      state.activeCalendarId = "";
      renderCalendar();
    });

    $("[data-calendar-grid]")?.addEventListener("click", event => {
      const button = event.target.closest("[data-calendar-day]");
      if (!button) return;
      selectCalendarDay(Number(button.dataset.calendarDay));
    });

    $("[data-calendar-form]")?.addEventListener("submit", saveCalendarDay);
    $("[data-calendar-delete]")?.addEventListener("click", deleteCalendarDay);
    $("[name='calendar_image_upload']")?.addEventListener("change", event => uploadCalendarImage(event.currentTarget));
    $("[name='media_urls']")?.addEventListener("input", () => renderCalendarMediaManager());
    $("[data-calendar-image-preview]")?.addEventListener("click", event => {
      const remove = event.target.closest("[data-calendar-media-remove]");
      const move = event.target.closest("[data-calendar-media-move]");
      const urls = calendarFormMediaUrls();
      if (remove) {
        const index = Number(remove.dataset.calendarMediaRemove);
        if (Number.isFinite(index)) {
          urls.splice(index, 1);
          setCalendarFormMediaUrls(urls);
          setText("[data-calendar-status]", "Image removed. Save the calendar day to keep this change.");
        }
        return;
      }
      if (move) {
        const index = Number(move.dataset.calendarMediaIndex);
        const direction = move.dataset.calendarMediaMove;
        const nextIndex = direction === "up" ? index - 1 : index + 1;
        if (Number.isFinite(index) && nextIndex >= 0 && nextIndex < urls.length) {
          const [item] = urls.splice(index, 1);
          urls.splice(nextIndex, 0, item);
          setCalendarFormMediaUrls(urls);
          setText("[data-calendar-status]", "Carousel order updated. Save the calendar day to keep this change.");
        }
      }
    });
    $("[data-calendar-image-clear]")?.addEventListener("click", () => {
      const form = $("[data-calendar-form]");
      if (!form) return;
      if (form.elements.calendar_image_upload) form.elements.calendar_image_upload.value = "";
      setCalendarFormMediaUrls([]);
      setText("[data-calendar-status]", "All images removed. Save the calendar day to keep this change.");
    });

    $("[data-post-list]")?.addEventListener("click", event => {
      const button = event.target.closest("[data-edit-post]");
      if (!button) return;
      const post = state.posts.find(item => String(item.id) === String(button.dataset.editPost));
      if (post) {
        fillPostForm(post);
        renderPosts();
      }
    });

    $("[data-account-form]")?.addEventListener("submit", saveAccount);
    $("[data-meta-setup]")?.addEventListener("submit", saveMetaSetup);
    $("[data-instagram-login-form]")?.addEventListener("submit", connectInstagramByLogin);
    $("[data-instagram-cookie-form]")?.addEventListener("submit", connectInstagramByCookie);
    $$("[data-connect-account]").forEach(button => button.addEventListener("click", connectAccountByLogin));
  }

  async function boot() {
    setText("[data-runtime-marker]", `Poster runtime loaded 20260708-calendar-carousel (${window.NLI_POSTER_AUTHENTICATED ? "server session" : "no server session"}${window.NLI_POSTER_PHP_INDEX ? ", php index" : ", static index"})`);
    bindEvents();
    fillPostForm({});
    loadSession();
    if (!state.token) {
      showView("login");
      if (["server-form", "php-session"].includes(new URLSearchParams(window.location.search).get("login") || "")) {
        setText("[data-login-status]", `Server login returned, but the browser did not provide a readable poster session. ${describeStoredSession()}`);
      }
      return;
    }
    try {
      showDashboardWithQueueWarning("Loading poster queue...");
      if (state.token !== COOKIE_SESSION_TOKEN || window.NLI_POSTER_AUTHENTICATED !== true) {
        await validatePosterSession();
      }
      await loadQueue();
    } catch (error) {
      if (isPosterLoginExpired(error)) {
        showLoginExpired("Your Poster login expired. Please log in again.", state.sessionVersion);
      } else {
        showDashboardWithQueueWarning(error.message || "Poster queue could not load yet. Refresh the queue in a moment.");
      }
    }
  }

  boot();
})();
