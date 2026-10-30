// Builds app/src/main/assets/map/offline-areas.json: the coloured place-name
// areas and site shapes the live map draws, for the native map to show when
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
  const features = [];
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
  }
  return JSON.stringify({ type: "FeatureCollection", features });
}

const target = path.join(assets, "map/offline-areas.json");
const next = build();
if (process.argv.includes("--check")) {
  if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== next) {
    console.error("map/offline-areas.json is out of date. Run: node build-offline-areas.js");
    process.exit(1);
  }
  console.log("Offline area colours are current.");
} else {
  fs.writeFileSync(target, next);
  console.log(`Wrote map/offline-areas.json: ${JSON.parse(next).features.length} shapes, ${next.length} bytes.`);
}
