(function () {
  function eventTypeLabel(value) {
    return String(value || "event")
      .replace(/_/g, " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function eventDateRange(event = {}, options = {}) {
    if (event.is_permanent || event.on_view_status === "permanent") return "Permanent collection";
    const startValue = event.start_datetime || event.start_date;
    const endValue = event.end_datetime || event.end_date;
    const start = startValue ? new Date(startValue) : null;
    const end = endValue ? new Date(endValue) : null;
    const dateOptions = options.dateOptions || { month: "short", day: "numeric", year: "numeric" };
    if (start && end) return `${start.toLocaleDateString(undefined, dateOptions)} - ${end.toLocaleDateString(undefined, dateOptions)}`;
    if (start) return start.toLocaleDateString(undefined, dateOptions);
    if (event.collection_date) return `Collected ${new Date(event.collection_date).toLocaleDateString(undefined, dateOptions)}`;
    return eventTypeLabel(event.event_type || event.status);
  }

  function isCalendarEventActive(event = {}, deps = {}) {
    const normalizeText = deps.normalizeText || (value => String(value || "").toLowerCase().trim());
    const localDateKey = deps.localDateKey || (() => new Date().toISOString().slice(0, 10));
    const publishStatus = normalizeText(event.status);
    if (publishStatus && !/published|current|active|on view|permanent/.test(publishStatus)) return false;
    const viewStatus = normalizeText(event.on_view_status || event.status);
    if (viewStatus && !/published|current|active|on view|permanent/.test(viewStatus)) return false;
    if (event.is_permanent || viewStatus.includes("permanent")) return true;
    const today = localDateKey();
    const start = String(event.start_datetime || event.start_date || "").slice(0, 10);
    const end = String(event.end_datetime || event.end_date || "").slice(0, 10);
    if (start && start > today) return false;
    if (end && end < today) return false;
    return true;
  }

  function normalizeCalendarEvents(events, deps = {}) {
    const siteCenter = deps.siteCenter || (() => null);
    return (events || [])
      .filter(event => !event.status || event.status === "published")
      .map(event => {
        const geometry = event.geojson || null;
        return {
          ...event,
          slug: event.slug || String(event.id),
          center: siteCenter(geometry)
        };
      })
      .filter(event => event.title && event.center);
  }

  window.NLI_CALENDAR_UTILS = {
    eventTypeLabel,
    eventDateRange,
    exhibitDateLabel: eventDateRange,
    isCalendarEventActive,
    isExhibitActive: isCalendarEventActive,
    normalizeCalendarEvents
  };
}());
