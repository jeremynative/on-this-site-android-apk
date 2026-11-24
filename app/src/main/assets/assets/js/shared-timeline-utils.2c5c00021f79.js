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

  // Private working scans (Google Drive/Docs) are never shown; the printed citation stands alone.
  const publicSourceUrl = value => /^https?:\/\/\S+$/i.test(value) && !/^https?:\/\/(?:drive|docs)\.google\.com\//i.test(value);
  function sourceUrl(event = {}) {
    const relatedUrl = (Array.isArray(event.related_sources) ? event.related_sources : [])
      .map(relation => String(relation?.source?.url || "").trim())
      .find(publicSourceUrl);
    const value = String(relatedUrl || event.research_source_url || event.source_url || "").trim();
    return publicSourceUrl(value) ? value : "";
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
      push(publicSourceUrl(url) && !citation.includes(url) ? `${citation || source.title || "Source"}\n${url}` : citation);
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
    // Editorial YYYYMMDD keys preserve ordering for approximate dates and
    // old-style/new-style dates that Date.parse cannot interpret reliably.
    const calendarKey = String(record.sort_key || "").match(/^(1\d{3}|20\d{2})(\d{2})(\d{2})$/);
    if (calendarKey) {
      const [, year, month, day] = calendarKey.map(Number);
      if ((!Number.isFinite(start) || year === start) && month <= 12 && day <= 31) {
        return year + Math.max(0, month - 1) / 12 + day / 366;
      }
    }
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

  const CENTURY_WORDS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth",
    "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth",
    "twentieth", "twenty-first"];

  /** An ordinal century in words or digits ("Seventeenth century", "17th-century"): its middle year, or NaN. */
  function centuryYear(text) {
    const digits = /\b(\d{1,2})(?:st|nd|rd|th)[\s-]+century\b/.exec(text);
    const words = new RegExp(`\\b(${CENTURY_WORDS.join("|")})[\\s-]+century\\b`).exec(text);
    const century = digits ? Number(digits[1]) : words ? CENTURY_WORDS.indexOf(words[1]) + 1 : NaN;
    if (!Number.isFinite(century) || century < 1) return NaN;
    const year = (century - 1) * 100 + 50;
    return /\b(bce|bc)\b/.test(text) ? -year : year;
  }

  // A period tag naming one of the four periods, and the year that stands for it.
  const PERIOD_TAGS = [
    { pattern: /^pre.?contact( period)?$/, era: "precontact", year: -1000 },
    { pattern: /^(early )?contact( period)?$/, era: "contact", year: 1625 },
    { pattern: /^historic( period)?$/, era: "historic", year: 1850 },
    { pattern: /^contemporary( period)?$/, era: "contemporary", year: 2024 }
  ];

  /**
   * The year that places a moment in a period. Its own dates decide first: a
   * start year, then its sort key (a year, or a full date written YYYYMMDD; 0
   * and end-of-list keys like 999905 mean none), then a century or date in its
   * date label. A period tag naming a period wins over a sort key outside it.
   * Words like "present" or "archaeological" only decide when there is no date,
   * and only as whole words in its period or date label (a title's
   * "representative" is not the present day); the whole text is read only as a
   * last resort.
   */
  function eraYearValue(event = {}, options = {}) {
    const clamp = year => Math.max(-10000, Math.min(2030, year));
    const start = finiteYear(event.start_year);
    if (Number.isFinite(start)) return clamp(start);
    const label = [event.period, event.date_label].filter(Boolean).join(" ").toLowerCase();
    const key = finiteYear(event.sort_key);
    let dated = NaN;
    if (Number.isFinite(key) && key !== 0 && key < 100000) dated = key;
    else if (Number.isFinite(key) && key >= 10000000 && key < 30000000) dated = Math.trunc(key / 10000);
    if (!Number.isFinite(dated)) dated = centuryYear(label);
    if (!Number.isFinite(dated)) dated = sortValue(event, { fallback: NaN, candidates: ["date_label"] });
    const tag = PERIOD_TAGS.find(item => item.pattern.test(String(event.period || "").toLowerCase().replace(/[_-]+/g, " ").trim()));
    if (tag) {
      const era = ERAS.find(item => item.key === tag.era);
      return Number.isFinite(dated) && dated >= era.min && dated < era.max ? clamp(dated) : tag.year;
    }
    if (Number.isFinite(dated)) return clamp(dated);
    if (/\b(today|present|current|contemporary|modern)\b/.test(label)) return 2024;
    if (/\bpre.?contact\b|\b(ancient|prehistoric|archaic|orient|woodland)\b|\bpaleo|archaeolog/.test(label)) return -1000;
    if (/\bcontact\b/.test(label)) return 1625;
    if (/\bhistoric\b/.test(label)) return 1850;
    return textEraYearValue(event);
  }

  function textEraYearValue(event = {}) {
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

  /**
   * A moment's place in time for ordering lists: its own dates (start year, a
   * YYYYMMDD key or a dated label) first, the raw sort key only when it has none.
   * A raw key such as 16370716 or 164301 is not a year, so it never orders a list.
   */
  function momentOrderValue(event = {}, options = {}) {
    const chronological = chronologicalSortValue(event, { ...options, fallback: NaN });
    return Number.isFinite(chronological) ? chronological : sortValue(event, options);
  }

  function eventsForSource(events = [], sourceType = "", sourceId = "", sourceSlug = "", options = {}) {
    const valueForSort = typeof options.sortValue === "function" ? options.sortValue : event => momentOrderValue(event, options.sortOptions || {});
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

  // Editorial review, 2026-09-23: source notes remain in articles, not the overview.
  const BROWSE_HOLDS = new Map([
    [11, "Anecdotal burial location; no substantiated dated event"],
    [81, "Publication date conflated with a burial disturbance ten years earlier"],
    [111, "Living-community overview, not a discrete dated moment"],
    [144, "Legend assigned an unsupported precise year"],
    [145, "Voyage date conflicts with the other documented Block events"],
    [165, "Museum history conflates early excavations and later advocacy"],
    [186, "Later publication description of a burial place, not a dated action"],
    [266, "Broad whaling overview extends beyond its assigned date range"],
    [295, "Undated interpretive overview; retain in the article"],
    [298, "Missionary overview conflates multiple decades under 1740"],
    [6, "Local fencing permission without a documented Native-history connection"],
    [131, "Publication reference rather than a dated historical action"],
    [140, "Unresolved research note; clearer chapel events are available"],
    [181, "1896 date is not supported by the description of a 1911 source"],
    [445, "Citation and Native-history connection require review"],
    [447, "Patent citation explicitly awaits review"],
    [620, "Undated archaeological overview rather than a discrete moment"],
    [629, "Unresolved person and deed context"],
    [833, "Unresolved deed-or-lease description; duplicate wording"],
    [834, "Unresolved deed-or-lease description; duplicate wording"],
    [835, "Unresolved deed-or-lease description; duplicate wording"],
    [836, "Unresolved deed-or-lease description; duplicate wording"],
    [1648, "Gallery opening does not establish Native participation in this event"],
    [1705, "Library founding is not itself a Native-history event"],
    [1706, "Library building opening is not itself a Native-history event"],
    [1710, "Museum relocation is not itself a Native-history event"],
    // Historic Moments audit, 2026-11-07: a moment kept for a second place (same text, or
    // the same title and date in vaguer words) shows once on the timeline, as its first copy.
    [109, "Same moment as #38 (Paul Cuffee's ordination), kept for the Unkechaug reservation"],
    [72, "Same moment as #51 (the museum committee's fundraising), kept for the reservation"],
    [150, "Same moment as #57 (Samson Occom at Montauk), kept for Montaukett land"],
    [108, "Same moment as #59 (Azariah Horton's mission), kept for the Unkechaug reservation"],
    [1643, "Same moment as #1577 (Bunn's decoys at the Sportsmen's Show), kept for Duck Decoys"],
    [1647, "Same moment as #1644 (the Elders' waterfowl knowledge), kept for the black duck"],
    [1857, "Same moment as #1854 (Dongan's patent to Nicoll), kept for Sexton Island"],
    [1272, "Same moment as #394 (Kieft's Canarsie grant), in vaguer words"],
    [1273, "Same moment as #413 (the Conomsset petition), in vaguer words"],
    [1258, "Same moment as #598 (the Nissequogue boundary dispute), in vaguer words"],
    [1261, "Same moment as #787 (Tobacus in the Brookhaven deed), in vaguer words"],
    [876, "Same moment as #858 (Shinnecock federal recognition)"],
    [885, "Same moment as #880 (the Bethel-Christian Avenue-Laurel Hill district)"],
    [1254, "Same moment as #915 (the Yennecott purchase), in vaguer words"],
    [1255, "Same moment as #916 (Paucamp in a North Fork deed), in vaguer words"],
    [1262, "Same moment as #920 (Jefferson's Unkechaug vocabulary), in vaguer words"],
    [774, "Same purchase as #729 (three meadow necks, 1658), told for another neck"]
  ]);

  function browseExclusionReason(event = {}) {
    if (String(event.date_label || "").trim() === "1911" && / in Indian Place-Names$/i.test(String(event.title || ""))) {
      return "Repeated book-entry publication; retain the source in the place article";
    }
    return BROWSE_HOLDS.get(Number(event.id)) || "";
  }

  function completeSentences(text) {
    // Protect names, titles, dates, initials and decimals before finding sentence boundaries.
    const protectedText = String(text || "")
      .replace(/\b(?:Mr|Mrs|Ms|Dr|Rev|Col|Capt|Gen|St|Sr|Jr|Prof|Aug|Sept|Oct|Nov|Dec|Jan|Feb|Mar|Apr|Jun|Jul|vol|pp|p|ca|c)\./gi, value => value.replace(/\./g, "\uE000"))
      .replace(/\b(?:[A-Z]\.)+/g, value => value.replace(/\./g, "\uE000"))
      .replace(/(\d)\.(?=\d)/g, "$1\uE000");
    return (protectedText.match(/[^.!?]+(?:[.!?]+["”’']*(?:\s+|$)|$)/g) || [protectedText])
      .map(sentence => sentence.replace(/\uE000/g, ".").trim()).filter(Boolean);
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
      const sentences = completeSentences(cleaned);
      if (options.completeThought) {
        let result = sentences[0] || cleaned;
        for (const sentence of sentences.slice(1)) {
          if (result.length + sentence.length + 1 > limit) break;
          result += ` ${sentence}`;
        }
        return result;
      }
      const firstSentence = options.preferFirstSentence ? sentences[0] || cleaned : cleaned;
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
      const prefetch = Math.max(1, Math.min(4, Math.floor(Number(options.prefetch)) || 1));
      const pending = new Map();
      const prepare = index => {
        if (cancelled || index >= items.length || pending.has(index)) return;
        const item = items[index];
        const element = createItem(item, index);
        if (!element) { pending.set(index, null); return; }
        element.hidden = true;
        const beforeNode = typeof options.beforeNode === "function" ? options.beforeNode() : options.beforeNode;
        container.insertBefore(element, beforeNode?.parentNode === container ? beforeNode : null);
        let ready;
        try { ready = Promise.resolve(waitForMedia(element, item, index)).catch(() => {}); }
        catch (_) { ready = Promise.resolve(); }
        pending.set(index, {element, item, ready});
      };
      for (let index = 0; index < prefetch; index += 1) prepare(index);
      for (let index = 0; index < items.length; index += 1) {
        if (cancelled) return;
        const next = pending.get(index);
        if (next) await next.ready;
        if (cancelled) return;
        pending.delete(index);
        if (next) {
          next.element.hidden = false;
          controller.rendered += 1;
          options.onItemReady?.(next.element, next.item, index, controller.rendered);
        }
        prepare(index + prefetch);
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
    const sortForEvent = typeof options.sortValue === "function" ? options.sortValue : event => momentOrderValue(event);
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
      const entryTitle = matchedPlace?.eventTitle || titleForEvent(event);
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

  const biographyRouteSignatures = new WeakMap();
  function biographyRouteSignature(places = []) {
    if (biographyRouteSignatures.has(places)) return biographyRouteSignatures.get(places);
    const signature = places.map(place => {
      const coordinates = Array.isArray(place) ? place : place?.coordinates;
      return `${coordinates?.join(",") || ""}:${place?.skipToNext ? 1 : 0}${place?.skipFromPrevious ? 1 : 0}${place?.passThrough ? 1 : 0}`;
    }).join("|");
    biographyRouteSignatures.set(places, signature);
    return signature;
  }

  // Reconcile an enriched route at the current map position, rather than
  // keeping obsolete shortcuts or scaling elapsed time into a distant segment.
  function nearestBiographyRouteElapsed(timeline = [], coordinates, preferredElapsed = 0) {
    if (!coordinates?.every(Number.isFinite)) return 0;
    let cursor = 0, bestDistance = Infinity, bestTimeDistance = Infinity, result = 0;
    for (const item of timeline) {
      const start = item.start || item.point, end = item.end || start;
      const duration = Number(item.duration) || 0;
      if (start && end && item.type !== "reset" && item.type !== "fade-out" && item.type !== "fade-in") {
        const dx = end[0] - start[0], dy = end[1] - start[1], length = dx * dx + dy * dy;
        const t = length ? Math.max(0, Math.min(1, ((coordinates[0] - start[0]) * dx + (coordinates[1] - start[1]) * dy) / length))
          : Math.max(0, Math.min(1, (preferredElapsed - cursor) / (duration || 1)));
        const distance = (start[0] + dx * t - coordinates[0]) ** 2 + (start[1] + dy * t - coordinates[1]) ** 2;
        const elapsed = cursor + duration * t, timeDistance = Math.abs(elapsed - preferredElapsed);
        if (distance < bestDistance - 1e-12 || (Math.abs(distance - bestDistance) <= 1e-12 && timeDistance < bestTimeDistance)) {
          bestDistance = distance; bestTimeDistance = timeDistance; result = elapsed;
        }
      }
      cursor += duration;
    }
    return result;
  }

  // One illustrative map pace for every person, independent of route length,
  // point density and latitude. Short segments must not each add a time floor.
  function biographyTravelDuration(start, end) {
    if (![start, end].every(p => Array.isArray(p) && p.length >= 2 && p.slice(0, 2).every(Number.isFinite))) return 0;
    const radians = Math.PI / 180;
    const lat1 = start[1] * radians, lat2 = end[1] * radians;
    const a = Math.sin((lat2 - lat1) / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin((end[0] - start[0]) * radians / 2) ** 2;
    const metres = 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
    return metres / 6 * 1000;
  }

  // Pick once per person per page load. Rebuilds and layer toggles keep the
  // same phase; new visits get a fresh spread along visible moving segments.
  const biographyStartFractions = new Map();
  function biographyInitialElapsed(slug, timeline = []) {
    if (!biographyStartFractions.has(slug)) biographyStartFractions.set(slug, Math.random());
    const duration = timeline.reduce((sum, item) => sum + (item.type === "move" ? Math.max(0, Number(item.duration) || 0) : 0), 0);
    if (!duration) return 0;
    let remaining = biographyStartFractions.get(slug) * duration, cursor = 0;
    for (const item of timeline) {
      const span = Math.max(0, Number(item.duration) || 0);
      if (item.type === "move") {
        if (remaining < span) return cursor + remaining;
        remaining -= span;
      }
      cursor += span;
    }
    return 0;
  }

  window.NLI_TIMELINE_UTILS = {
    biographyTravelDuration,
    biographyInitialElapsed,
    biographyRouteSignature,
    nearestBiographyRouteElapsed,
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
    completeSentences,
    browseExclusionReason,
    momentOrderValue,
    waitForMediaElement,
    progressivelyAppendMediaItems,
    buildBiographyTimelineData
  };
}());
