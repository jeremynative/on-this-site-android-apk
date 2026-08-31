package com.nativelongisland.onthissite;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.RectF;
import android.graphics.drawable.GradientDrawable;
import android.location.Location;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.Projection;
import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.libraries.navigation.ListenableResultFuture;
import com.google.android.libraries.navigation.NavigationApi;
import com.google.android.libraries.navigation.NavigationView;
import com.google.android.libraries.navigation.Navigator;
import com.google.android.libraries.navigation.Waypoint;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OnThisSiteNavigationActivity extends Activity {
    private static final String LOG_TAG = "OnThisSiteGoogleNav";
    private static final int LOCATION_PERMISSION_REQUEST = 71;
    private static final int MAX_VISIBLE_SITE_LABELS = 4;
    private static final int MAX_NEARBY_EDGE_INDICATORS = 3;
    private static final float NEARBY_SITE_RANGE_METERS = 1609.344f;
    private static final float MIN_LABEL_HORIZONTAL_SPACING_DP = 190f;
    private static final float MIN_LABEL_VERTICAL_SPACING_DP = 58f;
    private static final String EXTRA_TITLE = "destination_title";
    private static final String EXTRA_SLUG = "destination_slug";
    private static final String EXTRA_LATITUDE = "destination_latitude";
    private static final String EXTRA_LONGITUDE = "destination_longitude";

    private NavigationView navigationView;
    private Navigator navigator;
    private GoogleMap googleMap;
    private FrameLayout mapContainer;
    private FrameLayout edgeOverlay;
    private View topCard;
    private TextView statusView;
    private Button startButton;
    private Button overviewButton;
    private String destinationTitle;
    private String destinationSlug;
    private double destinationLatitude;
    private double destinationLongitude;
    private Waypoint primaryDestination;
    private boolean routeReady;
    private boolean guidanceStarted;
    private Location currentLocation;
    private List<NavigationSiteRepository.Site> publicSites = new ArrayList<>();
    private final List<Marker> siteMarkers = new ArrayList<>();
    private final Map<Marker, NavigationSiteRepository.Site> siteByMarker = new HashMap<>();
    private final Handler navigationHandler = new Handler(Looper.getMainLooper());
    private final Runnable navigationStartupTimeout = () -> {
        if (navigator != null || isFinishing()) return;
        statusView.setText("Google navigation did not authorize this build. Use Maps while the project key is being configured.");
        startButton.setEnabled(false);
        overviewButton.setEnabled(false);
    };

    static Intent createIntent(Activity source, String title, String slug, double latitude, double longitude) {
        return new Intent(source, OnThisSiteNavigationActivity.class)
            .putExtra(EXTRA_TITLE, title)
            .putExtra(EXTRA_SLUG, slug)
            .putExtra(EXTRA_LATITUDE, latitude)
            .putExtra(EXTRA_LONGITUDE, longitude);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_on_this_site_navigation);
        applySystemBarSafeArea(findViewById(R.id.navigation_root));
        windowKeepScreenOn();
        mapContainer = findViewById(R.id.navigation_map_container);
        edgeOverlay = findViewById(R.id.navigation_edge_overlay);
        topCard = findViewById(R.id.navigation_top_card);
        statusView = findViewById(R.id.navigation_status);
        startButton = findViewById(R.id.navigation_start);
        overviewButton = findViewById(R.id.navigation_overview);
        findViewById(R.id.navigation_close).setOnClickListener(view -> closeNavigation());
        findViewById(R.id.navigation_external).setOnClickListener(view -> openOfficialGoogleMaps());
        findViewById(R.id.navigation_legal).setOnClickListener(view ->
            startActivity(new Intent(this, GoogleNavigationLegalActivity.class))
        );
        startButton.setOnClickListener(view -> startGuidance());
        overviewButton.setOnClickListener(view -> {
            if (navigationView != null) navigationView.showRouteOverview();
        });

        Intent intent = getIntent();
        destinationTitle = safeTitle(intent == null ? null : intent.getStringExtra(EXTRA_TITLE));
        destinationSlug = intent == null ? "" : safeString(intent.getStringExtra(EXTRA_SLUG));
        destinationLatitude = intent == null ? Double.NaN : intent.getDoubleExtra(EXTRA_LATITUDE, Double.NaN);
        destinationLongitude = intent == null ? Double.NaN : intent.getDoubleExtra(EXTRA_LONGITUDE, Double.NaN);
        ((TextView) findViewById(R.id.navigation_destination)).setText(destinationTitle);
        Log.i(LOG_TAG, "Destination prepared: " + destinationTitle + " (" + destinationLatitude + ", " + destinationLongitude + ")");

        if (!Double.isFinite(destinationLatitude) || !Double.isFinite(destinationLongitude)) {
            statusView.setText("This place does not have a supported public navigation point.");
            startButton.setEnabled(false);
            return;
        }
        if (!OnThisSiteApplication.isNavigationApiConfigured()) {
            statusView.setText("Google navigation is not configured for this build. You can still open the destination in Google Maps.");
            startButton.setEnabled(false);
            overviewButton.setEnabled(false);
            return;
        }
        initializeNavigation(savedInstanceState);
        if (!hasLocationPermission()) {
            statusView.setText("Location access is needed to calculate a route from your position.");
            requestPermissions(
                new String[] { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION },
                LOCATION_PERMISSION_REQUEST
            );
        }
    }

    private void initializeNavigation(Bundle savedInstanceState) {
        if (navigationView != null || isFinishing()) return;
        navigationView = new NavigationView(this);
        mapContainer.addView(
            navigationView,
            new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        );
        navigationView.onCreate(savedInstanceState);
        navigationView.setNavigationUiEnabled(true);
        navigationView.setRecenterButtonEnabled(true);
        navigationView.setSpeedLimitIconEnabled(true);
        navigationView.setSpeedometerEnabled(true);
        navigationView.setTripProgressBarEnabled(true);
        navigationView.setTrafficPromptsEnabled(true);
        if (hasLocationPermission()) statusView.setText("Loading route…");
        navigationView.getMapAsync(map -> {
            googleMap = map;
            googleMap.setTrafficEnabled(true);
            googleMap.getUiSettings().setCompassEnabled(true);
            try {
                googleMap.setMyLocationEnabled(hasLocationPermission());
            } catch (SecurityException ignored) {}
            googleMap.setOnCameraIdleListener(() -> {
                refreshVisibleSiteMarkers();
                refreshNearbyEdgeIndicators();
            });
            googleMap.setOnMyLocationChangeListener(location -> runOnUiThread(() -> {
                currentLocation = location;
                refreshNearbyEdgeIndicators();
            }));
            googleMap.setOnMarkerClickListener(this::onMarkerClicked);
            loadPublicSites();
        });
        NavigationApi.getNavigator(this, new NavigationApi.NavigatorListener() {
            @Override
            public void onNavigatorReady(Navigator readyNavigator) {
                navigationHandler.removeCallbacks(navigationStartupTimeout);
                navigator = readyNavigator;
                navigator.setTaskRemovedBehavior(Navigator.TaskRemovedBehavior.QUIT_SERVICE);
                primaryDestination = Waypoint.builder()
                    .setLatLng(destinationLatitude, destinationLongitude)
                    .setTitle(destinationTitle)
                    .setVehicleStopover(true)
                    .build();
                if (hasLocationPermission()) calculateRoute(Arrays.asList(primaryDestination), false);
            }

            @Override
            public void onError(@NavigationApi.ErrorCode int errorCode) {
                navigationHandler.removeCallbacks(navigationStartupTimeout);
                String message = errorCode == NavigationApi.ErrorCode.NOT_AUTHORIZED
                    ? "This Google navigation key is not authorized for On This Site."
                    : errorCode == NavigationApi.ErrorCode.TERMS_NOT_ACCEPTED
                        ? "Google navigation terms were not accepted."
                        : "Google navigation could not start (error " + errorCode + ").";
                statusView.setText(message);
                startButton.setEnabled(false);
                Log.w(LOG_TAG, message);
            }
        });
        navigationHandler.postDelayed(navigationStartupTimeout, 15_000L);
    }

    private void calculateRoute(List<Waypoint> destinations, boolean resumeGuidance) {
        if (navigator == null || destinations == null || destinations.isEmpty()) return;
        routeReady = false;
        startButton.setEnabled(false);
        statusView.setText(destinations.size() > 1 ? "Adding the selected historical stop…" : "Finding the best traffic-aware route…");
        ListenableResultFuture<Navigator.RouteStatus> pendingRoute = destinations.size() == 1
            ? navigator.setDestination(destinations.get(0))
            : navigator.setDestinations(destinations);
        pendingRoute.setOnResultListener(code -> runOnUiThread(() -> {
            if (code == Navigator.RouteStatus.OK) {
                routeReady = true;
                startButton.setEnabled(true);
                overviewButton.setEnabled(true);
                statusView.setText(destinations.size() > 1
                    ? "Historical stop added before " + destinationTitle + "."
                    : "Route ready. Nearby public sites are labeled; off-screen sites show distance and direction at the edge.");
                if (navigationView != null) navigationView.showRouteOverview();
                if (resumeGuidance) startGuidance();
            } else if (code == Navigator.RouteStatus.NETWORK_ERROR) {
                statusView.setText("Google could not calculate the route because the network is unavailable.");
            } else if (code == Navigator.RouteStatus.NO_ROUTE_FOUND) {
                statusView.setText("Google could not find a driving route to this place.");
            } else if (code == Navigator.RouteStatus.LOCATION_UNKNOWN) {
                statusView.setText("Waiting for a reliable current location before routing.");
            } else {
                statusView.setText("The route could not be prepared (" + code + ").");
            }
        }));
    }

    private void startGuidance() {
        if (!routeReady || navigator == null) return;
        navigator.setAudioGuidance(Navigator.AudioGuidance.VOICE_ALERTS_AND_GUIDANCE | Navigator.AudioGuidance.BLUETOOTH_AUDIO);
        navigator.startGuidance();
        guidanceStarted = true;
        startButton.setEnabled(false);
        topCard.setVisibility(View.GONE);
        refreshNearbyEdgeIndicators();
    }

    private void loadPublicSites() {
        new Thread(() -> {
            try {
                List<NavigationSiteRepository.Site> loaded = NavigationSiteRepository.loadPublicSites(this);
                runOnUiThread(() -> {
                    publicSites = loaded;
                    refreshVisibleSiteMarkers();
                    refreshNearbyEdgeIndicators();
                    Log.i(LOG_TAG, "Loaded " + loaded.size() + " public navigation-map sites.");
                });
            } catch (Exception error) {
                Log.e(LOG_TAG, "Could not load public navigation-map sites.", error);
            }
        }, "ots-google-navigation-sites").start();
    }

    private void refreshVisibleSiteMarkers() {
        if (googleMap == null || currentLocation == null || publicSites.isEmpty()) {
            clearSiteMarkers();
            return;
        }
        LatLngBounds bounds;
        LatLng center;
        Projection projection;
        try {
            projection = googleMap.getProjection();
            bounds = projection.getVisibleRegion().latLngBounds;
            center = googleMap.getCameraPosition().target;
        } catch (Exception ignored) {
            return;
        }
        List<NavigationSiteRepository.Site> visible = new ArrayList<>();
        for (NavigationSiteRepository.Site site : publicSites) {
            if (sameDestination(site)) continue;
            LatLng point = new LatLng(site.latitude, site.longitude);
            if (!bounds.contains(point)) continue;
            float[] result = new float[1];
            Location.distanceBetween(currentLocation.getLatitude(), currentLocation.getLongitude(), site.latitude, site.longitude, result);
            if (result[0] <= NEARBY_SITE_RANGE_METERS) visible.add(site);
        }
        visible.sort(Comparator.comparingDouble(site -> distanceSquared(center, site)));
        float density = getResources().getDisplayMetrics().density;
        float minimumHorizontalSpacing = MIN_LABEL_HORIZONTAL_SPACING_DP * density;
        float minimumVerticalSpacing = MIN_LABEL_VERTICAL_SPACING_DP * density;
        List<NavigationSiteRepository.Site> spacedVisible = new ArrayList<>();
        List<Point> labelAnchors = new ArrayList<>();
        for (NavigationSiteRepository.Site site : visible) {
            Point anchor = projection.toScreenLocation(new LatLng(site.latitude, site.longitude));
            boolean overlaps = false;
            for (Point accepted : labelAnchors) {
                if (Math.abs(anchor.x - accepted.x) < minimumHorizontalSpacing
                    && Math.abs(anchor.y - accepted.y) < minimumVerticalSpacing) {
                    overlaps = true;
                    break;
                }
            }
            if (overlaps) continue;
            spacedVisible.add(site);
            labelAnchors.add(anchor);
            if (spacedVisible.size() >= MAX_VISIBLE_SITE_LABELS) break;
        }
        clearSiteMarkers();
        for (NavigationSiteRepository.Site site : spacedVisible) {
            Marker marker = googleMap.addMarker(new MarkerOptions()
                .position(new LatLng(site.latitude, site.longitude))
                .title(site.title)
                .icon(siteLabelIcon(site.title))
                .anchor(0.08f, 0.90f)
                .zIndex(4f));
            if (marker != null) {
                marker.setTag(site.slug);
                siteMarkers.add(marker);
                siteByMarker.put(marker, site);
            }
        }
    }

    private void clearSiteMarkers() {
        for (Marker marker : siteMarkers) marker.remove();
        siteMarkers.clear();
        siteByMarker.clear();
    }

    private boolean onMarkerClicked(Marker marker) {
        NavigationSiteRepository.Site site = siteByMarker.get(marker);
        if (site == null) return false;
        showAddStopDialog(site);
        return true;
    }

    private void showAddStopDialog(NavigationSiteRepository.Site site) {
        String message = guidanceStarted
            ? "Add " + site.title + " as the next stop before continuing to " + destinationTitle + "?"
            : "Route through " + site.title + " before continuing to " + destinationTitle + "?";
        new AlertDialog.Builder(this)
            .setTitle(site.title)
            .setMessage(message)
            .setPositiveButton("Add stop", (dialog, which) -> addSiteStop(site))
            .setNegativeButton("Keep route", null)
            .show();
    }

    private void refreshNearbyEdgeIndicators() {
        if (edgeOverlay == null) return;
        edgeOverlay.removeAllViews();
        if (googleMap == null || currentLocation == null || publicSites.isEmpty()) return;
        int width = edgeOverlay.getWidth();
        int height = edgeOverlay.getHeight();
        if (width <= 0 || height <= 0) {
            edgeOverlay.post(this::refreshNearbyEdgeIndicators);
            return;
        }
        Projection projection;
        LatLngBounds visibleBounds;
        try {
            projection = googleMap.getProjection();
            visibleBounds = projection.getVisibleRegion().latLngBounds;
        } catch (Exception ignored) {
            return;
        }
        List<NearbySiteDistance> nearby = new ArrayList<>();
        for (NavigationSiteRepository.Site site : publicSites) {
            if (sameDestination(site)) continue;
            LatLng point = new LatLng(site.latitude, site.longitude);
            if (visibleBounds.contains(point)) continue;
            float[] result = new float[2];
            Location.distanceBetween(currentLocation.getLatitude(), currentLocation.getLongitude(), site.latitude, site.longitude, result);
            if (result[0] <= NEARBY_SITE_RANGE_METERS) nearby.add(new NearbySiteDistance(site, result[0], result[1]));
        }
        nearby.sort(Comparator.comparingDouble(item -> item.distanceMeters));
        float density = getResources().getDisplayMetrics().density;
        float horizontalInset = 12f * density;
        float top = topCard != null && topCard.getVisibility() == View.VISIBLE
            ? Math.max(topCard.getBottom(), Math.round(72f * density)) + 8f * density
            : 116f * density;
        float bottom = height - 90f * density;
        float centerX = width / 2f;
        float centerY = (top + bottom) / 2f;
        List<RectF> occupied = new ArrayList<>();
        int added = 0;
        for (NearbySiteDistance item : nearby) {
            if (added >= MAX_NEARBY_EDGE_INDICATORS) break;
            Point projected = projection.toScreenLocation(new LatLng(item.site.latitude, item.site.longitude));
            float dx = projected.x - centerX;
            float dy = projected.y - centerY;
            if (Math.abs(dx) < 1f && Math.abs(dy) < 1f) continue;
            float edgeScale = Math.min(
                (centerX - horizontalInset) / Math.max(1f, Math.abs(dx)),
                ((bottom - top) / 2f) / Math.max(1f, Math.abs(dy))
            );
            float edgeX = centerX + dx * edgeScale;
            float edgeY = centerY + dy * edgeScale;
            LinearLayout indicator = nearbyEdgeIndicator(item, dx, dy, density);
            edgeOverlay.addView(indicator, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ));
            indicator.measure(
                View.MeasureSpec.makeMeasureSpec(Math.round(230f * density), View.MeasureSpec.AT_MOST),
                View.MeasureSpec.makeMeasureSpec(Math.round(64f * density), View.MeasureSpec.AT_MOST)
            );
            int indicatorWidth = indicator.getMeasuredWidth();
            int indicatorHeight = indicator.getMeasuredHeight();
            float x = clamp(edgeX - indicatorWidth / 2f, horizontalInset, width - horizontalInset - indicatorWidth);
            float y = clamp(edgeY - indicatorHeight / 2f, top, bottom - indicatorHeight);
            RectF proposed = new RectF(x, y, x + indicatorWidth, y + indicatorHeight);
            boolean overlaps = false;
            for (RectF existing : occupied) {
                if (RectF.intersects(existing, proposed)) {
                    overlaps = true;
                    break;
                }
            }
            if (overlaps) {
                edgeOverlay.removeView(indicator);
                continue;
            }
            indicator.setX(x);
            indicator.setY(y);
            occupied.add(proposed);
            added += 1;
        }
    }

    private LinearLayout nearbyEdgeIndicator(NearbySiteDistance item, float dx, float dy, float density) {
        LinearLayout indicator = new LinearLayout(this);
        indicator.setOrientation(LinearLayout.HORIZONTAL);
        indicator.setGravity(Gravity.CENTER_VERTICAL);
        int horizontalPadding = Math.round(9f * density);
        int verticalPadding = Math.round(6f * density);
        indicator.setPadding(horizontalPadding, verticalPadding, horizontalPadding, verticalPadding);
        GradientDrawable background = new GradientDrawable();
        background.setColor(Color.argb(152, 23, 79, 57));
        background.setCornerRadius(10f * density);
        indicator.setBackground(background);
        indicator.setElevation(7f * density);
        TextView arrow = new TextView(this);
        arrow.setText("➤");
        arrow.setTextColor(item.site.hasHeaderImage
            ? Color.argb(224, 60, 137, 230)
            : Color.argb(224, 74, 171, 101));
        arrow.setTextSize(21);
        arrow.setGravity(Gravity.CENTER);
        arrow.setRotation((float) Math.toDegrees(Math.atan2(dy, dx)));
        indicator.addView(arrow, new LinearLayout.LayoutParams(Math.round(34f * density), Math.round(34f * density)));
        TextView label = new TextView(this);
        label.setText(shortEdgeTitle(item.site.title) + "\n" + formatDistance(item.distanceMeters) + " " + cardinalDirection(item.bearingDegrees));
        label.setTextColor(Color.WHITE);
        label.setTextSize(12);
        label.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        label.setMaxLines(2);
        label.setMaxWidth(Math.round(180f * density));
        indicator.addView(label);
        indicator.setContentDescription(item.site.title + ", " + formatDistance(item.distanceMeters) + " " + cardinalDirection(item.bearingDegrees) + ". Tap to add stop.");
        indicator.setClickable(true);
        indicator.setFocusable(true);
        indicator.setOnClickListener(view -> showAddStopDialog(item.site));
        return indicator;
    }

    private String shortEdgeTitle(String value) {
        String clean = safeTitle(value);
        return clean.length() <= 24 ? clean : clean.substring(0, 23) + "…";
    }

    private String formatDistance(float meters) {
        float miles = meters / 1609.344f;
        return miles < 0.2f ? Math.max(100, Math.round(meters / 30.48f) * 100) + " ft" : String.format(java.util.Locale.US, miles < 10f ? "%.1f mi" : "%.0f mi", miles);
    }

    private String cardinalDirection(float bearing) {
        String[] directions = { "N", "NE", "E", "SE", "S", "SW", "W", "NW" };
        int index = Math.round(((bearing % 360f) + 360f) % 360f / 45f) % directions.length;
        return directions[index];
    }

    private float clamp(float value, float minimum, float maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    private void addSiteStop(NavigationSiteRepository.Site site) {
        if (navigator == null || primaryDestination == null) return;
        Waypoint stop = Waypoint.builder()
            .setLatLng(site.latitude, site.longitude)
            .setTitle(site.title)
            .setVehicleStopover(true)
            .build();
        calculateRoute(Arrays.asList(stop, primaryDestination), guidanceStarted);
    }

    private BitmapDescriptor siteLabelIcon(String rawTitle) {
        String title = rawTitle == null ? "On This Site" : rawTitle.trim();
        if (title.length() > 28) title = title.substring(0, 27) + "…";
        float density = getResources().getDisplayMetrics().density;
        Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(Color.WHITE);
        textPaint.setTextSize(12f * density);
        textPaint.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        float textWidth = textPaint.measureText(title);
        int height = Math.max(34, Math.round(34f * density));
        int pinWidth = Math.round(22f * density);
        int horizontalPadding = Math.round(9f * density);
        int width = Math.max(height, Math.round(textWidth) + pinWidth + horizontalPadding * 2);
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint background = new Paint(Paint.ANTI_ALIAS_FLAG);
        background.setColor(Color.argb(170, 30, 82, 60));
        float radius = 8f * density;
        canvas.drawRoundRect(new RectF(pinWidth / 2f, 0, width, height - 4f * density), radius, radius, background);
        Paint pin = new Paint(Paint.ANTI_ALIAS_FLAG);
        pin.setColor(Color.argb(190, 196, 57, 46));
        canvas.drawCircle(pinWidth / 2f, height / 2.5f, 7f * density, pin);
        canvas.drawText(title, pinWidth + horizontalPadding, (height - 4f * density) / 2f - (textPaint.ascent() + textPaint.descent()) / 2f, textPaint);
        return BitmapDescriptorFactory.fromBitmap(bitmap);
    }

    private double distanceSquared(LatLng center, NavigationSiteRepository.Site site) {
        double latitude = site.latitude - center.latitude;
        double longitude = (site.longitude - center.longitude) * Math.cos(Math.toRadians(center.latitude));
        return latitude * latitude + longitude * longitude;
    }

    private boolean sameDestination(NavigationSiteRepository.Site site) {
        return (!destinationSlug.isEmpty() && destinationSlug.equals(site.slug))
            || Math.abs(site.latitude - destinationLatitude) < 0.00001
            && Math.abs(site.longitude - destinationLongitude) < 0.00001;
    }

    private void closeNavigation() {
        if (navigator != null && navigator.isGuidanceRunning()) {
            new AlertDialog.Builder(this)
                .setTitle("Stop navigation?")
                .setMessage("Turn-by-turn guidance will end and On This Site will return to its map.")
                .setPositiveButton("Stop and close", (dialog, which) -> finish())
                .setNegativeButton("Keep navigating", null)
                .show();
        } else {
            finish();
        }
    }

    private void openOfficialGoogleMaps() {
        Uri uri = Uri.parse("https://www.google.com/maps/dir/?api=1&destination="
            + Uri.encode(destinationLatitude + "," + destinationLongitude)
            + "&travelmode=driving");
        Intent mapsIntent = new Intent(Intent.ACTION_VIEW, uri).setPackage("com.google.android.apps.maps");
        try {
            startActivity(mapsIntent);
        } catch (ActivityNotFoundException error) {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        }
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != LOCATION_PERMISSION_REQUEST) return;
        if (hasLocationPermission()) {
            try {
                if (googleMap != null) googleMap.setMyLocationEnabled(true);
            } catch (SecurityException ignored) {}
            if (navigator != null && primaryDestination != null) calculateRoute(Arrays.asList(primaryDestination), false);
            else statusView.setText("Loading route…");
        } else {
            statusView.setText("Location is off. The map is available, but routing needs location access.");
        }
    }

    private void windowKeepScreenOn() {
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void applySystemBarSafeArea(View root) {
        root.setOnApplyWindowInsetsListener((view, windowInsets) -> {
            int left;
            int top;
            int right;
            int bottom;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.graphics.Insets safeInsets = windowInsets.getInsets(
                    android.view.WindowInsets.Type.systemBars() | android.view.WindowInsets.Type.displayCutout()
                );
                left = safeInsets.left;
                top = safeInsets.top;
                right = safeInsets.right;
                bottom = safeInsets.bottom;
            } else {
                left = windowInsets.getSystemWindowInsetLeft();
                top = windowInsets.getSystemWindowInsetTop();
                right = windowInsets.getSystemWindowInsetRight();
                bottom = windowInsets.getSystemWindowInsetBottom();
            }
            view.setPadding(left, top, right, bottom);
            return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                ? android.view.WindowInsets.CONSUMED
                : windowInsets.consumeSystemWindowInsets();
        });
        root.requestApplyInsets();
    }

    private String safeTitle(String value) {
        String clean = safeString(value);
        return clean.isEmpty() ? "On This Site destination" : clean;
    }

    private String safeString(String value) {
        return value == null ? "" : value.trim();
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (navigationView != null) navigationView.onSaveInstanceState(outState);
    }

    @Override
    public void onStart() {
        super.onStart();
        if (navigationView != null) navigationView.onStart();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (navigationView != null) navigationView.onResume();
    }

    @Override
    public void onPause() {
        if (navigationView != null) navigationView.onPause();
        super.onPause();
    }

    @Override
    public void onStop() {
        if (navigationView != null) navigationView.onStop();
        super.onStop();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        if (navigationView != null) navigationView.onConfigurationChanged(newConfig);
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        if (navigationView != null) navigationView.onTrimMemory(level);
    }

    @Override
    public void onDestroy() {
        navigationHandler.removeCallbacksAndMessages(null);
        if (navigator != null) {
            navigator.stopGuidance();
            navigator.clearDestinations();
            navigator.cleanup();
            navigator = null;
        }
        if (googleMap != null) googleMap.setOnMyLocationChangeListener(null);
        if (navigationView != null) {
            navigationView.onDestroy();
            navigationView = null;
        }
        super.onDestroy();
    }

    private static final class NearbySiteDistance {
        final NavigationSiteRepository.Site site;
        final float distanceMeters;
        final float bearingDegrees;

        NearbySiteDistance(NavigationSiteRepository.Site site, float distanceMeters, float bearingDegrees) {
            this.site = site;
            this.distanceMeters = distanceMeters;
            this.bearingDegrees = bearingDegrees;
        }
    }
}
