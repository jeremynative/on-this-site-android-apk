const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const root = __dirname;
const assetsRoot = path.join(root, "app", "src", "main", "assets");
const indexPath = path.join(assetsRoot, "assets", "data", "mobile-site-index.json");
const mediaMapPath = path.join(assetsRoot, "assets", "data", "mobile-media-map.js");
const mediaDir = path.join(assetsRoot, "media-cache");
const shells = [
  path.join(assetsRoot, "mobile-app.html"),
  path.join(assetsRoot, "mobile-app-live.html"),
  path.join(assetsRoot, "mobile-app-live-bundled.html")
];
const markerPattern = /\n?\s*<script data-generated-bundled-nearby-media>[\s\S]*?<\/script>\s*/g;

function parseMediaMap(source) {
  const match = String(source || "").match(/=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) throw new Error("Could not parse the bundled mobile media map.");
  return JSON.parse(match[1]);
}

function mediaTargetForUrl(url, mediaMap) {
  if (mediaMap[url]) return mediaMap[url];
  const parsed = new URL(url);
  const ext = path.extname(parsed.pathname) || ".jpg";
  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 14);
  return `media-cache/${hash}${ext.toLowerCase()}`;
}

function candidateForSite(site, mediaMap) {
  if (site.listing_image_file) {
    return {
      target: `media-cache/nearby-site-${site.id}.webp`,
      url: `https://directus.nativelongisland.com/assets/${site.listing_image_file}?width=160&height=120&fit=cover&quality=68&format=webp`
    };
  }
  const sourceUrl = String(
    site.listing_image_thumb_url
    || site.listing_image_url
    || site.content_image_url
    || ""
  ).trim();
  if (!/^https?:\/\//i.test(sourceUrl)) return null;
  const target = mediaTargetForUrl(sourceUrl, mediaMap);
  return {
    target,
    url: `https://directus.nativelongisland.com/app/${target}`
  };
}

async function download(candidate) {
  const output = path.join(assetsRoot, candidate.target.replaceAll("/", path.sep));
  try {
    const existing = await fs.stat(output);
    if (existing.size > 0) return true;
  } catch {}
  try {
    const response = await fetch(candidate.url, { signal: AbortSignal.timeout(20000) });
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!response.ok || !contentType.startsWith("image/")) return false;
    const body = Buffer.from(await response.arrayBuffer());
    if (!body.length) return false;
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, body);
    return true;
  } catch {
    return false;
  }
}

async function injectMap(map) {
  const tag = `<script data-generated-bundled-nearby-media>window.NLI_BUNDLED_NEARBY_MEDIA = ${JSON.stringify(map)};</script>`;
  for (const shell of shells) {
    let html = await fs.readFile(shell, "utf8");
    html = html.replace(markerPattern, "\n");
    if (!html.includes("</head>")) throw new Error(`${path.basename(shell)} has no closing head tag.`);
    html = html.replace("</head>", `  ${tag}\n</head>`);
    await fs.writeFile(shell, html);
  }
}

async function main() {
  const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
  const mediaMap = parseMediaMap(await fs.readFile(mediaMapPath, "utf8"));
  const jobs = (index.rows || [])
    .map(site => ({ site, candidate: candidateForSite(site, mediaMap) }))
    .filter(job => job.candidate);
  const bundledMap = {};
  let cursor = 0;
  const next = async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      if (!await download(job.candidate)) continue;
      bundledMap[job.site.slug] = job.candidate.target;
    }
  };
  await fs.mkdir(mediaDir, { recursive: true });
  await Promise.all(Array.from({ length: Math.min(8, jobs.length) }, next));
  await injectMap(bundledMap);
  const sizes = await Promise.all([...new Set(Object.values(bundledMap))].map(async target => {
    const output = path.join(assetsRoot, target.replaceAll("/", path.sep));
    return Number((await fs.stat(output)).size || 0);
  }));
  const totalBytes = sizes.reduce((sum, size) => sum + size, 0);
  console.log(`Bundled ${Object.keys(bundledMap).length} Nearby thumbnails (${(totalBytes / 1024 / 1024).toFixed(1)} MB).`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
