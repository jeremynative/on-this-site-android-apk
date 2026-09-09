(function () {
  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function previousLocalDateKey(date = new Date()) {
    const previous = new Date(date);
    previous.setDate(previous.getDate() - 1);
    return localDateKey(previous);
  }

  function directusFileId(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") return value.id || value.filename_disk || "";
    return "";
  }

  function directusAssetUrl(value, directusUrl) {
    const id = directusFileId(value);
    return id && directusUrl ? `${directusUrl}/assets/${id}` : "";
  }

  function relationId(value) {
    if (!value) return "";
    if (typeof value === "object") return value.id || value.value || "";
    return value;
  }

  function numeric(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeText(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function defaultStorage() {
    return typeof localStorage !== "undefined" ? localStorage : null;
  }

  function readStorageJson(keys, fallback = null, storage = defaultStorage()) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList.filter(Boolean)) {
      try {
        const raw = storage?.getItem?.(key);
        if (!raw) continue;
        return JSON.parse(raw);
      } catch {}
    }
    return fallback;
  }

  function writeStorageJson(keys, value, storage = defaultStorage()) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    const payload = JSON.stringify(value);
    let saved = false;
    keyList.filter(Boolean).forEach(key => {
      try {
        storage?.setItem?.(key, payload);
        saved = true;
      } catch {}
    });
    return saved;
  }

  function removeStorageKeys(keys, storage = defaultStorage()) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.filter(Boolean).forEach(key => {
      try {
        storage?.removeItem?.(key);
      } catch {}
    });
  }

  function normalizeActivityDateInput(value) {
    if (value instanceof Date || typeof value === "number") return value;
    const text = String(value || "").trim();
    if (!text) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T00:00:00`;
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(text) && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)) {
      return `${text.replace(" ", "T")}Z`;
    }
    return text;
  }

  function activityDateValue(value) {
    if (!value) return 0;
    const time = new Date(normalizeActivityDateInput(value)).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  function formatDate(value, options = {}) {
    const fallback = options.fallback || "";
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return options.invalidAsValue ? String(value).trim() || fallback : fallback;
    }
    return date.toLocaleDateString(options.locale, options.dateOptions || { month: "short", day: "numeric", year: "numeric" });
  }

  function validateJpegImage(file, options = {}) {
    if (!file) return "";
    const maxBytes = Number(options.maxBytes || 5 * 1024 * 1024);
    const isJpeg = file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name || "");
    if (!isJpeg) return options.typeMessage || "Use a JPG or JPEG image.";
    if (file.size > maxBytes) return options.sizeMessage || "Image must be 5 MB or smaller.";
    return "";
  }

  function plainTextValue(value) {
    return String(value || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sectionTitleKey(value) {
    return plainTextValue(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function sanitizeDomKey(value, options = {}) {
    const text = options.lowercase ? String(value || "").toLowerCase() : String(value || "");
    const pattern = options.collapse ? /[^a-z0-9_-]+/gi : /[^a-z0-9_-]/gi;
    return text.replace(pattern, "-");
  }

  function isWhyThisMattersTitle(value) {
    return sectionTitleKey(value) === "why this matters";
  }

  function legacyWhyThisMattersTexts(item = {}, fields = [], options = {}) {
    if (!item) return [];
    const hasContent = typeof options.hasContent === "function"
      ? options.hasContent
      : value => plainTextValue(value).length > 0;
    return (fields || [])
      .filter(field => isWhyThisMattersTitle(item[field.title] || field.defaultTitle || ""))
      .map(field => item[field.content])
      .filter(hasContent);
  }

  function uniqueTextBlocks(values = [], options = {}) {
    const cleanText = typeof options.cleanText === "function" ? options.cleanText : plainTextValue;
    const normalize = typeof options.normalizeText === "function"
      ? options.normalizeText
      : value => sectionTitleKey(value);
    const blocks = [];
    (values || []).forEach(value => {
      const text = cleanText(value || "");
      if (!text) return;
      const key = normalize(text);
      if (!key) return;
      const duplicate = blocks.some(block => {
        if (block.key === key) return true;
        return (key.length > 80 && block.key.includes(key)) || (block.key.length > 80 && key.includes(block.key));
      });
      if (!duplicate) blocks.push({ text, key });
    });
    return blocks.map(block => block.text);
  }

  function uniqueBy(items = [], keyFor = value => value) {
    const seen = new Set();
    return (items || []).filter((item, index) => {
      const key = keyFor(item, index);
      if (key == null || key === "") return true;
      const normalizedKey = String(key);
      if (seen.has(normalizedKey)) return false;
      seen.add(normalizedKey);
      return true;
    });
  }

  function contentSectionsFromFields(item = {}, fields = [], options = {}) {
    const hasContent = typeof options.hasContent === "function"
      ? options.hasContent
      : value => String(value || "").trim().length > 0;
    const excludeTitle = typeof options.excludeTitle === "function" ? options.excludeTitle : null;
    return (fields || [])
      .map(field => {
        const title = item[field.title] || field.defaultTitle || field.title;
        return [title, item[field.content], field];
      })
      .filter(([title, , field]) => !excludeTitle || !excludeTitle(title, field, item))
      .filter(([, value]) => hasContent(value));
  }

  function richTextHasDisplayContent(value, options = {}) {
    const raw = String(value || "");
    if (!raw.trim()) return false;
    if (/<(?:img|iframe|figure|table)\b/i.test(raw)) return true;
    if (/https?:\/\/[^\s"'<>]+\.(?:jpe?g|png|gif|webp|svg)(?:[?#][^\s"'<>]*)?/i.test(raw)) return true;
    const cleanText = typeof options.cleanText === "function" ? options.cleanText : plainTextValue;
    return cleanText(raw).length > 0;
  }

  function removeFootnoteReferenceMarkers(html) {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    template.content.querySelectorAll("sup.footnote-ref, sup[title]").forEach(node => node.remove());
    template.content.querySelectorAll("sup").forEach(node => {
      if (node.querySelector("a[title]")) node.remove();
    });
    return template.innerHTML.replace(/\[(\d+)(?:[.)])?\s*([^\]]{8,500})\]/g, "");
  }

  function importedFootnoteSources(value, options = {}) {
    const cleanText = typeof options.cleanText === "function" ? options.cleanText : text => String(text || "").trim();
    const normalize = typeof options.normalizeText === "function" ? options.normalizeText : text => String(text || "");
    const normalized = normalize(value);
    const notes = [
      ...[...String(value || "").matchAll(/<sup[^>]*title=(["'])(.*?)\1[^>]*>[\s\S]*?<\/sup>/gi)].map(match => cleanText(match[2])),
      ...[...String(value || "").matchAll(/<sup[^>]*>[\s\S]*?<a[^>]*title=(["'])(.*?)\1[^>]*>[\s\S]*?<\/a>[\s\S]*?<\/sup>/gi)].map(match => cleanText(match[2])),
      ...[...normalized.matchAll(/\[(\d+)(?:[.)])?\s*([^\]]{8,500})\]/g)].map(match => normalize(match[2]).trim())
    ].filter(Boolean);
    return [...new Set(notes)].slice(0, 6);
  }

  function sectionTimelineContentNodes(root, options = {}) {
    const cleanText = typeof options.stripHtml === "function" ? options.stripHtml : text => String(text || "").trim();
    const nodes = [];
    const visit = node => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (cleanText(node.textContent || "").length) nodes.push(node);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName || "";
      if (["H1", "H2", "H3", "H4", "P", "FIGURE", "IMG", "UL", "OL", "BLOCKQUOTE", "TABLE", "IFRAME"].includes(tag)) {
        if (["IMG", "IFRAME"].includes(tag) || cleanText(node.textContent || node.outerHTML || "").length || node.querySelector?.("img,iframe")) nodes.push(node);
        return;
      }
      [...node.childNodes].forEach(visit);
    };
    [...root.childNodes].forEach(visit);
    return nodes;
  }

  function sectionTimelineYearFromNode(node, text, options = {}) {
    const cleanText = typeof options.stripHtml === "function" ? options.stripHtml : value => String(value || "").trim();
    const trimmed = String(text || "").trim();
    const strong = node.querySelector?.("strong");
    const strongText = strong ? cleanText(strong.textContent || "") : "";
    const yearPattern = /^(?:c\.?\s*)?\d{3,4}(?:\s*[-\u2013]\s*(?:c\.?\s*)?\d{2,4})?$/;
    if (yearPattern.test(strongText)) return strongText;
    if (yearPattern.test(trimmed)) return trimmed;
    const leading = trimmed.match(/^((?:c\.?\s*)?\d{3,4}(?:\s*[-\u2013]\s*(?:c\.?\s*)?\d{2,4})?)\b(?=[:;,\-\s])/);
    return leading ? leading[1] : "";
  }

  function isInlineSectionHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    const element = template.content.firstElementChild;
    return element && ["A", "ABBR", "B", "CITE", "EM", "I", "SPAN", "STRONG", "U"].includes(element.tagName);
  }

  function isSectionTimelineHeading(node) {
    return node?.nodeType === Node.ELEMENT_NODE && /^H[1-4]$/i.test(node.tagName || "");
  }

  function sectionTimelineHtml(html, options = {}) {
    const cleanText = typeof options.stripHtml === "function" ? options.stripHtml : value => String(value || "").trim();
    const renderEvent = typeof options.renderEvent === "function" ? options.renderEvent : () => "";
    const template = document.createElement("template");
    template.innerHTML = html;
    const nodes = sectionTimelineContentNodes(template.content, { stripHtml: cleanText });
    const output = [];
    let timelineRun = [];
    let foundEvent = false;
    let current = null;
    let looseInline = [];
    const renderTimelineRun = () => {
      if (!timelineRun.length) return "";
      return typeof options.renderTimelineRun === "function"
        ? options.renderTimelineRun(timelineRun)
        : timelineRun.map(renderEvent).join("");
    };
    const flushTimelineRun = () => {
      const rendered = renderTimelineRun();
      if (rendered) output.push(rendered);
      timelineRun = [];
    };
    const flushLooseInline = () => {
      if (!looseInline.length) return;
      const inlineHtml = `<p>${looseInline.join(" ").replace(/\s+/g, " ").trim()}</p>`;
      if (current) current.nodes.push(inlineHtml);
      else output.push(inlineHtml);
      looseInline = [];
    };
    for (const node of nodes) {
      const text = cleanText(node.textContent || "");
      const year = sectionTimelineYearFromNode(node, text, { stripHtml: cleanText });
      if (year) {
        flushLooseInline();
        current = { year, nodes: [] };
        timelineRun.push(current);
        foundEvent = true;
        const remainder = text.replace(year, "").replace(/^[:;,\-\s]+/, "").trim();
        if (remainder.length > 12) current.nodes.push(`<p>${escapeHtml(remainder)}</p>`);
        continue;
      }
      const serialized = node.outerHTML || (text ? escapeHtml(text) : "");
      if (!serialized) continue;
      if (isSectionTimelineHeading(node)) {
        flushLooseInline();
        flushTimelineRun();
        current = null;
        output.push(serialized);
        continue;
      }
      if (node.nodeType === Node.TEXT_NODE || isInlineSectionHtml(serialized)) {
        looseInline.push(serialized);
      } else {
        flushLooseInline();
        if (current) current.nodes.push(serialized);
        else output.push(serialized);
      }
    }
    flushLooseInline();
    flushTimelineRun();
    return foundEvent ? output.join("") : "";
  }

  const CONTRIBUTOR_TIERS = Object.freeze([
    {
      key: "new",
      label: "New Contributor",
      minPoints: 0,
      commentsPerDay: 1,
      storiesPerDay: 1,
      plantsPerDay: 1,
      unlocks: "1 comment, 1 map story, and 1 plant ID each day"
    },
    {
      key: "trusted",
      label: "Trusted Contributor",
      minPoints: 100,
      commentsPerDay: 10,
      storiesPerDay: 10,
      plantsPerDay: 5,
      unlocks: "10 comments/stories and 5 plant IDs each day"
    },
    {
      key: "steward",
      label: "Community Steward",
      minPoints: 500,
      commentsPerDay: Infinity,
      storiesPerDay: Infinity,
      plantsPerDay: 10,
      unlocks: "unlimited comments/stories and 10 plant IDs each day"
    }
  ]);

  function contributorTierForPoints(points = 0) {
    const total = Math.max(0, Number(points) || 0);
    return [...CONTRIBUTOR_TIERS]
      .sort((a, b) => Number(b.minPoints || 0) - Number(a.minPoints || 0))
      .find(tier => total >= Number(tier.minPoints || 0)) || CONTRIBUTOR_TIERS[0];
  }

  function contributorDailyLimit(points = 0, kind = "comments") {
    const tier = contributorTierForPoints(points);
    if (kind === "plants" || kind === "plant") return tier.plantsPerDay;
    if (kind === "stories" || kind === "story") return tier.storiesPerDay;
    return tier.commentsPerDay;
  }

  function parseContributionTimestamp(value) {
    // Directus timestamp fields omit the UTC suffix; never interpret them as device-local time.
    const raw = typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value) ? `${value}Z` : value;
    return new Date(value ? raw : NaN);
  }

  function contributionDayKey(value = new Date()) {
    const date = parseContributionTimestamp(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }

  const sharedUtilities = {
    CONTRIBUTOR_TIERS, contributorTierForPoints, contributorDailyLimit, parseContributionTimestamp, contributionDayKey,
    escapeHtml,
    localDateKey,
    previousLocalDateKey,
    directusFileId,
    directusAssetUrl,
    relationId,
    numeric,
    normalizeText,
    readStorageJson,
    writeStorageJson,
    removeStorageKeys,
    activityDateValue,
    normalizeActivityDateInput,
    formatDate,
    validateJpegImage,
    plainTextValue,
    sectionTitleKey,
    sanitizeDomKey,
    isWhyThisMattersTitle,
    legacyWhyThisMattersTexts,
    uniqueTextBlocks,
    uniqueBy,
    contentSectionsFromFields,
    richTextHasDisplayContent,
    removeFootnoteReferenceMarkers,
    importedFootnoteSources,
    sectionTimelineContentNodes,
    sectionTimelineHtml,
    sectionTimelineYearFromNode,
    isInlineSectionHtml,
    isSectionTimelineHeading
  };
  if (typeof module !== "undefined" && module.exports) module.exports = sharedUtilities;
  else window.NLI_SHARED_UTILS = sharedUtilities;
}());
