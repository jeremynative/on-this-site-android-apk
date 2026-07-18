(function () {
  const DEFAULT_ALIASES = {
    "#wiki/tribes": "#wiki/the-tribes-of-long-island",
    "#listing/matinecocks": "#listing/matinecock-traditional-land",
    "#listing/matinecock-tribal-nation": "#listing/matinecock"
  };

  const DEFAULT_PAGE_EXCLUSIONS = ["archive-test", "listing", "wiki", "wp-json", "wp-content", "wp-admin"];

  function decodeSlug(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function normalizeInternalRoute(href, aliases = DEFAULT_ALIASES) {
    const route = String(href || "").trim();
    return aliases[route.toLowerCase()] || route;
  }

  function listingSlugAlias(slug) {
    return ({
      nissaquogues: "nissaquogue",
      setaukets: "setauket-ancestral-land"
    })[slug] || slug || "";
  }

  function slugFromListingUrl(url) {
    const match = String(url || "").match(/(?:^|\/|#)listing\/([^/?#]+)\/?/i);
    return match ? decodeSlug(match[1]) : "";
  }

  function slugFromWikiUrl(url) {
    const match = String(url || "").match(/(?:^|\/|#)wiki\/([^/?#]+)\/?/i);
    return match ? decodeSlug(match[1]) : "";
  }

  function slugFromPageUrl(url, options = {}) {
    const match = String(url || "").match(/nativelongisland\.com\/([^/?#]+)\/?$/i);
    const slug = match ? decodeSlug(match[1]) : "";
    const exclusions = options.excludedPageSlugs || DEFAULT_PAGE_EXCLUSIONS;
    return slug && !exclusions.some(item => item.toLowerCase() === slug.toLowerCase()) ? slug : "";
  }

  function internalHref(value, options = {}) {
    const href = String(value || "").trim().replace(/&amp;/g, "&");
    if (!href) return "";
    const normalize = route => normalizeInternalRoute(route, options.aliases || DEFAULT_ALIASES);
    if (/^#(?:wiki|listing|page|blog)\//i.test(href)) return normalize(href);
    if (options.parseQuery !== false) {
      try {
        const parsed = new URL(href, options.baseUrl || "https://nativelongisland.com");
        const allowedHost = options.allowedHostPattern || /(^|\.)nativelongisland\.com$/i;
        if (!allowedHost.test(parsed.hostname)) return "";
        const siteParam = parsed.searchParams.get("site");
        if (siteParam) return normalize(`#listing/${decodeSlug(siteParam)}`);
        const wikiParam = parsed.searchParams.get("wiki");
        if (wikiParam) return normalize(`#wiki/${decodeSlug(wikiParam)}`);
        const pageParam = parsed.searchParams.get("page");
        if (pageParam) return normalize(`#page/${decodeSlug(pageParam)}`);
        const blogParam = parsed.searchParams.get("blog");
        if (blogParam) return normalize(`#blog/${decodeSlug(blogParam)}`);
      } catch {}
    }
    const wikiSlug = slugFromWikiUrl(href);
    if (wikiSlug) return normalize(`#wiki/${wikiSlug}`);
    const listingSlug = slugFromListingUrl(href);
    if (listingSlug) return normalize(`#listing/${listingSlug}`);
    const pageSlug = slugFromPageUrl(href, options);
    if (!pageSlug) return "";
    if (typeof options.isBlogSlug === "function" && options.isBlogSlug(pageSlug)) return normalize(`#blog/${pageSlug}`);
    const pagePrefix = options.pageRoutePrefix || "";
    return normalize(`#page/${pagePrefix}${pageSlug}`);
  }

  function publicArchiveUrl(params = {}, options = {}) {
    const url = new URL(options.baseUrl || "https://nativelongisland.com/");
    for (const [key, value] of Object.entries(params || {})) {
      if (value) url.searchParams.set(key, value);
    }
    return url.href;
  }

  function passwordResetTokenFromUrl(locationObject = window.location) {
    const params = new URLSearchParams(locationObject?.search || "");
    return params.get("token") || params.get("reset_token") || params.get("password_reset_token") || "";
  }

  function passwordResetReturnUrl(locationObject = window.location) {
    const url = new URL(locationObject?.href || window.location.href);
    url.search = "";
    url.hash = "";
    return url.href;
  }

  function clearPasswordResetUrl(options = {}) {
    const locationObject = options.location || window.location;
    const historyObject = options.history || window.history;
    const url = new URL(locationObject?.href || window.location.href);
    ["token", "reset_token", "password_reset_token", "password_reset"].forEach(key => url.searchParams.delete(key));
    historyObject?.replaceState?.(historyObject.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  window.NLI_ROUTE_UTILS = {
    normalizeInternalRoute,
    listingSlugAlias,
    slugFromListingUrl,
    slugFromWikiUrl,
    slugFromPageUrl,
    internalHref,
    publicArchiveUrl,
    passwordResetTokenFromUrl,
    passwordResetReturnUrl,
    clearPasswordResetUrl
  };
}());
