// Builds app/src/main/assets/map/offline-areas.json (the coloured place-name
// areas and site shapes the live map draws) and map/offline-area-labels.json
// (the names those site shapes show instead of a pin), plus map/offline-site-titles.json
// (the names beside the pinned sites' dots, by site id), for the native map when
// the app starts offline. Run after refreshing the bundled site data.
//   node build-offline-areas.js          write the file
//   node build-offline-areas.js --check  fail if it is out of date
const fs = require("fs");
const path = require("path");

const assets = path.join(__dirname, "app/src/main/assets");
const read = file => fs.readFileSync(path.join(assets, file), "utf8");
const round = value => Array.isArray(value) ? value.map(round) : Math.round(value * 1e5) / 1e5;

function build() {
  const overlays = read("assets/data/place-name-area-overlays.js");
  const areas = JSON.parse(overlays.slice(overlays.indexOf("{"), overlays.lastIndexOf("}") + 1)).features || [];
  const territoryIds = new Set(JSON.parse(read("map/ancestral-territory-fallback.json")).territories.features.map(f => f.properties.id));
  const sites = new Map(JSON.parse(read("assets/data/mobile-site-index.json")).rows.map(row => [row.id, row]));
  const centers = new Map(JSON.parse(read("assets/data/mobile-site-centers.json")).rows.map(row => [row.id, row.center]));
  const features = [];
  const labels = [];
  for (const area of areas) {
    if (!area.geometry) continue;
    features.push({
      type: "Feature",
      geometry: { type: area.geometry.type, coordinates: round(area.geometry.coordinates) },
      properties: {
        slug: area.properties.slug || "",
        fillcolor: area.properties.fillcolor || "#15988f",
        geometry_surface: area.properties.place_name_surface || "land"
      }
    });
  }
  for (const row of JSON.parse(read("assets/data/mobile-site-geometry.json")).rows) {
    if (!/Polygon/.test(row.geometry_type || "") || !row.geojson || territoryIds.has(row.id)) continue;
    const site = sites.get(row.id) || {};
    features.push({
      type: "Feature",
      geometry: { type: row.geojson.type, coordinates: round(row.geojson.coordinates) },
      properties: {
        id: row.id,
        slug: row.slug || "",
        fillcolor: String(site.map_fill_color || "").trim() || "#6f917c",
        geometry_surface: String(site.geometry_surface || "").trim() || "land"
      }
    });
    const center = centers.get(row.id);
    if (Array.isArray(center) && site.title) {
      labels.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: round(center) },
        properties: { id: row.id, slug: row.slug || "", title: site.title, label_kind: "detail" }
      });
    }
  }
  // The site index is too large for the native map to parse at startup, so
  // the pinned sites' titles get their own small file.
  const titles = {};
  for (const row of JSON.parse(read("assets/data/mobile-site-centers.json")).rows) {
    const title = String(sites.get(row.id)?.title || "").trim();
    if (title && !/Polygon/.test(row.geometry_type || "")) titles[row.id] = title;
  }
  return {
    "map/offline-areas.json": JSON.stringify({ type: "FeatureCollection", features }),
    "map/offline-area-labels.json": JSON.stringify({ type: "FeatureCollection", features: labels }),
    "map/offline-site-titles.json": JSON.stringify(titles)
  };
}

const files = build();
if (process.argv.includes("--check")) {
  for (const [file, next] of Object.entries(files)) {
    const target = path.join(assets, file);
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== next) {
      console.error(`${file} is out of date. Run: node build-offline-areas.js`);
      process.exit(1);
    }
  }
  console.log("Offline area colours are current.");
} else {
  for (const [file, next] of Object.entries(files)) {
    fs.writeFileSync(path.join(assets, file), next);
    const parsed = JSON.parse(next);
    console.log(`Wrote ${file}: ${parsed.features ? `${parsed.features.length} features` : `${Object.keys(parsed).length} titles`}, ${next.length} bytes.`);
  }
}
