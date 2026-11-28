package com.nativelongisland.onthissite;

import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.BlurMaskFilter;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.opengl.Matrix;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

/**
 * A wigwam a visitor can plant and walk into: a dome of bark slabs over a frame
 * of bent poles lashed together, a smoke hole with a sheet of bark over part of
 * it, and inside, mats hung round the walls, a fire burning in a ring of stones
 * (it lights the room and its smoke drifts out of the top), a wooden bed with a
 * mat and a deer hide, a hickory stump seat, braided corn hanging from a pole,
 * a pot of corn mush by the fire, squash, beans, a gourd, shellfish in a bowl,
 * a mortar and pestle, firewood and herbs.
 *
 * Words from the Knowledgebase float over the things they name, with their
 * sources: from "Algonquian Languages of Long Island" (Harrington's 1903 list
 * and the Shinnecock Elders' 2014 catalogue) and from "Native Plants"
 * (Jefferson's 1791 Unquachog vocabulary), which that article points to for
 * plant words. They hide with Hide all; the wigwam stays.
 *
 * Everything is built and drawn here in code, so nothing is downloaded. Its
 * frame: the door at the origin facing +Z (the visitor), the wigwam behind it.
 */
final class ArWigwam {
    private ArWigwam() {}

    // At scale 1 (metres): about 4.2 by 3.8 m and 2.45 m high, with a door a
    // grown person can walk through and a smoke hole 60 cm across.
    static final float RX = 2.1f;
    static final float RZ = 1.9f;
    static final float HEIGHT = 2.45f;
    static final float DOOR_HALF = 0.47f;
    static final float DOOR_TOP = 1.78f;
    static final float HOLE = 0.3f;
    // Steeper than a half ellipse, as bent poles stand.
    private static final float SHAPE = 2f / 2.2f;
    // The fire, under the smoke hole.
    static final float[] FIRE = {0f, 0f, -RZ};

    // ---- The things, as meshes grouped by texture ----

    /** One textured mesh: where it is lit from (outside or inside by the fire) and how it shines. */
    static final class Part {
        final String texture;
        final ArGl.Mesh mesh;
        final boolean inside;
        final float gloss;
        final float shine;

        Part(String texture, ArGl.Mesh mesh, boolean inside, float gloss, float shine) {
            this.texture = texture;
            this.mesh = mesh;
            this.inside = inside;
            this.gloss = gloss;
            this.shine = shine;
        }
    }

    private static List<Part> parts;

    /** The wigwam's meshes, built once. */
    static synchronized List<Part> parts() {
        if (parts != null) return parts;
        List<Part> list = new ArrayList<>();
        Builder bark = new Builder();
        outerShell(bark);
        smokeCover(bark);
        list.add(new Part("wig:bark", bark.build(), false, 0.03f, 6f));
        Builder poles = new Builder();
        outerPoles(poles);
        list.add(new Part("wig:pole", poles.build(), false, 0.05f, 10f));
        Builder lining = new Builder();
        innerLining(lining);
        list.add(new Part("wig:inner", lining.build(), true, 0.02f, 6f));
        Builder floor = new Builder();
        disc(floor, translate(0f, 0.006f, -RZ), RX - 0.06f, RZ - 0.06f, 40, 0.6f);
        list.add(new Part("wig:floor", floor.build(), true, 0f, 4f));
        Builder frame = new Builder();
        innerFrame(frame);
        furnitureWood(frame);
        list.add(new Part("wig:pole", frame.build(), true, 0.06f, 12f));
        Builder stones = new Builder();
        hearthStones(stones);
        list.add(new Part("wig:stone", stones.build(), true, 0.08f, 20f));
        Builder logs = new Builder();
        fireLogs(logs);
        list.add(new Part("wig:char", logs.build(), true, 0.05f, 12f));
        Builder wood = new Builder();
        carvedWood(wood);
        list.add(new Part("wig:wood", wood.build(), true, 0.06f, 14f));
        Builder grain = new Builder();
        disc(grain, translate(STUMP[0], 0.42f, STUMP[2]), 0.17f, 0.17f, 18, 0f);
        list.add(new Part("wig:endgrain", grain.build(), true, 0.04f, 10f));
        Builder mats = new Builder();
        mats(mats);
        list.add(new Part("wig:mat", mats.build(), true, 0.02f, 6f));
        Builder hide = new Builder();
        hide(hide);
        list.add(new Part("wig:hide", hide.build(), true, 0.04f, 8f));
        Builder corn = new Builder();
        Builder husks = new Builder();
        corn(corn, husks);
        list.add(new Part("wig:corn", corn.build(), true, 0.15f, 24f));
        list.add(new Part("wig:husk", husks.build(), true, 0.02f, 6f));
        Builder pot = new Builder();
        pot(pot);
        list.add(new Part("wig:clay", pot.build(), true, 0.05f, 10f));
        Builder mush = new Builder();
        float[] potTop = potFrame();
        Matrix.translateM(potTop, 0, 0f, 0.3f, 0f);
        disc(mush, potTop, 0.106f, 0.106f, 18, 0f);
        list.add(new Part("wig:mush", mush.build(), true, 0.25f, 30f));
        Builder baskets = new Builder();
        baskets(baskets);
        list.add(new Part("wig:basket", baskets.build(), true, 0.03f, 8f));
        Builder beans = new Builder();
        disc(beans, translate(BEANS[0], 0.19f, BEANS[2]), 0.142f, 0.142f, 18, 0f);
        list.add(new Part("wig:beans", beans.build(), true, 0.1f, 20f));
        Builder squash = new Builder();
        squash(squash);
        list.add(new Part("wig:squash", squash.build(), true, 0.2f, 22f));
        Builder gourd = new Builder();
        gourd(gourd);
        list.add(new Part("wig:gourd", gourd.build(), true, 0.15f, 18f));
        Builder shells = new Builder();
        shells(shells);
        list.add(new Part("wig:shell", shells.build(), true, 0.25f, 30f));
        Builder herbs = new Builder();
        herbs(herbs);
        list.add(new Part("wig:herb", herbs.build(), true, 0f, 4f));
        parts = list;
        return parts;
    }

    /** Every texture the wigwam draws with: its meshes', then the fire's, the smoke's and the labels'. */
    static String[] textures() {
        List<String> keys = new ArrayList<>(Arrays.asList(
            "wig:bark", "wig:pole", "wig:inner", "wig:floor", "wig:stone", "wig:char", "wig:wood", "wig:endgrain",
            "wig:mat", "wig:hide", "wig:corn", "wig:husk", "wig:clay", "wig:mush", "wig:basket", "wig:beans",
            "wig:squash", "wig:gourd", "wig:shell", "wig:herb",
            "wig:flame0", "wig:flame1", "wig:flame2", "wig:flame3", "wig:ember", "wig:ash", "wig:smoke"));
        for (Label label : LABELS) keys.add("wig:label:" + label.key);
        return keys.toArray(new String[0]);
    }

    /** Tiled textures repeat; the fire's, smoke's, labels' and cut-out ones are drawn once. */
    static boolean repeats(String key) {
        return !(key.startsWith("wig:flame") || key.startsWith("wig:label:") || key.equals("wig:ember")
            || key.equals("wig:ash") || key.equals("wig:smoke") || key.equals("wig:hide") || key.equals("wig:husk")
            || key.equals("wig:endgrain") || key.equals("wig:mush") || key.equals("wig:beans"));
    }

    // ---- Where things stand inside (the fire is at FIRE) ----

    private static final float BED_Z = -3.1f;
    private static final float[] STUMP = {0.78f, 0f, -1.48f};
    private static final float[] POT = {0.25f, 0f, -1.78f};
    private static final float[] BOWL = {-0.72f, 0f, -1.46f};
    private static final float[] BEANS = {1.5f, 0f, -1.55f};
    private static final float[][] SQUASH = {{1.38f, 0f, -2.38f}, {1.58f, 0f, -2.06f}, {1.3f, 0f, -1.86f}};
    private static final float CORN_X = -1.35f;
    private static final float CORN_Y = 1.7f;
    private static final float[] CORN_BUNCHES = {-2.4f, -1.95f, -1.52f};
    private static final float[] GOURD = {-1.35f, 1.7f, -1.42f};
    private static final float[] MORTAR = {0.98f, 0f, -0.78f};

    // ---- The words ----

    /** A word over a thing: what it is, the word, where it is from, and where it floats (the wigwam's frame). */
    static final class Label {
        final String key;
        final String english;
        final String word;
        final String source;
        final float[] at;
        // Its width (metres at scale 1).
        final float width;

        Label(String key, String english, String word, String source, float[] at) {
            this(key, english, word, source, at, 0.27f);
        }

        Label(String key, String english, String word, String source, float[] at, float width) {
            this.key = key;
            this.english = english;
            this.word = word;
            this.source = source;
            this.at = at;
            this.width = width;
        }
    }

    private static final String HARRINGTON = "Shinnecock and Poosepatuck · Harrington, 1903";
    private static final String JEFFERSON = "Unquachog · Jefferson, 1791";

    static final Label[] LABELS = {
        new Label("house", "house", "wíkam", HARRINGTON, new float[] {0f, 2.1f, 0.3f}, 0.55f),
        new Label("corn", "Indian corn", "sowhámmen", JEFFERSON, new float[] {CORN_X + 0.12f, 2.0f, -1.95f}),
        new Label("mush", "corn mush", "suppán", HARRINGTON, new float[] {POT[0], 0.66f, POT[2]}),
        new Label("deer", "deer", "Autuk", "Shinnecock · Elders' catalogue, 2014", new float[] {0.15f, 0.78f, BED_Z + 0.05f}),
        new Label("hickory", "hickory", "wusquíat", JEFFERSON, new float[] {STUMP[0], 0.78f, STUMP[2]}),
        new Label("squash", "squash", "áscoot", JEFFERSON, new float[] {1.42f, 0.52f, -2.1f}),
        new Label("beans", "beans", "mais-cusseet", JEFFERSON, new float[] {BEANS[0], 0.58f, BEANS[2]}),
        new Label("gourd", "gourd", "whorámmok", JEFFERSON, new float[] {GOURD[0] + 0.1f, 1.08f, GOURD[2] + 0.05f}),
        new Label("shellfish", "shellfish", "sétcawa", HARRINGTON, new float[] {BOWL[0], 0.42f, BOWL[2]}),
    };

    // ---- What is drawn each frame besides the meshes ----

    /** A flat picture to draw this frame: the fire, its glow and ash, smoke, or a word. */
    static final class Quad {
        final float[] model;
        final float[] point;
        final String texture;
        final float alpha;
        final float additive;

        Quad(float[] model, float[] point, String texture, float alpha, float additive) {
            this.model = model;
            this.point = point;
            this.texture = texture;
            this.alpha = alpha;
            this.additive = additive;
        }
    }

    /**
     * The fire's flames (upright, turned to the camera), the embers' glow and
     * the ash round the hearth, smoke drifting up from the fire and out of the
     * smoke hole, and (when labels shows) the words. base is the wigwam's
     * anchor, eye the camera, right and up its axes (world).
     */
    static void addQuads(float[] base, float scale, float time, float[] eye, float[] right, float[] up, boolean labels,
                         ArModels.Ready ready, List<Quad> quads) {
        float[] model = base.clone();
        Matrix.scaleM(model, 0, scale, scale, scale);
        // Ash and the embers' glow, lying on the floor.
        quads.add(flat(model, FIRE[0], 0.009f, FIRE[2], 0.66f, "wig:ash", 0.85f, 0f));
        float pulse = 0.82f + 0.12f * (float) Math.sin(time * 2.3f) + 0.06f * (float) Math.sin(time * 5.7f + 1f);
        quads.add(flat(model, FIRE[0], 0.04f, FIRE[2], 0.27f, "wig:ember", pulse, 1f));
        // Flames: three tongues, each changing shape a dozen times a second.
        float[][] tongues = {{0f, 0f, 0.38f}, {0.07f, 0.05f, 0.28f}, {-0.06f, -0.04f, 0.26f}};
        for (int i = 0; i < tongues.length; i++) {
            int frame = (int) Math.floor(time * 11f + i * 1.7f) % 4;
            float flicker = 0.86f + 0.14f * (float) Math.sin(time * 9f + i * 2.1f) + 0.06f * (float) Math.sin(time * 23f + i);
            float wide = tongues[i][2] * scale;
            float high = wide * 1.75f * flicker;
            float[] foot = local(model, FIRE[0] + tongues[i][0] + 0.015f * (float) Math.sin(time * 3f + i), 0.03f, FIRE[2] + tongues[i][1]);
            float[] middle = {foot[0], foot[1] + high / 2f, foot[2]};
            quads.add(new Quad(upright(middle, eye, wide, high), middle, "wig:flame" + ((frame + 4) % 4), 1f, 0.9f));
        }
        // Smoke: faint inside, rising from the fire to the hole, then drifting off outside.
        float[] hole = {FIRE[0], HEIGHT - 0.1f, FIRE[2]};
        for (int i = 0; i < 9; i++) {
            float age = ((time / 9f) + i / 9f) % 1f;
            float x = hole[0] + 0.55f * age * age + 0.08f * (float) Math.sin(time * 0.7f + i * 2.3f);
            float y = hole[1] + age * 1.7f;
            float z = hole[2] + 0.25f * age * age;
            float size = (0.35f + 1.1f * age) * scale;
            float alpha = 0.2f * (float) Math.sin(Math.PI * Math.min(1f, age * 1.25f)) * (1f - age * 0.4f);
            float[] point = local(model, x, y, z);
            quads.add(new Quad(facing(point, right, up, size, size), point, "wig:smoke", alpha, 0f));
        }
        for (int i = 0; i < 4; i++) {
            float age = ((time / 6f) + i / 4f) % 1f;
            float[] point = local(model, FIRE[0] + 0.05f * (float) Math.sin(time + i * 1.6f), 0.55f + age * (HEIGHT - 0.9f), FIRE[2]);
            float size = (0.3f + 0.55f * age) * scale;
            quads.add(new Quad(facing(point, right, up, size, size), point, "wig:smoke", 0.07f * (float) Math.sin(Math.PI * age), 0f));
        }
        if (!labels) return;
        for (Label label : LABELS) {
            String key = "wig:label:" + label.key;
            if (!ready.has(key)) continue;
            float[] point = local(model, label.at[0], label.at[1], label.at[2]);
            float wide = label.width * scale;
            quads.add(new Quad(upright(point, eye, wide, wide * LABEL_ASPECT), point, key, 0.97f, 0f));
        }
    }

    /** Whether a point (world) is inside the wigwam whose anchor is base, for leaving out its tap box. */
    static boolean inside(float[] base, float scale, float[] point) {
        float[] inverse = new float[16];
        float[] model = base.clone();
        Matrix.scaleM(model, 0, scale, scale, scale);
        if (!Matrix.invertM(inverse, 0, model, 0)) return false;
        float[] local = new float[4];
        Matrix.multiplyMV(local, 0, inverse, 0, new float[] {point[0], point[1], point[2], 1f}, 0);
        float dx = local[0] / RX;
        float dz = (local[2] + RZ) / RZ;
        return dx * dx + dz * dz < 1f && local[1] < HEIGHT;
    }

    /** The fire's position (world) for a wigwam at base, a little above the hearth, for its light. */
    static float[] firelight(float[] base, float scale) {
        float[] model = base.clone();
        Matrix.scaleM(model, 0, scale, scale, scale);
        return local(model, FIRE[0], 0.3f, FIRE[2]);
    }

    private static float[] local(float[] model, float x, float y, float z) {
        float[] out = new float[4];
        Matrix.multiplyMV(out, 0, model, 0, new float[] {x, y, z, 1f}, 0);
        return new float[] {out[0], out[1], out[2]};
    }

    /** A picture lying flat on the floor (the wigwam's frame), radius metres from its middle. */
    private static Quad flat(float[] model, float x, float y, float z, float radius, String texture, float alpha, float additive) {
        float[] m = model.clone();
        Matrix.translateM(m, 0, x, y, z);
        Matrix.rotateM(m, 0, -90f, 1f, 0f, 0f);
        Matrix.scaleM(m, 0, radius * 2f, radius * 2f, 1f);
        return new Quad(m, local(model, x, y, z), texture, alpha, additive);
    }

    /** An upright picture at middle turned round to face the eye. */
    private static float[] upright(float[] middle, float[] eye, float wide, float high) {
        float yaw = ArPlacement.yawTowards(middle[0], middle[2], eye[0], eye[2]);
        float[] m = new float[16];
        Matrix.setIdentityM(m, 0);
        Matrix.translateM(m, 0, middle[0], middle[1], middle[2]);
        Matrix.rotateM(m, 0, (float) Math.toDegrees(yaw), 0f, 1f, 0f);
        Matrix.scaleM(m, 0, wide, high, 1f);
        return m;
    }

    /** A picture at point facing the camera squarely (right and up are its axes). */
    private static float[] facing(float[] point, float[] right, float[] up, float wide, float high) {
        float[] normal = {right[1] * up[2] - right[2] * up[1], right[2] * up[0] - right[0] * up[2], right[0] * up[1] - right[1] * up[0]};
        return new float[] {
            right[0] * wide, right[1] * wide, right[2] * wide, 0f,
            up[0] * high, up[1] * high, up[2] * high, 0f,
            normal[0], normal[1], normal[2], 0f,
            point[0], point[1], point[2], 1f};
    }

    // ---- The dome ----

    /** A point on the dome at angle theta round from the door and phi up from the ground, moved in by inset (out if negative). */
    private static float[] dome(float theta, float phi, float inset) {
        float across = (float) Math.pow(Math.max(0.0, Math.cos(phi)), SHAPE);
        float rise = (float) Math.pow(Math.max(0.0, Math.sin(phi)), SHAPE);
        return new float[] {
            (RX - inset) * across * (float) Math.sin(theta),
            (HEIGHT - inset) * rise,
            -RZ + (RZ - inset) * across * (float) Math.cos(theta)};
    }

    private static float[] domeNormal(float[] p) {
        return normalize(p[0] / (RX * RX), p[1] / (HEIGHT * HEIGHT) * 1.3f, (p[2] + RZ) / (RZ * RZ));
    }

    private static float phiAt(float y) {
        return (float) Math.asin(Math.pow(Math.min(1f, y / HEIGHT), 1f / SHAPE));
    }

    private static float phiRim() {
        return (float) Math.acos(Math.pow(HOLE / RX, 1f / SHAPE));
    }

    private static float doorAngle() {
        return (float) Math.asin(DOOR_HALF / RX);
    }

    /** The rings of the dome, from the ground to the smoke hole, with one at the top of the door. */
    private static float[] rows() {
        float door = phiAt(DOOR_TOP);
        float rim = phiRim();
        float[] rows = new float[10];
        for (int i = 0; i <= 5; i++) rows[i] = door * i / 5f;
        for (int i = 1; i <= 4; i++) rows[5 + i] = door + (rim - door) * i / 4f;
        return rows;
    }

    /** Angles round the dome: four across the door, then sixty round the rest. */
    private static float[] columns() {
        float door = doorAngle();
        float[] columns = new float[65];
        for (int i = 0; i <= 4; i++) columns[i] = -door + 2f * door * i / 4f;
        for (int i = 1; i <= 60; i++) columns[4 + i] = door + (float) (2 * Math.PI - 2 * door) * i / 60f;
        return columns;
    }

    /**
     * The bark: each ring of slabs a band whose lower edge stands out over the
     * band below, like shingles, its slabs offset from the band above.
     */
    private static void outerShell(Builder b) {
        float[] rows = rows();
        float[] columns = columns();
        Random random = new Random(41);
        for (int r = 0; r < rows.length - 1; r++) {
            boolean belowDoor = r < 5;
            boolean overDoor = r == 5;
            float offset = random.nextFloat();
            for (int c = 0; c < columns.length - 1; c++) {
                boolean door = c < 4;
                if (belowDoor && door) continue;
                float lowPhi = r == 0 ? 0f : (overDoor && door ? rows[r] : rows[r] - 0.05f);
                float out = overDoor && door ? 0f : 0.035f;
                float[] a = dome(columns[c], lowPhi, -out);
                float[] bb = dome(columns[c + 1], lowPhi, -out);
                float[] cc = dome(columns[c + 1], rows[r + 1], 0f);
                float[] d = dome(columns[c], rows[r + 1], 0f);
                float u0 = (float) (columns[c] / (2 * Math.PI)) * 7f + offset;
                float u1 = (float) (columns[c + 1] / (2 * Math.PI)) * 7f + offset;
                quad(b, a, bb, cc, d, u0, 1f, u1, 1f, u1, 0f, u0, 0f);
            }
        }
    }

    /** A sheet of bark over part of the smoke hole, on the side away from the door. */
    private static void smokeCover(Builder b) {
        float[] m = translate(-0.22f, HEIGHT + 0.06f, -RZ - 0.06f);
        Matrix.rotateM(m, 0, 14f, 0f, 0f, 1f);
        float w = 0.48f;
        float d = 0.42f;
        float[][] corners = {{-w, 0f, d}, {w, 0.05f, d}, {w, 0.05f, -d}, {-w, 0f, -d}};
        float[][] world = new float[4][];
        for (int i = 0; i < 4; i++) world[i] = transform(m, corners[i]);
        quad(b, world[0], world[1], world[2], world[3], 0.1f, 0f, 0.45f, 0f, 0.45f, 0.9f, 0.1f, 0.9f);
    }

    /** The lining inside: mats round the walls, the bark's inner side above them, sooty near the hole. */
    private static void innerLining(Builder b) {
        float[] rows = rows();
        float[] columns = columns();
        for (int r = 0; r < rows.length - 1; r++) {
            for (int c = 0; c < columns.length - 1; c++) {
                if (r < 5 && c < 4) continue;
                float[] a = dome(columns[c], rows[r], 0.07f);
                float[] bb = dome(columns[c + 1], rows[r], 0.07f);
                float[] cc = dome(columns[c + 1], rows[r + 1], 0.07f);
                float[] d = dome(columns[c], rows[r + 1], 0.07f);
                float u0 = (float) (columns[c] / (2 * Math.PI)) * 6f;
                float u1 = (float) (columns[c + 1] / (2 * Math.PI)) * 6f;
                quad(b, a, bb, cc, d, u0, 1f - a[1] / HEIGHT, u1, 1f - bb[1] / HEIGHT, u1, 1f - cc[1] / HEIGHT, u0, 1f - d[1] / HEIGHT);
            }
        }
    }

    /** The poles lashed over the bark outside, the door's frame and the smoke hole's rim. */
    private static void outerPoles(Builder b) {
        float door = doorAngle();
        float rim = phiRim();
        // Rings round the outside, open over the door below its top.
        float[] heights = {0.42f, 1.12f, 1.98f};
        for (float y : heights) {
            float phi = phiAt(y);
            boolean open = y < DOOR_TOP;
            float from = open ? door + 0.06f : 0f;
            float to = open ? (float) (2 * Math.PI) - door - 0.06f : (float) (2 * Math.PI);
            List<float[]> path = new ArrayList<>();
            for (int i = 0; i <= 60; i++) path.add(dome(from + (to - from) * i / 60f, phi, -0.06f));
            tube(b, path, 0.024f, 6, 1f);
        }
        // Poles bent over the top, crossing above the smoke hole.
        for (float degrees : new float[] {28f, 72f, 116f, 160f}) {
            arch(b, (float) Math.toRadians(degrees), rim, -0.065f, HEIGHT + 0.03f, 0.026f);
        }
        // The door's posts and lintel, between the bark and the lining.
        for (int side = -1; side <= 1; side += 2) {
            List<float[]> post = new ArrayList<>();
            float phiTop = phiAt(DOOR_TOP);
            for (int i = 0; i <= 12; i++) post.add(dome(side * door, phiTop * i / 12f, 0.035f));
            post.add(dome(side * door, phiTop + 0.03f, 0.035f));
            tube(b, post, 0.05f, 7, 1f);
        }
        List<float[]> lintel = new ArrayList<>();
        for (int i = 0; i <= 8; i++) lintel.add(dome(-door - 0.03f + (2 * door + 0.06f) * i / 8f, phiAt(DOOR_TOP), 0.035f));
        tube(b, lintel, 0.045f, 7, 1f);
        List<float[]> ring = new ArrayList<>();
        for (int i = 0; i <= 40; i++) ring.add(dome((float) (2 * Math.PI * i / 40), rim, 0.035f));
        tube(b, ring, 0.034f, 7, 1f);
    }

    /** The bent poles inside, under the lining: arches over the top and rings round. */
    private static void innerFrame(Builder b) {
        float door = doorAngle();
        float rim = phiRim();
        for (float degrees : new float[] {45f, 90f, 135f}) {
            arch(b, (float) Math.toRadians(degrees), rim, 0.1f, HEIGHT - 0.14f, 0.03f);
        }
        for (float y : new float[] {0.72f, 1.42f, 2.04f}) {
            float phi = phiAt(y);
            boolean open = y < DOOR_TOP;
            float from = open ? door + 0.08f : 0f;
            float to = open ? (float) (2 * Math.PI) - door - 0.08f : (float) (2 * Math.PI);
            List<float[]> path = new ArrayList<>();
            for (int i = 0; i <= 60; i++) path.add(dome(from + (to - from) * i / 60f, phi, 0.1f));
            tube(b, path, 0.028f, 6, 1f);
        }
    }

    /** A pole from the ground at angle up the dome, over the top at height across, and down the far side. */
    private static void arch(Builder b, float angle, float rim, float inset, float across, float radius) {
        List<float[]> path = new ArrayList<>();
        for (int i = 0; i <= 16; i++) path.add(dome(angle, rim * i / 16f, inset));
        float[] near = dome(angle, rim, inset);
        float[] far = dome(angle + (float) Math.PI, rim, inset);
        for (int i = 1; i < 6; i++) {
            float t = i / 6f;
            path.add(new float[] {near[0] + (far[0] - near[0]) * t, across + (near[1] - across) * (float) Math.pow(2 * t - 1, 2), near[2] + (far[2] - near[2]) * t});
        }
        for (int i = 16; i >= 0; i--) path.add(dome(angle + (float) Math.PI, rim * i / 16f, inset));
        tube(b, path, radius, 6, 1f);
    }

    // ---- The hearth ----

    private static void hearthStones(Builder b) {
        Random random = new Random(7);
        int count = 12;
        for (int i = 0; i < count; i++) {
            double angle = 2 * Math.PI * i / count + random.nextFloat() * 0.2f;
            float x = FIRE[0] + 0.46f * (float) Math.cos(angle);
            float z = FIRE[2] + 0.46f * (float) Math.sin(angle);
            float[] m = translate(x, 0.025f, z);
            Matrix.rotateM(m, 0, random.nextFloat() * 360f, 0f, 1f, 0f);
            Matrix.scaleM(m, 0, 0.1f + 0.05f * random.nextFloat(), 0.055f + 0.035f * random.nextFloat(), 0.09f + 0.04f * random.nextFloat());
            rock(b, m, random.nextInt(1000), random.nextFloat());
        }
    }

    /** A rounded, lumpy stone of radius 1 (scaled by m). */
    private static void rock(Builder b, float[] m, int seed, float uOffset) {
        int rings = 7;
        int segments = 10;
        int first = b.count();
        for (int r = 0; r <= rings; r++) {
            double polar = Math.PI * r / rings;
            for (int s = 0; s <= segments; s++) {
                double around = 2 * Math.PI * s / segments;
                float lump = 1f + 0.2f * (float) Math.sin(3 * around + seed) * (float) Math.sin(2 * polar + seed * 0.3)
                    + 0.12f * (float) Math.cos(5 * around + seed * 1.7 + polar * 3)
                    + 0.07f * (float) Math.sin(9 * around + polar * 5 + seed);
                if (r == 0 || r == rings) lump = 1f;
                float nx = (float) (Math.sin(polar) * Math.cos(around));
                float ny = (float) Math.cos(polar);
                float nz = (float) (Math.sin(polar) * Math.sin(around));
                // Flatter underneath, where it sits.
                float y = ny < 0 ? ny * 0.55f : ny;
                b.vertex(m, nx * lump, y * lump, nz * lump, nx, ny, nz, s / (float) segments * 0.5f + uOffset, r / (float) rings * 0.5f);
            }
        }
        for (int r = 0; r < rings; r++) {
            for (int s = 0; s < segments; s++) {
                int a = first + r * (segments + 1) + s;
                int c = a + segments + 1;
                b.triangle(a, c, a + 1);
                b.triangle(c, c + 1, a + 1);
            }
        }
    }

    /** Charred logs laid in a star, their ends meeting in the fire. */
    private static void fireLogs(Builder b) {
        Random random = new Random(3);
        for (int i = 0; i < 5; i++) {
            double angle = 2 * Math.PI * i / 5 + 0.3;
            float outer = 0.4f;
            float[] start = {FIRE[0] + outer * (float) Math.cos(angle), 0.03f, FIRE[2] + outer * (float) Math.sin(angle)};
            float[] end = {FIRE[0] + 0.04f * (float) Math.cos(angle), 0.13f, FIRE[2] + 0.04f * (float) Math.sin(angle)};
            float r = 0.032f + 0.015f * random.nextFloat();
            log(b, start, end, r, random.nextFloat());
        }
    }

    /** A round log from start to end (its axis), with closed ends. */
    private static void log(Builder b, float[] start, float[] end, float radius, float uOffset) {
        float[] axis = {end[0] - start[0], end[1] - start[1], end[2] - start[2]};
        float length = (float) Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
        float[] m = alongY(start, axis);
        lathe(b, m, new float[][] {{0f, 0f}, {0f, radius}, {length, radius * 0.92f}, {length, 0f}}, 10, uOffset, uOffset + 1f, 2f);
    }

    // ---- Furniture and things ----

    /** The bed's posts, rails and slats, the stump's side, the corn's pole, cords, and the firewood: all bark-covered poles. */
    private static void furnitureWood(Builder b) {
        float halfLength = 0.97f;
        float halfDepth = 0.4f;
        for (int sx = -1; sx <= 1; sx += 2) {
            for (int sz = -1; sz <= 1; sz += 2) {
                float[] foot = {sx * (halfLength - 0.05f), 0f, BED_Z + sz * (halfDepth - 0.03f)};
                log(b, foot, new float[] {foot[0], 0.33f, foot[2]}, 0.035f, sx * 0.3f + sz * 0.1f);
            }
            // Side rails along the bed's length.
            log(b, new float[] {-halfLength, 0.3f, BED_Z + sx * (halfDepth - 0.03f)}, new float[] {halfLength, 0.3f, BED_Z + sx * (halfDepth - 0.03f)}, 0.03f, 0.2f);
        }
        for (int i = 0; i < 10; i++) {
            float x = -halfLength + 0.08f + (2 * halfLength - 0.16f) * i / 9f;
            log(b, new float[] {x, 0.335f, BED_Z - halfDepth}, new float[] {x, 0.335f, BED_Z + halfDepth}, 0.022f, i * 0.13f);
        }
        // The stump's bark.
        float[] stump = translate(STUMP[0], 0f, STUMP[2]);
        lathe(b, stump, new float[][] {{0f, 0f}, {0f, 0.195f}, {0.06f, 0.18f}, {0.42f, 0.17f}}, 16, 0f, 3f, 2f);
        // The corn's pole, tied between the frame's poles.
        log(b, new float[] {CORN_X, CORN_Y, CORN_BUNCHES[0] - 0.22f}, new float[] {CORN_X, CORN_Y, CORN_BUNCHES[2] + 0.24f}, 0.022f, 0.4f);
        // The gourd's cord.
        log(b, new float[] {GOURD[0], CORN_Y - 0.03f, GOURD[2]}, new float[] {GOURD[0], CORN_Y - 0.2f, GOURD[2]}, 0.003f, 0f);
        // Firewood stacked by the door.
        Random random = new Random(11);
        float[][] stack = {{-1.02f, 0.05f}, {-0.9f, 0.05f}, {-0.78f, 0.05f}, {-0.96f, 0.14f}, {-0.84f, 0.14f}, {-0.9f, 0.23f}};
        for (float[] piece : stack) {
            float r = 0.045f + 0.01f * random.nextFloat();
            log(b, new float[] {piece[0], piece[1], -1.15f}, new float[] {piece[0] + 0.02f, piece[1], -0.5f}, r, random.nextFloat());
        }
    }

    /** The mortar (a hollowed log), its pestle leaning on it, and the shellfish's wooden bowl. */
    private static void carvedWood(Builder b) {
        float[] mortar = translate(MORTAR[0], 0f, MORTAR[2]);
        lathe(b, mortar, new float[][] {
            {0f, 0f}, {0f, 0.2f}, {0.5f, 0.19f}, {0.52f, 0.17f}, {0.52f, 0.12f}, {0.4f, 0.1f}, {0.3f, 0.05f}, {0.29f, 0f}}, 16, 0f, 2f, 2f);
        float[] foot = {MORTAR[0] + 0.32f, 0f, MORTAR[2] + 0.1f};
        float[] top = {MORTAR[0] + 0.12f, 1.02f, MORTAR[2] + 0.02f};
        float[] axis = {top[0] - foot[0], top[1] - foot[1], top[2] - foot[2]};
        float length = (float) Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
        lathe(b, alongY(foot, axis), new float[][] {
            {0f, 0f}, {0f, 0.055f}, {0.16f, 0.06f}, {0.26f, 0.036f}, {length - 0.2f, 0.032f}, {length - 0.08f, 0.045f}, {length, 0.042f}, {length, 0f}},
            10, 0f, 1f, 1f);
        lathe(b, translate(BOWL[0], 0f, BOWL[2]), new float[][] {
            {0f, 0f}, {0f, 0.07f}, {0.04f, 0.13f}, {0.085f, 0.17f}, {0.095f, 0.172f}, {0.095f, 0.158f}, {0.05f, 0.125f}, {0.03f, 0f}}, 18, 0f, 1f, 2f);
    }

    /** The bed's mat and the mat rolled at its head, and a floor mat by the hearth. */
    private static void mats(Builder b) {
        box(b, -0.98f, 0.345f, BED_Z - 0.42f, 0.98f, 0.37f, BED_Z + 0.42f, 1.2f);
        float[] roll = translate(-0.8f, 0.43f, BED_Z);
        Matrix.rotateM(roll, 0, 90f, 1f, 0f, 0f);
        lathe(b, roll, new float[][] {{-0.38f, 0f}, {-0.38f, 0.06f}, {0.38f, 0.065f}, {0.38f, 0f}}, 14, 0f, 2f, 1.2f);
        box(b, -1.42f, 0.006f, -2.4f, -0.68f, 0.016f, -1.12f, 1.2f);
    }

    /** A deer hide spread over the bed. */
    private static void hide(Builder b) {
        float[] m = translate(0.15f, 0.376f, BED_Z + 0.02f);
        Matrix.rotateM(m, 0, 6f, 0f, 1f, 0f);
        float w = 0.74f;
        float d = 0.48f;
        quad(b, transform(m, new float[] {-w, 0f, d}), transform(m, new float[] {w, 0f, d}), transform(m, new float[] {w, 0f, -d}),
            transform(m, new float[] {-w, 0f, -d}), 0f, 1f, 1f, 1f, 1f, 0f, 0f, 0f);
    }

    /** Braided corn: bunches of ears hanging point down from the pole, their husks pulled up and tied. */
    private static void corn(Builder ears, Builder husks) {
        Random random = new Random(5);
        int ear = 0;
        for (float z : CORN_BUNCHES) {
            float[] tie = {CORN_X, CORN_Y - 0.04f, z};
            for (int i = 0; i < 5; i++) {
                double spread = (i - 2) * 0.32;
                float drop = 0.1f + 0.05f * random.nextFloat();
                float[] butt = {tie[0] + 0.05f * (float) Math.sin(spread * 1.7), tie[1] - drop, tie[2] + 0.07f * (float) Math.sin(spread)};
                float[] down = {0.12f * (float) Math.sin(spread * 1.7) + (random.nextFloat() - 0.5f) * 0.05f, -1f, 0.25f * (float) Math.sin(spread)};
                float[] m = alongY(butt, down);
                int variant = ear++ % 4;
                lathe(ears, m, new float[][] {
                    {0f, 0f}, {0f, 0.012f}, {0.012f, 0.022f}, {0.05f, 0.026f}, {0.1f, 0.023f}, {0.14f, 0.017f}, {0.165f, 0.009f}, {0.172f, 0f}},
                    10, variant / 4f, (variant + 1) / 4f, 1f / 0.172f);
                // Three husk leaves from the butt up to the tie.
                for (int k = 0; k < 3; k++) {
                    double side = k * 2.1 + i;
                    float sx = 0.02f * (float) Math.cos(side);
                    float sz = 0.02f * (float) Math.sin(side);
                    float[] low = {butt[0] + sx, butt[1] - 0.01f, butt[2] + sz};
                    float[] high = {tie[0] + sx * 0.3f, tie[1] + 0.03f, tie[2] + sz * 0.3f};
                    leaf(husks, low, high, 0.045f, 0.018f, (float) side, k / 3f);
                }
            }
        }
    }

    /** A leaf (two-sided) from low to high, wide at its foot and narrowing, bowed out a little. */
    private static void leaf(Builder b, float[] low, float[] high, float wideLow, float wideHigh, float turn, float uOffset) {
        float[] axis = {high[0] - low[0], high[1] - low[1], high[2] - low[2]};
        float[] side = normalize((float) Math.cos(turn), 0f, (float) Math.sin(turn));
        float[] normal = normalize(side[1] * axis[2] - side[2] * axis[1], side[2] * axis[0] - side[0] * axis[2], side[0] * axis[1] - side[1] * axis[0]);
        int first = b.count();
        int steps = 4;
        for (int i = 0; i <= steps; i++) {
            float t = i / (float) steps;
            float wide = wideLow + (wideHigh - wideLow) * t;
            float bow = 0.025f * (float) Math.sin(Math.PI * t);
            float cx = low[0] + axis[0] * t + normal[0] * bow;
            float cy = low[1] + axis[1] * t + normal[1] * bow;
            float cz = low[2] + axis[2] * t + normal[2] * bow;
            b.vertex(cx - side[0] * wide / 2f, cy - side[1] * wide / 2f, cz - side[2] * wide / 2f, normal[0], normal[1], normal[2], 0f, 1f - t);
            b.vertex(cx + side[0] * wide / 2f, cy + side[1] * wide / 2f, cz + side[2] * wide / 2f, normal[0], normal[1], normal[2], 1f, 1f - t);
        }
        for (int i = 0; i < steps; i++) {
            int a = first + i * 2;
            b.triangle(a, a + 1, a + 2);
            b.triangle(a + 1, a + 3, a + 2);
        }
    }

    private static float[] potFrame() {
        float[] m = translate(POT[0], -0.035f, POT[2]);
        Matrix.rotateM(m, 0, 7f, 1f, 0f, 0.4f);
        return m;
    }

    /** A cord-marked clay pot with a pointed base, set into the coals at the fire's edge. */
    private static void pot(Builder b) {
        lathe(b, potFrame(), new float[][] {
            {0f, 0f}, {0.03f, 0.06f}, {0.08f, 0.11f}, {0.15f, 0.14f}, {0.22f, 0.136f}, {0.28f, 0.116f}, {0.31f, 0.113f},
            {0.34f, 0.126f}, {0.36f, 0.129f}, {0.36f, 0.119f}, {0.33f, 0.111f}, {0.3f, 0.104f}}, 20, 0f, 1f, 1f / 0.42f);
    }

    /** Twined baskets: one of beans by the wall, two under the bed. */
    private static void baskets(Builder b) {
        float[][] where = {{BEANS[0], BEANS[2], 1f}, {-0.52f, BED_Z - 0.05f, 0.8f}, {0.48f, BED_Z + 0.02f, 0.75f}};
        for (float[] at : where) {
            float[] m = translate(at[0], 0f, at[1]);
            Matrix.scaleM(m, 0, at[2], at[2], at[2]);
            lathe(b, m, new float[][] {
                {0f, 0f}, {0f, 0.12f}, {0.02f, 0.135f}, {0.2f, 0.15f}, {0.22f, 0.152f}, {0.22f, 0.143f}, {0.03f, 0.13f}, {0.02f, 0f}},
                20, 0f, 3f, 3f);
        }
    }

    /** Three squash on the floor by the wall, ribbed, each its own colour. */
    private static void squash(Builder b) {
        for (int i = 0; i < SQUASH.length; i++) {
            float[] m = translate(SQUASH[i][0], 0.1f, SQUASH[i][2]);
            Matrix.rotateM(m, 0, i * 47f, 0f, 1f, 0f);
            Matrix.scaleM(m, 0, 0.14f - i * 0.012f, 0.1f - i * 0.008f, 0.14f - i * 0.012f);
            int rings = 9;
            int segments = 20;
            int first = b.count();
            for (int r = 0; r <= rings; r++) {
                double polar = Math.PI * r / rings;
                for (int s = 0; s <= segments; s++) {
                    double around = 2 * Math.PI * s / segments;
                    float rib = 1f + 0.07f * (float) Math.cos(10 * around);
                    float nx = (float) (Math.sin(polar) * Math.cos(around));
                    float ny = (float) Math.cos(polar);
                    float nz = (float) (Math.sin(polar) * Math.sin(around));
                    b.vertex(m, nx * rib, ny, nz * rib, nx, ny, nz, (i + s / (float) segments) / 3f, r / (float) rings);
                }
            }
            for (int r = 0; r < rings; r++) {
                for (int s = 0; s < segments; s++) {
                    int a = first + r * (segments + 1) + s;
                    int c = a + segments + 1;
                    b.triangle(a, c, a + 1);
                    b.triangle(c, c + 1, a + 1);
                }
            }
        }
    }

    /** A bottle gourd hanging by its neck from the corn's pole. */
    private static void gourd(Builder b) {
        float[] m = translate(GOURD[0], CORN_Y - 0.5f, GOURD[2]);
        lathe(b, m, new float[][] {
            {0f, 0f}, {0.02f, 0.06f}, {0.07f, 0.085f}, {0.12f, 0.07f}, {0.16f, 0.036f}, {0.2f, 0.03f}, {0.26f, 0.032f}, {0.29f, 0.02f}, {0.3f, 0f}},
            16, 0f, 1f, 1f / 0.36f);
    }

    /** Quahog and clam shells heaped in the wooden bowl. */
    private static void shells(Builder b) {
        Random random = new Random(13);
        for (int i = 0; i < 9; i++) {
            float angle = random.nextFloat() * 6.28f;
            float reach = 0.06f * (float) Math.sqrt(random.nextFloat());
            float[] m = translate(BOWL[0] + reach * (float) Math.cos(angle), 0.1f + 0.012f * (i % 3), BOWL[2] + reach * (float) Math.sin(angle));
            Matrix.rotateM(m, 0, random.nextFloat() * 360f, 0f, 1f, 0f);
            Matrix.rotateM(m, 0, (random.nextFloat() - 0.5f) * 50f, 1f, 0f, 0f);
            Matrix.scaleM(m, 0, 0.042f, 0.014f, 0.036f);
            int rings = 5;
            int segments = 12;
            int first = b.count();
            for (int r = 0; r <= rings; r++) {
                double polar = Math.PI / 2 * r / rings;
                for (int s = 0; s <= segments; s++) {
                    double around = 2 * Math.PI * s / segments;
                    float nx = (float) (Math.sin(polar) * Math.cos(around));
                    float ny = (float) Math.cos(polar);
                    float nz = (float) (Math.sin(polar) * Math.sin(around));
                    b.vertex(m, nx, ny, nz, nx, ny, nz, s / (float) segments, r / (float) rings);
                }
            }
            for (int r = 0; r < rings; r++) {
                for (int s = 0; s < segments; s++) {
                    int a = first + r * (segments + 1) + s;
                    int c = a + segments + 1;
                    b.triangle(a, c, a + 1);
                    b.triangle(c, c + 1, a + 1);
                }
            }
        }
    }

    /** Bundles of herbs hung to dry by the bed. */
    private static void herbs(Builder b) {
        float[][] where = {{0.66f, 1.46f, -3.2f}, {-0.6f, 1.5f, -3.18f}};
        for (float[] at : where) {
            lathe(b, translate(at[0], at[1], at[2]), new float[][] {
                {0f, 0f}, {0f, 0.07f}, {0.05f, 0.062f}, {0.12f, 0.036f}, {0.18f, 0.016f}, {0.24f, 0.012f}, {0.24f, 0f}}, 12, 0f, 2f, 1f / 0.3f);
            log(b, new float[] {at[0], at[1] + 0.23f, at[2]}, new float[] {at[0], 2.0f, at[2] - 0.08f}, 0.003f, 0f);
        }
    }

    // ---- Mesh building ----

    /** A growing mesh: interleaved position, normal and texture coordinates. */
    static final class Builder {
        private float[] data = new float[8 * 1024];
        private short[] index = new short[3 * 1024];
        private int vertices;
        private int indices;

        int count() {
            return vertices;
        }

        int vertex(float x, float y, float z, float nx, float ny, float nz, float u, float v) {
            if ((vertices + 1) * 8 > data.length) data = Arrays.copyOf(data, data.length * 2);
            int at = vertices * 8;
            data[at] = x;
            data[at + 1] = y;
            data[at + 2] = z;
            data[at + 3] = nx;
            data[at + 4] = ny;
            data[at + 5] = nz;
            data[at + 6] = u;
            data[at + 7] = v;
            return vertices++;
        }

        /** A vertex moved by m (its normal turned with it). */
        int vertex(float[] m, float x, float y, float z, float nx, float ny, float nz, float u, float v) {
            float[] p = transform(m, new float[] {x, y, z});
            float[] n = normalize(m[0] * nx + m[4] * ny + m[8] * nz, m[1] * nx + m[5] * ny + m[9] * nz, m[2] * nx + m[6] * ny + m[10] * nz);
            return vertex(p[0], p[1], p[2], n[0], n[1], n[2], u, v);
        }

        void triangle(int a, int b, int c) {
            if (indices + 3 > index.length) index = Arrays.copyOf(index, index.length * 2);
            index[indices++] = (short) a;
            index[indices++] = (short) b;
            index[indices++] = (short) c;
        }

        ArGl.Mesh build() {
            return new ArGl.Mesh(Arrays.copyOf(data, vertices * 8), Arrays.copyOf(index, indices));
        }
    }

    /** A four-cornered patch a, b, c, d (in order round it) with each corner's texture coordinates. */
    private static void quad(Builder b, float[] a, float[] bb, float[] c, float[] d,
                             float ua, float va, float ub, float vb, float uc, float vc, float ud, float vd) {
        float[] n = normalize((bb[1] - a[1]) * (d[2] - a[2]) - (bb[2] - a[2]) * (d[1] - a[1]),
            (bb[2] - a[2]) * (d[0] - a[0]) - (bb[0] - a[0]) * (d[2] - a[2]),
            (bb[0] - a[0]) * (d[1] - a[1]) - (bb[1] - a[1]) * (d[0] - a[0]));
        int i0 = b.vertex(a[0], a[1], a[2], n[0], n[1], n[2], ua, va);
        int i1 = b.vertex(bb[0], bb[1], bb[2], n[0], n[1], n[2], ub, vb);
        int i2 = b.vertex(c[0], c[1], c[2], n[0], n[1], n[2], uc, vc);
        int i3 = b.vertex(d[0], d[1], d[2], n[0], n[1], n[2], ud, vd);
        b.triangle(i0, i1, i2);
        b.triangle(i0, i2, i3);
    }

    /**
     * A surface of revolution about m's Y through the profile's (y, radius)
     * points, each step its own band so edges stay sharp. u runs round it from
     * u0 to u1 and v along the profile, vPerMetre.
     */
    private static void lathe(Builder b, float[] m, float[][] profile, int segments, float u0, float u1, float vPerMetre) {
        float along = 0f;
        for (int k = 0; k < profile.length - 1; k++) {
            float y0 = profile[k][0];
            float r0 = profile[k][1];
            float y1 = profile[k + 1][0];
            float r1 = profile[k + 1][1];
            float dy = y1 - y0;
            float dr = r1 - r0;
            float length = (float) Math.hypot(dy, dr);
            float out = length < 1e-9f ? 0f : dy / length;
            float up = length < 1e-9f ? 1f : -dr / length;
            int first = b.count();
            for (int i = 0; i <= segments; i++) {
                double angle = 2 * Math.PI * i / segments;
                float cx = (float) Math.cos(angle);
                float cz = (float) Math.sin(angle);
                float u = u0 + (u1 - u0) * i / segments;
                b.vertex(m, cx * r0, y0, cz * r0, cx * out, up, cz * out, u, along * vPerMetre);
                b.vertex(m, cx * r1, y1, cz * r1, cx * out, up, cz * out, u, (along + length) * vPerMetre);
            }
            for (int i = 0; i < segments; i++) {
                int a = first + i * 2;
                b.triangle(a, a + 1, a + 2);
                b.triangle(a + 1, a + 3, a + 2);
            }
            along += length;
        }
    }

    /** A round pole along the path, its rings kept from twisting as it bends. */
    private static void tube(Builder b, List<float[]> path, float radius, int sides, float vPerMetre) {
        float[] side = null;
        float along = 0f;
        int first = b.count();
        for (int i = 0; i < path.size(); i++) {
            float[] p = path.get(i);
            float[] prev = path.get(Math.max(0, i - 1));
            float[] next = path.get(Math.min(path.size() - 1, i + 1));
            float[] tangent = normalize(next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]);
            if (side == null) {
                float[] reference = Math.abs(tangent[1]) < 0.9f ? new float[] {0f, 1f, 0f} : new float[] {1f, 0f, 0f};
                side = normalize(tangent[1] * reference[2] - tangent[2] * reference[1], tangent[2] * reference[0] - tangent[0] * reference[2],
                    tangent[0] * reference[1] - tangent[1] * reference[0]);
            } else {
                float d = side[0] * tangent[0] + side[1] * tangent[1] + side[2] * tangent[2];
                side = normalize(side[0] - tangent[0] * d, side[1] - tangent[1] * d, side[2] - tangent[2] * d);
            }
            float[] other = {tangent[1] * side[2] - tangent[2] * side[1], tangent[2] * side[0] - tangent[0] * side[2], tangent[0] * side[1] - tangent[1] * side[0]};
            if (i > 0) along += distance(p, prev);
            for (int k = 0; k <= sides; k++) {
                double angle = 2 * Math.PI * k / sides;
                float c = (float) Math.cos(angle);
                float s = (float) Math.sin(angle);
                float nx = side[0] * c + other[0] * s;
                float ny = side[1] * c + other[1] * s;
                float nz = side[2] * c + other[2] * s;
                b.vertex(p[0] + nx * radius, p[1] + ny * radius, p[2] + nz * radius, nx, ny, nz, k / (float) sides, along * vPerMetre);
            }
        }
        for (int i = 0; i < path.size() - 1; i++) {
            for (int k = 0; k < sides; k++) {
                int a = first + i * (sides + 1) + k;
                int c = a + sides + 1;
                b.triangle(a, c, a + 1);
                b.triangle(c, c + 1, a + 1);
            }
        }
    }

    /** A flat oval facing up, its texture laid across it (perMetre: repeats a metre; 0: once across). */
    private static void disc(Builder b, float[] m, float rx, float rz, int segments, float perMetre) {
        int centre = b.vertex(m, 0f, 0f, 0f, 0f, 1f, 0f, perMetre > 0 ? 0f : 0.5f, perMetre > 0 ? 0f : 0.5f);
        int first = b.count();
        for (int i = 0; i <= segments; i++) {
            double angle = 2 * Math.PI * i / segments;
            float x = rx * (float) Math.cos(angle);
            float z = rz * (float) Math.sin(angle);
            float u = perMetre > 0 ? x * perMetre : 0.5f + 0.5f * (float) Math.cos(angle);
            float v = perMetre > 0 ? z * perMetre : 0.5f + 0.5f * (float) Math.sin(angle);
            b.vertex(m, x, 0f, z, 0f, 1f, 0f, u, v);
        }
        for (int i = 0; i < segments; i++) b.triangle(centre, first + i + 1, first + i);
    }

    /** An axis-aligned box from (x0, y0, z0) to (x1, y1, z1), its texture perMetre on every face. */
    private static void box(Builder b, float x0, float y0, float z0, float x1, float y1, float z1, float perMetre) {
        float[][][] faces = {
            {{x0, y1, z1}, {x1, y1, z1}, {x1, y1, z0}, {x0, y1, z0}},
            {{x0, y0, z1}, {x1, y0, z1}, {x1, y1, z1}, {x0, y1, z1}},
            {{x1, y0, z0}, {x0, y0, z0}, {x0, y1, z0}, {x1, y1, z0}},
            {{x1, y0, z1}, {x1, y0, z0}, {x1, y1, z0}, {x1, y1, z1}},
            {{x0, y0, z0}, {x0, y0, z1}, {x0, y1, z1}, {x0, y1, z0}},
        };
        for (float[][] f : faces) {
            float w = distance(f[0], f[1]) * perMetre;
            float h = distance(f[1], f[2]) * perMetre;
            quad(b, f[0], f[1], f[2], f[3], 0f, 0f, w, 0f, w, h, 0f, h);
        }
    }

    private static float[] translate(float x, float y, float z) {
        float[] m = new float[16];
        Matrix.setIdentityM(m, 0);
        Matrix.translateM(m, 0, x, y, z);
        return m;
    }

    /** A frame at start whose Y runs along axis. */
    private static float[] alongY(float[] start, float[] axis) {
        float[] y = normalize(axis[0], axis[1], axis[2]);
        float[] reference = Math.abs(y[1]) < 0.9f ? new float[] {0f, 1f, 0f} : new float[] {1f, 0f, 0f};
        float[] x = normalize(y[1] * reference[2] - y[2] * reference[1], y[2] * reference[0] - y[0] * reference[2], y[0] * reference[1] - y[1] * reference[0]);
        float[] z = {x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]};
        return new float[] {x[0], x[1], x[2], 0f, y[0], y[1], y[2], 0f, z[0], z[1], z[2], 0f, start[0], start[1], start[2], 1f};
    }

    private static float[] transform(float[] m, float[] p) {
        return new float[] {
            m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
            m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
            m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]};
    }

    private static float distance(float[] a, float[] b) {
        float dx = a[0] - b[0];
        float dy = a[1] - b[1];
        float dz = a[2] - b[2];
        return (float) Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    private static float[] normalize(float x, float y, float z) {
        float length = (float) Math.sqrt(x * x + y * y + z * z);
        return length < 1e-9f ? new float[] {0f, 1f, 0f} : new float[] {x / length, y / length, z / length};
    }

    // ---- Textures ----

    /** One of the wigwam's textures (textures()), drawn. */
    static Bitmap texture(String key) {
        if (key.startsWith("wig:label:")) {
            String name = key.substring("wig:label:".length());
            for (Label label : LABELS) if (label.key.equals(name)) return label(label);
        }
        if (key.startsWith("wig:flame")) return flame(key.charAt(key.length() - 1) - '0');
        switch (key) {
            case "wig:bark":
                return bark();
            case "wig:pole":
                return poleBark();
            case "wig:inner":
                return inner();
            case "wig:floor":
                return floor();
            case "wig:stone":
                return stone();
            case "wig:char":
                return charred();
            case "wig:wood":
                return wood();
            case "wig:endgrain":
                return endGrain();
            case "wig:mat":
                return mat();
            case "wig:hide":
                return hideTexture();
            case "wig:corn":
                return cornTexture();
            case "wig:husk":
                return husk();
            case "wig:clay":
                return clay();
            case "wig:mush":
                return mush();
            case "wig:basket":
                return basket();
            case "wig:beans":
                return beans();
            case "wig:squash":
                return squashTexture();
            case "wig:gourd":
                return gourdTexture();
            case "wig:shell":
                return shell();
            case "wig:herb":
                return herb();
            case "wig:ember":
                return ember();
            case "wig:ash":
                return ash();
            default:
                return smoke();
        }
    }

    private static Paint paint() {
        return new Paint(Paint.ANTI_ALIAS_FLAG);
    }

    private static int vary(Random random, int color, int amount) {
        int d = random.nextInt(amount * 2 + 1) - amount;
        return Color.rgb(clamp(Color.red(color) + d), clamp(Color.green(color) + d), clamp(Color.blue(color) + d));
    }

    private static int clamp(int value) {
        return Math.max(0, Math.min(255, value));
    }

    /** Speckle: small dots of light and dark over the whole picture. */
    private static void speckle(Canvas canvas, Random random, int width, int height, int count, int alpha, float size) {
        Paint p = paint();
        for (int i = 0; i < count; i++) {
            p.setColor(random.nextBoolean() ? Color.argb(alpha, 255, 255, 255) : Color.argb(alpha, 0, 0, 0));
            canvas.drawCircle(random.nextFloat() * width, random.nextFloat() * height, size * (0.4f + random.nextFloat()), p);
        }
    }

    /** Soft blotches of lighter and darker over the picture. */
    private static void mottle(Canvas canvas, Random random, int width, int height, int count, int alpha, float size) {
        Paint p = paint();
        for (int i = 0; i < count; i++) {
            float x = random.nextFloat() * width;
            float y = random.nextFloat() * height;
            float r = size * (0.5f + random.nextFloat());
            int tint = random.nextBoolean() ? Color.argb(alpha, 255, 250, 240) : Color.argb(alpha, 0, 0, 0);
            p.setShader(new RadialGradient(x, y, r, tint, tint & 0x00FFFFFF, Shader.TileMode.CLAMP));
            canvas.drawCircle(x, y, r, p);
        }
    }

    /**
     * Elm bark slabs (1024 by 256, a band about 1.8 m long; repeating across):
     * grey-brown, stringy with ridges running down, darker in the shadow of the
     * band above, cracked at the slabs' edges, with pale lichen.
     */
    private static Bitmap bark() {
        int width = 1024;
        int height = 256;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(1);
        canvas.drawColor(Color.rgb(104, 96, 86));
        Paint p = paint();
        int x = 0;
        while (x < width) {
            int slab = Math.min(width - x, 230 + random.nextInt(190));
            if (width - x - slab < 150) slab = width - x;
            int tone = vary(random, Color.rgb(112, 102, 90), 14);
            p.setColor(tone);
            canvas.drawRect(x, 0, x + slab, height, p);
            // Stringy ridges.
            p.setStyle(Paint.Style.STROKE);
            for (int i = 0; i < slab / 2; i++) {
                float lx = x + random.nextFloat() * slab;
                p.setStrokeWidth(1f + random.nextFloat() * 3.2f);
                p.setColor(random.nextFloat() < 0.6f ? Color.argb(40 + random.nextInt(60), 40, 34, 28) : Color.argb(25 + random.nextInt(40), 200, 192, 176));
                Path ridge = new Path();
                float top = random.nextFloat() * height * 0.3f;
                ridge.moveTo(lx, top);
                float y = top;
                while (y < height) {
                    y += 16 + random.nextFloat() * 26;
                    lx += (random.nextFloat() - 0.5f) * 4f;
                    ridge.lineTo(lx, y);
                }
                canvas.drawPath(ridge, p);
            }
            // A few cracks across.
            for (int i = 0; i < 4; i++) {
                float cy = random.nextFloat() * height;
                float cx = x + random.nextFloat() * slab;
                p.setStrokeWidth(1.5f);
                p.setColor(Color.argb(90, 30, 24, 20));
                canvas.drawLine(cx, cy, cx + 14 + random.nextFloat() * 36, cy + (random.nextFloat() - 0.5f) * 4f, p);
            }
            p.setStyle(Paint.Style.FILL);
            // The slab's edge: a dark gap and a curled, paler lip.
            Path edge = new Path();
            edge.moveTo(x + slab, 0);
            for (int y = 0; y <= height; y += 16) edge.lineTo(x + slab + (random.nextFloat() - 0.5f) * 6f, y);
            Paint gap = paint();
            gap.setStyle(Paint.Style.STROKE);
            gap.setStrokeWidth(5f);
            gap.setColor(Color.argb(200, 28, 24, 20));
            canvas.drawPath(edge, gap);
            gap.setStrokeWidth(2f);
            gap.setColor(Color.argb(110, 210, 200, 184));
            edge.offset(-4f, 0f);
            canvas.drawPath(edge, gap);
            x += slab;
        }
        // Lichen.
        for (int i = 0; i < 26; i++) {
            float lx = random.nextFloat() * width;
            float ly = height * 0.3f + random.nextFloat() * height * 0.7f;
            p.setColor(Color.argb(30 + random.nextInt(40), 160, 170, 140));
            for (int k = 0; k < 7; k++) canvas.drawCircle(lx + (random.nextFloat() - 0.5f) * 22f, ly + (random.nextFloat() - 0.5f) * 10f, 2f + random.nextFloat() * 5f, p);
        }
        mottle(canvas, random, width, height, 30, 22, 50f);
        // In the shadow of the band above, and the lower edge catching the light.
        p.setShader(new LinearGradient(0, 0, 0, height * 0.35f, Color.argb(150, 20, 16, 12), Color.argb(0, 20, 16, 12), Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, width, height * 0.35f, p);
        p.setShader(new LinearGradient(0, height - 8, 0, height, Color.argb(0, 220, 210, 190), Color.argb(80, 220, 210, 190), Shader.TileMode.CLAMP));
        canvas.drawRect(0, height - 8, width, height, p);
        p.setShader(null);
        return bitmap;
    }

    /** Sapling bark for poles (128 round by 512 along a metre): grey-brown, with pale lenticels across. */
    private static Bitmap poleBark() {
        int width = 128;
        int height = 512;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(2);
        canvas.drawColor(Color.rgb(98, 84, 70));
        mottle(canvas, random, width, height, 30, 30, 30f);
        Paint p = paint();
        p.setStyle(Paint.Style.STROKE);
        for (int i = 0; i < 26; i++) {
            float x = random.nextFloat() * width;
            p.setStrokeWidth(1f + random.nextFloat() * 1.5f);
            p.setColor(Color.argb(40 + random.nextInt(50), 44, 36, 28));
            canvas.drawLine(x, 0, x + (random.nextFloat() - 0.5f) * 6f, height, p);
        }
        p.setStrokeWidth(2f);
        for (int i = 0; i < 120; i++) {
            float x = random.nextFloat() * width;
            float y = random.nextFloat() * height;
            p.setColor(Color.argb(90, 196, 184, 160));
            canvas.drawLine(x, y, x + 4f + random.nextFloat() * 6f, y, p);
        }
        return bitmap;
    }

    /**
     * The inside of the walls (512 round by 1024 from the hole down to the
     * floor): the bark's reddish inner side above, black with soot near the
     * hole, then mats of cattail leaves sewn in rows hung round the walls.
     */
    private static Bitmap inner() {
        int width = 512;
        int height = 1024;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(3);
        float matTop = height * 0.42f;
        canvas.drawColor(Color.rgb(118, 80, 54));
        Paint p = paint();
        p.setStyle(Paint.Style.STROKE);
        for (int i = 0; i < 160; i++) {
            float x = random.nextFloat() * width;
            p.setStrokeWidth(1f + random.nextFloat() * 2.4f);
            p.setColor(random.nextBoolean() ? Color.argb(60, 60, 36, 22) : Color.argb(40, 196, 146, 104));
            canvas.drawLine(x, 0, x + (random.nextFloat() - 0.5f) * 8f, matTop, p);
        }
        // The slabs' edges seen from inside, and the bands overlapping.
        for (int x = 0; x < width; x += 90 + random.nextInt(70)) {
            p.setStrokeWidth(4f);
            p.setColor(Color.argb(150, 30, 18, 10));
            canvas.drawLine(x, 0, x + (random.nextFloat() - 0.5f) * 10f, matTop, p);
        }
        for (float y = 60; y < matTop; y += 70 + random.nextInt(30)) {
            p.setStrokeWidth(5f);
            p.setColor(Color.argb(140, 30, 18, 10));
            canvas.drawLine(0, y, width, y + (random.nextFloat() - 0.5f) * 6f, p);
        }
        p.setStyle(Paint.Style.FILL);
        // Soot from the fire, darkest round the hole, patchy.
        p.setShader(new LinearGradient(0, 0, 0, matTop, Color.argb(225, 14, 10, 8), Color.argb(30, 14, 10, 8), Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, width, matTop, p);
        p.setShader(null);
        for (int i = 0; i < 30; i++) {
            float x = random.nextFloat() * width;
            float y = random.nextFloat() * matTop;
            float r = 20f + random.nextFloat() * 50f;
            p.setShader(new RadialGradient(x, y, r, Color.argb(90, 10, 8, 6), Color.argb(0, 10, 8, 6), Shader.TileMode.CLAMP));
            canvas.drawCircle(x, y, r, p);
        }
        p.setShader(null);
        // The mats: leaves running down, sewn across in rows, a panel's edge now and then.
        int leaf = 9;
        for (int x = 0; x < width; x += leaf) {
            p.setColor(vary(random, Color.rgb(168, 140, 92), 14));
            canvas.drawRect(x, matTop, x + leaf, height, p);
            p.setColor(Color.argb(60, 60, 44, 24));
            canvas.drawRect(x + leaf - 1.5f, matTop, x + leaf, height, p);
            p.setColor(Color.argb(40, 255, 240, 200));
            canvas.drawRect(x + 1, matTop, x + 3, height, p);
        }
        Paint thread = paint();
        thread.setStrokeWidth(3f);
        for (float y = matTop + 30; y < height; y += 64) {
            thread.setColor(Color.argb(170, 82, 62, 36));
            for (int x = 0; x < width; x += 9) canvas.drawLine(x, y + (x / 9 % 2) * 2.5f, x + 9, y + ((x / 9 + 1) % 2) * 2.5f, thread);
        }
        for (int x = 0; x < width; x += 256) {
            p.setColor(Color.argb(120, 50, 36, 20));
            canvas.drawRect(x, matTop, x + 4, height, p);
        }
        // The mats' top edge, tied to a pole, and grubby towards the floor.
        p.setShader(new LinearGradient(0, matTop - 6, 0, matTop + 20, Color.argb(160, 30, 20, 12), Color.argb(0, 30, 20, 12), Shader.TileMode.CLAMP));
        canvas.drawRect(0, matTop - 6, width, matTop + 20, p);
        p.setShader(new LinearGradient(0, height * 0.85f, 0, height, Color.argb(0, 60, 44, 30), Color.argb(120, 60, 44, 30), Shader.TileMode.CLAMP));
        canvas.drawRect(0, height * 0.85f, width, height, p);
        p.setShader(null);
        mottle(canvas, random, width, height, 26, 18, 50f);
        return bitmap;
    }

    /** Packed earth (512, a little under two metres a side): brown, with grit, small stones and bits of plant. */
    private static Bitmap floor() {
        int size = 512;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(4);
        canvas.drawColor(Color.rgb(92, 74, 56));
        mottle(canvas, random, size, size, 60, 34, 50f);
        speckle(canvas, random, size, size, 1600, 40, 1f);
        Paint p = paint();
        for (int i = 0; i < 60; i++) {
            p.setColor(vary(random, Color.rgb(104, 96, 86), 18));
            float x = random.nextFloat() * size;
            float y = random.nextFloat() * size;
            float r = 1.5f + random.nextFloat() * 3.5f;
            canvas.drawOval(new RectF(x - r, y - r * 0.7f, x + r, y + r * 0.7f), p);
        }
        p.setStrokeWidth(1.4f);
        for (int i = 0; i < 120; i++) {
            p.setColor(Color.argb(80, 150, 126, 80));
            float x = random.nextFloat() * size;
            float y = random.nextFloat() * size;
            double a = random.nextFloat() * Math.PI;
            float l = 6f + random.nextFloat() * 14f;
            canvas.drawLine(x, y, x + l * (float) Math.cos(a), y + l * (float) Math.sin(a), p);
        }
        return bitmap;
    }

    /** Field stone (256): grey granite, speckled, softly mottled. */
    private static Bitmap stone() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(5);
        canvas.drawColor(Color.rgb(92, 88, 84));
        mottle(canvas, random, size, size, 40, 50, 36f);
        speckle(canvas, random, size, size, 1800, 70, 1.1f);
        Paint p = paint();
        for (int i = 0; i < 160; i++) {
            p.setColor(Color.argb(110, 190, 150, 130));
            canvas.drawCircle(random.nextFloat() * size, random.nextFloat() * size, 1f + random.nextFloat() * 1.5f, p);
        }
        // Soot from the fire.
        p.setShader(new LinearGradient(0, 0, 0, size, Color.argb(30, 20, 16, 14), Color.argb(150, 20, 16, 14), Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, size, size, p);
        return bitmap;
    }

    /** Charred wood (256): black, cracked into blocks, with ash at the cracks and a few glowing seams. */
    private static Bitmap charred() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(6);
        canvas.drawColor(Color.rgb(30, 26, 24));
        mottle(canvas, random, size, size, 30, 40, 30f);
        Paint p = paint();
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(1.6f);
        for (int i = 0; i < 260; i++) {
            float x = random.nextFloat() * size;
            float y = random.nextFloat() * size;
            p.setColor(Color.argb(90 + random.nextInt(60), 110, 104, 98));
            boolean across = random.nextBoolean();
            float l = 6f + random.nextFloat() * 14f;
            canvas.drawLine(x, y, across ? x + l : x + (random.nextFloat() - 0.5f) * 3f, across ? y + (random.nextFloat() - 0.5f) * 3f : y + l, p);
        }
        p.setStyle(Paint.Style.FILL);
        for (int i = 0; i < 14; i++) {
            float x = random.nextFloat() * size;
            float y = random.nextFloat() * size;
            p.setShader(new RadialGradient(x, y, 6f, Color.argb(220, 255, 130, 40), Color.argb(0, 255, 90, 20), Shader.TileMode.CLAMP));
            canvas.drawCircle(x, y, 6f, p);
        }
        p.setShader(null);
        return bitmap;
    }

    /** Old, peeled wood (256 by 512): grey-brown with its grain running along. */
    private static Bitmap wood() {
        int width = 256;
        int height = 512;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(7);
        canvas.drawColor(Color.rgb(132, 108, 82));
        Paint p = paint();
        p.setStyle(Paint.Style.STROKE);
        for (int i = 0; i < 80; i++) {
            float x = random.nextFloat() * width;
            p.setStrokeWidth(0.8f + random.nextFloat() * 2.4f);
            p.setColor(random.nextFloat() < 0.6f ? Color.argb(30 + random.nextInt(50), 60, 42, 26) : Color.argb(20 + random.nextInt(30), 220, 200, 170));
            Path grain = new Path();
            grain.moveTo(x, 0);
            for (int y = 32; y <= height; y += 32) grain.lineTo(x + (float) Math.sin(y * 0.02 + i) * 3f, y);
            canvas.drawPath(grain, p);
        }
        mottle(canvas, new Random(8), width, height, 20, 22, 50f);
        return bitmap;
    }

    /** A cut log's end (256): rings, cracks out from the middle, and the bark round its edge. */
    private static Bitmap endGrain() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(9);
        float c = size / 2f;
        Paint p = paint();
        p.setColor(Color.rgb(84, 70, 58));
        canvas.drawCircle(c, c, c, p);
        p.setColor(Color.rgb(176, 146, 104));
        canvas.drawCircle(c, c, c - 9, p);
        p.setStyle(Paint.Style.STROKE);
        for (float r = 4; r < c - 10; r += 3 + random.nextFloat() * 4) {
            p.setStrokeWidth(1f + random.nextFloat());
            p.setColor(Color.argb(70 + random.nextInt(60), 110, 80, 50));
            canvas.drawOval(new RectF(c - r + 1, c - r, c + r, c + r - 1), p);
        }
        p.setStrokeWidth(1.2f);
        p.setColor(Color.argb(110, 60, 42, 28));
        for (int i = 0; i < 4; i++) {
            double a = random.nextFloat() * Math.PI * 2;
            float l = 30 + random.nextFloat() * 70;
            canvas.drawLine(c, c, c + l * (float) Math.cos(a), c + l * (float) Math.sin(a), p);
        }
        return bitmap;
    }

    /** A plaited mat (512, about 80 cm a side): strips over and under. */
    private static Bitmap mat() {
        int size = 512;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(10);
        int strip = 16;
        Paint p = paint();
        for (int y = 0; y < size; y += strip) {
            for (int x = 0; x < size; x += strip) {
                boolean across = ((x + y) / strip) % 2 == 0;
                int tone = vary(random, across ? Color.rgb(178, 152, 102) : Color.rgb(166, 140, 92), 14);
                p.setShader(across
                    ? new LinearGradient(0, y, 0, y + strip, tone, shade(tone, 0.88f), Shader.TileMode.CLAMP)
                    : new LinearGradient(x, 0, x + strip, 0, tone, shade(tone, 0.88f), Shader.TileMode.CLAMP));
                canvas.drawRect(x, y, x + strip, y + strip, p);
            }
        }
        p.setShader(null);
        mottle(canvas, random, size, size, 40, 26, 50f);
        // Worn darker in places, and a few frayed strips.
        Paint fray = paint();
        fray.setStrokeWidth(1.5f);
        for (int i = 0; i < 80; i++) {
            fray.setColor(Color.argb(90, 110, 90, 56));
            float x = random.nextFloat() * size;
            float y = random.nextFloat() * size;
            canvas.drawLine(x, y, x + (random.nextFloat() - 0.5f) * 14f, y + (random.nextFloat() - 0.5f) * 14f, fray);
        }
        return bitmap;
    }

    private static int shade(int color, float factor) {
        return Color.rgb(Math.round(Color.red(color) * factor), Math.round(Color.green(color) * factor), Math.round(Color.blue(color) * factor));
    }

    /** A deer hide (512), its outline cut out: brown hair lying back from the neck, paler at the belly's edges, a darker line down the back. */
    private static Bitmap hideTexture() {
        int size = 512;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(12);
        Path outline = new Path();
        float[][] points = {{60, 200}, {20, 150}, {40, 120}, {110, 150}, {180, 90}, {250, 70}, {330, 90}, {400, 150}, {470, 120}, {495, 150},
            {460, 210}, {470, 300}, {495, 360}, {470, 390}, {400, 360}, {330, 430}, {256, 445}, {180, 430}, {110, 360}, {40, 390}, {18, 360}, {50, 300}};
        outline.moveTo(points[0][0], points[0][1]);
        for (int i = 1; i < points.length; i++) {
            float[] a = points[i - 1];
            float[] b = points[i];
            outline.quadTo(a[0] + (random.nextFloat() - 0.5f) * 20, a[1] + (random.nextFloat() - 0.5f) * 20, (a[0] + b[0]) / 2f, (a[1] + b[1]) / 2f);
        }
        outline.close();
        canvas.save();
        canvas.clipPath(outline);
        canvas.drawColor(Color.rgb(146, 102, 66));
        Paint p = paint();
        p.setShader(new RadialGradient(size / 2f, size / 2f, size * 0.45f, Color.argb(0, 230, 200, 160), Color.argb(150, 220, 190, 150), Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, size, size, p);
        p.setShader(new LinearGradient(0, size / 2f - 40, 0, size / 2f + 40,
            new int[] {Color.argb(0, 60, 36, 20), Color.argb(130, 60, 36, 20), Color.argb(0, 60, 36, 20)}, null, Shader.TileMode.CLAMP));
        canvas.drawRect(0, size / 2f - 40, size, size / 2f + 40, p);
        p.setShader(null);
        p.setStrokeWidth(1.6f);
        for (int i = 0; i < 2600; i++) {
            float x = random.nextFloat() * size;
            float y = random.nextFloat() * size;
            p.setColor(random.nextBoolean() ? Color.argb(70, 90, 60, 36) : Color.argb(60, 210, 170, 120));
            float tilt = (y - size / 2f) / size;
            canvas.drawLine(x, y, x + 7f, y + 7f * tilt, p);
        }
        canvas.restore();
        Paint edge = paint();
        edge.setStyle(Paint.Style.STROKE);
        edge.setStrokeWidth(6f);
        edge.setColor(Color.argb(160, 200, 170, 130));
        canvas.drawPath(outline, edge);
        return bitmap;
    }

    /**
     * Four ears' kernels side by side (512 by 256; each a quarter across, round
     * one ear, butt at the top): flint corn's reds, yellows, whites and blues.
     */
    private static Bitmap cornTexture() {
        int width = 512;
        int height = 256;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(14);
        int[][] palettes = {
            {Color.rgb(156, 30, 30), Color.rgb(232, 163, 58), Color.rgb(46, 42, 74), Color.rgb(240, 214, 140)},
            {Color.rgb(150, 24, 26), Color.rgb(170, 40, 36), Color.rgb(120, 20, 24), Color.rgb(196, 70, 50)},
            {Color.rgb(236, 178, 62), Color.rgb(242, 206, 110), Color.rgb(226, 150, 50), Color.rgb(160, 34, 30)},
            {Color.rgb(46, 40, 76), Color.rgb(90, 36, 70), Color.rgb(236, 230, 210), Color.rgb(60, 50, 90)},
        };
        canvas.drawColor(Color.rgb(210, 190, 150));
        Paint p = paint();
        int columns = 12;
        int rows = 30;
        for (int e = 0; e < 4; e++) {
            float cw = 128f / columns;
            for (int r = 0; r < rows; r++) {
                float y0 = 6 + r * (height - 12f) / rows;
                float rh = (height - 12f) / rows;
                for (int c = 0; c < columns; c++) {
                    float x0 = e * 128 + c * cw;
                    int[] palette = palettes[e];
                    int color = vary(random, palette[random.nextInt(palette.length)], 12);
                    p.setShader(new RadialGradient(x0 + cw * 0.4f, y0 + rh * 0.35f, cw * 0.8f, shade(color, 1.25f), color, Shader.TileMode.CLAMP));
                    canvas.drawRoundRect(new RectF(x0 + 0.8f, y0 + 0.6f, x0 + cw - 0.8f, y0 + rh - 0.6f), 3f, 3f, p);
                }
            }
        }
        p.setShader(null);
        return bitmap;
    }

    /** A dry husk leaf (256): pale straw with fine veins, ragged at its edges. */
    private static Bitmap husk() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(15);
        Path shape = new Path();
        shape.moveTo(10, size);
        for (int y = size; y >= 0; y -= 16) shape.lineTo(10 + (random.nextFloat() - 0.5f) * 8f + (size - y) * 0.12f, y);
        for (int y = 0; y <= size; y += 16) shape.lineTo(size - 10 + (random.nextFloat() - 0.5f) * 8f - (size - y) * 0.12f, y);
        shape.close();
        canvas.clipPath(shape);
        canvas.drawColor(Color.rgb(222, 202, 152));
        Paint p = paint();
        p.setStrokeWidth(1.4f);
        for (int x = 4; x < size; x += 6) {
            p.setColor(Color.argb(60 + random.nextInt(40), 150, 126, 80));
            canvas.drawLine(x, 0, x + (random.nextFloat() - 0.5f) * 4f, size, p);
        }
        mottle(canvas, random, size, size, 10, 24, 40f);
        return bitmap;
    }

    /**
     * The pot's clay (512 round by 256 from its point up to the rim): grey-brown,
     * covered in cord marks, with lines incised round the collar, and black with
     * soot where it sits in the fire.
     */
    private static Bitmap clay() {
        int width = 512;
        int height = 256;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(16);
        canvas.drawColor(Color.rgb(118, 98, 78));
        mottle(canvas, random, width, height, 30, 30, 40f);
        Paint p = paint();
        p.setStrokeWidth(1.6f);
        for (int x = -height; x < width; x += 4) {
            p.setColor(Color.argb(50 + random.nextInt(30), 50, 40, 30));
            canvas.drawLine(x, 0, x + height * 0.6f, height * 0.8f, p);
        }
        p.setStrokeWidth(2.2f);
        p.setColor(Color.argb(150, 44, 34, 26));
        for (float y : new float[] {height * 0.84f, height * 0.88f, height * 0.97f}) canvas.drawLine(0, y, width, y, p);
        Path zig = new Path();
        zig.moveTo(0, height * 0.94f);
        for (int x = 0; x <= width; x += 16) zig.lineTo(x, (x / 16) % 2 == 0 ? height * 0.89f : height * 0.94f);
        p.setStyle(Paint.Style.STROKE);
        canvas.drawPath(zig, p);
        p.setStyle(Paint.Style.FILL);
        p.setShader(new LinearGradient(0, 0, 0, height * 0.55f, Color.argb(235, 16, 12, 10), Color.argb(0, 16, 12, 10), Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, width, height * 0.55f, p);
        p.setShader(null);
        return bitmap;
    }

    /** Corn mush in the pot (128): pale yellow, flecked, a few bubbles. */
    private static Bitmap mush() {
        int size = 128;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(17);
        canvas.drawColor(Color.rgb(222, 196, 120));
        mottle(canvas, random, size, size, 14, 30, 20f);
        speckle(canvas, random, size, size, 260, 50, 0.9f);
        Paint p = paint();
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(1.4f);
        for (int i = 0; i < 9; i++) {
            p.setColor(Color.argb(120, 160, 130, 70));
            canvas.drawCircle(random.nextFloat() * size, random.nextFloat() * size, 2f + random.nextFloat() * 4f, p);
        }
        return bitmap;
    }

    /** Twined basketry (256): upright stakes with pairs of strands twisted round them in rows. */
    private static Bitmap basket() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(18);
        canvas.drawColor(Color.rgb(120, 92, 58));
        Paint p = paint();
        int row = 10;
        int stake = 16;
        for (int y = 0; y < size; y += row) {
            for (int x = 0; x < size; x += stake) {
                int tone = vary(random, (y / row) % 7 == 3 ? Color.rgb(96, 64, 40) : Color.rgb(190, 156, 104), 12);
                p.setShader(new LinearGradient(x, y, x + stake, y + row, shade(tone, 1.1f), shade(tone, 0.75f), Shader.TileMode.CLAMP));
                Path stitch = new Path();
                float lean = (y / row) % 2 == 0 ? 4f : -4f;
                stitch.moveTo(x + 1, y + row);
                stitch.lineTo(x + 1 + lean, y + 1);
                stitch.lineTo(x + stake - 1 + lean, y + 1);
                stitch.lineTo(x + stake - 1, y + row);
                stitch.close();
                canvas.drawPath(stitch, p);
            }
        }
        p.setShader(null);
        return bitmap;
    }

    /** Dried beans (256): small ovals, speckled, mottled, red, black and white. */
    private static Bitmap beans() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(19);
        canvas.drawColor(Color.rgb(70, 50, 34));
        int[] kinds = {Color.rgb(150, 50, 40), Color.rgb(36, 30, 30), Color.rgb(230, 222, 200), Color.rgb(196, 160, 110), Color.rgb(120, 80, 110)};
        Paint p = paint();
        for (int i = 0; i < 520; i++) {
            float x = random.nextFloat() * size;
            float y = random.nextFloat() * size;
            int color = kinds[random.nextInt(kinds.length)];
            canvas.save();
            canvas.rotate(random.nextFloat() * 180f, x, y);
            p.setShader(new RadialGradient(x - 2, y - 2, 9, shade(color, 1.3f), color, Shader.TileMode.CLAMP));
            canvas.drawOval(new RectF(x - 7, y - 4.5f, x + 7, y + 4.5f), p);
            p.setShader(null);
            if (random.nextBoolean()) {
                p.setColor(Color.argb(140, 60, 30, 30));
                for (int k = 0; k < 3; k++) canvas.drawCircle(x + (random.nextFloat() - 0.5f) * 10f, y + (random.nextFloat() - 0.5f) * 5f, 1.2f, p);
            }
            canvas.restore();
        }
        return bitmap;
    }

    /** Three squash's skins side by side (512 by 256): green with orange, orange with green, cream with green. */
    private static Bitmap squashTexture() {
        int width = 512;
        int height = 256;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(20);
        int[][] skins = {{Color.rgb(60, 90, 46), Color.rgb(220, 140, 50)}, {Color.rgb(222, 120, 36), Color.rgb(80, 110, 50)}, {Color.rgb(236, 220, 160), Color.rgb(90, 120, 60)}};
        Paint p = paint();
        for (int s = 0; s < 3; s++) {
            float x0 = s * width / 3f;
            float x1 = (s + 1) * width / 3f;
            p.setColor(skins[s][0]);
            canvas.drawRect(x0, 0, x1, height, p);
            float step = (x1 - x0) / 10f;
            for (int i = 0; i < 10; i++) {
                p.setColor(Color.argb(120, Color.red(skins[s][1]), Color.green(skins[s][1]), Color.blue(skins[s][1])));
                canvas.drawRect(x0 + i * step + step * 0.35f, 0, x0 + i * step + step * 0.65f, height, p);
                p.setColor(Color.argb(70, 0, 0, 0));
                canvas.drawRect(x0 + i * step, 0, x0 + i * step + 2, height, p);
            }
            canvas.save();
            canvas.clipRect(x0, 0, x1, height);
            mottle(canvas, random, width, height, 40, 30, 20f);
            canvas.restore();
        }
        return bitmap;
    }

    /** A dried gourd's shell (256): tan, mottled darker, faintly scratched. */
    private static Bitmap gourdTexture() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(21);
        canvas.drawColor(Color.rgb(192, 154, 100));
        mottle(canvas, random, size, size, 40, 50, 24f);
        Paint p = paint();
        p.setStrokeWidth(1f);
        for (int i = 0; i < 40; i++) {
            p.setColor(Color.argb(60, 90, 60, 30));
            float x = random.nextFloat() * size;
            float y = random.nextFloat() * size;
            canvas.drawLine(x, y, x + 10 + random.nextFloat() * 20, y + (random.nextFloat() - 0.5f) * 6f, p);
        }
        return bitmap;
    }

    /** A quahog's shell (128): off-white with growth rings, purple towards its edge. */
    private static Bitmap shell() {
        int width = 128;
        int height = 128;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.rgb(226, 220, 206));
        Paint p = paint();
        for (int y = 0; y < height; y += 5) {
            p.setColor(Color.argb(70, 120, 110, 96));
            canvas.drawRect(0, y, width, y + 1.5f, p);
        }
        p.setShader(new LinearGradient(0, height * 0.7f, 0, height, Color.argb(0, 96, 52, 110), Color.argb(220, 96, 52, 110), Shader.TileMode.CLAMP));
        canvas.drawRect(0, height * 0.7f, width, height, p);
        return bitmap;
    }

    /** Dried herbs (128 by 256): dark stems and grey-green leaves. */
    private static Bitmap herb() {
        int width = 128;
        int height = 256;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(22);
        canvas.drawColor(Color.rgb(58, 62, 40));
        Paint p = paint();
        p.setStrokeWidth(1.5f);
        for (int i = 0; i < 90; i++) {
            p.setColor(vary(random, Color.rgb(96, 78, 50), 16));
            float x = random.nextFloat() * width;
            canvas.drawLine(x, 0, x + (random.nextFloat() - 0.5f) * 20f, height, p);
        }
        for (int i = 0; i < 420; i++) {
            p.setColor(vary(random, random.nextBoolean() ? Color.rgb(112, 122, 84) : Color.rgb(132, 120, 76), 20));
            float x = random.nextFloat() * width;
            float y = random.nextFloat() * height;
            canvas.save();
            canvas.rotate((random.nextFloat() - 0.5f) * 60f, x, y);
            canvas.drawOval(new RectF(x - 2.5f, y - 7, x + 2.5f, y + 7), p);
            canvas.restore();
        }
        return bitmap;
    }

    /** A flame (128 by 256), one of four shapes: tongues of fire, white-yellow at the root, orange, then red, fading out. */
    private static Bitmap flame(int variant) {
        int width = 128;
        int height = 256;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(100 + variant);
        Paint p = paint();
        int tongues = 3 + random.nextInt(2);
        for (int layer = 0; layer < 3; layer++) {
            float shrink = 1f - layer * 0.28f;
            int color = layer == 0 ? Color.argb(150, 230, 70, 20) : layer == 1 ? Color.argb(220, 255, 150, 40) : Color.argb(255, 255, 236, 170);
            p.setColor(color);
            p.setMaskFilter(new BlurMaskFilter(layer == 0 ? 10f : 6f, BlurMaskFilter.Blur.NORMAL));
            Random shape = new Random(200 + variant);
            for (int t = 0; t < tongues; t++) {
                float cx = width * (0.3f + 0.4f * shape.nextFloat());
                float top = height * (0.08f + 0.35f * shape.nextFloat());
                float wide = width * (0.22f + 0.12f * shape.nextFloat()) * shrink;
                float base = height - 12;
                top = base - (base - top) * shrink;
                Path tongue = new Path();
                tongue.moveTo(cx - wide, base);
                tongue.cubicTo(cx - wide * 1.1f, base - (base - top) * 0.45f, cx - wide * 0.1f + (shape.nextFloat() - 0.5f) * 20f, top + (base - top) * 0.3f, cx, top);
                tongue.cubicTo(cx + wide * 0.1f, top + (base - top) * 0.3f, cx + wide * 1.1f, base - (base - top) * 0.45f, cx + wide, base);
                tongue.close();
                canvas.drawPath(tongue, p);
            }
        }
        return bitmap;
    }

    /** The embers' glow (256): orange light fading out from the middle, with bright coals. */
    private static Bitmap ember() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(23);
        Paint p = paint();
        p.setShader(new RadialGradient(size / 2f, size / 2f, size / 2f,
            new int[] {Color.argb(230, 255, 150, 50), Color.argb(130, 230, 70, 20), Color.argb(0, 160, 30, 10)}, new float[] {0f, 0.45f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, p);
        p.setShader(null);
        for (int i = 0; i < 70; i++) {
            float r = (float) Math.sqrt(random.nextFloat()) * size * 0.3f;
            double a = random.nextFloat() * Math.PI * 2;
            p.setColor(Color.argb(200, 255, 200 + random.nextInt(55), 90));
            canvas.drawCircle(size / 2f + r * (float) Math.cos(a), size / 2f + r * (float) Math.sin(a), 1.5f + random.nextFloat() * 3f, p);
        }
        return bitmap;
    }

    /** Ash round the hearth (256): pale grey, thickest in the middle, flecked with charcoal. */
    private static Bitmap ash() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(24);
        Paint p = paint();
        p.setShader(new RadialGradient(size / 2f, size / 2f, size / 2f,
            new int[] {Color.argb(225, 112, 108, 104), Color.argb(150, 92, 86, 80), Color.argb(0, 80, 72, 66)}, new float[] {0f, 0.55f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, p);
        p.setShader(null);
        for (int i = 0; i < 260; i++) {
            float r = (float) Math.sqrt(random.nextFloat()) * size * 0.38f;
            double a = random.nextFloat() * Math.PI * 2;
            p.setColor(random.nextFloat() < 0.7f ? Color.argb(150, 30, 26, 24) : Color.argb(70, 200, 196, 190));
            canvas.drawCircle(size / 2f + r * (float) Math.cos(a), size / 2f + r * (float) Math.sin(a), 0.8f + random.nextFloat() * 1.6f, p);
        }
        return bitmap;
    }

    /** A puff of smoke (256): soft, uneven, pale grey. */
    private static Bitmap smoke() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Random random = new Random(25);
        Paint p = paint();
        for (int i = 0; i < 14; i++) {
            float r = size * (0.18f + 0.16f * random.nextFloat());
            float x = size / 2f + (random.nextFloat() - 0.5f) * size * 0.36f;
            float y = size / 2f + (random.nextFloat() - 0.5f) * size * 0.36f;
            p.setShader(new RadialGradient(x, y, r, Color.argb(90, 214, 212, 206), Color.argb(0, 214, 212, 206), Shader.TileMode.CLAMP));
            canvas.drawCircle(x, y, r, p);
        }
        p.setShader(null);
        return bitmap;
    }

    // Labels are 512 wide; this is their height over width.
    static final float LABEL_ASPECT = 0.4f;

    /** A word's label: what it is in small capitals, the word large, and where it is recorded. */
    private static Bitmap label(Label label) {
        int width = 512;
        int height = Math.round(width * LABEL_ASPECT);
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint back = paint();
        back.setColor(Color.argb(215, 18, 24, 22));
        canvas.drawRoundRect(new RectF(0, 0, width, height), 30, 30, back);
        Paint edge = paint();
        edge.setStyle(Paint.Style.STROKE);
        edge.setStrokeWidth(4);
        edge.setColor(Color.rgb(232, 170, 80));
        canvas.drawRoundRect(new RectF(2, 2, width - 2, height - 2), 28, 28, edge);
        TextPaint what = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        what.setTypeface(android.graphics.Typeface.create("sans-serif", android.graphics.Typeface.BOLD));
        what.setTextSize(24);
        what.setLetterSpacing(0.08f);
        what.setColor(Color.rgb(232, 170, 80));
        TextPaint word = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        word.setTypeface(android.graphics.Typeface.create("sans-serif", android.graphics.Typeface.BOLD));
        word.setTextSize(60);
        word.setColor(Color.WHITE);
        TextPaint source = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        source.setTextSize(20);
        source.setColor(Color.rgb(190, 204, 196));
        int pad = 24;
        canvas.drawText(label.english.toUpperCase(java.util.Locale.US), pad, pad + 22, what);
        // The word, shrunk to fit if long.
        float wordWidth = word.measureText(label.word);
        if (wordWidth > width - pad * 2) word.setTextSize(60f * (width - pad * 2) / wordWidth);
        canvas.drawText(label.word, pad, pad + 22 + 14 + 54, word);
        StaticLayout from = StaticLayout.Builder.obtain(label.source, 0, label.source.length(), source, width - pad * 2)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL).setMaxLines(2).build();
        canvas.save();
        canvas.translate(pad, height - pad - from.getHeight() + 4);
        from.draw(canvas);
        canvas.restore();
        return bitmap;
    }

    /** The drawer's picture: the wigwam from the front, its bark, poles, dark doorway and a wisp of smoke. */
    static Bitmap tile() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint p = paint();
        p.setShader(new RadialGradient(128, 214, 120, Color.argb(120, 0, 0, 0), Color.argb(0, 0, 0, 0), Shader.TileMode.CLAMP));
        canvas.drawOval(new RectF(10, 190, 246, 236), p);
        p.setShader(null);
        Path domePath = new Path();
        domePath.moveTo(18, 212);
        domePath.cubicTo(14, 120, 60, 66, 128, 64);
        domePath.cubicTo(196, 66, 242, 120, 238, 212);
        domePath.close();
        canvas.save();
        canvas.clipPath(domePath);
        Bitmap bark = bark();
        p.setFilterBitmap(true);
        BitmapShader shader = new BitmapShader(bark, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT);
        p.setShader(shader);
        for (int band = 0; band < 6; band++) {
            float top = 64 + band * 26;
            android.graphics.Matrix shift = new android.graphics.Matrix();
            shift.setScale(0.22f, 0.13f);
            shift.postTranslate(band * 37f, top);
            shader.setLocalMatrix(shift);
            canvas.drawRect(0, top, size, top + 30, p);
        }
        p.setShader(new LinearGradient(0, 64, 0, 212, Color.argb(0, 0, 0, 0), Color.argb(70, 0, 0, 0), Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, size, size, p);
        p.setShader(null);
        bark.recycle();
        Paint pole = paint();
        pole.setStyle(Paint.Style.STROKE);
        pole.setStrokeWidth(3.5f);
        pole.setColor(Color.rgb(96, 82, 68));
        canvas.drawLine(10, 176, 246, 176, pole);
        canvas.drawLine(10, 128, 246, 128, pole);
        canvas.drawLine(30, 212, 100, 66, pole);
        canvas.drawLine(226, 212, 156, 66, pole);
        canvas.restore();
        Path door = new Path();
        door.moveTo(100, 212);
        door.lineTo(104, 134);
        door.quadTo(128, 126, 152, 134);
        door.lineTo(156, 212);
        door.close();
        p.setColor(Color.rgb(24, 18, 14));
        canvas.drawPath(door, p);
        p.setShader(new RadialGradient(128, 206, 26, Color.argb(220, 255, 150, 50), Color.argb(0, 255, 120, 30), Shader.TileMode.CLAMP));
        canvas.drawCircle(128, 206, 26, p);
        p.setShader(null);
        Paint smokePaint = paint();
        smokePaint.setStyle(Paint.Style.STROKE);
        smokePaint.setStrokeCap(Paint.Cap.ROUND);
        smokePaint.setStrokeWidth(10f);
        smokePaint.setMaskFilter(new BlurMaskFilter(6f, BlurMaskFilter.Blur.NORMAL));
        smokePaint.setColor(Color.argb(120, 220, 218, 212));
        Path wisp = new Path();
        wisp.moveTo(128, 64);
        wisp.cubicTo(118, 44, 146, 32, 140, 10);
        canvas.drawPath(wisp, smokePaint);
        return bitmap;
    }

}
