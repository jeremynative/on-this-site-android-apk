const fs=require('fs'),assert=require('node:assert/strict');
const java=fs.readFileSync('app/src/main/java/com/nativelongisland/onthissite/MainActivity.java','utf8');
const prepare=java.slice(java.indexOf('private void deliverCommentBridgePhoto(Uri uri, int attempt)'),java.indexOf('private void savePendingCommentCameraUri'));
assert(prepare.indexOf('new Thread(')<prepare.indexOf('compressedJpegBytes('));
assert(prepare.includes('PREF_PENDING_COMMENT_READY, true'));
const success=prepare.slice(0,prepare.indexOf('catch (Exception'));
assert(!success.includes('clearPendingCommentCameraUri()')&&!success.includes('getContentResolver().delete('));
const dispatch=java.slice(java.indexOf('private void dispatchPendingCommentPhoto()'),java.indexOf('private boolean openExternallyWhenNeeded'));
assert(dispatch.includes('startupHandler.postDelayed(retryCommentPhotoDelivery, 1000)'));
assert(dispatch.includes('deliveryFilename.equals(pendingCommentPhotoFilename)'));
assert(dispatch.includes("return window.onAndroidCommentPhoto("),'Primary receiver rejection must not fall through and acknowledge another form');
assert(dispatch.indexOf('clearPendingCommentCameraUri()')>dispatch.indexOf('if ("true".equals(value)'));
assert(java.slice(java.indexOf('registerConnectivityMonitoring();'),java.indexOf('private View createLoadingCover')).includes('restorePendingCommentCameraUri();'));
console.log('PASS story camera native retention, off-main-thread decode, recreation, repeated delivery and acknowledged cleanup.');

// Execute the exact primary-receiver branch with delayed readiness. A false
// story acknowledgement must never route the image into the comment fallback.
const vm=require('node:vm');
// Assemble the Java string fragments used by evaluateJavascript itself.
const expression=dispatch.slice(dispatch.indexOf('"(function(){"'),dispatch.indexOf('value ->')).replace(/\s*\+\s*/g,'+');
const fragments=[...expression.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map(m=>JSON.parse('"'+m[1]+'"'));
let script=fragments.join('');
script=script.replaceAll('window.onAndroidCommentPhoto()', 'window.onAndroidCommentPhoto(true,"","photo","image/jpeg","camera.jpg")');
script=script.replaceAll('window.__otsReceiveNativeCommentPhoto()', 'window.__otsReceiveNativeCommentPhoto(true,"","photo","image/jpeg","camera.jpg")');
let ready=false,fallbackCalls=0;
const context={window:{onAndroidCommentPhoto:()=>ready,__otsReceiveNativeCommentPhoto:()=>{fallbackCalls++;return true;}}};
for(let attempt=0;attempt<30;attempt++)assert.equal(vm.runInNewContext(script,context),false);
assert.equal(fallbackCalls,0);ready=true;assert.equal(vm.runInNewContext(script,context),true);
console.log('PASS executed native receiver dispatch: slow readiness never acknowledges through another form.');
