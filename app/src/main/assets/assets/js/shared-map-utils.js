(function () {
  function layerExists(map, layerId) {
    return Boolean(map?.getLayer?.(layerId));
  }

  function sourceExists(map, sourceId) {
    return Boolean(map?.getSource?.(sourceId));
  }

  function setGeoJsonSourceData(map, sourceId, data) {
    const source = map?.getSource?.(sourceId);
    if (!source?.setData) return false;
    source.setData(data);
    return true;
  }

  function setGeoJsonSourceDataMany(map, entries = []) {
    return (entries || []).reduce((count, entry) => {
      const sourceId = Array.isArray(entry) ? entry[0] : entry?.sourceId;
      const data = Array.isArray(entry) ? entry[1] : entry?.data;
      return count + (setGeoJsonSourceData(map, sourceId, data) ? 1 : 0);
    }, 0);
  }

  function setLayerVisibility(map, layerId, visibility) {
    if (!layerExists(map, layerId)) return false;
    map.setLayoutProperty(layerId, "visibility", visibility);
    return true;
  }

  function setLayerVisibilityMany(map, layerIds = [], visibility) {
    return (layerIds || []).reduce((count, layerId) =>
      count + (setLayerVisibility(map, layerId, visibility) ? 1 : 0), 0
    );
  }

  function existingLayerIds(map, layerIds = []) {
    return (layerIds || []).filter(layerId => layerExists(map, layerId));
  }

  function queryRenderedFeaturesAround(map, point, layerIds = [], radius = 0, options = {}) {
    if (!map?.queryRenderedFeatures || !point) return options.fallback || [];
    const x = Number(point.x);
    const y = Number(point.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return options.fallback || [];
    const layers = existingLayerIds(map, layerIds);
    if (!layers.length) return options.fallback || [];
    const distance = Math.max(0, Number.isFinite(Number(radius)) ? Number(radius) : 0);
    return map.queryRenderedFeatures(
      [[x - distance, y - distance], [x + distance, y + distance]],
      { layers }
    );
  }

  function rebindLayerEvent(map, registry, type, layerId, handler) {
    if (!layerExists(map, layerId) || typeof handler !== "function") return false;
    const key = `${type}:${layerId}`;
    const previous = registry?.get?.(key);
    if (previous) map.off(type, layerId, previous);
    registry?.set?.(key, handler);
    map.on(type, layerId, handler);
    return true;
  }

  function bindPointerCursor(map, registry, layerIds = []) {
    existingLayerIds(map, layerIds).forEach(layerId => {
      const enter = () => {
        map.getCanvas().style.cursor = "pointer";
      };
      const leave = () => {
        map.getCanvas().style.cursor = "";
      };
      rebindLayerEvent(map, registry, "mouseenter", layerId, enter);
      rebindLayerEvent(map, registry, "mouseleave", layerId, leave);
    });
  }

  function scorePlaceSuggestion(suggestion, query, options = {}) {
    const normalize = typeof options.normalizeText === "function"
      ? options.normalizeText
      : value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    const weights = {
      poi: 70,
      address: 8,
      street: -45,
      place: -8,
      exactName: 60,
      prefixName: 30,
      nameTerm: 10,
      fullTerm: 4,
      missingTerm: -8,
      broadName: -45,
      ...(options.weights || {})
    };
    const featureType = String(suggestion?.feature_type || "").toLowerCase();
    const name = normalize(suggestion?.name || "");
    const full = normalize(`${suggestion?.name || ""} ${suggestion?.full_address || ""} ${suggestion?.place_formatted || ""}`);
    const queryKey = normalize(query);
    const queryTerms = queryKey.split(" ").filter(Boolean);
    if (!full) return -100;
    let score = 0;
    if (featureType === "poi") score += weights.poi;
    if (featureType === "address") score += weights.address;
    if (featureType === "street") score += weights.street;
    if (featureType === "place" || featureType === "locality" || featureType === "neighborhood") score += weights.place;
    if (name === queryKey) score += weights.exactName;
    if (name.startsWith(queryKey)) score += weights.prefixName;
    queryTerms.forEach(term => {
      if (name.includes(term)) score += weights.nameTerm;
      else if (full.includes(term)) score += weights.fullTerm;
      else score += weights.missingTerm;
    });
    if (/\b(united states|new york|long island)\b/i.test(suggestion?.name || "")) score += weights.broadName;
    return score;
  }

  window.NLI_SHARED_MAP_UTILS = {
    layerExists,
    sourceExists,
    setGeoJsonSourceData,
    setGeoJsonSourceDataMany,
    setLayerVisibility,
    setLayerVisibilityMany,
    existingLayerIds,
    queryRenderedFeaturesAround,
    rebindLayerEvent,
    bindPointerCursor,
    scorePlaceSuggestion
  };
}());
