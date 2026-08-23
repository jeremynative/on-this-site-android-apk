const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const siteIndexPath = path.join(root, "app/src/main/assets/assets/data/mobile-site-index.json");
const siteGeometryPath = path.join(root, "app/src/main/assets/assets/data/mobile-site-geometry.json");
const landMaskPath = path.join(root, "app/src/main/assets/long-island-land-mask-lite.json");
const drawableDir = path.join(root, "app/src/main/res/drawable");
const legacyIconPath = path.join(root, "app/src/main/res/mipmap-anydpi/ic_launcher.xml");
const legacyRoundIconPath = path.join(root, "app/src/main/res/mipmap-anydpi/ic_launcher_round.xml");
const previewDir = path.join(root, "build/launcher-icon-preview");
const launcherBackground = "#071A33";
const territoryBoundary = "#E8F0EA";

const territorySlugs = [
  "canarsie-traditional-land",
  "rockaway-traditional-land",
  "matinecock-traditional-land",
  "merrick-ancestral-land",
  "massapequa-ancestral-lands",
  "nissaquogues",
  "secatogue-ancestral-land",
  "setauket-ancestral-land",
  "unkechaug-ancestral-land",
  "corchaug-ancestral-land",
  "shinnecock-ancestral-land",
  "montaukett-ancestral-land",
  "manhansett-ancestral-land"
];

const bounds = {
  west: -74.05,
  east: -71.82,
  south: 40.54,
  north: 41.20
};

const frame = {
  left: 14,
  right: 94,
  top: 29,
  bottom: 79
};

function project(point) {
  const x = frame.left + ((point[0] - bounds.west) / (bounds.east - bounds.west)) * (frame.right - frame.left);
  const y = frame.bottom - ((point[1] - bounds.south) / (bounds.north - bounds.south)) * (frame.bottom - frame.top);
  return [x, y];
}

function perpendicularDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  return Math.abs(dy * point[0] - dx * point[1] + end[0] * start[1] - end[1] * start[0]) / Math.hypot(dx, dy);
}

function simplifyOpen(points, tolerance) {
  if (points.length <= 2) return points;
  let furthestIndex = -1;
  let furthestDistance = 0;
  const start = points[0];
  const end = points[points.length - 1];
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = perpendicularDistance(points[index], start, end);
    if (distance > furthestDistance) {
      furthestDistance = distance;
      furthestIndex = index;
    }
  }
  if (furthestDistance <= tolerance || furthestIndex < 0) return [start, end];
  const left = simplifyOpen(points.slice(0, furthestIndex + 1), tolerance);
  const right = simplifyOpen(points.slice(furthestIndex), tolerance);
  return left.slice(0, -1).concat(right);
}

function simplifyRing(points, tolerance = 0.7) {
  if (!Array.isArray(points) || points.length < 4) return [];
  const open = points.slice(0, -1).map(project);
  if (open.length < 3) return [];
  let split = 1;
  let maxDistance = 0;
  for (let index = 1; index < open.length; index += 1) {
    const distance = Math.hypot(open[index][0] - open[0][0], open[index][1] - open[0][1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      split = index;
    }
  }
  const first = simplifyOpen(open.slice(0, split + 1), tolerance);
  const second = simplifyOpen(open.slice(split).concat([open[0]]), tolerance);
  const combined = first.slice(0, -1).concat(second.slice(0, -1));
  return combined.length >= 3 ? combined : [];
}

function signedArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    area += points[index][0] * next[1] - next[0] * points[index][1];
  }
  return area / 2;
}

function coordinateRings(value, rings = []) {
  if (!Array.isArray(value)) return rings;
  if (value.length >= 4 && Array.isArray(value[0]) && typeof value[0][0] === "number") {
    rings.push(value);
    return rings;
  }
  value.forEach(child => coordinateRings(child, rings));
  return rings;
}

function ringWithinIconScope(ring) {
  if (!ring.length) return false;
  const inside = ring.filter(([longitude, latitude]) =>
    longitude >= bounds.west && longitude <= bounds.east && latitude >= bounds.south && latitude <= bounds.north
  ).length;
  return inside / ring.length >= 0.9;
}

function formatNumber(value) {
  return Number(value.toFixed(2)).toString();
}

function geometryPathData(geometry, tolerance = 0.7, minimumArea = 0.2) {
  return coordinateRings(geometry.coordinates)
    .filter(ringWithinIconScope)
    .map(ring => simplifyRing(ring, tolerance))
    .filter(ring => ring.length >= 3 && Math.abs(signedArea(ring)) >= minimumArea)
    .map(ring => `M${ring.map(([x, y]) => `${formatNumber(x)},${formatNumber(y)}`).join("L")}Z`)
    .join("");
}

function vectorMosaic(territories, outlinePath, indent = "    ") {
  const territoryPaths = territories.map(territory => [
    `${indent}    <path`,
    `${indent}        android:fillColor="${territory.color}"`,
    `${indent}        android:fillType="evenOdd"`,
    `${indent}        android:strokeColor="${territoryBoundary}"`,
    `${indent}        android:strokeWidth="0.36"`,
    `${indent}        android:strokeLineJoin="round"`,
    `${indent}        android:pathData="${territory.pathData}" />`
  ].join("\n")).join("\n");
  return [
    `${indent}<group>`,
    `${indent}    <clip-path`,
    `${indent}        android:fillType="evenOdd"`,
    `${indent}        android:pathData="${outlinePath}" />`,
    territoryPaths,
    `${indent}</group>`,
    `${indent}<path`,
    `${indent}    android:fillColor="#00000000"`,
    `${indent}    android:fillType="evenOdd"`,
    `${indent}    android:strokeColor="${territoryBoundary}"`,
    `${indent}    android:strokeWidth="0.72"`,
    `${indent}    android:strokeLineJoin="round"`,
    `${indent}    android:pathData="${outlinePath}" />`
  ].join("\n");
}

const siteIndexData = JSON.parse(fs.readFileSync(siteIndexPath, "utf8"));
const siteGeometryData = JSON.parse(fs.readFileSync(siteGeometryPath, "utf8"));
const landMaskData = JSON.parse(fs.readFileSync(landMaskPath, "utf8"));
const siteBySlug = new Map(siteIndexData.rows.map(row => [row.slug, row]));
const geometryBySlug = new Map(siteGeometryData.rows.map(row => [row.slug, row.display_geojson]));

const territories = territorySlugs.map(slug => {
  const siteRow = siteBySlug.get(slug);
  const geometry = geometryBySlug.get(slug);
  if (!/^#[0-9a-f]{6}$/i.test(siteRow?.map_fill_color || "")) throw new Error(`Missing map color for ${slug}`);
  if (!geometry?.coordinates) throw new Error(`Missing map geometry for ${slug}`);
  const pathData = geometryPathData(geometry);
  if (!pathData) throw new Error(`Generated empty map geometry for ${slug}`);
  return { slug, color: siteRow.map_fill_color.toUpperCase(), pathData };
});

const outlinePath = geometryPathData(landMaskData.geometry, 0.7, 0.2);
if (!outlinePath) throw new Error("Generated empty Long Island launcher silhouette");

const foreground = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
${vectorMosaic(territories, outlinePath)}
</vector>
`;

const monochrome = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFFFF"
        android:fillType="evenOdd"
        android:pathData="${outlinePath}" />
</vector>
`;

const legacy = `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="${launcherBackground}" android:pathData="M0,0h108v108h-108z" />
${vectorMosaic(territories, outlinePath)}
</vector>
`;

const svgTerritories = territories.map(territory =>
  `<path fill="${territory.color}" fill-rule="evenodd" stroke="${territoryBoundary}" stroke-width="0.36" stroke-linejoin="round" d="${territory.pathData}"/>`
).join("\n      ");

const preview = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="864" height="864">
  <rect width="108" height="108" rx="24" fill="${launcherBackground}"/>
  <defs><clipPath id="long-island"><path fill-rule="evenodd" d="${outlinePath}"/></clipPath></defs>
  <g clip-path="url(#long-island)">
      ${svgTerritories}
  </g>
  <path fill="none" stroke="${territoryBoundary}" stroke-width="0.72" stroke-linejoin="round" fill-rule="evenodd" d="${outlinePath}"/>
</svg>
`;

fs.mkdirSync(drawableDir, { recursive: true });
fs.mkdirSync(path.dirname(legacyIconPath), { recursive: true });
fs.mkdirSync(previewDir, { recursive: true });
fs.writeFileSync(path.join(drawableDir, "ic_launcher_foreground.xml"), foreground);
fs.writeFileSync(path.join(drawableDir, "ic_launcher_monochrome.xml"), monochrome);
fs.writeFileSync(legacyIconPath, legacy);
fs.writeFileSync(legacyRoundIconPath, legacy);
fs.writeFileSync(path.join(previewDir, "ancestral-launcher-icon.svg"), preview);

console.log(`Generated launcher icon with ${territories.length} ancestral-land colors.`);
