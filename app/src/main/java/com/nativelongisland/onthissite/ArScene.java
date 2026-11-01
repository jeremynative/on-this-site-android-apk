package com.nativelongisland.onthissite;

import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * The bubbles for one AR session, built by the web app from what is near the
 * visitor (or at the site they opened): stories, people, words and finds.
 */
final class ArScene {
    static final String LAYER_FAMILY = "family";
    static final String LAYER_ARCHIVAL = "archival";
    static final String LAYER_LANGUAGE = "language";
    static final String LAYER_AUDIO = "audio";
    static final String[] LAYERS = {LAYER_FAMILY, LAYER_ARCHIVAL, LAYER_LANGUAGE, LAYER_AUDIO};

    static final String KIND_NOTE = "note";
    static final String KIND_PHRASE = "phrase";
    static final String KIND_AUDIO = "audio";

    static final class Item {
        String id;
        String layer = LAYER_ARCHIVAL;
        String kind = KIND_NOTE;
        String title = "";
        String caption = "";
        String credit = "";
        String word = "";
        String pronunciation = "";
        String meaning = "";
        String image = "";
        String audio = "";
        // The figure drawn inside the bubble (a map animal for language
        // guides) and the answers offered for a language question.
        String figure = "";
        String[] choices = new String[0];
        // Set once the visitor answers a language question correctly.
        boolean answered;
        // A real place's compass bearing (degrees from true north) and
        // distance from the visitor, so its bubble floats that way.
        double bearing = Double.NaN;
        double distanceM = Double.NaN;
        // Where a find (a plant ID, a photo story) was photographed; it
        // floats over that spot.
        double spotLat = Double.NaN;
        double spotLng = Double.NaN;
        boolean sample;

        boolean hasSpot() {
            return !Double.isNaN(spotLat) && !Double.isNaN(spotLng);
        }
    }

    String title = "";
    // Where the visitor stood when the bubbles were built (for the compass).
    double hereLat = Double.NaN;
    double hereLng = Double.NaN;
    final List<Item> items = new ArrayList<>();

    static ArScene fromJson(String json) throws Exception {
        JSONObject root = new JSONObject(json);
        ArScene scene = new ArScene();
        scene.title = root.optString("title", scene.title);
        JSONObject here = root.optJSONObject("here");
        if (here != null) {
            scene.hereLat = here.optDouble("lat", Double.NaN);
            scene.hereLng = here.optDouble("lng", Double.NaN);
        }
        JSONArray items = root.optJSONArray("items");
        for (int i = 0; items != null && i < items.length(); i++) {
            JSONObject o = items.getJSONObject(i);
            Item item = new Item();
            item.id = o.getString("id");
            item.layer = o.optString("layer", LAYER_ARCHIVAL);
            item.kind = o.optString("kind", KIND_NOTE);
            item.title = o.optString("title", "");
            item.caption = o.optString("caption", "");
            item.credit = o.optString("credit", "");
            item.word = o.optString("word", "");
            item.pronunciation = o.optString("pronunciation", "");
            item.meaning = o.optString("meaning", "");
            item.image = o.optString("image", "");
            item.audio = o.optString("audio", "");
            item.sample = o.optBoolean("sample", false);
            item.figure = o.optString("figure", "");
            item.bearing = o.optDouble("bearing_deg", Double.NaN);
            item.distanceM = o.optDouble("distance_m", Double.NaN);
            JSONObject spot = o.optJSONObject("spot");
            if (spot != null) {
                item.spotLat = spot.optDouble("lat", Double.NaN);
                item.spotLng = spot.optDouble("lng", Double.NaN);
            }
            JSONArray choices = o.optJSONArray("choices");
            item.choices = new String[choices == null ? 0 : choices.length()];
            for (int c = 0; c < item.choices.length; c++) item.choices[c] = choices.getString(c);
            scene.items.add(item);
        }
        return scene;
    }
}
