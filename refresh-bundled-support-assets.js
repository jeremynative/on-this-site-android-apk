const fs = require("fs");
const path = require("path");

const root = __dirname;
const bundledShells = [
  "app/src/main/assets/mobile-app.html",
  "app/src/main/assets/mobile-app-live-bundled.html"
];
const inlineAssets = [
  { path: "assets/css/mobile-app.css", tag: "style" },
  { path: "assets/js/shared-calendar-utils.js", tag: "script" },
  { path: "assets/js/support-public-config.js", tag: "script" },
  { path: "assets/js/shared-support-utils.js", tag: "script" },
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
    const pattern = new RegExp(`(<${asset.tag} data-inline-source="${escapedAsset}">)[\\s\\S]*?(</${asset.tag}>)`);
    if (!pattern.test(html)) throw new Error(`${relativeShell} is missing inline asset ${asset.path}`);
    html = html.replace(pattern, (_, open, close) => `${open}\n${source}\n  ${close}`);
  }
  fs.writeFileSync(shellPath, html);
  console.log(`Refreshed support assets in ${relativeShell}`);
}
