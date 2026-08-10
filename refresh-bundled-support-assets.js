const fs = require("fs");
const path = require("path");

const root = __dirname;
const bundledShells = [
  "app/src/main/assets/mobile-app.html",
  "app/src/main/assets/mobile-app-live-bundled.html"
];
const supportAssets = [
  "assets/js/support-public-config.js",
  "assets/js/shared-support-utils.js",
  "assets/js/mobile-app.js"
];

for (const relativeShell of bundledShells) {
  const shellPath = path.join(root, relativeShell);
  let html = fs.readFileSync(shellPath, "utf8");
  for (const asset of supportAssets) {
    const sourcePath = path.join(root, "app/src/main/assets", asset);
    const source = fs.readFileSync(sourcePath, "utf8").trim();
    const escapedAsset = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(<script data-inline-source="${escapedAsset}">)[\\s\\S]*?(</script>)`);
    if (!pattern.test(html)) throw new Error(`${relativeShell} is missing inline asset ${asset}`);
    html = html.replace(pattern, (_, open, close) => `${open}\n${source}\n  ${close}`);
  }
  fs.writeFileSync(shellPath, html);
  console.log(`Refreshed support assets in ${relativeShell}`);
}
