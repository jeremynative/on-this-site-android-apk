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

  function wikiActivityLabel(article = {}) {
    const created = wikiCreatedDate(article);
    const edited = siteEditedDate(article, { extended: true });
    if (created && (!edited || sameCalendarDate(created, edited))) return "New Article";
    return "Wiki updated";
  }

  function wikiActivityDate(article = {}) {
    const created = wikiCreatedDate(article);
    const edited = siteEditedDate(article, { extended: true });
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
    const edited = siteEditedDate(site);
    if (created && (!edited || sameCalendarDate(created, edited))) return "Site added";
    return "Site updated";
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
        (pinnedB ? activityDateValue(activityPinUntil(b)) : 0) - (pinnedA ? activityDateValue(activityPinUntil(a)) : 0) ||
        activityDateValue(dateAccessor(b)) - activityDateValue(dateAccessor(a)) ||
        Number(b.activityPriority || b.activity_priority || 0) - Number(a.activityPriority || a.activity_priority || 0) ||
        String(titleAccessor(a)).localeCompare(String(titleAccessor(b)));
    });
  }

  function mergeRecentActivity(groups = [], options = {}) {
    const limit = Number(options.limit || 40);
    return sortByRecentActivity(groups.flat(), options).slice(0, limit);
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
    commentLabel,
    suggestionLabel,
    suggestionDate,
    suggestionIsFeedback,
    registrationDate,
    registrationNeedsReview,
    siteEditedDate,
    siteCreatedDate,
    wikiCreatedDate,
    wikiActivityDate,
    eventActivityDate,
    siteActivityLabel,
    wikiActivityLabel,
    wikiActivityPriority,
    editedDateLabel,
    activityPinUntil,
    activityIsPinned,
    activityPinLabel,
    sortByRecentActivity,
    mergeRecentActivity
  };
}());
