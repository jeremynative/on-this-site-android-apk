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

  function basemapWaterBoundaryLayerId(map) {
    const layers = map?.getStyle?.()?.layers || [];
    const boundaryLayer = layers.find(layer =>
      ["fill", "line"].includes(layer?.type) &&
      ["water", "waterway"].includes(layer?.["source-layer"])
    );
    return boundaryLayer && layerExists(map, boundaryLayer.id) ? boundaryLayer.id : null;
  }

  function addLandLayerBeneathBasemapWater(map, layer) {
    if (!map?.addLayer || !layer) return null;
    const beforeId = basemapWaterBoundaryLayerId(map);
    if (beforeId) map.addLayer(layer, beforeId);
    else map.addLayer(layer);
    return beforeId;
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

  function polygonUnreadBadgeOffset(title, fontSize, maxWidthEm = 8, textOffsetEm = 0) {
    const words = String(title || "").trim().split(/\s+/).filter(Boolean);
    const characterWidthEm = 0.56;
    const lines = [];
    let lineWidth = 0;
    words.forEach(word => {
      const wordWidth = Math.max(0.8, word.length * characterWidthEm);
      const nextWidth = lineWidth ? lineWidth + characterWidthEm + wordWidth : wordWidth;
      if (lineWidth && nextWidth > maxWidthEm) {
        lines.push(lineWidth);
        lineWidth = wordWidth;
      } else {
        lineWidth = nextWidth;
      }
    });
    if (lineWidth || !lines.length) lines.push(lineWidth || 1);
    const safeFontSize = Math.max(8, Number(fontSize) || 10);
    const labelWidth = Math.min(maxWidthEm, Math.max(...lines)) * safeFontSize;
    const labelHeight = lines.length * safeFontSize * 1.16;
    const badgeRadius = 6;
    return [
      Math.round(labelWidth / 2 + badgeRadius),
      Math.round(textOffsetEm * safeFontSize - labelHeight / 2 - badgeRadius)
    ];
  }

  // Illustrative habitat loops, not sightings, migration tracks, or collecting locations.
  // Closed routes keep the turnaround continuous; terrestrial loops are mask-tested.
  const nativeAnimals = Object.freeze([
    { slug: "white-tailed-deer", title: "White-tailed Deer", habitat: "land", duration: 1200000, offset: 0.12,
      route: [[-72.89,40.86],[-72.883,40.862],[-72.877,40.858],[-72.883,40.855],[-72.89,40.86]] },
    { slug: "eastern-box-turtle", title: "Eastern Box Turtle", habitat: "land", duration: 1800000, offset: 0.38,
      route: [[-72.647,40.869],[-72.645,40.87],[-72.643,40.869],[-72.645,40.868],[-72.647,40.869]] },
    { slug: "wild-turkey", title: "Wild Turkey", habitat: "land", duration: 1200000, offset: 0.6,
      route: [[-72.804,40.837],[-72.797,40.839],[-72.79,40.837],[-72.797,40.833],[-72.804,40.837]] },
    { slug: "american-black-duck", title: "American Black Duck", habitat: "water", duration: 900000, offset: 0.25,
      route: [[-72.482,40.859],[-72.476,40.862],[-72.47,40.857],[-72.477,40.855],[-72.482,40.859]] },
    { slug: "american-eel", title: "American Eel", habitat: "water", duration: 1200000, offset: 0.45,
      route: [[-72.485,40.827],[-72.47,40.83],[-72.455,40.825],[-72.47,40.82],[-72.485,40.827]] }
  ].map(item => Object.freeze({ ...item, route: Object.freeze(item.route.map(point => Object.freeze(point))) })));
  const animalRouteModels = new WeakMap();
  function nativeAnimalMotion(animal, elapsed = 0, reducedMotion = false) {
    let model = animalRouteModels.get(animal);
    if (!model) {
      let total = 0;
      const segments = animal.route.slice(1).map((end, index) => {
        const start = animal.route[index];
        const length = Math.hypot((end[0]-start[0])*Math.cos(start[1]*Math.PI/180), end[1]-start[1]);
        const segment = {start,end,length,from:total}; total += length; return segment;
      });
      model = {segments,total}; animalRouteModels.set(animal,model);
    }
    const phase = (((reducedMotion ? 0 : Math.max(0,elapsed)) / animal.duration + animal.offset) % 1);
    const distance = phase * model.total;
    const segment = model.segments.find(s => distance < s.from+s.length) || model.segments[model.segments.length-1];
    const t = Math.max(0,Math.min(1,(distance-segment.from)/segment.length));
    // Ease to rest at each turn, never flip or teleport across a loop boundary.
    const eased = t*t*(3-2*t);
    return { coordinates: segment.start.map((v,i)=>v+(segment.end[i]-v)*eased), direction: segment.end[0] < segment.start[0] ? "left" : "right" };
  }
  function stepNativeAnimalClock(clock, now, paused = false) {
    const delta = clock.lastAt == null ? 0 : now-clock.lastAt;
    clock.lastAt = now;
    // An interrupted/backgrounded map resumes where it was, without catch-up travel.
    if (!paused && delta > 0 && delta <= 2500) clock.elapsed = (clock.elapsed || 0)+delta;
    return clock.elapsed || 0;
  }
  function nativeAnimalIcon(animal) {
    // A distinct URL replaces the previously cached flying-duck artwork.
    const name = animal.slug === "american-black-duck" ? "american-black-duck-decoy-v2" : animal.slug;
    return `assets/map-icons/animal-${name}.png`;
  }
  function nativeAnimalHtml(animal) {
    return `<button type="button" class="native-animal-marker" data-native-animal="${animal.slug}" aria-label="Open ${animal.title} article"><span class="native-animal-shell" aria-hidden="true"><img src="${nativeAnimalIcon(animal)}" alt=""></span></button>`;
  }

  // Scale artwork only: map anchors and accessible hit targets stay fixed.
  function biographyIconScale(zoom = 12) {
    return Math.max(0.5, Math.min(1, 0.5 + (Number(zoom) - 7) / 12));
  }
  const biographyScaleMaps = new WeakSet();
  function bindBiographyScale(map) {
    if (!map || biographyScaleMaps.has(map)) return;
    biographyScaleMaps.add(map);
    const update = event => map.getContainer().style.setProperty("--biography-icon-scale", String(biographyIconScale(event?.zoom ?? map.getZoom())));
    map.on("zoom", update);
    map.on("zoomanim", update);
    update();
  }

  window.NLI_SHARED_MAP_UTILS = {
    biographyIconScale, bindBiographyScale,
    nativeAnimals, nativeAnimalMotion, stepNativeAnimalClock, nativeAnimalIcon, nativeAnimalHtml,
    layerExists,
    sourceExists,
    setGeoJsonSourceData,
    setGeoJsonSourceDataMany,
    setLayerVisibility,
    setLayerVisibilityMany,
    existingLayerIds,
    basemapWaterBoundaryLayerId,
    addLandLayerBeneathBasemapWater,
    queryRenderedFeaturesAround,
    rebindLayerEvent,
    bindPointerCursor,
    scorePlaceSuggestion,
    polygonUnreadBadgeOffset
  };
}());
