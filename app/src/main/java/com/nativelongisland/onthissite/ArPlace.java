package com.nativelongisland.onthissite;

import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import com.google.ar.core.Anchor;

/**
 * The "Place" drawer: things a visitor puts into their own space through AR,
 * each held by an ARCore anchor where it was placed for the rest of the AR
 * session. Stickers are flat (#LANDBACK, Shinnecock Land) and lie on the wall
 * or ground that was aimed at; the flag is a 3D pole flying the Shinnecock
 * flag, planted on the ground. Sticker artwork is drawn here and the flag is
 * bundled, so nothing is downloaded.
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

    /** One placeable thing in the drawer. */
    static final class Asset {
        final String id;
        final String label;
        // A 3D model (planted on the ground) rather than a flat sticker.
        final boolean model;
        // A sticker's width at scale 1 (metres).
        final float width;

        Asset(String id, String label, boolean model, float width) {
            this.id = id;
            this.label = label;
            this.model = model;
            this.width = width;
        }

        String texture() {
            return model ? "place:flag-cloth" : "place:" + id;
        }
    }

    static final Asset[] ASSETS = {
        new Asset(LANDBACK, "#LANDBACK sticker", false, 0.6f),
        new Asset(SHINNECOCK_LAND, "Shinnecock Land sticker", false, 0.5f),
        new Asset(STILL_HERE, "We Are Still Here sticker", false, 0.55f),
        new Asset(FLAG, "Shinnecock flag (3D)", true, 0f),
    };

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

    /** A sticker's face, as placed: graffiti lettering, die-cut. */
    static Bitmap sticker(String id, Resources resources) {
        Typeface face = graffiti(resources);
        if (STILL_HERE.equals(id)) {
            // Wampum's white and purple. "Still" in lower case: this face's capital L
            // is a hook, and "STILL" read as "STIhh".
            return tag(face, -3f,
                new TagLine("WE ARE Still", 1f, Color.WHITE, Color.rgb(209, 196, 233), new int[] {}),
                new TagLine("HERE", 1.9f, Color.rgb(179, 136, 255), Color.rgb(74, 20, 140), new int[] {0, 1, 3}));
        }
        if (SHINNECOCK_LAND.equals(id)) {
            return tag(face, -4f,
                new TagLine("SHINNECOCK", 1f, Color.rgb(77, 208, 196), Color.rgb(0, 105, 92), new int[] {}),
                new TagLine("LAND", 1.9f, Color.rgb(255, 224, 102), Color.rgb(242, 160, 18), new int[] {0, 2, 3}));
        }
        return tag(face, -6f, new TagLine("#LANDBACK", 1f, Color.rgb(255, 82, 82), Color.rgb(160, 0, 0), new int[] {2, 5, 8}));
    }

    /** One line of a graffiti sticker: its words, size, top and bottom fill colours, and letters that drip. */
    private static final class TagLine {
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
     * A die-cut graffiti sticker: each line's letters (with paint drips and
     * splatter) filled with a gradient and a gloss, a heavy black outline over a
     * 3D extrusion, all inside a white cut edge with a soft shadow, tilted.
     */
    private static Bitmap tag(Typeface face, float tilt, TagLine... lines) {
        float base = 200f;
        Paint letters = new Paint(Paint.ANTI_ALIAS_FLAG);
        letters.setTypeface(face);
        android.graphics.Path[] paths = new android.graphics.Path[lines.length];
        android.graphics.Path all = new android.graphics.Path();
        java.util.Random speckle = new java.util.Random(lines[0].text.hashCode());
        float baseline = 0f;
        for (int i = 0; i < lines.length; i++) {
            TagLine line = lines[i];
            float size = base * line.size;
            letters.setTextSize(size);
            // Lines sit tight, as tags do.
            baseline += i == 0 ? size * 0.8f : size * 0.78f;
            float width = letters.measureText(line.text);
            android.graphics.Path path = new android.graphics.Path();
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
                android.graphics.Path run = new android.graphics.Path();
                run.addRoundRect(new RectF(x - drip / 2f, baseline - size * 0.2f, x + drip / 2f, baseline + length),
                    drip / 2f, drip / 2f, android.graphics.Path.Direction.CW);
                run.addCircle(x, baseline + length, drip * 0.75f, android.graphics.Path.Direction.CW);
                // A fleck of splatter beside the drip.
                run.addCircle(x + drip * (speckle.nextBoolean() ? 2.2f : -2.2f), baseline + length * 0.55f,
                    drip * 0.38f, android.graphics.Path.Direction.CW);
                path.op(run, android.graphics.Path.Op.UNION);
            }
            paths[i] = path;
            all.op(path, android.graphics.Path.Op.UNION);
        }
        android.graphics.Matrix turn = new android.graphics.Matrix();
        RectF bounds = new RectF();
        all.computeBounds(bounds, true);
        turn.setRotate(tilt, bounds.centerX(), bounds.centerY());
        all.transform(turn);
        for (android.graphics.Path path : paths) path.transform(turn);
        all.computeBounds(bounds, true);

        float cut = 22f;
        float outline = 9f;
        float extrude = 12f;
        float margin = cut + outline + extrude + 22f;
        Bitmap bitmap = Bitmap.createBitmap(Math.round(bounds.width() + 2 * margin), Math.round(bounds.height() + 2 * margin),
            Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.translate(margin - bounds.left, margin - bounds.top);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setStrokeJoin(Paint.Join.ROUND);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStyle(Paint.Style.FILL_AND_STROKE);
        // A soft shadow under the sticker.
        paint.setColor(Color.argb(110, 0, 0, 0));
        paint.setStrokeWidth(2 * cut);
        paint.setMaskFilter(new android.graphics.BlurMaskFilter(12f, android.graphics.BlurMaskFilter.Blur.NORMAL));
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
        // A 3D extrusion down and to the right, then the outline.
        paint.setColor(Color.rgb(20, 20, 20));
        paint.setStrokeWidth(2 * outline);
        for (int i = (int) extrude; i >= 0; i--) {
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
            paint.setShader(new android.graphics.LinearGradient(0f, line.top, 0f, line.bottom,
                lines[i].top, lines[i].bottom, android.graphics.Shader.TileMode.CLAMP));
            canvas.drawPath(paths[i], paint);
            paint.setShader(null);
            canvas.save();
            canvas.clipPath(paths[i]);
            Paint gloss = new Paint(Paint.ANTI_ALIAS_FLAG);
            gloss.setColor(Color.argb(80, 255, 255, 255));
            android.graphics.Path band = new android.graphics.Path();
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

    /** The flag's cloth: the Shinnecock flag (the Great Seal on gold), as Jeremy supplied it. */
    static Bitmap flagCloth(Resources resources) {
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inScaled = false;
        return BitmapFactory.decodeResource(resources, R.drawable.shinnecock_flag, options);
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
    static Bitmap tile(String id, Resources resources) {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        if (FLAG.equals(id)) {
            paint.setColor(Color.rgb(200, 204, 208));
            canvas.drawRect(70, 30, 80, 236, paint);
            paint.setColor(Color.rgb(214, 172, 66));
            canvas.drawCircle(75, 26, 12, paint);
            Bitmap cloth = flagCloth(resources);
            canvas.drawBitmap(cloth, null, new RectF(80, 40, 246, 40 + 166f * FLAG_HEIGHT / FLAG_WIDTH), paint);
            cloth.recycle();
        } else {
            Bitmap face = sticker(id, resources);
            float height = 236f * face.getHeight() / face.getWidth();
            canvas.drawBitmap(face, null, new RectF(10, (size - height) / 2f, 246, (size + height) / 2f), paint);
            face.recycle();
        }
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
