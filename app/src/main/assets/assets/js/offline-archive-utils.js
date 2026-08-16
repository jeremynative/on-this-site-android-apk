(function initOfflineArchiveUtils(global) {
  "use strict";

  const DEFAULT_CACHE_LIMIT = 24;

  function rows(payload) {
    return Array.isArray(payload) ? payload : (Array.isArray(payload?.rows) ? payload.rows : []);
  }

  function regionForLongitude(longitude, boundaries = {}) {
    const value = Number(longitude);
    if (!Number.isFinite(value)) return "all";
    if (value <= Number(boundaries.west ?? -73.42)) return "west";
    if (value >= Number(boundaries.east ?? -72.72)) return "east";
    return "central";
  }

  function prepareArchive(sitePayload, centerPayload, wikiPayload, options = {}) {
    const searchUtils = options.searchUtils || global.NLI_SEARCH_UTILS;
    if (!searchUtils?.prepareEntry) throw new Error("Offline search tools are unavailable.");
    const boundaries = options.regionBoundaries || {};
    const centers = new Map(rows(centerPayload).flatMap(item => [
      [`id:${item.id}`, item],
      [`slug:${item.slug}`, item]
    ]));
    const sites = rows(sitePayload).map(item => {
      const center = centers.get(`id:${item.id}`) || centers.get(`slug:${item.slug}`);
      const longitude = Number(center?.center?.[0]);
      const latitude = Number(center?.center?.[1]);
      const coordinates = {
        longitude: Number.isFinite(longitude) ? longitude : null,
        latitude: Number.isFinite(latitude) ? latitude : null
      };
      return searchUtils.prepareEntry({
        ...item,
        ...coordinates,
        kind: "site",
        region: regionForLongitude(coordinates.longitude, boundaries)
      }, { body: item.why_this_matters || "" });
    });
    const wikis = rows(wikiPayload).map(item => searchUtils.prepareEntry({
      ...item,
      kind: "wiki"
    }, {
      type: "Knowledgebase",
      body: item.body || item.summary || ""
    }));
    const entries = [...sites, ...wikis]
      .sort((left, right) => String(left.title || "").localeCompare(String(right.title || "")));
    return { sites, wikis, entries };
  }

  function searchScore(entry, query, searchUtils = global.NLI_SEARCH_UTILS) {
    const leadingTerms = entry.searchLeadingTitleTerms || [];
    if (query.compact && leadingTerms.length > 1 && leadingTerms[0].length <= 3
        && `${leadingTerms[0]}${leadingTerms[1]}` === query.compact) return 180;
    if (entry.searchCompactTitleKey === query.compact) return 160;
    if (entry.searchTitleKey === query.normalized) return 120;
    if (entry.searchTitleKey.startsWith(`${query.normalized} `) || entry.searchTitleKey.startsWith(query.normalized)) return 100;
    if (entry.searchCompactTitleKey.startsWith(query.compact)) return 90;
    if (entry.searchSlugKey === query.normalized || entry.searchSlugKey.startsWith(query.normalized)) return 82;
    if (entry.searchTitleKey.includes(` ${query.normalized}`) || entry.searchTitleKey.includes(query.normalized)) return 72;
    if (entry.searchAddressKey.includes(query.normalized)) return 58;
    if (entry.searchTypeKey.includes(query.normalized)) return 48;
    if (entry.searchSummaryKey.includes(query.normalized)) return 38;
    return searchUtils.entryMatches(entry, query) ? 24 : 0;
  }

  function isCache(value) {
    return Boolean(value && ["has", "get", "set", "delete", "keys"].every(method => typeof value[method] === "function"));
  }

  function rememberBounded(cache, key, value, limit = DEFAULT_CACHE_LIMIT) {
    if (!isCache(cache)) return value;
    if (cache.has(key)) cache.delete(key);
    while (cache.size >= Math.max(1, Number(limit) || DEFAULT_CACHE_LIMIT)) {
      cache.delete(cache.keys().next().value);
    }
    cache.set(key, value);
    return value;
  }

  function filterArchive(entries, options = {}) {
    const searchUtils = options.searchUtils || global.NLI_SEARCH_UTILS;
    if (!searchUtils?.queryModel || !searchUtils?.rankEntries) throw new Error("Offline search tools are unavailable.");
    const region = String(options.region || "all");
    const query = searchUtils.queryModel(options.query || "");
    const cache = options.cache;
    const cacheKey = `${region}|${query.normalized}`;
    if (isCache(cache) && cache.has(cacheKey)) return cache.get(cacheKey);
    const candidates = entries.filter(entry => region === "all" || entry.kind === "wiki" || entry.region === region);
    const results = !query.normalized
      ? candidates
      : searchUtils.rankEntries(
        candidates,
        query,
        (entry, model) => searchScore(entry, model, searchUtils),
        { minimumScore: 1, titleOf: entry => entry.title }
      ).map(result => result.entry);
    return rememberBounded(cache, cacheKey, results, options.cacheLimit);
  }

  global.NLI_OFFLINE_ARCHIVE_UTILS = Object.freeze({
    DEFAULT_CACHE_LIMIT,
    rows,
    regionForLongitude,
    prepareArchive,
    searchScore,
    rememberBounded,
    filterArchive
  });
})(typeof window !== "undefined" ? window : globalThis);
