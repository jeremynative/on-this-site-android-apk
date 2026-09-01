(function () {
  "use strict";

  const ENDPOINT = /(^|\.)nativelongisland\.com$/i.test(location.hostname)
    ? "https://nativelongisland.com/userviews-action.php"
    : "/userviews-action.php";
  const MAX_ACTIVE_SECONDS_PER_BATCH = 300;
  const IGNORED_PARAMS = new Set(["v", "deploy", "cache", "cb", "_", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"]);
  let currentPage = "";
  let activeSince = document.visibilityState === "visible" ? performance.now() : 0;
  let routeTimer = 0;

  function analyticsOptedOut() {
    return document.cookie.split(";").some(part => part.trim() === "nli_analytics_opt_out=1");
  }

  function storedContributorEmail() {
    try {
      const session = JSON.parse(window.localStorage.getItem("nli-contributor-session") || "null");
      return String(session?.email || session?.username || "").trim().toLowerCase();
    } catch {
      return "";
    }
  }

  function isInternalVisit() {
    if (analyticsOptedOut()) return true;
    const email = storedContributorEmail();
    const agent = String(navigator.userAgent || "").toLowerCase();
    return email === "jeremynative@gmail.com"
      || email === "onthissiteny@gmail.com"
      || email === "jeremydennis"
      || navigator.webdriver === true
      || /\b(co[d]ex|chat[g]pt|playwright|puppeteer|selenium|headless)\b/.test(agent)
      || new URLSearchParams(window.location.search).get("analytics") === "ignore";
  }

  function referralValue() {
    const params = new URLSearchParams(window.location.search);
    const campaignSource = String(params.get("utm_source") || "").trim().toLowerCase();
    if (campaignSource) return `source:${campaignSource}`;
    if (params.has("fbclid")) return "source:facebook";
    if (params.has("gclid")) return "source:google";
    return document.referrer || "";
  }

  function canonicalPage() {
    const url = new URL(window.location.href);
    for (const key of [...url.searchParams.keys()]) {
      if (IGNORED_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    url.hash = "";
    const query = url.searchParams.toString();
    return `${url.pathname || "/"}${query ? `?${query}` : ""}`.slice(0, 500);
  }

  function pageTitle() {
    const articleTitle = document.querySelector("#article-head h2, .detail-sheet.open h2, .sheet.open h2")?.textContent?.trim();
    return (articleTitle || document.title || "On This Site - Native Long Island").slice(0, 180);
  }

  function sourceName() {
    return /mobile-app/i.test(location.pathname) || /^directus\.nativelongisland\.com$/i.test(location.hostname)
      ? "mobile-app"
      : "website";
  }

  function send(action, extra = {}) {
    if (isInternalVisit()) return;
    const payload = JSON.stringify({
      action,
      page: currentPage || canonicalPage(),
      title: pageTitle(),
      source: sourceName(),
      viewport_width: Math.max(0, Math.round(window.innerWidth || 0)),
      ...extra
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "text/plain;charset=UTF-8" }));
      return;
    }
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      credentials: "include",
      keepalive: true
    }).catch(() => {});
  }

  function flushActiveTime() {
    if (!activeSince || !currentPage) return;
    const seconds = Math.min(MAX_ACTIVE_SECONDS_PER_BATCH, Math.max(0, Math.round((performance.now() - activeSince) / 1000)));
    activeSince = document.visibilityState === "visible" ? performance.now() : 0;
    if (seconds >= 1) send("time", { seconds });
  }

  function recordRoute() {
    const nextPage = canonicalPage();
    if (nextPage === currentPage) return;
    flushActiveTime();
    currentPage = nextPage;
    activeSince = document.visibilityState === "visible" ? performance.now() : 0;
    send("view", { referrer: referralValue() });
  }

  function scheduleRouteCheck() {
    window.clearTimeout(routeTimer);
    routeTimer = window.setTimeout(recordRoute, 650);
  }

  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    if (typeof original !== "function") continue;
    history[method] = function (...args) {
      const result = original.apply(this, args);
      scheduleRouteCheck();
      return result;
    };
  }

  window.addEventListener("popstate", scheduleRouteCheck);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushActiveTime();
    else activeSince = performance.now();
  });
  window.addEventListener("pagehide", flushActiveTime);
  window.addEventListener("beforeunload", flushActiveTime);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", recordRoute, { once: true });
  else recordRoute();
})();
