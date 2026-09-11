const fs=require('fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/src/main/java/com/nativelongisland/onthissite/NativeMapController.java','utf8');
const date=source.indexOf('style.addLayer(new CircleLayer("nli-calendar-event-circles"');
for(const name of ['nli-moving-feature-labels','nli-moving-dog-icons','nli-moving-whale-icons','nli-moving-ship-icons','nli-site-point-icons']) assert.ok(date>source.indexOf('new SymbolLayer("'+name+'"'),name+' draws below calendars');
const bios=source.slice(source.indexOf('new SymbolLayer("nli-moving-biography-icons"'),source.indexOf('new SymbolLayer("nli-moving-dog-icons"'));
assert.equal((bios.match(/Expression.stop\(7, 0.43f\)/g)||[]).length,2,'person and canoe both shrink to half size');
assert.equal((bios.match(/Expression.stop\(13, 0.86f\)/g)||[]).length,2,'person and canoe retain close-zoom size');
console.log('Native calendar stacking and biography zoom sizes passed.');
