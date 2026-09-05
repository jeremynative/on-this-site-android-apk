const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Execute the shipped Java-injected JavaScript, including its ordering and
// timer behavior. Individual control rectangles leave menu text and gaps open
// to the native map, whose gesture ownership is chosen on the first touch.
const java = fs.readFileSync('app/src/main/java/com/nativelongisland/onthissite/MainActivity.java', 'utf8');
function injected(start, end) {
  const section = java.slice(java.indexOf(start), java.indexOf(end, java.indexOf(start)));
  return [...section.matchAll(/"(?:\\.|[^"\\])*"/g)].map(m => JSON.parse(m[0])).join('');
}
const code = injected('+ "var blocked=[];', '+ "window.__nliSyncNativeMapViewport');
const rect = (left, top, width, height) => ({left, top, right: left + width, bottom: top + height, width, height});
function element(box, options = {}) {
  return {hidden: false, style: {display: 'block', visibility: 'visible', pointerEvents: 'auto'},
    contains(el) { return el.parent === this; }, closest() { return options.map ? {} : null; },
    getBoundingClientRect() { return box; }, ...options};
}
const menu = element(rect(8, 200, 368, 500));
const hidden = element(rect(0, 0, 384, 832), {hidden: true});
const offscreen = element(rect(0, 900, 384, 200));
const marker = element(rect(100, 300, 30, 30), {map: true});
const disabled = element(rect(20, 720, 60, 44), {disabled: true});
const children = Array.from({length: 100}, () => element(rect(20, 250, 60, 44), {parent: menu}));
let regions;
vm.runInNewContext(`var sync = function(){${code} sync();`, {
  r: rect(0, 180, 384, 652), token: 'test',
  getComputedStyle: el => el.style,
  document: {querySelectorAll: selector => {
    if (selector.startsWith('.mobile-more-menu')) {
      assert(selector.includes('.search-suggestions:not([hidden])'), 'search list gaps also own their gestures');
      return [menu, hidden, offscreen];
    }
    return [...children, disabled, marker];
  }},
  window: {innerWidth: 384, innerHeight: 832, AndroidApp: {
    syncNativeMapTouchRegions: (_, json) => { regions = JSON.parse(json); }
  }}
});
assert.equal(regions.length, 2, 'whole panels replace their descendants and do not exhaust the native 80-region cap');
assert.deepEqual(regions[0], {left: 3, top: 195, right: 381, bottom: 705});
assert(regions.some(r => 180 > r.left && 180 < r.right && 400 > r.top && 400 < r.bottom), 'label text and blank gaps belong to WebView');
assert.equal(regions[1].bottom, 769, 'disabled controls still protect their touch surface');

let now = 0, next = 0, callback, calls = 0;
const timers = new Map();
const observerCode = injected('+ "if(window.MutationObserver){var mt=', '+ "requestAnimationFrame(function(){sync();');
const context = {window: {MutationObserver: true}, document: {documentElement: {}}, sync: () => calls++,
  MutationObserver: class { constructor(fn) {callback = fn;} observe() {} },
  setTimeout: (fn, delay) => { timers.set(++next, {fn, time: now + delay}); return next; },
  clearTimeout: id => timers.delete(id)};
vm.runInNewContext(observerCode, context);
function tick(time) {
  now = time;
  for (const [id, timer] of [...timers]) if (timer.time <= now) {timers.delete(id); timer.fn();}
}
for (let t = 0; t <= 100; t += 4) { tick(t); callback(); }
assert(calls >= 5, 'continuous mutations must not postpone first-touch regions indefinitely');
tick(120); const settled = calls; tick(520);
assert.equal(calls, settled + 1, 'one settled pass follows the final transition');
console.log('Native menu touch behavior passed: full surfaces, cap, controls, hidden layers, bounded synchronization.');
