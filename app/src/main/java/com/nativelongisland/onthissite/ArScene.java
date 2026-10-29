package com.nativelongisland.onthissite;

import android.content.Context;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * AR scene for one site. Rooms are tied to printed marker cards; every item
 * pose is stored in its room's gravity-aligned frame (origin at the marker
 * centre, +Y up, +Z pointing out of the marker into the room) so content
 * stays put between visits without GPS, which is unusable indoors.
 */
final class ArScene {
    static final String LAYER_FAMILY = "family";
    static final String LAYER_ARCHIVAL = "archival";
    static final String LAYER_LANGUAGE = "language";
    static final String LAYER_AUDIO = "audio";
    static final String[] LAYERS = {LAYER_FAMILY, LAYER_ARCHIVAL, LAYER_LANGUAGE, LAYER_AUDIO};

    static final String KIND_PHOTO = "photo";
    static final String KIND_REPHOTO = "rephoto";
    static final String KIND_PHRASE = "phrase";
    static final String KIND_AUDIO = "audio";

    static final String PLACEMENT_ANCHORED = "anchored";
    static final String PLACEMENT_DISCOVER = "discover";

    static final class Marker {
        String id;
        String asset;
        float widthMeters;
    }

    static final class Room {
        String id;
        String markerId;
        String name;
        boolean publicAccess;
        boolean outdoor;
        float discoverRadius = 3.5f;
        // Optional floor polygon (x,z pairs in the room frame) where
        // discoverable prompts may appear. Empty means "within discoverRadius".
        List<float[]> zone = new ArrayList<>();
    }

    static final class Item {
        String id;
        String roomId = "";
        String layer = LAYER_ARCHIVAL;
        String kind = KIND_PHOTO;
        String placement = PLACEMENT_ANCHORED;
        String title = "";
        String caption = "";
        String credit = "";
        String word = "";
        String pronunciation = "";
        String meaning = "";
        String image = "";
        String audio = "";
        float widthMeters = 0.6f;
        float[] pose;       // tx,ty,tz,qx,qy,qz,qw in the room frame
        float[] viewpoint;  // camera pose the before/after photo lines up from
        boolean sample;
    }

    String siteId = "mas-house";
    String title = "Ma's House";
    final List<Marker> markers = new ArrayList<>();
    final List<Room> rooms = new ArrayList<>();
    final List<Item> items = new ArrayList<>();

    Room roomForMarker(String markerId) {
        for (Room room : rooms) if (room.markerId.equals(markerId)) return room;
        return null;
    }

    Room room(String roomId) {
        for (Room room : rooms) if (room.id.equals(roomId)) return room;
        return null;
    }

    Marker marker(String markerId) {
        for (Marker marker : markers) if (marker.id.equals(markerId)) return marker;
        return null;
    }

    static String newId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    // ---- JSON ----

    static ArScene fromJson(String json) throws Exception {
        JSONObject root = new JSONObject(json);
        ArScene scene = new ArScene();
        scene.siteId = root.optString("site_id", scene.siteId);
        scene.title = root.optString("title", scene.title);
        JSONArray markers = root.optJSONArray("markers");
        for (int i = 0; markers != null && i < markers.length(); i++) {
            JSONObject m = markers.getJSONObject(i);
            Marker marker = new Marker();
            marker.id = m.getString("id");
            marker.asset = m.optString("asset", "");
            marker.widthMeters = (float) m.optDouble("width_m", 0.2);
            scene.markers.add(marker);
        }
        JSONArray rooms = root.optJSONArray("rooms");
        for (int i = 0; rooms != null && i < rooms.length(); i++) {
            JSONObject r = rooms.getJSONObject(i);
            Room room = new Room();
            room.id = r.getString("id");
            room.markerId = r.getString("marker_id");
            room.name = r.optString("name", "Room");
            room.publicAccess = r.optBoolean("public", false);
            room.outdoor = r.optBoolean("outdoor", false);
            room.discoverRadius = (float) r.optDouble("discover_radius_m", 3.5);
            JSONArray zone = r.optJSONArray("zone");
            for (int z = 0; zone != null && z < zone.length(); z++) {
                JSONArray p = zone.getJSONArray(z);
                room.zone.add(new float[] {(float) p.getDouble(0), (float) p.getDouble(1)});
            }
            scene.rooms.add(room);
        }
        JSONArray items = root.optJSONArray("items");
        for (int i = 0; items != null && i < items.length(); i++) {
            JSONObject o = items.getJSONObject(i);
            Item item = new Item();
            item.id = o.getString("id");
            item.roomId = o.optString("room_id", "");
            item.layer = o.optString("layer", LAYER_ARCHIVAL);
            item.kind = o.optString("kind", KIND_PHOTO);
            item.placement = o.optString("placement", PLACEMENT_ANCHORED);
            item.title = o.optString("title", "");
            item.caption = o.optString("caption", "");
            item.credit = o.optString("credit", "");
            item.word = o.optString("word", "");
            item.pronunciation = o.optString("pronunciation", "");
            item.meaning = o.optString("meaning", "");
            item.image = o.optString("image", "");
            item.audio = o.optString("audio", "");
            item.widthMeters = (float) o.optDouble("width_m", 0.6);
            item.pose = floats(o.optJSONArray("pose"));
            item.viewpoint = floats(o.optJSONArray("viewpoint"));
            item.sample = o.optBoolean("sample", false);
            scene.items.add(item);
        }
        return scene;
    }

    String toJson() throws Exception {
        JSONObject root = new JSONObject();
        root.put("schema", 1);
        root.put("site_id", siteId);
        root.put("title", title);
        JSONArray markers = new JSONArray();
        for (Marker marker : this.markers) {
            markers.put(new JSONObject()
                .put("id", marker.id)
                .put("asset", marker.asset)
                .put("width_m", marker.widthMeters));
        }
        root.put("markers", markers);
        JSONArray rooms = new JSONArray();
        for (Room room : this.rooms) {
            JSONArray zone = new JSONArray();
            for (float[] p : room.zone) zone.put(new JSONArray().put(round(p[0])).put(round(p[1])));
            rooms.put(new JSONObject()
                .put("id", room.id)
                .put("marker_id", room.markerId)
                .put("name", room.name)
                .put("public", room.publicAccess)
                .put("outdoor", room.outdoor)
                .put("discover_radius_m", room.discoverRadius)
                .put("zone", zone));
        }
        root.put("rooms", rooms);
        JSONArray items = new JSONArray();
        for (Item item : this.items) {
            JSONObject o = new JSONObject()
                .put("id", item.id)
                .put("room_id", item.roomId)
                .put("layer", item.layer)
                .put("kind", item.kind)
                .put("placement", item.placement)
                .put("title", item.title)
                .put("caption", item.caption)
                .put("credit", item.credit)
                .put("word", item.word)
                .put("pronunciation", item.pronunciation)
                .put("meaning", item.meaning)
                .put("image", item.image)
                .put("audio", item.audio)
                .put("width_m", item.widthMeters);
            if (item.pose != null) o.put("pose", jsonFloats(item.pose));
            if (item.viewpoint != null) o.put("viewpoint", jsonFloats(item.viewpoint));
            if (item.sample) o.put("sample", true);
            items.put(o);
        }
        root.put("items", items);
        return root.toString(2);
    }

    private static float[] floats(JSONArray array) throws Exception {
        if (array == null || array.length() != 7) return null;
        float[] values = new float[7];
        for (int i = 0; i < 7; i++) values[i] = (float) array.getDouble(i);
        return values;
    }

    private static JSONArray jsonFloats(float[] values) throws Exception {
        JSONArray array = new JSONArray();
        for (float value : values) array.put(round(value));
        return array;
    }

    private static double round(float value) {
        return Math.round(value * 10000.0) / 10000.0;
    }

    // ---- Storage ----

    /**
     * Authored scenes live in app storage. Media paths in the JSON are either
     * "asset:..." (bundled with the APK) or a bare filename under media/.
     */
    static final class Store {
        private final Context context;
        private final String siteId;

        Store(Context context, String siteId) {
            this.context = context.getApplicationContext();
            this.siteId = siteId.replaceAll("[^a-z0-9-]", "");
        }

        File directory() {
            File dir = new File(new File(context.getFilesDir(), "ar"), siteId);
            if (!dir.isDirectory()) dir.mkdirs();
            return dir;
        }

        File mediaDirectory() {
            File dir = new File(directory(), "media");
            if (!dir.isDirectory()) dir.mkdirs();
            return dir;
        }

        File mediaFile(String name) {
            return new File(mediaDirectory(), name.replaceAll("[^A-Za-z0-9._-]", "_"));
        }

        ArScene load() throws Exception {
            File saved = new File(directory(), "scene.json");
            if (saved.isFile()) return fromJson(readString(new FileInputStream(saved)));
            try {
                return fromJson(readString(context.getAssets().open("ar/" + siteId + "/scene.json")));
            } catch (java.io.FileNotFoundException missing) {
                // Sites without a bundled scene start empty; a scanned space
                // supplies the frame and authors add the content.
                ArScene scene = new ArScene();
                scene.siteId = siteId;
                scene.title = siteId;
                return scene;
            }
        }

        void save(ArScene scene) throws Exception {
            File target = new File(directory(), "scene.json");
            File temp = new File(directory(), "scene.json.tmp");
            try (OutputStream out = new FileOutputStream(temp)) {
                out.write(scene.toJson().getBytes(StandardCharsets.UTF_8));
            }
            if (!temp.renameTo(target)) {
                target.delete();
                if (!temp.renameTo(target)) throw new IllegalStateException("Could not save the AR scene.");
            }
        }

        void resetToBundled() {
            new File(directory(), "scene.json").delete();
        }

        /** Writes scene.json plus every referenced media file into one zip. */
        void exportZip(ArScene scene, OutputStream out) throws Exception {
            try (ZipOutputStream zip = new ZipOutputStream(out)) {
                zip.putNextEntry(new ZipEntry("scene.json"));
                zip.write(scene.toJson().getBytes(StandardCharsets.UTF_8));
                zip.closeEntry();
                for (Item item : scene.items) {
                    for (String name : new String[] {item.image, item.audio}) {
                        if (name == null || name.isEmpty() || name.startsWith("asset:")) continue;
                        File file = mediaFile(name);
                        if (!file.isFile()) continue;
                        zip.putNextEntry(new ZipEntry("media/" + file.getName()));
                        try (InputStream in = new FileInputStream(file)) {
                            copy(in, zip);
                        }
                        zip.closeEntry();
                    }
                }
            }
        }

        ArScene importZip(InputStream input) throws Exception {
            String json = null;
            try (ZipInputStream zip = new ZipInputStream(input)) {
                ZipEntry entry;
                while ((entry = zip.getNextEntry()) != null) {
                    String name = entry.getName();
                    if ("scene.json".equals(name)) {
                        json = readString(zip, false);
                    } else if (name.startsWith("media/") && !name.contains("..")) {
                        try (OutputStream out = new FileOutputStream(mediaFile(name.substring(6)))) {
                            copy(zip, out);
                        }
                    }
                }
            }
            if (json == null) throw new IllegalArgumentException("That file has no scene.json.");
            ArScene scene = fromJson(json);
            save(scene);
            return scene;
        }
    }

    static String readString(InputStream in) throws Exception {
        return readString(in, true);
    }

    private static String readString(InputStream in, boolean close) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            copy(in, out);
        } finally {
            if (close) in.close();
        }
        return new String(out.toByteArray(), StandardCharsets.UTF_8);
    }

    static void copy(InputStream in, OutputStream out) throws Exception {
        byte[] buffer = new byte[64 * 1024];
        int read;
        while ((read = in.read(buffer)) > 0) out.write(buffer, 0, read);
    }
}
