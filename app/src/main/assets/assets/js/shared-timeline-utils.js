(function () {
  function cleanText(options, value) {
    const cleaner = typeof options.cleanText === "function" ? options.cleanText : text => String(text || "").trim();
    return cleaner(value || "");
  }

  function hasValue(value) {
    return value !== null && value !== undefined && String(value).trim() !== "";
  }

  function finiteYear(value) {
    if (!hasValue(value)) return NaN;
    const year = Number(value);
    return Number.isFinite(year) ? year : NaN;
  }

  function footnoteSources(event = {}, options = {}) {
    const description = String(event.description || "");
    const notes = [
      ...[...description.matchAll(/<sup[^>]*title=["']([^"']+)["'][^>]*>/gi)].map(match => cleanText(options, match[1])),
      ...[...description.matchAll(/\[(\d+)(?:[.)])?\s+([^\]]{8,500})\]/gi)].map(match => cleanText(options, match[2]))
    ].filter(Boolean);
    return [...new Set(notes)].slice(0, 6).join("; ");
  }

  function displayDescription(event = {}) {
    return String(event.description || "")
      .replace(/<sup[^>]*title=["'][^"']+["'][^>]*>[\s\S]*?<\/sup>/gi, "")
      .replace(/\[(\d+)(?:[.)])?\s+([^\]]{8,500})\]/gi, "");
  }

  function sourceUrl(event = {}) {
    const relatedUrl = (Array.isArray(event.related_sources) ? event.related_sources : [])
      .map(relation => relation?.source?.url || "")
      .find(value => /^https?:\/\/\S+$/i.test(String(value || "").trim()));
    const value = String(relatedUrl || event.research_source_url || event.source_url || "").trim();
    return /^https?:\/\/\S+$/i.test(value) ? value : "";
  }

  function sourceReferences(event = {}, options = {}) {
    const references = [];
    const push = value => {
      const text = cleanText(options, value || "");
      const key = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!key || references.some(item => item.key === key)) return;
      references.push({ key, text });
    };
    const related = (Array.isArray(event.related_sources) ? event.related_sources : [])
      .filter(Boolean)
      .sort((left, right) => Number(left?.sort || 999999) - Number(right?.sort || 999999) || Number(left?.id || 0) - Number(right?.id || 0));
    related.forEach(relation => {
      const source = relation?.source && typeof relation.source === "object" ? relation.source : {};
      const citation = cleanText(options, relation?.citation_context || source.citation || "") || cleanText(options, [
        source.author,
        source.title,
        source.year ? `(${source.year})` : ""
      ].filter(Boolean).join(", "));
      const url = String(source.url || "").trim();
      push(url && /^https?:\/\/\S+$/i.test(url) && !citation.includes(url) ? `${citation || source.title || "Source"}\n${url}` : citation);
    });
    push(event.citation || "");
    footnoteSources(event, options).split(/;\s+/).filter(Boolean).forEach(push);
    return references.map(item => item.text);
  }

  function sourceText(event = {}, options = {}) {
    const citation = cleanText(options, event.citation || "");
    const excerpt = cleanText(options, event.source_excerpt || "");
    const footnotes = footnoteSources(event, options);
    const section = cleanText(options, event.source_section || "");
    const source = cleanText(options, event.source_title || "");
    const references = sourceReferences(event, options);
    const reference = references.length > 1
      ? references.map((item, index) => `${index + 1}. ${item}`).join("\n\n")
      : references[0] || citation ||
      (excerpt ? (excerpt.length > 240 ? `${excerpt.slice(0, 237).trim()}...` : excerpt) : "") ||
      footnotes ||
      (source && section ? `${source} - ${section}` : "") ||
      (source ? `Connected source: ${source}` : "") ||
      options.fallback ||
      "Source details are being restored for this historic moment.";
    const url = sourceUrl(event);
    return url && !reference.includes(url) ? `${reference}\n${url}` : reference;
  }

  function normalizedMediaSource(value = "") {
    const decoded = String(value || "")
      .replace(/&amp;/gi, "&")
      .trim();
    if (!decoded) return "";
    try {
      const parsed = new URL(decoded, "https://nativelongisland.com/");
      return `${parsed.origin}${parsed.pathname}`.toLowerCase();
    } catch (_) {
      return decoded.replace(/[?#].*$/, "").toLowerCase();
    }
  }

  function mediaSources(value = "") {
    return [...String(value || "").matchAll(/<(?:img|source)\b[^>]*\b(?:src|srcset)=["']([^"']+)/gi)]
      .flatMap(match => String(match[1] || "").split(","))
      .map(candidate => normalizedMediaSource(candidate.trim().split(/\s+/)[0]))
      .filter(Boolean);
  }

  function stripDuplicateOverviewMedia(overviewContent = "", events = []) {
    const rawOverview = String(overviewContent || "");
    if (!rawOverview.trim()) return "";
    const eventSources = new Set(mediaSources((events || []).map(event => event.description || "").join(" ")));
    if (!eventSources.size) return rawOverview;
    const allMediaAlreadyInEvents = block => {
      const sources = mediaSources(block);
      return sources.length > 0 && sources.every(source => eventSources.has(source));
    };
    return rawOverview
      .replace(/<figure\b[\s\S]*?<\/figure>/gi, block => allMediaAlreadyInEvents(block) ? "" : block)
      .replace(/<picture\b[\s\S]*?<\/picture>/gi, block => allMediaAlreadyInEvents(block) ? "" : block)
      .replace(/<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>/gi, block => allMediaAlreadyInEvents(block) ? "" : block)
      .replace(/<img\b[^>]*>/gi, block => allMediaAlreadyInEvents(block) ? "" : block)
      .replace(/<p\b[^>]*>\s*<\/p>/gi, "")
      .trim();
  }

  function overviewIsRedundant(overviewContent = "", events = [], options = {}) {
    const rawOverview = String(overviewContent || "");
    if (!rawOverview.trim() || /<(?:img|figure|picture|video|audio|iframe)\b/i.test(rawOverview)) return false;
    const normalize = value => cleanText(options, value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(token => token.length >= 3 && !/^(?:the|and|for|that|with|from|this|was|were|are|has|had|its|into|their|then|than|but|not|also|who|when|where|which|while|about|over|under|after|before|during|through|between|upon|have|been|being|they|them|his|her|our|out|all|one|two|may|can)$/.test(token));
    const overviewTokens = [...new Set(normalize(rawOverview))];
    if (overviewTokens.length < Number(options.minimumTokens || 12)) return false;
    const eventTokenSet = new Set(normalize((events || []).map(event => [
      event.title,
      event.description,
      event.summary,
      event.source_excerpt
    ].filter(Boolean).join(" ")).join(" ")));
    if (!eventTokenSet.size) return false;
    const covered = overviewTokens.filter(token => eventTokenSet.has(token)).length;
    return covered / overviewTokens.length >= Number(options.threshold || 0.88);
  }

  function periodLabel(period) {
    return String(period || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function rangeLabel(event = {}, options = {}) {
    if (event.period) return event.date_label || periodLabel(event.period);
    if (event.date_label) return event.date_label;
    const start = finiteYear(event.start_year);
    const end = finiteYear(event.end_year);
    if (Number.isFinite(start) && Number.isFinite(end) && start !== end) return `${event.start_year}-${event.end_year}`;
    if (Number.isFinite(start)) return String(event.start_year);
    return options.fallback || "Historic moment";
  }

  function genericDateLabel(value) {
    const text = String(value || "").trim().toLowerCase();
    return !text || /^(place|mapped place|historic moment)$/i.test(text);
  }

  function broadEraDateLabel(value) {
    return /^(pre.?contact|contact period|historic|contemporary|modern|current|present)$/i.test(String(value || "").trim());
  }

  function extractedDateLabel(record = {}, options = {}) {
    const clean = value => cleanText(options, value);
    const start = finiteYear(record.start_year);
    const end = finiteYear(record.end_year);
    if (Number.isFinite(start) && Number.isFinite(end) && start !== end) return `${record.start_year}-${record.end_year}`;
    if (Number.isFinite(start)) return String(record.start_year);

    const explicit = clean(record.date_label || record.dateLabel || "");
    if (explicit && !genericDateLabel(explicit) && !(options.ignoreBroadEraLabels && broadEraDateLabel(explicit))) return explicit;

    const text = clean([
      record.title,
      record.label,
      record.description,
      record.summary,
      record.reason,
      record.source_excerpt
    ].filter(Boolean).join(" "));
    if (!text) return "";

    const range = text.match(/\b(?:c\.?|ca\.?|circa|about|around)?\s*(-?\d{3,4})\s*(?:-|–|—|to)\s*(-?\d{3,4})\b/i);
    if (range) return `${range[1]}-${range[2]}`;
    const year = text.match(/\b(?:c\.?|ca\.?|circa|about|around)?\s*(-?\d{3,4})(?:s)?\b/i);
    if (year) return year[1];
    const century = text.match(/\b(?:early|mid|late)?\s*(\d{1,2}(?:st|nd|rd|th)\s+century)\b/i);
    if (century) return century[0].replace(/\s+/g, " ").trim();
    if (/pre.?contact/i.test(text)) return "Precontact";
    if (/contact period|early contact/i.test(text)) return "Contact period";
    return "";
  }

  function usefulDateLabel(label, record = {}, options = {}) {
    const clean = cleanText(options, label || "");
    if (clean && !genericDateLabel(clean)) return clean;
    return extractedDateLabel(record, options) || clean;
  }

  function dateValue(value, options = {}) {
    if (!hasValue(value)) return NaN;
    const text = String(value).trim();
    if (!text) return NaN;
    const lower = text.toLowerCase();
    const keywordYears = options.keywordYears || [
      { pattern: /today|present|current|contemporary|modern/, value: 2024 },
      { pattern: /precontact|ancient|prehistoric|archaic|woodland/, value: 1200 },
      { pattern: /contact period/, value: 1625 }
    ];
    for (const item of keywordYears) {
      if (item?.pattern?.test(lower)) return item.value;
    }

    const cleaned = text.replace(/\b(circa|ca\.?|c\.|about|around)\b/gi, "").trim();
    const rangeMatch = options.parseRanges === false
      ? null
      : cleaned.toLowerCase().match(/(?:^|[^\d-])(-?\d{3,4})\s*(?:-|\u2013|to)\s*(-?\d{2,4})(?:s|\b)/);
    if (rangeMatch) {
      const year = Number(rangeMatch[1]);
      if (Number.isFinite(year) && year > -10000 && year < 2100) return year;
    }

    const parsed = Date.parse(cleaned);
    if (Number.isFinite(parsed)) {
      const date = new Date(parsed);
      const year = date.getFullYear();
      if (Number.isFinite(year) && year > 1000 && year < 2100) {
        return year + (date.getMonth() / 12) + ((date.getDate() || 1) / 366);
      }
    }

    const yearPattern = options.yearPattern || /(?:^|[^\d-])(-?\d{3,4})(?:s|\b)/;
    const yearMatch = lower.match(yearPattern);
    if (yearMatch) {
      const year = Number(yearMatch[1]);
      if (Number.isFinite(year) && year > -10000 && year < 2100) return year;
    }
    return NaN;
  }

  function sortValue(event = {}, options = {}) {
    const candidates = options.candidates || ["sort_key", "start_year", "date_label", "title", "description"];
    const numericFields = new Set(options.numericFields || ["sort_key", "start_year"]);
    const fallback = Number(options.fallback);
    const safeFallback = Number.isFinite(fallback) ? fallback : 999999;
    for (const field of candidates) {
      const value = typeof field === "function" ? field(event) : event[field];
      if (typeof field === "string" && numericFields.has(field)) {
        const numeric = finiteYear(value);
        if (Number.isFinite(numeric)) return numeric;
      }
      const parsed = dateValue(value, options);
      if (Number.isFinite(parsed)) return parsed;
    }
    return safeFallback;
  }

  function chronologicalSortValue(record = {}, options = {}) {
    const fallback = Number(options.fallback);
    const safeFallback = Number.isFinite(fallback) ? fallback : NaN;
    const start = finiteYear(record.start_year);
    const rawLabel = cleanText(options, record.dateLabel || record.date_label || "");
    const explicitLabel = rawLabel && !genericDateLabel(rawLabel) && !broadEraDateLabel(rawLabel)
      ? rawLabel
      : "";
    const labelValue = dateValue(explicitLabel, options);
    if (Number.isFinite(start)) {
      if (Number.isFinite(labelValue)) {
        const labelYear = labelValue < 0 ? Math.ceil(labelValue) : Math.floor(labelValue);
        if (labelYear === start) return labelValue;
      }
      return start;
    }
    if (Number.isFinite(labelValue)) return labelValue;

    const extracted = extractedDateLabel(record, { ...options, ignoreBroadEraLabels: true });
    const extractedValue = dateValue(extracted, options);
    if (Number.isFinite(extractedValue)) return extractedValue;

    return sortValue(record, {
      ...options,
      fallback: safeFallback,
      candidates: ["start_year", "date_label", "dateLabel", "title", "label", "description", "summary", "reason", "source_excerpt", "sort_key"]
    });
  }

  function safeSortNumber(value, fallback = 999999) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  const ERAS = [
    { key: "precontact", label: "Precontact", min: -10000, max: 1600 },
    { key: "contact", label: "Contact Period", min: 1600, max: 1700 },
    { key: "historic", label: "Historic", min: 1700, max: 1950 },
    { key: "contemporary", label: "Contemporary", min: 1950, max: 2030 }
  ];

  function eraYearValue(event = {}, options = {}) {
    const text = [
      event.period,
      event.date_label,
      event.title,
      event.description
    ].filter(Boolean).join(" ").toLowerCase();
    if (/today|present|current|contemporary|modern|21st century/.test(text)) return 2024;
    if (/pre.?contact|ancient|prehistoric|paleo|archaic|orient|woodland|archaeolog/.test(text)) return -1000;
    if (/contact period|early contact/.test(text)) return 1625;
    const exact = sortValue(event, {
      fallback: NaN,
      candidates: ["sort_key", "start_year", "date_label", "period", "title", "description"],
      keywordYears: [
        { pattern: /today|present|current|contemporary|modern/, value: 2024 },
        { pattern: /pre.?contact|ancient|prehistoric|paleo|archaic|orient|woodland|archaeolog/, value: -1000 },
        { pattern: /contact period|early contact/, value: 1625 }
      ]
    });
    if (Number.isFinite(exact)) return Math.max(-10000, Math.min(2030, exact));
    if (/colonial|deed|patent|treaty|17th century|18th century/.test(text)) return 1700;
    if (/19th century|20th century|historic|reservation/.test(text)) return 1850;
    return 2000;
  }

  function eraForEvent(event = {}, options = {}) {
    const year = eraYearValue(event, options);
    if (year < 1600) return ERAS[0];
    if (year < 1700) return ERAS[1];
    if (year < 1950) return ERAS[2];
    return ERAS[3];
  }

  function eventMatchesSource(event = {}, sourceType = "", sourceId = "", sourceSlug = "") {
    if (!event) return false;
    const numericSourceId = Number(sourceId);
    const relatedIdMatches = value => {
      if (!Number.isFinite(numericSourceId)) return false;
      return Number(relatedRecordId(value)) === numericSourceId;
    };
    if (sourceType === "site" && relatedIdMatches(event.site)) return true;
    if (sourceType === "wiki" && relatedIdMatches(event.wiki_article)) return true;
    if (sourceType === "calendar_event" && relatedIdMatches(event.calendar_event)) return true;
    if (event.source_type !== sourceType) return false;
    if (sourceSlug && event.source_slug === sourceSlug) return true;
    return Number.isFinite(numericSourceId) && Number(event.source_id) === numericSourceId;
  }

  function relatedRecordId(value) {
    if (value && typeof value === "object") return value.id ?? value.value ?? "";
    return value;
  }

  function recordFromIndex(index, value) {
    if (!index || !hasValue(value) || typeof index.get !== "function") return null;
    const candidates = [value, String(value)];
    const numeric = Number(value);
    if (Number.isFinite(numeric)) candidates.push(numeric);
    for (const candidate of candidates) {
      const record = index.get(candidate);
      if (record) return record;
    }
    return null;
  }

  function contentTarget(event = {}, options = {}) {
    const relatedSite = recordFromIndex(options.siteById, relatedRecordId(event.site));
    if (relatedSite) return { type: "site", record: relatedSite };

    const relatedWiki = recordFromIndex(options.wikiById, relatedRecordId(event.wiki_article));
    if (relatedWiki) return { type: "wiki", record: relatedWiki };

    if (event.source_type === "site") {
      const site = recordFromIndex(options.siteBySlug, event.source_slug)
        || recordFromIndex(options.siteById, event.source_id);
      if (site) return { type: "site", record: site };
    }
    if (event.source_type === "wiki") {
      const wiki = recordFromIndex(options.wikiBySlug, event.source_slug)
        || recordFromIndex(options.wikiById, event.source_id);
      if (wiki) return { type: "wiki", record: wiki };
    }
    if (event.source_type === "calendar_event") {
      const calendarEvent = recordFromIndex(options.calendarBySlug, event.source_slug)
        || recordFromIndex(options.calendarById, event.source_id);
      if (calendarEvent) return { type: "calendar_event", record: calendarEvent };
    }
    return null;
  }

  function eventsForSource(events = [], sourceType = "", sourceId = "", sourceSlug = "", options = {}) {
    const valueForSort = typeof options.sortValue === "function" ? options.sortValue : event => sortValue(event, options.sortOptions || {});
    return [...(events || [])]
      .filter(event => eventMatchesSource(event, sourceType, sourceId, sourceSlug))
      .sort((a, b) =>
        valueForSort(a) - valueForSort(b) ||
        String(a.date_label || "").localeCompare(String(b.date_label || "")) ||
        String(a.title || "").localeCompare(String(b.title || ""))
      );
  }

  function locationLabel(event = {}, options = {}) {
    const clean = value => cleanText(options, value);
    const explicit = clean(event.location_label || event.location || event.place_label || "");
    if (explicit) return explicit;
    if (event.source_type === "site" && event.source_title) return clean(event.source_title);
    const hasMappedLocation = typeof options.hasMappedLocation === "function"
      ? options.hasMappedLocation(event)
      : Boolean(event.latitude && event.longitude);
    return hasMappedLocation ? (options.mappedLabel || "Mapped location") : "";
  }

  function teaser(event = {}, options = {}) {
    const limit = Number(options.limit || 180);
    const text = cleanText(options, event.description || event.summary || "")
      .replace(/\s+/g, " ")
      .trim();
    if (text) {
      const cleaned = options.removeLeadingDate
        ? text.replace(/^\s*(in\s+)?(\d{3,4}s?|\d{3,4}(?:-\d{2,4})?|precontact|contact period|historic|contemporary)\s*[,:\-\u2013]?\s*/i, "").trim()
        : text;
      const firstSentence = options.preferFirstSentence
        ? cleaned.match(/[^.!?]+[.!?]/)?.[0] || cleaned
        : cleaned;
      return firstSentence.length > limit ? `${firstSentence.slice(0, Math.max(0, limit - 3)).trim()}...` : firstSentence;
    }
    const source = cleanText(options, event.source_title || "");
    if (source && options.sourceFallback !== false) return `Connected to ${source}.`;
    return options.fallback || "";
  }

  function waitForMediaElement(element, options = {}) {
    const selector = String(options.mediaSelector || "img");
    const timeoutMs = Math.max(250, Number(options.timeoutMs) || 3500);
    const media = [
      ...(element?.matches?.(selector) ? [element] : []),
      ...Array.from(element?.querySelectorAll?.(selector) || [])
    ];
    if (!media.length) return Promise.resolve();
    const waitForImage = image => new Promise(resolve => {
      let settled = false;
      let timer = null;
      const cleanup = () => {
        image.removeEventListener?.("load", onLoad);
        image.removeEventListener?.("error", onError);
        if (timer) clearTimeout(timer);
      };
      const finish = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const decodeThenFinish = () => {
        const decoded = typeof image.decode === "function" ? image.decode() : null;
        if (decoded?.then) decoded.then(finish).catch(finish);
        else finish();
      };
      const onLoad = () => decodeThenFinish();
      const onError = () => {
        const failedSource = String(image.currentSrc || image.src || "");
        setTimeout(() => {
          const replacementSource = String(image.currentSrc || image.src || "");
          if (replacementSource && replacementSource !== failedSource && !image.complete) return;
          if (replacementSource && replacementSource !== failedSource && Number(image.naturalWidth || 0) > 0) {
            decodeThenFinish();
            return;
          }
          finish();
        }, 0);
      };
      try {
        image.loading = "eager";
      } catch (_) {}
      image.addEventListener?.("load", onLoad);
      image.addEventListener?.("error", onError);
      timer = setTimeout(finish, timeoutMs);
      if (image.complete) {
        if (Number(image.naturalWidth || 0) > 0) decodeThenFinish();
        else onError();
      }
    });
    return Promise.all(media.map(waitForImage)).then(() => undefined);
  }

  function progressivelyAppendMediaItems(options = {}) {
    const container = options.container;
    const items = Array.isArray(options.items) ? options.items : [];
    const createItem = typeof options.createItem === "function" ? options.createItem : () => null;
    const waitForMedia = typeof options.waitForMedia === "function"
      ? options.waitForMedia
      : element => waitForMediaElement(element, options);
    const schedule = typeof options.schedule === "function"
      ? options.schedule
      : callback => {
          if (typeof requestAnimationFrame === "function") return requestAnimationFrame(callback);
          return setTimeout(callback, 16);
        };
    let cancelled = false;
    let resolveFinished;
    const finished = new Promise(resolve => { resolveFinished = resolve; });
    const controller = {
      cancel() {
        if (cancelled) return;
        cancelled = true;
        resolveFinished?.({ cancelled: true, rendered: controller.rendered, total: items.length });
        resolveFinished = null;
      },
      finished,
      rendered: 0,
      total: items.length
    };

    const finish = result => {
      if (!resolveFinished) return;
      resolveFinished(result);
      resolveFinished = null;
    };
    const run = async () => {
      if (!container || !items.length) {
        options.onComplete?.({ rendered: 0, total: items.length });
        finish({ cancelled: false, rendered: 0, total: items.length });
        return;
      }
      for (let index = 0; index < items.length; index += 1) {
        if (cancelled) return;
        const item = items[index];
        const element = createItem(item, index);
        if (!element) continue;
        element.hidden = true;
        const beforeNode = typeof options.beforeNode === "function" ? options.beforeNode() : options.beforeNode;
        container.insertBefore(element, beforeNode?.parentNode === container ? beforeNode : null);
        try {
          await waitForMedia(element, item, index);
        } catch (_) {}
        if (cancelled) return;
        element.hidden = false;
        controller.rendered += 1;
        options.onItemReady?.(element, item, index, controller.rendered);
        if (index < items.length - 1) {
          await new Promise(resolve => schedule(resolve));
        }
      }
      if (cancelled) return;
      const result = { cancelled: false, rendered: controller.rendered, total: items.length };
      options.onComplete?.(result);
      finish(result);
    };
    run();
    return controller;
  }

  function buildBiographyTimelineData(options = {}) {
    const article = options.article || {};
    const path = options.path || null;
    const events = Array.isArray(options.events) ? options.events : [];
    const pathPlaces = Array.isArray(path?.places) ? path.places : [];
    if (!pathPlaces.length && !events.length) return null;

    const matchesEvent = typeof options.matchesEvent === "function" ? options.matchesEvent : () => false;
    const coordinatesForEvent = typeof options.coordinatesForEvent === "function" ? options.coordinatesForEvent : () => null;
    const sortForEvent = typeof options.sortValue === "function" ? options.sortValue : event => sortValue(event);
    const dateLabelForEvent = typeof options.dateLabel === "function" ? options.dateLabel : event => rangeLabel(event);
    const titleForEvent = typeof options.title === "function" ? options.title : event => cleanText(options, event.title || event.source_title || "Historic moment");
    const locationForEvent = typeof options.location === "function" ? options.location : event => locationLabel(event, options);
    const descriptionHtmlForEvent = typeof options.descriptionHtml === "function" ? options.descriptionHtml : event => displayDescription(event);
    const sourceNoteForEvent = typeof options.sourceNote === "function" ? options.sourceNote : event => sourceText(event, options);
    const reasonTextForEvent = typeof options.reasonText === "function" ? options.reasonText : event => cleanText(options, displayDescription(event));
    const escape = typeof options.escapeHtml === "function" ? options.escapeHtml : value => String(value || "");
    const usedPathIndexes = new Set();

    const entries = events.map((event, eventIndex) => {
      const matchIndex = pathPlaces.findIndex((place, index) => !usedPathIndexes.has(index) && matchesEvent(place, event));
      const matchedPlace = matchIndex >= 0 ? pathPlaces[matchIndex] : null;
      if (matchIndex >= 0) usedPathIndexes.add(matchIndex);
      const locationText = locationForEvent(event) || matchedPlace?.place || "";
      const entryTitle = titleForEvent(event);
      const reason = reasonTextForEvent(event) || matchedPlace?.reason || "";
      const rawDateLabel = dateLabelForEvent(event);
      const chronologicalSort = chronologicalSortValue(event, options);
      const fallbackSort = sortForEvent(event);
      return {
        type: "moment",
        event,
        originalOrder: eventIndex,
        sort: Number.isFinite(chronologicalSort) ? chronologicalSort : fallbackSort,
        dateLabel: usefulDateLabel(rawDateLabel, event, options),
        title: entryTitle,
        location: locationText,
        descriptionHtml: descriptionHtmlForEvent(event),
        sourceNote: sourceNoteForEvent(event),
        coordinates: coordinatesForEvent(event) || matchedPlace?.coordinates || null,
        label: entryTitle,
        place: locationText,
        reason
      };
    });

    pathPlaces.forEach((place, index) => {
      if (usedPathIndexes.has(index)) return;
      const dateLabel = usefulDateLabel(place.dateLabel || place.date_label || "", place, options);
      const chronologicalSort = chronologicalSortValue({ ...place, dateLabel }, options);
      entries.push({
        type: "place",
        originalOrder: events.length + index,
        sort: Number.isFinite(chronologicalSort) ? chronologicalSort : 900000 + index,
        dateLabel,
        title: place.label,
        location: place.place,
        descriptionHtml: `<p>${escape(place.reason || "")}</p>`,
        sourceNote: `See the footnoted biography text and References for ${article?.title || "this biography"}; this place entry is a broad map aid.`,
        coordinates: place.coordinates,
        label: place.label,
        place: place.place,
        reason: place.reason
      });
    });

    if (!entries.length) return null;
    entries.sort((a, b) =>
      safeSortNumber(a.sort) - safeSortNumber(b.sort) ||
      String(a.dateLabel || "").localeCompare(String(b.dateLabel || "")) ||
      safeSortNumber(a.originalOrder) - safeSortNumber(b.originalOrder) ||
      String(a.title || "").localeCompare(String(b.title || ""))
    );

    const mappedPlaces = [];
    entries.forEach(entry => {
      if (!Array.isArray(entry.coordinates) || !entry.coordinates.every(Number.isFinite)) return;
      entry.mapOrder = mappedPlaces.length + 1;
      entry.pathIndex = mappedPlaces.length;
      mappedPlaces.push({
        label: entry.title || entry.label || `Place ${entry.mapOrder}`,
        title: entry.title || entry.label || `Place ${entry.mapOrder}`,
        dateLabel: entry.dateLabel || "",
        place: entry.location || entry.place || "",
        coordinates: entry.coordinates,
        reason: entry.reason || cleanText(options, entry.descriptionHtml || ""),
        order: entry.mapOrder,
        eventId: entry.event?.id || "",
        event_id: entry.event?.id || ""
      });
    });

    return {
      title: path?.title || `${article?.title || "Biography"} timeline and places`,
      note: path?.note || "Numbered entries use broad locations where source material supports a mappable place.",
      entries,
      places: mappedPlaces
    };
  }

  window.NLI_TIMELINE_UTILS = {
    footnoteSources,
    displayDescription,
    sourceUrl,
    sourceReferences,
    sourceText,
    stripDuplicateOverviewMedia,
    overviewIsRedundant,
    periodLabel,
    rangeLabel,
    dateValue,
    sortValue,
    chronologicalSortValue,
    eras: ERAS,
    eraYearValue,
    eraForEvent,
    eventMatchesSource,
    contentTarget,
    eventsForSource,
    locationLabel,
    teaser,
    waitForMediaElement,
    progressivelyAppendMediaItems,
    buildBiographyTimelineData
  };
}());
