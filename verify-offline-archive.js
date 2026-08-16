const fs = require("fs");
const vm = require("vm");

const assetRoot = "app/src/main/assets";
const context = { console };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(`${assetRoot}/assets/js/shared-search-utils.js`, "utf8"), context);
vm.runInContext(fs.readFileSync(`${assetRoot}/assets/js/offline-archive-utils.js`, "utf8"), context);

const search = context.NLI_SEARCH_UTILS;
const offline = context.NLI_OFFLINE_ARCHIVE_UTILS;
if (!search || !offline) throw new Error("Offline archive helpers did not initialize.");

const payload = name => JSON.parse(fs.readFileSync(`${assetRoot}/assets/data/${name}`, "utf8"));
const sitePayload = payload("mobile-site-index.json");
const centerPayload = payload("mobile-site-centers.json");
const wikiPayload = payload("mobile-wiki-index.json");
let prepared = 0;
const countedSearch = {
  ...search,
  prepareEntry(...args) {
    prepared += 1;
    return search.prepareEntry(...args);
  }
};
const archive = offline.prepareArchive(sitePayload, centerPayload, wikiPayload, {
  searchUtils: countedSearch,
  regionBoundaries: { west: -73.42, east: -72.72 }
});

const expectedSites = offline.rows(sitePayload).length;
const expectedWikis = offline.rows(wikiPayload).length;
if (archive.sites.length !== expectedSites || archive.wikis.length !== expectedWikis
    || archive.entries.length !== expectedSites + expectedWikis
    || expectedSites < 400 || expectedWikis < 90) {
  throw new Error(`Unexpected offline archive counts: ${archive.sites.length}/${archive.wikis.length}/${archive.entries.length}.`);
}
if (prepared !== archive.entries.length) {
  throw new Error(`Offline search entries must be prepared exactly once; saw ${prepared} preparations.`);
}

const cache = new Map();
const query = value => offline.filterArchive(archive.entries, {
  query: value,
  region: "all",
  cache,
  cacheLimit: 24,
  searchUtils: countedSearch
});
for (const value of ["m", "ma", "mas", "ma's", "Mas House"]) {
  const results = query(value);
  if (!results.length || results[0].title !== "Ma's House") {
    throw new Error(`Offline ${JSON.stringify(value)} search must rank Ma's House first; got ${results[0]?.title || "no result"}.`);
  }
}
if (prepared !== archive.entries.length) {
  throw new Error("Filtering must reuse prepared entries instead of rebuilding the search index.");
}

const repeated = query("ma's");
if (repeated !== cache.get("all|ma s")) {
  throw new Error("Repeated offline queries must reuse the bounded result cache.");
}
for (let index = 0; index < 40; index += 1) query(`query ${index}`);
if (cache.size > 24) throw new Error(`Offline result cache exceeded its 24-query limit: ${cache.size}.`);

const west = offline.filterArchive(archive.entries, { region: "west", cache: new Map(), searchUtils: search });
const central = offline.filterArchive(archive.entries, { region: "central", cache: new Map(), searchUtils: search });
const east = offline.filterArchive(archive.entries, { region: "east", cache: new Map(), searchUtils: search });
for (const [name, entries] of Object.entries({ west, central, east })) {
  if (!entries.some(entry => entry.kind === "site" && entry.region === name)) {
    throw new Error(`Offline ${name} region must retain matching mapped sites.`);
  }
  if (!entries.some(entry => entry.kind === "wiki")) {
    throw new Error(`Offline ${name} region must keep searchable Knowledgebase articles.`);
  }
}

const fixture = offline.prepareArchive(
  { rows: [{ id: 999, slug: "slug-fallback", title: "Slug fallback" }] },
  { rows: [{ id: 1000, slug: "slug-fallback", center: [-73.0, 40.9] }] },
  { rows: [] },
  { searchUtils: search }
);
if (fixture.sites[0].longitude !== -73.0 || fixture.sites[0].region !== "central") {
  throw new Error("Offline center lookup must fall back from a changed id to the stable site slug.");
}

const offlineHtml = fs.readFileSync(`${assetRoot}/offline-app.html`, "utf8");
if (!offlineHtml.includes('"assets/data/mobile-site-centers.json"')
    || offlineHtml.includes('"assets/data/mobile-site-geometry.json"')) {
  throw new Error("Offline startup must load compact site centers and avoid full polygon geometry.");
}

console.log(`Offline archive verification passed: ${archive.entries.length} prepared entries, adaptive Ma's House search, compact centers, cache ${cache.size}/24.`);
