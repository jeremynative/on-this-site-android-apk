const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const java = fs.readFileSync('app/src/main/java/com/nativelongisland/onthissite/MainActivity.java', 'utf8');
const start = java.indexOf('+ "var sync=function()');
const end = java.indexOf('+ "var blocked=[];', start);
const code = [...java.slice(start, end).matchAll(/"(?:\\.|[^"\\])*"/g)].map(m => JSON.parse(m[0])).join('');
const rect = (left, top, width, height) => ({left, top, right: left + width, bottom: top + height, width, height});
function measure(mapRect, panelRect, tablet = false, visibility = 'visible') {
  let result;
  const panel = {classList: {contains: () => true}, offsetWidth: panelRect.width, offsetHeight: panelRect.height, getBoundingClientRect: () => panelRect};
  vm.runInNewContext(code + '};sync();', {
    token: 'test', getComputedStyle: () => ({display: 'grid', visibility}),
    document: {getElementById: id => id === 'map' ? {getBoundingClientRect: () => mapRect} : panel,
      documentElement: {dataset: {nativeTabletLandscape: String(tablet)}}, body: {dataset: {}}},
    window: {innerWidth: tablet ? 1000 : 390, innerHeight: 844, AndroidApp: {syncNativeMapViewport: (...args) => {result = args;}}}
  });
  return {bottom: result[5], right: result[6]};
}
assert.deepEqual(measure(rect(0, 59, 390, 723), rect(0, 354, 390, 490)), {bottom:428,right:0}, 'bottom toolbar below map is not part of map occlusion');
assert.deepEqual(measure(rect(0, 59, 390, 295), rect(0, 354, 390, 490)), {bottom:0,right:0}, 'a tray below a resized map cannot block the map again');
assert.deepEqual(measure(rect(0, 59, 390, 723), rect(0, 900, 390, 490)), {bottom:0,right:0}, 'offscreen drawer leaves map available');
assert.deepEqual(measure(rect(0, 59, 390, 723), rect(0, 200, 390, 644)), {bottom:582,right:0}, 'resizing drawer follows its current visible edge');
assert.deepEqual(measure(rect(0, 0, 1000, 700), rect(700, 0, 350, 700), true), {bottom:0,right:300}, 'tablet side panel uses overlap only');
assert.deepEqual(measure(rect(0, 0, 1000, 700), rect(700, 0, 350, 700), true, 'hidden'), {bottom:0,right:0});
const controller = fs.readFileSync('app/src/main/java/com/nativelongisland/onthissite/NativeMapController.java', 'utf8');
const route = controller.slice(controller.indexOf('boolean routeTouchEvent('), controller.indexOf('boolean routeTouchEvent(') + 5500);
assert.match(route, /rootX <= viewportRight[\s\S]*rootY <= viewportBottom[\s\S]*!blocked/);
assert(!/root[XY] <= viewportInteractive/.test(route), 'camera focus padding must never swallow visible-map touches');
assert(java.includes("document.querySelectorAll('.detail,.sheet').forEach(function(panel){ro.observe(panel);})"), 'drawer resizing updates native exclusions');
console.log('Native map panel gestures passed: actual overlap, resized map, hidden drawer, tablet, and separate camera/touch bounds.');
