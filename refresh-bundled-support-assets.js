const fs = require("fs");
const path = require("path");

const root = __dirname;
const bundledShells = [
  "app/src/main/assets/mobile-app.html",
  "app/src/main/assets/mobile-app-live-bundled.html"
];
const inlineAssets = [
  { path: "assets/css/mobile-app.css", tag: "style" },
  { path: "assets/css/shared-research-question.css", tag: "style" },
  { path: "assets/js/shared-directus-config.js", tag: "script" },
  { path: "assets/js/shared-utils.js", tag: "script" },
  { path: "assets/js/shared-site-utils.js", tag: "script" },
  { path: "assets/js/shared-site-title-utils.js", tag: "script" },
  { path: "assets/js/shared-profile-utils.js", tag: "script" },
  { path: "assets/js/shared-map-story-utils.js", tag: "script" },
  { path: "assets/js/shared-learning-card-utils.js", tag: "script" },
  { path: "assets/js/shared-calendar-utils.js", tag: "script" },
  { path: "assets/js/shared-activity-utils.js", tag: "script" },
  { path: "assets/js/shared-comment-utils.js", tag: "script" },
  { path: "assets/js/shared-quote-comment-utils.js", tag: "script" },
  { path: "assets/js/shared-timeline-utils.js", tag: "script" },
  { path: "assets/js/shared-moderation-utils.js", tag: "script" },
  { path: "assets/js/shared-plant-utils.js", tag: "script" },
  { path: "assets/js/shared-geometry-utils.js", tag: "script" },
  { path: "assets/js/shared-route-utils.js", tag: "script" },
  { path: "assets/js/shared-html-utils.js", tag: "script" },
  { path: "assets/js/shared-directus-client.js", tag: "script" },
  { path: "assets/js/shared-media-utils.js", tag: "script" },
  { path: "assets/js/shared-map-utils.js", tag: "script" },
  { path: "assets/js/shared-feedback-utils.js", tag: "script" },
  { path: "assets/js/support-public-config.js", tag: "script" },
  { path: "assets/js/shared-support-utils.js", tag: "script" },
  { path: "assets/js/shared-research-question-utils.js", tag: "script" },
  { path: "assets/js/language-quiz-words.js", tag: "script" },
  { path: "assets/js/userviews-tracker.js", tag: "script" },
  { path: "assets/js/mobile-app.js", tag: "script" }
];

for (const relativeShell of bundledShells) {
  const shellPath = path.join(root, relativeShell);
  if (!fs.existsSync(shellPath)) continue;
  let html = fs.readFileSync(shellPath, "utf8");
  for (const asset of inlineAssets) {
    const sourcePath = path.join(root, "app/src/main/assets", asset.path);
    const source = fs.readFileSync(sourcePath, "utf8").trim();
    const escapedAsset = asset.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(^[\\t ]*<${asset.tag} data-inline-source="${escapedAsset}">)[\\s\\S]*?(^[\\t ]*</${asset.tag}>[\\t ]*$)`,
      "m"
    );
    if (!pattern.test(html)) throw new Error(`${relativeShell} is missing inline asset ${asset.path}`);
    html = html.replace(pattern, (_, open, close) => `${open}\n${source}\n  ${close}`);
  }
  for (const asset of inlineAssets) {
    const marker = `data-inline-source="${asset.path}"`;
    if (html.split(marker).length !== 2) throw new Error(`${relativeShell} has a duplicate or missing inline asset ${asset.path}`);
  }
  html = html.replace(/pk\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "__NLI_MAPBOX_TOKEN__");
  fs.writeFileSync(shellPath, html);
  console.log(`Refreshed support assets in ${relativeShell}`);
}
