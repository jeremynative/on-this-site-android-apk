const fs = require("fs");

const expectedBuild = "20260831-biography-introductions-r205";
const expectedUrl = "https://directus.nativelongisland.com/app/mobile-app-live.html";
const mainActivityPath = "app/src/main/java/com/nativelongisland/onthissite/MainActivity.java";
const releaseWorkflowPath = ".github/workflows/build-release-apk.yml";
const gradleBuildPath = "app/build.gradle";
const bundledAppPath = "app/src/main/assets/mobile-app.html";
const bundledLiveAppPath = "app/src/main/assets/mobile-app-live.html";
const lightweightOfflineAppPath = "app/src/main/assets/offline-app.html";
const offlineArchiveUtilsPath = "app/src/main/assets/assets/js/offline-archive-utils.js";
const bundledMobileJsPath = "app/src/main/assets/assets/js/mobile-app.js";
const bundledSharedDirectusClientPath = "app/src/main/assets/assets/js/shared-directus-client.js";
const bundledSharedProfileUtilsPath = "app/src/main/assets/assets/js/shared-profile-utils.js";
const bundledSharedSearchUtilsPath = "app/src/main/assets/assets/js/shared-search-utils.js";
const bundledSharedLifecycleUtilsPath = "app/src/main/assets/assets/js/shared-lifecycle-utils.js";
const bundledSharedMapUtilsPath = "app/src/main/assets/assets/js/shared-map-utils.js";
const bundledSharedActivityUtilsPath = "app/src/main/assets/assets/js/shared-activity-utils.js";
const bundledSharedMapStoryUtilsPath = "app/src/main/assets/assets/js/shared-map-story-utils.js";
const bundledSharedPlantUtilsPath = "app/src/main/assets/assets/js/shared-plant-utils.js";
const bundledMobileCssPath = "app/src/main/assets/assets/css/mobile-app.css";
const mapLibreJsPath = "app/src/main/assets/assets/vendor/maplibre-gl/maplibre-gl.js";
const mapLibreCssPath = "app/src/main/assets/assets/vendor/maplibre-gl/maplibre-gl.css";
const mapLibreLicensePath = "app/src/main/assets/assets/vendor/maplibre-gl/LICENSE.txt";
const bundledLearningCardUtilsPath = "app/src/main/assets/assets/js/shared-learning-card-utils.js";
const bundledResearchQuestionCssPath = "app/src/main/assets/assets/css/shared-research-question.css";
const bundledSharedSiteUtilsPath = "app/src/main/assets/assets/js/shared-site-utils.js";
const stylesPath = "app/src/main/res/values/styles.xml";
const launchBackgroundPath = "app/src/main/res/drawable/launch_background.xml";
const launcherBackgroundPath = "app/src/main/res/drawable/ic_launcher_background.xml";
const launcherForegroundPath = "app/src/main/res/drawable/ic_launcher_foreground.xml";
const launcherMonochromePath = "app/src/main/res/drawable/ic_launcher_monochrome.xml";
const legacyLauncherPath = "app/src/main/res/mipmap-anydpi/ic_launcher.xml";
const legacyRoundLauncherPath = "app/src/main/res/mipmap-anydpi/ic_launcher_round.xml";
const android12StylesPath = "app/src/main/res/values-v31/styles.xml";
const manifestPath = "app/src/main/AndroidManifest.xml";
const appBridgePath = "app/src/main/java/com/nativelongisland/onthissite/AppBridge.java";
const nativeMapControllerPath = "app/src/main/java/com/nativelongisland/onthissite/NativeMapController.java";
const nativeSiteIconManifestPath = "app/src/main/assets/map/site-icon-keys.json";
const nativeTerritoryFallbackPath = "app/src/main/assets/map/ancestral-territory-fallback.json";
const amethystShipIconPath = "app/src/main/assets/assets/map-icons/amethyst-moving-bark.png";
const storyBridgePath = "app/src/main/java/com/nativelongisland/onthissite/StoryBridge.java";
const captureFileProviderPath = "app/src/main/java/com/nativelongisland/onthissite/CaptureFileProvider.java";
const nativeCommentPhotoCompatPath = "app/src/main/assets/native-comment-photo-compat.js";
const offlineInsetAuditPath = "audit-apk-offline-insets.mjs";
const offlineParityAuditPath = "audit-apk-offline-parity.mjs";
const bundledMobileIndexPaths = [
  "app/src/main/assets/assets/data/mobile-site-centers.json",
  "app/src/main/assets/assets/data/mobile-site-geometry.json",
  "app/src/main/assets/assets/data/mobile-site-index.json",
  "app/src/main/assets/assets/data/mobile-timeline-index.json",
  "app/src/main/assets/assets/data/mobile-wiki-index.json"
];

const bundledAppBytes = fs.readFileSync(bundledAppPath);
const bundledLiveAppBytes = fs.readFileSync(bundledLiveAppPath);
const lightweightOfflineApp = fs.readFileSync(lightweightOfflineAppPath, "utf8");
const offlineArchiveUtils = fs.readFileSync(offlineArchiveUtilsPath, "utf8");
const source = fs.readFileSync(mainActivityPath, "utf8").replace(/\r\n/g, "\n");
const releaseWorkflow = fs.readFileSync(releaseWorkflowPath, "utf8");
const gradleBuild = fs.readFileSync(gradleBuildPath, "utf8");
const manifest = fs.readFileSync(manifestPath, "utf8");
const appBridge = fs.readFileSync(appBridgePath, "utf8");
const nativeMapController = fs.readFileSync(nativeMapControllerPath, "utf8").replace(/\r\n/g, "\n");
const nativeSiteIconManifest = JSON.parse(fs.readFileSync(nativeSiteIconManifestPath, "utf8"));
const nativeTerritoryFallback = JSON.parse(fs.readFileSync(nativeTerritoryFallbackPath, "utf8"));
const storyBridge = fs.readFileSync(storyBridgePath, "utf8");
const captureFileProvider = fs.readFileSync(captureFileProviderPath, "utf8");
const nativeCommentPhotoCompat = fs.readFileSync(nativeCommentPhotoCompatPath, "utf8");
const offlineInsetAudit = fs.readFileSync(offlineInsetAuditPath, "utf8");
const offlineParityAudit = fs.readFileSync(offlineParityAuditPath, "utf8");
const bundledApp = bundledAppBytes.toString("utf8");
const bundledLiveApp = bundledLiveAppBytes.toString("utf8");
const bundledMobileJs = fs.readFileSync(bundledMobileJsPath, "utf8").replace(/\r\n/g, "\n");
const bundledSharedProfileUtils = fs.readFileSync(bundledSharedProfileUtilsPath, "utf8");
const bundledSharedSearchUtils = fs.readFileSync(bundledSharedSearchUtilsPath, "utf8");
const bundledSharedLifecycleUtils = fs.readFileSync(bundledSharedLifecycleUtilsPath, "utf8");
const bundledSharedMapUtils = fs.readFileSync(bundledSharedMapUtilsPath, "utf8");
const bundledSharedActivityUtils = fs.readFileSync(bundledSharedActivityUtilsPath, "utf8");
const bundledSharedMapStoryUtils = fs.readFileSync(bundledSharedMapStoryUtilsPath, "utf8");
const bundledSharedPlantUtils = fs.readFileSync(bundledSharedPlantUtilsPath, "utf8");
const bundledMobileCss = fs.readFileSync(bundledMobileCssPath, "utf8").replace(/\r\n/g, "\n");
const launcherBackground = fs.readFileSync(launcherBackgroundPath, "utf8");
const launcherForeground = fs.readFileSync(launcherForegroundPath, "utf8");
const launcherMonochrome = fs.readFileSync(launcherMonochromePath, "utf8");
const legacyLauncher = fs.readFileSync(legacyLauncherPath, "utf8");
const legacyRoundLauncher = fs.readFileSync(legacyRoundLauncherPath, "utf8");
const mapLibreJs = fs.readFileSync(mapLibreJsPath, "utf8");
const mapLibreCss = fs.readFileSync(mapLibreCssPath, "utf8");
const mapLibreLicense = fs.readFileSync(mapLibreLicensePath, "utf8");
const bundledLiveRuntime = `${bundledLiveApp}\n${bundledMobileJs}\n${bundledMobileCss}`;

if (!bundledMobileJs.includes('{ label: "Unkechaug homeland", place: "Poospatuck Reservation", coordinates: [-72.83454, 40.78913]')
    || !bundledMobileJs.includes('"chief-harry-wallace-of-the-unkechaug"')
    || !bundledMobileJs.includes('"ninigret-eastern-niantic-sachem"')
    || !bundledMobileJs.includes('"samson-occom"')
    || !bundledMobileJs.includes('"cockenoe"')
    || !bundledMobileJs.includes("function mobileBiographyUniqueRoute(route = [])")
    || !bundledMobileJs.includes("function mobileBiographyDisplayOffsets(items = [])")
    || !bundledMobileJs.includes("function mobileBiographyDisplayCoordinates(coordinates, offset = [0, 0])")
    || !bundledMobileJs.includes("mobileBiographyDisplayCoordinates(motion.coordinates, item.displayOffset)")) {
  throw new Error("Bundled Android runtime must map Indigenous biographies to their homelands and space shared-location icons.");
}

if (!bundledMobileJs.includes("function bindPlantCameraZoom(overlay, video, track)")
    || !bundledMobileJs.includes("applyConstraints({ advanced: [{ zoom: value }] })")
    || !bundledMobileJs.includes("capturePlantVideoFrame(video, zoomState?.optical ? 1 : zoomState?.value || 1)")
    || !bundledMobileJs.includes("section._plantPhotoTakenAt = await plantPhotoTakenAt(file)")
    || !bundledMobileJs.includes("public_submitted_at: capturedAt")
    || !bundledMobileCss.includes(".plant-camera-zoom-indicator")
    || !bundledMobileJs.includes("Pinch the live image to zoom")
    || bundledMobileJs.includes('data-plant-camera-zoom type="range"')
    || !bundledMobileCss.includes("padding-bottom: max(80px, calc(var(--app-bottom-safe) + 28px));")
    || !bundledSharedPlantUtils.includes("function plantObservationSeasonGroups(observations = [])")) {
  throw new Error("Android plant camera must support optical or centered digital zoom and group submitted photos by capture season.");
}

if (!source.includes("effectiveMapBottom=pr&&pr.top>r.bottom")
    || !source.includes("effectiveMapHeight=Math.max(r.height,effectiveMapBottom-r.top)")) {
  throw new Error("Native map viewport must extend to an open content panel instead of leaving a blank gap.");
}

if (!bundledLiveApp.includes('id="maplibre-gl-script" src="assets/vendor/maplibre-gl/maplibre-gl.js')) {
  throw new Error("Android live fallback must load the packaged self-hosted MapLibre renderer.");
}
if (!bundledApp.includes('data-inline-source="assets/vendor/maplibre-gl/maplibre-gl.js"')) {
  throw new Error("Android offline snapshot must inline MapLibre instead of depending on a renderer CDN.");
}
if (/api\.mapbox\.com\/mapbox-gl-js|id="mapbox-gl-script"/.test(`${bundledApp}\n${bundledLiveApp}`)) {
  throw new Error("Android shells must not load the branded Mapbox GL renderer.");
}
if (!bundledMobileJs.includes("function mobileMapRuntime()")
    || !bundledMobileJs.includes("window.mapboxgl = window.maplibregl")
    || !bundledMobileJs.includes("maplibreLogo: false")
    || !bundledMobileJs.includes("new mapboxgl.AttributionControl({ compact: true })")
    || !bundledMobileJs.includes("function collapseMobileMapAttribution()")
    || !bundledMobileJs.includes('control.classList.remove("maplibregl-compact-show")')
    || !/state\.map\.once\?\.\("idle", \(\) => \{\r?\n\s+collapseMobileMapAttribution\(\);/.test(bundledMobileJs)
    || !bundledMobileJs.includes("https://www.openstreetmap.org/copyright")) {
  throw new Error("Android map runtime must use MapLibre without an engine logo while retaining compact legal data attribution.");
}
if (!bundledSharedMapUtils.includes("function basemapWaterBoundaryLayerId(map)")
    || !bundledSharedMapUtils.includes("function addLandLayerBeneathBasemapWater(map, layer)")
    || !bundledMobileJs.includes('geometry_surface: normalizeComparisonText(site.geometry_surface || "")')
    || !bundledMobileJs.includes('geometry_surface: normalizeComparisonText(feature.properties?.place_name_surface || site?.geometry_surface || "review")')
    || !bundledMobileJs.includes('id: "mobile-site-land-polygons"')
    || !bundledMobileJs.includes('id: "mobile-site-land-lines"')
    || !bundledMobileJs.includes('id: "mobile-place-name-area-land-fill"')
    || !bundledMobileJs.includes('id: "mobile-place-name-area-land-line"')
    || !bundledMobileJs.includes('MAP_UTILS.addLandLayerBeneathBasemapWater(state.map, layer)')
    || !bundledMobileJs.includes('["==", ["get", "geometry_surface"], "land"]')
    || !bundledMobileJs.includes('["!=", ["get", "geometry_surface"], "land"]')
    || !bundledApp.includes('id: "mobile-site-land-polygons"')
    || !bundledApp.includes('id: "mobile-place-name-area-land-fill"')
    || !bundledApp.includes("function addLandLayerBeneathBasemapWater(map, layer)")) {
  throw new Error("Android WebView and offline fallbacks must route site and reviewed place-name land polygons beneath vector water while preserving non-land overlays.");
}
if (!mapLibreJs.includes("MapLibre GL JS")
    || !mapLibreCss.includes(".maplibregl-map")
    || !mapLibreLicense.includes("MapLibre contributors")) {
  throw new Error("Android assets must package the MapLibre renderer, stylesheet, and license notice.");
}
if (!bundledMobileCss.includes("background: rgba(255, 255, 255, 0.58);")
    || !bundledMobileCss.includes(".app:not(.panel-maximized) .nearby-feed-card.has-thumbnail")
    || !bundledMobileCss.includes("grid-template-columns: minmax(0, 1fr) 52px;")
    || !bundledMobileJs.includes('element.className = "user-location-dot address-location-dot";')
    || !bundledMobileJs.includes('card.imageUrl ? " has-thumbnail" : ""')) {
  throw new Error("Android mobile UI must use a soft user-location target and compact nearby-result thumbnails outside Full view.");
}
if (!/\.detail-hero-dock\s*\{[^}]*overflow:\s*hidden;[^}]*contain:\s*paint;/s.test(bundledMobileCss)
    || !bundledMobileJs.includes('hero.style.transition = "opacity 180ms ease";')
    || !bundledMobileJs.includes('hero.style.opacity = "0";')
    || bundledMobileJs.includes("scale(${sx}, ${sy})")) {
  throw new Error("Android listing headers must fade inside the clipped compact frame instead of scaling outside the panel.");
}
if (!nativeMapController.includes("logoEnabled(false)")
    || !nativeMapController.includes("attributionEnabled(false)")
    || !nativeMapController.includes("long-island-offline-20260817-z10.pmtiles")
    || !nativeMapController.includes("https://directus.nativelongisland.com/app/map/long-island-z14.pmtiles")
    || !nativeMapController.includes('"nli-territories"')
    || !nativeMapController.includes('"nli-biography-paths"')
    || !nativeMapController.includes('"nli-events"')
    || !nativeMapController.includes('"nli-profile-points"')
    || !nativeMapController.includes('"nli-user-location"')
    || !nativeMapController.includes('"nli-community-contributions"')
    || !nativeMapController.includes('"nli-temporary-markers"')
    || !nativeMapController.includes('"nli-moving-features"')
    || !nativeMapController.includes('new SymbolLayer("nli-moving-biography-canoes", MOVING_FEATURE_SOURCE_ID)')
    || !nativeMapController.includes('iconImage("nli-icon-biography-canoe")')
    || !nativeMapController.includes('Expression.eq(Expression.get("on_water"), Expression.literal(true))')
    || !nativeMapController.includes('style.addImage("nli-icon-biography-canoe", canoe)')
    || !nativeMapController.includes('"nli-moving-biography-icons"')
    || !nativeMapController.includes('"nli-moving-dog-icons"')
    || !nativeMapController.includes('"nli-moving-whale-icons"')
    || !nativeMapController.includes('new SymbolLayer("nli-moving-ship-icons", MOVING_FEATURE_SOURCE_ID)')
    || !nativeMapController.includes('Expression.literal("ship")')
    || !nativeMapController.includes('iconSize(0.34f)')
    || !nativeMapController.includes('"nli-story-markers"')
    || !nativeMapController.includes('"nli-plant-markers"')
    || !nativeMapController.includes('"nli-approved-suggestion-markers"')
    || !nativeMapController.includes('"nli-search-result-marker"')
    || !nativeMapController.includes('"nli-satellite-layer"')
    || !nativeMapController.includes("Tiles © Esri")
    || !nativeMapController.includes("applyBasemapVisibility(style)")
    || !nativeMapController.includes('return !profileMode && "satellite".equals(currentBasemap);')
    || !nativeMapController.includes("refreshMapCreditForVisibleBasemap();")
    || !nativeMapController.includes("params.gravity = Gravity.BOTTOM | Gravity.END")
    || !nativeMapController.includes("viewportBottomOcclusion + dp(expanded ? 92 : 4)")
    || !nativeMapController.includes("rootY <= viewportInteractiveBottom")
    || !nativeMapController.includes('"nli-site-unread-badges"')
    || !nativeMapController.includes('"nli-site-unread-counts"')
    || !nativeMapController.includes('"nli-site-point-icons"')
    || !nativeMapController.includes("addBundledMapIcons(style)")
    || nativeMapController.includes('readAsset("assets/data/mobile-site-index.json")')
    || !nativeMapController.includes('readAsset("map/site-icon-keys.json")')
    || !nativeMapController.includes('iconManifest.optJSONObject("native_icon_key_by_site_slug")')
    || !nativeMapController.includes('properties.put("native_icon_key", nativeIconKey)')
    || !nativeMapController.includes("applyBundledSiteIconKeys(payload.optJSONObject(\"sitePoints\"))")
    || !nativeMapController.includes("bundledSiteIconKeysBySlug.put(slug, nativeIconKey)")
    || nativeMapController.includes("setOverrideSynchronousUpdate(true)")
    || !nativeMapController.includes('featureCountWithStringProperty(sitePoints, "native_icon_key")')
    || !nativeMapController.includes('circleRadius(15f), circleColor("#ffffff"), circleOpacity(0.5f)')
    || !nativeMapController.includes('circleRadius(4f), circleColor("#2f80ed"), circleOpacity(1f)')
    || !nativeMapController.includes("circleStrokeWidth(0f)")
    || !nativeMapController.includes('new SymbolLayer("nli-territory-labels", LABEL_SOURCE_ID)')
    || !nativeMapController.includes("territoryLabelLayer.setMinZoom(6.2f)")
    || !nativeMapController.includes('map.queryRenderedFeatures(screenPoint, "nli-territory-labels")')
    || !nativeMapController.includes("Feature exactPoint = nearestActionablePointFeature(exactPoints, screenPoint, false)")
    || !nativeMapController.includes("dispatchActionablePointFeature(exactPoint, false)")
    || !nativeMapController.includes("List<Feature> territorySurfaces = map.queryRenderedFeatures(")
    || !nativeMapController.includes("TERRITORY_FILL_LAYER_ID,\n                TERRITORY_LINE_LAYER_ID")
    || !nativeMapController.includes("density * 32f")
    || !nativeMapController.includes("Expression.stop(6, 0.72f)")
    || !nativeMapController.includes("Expression.stop(14, 1.08f)")
    || !nativeMapController.includes("nearestActionablePointFeature(features, screenPoint, profileMode)")
    || !nativeMapController.includes("distance < nearestDistance - 0.25")
    || !nativeMapController.includes('COMPACT_MAP_CREDIT = "ⓘ OSM"')
    || !nativeMapController.includes("© OpenStreetMap contributors")) {
  throw new Error("Native MapLibre must use self-hosted/bundled PMTiles, hide engine branding, retain legal credit, and render the required project overlays.");
}
if (!nativeMapController.includes('new SymbolLayer("nli-moving-feature-labels", MOVING_FEATURE_SOURCE_ID)')
    || !nativeMapController.includes('textFont(new String[] { "Noto Sans Regular" }), textSize(10f)')
    || nativeMapController.includes('textFont(new String[] { "Noto Sans Bold" }), textSize(10f)')) {
  throw new Error("Native biography titles must use the bundled regular font so close-zoom labels render on Android.");
}
if (!fs.existsSync(amethystShipIconPath) || fs.statSync(amethystShipIconPath).size < 10000) {
  throw new Error("Android must bundle the reviewed generic Amethyst-era bark icon.");
}
if (!bundledMobileJs.includes('moving_kind: "ship"')
    || !bundledMobileJs.includes('icon_key: "nli-icon-amethyst-moving-bark"')
    || !bundledMobileJs.includes("MOBILE_AMETHYST_SHIP_ONE_WAY_MS")
    || !bundledMobileCss.includes("mobile-moving-amethyst-ship-marker")) {
  throw new Error("Android web/native bridge must carry the one-way Amethyst global-whaling route and its fading ship marker.");
}
const expandedMapHitQuery = nativeMapController.match(/List<Feature> features = map\.queryRenderedFeatures\(hitBox,[\s\S]*?\);/)?.[0] || "";
if (!expandedMapHitQuery || expandedMapHitQuery.includes('"nli-territory-fill"')) {
  throw new Error("Expanded pin hit testing must not steal exact offline territory polygon taps.");
}
if (!bundledMobileJs.includes('else if (nativeAndroid) {\n          setMobilePanelMode("timeline");\n          setMobileBottomPanelState("collapsed", { persist: false });')
    || !bundledMobileJs.includes("Finding your location with device GPS. In airplane mode this can take a little longer.")) {
  throw new Error("Android startup must use a collapsed Timeline and explain airplane-mode GPS requests.");
}
if (!bundledMobileJs.includes('"Sewanhacky (The Isle of Shells)"')
    || !bundledMobileJs.includes('"Paumanack (The Land of Tribute)"')
    || !bundledMobileJs.includes('document.addEventListener("visibilitychange"')
    || !bundledMobileCss.includes("body.android-device.tablet-device .tablet-project-title")
    || !bundledMobileCss.includes("transition: opacity 420ms ease, transform 420ms ease")) {
  throw new Error("Android tablets must show the desktop historical-name rotation and pause it while backgrounded.");
}
if (!bundledMobileCss.includes("grid-template-columns: minmax(0, 1fr) 52px")
    || !/justify-content:\s*flex-start;\s*gap:\s*6px;/.test(bundledMobileCss)) {
  throw new Error("Compact Nearby rows must reserve a consistent thumbnail column and align category with distance.");
}
if (!source.includes("document.querySelector('.sheet.open')")
    || !source.includes("bottomOcclusion,window.innerWidth")
    || !source.includes("private void settleNativeMapViewport()")
    || !source.includes("settleNativeMapViewport();\n                    hideLoadingCover();")
    || !source.includes("requestNativeMapViewportSync(900L)")
    || !source.includes("mo.observe(document.documentElement")
    || !source.includes("startupSyncCount>=8")
    || !source.includes("requestAnimationFrame(function(){if(window.__nliSyncNativeMapViewport)")
    || !appBridge.includes("double bottomOcclusion")
    || !appBridge.includes("syncNativeMapMovingFeatures")
    || source.includes(":not(.mobile-moving-biography-mapbox-icon)")) {
  throw new Error("Native MapLibre must measure opaque mobile-panel overlap so credits and map gestures remain in the visible map area.");
}
if (!bundledMobileJs.includes("function nativeUserLocationFeatures()")
    || !bundledMobileJs.includes("function nativeCommunityContributionFeatures()")
    || !bundledMobileJs.includes("function nativeTemporaryMapFeatures()")
    || !bundledMobileJs.includes("function nativeMovingFeatureCollection(")
    || !bundledMobileJs.includes("syncNativeMapMovingFeatures(")
    || !bundledMobileJs.includes("removeMobileMovingDomMarkers()")
    || !bundledMobileJs.includes("function nativeSiteIconKey(site)")
    || !bundledMobileJs.includes("native_icon_key: nativeSiteIconKey(site)")
    || !bundledMobileJs.includes("window.__nliSyncNativeMapViewport?.();\n      window.AndroidApp.syncNativeMapState")
    || !bundledMobileJs.includes("basemap: nativeBasemap")
    || !bundledMobileJs.includes('scheduleNativeMapStateSync("basemap", 0)')
    || !bundledMobileJs.includes("userLocation: nativeMapFeatureCollection(userLocationFeatures)")
    || !bundledMobileJs.includes("communityContributions: nativeMapFeatureCollection(communityFeatures)")
    || !bundledMobileJs.includes("temporaryMarkers: nativeMapFeatureCollection(temporaryFeatures)")
    || !bundledMobileJs.includes('scheduleNativeMapTransientStateSync("user-location", 0)')
    || !bundledMobileJs.includes("unread_count")) {
  throw new Error("The WebView/native bridge must preserve user location and unread-content state in the visible native map.");
}
if (!nativeMapController.includes("CameraPosition cameraToPreserve = nativeGestureInProgress()")
    || !nativeMapController.includes("if (camera == null || map == null || nativeGestureInProgress()) return;")
    || !nativeMapController.includes("movingFeaturesJson = featuresJson;")
    || !nativeMapController.includes("if (nativeGestureInProgress()) return;")
    || !nativeMapController.includes("MOVING_FEATURE_MIN_UPDATE_MS = 20L")
    || !nativeMapController.includes("mapView.postDelayed(applyLatestMovingFeaturesTask")
    || !nativeMapController.includes("boolean gestureSettled = cameraGestureAwaitingIdle;")
    || !nativeMapController.includes("applyMovingFeaturesToStyle();")
    || !nativeMapController.includes("listener.onGestureChanged(true);")
    || !nativeMapController.includes("listener.onGestureChanged(false);")) {
  throw new Error("Native map gestures must own the camera and pause moving-source updates until camera idle.");
}
if (!bundledMobileJs.includes("function mobileMovingBiographyLoop")
    || !bundledMobileJs.includes("const MOBILE_NATIVE_MOVING_MARKER_OVERVIEW_INTERVAL_MS = 56")
    || !bundledMobileJs.includes("const MOBILE_NATIVE_MOVING_MARKER_CLOSE_INTERVAL_MS = 24")
    || !bundledMobileJs.includes("const MOBILE_MOVING_MARKER_MAX_FRAME_DELTA_MS = 80")
    || !bundledMobileJs.includes("function mobileBiographyZoomMotionScale(zoomValue = Number(state.map?.getZoom?.()))")
    || !bundledMobileJs.includes("function mobileNativeMovingMarkerIntervalMs()")
    || !bundledMobileJs.includes("function mobileBiographyMotionFor(item, now = performance.now())")
    || !bundledMobileJs.includes("const motion = mobileBiographyMotionFor(item, now)")
    || !bundledMobileJs.includes("if (zoom <= 8) return 0.12")
    || !bundledMobileJs.includes("return Math.max(0.08, 0.22 / Math.pow(2, (zoom - 11.5) * 0.5))")
    || !bundledMobileJs.includes("Math.min(rawDelta, MOBILE_MOVING_MARKER_MAX_FRAME_DELTA_MS) * motionScale")
    || !bundledMobileJs.includes('phase: "fade-out"')
    || !bundledMobileJs.includes('phase: "reset"')
    || !bundledMobileJs.includes('phase: "fade-in"')
    || !bundledMobileJs.includes("motion_opacity: Number(motion.opacity.toFixed(3))")
    || !bundledMobileCss.includes('.mobile-moving-biography-marker[data-motion-phase="reset"]')
    || !nativeMapController.includes('iconOpacity(Expression.coalesce(Expression.get("motion_opacity")')
    || !nativeMapController.includes('textOpacity(Expression.coalesce(Expression.get("motion_opacity")')) {
  throw new Error("Biography icons and titles must fade at the route end, reset invisibly, and fade back in at the start on Android.");
}
if (!nativeMapController.includes("getDisplayMetrics().density * 32f")) {
  throw new Error("Native site artwork must keep a touch target large enough for transparent-padded icons.");
}
if (!nativeMapController.includes('new SymbolLayer("nli-site-point-labels", SITE_POINT_SOURCE_ID)')
    || !nativeMapController.includes("sitePointLabelLayer.setMinZoom(11.4f)")
    || !nativeMapController.includes("setTerritorySource(style, payload.optJSONObject(\"territories\"))")
    || !nativeMapController.includes("withBundledTerritoryLabels(payload.optJSONObject(\"labels\"))")
    || !nativeMapController.includes("setLayerVisibility(style, TERRITORY_FILL_LAYER_ID, !satelliteBasemap)")
    || !nativeMapController.includes('setLayerVisibility(style, "nli-moving-biography-icons", !profileMode)')) {
  throw new Error("Native map labels, permanent ancestral lands, and biography icons must survive filter and zoom changes.");
}
if (!nativeMapController.includes('BASE_WATER_LAYER_ID = "nli-base-water"')
    || !nativeMapController.includes("style.addLayerBelow(layer, BASE_WATER_LAYER_ID)")
    || !nativeMapController.includes("addLandLayerBelowBaseWater(style, new FillLayer(TERRITORY_FILL_LAYER_ID")
    || !nativeMapController.includes("addLandLayerBelowBaseWater(style, new FillLayer(SITE_LAND_FILL_LAYER_ID")
    || !nativeMapController.includes('Expression.eq(Expression.get("geometry_surface"), Expression.literal("land"))')
    || !nativeMapController.includes('Expression.neq(Expression.get("geometry_surface"), Expression.literal("land"))')
    || !nativeMapController.includes("SITE_LAND_SATELLITE_FILL_LAYER_ID")
    || !nativeMapController.includes("SITE_LAND_SATELLITE_LINE_LAYER_ID")
    || !nativeMapController.includes("setLayerVisibility(style, SITE_LAND_SATELLITE_FILL_LAYER_ID, !profileMode && satelliteBasemap)")
    || !nativeMapController.includes("SITE_LAND_FILL_LAYER_ID, SITE_LAND_SATELLITE_FILL_LAYER_ID, SITE_NON_LAND_FILL_LAYER_ID")
    || !nativeMapController.includes("TERRITORY_SATELLITE_FILL_LAYER_ID,\n                TERRITORY_SATELLITE_LINE_LAYER_ID")) {
  throw new Error("Native land polygons must render below vector water and roads, retain reviewed satellite overlays, and remain selectable on every basemap.");
}
if (!nativeMapController.includes("MAP_TAP_DISPATCH_DELAY_MS")
    || !nativeMapController.includes("pendingMapTapPoint")
    || !nativeMapController.includes("capturePendingMovingFeature")
    || !nativeMapController.includes("pendingMapTapFeatureKind")
    || !nativeMapController.includes("pendingMapTapFeatureLongitude")
    || !nativeMapController.includes("dispatchPendingMovingFeature(featureKind, featureKey, featureLongitude, featureLatitude)")
    || !nativeMapController.includes("listener.onFeatureSelected(featureKind, featureKey, featureLongitude, featureLatitude)")
    || !nativeMapController.includes("map.setPadding(0, 0, 0, viewportBottomOcclusion)")
    || !source.includes("mtSettled=setTimeout(sync,420)")
    || !nativeMapController.includes("suppressNextMapTap")
    || !nativeMapController.includes("Query the frame the user actually pressed")) {
  throw new Error("Native map taps must remain responsive without breaking double-tap gesture handling or moving-icon hit tests.");
}
if (!nativeMapController.includes("event.getActionMasked() != MotionEvent.ACTION_DOWN && !routedGestureMoved")
    || !nativeMapController.includes("routedGestureMoved = deltaX * deltaX + deltaY * deltaY")
    || !nativeMapController.includes("if (routedGestureMoved) return false;")) {
  throw new Error("A moved native map gesture must not open a site or territory when the finger is released.");
}
if (!nativeMapController.includes(".rotateGesturesEnabled(true)")
    || !nativeMapController.includes(".tiltGesturesEnabled(true)")
    || !nativeMapController.includes("setRotateGesturesEnabled(true)")
    || !nativeMapController.includes("setTiltGesturesEnabled(true)")
    || !nativeMapController.includes("event.getPointerCount() > 1")) {
  throw new Error("The APK native map must support two-finger rotation and tilt without turning a multi-touch gesture into a site tap.");
}
if (!nativeMapController.includes(".bearing(desiredBearing)")
    || !nativeMapController.includes(".tilt(Math.max(0.0, Math.min(60.0, desiredTilt)))")
    || !appBridge.includes("syncNativeMapCameraPose")
    || !bundledMobileJs.includes("AndroidApp.syncNativeMapCameraPose")
    || !bundledMobileJs.includes("cameraChanged(longitude, latitude, zoom, bearing, pitch)")) {
  throw new Error("Native/WebView camera synchronization must preserve bearing and pitch after a rotate or tilt gesture.");
}
if (!bundledMobileJs.includes("nativeMapCameraEcho: null")
    || !bundledMobileJs.includes("const matchesNativeCamera = Math.abs")
    || !bundledMobileJs.includes("state.nativeMapCameraEcho = {")) {
  throw new Error("The hidden WebView map must not echo a native camera update back into MapLibre Native.");
}
if (!source.includes("private void dispatchNativeMapGesture(boolean active)")
    || !bundledMobileJs.includes("gestureChanged(active)")
    || !bundledMobileJs.includes("if (active) markAndroidMapGestureActive();")) {
  throw new Error("Native touch activity must pause hidden-WebView map refresh and moving-feature work.");
}
if (!source.includes("notificationPermissionPromptedForSession")
    || !source.includes("notificationPermissionRequestInFlight")
    || !source.includes("&& !runtimePermissionPromptActive")) {
  throw new Error("Passive proximity checks must not stack Android notification permission dialogs.");
}

if (bundledApp.includes('url("../images/long-island-loading-outline.png")')
    || !bundledApp.includes('url("assets/images/long-island-loading-outline.png")')) {
  throw new Error("APK bundled CSS asset URLs must be rebased for the root offline shell.");
}

if (!bundledSharedSearchUtils.includes("function prepareEntry(entry = {}, options = {})")
    || !bundledSharedSearchUtils.includes("function rankEntries(entries = [], value, scoreEntry, options = {})")
    || !bundledSharedSearchUtils.includes("function didYouMeanEntry(entries = [], value, matches = [], options = {})")
    || !bundledApp.includes("function initSharedSearchUtils")
    || !bundledMobileJs.includes("state.mobileSearchIndex = [...state.sites, ...wikiSearchEntries]")
    || !bundledMobileJs.includes("SEARCH_UTILS.rankEntries(")
    || !bundledMobileJs.includes("const distances = state.userLocation")) {
  throw new Error("APK search and Nearby must package the shared prepared index, single-score ranking, bounded results, and distance snapshot.");
}

if (!bundledSharedLifecycleUtils.includes("function snapshotSignature(snapshot)")
    || !bundledSharedLifecycleUtils.includes("function createScrollRestorer(options = {})")
    || !bundledSharedLifecycleUtils.includes("get targetScrollTop()")
    || !bundledApp.includes("function initSharedLifecycleUtils")
    || !bundledMobileJs.includes("LIFECYCLE_UTILS.createScrollRestorer({")
    || !bundledMobileJs.includes("ANDROID_LIFECYCLE_WRITE_DEDUP_MS")
    || !bundledMobileJs.includes("function cancelAndroidLifecycleDetailScrollRestore()")
    || !bundledMobileJs.includes("androidLifecycleDetailScrollRestore.targetScrollTop")
    || !bundledMobileJs.includes("detailScrollTop: Number(options.preserveDetailScrollTop)")) {
  throw new Error("APK lifecycle recovery must package stable snapshots, one cancelable scroll session, and reading-position preservation.");
}

if (!bundledSharedMapStoryUtils.includes("const voteIndexCache = new WeakMap()")
    || !bundledSharedMapStoryUtils.includes("function storyVoteIndex(votes = [])")
    || !bundledSharedMapStoryUtils.includes("const countsByStory = new Map()")
    || !bundledSharedMapStoryUtils.includes("const membersByStory = new Map()")
    || !bundledSharedMapStoryUtils.includes("const visitorsByStory = new Map()")
    || !bundledSharedMapStoryUtils.includes("function storyStateSignature(stories = [], votes = [])")
    || !bundledSharedMapStoryUtils.includes("invalidateStoryVoteIndex(target)")
    || bundledSharedMapStoryUtils.includes("target.findIndex")
    || bundledSharedMapStoryUtils.includes(".filter(vote => String(relationId(vote.story))")) {
  throw new Error("APK visitor stories must package canonical indexed vote counts, identity lookups, signatures, and linear merging.");
}
if (!bundledMobileJs.includes("mapStoryRefreshPromise: null")
    || !bundledMobileJs.includes("if (state.mapStoryRefreshPromise) return state.mapStoryRefreshPromise")
    || !bundledMobileJs.includes("if (document.hidden && !options.force) return false")
    || !bundledMobileJs.includes("MAP_STORY_UTILS.storyStateSignature(nextStories, nextVotes)")
    || !bundledMobileJs.includes("window.setInterval(refreshMapStories, MAP_STORY_REFRESH_INTERVAL_MS)")
    || bundledMobileJs.includes("window.setInterval(refreshMapStories, 45000)")) {
  throw new Error("APK visitor story refresh must be single-flight, background-aware, change-sensitive, and use the shared interval.");
}

if (!bundledSharedProfileUtils.includes("function profileMapActivityModel(profile = {}, activity = {}, options = {})")
    || !bundledSharedProfileUtils.includes("function profileMapActivitySignature(collections = [])")
    || !bundledSharedProfileUtils.includes("const belongsToProfile = (record")
    || !bundledSharedProfileUtils.includes("function languageQuizCompletionCountFromAttempts(attempts = [], profileIds = new Set(), options = {})")
    || !bundledSharedProfileUtils.includes('add("quiz", record, referenceFor(')
    || !bundledSharedProfileUtils.includes("profileMapActivityModel,")) {
  throw new Error("APK contributor profiles must include the shared normalized progress-map activity model.");
}
if (!bundledMobileJs.includes("function enterMobileProfileMapMode(profile, options = {})")
    || !bundledMobileJs.includes("function exitMobileProfileMapMode()")
    || !bundledMobileJs.includes('document.body.classList.add("mobile-profile-map-mode", "mobile-profile-map-pending")')
    || !bundledMobileJs.includes("function mobileProfileAncestralLandFeatures()")
    || !bundledMobileJs.includes("mobile-profile-progress-context")
    || !bundledMobileJs.includes("pointsSyncing && options.syncRemote !== false && canSyncOwnPoints")
    || !bundledMobileJs.includes("mobile-profile-progress-points")
    || !bundledMobileJs.includes('["quiz", "Quizzes Completed"]')
    || !bundledMobileJs.includes('if (mode.clickHandler) {\n        state.map.off("click", "mobile-profile-progress-points", mode.clickHandler);')
    || !bundledMobileJs.includes('state.map.once("style.load", mode.styleLoadHandler)')
    || !bundledMobileJs.includes("positionMobileProfileMapActivityCard(card = state.profileMapPopup?.element)")
    || !bundledMobileJs.includes("Your map is still empty.")) {
  throw new Error("APK contributor profiles must enter, render, and cleanly exit personal progress-map mode.");
}
if (!/function openMobileMapTap\(event\)\s*\{\s*if \(state\.profileMapMode\) return false;/.test(bundledMobileJs)) {
  throw new Error("APK public-map taps must not pass through contributor progress-map mode.");
}
if (!bundledMobileJs.includes('loginSheetEl?.classList.contains("open") && state.profileMapMode?.sheet === loginSheetEl')
    || !bundledMobileJs.includes("dismissMobileSheet(loginSheetEl)")
    || !bundledMobileJs.includes("state.profileMapMode?.profileKey === mapProfileKey")
    || !bundledMobileJs.includes("dismissMobileSheet(profilesSheetEl)")) {
  throw new Error("APK contributor/account profile controls must toggle the same open profile closed.");
}
if (!bundledMobileCss.includes("#profiles-sheet.profile-progress-active")
    || !bundledMobileCss.includes("#login-sheet.profile-progress-active")
    || !bundledMobileCss.includes("body:not(.native-android-app).mobile-content-open:not(.mobile-profile-map-mode):not(.mobile-contributor-sheet-open) .app header")
    || !bundledMobileCss.includes("body.native-android-app.mobile-detail-open:not(.mobile-profile-map-mode) .app header")
    || !bundledMobileJs.includes('document.body.classList.toggle("mobile-contributor-sheet-open", contributorSheetOpen)')
    || !bundledMobileCss.includes("body.mobile-profile-map-mode .mobile-calendar-event-marker")
    || !bundledMobileCss.includes(".comment.contributor-card {")) {
  throw new Error("APK contributor progress mode must keep the map/profile split, stable viewport, and hide unrelated calendar markers.");
}
if (!bundledMobileJs.includes("async function ensurePublicProfileActivity(profile)")
    || !bundledMobileJs.includes("publicProfileActivityLoaded: new Set()")
    || !bundledMobileJs.includes("publicProfileActivityPromises: new Map()")
    || !bundledMobileJs.includes("filter[_or][0][member_profile][_in]")
    || !bundledMobileJs.includes("filter[_or][1][author_name][_in]")
    || !bundledMobileJs.includes("ensurePublicProfileActivity(profile).then(updated =>")) {
  throw new Error("APK contributor profiles must lazy-load, cache, and render contributor-targeted public activity details.");
}
const bundledLearningCardUtils = fs.readFileSync(bundledLearningCardUtilsPath, "utf8");
const bundledResearchQuestionCss = fs.readFileSync(bundledResearchQuestionCssPath, "utf8");
const bundledSharedSiteUtils = fs.readFileSync(bundledSharedSiteUtilsPath, "utf8");
const bundledCalendarUtils = fs.readFileSync("app/src/main/assets/assets/js/shared-calendar-utils.js", "utf8");
const styles = fs.readFileSync(stylesPath, "utf8");
const launchBackground = fs.readFileSync(launchBackgroundPath, "utf8");
const android12Styles = fs.readFileSync(android12StylesPath, "utf8");

if (!bundledMobileJs.includes("function revealMobileContentUpdate(item, activityItems = [])")
    || !bundledMobileJs.includes('target.classList.add("content-update-highlight")')
    || !bundledMobileJs.includes('showBanner("New content highlighted.")')
    || !bundledMobileCss.includes(".content-update-highlight::before")) {
  throw new Error("APK unread site updates must scroll to and temporarily highlight the matching content section.");
}

if (!bundledMobileJs.includes("function mobileActivitySpecificContentTarget(activityItems = [])")
    || !bundledMobileJs.includes('detailBodyEl.querySelector(`[data-comment-card="${CSS.escape(commentId)}"]`)')
    || !bundledMobileJs.includes("#timeline-moment-${CSS.escape(activityId)}")
    || !bundledMobileJs.includes('detailBodyEl.querySelector("[data-site-hero-carousel], .article-sticky-hero")')
    || !bundledMobileJs.includes('detailBodyEl.querySelector("[data-mobile-visit-actions]")')
    || (bundledMobileJs.match(/revealMobileContentUpdate\(site, contentUpdateItems\)/g) || []).length < 2) {
  throw new Error("APK unread site updates must prioritize and preserve the exact new comment, moment, story, or visit area.");
}

if (!bundledMobileJs.includes("LOCATION_CONTROL_MAX_SCOPE_DISTANCE_MILES = 75")
    || !bundledMobileJs.includes("function locationWithinLongIslandScope(location)")
    || !bundledMobileJs.includes("restrictToLongIslandScope && !locationWithinLongIslandScope(nextLocation)")
    || !bundledMobileJs.includes("function fitAllLongIslandMapView")
    || !bundledMobileJs.includes("state.map.fitBounds(LONG_ISLAND_OVERVIEW_BOUNDS")
    || !bundledMobileJs.includes("showOutOfScopeLocationNotice();")
    || !bundledMobileJs.includes('showBanner("You are too far from Long Island to recenter this map.", { centered: true });')
    || !bundledMobileCss.includes(".banner.centered")
    || !bundledMobileCss.includes("transform: translateY(-50%);")) {
  throw new Error("APK location controls must reject far-away coordinates, fit all of Long Island, and show the warning at screen center.");
}

if (!bundledMobileJs.includes("LOCATION_CONTROL_LONG_PRESS_MS = 600")
    || !bundledMobileJs.includes("function installApkLocationControlLongPress()")
    || !bundledMobileJs.includes("window.onAndroidLocationControlLongPress")
    || !bundledMobileJs.includes('return "location-control";')
    || !bundledMobileJs.includes('mobileMapLocateBtn.addEventListener("touchstart", startPress')
    || !bundledMobileJs.includes('mobileMapLocateBtn.addEventListener("touchend", finishPress)')
    || !bundledMobileJs.includes("function showApkLocationOverview")
    || !bundledMobileJs.includes("suppressNextApkLocationControlClick")
    || !bundledMobileJs.includes("Showing all of Long Island. Tap the location button to return to your location.")
    || !bundledMobileCss.includes(".mobile-map-locate.is-long-pressing")) {
  throw new Error("APK location control must show all of Long Island on a held press without firing the normal location tap.");
}

if (!bundledMobileJs.includes('document.addEventListener("click", closeMobileSheetFromControl, true);')
    || !bundledMobileJs.includes('if (!sheet?.classList.contains("open")) return;')
    || !bundledMobileJs.includes('if (sheet === state.profileMapMode?.sheet) {\n          exitMobileProfileMapMode();\n        }')
    || !bundledMobileJs.includes('if (sheet === profilesSheetEl) {\n          state.expandedMobileProfileKey = "";\n        }')
    || bundledMobileJs.includes('document.addEventListener("pointerdown", closeMobileSheetFromControl, true);')
    || bundledMobileJs.includes('document.addEventListener("pointerup", closeMobileSheetFromControl);')) {
  throw new Error("APK contributor profile close must consume the completed click without exposing controls underneath during pointer-down.");
}

if (!bundledApp.includes('id="landscape-panel-resizer"')
    || !bundledMobileCss.includes("body.android-device.tablet-landscape .landscape-panel-resizer")
    || !bundledMobileCss.includes("cursor: ew-resize")
    || !bundledMobileJs.includes("function installLandscapePanelResize()")
    || !bundledMobileJs.includes("LANDSCAPE_PANEL_RATIO_KEY")
    || !bundledMobileJs.includes("setPointerCapture")
    || !bundledMobileJs.includes('event.key === "ArrowLeft"')
    || !bundledMobileJs.includes('event.key === "ArrowRight"')) {
  throw new Error("APK landscape split view must provide a persistent touch and keyboard panel-width resizer.");
}

if (!bundledMobileJs.includes("CALENDAR_UTILS.calendarBadgeMarkup(exhibit")
    || !bundledMobileJs.includes("CALENDAR_UTILS.isExhibitCurrentOrUpcoming(exhibit")
    || !bundledMobileCss.includes(".mobile-calendar-event-marker .calendar-date-badge")
    || !bundledCalendarUtils.includes("function calendarBadgeMarkup")
    || !bundledCalendarUtils.includes("function isCalendarEventCurrentOrUpcoming")
    || !bundledCalendarUtils.includes("isExhibitCurrentOrUpcoming: isCalendarEventCurrentOrUpcoming")
    || !bundledCalendarUtils.includes('context.font = "700 9px Arial, sans-serif"')
    || !bundledCalendarUtils.includes("context.fillText(calendarMonthDay(value), 19, 24, 23)")
    || bundledMobileJs.includes('element.textContent = "🗓"')) {
  throw new Error("APK event markers must share current/upcoming visibility and compact dated calendar artwork with desktop.");
}

if (!bundledMobileJs.includes("sortedExhibits().filter(isExhibitCurrentOrUpcoming)")
    || !bundledMobileJs.includes("archived|closed|deleted|draft|hidden")
    || !bundledCalendarUtils.includes("if (end) return end >= today;")
    || !bundledCalendarUtils.includes("return Boolean(start && start >= today);")
    || bundledCalendarUtils.includes("value.activity_feed_date || value.collection_date")
    || /Example permanent collection|Placeholder exhibit|Preservation Long Island On View/i.test(bundledApp)) {
  throw new Error("APK calendar content must exclude filler, archived records, activity-feed pseudo-dates, and expired event markers.");
}

if (!bundledMobileJs.includes("function startMobileStartupSiteReveal()")
    || !bundledMobileJs.includes("mobileStartupRevealRamp")
    || !bundledMobileJs.includes("MOBILE_STARTUP_SITE_REVEAL_ZOOM_DELTA")
    || !bundledMobileJs.includes("!androidLifecycleSnapshot")
    || !bundledMobileJs.includes("!routeAlreadyOpened")
    || !bundledMobileJs.includes("!reducedMotion")
    || !bundledMobileCss.includes(".app.mobile-site-reveal-pending #map :is(.mapboxgl-marker, .maplibregl-marker)")
    || !bundledMobileCss.includes("@keyframes mobile-startup-marker-settle")) {
  throw new Error("APK cold starts must use the center-out site reveal while restored, routed, offline, and reduced-motion launches skip it.");
}

if (!lightweightOfflineApp.includes('href="assets/css/mobile-app.css"')
    || !lightweightOfflineApp.includes('class="title-row"')
    || !lightweightOfflineApp.includes('class="search" id="search"')
    || !lightweightOfflineApp.includes('class="quick-actions"')
    || !lightweightOfflineApp.includes('class="mobile-map-shell offline-map-index"')
    || !lightweightOfflineApp.includes('class="mobile-view-tabs"')
    || !lightweightOfflineApp.includes('class="list-panel archive"')
    || !lightweightOfflineApp.includes('class="site-card learning-card nearby-feed-card"')
    || !lightweightOfflineApp.includes('class="ghost-button account-button offline-pill">Offline')
    || !lightweightOfflineApp.includes('class="offline-text-mode native-android-app android-device"')
    || !lightweightOfflineApp.includes('data-offline-jump="map"')
    || !lightweightOfflineApp.includes('data-offline-jump="archive"')
    || !lightweightOfflineApp.includes('aria-label="Close saved article">x</button>')
    || lightweightOfflineApp.includes('class="shell"')
    || lightweightOfflineApp.includes('class="brand-row"')) {
  throw new Error("Lightweight offline archive must reuse the online APK header, map, tabs, list panel, cards, and lowercase close-control styling.");
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
const bundledSiteCenters = JSON.parse(fs.readFileSync(
  "app/src/main/assets/assets/data/mobile-site-centers.json",
  "utf8"
));

const bundledGeometryRows = Array.isArray(bundledSiteGeometry?.rows) ? bundledSiteGeometry.rows : [];
const detailedPolygonRows = bundledGeometryRows.filter((row) => row?.display_geojson);
const bundledGeometryBytes = fs.statSync(
  "app/src/main/assets/assets/data/mobile-site-geometry.json"
).size;
if (bundledGeometryRows.length !== 439 || detailedPolygonRows.length < 16) {
  throw new Error("Bundled Android geometry must retain all 439 sites and the audited detailed polygon set.");
}
if (bundledGeometryBytes > 2_850_000) {
  throw new Error(`Bundled Android geometry exceeds its deferred-load budget: ${bundledGeometryBytes} bytes.`);
}
if (!bundledMobileJs.includes('SITE_GEOMETRY_VERSION = "20260831-shoreline-edge-audit-v4"')) {
  throw new Error("Android must invalidate the older cached polygon geometry after the shoreline audit.");
}

const manifestIconAssets = nativeSiteIconManifest?.icon_asset_by_map_icon_id || {};
const manifestForceBlueSlugs = new Set(nativeSiteIconManifest?.force_blue_dot_slugs || []);
const manifestSiteIconKeys = nativeSiteIconManifest?.native_icon_key_by_site_slug || {};
if (nativeSiteIconManifest?.version !== 2
    || Object.keys(manifestIconAssets).length < 35
    || Object.keys(manifestSiteIconKeys).length < 60
    || manifestForceBlueSlugs.size !== 2
    || nativeSiteIconManifest?.exhibit_icon !== "exhibit-framed-landscape-marker.png") {
  throw new Error("Native first-frame site icon manifest is incomplete or has an unexpected schema.");
}
if (nativeTerritoryFallback?.version !== 1
    || nativeTerritoryFallback?.territories?.features?.length !== 13
    || nativeTerritoryFallback?.labels?.features?.length !== 13) {
  throw new Error("Native ancestral-land fallback must contain exactly 13 precomputed polygons and labels.");
}
for (const [slug, iconKey] of Object.entries(manifestSiteIconKeys)) {
  if (!slug || !/^nli-icon-[a-z0-9-]+$/.test(iconKey)) {
    throw new Error(`Native first-frame site icon lookup is invalid for ${slug || "an empty slug"}.`);
  }
}
for (const filename of [...Object.values(manifestIconAssets), nativeSiteIconManifest.exhibit_icon, "blue-dot-placeholder.png"]) {
  const assetPath = `app/src/main/assets/assets/map-icons/${filename}`;
  if (!fs.existsSync(assetPath) || fs.statSync(assetPath).size < 50) {
    throw new Error(`Native first-frame site icon manifest references a missing icon: ${filename}`);
  }
}
const jsIconBlock = bundledMobileJs.match(/const APK_LOCAL_MAP_ICON_OVERRIDES = Object\.freeze\(\{([\s\S]*?)\n\s*\}\);/);
if (!jsIconBlock) throw new Error("Could not inspect the APK local map-icon overrides.");
for (const [mapIconId, filename] of Object.entries(manifestIconAssets)) {
  const expectedJsValue = mapIconId === "45f2e7fd-636d-48e9-9e36-ed5ba2dd669e"
    ? `"${mapIconId}": EXHIBIT_MARKER_ICON`
    : `"${mapIconId}": "assets/map-icons/${filename}"`;
  if (!jsIconBlock[1].includes(expectedJsValue)) {
    throw new Error(`Native first-frame icon mapping drifted from the WebView runtime: ${mapIconId}`);
  }
}

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
const bundledCenterSlugs = siteSlugs(bundledSiteCenters);
const missingBundledGeometry = setDifference(bundledIndexSlugs, bundledGeometrySlugs);
const extraBundledGeometry = setDifference(bundledGeometrySlugs, bundledIndexSlugs);
if (missingBundledGeometry.length || extraBundledGeometry.length) {
  throw new Error(
    `Bundled Android site index/geometry parity failed. Missing geometry: ${missingBundledGeometry.join(", ") || "none"}; `
      + `unexpected geometry: ${extraBundledGeometry.join(", ") || "none"}.`
  );
}
const missingBundledCenters = setDifference(bundledIndexSlugs, bundledCenterSlugs);
const extraBundledCenters = setDifference(bundledCenterSlugs, bundledIndexSlugs);
if (missingBundledCenters.length || extraBundledCenters.length) {
  throw new Error(
    `Bundled Android site index/center parity failed. Missing centers: ${missingBundledCenters.join(", ") || "none"}; `
      + `unexpected centers: ${extraBundledCenters.join(", ") || "none"}.`
  );
}
if (!bundledMobileJs.includes('const SITE_CENTER_URL = "assets/data/mobile-site-centers.json";')
    || !bundledMobileJs.includes("fetchMobileSiteCenterRows")
    || !bundledMobileJs.includes("hydrateMobileSiteGeometry")
    || !bundledMobileJs.includes("idleTask(hydrateMobileSiteGeometry)")) {
  throw new Error("APK startup must use compact site centers first and hydrate full map geometry after the initial render.");
}
if (!/function\s+hydrateMobileSiteGeometry\(\)[\s\S]*?Promise\.all\(\[[\s\S]*?fetchMobileSiteGeometryRows\(\)[\s\S]*?ensureLandMask\(\)/.test(bundledMobileJs)) {
  throw new Error("APK startup must defer the land mask with detailed polygon hydration instead of blocking its first render.");
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
  if (placeNames.length !== 321) {
    throw new Error(`${label} must contain 321 place-name listings; found ${placeNames.length}.`);
  }

  const quotedPlaceNames = placeNames.filter(site => /<blockquote class="place-name-quote">/.test(String(site.translation_content || "")));
  if (quotedPlaceNames.length !== 305) {
    throw new Error(`${label} must retain the 305 currently published reviewed place-name quotations; found ${quotedPlaceNames.length}.`);
  }
  const quotes = quotedPlaceNames.map(site => {
    const quoteMatch = String(site.translation_content || "")
      .match(/<blockquote class="place-name-quote">\s*<p>([\s\S]*?)<\/p>/);
    return { slug: site.slug, text: decodeQuoteHtml(quoteMatch[1]) };
  });
  const normalized = quotes.map(({ text }) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim());
  if (new Set(normalized).size !== 305) {
    throw new Error(`${label} must retain 305 distinct reviewed place-name quotations.`);
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

const bundledMobileDataMatch = bundledApp.match(/window\.NLI_MOBILE_DATA\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
const bundledMobileData = JSON.parse(bundledMobileDataMatch[1]);
const reviewedBiographySlugs = [
  "chief-harry-wallace-of-the-unkechaug", "peter-john-cuffee", "sunksqua-weany-pametsechs", "wuchikittawbut",
  "paucamp", "nathan-jeffrey-cuffee", "sylvester-pharoah", "sachem-aquash-of-the-montaukett",
  "mandush-17th-century-sachem-of-shinnecock", "chief-mahue-mayhew-of-unkechaug", "stephen-talkhouse-pharoah",
  "wobetom", "rev-paul-cuffee", "jeremiah-pharoah-montaukett-whaler", "ninigret-eastern-niantic-sachem",
  "mary-rebecca-bunn-aunt-becky", "mangwobe-sachem-of-rockaway", "mocomanto-shinnecock-sachem-1640",
  "nasseconset-sachem-of-the-nissequogue", "keeossechok-sachem-of-the-secatogue",
  "sachem-warawakmy-of-the-setauket", "john-a-strong", "betty-lewis-cromwell-shinnecock", "momoweta",
  "sachem-tackapousha", "elizabeth-thunder-bird-haile-shinnecock", "samson-occom",
  "penhawitz-sachem-of-the-canarsie", "adam-achitteronose",
  "sagamore-raseokan-ratiocanof-matinnicoke-matinecock", "quashawam", "wyandanch", "cockenoe",
  "poggatacut-sachem-of-the-manhassets-of-shelter-island"
];
const bundledBiographyBySlug = new Map((bundledMobileData.wikiArticles || []).map(article => [article.slug, article]));
for (const slug of reviewedBiographySlugs) {
  const article = bundledBiographyBySlug.get(slug);
  if (!article || !/^<p class="biography-introduction">[\s\S]+?<\/p>/.test(String(article.content || ""))) {
    throw new Error(`Bundled Android biography ${slug} must begin with its reviewed identifying introduction.`);
  }
}
if (!Array.isArray(bundledMobileData.learningPaths) || bundledMobileData.learningPaths.length !== 3) {
  throw new Error(`Bundled Android fallback must contain 3 public learning paths; found ${bundledMobileData.learningPaths?.length || 0}.`);
}
if (!Array.isArray(bundledMobileData.learningPathSites) || bundledMobileData.learningPathSites.length !== 29) {
  throw new Error(`Bundled Android fallback must contain 29 learning-path stops; found ${bundledMobileData.learningPathSites?.length || 0}.`);
}
for (const runtime of [bundledApp, bundledLiveRuntime]) {
  if (!runtime.includes('openAppPage("learn")')
      || !runtime.includes("function openMobileLearningPathsPanel")
      || !runtime.includes("function openMobileLearningPath(pathSlug)")
      || !runtime.includes("data-mobile-learning-path-complete")) {
    throw new Error("Bundled Android shells must route Learn to guided learning paths with stop progress.");
  }
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
requireText("LOADING_COVER_MINIMUM_MS = 1500", "Android loading cover must remain visible long enough to show its Long Island progress animation.");
requireText('showLoadingCover("Loading On This Site");', "Android cold startup must initialize the native loading animation timer before the WebView can finish.");
requireText("STARTUP_VISUAL_STABLE_MS = 600", "Android must keep a bounded stability window without delaying the first usable map.");
requireText("STARTUP_DOM_STABLE_MS = 350", "Android must settle the initial controls without waiting on idle community data.");
requireText("listings[\\\\s\\\\S]*loaded\\\\b", "Android readiness must accept both live and APK snapshot loaded messages.");
if (!bundledMobileJs.includes('style: isNativeAndroidApp() ? mobileBasemapStyle("blank") : mobileBasemapStyle(savedBasemap)')) {
  throw new Error("Android must not download and paint a duplicate hidden raster basemap under the native map.");
}
if (!bundledMobileJs.includes('syncNativeMapState("native-bridge-shell-ready")')
    || !bundledMobileJs.includes('syncNativeMapState("map-load")')
    || !bundledMobileJs.includes('reason !== "native-bridge-shell-ready"')
    || !bundledMobileJs.includes('reason !== "map-load"')
    || !bundledMobileJs.includes("nativeBridgeTimer = window.setTimeout")) {
  throw new Error("Android must establish the authoritative native-map base immediately when the lightweight bridge is ready, before asynchronous content can replace the first handoff.");
}
requireText("app.classList.contains('mobile-map-initializing')", "Android startup readiness must wait for the in-map initialization shield to finish.");
requireText("app.classList.contains('mobile-site-reveal-pending')", "Android startup readiness must wait for the intentional site reveal to finish behind the native cover.");
requireText("app.classList.contains('mobile-site-reveal-settling')", "Android startup readiness must not expose the marker settling animation.");
requireText("var compactGeometryReady=offline||geometryStatus!=='hydrating'", "Android startup must hand off from the compact map without waiting for detailed polygons.");
requireText("schedulePostStartupGeometryHydration();", "Android must request detailed polygons only after the first usable map handoff.");
requireText("window.__nliHydrateMobileSiteGeometryAfterStartup", "Android must trigger the page's deferred geometry hydration after its loading cover closes.");
requireText("resetPostStartupGeometryHydration();", "Android must cancel a stale deferred geometry task before live or fallback navigation.");
requireText("if (webView == null || !loadingBundledFallback || appShellLoaded) return;", "A successful bundled native-map readiness probe must not be overwritten by the legacy offline paint deadline.");
requireText("var deferredReady=true", "Android startup must leave the page's existing idle community-data pass out of the first-paint gate.");
if (source.includes("window.__nliNativeStartupDeferredRequested")) {
  throw new Error("Android startup must not duplicate or pull the deferred community request in front of the first usable map.");
}
requireText("window.__nliNativeStartupDomSignature", "Android startup must track the visible promo controls and unread badges until their DOM state settles.");
requireText("archiveTextReady&&compactGeometryReady&&deferredReady&&mapUiReady&&startupDomStable", "Android must require loaded archive text, a compact map, a settled viewport, and stable controls before handing off from the native cover.");
requireText("nativeMapController.isStartupVisualStable(STARTUP_VISUAL_STABLE_MS)", "Android readiness probes must include native style, viewport, state, and camera stability.");
requireText("var archiveReady=offline&&!!document.querySelector('.offline-map-index')", "Offline startup must keep the Long Island cover until the saved map index and region controls are fully rendered.");
if (!nativeMapController.includes("void beginStartupVisualTracking()")
    || !nativeMapController.includes("boolean isStartupVisualStable(long stableWindowMs)")
    || !nativeMapController.includes("void finishStartupVisualTracking()")
    || !nativeMapController.includes("if (!usingOnlineArchive) startupStateReady = true;")
    || !nativeMapController.includes("markStartupVisualChange();")) {
  throw new Error("Native map startup must track late state, viewport, moving-feature, and camera changes behind the Long Island cover.");
}
requireText("loadingOutlineReveal.postOnAnimation(loadingOutlineRevealFrame)", "Android loading cover must animate even when the system animator scale is disabled.");
requireText("loadingOutlineReveal.setClipBounds(new Rect(0, 0, revealedWidth, height))", "Android Long Island loader must reveal from left to right without stretching the graphic.");
if (source.includes("loadingProgressFill") || source.includes("progressTrack")) {
  throw new Error("Android loading cover must use the Long Island reveal itself, without a separate progress bar.");
}
requireText("LOADING_OUTLINE_PRE_READY_MAX = 0.90f", "Android loading progress must hold near completion until the app is actually ready.");
requireText("LOADING_OUTLINE_COMPLETE_HOLD_MS = 120", "Android loading progress must visibly hold its completed Long Island before the cover closes.");
requireText("loadingOutlineRevealProgress = Math.max(loadingOutlineRevealProgress, targetProgress)", "Android loading progress must move monotonically from west to east.");
requireText("loadingOutlineCompletionRequested && loadingOutlineRevealProgress >= 1f", "Android loading progress must reach 100 percent once before the cover closes.");
requireText("if (startNewPass) startLoadingOutlineReveal();", "Android fallback status changes must not restart the active Long Island loading pass.");
if (source.includes("elapsed % LOADING_OUTLINE_CYCLE_MS") || source.includes("LOADING_OUTLINE_CYCLE_MS")) {
  throw new Error("Android loading progress must never loop back to the west edge during one load.");
}
requireBundledText('<button class="ghost-button" id="settings-open" type="button">Notifications</button>', "Bundled Android menu must label the settings action Notifications.");
forbidBundledText('<button class="ghost-button" id="settings-open" type="button">Alerts</button>', "Bundled Android menu must not use the old Alerts label.");
requireBundledText('<details class="mobile-more-menu">\n          <summary>Menu</summary>', "Bundled Android overflow control must be labeled Menu.");
forbidBundledText('<details class="mobile-more-menu">\n          <summary>More</summary>', "Bundled Android overflow control must not retain the old More label.");
requireBundledPattern(/body\.android-device\.tablet-landscape \.account-button\s*\{[\s\S]*?min-width:\s*118px;[\s\S]*?max-width:\s*148px;/, "Bundled Android landscape must keep the member name and points readable.");
requireBundledPattern(/body\.android-device\.tablet-landscape \.quick-actions\s*\{[\s\S]*?grid-template-columns:\s*96px;[\s\S]*?grid-template-rows:\s*32px 32px;[\s\S]*?body\.android-device\.tablet-landscape \.mobile-more-menu\s*\{[\s\S]*?grid-row:\s*1;[\s\S]*?body\.android-device\.tablet-landscape \.mobile-layer-menu\s*\{[\s\S]*?grid-row:\s*2;/, "Bundled Android landscape must stack Menu above Labels.");
requireBundledPattern(/body\.android-device\.tablet-landscape \.mobile-activity-button,[\s\S]*?left:\s*max\(18px,\s*calc\(var\(--app-left-safe\) \+ 18px\)\);[\s\S]*?body\.android-device\.tablet-landscape \.mobile-notification-button\s*\{[\s\S]*?left:\s*max\(70px,\s*calc\(var\(--app-left-safe\) \+ 70px\)\);/, "Bundled Android landscape community controls must be inset from the map edge.");
requireBundledPattern(/body\.android-device\.tablet-landscape \.mobile-more-menu\[open\] \.mobile-more-grid\s*\{[\s\S]*?repeat\(5,\s*minmax\(0,\s*1fr\)\)/, "Bundled Android landscape More menu must use the balanced five-column grid.");
requireBundledPattern(/body\.android-device\.tablet-landscape:has\(\.mobile-more-menu\[open\]\) \.landscape-panel-resizer[\s\S]*?visibility:\s*hidden;[\s\S]*?pointer-events:\s*none;/, "Bundled Android split resize handle must stay behind open menus.");
requireBundledPattern(/function syncLandscapeHeaderControls\(\)[\s\S]*?headerWidth < 430[\s\S]*?mobileMoreGridEl\.prepend\(loginOpenBtn\)[\s\S]*?accountButtonHomeAnchorEl\.insertAdjacentElement\("afterend", loginOpenBtn\)[\s\S]*?function setLandscapePanelWidth[\s\S]*?scheduleLandscapePanelLayout\(\);/, "Bundled Android landscape must move the real account control into Menu when the map-side header becomes narrow.");
requireBundledPattern(/function storedLandscapePanelRatio\(\)[\s\S]*?landscapePanelRatio !== null[\s\S]*?function scheduleLandscapePanelLayout\(\)[\s\S]*?if \(landscapePanelLayoutFrame\) return;/, "Bundled Android landscape must cache saved width and coalesce secondary layout work.");
requireBundledPattern(/let pointerResizeFrame = 0;[\s\S]*?requestAnimationFrame\(applyPendingPointerResize\)[\s\S]*?cancelAnimationFrame\(pointerResizeFrame\)/, "Bundled Android divider dragging must be limited to one visual update per frame.");
requireBundledPattern(/let mobileViewportLayoutFrame = 0;[\s\S]*?if \(mobileViewportLayoutFrame\) return;[\s\S]*?clearTimeout\(mobileViewportMapResizeTimer\)/, "Bundled Android duplicate viewport signals must share one layout pass.");
requireBundledPattern(/function calendarMonthDay\(value = new Date\(\)\)[\s\S]*?`\$\{month\}\/\$\{day\}`[\s\S]*?function calendarBadgeMarkup[\s\S]*?calendarMonthDay\(value\)/, "Bundled Android calendar badges must show month/day instead of only the day number.");
requireBundledPattern(/\.mobile-calendar-event-marker \.calendar-date-badge\s*\{[\s\S]*?width:\s*23px;[\s\S]*?height:\s*23px;[\s\S]*?font-size:\s*8\.5px;/, "Bundled Android calendar badge must be about 25 percent smaller and keep its month/day legible.");
requireBundledText('element.style.width = "27px";', "Bundled Android calendar marker wrapper must be reduced from 36px to 27px.");
requireBundledText('element.style.height = "27px";', "Bundled Android calendar marker wrapper height must be reduced from 36px to 27px.");
for (const setting of [
  "settings.setAllowFileAccess(false)",
  "settings.setAllowFileAccessFromFileURLs(false)",
  "settings.setAllowUniversalAccessFromFileURLs(false)",
  "settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW)",
  "settings.setSafeBrowsingEnabled(true)"
]) {
  requireText(setting, `Android WebView security setting is missing: ${setting}.`);
}
if (!manifest.includes('android:allowBackup="false"')) {
  throw new Error("Android backups must remain disabled because the WebView stores contributor sessions.");
}
if (!source.includes('safeLogUrl(url)') || source.includes('"WebView page started: " + url')) {
  throw new Error("Android release logs must not expose URL queries or password-reset fragments.");
}
if (!source.includes('"mailto".equals(scheme) || "tel".equals(scheme)')
    || !source.includes('if (!("https".equals(scheme) || "http".equals(scheme) || "geo".equals(scheme)')) {
  throw new Error("Android external navigation must reject unsafe URI schemes.");
}
if (!storyBridge.includes("MAX_STORY_BASE64_CHARS") || !storyBridge.includes("base64Video.length() > MAX_STORY_BASE64_CHARS")) {
  throw new Error("Android story video bridge must reject oversized base64 payloads before decoding.");
}
if (!source.includes("bridgeCapabilityToken = UUID.randomUUID().toString()")
    || !source.includes("window.__NLI_ANDROID_BRIDGE_TOKEN=")
    || !source.includes("isTrustedAppOrigin(request.getOrigin())")
    || !source.includes("isTrustedAppOrigin(Uri.parse(origin))")) {
  throw new Error("Android WebView permissions and sensitive bridges must be restricted to the trusted top-level archive.");
}
for (const bridgeSource of [appBridge, storyBridge]) {
  if (!bridgeSource.includes("validBridgeToken(token)")) {
    throw new Error("Every sensitive Android JavaScript bridge must verify the per-app capability token.");
  }
}
for (const lifecycleRuntime of [bundledApp, bundledLiveRuntime]) {
  if (!lifecycleRuntime.includes("if (state.mobileStartupRendering)")
      || !lifecycleRuntime.includes("const activeContentKey = androidLifecycleContentKey(activeContent)")
      || !lifecycleRuntime.includes("const existingContentKey = androidLifecycleContentKey(existing?.content)")
      || !lifecycleRuntime.includes("(!activeContentKey || activeContentKey === existingContentKey)")
      || !lifecycleRuntime.includes("androidLifecycleSnapshotIsValid(existing, now)")
      || !lifecycleRuntime.includes("ANDROID_LIFECYCLE_WRITE_DEDUP_MS")
      || !lifecycleRuntime.includes("function restoreAndroidLifecycleDetailScroll(snapshot)")
      || !lifecycleRuntime.includes("LIFECYCLE_UTILS.createScrollRestorer({")
      || !lifecycleRuntime.includes("function cancelAndroidLifecycleDetailScrollRestore()")
      || !lifecycleRuntime.includes("const detailScrollSnapshot = lifecycleSnapshot || (Number(options.preserveDetailScrollTop) > 0")
      || !lifecycleRuntime.includes("filterSites({ revealPanel: false })")
      || !lifecycleRuntime.includes("const lifecycleSnapshot = options.lifecycleSnapshot || null")
      || !lifecycleRuntime.includes("restoreAndroidLifecycleDetailScroll(detailScrollSnapshot)")
      || !lifecycleRuntime.includes("restoreMapState: true")
      || !lifecycleRuntime.includes("state.map.stop?.()")
      || !lifecycleRuntime.includes("function currentAndroidLifecycleViewSnapshot()")
      || !lifecycleRuntime.includes("function currentAndroidLifecycleReopenOptions(options = {})")
      || !lifecycleRuntime.includes("openSite(state.selectedSite.slug, currentAndroidLifecycleReopenOptions({")) {
    throw new Error("Bundled Android runtimes must preserve meaningful lifecycle content during startup fallback navigation.");
  }
  if (lifecycleRuntime.includes("if (androidLifecycleContentRestored) restoreAndroidLifecycleDetailScroll(androidLifecycleSnapshot)")) {
    throw new Error("Bundled Android runtimes must let each asynchronous content render own lifecycle scroll restoration.");
  }
  if (lifecycleRuntime.includes("[150, 550, 1500, 3500].forEach(delay => window.setTimeout(apply, delay))")) {
    throw new Error("Bundled Android runtimes must not restore one article with overlapping timer batches.");
  }
}
for (const startupRuntime of [bundledApp, bundledLiveRuntime]) {
  if (!startupRuntime.includes('appEl?.classList.add("mobile-map-initializing")')
      || !startupRuntime.includes('hideLoadingScreen();')
      || !startupRuntime.includes('await initMap().catch(error =>')
      || !startupRuntime.includes('.finally(() => appEl?.classList.remove("mobile-map-initializing"))')
      || !startupRuntime.includes('.app.mobile-map-initializing .mobile-map-shell::after')
      || !startupRuntime.includes('content: "Loading map\\2026"')
      || !startupRuntime.includes('pointer-events: auto')) {
    throw new Error("Bundled Android runtimes must shield the unfinished map without blocking ready search and saved content.");
  }
}
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
requireText("CaptureFileProvider.createPlantCaptureUri(this)", "Plant camera output must use app-private storage instead of unreliable MediaStore output.");
requireText('intent.setClipData(ClipData.newRawUri("plant-photo", pendingPlantBridgeCameraUri))', "Plant camera must receive the private output URI through ClipData as well as EXTRA_OUTPUT.");
requireText("CaptureFileProvider.createWebCaptureUri(this)", "Web file-input camera output must use the same compatible private capture path.");
requireText("deliverPlantBridgePhoto(uri, attempt + 1)", "Plant camera output must briefly retry a vendor camera write before reporting failure.");
requireText("Plant photo was cancelled.", "Android Back from Plant ID camera must return to the draft as a cancellation, not close the app.");
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
    || !nativeCommentPhotoCompat.includes('bridge.takeCommentPhoto(bridgeToken)')
    || !nativeCommentPhotoCompat.includes('new DataTransfer()')
    || !nativeCommentPhotoCompat.includes('input.dispatchEvent(new Event("change", { bubbles: true }))')) {
  throw new Error("Native comment camera compatibility must own click routing and a file-input delivery fallback.");
}
if (!appBridge.includes("public void takeCommentPhoto(String token)") || !appBridge.includes("COMMENT_BRIDGE_CAMERA_PERMISSION_REQUEST")) {
  throw new Error("Android bridge must expose the dedicated comment-camera action.");
}
if (!appBridge.includes("public void chooseCommentPhoto(String token)") || !source.includes("COMMENT_BRIDGE_PICKER_REQUEST")) {
  throw new Error("Android bridge must expose a dedicated comment-photo library action.");
}
requireText("Intent.ACTION_OPEN_DOCUMENT", "Comment photo selection must use the durable Android document picker.");
requireText("Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION", "Comment photo selection must request persistable read access.");
requireText("deliverPickedCommentPhoto(data.getData())", "Selected comment photos must be imported while the picker grant is active.");
if (!bundledMobileJs.includes("window.AndroidApp.chooseCommentPhoto(token)")) {
  throw new Error("The bundled mobile runtime must use the token-protected native comment-photo library bridge.");
}
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
  if (!document.includes("const geometry = state.landMaskData?.geometry || null;")
      || !document.includes("!geometry) return false;")) {
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
if (!bundledMobileCss.includes("body.native-android-app .plant-observation-panel[open]")
    || !bundledMobileCss.includes("padding-bottom: max(56px, calc(var(--app-bottom-safe) + 16px));")
    || !bundledMobileCss.includes("scroll-padding-bottom: max(72px, calc(var(--app-bottom-safe) + 32px));")
    || !bundledMobileCss.includes("body.native-android-app .plant-camera-controls")) {
  throw new Error("Bundled Android Plant ID controls must clear three-button system navigation even during an incomplete inset update.");
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
    || !bundledMobileJs.includes("const MOBILE_BIOGRAPHY_PATH_PREFERENCE_VERSION = 1;")
    || !bundledMobileJs.includes("const hasCurrentBiographyPathPreference = saved.biographyPathsPreferenceSet === true")
    || !bundledMobileJs.includes("settings.showBiographyPaths = hasCurrentBiographyPathPreference")
    || !bundledMobileJs.includes(": false;\n      settings.biographyPathsPreferenceSet = hasCurrentBiographyPathPreference;")
    || !bundledMobileJs.includes("settings.biographyPathsPreferenceVersion = MOBILE_BIOGRAPHY_PATH_PREFERENCE_VERSION;")
    || !bundledMobileJs.includes("const MOBILE_BIOGRAPHY_ICON_PREFERENCE_VERSION = 2;")
    || !bundledMobileJs.includes("const hasCurrentBiographyIconPreference = saved.biographyIconsPreferenceSet === true")
    || !bundledMobileJs.includes("settings.showBiographyIcons = hasCurrentBiographyIconPreference")
    || !bundledMobileJs.includes("settings.biographyIconsPreferenceVersion = MOBILE_BIOGRAPHY_ICON_PREFERENCE_VERSION;")
    || !bundledMobileJs.includes("state.settings.showBiographyPaths = nextVisible;")
    || !bundledMobileJs.includes("state.settings.biographyPathsPreferenceSet = true;")
    || !bundledMobileJs.includes("state.settings.showBiographyIcons = nextVisible;")
    || !bundledMobileJs.includes("state.settings.biographyIconsPreferenceSet = true;")
    || !bundledMobileJs.includes("const items = mobileBiographyIconsEnabled() ? mobileMovingBiographyItems() : [];")
    || !bundledMobileJs.includes("ensureMobileMovingBiographyMarkers();")
    || !bundledMobileJs.includes("state.settings.layerCategories = {};")
    || !bundledMobileJs.includes("state.settings.eraCategories = {};")
    || !bundledMobileJs.includes("mobileLayerEnableAllBtn.disabled = allOn || !bulkActionsReady")
    || !bundledMobileJs.includes("Date.now() < mobileLayerBulkReadyAt")
    || !bundledMobileJs.includes("mobileLayerBulkReadyAt = Date.now() + 400;")) {
  throw new Error("Bundled Android labels must keep biography paths and icons independent, default paths off and icons on, preserve later explicit preferences, and include both in bulk controls.");
}
if (!bundledMobileJs.includes("mobileMovingMarkerPausedAt: 0")
    || !bundledMobileJs.includes("mobileMovingMarkerPausedDurationMs: 0")
    || !bundledMobileJs.includes("function stopMobileMovingFeatureAnimation(now = performance.now())")
    || !bundledMobileJs.includes("window.clearTimeout(state.mobileMovingMarkerTimer)")
    || !bundledMobileJs.includes("const interval = nativeMapBridgeAvailable() ? mobileNativeMovingMarkerIntervalMs() : MOBILE_MOVING_MARKER_INTERVAL_MS")
    || !bundledMobileJs.includes("state.mobileMovingMarkerTimer = window.setTimeout(tick, interval)")
    || bundledMobileJs.includes("window.requestAnimationFrame(tick)")
    || !bundledMobileJs.includes("state.mobileMovingMarkerPausedDurationMs += Math.max(0, now - pausedAt)")
    || !bundledMobileJs.includes("const motionNow = Math.max(0, now - (state.mobileMovingMarkerPausedDurationMs || 0))")
    || !bundledMobileJs.includes("syncMobileMovingFeatureVisibility(performance.now())")) {
  throw new Error("Bundled Android moving features must use due-work timers, pause in the background, and resume without rushing along their routes.");
}
if (!nativeMapController.includes("if (!boundsChanged && !occlusionChanged && !rootChanged && !visibilityChanged) return;")
    || !nativeMapController.includes("regionsJson.equals(lastBlockedTouchRegionsJson)")) {
  throw new Error("Native map layout and touch-region updates must skip unchanged observer/poll snapshots.");
}
if (!nativeMapController.includes(".setPrefetchesTiles(false)")) {
  throw new Error("Native Android map rendering must skip off-screen tile prefetch.");
}
if (!nativeMapController.includes("String initialTerritories = usingOnlineArchive")
    || !nativeMapController.includes("String initialSitePoints = usingOnlineArchive")
    || !nativeMapController.includes("String initialLabels = usingOnlineArchive")
    || !nativeMapController.includes("? EMPTY_FEATURE_COLLECTION")
    || !nativeMapController.includes("addBundledMapIconBatch(style, assets, 0, 0)")
    || !nativeMapController.includes("BUNDLED_ICON_BATCH_SIZE = 4")
    || !nativeMapController.includes("mapView.postDelayed(")
    || nativeMapController.includes('readAsset("assets/data/mobile-site-geometry.json")')
    || !nativeMapController.includes('readAsset("map/ancestral-territory-fallback.json")')) {
  throw new Error("Online native startup must avoid duplicate bundled map sources and pace icon decoding across frames.");
}
if (!bundledMobileJs.includes("const baseSignature =")
    || !bundledMobileJs.includes("const transientSignature =")
    || !bundledMobileJs.includes("nativeMapBaseRevision")
    || !bundledMobileJs.includes("nativeMapPointRevision")
    || !bundledMobileJs.includes("function scheduleNativeMapTransientStateSync")
    || !bundledMobileJs.includes("!state.nativeMapBaseSignature")
    || !bundledMobileJs.includes("invalidateMapSourceCache({ nativeBase: false })")
    || !bundledMobileJs.includes("baseSignature,\n        transientSignature,")
    || !bundledMobileJs.includes('typeof window.AndroidApp.syncNativeMapTransientState === "function"')
    || !bundledMobileJs.includes("JSON.stringify(transientPayload)")) {
  throw new Error("APK map state must separate stable map layers from selected-site, user-location, and community updates.");
}
if (!bundledMobileCss.includes(".mobile-timeline .mobile-learning-feed")
    || !bundledMobileCss.includes("padding-right: 38px")
    || !bundledMobileCss.includes("width: 40px")
    || !bundledMobileCss.includes("transform: scaleX(0.58)")) {
  throw new Error("The inactive APK Timeline must reserve a right gutter and keep its tapered position trace visible.");
}
if (!bundledMobileJs.includes("openFeature(kind, key, mapCenter = null)")
    || !bundledMobileJs.includes("openWikiArticle(state.wikiBySlug.get(slug) || movingArticle || slug, {")
    || !bundledMobileJs.includes("mapCenter: selectedMapCenter")
    || !bundledMobileJs.includes("? { focus: false, mapCenter: selectedMapCenter }")) {
  throw new Error("Native APK map taps must preserve moving-feature coordinates and center selected content within the visible panel-aware map area.");
}
if (!nativeMapController.includes('private String lastBaseStateSignature = "";')
    || !nativeMapController.includes("boolean baseStateChanged = baseSignature.isEmpty() || !baseSignature.equals(lastBaseStateSignature);")
    || !nativeMapController.includes("if (baseStateChanged) {")
    || !nativeMapController.includes('Log.d(LOG_TAG, "Applied transient native map state"')) {
  throw new Error("APK site selection must update transient sources without rebuilding all native map layers.");
}
if (!appBridge.includes("public void syncNativeMapTransientState(String token, String stateJson)")
    || !source.includes("void syncNativeMapTransientState(String stateJson)")
    || !nativeMapController.includes("void applyTransientState(String stateJson)")
    || !nativeMapController.includes('payload.has("sitePoints")')
    || !nativeMapController.includes('setSource(style, SITE_POINT_SOURCE_ID, applyBundledSiteIconKeys(payload.optJSONObject("sitePoints")))')
    || !nativeMapController.includes('payload.has("labels")')
    || !nativeMapController.includes('Log.d(LOG_TAG, "Applied compact transient native map state"')) {
  throw new Error("APK must route compact selection/location updates without replacing the cached full map state.");
}
if (!bundledMobileJs.includes("const mobileMovingRouteModelCache = new WeakMap();")
    || !bundledMobileJs.includes("function mobileMovingRouteModel(route = [])")
    || !bundledMobileJs.includes("mobileMovingRouteModelCache.set(route, model)")
    || !bundledMobileJs.includes("mobileMovingLandStateCache: new Map()")
    || !bundledMobileJs.includes("state.mobileMovingLandStateCache.has(cacheKey)")
    || !bundledMobileJs.includes("MOBILE_MOVING_LAND_CACHE_MAX")) {
  throw new Error("Bundled Android moving features must reuse route geometry and bounded shoreline results.");
}
const openSiteStart = bundledMobileJs.indexOf("    async function openSite(slug, options = {}) {");
const openSiteEnd = bundledMobileJs.indexOf("\n    function closeDetail(options = {})", openSiteStart);
const openSiteImplementation = openSiteStart >= 0 && openSiteEnd > openSiteStart
  ? bundledMobileJs.slice(openSiteStart, openSiteEnd)
  : "";
if (!openSiteImplementation
    || openSiteImplementation.includes("renderList();")
    || !openSiteImplementation.includes("syncNearbySelectedCard(slug);")
    || !openSiteImplementation.includes("site = await detailPromise;")
    || !openSiteImplementation.includes("void timelinePromise.then(() =>")
    || !openSiteImplementation.includes("void sourceListPromise.then(sourceList =>")
    || !openSiteImplementation.includes("void Promise.all([\n          refreshRemoteSiteVisitsForProfileSite")) {
  throw new Error("Bundled Android site opening must avoid feed rebuilds and run detail work concurrently without blocking on contributor refreshes.");
}
if (!bundledMobileJs.includes("async function refreshDiscussionSourceData(sourceType, item, options = {})")
    || !bundledMobileJs.includes("const DISCUSSION_SOURCE_REFRESH_TTL_MS = 45000;")
    || !openSiteImplementation.includes('refreshDiscussionSourceData("site", site)')
    || openSiteImplementation.includes("refreshCommentsNow({ rerender: false })")) {
  throw new Error("Android listing taps must refresh only the open discussion instead of refetching all public comments and plant observations.");
}
if (!source.includes("body.mobile-detail-open .mobile-view-tabs,body.mobile-detail-open .mobile-timeline,body.mobile-detail-open .list-panel{visibility:hidden!important;pointer-events:none!important;}")
    || source.includes("header>.search-autocomplete{display:block!important;}")
    || !source.includes("body.native-android-app.mobile-detail-open:not(.mobile-profile-map-mode) .app header>:not(.title-row){display:none!important;}")
    || !source.includes("body.native-android-app:not(.tablet-landscape) .detail.drawer-half{--detail-drawer-height:min(48dvh")
    || source.includes("body.mobile-detail-open .app{grid-template-rows:auto minmax(0,1fr) 0 0!important;}")) {
  throw new Error("Android detail panels must preserve the map grid rectangle instead of resizing it during a site tap.");
}
if (!bundledMobileCss.includes("body.native-android-app:not(.tablet-landscape) .detail.drawer-half")
    || !bundledMobileCss.includes("--detail-drawer-height: min(48dvh")
    || !bundledMobileJs.includes('const halfRatio = isNativeAndroidApp() && !document.body.classList.contains("tablet-landscape") ? 0.48 : 0.58;')
    || !bundledMobileJs.includes('scheduleNativeMapStateSync("panel-layout", 0);')) {
  throw new Error("Android portrait detail mode must use the smaller drawer and resync the native map after header compaction.");
}
for (const [label, document] of [
  ["bundled fallback", bundledApp]
]) {
  if (!document.includes("Biography paths</span>")
      || !document.includes("Biography icons</span>")
      || !document.includes('id="mobile-layer-biography-paths" type="checkbox" checked')
      || !document.includes('id="mobile-layer-biography-icons" type="checkbox" checked')
      || !document.includes("const items = mobileBiographyIconsEnabled() ? mobileMovingBiographyItems() : [];")) {
    throw new Error(`${label} must expose independent Biography paths and default-on Biography icons controls.`);
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
    || !bundledMobileJs.includes('if (state.mobilePanelState !== "collapsed")')
    || !bundledMobileJs.includes('setMobileBottomPanelState("collapsed");')) {
  throw new Error("Bundled Android panel controls must retain a safe map strip and let Back dismiss any open bottom panel.");
}
if (!bundledMobileJs.includes('storySavePanelEl?.classList.contains("open")')
    || !bundledMobileJs.includes("closePlantPhotoViewer();")
    || !bundledMobileJs.includes("state.researchQuestionInstance.close?.();")
    || !bundledMobileJs.includes('searchEl?.setAttribute("aria-expanded", "false")')
    || !bundledMobileJs.includes("hideMobileStartupSpotlight();")) {
  throw new Error("Bundled Android Back handling must dismiss the topmost app overlay before reaching the activity root.");
}
requireText(expectedUrl, `Android shell must load ${expectedUrl}.`);
requireText("new AlertDialog.Builder(this)", "Android root Back must use a native confirmation dialog.");
requireText("R.string.exit_app_title", "Android exit confirmation must use the app's Exit app title.");
requireText("R.string.exit_app_message", "Android exit confirmation must explain what will exit.");
requireText("R.string.exit_app_action", "Android exit confirmation must provide an explicit Exit action.");
requireText("showExitConfirmation();", "Android Back must route an unhandled app root through exit confirmation.");
requireText("backInvokedCallback = this::handleAppBackNavigation;", "Android 13+ Back must use the supported platform callback.");
requireText("registerOnBackInvokedCallback(", "Android 13+ Back callback must be registered.");
requireText("unregisterOnBackInvokedCallback(backInvokedCallback)", "Android Back callback must be released with the activity.");
if (/public void onBackPressed\(\)[\s\S]*?webView\.canGoBack\(\)/.test(source)) {
  throw new Error("Android root Back must not expose internal WebView loading history instead of the exit confirmation.");
}
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
requireText("OFFLINE_BASE_URL", "Android shell must keep a stable same-origin base URL for bundled offline data files.");
requireText('String bundledUrl = OFFLINE_BASE_URL + "mobile-app-live.html?"', "Android shell must keep the normal full mobile shell when it switches to bundled offline mode.");
requireText('"/app/offline-app.html".equals(path)', "Android shell must serve the offline document directly from APK assets.");
requireText('"/app/mobile-app-live.html".equals(path)', "Android native map must serve the full bundled shell from the intercepted app-origin path.");
requireText("OFFLINE_RENDER_MAX_ATTEMPTS", "Android shell must bound its offline paint checks.");
requireText("return app&&archiveReady?'painted':'waiting'", "Android shell must verify the complete saved map index instead of generic body text before uncovering the WebView.");
requireText("OFFLINE_RENDER_DEADLINE_MS", "Android shell must retain a native deadline when a failed renderer never returns JavaScript callbacks.");
requireText("offlineRenderDeadline", "Android shell must escape a permanently unavailable WebView renderer.");
requireText("showWebViewCompatibilityFallback", "Android shell must provide an app-owned fallback when WebView cannot render.");
requireText("onRenderProcessGone", "Android shell must recover visibly when Android terminates the WebView renderer.");
requireText("Open On This Site in browser", "Android shell must offer the full site in a browser when its embedded renderer cannot start.");
requireText("Intent.ACTION_VIEW", "Android shell must launch the browser compatibility route without requiring device settings changes.");
requireText("LIVE_STARTUP_FALLBACK_DELAY_MS = 22000", "Android shell must let the bounded page-readiness probe finish before falling back on a cold validated connection.");
requireText("if (!loadingBundledFallback && isAppShellUrl(url))", "Android shell must restart the readiness allowance when the main WebView page actually begins loading.");
requireText("scheduleLiveStartupFallback();", "Android shell must schedule a bounded live startup fallback.");
requireText("Live startup timer reached; checking the rendered app before fallback.", "Android shell must probe a rendered live page before replacing it with the offline fallback.");
requireText("prepareAndValidateAppShell(webView, currentUrl);", "Android startup timeout must recover delayed onPageFinished callbacks without trapping users behind the loading cover.");
requireText("prepareAndValidateAppShell(view, url);", "Android shell must begin readiness checks when visible content commits instead of waiting indefinitely for map resources to finish.");
requireText('value.contains("starting") || value.contains("empty")', "Android shell must keep probing transitional DOM states within the bounded readiness window.");
requireText("appReadinessProbeActive && url.equals(appReadinessProbeUrl)", "Android shell must keep one bounded readiness probe chain per navigation.");
requireText("var root=document.documentElement;if(root)", "Android tablet layout injection must tolerate a transitional page without an HTML root.");
requireText("var root=document.head||document.documentElement;if(!root)return;root.appendChild(s);", "Android shell panel protection must tolerate a transitional page without a DOM root.");
requireText('showLoadingCover("Opening saved map...")', "Android shell must identify the saved-map fallback while it opens.");
requireText("registerConnectivityMonitoring();", "Android shell must start runtime connectivity monitoring.");
requireText("registerDefaultNetworkCallback(connectivityCallback)", "Android shell must monitor the active network on Android 7 and newer.");
requireText("connectivityManager.registerNetworkCallback(request, connectivityCallback)", "Android shell must monitor connectivity on Android 6.");
requireText("NET_CAPABILITY_VALIDATED", "Android shell must require a validated network before loading the live shell.");
requireText("unregisterConnectivityMonitoring();", "Android shell must release its network callback when destroyed.");
requireText("validated == lastValidatedNetworkState", "Android shell must deduplicate repeated network callback events.");
requireText("liveRecoveryAttemptedForCurrentNetwork", "Android shell must prevent overlapping live recovery attempts.");
requireText("VALIDATED_NETWORK_STABLE_DELAY_MS", "Android shell must debounce validated-network recovery.");
requireText("LIVE_RECOVERY_RETRY_DELAY_MS", "Android shell must back off before retrying a failed live recovery.");
requireText("validatedNetworkRecoveryRetry", "Android shell must retry a validated connection that returned to fallback.");
requireText("Live recovery returned to fallback; scheduling a bounded retry.", "Android shell must not remain offline forever after one slow live recovery.");
requireText("NETWORK_LOSS_GRACE_DELAY_MS", "Android shell must allow brief Wi-Fi/cellular handoffs before falling back.");
requireText("|| !loadingBundledFallback", "Android shell must only recover live from an active fallback after validation.");
requireText("requestBundledFallbackPreservingActiveWork", "Android shell must preserve active work before replacing a live shell.");
requireText("__nliCaptureAndroidLifecycleSnapshot", "Android shell must capture the current app state before a connectivity transition.");
requireText("active-work", "Android shell must defer offline fallback while a form has unsaved changes.");
requireText("ACTIVE_WORK_RECHECK_DELAY_MS", "Android shell must recheck deferred fallback without a reload loop.");
requireText("scheduleNetworkStateEvaluation(\"resume\");", "Android shell must reconcile connectivity changes that occurred while its WebView was paused.");
requireText("APP_READINESS_MAX_ATTEMPTS", "Android shell must wait for usable content instead of accepting an empty title shell.");
requireText("document.querySelector('.offline-map-index')", "Android readiness must verify that the offline place index rendered.");
requireText("document.querySelector('[data-offline-region]')", "Android readiness must accept the usable offline region browser before a nearby-location result exists.");
requireText("(?:saved|mapped) places/i.test(offlineStatus)", "Android readiness must accept either bundled offline archive after its place data renders.");
requireText("app-readiness-timeout", "Android shell must fall back when the live page never produces usable content.");
requireText("if (!loadingBundledFallback) return null;", "Android live mode must use deployed assets instead of stale APK-packaged site data.");
requireText("onReceivedHttpError", "Android shell must fall back when the live mobile archive returns an HTTP error.");
requireText("isSiteGroundChallengeUrl", "Android shell must detect SiteGround challenge redirects and use the bundled fallback.");
requireText("runtimePermissionPromptActive", "Android shell must track active runtime permission prompts.");
requireText("locationPermissionDeniedForSession", "Android shell must not immediately repeat a denied location prompt.");
requireText("Deferring live startup fallback while a runtime permission prompt is open.", "Android shell must not replace the live shell while a permission dialog is open.");
requireText("Deferring app readiness fallback while a runtime permission prompt is open.", "Android shell must pause readiness fallback while a permission dialog is open.");
requireText("finishRuntimePermissionPrompt();", "Android shell must restart readiness checks after a permission dialog resolves.");
requireText("loadBundledFallback(\"siteground-challenge-start\")", "Android shell must switch to the bundled fallback as soon as SiteGround challenge navigation starts.");
requireText("shouldIgnoreLifecycleMainFrameReload", "Android shell must ignore non-explicit main-frame reloads after the app has loaded.");
requireText("appShellLoaded = true;", "Android shell must remember when the app shell has loaded.");
requireText('"directus.nativelongisland.com".equalsIgnoreCase(host)', "Android shell must treat the VPS-hosted app shell as an archive host.");
requireText('"nativelongisland.com".equalsIgnoreCase(host) && path != null && path.startsWith("/assets/")', "Android shell must not intercept Directus root asset URLs as bundled app assets.");
requireText('path.startsWith("/app/assets/")', "Android shell must serve VPS app-shell assets from the bundled APK when available.");
requireText('"/app/long-island-land-mask-lite.json".equals(path)', "Android shell must serve the compressible lightweight VPS land mask from the bundled APK.");
requireText("loadingBundledFallback && \"/app/mobile-app-live.html\".equals(path)", "Android shell must not intercept the live mobile archive unless the fallback is active.");
requireText("loadingBundledFallback && \"/mobile-app.html\".equals(path)", "Android shell must serve the full bundled archive when live Directus startup falls back.");
requireText("loadingBundledFallback && \"/app/offline-app.html\".equals(path)", "Android shell must serve the lightweight offline archive through its bundled HTTPS origin.");
requireText('assetName = "mobile-app-live.html";', "Android shell must reuse the modular bundled shell for the legacy fallback URL.");
for (const excludedAsset of ["mobile-app.html", "mobile-app-live-bundled.html", "long-island-land-mask.geojson", "native-long-island-map.js"]) {
  if (!gradleBuild.includes(excludedAsset)) throw new Error(`Release packaging must exclude redundant asset ${excludedAsset}.`);
}
if (!gradleBuild.includes("minifyEnabled = true")
    || !gradleBuild.includes("shrinkResources = true")
    || !gradleBuild.includes('proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"')) {
  throw new Error("Release packaging must retain R8 code and resource shrinking with the project keep rules.");
}
if (!bundledMobileJs.includes("const apkSnapshotMode = isApkSnapshotMode();")
    || !bundledMobileJs.includes("apkSnapshotMode\n            ? Promise.resolve({ data: [] })")) {
  throw new Error("The modular APK snapshot must not block cold offline startup on Directus-only configuration requests.");
}
requireText("mobile-app-live.html", "Android shell must include the lightweight Directus-backed mobile app fallback asset.");
if (!lightweightOfflineApp.includes("offline-text-mode")
    || !lightweightOfflineApp.includes("offline-map-index")
    || !lightweightOfflineApp.includes("mobile-site-index.json")
    || !lightweightOfflineApp.includes("mobile-site-centers.json")
    || !lightweightOfflineApp.includes("mobile-wiki-index.json")) {
  throw new Error("Lightweight APK fallback must render the saved map and text indexes without online application startup.");
}
if (lightweightOfflineApp.includes('"assets/data/mobile-site-geometry.json"')) {
  throw new Error("Lightweight APK fallback must use the compact center index instead of parsing full polygon geometry during startup.");
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
if (!lightweightOfflineApp.includes('src="assets/js/shared-search-utils.js"')
    || !lightweightOfflineApp.includes('src="assets/js/offline-archive-utils.js"')
    || !lightweightOfflineApp.includes("OFFLINE.prepareArchive")
    || !lightweightOfflineApp.includes("OFFLINE.filterArchive")
    || !lightweightOfflineApp.includes("OFFLINE_QUERY_CACHE_LIMIT=24")
    || !offlineArchiveUtils.includes("function prepareArchive(")
    || !offlineArchiveUtils.includes("function filterArchive(")
    || !offlineArchiveUtils.includes("searchUtils.prepareEntry")
    || !offlineArchiveUtils.includes("searchUtils.rankEntries")
    || !bundledSharedSearchUtils.includes("normalize(\"NFD\")")
    || !bundledSharedSearchUtils.includes("replace(/[^a-z0-9]+/g, \" \")")) {
  throw new Error("Lightweight APK fallback must reuse the prepared online search model and a bounded query cache for forgiving offline matches.");
}
if (!lightweightOfflineApp.includes('id="search-suggestions"')
    || !lightweightOfflineApp.includes("renderSuggestions()")
    || !lightweightOfflineApp.includes('replace(/[_-]+/g," ")')
    || !lightweightOfflineApp.includes('event.key==="Enter"')
    || !lightweightOfflineApp.includes("showArchive({maximize:true})")
    || !lightweightOfflineApp.includes("if(!suggestions.hidden){hideSuggestions();return true}")) {
  throw new Error("Lightweight APK fallback must retain online-style autocomplete, keyboard Search submission, and Back dismissal behavior.");
}
if (!offlineInsetAudit.includes("getSafeInsetBottom")
    || !offlineInsetAudit.includes("result.detail.safe")
    || !offlineInsetAudit.includes("nativeInsetsValid")) {
  throw new Error("Android regression tooling must exercise the offline archive against native system bars.");
}
if (!lightweightOfflineApp.includes("window.onAndroidBackPressed=()=>")
    || !lightweightOfflineApp.includes('document.querySelector(".mobile-more-menu[open]")')
    || !lightweightOfflineApp.includes("if(!detail.hidden){closeDetail();return true}")
    || !lightweightOfflineApp.includes('if(!app.classList.contains("panel-collapsed")){showMap();return true}')) {
  throw new Error("Lightweight APK fallback must dismiss its menu, detail, and saved-place panel before exit confirmation.");
}
if (!offlineParityAudit.includes("sharedStylesheet")
    || !offlineParityAudit.includes("hasOnlineShellStructure")
    || !offlineParityAudit.includes("panel-collapsed")
    || !offlineParityAudit.includes("panel-maximized")
    || !offlineParityAudit.includes("lowercaseClose")
    || !offlineParityAudit.includes("ma's house")) {
  throw new Error("Android regression tooling must compare the offline archive with the online APK shell structure and controls.");
}
if (lightweightOfflineApp.length > 180000) {
  throw new Error("Lightweight APK fallback must remain small enough for fast no-signal startup.");
}
requireText("long-island-land-mask-lite.json", "Android shell must include the lightweight land mask asset.");
requireText("BuildConfig.MAPBOX_TOKEN", "Android shell must inject the Mapbox token from build configuration.");
requireText('"assets/js/mobile-app.js".equals(assetName)', "Android shell must inject the build-time Mapbox token into its local mobile runtime asset.");
requireText("androidApkStartupScript", "Android shell must inject APK startup guards before the bundled app runs.");
requireText("__nliAndroidGeoGateInstalled", "Android shell must install the APK geolocation gate.");
requireText("window.NLI_APK_SNAPSHOT_MODE=true;", "Android shell must mark the bundled app as a snapshot APK.");
requireText("window.NLI_APK_OFFLINE_TEXT_MODE=true;", "Android shell must mark the bundled fallback as a text-first offline archive.");
requireText("window.NLI_DISABLE_DIRECTUS_RUNTIME=true;", "Android shell must disable Directus runtime calls in the snapshot APK.");
requireText("directus.nativelongisland.com", "Android shell must block Directus requests while the APK snapshot is offline.");
requireText("window.__nliAllowGeoUntil=0;", "Android shell must block a new permission prompt until a dedicated user action allows it.");
requireText("window.AndroidApp.hasLocationPermission", "Android shell must reuse an already granted location permission during startup.");
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
  ["if (options.restoreMapState !== true && options.focus !== false)", "APK focus:false listing opens must preserve the visitor's camera."],
  ["function installApkSiteCameraAudit()", "Debug APKs must expose the site-camera stability audit."],
  ["function resizeMobileProfileProgressMap()", "APK contributor mode must resize its overlay without refitting the geographic camera."],
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
if (bundledLiveRuntime.includes("mobileDetailCloseMapTimer") || bundledApp.includes("mobileDetailCloseMapTimer")
    || bundledLiveRuntime.includes("const overviewZoom = 11.25") || bundledApp.includes("const overviewZoom = 11.25")) {
  throw new Error("APK listing close must not schedule or force a camera reset.");
}
if (bundledLiveRuntime.includes("function fitMobileProfileProgressMap()") || bundledApp.includes("function fitMobileProfileProgressMap()")
    || bundledLiveRuntime.includes("state.map.fitBounds(LONG_ISLAND_VIEW_BOUNDS, { padding, maxZoom: 9.2")
    || bundledApp.includes("state.map.fitBounds(LONG_ISLAND_VIEW_BOUNDS, { padding, maxZoom: 9.2")
    || bundledLiveRuntime.includes("mode.camera?.center) state.map.jumpTo")
    || bundledApp.includes("mode.camera?.center) state.map.jumpTo")) {
  throw new Error("APK contributor-map entry and exit must preserve the same center and zoom as the normal map.");
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
requireText("setAcceptThirdPartyCookies(webView, true)", "Android shell must allow the cross-origin SiteGround session needed by the Directus-hosted app shell.");
requireText("settings.setCacheMode(WebSettings.LOAD_DEFAULT)", "Android shell must allow WebView to cache remote map/static resources between launches.");
requireText("FrameLayout root = new FrameLayout(this);", "Android shell must layer a native startup cover over slow cold WebView startup.");
requireText("webView.setBackgroundColor(Color.rgb(238, 243, 237));", "Android shell must use the app theme color behind the WebView during startup.");
requireText("createLoadingCover", "Android shell must create a visible native loading cover before WebView content is ready.");
requireText("loadingCover = createLoadingCover();", "Android shell must attach the native cover during every cold start.");
requireText("root.addView(loadingCover", "Android shell must layer the native cover above the WebView.");
requireText("hideLoadingCover", "Android shell must hide the native loading cover after the app page finishes.");
requireText("onPageCommitVisible", "Android shell must observe the first committed WebView frame.");
requireText("if (!isAppShellUrl(url)) return;", "Android shell readiness validation must ignore privacy, deletion, and other first-party pages.");
requireText("!isAppShellUrl(webView.getUrl())", "Pending shell probes must stop after navigation to a non-shell page.");
if (/onPageCommitVisible\(WebView view, String url\)[\s\S]{0,300}?hideLoadingCover\(\)/.test(source)) {
  throw new Error("Android shell must keep the native cover until the app is interactive, not merely committed.");
}
if (/onPageFinished\(WebView view, String url\)[\s\S]{0,1000}?hideLoadingCover\(\);[\s\S]*?validateLoadedAppShell\(url\)/.test(source)) {
  throw new Error("Android shell must not uncover a partially initialized app at page completion.");
}
requireText('getAssets().open("assets/images/long-island-loading-outline.png")', "Android shell must show the Long Island loading outline during cold startup.");
requireText('loadingCoverLabel.setText(R.string.loading_app);', "Android shell must label the animated Long Island loading screen from a translatable resource.");
requireText("loadingOutlineReveal.postOnAnimation(loadingOutlineRevealFrame)", "Android shell must animate the Long Island loading outline from west to east without depending on animator scale.");
if (!styles.includes('<item name="android:windowBackground">@drawable/launch_background</item>')) {
  throw new Error("Android theme must show a branded launch background while WebView starts.");
}
if (!launchBackground.includes('android:color="#EEF3ED"') || launchBackground.includes('@drawable/ic_launcher_foreground')) {
  throw new Error("Android launch background must be a plain app-theme bridge so it does not duplicate the animated loader.");
}
const ancestralLauncherColors = [
  "#081078", "#66FF00", "#B52CBF", "#F4FFAD", "#26100D", "#AD6323", "#08FFC5",
  "#FF26DB", "#5454FF", "#FFDBF3", "#FFD93D", "#FF1F1F", "#66FF00"
];
if (!launcherBackground.includes("#071A33")) {
  throw new Error("Android launcher icon must retain the dark-blue project background.");
}
if (!launcherForeground.includes("<clip-path")
    || launcherForeground.includes("M54,18c-14.3")
    || launcherForeground.includes("L15.18,24")
    || !launcherForeground.includes('android:strokeColor="#E8F0EA"')
    || ancestralLauncherColors.some(color => !launcherForeground.includes(`android:fillColor="${color}"`))) {
  throw new Error("Android launcher foreground must use the real 13 ancestral-land shapes inside the Long Island silhouette.");
}
if (!launcherMonochrome.includes('android:fillColor="#FFFFFFFF"')
    || launcherMonochrome.includes("M54,18c-14.3")) {
  throw new Error("Android themed icons must use a monochrome Long Island silhouette instead of the old map pin.");
}
if (!legacyLauncher.includes("<clip-path")
    || !legacyRoundLauncher.includes("<clip-path")
    || !legacyLauncher.includes('android:fillColor="#071A33"')
    || !legacyRoundLauncher.includes('android:fillColor="#071A33"')
    || ancestralLauncherColors.some(color => !legacyLauncher.includes(`android:fillColor="${color}"`))
    || ancestralLauncherColors.some(color => !legacyRoundLauncher.includes(`android:fillColor="${color}"`))) {
  throw new Error("Legacy and round Android launchers must receive the same 13-color Long Island icon.");
}
if (!android12Styles.includes('<item name="android:windowSplashScreenAnimatedIcon">@android:color/transparent</item>')
    || !android12Styles.includes('<item name="android:windowSplashScreenBackground">#EEF3ED</item>')) {
  throw new Error("Android 12+ system splash must stay blank so the Long Island loader appears exactly once.");
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
    || !fallbackMatch[0].includes('OFFLINE_BASE_URL + "mobile-app-live.html?"')
    || !fallbackMatch[0].includes('"apk-offline="')
    || !fallbackMatch[0].includes("OFFLINE_BASE_URL")) {
  throw new Error("No-signal startup must open the full bundled mobile shell through the intercepted app-origin URL.");
}
if (!source.includes("nativeMapEnabled = true;")
    || source.includes("nativeMapQaEnabled")
    || source.includes('getBooleanExtra("native_map_qa"')) {
  throw new Error("Release and debug APKs must both use the production native map; it cannot remain behind a QA intent gate.");
}
if (/Thread loader|bundledMobileHtml\(\)/.test(fallbackMatch[0])) {
  throw new Error("No-signal startup must not parse the full bundled online application before showing saved content.");
}
requireText("dispatchTouchEvent", "Android shell must forward app taps into the mobile map.");
requireText("window.onAndroidMapTap", "Android shell must call the mobile map tap bridge.");
requireText('cacheAndroidTouchProbe(event, "down");', "Android shell must consolidate touch-down recovery into one JavaScript bridge call.");
requireText("window.onAndroidTouchProbe", "Android shell must call the consolidated touch probe bridge.");
requireText("window.onAndroidTouchProbe('up'", "Android shell must check the completed touch through the consolidated bridge before map forwarding.");
requireText("missing-map-tap-bridge", "Android shell must log when the mobile map tap bridge is missing.");
requireText("MAP_TAP_BRIDGE_DELAY_MS", "Android shell must delay the native map bridge until WebView UI clicks run.");
requireText("postDelayed", "Android shell must post-delay map tap forwarding to prevent panel click-through.");
requireText("webTouchStartedOnOverlay", "Android shell must retain the touch-down overlay result until the delayed map bridge runs.");
requireText('value.contains("overlay") || value.contains("promo") || value.contains("search-result")', "Android shell must block delayed map recovery for controls identified during touch-down.");
requireText('if (webTouchStartedOnOverlay)', "Android shell must cancel map forwarding when the gesture began on a WebView control.");
if (/cacheAndroid(?:UiOverlay|MobilePromoAction|SearchResult)Tap/.test(source)) {
  throw new Error("Android shell must not retain the three redundant per-touch JavaScript bridge methods.");
}
const touchDispatchMatch = source.match(/private boolean handleWebViewTap[\s\S]*?private String mimeTypeForAsset/);
const touchEvaluateCount = (touchDispatchMatch?.[0].match(/evaluateJavascript\(/g) || []).length;
if (touchEvaluateCount !== 2) {
  throw new Error(`Android touch dispatch has ${touchEvaluateCount} JavaScript call sites; it must keep one map-tap call plus the targeted location long-press call.`);
}
requireText("MotionEvent.ACTION_UP", "Android shell must only forward completed taps.");
requireText("action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_UP", "Android shell must keep map drag move frames out of the tap bridge.");
requireText("boolean isArchiveApp = \"https\".equals(scheme) && \"nativelongisland.com\".equalsIgnoreCase(host);", "Android shell must keep only secure nativelongisland.com navigation inside the APK WebView.");
if (source.includes("applyApkTimelineTrayFix")
    || source.includes("android-apk-timeline-tray-fix")
    || source.includes("android-apk-timeline-fix")) {
  throw new Error("Android shell must not inject the obsolete single-card Timeline tray override into the vertical feed.");
}
const backHandlerMatch = source.match(/private void handleAppBackNavigation\(\) \{[\s\S]*?\n    \}/);
if (!backHandlerMatch
    || !backHandlerMatch[0].includes("window.onAndroidBackPressed && window.onAndroidBackPressed()")
    || !backHandlerMatch[0].includes('if ("true".equals(handled)) return;')
    || !backHandlerMatch[0].includes("showExitConfirmation();")
    || backHandlerMatch[0].includes("webView.canGoBack()")) {
  throw new Error("Android Back must let the web UI dismiss its top layer, then confirm before exiting at the app root.");
}
requireBundledPattern(/function dismissMobileSheet\(sheet, options = \{\}\)[\s\S]*?sheet\.contains\(activeElement\)[\s\S]*?activeElement\.blur\?\.\(\)[\s\S]*?exitMobileProfileMapMode\(\)[\s\S]*?expandedMobileProfileKey = ""[\s\S]*?clearRoute !== false[\s\S]*?return true/, "Bundled Android sheets must share one focus-safe cleanup path that fully exits contributor progress mode.");
requireBundledPattern(/state\.suggestionMapPickMode[\s\S]*?setSuggestionMapPickMode\(false\)[\s\S]*?openSheet\(suggestSiteSheetEl, \{ skipRoute: true \}\)[\s\S]*?return true/, "Bundled Android Back must cancel map-location picking and return to the suggestion form.");
requireBundledPattern(/openSheet\(suggestSiteSheetEl, \{ skipRoute: true \}\)[\s\S]*?const activeSheet = document\.querySelector\("\.sheet\.open"\)[\s\S]*?dismissMobileSheet\(activeSheet\)/, "Bundled Android Back must not shadow the sheet-opening function during map-pick recovery.");
requireBundledPattern(/registerPanelEl && !registerPanelEl\.hidden[\s\S]*?registerPanelEl\.hidden = true[\s\S]*?passwordResetPanelEl && !passwordResetPanelEl\.hidden[\s\S]*?passwordResetPanelEl\.hidden = true/, "Bundled Android Back must dismiss nested registration and password-reset panels before closing the account sheet.");

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
  if ((runtime.match(/(?:^|[^A-Za-z0-9_-])[ps]k\.[A-Za-z0-9._-]+/g) || []).length) {
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
const bundledMobileMarker = 'data-inline-source="assets/js/mobile-app.js"';
if (bundledApp.split(bundledMobileMarker).length !== 2
    || bundledApp.includes('.replace(/\\s+([.,;:!?])/g, "<script data-inline-source=')) {
  throw new Error("Bundled Android embedded fallback must contain one intact inline mobile runtime.");
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
if (!bundledMobileJs.includes("function centerMapOnKnownUserLocation({ zoomIfAlreadyCentered = false } = {})")
    || !bundledMobileJs.includes("duration: 425")
    || !bundledMobileJs.includes("if (centerMapOnKnownUserLocation({ zoomIfAlreadyCentered: isNativeAndroidApp() })) return true;")
    || !bundledMobileJs.includes("positionOptions: { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }")) {
  throw new Error("Bundled mobile JavaScript must recenter immediately from the known user location and use a bounded cached first fix.");
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
requireBundledText('function prepareMobileSiteIconImage(image)', "Bundled Android app must normalize custom marker images before map rendering.");
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
requireBundledText("function showMobilePromo(kind)", "Bundled Android daily feature bubbles must remain explicitly openable.");
if (bundledApp.includes("showRandomMobileStartupSpotlight") || bundledLiveRuntime.includes("showRandomMobileStartupSpotlight")) {
  throw new Error("Bundled Android app must not open a random archive feature over Nearby sites during startup.");
}
requireBundledText("autoPrompt: false", "Bundled Android app must disable the legacy competing question timer.");
requireBundledText("showRestore: false", "Bundled Android app must use the unified question restore bubble.");
requireBundledText('"text-opacity": ["interpolate", ["linear"], ["zoom"], SITE_POINT_LABEL_MIN_ZOOM, 0, SITE_POINT_LABEL_MIN_ZOOM + 0.35, 1]', "Bundled Android point labels must fade in around the local-area zoom threshold.");
requireBundledPattern(/mapSourceRevision:\s*0[\s\S]*?mapSourceAppliedKey:\s*""[\s\S]*?function\s+invalidateMapSourceCache\(options\s*=\s*\{\}\)[\s\S]*?state\.mapSourceRevision\s*\+=\s*1;[\s\S]*?function\s+refreshMobileMapSources\(options\s*=\s*\{\}\)[\s\S]*?state\.mapSourceAppliedKey\s*===\s*sourceKey\)\s*return;[\s\S]*?state\.mapSourceAppliedKey\s*=\s*sourceKey;/, "Bundled Android map source refresh must skip repeated identical GeoJSON setData work.");
requireBundledPattern(/state\.map\.on\("zoomend",\s*\(\)\s*=>\s*\{[\s\S]*?syncMarkers\(\{\s*auxiliary:\s*false\s*\}\);[\s\S]*?syncMapStoryMarkers\(\);[\s\S]*?\}\);/, "Bundled Android zoom should refresh marker offsets once on zoomend without full auxiliary marker work.");
requireBundledPattern(/function\s+mapStoryMarkerOffset\(story\)[\s\S]*?zoom\s*>=\s*11\)\s*return\s*\[0,\s*-22\];[\s\S]*?return\s*\[0,\s*-28\];/, "Bundled Android attached stories must stay visually close to their listing at overview zoom.");
if (/state\.map\.on\("zoom",\s*syncMapStoryMarkers\)/.test(bundledApp) || /state\.map\.on\("zoom",\s*syncMapStoryMarkers\)/.test(bundledLiveApp)) {
  throw new Error("Bundled Android app must not resync story markers on every zoom frame.");
}
requireBundledText('mobilePanelTapBlockUntil: 0', "Bundled Android app must track the panel close tap shield.");
requireBundledText('function blockMobileMapTaps(durationMs = 240)', "Bundled Android app must block the delayed bridge without swallowing the visitor's next map tap.");
requireBundledText('function isAndroidUiOverlayTap(clientX, clientY, elements = null)', "Bundled Android app must reject drawer/header/sheet taps before trying alternate map coordinates.");
requireBundledText('ANDROID_UI_TAP_OVERLAY_SELECTOR', "Bundled Android app must centralize UI overlay tap targets.");
requireBundledText('function blockAndroidUiOverlayMapTapStart(event)', "Bundled Android app must block map forwarding as soon as UI taps start.");
requireBundledText('window.onAndroidUiOverlayTapStart', "Bundled Android app must expose the UI overlay tap bridge to the native shell.");
requireBundledText('window.onAndroidTouchProbe = function onAndroidTouchProbe', "Bundled Android app must consolidate native touch recovery work by gesture phase.");
requireBundledText('function createAndroidTouchProbeContext(viewX, viewY, viewWidth, viewHeight)', "Bundled Android touch probe must cache coordinate and DOM hit-test context.");
if (!bundledSharedActivityUtils.includes('function contentActivityItems(items = [], type, slug)')
    || !bundledSharedActivityUtils.includes('function contentActivityItemKeys(items = [], type, slug)')
    || !bundledSharedActivityUtils.includes('function contentUpdateActivityRecords(items = [])')) {
  throw new Error("Bundled Android app must share unread-content selection, seen-key expansion, and grouped-record helpers with desktop.");
}
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
requireBundledText('nli-mobile-activity-seen-items-v2', "Bundled Android app must persist individual activity items until their connected content is viewed or they are dismissed.");
requireBundledText('function createUnreadActivityTracker(options = {})', "Bundled Android app must include the indexed shared unread activity tracker.");
requireBundledText('const mobileActivityUnreadTracker = ACTIVITY_UTILS.createUnreadActivityTracker({', "Bundled Android app must route unread activity through the shared tracker.");
requireBundledText('return mobileActivityUnreadTracker.count()', "Bundled Android app must count grouped unread activity through one indexed snapshot.");
requireBundledText('data-mobile-activity-dismiss', "Bundled Android activity cards must expose an explicit unread dismissal action.");
requireBundledText('mobile-site-unread-badges', "Bundled Android map must expose per-site unread badges.");
requireBundledPattern(/function ensureMobileUnreadBadgeImages\(\)[\s\S]*?canvas\.width\s*=\s*28[\s\S]*?context\.arc\(14,\s*14,\s*12[\s\S]*?context\.fillText\(label,\s*14,\s*14\.5\)[\s\S]*?pixelRatio:\s*2/, "Bundled Android unread numbers must be baked into compact outline-free icons.");
requireBundledPattern(/id:\s*"mobile-site-unread-badges"[\s\S]*?type:\s*"symbol"[\s\S]*?"icon-image":\s*\["get",\s*"unread_icon"\][\s\S]*?"icon-size":\s*1/, "Bundled Android point unread badges must use their numbered icon.");
requireBundledPattern(/id:\s*"mobile-detail-labels-unread"[\s\S]*?"text-field":\s*\["get",\s*"title"\][\s\S]*?"icon-image":\s*\["get",\s*"unread_icon"\][\s\S]*?"icon-offset":\s*\["interpolate"/, "Bundled Android detail polygons must render their title and numbered badge in one symbol.");
requireBundledPattern(/id:\s*"mobile-territory-labels-unread"[\s\S]*?"text-field":\s*\["get",\s*"title"\][\s\S]*?"icon-image":\s*\["get",\s*"unread_icon"\][\s\S]*?"icon-offset":\s*\["interpolate"/, "Bundled Android territory polygons must render their title and numbered badge in one symbol.");
if (/id:\s*`mobile-\$\{kind\}-unread-badges`/.test(bundledMobileJs)) {
  throw new Error("Bundled Android polygon unread badges must not exist independently from their visible title.");
}
requireBundledPattern(/function promoteMobileUnreadBadgeLayers\(\)[\s\S]*?badgeLayers\.forEach\(layerId[\s\S]*?state\.map\.moveLayer\(layerId\)/, "Bundled Android numbered unread icons must stay above map content.");
requireBundledPattern(/unread_icon:\s*mobileUnreadCountIcon\(unreadCount\)/, "Bundled Android map features must carry a numbered unread icon key.");
requireBundledText('data-mobile-knowledgebase-unread-badge', "Bundled Android Knowledgebase must expose its unread count.");
if (!/\.mobile-menu-content-unread-badge\s*\{[\s\S]*?top:\s*-5px;[\s\S]*?right:\s*-5px;[\s\S]*?min-width:\s*14px;[\s\S]*?height:\s*14px;[\s\S]*?font-size:\s*8px;/.test(bundledMobileCss)) {
  throw new Error("Bundled Android Site List and Knowledgebase unread badges must stay small and clear of their menu labels.");
}
requireBundledPattern(/function\s+bindMobileInteractiveLayer\(layerId,\s*clickHandler\)[\s\S]*?if\s*\(isMobileMapTapBlocked\(\)\)\s*return;[\s\S]*?clickHandler\(event\)/, "Bundled Android menu actions must block same-gesture map layer clicks after the menu closes.");
requireBundledPattern(/function\s+suppressNextAndroidMapTap\(durationMs\s*=\s*900\)[\s\S]*?suppressNextAndroidMapTapUntil[\s\S]*?window\.onAndroidMapTap[\s\S]*?suppressNextAndroidMapTapUntil/, "Bundled Android menu navigation must suppress the delayed native map bridge after the menu disappears.");
requireBundledPattern(/appPageButton\.closest\("\.mobile-more-menu, \.mobile-layer-menu"\)[\s\S]*?suppressNextAndroidMapTap\(\)[\s\S]*?openAppPage\(appPageButton\.dataset\.appPage\)/, "Bundled Android menu navigation must arm the delayed native map-tap suppressor before opening its page.");
if (bundledMobileJs.includes('markMobileActivitySeen();')) {
  throw new Error("Bundled Android app must not clear all activity merely because the Community Activity feed was opened.");
}
requireBundledText('function editedDateLabel(value, options = {})', "Bundled Android app must include shared edited-date labels.");
requireBundledText('ACTIVITY_UTILS.editedDateLabel(latestEditedDate(item), { fallback: DEFAULT_LAST_EDITED_LABEL })', "Bundled Android app must route edited-date labels through shared activity utilities.");
requireBundledText('function siteEditedDate(site = {}, options = {})', "Bundled Android app must include shared edited-date source selection.");
requireBundledText('ACTIVITY_UTILS.siteEditedDate(item, { extended: true })', "Bundled Android app must route mobile edited-date source selection through shared activity utilities.");
requireBundledText('function plantObservationFactRows(fields = {}, match = null, options = {})', "Bundled Android app must include shared plant fact rows.");
requireBundledText('PLANT_UTILS.plantObservationFactRows(fields, match,', "Bundled Android app must route mobile plant fact rows through shared plant utilities.");
requireBundledText('function plantReferenceMatch(value = "", species = plantObservationSpecies, options = {})', "Bundled Android app must include the cached shared plant matcher.");
requireBundledPattern(/function\s+plantObservationGuess[\s\S]*?PLANT_UTILS\.plantGuideMatchFromFields\([\s\S]*?PLANT_OBSERVATION_SPECIES\)/, "Bundled Android plant guesses must use the shared indexed matcher.");
requireBundledText('function commentThreadIndex(comments = [], options = {})', "Bundled Android app must include the shared comment thread index.");
requireBundledText('const commentVoteIndexCache = new WeakMap()', "Bundled Android app must include the cached comment vote index.");
requireBundledPattern(/function\s+discussionHtml\(sourceType,\s*item\)[\s\S]*?COMMENT_UTILS\.commentThreadIndex\(comments,\s*\{\s*excludeRoot:\s*isPlantObservationComment\s*\}\)[\s\S]*?commentThread\.parentFor\(comment\)/, "Bundled Android discussions must use indexed roots, replies, and parents.");
requireBundledPattern(/function\s+mobileActivityCommentThreadHtml\(card\)[\s\S]*?COMMENT_UTILS\.commentThreadIndex\(comments\)/, "Bundled Android activity discussions must use the shared thread index.");
if (/repliesFor\s*=\s*parentId\s*=>[^;]*comments\.filter/.test(bundledMobileJs)) {
  throw new Error("Bundled Android comment threads must not rescan all comments for each parent.");
}
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
requireBundledPattern(/const\s+startupLandMask\s*=\s*window\.NLI_MOBILE_DATA\s*&&\s*!isOfflineTextMode\(\)[\s\S]*?ensureLandMask\(\)[\s\S]*?Promise\.resolve\(null\);[\s\S]*?await\s+loadData\(\);[\s\S]*?await\s+startupLandMask;[\s\S]*?prepareSites\(\);/, "Bundled Android app must prepare its local polygon land mask while the live center-first path defers the network mask.");
requireBundledText('enterkeyhint="search"', "Bundled Android app must request the Android keyboard search action.");
requireBundledText('autocomplete="off"', "Bundled Android app must keep the mobile search input from fighting app results.");
requireBundledText('function openMobileSearchResultsPage()', "Bundled Android app must include an explicit mobile search results page.");
requireBundledPattern(/function\s+openMobileSearchResultsPage\(\)[\s\S]*?searchEl\.blur\(\);[\s\S]*?renderSearchSuggestions\(""\)/, "Bundled Android search must hide autocomplete after submitting results.");
requireBundledPattern(/function\s+renderSearchSuggestions\([^)]*\)[\s\S]*?document\.activeElement\s*!==\s*searchEl[\s\S]*?return\s+hide\(\)/, "Bundled Android autocomplete must stay hidden while search is blurred.");
requireBundledPattern(/function\s+handleMobileSearchFocus\(\)[\s\S]*?state\.lastAutocompleteQuery\s*=\s*null[\s\S]*?refreshMobileSearchSuggestions\(\)/, "Bundled Android search must restore predictions when refocused.");
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
requireBundledPattern(/function\s+startSearchValueWatch\(\)[\s\S]*?document\.activeElement\s*!==\s*searchEl[\s\S]*?setInterval\(\(\)\s*=>[\s\S]*?refreshMobileSearchSuggestions\(\)[\s\S]*?function\s+stopSearchValueWatch\(options\s*=\s*\{\}\)[\s\S]*?clearInterval\(state\.searchValueWatchTimer\)/, "Bundled Android app must poll autocomplete only while the search field is focused.");
requireBundledText('function mobileAutocompleteCandidates(rawQuery)', "Bundled Android app must derive autocomplete candidates from the current field query.");
requireBundledText('state.mobileSearchIndex = [...state.sites, ...wikiSearchEntries];', "Bundled Android app must prepare one normalized site and wiki search index.");
requireBundledPattern(/fetchMobileWikiIndexRows\(\)[\s\S]*?state\.wikiArticles\s*=\s*\(response\.data\s*\|\|\s*\[\]\)\.map\(sanitizePublicWikiArticle\)[\s\S]*?rebuildMobileSearchIndex\(\)/, "Bundled Android app must add deferred knowledgebase articles to the live search index as soon as they load.");
requireBundledText('return mobileSearchCandidates(rawQuery);', "Bundled Android autocomplete must reuse the current indexed result cache.");
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
requireBundledText('function installNativeAndroidSearchWatch()', "Bundled Android app must initialize native Android search values.");
requireBundledText("state.nativeAndroidSearchWatchInstalled = true;", "Bundled Android app must install the focus-owned search watcher once.");
requireBundledPattern(/document\.addEventListener\("visibilitychange"[\s\S]*?document\.hidden[\s\S]*?stopSearchValueWatch\(\{\s*silent:\s*true\s*\}\)[\s\S]*?document\.activeElement\s*===\s*searchEl[\s\S]*?startSearchValueWatch\(\)/, "Bundled Android app must suspend search polling while backgrounded and resume it only for a focused search field.");
requireBundledText('refreshMobileSearchSuggestions();', "Bundled Android app must persistently refresh native Android autocomplete.");
requireBundledText('window.__nliHydrateMobileSiteGeometryAfterStartup = () => {', "Bundled Android app must expose post-startup detailed geometry hydration.");
requireBundledText('if (!isOfflineTextMode() && !nativeAndroid) idleTask(hydrateMobileSiteGeometry);', "Bundled Android app must not parse detailed polygons before the native first map is usable.");
requireBundledPattern(/const\s+eventSignature\s*=\s*exhibitFeatures\.map[\s\S]*?const\s+baseSignature\s*=\s*`[^`]+bio-paths:[^`]+`[\s\S]*?const\s+transientSignature\s*=\s*`[^`]+events:\$\{eventSignature\}`/, "Bundled Android calendar changes must remain outside the static native-map signature.");
requireBundledPattern(/const\s+transientPayload\s*=\s*\{[\s\S]*?events:\s*nativeMapFeatureCollection\(exhibitFeatures\)[\s\S]*?syncNativeMapTransientState/, "Bundled Android calendar markers must use compact native-map updates after initial state.");
requireBundledPattern(/function\s+nativeMapUnreadBadges\([\s\S]*?mobileContentUnreadCount\("site",\s*slug\)[\s\S]*?transientPayload\.unreadBadges\s*=\s*nativeMapUnreadBadges\(\)/, "Bundled Android unread changes must use compact slug/count updates.");
if (/nativeMapPointSignature\s*!==\s*pointSignature[\s\S]{0,400}?transientPayload\.(?:sitePoints|labels)\s*=/.test(bundledMobileJs)) {
  throw new Error("Bundled Android unread changes must not retransmit every native site point or label.");
}
if (!nativeMapController.includes('payload.has("unreadBadges")')
    || !nativeMapController.includes("applyUnreadBadges(cachedState.optJSONObject(\"sitePoints\"), unreadBadges)")) {
  throw new Error("Native MapLibre must apply compact unread updates to its cached point and label sources.");
}
if (/const\s+baseSignature\s*=\s*`[^`]*events:/.test(bundledMobileJs)) {
  throw new Error("Bundled Android calendar markers must not force a full static native-map rebuild.");
}
if (!nativeMapController.includes('boolean eventsUpdated = payload.has("events")')
    || !nativeMapController.includes('setSource(style, EVENT_SOURCE_ID, payload.optJSONObject("events"))')) {
  throw new Error("Native MapLibre must apply calendar markers through the compact transient-state path.");
}
requireBundledPattern(/const\s+SHORELINE_REFINED_GEOMETRY_NOTE[\s\S]*?const\s+SHINNECOCK_HILLS_REFINED_GEOMETRY_NOTE[\s\S]*?function\s+shorelineRefinementNoteForSite[\s\S]*?geometry_refinement:\s*shorelineRefinementNoteForSite\(site\)/, "Bundled Android polygon styling must define and attach its shoreline-refinement values before MapLibre evaluates them.");
requireBundledText('Profile activity sync will retry later.', "Bundled Android app must keep profile activity sync retry logging.");
requireBundledText('state.profileActivitySynced = false;\n          return false;', "Bundled Android app must leave failed profile sync retryable.");
requireBundledPattern(/state\.profileActivitySynced\s*=\s*includeCommunity\s*&&\s*allResponsesFresh\(\[/, "Bundled Android public activity must mark a completed anonymous load as synced.");
if (/profileActivitySynced\s*=\s*includeCommunity\s*&&\s*Boolean\(state\.profile\s*&&\s*allResponsesFresh\(/.test(bundledApp) || /profileActivitySynced\s*=\s*includeCommunity\s*&&\s*Boolean\(state\.profile\s*&&\s*allResponsesFresh\(/.test(bundledLiveApp)) {
  throw new Error("Bundled Android app must not schedule a second public activity sync just because the visitor is logged out.");
}
requireBundledText('sorted by proximity', "Bundled Android app must label nearby results as proximity sorted.");
requireBundledText('const STARTUP_LOCATION_ZOOM = NEAR_ME_ZOOM;', "Bundled Android app must open with the Near me zoom level.");
requireBundledText('function nativeLocationPermissionGranted()', "Bundled Android app must check the native permission before startup location use.");
requireBundledText('if (!nativeLocationPermissionGranted()) return false;', "Bundled Android app must not open a new location prompt during startup.");
requireBundledText('data-find-nearby-sites', "Bundled Android app must provide an explicit location action when permission is unavailable.");
if (bundledMobileJs.includes('if (nativeAndroid && !isOfflineTextMode()) await requestStartupLocation();')) {
  throw new Error("Bundled Android app must not request location during startup.");
}
requireBundledText('mobile-startup-spotlight', "Bundled Android app must include the shared daily feature card.");
if (bundledMobileJs.includes('scheduleMobilePromoStartup();')) {
  throw new Error("Bundled Android app must not open a random daily feature over Nearby during startup.");
}
requireBundledText('fitLongIslandMapView("android-startup-outside-long-island")', "Bundled Android app must use the Long Island overview when startup location is outside the project area.");
if (!bundledSharedProfileUtils.includes('const SITE_CHECKIN_RADIUS_MILES = 0.05;')
    || !bundledMobileJs.includes('const SITE_CHECKIN_RADIUS_MILES = Number(PROFILE_UTILS.SITE_CHECKIN_RADIUS_MILES || 0.05);')
    || !bundledSharedProfileUtils.includes('function siteVisitIndex(visits = [], options = {})')
    || !bundledSharedProfileUtils.includes('function pointEventIndex(events = [], options = {})')
    || !bundledSharedProfileUtils.includes('async function syncSiteVisit(options = {})')
    || !bundledMobileJs.includes('PROFILE_UTILS.siteHasRecordedCheckin(state.publicVisits, state.profilePointEvents')
    || !bundledMobileJs.includes('PROFILE_UTILS.syncSiteVisit({')
    || !bundledMobileJs.includes('PROFILE_UTILS.checkinDistanceMessage(miles, { radiusMiles: SITE_CHECKIN_RADIUS_MILES })')) {
  throw new Error("Bundled Android check-ins must share the indexed 0.05-mile state and save model.");
}
if (!bundledLiveRuntime.includes('aria-label="Search sites, towns, and histories"')) {
  throw new Error("Bundled Android search must have an accessible name.");
}
requireBundledText('const SITE_VISIT_ALERT_RADIUS_MILES = 0.5;', "Bundled Android app must alert within half a mile of a site.");
requireBundledText('window.AndroidApp.showNotification', "Bundled Android app must use the native notification bridge.");
requireBundledText('https://nativelongisland.com/privacy-policy.html', "Bundled Android account screen must link to the public privacy policy.");
requireBundledText('https://nativelongisland.com/account-deletion.html', "Bundled Android account screen must expose account and data deletion.");
requireBundledPattern(/action:\s*"password_reset_request"[\s\S]*?reset_url:\s*ROUTE_UTILS\.passwordResetReturnUrl\(window\.location\)/, "Bundled Android password-reset requests must include the clean return route.");
if (!bundledMobileJs.includes('const androidBridgeToken = () => String(window.__NLI_ANDROID_BRIDGE_TOKEN || "")')) {
  throw new Error("Bundled Android mobile runtime must pass the native bridge capability token.");
}
requireBundledText('localStorage.getItem("nli-proximity-alert-date") === todayKey', "Bundled Android app must limit nearby site notifications to once per day.");
const proximityReservation = bundledMobileJs.indexOf('localStorage.setItem("nli-proximity-alert-date", todayKey);', bundledMobileJs.indexOf("function checkProximityAlerts()"));
const proximityDelivery = bundledMobileJs.indexOf('notifyUser("On This Site nearby"', bundledMobileJs.indexOf("function checkProximityAlerts()"));
if (proximityReservation < 0 || proximityDelivery < 0 || proximityReservation > proximityDelivery
    || !bundledMobileJs.includes("state.proximityAlertInFlight")) {
  throw new Error("Nearby-site alerts must reserve their daily throttle before asynchronous notification delivery.");
}
requireBundledText('const NEARBY_LIST_ANDROID_INITIAL_LIMIT = 8;', "Bundled Android app must keep the first nearby tray render small.");
requireBundledText('const NEARBY_LIST_ANDROID_DEFAULT_LIMIT = 12;', "Bundled Android app must keep the normal nearby tray render bounded.");
requireBundledText('data-nearby-show-more', "Bundled Android app must let users reveal more nearby places after the startup cap.");
requireBundledText('const nativeAndroid = isNativeAndroidApp();', "Bundled Android app must cache native Android startup state.");
requireBundledText('function waitForMobileMapRuntime(timeout = 12000)', "Bundled Android app must give the self-hosted MapLibre renderer enough time to load before falling back.");
requireBundledText('const MOBILE_MAP_INITIAL_ERROR_GRACE_MS = 5000;', "Bundled Android map must tolerate a transient first-frame renderer error before using the text-only fallback.");
requireBundledText('const MOBILE_MAP_RECOVERY_RETRY_LIMIT = 1;', "Bundled Android map must retry one warmed-cache map attempt before using the text-only fallback.");
requireBundledText('window.setTimeout(retryOrFallback, MOBILE_MAP_INITIAL_ERROR_GRACE_MS)', "Bundled Android map recovery must use the bounded first-frame grace window.");
requireBundledText('initMap({ recoveryAttempt: recoveryAttempt + 1 }).then(resolve)', "Bundled Android map recovery must resolve startup through the single retry attempt.");
requireBundledText('if (!tilesReady) refreshAndroidMapAfterSettle("android-map-error")', "Bundled Android map must repaint a loaded canvas instead of replacing it with the offline index for one late tile.");
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
const bundledStabilizationBody = bundledApp.match(/function\s+stabilizeAndroidMapPaint\(\)\s*\{([\s\S]*?)\n\s*function\s+/)?.[1] || "";
const bundledLiveStabilizationBody = bundledLiveApp.match(/function\s+stabilizeAndroidMapPaint\(\)\s*\{([\s\S]*?)\n\s*function\s+/)?.[1] || "";
if (/\.zoomTo\(|\.jumpTo\(/.test(bundledStabilizationBody) || /\.zoomTo\(|\.jumpTo\(/.test(bundledLiveStabilizationBody)) {
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
requireBundledPattern(/function\s+approvedCommentPhotoSlides\(comments[\s\S]*?normalizeStatus\(comment\)\s*!==\s*"approved"[\s\S]*?seen\.has\(comparable\)[\s\S]*?function\s+approvedSiteCommentPhotoSlides\(site,[\s\S]*?COMMENT_UTILS\.approvedCommentPhotoSlides\(commentsForSource\("site",\s*site\),\s*listingImage/, "Bundled Android site carousels must share approved-only, deduplicated photo selection.");
requireBundledText('data-site-hero-comment="${escapeHtml(slide.id)}"', "Bundled Android comment-photo slides must link to their source comment.");
requireBundledPattern(/function\s+bindCarouselInteractions\(root,[\s\S]*?siteHeroErrorBound[\s\S]*?touchstart[\s\S]*?touchend[\s\S]*?advanceCarousel\(root,\s*deltaX\s*<\s*0\s*\?\s*1\s*:\s*-1\)[\s\S]*?function\s+bindSiteHeroCarouselSwipe\(root\)[\s\S]*?COMMENT_UTILS\.bindCarouselInteractions/, "Bundled Android site photo carousels must share one swipe and failed-image listener path.");
requireBundledPattern(/function\s+siteHeroCarouselCanAdvance\([\s\S]*?detailEl\.classList\.contains\("open"\)[\s\S]*?!document\.hidden[\s\S]*?!root\.classList\.contains\("is-compact"\)[\s\S]*?function\s+startSiteHeroCarousel\([\s\S]*?window\.setTimeout\([\s\S]*?COMMENT_UTILS\.advanceCarousel\(currentRoot,\s*1\)[\s\S]*?startSiteHeroCarousel\(currentRoot\)[\s\S]*?8000\)/, "Bundled Android site photo carousels must rotate every eight seconds only while the detail and full hero are visible.");
requireBundledPattern(/function\s+syncDetailHeroScrollState\([\s\S]*?syncSiteHeroCarouselLifecycle\(hero\)[\s\S]*?document\.addEventListener\("visibilitychange"[\s\S]*?syncSiteHeroCarouselLifecycle\(\)/, "Bundled Android site photo carousel lifecycle must follow compact and app visibility state.");
requireBundledPattern(/\.site-hero-carousel\.hero\s*\{[\s\S]*?touch-action:\s*pan-y;[\s\S]*?overscroll-behavior-x:\s*contain;/, "Bundled Android carousels must reserve horizontal swipes while preserving vertical article scrolling.");
requireBundledText('jumpToQuoteComment(heroCommentSlide.dataset.siteHeroComment);', "Bundled Android comment-photo slides must jump to the exact approved comment.");
if (!bundledMobileJs.includes('fields=${SITE_DETAIL_FIELDS}`, { anonymous: true }')) {
  throw new Error("Bundled Android public site detail must bypass contributor-token refresh.");
}
if (!bundledMobileJs.includes('ttl: 60000, fresh: false, anonymous: true')) {
  throw new Error("Bundled Android public knowledgebase detail must bypass contributor-token refresh.");
}
if (!bundledMobileJs.includes('toFixed(3)},${Number(coordinates[1]).toFixed(3)')) {
  throw new Error("Bundled Android biography motion must reuse shoreline state at a practical map-cell scale.");
}
for (const [label, runtime] of [["modular", bundledMobileJs], ["full offline", bundledApp]]) {
  if (!/function\s+mobileBiographyZoomMotionScale\(zoomValue[\s\S]*?return\s+0\.12[\s\S]*?Math\.max\(0\.08,\s*0\.22\s*\/\s*Math\.pow/.test(runtime)) {
    throw new Error(`Android ${label} biography routes must decelerate at close zoom without lowering native frame cadence.`);
  }
  if (!runtime.includes("const movingArticle = (state.nativeMovingBiographyItems || [])")
      || !runtime.includes("openWikiArticle(state.wikiBySlug.get(wikiSlug) || movingArticle || wikiSlug, {")
      || !runtime.includes("openWikiArticle(state.wikiBySlug.get(slug) || movingArticle || slug, {")) {
    throw new Error(`Android ${label} moving biographies must open before the deferred knowledge-base index is ready.`);
  }
  if (!runtime.includes('"elliott-alphonso-kellis": {')) {
    throw new Error(`Android ${label} runtime must retain the Elliott Alphonso Kellis moving biography route.`);
  }
}
const bundledDirectusClient = fs.readFileSync(bundledSharedDirectusClientPath, "utf8");
if (!bundledDirectusClient.includes('requestOptions.anonymous === true ? "" : tokenProvider()')) {
  throw new Error("Bundled Directus client must support credential-free public archive reads.");
}

console.log(`Android shell verifier passed: ${expectedBuild}`);

