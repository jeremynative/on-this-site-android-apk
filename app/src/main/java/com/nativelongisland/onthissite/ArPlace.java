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

    /** A sticker's face, as placed. */
    static Bitmap sticker(String id) {
        return SHINNECOCK_LAND.equals(id)
            ? badge(new String[] {"SHINNECOCK", "LAND"}, Color.rgb(14, 77, 74))
            : badge(new String[] {"#LANDBACK"}, Color.rgb(183, 28, 28));
    }

    /** A die-cut sticker: a white border round a coloured badge with heavy white lettering. */
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
            Bitmap face = sticker(id);
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
