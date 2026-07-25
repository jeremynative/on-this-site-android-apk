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

  function onThisDayNumber(date = new Date()) {
    const day = Number(date?.getDate?.());
    return Number.isFinite(day) && day >= 1 && day <= 31 ? String(day) : "";
  }

  function onThisDayCalendarMarkup(date = new Date()) {
    return `<span class="on-this-day-badge" aria-hidden="true"><span class="on-this-day-badge-date">${onThisDayNumber(date)}</span></span>`;
  }

  function roundedRectPath(context, x, y, width, height, radius) {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height - safeRadius);
    context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    context.lineTo(x + safeRadius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
  }

  function addOnThisDayMapImage(map, id = "on-this-day-calendar", date = new Date()) {
    if (!map?.addImage || map.hasImage?.(id) || typeof document === "undefined") return false;
    const pixelRatio = 2;
    const size = 38;
    const canvas = document.createElement("canvas");
    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    const context = canvas.getContext("2d");
    if (!context) return false;
    context.scale(pixelRatio, pixelRatio);

    context.shadowColor = "rgba(23, 38, 29, 0.28)";
    context.shadowBlur = 4;
    context.shadowOffsetY = 2;
    context.fillStyle = "#fbf7e9";
    context.strokeStyle = "#315c48";
    context.lineWidth = 2;
    roundedRectPath(context, 4, 5, 30, 29, 5);
    context.fill();
    context.shadowColor = "transparent";
    context.stroke();

    context.save();
    roundedRectPath(context, 4, 5, 30, 29, 5);
    context.clip();
    context.fillStyle = "#315c48";
    context.fillRect(4, 5, 30, 8);
    context.restore();

    context.strokeStyle = "#315c48";
    context.lineWidth = 2;
    context.lineCap = "round";
    [12, 26].forEach(x => {
      context.beginPath();
      context.moveTo(x, 3);
      context.lineTo(x, 8);
      context.stroke();
    });

    context.fillStyle = "#315c48";
    context.font = "700 15px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(onThisDayNumber(date), 19, 24);
    map.addImage(id, context.getImageData(0, 0, canvas.width, canvas.height), { pixelRatio });
    return true;
  }

  window.NLI_CALENDAR_UTILS = {
    addOnThisDayMapImage,
    eventTypeLabel,
    eventDateRange,
    exhibitDateLabel: eventDateRange,
    isCalendarEventActive,
    isExhibitActive: isCalendarEventActive,
    normalizeCalendarEvents,
    onThisDayCalendarMarkup,
    onThisDayNumber
  };
}());
