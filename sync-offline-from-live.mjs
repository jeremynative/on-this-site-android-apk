// Refresh the APK's offline archive from the live app runtime (https://directus.nativelongisland.com/app/).
// The app's offline mode loads the packaged app/src/main/assets/mobile-app-live.html and serves every /app/assets/…
// request from the packaged files, so this mirrors the live shell, the files it loads, the site and article detail
// files its manifests list, and the data indexes. The runtime itself is packaged unminified from the web checkout
// (verify-app-shell.js: the shell loads assets/js/mobile-app.js), with the Mapbox token as the build-time placeholder.
//   node sync-offline-from-live.mjs <web checkout> [--apply]      (without --apply it only reports)
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";

const GATEWAY = "https://directus.nativelongisland.com/app/";
const ASSETS = join(process.cwd(), "app/src/main/assets");
const web = process.argv[2];
const apply = process.argv.includes("--apply");
if (!web || !existsSync(join(web, "assets/js/mobile-app.js"))) throw new Error("usage: node sync-offline-from-live.mjs <web checkout> [--apply]");
const DATA_INDEXES = ["mobile-site-index.json", "mobile-site-geometry.json", "mobile-site-centers.json", "mobile-wiki-index.json", "mobile-timeline-index.json", "public-education-faq.json"].map(name => `assets/data/${name}`);
const HASHED = /\.[a-f0-9]{12}\.(js|css|json)$/;

const version = text => createHash("sha256").update(Buffer.from(String(text).replace(/\r\n?/g, "\n"), "utf8")).digest("hex").slice(0, 12);
async function get(path, tries = 3) {
  for (let i = 1; ; i++) {
    const response = await fetch(GATEWAY + path, { headers: { "cache-control": "no-cache" } });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if (i >= tries) throw new Error(`${response.status} ${GATEWAY + path}`);
    await new Promise(resolve => setTimeout(resolve, 800 * i));
  }
}
const report = { written: [], unchanged: 0, removed: [] };
function put(path, bytes) {
  const file = join(ASSETS, path);
  if (existsSync(file) && Buffer.compare(readFileSync(file), bytes) === 0) { report.unchanged += 1; return; }
  report.written.push(path);
  if (!apply) return;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, bytes);
}
async function pool(items, worker, size = 4) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => { while (queue.length) await worker(queue.shift()); }));
}

// 1. The shell and the files it loads.
let shell = (await get("mobile-app-live.html")).toString("utf8");
const refs = [...new Set([...shell.matchAll(/(?:src|href)="(assets\/[^"?#]+)(?:\?[^"]*)?"/g)].map(match => match[1]))];
const minified = refs.filter(ref => /^assets\/js\/mobile-app\.min\.[a-f0-9]{12}\.js$/.test(ref));
if (minified.length !== 1) throw new Error(`expected one minified runtime in the live shell, found ${minified.length}`);

// 2. The runtime, unminified from the web checkout, with the token placeholder Android fills in at build time.
let runtime = readFileSync(join(web, "assets/js/mobile-app.js"), "utf8");
const tokenLine = /(const MAPBOX_PUBLIC_TOKEN = ")pk\.[A-Za-z0-9._-]+(";)/;
if (!tokenLine.test(runtime)) throw new Error("the web runtime's Mapbox token line has changed");
runtime = runtime.replace(tokenLine, "$1__NLI_MAPBOX_TOKEN__$2");
if (/(?:^|[^A-Za-z0-9_-])[ps]k\.[A-Za-z0-9._-]+/.test(runtime)) throw new Error("the runtime still holds a Mapbox-style token");
put("assets/js/mobile-app.js", Buffer.from(runtime, "utf8"));
shell = shell.replace(new RegExp(`src="${minified[0].replace(/\./g, "\\.")}(?:\\?[^"]*)?"`), `src="assets/js/mobile-app.js?v=${version(runtime)}"`);
if (/(?:^|[^A-Za-z0-9_-])[ps]k\.ey[A-Za-z0-9._-]+/.test(shell)) throw new Error("the live shell holds a Mapbox token");

const wanted = new Set(refs.filter(ref => ref !== minified[0]));
// 3. The detail manifests and every site and article detail file they list.
const manifests = [...shell.matchAll(/NLI_(?:SITE|WIKI)_DETAIL_MANIFEST_URL = "(assets\/data\/[^"]+\.js)"/g)].map(match => match[1]);
if (manifests.length !== 2) throw new Error(`expected the site and wiki detail manifests, found ${manifests.length}`);
const details = new Set();
for (const manifest of manifests) {
  const text = (await get(manifest)).toString("utf8");
  wanted.add(manifest);
  for (const match of text.matchAll(/"(assets\/data\/(?:site|wiki)-details\/[^"]+\.json)"/g)) details.add(match[1]);
}
for (const path of DATA_INDEXES) wanted.add(path);
for (const path of details) wanted.add(path);

await pool([...wanted], async path => put(path, await get(path)));
put("mobile-app-live.html", Buffer.from(shell, "utf8"));

// 4. Files the old shell or manifests used that nothing loads any more: old hashed helpers, manifests and details.
const javaSources = readdirSync(join(process.cwd(), "app/src/main/java/com/nativelongisland/onthissite")).map(name => readFileSync(join(process.cwd(), "app/src/main/java/com/nativelongisland/onthissite", name), "utf8")).join("\n");
for (const folder of ["assets/js", "assets/css", "assets/data", "assets/data/site-details", "assets/data/wiki-details"]) {
  const dir = join(ASSETS, folder);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    const path = `${folder}/${name}`;
    if (!HASHED.test(name) || wanted.has(path) || javaSources.includes(name)) continue;
    report.removed.push(path);
    if (apply) unlinkSync(join(ASSETS, path));
  }
}

console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", shellRefs: refs.length, details: details.size, manifests, written: report.written.length, unchanged: report.unchanged, removed: report.removed.length }, null, 1));
console.log("written (first 40):", report.written.filter(p => !/-details\//.test(p)).slice(0, 40).join(", "));
console.log("removed (non-detail):", report.removed.filter(p => !/-details\//.test(p)).join(", "));
