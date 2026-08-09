const fs = require("fs");

const expectedBuild = "20260809-private-comment-camera-r52";
const expectedUrl = "https://directus.nativelongisland.com/app/mobile-app-live.html";
const mainActivityPath = "app/src/main/java/com/nativelongisland/onthissite/MainActivity.java";
const releaseWorkflowPath = ".github/workflows/build-release-apk.yml";
const bundledAppPath = "app/src/main/assets/mobile-app.html";
const bundledLiveAppPath = "app/src/main/assets/mobile-app-live.html";
const lightweightOfflineAppPath = "app/src/main/assets/offline-app.html";
const bundledMobileJsPath = "app/src/main/assets/assets/js/mobile-app.js";
const bundledMobileCssPath = "app/src/main/assets/assets/css/mobile-app.css";
const bundledLearningCardUtilsPath = "app/src/main/assets/assets/js/shared-learning-card-utils.js";
const bundledResearchQuestionCssPath = "app/src/main/assets/assets/css/shared-research-question.css";
const bundledSharedSiteUtilsPath = "app/src/main/assets/assets/js/shared-site-utils.js";
const stylesPath = "app/src/main/res/values/styles.xml";
const launchBackgroundPath = "app/src/main/res/drawable/launch_background.xml";
const manifestPath = "app/src/main/AndroidManifest.xml";
const appBridgePath = "app/src/main/java/com/nativelongisland/onthissite/AppBridge.java";
const captureFileProviderPath = "app/src/main/java/com/nativelongisland/onthissite/CaptureFileProvider.java";
const nativeCommentPhotoCompatPath = "app/src/main/assets/native-comment-photo-compat.js";
const offlineInsetAuditPath = "audit-apk-offline-insets.mjs";
const bundledMobileIndexPaths = [
  "app/src/main/assets/assets/data/mobile-site-geometry.json",
  "app/src/main/assets/assets/data/mobile-site-index.json",
  "app/src/main/assets/assets/data/mobile-timeline-index.json",
  "app/src/main/assets/assets/data/mobile-wiki-index.json"
];

const bundledAppBytes = fs.readFileSync(bundledAppPath);
const bundledLiveAppBytes = fs.readFileSync(bundledLiveAppPath);
const lightweightOfflineApp = fs.readFileSync(lightweightOfflineAppPath, "utf8");
const source = fs.readFileSync(mainActivityPath, "utf8");
const releaseWorkflow = fs.readFileSync(releaseWorkflowPath, "utf8");
const manifest = fs.readFileSync(manifestPath, "utf8");
const appBridge = fs.readFileSync(appBridgePath, "utf8");
const captureFileProvider = fs.readFileSync(captureFileProviderPath, "utf8");
const nativeCommentPhotoCompat = fs.readFileSync(nativeCommentPhotoCompatPath, "utf8");
const offlineInsetAudit = fs.readFileSync(offlineInsetAuditPath, "utf8");
const bundledApp = bundledAppBytes.toString("utf8");
const bundledLiveApp = bundledLiveAppBytes.toString("utf8");
const bundledMobileJs = fs.readFileSync(bundledMobileJsPath, "utf8");
const bundledMobileCss = fs.readFileSync(bundledMobileCssPath, "utf8");
const bundledLiveRuntime = `${bundledLiveApp}\n${bundledMobileJs}\n${bundledMobileCss}`;
const bundledLearningCardUtils = fs.readFileSync(bundledLearningCardUtilsPath, "utf8");
const bundledResearchQuestionCss = fs.readFileSync(bundledResearchQuestionCssPath, "utf8");
const bundledSharedSiteUtils = fs.readFileSync(bundledSharedSiteUtilsPath, "utf8");
const styles = fs.readFileSync(stylesPath, "utf8");
const launchBackground = fs.readFileSync(launchBackgroundPath, "utf8");

if (!lightweightOfflineApp.includes('class="brand-row"')
    || !lightweightOfflineApp.includes('class="offline-pill">Offline')
    || !lightweightOfflineApp.includes('data-offline-jump="map"')
    || !lightweightOfflineApp.includes('data-offline-jump="archive"')) {
  throw new Error("Lightweight offline archive must retain the compact On This Site header and Map/Browse navigation.");
}

for (const file of bundledMobileIndexPaths) {
  if (!fs.existsSync(file) || fs.statSync(file).size < 100) {
    throw new Error(`Bundled Android fallback is missing required mobile index: ${file}`);
  }
}

const bundledSiteIndex = JSON.parse(fs.readFileSync(
  "app/src/main/assets/assets/data/mobile-site-index.json",
  "utf8"
));
const bundledSiteGeometry = JSON.parse(fs.readFileSync(
  "app/src/main/assets/assets/data/mobile-site-geometry.json",
  "utf8"
));

function siteSlugs(payload) {
  return new Set((Array.isArray(payload?.rows) ? payload.rows : [])
    .map(row => String(row?.slug || "").trim())
    .filter(Boolean));
}

function setDifference(left, right) {
  return [...left].filter(slug => !right.has(slug)).sort();
}

const bundledIndexSlugs = siteSlugs(bundledSiteIndex);
const bundledGeometrySlugs = siteSlugs(bundledSiteGeometry);
const missingBundledGeometry = setDifference(bundledIndexSlugs, bundledGeometrySlugs);
const extraBundledGeometry = setDifference(bundledGeometrySlugs, bundledIndexSlugs);
if (missingBundledGeometry.length || extraBundledGeometry.length) {
  throw new Error(
    `Bundled Android site index/geometry parity failed. Missing geometry: ${missingBundledGeometry.join(", ") || "none"}; `
      + `unexpected geometry: ${extraBundledGeometry.join(", ") || "none"}.`
  );
}
for (const slug of ["coopers-beach-shinnecock-access", "watermill-center"]) {
  if (!bundledIndexSlugs.has(slug)) {
    throw new Error(`Bundled Android fallback is missing recently published site: ${slug}`);
  }
}
if (!bundledApp.includes("John Jermain Memorial Library donates more than 400 Native American books")) {
  throw new Error("Bundled Android fallback is missing the Ma's House 2022 library-donation historic moment.");
}

function decodeQuoteHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&ldquo;|&rdquo;|&quot;/g, '"')
    .replace(/&lsquo;|&rsquo;|&#39;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function verifyGeneralPlaceNameQuotes(document, label) {
  const match = document.match(/window\.NLI_MOBILE_DATA\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) {
    throw new Error(`${label} is missing its embedded mobile data payload.`);
  }
  const payload = JSON.parse(match[1]);
  const placeNames = (Array.isArray(payload.sites) ? payload.sites : [])
    .filter(site => site.site_type === "placename");
  if (placeNames.length !== 306) {
    throw new Error(`${label} must contain 306 place-name listings; found ${placeNames.length}.`);
  }

  const quotes = placeNames.map(site => {
    const quoteMatch = String(site.translation_content || "")
      .match(/<blockquote class="place-name-quote">\s*<p>([\s\S]*?)<\/p>/);
    if (!quoteMatch) {
      throw new Error(`${label} is missing a place-name quotation for ${site.slug}.`);
    }
    return { slug: site.slug, text: decodeQuoteHtml(quoteMatch[1]) };
  });
  const normalized = quotes.map(({ text }) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim());
  if (new Set(normalized).size !== 306) {
    throw new Error(`${label} must contain 306 distinct place-name quotations.`);
  }

  const subjectPattern = /\b(?:geographic(?:al)? names?|place[- ]names?|placenames|toponym\w*|names?|named|namer|naming|nomenclature|gazetteer)\b/i;
  const outsidePlacePattern = /\b(?:Tsilhqot|Shinnecock|Montauk|Algonkian|Algonquian|Gaelic|Armenia|Australia|Austria|Belgium|Brunei|Botswana|Canada|China|Crimea|Cyprus|Denmark|Finland|France|Germany|Greece|Hungary|Iceland|Indonesia|Ireland|Israel|Italy|Japan|Jordan|Korea|Lithuania|Madagascar|Mexico|Mozambique|Netherlands|New Zealand|Nordic|Norway|Poland|Romania|Russia|South Africa|Spain|Sweden|Switzerland|Tunisia|Ukraine|United Kingdom|United States|Vietnam)\b/i;
  const sourceSpecificContextPattern = /\b(?:these descendant communities|these communities|our (?:land|lands|homeland|homelands|territory|territories|country|people|language|ancestors)|this country we share|traditional owners)\b/i;
  for (const quote of quotes) {
    if (
      !subjectPattern.test(quote.text) &&
      !/\bwords we choose for places\b/i.test(quote.text)
    ) {
      throw new Error(`${label} quotation for ${quote.slug} is not explicitly about place names or naming.`);
    }
    if (outsidePlacePattern.test(quote.text) || sourceSpecificContextPattern.test(quote.text)) {
      throw new Error(`${label} quotation for ${quote.slug} makes an outside-place or territory-specific claim.`);
    }
  }
}

verifyGeneralPlaceNameQuotes(bundledApp, "Bundled Android fallback");

function bundledTimelineEvents(document, label) {
  const match = document.match(/window\.NLI_MOBILE_DATA\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) throw new Error(`${label} is missing its embedded mobile data payload.`);
  const events = JSON.parse(match[1]).timelineEvents;
  if (!Array.isArray(events)) throw new Error(`${label} is missing its historic timeline.`);
  return events;
}

const bundledTimeline = bundledTimelineEvents(bundledApp, "Bundled Android fallback");
if (bundledTimeline.length !== 1375) {
  throw new Error(`Bundled Android fallback must contain all 1,375 public timeline moments; found ${bundledTimeline.length}.`);
}
const bundledSourceRecords = bundledTimeline.filter(event => !(event?.source_type && (event?.source_slug || event?.source_id)));
if (bundledSourceRecords.length !== 288) {
  throw new Error(`Bundled Android fallback must retain 288 unlinked public source records; found ${bundledSourceRecords.length}.`);
}

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

function forbidBundledText(text, message) {
  const haystack = bundledApp.replace(/\r\n/g, "\n");
  const needle = text.replace(/\r\n/g, "\n");
  if (haystack.includes(needle)) {
    throw new Error(message);
  }
}

function requireBundledPattern(pattern, message) {
  if (!pattern.test(bundledApp)) {
    throw new Error(message);
  }
}

requireText(`APP_VERSION = "${expectedBuild}"`, `Android shell build id must be ${expectedBuild}.`);
requireText("readCurrentInputText(InputConnection connection, CharSequence fallback)", "Android search bridge must read the complete WebView input value after each IME edit.");
requireText("connection.getExtractedText(new ExtractedTextRequest(), 0)", "Android search bridge must prefer the IME's full extracted text over composing fragments.");
requireText("boolean handled = super.setComposingText(text, newCursorPosition);", "Android search bridge must read the complete value after applying composition.");
requireText("boolean handled = super.commitText(text, newCursorPosition);", "Android search bridge must read the complete value after committing text.");
requireText("public boolean performEditorAction(int editorAction)", "Android search bridge must handle the keyboard Search action.");
requireText("dispatchNativeSearchSubmit();", "Android keyboard Search must submit the current full query to the app.");
requireText("COMMENT_BRIDGE_CAMERA_REQUEST", "Android shell must reserve a dedicated result path for comment-camera captures.");
requireText("window.onAndroidCommentPhoto", "Android shell must return a captured comment photo to the WebView draft.");
requireText("COMMENT_PHOTO_READ_MAX_ATTEMPTS", "Android shell must briefly retry a Samsung comment-camera output before reporting failure.");
requireText("deliverCommentBridgePhoto(uri, attempt + 1)", "Android shell must retry a temporarily unreadable captured comment photo.");
requireText("CaptureFileProvider.createCommentCaptureUri(this)", "Comment camera output must use app-private storage instead of MediaStore.");
requireText('intent.setClipData(ClipData.newRawUri("comment-photo", pendingCommentBridgeCameraUri))', "Samsung Camera must receive the private output URI through ClipData as well as EXTRA_OUTPUT.");
if (!captureFileProvider.includes('AUTHORITY = BuildConfig.APPLICATION_ID + ".capture"')
    || !captureFileProvider.includes('context.getCacheDir()')
    || !captureFileProvider.includes('ParcelFileDescriptor.MODE_TRUNCATE')) {
  throw new Error("The dedicated comment camera provider must expose only app-private temporary JPEG output.");
}
if (!manifest.includes('android:name=".CaptureFileProvider"')
    || !manifest.includes('android:exported="false"')
    || !manifest.includes('android:grantUriPermissions="true"')) {
  throw new Error("Android manifest must register the non-exported private comment camera provider.");
}
if (/pendingCommentBridgeCameraUri\s*=\s*MediaStorePhotoHelper\.createPlantPhotoUri/.test(source)) {
  throw new Error("Comment camera capture must not regress to shared MediaStore output.");
}
requireText('installNativeCommentPhotoCompatibility(view);', "Every hosted or bundled page must receive the native-owned comment photo compatibility layer.");
requireText('window.__otsReceiveNativeCommentPhoto', "Native delivery must fall back to the wrapper-owned comment photo receiver when the hosted handler changes.");
if (!nativeCommentPhotoCompat.includes('[data-take-comment-photo]')
    || !nativeCommentPhotoCompat.includes('bridge.takeCommentPhoto()')
    || !nativeCommentPhotoCompat.includes('new DataTransfer()')
    || !nativeCommentPhotoCompat.includes('input.dispatchEvent(new Event("change", { bubbles: true }))')) {
  throw new Error("Native comment camera compatibility must own click routing and a file-input delivery fallback.");
}
if (!appBridge.includes("public void takeCommentPhoto()") || !appBridge.includes("COMMENT_BRIDGE_CAMERA_PERMISSION_REQUEST")) {
  throw new Error("Android bridge must expose the dedicated comment-camera action.");
}
if (!appBridge.includes("public void chooseCommentPhoto()") || !source.includes("COMMENT_BRIDGE_PICKER_REQUEST")) {
  throw new Error("Android bridge must expose a dedicated comment-photo library action.");
}
requireText("Intent.ACTION_OPEN_DOCUMENT", "Comment photo selection must use the durable Android document picker.");
requireText("Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION", "Comment photo selection must request persistable read access.");
requireText("deliverPickedCommentPhoto(data.getData())", "Selected comment photos must be imported while the picker grant is active.");
requireBundledText("window.AndroidApp.chooseCommentPhoto()", "The bundled app must use the native comment-photo library bridge.");
requireText("updateNativeSafeInsets(insets);", "Android shell must capture current window insets instead of padding the WebView.");
requireText("WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout()", "Android shell must include system bars and display cutouts in its safe boundary.");
requireText("windowInsets.getInsetsIgnoringVisibility(safeTypes)", "Android shell must preserve stable system-bar bounds when bars are temporarily hidden.");
requireText("windowInsets.getStableInsetBottom()", "Legacy Android devices must preserve the stable bottom navigation inset.");
requireText("window.dispatchEvent(new Event('nli-native-insets-changed'))", "Android shell must notify the web layout when native insets change.");
requireText("public void onConfigurationChanged(Configuration newConfig)", "Android shell must refresh safe insets after a device rotation.");
requireText("webView.post(webView::requestApplyInsets);", "Android shell must request current insets after resume and configuration changes.");
if (source.includes("view.setPadding(0, insets.getSystemWindowInsetTop()")) {
  throw new Error("Android shell must not apply ineffective system-bar padding to the full-height WebView.");
}
for (const side of ["Top", "Right", "Bottom", "Left"]) {
  if (!appBridge.includes(`public float getSafeInset${side}()`)) {
    throw new Error(`Android bridge must expose the native ${side.toLowerCase()} safe inset.`);
  }
}
if (!bundledSharedSiteUtils.includes("function siteIntroductionPresentation(site = {}, sections = [], options = {})")
    || !bundledSharedSiteUtils.includes("section?.[2]?.content === introductionField")
    || !bundledSharedSiteUtils.includes("siteIntroductionPresentation,")) {
  throw new Error("Bundled Android site utilities must expose the deterministic single-introduction decision.");
}
for (const [label, document] of [
  ["bundled fallback", bundledApp],
  ["bundled mobile runtime", bundledMobileJs]
]) {
  if (!document.includes("SITE_UTILS.siteIntroductionPresentation(site, sectionEntries, {")
      || !document.includes("summary: site.summary")
      || !document.includes('data-site-introduction="section"')
      || !document.includes('data-site-introduction="summary"')) {
    throw new Error(`${label} must render exactly one deterministic listing introduction.`);
  }
  if (document.includes('${publicCleanText(site.summary) ? `<p class="summary">${escapeHtml(publicCleanText(site.summary))}</p>` : ""}')) {
    throw new Error(`${label} still renders the obsolete unconditional summary above Introduction.`);
  }
  if (!document.includes("if (path?.animate === false) return null;")) {
    throw new Error(`${label} must animate reviewed multi-stop biographies unless they explicitly opt out.`);
  }
  if (!document.includes("!state.landMaskData?.geometry) return false;")) {
    throw new Error(`${label} must show the safe canoe state until land data is available.`);
  }
  if (document.includes("if (path?.animate !== true) return null;")) {
    throw new Error(`${label} still contains the obsolete explicit-travel-only biography animation rule.`);
  }
}
for (const [label, document] of [
  ["bundled fallback", bundledApp]
]) {
  if (!document.includes('id="mobile-layer-enable-all"')
      || !document.includes('id="mobile-layer-disable-all"')
      || !document.includes("function setAllMobileLayerVisibility(visible)")
      || !document.includes('mobileLayerEnableAllBtn?.addEventListener("click", () => runMobileLayerBulkAction(true));')
      || !document.includes('mobileLayerDisableAllBtn?.addEventListener("click", () => runMobileLayerBulkAction(false));')) {
    throw new Error(`${label} must include working Enable all and Disable all label controls.`);
  }
}
if (!bundledMobileCss.includes("header:has(.mobile-more-menu[open]),")
    || !bundledMobileCss.includes("header:has(.mobile-layer-menu[open])")
    || !bundledMobileCss.includes(".mobile-layer-bulk-actions")
    || !bundledMobileCss.includes("grid-template-columns: repeat(2, minmax(0, 1fr));")) {
  throw new Error("Bundled Android label panel must stay above the map tabs and keep its two bulk actions side by side.");
}
if (!/\.mobile-more-menu\[open\] \.mobile-more-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*!important;[\s\S]*?touch-action:\s*pan-y;/.test(bundledMobileCss)
    || !/@media \(max-width: 339px\)[\s\S]*?\.mobile-more-menu\[open\] \.mobile-more-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr\s*!important;/.test(bundledMobileCss)
    || !/@media \(orientation: landscape\) and \(max-height: 560px\)[\s\S]*?body\.native-android-app \.mobile-more-menu\[open\] \.mobile-more-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)\s*!important;/.test(bundledMobileCss)) {
  throw new Error("Bundled Android More menu must fit portrait and short-landscape safe areas without relying on nested scrolling.");
}
if (!/\.mobile-startup-spotlight-close\s*\{[\s\S]*?width:\s*40px;[\s\S]*?height:\s*40px;/.test(bundledMobileCss)
    || !/\.mobile-startup-spotlight-actions button\s*\{[\s\S]*?min-height:\s*40px;/.test(bundledMobileCss)) {
  throw new Error("Bundled Android startup card controls must preserve the audited 40px touch targets.");
}
for (const side of ["top", "right", "bottom", "left"]) {
  if (!bundledMobileCss.includes(`--native-${side}-safe: 0px;`)
      || !new RegExp(`--app-${side}-safe:\\s*max\\([^;]*var\\(--native-${side}-safe\\)`).test(bundledMobileCss)) {
    throw new Error(`Bundled Android CSS must include the native ${side} inset in its shared safe boundary.`);
  }
}
for (const side of ["Top", "Right", "Bottom", "Left"]) {
  if (!bundledMobileJs.includes(`androidBridgeCssPixel("getSafeInset${side}")`)) {
    throw new Error(`Bundled Android runtime must read the native ${side.toLowerCase()} safe inset.`);
  }
}
if (!bundledMobileJs.includes('window.addEventListener("nli-native-insets-changed", () => {')
    || !bundledMobileJs.includes("fitMobileMoreMenu(moreMenu);")
    || !bundledMobileJs.includes("fitMobileLayerMenu(layerMenu);")
    || !bundledMobileJs.includes('const reserved = cssPixelValue("--app-top-safe", 0) + cssPixelValue("--app-bottom-safe", 0);')) {
  throw new Error("Bundled Android runtime must refresh native insets and reserve both vertical edges for detail drawers.");
}
if (!bundledMobileJs.includes('const leftSafe = Math.max(pad, cssPixelValue("--app-left-safe", 0));')
    || !bundledMobileJs.includes('const rightSafe = Math.max(pad, cssPixelValue("--app-right-safe", 0));')
    || !bundledMobileJs.includes("viewportWidth - leftSafe - rightSafe")) {
  throw new Error("Bundled Android menu fitting must reserve side navigation bars and display cutouts.");
}
if (!bundledMobileJs.includes('const safeLeft = cssPixelValue("--app-left-safe", 0) + 10;')
    || !bundledMobileJs.includes('const safeBottom = cssPixelValue("--app-bottom-safe", 0) + 10;')) {
  throw new Error("Bundled Android quote action must stay inside all four safe-area edges.");
}
if (!bundledResearchQuestionCss.includes("left: max(16px, var(--app-left-safe, env(safe-area-inset-left)));")
    || !bundledResearchQuestionCss.includes("right: max(16px, var(--app-right-safe, env(safe-area-inset-right)));")
    || !bundledResearchQuestionCss.includes("@media (orientation: landscape) and (max-height: 560px)")) {
  throw new Error("Bundled Android research-question controls must reserve portrait and landscape system bars.");
}
if (!bundledMobileJs.includes("function setAllMobileLayerVisibility(visible)")
    || !bundledMobileJs.includes("state.settings.showBiographyPaths = false;")
    || !bundledMobileJs.includes("const items = mobileBiographyPathsEnabled() ? mobileMovingBiographyItems() : [];")
    || !bundledMobileJs.includes("ensureMobileMovingBiographyMarkers();")
    || !bundledMobileJs.includes("state.settings.layerCategories = {};")
    || !bundledMobileJs.includes("state.settings.eraCategories = {};")
    || !bundledMobileJs.includes("primaryStates.slice(0, 3).every(Boolean)")
    || !bundledMobileJs.includes("Date.now() < mobileLayerBulkReadyAt")
    || !bundledMobileJs.includes("mobileLayerBulkReadyAt = Date.now() + 400;")) {
  throw new Error("Bundled Android bulk labels must exclude biography paths and reject the Labels-menu opening touch.");
}
for (const [label, document] of [
  ["bundled fallback", bundledApp]
]) {
  if (!document.includes("Biography paths &amp; icons")
      || !document.includes("const items = mobileBiographyPathsEnabled() ? mobileMovingBiographyItems() : [];")) {
    throw new Error(`${label} must hide moving biography icons with the Biography paths & icons control.`);
  }
}
if (!bundledLearningCardUtils.includes("function normalizeLearningCard(input = {}, options = {})")
    || !bundledLearningCardUtils.includes("function createActionGuard()")
    || !bundledMobileJs.includes("function mobileActivityCardModel(item, index)")
    || !bundledMobileJs.includes("function mobileTimelineFeedCardModel(event, index)")
    || !bundledMobileJs.includes("function nearbyFeedCardModel(item, index, options = {})")) {
  throw new Error("Bundled Android fallback must include the shared Activity, Timeline, and Nearby learning-card model.");
}
if (!bundledApp.includes('id="mobile-panel-size-toggle"')
    || !bundledLiveApp.includes('id="mobile-panel-size-toggle"')
    || !bundledMobileCss.includes(".app.panel-maximized")
    || !bundledMobileCss.includes("padding-bottom: var(--app-bottom-safe);")
    || !bundledMobileJs.includes('if (state.mobilePanelState === "maximized")')
    || !bundledMobileJs.includes('setMobileBottomPanelState("normal");')) {
  throw new Error("Bundled Android panel controls must retain a safe map strip and support maximized-to-normal Back navigation.");
}
requireText(expectedUrl, `Android shell must load ${expectedUrl}.`);
requireText("?app-version=", "Android shell must pass the app build id to the mobile web app.");
requireText("&apk-version=", "Android shell must pass the APK version to the mobile web app.");
requireText("&refresh=", "Android shell must use a refresh token when loading the mobile web app.");
requireText("Cache-Control", "Android shell must request a fresh copy of the mobile web app.");
requireText("shouldInterceptRequest", "Android shell must be able to serve the bundled app fallback inside the APK WebView.");
requireText("loadBundledFallback", "Android shell must keep the bundled archive as a fallback path.");
if (!manifest.includes("ACCESS_NETWORK_STATE")) {
  throw new Error("Android shell must be able to detect a true offline launch.");
}
requireText("hasUsableNetwork()", "Android shell must route no-network launches directly to the bundled archive.");
requireText("webView.loadDataWithBaseURL(", "Android shell must open the lightweight offline archive without a network navigation.");
requireText("OFFLINE_BASE_URL", "Android shell must keep a stable same-origin base URL for bundled offline data files.");
requireText('readBundledTextAsset("offline-app.html")', "Android shell must load the lightweight offline document directly from APK assets.");
requireText("OFFLINE_COVER_REVEAL_DELAY_MS", "Android shell must reveal the offline interface on a bounded timer.");
requireText("revealBundledFallback", "Android shell must not leave the native title cover over a ready offline archive.");
requireText("LIVE_STARTUP_FALLBACK_DELAY_MS = 22000", "Android shell must let the bounded page-readiness probe finish before falling back on a cold validated connection.");
requireText('showLoadingCover("Opening saved map...")', "Android shell must identify the saved-map fallback while it opens.");
requireText("registerConnectivityMonitoring();", "Android shell must start runtime connectivity monitoring.");
requireText("registerDefaultNetworkCallback(connectivityCallback)", "Android shell must monitor the active network on Android 7 and newer.");
requireText("connectivityManager.registerNetworkCallback(request, connectivityCallback)", "Android shell must monitor connectivity on Android 6.");
requireText("NET_CAPABILITY_VALIDATED", "Android shell must require a validated network before loading the live shell.");
requireText("unregisterConnectivityMonitoring();", "Android shell must release its network callback when destroyed.");
requireText("validated == lastValidatedNetworkState", "Android shell must deduplicate repeated network callback events.");
requireText("liveRecoveryAttemptedForCurrentNetwork", "Android shell must bound live recovery to one attempt per validated network connection.");
requireText("VALIDATED_NETWORK_STABLE_DELAY_MS", "Android shell must debounce validated-network recovery.");
requireText("NETWORK_LOSS_GRACE_DELAY_MS", "Android shell must allow brief Wi-Fi/cellular handoffs before falling back.");
requireText("|| !loadingBundledFallback", "Android shell must only recover live from an active fallback after validation.");
requireText("requestBundledFallbackPreservingActiveWork", "Android shell must preserve active work before replacing a live shell.");
requireText("__nliCaptureAndroidLifecycleSnapshot", "Android shell must capture the current app state before a connectivity transition.");
requireText("active-work", "Android shell must defer offline fallback while a form has unsaved changes.");
requireText("ACTIVE_WORK_RECHECK_DELAY_MS", "Android shell must recheck deferred fallback without a reload loop.");
requireText("scheduleNetworkStateEvaluation(\"resume\");", "Android shell must reconcile connectivity changes that occurred while its WebView was paused.");
requireText("APP_READINESS_MAX_ATTEMPTS", "Android shell must wait for usable content instead of accepting an empty title shell.");
requireText("document.querySelector('.offline-map-index')", "Android readiness must verify that the offline place index rendered.");
requireText("app-readiness-timeout", "Android shell must fall back when the live page never produces usable content.");
requireText("if (!loadingBundledFallback) return null;", "Android live mode must use deployed assets instead of stale APK-packaged site data.");
requireText("onReceivedHttpError", "Android shell must fall back when the live mobile archive returns an HTTP error.");
requireText("isSiteGroundChallengeUrl", "Android shell must detect SiteGround challenge redirects and use the bundled fallback.");
requireText("loadBundledFallback(\"siteground-challenge-start\")", "Android shell must switch to the bundled fallback as soon as SiteGround challenge navigation starts.");
requireText("shouldIgnoreLifecycleMainFrameReload", "Android shell must ignore non-explicit main-frame reloads after the app has loaded.");
requireText("appShellLoaded = true;", "Android shell must remember when the app shell has loaded.");
requireText('"directus.nativelongisland.com".equalsIgnoreCase(host)', "Android shell must treat the VPS-hosted app shell as an archive host.");
requireText('"nativelongisland.com".equalsIgnoreCase(host) && path != null && path.startsWith("/assets/")', "Android shell must not intercept Directus root asset URLs as bundled app assets.");
requireText('path.startsWith("/app/assets/")', "Android shell must serve VPS app-shell assets from the bundled APK when available.");
requireText('"/app/long-island-land-mask.geojson".equals(path)', "Android shell must serve the VPS app-shell land mask from the bundled APK when available.");
requireText('"/app/long-island-land-mask-lite.json".equals(path)', "Android shell must serve the compressible lightweight VPS land mask from the bundled APK.");
requireText("loadingBundledFallback && \"/mobile-app-live.html\".equals(path)", "Android shell must not intercept the live mobile archive unless the fallback is active.");
requireText("loadingBundledFallback && \"/mobile-app.html\".equals(path)", "Android shell must serve the full bundled archive when live Directus startup falls back.");
requireText("loadingBundledFallback && \"/app/offline-app.html\".equals(path)", "Android shell must serve the lightweight offline archive through its bundled HTTPS origin.");
requireText('assetName = "mobile-app.html";', "Android shell must serve embedded mobile data for the full archive fallback.");
requireText("mobile-app.html", "Android shell must include the bundled mobile app fallback asset.");
requireText("mobile-app-live.html", "Android shell must include the lightweight Directus-backed mobile app fallback asset.");
if (!lightweightOfflineApp.includes("offline-text-mode")
    || !lightweightOfflineApp.includes("offline-map-index")
    || !lightweightOfflineApp.includes("mobile-site-index.json")
    || !lightweightOfflineApp.includes("mobile-site-geometry.json")
    || !lightweightOfflineApp.includes("mobile-wiki-index.json")) {
  throw new Error("Lightweight APK fallback must render the saved map and text indexes without online application startup.");
}
for (const side of ["Top", "Right", "Bottom", "Left"]) {
  if (!lightweightOfflineApp.includes(`getSafeInset${side}`)
      || !lightweightOfflineApp.includes(`--native-${side.toLowerCase()}-safe`)
      || !lightweightOfflineApp.includes(`--app-${side.toLowerCase()}-safe`)) {
    throw new Error(`Lightweight APK fallback must reserve the native ${side.toLowerCase()} safe inset.`);
  }
}
if (!lightweightOfflineApp.includes('addEventListener("nli-native-insets-changed",syncNativeInsets)')
    || !lightweightOfflineApp.includes("inset:var(--app-top-safe) var(--app-right-safe) var(--app-bottom-safe) var(--app-left-safe)")) {
  throw new Error("Lightweight APK fallback must refresh native insets and keep its detail dialog inside them.");
}
if (!offlineInsetAudit.includes("getSafeInsetBottom")
    || !offlineInsetAudit.includes("result.detail.safe")
    || !offlineInsetAudit.includes("nativeInsetsValid")) {
  throw new Error("Android regression tooling must exercise the offline archive against native system bars.");
}
if (lightweightOfflineApp.length > 180000) {
  throw new Error("Lightweight APK fallback must remain small enough for fast no-signal startup.");
}
requireText("long-island-land-mask.geojson", "Android shell must include the bundled land mask fallback asset.");
requireText("long-island-land-mask-lite.json", "Android shell must include the lightweight land mask asset.");
requireText("BuildConfig.MAPBOX_TOKEN", "Android shell must inject the Mapbox token from build configuration.");
requireText('"assets/js/mobile-app.js".equals(assetName)', "Android shell must inject the build-time Mapbox token into its local mobile runtime asset.");
requireText("androidApkStartupScript", "Android shell must inject APK startup guards before the bundled app runs.");
requireText("__nliAndroidGeoGateInstalled", "Android shell must install the APK geolocation gate.");
requireText("window.NLI_APK_SNAPSHOT_MODE=true;", "Android shell must mark the bundled app as a snapshot APK.");
requireText("window.NLI_APK_OFFLINE_TEXT_MODE=true;", "Android shell must mark the bundled fallback as a text-first offline archive.");
requireText("window.NLI_DISABLE_DIRECTUS_RUNTIME=true;", "Android shell must disable Directus runtime calls in the snapshot APK.");
requireText("directus.nativelongisland.com", "Android shell must block Directus requests while the APK snapshot is offline.");
requireText("window.__nliAllowGeoUntil=Date.now()+120000;", "Android shell must allow the app's startup Near me location request.");
requireText("#locate,#mobile-map-locate,#suggest-use-location", "Android shell must allow the dedicated map location control through the geolocation gate.");
if (!bundledMobileJs.includes("function isApkSnapshotMode()") || !bundledApp.includes("function isApkSnapshotMode()")) {
  throw new Error("Bundled mobile shells must distinguish live Android mode from offline APK snapshot mode.");
}
if (!bundledMobileJs.includes("const text = isOfflineTextMode()")) {
  throw new Error("The live Android shell must not label every Android WebView as an APK snapshot.");
}
for (const [needle, message] of [
  ["--mobile-map-actions-top", "APK activity controls must track the visible map top."],
  ["body.mobile-content-open .mobile-notification-button", "APK floating controls must hide while content panels are open."],
  ["function mobilePanelMapPadding()", "APK map focus must account for open content panels."],
  ["function resetMobilePanelScroll(panel)", "APK panels must reset to the beginning when opened."],
  ["const overviewZoom = 11.25", "APK detail close must return to a stable overview zoom."],
  ["limit: options.limit || 3", "APK related sites must be capped at three."],
  ["const MOBILE_CANOE_LAND_SAMPLE_RADIUS_DEG = 0.00022", "APK canoe state must sample the moving icon footprint near narrow land."],
  ["mobileMovingLandSamples(coordinates).some", "APK canoe state must hide when any sampled point touches land."],
  ["MEDIA_UTILS.optimizedMapIconUrl", "APK map markers must preserve optimized transparent artwork."],
  ["id=\"mobile-map-locate\"", "APK map must include a dedicated current-location control."],
  ["id=\"mobile-map-locate\" type=\"button\" data-allow-geolocation", "APK current-location control must pass the Android geolocation gate."],
  [".native-android-app .mobile-map-locate", "APK current-location control must only appear in the native Android app."],
  ["mobileMapLocateBtn?.addEventListener", "APK current-location control must be interactive."],
  ["async function locateMapUser()", "APK current-location control must reuse the map location flow."],
  ["function renderOfflineMapIndex()", "APK fallback must provide a browsable text-only place index."],
  ["Offline archive:", "APK fallback must clearly identify saved offline content."],
  ["data-offline-region=\"west\"", "APK fallback must allow browsing saved sites by Long Island area."],
  [".offline-text-mode img", "APK fallback must suppress media while offline."]
]) {
  if (!bundledLiveRuntime.includes(needle) || !bundledApp.includes(needle)) throw new Error(message);
}
if (bundledLiveRuntime.includes("fit=inside&format=webp") || bundledApp.includes("fit=inside&format=webp")) {
  throw new Error("APK map markers must not use Directus WebP transforms that add dark edge bars.");
}
if (!bundledLiveRuntime.includes("if (isApkSnapshotMode()) {")
    || !bundledLiveRuntime.includes("const localIcon = APK_LOCAL_MAP_ICON_OVERRIDES")) {
  throw new Error("The live Android shell must allow VPS-hosted icon URLs outside offline snapshot mode.");
}
if (!manifest.includes("android.permission.POST_NOTIFICATIONS")) {
  throw new Error("Android shell must request notification permission for nearby site alerts.");
}
if (!manifest.includes('android:launchMode="singleTop"') || !manifest.includes('android:alwaysRetainTaskState="true"')) {
  throw new Error("Android shell must retain the current activity when returning from the launcher or app switcher.");
}
requireText("NEARBY_NOTIFICATION_CHANNEL_ID", "Android shell must define a nearby site notification channel.");
requireText("createNotificationChannel();", "Android shell must create the nearby notification channel during startup.");
requireText("showNearbyNotification", "Android shell must expose native nearby notifications.");
if (!appBridge.includes("showNotification") || !appBridge.includes("showNearbyNotification")) {
  throw new Error("Android app bridge must expose native notifications to the mobile web app.");
}
if (!appBridge.includes("public boolean isDebugBuild()") || !appBridge.includes("return BuildConfig.DEBUG;")) {
  throw new Error("Android app bridge must expose the debug-only location-control audit guard.");
}
requireText("CookieManager.getInstance()", "Android shell must explicitly enable WebView cookies for SiteGround and app sessions.");
requireText("setAcceptThirdPartyCookies(webView, true)", "Android shell must allow web session cookies inside the APK WebView.");
requireText("settings.setCacheMode(WebSettings.LOAD_DEFAULT)", "Android shell must allow WebView to cache remote Mapbox/static resources between launches.");
requireText("FrameLayout root = new FrameLayout(this);", "Android shell must layer a native startup cover over slow cold WebView startup.");
requireText("webView.setBackgroundColor(Color.rgb(238, 243, 237));", "Android shell must use the app theme color behind the WebView during startup.");
requireText("createLoadingCover", "Android shell must create a visible native loading cover before WebView content is ready.");
requireText("loadingCover = createLoadingCover();", "Android shell must attach the native cover during every cold start.");
requireText("root.addView(loadingCover", "Android shell must layer the native cover above the WebView.");
requireText("hideLoadingCover", "Android shell must hide the native loading cover after the app page finishes.");
requireText("onPageCommitVisible", "Android shell must observe the first committed WebView frame.");
if (/onPageCommitVisible\(WebView view, String url\)[\s\S]{0,300}?hideLoadingCover\(\)/.test(source)) {
  throw new Error("Android shell must keep the native cover until the app is interactive, not merely committed.");
}
if (/onPageFinished\(WebView view, String url\)[\s\S]{0,1000}?hideLoadingCover\(\);[\s\S]*?validateLoadedAppShell\(url\)/.test(source)) {
  throw new Error("Android shell must not uncover a partially initialized app at page completion.");
}
requireText('getAssets().open("assets/images/long-island-loading-outline.png")', "Android shell must show the Long Island loading outline during cold startup.");
requireText('loadingCoverLabel.setText("Loading On This Site");', "Android shell must label the animated Long Island loading screen.");
requireText("ObjectAnimator.ofFloat(outline, View.ALPHA", "Android shell must animate the Long Island loading outline.");
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
if (!refreshAppMatch || !refreshAppMatch[0].includes("webView.loadUrl(url, headers);")) {
  throw new Error("Android shell must start from the live self-hosted mobile shell.");
}
if (refreshAppMatch[0].includes('loadBundledFallback("startup-snapshot-shell");')) {
  throw new Error("Android shell must not start from the emergency bundled snapshot now that self-hosted Directus is live.");
}
const onResumeMatch = source.match(/protected void onResume\(\) \{[\s\S]*?\n    \}/);
if (!onResumeMatch || !onResumeMatch[0].includes("webView.onResume();")) {
  throw new Error("Android shell must resume the existing WebView instead of reloading the app.");
}
if (/protected void onResume\(\) \{[\s\S]*?(refreshApp\(|loadBundledFallback\(|loadUrl\(|loadDataWithBaseURL\()/m.test(onResumeMatch[0])) {
  throw new Error("Android shell must not reload the app when returning from another window.");
}
if (!onResumeMatch[0].includes("scheduleNetworkStateEvaluation(\"resume\");")) {
  throw new Error("Android shell must debounce a connectivity reconciliation when returning from another window.");
}
const connectivityCallbackMatch = source.match(/connectivityCallback = new ConnectivityManager\.NetworkCallback\(\) \{[\s\S]*?\n        \};/);
if (!connectivityCallbackMatch) {
  throw new Error("Android shell must define one bounded runtime network callback.");
}
if (/(refreshApp\(|loadBundledFallback\(|loadUrl\(|loadDataWithBaseURL\()/.test(connectivityCallbackMatch[0])) {
  throw new Error("Network callback methods must debounce state evaluation instead of reloading the WebView directly.");
}
const networkStateMatch = source.match(/private void handleNetworkStateChange\(String reason\) \{[\s\S]*?\n    \}/);
if (!networkStateMatch
    || !networkStateMatch[0].includes("startupHandler.removeCallbacks(validatedNetworkRecovery);")
    || !networkStateMatch[0].includes("startupHandler.removeCallbacks(unusableNetworkFallback);")
    || !networkStateMatch[0].includes("liveRecoveryAttemptedForCurrentNetwork = false;")) {
  throw new Error("Runtime network transitions must cancel stale opposite-direction work before scheduling a switch.");
}
if (!/loadingBundledFallback\s*\n\s*&& hasUsableNetwork\(\)\s*\n\s*&& !liveRecoveryAttemptedForCurrentNetwork/.test(source)) {
  throw new Error("A ready fallback must schedule one live retry when the existing network is already validated.");
}
const activeWorkFallbackMatch = source.match(/private void requestBundledFallbackPreservingActiveWork\(String reason\) \{[\s\S]*?\n    \}/);
if (!activeWorkFallbackMatch
    || !activeWorkFallbackMatch[0].includes("if (activeWork)")
    || !activeWorkFallbackMatch[0].includes("ACTIVE_WORK_RECHECK_DELAY_MS")
    || !activeWorkFallbackMatch[0].includes("loadBundledFallback(reason);")) {
  throw new Error("Offline fallback must defer for active form work and retry without dropping it.");
}
const lifecycleReloadGuardMatch = source.match(/private boolean shouldIgnoreLifecycleMainFrameReload\(String reason\) \{[\s\S]*?\n    \}/);
if (!lifecycleReloadGuardMatch || !lifecycleReloadGuardMatch[0].includes("if (!appShellLoaded) return false;")) {
  throw new Error("Android shell must allow fallback only before the app shell has loaded.");
}
if (/LIFECYCLE_RELOAD_GRACE_MS|resumedAt|stoppedAt\s*</.test(lifecycleReloadGuardMatch[0])) {
  throw new Error("Android shell must not use a timed resume window that can reload after switching apps.");
}
if (/LIFECYCLE_RELOAD_GRACE_MS|resumedAt|wasStopped|stoppedAt/.test(source)) {
  throw new Error("Android shell must not keep timed resume reload state.");
}
if (!source.includes("android.webkit.WebBackForwardList restoredState = webView.restoreState(savedInstanceState);") ||
    !source.includes("restoredState != null && restoredState.getSize() > 0") ||
    !source.includes('Log.w(LOG_TAG, "Saved WebView state was empty after restore; loading app shell.");') ||
    !source.includes("refreshApp();")) {
  throw new Error("Android shell must reload the app shell when saved WebView restore state is empty after an update.");
}
if (!source.includes('currentUrl == null || currentUrl.isEmpty() || "about:blank".equals(currentUrl)')) {
  throw new Error("Android shell must not block fallback when the current WebView URL is blank.");
}
const fallbackMatch = source.match(/private void loadBundledFallback\(String reason\) \{[\s\S]*?\n    \}/);
if (!fallbackMatch
    || !fallbackMatch[0].includes('readBundledTextAsset("offline-app.html")')
    || !fallbackMatch[0].includes("webView.loadDataWithBaseURL(")
    || !fallbackMatch[0].includes("OFFLINE_BASE_URL")) {
  throw new Error("No-signal startup must open the lightweight APK archive without waiting on a network URL.");
}
if (/Thread loader|bundledMobileHtml\(\)/.test(fallbackMatch[0])) {
  throw new Error("No-signal startup must not parse the full bundled online application before showing saved content.");
}
requireText("dispatchTouchEvent", "Android shell must forward app taps into the mobile map.");
requireText("window.onAndroidMapTap", "Android shell must call the mobile map tap bridge.");
requireText("cacheAndroidUiOverlayTap(event);", "Android shell must pre-cache UI overlay taps before delayed map forwarding.");
requireText("window.onAndroidUiOverlayTapStart", "Android shell must call the UI overlay tap bridge.");
requireText("cacheAndroidMobilePromoActionTap(event);", "Android shell must forward Android touch-down events to fixed promo-card actions.");
requireText("window.onAndroidMobilePromoActionTap", "Android shell must call the promo-card action bridge.");
requireText("missing-map-tap-bridge", "Android shell must log when the mobile map tap bridge is missing.");
requireText("MAP_TAP_BRIDGE_DELAY_MS", "Android shell must delay the native map bridge until WebView UI clicks run.");
requireText("postDelayed", "Android shell must post-delay map tap forwarding to prevent panel click-through.");
requireText("cacheAndroidSearchResultTap(event);", "Android shell must cache search result taps before the keyboard can shift the page.");
requireText("window.onAndroidSearchResultTapStart", "Android shell must call the search result tap bridge on touch down.");
requireText("MotionEvent.ACTION_UP", "Android shell must only forward completed taps.");
requireText("action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_UP", "Android shell must keep map drag move frames out of the tap bridge.");
requireText("boolean isArchiveApp = \"nativelongisland.com\".equalsIgnoreCase(host);", "Android shell must keep nativelongisland.com navigation inside the APK WebView.");
if (source.includes("applyApkTimelineTrayFix")
    || source.includes("android-apk-timeline-tray-fix")
    || source.includes("android-apk-timeline-fix")) {
  throw new Error("Android shell must not inject the obsolete single-card Timeline tray override into the vertical feed.");
}
const backHandlerMatch = source.match(/public void onBackPressed\(\) \{[\s\S]*?\n    \}/);
if (!backHandlerMatch
    || !backHandlerMatch[0].includes("window.onAndroidBackPressed && window.onAndroidBackPressed()")
    || !backHandlerMatch[0].includes('if ("true".equals(handled)) return;')
    || !backHandlerMatch[0].includes("if (webView.canGoBack())")) {
  throw new Error("Android Back must let the web panel reduce its state before navigating WebView history or leaving the app.");
}

if (!releaseWorkflow.includes("GITHUB_RUN_NUMBER") || !releaseWorkflow.includes("latest_apk") || !releaseWorkflow.includes("version_code=\"$run_number\"")) {
  throw new Error("Android release workflow must keep versionCode monotonic across testing and tagged releases.");
}
if (releaseWorkflow.includes("(pk|sk)") || releaseWorkflow.includes("grep -oE '(pk|sk)")) {
  throw new Error("Android release workflow must never discover or package secret sk Mapbox tokens.");
}
if (!releaseWorkflow.includes("grep -oE 'pk\\.ey") || !releaseWorkflow.includes('[[ ! "$MAPBOX_TOKEN" =~ ^pk\\.ey ]]')) {
  throw new Error("Android release workflow must only allow public pk Mapbox tokens.");
}

for (const [label, bytes, html, runtime] of [
  ["embedded fallback", bundledAppBytes, bundledApp, bundledApp],
  ["live fallback", bundledLiveAppBytes, bundledLiveApp, bundledLiveRuntime],
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
  if (!runtime.includes("__NLI_MAPBOX_TOKEN__")) {
    throw new Error(`Bundled Android ${label} is missing the Mapbox token placeholder.`);
  }
}
const expectedPlaceholderCounts = new Map([
  ["embedded fallback", [bundledApp, 2]],
  ["live fallback", [bundledLiveApp, 0]],
  ["mobile JavaScript", [bundledMobileJs, 1]],
]);
for (const [label, [source, expectedCount]] of expectedPlaceholderCounts) {
  const count = (source.match(/__NLI_MAPBOX_TOKEN__/g) || []).length;
  if (count !== expectedCount) {
    throw new Error(`Bundled Android ${label} must contain exactly ${expectedCount} Mapbox placeholder${expectedCount === 1 ? "" : "s"}, found ${count}.`);
  }
}
if (!bundledApp.includes("ortnamn_och_namnvard_nr6_engelsk\\u002epdf")
    || bundledApp.includes("engel__NLI_MAPBOX_TOKEN__")) {
  throw new Error("Bundled Android citation URLs must preserve the authoritative engelsk.pdf source instead of treating sk. as a Mapbox token.");
}
if ((bundledMobileJs.match(/(?:^|[^A-Za-z0-9_-])[ps]k\.[A-Za-z0-9._-]+/g) || []).length) {
  throw new Error("Bundled Android JavaScript must keep Mapbox tokens as build-time placeholders.");
}
if (!bundledMobileJs.includes('const MAPBOX_PUBLIC_TOKEN = "__NLI_MAPBOX_TOKEN__";')) {
  throw new Error("Bundled Android JavaScript is missing the Mapbox build-time placeholder.");
}
if (!bundledMobileJs.includes("function mapIsCenteredOnLocation(location, tolerancePixels = 12)")) {
  throw new Error("Bundled mobile JavaScript must detect when the map is centered on the user.");
}
if (!bundledMobileJs.includes("zoomIfAlreadyCentered: isNativeAndroidApp()")) {
  throw new Error("Bundled mobile JavaScript must enable repeated location zoom only in the APK.");
}
const archiveTestRoot = "https://nativelongisland.com/" + "archive-test/";
if (source.includes("archive-test") || bundledApp.includes(archiveTestRoot) || bundledLiveApp.includes(archiveTestRoot)) {
  throw new Error("Android shell and bundled APK HTML must use the live root site, not archive-test.");
}

if (!bundledApp.includes("window.NLI_MOBILE_DATA")) {
  throw new Error("Bundled Android app is missing embedded mobile data.");
}
for (const [label, html] of [["embedded fallback", bundledApp]]) {
  if (!html.includes('"wyandanch": {') || !html.includes("mobile-biography-place-path") || !html.includes("data-mobile-biography-path-index")) {
    throw new Error(`Bundled Android ${label} is missing the mobile Wyandanch biography path.`);
  }
  if (!html.includes("function mobileBiographyPathMapPinLabel(place = {}, order = 1)") ||
      !/return\s+`\$\{order\}\s+-\s+\$\{mobileBiographyPathTimelineLabel\(place\)\}`/.test(html) ||
      !/const\s+pathLabel\s*=\s*mobileBiographyPathTimelineLabel\(place\)[\s\S]*?const\s+numberedPathLabel\s*=\s*mobileBiographyPathMapPinLabel\(place,\s*order\)[\s\S]*?pin_label:\s*numberedPathLabel[\s\S]*?title:\s*pathLabel/.test(html)) {
    throw new Error(`Bundled Android ${label} is missing numbered biography path labels.`);
  }
  if (!html.includes('id: "mobile-biography-place-labels"') ||
      !html.includes('"text-field": ["get", "pin_label"]') ||
      !html.includes('"text-variable-anchor": ["literal", ["top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right"]]') ||
      !html.includes('"text-allow-overlap": false')) {
    throw new Error(`Bundled Android ${label} is missing collision-aware biography path labels.`);
  }
  if (/label\.textContent\s*=\s*`\$\{person\}\s+\$\{index\s*\+\s*1\}`/.test(html)) {
    throw new Error(`Bundled Android ${label} must not use useless person-number biography labels.`);
  }
  if (!/\.mobile-biography-path-map-number\s*\{[\s\S]*?font-size:\s*9\.5px;[\s\S]*?font-weight:\s*650;/.test(html) || !/\.mobile-biography-path-map-number-label\s*\{[\s\S]*?font-size:\s*9\.5px;[\s\S]*?font-weight:\s*650;/.test(html)) {
    throw new Error(`Bundled Android ${label} must keep fallback biography labels visually lighter.`);
  }
  if (!html.includes('resultType: "wiki"')
      || (!html.includes('data-wiki-slug="${escapeHtml(site.slug)}"')
        && !html.includes('data-wiki-slug="${escapeHtml(card.item.slug)}"'))) {
    throw new Error(`Bundled Android ${label} is missing mobile wiki article search results.`);
  }
  if (!/const\s+labels\s*=\s*new Set\(\);[\s\S]*?labels\.has\(labelKey\)/.test(html)) {
    throw new Error(`Bundled Android ${label} is missing visible site tag label dedupe.`);
  }
}
if (bundledLiveAppBytes.length > 1560000 || /window\.NLI_MOBILE_DATA\s*=/.test(bundledLiveApp)) {
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
requireBundledText('id: "mobile-site-point-dots"', "Bundled Android app must render visible bundled point markers without remote icon images.");
requireBundledText('const APK_LOCAL_MAP_ICON_OVERRIDES = Object.freeze({', "Bundled Android app must map Directus marker icon ids to bundled local assets.");
requireBundledText('if (isApkSnapshotMode() && !/^assets\\/map-icons\\//i.test(url)) return;', "Bundled Android app must ignore non-bundled marker icon URLs during snapshot startup.");
requireBundledText('id: "mobile-site-icons"', "Bundled Android app must render local custom marker icons in the APK.");
requireBundledText('data-mobile-adopt-place', "Bundled Android app must expose Adopt This Place from listing pages.");
requireBundledText('function updateMobileHeaderInstruction()', "Bundled Android app must keep mobile content-count header text synced to bundled data.");
requireBundledText('data-blog-count="10"', "Bundled Android app must retain the blog count fallback for the mobile header.");
requireBundledText('"timelineEvents"', "Bundled Android app must include bundled timeline events in the offline snapshot.");
for (const promoKind of ["event", "on-this-date", "did-you-know", "learning", "question"]) {
  requireBundledText(`data-mobile-promo-kind="${promoKind}"`, `Bundled Android app must retain the ${promoKind} daily feature restore bubble.`);
}
requireBundledText("function availableMobilePromoKinds()", "Bundled Android app must resolve available daily feature bubbles from current content.");
requireBundledText("function showRandomMobileStartupSpotlight()", "Bundled Android app must choose no more than one expanded daily feature at startup.");
requireBundledText("const selected = candidates.filter(() => Math.random() < 0.28);", "Bundled Android daily features must retain independent randomized startup chances.");
requireBundledText("autoPrompt: false", "Bundled Android app must disable the legacy competing question timer.");
requireBundledText("showRestore: false", "Bundled Android app must use the unified question restore bubble.");
requireBundledText('"text-opacity": ["interpolate", ["linear"], ["zoom"], SITE_POINT_LABEL_MIN_ZOOM, 0, SITE_POINT_LABEL_MIN_ZOOM + 0.35, 1]', "Bundled Android point labels must fade in around the local-area zoom threshold.");
requireBundledPattern(/mapSourceRevision:\s*0[\s\S]*?mapSourceAppliedKey:\s*""[\s\S]*?function\s+invalidateMapSourceCache\(\)[\s\S]*?state\.mapSourceRevision\s*\+=\s*1;[\s\S]*?function\s+refreshMobileMapSources\(options\s*=\s*\{\}\)[\s\S]*?state\.mapSourceAppliedKey\s*===\s*sourceKey\)\s*return;[\s\S]*?state\.mapSourceAppliedKey\s*=\s*sourceKey;/, "Bundled Android map source refresh must skip repeated identical GeoJSON setData work.");
requireBundledPattern(/state\.map\.on\("zoomend",\s*\(\)\s*=>\s*\{[\s\S]*?syncMarkers\(\{\s*auxiliary:\s*false\s*\}\);[\s\S]*?syncMapStoryMarkers\(\);[\s\S]*?\}\);/, "Bundled Android zoom should refresh marker offsets once on zoomend without full auxiliary marker work.");
requireBundledPattern(/function\s+mapStoryMarkerOffset\(story\)[\s\S]*?zoom\s*>=\s*11\)\s*return\s*\[0,\s*-22\];[\s\S]*?return\s*\[0,\s*-28\];/, "Bundled Android attached stories must stay visually close to their listing at overview zoom.");
if (/state\.map\.on\("zoom",\s*syncMapStoryMarkers\)/.test(bundledApp) || /state\.map\.on\("zoom",\s*syncMapStoryMarkers\)/.test(bundledLiveApp)) {
  throw new Error("Bundled Android app must not resync story markers on every zoom frame.");
}
requireBundledText('mobilePanelTapBlockUntil: 0', "Bundled Android app must track the panel close tap shield.");
requireBundledText('function blockMobileMapTaps(durationMs = 240)', "Bundled Android app must block the delayed bridge without swallowing the visitor's next map tap.");
requireBundledText('function isAndroidUiOverlayTap(clientX, clientY)', "Bundled Android app must reject drawer/header/sheet taps before trying alternate map coordinates.");
requireBundledText('ANDROID_UI_TAP_OVERLAY_SELECTOR', "Bundled Android app must centralize UI overlay tap targets.");
requireBundledText('function blockAndroidUiOverlayMapTapStart(event)', "Bundled Android app must block map forwarding as soon as UI taps start.");
requireBundledText('window.onAndroidUiOverlayTapStart', "Bundled Android app must expose the UI overlay tap bridge to the native shell.");
requireBundledText('document.addEventListener("pointerdown", blockAndroidUiOverlayMapTapStart', "Bundled Android app must guard pointerdown UI taps from map click-through.");
requireBundledText('document.addEventListener("touchstart", blockAndroidUiOverlayMapTapStart', "Bundled Android app must guard touchstart UI taps from map click-through.");
requireBundledText('isMobileMapTapBlocked() && (!androidWebViewTap || followsAndroidOverlayTap)', "Bundled Android map bridge must reject delayed overlay taps without swallowing the next deliberate map tap.");
requireBundledText('return androidViewportTapCandidates(viewX, viewY, viewWidth, viewHeight).filter', "Bundled Android map bridge must use one canonical viewport-scaled tap coordinate.");
requireBundledText('function mobileMarkerTapRadius(androidWebViewTap = false)', "Bundled Android marker taps must scale with the visible marker size.");
requireBundledText('Math.round(Math.min(21, visualRadius + (androidWebViewTap ? 1 : 0)))', "Bundled Android marker hit targets must remain bounded.");
requireBundledText('function bestMobilePointHitFeature(features = [], event = null)', "Bundled Android taps must rank overlapping point markers by distance from the touch.");
requireBundledText('const renderedPointFeature = bestMobileRenderedPointHitFeature(event);', "Bundled Android taps must resolve the rendered site marker before polygon fallbacks.");
requireBundledText('if (mobileMapEventHandled(event)) return;', "Bundled Android polygon callbacks must not replace a site selected by the same touch.");
requireBundledText('function rememberMobileMapTap(tapKey, feature, now = performance.now())', "Bundled Android app must remember the feature opened by a physical tap.");
requireBundledText('androidWebViewTap && state.lastMobileMapTapAt > 0 && now - state.lastMobileMapTapAt < 650', "Bundled Android bridge must not replace a feature already opened by the same tap.");
requireBundledText('if (containedPolygon) return containedPolygon;', "Bundled Android polygon taps must prefer exact geometry containment.");
requireBundledText('if (state.map?.isEasing?.()) state.map.stop?.();', "Bundled Android map taps must interrupt camera easing before selecting a feature.");
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
requireBundledText('data-result-index="${card.index}" data-result-kind="${isWiki ? "wiki" : "site"}" data-result-slug="${escapeHtml(card.item.slug || "")}"', "Bundled Android app must render stable result target metadata on search cards.");
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
for (const [label, html] of [
  ["embedded fallback", bundledApp],
  ["live fallback", bundledLiveRuntime],
]) {
  for (const expected of [
    'id="mobile-layer-pins"',
    'id="mobile-layer-shapes"',
    'id="mobile-layer-exhibits"',
    'class="mobile-layer-category"',
    'value="shell-middens"',
    'value="fishing-sites"',
    'value="whaling-sites"',
    'value="burial-sacred"',
    'value="villages-settlements"',
    'value="trails-routes"',
    'value="waterways-coastal"',
    'value="approximate-locations"',
    'value="precise-locations"',
    'state.map.setStyle(style, { diff: false });',
    'state.mobileSiteIconImagesLoaded.clear();',
    'mobileMapLayerHandlers',
    'state.settings.showPins = visible;',
    'mobileLayerCategoryInputs.forEach(input => input.addEventListener("change"',
    '"circle-color": ["case", ["==", ["get", "has_header_image"], true], "#326fe3", "#496f5d"]'
  ]) {
    if (!html.includes(expected)) throw new Error(`Bundled Android ${label} is missing mobile map layer invariant ${expected}`);
  }
  if (html.includes('value="historical-markers-institutions"') || html.includes("Historical Markers / Institutions")) {
    throw new Error(`Bundled Android ${label} must not expose the removed Historical Markers / Institutions layer.`);
  }
  if (html.includes("`Layers ${primaryCount}/3`") || html.includes("Layers 2/3")) {
    throw new Error(`Bundled Android ${label} must count all mobile layer controls instead of the old 2/3 summary.`);
  }
  if (!html.includes("`Labels ${activeLayerCount}/${totalLayerCount}`") ||
      !html.includes("const totalLayerCount = primaryStates.length + mobileLayerCategoryInputs.length + mobileLayerEraInputs.length;")) {
    throw new Error(`Bundled Android ${label} must summarize all visible mobile layer controls.`);
  }
  if (html.includes("Math.min(288") ||
      !html.includes("calc(100dvw - max(8px, var(--app-left-safe)) - max(8px, var(--app-right-safe)))") ||
      !html.includes("function fitFixedMobilePanel(menu, panel, options = {})") ||
      !html.includes('const leftSafe = Math.max(pad, cssPixelValue("--app-left-safe", 0));') ||
      !html.includes('const rightSafe = Math.max(pad, cssPixelValue("--app-right-safe", 0));') ||
      !html.includes("const width = Math.max(0, viewportWidth - leftSafe - rightSafe);") ||
      !html.includes("const left = viewportLeft + leftSafe;") ||
      !html.includes("fitFixedMobilePanel(menu, grid,") ||
      !html.includes("fitFixedMobilePanel(menu, panel,") ||
      !html.includes('panel.style.setProperty("right", "auto", "important")')) {
    throw new Error(`Bundled Android ${label} must keep the mobile layer panel clamped inside the viewport.`);
  }
  if (/settings\.showPins\s*=\s*true|mobileLayerPinsInput\.disabled\s*=\s*true|mobilePinsToggleBtn\.disabled\s*=\s*true/.test(html)) {
    throw new Error(`Bundled Android ${label} must not force-enable or disable the Sites layer.`);
  }
}
requireBundledText('selected-site-map-label', "Bundled Android app must show a dedicated title label for the selected site marker.");
requireBundledPattern(/function shouldShowCustomMapIcons\(\)\s*\{\s*return true;\s*\}/, "Bundled Android app must keep site icons visible independently of point-label zoom.");
requireBundledText('function timelineLocationLabel(event = {})', "Bundled Android app must include historic moment location label rendering.");
requireBundledText('function rangeLabel(event = {}, options = {})', "Bundled Android app must include shared timeline date labels.");
requireBundledText('function locationLabel(event = {}, options = {})', "Bundled Android app must include shared timeline location labels.");
requireBundledText('TIMELINE_UTILS.rangeLabel(event)', "Bundled Android app must route timeline date labels through shared timeline utilities.");
requireBundledText('TIMELINE_UTILS.locationLabel(event, { cleanText: cleanPlainText })', "Bundled Android app must route timeline location labels through shared timeline utilities.");
requireBundledText('<p class="timeline-location"><strong>Location:</strong> ${escapeHtml(location)}</p>', "Bundled Android app must render historic moment locations when available.");
requireBundledText('window.NLI_FEEDBACK_UTILS', "Bundled Android app must include shared feedback utilities.");
requireBundledPattern(/detailBodyEl\.innerHTML\s*=\s*`[\s\S]*?\$\{siteTagsHtml\(site\)\}[\s\S]*?\$\{sections\}[\s\S]*?\$\{historyHtml\}[\s\S]*?\$\{whyThisMattersHtml\(site\)\}[\s\S]*?\$\{relatedSitesSection\(site\)\}/, "Bundled Android site articles must place Why This Matters before related sites near the end.");
requireBundledText('const feedbackPayload = FEEDBACK_UTILS.buildFeedbackCommentPayload', "Bundled Android app must save feedback through the shared Directus payload.");
requireBundledText('source_type: "feedback"', "Bundled Android app feedback must use the feedback source type.");
requireBundledText('if (hiddenEl) hiddenEl.style.visibility = "hidden"', "Bundled Android app must hide the feedback sheet before screenshot capture.");
requireBundledText('hiddenEl: feedbackSheetEl', "Bundled Android app must pass the feedback sheet to screenshot capture.");
requireBundledText('sendFeedbackReviewEmail', "Bundled Android app must notify review email after feedback saves.");
requireBundledText(
  "The screenshot could not be uploaded, so the feedback was not sent.",
  "Bundled Android feedback must preserve the submission when an attachment upload fails."
);
requireBundledText(
  'id="feedback-remove-screenshot"',
  "Bundled Android feedback must let the visitor remove a screenshot before retrying."
);
requireBundledText(
  "feedbackRemoveScreenshotBtn?.addEventListener",
  "Bundled Android feedback must wire the screenshot removal control."
);
forbidBundledText(
  "sending text feedback without it",
  "Bundled Android feedback must not silently discard a failed screenshot attachment."
);
requireBundledText('data-take-comment-photo', "Bundled Android app must expose comment camera capture controls.");
requireBundledText('prepareSelectedCommentPhoto(section)', "Bundled Android app must compress oversized comment photos before upload.");
requireBundledText('prepareJpegUploadImage(rawFile, "plant-observation")', "Bundled Android app must route selected comment photos through the shared JPEG preparation helper.");
requireBundledText('function compressImageFile(file, options = {})', "Bundled Android app must use the shared media image compression helper.");
requireBundledText('MEDIA_UTILS.prepareJpegUploadImage(file,', "Bundled Android app must route local image compression through shared media utilities.");
requireBundledText('function canvasToImageFile(canvas, options = {})', "Bundled Android app must include shared canvas screenshot file creation.");
requireBundledText('MEDIA_UTILS.canvasToImageFile(canvas,', "Bundled Android app must route feedback screenshots through shared media utilities.");
requireBundledText('MEDIA_UTILS.fileExtensionForType', "Bundled Android app must route feedback upload extensions through shared media utilities.");
requireBundledText('function readStorageJson(keys, fallback = null, storage = defaultStorage())', "Bundled Android app must include shared safe JSON storage reads.");
requireBundledText('function writeStorageJson(keys, value, storage = defaultStorage())', "Bundled Android app must include shared safe JSON storage writes.");
requireBundledText('function removeStorageKeys(keys, storage = defaultStorage())', "Bundled Android app must include shared storage clearing.");
requireBundledText('const storedSettings = SHARED_UTILS.readStorageJson("nli-mobile-settings", {})', "Bundled Android app must route mobile settings reads through shared storage utilities.");
requireBundledText('SHARED_UTILS.writeStorageJson("nli-mobile-settings", state.settings)', "Bundled Android app must route mobile settings writes through shared storage utilities.");
requireBundledText('SHARED_UTILS.readStorageJson(["nli-contributor-profile", "nli-contributor-session", "nli-mobile-profile"], null)', "Bundled Android app must route profile fallback reads through shared storage utilities.");
requireBundledText('SHARED_UTILS.writeStorageJson(["nli-contributor-profile", "nli-contributor-session", "nli-mobile-profile"], normalized)', "Bundled Android app must route mobile profile writes through shared storage utilities.");
requireBundledText('SHARED_UTILS.removeStorageKeys(["nli-contributor-profile", "nli-contributor-session", "nli-mobile-profile"])', "Bundled Android app must route mobile profile logout clearing through shared storage utilities.");
requireBundledText('function readSeen(storageKey, storage = defaultStorage())', "Bundled Android app must include shared safe activity seen reads.");
requireBundledText('function writeSeen(storageKey, items = [], options = {})', "Bundled Android app must include shared safe activity seen writes.");
requireBundledText('ACTIVITY_UTILS.readSeen(mobileNotificationLastSeenKey())', "Bundled Android app must route notification unread state through shared activity utilities.");
requireBundledText('ACTIVITY_UTILS.readSeen(mobileActivityLastSeenKey())', "Bundled Android app must route activity unread state through shared activity utilities.");
requireBundledText('function editedDateLabel(value, options = {})', "Bundled Android app must include shared edited-date labels.");
requireBundledText('ACTIVITY_UTILS.editedDateLabel(latestEditedDate(item), { fallback: DEFAULT_LAST_EDITED_LABEL })', "Bundled Android app must route edited-date labels through shared activity utilities.");
requireBundledText('function siteEditedDate(site = {}, options = {})', "Bundled Android app must include shared edited-date source selection.");
requireBundledText('ACTIVITY_UTILS.siteEditedDate(item, { extended: true })', "Bundled Android app must route mobile edited-date source selection through shared activity utilities.");
requireBundledText('function plantObservationFactRows(fields = {}, match = null, options = {})', "Bundled Android app must include shared plant fact rows.");
requireBundledText('PLANT_UTILS.plantObservationFactRows(fields, match,', "Bundled Android app must route mobile plant fact rows through shared plant utilities.");
requireBundledText('function mergeRecordsByIdOrKey(target = [], records = [], keyField = "vote_key")', "Bundled Android app must include shared comment vote record merging.");
requireBundledText('COMMENT_UTILS.mergeCommentVoteRecords(state.commentVotes, records)', "Bundled Android app must route comment vote merging through shared comment utilities.");
requireBundledText('function commentVoterKey(profile, canVote = true)', "Bundled Android app must include the shared comment voter gate.");
requireBundledText('canVote: isApprovedContributor()', "Bundled Android app must route mobile comment vote eligibility through shared comment utilities.");
requireBundledText('function viewerOwnsComment(comment, options = {})', "Bundled Android app must include shared comment ownership checks.");
requireBundledText('COMMENT_UTILS.viewerOwnsComment(comment, { profile, viewerEmail })', "Bundled Android app must route mobile comment ownership through shared comment utilities.");
requireBundledText('function votePayload(commentId, value, profile, options = {})', "Bundled Android app must include shared comment vote payload building.");
requireBundledText('COMMENT_UTILS.helpfulVotePointEvent({', "Bundled Android app must route helpful-vote point events through shared comment utilities.");
requireBundledText('const legacyExhibitsRequest = includeCommunity && state.profile?.token', "Bundled Android app must not request restricted legacy exhibits for anonymous public startup.");
requireBundledText('const siteSuggestionsRequest = includeCommunity && state.profile?.token', "Bundled Android app must not request restricted site suggestions for anonymous public startup.");
requireBundledText('const communityRequest = async (request, fallbackRows = [])', "Bundled Android app must defer community collections until their panels are opened.");
requireBundledText('function mergeProfilePointEvents(target = [], records = [])', "Bundled Android app must include shared point-event record merging.");
requireBundledText('function mergeLanguageAttemptRecords(target = [], records = [], options = {})', "Bundled Android app must include shared language attempt merging.");
requireBundledText('PROFILE_UTILS.mergeLanguageAttemptRecords(state.languageQuizAttempts, records, { relationId })', "Bundled Android app must route language attempt merging through shared profile utilities.");
requireBundledText('function mergeVisitRecords(target = [], records = [], options = {})', "Bundled Android app must include shared visit record merging.");
requireBundledText('PROFILE_UTILS.mergeVisitRecords(state.publicVisits, records, { relationId })', "Bundled Android app must route visit merging through shared profile utilities.");
requireBundledText('function memberUsagePayload(profile, options = {})', "Bundled Android app must include shared member usage payload helper.");
requireBundledText('PROFILE_UTILS.memberUsagePayload(profile,', "Bundled Android app must route member usage payloads through shared profile utilities.");
requireBundledText('function normalizeStoredContributorProfile(profile = {}, options = {})', "Bundled Android app must include shared stored profile normalization.");
requireBundledText('PROFILE_UTILS.normalizeStoredContributorProfile(saved, { mobileFields: true })', "Bundled Android app must route loaded mobile profiles through shared normalization.");
requireBundledText('PROFILE_UTILS.mergeProfilePointEvents(state.profilePointEvents, records)', "Bundled Android app must route point-event merging through shared profile utilities.");
requireBundledText('function profileTrackerRowsFromStats(stats = {})', "Bundled Android app must include shared profile tracker rows.");
requireBundledText('function profilePointBreakdownRows(stats = {}, options = {})', "Bundled Android app must include shared profile point breakdown rows.");
requireBundledText('PROFILE_UTILS.profilePointBreakdownRows(stats)', "Bundled Android app must route mobile profile point breakdown rows through shared profile utilities.");
requireBundledText('function rowsFallback(rows = [], options = {})', "Bundled Android app must include shared profile fallback rows.");
requireBundledText('function responseUsedFallback(response)', "Bundled Android app must include shared profile fallback response detection.");
requireBundledText('function allResponsesFresh(responses = [])', "Bundled Android app must include shared profile response freshness logic.");
requireBundledText('function withFallbackTimeout(promise, fallback, timeoutMs = 12000)', "Bundled Android app must include shared profile sync timeout logic.");
requireBundledText('const withProfileSyncTimeout = PROFILE_UTILS.withFallbackTimeout', "Bundled Android app must route profile sync timeouts through shared profile utilities.");
requireBundledText('const allResponsesFresh = PROFILE_UTILS.allResponsesFresh', "Bundled Android app must route profile sync freshness checks through shared profile utilities.");
requireBundledText('function activeProfileRowKey(row = {}, options = {})', "Bundled Android app must include stable active-profile row merge keys.");
requireBundledText('PROFILE_UTILS.preserveActiveProfileRows(nextRows, currentRows, currentContributorProfile() || state.profile', "Bundled Android app must route active-profile row preservation through shared profile utilities.");
requireBundledText('function activeProfileFilterSuffix(profile = {}, profileFields = ["member_profile"], options = {})', "Bundled Android app must include shared active-profile Directus filter logic.");
requireBundledText('PROFILE_UTILS.activeProfileFilterSuffix(currentContributorProfile() || state.profile', "Bundled Android app must route active-profile Directus filters through shared profile utilities.");
requireBundledText('function findProfilePointEventForKey(events = [], eventKey = "", profileId = null, options = {})', "Bundled Android app must include shared point-event key lookup.");
requireBundledText('PROFILE_UTILS.profilePointEventPayload(event, { relationId })', "Bundled Android app must route point-event payloads through shared profile utilities.");
requireBundledText('PROFILE_UTILS.profilePointEventsWithoutProfileIds(state.profilePointEvents, ids, { relationId })', "Bundled Android app must route canonical point-event replacement through shared profile utilities.");
requireBundledText('async function triggerFlow(flowId, payload = {}, requestOptions = {})', "Bundled Android app must include shared Directus flow triggering.");
requireBundledText('async function triggerReviewAction(action, payload = {}, requestOptions = {})', "Bundled Android app must include shared Directus review actions.");
requireBundledText('return directusClient.triggerReviewAction(action, payload, {', "Bundled Android app must route admin notification actions through shared Directus review actions.");
requireBundledText('window.NLI_SHARED_MAP_UTILS', "Bundled Android app must include shared map safety utilities.");
requireBundledText('function setGeoJsonSourceData(map, sourceId, data)', "Bundled Android app must include shared safe GeoJSON source updates.");
requireBundledText('MAP_UTILS.rebindLayerEvent(state.map, state.mobileMapLayerHandlers, type, layerId, handler)', "Bundled Android app must route mobile layer event rebinding through shared map utilities.");
requireBundledText('MAP_UTILS.queryRenderedFeaturesAround(state.map, point, targetLayers, radius', "Bundled Android app must use shared existing-layer filtering for mobile hit testing.");
requireBundledText('function layerFilterSetFromInputs(inputs = [], isActive = input => input?.checked !== false)', "Bundled Android app must include shared layer category filter set creation.");
requireBundledText('function passesLayerCategoryFilters(keys = [], active = new Set(), totalCount = 0)', "Bundled Android app must include shared layer category filter decisions.");
requireBundledText('SITE_UTILS.passesLayerCategoryFilters(keys, active, mobileLayerCategoryInputs.length)', "Bundled Android app must route mobile layer category filtering through shared site utilities.");
requireBundledText('function featureVisibleInPrimaryLayers(geometryType = "", options = {})', "Bundled Android app must include shared primary layer visibility decisions.");
requireBundledText('SITE_UTILS.featureVisibleInPrimaryLayers(geometryType,', "Bundled Android app must route mobile primary layer visibility through shared site utilities.");
requireBundledText('function milesBetweenPoints(a, b)', "Bundled Android app must include shared point-to-point distance calculation.");
requireBundledText('function distanceLabelMiles(miles)', "Bundled Android app must include shared distance label formatting.");
requireBundledText('function ringCenter(ring = [], options = {})', "Bundled Android app must include shared ring center helper.");
requireBundledText('function appendPolygonToGeometry(geometry, polygonCoordinates, options = {})', "Bundled Android app must include shared polygon append helper.");
requireBundledText('GEOMETRY_UTILS.appendPolygonToGeometry(geometry, polygonCoordinates)', "Bundled Android app must route mobile polygon append through shared geometry utilities.");
requireBundledText('return GEOMETRY_UTILS.milesBetweenPoints(a, b);', "Bundled Android app must route mobile distance math through shared geometry utilities.");
requireBundledText('Search sites, towns, histories', "Bundled Android app must include mobile search.");
requireBundledText('searchDataVersion: 0', "Bundled Android app must track search data rebuilds.");
requireBundledText('lastSearchDataVersion: -1', "Bundled Android app must remember the last processed search data version.");
requireBundledText('state.searchDataVersion += 1;', "Bundled Android app must mark rebuilt site data for search refresh.");
requireBundledText('value === state.lastSearchValue && state.lastSearchDataVersion === state.searchDataVersion', "Bundled Android app must not skip same-text searches after data changes.");
requireBundledPattern(/const\s+startupLandMask\s*=\s*isOfflineTextMode\(\)\s*\?\s*Promise\.resolve\(null\)\s*:\s*ensureLandMask\(\);[\s\S]*?await\s+loadData\(\);[\s\S]*?await\s+startupLandMask;[\s\S]*?prepareSites\(\);/, "Bundled Android app must skip the network land mask offline while retaining the normal startup order online.");
requireBundledText('enterkeyhint="search"', "Bundled Android app must request the Android keyboard search action.");
requireBundledText('autocomplete="off"', "Bundled Android app must keep the mobile search input from fighting app results.");
requireBundledText('function openMobileSearchResultsPage()', "Bundled Android app must include an explicit mobile search results page.");
requireBundledText('setMobileBottomPanelState("maximized")', "Bundled Android app must expand the nearby tray for submitted search results.");
requireBundledText('searchEl.addEventListener("keydown", handleMobileSearchKeydown);', "Bundled Android app must open search results on Enter.");
requireBundledText('searchEl.addEventListener("search", handleMobileSearchCommand);', "Bundled Android app must open search results from the Android search keyboard action.");
requireBundledText('window.__nliSubmitMobileSearch = handleMobileSearchCommand;', "Bundled Android app must expose a native keyboard Search submit bridge.");
requireBundledText('function mobileSearchResultTypeLabel(value)', "Bundled Android autocomplete must format map-entry types without an undefined global helper.");
requireBundledPattern(/function\s+schedulePlaceAutocomplete\(rawQuery\)[\s\S]*?query\.length\s*<\s*3[\s\S]*?loadPlaceAutocomplete\(query,\s*requestId\)/, "Bundled Android search must debounce external Long Island predictions.");
requireBundledPattern(/function\s+loadPlaceAutocomplete\(rawQuery,\s*requestId\)[\s\S]*?search\/searchbox\/v1\/suggest[\s\S]*?bbox=\$\{bbox\}[\s\S]*?state\.placeAutocompleteResults/, "Bundled Android search must fetch bounded business, address, and place predictions.");
requireBundledPattern(/const\s+localLimit\s*=\s*placeSuggestions\.length\s*\?\s*Math\.min\(3,\s*localSuggestions\.length\)\s*:\s*5[\s\S]*?data-place-suggestion/, "Bundled Android search must keep project results ahead of external map results.");
requireBundledPattern(/function\s+openPlaceAutocompleteSuggestion\(index\)[\s\S]*?retrieveSearchboxSuggestion\(suggestion,\s*tokenValue\)[\s\S]*?applyAddressSearchFeature\(feature\)[\s\S]*?setMobileBottomPanelState\("maximized"\)/, "Bundled Android search must map an exact external prediction with nearby project context.");
requireBundledPattern(/function\s+nearbyFeedCardModel\(item,\s*index,[^)]*\)[\s\S]*?isExternalMapResult\s*=\s*item\.slug\s*===\s*"address-result"[\s\S]*?comment:\s*!isExternalMapResult[\s\S]*?isExternalMapResult\s*\?\s*"Show"\s*:\s*"Open"/, "Bundled Android external results must show map context without project discussion controls.");
requireBundledText('grid-template-columns: minmax(0, 1fr) 54px auto;', "Bundled Android scrolled site header must keep a compact thumbnail beside the title.");
requireBundledPattern(/\.detail \.close\s*\{[\s\S]*?grid-column:\s*-2 \/ -1;[\s\S]*?text-transform:\s*lowercase;/, "Bundled Android site close x must stay lowercase at the far right.");
requireBundledPattern(/\.detail-hero-dock \.hero\.article-sticky-hero\.is-compact\s*\{[\s\S]*?height:\s*44px;/, "Bundled Android scrolled site thumbnail must remain small.");
requireBundledPattern(/function showFullDetailHero\(\)\s*\{[\s\S]*?detailBodyEl\.scrollTo\(\{ top: 0, behavior: "smooth" \}\);[\s\S]*?detailHeroDockEl\.addEventListener\("click", showFullDetailHero\);/, "Bundled Android compact thumbnail must restore the full image when tapped.");
requireBundledText('`${leadingTitleTerms[0]}${leadingTitleTerms[1]}` === compactQuery) score += 2600;', "Bundled Android autocomplete must prioritize punctuation-free possessive title matches such as Ma's House.");
forbidBundledText('formatLabel(item.site_type)', "Bundled Android autocomplete must not crash when a site enters the suggestions.");
requireBundledText('if (searchEl.value !== query) searchEl.value = query;', "Bundled Android search must commit the full native composition into the DOM before submitting.");
requireBundledPattern(/function\s+clearMobileSearchForResultOpen\(\)[\s\S]*?state\.androidImeSearchDraft\s*=\s*""/, "Bundled Android result open must clear its native search value with the visible field.");
requireBundledText('listTitleTextEl.textContent = showingSearch ? "Search results" : "Nearby sites";', "Bundled Android app must label the results view clearly.");
requireBundledPattern(/function\s+installNativeAndroidSearchWatch\(\)[\s\S]*?\/Android\/i\.test\(navigator\.userAgent\)[\s\S]*?setInterval\(\(\)\s*=>\s*\{[\s\S]*?refreshMobileSearchSuggestions\(\);[\s\S]*?scheduleSearchSync\(\);[\s\S]*?\},\s*180\)/, "Bundled Android app must poll and refresh autocomplete from native field changes.");
requireBundledText('function mobileAutocompleteCandidates(rawQuery)', "Bundled Android app must derive autocomplete candidates from the current field query.");
requireBundledText('normalizedSearchText: normalizeText', "Bundled Android app must include normalized mobile search text.");
requireBundledText('function scheduleSearchSync()', "Bundled Android app must watch mobile search value changes.");
requireBundledText('function closeDetailForSearchResults()', "Bundled Android app must close open detail sheets before search results take over.");
requireBundledPattern(/function\s+openMobileSearchResultsPage\(\)[\s\S]*?detailEl\?\.classList\.contains\("open"\)[\s\S]*?closeDetail\(\{\s*skipRoute:\s*true,\s*blockMapTap:\s*false\s*\}\)[\s\S]*?filterSites\(\)/, "Bundled Android search must close an open detail sheet only when results are submitted.");
requireBundledPattern(/function\s+closeDetail\(options\s*=\s*\{\}\)[\s\S]*?const\s+activeElement\s*=\s*document\.activeElement;[\s\S]*?detailEl\.contains\(activeElement\)[\s\S]*?activeElement\.blur\(\);[\s\S]*?detailEl\.classList\.remove\("open"\)/, "Bundled Android detail close must release focused panel controls before hiding the panel.");
requireBundledText('function clearMobileSearchForResultOpen()', "Bundled Android app must clear active search before opening a result detail panel.");
requireBundledText('searchEl.value = "";', "Bundled Android result opens must empty the search box so search polling does not close the article.");
requireBundledText('state.filtered = browsableSites();', "Bundled Android result opens must restore all saved content offline and normal visitable sites online after clearing search.");
requireBundledText('searchEl.addEventListener("keyup", handleMobileSearchInput);', "Bundled Android app must filter search after Android keyboard events.");
requireBundledPattern(/function\s+handleMobileSearchInput\(nativeDraft\s*=\s*null\)[\s\S]*?const\s+hasNativeDraft\s*=\s*typeof\s+nativeDraft\s*===\s*"string"[\s\S]*?state\.androidImeSearchDraft\s*=\s*!hasNativeDraft[\s\S]*?:\s*nativeDraft/, "Bundled Android search must not mistake DOM Event objects for native IME query strings.");
requireBundledPattern(/function\s+activeMobileSearchValue\(\)[\s\S]*?reconcileNativeSearchDraft\(nativeValue\)[\s\S]*?state\.androidImeSearchDraft\s*=\s*resolvedValue[\s\S]*?return\s+resolvedValue/, "Bundled Android search polling must promote a newer visible query over a stale native composition.");
requireBundledPattern(/function\s+handleMobileSearchInput\(nativeDraft\s*=\s*null\)[\s\S]*?state\.androidImeSearchDraft\s*=\s*!hasNativeDraft[\s\S]*?!domValue[\s\S]*?\?\s*""/, "Bundled Android search clear must also clear its native draft.");
requireBundledPattern(/function\s+reconcileNativeSearchDraft\(value\)[\s\S]*?domValue\.length\s*>\s*nativeValue\.length[\s\S]*?domKey\.startsWith\(nativeKey\)[\s\S]*?domKey\.endsWith\(nativeKey\)[\s\S]*?window\.__nliSetNativeSearchDraft\s*=\s*value\s*=>\s*handleMobileSearchInput\(reconcileNativeSearchDraft\(value\)\)/, "Bundled Android search must reconcile stale IME fragments with the full visible query.");
requireBundledText('searchEl.addEventListener("focus", handleMobileSearchFocus);', "Bundled Android app must poll focused search values for WebView text changes.");
requireBundledText('function installNativeAndroidSearchWatch()', "Bundled Android app must keep polling native Android search values.");
requireBundledPattern(/state\.lastSearchValue\s*=\s*"";[\s\S]*?scheduleSearchSync\(\);[\s\S]*?state\.nativeAndroidSearchWatchTimer\s*=\s*window\.setInterval/, "Bundled Android app must process search text typed before native polling starts.");
requireBundledText('refreshMobileSearchSuggestions();', "Bundled Android app must persistently refresh native Android autocomplete.");
requireBundledText('Profile activity sync will retry later.', "Bundled Android app must keep profile activity sync retry logging.");
requireBundledText('state.profileActivitySynced = false;\n          return false;', "Bundled Android app must leave failed profile sync retryable.");
requireBundledPattern(/state\.profileActivitySynced\s*=\s*includeCommunity\s*&&\s*allResponsesFresh\(\[/, "Bundled Android public activity must mark a completed anonymous load as synced.");
if (/profileActivitySynced\s*=\s*includeCommunity\s*&&\s*Boolean\(state\.profile\s*&&\s*allResponsesFresh\(/.test(bundledApp) || /profileActivitySynced\s*=\s*includeCommunity\s*&&\s*Boolean\(state\.profile\s*&&\s*allResponsesFresh\(/.test(bundledLiveApp)) {
  throw new Error("Bundled Android app must not schedule a second public activity sync just because the visitor is logged out.");
}
requireBundledText('sorted by proximity', "Bundled Android app must label nearby results as proximity sorted.");
requireBundledText('const STARTUP_LOCATION_ZOOM = NEAR_ME_ZOOM;', "Bundled Android app must open with the Near me zoom level.");
requireBundledText('if (nativeAndroid && !isOfflineTextMode()) await requestStartupLocation();', "Bundled Android app must request location before the first nearby list render while online and skip the prompt in offline text mode.");
requireBundledText('refreshAndroidMapAfterSettle("android-startup-near-me")', "Bundled Android app must recenter the initialized map on startup location.");
requireBundledText('mobile-startup-spotlight', "Bundled Android app must include the shared daily feature card.");
requireBundledText('showRandomMobileStartupSpotlight()', "Bundled Android app must resolve the randomized daily feature after startup.");
requireBundledText('scheduleMobilePromoStartup();', "Bundled Android app must schedule the daily feature after the map is interactive.");
requireBundledText('fitLongIslandMapView("android-startup-outside-long-island")', "Bundled Android app must use the Long Island overview when startup location is outside the project area.");
requireBundledText('const SITE_CHECKIN_RADIUS_MILES = 0.05;', "Bundled Android app must require check-ins within about 260 feet.");
requireBundledText('const SITE_VISIT_ALERT_RADIUS_MILES = 0.5;', "Bundled Android app must alert within half a mile of a site.");
requireBundledText('window.AndroidApp.showNotification', "Bundled Android app must use the native notification bridge.");
requireBundledText('localStorage.getItem("nli-proximity-alert-date") === todayKey', "Bundled Android app must limit nearby site notifications to once per day.");
requireBundledText('const NEARBY_LIST_ANDROID_INITIAL_LIMIT = 8;', "Bundled Android app must keep the first nearby tray render small.");
requireBundledText('const NEARBY_LIST_ANDROID_DEFAULT_LIMIT = 12;', "Bundled Android app must keep the normal nearby tray render bounded.");
requireBundledText('data-nearby-show-more', "Bundled Android app must let users reveal more nearby places after the startup cap.");
requireBundledText('const nativeAndroid = isNativeAndroidApp();', "Bundled Android app must cache native Android startup state.");
requireBundledText('function waitForMapbox(timeout = 12000)', "Bundled Android app must give Mapbox enough time to load inside WebView before falling back.");
requireBundledText('if (nativeAndroid) {\n          await new Promise(resolve => window.requestAnimationFrame(resolve));\n        }\n        await openInitialRouteFromUrl();', "Bundled Android app must keep the loading screen up during native startup instead of revealing a half-built shell.");
requireBundledText('hideLoadingScreen();', "Bundled Android app must hide loading after map startup.");
requireBundledText('if (!window.NLI_DISABLE_DIRECTUS_RUNTIME) refreshMapStories();', "Bundled Android app must refresh visitor stories as soon as the map is ready.");
forbidBundledText('if (!window.NLI_DISABLE_DIRECTUS_RUNTIME) idleTask(refreshMapStories);', "Bundled Android app must not defer visitor stories until idle time.");
requireBundledText('window.setTimeout(() => idleTask(refreshMobileSiteIconFieldsFromDirectus), 30000);', "Bundled Android app must keep the broad icon refresh outside the interaction window.");
requireBundledText('if (!window.NLI_DISABLE_DIRECTUS_RUNTIME) {\n          idleTask(() => (state.profile ? ensureProfileStatsSynced() : Promise.resolve(false))', "Bundled Android app must skip Directus-backed profile refresh work in snapshot mode.");
requireBundledText('function stabilizeAndroidMapPaint()', "Bundled Android app must include the Android map paint stabilizer.");
requireBundledText('state.map.resize();', "Bundled Android app must resize the map after Android WebView startup.");
requireBundledText('refreshMobileMapSources();', "Bundled Android app must refresh map sources after Android WebView startup.");
requireBundledText('function bindAndroidMapGestureGuards()', "Bundled Android app must pause expensive map refreshes while the user is dragging or pinching.");
requireBundledText('state.map.on("dragstart", markAndroidMapGestureActive);', "Bundled Android app must detect the start of finger map drags.");
requireBundledText('if (isAndroidMapGestureActive()) {\n          state.pendingAndroidMapRefresh = true;\n          return;\n        }', "Bundled Android app must defer settle refreshes during active map gestures.");
requireBundledText('androidMapRefreshTimers: new Set()', "Bundled Android app must keep one cancellable map refresh chain.");
requireBundledText('[280, 1100, 2600].forEach(delay => {', "Bundled Android paint stabilization must use a short bounded retry sequence.");
requireBundledText('refreshAndroidMapAfterSettle("android-map-stabilize")', "Bundled Android paint stabilization must use the coalesced settle refresh.");
if (/function\s+stabilizeAndroidMapPaint\(\)[\s\S]*?\.zoomTo\(|function\s+stabilizeAndroidMapPaint\(\)[\s\S]*?\.jumpTo\(/.test(bundledApp) ||
    /function\s+stabilizeAndroidMapPaint\(\)[\s\S]*?\.zoomTo\(|function\s+stabilizeAndroidMapPaint\(\)[\s\S]*?\.jumpTo\(/.test(bundledLiveApp)) {
  throw new Error("Bundled Android map paint stabilizer must not change zoom or center without user input.");
}
requireBundledText('const stable = Boolean(state.map.loaded?.() && (!state.map.areTilesLoaded || state.map.areTilesLoaded()))', "Bundled Android app must stop repaint retries once the map and tiles are stable.");
requireBundledText('stabilizeAndroidMapPaint();', "Bundled Android app must trigger map paint stabilization after layers and markers are attached.");
requireBundledText('mobileProfileStats', "Bundled Android app must render Directus-backed profile stats.");
requireBundledText('ensureProfileActivitySynced', "Bundled Android app must sync profile activity from Directus.");
requireBundledText('async function ensureProfileStatsSynced()', "Bundled Android app must sync profile activity and canonical point events before rendering account stats.");
requireBundledText('ensureCanonicalProfilePointEvents(currentContributorProfile())', "Bundled Android app must read canonical point events for the active profile.");
requireText("NLI_DIRECTUS_PAUSED_MESSAGE", "Android snapshot APK must expose a clear Directus pause message.");
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
requireBundledText('mobileBiographyPathMapPinLabel(place, order)', "Bundled Android biography travel map pins must use numbered map labels.");
requireBundledText('id: "mobile-biography-place-labels"', "Bundled Android biography travel map pins must use collision-aware map labels.");
requireBundledText('event && (event.title || event.description || event.date_label || event.sort_key)', "Bundled Android timeline must retain public source records without a site/wiki link.");
forbidBundledText('event.source_type && (event.source_slug || event.source_id))', "Bundled Android timeline must not hide unlinked public source records.");
requireBundledPattern(/function\s+approvedSiteCommentPhotoSlides\(site,\s*listingImage\s*=\s*""\)[\s\S]*?commentsForSource\("site",\s*site\)[\s\S]*?normalizeCommentStatus\(comment\)\s*===\s*"approved"[\s\S]*?comment\.comment_image/, "Bundled Android site carousels must use only approved comment photos from the current site.");
requireBundledText('data-site-hero-comment="${escapeHtml(slide.id)}"', "Bundled Android comment-photo slides must link to their source comment.");
requireBundledPattern(/function\s+startSiteHeroCarousel\([\s\S]*?siteHeroCarouselKey[\s\S]*?if\s*\(state\.siteHeroCarouselTimer\)\s*return[\s\S]*?window\.setInterval\([\s\S]*?document\.hidden\s*\|\|\s*currentRoot\.classList\.contains\("is-compact"\)[\s\S]*?setSiteHeroCarouselIndex\(currentRoot,\s*current\s*\+\s*1\)[\s\S]*?8000\)/, "Bundled Android site photo carousels must reliably rotate every eight seconds across async article rerenders unless hidden or compact.");
requireBundledPattern(/function\s+bindSiteHeroCarouselSwipe\(root\)[\s\S]*?touchstart[\s\S]*?touchend[\s\S]*?Math\.abs\(deltaX\)\s*<\s*42[\s\S]*?deltaX\s*<\s*0\s*\?\s*1\s*:\s*-1[\s\S]*?startSiteHeroCarousel\(root,\s*\{\s*restart:\s*true\s*\}\)/, "Bundled Android site photo carousels must support left and right touch swipes and restart their timer after manual input.");
requireBundledPattern(/\.site-hero-carousel\.hero\s*\{[\s\S]*?touch-action:\s*pan-y;[\s\S]*?overscroll-behavior-x:\s*contain;/, "Bundled Android carousels must reserve horizontal swipes while preserving vertical article scrolling.");
requireBundledText('jumpToQuoteComment(heroCommentSlide.dataset.siteHeroComment);', "Bundled Android comment-photo slides must jump to the exact approved comment.");

console.log(`Android shell verifier passed: ${expectedBuild}`);

