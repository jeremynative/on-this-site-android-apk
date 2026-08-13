(function () {
  const normalizeActivityDateInput = window.NLI_SHARED_UTILS?.normalizeActivityDateInput || (value => {
    if (value instanceof Date || typeof value === "number") return value;
    const text = String(value || "").trim();
    if (!text) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return `${text}T00:00:00`;
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(text) && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)) {
      return `${text.replace(" ", "T")}Z`;
    }
    return text;
  });

  const activityDateValue = window.NLI_SHARED_UTILS?.activityDateValue || (value => {
    if (!value) return 0;
    const time = new Date(normalizeActivityDateInput(value)).getTime();
    return Number.isFinite(time) ? time : 0;
  });

  function localDayStart(time) {
    const date = new Date(time);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  function dateLabel(value, options = {}) {
    const time = activityDateValue(value);
    if (!time) return "Recently";
    const date = new Date(time);
    const timeLabel = options.includeTime
      ? date.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: options.hideTimeZone ? undefined : "short"
        })
      : "";
    const withTime = label => timeLabel ? `${label} - ${timeLabel}` : label;
    if (options.relative) {
      const days = Math.round((localDayStart(Date.now()) - localDayStart(time)) / 86400000);
      if (days < 0) return withTime(date.toLocaleDateString());
      if (days <= 0) return withTime("Today");
      if (days === 1) return withTime("Yesterday");
      if (days < 7) return withTime(`${days} days ago`);
      return withTime(date.toLocaleDateString());
    }
    return withTime(date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }));
  }

  function preview(value, options = {}) {
    const limit = Number(options.limit || 132);
    const cleanText = typeof options.cleanText === "function"
      ? options.cleanText(value || "")
      : String(value || "");
    const text = cleanText.replace(/\s+/g, " ").trim();
    if (!text || text.length <= limit) return text;
    if (options.preferSentence) {
      const sentence = text.split(/(?<=[.!?])\s+/).find(part => part.length > 35 && part.length <= limit);
      if (sentence) return sentence;
      const clipped = text.slice(0, limit + 1);
      const boundary = clipped.lastIndexOf(" ");
      return `${clipped.slice(0, boundary > 48 ? boundary : limit).trim()}...`;
    }
    return `${text.slice(0, limit - 3).trim()}...`;
  }

  function lastSeenKey(prefix, profileKey = "public") {
    return `${prefix}-${String(profileKey || "public").toLowerCase()}`;
  }

  function latestTimestamp(items = [], options = {}) {
    const dateAccessor = typeof options.dateAccessor === "function" ? options.dateAccessor : item => item?.date || item?.created_at;
    const capAtNow = options.capAtNow === true;
    const now = Date.now();
    return Math.max(0, ...items.map(item => {
      const value = activityDateValue(dateAccessor(item));
      return capAtNow ? Math.min(value, now) : value;
    }));
  }

  function unreadCount(items = [], seen = 0, options = {}) {
    const dateAccessor = typeof options.dateAccessor === "function" ? options.dateAccessor : item => item?.date || item?.created_at;
    const capAtNow = options.capAtNow === true;
    const now = Date.now();
    return items.filter(item => {
      const value = activityDateValue(dateAccessor(item));
      return value > seen && (!capAtNow || value <= now);
    }).length;
  }

  function defaultStorage() {
    return typeof localStorage !== "undefined" ? localStorage : null;
  }

  function readSeen(storageKey, storage = defaultStorage()) {
    try {
      const seen = Number(storage?.getItem?.(storageKey) || 0);
      return Number.isFinite(seen) ? seen : 0;
    } catch {
      return 0;
    }
  }

  function writeSeen(storageKey, items = [], options = {}) {
    const latest = Math.max(Date.now(), latestTimestamp(items, options));
    try {
      (options.storage || defaultStorage())?.setItem?.(storageKey, String(latest));
    } catch {}
    return latest;
  }

  function activityContentTarget(item = {}) {
    const itemType = String(item.kind || item.type || "").toLowerCase();
    const explicitType = String(item.contentSourceType || item.content_source_type || "").toLowerCase();
    const explicitSlug = String(item.contentSlug || item.content_slug || item.attachedSiteSlug || item.attached_site_slug || "").trim().toLowerCase();
    if (["site", "wiki"].includes(explicitType) && explicitSlug) {
      return { type: explicitType, slug: explicitSlug, key: `${explicitType}|${explicitSlug}` };
    }
    const sourceType = itemType === "historic-moment" || itemType === "comment" || itemType === "event"
      ? String(item.sourceType || item.source_type || "").toLowerCase()
      : itemType;
    const slug = String(item.sourceSlug || item.source_slug || item.slug || "").trim().toLowerCase();
    if (!["site", "wiki"].includes(sourceType) || !slug) return null;
    return { type: sourceType, slug, key: `${sourceType}|${slug}` };
  }

  function activityItemKey(item = {}) {
    const groupKey = String(item.activityGroupKey || item.activity_group_key || "").trim();
    if (groupKey) return groupKey;
    const target = activityContentTarget(item);
    const type = String(item.kind || item.type || "activity").toLowerCase();
    const id = String(item.commentId || item.comment_id || item.activityId || item.activity_id || item.id || "").trim();
    const title = String(item.title || item.sourceTitle || item.source_title || "").trim().toLowerCase();
    const date = String(item.date || item.created_at || item.updated_at || "").trim();
    return [type, target?.key || "global", id || String(item.slug || ""), title, date].join("|");
  }

  function activityItemKeys(item = {}) {
    const members = Array.isArray(item.activityMembers) ? item.activityMembers : [];
    if (!members.length) return [activityItemKey(item)];
    return [...new Set(members.flatMap(member => activityItemKeys(member)).filter(Boolean))];
  }

  function activityContentTargetKey(type, slug) {
    const normalizedType = String(type || "").trim().toLowerCase();
    const normalizedSlug = String(slug || "").trim().toLowerCase();
    return normalizedType && normalizedSlug ? `${normalizedType}|${normalizedSlug}` : "";
  }

  function contentActivityItems(items = [], type, slug) {
    const targetKey = activityContentTargetKey(type, slug);
    if (!targetKey) return [];
    return items.filter(item => activityContentTarget(item)?.key === targetKey);
  }

  function contentActivityItemKeys(items = [], type, slug) {
    return [...new Set(contentActivityItems(items, type, slug).flatMap(activityItemKeys).filter(Boolean))];
  }

  function contentUpdateActivityRecords(items = []) {
    return items.flatMap(item => [
      item,
      ...(Array.isArray(item?.activityMembers) ? item.activityMembers : [])
    ]).filter(Boolean);
  }

  function readSeenItemKeys(storageKey, storage = defaultStorage()) {
    try {
      const parsed = JSON.parse(storage?.getItem?.(storageKey) || "[]");
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
      return new Set();
    }
  }

  function writeSeenItemKeys(storageKey, keys = [], options = {}) {
    const storage = options.storage || defaultStorage();
    const existing = options.replace ? new Set() : readSeenItemKeys(storageKey, storage);
    [...keys].filter(Boolean).forEach(key => existing.add(String(key)));
    const values = [...existing].slice(-Math.max(50, Number(options.limit || 500)));
    try {
      storage?.setItem?.(storageKey, JSON.stringify(values));
    } catch {}
    return new Set(values);
  }

  function unreadItems(items = [], options = {}) {
    const baseline = Number(options.baseline || 0);
    const seenKeys = options.seenKeys instanceof Set ? options.seenKeys : new Set(options.seenKeys || []);
    const now = Number.isFinite(Number(options.now)) ? Number(options.now) : Date.now();
    return items.map(item => {
      const members = Array.isArray(item.activityMembers) && item.activityMembers.length ? item.activityMembers : [item];
      const unreadMembers = members.filter(member => {
        const date = activityDateValue(member?.date || member?.created_at);
        return date > baseline && date <= now && !seenKeys.has(activityItemKey(member));
      });
      if (!unreadMembers.length || seenKeys.has(activityItemKey(item))) return null;
      return { ...item, unreadWeight: unreadMembers.reduce((total, member) => total + Math.max(1, Number(member.groupedCount || 1) || 1), 0) };
    }).filter(Boolean);
  }

  function activityItemWeight(item = {}) {
    return Math.max(1, Number(item.unreadWeight || item.groupedCount || item.grouped_count || 1) || 1);
  }

  function weightedActivityCount(items = []) {
    return items.reduce((total, item) => total + activityItemWeight(item), 0);
  }

  function commentLabel(sourceType = "site", options = {}) {
    if (options.plantObservation) return `${options.authorName || "Contributor"} reported a plant`;
    const normalized = String(sourceType || "").toLowerCase();
    if (normalized === "wiki") return "Comment added to knowledgebase";
    if (normalized === "support") return "Project support";
    return "Comment added to a site";
  }

  function suggestionLabel(suggestion = {}) {
    return /source/i.test(String(suggestion.review_note || ""))
      ? "New source added"
      : "New site suggested";
  }

  function suggestionDate(suggestion = {}) {
    return suggestion.submitted_at || suggestion.date_created || suggestion.created_at || "";
  }

  function suggestionIsFeedback(suggestion = {}) {
    return /feedback/i.test(`${suggestion.title || ""} ${suggestion.review_note || ""}`) || Number(suggestion.priority) === 1;
  }

  function registrationDate(registration = {}) {
    return registration?.created_at || registration?.date_created || registration?.reviewed_at || "";
  }

  function registrationNeedsReview(registration = {}) {
    const status = String(registration?.status || "pending").toLowerCase();
    if (registration?.account_enabled === true || status === "approved") return false;
    if (registration?.account_banned === true || status === "banned" || status === "declined") return false;
    return true;
  }

  function siteEditedDate(site = {}, options = {}) {
    site = site || {};
    if (options.extended) {
      return site.last_reviewed || site.date_updated || site.updated_at || site.modified_at || site.last_edited_at || site.lastmod || site.wp_date || site.published_at || site.date_created || site.created_at || "";
    }
    return site.last_reviewed || site.date_updated || site.updated_at || site.lastmod || site.wp_date || site.published_at || site.date_created || "";
  }

  function siteCreatedDate(site = {}) {
    return site.imported_at || site.date_created || site.created_at || site.wp_date || "";
  }

  function wikiCreatedDate(article = {}) {
    return article.date_created || article.created_at || article.imported_at || article.wp_date || "";
  }

  function contentUpdateDate(item = {}) {
    item = item || {};
    return item.activity_update_date || item.activity_feed_date || "";
  }

  function contentActivityDate(item = {}, options = {}) {
    const created = options.type === "wiki" ? wikiCreatedDate(item) : siteCreatedDate(item);
    return contentUpdateDate(item) || created || "";
  }

  function relatedActivityMoments(item = {}, options = {}) {
    item = item || {};
    const type = String(options.type || "site").toLowerCase();
    const id = String(item.id ?? "");
    const slug = String(item.slug || "").toLowerCase();
    return (options.timelineEvents || [])
      .filter(moment => String(moment?.source_type || "").toLowerCase() === type)
      .filter(moment => {
        const sourceId = String(moment?.source_id ?? moment?.wiki_article ?? moment?.site ?? "");
        const sourceSlug = String(moment?.source_slug || "").toLowerCase();
        return Boolean((id && sourceId === id) || (slug && sourceSlug === slug));
      })
      .sort((a, b) =>
        Number(a.sort_key ?? a.start_year ?? Number.MAX_SAFE_INTEGER) - Number(b.sort_key ?? b.start_year ?? Number.MAX_SAFE_INTEGER) ||
        Number(a.id || 0) - Number(b.id || 0)
      );
  }

  function activityNewsPreview(item = {}, options = {}) {
    item = item || {};
    const cleanText = typeof options.cleanText === "function"
      ? options.cleanText
      : value => String(value || "").replace(/<[^>]*>/g, " ");
    const explicit = cleanText(item.activity_update_summary || item.activity_feed_summary || "").replace(/\s+/g, " ").trim();
    if (explicit) return preview(explicit, { cleanText, limit: options.limit || 230, preferSentence: true });

    const moments = relatedActivityMoments(item, options);
    if (moments.length) {
      const moment = moments[0];
      const date = cleanText(moment.date_label || moment.period || "").replace(/\s+/g, " ").trim();
      const detail = cleanText(moment.description || moment.source_excerpt || moment.title || "").replace(/\s+/g, " ").trim();
      if (detail) {
        const lead = options.isNew ? "New content includes" : "Featured research";
        return preview(`${lead}: ${date ? `${date} - ` : ""}${detail}`, {
          cleanText,
          limit: options.limit || 230,
          preferSentence: true
        });
      }
    }

    const candidates = options.type === "wiki"
      ? [item.content, item.why_this_matters]
      : [
          item.history_content,
          item.translation_content,
          item.preservation_content,
          item.oral_history_content,
          item.land_loss_content,
          item.why_this_matters
        ];
    const intro = cleanText(item.summary || item.introduction_content || item.introduction || "").replace(/\s+/g, " ").trim();
    const substantive = candidates
      .map(value => cleanText(value || "").replace(/\s+/g, " ").trim())
      .find(value => value && value !== intro);
    if (!substantive) return "";
    return preview(`${options.isNew ? "New content includes" : "Featured research"}: ${substantive}`, {
      cleanText,
      limit: options.limit || 230,
      preferSentence: true
    });
  }

  function contentUpdateFocusField(item = {}, activityItems = [], sectionFields = [], options = {}) {
    const cleanText = typeof options.cleanText === "function"
      ? options.cleanText
      : value => String(value || "").replace(/<[^>]*>/g, " ");
    const normalize = value => cleanText(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const stopWords = new Set([
      "about", "after", "again", "also", "been", "being", "from", "have", "into", "more", "most",
      "new", "site", "that", "their", "there", "these", "this", "update", "updated", "with", "your"
    ]);
    const tokens = value => new Set(normalize(value).split(" ").filter(token => token.length > 3 && !stopWords.has(token)));
    const activityText = [
      item.activity_update_summary,
      item.activity_feed_summary,
      ...activityItems.flatMap(activity => [
        activity?.preview,
        activity?.label,
        activity?.title,
        ...(Array.isArray(activity?.activityMembers)
          ? activity.activityMembers.flatMap(member => [member?.preview, member?.label, member?.title])
          : [])
      ])
    ].filter(Boolean).join(" ");
    const normalizedActivity = normalize(activityText);
    const activityTokens = tokens(activityText);
    const candidates = sectionFields
      .map(field => ({
        field: field.content,
        title: item[field.title] || field.defaultTitle || "",
        content: item[field.content] || ""
      }))
      .filter(candidate => candidate.field && normalize(candidate.content));
    if (normalize(item.why_this_matters)) {
      candidates.push({ field: "why_this_matters", title: "Why This Matters", content: item.why_this_matters });
    }
    if (!candidates.length) return "";
    const titleMatch = candidates.find(candidate => {
      const title = normalize(candidate.title);
      return title.length > 3 && normalizedActivity.includes(title);
    });
    if (titleMatch) return titleMatch.field;
    let best = null;
    candidates.forEach(candidate => {
      const candidateTokens = tokens(`${candidate.title} ${candidate.content}`);
      const overlap = [...activityTokens].filter(token => candidateTokens.has(token)).length;
      const score = overlap + (normalize(candidate.title) && normalizedActivity.includes(normalize(candidate.title)) ? 4 : 0);
      if (!best || score > best.score) best = { field: candidate.field, score };
    });
    if (best?.score > 0) return best.field;
    return candidates.find(candidate => candidate.field === "introduction_content")?.field || candidates[0].field;
  }

  function wikiActivityLabel(article = {}) {
    const created = wikiCreatedDate(article);
    const edited = contentUpdateDate(article);
    if (created && (!edited || sameCalendarDate(created, edited))) return "New Article";
    return "Wiki updated";
  }

  function wikiActivityDate(article = {}) {
    const created = wikiCreatedDate(article);
    const edited = contentUpdateDate(article);
    if (created && (!edited || sameCalendarDate(created, edited))) return created;
    return edited || created;
  }

  function wikiActivityPriority(article = {}) {
    return wikiActivityLabel(article) === "New Article" ? 20 : 0;
  }

  function eventActivityDate(event = {}) {
    return event.activity_feed_date ||
      event.date_updated ||
      event.updated_at ||
      event.modified_at ||
      event.date_created ||
      event.created_at ||
      event.added_at ||
      "";
  }

  function calendarDateKey(value) {
    const normalized = normalizeActivityDateInput(value);
    if (typeof normalized === "string") {
      const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    const time = activityDateValue(value);
    return time ? new Date(time).toISOString().slice(0, 10) : "";
  }

  function sameCalendarDate(first, second) {
    if (!first || !second) return false;
    const firstKey = calendarDateKey(first);
    const secondKey = calendarDateKey(second);
    return Boolean(firstKey && secondKey && firstKey === secondKey);
  }

  function siteActivityLabel(site = {}) {
    const created = siteCreatedDate(site);
    const edited = contentUpdateDate(site);
    if (created && (!edited || sameCalendarDate(created, edited))) return "Site added";
    return "Site updated";
  }

  function siteActivityDate(site = {}) {
    return contentActivityDate(site, { type: "site" });
  }

  function editedDateLabel(value, options = {}) {
    const formatter = window.NLI_SHARED_UTILS?.formatDate;
    const fallback = options.fallback || "10/01/2018";
    if (typeof formatter === "function") {
      return formatter(value, {
        fallback,
        invalidAsValue: true,
        locale: options.locale || "en-US",
        dateOptions: options.dateOptions || { month: "2-digit", day: "2-digit", year: "numeric" }
      });
    }
    return String(value || fallback);
  }

  function sortByRecentActivity(items = [], options = {}) {
    const dateAccessor = typeof options.dateAccessor === "function" ? options.dateAccessor : item => item?.date || item?.created_at;
    const titleAccessor = typeof options.titleAccessor === "function" ? options.titleAccessor : item => item?.title || "";
    return [...items].sort((a, b) => {
      const pinnedA = activityIsPinned(a, options);
      const pinnedB = activityIsPinned(b, options);
      return Number(pinnedB) - Number(pinnedA) ||
        // Pins are announcements: show the newest one first. Their expiry is only
        // a tie-breaker, so a long-running older pin cannot bury a new event.
        (pinnedB ? activityDateValue(dateAccessor(b)) : 0) - (pinnedA ? activityDateValue(dateAccessor(a)) : 0) ||
        (pinnedB ? activityDateValue(activityPinUntil(b)) : 0) - (pinnedA ? activityDateValue(activityPinUntil(a)) : 0) ||
        activityDateValue(dateAccessor(b)) - activityDateValue(dateAccessor(a)) ||
        Number(b.activityPriority || b.activity_priority || 0) - Number(a.activityPriority || a.activity_priority || 0) ||
        String(titleAccessor(a)).localeCompare(String(titleAccessor(b)));
    });
  }

  function activityItemType(item = {}) {
    return String(item.kind || item.type || "").toLowerCase();
  }

  function contentUpdateIdentity(item = {}) {
    if (activityIsPinned(item)) return null;
    const type = activityItemType(item);
    if (!["site", "wiki", "historic-moment"].includes(type)) return null;
    const sourceType = type === "historic-moment"
      ? String(item.sourceType || item.source_type || "").toLowerCase()
      : type;
    const slug = String(item.slug || item.source_slug || "").trim().toLowerCase();
    const day = calendarDateKey(item.date || item.created_at);
    if (!["site", "wiki"].includes(sourceType) || !slug || !day) return null;
    return { sourceType, slug, day, key: `${sourceType}|${slug}|${day}` };
  }

  function activityComparisonTokens(value) {
    const stopWords = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "is", "of", "on", "or", "the", "to", "was", "with"]);
    return new Set(String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(token => token.length > 2 && !stopWords.has(token)));
  }

  function activityUpdatesOverlap(first, second) {
    const left = String(first || "").replace(/\s+/g, " ").trim().toLowerCase();
    const right = String(second || "").replace(/\s+/g, " ").trim().toLowerCase();
    if (!left || !right) return false;
    if (left === right || (Math.min(left.length, right.length) > 45 && (left.includes(right) || right.includes(left)))) return true;
    const leftTokens = activityComparisonTokens(left);
    const rightTokens = activityComparisonTokens(right);
    if (!leftTokens.size || !rightTokens.size) return false;
    const shared = [...leftTokens].filter(token => rightTokens.has(token)).length;
    return shared / Math.min(leftTokens.size, rightTokens.size) >= 0.45;
  }

  function activityUpdateEntry(item = {}) {
    const type = activityItemType(item);
    const title = String(item.title || "").replace(/\s+/g, " ").trim();
    const detail = String(item.preview || "").replace(/\s+/g, " ").trim();
    if (type === "historic-moment") {
      return {
        title,
        detail: detail && !activityUpdatesOverlap(title, detail) ? detail : "",
        text: [title, detail].filter(Boolean).join(" "),
        type
      };
    }
    return { title: "", detail, text: detail || title, type };
  }

  function groupSameDayContentUpdates(items = []) {
    const buckets = new Map();
    const passthrough = [];
    items.forEach((item, index) => {
      const identity = contentUpdateIdentity(item);
      if (!identity) {
        passthrough.push({ item, index });
        return;
      }
      if (!buckets.has(identity.key)) buckets.set(identity.key, { identity, rows: [] });
      buckets.get(identity.key).rows.push({ item, index });
    });

    const grouped = [...passthrough];
    buckets.forEach(({ identity, rows }) => {
      if (rows.length === 1) {
        grouped.push(rows[0]);
        return;
      }
      const direct = rows.find(row => activityItemType(row.item) === identity.sourceType);
      const baseRow = direct || rows[0];
      const historicEntries = rows
        .filter(row => activityItemType(row.item) === "historic-moment")
        .map(row => activityUpdateEntry(row.item));
      const otherEntries = rows
        .filter(row => activityItemType(row.item) !== "historic-moment")
        .map(row => activityUpdateEntry(row.item))
        .filter(entry => !historicEntries.some(historic => activityUpdatesOverlap(entry.text, historic.text)));
      const updates = [...historicEntries, ...otherEntries]
        .filter(entry => entry.text)
        .filter((entry, index, list) => !list.slice(0, index).some(prior => activityUpdatesOverlap(entry.text, prior.text)))
        .map(({ title, detail, type }) => ({ title, detail, type }));
      const base = baseRow.item;
      const sourceTitle = String(base.sourceTitle || direct?.item?.title || base.title || "Archive update").trim();
      grouped.push({
        index: Math.min(...rows.map(row => row.index)),
        item: {
          ...base,
          title: sourceTitle,
          label: direct?.item?.label || (identity.sourceType === "wiki" ? "Wiki updated" : "Site updated"),
          sourceType: identity.sourceType,
          preview: "",
          updates,
          groupedActivity: true,
          groupedCount: rows.length,
          activityGroupKey: `activity-group:${identity.key}`,
          activityMembers: rows.map(row => row.item)
        }
      });
    });
    return grouped.sort((a, b) => a.index - b.index).map(entry => entry.item);
  }

  function updateListHtml(updates = [], options = {}) {
    if (!Array.isArray(updates) || !updates.length) return "";
    const escape = options.escapeHtml || (value => String(value || ""));
    return `<div class="activity-update-summary"><strong>Updated content</strong><ul>${updates.map(update => `<li>${update.title ? `<strong>${escape(update.title)}</strong>` : ""}${update.detail ? `<span>${escape(update.detail)}</span>` : ""}</li>`).join("")}</ul></div>`;
  }

  function mergeRecentActivity(groups = [], options = {}) {
    const limit = Number(options.limit || 40);
    return sortByRecentActivity(groupSameDayContentUpdates(groups.flat()), options).slice(0, limit);
  }

  function activityPinUntil(item = {}) {
    return item.pinUntil ||
      item.activity_pin_until ||
      item.pinned_until ||
      item.pin_until ||
      "";
  }

  function activityIsPinned(item = {}, options = {}) {
    const until = activityDateValue(activityPinUntil(item));
    if (!until) return false;
    const now = Number.isFinite(Number(options.now)) ? Number(options.now) : Date.now();
    return until >= now;
  }

  function activityPinLabel(item = {}) {
    return item.pinLabel || item.activity_pin_label || "Pinned";
  }

  window.NLI_ACTIVITY_UTILS = {
    dateLabel,
    normalizeActivityDateInput,
    preview,
    lastSeenKey,
    latestTimestamp,
    unreadCount,
    readSeen,
    writeSeen,
    activityContentTarget,
    activityContentTargetKey,
    activityItemKey,
    activityItemKeys,
    contentActivityItems,
    contentActivityItemKeys,
    contentUpdateActivityRecords,
    readSeenItemKeys,
    writeSeenItemKeys,
    unreadItems,
    activityItemWeight,
    weightedActivityCount,
    commentLabel,
    suggestionLabel,
    suggestionDate,
    suggestionIsFeedback,
    registrationDate,
    registrationNeedsReview,
    siteEditedDate,
    siteCreatedDate,
    wikiCreatedDate,
    contentUpdateDate,
    contentActivityDate,
    activityNewsPreview,
    contentUpdateFocusField,
    wikiActivityDate,
    eventActivityDate,
    siteActivityLabel,
    siteActivityDate,
    wikiActivityLabel,
    wikiActivityPriority,
    editedDateLabel,
    activityPinUntil,
    activityIsPinned,
    activityPinLabel,
    sortByRecentActivity,
    groupSameDayContentUpdates,
    updateListHtml,
    mergeRecentActivity
  };
}());
