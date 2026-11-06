package com.nativelongisland.onthissite;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BlurMaskFilter;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import com.google.ar.core.Anchor;
import java.util.ArrayList;
import java.util.List;

/**
 * The "Place" drawer: things a visitor puts into their own space through AR,
 * each held by an ARCore anchor where it was placed for the rest of the AR
 * session. The stickers (#LANDBACK, Shinnecock Land, We Are Still Here) each
 * come in five looks and lie on the wall or ground that was aimed at; the flag
 * is a 3D pole flying the Shinnecock flag on gold, black, white or silver,
 * planted on the ground with a soft shadow. Artwork is drawn here from the
 * bundled font and flag, so nothing is downloaded.
 */
final class ArPlace {
    private ArPlace() {}

    static final String LANDBACK = "landback";
    static final String SHINNECOCK_LAND = "shinnecock-land";
    static final String STILL_HERE = "still-here";
    static final String FLAG = "flag";

    // The flag at scale 1 (metres): a pole, a ball on top, and the cloth near its top.
    static final float POLE_HEIGHT = 2.2f;
    static final float POLE_RADIUS = 0.022f;
    static final float FINIAL_RADIUS = 0.045f;
    // The usual flag shape, 3:2; the bundled image is cropped to it round the seal.
    static final float FLAG_WIDTH = 0.9f;
    static final float FLAG_HEIGHT = 0.6f;
    static final float FLAG_TOP_GAP = 0.06f;
    // The ripple at the cloth's free end (metres); the whole cloth also swings
    // about the pole by twice this, and a quicker flutter rides on top.
    static final float FLAG_WAVE = 0.08f;

    /** A sticker's words: in the graffiti face (lines with drips), plainly for the other looks, and its colour. */
    static final class Phrase {
        final String id;
        final String title;
        // Width at scale 1 (metres).
        final float width;
        final float tilt;
        final TagLine[] graffiti;
        final String[] plain;
        // The badge's ground and the digital sign's glow.
        final int color;

        Phrase(String id, String title, float width, float tilt, TagLine[] graffiti, String[] plain, int color) {
            this.id = id;
            this.title = title;
            this.width = width;
            this.tilt = tilt;
            this.graffiti = graffiti;
            this.plain = plain;
            this.color = color;
        }
    }

    static final Phrase[] PHRASES = {
        new Phrase(LANDBACK, "#LANDBACK", 0.6f, -6f,
            new TagLine[] {new TagLine("#LANDBACK", 1f, Color.rgb(255, 82, 82), Color.rgb(160, 0, 0), new int[] {2, 5, 8})},
            new String[] {"#LANDBACK"}, Color.rgb(211, 47, 47)),
        new Phrase(SHINNECOCK_LAND, "Shinnecock Land", 0.5f, -4f,
            new TagLine[] {
                new TagLine("SHINNECOCK", 1f, Color.rgb(77, 208, 196), Color.rgb(0, 105, 92), new int[] {}),
                new TagLine("LAND", 1.9f, Color.rgb(255, 224, 102), Color.rgb(242, 160, 18), new int[] {0, 2, 3})},
            new String[] {"SHINNECOCK", "LAND"}, Color.rgb(0, 137, 123)),
        // Wampum's white and purple. "Still" in lower case: this face's capital L
        // is a hook, and "STILL" read as "STIhh".
        new Phrase(STILL_HERE, "We Are Still Here", 0.55f, -3f,
            new TagLine[] {
                new TagLine("WE ARE Still", 1f, Color.WHITE, Color.rgb(209, 196, 233), new int[] {}),
                new TagLine("HERE", 1.9f, Color.rgb(179, 136, 255), Color.rgb(74, 20, 140), new int[] {0, 1, 3})},
            new String[] {"WE ARE STILL", "HERE"}, Color.rgb(142, 68, 220)),
    };

    // Every sticker comes in these looks (id, name in the drawer).
    static final String[][] LOOKS = {
        {"graffiti", "Graffiti"}, {"black", "Black letters"}, {"digital", "Digital"}, {"painted", "Black only"}, {"badge", "Badge"},
    };
    // The flag is always the gold Shinnecock flag; its pole comes in these colours (id, name in the drawer).
    static final String[][] POLES = {{"gold", "Gold pole"}, {"black", "Black pole"}, {"white", "White pole"}, {"silver", "Silver pole"}};

    /** One placeable thing in the drawer: a sticker in one look, or the flag on one colour of pole. */
    static final class Asset {
        final String id;
        // The drawer section it sits in, and its name there.
        final String group;
        final String label;
        // A 3D model (planted on the ground) rather than a flat sticker.
        final boolean model;
        // A sticker's width at scale 1 (metres).
        final float width;
        final Phrase phrase;
        // The sticker's look, or the flag pole's colour.
        final String look;

        Asset(String id, String group, String label, boolean model, float width, Phrase phrase, String look) {
            this.id = id;
            this.group = group;
            this.label = label;
            this.model = model;
            this.width = width;
            this.phrase = phrase;
            this.look = look;
        }

        String texture() {
            // Every pole flies the same cloth.
            return model ? "place:" + FLAG : "place:" + id;
        }
    }

    static final Asset[] ASSETS = catalog();

    private static Asset[] catalog() {
        List<Asset> assets = new ArrayList<>();
        for (Phrase phrase : PHRASES) {
            for (String[] look : LOOKS) {
                assets.add(new Asset(phrase.id + ":" + look[0], phrase.title, look[1], false, phrase.width, phrase, look[0]));
            }
        }
        for (String[] pole : POLES) {
            assets.add(new Asset(FLAG + ":" + pole[0], "Shinnecock flag (3D)", pole[1], true, 0f, null, pole[0]));
        }
        return assets.toArray(new Asset[0]);
    }

    static Asset asset(String id) {
        for (Asset asset : ASSETS) if (asset.id.equals(id)) return asset;
        return null;
    }

    /**
     * Something placed. Its anchor's +Y is the surface normal (for the flag,
     * straight up); a sticker's lettering runs along +X with its top towards -Z.
     */
    static final class Placed {
        private static int nextId;
        final String id = "place:" + (++nextId);
        final Asset asset;
        final Anchor anchor;
        float scale = 1f;
        // Turned by hand about the anchor's +Y (radians).
        float turn;
        // Taken away; its anchor is let go on the GL thread.
        boolean removed;

        Placed(Asset asset, Anchor anchor) {
            this.asset = asset;
            this.anchor = anchor;
        }
    }

    // ---- Artwork ----

    private static Typeface graffiti;

    /** Sedgwick Ave Display, a graffiti tag face (SIL Open Font License; assets/licenses). */
    private static synchronized Typeface graffiti(Resources resources) {
        if (graffiti == null) graffiti = Typeface.createFromAsset(resources.getAssets(), "fonts/SedgwickAveDisplay-Regular.ttf");
        return graffiti;
    }

    /** What an asset looks like as placed: a sticker's face, or the flag's cloth. */
    static Bitmap artwork(Asset asset, Resources resources) {
        if (asset.model) return flagCloth(resources);
        Phrase phrase = asset.phrase;
        switch (asset.look) {
            case "black":
                return tag(graffiti(resources), phrase.tilt, Look.BLACK, phrase.graffiti);
            case "painted":
                return tag(graffiti(resources), phrase.tilt, Look.PAINTED, phrase.graffiti);
            case "digital":
                return digital(phrase.plain, phrase.color);
            case "badge":
                return badge(phrase.plain, phrase.color);
            default:
                return tag(graffiti(resources), phrase.tilt, Look.COLOUR, phrase.graffiti);
        }
    }

    /** One line of a graffiti sticker: its words, size, top and bottom fill colours, and letters that drip. */
    static final class TagLine {
        final String text;
        final float size;
        final int top;
        final int bottom;
        final int[] drips;

        TagLine(String text, float size, int top, int bottom, int[] drips) {
            this.text = text;
            this.size = size;
            this.top = top;
            this.bottom = bottom;
            this.drips = drips;
        }
    }

    /**
     * How graffiti lettering is finished: in colour or black, as a die-cut
     * sticker (white edge, shadow, outline over a 3D extrusion, gloss), or black
     * only, sprayed straight onto the surface.
     */
    private enum Look { COLOUR, BLACK, PAINTED }

    /**
     * Graffiti lettering: each line's letters (with paint drips and splatter)
     * as one shape, finished as the look asks, tilted.
     */
    private static Bitmap tag(Typeface face, float tilt, Look look, TagLine... lines) {
        float base = 200f;
        Paint letters = new Paint(Paint.ANTI_ALIAS_FLAG);
        letters.setTypeface(face);
        Path[] paths = new Path[lines.length];
        Path all = new Path();
        java.util.Random speckle = new java.util.Random(lines[0].text.hashCode());
        float baseline = 0f;
        for (int i = 0; i < lines.length; i++) {
            TagLine line = lines[i];
            float size = base * line.size;
            letters.setTextSize(size);
            // Lines sit tight, as tags do.
            baseline += i == 0 ? size * 0.8f : size * 0.78f;
            float width = letters.measureText(line.text);
            Path path = new Path();
            letters.getTextPath(line.text, 0, line.text.length(), -width / 2f, baseline, path);
            float[] advances = new float[line.text.length()];
            letters.getTextWidths(line.text, advances);
            for (int index : line.drips) {
                if (index >= advances.length) continue;
                float x = -width / 2f;
                for (int k = 0; k < index; k++) x += advances[k];
                x += advances[index] * (0.35f + 0.3f * speckle.nextFloat());
                float drip = size * (0.05f + 0.025f * speckle.nextFloat());
                float length = size * (0.22f + 0.3f * speckle.nextFloat());
                Path run = new Path();
                run.addRoundRect(new RectF(x - drip / 2f, baseline - size * 0.2f, x + drip / 2f, baseline + length),
                    drip / 2f, drip / 2f, Path.Direction.CW);
                run.addCircle(x, baseline + length, drip * 0.75f, Path.Direction.CW);
                // A fleck of splatter beside the drip.
                run.addCircle(x + drip * (speckle.nextBoolean() ? 2.2f : -2.2f), baseline + length * 0.55f,
                    drip * 0.38f, Path.Direction.CW);
                path.op(run, Path.Op.UNION);
            }
            paths[i] = path;
            all.op(path, Path.Op.UNION);
        }
        android.graphics.Matrix turn = new android.graphics.Matrix();
        RectF bounds = new RectF();
        all.computeBounds(bounds, true);
        turn.setRotate(tilt, bounds.centerX(), bounds.centerY());
        all.transform(turn);
        for (Path path : paths) path.transform(turn);
        all.computeBounds(bounds, true);

        boolean sticker = look != Look.PAINTED;
        float cut = 22f;
        float outline = 9f;
        float extrude = 12f;
        float margin = sticker ? cut + outline + extrude + 22f : 24f;
        Bitmap bitmap = Bitmap.createBitmap(Math.round(bounds.width() + 2 * margin), Math.round(bounds.height() + 2 * margin),
            Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.translate(margin - bounds.left, margin - bounds.top);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setStrokeJoin(Paint.Join.ROUND);
        paint.setStrokeCap(Paint.Cap.ROUND);
        if (!sticker) {
            // Sprayed on: a soft overspray, then the paint.
            paint.setColor(Color.argb(120, 17, 17, 17));
            paint.setMaskFilter(new BlurMaskFilter(7f, BlurMaskFilter.Blur.NORMAL));
            canvas.drawPath(all, paint);
            paint.setMaskFilter(null);
            paint.setColor(Color.argb(240, 17, 17, 17));
            canvas.drawPath(all, paint);
            return bitmap;
        }
        paint.setStyle(Paint.Style.FILL_AND_STROKE);
        // A soft shadow under the sticker.
        paint.setColor(Color.argb(110, 0, 0, 0));
        paint.setStrokeWidth(2 * cut);
        paint.setMaskFilter(new BlurMaskFilter(12f, BlurMaskFilter.Blur.NORMAL));
        canvas.save();
        canvas.translate(5f, 9f);
        canvas.drawPath(all, paint);
        canvas.restore();
        paint.setMaskFilter(null);
        // The white cut edge, wide enough to hold the extrusion.
        paint.setColor(Color.WHITE);
        paint.setStrokeWidth(2 * (cut + outline));
        canvas.drawPath(all, paint);
        canvas.save();
        canvas.translate(extrude * 0.6f, extrude);
        canvas.drawPath(all, paint);
        canvas.restore();
        // A 3D extrusion down and to the right (grey under black letters, so it shows), then the outline.
        paint.setStrokeWidth(2 * outline);
        for (int i = (int) extrude; i >= 0; i--) {
            paint.setColor(i > 0 && look == Look.BLACK ? Color.rgb(120, 120, 120) : Color.rgb(20, 20, 20));
            canvas.save();
            canvas.translate(i * 0.6f, i);
            canvas.drawPath(all, paint);
            canvas.restore();
        }
        // Each line's fill: a top-to-bottom gradient with a gloss across its upper part.
        paint.setStyle(Paint.Style.FILL);
        for (int i = 0; i < lines.length; i++) {
            RectF line = new RectF();
            paths[i].computeBounds(line, true);
            int top = look == Look.BLACK ? Color.rgb(70, 70, 70) : lines[i].top;
            int bottom = look == Look.BLACK ? Color.rgb(8, 8, 8) : lines[i].bottom;
            paint.setShader(new LinearGradient(0f, line.top, 0f, line.bottom, top, bottom, Shader.TileMode.CLAMP));
            canvas.drawPath(paths[i], paint);
            paint.setShader(null);
            canvas.save();
            canvas.clipPath(paths[i]);
            Paint gloss = new Paint(Paint.ANTI_ALIAS_FLAG);
            gloss.setColor(Color.argb(look == Look.BLACK ? 60 : 80, 255, 255, 255));
            Path band = new Path();
            float glossBottom = line.top + line.height() * 0.42f;
            band.moveTo(line.left, line.top);
            band.lineTo(line.right, line.top);
            band.lineTo(line.right, glossBottom - line.height() * 0.12f);
            band.lineTo(line.left, glossBottom + line.height() * 0.08f);
            band.close();
            canvas.drawPath(band, gloss);
            canvas.restore();
        }
        return bitmap;
    }

    /**
     * A digital sign: the words in square-pixel lettering, each pixel a lit dot
     * that glows, on a dark panel where the unlit dots faintly show.
     */
    private static Bitmap digital(String[] lines, int glow) {
        // The lettering drawn tiny and unsmoothed, so each of its pixels becomes one dot.
        Paint pixels = new Paint();
        pixels.setAntiAlias(false);
        pixels.setTypeface(Typeface.create(Typeface.MONOSPACE, Typeface.BOLD));
        pixels.setTextSize(14f);
        pixels.setColor(Color.WHITE);
        Rect letter = new Rect();
        pixels.getTextBounds("HW", 0, 2, letter);
        int lineHeight = letter.height();
        int gap = 3;
        int columns = 0;
        for (String line : lines) columns = Math.max(columns, (int) Math.ceil(pixels.measureText(line)));
        columns += 2;
        int rows = lines.length * lineHeight + (lines.length - 1) * gap + 2;
        Bitmap small = Bitmap.createBitmap(columns, rows, Bitmap.Config.ARGB_8888);
        Canvas tiny = new Canvas(small);
        for (int i = 0; i < lines.length; i++) {
            float x = (columns - pixels.measureText(lines[i])) / 2f;
            tiny.drawText(lines[i], Math.round(x), 1 + i * (lineHeight + gap) - letter.top, pixels);
        }
        float cell = Math.max(10f, 1000f / columns);
        float pad = cell * 2.2f;
        int width = Math.round(columns * cell + 2 * pad);
        int height = Math.round(rows * cell + 2 * pad);
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(Color.rgb(14, 17, 19));
        canvas.drawRoundRect(new RectF(0, 0, width, height), cell * 1.6f, cell * 1.6f, paint);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(cell * 0.35f);
        paint.setColor(Color.rgb(48, 54, 58));
        canvas.drawRoundRect(new RectF(cell * 0.3f, cell * 0.3f, width - cell * 0.3f, height - cell * 0.3f), cell * 1.4f, cell * 1.4f, paint);
        paint.setStyle(Paint.Style.FILL);
        boolean[][] lit = new boolean[rows][columns];
        for (int y = 0; y < rows; y++) for (int x = 0; x < columns; x++) lit[y][x] = Color.alpha(small.getPixel(x, y)) > 110;
        small.recycle();
        // Unlit dots, then the glow round the lit ones, then the lit dots.
        paint.setColor(Color.argb(38, Color.red(glow), Color.green(glow), Color.blue(glow)));
        for (int y = 0; y < rows; y++) for (int x = 0; x < columns; x++) {
            if (!lit[y][x]) canvas.drawCircle(pad + (x + 0.5f) * cell, pad + (y + 0.5f) * cell, cell * 0.3f, paint);
        }
        paint.setColor(Color.argb(210, Color.red(glow), Color.green(glow), Color.blue(glow)));
        paint.setMaskFilter(new BlurMaskFilter(cell * 0.7f, BlurMaskFilter.Blur.NORMAL));
        for (int y = 0; y < rows; y++) for (int x = 0; x < columns; x++) {
            if (lit[y][x]) canvas.drawCircle(pad + (x + 0.5f) * cell, pad + (y + 0.5f) * cell, cell * 0.62f, paint);
        }
        paint.setMaskFilter(null);
        int hot = Color.rgb(Math.min(255, Color.red(glow) + 150), Math.min(255, Color.green(glow) + 150), Math.min(255, Color.blue(glow) + 150));
        for (int y = 0; y < rows; y++) for (int x = 0; x < columns; x++) {
            if (!lit[y][x]) continue;
            float cx = pad + (x + 0.5f) * cell;
            float cy = pad + (y + 0.5f) * cell;
            paint.setShader(new RadialGradient(cx, cy, cell * 0.47f, hot, glow, Shader.TileMode.CLAMP));
            canvas.drawCircle(cx, cy, cell * 0.47f, paint);
        }
        paint.setShader(null);
        return bitmap;
    }

    /** A die-cut badge: a white border round a coloured sign with heavy white lettering. */
    private static Bitmap badge(String[] lines, int color) {
        int width = 1024;
        float border = 26f;
        float pad = 54f;
        Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);
        text.setColor(Color.WHITE);
        text.setTypeface(Typeface.create("sans-serif-black", Typeface.NORMAL));
        text.setTextAlign(Paint.Align.CENTER);
        // One size for every line, the largest that fits the longest.
        text.setTextSize(200f);
        float widest = 0f;
        for (String line : lines) widest = Math.max(widest, text.measureText(line));
        float size = Math.min(300f, 200f * (width - 2 * border - 2 * pad) / widest);
        text.setTextSize(size);
        Paint.FontMetrics metrics = text.getFontMetrics();
        float lineHeight = (metrics.descent - metrics.ascent) * 0.92f;
        int height = Math.round(2 * border + 2 * pad * 0.6f + lineHeight * lines.length);
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        fill.setColor(Color.WHITE);
        canvas.drawRoundRect(new RectF(0, 0, width, height), 64f, 64f, fill);
        fill.setColor(color);
        canvas.drawRoundRect(new RectF(border, border, width - border, height - border), 46f, 46f, fill);
        float top = (height - lineHeight * lines.length) / 2f;
        for (int i = 0; i < lines.length; i++) {
            float baseline = top + lineHeight * i + (lineHeight - (metrics.descent - metrics.ascent)) / 2f - metrics.ascent;
            canvas.drawText(lines[i], width / 2f, baseline, text);
        }
        return bitmap;
    }

    /** The flag's cloth: the Shinnecock flag (the Great Seal on gold) as Jeremy supplied it. */
    static Bitmap flagCloth(Resources resources) {
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inScaled = false;
        return BitmapFactory.decodeResource(resources, R.drawable.shinnecock_flag, options);
    }

    /** The flag pole's colour (red, green, blue, alpha from 0 to 1) for its look. */
    static float[] poleColor(Asset asset) {
        switch (asset.look) {
            case "gold":
                return new float[] {0.84f, 0.67f, 0.26f, 1f};
            case "black":
                return new float[] {0.12f, 0.12f, 0.13f, 1f};
            case "white":
                return new float[] {0.95f, 0.95f, 0.94f, 1f};
            default:
                return new float[] {0.78f, 0.8f, 0.82f, 1f};
        }
    }

    /** The flag's contact shadow: dark at the foot of the pole, gone by its edge. */
    static Bitmap shadowBlob() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setShader(new RadialGradient(size / 2f, size / 2f, size / 2f,
            new int[] {Color.argb(150, 0, 0, 0), Color.argb(70, 0, 0, 0), Color.argb(0, 0, 0, 0)},
            new float[] {0f, 0.35f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint);
        return bitmap;
    }

    /** A soft ring on the ground where the flag will go while aiming. */
    static Bitmap ring() {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG);
        stroke.setStyle(Paint.Style.STROKE);
        stroke.setStrokeWidth(14f);
        stroke.setColor(Color.argb(230, 255, 255, 255));
        canvas.drawCircle(size / 2f, size / 2f, size / 2f - 12f, stroke);
        stroke.setStrokeWidth(8f);
        canvas.drawCircle(size / 2f, size / 2f, 18f, stroke);
        return bitmap;
    }

    /** A selected sticker's outline. */
    static Bitmap outline() {
        int width = 512;
        int height = 512;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint stroke = new Paint(Paint.ANTI_ALIAS_FLAG);
        stroke.setStyle(Paint.Style.STROKE);
        stroke.setStrokeWidth(12f);
        stroke.setColor(Color.rgb(126, 211, 158));
        canvas.drawRoundRect(new RectF(8, 8, width - 8, height - 8), 40f, 40f, stroke);
        return bitmap;
    }

    /** A drawer tile's picture. */
    static Bitmap tile(Asset asset, Resources resources) {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        Bitmap art = artwork(asset, resources);
        if (asset.model) {
            float[] pole = poleColor(asset);
            paint.setColor(Color.rgb(Math.round(pole[0] * 255), Math.round(pole[1] * 255), Math.round(pole[2] * 255)));
            canvas.drawRect(69, 30, 81, 236, paint);
            paint.setColor(Color.rgb(214, 172, 66));
            canvas.drawCircle(75, 26, 12, paint);
            canvas.drawBitmap(art, null, new RectF(80, 40, 246, 40 + 166f * FLAG_HEIGHT / FLAG_WIDTH), paint);
        } else {
            float height = 236f * art.getHeight() / art.getWidth();
            canvas.drawBitmap(art, null, new RectF(10, (size - height) / 2f, 246, (size + height) / 2f), paint);
        }
        art.recycle();
        return bitmap;
    }

    // ---- Meshes (interleaved position, normal, texture coordinates) ----

    /** A pole along +Y from 0 to height, with a flat top. */
    static ArGl.Mesh cylinder(int segments, float radius, float height) {
        float[] vertices = new float[(segments + 1) * 2 * 8 + (segments + 1) * 8 + 8];
        short[] indices = new short[segments * 6 + segments * 3];
        int v = 0;
        for (int i = 0; i <= segments; i++) {
            double angle = 2 * Math.PI * i / segments;
            float x = (float) Math.cos(angle);
            float z = (float) Math.sin(angle);
            float u = i / (float) segments;
            v = put(vertices, v, x * radius, 0f, z * radius, x, 0f, z, u, 1f);
            v = put(vertices, v, x * radius, height, z * radius, x, 0f, z, u, 0f);
        }
        int capStart = (segments + 1) * 2;
        for (int i = 0; i <= segments; i++) {
            double angle = 2 * Math.PI * i / segments;
            v = put(vertices, v, (float) Math.cos(angle) * radius, height, (float) Math.sin(angle) * radius, 0f, 1f, 0f, 0f, 0f);
        }
        int centre = capStart + segments + 1;
        put(vertices, v, 0f, height, 0f, 0f, 1f, 0f, 0f, 0f);
        int n = 0;
        for (int i = 0; i < segments; i++) {
            short a = (short) (i * 2);
            indices[n++] = a;
            indices[n++] = (short) (a + 1);
            indices[n++] = (short) (a + 2);
            indices[n++] = (short) (a + 1);
            indices[n++] = (short) (a + 3);
            indices[n++] = (short) (a + 2);
        }
        for (int i = 0; i < segments; i++) {
            indices[n++] = (short) centre;
            indices[n++] = (short) (capStart + i);
            indices[n++] = (short) (capStart + i + 1);
        }
        return new ArGl.Mesh(vertices, indices);
    }

    static ArGl.Mesh sphere(int rings, int segments, float radius) {
        float[] vertices = new float[(rings + 1) * (segments + 1) * 8];
        short[] indices = new short[rings * segments * 6];
        int v = 0;
        for (int r = 0; r <= rings; r++) {
            double polar = Math.PI * r / rings;
            for (int s = 0; s <= segments; s++) {
                double around = 2 * Math.PI * s / segments;
                float x = (float) (Math.sin(polar) * Math.cos(around));
                float y = (float) Math.cos(polar);
                float z = (float) (Math.sin(polar) * Math.sin(around));
                v = put(vertices, v, x * radius, y * radius, z * radius, x, y, z, s / (float) segments, r / (float) rings);
            }
        }
        int n = 0;
        for (int r = 0; r < rings; r++) {
            for (int s = 0; s < segments; s++) {
                short a = (short) (r * (segments + 1) + s);
                short b = (short) (a + segments + 1);
                indices[n++] = a;
                indices[n++] = b;
                indices[n++] = (short) (a + 1);
                indices[n++] = b;
                indices[n++] = (short) (b + 1);
                indices[n++] = (short) (a + 1);
            }
        }
        return new ArGl.Mesh(vertices, indices);
    }

    /**
     * A unit cloth in the XY plane (x and y from 0 to 1) facing +Z, finely
     * divided so it can wave; texture u runs along x (0 at the pole).
     */
    static ArGl.Mesh cloth(int columns, int rows) {
        float[] vertices = new float[(columns + 1) * (rows + 1) * 8];
        short[] indices = new short[columns * rows * 6];
        int v = 0;
        for (int r = 0; r <= rows; r++) {
            float y = r / (float) rows;
            for (int c = 0; c <= columns; c++) {
                float x = c / (float) columns;
                v = put(vertices, v, x, y, 0f, 0f, 0f, 1f, x, 1f - y);
            }
        }
        int n = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < columns; c++) {
                short a = (short) (r * (columns + 1) + c);
                short b = (short) (a + columns + 1);
                indices[n++] = a;
                indices[n++] = (short) (a + 1);
                indices[n++] = b;
                indices[n++] = (short) (a + 1);
                indices[n++] = (short) (b + 1);
                indices[n++] = b;
            }
        }
        return new ArGl.Mesh(vertices, indices);
    }

    private static int put(float[] into, int at, float x, float y, float z, float nx, float ny, float nz, float u, float v) {
        into[at] = x;
        into[at + 1] = y;
        into[at + 2] = z;
        into[at + 3] = nx;
        into[at + 4] = ny;
        into[at + 5] = nz;
        into[at + 6] = u;
        into[at + 7] = v;
        return at + 8;
    }
}
