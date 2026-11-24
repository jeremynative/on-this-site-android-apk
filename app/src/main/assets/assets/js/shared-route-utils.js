(function () {
  const DEFAULT_ALIASES = {
    "#wiki/algonquian-language-and-place-names": "#wiki/language",
    "#wiki/tribes": "#wiki/the-tribes-of-long-island",
    "#listing/matinecocks": "#listing/matinecock-traditional-land",
    "#listing/matinecock-tribal-nation": "#listing/matinecock",
    // Old WordPress listings still linked from site and article text.
    "#listing/manhansets": "#listing/manhansett-ancestral-land",
    "#listing/wickatuck-settlement": "#listing/weeckatuck",
    "#listing/west-woods-sweat-lodge": "#listing/west-woods"
  };

  const DEFAULT_PAGE_EXCLUSIONS = ["archive-test", "listing", "wiki", "wp-json", "wp-content", "wp-admin"];

  // Leftover WordPress shop and map-plugin pages: an empty cart and checkout, a login form that does nothing,
  // and "My first map" pages that print raw plugin CSS. Directus still holds them; the public site never opens
  // or lists them. Same list as SEO_EXCLUDED_PAGE_SLUGS in build-static-preview.js.
  const HIDDEN_LEGACY_PAGE_SLUGS = ["page-cart", "page-checkout", "page-map", "page-map-1", "page-map-1-2", "page-map-2", "page-map-2-2", "page-my-account", "page-shop"];

  // Old WordPress knowledgebase category pages, linked from older article text, and the category that replaced each.
  const LEGACY_WIKI_TOPICS = {
    history: "history",
    archaeology: "time-periods-and-archaeology",
    "spirituality-ceremony-cosmology": "culture-ceremony-and-lifeways",
    "culture-ritual-traditions": "culture-ceremony-and-lifeways"
  };

  function legacyWikiTopic(slug) {
    return LEGACY_WIKI_TOPICS[String(slug || "").trim().toLowerCase()] || "";
  }

  function isHiddenLegacyPage(slug) {
    return HIDDEN_LEGACY_PAGE_SLUGS.includes(String(slug || "").trim().toLowerCase());
  }

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
      montaukett: "montaukett-ancestral-land",
      nissaquogues: "nissaquogue",
      "shinnecock-placename": "shinnecock-ancestral-land",
      setaukets: "setauket-ancestral-land",
      "west-woods-sweat-lodge": "west-woods"
    })[slug] || slug || "";
  }

  function wikiSlugAlias(slug) {
    return slug === "algonquian-language-and-place-names" ? "language" : (slug || "");
  }

  function addWikiAliases(index) {
    const language = index.get("language");
    if (language) index.set("algonquian-language-and-place-names", language);
    return index;
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
        if (siteParam) return normalize(`#listing/${listingSlugAlias(decodeSlug(siteParam))}`);
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
    if (listingSlug) return normalize(`#listing/${listingSlugAlias(listingSlug)}`);
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
    wikiSlugAlias,
    addWikiAliases,
    normalizeInternalRoute,
    listingSlugAlias,
    slugFromListingUrl,
    slugFromWikiUrl,
    slugFromPageUrl,
    HIDDEN_LEGACY_PAGE_SLUGS,
    isHiddenLegacyPage,
    legacyWikiTopic,
    internalHref,
    publicArchiveUrl,
    passwordResetTokenFromUrl,
    passwordResetReturnUrl,
    clearPasswordResetUrl
  };
}());
