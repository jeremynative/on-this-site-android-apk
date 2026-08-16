(function initSharedSearchUtils(global) {
  "use strict";

  function defaultNormalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function queryModel(value, options = {}) {
    if (value?.__nliSearchQuery === true) return value;
    const normalizeText = options.normalizeText || defaultNormalizeText;
    const raw = String(value || "").trim();
    const normalized = normalizeText(raw);
    return Object.freeze({
      __nliSearchQuery: true,
      raw,
      lower: raw.toLowerCase(),
      normalized,
      compact: normalized.replace(/\s+/g, ""),
      terms: normalized.split(" ").filter(term => term.length >= 2)
    });
  }

  function correctionKeys(title, slug, normalizeText) {
    return [...new Set([
      title,
      String(slug || "").replace(/-/g, " "),
      ...String(title || "").split(/\s+/).filter(word => word.length >= 4),
      ...String(slug || "").split(/[-_\s]+/).filter(word => word.length >= 4)
    ].map(value => normalizeText(value)).filter(value => value.length >= 3))];
  }

  function prepareEntry(entry = {}, options = {}) {
    const normalizeText = options.normalizeText || defaultNormalizeText;
    const title = String(options.title ?? entry.title ?? "");
    const slug = String(options.slug ?? entry.slug ?? entry.item?.slug ?? "");
    const address = String(options.address ?? entry.address_label ?? "");
    const type = String(options.type ?? entry.site_type ?? entry.type ?? "");
    const summary = String(options.summary ?? entry.summary ?? "");
    const searchText = String(options.searchText ?? entry.searchText ?? [title, slug, address, type, summary, entry.body].filter(Boolean).join(" "));
    const titleKey = normalizeText(title);
    const slugKey = normalizeText(slug);
    const normalizedSearchText = normalizeText(searchText);
    const searchSections = Array.isArray(options.searchSections ?? entry.searchSections)
      ? (options.searchSections ?? entry.searchSections)
      : [];
    return {
      ...entry,
      searchText: searchText.toLowerCase(),
      normalizedSearchText,
      searchTitleKey: titleKey,
      searchSlugKey: slugKey,
      searchAddressKey: normalizeText(address),
      searchTypeKey: normalizeText(type),
      searchSummaryKey: normalizeText(summary),
      searchBodyKey: normalizeText(options.body ?? entry.body ?? searchText),
      searchCompactTitleKey: titleKey.replace(/\s+/g, ""),
      searchCompactSlugKey: slugKey.replace(/\s+/g, ""),
      searchCompactFullKey: normalizedSearchText.replace(/\s+/g, ""),
      searchLeadingTitleTerms: titleKey.split(" ").filter(Boolean),
      searchCorrectionKeys: correctionKeys(title, slug, normalizeText),
      searchSectionKeys: searchSections.map(([sectionTitle, content]) => normalizeText(`${sectionTitle || ""} ${content || ""}`))
    };
  }

  function entryMatches(entry, value, options = {}) {
    const query = queryModel(value, options);
    if (!query.raw || !query.normalized) return false;
    if (query.lower && String(entry?.searchText || "").includes(query.lower)) return true;
    if (query.normalized && String(entry?.normalizedSearchText || "").includes(query.normalized)) return true;
    if (query.terms.length > 1 && query.terms.every(term => String(entry?.normalizedSearchText || "").includes(term))) return true;
    return query.compact.length >= 2 && (
      String(entry?.searchCompactTitleKey || "").includes(query.compact)
      || String(entry?.searchCompactFullKey || "").includes(query.compact)
    );
  }

  function rankEntries(entries = [], value, scoreEntry, options = {}) {
    const query = queryModel(value, options);
    const minimumScore = Number(options.minimumScore ?? 1);
    const limit = Number.isFinite(Number(options.limit)) ? Math.max(0, Number(options.limit)) : Infinity;
    return entries
      .map(entry => ({ entry, score: Number(scoreEntry(entry, query)) || 0 }))
      .filter(result => result.score >= minimumScore)
      .sort((left, right) => right.score - left.score
        || String(options.titleOf?.(left.entry) ?? left.entry?.title ?? "")
          .localeCompare(String(options.titleOf?.(right.entry) ?? right.entry?.title ?? "")))
      .slice(0, limit);
  }

  function editDistanceWithin(left, right, maxDistance = 3, options = {}) {
    const normalizeText = options.normalizeText || defaultNormalizeText;
    left = normalizeText(left);
    right = normalizeText(right);
    if (!left || !right) return maxDistance + 1;
    if (left === right) return 0;
    if (Math.abs(left.length - right.length) > maxDistance) return maxDistance + 1;
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
      const current = [i];
      let rowMin = current[0];
      for (let j = 1; j <= right.length; j += 1) {
        const cost = left[i - 1] === right[j - 1] ? 0 : 1;
        const next = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
        current[j] = next;
        rowMin = Math.min(rowMin, next);
      }
      if (rowMin > maxDistance) return maxDistance + 1;
      for (let j = 0; j < current.length; j += 1) previous[j] = current[j];
    }
    return previous[right.length];
  }

  function didYouMeanEntry(entries = [], value, matches = [], options = {}) {
    const normalizeText = options.normalizeText || defaultNormalizeText;
    const query = queryModel(value, { normalizeText });
    if (query.normalized.length < 3) return null;
    const titleOf = options.titleOf || (entry => entry?.title || "");
    const matchEntries = matches.map(match => match?.entry || match);
    if (matchEntries.some(entry => {
      const title = normalizeText(titleOf(entry));
      return title === query.normalized || title.startsWith(query.normalized);
    })) return null;
    const threshold = Math.max(1, Math.floor(query.normalized.length / 4));
    let best = null;
    for (const entry of entries) {
      const title = String(titleOf(entry) || "").trim();
      if (!title) continue;
      const keys = Array.isArray(entry?.searchCorrectionKeys) && entry.searchCorrectionKeys.length
        ? entry.searchCorrectionKeys
        : correctionKeys(title, options.slugOf?.(entry) || entry?.slug || entry?.item?.slug, normalizeText);
      let score = Infinity;
      for (const key of keys) {
        if (key === query.normalized) score = Math.min(score, 0);
        else if (key.startsWith(query.normalized) || query.normalized.startsWith(key)) {
          score = Math.min(score, Math.abs(key.length - query.normalized.length) <= 3 ? 1 : 2);
        } else if (Math.abs(key.length - query.normalized.length) <= 3) {
          score = Math.min(score, editDistanceWithin(query.normalized, key, 3, { normalizeText }));
        }
      }
      if (score > threshold) continue;
      if (!best || score < best.score || (score === best.score && title.localeCompare(best.title) < 0)) {
        best = { entry, title, score };
      }
    }
    return best?.entry || null;
  }

  global.NLI_SEARCH_UTILS = Object.freeze({
    normalizeSearchText: defaultNormalizeText,
    queryModel,
    prepareEntry,
    entryMatches,
    rankEntries,
    editDistanceWithin,
    didYouMeanEntry
  });
})(typeof window !== "undefined" ? window : globalThis);
