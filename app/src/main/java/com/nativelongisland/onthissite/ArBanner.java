package com.nativelongisland.onthissite;

import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.BlurMaskFilter;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.RadialGradient;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import java.util.Locale;
import java.util.Random;

/**
 * Land banners: a long swallowtail banner on a pole, one for each ancestral
 * community, reading "<Name> Land" in one line of heavy capitals. Each is the
 * community's colour from the map, made into a cloth colour, with black or white
 * lettering, whichever reads better; Shinnecock is yellow and Unkechaug black, as
 * Jeremy asked. The banner flies from a wooden pole and waves slowly (ArGl's
 * calm wave), and its back reads the right way round too.
 *
 * It is drawn as a real banner: woven, dyed cloth with soft packing creases and
 * the pull of its grommets, hemmed edges, printed lettering, and a canvas
 * header with brass grommets that rings hold to the pole (ArModels).
 */
final class ArBanner {
    private ArBanner() {}

    // At scale 1 (metres): long and narrow, at the top of the flag's 2.2 m pole.
    static final float LENGTH = 1.5f;
    static final float HEIGHT = 0.36f;
    static final float TOP_GAP = 0.06f;
    // How far the free end waves (metres).
    static final float WAVE = 0.09f;
    // Along the cloth (texture u, 0 at the pole): the canvas header, and how deep
    // the swallowtail cuts in at the middle.
    static final float HEADER = 0.045f;
    static final float NOTCH = 0.13f;
    // The grommets: their middle's distance along the cloth (u), their heights
    // down it (texture v, 0 at the top) and their outer radius (metres).
    static final float GROMMET_U = 0.015f;
    static final float[] GROMMET_V = {0.1f, 0.5f, 0.9f};
    static final float GROMMET_RADIUS = 0.0105f;
    // The lettering sits between the header and the swallowtail.
    static final float TEXT_START = HEADER + 0.02f;
    static final float TEXT_END = 1f - NOTCH - 0.012f;
    static final float TEXT_CENTRE = (TEXT_START + TEXT_END) / 2f;

    /**
     * The two-sided cloth's un-mirrored band for ArGl.MeshDraw.mirror: just the
     * lettering and a little round it, so on the back the words read the right
     * way round while the header, grommets and creases stay where they are.
     */
    static float[] mirror(ArPlace.Phrase community) {
        float half = lettering(community, 2048).textWidth / 2048f / 2f;
        return new float[] {TEXT_CENTRE, half + 0.006f, half + 0.014f};
    }

    /** The banner's words: the community's name and "Land". */
    static String words(ArPlace.Phrase community) {
        return community.title.toUpperCase(Locale.US) + " LAND";
    }

    /** The cloth's colour and its lettering's (black or white). */
    static int[] colours(ArPlace.Phrase community) {
        // Jeremy's choices: Shinnecock on yellow, Unkechaug white on black.
        if ("Unkechaug".equals(community.title)) return new int[] {Color.rgb(20, 20, 21), Color.rgb(244, 242, 236)};
        float[] hsv = new float[3];
        Color.colorToHSV(community.mapColor, hsv);
        // Dyed cloth: no neon, and the darkest colours kept clear of black.
        hsv[1] = Math.min(hsv[1], 0.85f);
        hsv[2] = Math.max(0.3f, Math.min(hsv[2], 0.92f));
        int ground = Color.HSVToColor(hsv);
        int letters = contrast(ground, Color.WHITE) >= contrast(ground, Color.BLACK) ? Color.WHITE : Color.BLACK;
        // At least 4.5 to 1 (the usual bar for text): darker under white letters, lighter under black.
        for (int step = 0; step < 40 && contrast(ground, letters) < 4.5f; step++) {
            hsv[2] = letters == Color.WHITE ? hsv[2] * 0.96f : Math.min(1f, hsv[2] * 1.04f);
            if (letters == Color.BLACK) hsv[1] *= 0.97f;
            ground = Color.HSVToColor(hsv);
        }
        // Printing ink is never quite pure black or white.
        return new int[] {ground, letters == Color.WHITE ? Color.rgb(244, 242, 236) : Color.rgb(22, 21, 20)};
    }

    /** WCAG contrast ratio of two colours. */
    static float contrast(int a, int b) {
        float la = luminance(a);
        float lb = luminance(b);
        return (Math.max(la, lb) + 0.05f) / (Math.min(la, lb) + 0.05f);
    }

    private static float luminance(int color) {
        return 0.2126f * linear(Color.red(color)) + 0.7152f * linear(Color.green(color)) + 0.0722f * linear(Color.blue(color));
    }

    private static float linear(int channel) {
        float c = channel / 255f;
        return c <= 0.03928f ? c / 12.92f : (float) Math.pow((c + 0.055) / 1.055, 2.4);
    }

    /** The words' paint and size for a cloth width pixels long. */
    private static final class Lettering {
        Paint paint;
        float textWidth;
        float capitalHeight;
    }

    private static Lettering lettering(ArPlace.Phrase community, int width) {
        int height = Math.round(width * HEIGHT / LENGTH);
        Paint letters = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        letters.setTypeface(Typeface.create("sans-serif-condensed", Typeface.BOLD));
        letters.setLetterSpacing(0.04f);
        letters.setTextAlign(Paint.Align.CENTER);
        String words = words(community);
        letters.setTextSize(100f);
        Rect capital = new Rect();
        letters.getTextBounds("H", 0, 1, capital);
        float capitalPer100 = capital.height();
        float bandWidth = (TEXT_END - TEXT_START) * width * 0.94f;
        float bySpace = 100f * bandWidth / letters.measureText(words);
        float byHeight = 100f * height * 0.46f / capitalPer100;
        letters.setTextSize(Math.min(bySpace, byHeight));
        Lettering lettering = new Lettering();
        lettering.paint = letters;
        lettering.textWidth = letters.measureText(words);
        lettering.capitalHeight = capitalPer100 * letters.getTextSize() / 100f;
        return lettering;
    }

    /**
     * The cloth, width pixels long (the pole at the left): dyed and woven, with
     * hemmed edges, printed words, a canvas header with brass grommets, and the
     * swallowtail cut out of the free end.
     */
    static Bitmap cloth(ArPlace.Phrase community, int width) {
        int height = Math.round(width * HEIGHT / LENGTH);
        // Sizes below are for the full 2048-pixel cloth.
        float k = width / 2048f;
        int[] colours = colours(community);
        int ground = colours[0];
        int ink = colours[1];
        Random random = new Random(community.id.hashCode());
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(ground);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        float header = HEADER * width;
        // The dye a touch uneven, in broad soft patches.
        for (int i = 0; i < 16; i++) {
            float x = header + random.nextFloat() * (width - header);
            float y = random.nextFloat() * height;
            float radius = width * (0.06f + 0.16f * random.nextFloat());
            int tint = random.nextBoolean() ? Color.argb(12 + random.nextInt(10), 255, 255, 255) : Color.argb(10 + random.nextInt(12), 0, 0, 0);
            paint.setShader(new RadialGradient(x, y, radius, tint, tint & 0x00FFFFFF, Shader.TileMode.CLAMP));
            canvas.drawCircle(x, y, radius, paint);
        }
        paint.setShader(null);
        // Hems: the long edges and the swallowtail folded over and sewn.
        float hem = height * 0.045f;
        paint.setColor(shade(ground, 0.9f));
        canvas.drawRect(header, 0, width, hem, paint);
        canvas.drawRect(header, height - hem, width, height, paint);
        Path tailEdge = new Path();
        tailEdge.moveTo(width + 2f, -2f);
        tailEdge.lineTo((1f - NOTCH) * width, height / 2f);
        tailEdge.lineTo(width + 2f, height + 2f);
        Paint fold = new Paint(Paint.ANTI_ALIAS_FLAG);
        fold.setStyle(Paint.Style.STROKE);
        fold.setStrokeJoin(Paint.Join.MITER);
        fold.setStrokeWidth(hem * 2f);
        fold.setColor(shade(ground, 0.9f));
        canvas.drawPath(tailEdge, fold);
        // The seams: one fine line of thread inside each hem.
        Paint seam = new Paint(Paint.ANTI_ALIAS_FLAG);
        seam.setStyle(Paint.Style.STROKE);
        seam.setStrokeWidth(Math.max(1f, 1.6f * k));
        seam.setColor(withAlpha(shade(ground, 0.62f), 150));
        canvas.drawLine(header, hem * 0.8f, width, hem * 0.8f, seam);
        canvas.drawLine(header, height - hem * 0.8f, width, height - hem * 0.8f, seam);
        // Along the swallowtail: its edges moved into the cloth by the seam's distance.
        float inward = hem * 0.8f / (float) Math.cos(Math.atan2(NOTCH * width, height / 2f));
        Path tailSeam = new Path(tailEdge);
        tailSeam.offset(-inward, 0f);
        canvas.drawPath(tailSeam, seam);
        // The words, printed into the cloth: the ink a little soft at its edges.
        Lettering lettering = lettering(community, width);
        String words = words(community);
        float baseline = height / 2f + lettering.capitalHeight / 2f;
        Paint letters = lettering.paint;
        letters.setColor(withAlpha(ink, 110));
        letters.setMaskFilter(new BlurMaskFilter(Math.max(0.8f, 2.2f * k), BlurMaskFilter.Blur.NORMAL));
        canvas.drawText(words, TEXT_CENTRE * width, baseline, letters);
        letters.setMaskFilter(null);
        letters.setColor(withAlpha(ink, 238));
        canvas.drawText(words, TEXT_CENTRE * width, baseline, letters);
        // Soft creases where it was folded in its packet: across the middle and at a
        // third and two thirds of its length.
        crease(canvas, true, height / 2f, header, width, height, k);
        crease(canvas, false, header + (width - header) * 0.34f, header, width, height, k);
        crease(canvas, false, header + (width - header) * 0.67f, header, width, height, k);
        // The pull of each grommet: a few faint folds fanning out into the cloth.
        for (float v : GROMMET_V) {
            float gy = v * height;
            for (int i = 0; i < 3; i++) {
                float angle = (float) Math.toRadians((v < 0.3f ? 1 : v > 0.7f ? -1 : (i - 1)) * (6f + 9f * i) + (random.nextFloat() - 0.5f) * 6f);
                float length = width * (0.05f + 0.05f * random.nextFloat());
                wrinkle(canvas, header, gy, angle, length, k);
            }
        }
        // The weave over everything, and a few heavier threads; too fine to show
        // (only a moire) in a small picture like the drawer's.
        if (width >= 1024) weave(canvas, width, height, Math.max(2, Math.round(3f * k)), random, false);
        Paint slub = new Paint(Paint.ANTI_ALIAS_FLAG);
        slub.setStrokeWidth(Math.max(1f, 1.2f * k));
        for (int i = 0; i < 40; i++) {
            slub.setColor(random.nextBoolean() ? Color.argb(14, 255, 255, 255) : Color.argb(16, 0, 0, 0));
            if (random.nextBoolean()) {
                float y = random.nextFloat() * height;
                float x = header + random.nextFloat() * width;
                canvas.drawLine(x, y, x + width * (0.05f + 0.2f * random.nextFloat()), y, slub);
            } else {
                float x = header + random.nextFloat() * (width - header);
                canvas.drawLine(x, 0, x, height, slub);
            }
        }
        // The canvas header, sewn on, with its grommets.
        canvasHeader(canvas, header, height, k, random);
        for (float v : GROMMET_V) grommet(canvas, GROMMET_U * width, v * height, GROMMET_RADIUS / LENGTH * width);
        // The swallowtail.
        Path tail = new Path();
        tail.moveTo((1f - NOTCH) * width, height / 2f);
        tail.lineTo(width + 4f, -4f);
        tail.lineTo(width + 4f, height + 4f);
        tail.close();
        Paint cut = new Paint(Paint.ANTI_ALIAS_FLAG);
        cut.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.CLEAR));
        canvas.drawPath(tail, cut);
        return bitmap;
    }

    /** A soft fold line: a shadowed side and a lit side. */
    private static void crease(Canvas canvas, boolean across, float at, float header, int width, int height, float k) {
        float band = 10f * k + 2f;
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        int[] colours = {Color.argb(0, 0, 0, 0), Color.argb(26, 0, 0, 0), Color.argb(20, 255, 255, 255), Color.argb(0, 255, 255, 255)};
        float[] stops = {0f, 0.45f, 0.55f, 1f};
        if (across) {
            paint.setShader(new LinearGradient(0, at - band, 0, at + band, colours, stops, Shader.TileMode.CLAMP));
            canvas.drawRect(header, at - band, width, at + band, paint);
        } else {
            paint.setShader(new LinearGradient(at - band, 0, at + band, 0, colours, stops, Shader.TileMode.CLAMP));
            canvas.drawRect(at - band, 0, at + band, height, paint);
        }
    }

    /** A tension fold running from (x, y) at angle for length: a narrow soft shadow beside a highlight. */
    private static void wrinkle(Canvas canvas, float x, float y, float angle, float length, float k) {
        float dx = (float) Math.cos(angle) * length;
        float dy = (float) Math.sin(angle) * length;
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(Paint.Cap.ROUND);
        paint.setStrokeWidth(7f * k + 1f);
        paint.setMaskFilter(new BlurMaskFilter(5f * k + 1f, BlurMaskFilter.Blur.NORMAL));
        paint.setShader(new LinearGradient(x, y, x + dx, y + dy, Color.argb(40, 0, 0, 0), Color.argb(0, 0, 0, 0), Shader.TileMode.CLAMP));
        canvas.drawLine(x, y, x + dx, y + dy, paint);
        float nx = -dy / length * 6f * k;
        float ny = dx / length * 6f * k;
        paint.setShader(new LinearGradient(x, y, x + dx, y + dy, Color.argb(26, 255, 255, 255), Color.argb(0, 255, 255, 255), Shader.TileMode.CLAMP));
        canvas.drawLine(x + nx, y + ny, x + dx * 0.9f + nx, y + dy * 0.9f + ny, paint);
    }

    /** A plain weave: threads over and under, each a little lighter or darker than the next. */
    private static void weave(Canvas canvas, int width, int height, int thread, Random random, boolean coarse) {
        int cells = 32;
        Bitmap tile = Bitmap.createBitmap(cells * thread, cells * thread, Bitmap.Config.ARGB_8888);
        Canvas tiles = new Canvas(tile);
        Paint cell = new Paint();
        int light = coarse ? 30 : 20;
        int dark = coarse ? 34 : 24;
        for (int y = 0; y < cells; y++) {
            for (int x = 0; x < cells; x++) {
                boolean over = (x + y) % 2 == 0;
                cell.setColor(over ? Color.argb(6 + random.nextInt(light), 255, 255, 255) : Color.argb(8 + random.nextInt(dark), 0, 0, 0));
                tiles.drawRect(x * thread, y * thread, (x + 1) * thread, (y + 1) * thread, cell);
                // The thread's own shading across it.
                cell.setColor(Color.argb(10, 0, 0, 0));
                if (over) tiles.drawRect(x * thread, (y + 1) * thread - Math.max(1, thread / 3), (x + 1) * thread, (y + 1) * thread, cell);
                else tiles.drawRect((x + 1) * thread - Math.max(1, thread / 3), y * thread, (x + 1) * thread, (y + 1) * thread, cell);
            }
        }
        Paint paint = new Paint();
        paint.setShader(new BitmapShader(tile, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT));
        canvas.drawRect(0, 0, width, height, paint);
        tile.recycle();
    }

    /** The heavy canvas strip along the hoist, sewn to the cloth with two lines of thread. */
    private static void canvasHeader(Canvas canvas, float header, int height, float k, Random random) {
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(Color.rgb(226, 220, 203));
        canvas.drawRect(0, 0, header, height, paint);
        canvas.save();
        canvas.clipRect(0, 0, header, height);
        if (k >= 0.5f) weave(canvas, Math.round(header), height, Math.max(2, Math.round(5f * k)), random, true);
        // Slightly grubby where hands hold it.
        paint.setShader(new LinearGradient(0, 0, header, 0, Color.argb(30, 90, 80, 60), Color.argb(0, 90, 80, 60), Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, header, height, paint);
        paint.setShader(null);
        canvas.restore();
        // The cloth's edge tucked under the header casts a little shadow onto the cloth.
        paint.setShader(new LinearGradient(header, 0, header + 10f * k + 2f, 0, Color.argb(60, 0, 0, 0), Color.argb(0, 0, 0, 0), Shader.TileMode.CLAMP));
        canvas.drawRect(header, 0, header + 10f * k + 2f, height, paint);
        paint.setShader(null);
        Paint seam = new Paint(Paint.ANTI_ALIAS_FLAG);
        seam.setStyle(Paint.Style.STROKE);
        seam.setStrokeWidth(Math.max(1f, 1.8f * k));
        seam.setColor(Color.argb(150, 120, 110, 92));
        canvas.drawLine(header * 0.82f, 0, header * 0.82f, height, seam);
        canvas.drawLine(header * 0.92f, 0, header * 0.92f, height, seam);
    }

    /** A brass grommet: a rolled ring with a hole through, catching the light on its upper side. */
    private static void grommet(Canvas canvas, float x, float y, float outer) {
        float inner = outer * 0.52f;
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        // Its shadow on the canvas, and the cloth bunched round it.
        paint.setColor(Color.argb(90, 40, 30, 15));
        paint.setMaskFilter(new BlurMaskFilter(outer * 0.35f, BlurMaskFilter.Blur.NORMAL));
        canvas.drawCircle(x + outer * 0.12f, y + outer * 0.2f, outer * 1.12f, paint);
        paint.setMaskFilter(null);
        // The ring, lit from above.
        paint.setShader(new LinearGradient(x - outer, y - outer, x + outer, y + outer,
            new int[] {Color.rgb(250, 226, 150), Color.rgb(205, 160, 72), Color.rgb(140, 100, 40), Color.rgb(96, 66, 26)},
            new float[] {0f, 0.35f, 0.7f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawCircle(x, y, outer, paint);
        // The roll: darker towards the hole.
        paint.setShader(new RadialGradient(x, y, outer, new int[] {Color.argb(120, 60, 40, 10), Color.argb(0, 60, 40, 10), Color.argb(0, 0, 0, 0), Color.argb(70, 40, 28, 8)},
            new float[] {inner / outer, inner / outer + 0.18f, 0.82f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawCircle(x, y, outer, paint);
        paint.setShader(null);
        // A bright glint on the upper left.
        Paint glint = new Paint(Paint.ANTI_ALIAS_FLAG);
        glint.setStyle(Paint.Style.STROKE);
        glint.setStrokeCap(Paint.Cap.ROUND);
        glint.setStrokeWidth(outer * 0.14f);
        glint.setColor(Color.argb(200, 255, 248, 220));
        float mid = (outer + inner) / 2f;
        canvas.drawArc(new RectF(x - mid, y - mid, x + mid, y + mid), 200f, 70f, false, glint);
        // The hole, where the ring through it and the pole's shadow show.
        paint.setShader(new RadialGradient(x - inner * 0.2f, y - inner * 0.25f, inner, Color.rgb(48, 40, 30), Color.rgb(18, 14, 10), Shader.TileMode.CLAMP));
        canvas.drawCircle(x, y, inner, paint);
        paint.setShader(null);
    }

    /** The banner's pole: varnished hardwood, its grain running along it (texture v along the pole, u round it). */
    static Bitmap pole() {
        int width = 64;
        int height = 1024;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(Color.rgb(98, 68, 44));
        Random random = new Random(2026);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setStyle(Paint.Style.STROKE);
        // Grain: long streaks, some dark, some pale, wandering a little.
        for (int i = 0; i < 46; i++) {
            float x = random.nextFloat() * width;
            paint.setStrokeWidth(0.5f + 2.2f * random.nextFloat());
            paint.setColor(random.nextFloat() < 0.65f ? Color.argb(30 + random.nextInt(50), 40, 22, 10) : Color.argb(18 + random.nextInt(26), 200, 150, 100));
            Path streak = new Path();
            streak.moveTo(x, 0);
            for (int y = 48; y <= height + 48; y += 48) streak.lineTo(x + (random.nextFloat() - 0.5f) * 2.5f, y);
            canvas.drawPath(streak, paint);
        }
        // Pores: tiny dark dashes along the grain.
        paint.setStrokeWidth(1f);
        for (int i = 0; i < 700; i++) {
            float x = random.nextFloat() * width;
            float y = random.nextFloat() * height;
            paint.setColor(Color.argb(40 + random.nextInt(40), 30, 18, 8));
            canvas.drawLine(x, y, x, y + 2f + 5f * random.nextFloat(), paint);
        }
        // A knot or two.
        paint.setStyle(Paint.Style.FILL);
        for (int i = 0; i < 2; i++) {
            float x = random.nextFloat() * width;
            float y = 200f + random.nextFloat() * 600f;
            paint.setShader(new RadialGradient(x, y, 7f, Color.argb(150, 50, 30, 14), Color.argb(0, 50, 30, 14), Shader.TileMode.CLAMP));
            canvas.drawOval(new RectF(x - 5f, y - 12f, x + 5f, y + 12f), paint);
        }
        paint.setShader(null);
        return bitmap;
    }

    /** A drawer tile: the banner flying from its wooden pole, with a gentle wave. */
    static Bitmap tile(ArPlace.Phrase community) {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        Bitmap wood = pole();
        canvas.drawBitmap(wood, new Rect(0, 0, 16, 1024), new RectF(14, 40, 22, 240), paint);
        wood.recycle();
        paint.setShader(new RadialGradient(16, 33, 10, Color.rgb(250, 220, 130), Color.rgb(170, 125, 40), Shader.TileMode.CLAMP));
        canvas.drawCircle(18, 36, 9, paint);
        paint.setShader(null);
        Bitmap cloth = cloth(community, 720);
        // Bent into a slow wave as it flies.
        int columns = 24;
        float left = 22f;
        float length = 230f;
        float high = length * HEIGHT / LENGTH;
        float[] mesh = new float[(columns + 1) * 2 * 2];
        for (int c = 0; c <= columns; c++) {
            float along = c / (float) columns;
            float lift = 7f * along * (float) Math.sin(along * 4.2f - 0.6f) + 4f * along * along;
            float x = left + along * length * (1f - 0.04f * along);
            mesh[c * 2] = x;
            mesh[c * 2 + 1] = 46f + lift;
            mesh[(columns + 1) * 2 + c * 2] = x;
            mesh[(columns + 1) * 2 + c * 2 + 1] = 46f + lift + high;
        }
        canvas.drawBitmapMesh(cloth, columns, 1, mesh, 0, null, 0, paint);
        cloth.recycle();
        return bitmap;
    }

    private static int shade(int color, float factor) {
        return Color.rgb(Math.round(Color.red(color) * factor), Math.round(Color.green(color) * factor), Math.round(Color.blue(color) * factor));
    }

    private static int withAlpha(int color, int alpha) {
        return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color));
    }
}
