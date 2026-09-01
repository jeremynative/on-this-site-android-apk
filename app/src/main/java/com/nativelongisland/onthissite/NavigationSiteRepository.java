package com.nativelongisland.onthissite;

import android.content.Context;
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

final class NavigationSiteRepository {
    private static final double LONG_ISLAND_MIN_LAT = 40.45;
    private static final double LONG_ISLAND_MAX_LAT = 41.32;
    private static final double LONG_ISLAND_MIN_LNG = -74.20;
    private static final double LONG_ISLAND_MAX_LNG = -71.70;

    private NavigationSiteRepository() {}

    static List<Site> loadPublicSites(Context context) throws Exception {
        JSONObject index = new JSONObject(readAsset(context, "assets/data/mobile-site-index.json"));
        JSONObject centers = new JSONObject(readAsset(context, "assets/data/mobile-site-centers.json"));
        Map<String, JSONObject> metadataBySlug = new HashMap<>();
        JSONArray indexRows = index.optJSONArray("rows");
        for (int position = 0; indexRows != null && position < indexRows.length(); position += 1) {
            JSONObject item = indexRows.optJSONObject(position);
            String slug = item == null ? "" : item.optString("slug", "");
            if (!slug.isEmpty()) metadataBySlug.put(slug, item);
        }
        List<Site> loaded = new ArrayList<>();
        JSONArray centerRows = centers.optJSONArray("rows");
        for (int position = 0; centerRows != null && position < centerRows.length(); position += 1) {
            JSONObject centerItem = centerRows.optJSONObject(position);
            if (centerItem == null || !"Point".equals(centerItem.optString("geometry_type"))) continue;
            String slug = centerItem.optString("slug", "");
            JSONObject metadata = metadataBySlug.get(slug);
            if (!isPublicNavigationCandidate(metadata)) continue;
            JSONArray center = centerItem.optJSONArray("center");
            if (center == null || center.length() < 2) continue;
            double longitude = center.optDouble(0, Double.NaN);
            double latitude = center.optDouble(1, Double.NaN);
            if (!Double.isFinite(latitude) || !Double.isFinite(longitude) || !isOnLongIsland(latitude, longitude)) continue;
            loaded.add(new Site(
                metadata.optString("title"),
                slug,
                latitude,
                longitude,
                hasHeaderImage(metadata)
            ));
        }
        return loaded;
    }

    private static boolean isPublicNavigationCandidate(JSONObject item) {
        if (item == null || !"published".equalsIgnoreCase(item.optString("publication_status", "published"))) return false;
        String title = item.optString("title", "").trim();
        String slug = item.optString("slug", "").trim();
        if (title.isEmpty() || slug.isEmpty()) return false;

        // The public map contains many reviewed historical points without a
        // modern street-address label. Requiring that label hid most of the
        // project's ordinary sites from the driving overlay even though their
        // published point coordinates were already visible on the main map.
        // Restrict only records whose own classification/location state marks
        // them as inappropriate for a driving destination; do not reject an
        // otherwise public site merely because its article discusses sensitive
        // history or uses words such as "near" in normal prose.
        String type = item.optString("site_type", "").toLowerCase(Locale.ROOT);
        String geometrySurface = item.optString("geometry_surface", "").toLowerCase(Locale.ROOT);
        String cleanupStatus = item.optString("geometry_cleanup_status", "").toLowerCase(Locale.ROOT);
        if (type.contains("sensitive")
            || type.contains("burial")
            || type.contains("reservation")
            || type.contains("territory")
            || type.contains("archaeolog")
            || type.contains("private")) return false;
        return !"suppressed".equals(geometrySurface)
            && !"needs_public_location_verification".equals(cleanupStatus);
    }

    private static boolean isOnLongIsland(double latitude, double longitude) {
        return latitude >= LONG_ISLAND_MIN_LAT && latitude <= LONG_ISLAND_MAX_LAT
            && longitude >= LONG_ISLAND_MIN_LNG && longitude <= LONG_ISLAND_MAX_LNG;
    }

    private static boolean hasHeaderImage(JSONObject item) {
        return item != null && (
            !item.optString("listing_image_file", "").trim().isEmpty()
            || !item.optString("listing_image_thumb_url", "").trim().isEmpty()
            || !item.optString("listing_image_url", "").trim().isEmpty()
            || !item.optString("content_image_url", "").trim().isEmpty()
        );
    }

    private static String readAsset(Context context, String path) throws Exception {
        try (InputStream input = context.getAssets().open(path); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) >= 0) output.write(buffer, 0, count);
            return new String(output.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    static final class Site {
        final String title;
        final String slug;
        final double latitude;
        final double longitude;
        final boolean hasHeaderImage;

        Site(String title, String slug, double latitude, double longitude, boolean hasHeaderImage) {
            this.title = title;
            this.slug = slug;
            this.latitude = latitude;
            this.longitude = longitude;
            this.hasHeaderImage = hasHeaderImage;
        }
    }
}
