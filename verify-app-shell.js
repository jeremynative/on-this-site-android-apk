const fs = require("fs");

const expectedBuild = "20260601-bundled-mobile-geo-gate";
const expectedUrl = "https://nativelongisland.com/archive-test/mobile-app-live.html";
const mainActivityPath = "app/src/main/java/com/nativelongisland/onthissite/MainActivity.java";
const releaseWorkflowPath = ".github/workflows/build-release-apk.yml";
const bundledAppPath = "app/src/main/assets/mobile-app.html";
const bundledLiveAppPath = "app/src/main/assets/mobile-app-live.html";
const stylesPath = "app/src/main/res/values/styles.xml";
const launchBackgroundPath = "app/src/main/res/drawable/launch_background.xml";

const bundledAppBytes = fs.readFileSync(bundledAppPath);
const bundledLiveAppBytes = fs.readFileSync(bundledLiveAppPath);
const source = fs.readFileSync(mainActivityPath, "utf8");
const releaseWorkflow = fs.readFileSync(releaseWorkflowPath, "utf8");
const bundledApp = bundledAppBytes.toString("utf8");
const bundledLiveApp = bundledLiveAppBytes.toString("utf8");
const styles = fs.readFileSync(stylesPath, "utf8");
const launchBackground = fs.readFileSync(launchBackgroundPath, "utf8");

function requireText(text, message) {
  if (!source.includes(text)) {
    throw new Error(message);
  }
}

function requireBundledText(text, message) {
  const haystack = bundledApp.replace(/\r\n/g, "\n");
  const needle = text.replace(/\r\n/g, "\n");
  if (!haystack.includes(needle)) {
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
requireText("loadBundledFallback", "Android shell must keep the bundled archive as a fallback path.");
requireText("onReceivedHttpError", "Android shell must fall back when the live mobile archive returns an HTTP error.");
requireText("isSiteGroundChallengeUrl", "Android shell must detect SiteGround challenge redirects and use the bundled fallback.");
requireText("loadBundledFallback(\"siteground-challenge-start\")", "Android shell must switch to the bundled fallback as soon as SiteGround challenge navigation starts.");
requireText("loadingBundledFallback && \"/archive-test/mobile-app-live.html\".equals(path)", "Android shell must not intercept the live mobile archive unless the fallback is active.");
requireText("loadingBundledFallback && \"/archive-test/mobile-app.html\".equals(path)", "Android shell must serve the full bundled archive when live Directus startup falls back.");
requireText('assetName = "mobile-app.html";', "Android shell must serve embedded mobile data for the full archive fallback.");
requireText("mobile-app.html", "Android shell must include the bundled mobile app fallback asset.");
requireText("mobile-app-live.html", "Android shell must include the lightweight Directus-backed mobile app fallback asset.");
requireText("long-island-land-mask.geojson", "Android shell must include the bundled land mask fallback asset.");
requireText("BuildConfig.MAPBOX_TOKEN", "Android shell must inject the Mapbox token from build configuration.");
requireText("androidApkStartupScript", "Android shell must inject APK startup guards before the bundled app runs.");
requireText("__nliAndroidGeoGateInstalled", "Android shell must suppress automatic startup geolocation prompts.");
requireText("CookieManager.getInstance()", "Android shell must explicitly enable WebView cookies for SiteGround and app sessions.");
requireText("setAcceptThirdPartyCookies(webView, true)", "Android shell must allow SiteGround/Directus session cookies inside the APK WebView.");
requireText("settings.setCacheMode(WebSettings.LOAD_DEFAULT)", "Android shell must allow WebView to cache remote Mapbox/static resources between launches.");
if (!styles.includes('<item name="android:windowBackground">@drawable/launch_background</item>')) {
  throw new Error("Android theme must show a branded launch background while WebView starts.");
}
if (!launchBackground.includes('android:color="#EEF3ED"') || !launchBackground.includes('@drawable/ic_launcher_foreground')) {
  throw new Error("Android launch background must use the app theme color and centered app icon.");
}
if (source.includes("settings.setCacheMode(WebSettings.LOAD_NO_CACHE)")) {
  throw new Error("Android shell must not disable the whole WebView cache; only the bundled archive document should be refreshed.");
}
if (source.includes("webView.clearCache(true)")) {
  throw new Error("Android shell must not clear WebView cache/cookies on every startup.");
}
const refreshAppMatch = source.match(/void refreshApp\(\) \{[\s\S]*?\n    \}/);
if (!refreshAppMatch || !refreshAppMatch[0].includes('loadBundledFallback("startup-live-shell");')) {
  throw new Error("Android shell must start from the bundled Directus-backed live shell to avoid SiteGround challenge screens.");
}
if (refreshAppMatch[0].includes("webView.loadUrl(url, headers);")) {
  throw new Error("Android shell must not show the SiteGround-challenged live URL during normal startup.");
}
const fallbackMatch = source.match(/private void loadBundledFallback\(String reason\) \{[\s\S]*?\n    \}/);
if (!fallbackMatch || !fallbackMatch[0].includes("webView.loadUrl(freshAppUrl());")) {
  throw new Error("Android shell must load the bundled startup shell through WebView URL interception, not UI-thread HTML injection.");
}
if (fallbackMatch[0].includes("loadDataWithBaseURL")) {
  throw new Error("Android shell must not build and inject the bundled startup HTML on the UI thread.");
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

for (const [label, bytes, html] of [
  ["embedded fallback", bundledAppBytes, bundledApp],
  ["live fallback", bundledLiveAppBytes, bundledLiveApp],
]) {
  if ((html.match(/(?:^|[^A-Za-z0-9_-])[ps]k\.[A-Za-z0-9._-]+/g) || []).length) {
    throw new Error(`Bundled Android ${label} must keep Mapbox tokens as build-time placeholders.`);
  }
  if (bytes[0] === 0xff || bytes[0] === 0xfe || bytes[0] === 0xef || bytes.includes(0)) {
    throw new Error(`Bundled Android ${label} must be UTF-8 HTML without a BOM, not UTF-16 or binary data.`);
  }
  if (!/^<!doctype html>/i.test(html.trimStart())) {
    throw new Error(`Bundled Android ${label} must start with an HTML doctype.`);
  }
  if (!html.includes("__NLI_MAPBOX_TOKEN__")) {
    throw new Error(`Bundled Android ${label} is missing the Mapbox token placeholder.`);
  }
}

if (!bundledApp.includes("window.NLI_MOBILE_DATA")) {
  throw new Error("Bundled Android app is missing embedded mobile data.");
}
if (bundledLiveAppBytes.length > 1500000 || /window\.NLI_MOBILE_DATA\s*=/.test(bundledLiveApp)) {
  throw new Error("Bundled Android live fallback should stay lightweight and Directus-backed, not embed the full data payload.");
}

for (const forbidden of ["DIRECTUS_PASSWORD", "DIRECTUS_EMAIL", "NotebookLM", "notebooklm"]) {
  if (bundledApp.includes(forbidden) || bundledLiveApp.includes(forbidden)) {
    throw new Error(`Bundled Android app must not expose ${forbidden}.`);
  }
}

requireBundledText('const SITE_LABEL_MIN_ZOOM = 1.8;', "Bundled Android app must show site labels well before close zoom.");
requireBundledText('const SITE_POINT_LABEL_MIN_ZOOM = 1.95;', "Bundled Android app must show point labels well before close zoom.");
requireBundledText('"text-allow-overlap": false', "Bundled Android app must keep close-zoom point labels readable with collision handling.");
requireBundledText('settings.showPins = true;', "Bundled Android app must recover from saved Sites-off settings so site icons stay visible.");
requireBundledText('selected-site-map-label', "Bundled Android app must show a dedicated title label for the selected site marker.");
requireBundledPattern(/function shouldShowCustomMapIcons\(\)\s*\{\s*return true;\s*\}/, "Bundled Android app must keep site icons visible independently of point-label zoom.");
requireBundledPattern(/"location_label"\s*:\s*"[^"]+"/, "Bundled Android app must include historic moment location labels.");
requireBundledText('window.NLI_FEEDBACK_UTILS', "Bundled Android app must include shared feedback utilities.");
requireBundledText('const feedbackPayload = FEEDBACK_UTILS.buildFeedbackCommentPayload', "Bundled Android app must save feedback through the shared Directus payload.");
requireBundledText('source_type: "feedback"', "Bundled Android app feedback must use the feedback source type.");
requireBundledText('feedbackSheetEl.style.visibility = "hidden"', "Bundled Android app must hide the feedback sheet before screenshot capture.");
requireBundledText('sendFeedbackReviewEmail', "Bundled Android app must notify review email after feedback saves.");
requireBundledText('data-take-comment-photo', "Bundled Android app must expose comment camera capture controls.");
requireBundledText('compressCommentImage', "Bundled Android app must compress oversized comment photos before upload.");
requireBundledText('Search sites, towns, histories', "Bundled Android app must include mobile search.");
requireBundledText('normalizedSearchText: normalizeText', "Bundled Android app must include normalized mobile search text.");
requireBundledText('function scheduleSearchSync()', "Bundled Android app must watch mobile search value changes.");
requireBundledText('searchEl.addEventListener("keyup", scheduleSearchSync);', "Bundled Android app must filter search after Android keyboard events.");
requireBundledText('searchEl.addEventListener("focus", startSearchValueWatch);', "Bundled Android app must poll focused search values for WebView text changes.");
requireBundledText('function installNativeAndroidSearchWatch()', "Bundled Android app must keep polling native Android search values.");
requireBundledText('state.lastSearchValue = "";\n      scheduleSearchSync();\n      state.nativeAndroidSearchWatchTimer = window.setInterval(scheduleSearchSync, 350);', "Bundled Android app must process search text typed before native polling starts.");
requireBundledText('state.nativeAndroidSearchWatchTimer = window.setInterval(scheduleSearchSync, 350);', "Bundled Android app must persistently sync native Android search input.");
requireBundledText('Profile activity sync will retry later.', "Bundled Android app must keep profile activity sync retry logging.");
requireBundledText('state.profileActivitySynced = false;\n          return false;', "Bundled Android app must leave failed profile sync retryable.");
requireBundledText('sorted by proximity', "Bundled Android app must label nearby results as proximity sorted.");
requireBundledText('const NEARBY_LIST_ANDROID_INITIAL_LIMIT = 24;', "Bundled Android app must keep the first nearby tray render small.");
requireBundledText('data-nearby-show-more', "Bundled Android app must let users reveal more nearby places after the startup cap.");
requireBundledText('const nativeAndroid = isNativeAndroidApp();', "Bundled Android app must cache native Android startup state.");
requireBundledText('if (nativeAndroid) {\n          hideLoadingScreen();\n          await new Promise(resolve => window.requestAnimationFrame(resolve));\n        }\n        await openInitialRouteFromUrl();', "Bundled Android app must reveal the shell before slower route and map startup work.");
requireBundledText('function stabilizeAndroidMapPaint()', "Bundled Android app must include the Android map paint stabilizer.");
requireBundledText('state.map.resize();', "Bundled Android app must resize the map after Android WebView startup.");
requireBundledText('refreshMobileMapSources();', "Bundled Android app must refresh map sources after Android WebView startup.");
requireBundledText('state.map.zoomTo(nudgeZoom, { duration: 0, animate: false });', "Bundled Android app must force a zero-duration Mapbox zoom nudge after Android WebView startup.");
requireBundledText('window.setTimeout(repaint, 32000);', "Bundled Android app must keep retrying map paint after slower Android WebView startup.");
requireBundledText('stabilizeAndroidMapPaint();', "Bundled Android app must trigger map paint stabilization after layers and markers are attached.");
requireBundledText('mobileProfileStats', "Bundled Android app must render Directus-backed profile stats.");
requireBundledText('ensureProfileActivitySynced', "Bundled Android app must sync profile activity from Directus.");
requireBundledText('languageRemoteAttemptExists', "Bundled Android app must check Directus before saving language attempts.");
requireBundledText('syncLanguageAttempt', "Bundled Android app must save language attempts through the shared sync path.");
requireBundledText('Content editing needs the editor password.', "Bundled Android app must keep admin editing behind authenticated Directus login.");
requireBundledText('frontendEditorPayload', "Bundled Android app must include the current mobile admin editor payload path.");

console.log(`Android shell verifier passed: ${expectedBuild}`);


