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
            if (!isSafePublicCandidate(metadata)) continue;
            JSONArray center = centerItem.optJSONArray("center");
            if (center == null || center.length() < 2) continue;
            double longitude = center.optDouble(0, Double.NaN);
            double latitude = center.optDouble(1, Double.NaN);
            if (!Double.isFinite(latitude) || !Double.isFinite(longitude) || !isOnLongIsland(latitude, longitude)) continue;
            loaded.add(new Site(metadata.optString("title"), slug, latitude, longitude));
        }
        return loaded;
    }

    private static boolean isSafePublicCandidate(JSONObject item) {
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
        if (sensitiveText.matches(".*\\b(ancestral land|traditional land|territory|reservation|burial|cemetery|sacred|ceremonial|pow ?wow|sweat lodge|archaeolog|private residence)\\b.*")) return false;
        String accuracyText = (address + " " + surface + " " + cleanup).toLowerCase(Locale.ROOT);
        return !accuracyText.matches(".*\\b(approximate|general|broad|near|area|landscape|mixed|pending|needs review)\\b.*");
    }

    private static boolean isOnLongIsland(double latitude, double longitude) {
        return latitude >= LONG_ISLAND_MIN_LAT && latitude <= LONG_ISLAND_MAX_LAT
            && longitude >= LONG_ISLAND_MIN_LNG && longitude <= LONG_ISLAND_MAX_LNG;
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

        Site(String title, String slug, double latitude, double longitude) {
            this.title = title;
            this.slug = slug;
            this.latitude = latitude;
            this.longitude = longitude;
        }
    }
}
