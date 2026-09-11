const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const base='app/src/main/assets/';const ctx={window:{}};vm.runInNewContext(fs.readFileSync(base+'assets/js/shared-map-utils.js','utf8'),ctx);
const source=fs.readFileSync('app/src/main/java/com/nativelongisland/onthissite/NativeMapController.java','utf8');
assert(source.includes('base.startsWith("animal-")'),'Animal facing variants absent');assert(/Expression\.eq\(Expression\.get\("moving_kind"\), Expression\.literal\("animal"\)\)/.test(source),'Native animal layer filter absent');
const snapshot=JSON.parse(fs.readFileSync(base+'mobile-app.html','utf8').match(/window\.NLI_MOBILE_DATA\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)[1]);
const index=JSON.parse(fs.readFileSync(base+'assets/data/mobile-wiki-index.json','utf8'));
for(const a of ctx.window.NLI_SHARED_MAP_UTILS.nativeAnimals){const png=fs.readFileSync(base+ctx.window.NLI_SHARED_MAP_UTILS.nativeAnimalIcon(a));assert.equal(png.readUInt32BE(16),150);assert.equal(png.readUInt32BE(20),100);assert(snapshot.wikiArticles.some(x=>x.slug===a.slug&&x.content.includes('References')));assert(index.rows.some(x=>x.slug===a.slug));}
assert(!source.includes('nli-moving-animal-icons'),'Reuse dog layer to retain hit testing and visibility controls');
console.log('Native animal symbols, mirrored assets, offline citations and wiki index pass.');
assert(snapshot.wikiArticles.some(x=>x.slug==='duck-decoys'&&x.content.includes('Lyle G. Smith')),'Offline decoy history missing');
assert(snapshot.timelineEvents.some(x=>x.wiki_article===138&&x.start_year===2021),'Decoy attribution moment missing');
assert(!ctx.window.NLI_SHARED_MAP_UTILS.nativeAnimalHtml(ctx.window.NLI_SHARED_MAP_UTILS.nativeAnimals[0]).includes(' title='),'Duplicate animal tooltip');

assert(source.includes('if (base.startsWith("animal-")) normalized.setDensity(android.util.DisplayMetrics.DENSITY_DEFAULT)'), 'Native animal sprites must retain logical size on high-density screens');
assert(source.includes('Expression.literal(0.75f), Expression.literal(0.42f)'), 'Wildlife must have its larger scale without changing dog size');
