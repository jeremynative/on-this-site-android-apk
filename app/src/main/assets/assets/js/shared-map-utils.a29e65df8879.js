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
    { slug: "white-tailed-deer", title: "Deer (autuk)", habitat: "land", duration: 1200000, offset: 0.12,
      route: [[-72.89,40.86],[-72.883,40.862],[-72.877,40.858],[-72.883,40.855],[-72.89,40.86]] },
    { slug: "eastern-box-turtle", title: "Turtle (matcík)", habitat: "land", duration: 1800000, offset: 0.38,
      route: [[-72.647,40.869],[-72.645,40.87],[-72.643,40.869],[-72.645,40.868],[-72.647,40.869]] },
    { slug: "wild-turkey", title: "Turkey", habitat: "land", duration: 1200000, offset: 0.6,
      route: [[-72.804,40.837],[-72.797,40.839],[-72.79,40.837],[-72.797,40.833],[-72.804,40.837]] },
    { slug: "american-black-duck", title: "Duck (nanásecus)", habitat: "water", duration: 900000, offset: 0.25,
      route: [[-72.482,40.859],[-72.476,40.862],[-72.47,40.857],[-72.477,40.855],[-72.482,40.859]] },
    { slug: "american-eel", title: "Eel", habitat: "water", duration: 1200000, offset: 0.45,
      // Sheltered loop inside Shinnecock Bay, north of the barrier beach.
      route: [[-72.492,40.864],[-72.487,40.869],[-72.478,40.866],[-72.485,40.862],[-72.492,40.864]] }
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
  function mapIconSize(base = 1) {
    return ["interpolate", ["linear"], ["zoom"], 7, base * 0.5, 13, base];
  }
  function bindBiographyScale(map) {
    if (!map || biographyScaleMaps.has(map)) return;
    biographyScaleMaps.add(map);
    const update = event => map.getContainer().style.setProperty("--biography-icon-scale", String(biographyIconScale(event?.zoom ?? map.getZoom())));
    map.on("zoom", update);
    map.on("zoomanim", update);
    update();
  }

  // The map's shoreline outline covers Long Island only, so the mainland across the Sound and
  // the harbor (Connecticut, Westchester, the Bronx, Manhattan, New Jersey, Staten Island, Rhode
  // Island) needs its own test, or a person walking there is drawn in a canoe. A rough outline:
  // the Sound's northern shore west to the Battery, down the bay's west side past Staten Island,
  // then the New Jersey coast. Coarse by design (river mouths and small bays count as land).
  const MAINLAND_RING = [
    [-75.5, 39.4], [-75.5, 42.5], [-71.0, 42.5], [-71.0, 41.48], [-71.4, 41.44], [-71.5, 41.36], [-71.85, 41.31],
    [-72.1, 41.31], [-72.35, 41.26], [-72.6, 41.26], [-72.95, 41.24], [-73.2, 41.13], [-73.45, 41.04], [-73.6, 40.96],
    [-73.7, 40.88], [-73.78, 40.84], [-73.84, 40.8], [-73.94, 40.77], [-73.97, 40.72], [-74.01, 40.7], [-74.04, 40.7],
    [-74.07, 40.65], [-74.06, 40.6], [-74.07, 40.57], [-74.12, 40.53], [-74.25, 40.5], [-74.27, 40.45], [-74.0, 40.4],
    [-74.05, 40.0], [-74.4, 39.4]
  ];
  function isMainland(coordinates) {
    const [lng, lat] = Array.isArray(coordinates) ? coordinates.map(Number) : [];
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
    if (lng >= -75.5 && lng <= -71 && lat >= 39.4 && lat <= 42.5) {
      let inside = false;
      for (let i = 0, j = MAINLAND_RING.length - 1; i < MAINLAND_RING.length; j = i++) {
        const [x1, y1] = MAINLAND_RING[i];
        const [x2, y2] = MAINLAND_RING[j];
        if ((y1 > lat) !== (y2 > lat) && lng < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) inside = !inside;
      }
      return inside;
    }
    // Farther inland across the Northeast (upstate New York, New England, Pennsylvania).
    return lat > 39.4 && lat < 47 && lng > -80 && lng < -69.5;
  }

  window.NLI_SHARED_MAP_UTILS = {
    siteTitlePadding: ["interpolate", ["linear"], ["zoom"], 9, 36, 12, 24, 15, 6],
    isMainland,
    biographyIconScale, bindBiographyScale, mapIconSize,
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
