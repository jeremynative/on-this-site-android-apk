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
    // The first thing in AR: a red arrow down at the visitor's spot, saying whose land
    // it is and what is near.
    static final String KIND_HERE = "here";
    // "Visitor experiences": what visitors shared at a place (its Community Notes and
    // photos), and an invitation to add a note or an AR photo there.
    static final String KIND_VISITORS = "visitors";

    /** One visitor's note or photo on a "Visitor experiences" card. */
    static final class Visit {
        String author = "";
        String text = "";
        String date = "";
        // Set when the note was left at a nearby place rather than this one.
        String place = "";
        String image = "";
    }

    static final class Item {
        String id;
        String layer = LAYER_ARCHIVAL;
        String kind = KIND_NOTE;
        String title = "";
        String caption = "";
        String credit = "";
        // Read when the card is opened, beyond what the floating card shows.
        String more = "";
        String word = "";
        String pronunciation = "";
        String meaning = "";
        // A language question as it is asked: who asks it (a person of the past,
        // who they were) and the question itself.
        String prompt = "";
        String image = "";
        String audio = "";
        // The figure drawn inside the bubble (a person's icon, for a person
        // who asks a word) and the answers offered for a language question.
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
        // A nearby site shown as a sign in the sky, in its real direction: its name and
        // one line (the full text opens with a tap).
        boolean sky;
        String name = "";
        String brief = "";
        // The "You are here" marker: the land line and the nearest sites with distances.
        String land = "";
        String[] nearby = new String[0];
        // A "Visitor experiences" card: the visits it lists, and the place (slug and
        // name) where a new note or photo is posted.
        Visit[] visits = new Visit[0];
        String join = "";
        String joinTitle = "";

        boolean isHere() {
            return KIND_HERE.equals(kind);
        }

        /** A sky sign needs a direction; without one it stays an ordinary bubble. */
        boolean isSky() {
            return sky && !Double.isNaN(bearing);
        }

        boolean hasSpot() {
            return !Double.isNaN(spotLat) && !Double.isNaN(spotLng);
        }
    }

    String title = "";
    // Where the visitor stood when the bubbles were built (for the compass).
    double hereLat = Double.NaN;
    double hereLng = Double.NaN;
    // The nearby sites' sky signs rise once this many other bubbles are open (they come last).
    int skyAfter = 0;
    final List<Item> items = new ArrayList<>();

    static ArScene fromJson(String json) throws Exception {
        JSONObject root = new JSONObject(json);
        ArScene scene = new ArScene();
        scene.title = root.optString("title", scene.title);
        scene.skyAfter = Math.max(0, root.optInt("sky_after", 0));
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
            item.more = o.optString("more", "");
            item.word = o.optString("word", "");
            item.pronunciation = o.optString("pronunciation", "");
            item.meaning = o.optString("meaning", "");
            item.prompt = o.optString("prompt", "");
            item.image = o.optString("image", "");
            item.audio = o.optString("audio", "");
            item.sample = o.optBoolean("sample", false);
            item.figure = o.optString("figure", "");
            item.sky = o.optBoolean("sky", false);
            item.name = o.optString("name", "");
            item.brief = o.optString("brief", "");
            item.land = o.optString("land", "");
            JSONArray nearby = o.optJSONArray("nearby");
            item.nearby = new String[nearby == null ? 0 : nearby.length()];
            for (int n = 0; n < item.nearby.length; n++) item.nearby[n] = nearby.getString(n);
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
            item.join = o.optString("join", "");
            item.joinTitle = o.optString("join_title", "");
            JSONArray visits = o.optJSONArray("visits");
            item.visits = new Visit[visits == null ? 0 : visits.length()];
            for (int v = 0; v < item.visits.length; v++) {
                JSONObject row = visits.optJSONObject(v);
                Visit visit = new Visit();
                if (row != null) {
                    visit.author = row.optString("author", "");
                    visit.text = row.optString("text", "");
                    visit.date = row.optString("date", "");
                    visit.place = row.optString("place", "");
                    visit.image = row.optString("image", "");
                }
                item.visits[v] = visit;
            }
            scene.items.add(item);
        }
        return scene;
    }
}
