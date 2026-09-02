package com.nativelongisland.onthissite;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.RectF;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.SystemClock;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.widget.FrameLayout;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;
import org.maplibre.android.MapLibre;
import org.maplibre.android.camera.CameraPosition;
import org.maplibre.android.camera.CameraUpdateFactory;
import org.maplibre.android.geometry.LatLng;
import org.maplibre.android.maps.MapLibreMap;
import org.maplibre.android.maps.MapLibreMapOptions;
import org.maplibre.android.maps.MapView;
import org.maplibre.android.maps.Style;
import org.maplibre.android.style.expressions.Expression;
import org.maplibre.android.style.layers.CircleLayer;
import org.maplibre.android.style.layers.FillLayer;
import org.maplibre.android.style.layers.Layer;
import org.maplibre.android.style.layers.LineLayer;
import org.maplibre.android.style.layers.Property;
import org.maplibre.android.style.layers.RasterLayer;
import org.maplibre.android.style.layers.SymbolLayer;
import org.maplibre.android.style.sources.GeoJsonSource;
import org.maplibre.android.style.sources.RasterSource;
import org.maplibre.android.style.sources.TileSet;
import org.maplibre.geojson.Feature;
import org.maplibre.geojson.FeatureCollection;
import org.maplibre.geojson.Point;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

import static org.maplibre.android.style.layers.PropertyFactory.circleColor;
import static org.maplibre.android.style.layers.PropertyFactory.circleOpacity;
import static org.maplibre.android.style.layers.PropertyFactory.circleRadius;
import static org.maplibre.android.style.layers.PropertyFactory.circleStrokeColor;
import static org.maplibre.android.style.layers.PropertyFactory.circleStrokeWidth;
import static org.maplibre.android.style.layers.PropertyFactory.circleTranslate;
import static org.maplibre.android.style.layers.PropertyFactory.fillColor;
import static org.maplibre.android.style.layers.PropertyFactory.fillOpacity;
import static org.maplibre.android.style.layers.PropertyFactory.iconAllowOverlap;
import static org.maplibre.android.style.layers.PropertyFactory.iconIgnorePlacement;
import static org.maplibre.android.style.layers.PropertyFactory.iconImage;
import static org.maplibre.android.style.layers.PropertyFactory.iconOpacity;
import static org.maplibre.android.style.layers.PropertyFactory.iconSize;
import static org.maplibre.android.style.layers.PropertyFactory.lineColor;
import static org.maplibre.android.style.layers.PropertyFactory.lineDasharray;
import static org.maplibre.android.style.layers.PropertyFactory.lineOpacity;
import static org.maplibre.android.style.layers.PropertyFactory.lineWidth;
import static org.maplibre.android.style.layers.PropertyFactory.textAllowOverlap;
import static org.maplibre.android.style.layers.PropertyFactory.textAnchor;
import static org.maplibre.android.style.layers.PropertyFactory.textColor;
import static org.maplibre.android.style.layers.PropertyFactory.textField;
import static org.maplibre.android.style.layers.PropertyFactory.textFont;
import static org.maplibre.android.style.layers.PropertyFactory.textHaloColor;
import static org.maplibre.android.style.layers.PropertyFactory.textHaloWidth;
import static org.maplibre.android.style.layers.PropertyFactory.textIgnorePlacement;
import static org.maplibre.android.style.layers.PropertyFactory.textOptional;
import static org.maplibre.android.style.layers.PropertyFactory.textOffset;
import static org.maplibre.android.style.layers.PropertyFactory.textOpacity;
import static org.maplibre.android.style.layers.PropertyFactory.textSize;
import static org.maplibre.android.style.layers.PropertyFactory.textTranslate;
import static org.maplibre.android.style.layers.PropertyFactory.visibility;

/**
 * Owns the staged MapLibre Native renderer while the existing WebView remains
 * the production UI. It renders only project-owned/bundled data and accepts a
 * bounded state snapshot from the Web UI; camera movement remains native.
 */
final class NativeMapController {
    interface Listener {
        void onFeatureSelected(String kind, String key, double longitude, double latitude);
        default void onFeatureSelected(String kind, String key) {
            onFeatureSelected(kind, key, Double.NaN, Double.NaN);
        }
        void onCameraChanged(double longitude, double latitude, double zoom, double bearing, double tilt);
        void onGestureChanged(boolean active);
    }

    private static final String LOG_TAG = "OnThisSiteNativeMap";
    private static final int MAX_STATE_BYTES = 12 * 1024 * 1024;
    // The hosted runtime sends a compact moving-feature source. Close zooms
    // use a 24 ms cadence so biography artwork glides rather than stepping;
    // retain a small guard here to coalesce accidental duplicate bridge calls.
    private static final long MOVING_FEATURE_MIN_UPDATE_MS = 20L;
    private static final long MAP_TAP_DISPATCH_DELAY_MS = 300L;
    private static final int BUNDLED_ICON_BATCH_SIZE = 4;
    private static final String EMPTY_FEATURE_COLLECTION = "{\"type\":\"FeatureCollection\",\"features\":[]}";
    private static final String ISLAND_SOURCE_ID = "nli-island";
    private static final String TERRITORY_SOURCE_ID = "nli-territories";
    private static final String SITE_POLYGON_SOURCE_ID = "nli-site-polygons";
    private static final String SITE_POINT_SOURCE_ID = "nli-site-points";
    private static final String LABEL_SOURCE_ID = "nli-labels";
    private static final String WATER_LABEL_SOURCE_ID = "nli-water-labels";
    private static final String BIOGRAPHY_PATH_SOURCE_ID = "nli-biography-paths";
    private static final String EVENT_SOURCE_ID = "nli-events";
    private static final String USER_LOCATION_SOURCE_ID = "nli-user-location";
    private static final String COMMUNITY_SOURCE_ID = "nli-community-contributions";
    private static final String TEMPORARY_SOURCE_ID = "nli-temporary-markers";
    private static final String SEARCH_FOCUS_SOURCE_ID = "nli-search-focus";
    private static final String PROFILE_PATH_SOURCE_ID = "nli-profile-path";
    private static final String PROFILE_POINT_SOURCE_ID = "nli-profile-points";
    private static final String MOVING_FEATURE_SOURCE_ID = "nli-moving-features";
    private static final String SATELLITE_SOURCE_ID = "nli-satellite";
    private static final String SATELLITE_LAYER_ID = "nli-satellite-layer";
    private static final String BASE_WATER_LAYER_ID = "nli-base-water";
    private static final String TERRITORY_FILL_LAYER_ID = "nli-territory-fill";
    private static final String TERRITORY_LINE_LAYER_ID = "nli-territory-line";
    private static final String TERRITORY_SATELLITE_FILL_LAYER_ID = "nli-territory-fill-satellite";
    private static final String TERRITORY_SATELLITE_LINE_LAYER_ID = "nli-territory-line-satellite";
    private static final String SITE_LAND_FILL_LAYER_ID = "nli-site-land-polygon-fill";
    private static final String SITE_LAND_LINE_LAYER_ID = "nli-site-land-polygon-line";
    private static final String SITE_LAND_SATELLITE_FILL_LAYER_ID = "nli-site-land-polygon-fill-satellite";
    private static final String SITE_LAND_SATELLITE_LINE_LAYER_ID = "nli-site-land-polygon-line-satellite";
    private static final String SITE_NON_LAND_FILL_LAYER_ID = "nli-site-polygon-fill";
    private static final String SITE_NON_LAND_LINE_LAYER_ID = "nli-site-polygon-line";
    private static final String SATELLITE_TILE_URL =
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    private static final String OFFLINE_PMTILES_ASSET = "map/long-island-offline-20260817-z10.pmtiles";
    private static final String OFFLINE_PMTILES_FILENAME = "long-island-offline-20260817-z10.pmtiles";
    private static final long OFFLINE_PMTILES_SIZE = 5_350_542L;
    private static final String ONLINE_PMTILES_URL =
        "pmtiles://https://directus.nativelongisland.com/app/map/long-island-z14.pmtiles";
    private static final String COMPACT_MAP_CREDIT = "ⓘ OSM";
    private static final String EXPANDED_MAP_CREDIT = "© OpenStreetMap contributors\n"
        + "Project places and overlays: On This Site\n"
        + "Long Island shoreline reference: NYS GIS";
    private static final String SATELLITE_MAP_CREDIT = "Tiles © Esri\n" + EXPANDED_MAP_CREDIT;
    private static final String[] PUBLIC_BASE_LAYER_IDS = new String[] {
        "nli-base-landcover", "nli-base-landuse", "nli-base-boundaries",
        "nli-base-roads-casing", "nli-base-roads", "nli-base-buildings",
        "nli-base-road-labels", "nli-base-place-labels",
        "nli-water-name-major", "nli-water-name-bay", "nli-water-name-inland",
        "nli-water-name-canal", "nli-water-name-stream"
    };
    private static final String[] BUNDLED_TERRITORY_SLUGS = new String[] {
        "canarsie-traditional-land", "corchaug-ancestral-land", "manhansett-ancestral-land",
        "massapequa-ancestral-lands", "matinecock-traditional-land", "merrick-ancestral-land",
        "montaukett-ancestral-land", "nissaquogues", "rockaway-traditional-land",
        "secatogue-ancestral-land", "setauket-ancestral-land", "shinnecock-ancestral-land",
        "unkechaug-ancestral-land"
    };
    private static final String[] BUNDLED_TERRITORY_TITLES = new String[] {
        "Canarsie Traditional Land", "Corchaug Ancestral Land", "Manhansett Ancestral Land",
        "Massapequa Ancestral Lands", "Matinecock Traditional Land", "Merrick Ancestral Land",
        "Montaukett Ancestral Land", "Nissaquogue Ancestral Land", "Rockaway Traditional Land",
        "Secatogue Ancestral Land", "Setauket Ancestral Land", "Shinnecock Ancestral Land",
        "Unkechaug Ancestral Land"
    };
    private static final String[] BUNDLED_TERRITORY_COLORS = new String[] {
        "#d7bdde", "#ead6a5", "#b8d9d0", "#d9c6a5", "#e2c0cf", "#c9d7bb", "#d9c4b2",
        "#c5d4e3", "#d7c6de", "#b9ddd2", "#d9c5c0", "#d6b6c2", "#c5d9b8"
    };
    private static final String BASE_STYLE_JSON = "{"
        + "\"version\":8,"
        + "\"name\":\"On This Site Blank Canvas\","
        + "\"glyphs\":\"asset://map-font/{fontstack}/{range}.pbf\","
        + "\"sources\":{},"
        + "\"layers\":[{\"id\":\"background\",\"type\":\"background\","
        + "\"paint\":{\"background-color\":\"#e8f1ed\"}}]"
        + "}";

    private final Activity activity;
    private final Listener listener;
    private final FrameLayout container;
    private final MapView mapView;
    private final TextView mapCreditView;
    private Runnable collapseMapCreditTask;
    private final List<RectF> blockedTouchRegions = new ArrayList<>();
    private MapLibreMap map;
    private boolean styleReady;
    private boolean profileMode;
    private boolean routingGesture;
    private boolean routedGestureMoved;
    private float routedGestureDownX;
    private float routedGestureDownY;
    private final float routedGestureTouchSlop;
    private boolean suppressNextCameraCallback;
    private boolean cameraGestureAwaitingIdle;
    private int searchFocusGeneration;
    private boolean suppressNextMapTap;
    private LatLng pendingMapTapPoint;
    private float pendingMapTapX;
    private float pendingMapTapY;
    private long pendingMapTapAt;
    private String pendingMapTapFeatureKind = "";
    private String pendingMapTapFeatureKey = "";
    private double pendingMapTapFeatureLongitude = Double.NaN;
    private double pendingMapTapFeatureLatitude = Double.NaN;
    private final Runnable dispatchPendingMapTapTask = () -> {
        LatLng point = pendingMapTapPoint;
        String featureKind = pendingMapTapFeatureKind;
        String featureKey = pendingMapTapFeatureKey;
        double featureLongitude = pendingMapTapFeatureLongitude;
        double featureLatitude = pendingMapTapFeatureLatitude;
        pendingMapTapPoint = null;
        pendingMapTapFeatureKind = "";
        pendingMapTapFeatureKey = "";
        pendingMapTapFeatureLongitude = Double.NaN;
        pendingMapTapFeatureLatitude = Double.NaN;
        if (point == null) return;
        // Resolve the exact frame position first. A nearby moving biography
        // must not preempt the site pin or specific polygon actually pressed.
        if (handleMapClick(point)) return;
        dispatchPendingMovingFeature(featureKind, featureKey, featureLongitude, featureLatitude);
    };
    private boolean usingOnlineArchive;
    private boolean offlineFallbackAttempted;
    private float viewportLeft;
    private float viewportTop;
    private float viewportRight;
    private float viewportBottom;
    private float viewportInteractiveRight;
    private float viewportInteractiveBottom;
    private int viewportRightOcclusion;
    private int viewportBottomOcclusion;
    private boolean mapCreditExpanded;
    private float touchRootScreenLeft;
    private float touchRootScreenTop;
    private String pendingStateJson;
    private String pendingTransientStateJson;
    private String bundledWaterLabelsJson;
    private String currentStateJson;
    private String movingFeaturesJson = EMPTY_FEATURE_COLLECTION;
    private long lastMovingFeatureApplyAt;
    private long movingFeatureDebugWindowStartedAt;
    private long movingFeatureDebugLastApplyAt;
    private long movingFeatureDebugMaxGapMs;
    private int movingFeatureDebugApplyCount;
    private String lastBlockedTouchRegionsJson = "";
    private float lastBlockedTouchScaleX = Float.NaN;
    private float lastBlockedTouchScaleY = Float.NaN;
    private final Runnable applyLatestMovingFeaturesTask = this::applyMovingFeaturesToStyle;
    private final JSONObject bundledSiteIconKeysBySlug = new JSONObject();
    private JSONObject bundledTerritoryFallback;
    private String lastStateSignature = "";
    private String lastBaseStateSignature = "";
    private String currentBasemap = "outdoors";
    private CameraPosition stableCamera;
    private long cameraIntentRevision;
    private long viewportRestoreRevision;
    private boolean startupVisualTracking = true;
    private boolean startupStateReady;
    private boolean startupViewportReady;
    private boolean startupMovingFeaturesSeen;
    private long lastStartupVisualChangeAt = SystemClock.uptimeMillis();

    NativeMapController(Activity activity, Bundle savedInstanceState, Listener listener) {
        this.activity = activity;
        this.listener = listener;
        routedGestureTouchSlop = ViewConfiguration.get(activity).getScaledTouchSlop();
        MapLibre.getInstance(activity.getApplicationContext());
        MapLibreMapOptions options = new MapLibreMapOptions()
            .logoEnabled(false)
            .attributionEnabled(false)
            .compassEnabled(false)
            .rotateGesturesEnabled(true)
            .tiltGesturesEnabled(true)
            .textureMode(true)
            // Avoid fetching and decoding lower-zoom tiles outside the visible
            // viewport; the app already performs bounded camera transitions.
            .setPrefetchesTiles(false)
            .foregroundLoadColor(Color.rgb(232, 241, 237))
            .camera(new CameraPosition.Builder()
                .target(new LatLng(40.86, -72.82))
                .zoom(7.35)
                .build());
        container = new FrameLayout(activity);
        mapView = new MapView(activity, options);
        container.addView(mapView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));
        mapCreditView = createMapCreditView();
        FrameLayout.LayoutParams creditParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM | Gravity.END
        );
        creditParams.setMargins(dp(6), dp(4), dp(6), dp(4));
        container.addView(mapCreditView, creditParams);
        container.setVisibility(View.GONE);
        mapView.onCreate(savedInstanceState);
        mapView.getMapAsync(this::prepareMap);
    }

    private TextView createMapCreditView() {
        TextView credit = new TextView(activity);
        credit.setText(COMPACT_MAP_CREDIT);
        credit.setTextColor(Color.rgb(48, 67, 58));
        credit.setTextSize(10f);
        credit.setGravity(Gravity.CENTER);
        credit.setPadding(dp(6), dp(3), dp(6), dp(3));
        credit.setMinWidth(dp(42));
        credit.setMinHeight(dp(25));
        credit.setMaxWidth(dp(285));
        credit.setContentDescription("Show full map data credits");
        credit.setClickable(true);
        credit.setFocusable(true);
        GradientDrawable background = new GradientDrawable();
        background.setColor(Color.argb(226, 255, 255, 255));
        background.setCornerRadius(dp(4));
        background.setStroke(dp(1), Color.argb(80, 49, 92, 72));
        credit.setBackground(background);
        credit.setOnClickListener(view -> {
            String expandedCredit = expandedMapCredit();
            boolean expanded = expandedCredit.contentEquals(credit.getText());
            credit.setText(expanded ? compactMapCredit() : expandedCredit);
            credit.setGravity(expanded ? Gravity.CENTER : Gravity.START | Gravity.CENTER_VERTICAL);
            setMapCreditExpanded(!expanded);
            credit.setContentDescription(expanded
                ? "Show full map data credits"
                : "Hide full map data credits");
            if (!expanded) {
                if (collapseMapCreditTask != null) credit.removeCallbacks(collapseMapCreditTask);
                collapseMapCreditTask = this::collapseMapCredit;
                credit.postDelayed(collapseMapCreditTask, 7000L);
            }
        });
        return credit;
    }

    private void collapseMapCredit() {
        mapCreditView.setText(compactMapCredit());
        mapCreditView.setGravity(Gravity.CENTER);
        setMapCreditExpanded(false);
        mapCreditView.setContentDescription("Show full map data credits");
    }

    private void setMapCreditExpanded(boolean expanded) {
        mapCreditExpanded = expanded;
        FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) mapCreditView.getLayoutParams();
        params.gravity = Gravity.BOTTOM | Gravity.END;
        params.topMargin = 0;
        params.rightMargin = viewportRightOcclusion + dp(6);
        params.bottomMargin = viewportBottomOcclusion + dp(expanded ? 92 : 4);
        mapCreditView.setLayoutParams(params);
    }

    private String compactMapCredit() {
        return satelliteBasemapVisible() ? "ⓘ Esri" : COMPACT_MAP_CREDIT;
    }

    private String expandedMapCredit() {
        return satelliteBasemapVisible() ? SATELLITE_MAP_CREDIT : EXPANDED_MAP_CREDIT;
    }

    private boolean satelliteBasemapVisible() {
        return !profileMode && "satellite".equals(currentBasemap);
    }

    private void refreshMapCreditForVisibleBasemap() {
        mapCreditView.setText(mapCreditExpanded ? expandedMapCredit() : compactMapCredit());
        mapCreditView.setGravity(mapCreditExpanded
            ? Gravity.START | Gravity.CENTER_VERTICAL
            : Gravity.CENTER);
        setMapCreditExpanded(mapCreditExpanded);
    }

    private int dp(int value) {
        return Math.max(1, Math.round(value * activity.getResources().getDisplayMetrics().density));
    }

    View view() {
        return container;
    }

    boolean isReady() {
        return styleReady;
    }

    void beginStartupVisualTracking() {
        startupVisualTracking = true;
        startupStateReady = false;
        startupViewportReady = container.getVisibility() == View.VISIBLE
            && container.getWidth() > 1
            && container.getHeight() > 1;
        startupMovingFeaturesSeen = false;
        lastStartupVisualChangeAt = SystemClock.uptimeMillis();
    }

    boolean isStartupVisualStable(long stableWindowMs) {
        if (!styleReady || !startupStateReady || !startupViewportReady) return false;
        long stableFor = SystemClock.uptimeMillis() - lastStartupVisualChangeAt;
        return stableFor >= Math.max(0L, stableWindowMs);
    }

    String startupVisualStatus() {
        return "style=" + styleReady
            + ",state=" + startupStateReady
            + ",viewport=" + startupViewportReady
            + ",moving=" + startupMovingFeaturesSeen
            + ",stableMs=" + Math.max(0L, SystemClock.uptimeMillis() - lastStartupVisualChangeAt);
    }

    void finishStartupVisualTracking() {
        startupVisualTracking = false;
    }

    private void markStartupVisualChange() {
        if (startupVisualTracking) lastStartupVisualChangeAt = SystemClock.uptimeMillis();
    }

    void setVisible(boolean visible) {
        if ((container.getVisibility() == View.VISIBLE) == visible) return;
        container.setVisibility(visible ? View.VISIBLE : View.GONE);
        if (visible) mapView.invalidate();
    }

    void updateViewport(
        float left,
        float top,
        float width,
        float height,
        float bottomOcclusion,
        float rightOcclusion,
        boolean visible,
        float rootScreenLeft,
        float rootScreenTop
    ) {
        int safeWidth = Math.max(1, Math.round(width));
        int safeHeight = Math.max(1, Math.round(height));
        int safeLeft = Math.max(0, Math.round(left));
        int safeTop = Math.max(0, Math.round(top));
        int safeRightOcclusion = Math.min(safeWidth - 1, Math.max(0, Math.round(rightOcclusion)));
        int safeBottomOcclusion = Math.min(safeHeight - 1, Math.max(0, Math.round(bottomOcclusion)));
        int nextVisibility = visible && safeWidth > 1 && safeHeight > 1 ? View.VISIBLE : View.GONE;
        boolean occlusionChanged = viewportBottomOcclusion != safeBottomOcclusion
            || viewportRightOcclusion != safeRightOcclusion;
        boolean rootChanged = touchRootScreenLeft != rootScreenLeft || touchRootScreenTop != rootScreenTop;
        boolean visibilityChanged = container.getVisibility() != nextVisibility;
        // Capture the settled camera before changing MapLibre padding. Padding
        // reprojects the camera synchronously, so waiting for the next posted
        // layout pass exposes one visibly stretched/shifted frame on tablets.
        CameraPosition cameraToPreserve = nativeGestureInProgress()
            ? null
            : (stableCamera != null
                ? stableCamera
                : (map == null ? null : map.getCameraPosition()));
        viewportLeft = safeLeft;
        viewportTop = safeTop;
        viewportRight = safeLeft + safeWidth;
        viewportBottom = safeTop + safeHeight;
        viewportRightOcclusion = safeRightOcclusion;
        viewportBottomOcclusion = safeBottomOcclusion;
        viewportInteractiveRight = viewportRight - viewportRightOcclusion;
        viewportInteractiveBottom = viewportBottom - viewportBottomOcclusion;
        if (map != null && occlusionChanged) {
            map.setPadding(0, 0, viewportRightOcclusion, viewportBottomOcclusion);
            if (cameraToPreserve != null && !sameCamera(map.getCameraPosition(), cameraToPreserve)) {
                suppressNextCameraCallback = true;
                map.moveCamera(CameraUpdateFactory.newCameraPosition(cameraToPreserve));
            }
        }
        touchRootScreenLeft = rootScreenLeft;
        touchRootScreenTop = rootScreenTop;
        FrameLayout.LayoutParams currentParams = (FrameLayout.LayoutParams) container.getLayoutParams();
        boolean boundsChanged = currentParams == null
            || currentParams.width != safeWidth
            || currentParams.height != safeHeight
            || currentParams.leftMargin != safeLeft
            || currentParams.topMargin != safeTop;
        boolean nextStartupViewportReady = visible && safeWidth > 1 && safeHeight > 1;
        if (startupVisualTracking
            && (boundsChanged || nextStartupViewportReady != startupViewportReady)) {
            markStartupVisualChange();
        }
        startupViewportReady = nextStartupViewportReady;
        if (!boundsChanged && !occlusionChanged && !rootChanged && !visibilityChanged) return;
        long expectedCameraRevision = cameraIntentRevision;
        long restoreRevision = ++viewportRestoreRevision;
        if (boundsChanged) {
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(safeWidth, safeHeight);
            params.leftMargin = safeLeft;
            params.topMargin = safeTop;
            container.setLayoutParams(params);
            setMapCreditExpanded(mapCreditExpanded);
        }
        setVisible(nextVisibility == View.VISIBLE);
        if (boundsChanged && cameraToPreserve != null) {
            Log.d(LOG_TAG, "Preserving camera through viewport change: "
                + cameraToPreserve.target.getLongitude() + ","
                + cameraToPreserve.target.getLatitude() + " z" + cameraToPreserve.zoom
                + " bounds=" + safeLeft + "," + safeTop + " " + safeWidth + "x" + safeHeight);
            container.post(() -> {
                if (map == null
                    || restoreRevision != viewportRestoreRevision
                    || expectedCameraRevision != cameraIntentRevision) return;
                CameraPosition currentCamera = map.getCameraPosition();
                if (sameCamera(currentCamera, cameraToPreserve)) return;
                Log.d(LOG_TAG, "Restoring camera after viewport change from "
                    + currentCamera.target.getLongitude() + ","
                    + currentCamera.target.getLatitude() + " z" + currentCamera.zoom);
                suppressNextCameraCallback = true;
                map.moveCamera(CameraUpdateFactory.newCameraPosition(cameraToPreserve));
            });
        }
    }

    void updateBlockedTouchRegions(String regionsJson, float scaleX, float scaleY) {
        if (regionsJson == null || regionsJson.length() > 128 * 1024) return;
        if (regionsJson.equals(lastBlockedTouchRegionsJson)
            && Float.compare(scaleX, lastBlockedTouchScaleX) == 0
            && Float.compare(scaleY, lastBlockedTouchScaleY) == 0) return;
        lastBlockedTouchRegionsJson = regionsJson;
        lastBlockedTouchScaleX = scaleX;
        lastBlockedTouchScaleY = scaleY;
        blockedTouchRegions.clear();
        try {
            JSONArray rows = new JSONArray(regionsJson);
            int limit = Math.min(rows.length(), 80);
            for (int index = 0; index < limit; index++) {
                JSONObject row = rows.optJSONObject(index);
                if (row == null) continue;
                float left = (float) row.optDouble("left") * scaleX;
                float top = (float) row.optDouble("top") * scaleY;
                float right = (float) row.optDouble("right") * scaleX;
                float bottom = (float) row.optDouble("bottom") * scaleY;
                if (right > left && bottom > top) blockedTouchRegions.add(new RectF(left, top, right, bottom));
            }
        } catch (Exception error) {
            Log.w(LOG_TAG, "Ignored malformed native-map touch exclusions.", error);
        }
    }

    boolean routeTouchEvent(MotionEvent event) {
        if (event == null || container.getVisibility() != View.VISIBLE || !styleReady) return false;
        float rootX = event.getRawX() - touchRootScreenLeft;
        float rootY = event.getRawY() - touchRootScreenTop;
        if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
            if (pendingMapTapPoint != null
                && SystemClock.uptimeMillis() - pendingMapTapAt <= ViewConfiguration.getDoubleTapTimeout()) {
                float tapDeltaX = rootX - pendingMapTapX;
                float tapDeltaY = rootY - pendingMapTapY;
                float doubleTapSlop = routedGestureTouchSlop * 4f;
                if (tapDeltaX * tapDeltaX + tapDeltaY * tapDeltaY <= doubleTapSlop * doubleTapSlop) {
                    mapView.removeCallbacks(dispatchPendingMapTapTask);
                    pendingMapTapPoint = null;
                    pendingMapTapFeatureKind = "";
                    pendingMapTapFeatureKey = "";
                    pendingMapTapFeatureLongitude = Double.NaN;
                    pendingMapTapFeatureLatitude = Double.NaN;
                    suppressNextMapTap = true;
                }
            }
            boolean blocked = pointInBlockedRegion(rootX, rootY);
            routingGesture = rootX >= viewportLeft
                && rootX <= viewportInteractiveRight
                && rootY >= viewportTop
                && rootY <= viewportInteractiveBottom
                && !blocked;
            if (routingGesture) {
                routedGestureMoved = false;
                routedGestureDownX = rootX;
                routedGestureDownY = rootY;
                if (map != null) stableCamera = map.getCameraPosition();
                cameraIntentRevision += 1;
                cameraGestureAwaitingIdle = true;
                if (listener != null) listener.onGestureChanged(true);
            }
        }
        if (!routingGesture) return false;
        if (event.getPointerCount() > 1 || event.getActionMasked() == MotionEvent.ACTION_POINTER_DOWN) {
            // A two-finger rotate/tilt may begin without moving pointer zero
            // beyond touch slop. Never reinterpret that gesture as a site tap.
            routedGestureMoved = true;
        }
        if (event.getActionMasked() != MotionEvent.ACTION_DOWN && !routedGestureMoved) {
            float deltaX = rootX - routedGestureDownX;
            float deltaY = rootY - routedGestureDownY;
            routedGestureMoved = deltaX * deltaX + deltaY * deltaY
                > routedGestureTouchSlop * routedGestureTouchSlop;
        }
        MotionEvent translated = MotionEvent.obtain(event);
        translated.setLocation(rootX - viewportLeft, rootY - viewportTop);
        container.dispatchTouchEvent(translated);
        translated.recycle();
        int action = event.getActionMasked();
        if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL) {
            LatLng tappedPoint = action == MotionEvent.ACTION_UP && !routedGestureMoved && map != null
                ? map.getProjection().fromScreenLocation(new PointF(rootX - viewportLeft, rootY - viewportTop))
                : null;
            routingGesture = false;
            if (action == MotionEvent.ACTION_CANCEL) {
                cameraGestureAwaitingIdle = false;
                if (listener != null) listener.onGestureChanged(false);
            } else if (suppressNextMapTap) {
                suppressNextMapTap = false;
            } else if (tappedPoint != null) {
                // Use a short, bounded delay so a genuine double tap can keep
                // zooming without opening the feature underneath it. This is
                // substantially faster than MapLibre's delayed map-click
                // callback while preserving familiar map interaction.
                pendingMapTapPoint = tappedPoint;
                pendingMapTapX = rootX;
                pendingMapTapY = rootY;
                pendingMapTapAt = SystemClock.uptimeMillis();
                capturePendingMovingFeature(new PointF(rootX - viewportLeft, rootY - viewportTop));
                mapView.removeCallbacks(dispatchPendingMapTapTask);
                mapView.postDelayed(dispatchPendingMapTapTask, MAP_TAP_DISPATCH_DELAY_MS);
            }
        }
        return true;
    }

    boolean runGestureDiagnostic(String gestureName) {
        if (!BuildConfig.DEBUG || map == null || container.getVisibility() != View.VISIBLE || !styleReady) return false;
        String gesture = String.valueOf(gestureName).toLowerCase(Locale.ROOT);
        if (!"tilt".equals(gesture) && !"rotate".equals(gesture)) return false;
        float usableWidth = Math.max(dp(240), viewportInteractiveRight - viewportLeft);
        float usableHeight = Math.max(dp(280), viewportInteractiveBottom - viewportTop);
        float centerX = viewportLeft + usableWidth * 0.5f;
        float centerY = viewportTop + usableHeight * 0.56f;
        float radius = Math.min(usableWidth * 0.22f, dp(120));
        float travel = Math.min(usableHeight * 0.28f, dp(190));
        long downTime = SystemClock.uptimeMillis();
        CameraPosition before = map.getCameraPosition();

        float firstX = centerX - radius;
        float firstY = centerY;
        dispatchSyntheticGestureEvent(downTime, downTime, MotionEvent.ACTION_DOWN, new float[][] {{ firstX, firstY }});
        dispatchSyntheticGestureEvent(
            downTime,
            downTime + 16L,
            MotionEvent.ACTION_POINTER_DOWN | (1 << MotionEvent.ACTION_POINTER_INDEX_SHIFT),
            new float[][] {{ firstX, firstY }, { centerX + radius, centerY }}
        );
        float[][] finalPoints = null;
        for (int step = 1; step <= 14; step++) {
            float progress = step / 14f;
            if ("tilt".equals(gesture)) {
                float y = centerY - travel * progress;
                finalPoints = new float[][] {{ centerX - radius, y }, { centerX + radius, y }};
            } else {
                double angle = Math.toRadians(38.0 * progress);
                float dx = (float) (Math.cos(angle) * radius);
                float dy = (float) (Math.sin(angle) * radius);
                finalPoints = new float[][] {{ centerX - dx, centerY - dy }, { centerX + dx, centerY + dy }};
            }
            dispatchSyntheticGestureEvent(
                downTime,
                downTime + 16L + step * 18L,
                MotionEvent.ACTION_MOVE,
                finalPoints
            );
        }
        if (finalPoints == null) return false;
        long endTime = downTime + 300L;
        dispatchSyntheticGestureEvent(
            downTime,
            endTime,
            MotionEvent.ACTION_POINTER_UP | (1 << MotionEvent.ACTION_POINTER_INDEX_SHIFT),
            finalPoints
        );
        dispatchSyntheticGestureEvent(
            downTime,
            endTime + 16L,
            MotionEvent.ACTION_UP,
            new float[][] {{ finalPoints[0][0], finalPoints[0][1] }}
        );
        mapView.postDelayed(() -> {
            CameraPosition after = map == null ? null : map.getCameraPosition();
            Log.d(LOG_TAG, "Synthetic " + gesture + " gesture: before=" + cameraPoseSummary(before)
                + " after=" + cameraPoseSummary(after));
        }, 500L);
        return true;
    }

    private void dispatchSyntheticGestureEvent(long downTime, long eventTime, int action, float[][] points) {
        int count = points == null ? 0 : points.length;
        if (count < 1) return;
        MotionEvent.PointerProperties[] properties = new MotionEvent.PointerProperties[count];
        MotionEvent.PointerCoords[] coordinates = new MotionEvent.PointerCoords[count];
        for (int index = 0; index < count; index++) {
            MotionEvent.PointerProperties pointer = new MotionEvent.PointerProperties();
            pointer.id = index;
            pointer.toolType = MotionEvent.TOOL_TYPE_FINGER;
            properties[index] = pointer;
            MotionEvent.PointerCoords coordinate = new MotionEvent.PointerCoords();
            coordinate.x = points[index][0];
            coordinate.y = points[index][1];
            coordinate.pressure = 1f;
            coordinate.size = 1f;
            coordinates[index] = coordinate;
        }
        MotionEvent event = MotionEvent.obtain(
            downTime,
            eventTime,
            action,
            count,
            properties,
            coordinates,
            0,
            0,
            1f,
            1f,
            0,
            0,
            android.view.InputDevice.SOURCE_TOUCHSCREEN,
            0
        );
        routeTouchEvent(event);
        event.recycle();
    }

    private String cameraPoseSummary(CameraPosition position) {
        if (position == null) return "none";
        return String.format(Locale.US, "z%.2f/b%.2f/t%.2f", position.zoom, position.bearing, position.tilt);
    }

    private void capturePendingMovingFeature(PointF screenPoint) {
        pendingMapTapFeatureKind = "";
        pendingMapTapFeatureKey = "";
        pendingMapTapFeatureLongitude = Double.NaN;
        pendingMapTapFeatureLatitude = Double.NaN;
        if (map == null || screenPoint == null || profileMode) return;
        float hitRadius = mapTapHitRadiusPx();
        RectF hitBox = new RectF(
            screenPoint.x - hitRadius,
            screenPoint.y - hitRadius,
            screenPoint.x + hitRadius,
            screenPoint.y + hitRadius
        );
        List<Feature> features = map.queryRenderedFeatures(
            hitBox,
            "nli-moving-biography-icons",
            "nli-moving-dog-icons",
            "nli-moving-whale-icons",
            "nli-moving-ship-icons"
        );
        if (features == null || features.isEmpty()) return;
        Feature nearest = nearestActionablePointFeature(features, screenPoint, false);
        if (nearest == null || !nearest.hasProperty("native_kind") || !nearest.hasProperty("native_key")) return;
        pendingMapTapFeatureKind = nearest.getStringProperty("native_kind");
        pendingMapTapFeatureKey = nearest.getStringProperty("native_key");
        if (nearest.geometry() instanceof Point) {
            Point coordinate = (Point) nearest.geometry();
            pendingMapTapFeatureLongitude = coordinate.longitude();
            pendingMapTapFeatureLatitude = coordinate.latitude();
        }
    }

    private boolean dispatchPendingMovingFeature(
        String featureKind,
        String featureKey,
        double featureLongitude,
        double featureLatitude
    ) {
        if (featureKind == null || featureKind.isEmpty()
            || featureKey == null || featureKey.isEmpty()
            || listener == null) return false;
        cameraGestureAwaitingIdle = false;
        listener.onGestureChanged(false);
        listener.onFeatureSelected(featureKind, featureKey, featureLongitude, featureLatitude);
        return true;
    }

    private boolean pointInBlockedRegion(float x, float y) {
        for (RectF region : blockedTouchRegions) if (region.contains(x, y)) return true;
        return false;
    }

    private float mapTapHitRadiusPx() {
        double zoom = map == null || map.getCameraPosition() == null
            ? 10.0
            : map.getCameraPosition().zoom;
        float radiusDp = zoom < 8.5 ? 18f : zoom < 10.0 ? 24f : 32f;
        return Math.max(18f, activity.getResources().getDisplayMetrics().density * radiusDp);
    }

    private boolean nativeGestureInProgress() {
        return routingGesture || cameraGestureAwaitingIdle;
    }

    private void prepareMap(MapLibreMap readyMap) {
        map = readyMap;
        map.setPadding(0, 0, viewportRightOcclusion, viewportBottomOcclusion);
        map.getUiSettings().setLogoEnabled(false);
        map.getUiSettings().setAttributionEnabled(false);
        map.getUiSettings().setCompassEnabled(false);
        map.getUiSettings().setRotateGesturesEnabled(true);
        map.getUiSettings().setTiltGesturesEnabled(true);
        map.setMinZoomPreference(6.0);
        map.setMaxZoomPreference(18.0);
        stableCamera = map.getCameraPosition();
        map.addOnCameraIdleListener(this::notifyCameraChanged);
        mapView.addOnDidFailLoadingMapListener(error -> {
            if (!usingOnlineArchive || offlineFallbackAttempted || map == null) return;
            offlineFallbackAttempted = true;
            Log.w(LOG_TAG, "Online native map archive failed; switching to bundled offline detail: " + error);
            loadNativeStyle(false);
        });
        loadNativeStyle(hasValidatedNetwork());
    }

    private void loadNativeStyle(boolean preferOnlineArchive) {
        if (map == null) return;
        styleReady = false;
        markStartupVisualChange();
        usingOnlineArchive = preferOnlineArchive;
        lastStateSignature = "";
        lastBaseStateSignature = "";
        if (currentStateJson != null) pendingStateJson = currentStateJson;
        String styleJson = BASE_STYLE_JSON;
        try {
            styleJson = loadPmtilesStyle(preferOnlineArchive);
        } catch (Exception error) {
            if (preferOnlineArchive) {
                Log.w(LOG_TAG, "Could not open online PMTiles style; switching to bundled archive.", error);
                offlineFallbackAttempted = true;
                usingOnlineArchive = false;
                try {
                    styleJson = loadPmtilesStyle(false);
                } catch (Exception offlineError) {
                    Log.w(LOG_TAG, "Could not open bundled PMTiles style; using blank fallback.", offlineError);
                }
            } else {
                Log.w(LOG_TAG, "Could not open bundled PMTiles style; using blank fallback.", error);
            }
        }
        map.setStyle(new Style.Builder().fromJson(styleJson), this::addBundledLayers);
    }

    private void addBundledLayers(Style style) {
        try {
            TileSet satelliteTiles = new TileSet("2.2.0", SATELLITE_TILE_URL);
            satelliteTiles.setAttribution("Tiles © Esri");
            style.addSource(new RasterSource(SATELLITE_SOURCE_ID, satelliteTiles, 256));
            style.addLayer(new RasterLayer(SATELLITE_LAYER_ID, SATELLITE_SOURCE_ID).withProperties(
                visibility(Property.NONE)
            ));
            style.addSource(new GeoJsonSource(
                ISLAND_SOURCE_ID,
                Feature.fromJson(readAsset("long-island-land-mask-lite.json"))
            ));
            style.addLayer(new FillLayer("nli-island-fill", ISLAND_SOURCE_ID).withProperties(
                fillColor("#f4edcf"), fillOpacity(0.04f)
            ));
            style.addLayer(new LineLayer("nli-island-outline", ISLAND_SOURCE_ID).withProperties(
                lineColor("#315a49"), lineWidth(1.25f), lineOpacity(0.72f)
            ));

            // The hosted WebView supplies the authoritative filtered map in
            // one base handoff. Loading the same 400+ centers and detailed
            // territories here first made online cold starts parse and render
            // those sources twice. Keep the bundled snapshot only for the
            // genuine offline renderer, where it is the only immediate map.
            String initialTerritories = usingOnlineArchive
                ? EMPTY_FEATURE_COLLECTION
                : bundledTerritoryGeoJson(false);
            String initialSitePoints = usingOnlineArchive
                ? EMPTY_FEATURE_COLLECTION
                : buildBundledSiteGeoJson();
            String initialLabels = usingOnlineArchive
                ? EMPTY_FEATURE_COLLECTION
                : bundledTerritoryGeoJson(true);
            addSource(style, TERRITORY_SOURCE_ID, initialTerritories);
            addSource(style, SITE_POLYGON_SOURCE_ID, EMPTY_FEATURE_COLLECTION);
            addSource(style, SITE_POINT_SOURCE_ID, initialSitePoints);
            addSource(style, LABEL_SOURCE_ID, initialLabels);
            addSource(style, WATER_LABEL_SOURCE_ID, bundledWaterLabelGeoJson());
            addSource(style, BIOGRAPHY_PATH_SOURCE_ID, EMPTY_FEATURE_COLLECTION);
            addSource(style, EVENT_SOURCE_ID, EMPTY_FEATURE_COLLECTION);
            addSource(style, USER_LOCATION_SOURCE_ID, EMPTY_FEATURE_COLLECTION);
            addSource(style, COMMUNITY_SOURCE_ID, EMPTY_FEATURE_COLLECTION);
            addSource(style, TEMPORARY_SOURCE_ID, EMPTY_FEATURE_COLLECTION);
            addSource(style, SEARCH_FOCUS_SOURCE_ID, EMPTY_FEATURE_COLLECTION);
            addSource(style, PROFILE_PATH_SOURCE_ID, EMPTY_FEATURE_COLLECTION);
            addSource(style, PROFILE_POINT_SOURCE_ID, EMPTY_FEATURE_COLLECTION);
            addSource(style, MOVING_FEATURE_SOURCE_ID, movingFeaturesJson);
            addBundledMapIcons(style);

            addLandLayerBelowBaseWater(style, new FillLayer(TERRITORY_FILL_LAYER_ID, TERRITORY_SOURCE_ID).withProperties(
                fillColor(Expression.get("fillcolor")), fillOpacity(0.24f)
            ));
            addLandLayerBelowBaseWater(style, new LineLayer(TERRITORY_LINE_LAYER_ID, TERRITORY_SOURCE_ID).withProperties(
                lineColor("#496f5d"), lineWidth(0.9f), lineOpacity(0.58f), lineDasharray(new Float[] { 2f, 2f })
            ));
            addLandLayerBelowBaseWater(style, new FillLayer(SITE_LAND_FILL_LAYER_ID, SITE_POLYGON_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("geometry_surface"), Expression.literal("land")))
                .withProperties(
                    fillColor(Expression.get("fillcolor")), fillOpacity(0.22f)
                ));
            addLandLayerBelowBaseWater(style, new LineLayer(SITE_LAND_LINE_LAYER_ID, SITE_POLYGON_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("geometry_surface"), Expression.literal("land")))
                .withProperties(
                    lineColor("#315a49"), lineWidth(0.9f), lineOpacity(0.45f)
                ));
            style.addLayer(new FillLayer(SITE_NON_LAND_FILL_LAYER_ID, SITE_POLYGON_SOURCE_ID)
                .withFilter(Expression.neq(Expression.get("geometry_surface"), Expression.literal("land")))
                .withProperties(
                fillColor(Expression.get("fillcolor")), fillOpacity(0.22f)
                ));
            style.addLayer(new LineLayer(SITE_NON_LAND_LINE_LAYER_ID, SITE_POLYGON_SOURCE_ID)
                .withFilter(Expression.neq(Expression.get("geometry_surface"), Expression.literal("land")))
                .withProperties(
                    lineColor("#315a49"), lineWidth(0.9f), lineOpacity(0.45f)
                ));

            // The satellite raster has no vector water mask. Keep a second,
            // normally hidden set of reviewed land overlays above the imagery
            // so switching basemaps does not make all land polygons disappear.
            style.addLayer(new FillLayer(TERRITORY_SATELLITE_FILL_LAYER_ID, TERRITORY_SOURCE_ID).withProperties(
                fillColor(Expression.get("fillcolor")), fillOpacity(0.24f), visibility(Property.NONE)
            ));
            style.addLayer(new LineLayer(TERRITORY_SATELLITE_LINE_LAYER_ID, TERRITORY_SOURCE_ID).withProperties(
                lineColor("#496f5d"), lineWidth(0.9f), lineOpacity(0.58f),
                lineDasharray(new Float[] { 2f, 2f }), visibility(Property.NONE)
            ));
            style.addLayer(new FillLayer(SITE_LAND_SATELLITE_FILL_LAYER_ID, SITE_POLYGON_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("geometry_surface"), Expression.literal("land")))
                .withProperties(
                    fillColor(Expression.get("fillcolor")), fillOpacity(0.22f), visibility(Property.NONE)
                ));
            style.addLayer(new LineLayer(SITE_LAND_SATELLITE_LINE_LAYER_ID, SITE_POLYGON_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("geometry_surface"), Expression.literal("land")))
                .withProperties(
                    lineColor("#315a49"), lineWidth(0.9f), lineOpacity(0.45f), visibility(Property.NONE)
                ));
            // The compact native PMTiles style deliberately omits most
            // basemap label layers. Restore the same official GNIS water
            // names used by the mobile web map so ponds, bays, canals, and
            // streams remain identifiable on the default road basemap.
            addWaterNameLayer(style, "nli-water-name-major",
                Expression.eq(Expression.get("water_tier"), Expression.literal(0)),
                12.2f, 11f, 14f, 17f);
            addWaterNameLayer(style, "nli-water-name-bay",
                Expression.eq(Expression.get("water_tier"), Expression.literal(1)),
                12.2f, 10.5f, 13f, 15f);
            addWaterNameLayer(style, "nli-water-name-inland",
                Expression.eq(Expression.get("water_tier"), Expression.literal(2)),
                12.2f, 10.5f, 12.5f, 14f);
            addWaterNameLayer(style, "nli-water-name-canal",
                Expression.eq(Expression.get("water_class"), Expression.literal("Canal")),
                13.2f, 9.75f, 11.5f, 13f);
            addWaterNameLayer(style, "nli-water-name-stream",
                Expression.any(
                    Expression.eq(Expression.get("water_class"), Expression.literal("Stream")),
                    Expression.eq(Expression.get("water_class"), Expression.literal("Spring"))
                ),
                13.7f, 9.5f, 11f, 12.5f);
            // Draw a quiet translucent location target below project icons so
            // nearby site artwork remains legible at the user's exact point.
            style.addLayer(new CircleLayer("nli-user-location-outer", USER_LOCATION_SOURCE_ID).withProperties(
                circleRadius(15f), circleColor("#ffffff"), circleOpacity(0.5f),
                circleStrokeWidth(0f)
            ));
            style.addLayer(new CircleLayer("nli-user-location-inner", USER_LOCATION_SOURCE_ID).withProperties(
                circleRadius(4f), circleColor("#2f80ed"), circleOpacity(1f),
                circleStrokeWidth(0f)
            ));
            // Keep a quiet project dot underneath every point. It is normally
            // covered by the custom image, but prevents a site from becoming
            // invisible if Android is still uploading that image after a
            // style/source refresh.
            style.addLayer(new CircleLayer("nli-site-point-circles", SITE_POINT_SOURCE_ID)
                .withProperties(
                    circleRadius(4.4f), circleColor("#315c48"), circleOpacity(0.9f),
                    circleStrokeColor("#f8fbf5"), circleStrokeWidth(1.1f)
                ));
            SymbolLayer siteIconLayer = new SymbolLayer("nli-site-point-icons", SITE_POINT_SOURCE_ID)
                .withFilter(Expression.neq(
                    Expression.coalesce(Expression.get("native_icon_key"), Expression.literal("")),
                    Expression.literal("")
                ))
                .withProperties(
                    iconImage(Expression.get("native_icon_key")),
                    // Match the established mobile-web marker scale. The old
                    // fixed 0.5 value made the 64 px bundled artwork only
                    // about 16 dp wide on a 2x screen (and even smaller on
                    // higher-density phones), which made valid custom site
                    // icons look missing and difficult to press.
                    iconSize(Expression.interpolate(
                        Expression.linear(), Expression.zoom(),
                        Expression.stop(6, 0.72f),
                        Expression.stop(10, 0.9f),
                        Expression.stop(14, 1.08f)
                    )),
                    iconAllowOverlap(true), iconIgnorePlacement(true)
                );
            siteIconLayer.setMinZoom(7f);
            style.addLayer(siteIconLayer);
            style.addLayer(new CircleLayer("nli-site-unread-badges", SITE_POINT_SOURCE_ID)
                .withFilter(Expression.gt(
                    Expression.coalesce(
                        Expression.toNumber(Expression.get("unread_count")),
                        Expression.literal(0)
                    ),
                    Expression.literal(0)
                ))
                .withProperties(
                    circleRadius(6.3f), circleColor("#d71920"), circleOpacity(0.98f),
                    circleStrokeColor("#ffffff"), circleStrokeWidth(1.4f),
                    circleTranslate(new Float[] { 8f, -8f })
                ));
            style.addLayer(new SymbolLayer("nli-site-unread-counts", SITE_POINT_SOURCE_ID)
                .withFilter(Expression.gt(
                    Expression.coalesce(
                        Expression.toNumber(Expression.get("unread_count")),
                        Expression.literal(0)
                    ),
                    Expression.literal(0)
                ))
                .withProperties(
                    textField(Expression.get("unread_label")),
                    textFont(new String[] { "Noto Sans Regular" }),
                    textSize(8.5f), textColor("#ffffff"),
                    textAllowOverlap(true), textIgnorePlacement(true),
                    textTranslate(new Float[] { 8f, -8f })
                ));
            SymbolLayer territoryLabelLayer = new SymbolLayer("nli-territory-labels", LABEL_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("label_kind"), Expression.literal("territory")))
                .withProperties(
                    textField(Expression.get("title")), textFont(new String[] { "Noto Sans Regular" }),
                    textSize(10f), textColor("#20251f"),
                    textHaloColor("rgba(255,255,255,0.94)"), textHaloWidth(1.3f),
                    textOptional(true), textAllowOverlap(false), textIgnorePlacement(false)
                );
            territoryLabelLayer.setMinZoom(6.2f);
            style.addLayer(territoryLabelLayer);
            SymbolLayer projectLabelLayer = new SymbolLayer("nli-map-labels", LABEL_SOURCE_ID)
                .withFilter(Expression.neq(Expression.get("label_kind"), Expression.literal("territory")))
                .withProperties(
                textField(Expression.get("title")), textFont(new String[] { "Noto Sans Regular" }),
                textSize(11f), textColor("#20251f"),
                textHaloColor("rgba(255,255,255,0.94)"), textHaloWidth(1.3f),
                textOptional(true), textAllowOverlap(false), textIgnorePlacement(false)
            );
            projectLabelLayer.setMinZoom(8.1f);
            style.addLayer(projectLabelLayer);
            SymbolLayer sitePointLabelLayer = new SymbolLayer("nli-site-point-labels", SITE_POINT_SOURCE_ID)
                .withProperties(
                    textField(Expression.get("title")), textFont(new String[] { "Noto Sans Regular" }),
                    textSize(Expression.interpolate(
                        Expression.linear(), Expression.zoom(),
                        Expression.stop(11.4, 10f),
                        Expression.stop(16, 13f)
                    )),
                    textColor("#183528"),
                    textHaloColor("rgba(255,255,255,0.94)"), textHaloWidth(1.5f),
                    textOffset(new Float[] { 0f, -1.45f }), textAnchor(Property.TEXT_ANCHOR_BOTTOM),
                    textOptional(true), textAllowOverlap(false), textIgnorePlacement(false)
                );
            sitePointLabelLayer.setMinZoom(11.4f);
            style.addLayer(sitePointLabelLayer);
            style.addLayer(new LineLayer("nli-biography-path-lines", BIOGRAPHY_PATH_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("kind"), Expression.literal("path")))
                .withProperties(
                    lineColor("#59605c"), lineWidth(2f), lineOpacity(0.62f),
                    lineDasharray(new Float[] { 1.2f, 1.2f })
                ));
            style.addLayer(new CircleLayer("nli-biography-path-points", BIOGRAPHY_PATH_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("kind"), Expression.literal("point")))
                .withProperties(
                    circleRadius(5.2f), circleColor("#59605c"), circleOpacity(0.92f),
                    circleStrokeColor("#ffffff"), circleStrokeWidth(1.7f)
                ));
            style.addLayer(new SymbolLayer("nli-biography-path-numbers", BIOGRAPHY_PATH_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("kind"), Expression.literal("point")))
                .withProperties(
                    textField(Expression.get("label")), textFont(new String[] { "Noto Sans Regular" }),
                    textSize(9.5f), textColor("#ffffff"),
                    textHaloColor("rgba(42,47,44,0.8)"), textHaloWidth(0.6f),
                    textAllowOverlap(true), textIgnorePlacement(true)
                ));
            SymbolLayer biographyLabelLayer = new SymbolLayer("nli-biography-path-labels", BIOGRAPHY_PATH_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("kind"), Expression.literal("label")))
                .withProperties(
                    textField(Expression.get("compact_pin_label")),
                    textFont(new String[] { "Noto Sans Regular" }),
                    textSize(9.5f), textColor("#3f4742"),
                    textHaloColor("rgba(255,255,255,0.94)"), textHaloWidth(1.25f),
                    textOptional(true), textAllowOverlap(false), textIgnorePlacement(false)
                );
            biographyLabelLayer.setMinZoom(8.2f);
            style.addLayer(biographyLabelLayer);
            style.addLayer(new CircleLayer("nli-calendar-event-circles", EVENT_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("kind"), Expression.literal("calendar")))
                .withProperties(
                    circleRadius(9f), circleColor("#f7f0d4"), circleOpacity(0.98f),
                    circleStrokeColor("#315c48"), circleStrokeWidth(1.6f),
                    circleTranslate(new Float[] { 14f, -5f })
                ));
            style.addLayer(new SymbolLayer("nli-calendar-event-labels", EVENT_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("kind"), Expression.literal("calendar")))
                .withProperties(
                    textField(Expression.get("calendar_label")), textFont(new String[] { "Noto Sans Regular" }),
                    textSize(8.5f), textColor("#274c3c"),
                    textAllowOverlap(true), textIgnorePlacement(true),
                    textTranslate(new Float[] { 14f, -5f })
                ));
            style.addLayer(new CircleLayer("nli-exhibit-circles", EVENT_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("kind"), Expression.literal("exhibit")))
                .withProperties(
                    circleRadius(6.5f), circleColor("#7c3fc5"), circleOpacity(0.94f),
                    circleStrokeColor("#ffffff"), circleStrokeWidth(1.6f),
                    circleTranslate(new Float[] { 14f, -5f })
                ));
            style.addLayer(new CircleLayer("nli-story-markers", COMMUNITY_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("contribution_kind"), Expression.literal("story")))
                .withProperties(
                    circleRadius(7f), circleColor("#72577e"), circleOpacity(0.98f),
                    circleStrokeColor("#ffffff"), circleStrokeWidth(2.2f)
                ));
            style.addLayer(new CircleLayer("nli-plant-markers", COMMUNITY_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("contribution_kind"), Expression.literal("plant")))
                .withProperties(
                    circleRadius(7f), circleColor("#5d7d3a"), circleOpacity(0.98f),
                    circleStrokeColor("#ffffff"), circleStrokeWidth(2.2f)
                ));
            style.addLayer(new CircleLayer("nli-approved-suggestion-markers", COMMUNITY_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("contribution_kind"), Expression.literal("suggestion")))
                .withProperties(
                    circleRadius(8f), circleColor("#315c48"), circleOpacity(0.98f),
                    circleStrokeColor("#ffffff"), circleStrokeWidth(2.2f)
                ));
            style.addLayer(new SymbolLayer("nli-approved-suggestion-labels", COMMUNITY_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("contribution_kind"), Expression.literal("suggestion")))
                .withProperties(
                    textField("+"), textFont(new String[] { "Noto Sans Regular" }),
                    textSize(13f), textColor("#ffffff"),
                    textAllowOverlap(true), textIgnorePlacement(true)
                ));
            style.addLayer(new CircleLayer("nli-search-result-marker", TEMPORARY_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("temporary_kind"), Expression.literal("search")))
                .withProperties(
                    circleRadius(9f), circleColor("#c96c2e"), circleOpacity(1f),
                    circleStrokeColor("#ffffff"), circleStrokeWidth(3f)
                ));
            style.addLayer(new CircleLayer("nli-suggestion-draft-marker", TEMPORARY_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("temporary_kind"), Expression.literal("suggestion-draft")))
                .withProperties(
                    circleRadius(9f), circleColor("#245f44"), circleOpacity(1f),
                    circleStrokeColor("#ffffff"), circleStrokeWidth(3f)
                ));
            style.addLayer(new SymbolLayer("nli-suggestion-draft-label", TEMPORARY_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("temporary_kind"), Expression.literal("suggestion-draft")))
                .withProperties(
                    textField("+"), textFont(new String[] { "Noto Sans Regular" }),
                    textSize(14f), textColor("#ffffff"),
                    textAllowOverlap(true), textIgnorePlacement(true)
                ));
            style.addLayer(new CircleLayer("nli-search-selected-site-glow-outer", SEARCH_FOCUS_SOURCE_ID)
                .withProperties(
                    circleRadius(25f), circleColor("#ffd23e"), circleOpacity(0.18f),
                    circleStrokeColor("#ffe982"), circleStrokeWidth(3f)
                ));
            style.addLayer(new CircleLayer("nli-search-selected-site-glow-inner", SEARCH_FOCUS_SOURCE_ID)
                .withProperties(
                    circleRadius(13f), circleColor("#ffd23e"), circleOpacity(0.56f),
                    circleStrokeColor("#fff5a8"), circleStrokeWidth(3f)
                ));
            SymbolLayer selectedSiteLabelLayer = new SymbolLayer("nli-selected-site-label", TEMPORARY_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("temporary_kind"), Expression.literal("selected-site")))
                .withProperties(
                    textField(Expression.get("title")), textFont(new String[] { "Noto Sans Regular" }),
                    textSize(12f), textColor("#173528"),
                    textHaloColor("rgba(255,255,255,0.96)"), textHaloWidth(1.8f),
                    textOffset(new Float[] { 0f, -1.6f }), textAnchor(Property.TEXT_ANCHOR_BOTTOM),
                    textOptional(true), textAllowOverlap(false), textIgnorePlacement(false)
                );
            selectedSiteLabelLayer.setMinZoom(8f);
            style.addLayer(selectedSiteLabelLayer);
            style.addLayer(new LineLayer("nli-profile-path-line", PROFILE_PATH_SOURCE_ID).withProperties(
                lineColor("#315c48"), lineWidth(2.35f), lineOpacity(0.72f), lineDasharray(new Float[] { 2f, 1.5f })
            ));
            style.addLayer(new CircleLayer("nli-profile-point-circles", PROFILE_POINT_SOURCE_ID).withProperties(
                circleRadius(8f), circleColor("#315c48"), circleOpacity(0.96f),
                circleStrokeColor("#ffffff"), circleStrokeWidth(2.5f)
            ));
            style.addLayer(new SymbolLayer("nli-profile-point-numbers", PROFILE_POINT_SOURCE_ID).withProperties(
                textField(Expression.get("label")), textFont(new String[] { "Noto Sans Regular" }),
                textSize(10.5f), textColor("#ffffff"),
                textHaloColor("rgba(42,47,44,0.7)"), textHaloWidth(0.6f),
                textAllowOverlap(true), textIgnorePlacement(true)
            ));
            style.addLayer(new SymbolLayer("nli-moving-biography-canoes", MOVING_FEATURE_SOURCE_ID)
                .withFilter(Expression.all(
                    Expression.eq(Expression.get("moving_kind"), Expression.literal("biography")),
                    Expression.eq(Expression.get("on_water"), Expression.literal(true))
                ))
                .withProperties(
                    iconImage("nli-icon-biography-canoe"),
                    iconSize(Expression.interpolate(
                        Expression.linear(), Expression.zoom(),
                        Expression.stop(6, 0.62f),
                        Expression.stop(10, 0.72f),
                        Expression.stop(14, 0.86f)
                    )),
                    iconOpacity(Expression.coalesce(Expression.get("motion_opacity"), Expression.literal(1f))),
                    iconAllowOverlap(true), iconIgnorePlacement(true)
                ));
            style.addLayer(new SymbolLayer("nli-moving-biography-icons", MOVING_FEATURE_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("moving_kind"), Expression.literal("biography")))
                .withProperties(
                    iconImage(Expression.get("icon_key")),
                    iconSize(Expression.interpolate(
                        Expression.linear(), Expression.zoom(),
                        Expression.stop(6, 0.62f),
                        Expression.stop(10, 0.72f),
                        Expression.stop(14, 0.86f)
                    )),
                    iconOpacity(Expression.coalesce(Expression.get("motion_opacity"), Expression.literal(1f))),
                    iconAllowOverlap(true), iconIgnorePlacement(true)
                ));
            style.addLayer(new SymbolLayer("nli-moving-dog-icons", MOVING_FEATURE_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("moving_kind"), Expression.literal("dog")))
                .withProperties(
                    iconImage(Expression.get("icon_key")), iconSize(0.42f),
                    iconAllowOverlap(true), iconIgnorePlacement(true)
                ));
            style.addLayer(new SymbolLayer("nli-moving-whale-icons", MOVING_FEATURE_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("moving_kind"), Expression.literal("whale")))
                .withProperties(
                    iconImage(Expression.get("icon_key")), iconSize(0.88f),
                    iconAllowOverlap(true), iconIgnorePlacement(true)
                ));
            style.addLayer(new SymbolLayer("nli-moving-ship-icons", MOVING_FEATURE_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("moving_kind"), Expression.literal("ship")))
                .withProperties(
                    iconImage(Expression.get("icon_key")), iconSize(0.34f),
                    iconOpacity(Expression.coalesce(Expression.get("motion_opacity"), Expression.literal(1f))),
                    iconAllowOverlap(true), iconIgnorePlacement(true)
                ));
            style.addLayer(new SymbolLayer("nli-moving-feature-labels", MOVING_FEATURE_SOURCE_ID)
                .withFilter(Expression.eq(Expression.get("show_label"), Expression.literal(true)))
                .withProperties(
                    textField(Expression.get("label")), textFont(new String[] { "Noto Sans Regular" }), textSize(10f),
                    textColor("#1f2d25"), textHaloColor("rgba(255,255,255,0.96)"), textHaloWidth(1.25f),
                    textOffset(new Float[] { 0f, -2.3f }), textAllowOverlap(true), textIgnorePlacement(true),
                    textOpacity(Expression.coalesce(Expression.get("motion_opacity"), Expression.literal(1f)))
                ));
            styleReady = true;
            if (!usingOnlineArchive) startupStateReady = true;
            markStartupVisualChange();
            applyModeVisibility(style);
            if (pendingStateJson != null) {
                String stateJson = pendingStateJson;
                pendingStateJson = null;
                applyState(stateJson);
            }
            if (pendingTransientStateJson != null) {
                String transientStateJson = pendingTransientStateJson;
                pendingTransientStateJson = null;
                applyTransientState(transientStateJson);
            }
            Log.i(LOG_TAG, "MapLibre Native renderer is ready ("
                + (usingOnlineArchive ? "self-hosted z14" : "bundled z10") + ").");
        } catch (Exception error) {
            styleReady = false;
            Log.e(LOG_TAG, "Could not prepare bundled native map layers.", error);
        }
    }

    private void addSource(Style style, String id, String json) {
        GeoJsonSource source = new GeoJsonSource(id, FeatureCollection.fromJson(json));
        // Let MapLibre process GeoJSON on its normal worker path. Its forced
        // synchronous mode can invalidate symbol buckets while the camera is
        // scaling, which makes otherwise valid project icons disappear during
        // zoom. The bridge already coalesces state updates by signature.
        style.addSource(source);
    }

    private void addWaterNameLayer(
        Style style,
        String id,
        Expression filter,
        float minimumZoom,
        float minimumSize,
        float mediumSize,
        float maximumSize
    ) {
        SymbolLayer layer = new SymbolLayer(id, WATER_LABEL_SOURCE_ID)
            .withFilter(filter)
            .withProperties(
                textField(Expression.get("title")),
                textFont(new String[] { "Noto Sans Regular" }),
                textSize(Expression.interpolate(
                    Expression.linear(), Expression.zoom(),
                    Expression.stop(minimumZoom, minimumSize),
                    Expression.stop(15, mediumSize),
                    Expression.stop(18, maximumSize)
                )),
                textColor("#2f6471"),
                textHaloColor("rgba(255,255,255,0.96)"),
                textHaloWidth(1.35f),
                textOptional(true),
                textAllowOverlap(false),
                textIgnorePlacement(false)
            );
        layer.setMinZoom(minimumZoom);
        style.addLayer(layer);
    }

    private void addBundledMapIcons(Style style) {
        try {
            Bitmap canoe = Bitmap.createBitmap(64, 64, Bitmap.Config.ARGB_8888);
            Canvas canoeCanvas = new Canvas(canoe);
            Paint canoeFill = new Paint(Paint.ANTI_ALIAS_FLAG);
            canoeFill.setColor(Color.rgb(116, 73, 31));
            canoeFill.setStyle(Paint.Style.FILL);
            RectF canoeHull = new RectF(7f, 42f, 57f, 55f);
            canoeCanvas.drawRoundRect(canoeHull, 7f, 7f, canoeFill);
            Paint canoeStroke = new Paint(Paint.ANTI_ALIAS_FLAG);
            canoeStroke.setColor(Color.rgb(63, 41, 22));
            canoeStroke.setStyle(Paint.Style.STROKE);
            canoeStroke.setStrokeWidth(2.5f);
            canoeCanvas.drawRoundRect(canoeHull, 7f, 7f, canoeStroke);
            style.addImage("nli-icon-biography-canoe", canoe);
            String[] assets = activity.getAssets().list("assets/map-icons");
            if (assets == null) return;
            // Decode a few icons per frame. Dots remain visible underneath,
            // so artwork can arrive progressively without a long main-thread
            // pause before the first usable native map frame.
            mapView.post(() -> addBundledMapIconBatch(style, assets, 0, 0));
        } catch (Exception error) {
            Log.w(LOG_TAG, "Could not enumerate bundled project map icons.", error);
        }
    }

    private void addBundledMapIconBatch(Style style, String[] assets, int startIndex, int loadedCount) {
        if (!styleReady || map == null || map.getStyle() == null || assets == null) return;
        int index = Math.max(0, startIndex);
        int processed = 0;
        int loaded = loadedCount;
        while (index < assets.length && processed < BUNDLED_ICON_BATCH_SIZE) {
            String filename = assets[index++];
            processed += 1;
            if (filename == null || !filename.toLowerCase(Locale.ROOT).endsWith(".png")) continue;
            String base = filename.substring(0, filename.length() - 4)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
            if (base.isEmpty()) continue;
            try (InputStream input = activity.getAssets().open("assets/map-icons/" + filename)) {
                Bitmap source = BitmapFactory.decodeStream(input);
                if (source == null || source.getWidth() < 1 || source.getHeight() < 1) continue;
                Bitmap normalized = Bitmap.createBitmap(64, 64, Bitmap.Config.ARGB_8888);
                Canvas canvas = new Canvas(normalized);
                Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
                float scale = Math.min(56f / source.getWidth(), 56f / source.getHeight());
                float width = source.getWidth() * scale;
                float height = source.getHeight() * scale;
                float left = (64f - width) / 2f;
                float top = (64f - height) / 2f;
                canvas.drawBitmap(source, null, new RectF(left, top, left + width, top + height), paint);
                style.addImage("nli-icon-" + base, normalized);
                if ("dog-moving-icon".equals(base) || "whaling-moving-whale".equals(base)) {
                    Matrix mirror = new Matrix();
                    mirror.preScale(-1f, 1f);
                    Bitmap mirrored = Bitmap.createBitmap(normalized, 0, 0, normalized.getWidth(), normalized.getHeight(), mirror, true);
                    style.addImage("nli-icon-" + base + "-left", mirrored);
                }
                source.recycle();
                loaded += 1;
            } catch (Exception iconError) {
                Log.w(LOG_TAG, "Could not load bundled map icon " + filename + ".", iconError);
            }
        }
        if (index < assets.length) {
            int nextIndex = index;
            int nextLoaded = loaded;
            mapView.postDelayed(
                () -> addBundledMapIconBatch(style, assets, nextIndex, nextLoaded),
                16L
            );
        } else {
            Log.i(LOG_TAG, "Loaded " + loaded + " bundled project map icons in paced batches.");
        }
    }

    void applyState(String stateJson) {
        if (stateJson == null || stateJson.isEmpty() || stateJson.length() > MAX_STATE_BYTES) return;
        currentStateJson = stateJson;
        if (!styleReady || map == null || map.getStyle() == null) {
            pendingStateJson = stateJson;
            return;
        }
        try {
            JSONObject payload = new JSONObject(stateJson);
            String signature = payload.optString("signature", "");
            String baseSignature = payload.optString("baseSignature", signature);
            profileMode = "profile".equals(payload.optString("mode", "public"));
            String nextBasemap = normalizeBasemap(payload.optString("basemap", "outdoors"));
            if (!nextBasemap.equals(currentBasemap)) {
                currentBasemap = nextBasemap;
                collapseMapCredit();
            }
            Style style = map.getStyle();
            if (!signature.isEmpty() && signature.equals(lastStateSignature)) {
                applyModeVisibility(style);
                applyCamera(payload.optJSONObject("camera"));
                return;
            }
            boolean baseStateChanged = baseSignature.isEmpty() || !baseSignature.equals(lastBaseStateSignature);
            if (baseStateChanged) {
                JSONObject sitePoints = applyBundledSiteIconKeys(payload.optJSONObject("sitePoints"));
                boolean authoritativeGeometryReady = payload.optBoolean("geometryReady", false);
                boolean nextStartupStateReady = authoritativeGeometryReady
                    && (profileMode || featureCount(sitePoints) > 0);
                boolean startupStateChanged = !startupStateReady || baseSignature.isEmpty() || !baseSignature.equals(lastBaseStateSignature);
                startupStateReady = startupStateReady || nextStartupStateReady;
                if (startupVisualTracking && nextStartupStateReady && startupStateChanged) markStartupVisualChange();
                setTerritorySource(style, payload.optJSONObject("territories"));
                setSource(style, SITE_POLYGON_SOURCE_ID, payload.optJSONObject("sitePolygons"));
                setSource(style, SITE_POINT_SOURCE_ID, sitePoints);
                setSource(style, LABEL_SOURCE_ID, withBundledTerritoryLabels(payload.optJSONObject("labels")));
                setSource(style, BIOGRAPHY_PATH_SOURCE_ID, payload.optJSONObject("biographyPaths"));
                setSource(style, EVENT_SOURCE_ID, payload.optJSONObject("events"));
                setSource(style, PROFILE_PATH_SOURCE_ID, payload.optJSONObject("profilePath"));
                setSource(style, PROFILE_POINT_SOURCE_ID, payload.optJSONObject("profilePoints"));
                Log.i(LOG_TAG, "Applied native map base state " + payload.optString("mode", "public")
                    + " reason=" + payload.optString("reason", "state")
                    + ": geometryReady=" + authoritativeGeometryReady
                    + ", territories=" + featureCount(payload.optJSONObject("territories"))
                    + ", polygons=" + featureCount(payload.optJSONObject("sitePolygons"))
                    + ", points=" + featureCount(sitePoints)
                    + ", customIcons=" + featureCountWithStringProperty(sitePoints, "native_icon_key")
                    + ", biographyPaths=" + featureCount(payload.optJSONObject("biographyPaths"))
                    + ", events=" + featureCount(payload.optJSONObject("events"))
                    + ", journey=" + featureCount(payload.optJSONObject("profilePath"))
                    + ", profilePoints=" + featureCount(payload.optJSONObject("profilePoints")));
                lastBaseStateSignature = baseSignature;
            }
            setSource(style, USER_LOCATION_SOURCE_ID, payload.optJSONObject("userLocation"));
            setSource(style, COMMUNITY_SOURCE_ID, payload.optJSONObject("communityContributions"));
            setSource(style, TEMPORARY_SOURCE_ID, payload.optJSONObject("temporaryMarkers"));
            if (!baseStateChanged) {
                Log.d(LOG_TAG, "Applied transient native map state"
                    + ": userLocation=" + featureCount(payload.optJSONObject("userLocation"))
                    + ", community=" + featureCount(payload.optJSONObject("communityContributions"))
                    + ", temporary=" + featureCount(payload.optJSONObject("temporaryMarkers")));
            } else {
                Log.i(LOG_TAG, "Applied native map transient layers"
                    + ": userLocation=" + featureCount(payload.optJSONObject("userLocation"))
                    + ", community=" + featureCount(payload.optJSONObject("communityContributions"))
                    + ", temporary=" + featureCount(payload.optJSONObject("temporaryMarkers")));
            }
            lastStateSignature = signature;
            applyModeVisibility(style);
            applyCamera(payload.optJSONObject("camera"));
            mapView.invalidate();
        } catch (Exception error) {
            Log.e(LOG_TAG, "Ignored invalid native map state.", error);
        }
    }

    void applyTransientState(String stateJson) {
        if (stateJson == null || stateJson.isEmpty() || stateJson.length() > 512 * 1024) return;
        if (!styleReady || map == null || map.getStyle() == null) {
            pendingTransientStateJson = stateJson;
            return;
        }
        try {
            JSONObject payload = new JSONObject(stateJson);
            String signature = payload.optString("signature", "");
            Style style = map.getStyle();
            if (!signature.isEmpty() && signature.equals(lastStateSignature)) {
                return;
            }
            setSource(style, USER_LOCATION_SOURCE_ID, payload.optJSONObject("userLocation"));
            setSource(style, COMMUNITY_SOURCE_ID, payload.optJSONObject("communityContributions"));
            setSource(style, TEMPORARY_SOURCE_ID, payload.optJSONObject("temporaryMarkers"));
            boolean eventsUpdated = payload.has("events");
            if (eventsUpdated) {
                setSource(style, EVENT_SOURCE_ID, payload.optJSONObject("events"));
            }
            boolean pointsUpdated = payload.has("sitePoints");
            boolean labelsUpdated = payload.has("labels");
            boolean unreadUpdated = payload.has("unreadBadges");
            if (pointsUpdated) {
                setSource(style, SITE_POINT_SOURCE_ID, applyBundledSiteIconKeys(payload.optJSONObject("sitePoints")));
            }
            if (labelsUpdated) {
                setSource(style, LABEL_SOURCE_ID, withBundledTerritoryLabels(payload.optJSONObject("labels")));
            }
            if ((pointsUpdated || labelsUpdated || eventsUpdated || unreadUpdated) && currentStateJson != null && !currentStateJson.isEmpty()) {
                JSONObject cachedState = new JSONObject(currentStateJson);
                if (pointsUpdated) cachedState.put("sitePoints", payload.optJSONObject("sitePoints"));
                if (labelsUpdated) cachedState.put("labels", payload.optJSONObject("labels"));
                if (eventsUpdated) cachedState.put("events", payload.optJSONObject("events"));
                if (unreadUpdated) {
                    JSONObject unreadBadges = payload.optJSONObject("unreadBadges");
                    JSONObject sitePoints = applyUnreadBadges(cachedState.optJSONObject("sitePoints"), unreadBadges);
                    JSONObject labels = applyUnreadBadges(cachedState.optJSONObject("labels"), unreadBadges);
                    cachedState.put("sitePoints", sitePoints);
                    cachedState.put("labels", labels);
                    setSource(style, SITE_POINT_SOURCE_ID, applyBundledSiteIconKeys(sitePoints));
                    setSource(style, LABEL_SOURCE_ID, withBundledTerritoryLabels(labels));
                }
                currentStateJson = cachedState.toString();
            }
            lastStateSignature = signature;
            applyModeVisibility(style);
            mapView.invalidate();
            Log.d(LOG_TAG, "Applied compact transient native map state"
                + ": bytes=" + stateJson.length()
                + ", userLocation=" + featureCount(payload.optJSONObject("userLocation"))
                + ", community=" + featureCount(payload.optJSONObject("communityContributions"))
                + ", temporary=" + featureCount(payload.optJSONObject("temporaryMarkers"))
                + ", events=" + featureCount(payload.optJSONObject("events"))
                + ", eventsUpdated=" + eventsUpdated
                + ", unreadUpdated=" + unreadUpdated
                + ", sitePointsUpdated=" + pointsUpdated
                + ", labelsUpdated=" + labelsUpdated
                + ", reason=" + payload.optString("reason", "state"));
        } catch (Exception error) {
            Log.e(LOG_TAG, "Ignored invalid transient native map state.", error);
        }
    }

    void updateMovingFeatures(String featuresJson) {
        if (featuresJson == null || featuresJson.isEmpty() || featuresJson.length() > 256 * 1024) return;
        movingFeaturesJson = featuresJson;
        if (startupVisualTracking && !startupMovingFeaturesSeen) {
            try {
                JSONArray features = new JSONObject(featuresJson).optJSONArray("features");
                if (features != null && features.length() > 0) {
                    startupMovingFeaturesSeen = true;
                    markStartupVisualChange();
                }
            } catch (Exception ignored) {}
        }
        if (nativeGestureInProgress()) return;
        long elapsed = SystemClock.uptimeMillis() - lastMovingFeatureApplyAt;
        mapView.removeCallbacks(applyLatestMovingFeaturesTask);
        if (elapsed >= MOVING_FEATURE_MIN_UPDATE_MS) {
            applyMovingFeaturesToStyle();
        } else {
            mapView.postDelayed(applyLatestMovingFeaturesTask, MOVING_FEATURE_MIN_UPDATE_MS - elapsed);
        }
    }

    private void applyMovingFeaturesToStyle() {
        try {
            applyMovingFeaturesToStyle(FeatureCollection.fromJson(movingFeaturesJson));
        } catch (Exception error) {
            Log.w(LOG_TAG, "Could not resume native moving features after map interaction.", error);
        }
    }

    private void applyMovingFeaturesToStyle(FeatureCollection collection) {
        if (!styleReady || map == null || map.getStyle() == null || collection == null) return;
        GeoJsonSource source = map.getStyle().getSourceAs(MOVING_FEATURE_SOURCE_ID);
        if (source != null) {
            source.setGeoJson(collection);
            lastMovingFeatureApplyAt = SystemClock.uptimeMillis();
            recordMovingFeatureDebugSample(collection, lastMovingFeatureApplyAt);
        }
    }

    private void recordMovingFeatureDebugSample(FeatureCollection collection, long now) {
        if (!BuildConfig.DEBUG) return;
        if (movingFeatureDebugWindowStartedAt <= 0L) movingFeatureDebugWindowStartedAt = now;
        if (movingFeatureDebugLastApplyAt > 0L) {
            movingFeatureDebugMaxGapMs = Math.max(movingFeatureDebugMaxGapMs, now - movingFeatureDebugLastApplyAt);
        }
        movingFeatureDebugLastApplyAt = now;
        movingFeatureDebugApplyCount += 1;
        long windowMs = now - movingFeatureDebugWindowStartedAt;
        if (windowMs < 1000L) return;

        String sample = "none";
        try {
            List<Feature> features = collection.features();
            if (features != null) {
                for (Feature feature : features) {
                    if (!"biography".equals(feature.getStringProperty("moving_kind")) || !(feature.geometry() instanceof Point)) continue;
                    Point point = (Point) feature.geometry();
                    sample = String.format(Locale.US, "%.7f,%.7f", point.longitude(), point.latitude());
                    break;
                }
            }
        } catch (Exception ignored) {}
        double zoom = map == null || map.getCameraPosition() == null ? Double.NaN : map.getCameraPosition().zoom;
        double averageGapMs = movingFeatureDebugApplyCount <= 1
            ? windowMs
            : (double) windowMs / (double) (movingFeatureDebugApplyCount - 1);
        Log.d(LOG_TAG, String.format(
            Locale.US,
            "Moving feature cadence: zoom=%.2f updates=%d avgGapMs=%.1f maxGapMs=%d sample=%s",
            zoom,
            movingFeatureDebugApplyCount,
            averageGapMs,
            movingFeatureDebugMaxGapMs,
            sample
        ));
        movingFeatureDebugWindowStartedAt = now;
        movingFeatureDebugApplyCount = 0;
        movingFeatureDebugMaxGapMs = 0L;
    }

    private void setTerritorySource(Style style, JSONObject collection) throws Exception {
        GeoJsonSource source = style.getSourceAs(TERRITORY_SOURCE_ID);
        if (source == null) return;
        if (featureCount(collection) >= BUNDLED_TERRITORY_SLUGS.length) {
            source.setGeoJson(FeatureCollection.fromJson(collection.toString()));
        } else {
            source.setGeoJson(FeatureCollection.fromJson(bundledTerritoryGeoJson(false)));
        }
    }

    private JSONObject withBundledTerritoryLabels(JSONObject collection) throws Exception {
        JSONObject merged = new JSONObject(bundledTerritoryGeoJson(true));
        JSONArray features = merged.getJSONArray("features");
        JSONArray incoming = collection == null ? null : collection.optJSONArray("features");
        if (incoming == null) return merged;
        for (int index = 0; index < incoming.length(); index++) {
            JSONObject feature = incoming.optJSONObject(index);
            JSONObject properties = feature == null ? null : feature.optJSONObject("properties");
            if (properties == null || "territory".equals(properties.optString("label_kind", ""))) continue;
            features.put(feature);
        }
        return merged;
    }

    private JSONObject applyUnreadBadges(JSONObject collection, JSONObject unreadBadges) throws Exception {
        if (collection == null) return new JSONObject("{\"type\":\"FeatureCollection\",\"features\":[]}");
        JSONArray features = collection.optJSONArray("features");
        if (features == null) return collection;
        JSONObject counts = unreadBadges == null ? new JSONObject() : unreadBadges;
        for (int index = 0; index < features.length(); index++) {
            JSONObject feature = features.optJSONObject(index);
            JSONObject properties = feature == null ? null : feature.optJSONObject("properties");
            if (properties == null) continue;
            String slug = properties.optString("slug", "");
            if (slug.isEmpty()) continue;
            int unreadCount = Math.max(0, counts.optInt(slug, 0));
            properties.put("unread_count", unreadCount);
            properties.put("unread_label", unreadCount > 99 ? "99+" : String.valueOf(unreadCount));
            properties.put("unread_icon", unreadCount > 0
                ? "mobile-unread-count-" + (unreadCount > 99 ? "99-plus" : unreadCount)
                : "");
        }
        return collection;
    }

    private void setSource(Style style, String id, JSONObject collection) {
        GeoJsonSource source = style.getSourceAs(id);
        if (source == null) return;
        source.setGeoJson(FeatureCollection.fromJson(collection == null ? EMPTY_FEATURE_COLLECTION : collection.toString()));
    }

    private int featureCount(JSONObject collection) {
        JSONArray features = collection == null ? null : collection.optJSONArray("features");
        return features == null ? 0 : features.length();
    }

    private int featureCountWithStringProperty(JSONObject collection, String propertyName) {
        JSONArray features = collection == null ? null : collection.optJSONArray("features");
        if (features == null || propertyName == null || propertyName.isEmpty()) return 0;
        int count = 0;
        for (int index = 0; index < features.length(); index++) {
            JSONObject feature = features.optJSONObject(index);
            JSONObject properties = feature == null ? null : feature.optJSONObject("properties");
            if (properties != null && !properties.optString(propertyName, "").trim().isEmpty()) count += 1;
        }
        return count;
    }

    private JSONObject applyBundledSiteIconKeys(JSONObject collection) {
        if (collection == null) return null;
        JSONArray features = collection.optJSONArray("features");
        if (features == null) return collection;
        for (int index = 0; index < features.length(); index++) {
            JSONObject feature = features.optJSONObject(index);
            JSONObject properties = feature == null ? null : feature.optJSONObject("properties");
            if (properties == null || !properties.optString("native_icon_key", "").trim().isEmpty()) continue;
            String slug = properties.optString("slug", "").trim();
            String iconKey = bundledSiteIconKeysBySlug.optString(slug, "").trim();
            if (!iconKey.isEmpty()) {
                try {
                    properties.put("native_icon_key", iconKey);
                } catch (Exception ignored) {
                    // A malformed optional property must not prevent the site
                    // point itself from rendering as the quiet fallback dot.
                }
            }
        }
        return collection;
    }

    private void addLandLayerBelowBaseWater(Style style, Layer layer) {
        if (style == null || layer == null) return;
        if (style.getLayer(BASE_WATER_LAYER_ID) != null) {
            style.addLayerBelow(layer, BASE_WATER_LAYER_ID);
        } else {
            // The blank emergency style has no vector shoreline. In that case
            // the reviewed display geometry remains the authoritative fallback.
            style.addLayer(layer);
        }
    }

    private void applyModeVisibility(Style style) {
        if (style == null) return;
        boolean satelliteBasemap = "satellite".equals(currentBasemap);
        setLayerVisibility(style, SITE_NON_LAND_FILL_LAYER_ID, !profileMode);
        setLayerVisibility(style, SITE_NON_LAND_LINE_LAYER_ID, !profileMode);
        setLayerVisibility(style, SITE_LAND_FILL_LAYER_ID, !profileMode && !satelliteBasemap);
        setLayerVisibility(style, SITE_LAND_LINE_LAYER_ID, !profileMode && !satelliteBasemap);
        setLayerVisibility(style, SITE_LAND_SATELLITE_FILL_LAYER_ID, !profileMode && satelliteBasemap);
        setLayerVisibility(style, SITE_LAND_SATELLITE_LINE_LAYER_ID, !profileMode && satelliteBasemap);
        setLayerVisibility(style, "nli-site-point-circles", !profileMode);
        setLayerVisibility(style, "nli-site-point-icons", !profileMode);
        setLayerVisibility(style, "nli-site-point-labels", !profileMode);
        // The 13 ancestral lands remain available as permanent map context,
        // independent of the ordinary boundary/label filters.
        setLayerVisibility(style, TERRITORY_FILL_LAYER_ID, !satelliteBasemap);
        setLayerVisibility(style, TERRITORY_LINE_LAYER_ID, !satelliteBasemap);
        setLayerVisibility(style, TERRITORY_SATELLITE_FILL_LAYER_ID, satelliteBasemap);
        setLayerVisibility(style, TERRITORY_SATELLITE_LINE_LAYER_ID, satelliteBasemap);
        setLayerVisibility(style, "nli-territory-labels", true);
        setLayerVisibility(style, "nli-biography-path-lines", !profileMode);
        setLayerVisibility(style, "nli-biography-path-points", !profileMode);
        setLayerVisibility(style, "nli-biography-path-numbers", !profileMode);
        setLayerVisibility(style, "nli-biography-path-labels", !profileMode);
        setLayerVisibility(style, "nli-calendar-event-circles", !profileMode);
        setLayerVisibility(style, "nli-calendar-event-labels", !profileMode);
        setLayerVisibility(style, "nli-exhibit-circles", !profileMode);
        setLayerVisibility(style, "nli-site-unread-badges", !profileMode);
        setLayerVisibility(style, "nli-site-unread-counts", !profileMode);
        setLayerVisibility(style, "nli-user-location-outer", !profileMode);
        setLayerVisibility(style, "nli-user-location-inner", !profileMode);
        setLayerVisibility(style, "nli-story-markers", !profileMode);
        setLayerVisibility(style, "nli-plant-markers", !profileMode);
        setLayerVisibility(style, "nli-approved-suggestion-markers", !profileMode);
        setLayerVisibility(style, "nli-approved-suggestion-labels", !profileMode);
        setLayerVisibility(style, "nli-search-result-marker", !profileMode);
        setLayerVisibility(style, "nli-suggestion-draft-marker", !profileMode);
        setLayerVisibility(style, "nli-suggestion-draft-label", !profileMode);
        setLayerVisibility(style, "nli-search-selected-site-glow-outer", !profileMode);
        setLayerVisibility(style, "nli-search-selected-site-glow-inner", !profileMode);
        setLayerVisibility(style, "nli-selected-site-label", !profileMode);
        setLayerVisibility(style, "nli-profile-path-line", profileMode);
        setLayerVisibility(style, "nli-profile-point-circles", profileMode);
        setLayerVisibility(style, "nli-profile-point-numbers", profileMode);
        setLayerVisibility(style, "nli-moving-biography-canoes", !profileMode);
        setLayerVisibility(style, "nli-moving-biography-icons", !profileMode);
        setLayerVisibility(style, "nli-moving-dog-icons", !profileMode);
        setLayerVisibility(style, "nli-moving-whale-icons", !profileMode);
        setLayerVisibility(style, "nli-moving-ship-icons", !profileMode);
        setLayerVisibility(style, "nli-moving-feature-labels", !profileMode);
        applyBasemapVisibility(style);
        refreshMapCreditForVisibleBasemap();
        FillLayer islandFill = style.getLayerAs("nli-island-fill");
        if (islandFill != null) islandFill.setProperties(fillOpacity(profileMode ? 0.16f : 0.04f));
    }

    private void setLayerVisibility(Style style, String id, boolean visible) {
        if (style.getLayer(id) != null) style.getLayer(id).setProperties(visibility(visible ? Property.VISIBLE : Property.NONE));
    }

    private String normalizeBasemap(String value) {
        if ("streets".equals(value) || "satellite".equals(value) || "blank".equals(value)) return value;
        return "outdoors";
    }

    private void applyBasemapVisibility(Style style) {
        boolean satellite = !profileMode && "satellite".equals(currentBasemap);
        boolean vector = !profileMode && !satellite && !"blank".equals(currentBasemap);
        for (String id : PUBLIC_BASE_LAYER_IDS) setLayerVisibility(style, id, vector);
        setLayerVisibility(style, SATELLITE_LAYER_ID, satellite);
    }

    private void applyCamera(JSONObject camera) {
        if (camera == null || map == null || nativeGestureInProgress()) return;
        JSONArray center = camera.optJSONArray("center");
        if (center == null || center.length() < 2) return;
        double longitude = center.optDouble(0, Double.NaN);
        double latitude = center.optDouble(1, Double.NaN);
        double zoom = camera.optDouble("zoom", Double.NaN);
        double bearing = camera.optDouble("bearing", Double.NaN);
        double tilt = camera.optDouble("pitch", Double.NaN);
        updateCamera(longitude, latitude, zoom, bearing, tilt);
    }

    void updateCamera(double longitude, double latitude, double zoom) {
        updateCamera(longitude, latitude, zoom, Double.NaN, Double.NaN);
    }

    void updateCamera(double longitude, double latitude, double zoom, double bearing, double tilt) {
        if (map == null || nativeGestureInProgress()
            || !Double.isFinite(longitude) || !Double.isFinite(latitude) || !Double.isFinite(zoom)) return;
        CameraPosition current = map.getCameraPosition();
        double desiredBearing = Double.isFinite(bearing) ? bearing : (current == null ? 0.0 : current.bearing);
        double desiredTilt = Double.isFinite(tilt) ? tilt : (current == null ? 0.0 : current.tilt);
        CameraPosition desired = new CameraPosition.Builder()
            .target(new LatLng(latitude, longitude))
            .zoom(Math.max(6.0, Math.min(18.0, zoom)))
            .bearing(desiredBearing)
            .tilt(Math.max(0.0, Math.min(60.0, desiredTilt)))
            .build();
        stableCamera = desired;
        if (sameCamera(current, desired)) return;
        markStartupVisualChange();
        cameraIntentRevision += 1;
        cameraGestureAwaitingIdle = false;
        suppressNextCameraCallback = true;
        map.moveCamera(CameraUpdateFactory.newCameraPosition(desired));
    }

    void focusSearchResult(double longitude, double latitude, double zoom, int durationMs) {
        updateCamera(longitude, latitude, zoom);
        if (map == null || !Double.isFinite(longitude) || !Double.isFinite(latitude)) return;
        int generation = ++searchFocusGeneration;
        map.getStyle(style -> {
            GeoJsonSource source = style.getSourceAs(SEARCH_FOCUS_SOURCE_ID);
            if (source == null) return;
            source.setGeoJson(FeatureCollection.fromFeature(
                Feature.fromGeometry(Point.fromLngLat(longitude, latitude))
            ));
            mapView.postDelayed(() -> {
                if (generation != searchFocusGeneration || map == null) return;
                map.getStyle(currentStyle -> {
                    GeoJsonSource currentSource = currentStyle.getSourceAs(SEARCH_FOCUS_SOURCE_ID);
                    if (currentSource != null) currentSource.setGeoJson(FeatureCollection.fromFeatures(new Feature[] {}));
                });
            }, Math.max(900, Math.min(6000, durationMs)));
        });
    }

    private boolean sameCamera(CameraPosition first, CameraPosition second) {
        if (first == null || second == null || first.target == null || second.target == null) return false;
        return Math.abs(first.target.getLongitude() - second.target.getLongitude()) < 0.00001
            && Math.abs(first.target.getLatitude() - second.target.getLatitude()) < 0.00001
            && Math.abs(first.zoom - second.zoom) < 0.01
            && Math.abs(first.bearing - second.bearing) < 0.1
            && Math.abs(first.tilt - second.tilt) < 0.1;
    }

    private void notifyCameraChanged() {
        if (map == null) return;
        if (suppressNextCameraCallback) {
            suppressNextCameraCallback = false;
            return;
        }
        CameraPosition position = map.getCameraPosition();
        if (position == null || listener == null) return;
        boolean gestureSettled = cameraGestureAwaitingIdle;
        if (gestureSettled) {
            stableCamera = position;
            cameraGestureAwaitingIdle = false;
            applyMovingFeaturesToStyle();
            listener.onGestureChanged(false);
        }
        listener.onCameraChanged(
            position.target.getLongitude(),
            position.target.getLatitude(),
            position.zoom,
            position.bearing,
            position.tilt
        );
    }

    private boolean handleMapClick(LatLng point) {
        if (map == null || point == null || listener == null) return false;
        stableCamera = map.getCameraPosition();
        cameraGestureAwaitingIdle = false;
        listener.onGestureChanged(false);
        // Query the frame the user actually pressed. Applying the latest
        // moving-feature payload here can relocate a biography icon between
        // ACTION_UP and hit testing, making the visible person impossible to
        // select. The normal animation sync resumes immediately afterward.
        // MapLibre can still emit a click callback for a synthetic or low-rate
        // drag whose ACTION_UP lands over a feature. A moved map gesture owns
        // the release and must never open whatever marker happens to be below
        // the finger at that moment.
        if (routedGestureMoved) return false;
        PointF screenPoint = map.getProjection().toScreenLocation(point);
        if (!profileMode) {
            List<Feature> territoryLabels = map.queryRenderedFeatures(screenPoint, "nli-territory-labels");
            if (territoryLabels != null) {
                for (Feature territoryLabel : territoryLabels) {
                    if (territoryLabel != null && territoryLabel.hasProperty("slug")) {
                        listener.onFeatureSelected("site", territoryLabel.getStringProperty("slug"));
                        return true;
                    }
                }
            }
            // A directly pressed marker must still beat the territory painted
            // underneath it. Only after checking the exact pixel do we let the
            // enclosing territory beat the much wider accessibility hit box.
            List<Feature> exactPoints = map.queryRenderedFeatures(screenPoint,
                "nli-suggestion-draft-label", "nli-suggestion-draft-marker", "nli-search-result-marker",
                "nli-approved-suggestion-labels", "nli-approved-suggestion-markers",
                "nli-plant-markers", "nli-story-markers", "nli-selected-site-label",
                "nli-moving-feature-labels", "nli-moving-biography-canoes", "nli-moving-biography-icons", "nli-moving-dog-icons", "nli-moving-whale-icons", "nli-moving-ship-icons",
                "nli-calendar-event-labels", "nli-calendar-event-circles", "nli-exhibit-circles",
                "nli-biography-path-numbers", "nli-biography-path-points", "nli-biography-path-labels",
                "nli-site-point-labels", "nli-site-point-icons", "nli-site-point-circles");
            if (exactPoints == null) exactPoints = Collections.emptyList();
            Feature exactPoint = nearestActionablePointFeature(exactPoints, screenPoint, false);
            if (dispatchActionablePointFeature(exactPoint, false)) return true;

            // A precise press on a reviewed site polygon beats unrelated
            // point artwork that only intersects the expanded accessibility
            // box. Pins still win when their rendered pixels are pressed.
            List<Feature> exactSiteSurfaces = map.queryRenderedFeatures(
                screenPoint,
                SITE_LAND_FILL_LAYER_ID,
                SITE_LAND_SATELLITE_FILL_LAYER_ID,
                SITE_NON_LAND_FILL_LAYER_ID
            );
            if (exactSiteSurfaces != null) {
                for (Feature surface : exactSiteSurfaces) {
                    if (surface != null && surface.hasProperty("slug")) {
                        listener.onFeatureSelected("site", surface.getStringProperty("slug"));
                        return true;
                    }
                }
            }

        }
        // Project artwork is intentionally compact, and several legacy PNGs
        // place their visible drawing low inside a transparent square. A tap
        // on the visible house/building can therefore sit more than 20 dp from
        // the geographic anchor. Use a 64 dp square so the artwork wins over
        // the territory/polygon underneath without visually enlarging it.
        float hitRadius = mapTapHitRadiusPx();
        RectF hitBox = new RectF(
            screenPoint.x - hitRadius,
            screenPoint.y - hitRadius,
            screenPoint.x + hitRadius,
            screenPoint.y + hitRadius
        );
        List<Feature> features = map.queryRenderedFeatures(hitBox,
            "nli-profile-point-numbers", "nli-profile-point-circles",
            "nli-suggestion-draft-label", "nli-suggestion-draft-marker", "nli-search-result-marker",
            "nli-approved-suggestion-labels", "nli-approved-suggestion-markers",
            "nli-plant-markers", "nli-story-markers", "nli-selected-site-label",
            "nli-moving-feature-labels", "nli-moving-biography-canoes", "nli-moving-biography-icons", "nli-moving-dog-icons", "nli-moving-whale-icons", "nli-moving-ship-icons",
            "nli-calendar-event-labels", "nli-calendar-event-circles", "nli-exhibit-circles",
            "nli-biography-path-numbers", "nli-biography-path-points", "nli-biography-path-labels",
            "nli-site-point-labels", "nli-site-point-icons", "nli-site-point-circles",
            SITE_LAND_FILL_LAYER_ID, SITE_LAND_SATELLITE_FILL_LAYER_ID, SITE_NON_LAND_FILL_LAYER_ID);
        if (features == null) features = Collections.emptyList();
        Feature nearestPoint = nearestActionablePointFeature(features, screenPoint, profileMode);
        if (dispatchActionablePointFeature(nearestPoint, profileMode)) return true;
        for (Feature feature : features) {
            if (feature == null || feature.properties() == null) continue;
            if (feature.hasProperty("wiki_slug")) {
                listener.onFeatureSelected("wiki", feature.getStringProperty("wiki_slug"));
                return true;
            }
            if (feature.hasProperty("slug")) {
                listener.onFeatureSelected("site", feature.getStringProperty("slug"));
                return true;
            }
        }
        if (!profileMode) {
            // The permanent ancestral-land surface is deliberately broad.
            // Give compact project pins and specific polygons their full
            // accessible hit area before falling back to that background.
            List<Feature> territorySurfaces = map.queryRenderedFeatures(
                screenPoint,
                TERRITORY_FILL_LAYER_ID,
                TERRITORY_LINE_LAYER_ID,
                TERRITORY_SATELLITE_FILL_LAYER_ID,
                TERRITORY_SATELLITE_LINE_LAYER_ID
            );
            if (territorySurfaces != null) {
                for (Feature territorySurface : territorySurfaces) {
                    if (territorySurface != null && territorySurface.hasProperty("slug")) {
                        listener.onFeatureSelected("site", territorySurface.getStringProperty("slug"));
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private boolean dispatchActionablePointFeature(Feature feature, boolean profileOnly) {
        if (feature == null) return false;
        if (profileOnly && feature.hasProperty("index")) {
            listener.onFeatureSelected(
                "profile",
                String.valueOf(feature.getNumberProperty("index").intValue())
            );
            return true;
        }
        if (feature.hasProperty("event_key")) {
            listener.onFeatureSelected("event", feature.getStringProperty("event_key"));
            return true;
        }
        if (feature.hasProperty("native_kind") && feature.hasProperty("native_key")) {
            listener.onFeatureSelected(
                feature.getStringProperty("native_kind"),
                feature.getStringProperty("native_key")
            );
            return true;
        }
        if (feature.hasProperty("wiki_slug")) {
            listener.onFeatureSelected("wiki", feature.getStringProperty("wiki_slug"));
            return true;
        }
        if (feature.hasProperty("slug")) {
            listener.onFeatureSelected("site", feature.getStringProperty("slug"));
            return true;
        }
        return false;
    }

    /**
     * MapLibre returns every rendered feature intersecting the expanded touch
     * box, not necessarily the one closest to the finger. Picking the first
     * result made dense clusters open an adjacent site and made the pressed
     * artwork appear unresponsive. Prefer the closest actionable point while
     * retaining event-over-site priority when two markers share coordinates.
     */
    private Feature nearestActionablePointFeature(
        List<Feature> features,
        PointF pressedPoint,
        boolean profileOnly
    ) {
        Feature nearest = null;
        double nearestDistance = Double.POSITIVE_INFINITY;
        int nearestPriority = Integer.MAX_VALUE;
        for (Feature feature : features) {
            if (feature == null || feature.properties() == null) continue;
            boolean actionable = profileOnly
                ? feature.hasProperty("index")
                : feature.hasProperty("event_key")
                    || (feature.hasProperty("native_kind") && feature.hasProperty("native_key"))
                    || feature.hasProperty("wiki_slug")
                    || feature.hasProperty("slug");
            if (!actionable || !(feature.geometry() instanceof org.maplibre.geojson.Point)) continue;
            org.maplibre.geojson.Point featurePoint = (org.maplibre.geojson.Point) feature.geometry();
            PointF renderedPoint = map.getProjection().toScreenLocation(
                new LatLng(featurePoint.latitude(), featurePoint.longitude())
            );
            double x = renderedPoint.x - pressedPoint.x;
            double y = renderedPoint.y - pressedPoint.y;
            double distance = x * x + y * y;
            int priority = feature.hasProperty("event_key") ? 0
                : feature.hasProperty("native_kind") ? 1
                : feature.hasProperty("wiki_slug") ? 2 : 3;
            if (distance < nearestDistance - 0.25
                || (Math.abs(distance - nearestDistance) <= 0.25 && priority < nearestPriority)) {
                nearest = feature;
                nearestDistance = distance;
                nearestPriority = priority;
            }
        }
        return nearest;
    }

    private String buildBundledSiteGeoJson() throws Exception {
        JSONObject source = new JSONObject(readAsset("assets/data/mobile-site-centers.json"));
        JSONArray rows = source.optJSONArray("rows");
        JSONObject iconManifest = new JSONObject(readAsset("map/site-icon-keys.json"));
        JSONObject nativeIconKeyBySlug = iconManifest.optJSONObject("native_icon_key_by_site_slug");
        JSONArray features = new JSONArray();
        int customIconCount = 0;
        if (rows != null) {
            for (int index = 0; index < rows.length(); index++) {
                JSONObject row = rows.optJSONObject(index);
                JSONArray center = row == null ? null : row.optJSONArray("center");
                if (center == null || center.length() < 2) continue;
                int id = row.optInt("id", -1);
                String slug = row.optString("slug", "").trim();
                JSONObject properties = new JSONObject();
                properties.put("id", id);
                properties.put("slug", slug);
                String nativeIconKey = nativeIconKeyBySlug == null
                    ? ""
                    : nativeIconKeyBySlug.optString(slug, "").trim();
                if (!nativeIconKey.isEmpty()) {
                    properties.put("native_icon_key", nativeIconKey);
                    if (!slug.isEmpty()) bundledSiteIconKeysBySlug.put(slug, nativeIconKey);
                    customIconCount += 1;
                }
                JSONObject geometry = new JSONObject();
                geometry.put("type", "Point");
                geometry.put("coordinates", new JSONArray().put(center.optDouble(0)).put(center.optDouble(1)));
                features.put(new JSONObject()
                    .put("type", "Feature")
                    .put("properties", properties)
                    .put("geometry", geometry));
            }
        }
        Log.i(LOG_TAG, "Prepared bundled site snapshot with " + features.length()
            + " mapped centers and " + customIconCount + " custom icons.");
        return new JSONObject().put("type", "FeatureCollection").put("features", features).toString();
    }

    private String bundledNativeSiteIconKey(
        JSONObject site,
        String slug,
        JSONObject iconAssetById,
        JSONArray forceBlueDotSlugs,
        String exhibitIcon
    ) {
        String filename = "";
        if (jsonArrayContains(forceBlueDotSlugs, slug)) {
            filename = "blue-dot-placeholder.png";
        } else if (site != null && iconAssetById != null) {
            filename = iconAssetById.optString(site.optString("map_icon", "").trim(), "");
        }
        if (filename.isEmpty() && isBundledExhibitSite(site)) filename = exhibitIcon;
        if (filename.isEmpty()) return "";
        String base = filename.replaceFirst("(?i)\\.png$", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-+|-+$)", "");
        return base.isEmpty() ? "" : "nli-icon-" + base;
    }

    private boolean jsonArrayContains(JSONArray values, String expected) {
        if (values == null || expected == null || expected.isEmpty()) return false;
        for (int index = 0; index < values.length(); index++) {
            if (expected.equals(values.optString(index, ""))) return true;
        }
        return false;
    }

    private boolean isBundledExhibitSite(JSONObject site) {
        if (site == null) return false;
        String type = site.optString("site_type", "").trim().toLowerCase(Locale.ROOT);
        if (type.matches("^(exhibit|exhibit supporter|museum|gallery|public art|cultural center|heritage center|house museum|preservation)$")) {
            return true;
        }
        String text = (site.optString("title", "") + " "
            + site.optString("summary", "") + " " + type).toLowerCase(Locale.ROOT);
        return text.matches(".*\\b(museum|gallery|exhibit|exhibition|public art|art center|cultural center|heritage center|house museum|ma s house|mas house|preservation long island)\\b.*");
    }

    private String bundledTerritoryGeoJson(boolean labelsOnly) throws Exception {
        if (bundledTerritoryFallback == null) {
            bundledTerritoryFallback = new JSONObject(readAsset("map/ancestral-territory-fallback.json"));
        }
        JSONObject collection = bundledTerritoryFallback.optJSONObject(labelsOnly ? "labels" : "territories");
        return collection == null ? EMPTY_FEATURE_COLLECTION : collection.toString();
    }

    private String readAsset(String path) throws Exception {
        try (InputStream input = activity.getAssets().open(path);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }

    private String bundledWaterLabelGeoJson() {
        if (bundledWaterLabelsJson != null) return bundledWaterLabelsJson;
        try {
            String source = readAsset("assets/js/water-labels.js");
            int assignment = source.indexOf("window.NLI_WATER_LABELS");
            int jsonStart = source.indexOf('{', assignment);
            int runtimeStart = source.indexOf(";(function waterLabelRuntime", jsonStart);
            if (assignment < 0 || jsonStart < 0 || runtimeStart < 0) {
                throw new IllegalStateException("Bundled GNIS water-label catalog is malformed.");
            }
            String jsonText = source.substring(jsonStart, runtimeStart).trim();
            if (jsonText.endsWith(";")) jsonText = jsonText.substring(0, jsonText.length() - 1);
            JSONArray rows = new JSONObject(jsonText).optJSONArray("labels");
            JSONArray features = new JSONArray();
            if (rows != null) {
                for (int index = 0; index < rows.length(); index++) {
                    JSONArray row = rows.optJSONArray(index);
                    if (row == null || row.length() < 7) continue;
                    String title = row.optString(0, "").trim();
                    double longitude = row.optDouble(1, Double.NaN);
                    double latitude = row.optDouble(2, Double.NaN);
                    if (title.isEmpty() || !Double.isFinite(longitude) || !Double.isFinite(latitude)) continue;
                    JSONObject properties = new JSONObject()
                        .put("title", title)
                        .put("water_class", row.optString(3, "Water"))
                        .put("water_tier", row.optInt(4, 0))
                        .put("minzoom", Math.max(12.2, row.optDouble(5, 0) + 1.0))
                        .put("gnis_id", row.optString(6, ""));
                    JSONObject geometry = new JSONObject()
                        .put("type", "Point")
                        .put("coordinates", new JSONArray().put(longitude).put(latitude));
                    features.put(new JSONObject()
                        .put("type", "Feature")
                        .put("geometry", geometry)
                        .put("properties", properties));
                }
            }
            bundledWaterLabelsJson = new JSONObject()
                .put("type", "FeatureCollection")
                .put("features", features)
                .toString();
        } catch (Exception error) {
            Log.w(LOG_TAG, "Could not prepare bundled GNIS water names.", error);
            bundledWaterLabelsJson = EMPTY_FEATURE_COLLECTION;
        }
        return bundledWaterLabelsJson;
    }

    private String loadPmtilesStyle(boolean online) throws Exception {
        String pmtilesUri = ONLINE_PMTILES_URL;
        if (online) {
            return readAsset("map/on-this-site-native-style.json")
                .replace("__NLI_PM_TILES_URL__", pmtilesUri);
        }
        File mapDirectory = new File(activity.getFilesDir(), "native-map");
        if (!mapDirectory.exists() && !mapDirectory.mkdirs()) {
            throw new IllegalStateException("Could not create native map storage.");
        }
        File target = new File(mapDirectory, OFFLINE_PMTILES_FILENAME);
        if (!target.isFile() || target.length() != OFFLINE_PMTILES_SIZE) {
            File pending = new File(mapDirectory, OFFLINE_PMTILES_FILENAME + ".pending");
            try (InputStream input = activity.getAssets().open(OFFLINE_PMTILES_ASSET);
                 FileOutputStream output = new FileOutputStream(pending, false)) {
                byte[] buffer = new byte[64 * 1024];
                int count;
                while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                output.getFD().sync();
            }
            if (pending.length() != OFFLINE_PMTILES_SIZE) {
                pending.delete();
                throw new IllegalStateException("Bundled native map archive was incomplete.");
            }
            if (target.exists() && !target.delete()) {
                pending.delete();
                throw new IllegalStateException("Could not replace stale native map archive.");
            }
            if (!pending.renameTo(target)) {
                pending.delete();
                throw new IllegalStateException("Could not activate native map archive.");
            }
        }
        pmtilesUri = "pmtiles://file://" + target.getAbsolutePath().replace('\\', '/');
        return readAsset("map/on-this-site-native-style.json")
            .replace("__NLI_PM_TILES_URL__", pmtilesUri);
    }

    private boolean hasValidatedNetwork() {
        ConnectivityManager manager = (ConnectivityManager) activity.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (manager == null) return false;
        Network network = manager.getActiveNetwork();
        if (network == null) return false;
        NetworkCapabilities capabilities = manager.getNetworkCapabilities(network);
        return capabilities != null
            && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }

    void onStart() { mapView.onStart(); }
    void onResume() { mapView.onResume(); }
    void onPause() { mapView.onPause(); }
    void onStop() { mapView.onStop(); }
    void onLowMemory() { mapView.onLowMemory(); }

    void onDestroy() {
        mapView.onDestroy();
        map = null;
        styleReady = false;
    }

    void onSaveInstanceState(Bundle outState) { mapView.onSaveInstanceState(outState); }
}
