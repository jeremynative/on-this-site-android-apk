const fs = require("fs");

const expectedBuild = "20260605-search-card-raw-fallback";
const expectedUrl = "https://nativelongisland.com/archive-test/mobile-app-live.html";
const mainActivityPath = "app/src/main/java/com/nativelongisland/onthissite/MainActivity.java";
const releaseWorkflowPath = ".github/workflows/build-release-apk.yml";
const bundledAppPath = "app/src/main/assets/mobile-app.html";
const bundledLiveAppPath = "app/src/main/assets/mobile-app-live.html";
const stylesPath = "app/src/main/res/values/styles.xml";
const launchBackgroundPath = "app/src/main/res/drawable/launch_background.xml";
const manifestPath = "app/src/main/AndroidManifest.xml";
const appBridgePath = "app/src/main/java/com/nativelongisland/onthissite/AppBridge.java";

const bundledAppBytes = fs.readFileSync(bundledAppPath);
const bundledLiveAppBytes = fs.readFileSync(bundledLiveAppPath);
const source = fs.readFileSync(mainActivityPath, "utf8");
const releaseWorkflow = fs.readFileSync(releaseWorkflowPath, "utf8");
const manifest = fs.readFileSync(manifestPath, "utf8");
const appBridge = fs.readFileSync(appBridgePath, "utf8");
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
requireText("__nliAndroidGeoGateInstalled", "Android shell must install the APK geolocation gate.");
requireText("window.__nliAllowGeoUntil=Date.now()+120000;", "Android shell must allow the app's startup Near me location request.");
if (!manifest.includes("android.permission.POST_NOTIFICATIONS")) {
  throw new Error("Android shell must request notification permission for nearby site alerts.");
}
requireText("NEARBY_NOTIFICATION_CHANNEL_ID", "Android shell must define a nearby site notification channel.");
requireText("createNotificationChannel();", "Android shell must create the nearby notification channel during startup.");
requireText("showNearbyNotification", "Android shell must expose native nearby notifications.");
if (!appBridge.includes("showNotification") || !appBridge.includes("showNearbyNotification")) {
  throw new Error("Android app bridge must expose native notifications to the mobile web app.");
}
requireText("CookieManager.getInstance()", "Android shell must explicitly enable WebView cookies for SiteGround and app sessions.");
requireText("setAcceptThirdPartyCookies(webView, true)", "Android shell must allow SiteGround/Directus session cookies inside the APK WebView.");
requireText("settings.setCacheMode(WebSettings.LOAD_DEFAULT)", "Android shell must allow WebView to cache remote Mapbox/static resources between launches.");
requireText("FrameLayout root = new FrameLayout(this);", "Android shell must layer a native startup cover over slow cold WebView startup.");
requireText("webView.setBackgroundColor(Color.rgb(238, 243, 237));", "Android shell must use the app theme color behind the WebView during startup.");
requireText("createLoadingCover", "Android shell must create a visible native loading cover before WebView content is ready.");
requireText("hideLoadingCover", "Android shell must hide the native loading cover after the app page finishes.");
requireText('cover.setText("On This Site");', "Android shell must show branded loading text instead of a blank white screen.");
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
requireText("MAP_TAP_BRIDGE_DELAY_MS", "Android shell must delay the native map bridge until WebView UI clicks run.");
requireText("postDelayed", "Android shell must post-delay map tap forwarding to prevent panel click-through.");
requireText("cacheAndroidSearchResultTap(event);", "Android shell must cache search result taps before the keyboard can shift the page.");
requireText("window.onAndroidSearchResultTapStart", "Android shell must call the search result tap bridge on touch down.");
requireText("MotionEvent.ACTION_UP", "Android shell must only forward completed taps.");
requireText("action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_UP", "Android shell must keep map drag move frames out of the tap bridge.");
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
for (const [label, html] of [
  ["embedded fallback", bundledApp],
  ["live fallback", bundledLiveApp],
]) {
  if (!html.includes('"wyandanch": {') || !html.includes("mobile-biography-place-path") || !html.includes("data-mobile-biography-path-index")) {
    throw new Error(`Bundled Android ${label} is missing the mobile Wyandanch biography path.`);
  }
  if (!html.includes("properties: { kind: \"point\", order: index + 1, label: String(index + 1), title: place.label }")) {
    throw new Error(`Bundled Android ${label} is missing string-labeled biography path map features.`);
  }
  if (!html.includes("button.dataset.mobileBiographyPathOrder = String(index + 1);") || !html.includes("button.dataset.pinLabel = String(index + 1);") || !html.includes("button.textContent = String(index + 1);")) {
    throw new Error(`Bundled Android ${label} is missing visible numbered biography path map pins.`);
  }
  if (!html.includes('"text-field": ["to-string", ["get", "order"]]')) {
    throw new Error(`Bundled Android ${label} must draw travel-pin number labels from the map feature order.`);
  }
  if (!/id:\s*"mobile-biography-place-labels"[\s\S]*?"text-field":\s*\["to-string",\s*\["get",\s*"order"\]\][\s\S]*?\}\s*\);/.test(html)) {
    throw new Error(`Bundled Android ${label} must render travel-pin number labels above normal site layers.`);
  }
  if (!/\.mobile-biography-path-map-number\s*\{[\s\S]*?font-size:\s*9\.5px;[\s\S]*?z-index:\s*6;/.test(html) || !/\.mobile-biography-path-map-number::after\s*\{\s*content:\s*none;/.test(html)) {
    throw new Error(`Bundled Android ${label} must show travel-pin numbers as actual marker text.`);
  }
  if (!html.includes('resultType: "wiki"') || !html.includes('data-wiki-slug="${escapeHtml(site.slug)}"')) {
    throw new Error(`Bundled Android ${label} is missing mobile wiki article search results.`);
  }
  if (!/const\s+labels\s*=\s*new Set\(\);[\s\S]*?labels\.has\(labelKey\)/.test(html)) {
    throw new Error(`Bundled Android ${label} is missing visible site tag label dedupe.`);
  }
}
if (bundledLiveAppBytes.length > 1500000 || /window\.NLI_MOBILE_DATA\s*=/.test(bundledLiveApp)) {
  throw new Error("Bundled Android live fallback should stay lightweight and Directus-backed, not embed the full data payload.");
}

for (const forbidden of ["DIRECTUS_PASSWORD", "DIRECTUS_EMAIL", "NotebookLM", "notebooklm"]) {
  if (bundledApp.includes(forbidden) || bundledLiveApp.includes(forbidden)) {
    throw new Error(`Bundled Android app must not expose ${forbidden}.`);
  }
}

requireBundledText('const SITE_LABEL_MIN_ZOOM = 10.75;', "Bundled Android app must hold detail site labels until a closer local zoom.");
requireBundledText('const SITE_POINT_LABEL_MIN_ZOOM = 13.35;', "Bundled Android app should show point labels at close neighborhood zoom.");
requireBundledText('function prepareMobileSiteIconImage(image)', "Bundled Android app must normalize custom marker images before Mapbox rendering.");
requireBundledText('"text-opacity": ["interpolate", ["linear"], ["zoom"], SITE_POINT_LABEL_MIN_ZOOM, 0, SITE_POINT_LABEL_MIN_ZOOM + 0.35, 1]', "Bundled Android point labels must fade in around the local-area zoom threshold.");
requireBundledPattern(/state\.map\.on\("zoomend",\s*\(\)\s*=>\s*\{[\s\S]*?syncMarkers\(\{\s*auxiliary:\s*false\s*\}\);[\s\S]*?syncMapStoryMarkers\(\);[\s\S]*?\}\);/, "Bundled Android zoom should refresh marker offsets once on zoomend without full auxiliary marker work.");
if (/state\.map\.on\("zoom",\s*syncMapStoryMarkers\)/.test(bundledApp) || /state\.map\.on\("zoom",\s*syncMapStoryMarkers\)/.test(bundledLiveApp)) {
  throw new Error("Bundled Android app must not resync story markers on every zoom frame.");
}
requireBundledText('mobilePanelTapBlockUntil: 0', "Bundled Android app must track the panel close tap shield.");
requireBundledText('function blockMobileMapTaps(durationMs = 1600)', "Bundled Android app must block repeated map taps after panel dismissal.");
requireBundledText('function isAndroidUiOverlayTap(clientX, clientY)', "Bundled Android app must reject drawer/header/sheet taps before trying alternate map coordinates.");
requireBundledText('if (isMobileMapTapBlocked()) return false;', "Bundled Android map bridge must ignore taps after panel dismissal.");
requireBundledText('listTouchActivationUntil: 0', "Bundled Android app must track first-tap search result activation.");
requireBundledText('function activateMobileListTarget(target, event)', "Bundled Android app must share nearby/search card activation.");
requireBundledText('window.onAndroidSearchResultTapStart = function onAndroidSearchResultTapStart', "Bundled Android app must cache search result taps before keyboard dismissal.");
requireBundledText('function androidSearchResultCardFromViewPoint(viewX, viewY, viewWidth, viewHeight)', "Bundled Android app must choose search cards from screen-space bounds before elementFromPoint fallback.");
requireBundledText('const boundsCard = androidSearchResultCardFromViewPoint(viewX, viewY, viewWidth, viewHeight);', "Bundled Android app must prioritize the visible tapped search card bounds.");
requireBundledText('const nearestCard = nearestAndroidSearchResultCardFromViewPoint(viewX, viewY, viewWidth, viewHeight);', "Bundled Android app must use the nearest visible search card if coordinates shift during keyboard changes.");
requireBundledText('function nearestAndroidSearchResultCardFromViewPoint(viewX, viewY, viewWidth, viewHeight)', "Bundled Android app must include a nearest-card search tap fallback.");
requireBundledText('return bestScore <= 190 ? best : null;', "Bundled Android nearest-card fallback must stay bounded to visible search cards.");
requireBundledText('const rawCard = nearestAndroidSearchResultCardFromRawPoint(viewX, viewY, viewWidth, viewHeight);', "Bundled Android app must fall back to raw Android tap coordinates for visible search cards.");
requireBundledText('function nearestAndroidSearchResultCardFromRawPoint(viewX, viewY, viewWidth, viewHeight)', "Bundled Android app must include the raw-coordinate search card fallback.");
requireBundledText('return rawY > rawHeight * 0.32 && rawY < rawHeight * 0.66 ? cards[0] : null;', "Bundled Android raw search fallback must stay inside the visible result band.");
requireBundledText('function cacheAndroidSearchResultCard(card)', "Bundled Android app must let the real touched search card override coordinate fallback.");
requireBundledText('function mobileListCardTarget(card)', "Bundled Android app must recover a result target from the visible card title when a live card has an empty slug.");
requireBundledText('data-result-index="${index}" data-result-kind="${isWiki ? "wiki" : "site"}" data-result-slug="${escapeHtml(site.slug || "")}"', "Bundled Android app must render stable result target metadata on search cards.");
requireBundledText('function mobileListCardTargetFromData(card)', "Bundled Android app must use rendered result metadata before coordinate or title fallbacks.");
requireBundledText('function mobileListCardTargetByIndex(card)', "Bundled Android app must recover a result target from the visible card index.");
requireBundledText('const dataItem = state.filtered[dataIndex];', "Bundled Android app must map data-result-index back to the filtered result list.");
requireBundledText('const item = index >= 0 ? state.filtered[index] : null;', "Bundled Android app must map tapped result cards back to the filtered result list.");
requireBundledText('const wiki = (state.wikiArticles || []).find(article => normalizeText(article.title || "") === key);', "Bundled Android app must map empty-slug wiki result cards back to their article slug.");
requireBundledText('function activatePendingAndroidSearchResultTap()', "Bundled Android app must activate cached search result taps on touch end.");
requireBundledText('listEl.addEventListener("touchstart"', "Bundled Android app must capture the actual touched search result card before keyboard dismissal.");
requireBundledText('listEl.addEventListener("touchend"', "Bundled Android app must open search result cards on Android touchend.");
requireBundledPattern(/listEl\.addEventListener\("touchend"[\s\S]*?!isNativeAndroidApp\(\)\s*\|\|\s*!searchEl\?\.value\?\.trim\(\)[\s\S]*?activateMobileListTarget/, "Bundled Android search touchend must survive keyboard blur.");
requireBundledPattern(/listEl\.addEventListener\("touchstart"[\s\S]*?!isNativeAndroidApp\(\)\s*\|\|\s*!searchEl\?\.value\?\.trim\(\)[\s\S]*?cacheAndroidSearchResultCard/, "Bundled Android search touchstart must cache cards even if the keyboard blurs before touchend.");
requireBundledText('state.pendingAndroidSearchResultTap = null;', "Bundled Android app must clear pending search taps after normal touch activation.");
requireBundledText('state.listTouchActivationUntil = performance.now() + 650;', "Bundled Android app must suppress duplicate click after touch activation.");
requireBundledText('"text-allow-overlap": false', "Bundled Android app must keep close-zoom point labels readable with collision handling.");
requireBundledText('settings.showPins = true;', "Bundled Android app must recover from saved Sites-off settings so site icons stay visible.");
requireBundledText('selected-site-map-label', "Bundled Android app must show a dedicated title label for the selected site marker.");
requireBundledPattern(/function shouldShowCustomMapIcons\(\)\s*\{\s*return true;\s*\}/, "Bundled Android app must keep site icons visible independently of point-label zoom.");
requireBundledPattern(/"location_label"\s*:\s*"[^"]+"/, "Bundled Android app must include historic moment location labels.");
requireBundledText('window.NLI_FEEDBACK_UTILS', "Bundled Android app must include shared feedback utilities.");
requireBundledPattern(/detailBodyEl\.innerHTML\s*=\s*`[\s\S]*?\$\{siteTagsHtml\(site\)\}[\s\S]*?\$\{sections\}[\s\S]*?\$\{historyHtml\}[\s\S]*?\$\{whyThisMattersHtml\(site\)\}[\s\S]*?\$\{relatedSitesSection\(site\)\}/, "Bundled Android site articles must place Why This Matters before related sites near the end.");
requireBundledText('const feedbackPayload = FEEDBACK_UTILS.buildFeedbackCommentPayload', "Bundled Android app must save feedback through the shared Directus payload.");
requireBundledText('source_type: "feedback"', "Bundled Android app feedback must use the feedback source type.");
requireBundledText('feedbackSheetEl.style.visibility = "hidden"', "Bundled Android app must hide the feedback sheet before screenshot capture.");
requireBundledText('sendFeedbackReviewEmail', "Bundled Android app must notify review email after feedback saves.");
requireBundledText('data-take-comment-photo', "Bundled Android app must expose comment camera capture controls.");
requireBundledText('compressCommentImage', "Bundled Android app must compress oversized comment photos before upload.");
requireBundledText('Search sites, towns, histories', "Bundled Android app must include mobile search.");
requireBundledText('searchDataVersion: 0', "Bundled Android app must track search data rebuilds.");
requireBundledText('lastSearchDataVersion: -1', "Bundled Android app must remember the last processed search data version.");
requireBundledText('state.searchDataVersion += 1;', "Bundled Android app must mark rebuilt site data for search refresh.");
requireBundledText('value === state.lastSearchValue && state.lastSearchDataVersion === state.searchDataVersion', "Bundled Android app must not skip same-text searches after data changes.");
requireBundledPattern(/ensureLandMask\(\)[\s\S]*?prepareSites\(\);[\s\S]*?scheduleSearchSync\(\);[\s\S]*?refreshMobileMapSources\(\);/, "Bundled Android app must preserve an active search after deferred map data rebuilds.");
requireBundledText('enterkeyhint="search"', "Bundled Android app must request the Android keyboard search action.");
requireBundledText('autocomplete="off"', "Bundled Android app must keep the mobile search input from fighting app results.");
requireBundledText('function openMobileSearchResultsPage()', "Bundled Android app must include an explicit mobile search results page.");
requireBundledText('setNearbyPanelState("expanded")', "Bundled Android app must expand the nearby tray for submitted search results.");
requireBundledText('setNearbyExpanded(true)', "Bundled Android app must make submitted search results use the full results view.");
requireBundledText('searchEl.addEventListener("keydown", handleMobileSearchKeydown);', "Bundled Android app must open search results on Enter.");
requireBundledText('searchEl.addEventListener("search", handleMobileSearchCommand);', "Bundled Android app must open search results from the Android search keyboard action.");
requireBundledText('listTitleTextEl.textContent = showingSearch ? "Search results" : "Nearby sites";', "Bundled Android app must label the results view clearly.");
requireBundledPattern(/function\s+installNativeAndroidSearchWatch\(\)[\s\S]*?\/Android\/i\.test\(navigator\.userAgent\)[\s\S]*?setInterval\(scheduleSearchSync,\s*350\)/, "Bundled Android app must poll search value changes on Android even if the native bridge is delayed.");
requireBundledText('normalizedSearchText: normalizeText', "Bundled Android app must include normalized mobile search text.");
requireBundledText('function scheduleSearchSync()', "Bundled Android app must watch mobile search value changes.");
requireBundledText('function closeDetailForSearchResults()', "Bundled Android app must close open detail sheets before search results take over.");
requireBundledText('if (value.trim()) closeDetailForSearchResults();', "Bundled Android search sync must close an open detail sheet while typing.");
requireBundledText('function clearMobileSearchForResultOpen()', "Bundled Android app must clear active search before opening a result detail panel.");
requireBundledText('searchEl.value = "";', "Bundled Android result opens must empty the search box so search polling does not close the article.");
requireBundledText('state.filtered = visitableSites();', "Bundled Android result opens must restore the nearby list after clearing search.");
requireBundledText('searchEl.addEventListener("keyup", handleMobileSearchInput);', "Bundled Android app must filter search after Android keyboard events.");
requireBundledText('searchEl.addEventListener("focus", handleMobileSearchFocus);', "Bundled Android app must poll focused search values for WebView text changes.");
requireBundledText('function installNativeAndroidSearchWatch()', "Bundled Android app must keep polling native Android search values.");
requireBundledText('state.lastSearchValue = "";\n      scheduleSearchSync();\n      state.nativeAndroidSearchWatchTimer = window.setInterval(scheduleSearchSync, 350);', "Bundled Android app must process search text typed before native polling starts.");
requireBundledText('state.nativeAndroidSearchWatchTimer = window.setInterval(scheduleSearchSync, 350);', "Bundled Android app must persistently sync native Android search input.");
requireBundledText('Profile activity sync will retry later.', "Bundled Android app must keep profile activity sync retry logging.");
requireBundledText('state.profileActivitySynced = false;\n          return false;', "Bundled Android app must leave failed profile sync retryable.");
requireBundledText('sorted by proximity', "Bundled Android app must label nearby results as proximity sorted.");
requireBundledText('const STARTUP_LOCATION_ZOOM = NEAR_ME_ZOOM;', "Bundled Android app must open with the Near me zoom level.");
requireBundledText('if (nativeAndroid) await requestStartupLocation();', "Bundled Android app must request location before the first nearby list render.");
requireBundledText('refreshAndroidMapAfterSettle("android-startup-near-me")', "Bundled Android app must recenter the initialized map on startup location.");
requireBundledText('function randomMobileStartupSpotlightSite', "Bundled Android app must choose a random mapped site when startup location is off Long Island.");
requireBundledText('function showMobileStartupSpotlight', "Bundled Android app must show the compact off-island startup site card.");
requireBundledText('mobile-startup-spotlight', "Bundled Android app must include the mobile Did you know startup card.");
requireBundledText('showRandomMobileStartupSpotlight()', "Bundled Android app must use the random site spotlight before falling back to the full island view.");
requireBundledText('mobileStartupSpotlightReturnOnDetailClose: false', "Bundled Android app must remember when a startup spotlight article should return to Long Island view.");
requireBundledText('fitLongIslandMapView("mobile-startup-spotlight-dismissed")', "Bundled Android app must zoom out to Long Island after dismissing the startup spotlight.");
requireBundledText('fitLongIslandMapView("mobile-startup-spotlight-article-closed")', "Bundled Android app must zoom out to Long Island after closing the startup spotlight article.");
requireBundledText('fromStartupSpotlight: true', "Bundled Android app must defer the Long Island view until the spotlight article is closed.");
requireBundledText('const SITE_CHECKIN_RADIUS_MILES = 0.25;', "Bundled Android app must require check-ins within a quarter mile.");
requireBundledText('const SITE_VISIT_ALERT_RADIUS_MILES = 0.5;', "Bundled Android app must alert within half a mile of a site.");
requireBundledText('window.AndroidApp.showNotification', "Bundled Android app must use the native notification bridge.");
requireBundledText('localStorage.getItem("nli-proximity-alert-date") === todayKey', "Bundled Android app must limit nearby site notifications to once per day.");
requireBundledText('const NEARBY_LIST_ANDROID_INITIAL_LIMIT = 24;', "Bundled Android app must keep the first nearby tray render small.");
requireBundledText('data-nearby-show-more', "Bundled Android app must let users reveal more nearby places after the startup cap.");
requireBundledText('const nativeAndroid = isNativeAndroidApp();', "Bundled Android app must cache native Android startup state.");
requireBundledText('if (nativeAndroid) {\n          hideLoadingScreen();\n          await new Promise(resolve => window.requestAnimationFrame(resolve));\n        }\n        await openInitialRouteFromUrl();', "Bundled Android app must reveal the shell before slower route and map startup work.");
requireBundledText('function stabilizeAndroidMapPaint()', "Bundled Android app must include the Android map paint stabilizer.");
requireBundledText('state.map.resize();', "Bundled Android app must resize the map after Android WebView startup.");
requireBundledText('refreshMobileMapSources();', "Bundled Android app must refresh map sources after Android WebView startup.");
requireBundledText('function bindAndroidMapGestureGuards()', "Bundled Android app must pause expensive map refreshes while the user is dragging or pinching.");
requireBundledText('state.map.on("dragstart", markAndroidMapGestureActive);', "Bundled Android app must detect the start of finger map drags.");
requireBundledText('if (isAndroidMapGestureActive()) {\n          state.pendingAndroidMapRefresh = true;\n          return;\n        }', "Bundled Android app must defer settle refreshes during active map gestures.");
requireBundledText('window.setTimeout(repaint, 900);', "Bundled Android paint stabilization must retry after active map gestures settle.");
if (/function\s+stabilizeAndroidMapPaint\(\)[\s\S]*?\.zoomTo\(|function\s+stabilizeAndroidMapPaint\(\)[\s\S]*?\.jumpTo\(/.test(bundledApp) ||
    /function\s+stabilizeAndroidMapPaint\(\)[\s\S]*?\.zoomTo\(|function\s+stabilizeAndroidMapPaint\(\)[\s\S]*?\.jumpTo\(/.test(bundledLiveApp)) {
  throw new Error("Bundled Android map paint stabilizer must not change zoom or center without user input.");
}
requireBundledText('window.setTimeout(repaint, 32000);', "Bundled Android app must keep retrying map paint after slower Android WebView startup.");
requireBundledText('stabilizeAndroidMapPaint();', "Bundled Android app must trigger map paint stabilization after layers and markers are attached.");
requireBundledText('mobileProfileStats', "Bundled Android app must render Directus-backed profile stats.");
requireBundledText('ensureProfileActivitySynced', "Bundled Android app must sync profile activity from Directus.");
requireBundledText('async function ensureProfileStatsSynced()', "Bundled Android app must sync profile activity and canonical point events before rendering account stats.");
requireBundledText('ensureCanonicalProfilePointEvents(currentContributorProfile())', "Bundled Android app must read canonical point events for the active profile.");
requireBundledText('Refreshing latest Directus activity...', "Bundled Android app must render cached profile stats while Directus activity refreshes.");
requireBundledText('function updateProfileMenuButton', "Bundled Android app must update the profile menu button with current points.");
requireBundledText('${displayName} (${points})', "Bundled Android app must show the profile display name and points in the menu button.");
requireBundledText('mobileProfileStats(activeProfile, { syncRemote: false })', "Bundled Android profile menu points must not trigger remote point sync loops.");
requireBundledText('updateProfileMenuButton(stats)', "Bundled Android app must refresh menu points after profile stats render.");
requireBundledText('max-width: 142px;', "Bundled Android account button must keep the profile point label compact.");
requireBundledText('white-space: nowrap;', "Bundled Android account button must keep profile points on one line.");
if (bundledApp.includes("Refreshing profile activity from Directus...</p>")) {
  throw new Error("Bundled Android app still renders the old loading-only profile card.");
}
if (bundledApp.includes("const pointSafeActivity = pointsSyncing ? { ...activity, pointEvents: [] } : activity;")) {
  throw new Error("Bundled Android app still hides cached point events while Directus point sync is pending.");
}
if (bundledApp.includes('const totalPoints = stats.pointsSyncing ? "..." : stats.points;')) {
  throw new Error("Bundled Android app still hides account points while Directus point sync is pending.");
}
requireBundledText('languageRemoteAttemptExists', "Bundled Android app must check Directus before saving language attempts.");
requireBundledText('syncLanguageAttempt', "Bundled Android app must save language attempts through the shared sync path.");
requireBundledText('Content editing needs the editor password.', "Bundled Android app must keep admin editing behind authenticated Directus login.");
requireBundledText('frontendEditorPayload', "Bundled Android app must include the current mobile admin editor payload path.");

console.log(`Android shell verifier passed: ${expectedBuild}`);

