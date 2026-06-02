const fs = require("fs");

const expectedBuild = "20260601-bundled-mobile-geo-gate";
const expectedUrl = "https://nativelongisland.com/archive-test/mobile-app-live.html";
const mainActivityPath = "app/src/main/java/com/nativelongisland/onthissite/MainActivity.java";
const releaseWorkflowPath = ".github/workflows/build-release-apk.yml";
const bundledAppPath = "app/src/main/assets/mobile-app.html";

const bundledAppBytes = fs.readFileSync(bundledAppPath);
const source = fs.readFileSync(mainActivityPath, "utf8");
const releaseWorkflow = fs.readFileSync(releaseWorkflowPath, "utf8");
const bundledApp = bundledAppBytes.toString("utf8");

function requireText(text, message) {
  if (!source.includes(text)) {
    throw new Error(message);
  }
}

function requireBundledText(text, message) {
  if (!bundledApp.includes(text)) {
    throw new Error(message);
  }
}

function requireBundledPattern(pattern, message) {
  if (!pattern.test(bundledApp)) {
    throw new Error(message);
  }
}

requireText(`APP_VERSION = "${expectedBuild}"`, `Android shell build id must be ${expectedBuild}.`);
requireText(expectedUrl, `Android shell must load ${expectedUrl}.`);
requireText("?app-version=", "Android shell must pass the app build id to the mobile web app.");
requireText("&apk-version=", "Android shell must pass the APK version to the mobile web app.");
requireText("&refresh=", "Android shell must use a refresh token when loading the mobile web app.");
requireText("Cache-Control", "Android shell must request a fresh copy of the mobile web app.");
requireText("shouldInterceptRequest", "Android shell must be able to serve the bundled app fallback inside the APK WebView.");
requireText("mobile-app.html", "Android shell must include the bundled mobile app fallback asset.");
requireText("long-island-land-mask.geojson", "Android shell must include the bundled land mask fallback asset.");
requireText("BuildConfig.MAPBOX_TOKEN", "Android shell must inject the Mapbox token from build configuration.");
requireText("androidApkStartupScript", "Android shell must inject APK startup guards before the bundled app runs.");
requireText("__nliAndroidGeoGateInstalled", "Android shell must suppress automatic startup geolocation prompts.");
requireText("CookieManager.getInstance()", "Android shell must explicitly enable WebView cookies for SiteGround and app sessions.");
requireText("setAcceptThirdPartyCookies(webView, true)", "Android shell must allow SiteGround/Directus session cookies inside the APK WebView.");
requireText("settings.setCacheMode(WebSettings.LOAD_DEFAULT)", "Android shell must allow WebView to cache remote Mapbox/static resources between launches.");
if (source.includes("settings.setCacheMode(WebSettings.LOAD_NO_CACHE)")) {
  throw new Error("Android shell must not disable the whole WebView cache; only the bundled archive document should be refreshed.");
}
if (source.includes("webView.clearCache(true)")) {
  throw new Error("Android shell must not clear WebView cache/cookies on every startup.");
}
requireText("dispatchTouchEvent", "Android shell must forward app taps into the mobile map.");
requireText("window.onAndroidMapTap", "Android shell must call the mobile map tap bridge.");
requireText("missing-map-tap-bridge", "Android shell must log when the mobile map tap bridge is missing.");
requireText("MotionEvent.ACTION_UP", "Android shell must only forward completed taps.");
requireText("boolean isArchiveApp = \"nativelongisland.com\".equalsIgnoreCase(host);", "Android shell must keep nativelongisland.com navigation inside the APK WebView.");
requireText("applyApkTimelineTrayFix", "Android shell must apply the APK timeline tray override after the live app loads.");
requireText("android-apk-timeline-tray-fix", "Android shell must inject the APK timeline tray CSS override.");
requireText("Full article", "Android shell must shorten the timeline action label inside the APK WebView.");

if (!releaseWorkflow.includes("GITHUB_RUN_NUMBER") || !releaseWorkflow.includes("latest_apk") || !releaseWorkflow.includes("version_code=\"$run_number\"")) {
  throw new Error("Android release workflow must keep versionCode monotonic across testing and tagged releases.");
}
if (releaseWorkflow.includes("(pk|sk)") || releaseWorkflow.includes("grep -oE '(pk|sk)")) {
  throw new Error("Android release workflow must never discover or package secret sk Mapbox tokens.");
}
if (!releaseWorkflow.includes("grep -oE 'pk\\.ey") || !releaseWorkflow.includes('[[ ! "$MAPBOX_TOKEN" =~ ^pk\\.ey ]]')) {
  throw new Error("Android release workflow must only allow public pk Mapbox tokens.");
}

if ((bundledApp.match(/(?:^|[^A-Za-z0-9_-])[ps]k\.[A-Za-z0-9._-]+/g) || []).length) {
  throw new Error("Bundled Android app must keep Mapbox tokens as build-time placeholders.");
}

if (bundledAppBytes[0] === 0xff || bundledAppBytes[0] === 0xfe || bundledAppBytes.includes(0)) {
  throw new Error("Bundled Android app must be UTF-8 HTML, not UTF-16 or binary data.");
}

if (!/^<!doctype html>/i.test(bundledApp.trimStart())) {
  throw new Error("Bundled Android app must start with an HTML doctype.");
}

if (!bundledApp.includes("window.NLI_MOBILE_DATA")) {
  throw new Error("Bundled Android app is missing embedded mobile data.");
}

for (const forbidden of ["DIRECTUS_PASSWORD", "DIRECTUS_EMAIL", "NotebookLM", "notebooklm"]) {
  if (bundledApp.includes(forbidden)) {
    throw new Error(`Bundled Android app must not expose ${forbidden}.`);
  }
}

if (!bundledApp.includes("__NLI_MAPBOX_TOKEN__")) {
  throw new Error("Bundled Android app is missing the Mapbox token placeholder.");
}

requireBundledText('const SITE_LABEL_MIN_ZOOM = 10.4;', "Bundled Android app must show site labels at the current mobile zoom threshold.");
requireBundledText('const SITE_POINT_LABEL_MIN_ZOOM = 10.8;', "Bundled Android app must show point labels at the current mobile zoom threshold.");
requireBundledText('"text-allow-overlap": true', "Bundled Android app must keep close-zoom point labels visible instead of hiding them behind symbol collision.");
requireBundledText('function shouldShowCustomMapIcons() {\n      return true;\n    }', "Bundled Android app must keep site icons visible independently of point-label zoom.");
requireBundledPattern(/"location_label"\s*:\s*"[^"]+"/, "Bundled Android app must include historic moment location labels.");
requireBundledText('window.NLI_FEEDBACK_UTILS', "Bundled Android app must include shared feedback utilities.");
requireBundledText('const feedbackPayload = FEEDBACK_UTILS.buildFeedbackCommentPayload', "Bundled Android app must save feedback through the shared Directus payload.");
requireBundledText('source_type: "feedback"', "Bundled Android app feedback must use the feedback source type.");
requireBundledText('feedbackSheetEl.style.visibility = "hidden"', "Bundled Android app must hide the feedback sheet before screenshot capture.");
requireBundledText('sendFeedbackReviewEmail', "Bundled Android app must notify review email after feedback saves.");
requireBundledText('data-take-comment-photo', "Bundled Android app must expose comment camera capture controls.");
requireBundledText('compressCommentImage', "Bundled Android app must compress oversized comment photos before upload.");
requireBundledText('Search sites, towns, histories', "Bundled Android app must include mobile search.");
requireBundledText('sorted by proximity', "Bundled Android app must label nearby results as proximity sorted.");
requireBundledText('mobileProfileStats', "Bundled Android app must render Directus-backed profile stats.");
requireBundledText('ensureProfileActivitySynced', "Bundled Android app must sync profile activity from Directus.");
requireBundledText('languageRemoteAttemptExists', "Bundled Android app must check Directus before saving language attempts.");
requireBundledText('syncLanguageAttempt', "Bundled Android app must save language attempts through the shared sync path.");
requireBundledText('Content editing needs the editor password.', "Bundled Android app must keep admin editing behind authenticated Directus login.");
requireBundledText('frontendEditorPayload', "Bundled Android app must include the current mobile admin editor payload path.");

console.log(`Android shell verifier passed: ${expectedBuild}`);


