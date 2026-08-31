package com.nativelongisland.onthissite;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class NavigationCompanionService extends Service implements LocationListener {
    static final String ACTION_START = "com.nativelongisland.onthissite.navigation.START";
    static final String ACTION_STOP = "com.nativelongisland.onthissite.navigation.STOP";
    static final String PREFS_NAME = "on_this_site_native_state";
    static final String PREF_ENABLED = "navigation_companion_enabled";
    private static final String LOG_TAG = "OnThisSiteCompanion";
    private static final String CHANNEL_ID = "navigation_companion";
    private static final String ALERT_CHANNEL_ID = "nearby_sites";
    private static final int FOREGROUND_NOTIFICATION_ID = 4101;
    private static final int SITE_ALERT_NOTIFICATION_ID = 4102;
    private static final long LOCATION_INTERVAL_MS = 20_000L;
    private static final float LOCATION_DISTANCE_METERS = 75f;
    private static final long GLOBAL_ALERT_INTERVAL_MS = 20 * 60 * 1000L;
    private static final long SITE_ALERT_INTERVAL_MS = 24 * 60 * 60 * 1000L;
    private static final double ALERT_RADIUS_MILES = 0.75;
    private static final double LONG_ISLAND_MIN_LAT = 40.45;
    private static final double LONG_ISLAND_MAX_LAT = 41.32;
    private static final double LONG_ISLAND_MIN_LNG = -74.20;
    private static final double LONG_ISLAND_MAX_LNG = -71.70;

    private final List<SiteCandidate> sites = new ArrayList<>();
    private LocationManager locationManager;
    private volatile boolean sitesLoaded;

    static boolean isEnabled(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(PREF_ENABLED, false);
    }

    static void setEnabled(Context context, boolean enabled) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit()
            .putBoolean(PREF_ENABLED, enabled).apply();
    }

    static void start(Context context) {
        setEnabled(context, true);
        Intent intent = new Intent(context, NavigationCompanionService.class).setAction(ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent);
        else context.startService(intent);
    }

    static void stop(Context context) {
        setEnabled(context, false);
        context.stopService(new Intent(context, NavigationCompanionService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannels();
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        new Thread(this::loadSites, "ots-companion-sites").start();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? ACTION_START : intent.getAction();
        if (ACTION_STOP.equals(action) || !isEnabled(this)) {
            setEnabled(this, false);
            stopLocationUpdates();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                FOREGROUND_NOTIFICATION_ID,
                buildForegroundNotification(),
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
            );
        } else {
            startForeground(FOREGROUND_NOTIFICATION_ID, buildForegroundNotification());
        }
        requestLocationUpdates();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopLocationUpdates();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel companion = new NotificationChannel(
            CHANNEL_ID,
            "Navigation companion",
            NotificationManager.IMPORTANCE_LOW
        );
        companion.setDescription("Visible while optional nearby-site navigation alerts are active");
        manager.createNotificationChannel(companion);
        NotificationChannel alerts = new NotificationChannel(
            ALERT_CHANNEL_ID,
            "Nearby sites",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        alerts.setDescription("Optional nearby On This Site alerts");
        manager.createNotificationChannel(alerts);
    }

    private Notification buildForegroundNotification() {
        Intent openIntent = new Intent(this, MainActivity.class)
            .setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP)
            .putExtra("open_navigation_companion_settings", true);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
            this,
            4101,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Intent stopIntent = new Intent(this, NavigationCompanionService.class).setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(
            this,
            4102,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);
        return builder
            .setSmallIcon(android.R.drawable.ic_dialog_map)
            .setContentTitle("On This Site companion is on")
            .setContentText("Nearby public sites can appear while you travel on Long Island.")
            .setContentIntent(openPendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(Notification.CATEGORY_SERVICE)
            .addAction(new Notification.Action.Builder(null, "Turn off", stopPendingIntent).build())
            .build();
    }

    private void requestLocationUpdates() {
        if (locationManager == null || !hasLocationPermission()) return;
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    LOCATION_INTERVAL_MS,
                    LOCATION_DISTANCE_METERS,
                    this
                );
            }
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    LOCATION_INTERVAL_MS * 2,
                    LOCATION_DISTANCE_METERS,
                    this
                );
            }
        } catch (SecurityException error) {
            Log.w(LOG_TAG, "Location permission changed while companion was active.");
        }
    }

    private void stopLocationUpdates() {
        if (locationManager == null) return;
        try {
            locationManager.removeUpdates(this);
        } catch (SecurityException ignored) {}
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onLocationChanged(Location location) {
        if (location == null || !sitesLoaded || !isEnabled(this)) return;
        double latitude = location.getLatitude();
        double longitude = location.getLongitude();
        if (!isOnLongIsland(latitude, longitude)) return;
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        long now = System.currentTimeMillis();
        if (now - preferences.getLong("navigation_companion_last_alert_at", 0L) < GLOBAL_ALERT_INTERVAL_MS) return;
        SiteCandidate nearest = null;
        double nearestMiles = Double.POSITIVE_INFINITY;
        synchronized (sites) {
            for (SiteCandidate site : sites) {
                double miles = distanceMiles(latitude, longitude, site.latitude, site.longitude);
                if (miles > ALERT_RADIUS_MILES || miles >= nearestMiles) continue;
                long siteAlertAt = preferences.getLong("navigation_companion_site_" + site.slug, 0L);
                if (now - siteAlertAt < SITE_ALERT_INTERVAL_MS) continue;
                nearest = site;
                nearestMiles = miles;
            }
        }
        if (nearest == null) return;
        preferences.edit()
            .putLong("navigation_companion_last_alert_at", now)
            .putLong("navigation_companion_site_" + nearest.slug, now)
            .apply();
        showSiteAlert(nearest, nearestMiles);
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    @Override
    public void onProviderEnabled(String provider) {}

    @Override
    public void onProviderDisabled(String provider) {}

    private void showSiteAlert(SiteCandidate site, double miles) {
        Intent reviewIntent = new Intent(this, NavigationCompanionActionActivity.class)
            .putExtra("site_title", site.title)
            .putExtra("site_slug", site.slug)
            .putExtra("site_latitude", site.latitude)
            .putExtra("site_longitude", site.longitude)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent reviewPendingIntent = PendingIntent.getActivity(
            this,
            4200 + Math.abs(site.slug.hashCode() % 500),
            reviewIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, ALERT_CHANNEL_ID)
            : new Notification.Builder(this);
        String distance = String.format(Locale.US, "%.1f mi away", miles);
        Notification notification = builder
            .setSmallIcon(android.R.drawable.ic_dialog_map)
            .setContentTitle("Historic site nearby: " + site.title)
            .setContentText(distance + ". Review it before opening Google Maps.")
            .setStyle(new Notification.BigTextStyle().bigText(
                distance + ". Tap to review this public site before choosing whether to open it in Google Maps."
            ))
            .setContentIntent(reviewPendingIntent)
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_RECOMMENDATION)
            .addAction(new Notification.Action.Builder(null, "Review stop", reviewPendingIntent).build())
            .build();
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(SITE_ALERT_NOTIFICATION_ID, notification);
    }

    private boolean isOnLongIsland(double latitude, double longitude) {
        return latitude >= LONG_ISLAND_MIN_LAT && latitude <= LONG_ISLAND_MAX_LAT
            && longitude >= LONG_ISLAND_MIN_LNG && longitude <= LONG_ISLAND_MAX_LNG;
    }

    private void loadSites() {
        try {
            JSONObject index = new JSONObject(readAsset("assets/data/mobile-site-index.json"));
            JSONObject centers = new JSONObject(readAsset("assets/data/mobile-site-centers.json"));
            Map<String, JSONObject> metadataBySlug = new HashMap<>();
            JSONArray indexRows = index.optJSONArray("rows");
            for (int position = 0; indexRows != null && position < indexRows.length(); position += 1) {
                JSONObject item = indexRows.optJSONObject(position);
                String slug = item == null ? "" : item.optString("slug", "");
                if (!slug.isEmpty()) metadataBySlug.put(slug, item);
            }
            List<SiteCandidate> loaded = new ArrayList<>();
            JSONArray centerRows = centers.optJSONArray("rows");
            for (int position = 0; centerRows != null && position < centerRows.length(); position += 1) {
                JSONObject centerItem = centerRows.optJSONObject(position);
                if (centerItem == null || !"Point".equals(centerItem.optString("geometry_type"))) continue;
                String slug = centerItem.optString("slug", "");
                JSONObject metadata = metadataBySlug.get(slug);
                if (!isSafePublicCandidate(metadata)) continue;
                JSONArray center = centerItem.optJSONArray("center");
                if (center == null || center.length() < 2) continue;
                double longitude = center.optDouble(0, Double.NaN);
                double latitude = center.optDouble(1, Double.NaN);
                if (!Double.isFinite(latitude) || !Double.isFinite(longitude) || !isOnLongIsland(latitude, longitude)) continue;
                loaded.add(new SiteCandidate(metadata.optString("title"), slug, latitude, longitude));
            }
            synchronized (sites) {
                sites.clear();
                sites.addAll(loaded);
            }
            Log.i(LOG_TAG, "Loaded " + loaded.size() + " public navigation companion sites.");
            new android.os.Handler(getMainLooper()).post(this::checkRecentLastKnownLocation);
        } catch (Exception error) {
            Log.e(LOG_TAG, "Could not load navigation companion sites.", error);
        } finally {
            sitesLoaded = true;
        }
    }

    private void checkRecentLastKnownLocation() {
        if (locationManager == null || !hasLocationPermission() || !isEnabled(this)) return;
        Location newest = null;
        try {
            for (String provider : locationManager.getProviders(true)) {
                Location candidate = locationManager.getLastKnownLocation(provider);
                if (candidate != null && (newest == null || candidate.getTime() > newest.getTime())) newest = candidate;
            }
        } catch (SecurityException ignored) {
            return;
        }
        if (newest != null && System.currentTimeMillis() - newest.getTime() <= 10 * 60 * 1000L) {
            onLocationChanged(newest);
        }
    }

    private boolean isSafePublicCandidate(JSONObject item) {
        if (item == null || !"published".equalsIgnoreCase(item.optString("publication_status", "published"))) return false;
        String title = item.optString("title", "").trim();
        String slug = item.optString("slug", "").trim();
        String type = item.optString("site_type", "");
        String summary = item.optString("summary", "");
        String address = item.optString("address_label", "");
        String surface = item.optString("geometry_surface", "");
        String cleanup = item.optString("geometry_cleanup_status", "");
        if (title.isEmpty() || slug.isEmpty() || address.trim().isEmpty()) return false;
        String sensitiveText = (title + " " + type + " " + summary).toLowerCase(Locale.ROOT);
        if (sensitiveText.matches(".*\\b(ancestral land|traditional land|territory|burial|cemetery|sacred|archaeolog|private residence)\\b.*")) return false;
        String accuracyText = (address + " " + surface + " " + cleanup).toLowerCase(Locale.ROOT);
        return !accuracyText.matches(".*\\b(approximate|general|broad|near|area|landscape|mixed|pending|needs review)\\b.*");
    }

    private String readAsset(String path) throws Exception {
        try (InputStream input = getAssets().open(path); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) >= 0) output.write(buffer, 0, count);
            return new String(output.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    private double distanceMiles(double lat1, double lng1, double lat2, double lng2) {
        double earthRadiusMiles = 3958.7613;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static final class SiteCandidate {
        final String title;
        final String slug;
        final double latitude;
        final double longitude;

        SiteCandidate(String title, String slug, double latitude, double longitude) {
            this.title = title;
            this.slug = slug;
            this.latitude = latitude;
            this.longitude = longitude;
        }
    }
}
