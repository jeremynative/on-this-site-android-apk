(function () {
  function normalizeHex(value, fallback) {
    const text = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(text)) return text;
    if (/^[0-9a-f]{6}$/i.test(text)) return `#${text}`;
    return fallback;
  }

  function collectCoordinates(value, output = []) {
    if (!Array.isArray(value)) return output;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      output.push(value);
      return output;
    }
    value.forEach(item => collectCoordinates(item, output));
    return output;
  }

  function pointWithinBounds(point, bounds) {
    if (!Array.isArray(point) || !Array.isArray(bounds)) return false;
    const [lng, lat] = point;
    return Number.isFinite(lng) && Number.isFinite(lat)
      && lng >= bounds[0][0] && lng <= bounds[1][0]
      && lat >= bounds[0][1] && lat <= bounds[1][1];
  }

  function coordinateWithinBounds(lng, lat, bounds) {
    return pointWithinBounds([Number(lng), Number(lat)], bounds);
  }

  function milesBetweenPoints(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return null;
    const lngA = Number(a[0]);
    const latA = Number(a[1]);
    const lngB = Number(b[0]);
    const latB = Number(b[1]);
    if (![lngA, latA, lngB, latB].every(Number.isFinite)) return null;
    const toRad = value => value * Math.PI / 180;
    const earthMiles = 3958.8;
    const dLat = toRad(latB - latA);
    const dLng = toRad(lngB - lngA);
    const startLat = toRad(latA);
    const endLat = toRad(latB);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLng / 2) ** 2;
    const miles = earthMiles * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return Number.isFinite(miles) ? miles : null;
  }

  function distanceLabelMiles(miles) {
    return Number.isFinite(miles) ? `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi` : "";
  }

  function geometryBounds(geometry, options = {}) {
    if (!geometry || geometry.type === "Point") return null;
    const coords = collectCoordinates(geometry.coordinates, []);
    const valid = options.withinBounds
      ? coords.filter(point => pointWithinBounds([Number(point[0]), Number(point[1])], options.withinBounds))
      : coords;
    if (!valid.length) return null;
    let minLng = valid[0][0];
    let maxLng = valid[0][0];
    let minLat = valid[0][1];
    let maxLat = valid[0][1];
    for (const [lng, lat] of valid) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    return [[minLng, minLat], [maxLng, maxLat]];
  }

  function geometryBoundsCenter(geometry) {
    if (!geometry) return null;
    if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) return geometry.coordinates;
    const bounds = geometryBounds(geometry);
    return bounds ? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2] : null;
  }

  function geometryAverageCenter(geometry) {
    if (!geometry) return null;
    if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) return geometry.coordinates;
    const coords = collectCoordinates(geometry.coordinates, []);
    if (!coords.length) return null;
    const lng = coords.reduce((sum, point) => sum + point[0], 0) / coords.length;
    const lat = coords.reduce((sum, point) => sum + point[1], 0) / coords.length;
    return [lng, lat];
  }

  function geometryBoundsArea(geometry) {
    const bounds = geometryBounds(geometry);
    if (!bounds) return 0;
    return Math.abs(bounds[1][0] - bounds[0][0]) * Math.abs(bounds[1][1] - bounds[0][1]);
  }

  function ringBounds(ring = []) {
    if (!ring?.length) return null;
    const lngs = ring.map(point => Number(point?.[0])).filter(Number.isFinite);
    const lats = ring.map(point => Number(point?.[1])).filter(Number.isFinite);
    if (!lngs.length || !lats.length) return null;
    return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
  }

  function ringCenter(ring = [], options = {}) {
    if (!ring?.length) return null;
    if (options.method === "bounds") {
      const bounds = ringBounds(ring);
      return bounds ? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2] : null;
    }
    const coords = ring
      .map(point => [Number(point?.[0]), Number(point?.[1])])
      .filter(point => point.every(Number.isFinite));
    if (!coords.length) return null;
    const lng = coords.reduce((sum, point) => sum + point[0], 0) / coords.length;
    const lat = coords.reduce((sum, point) => sum + point[1], 0) / coords.length;
    return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
  }

  function ringKey(ring = [], options = {}) {
    const center = ringCenter(ring, options);
    return center ? `${center[0].toFixed(4)},${center[1].toFixed(4)},${ring.length}` : "";
  }

  function appendPolygonToGeometry(geometry, polygonCoordinates, options = {}) {
    if (!geometry || !polygonCoordinates?.length) return geometry;
    if (geometry.type === "Polygon") {
      return { type: "MultiPolygon", coordinates: [geometry.coordinates, polygonCoordinates] };
    }
    if (geometry.type === "MultiPolygon") {
      if (options.dedupe) {
        const key = ringKey(polygonCoordinates[0] || [], options);
        const exists = (geometry.coordinates || []).some(rings => ringKey(rings?.[0] || [], options) === key);
        if (exists) return geometry;
      }
      return { type: "MultiPolygon", coordinates: [...(geometry.coordinates || []), polygonCoordinates] };
    }
    return geometry;
  }

  function barrierBeachMatchesTerritory(site, center, sourceGeometry, options = {}) {
    if (!center || center[1] > 40.86) return false;
    const normalizeText = typeof options.normalizeText === "function"
      ? options.normalizeText
      : value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    const title = normalizeText(site?.title || "");
    if (!/canarsie|rockaway|merrick|massapequa|secatogue|unkechaug|shinnecock|montaukett/.test(title)) return false;
    const bounds = geometryBounds(sourceGeometry);
    if (!bounds) return false;
    return center[0] >= bounds[0][0] - 0.08 && center[0] <= bounds[1][0] + 0.08;
  }

  function pointInRing(point, ring = []) {
    const [x, y] = point || [];
    if (!Number.isFinite(x) || !Number.isFinite(y) || ring.length < 4) return false;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const intersects = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function pointInPolygonCoordinates(point, polygon = []) {
    if (!polygon.length || !pointInRing(point, polygon[0])) return false;
    return !polygon.slice(1).some(ring => pointInRing(point, ring));
  }

  function pointInGeometry(point, geometry) {
    if (!point || !geometry) return false;
    if (geometry.type === "Polygon") return pointInPolygonCoordinates(point, geometry.coordinates || []);
    if (geometry.type === "MultiPolygon") return (geometry.coordinates || []).some(polygon => pointInPolygonCoordinates(point, polygon));
    return false;
  }

  window.NLI_GEOMETRY_UTILS = {
    normalizeHex,
    collectCoordinates,
    pointWithinBounds,
    coordinateWithinBounds,
    milesBetweenPoints,
    distanceLabelMiles,
    geometryBounds,
    geometryBoundsCenter,
    geometryAverageCenter,
    geometryBoundsArea,
    ringBounds,
    ringCenter,
    ringKey,
    appendPolygonToGeometry,
    barrierBeachMatchesTerritory,
    pointInRing,
    pointInPolygonCoordinates,
    pointInGeometry
  };
}());
