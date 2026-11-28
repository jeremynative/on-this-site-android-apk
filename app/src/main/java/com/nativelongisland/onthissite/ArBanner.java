package com.nativelongisland.onthissite;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.Typeface;
import java.util.Locale;

/**
 * Land banners: a long swallowtail banner on a pole, one for each ancestral
 * community, reading "<Name> Land" in one line of heavy capitals. Each is the
 * community's colour from the map, made into a cloth colour, with black or white
 * lettering, whichever reads better; Shinnecock is yellow and Unkechaug black, as
 * Jeremy asked. The banner flies from the flag's pole and waves slowly (ArGl's
 * calm wave), and its back reads the right way round too.
 */
final class ArBanner {
    private ArBanner() {}

    // At scale 1 (metres): long and narrow, at the top of the flag's 2.2 m pole.
    static final float LENGTH = 1.5f;
    static final float HEIGHT = 0.36f;
    static final float TOP_GAP = 0.06f;
    // How far the free end waves (metres).
    static final float WAVE = 0.09f;
    // Along the cloth (texture u, 0 at the pole): the sleeve round the pole, and
    // how deep the swallowtail cuts in at the middle.
    static final float SLEEVE = 0.035f;
    static final float NOTCH = 0.13f;
    // The lettering's band, between the sleeve and the swallowtail, with a little
    // plain cloth each side. On the back it is shown un-mirrored (ArGl u_Mirror).
    static final float TEXT_START = SLEEVE + 0.012f;
    static final float TEXT_END = 1f - NOTCH - 0.012f;
    static final float TEXT_CENTRE = (TEXT_START + TEXT_END) / 2f;
    static final float TEXT_HALF = (TEXT_END - TEXT_START) / 2f;

    /** The two-sided cloth's un-mirrored band for ArGl.MeshDraw.mirror. */
    static float[] mirror() {
        return new float[] {TEXT_CENTRE, TEXT_HALF - 0.015f, TEXT_HALF};
    }

    /** The banner's words: the community's name and "Land". */
    static String words(ArPlace.Phrase community) {
        return community.title.toUpperCase(Locale.US) + " LAND";
    }

    /** The cloth's colour and its lettering's (black or white). */
    static int[] colours(ArPlace.Phrase community) {
        // Jeremy's choices: Shinnecock on yellow, Unkechaug white on black.
        if ("Unkechaug".equals(community.title)) return new int[] {Color.rgb(16, 16, 16), Color.WHITE};
        float[] hsv = new float[3];
        Color.colorToHSV(community.mapColor, hsv);
        // Dyed cloth: no neon, and the darkest colours kept clear of black.
        hsv[1] = Math.min(hsv[1], 0.88f);
        hsv[2] = Math.max(0.3f, Math.min(hsv[2], 0.95f));
        int ground = Color.HSVToColor(hsv);
        int letters = contrast(ground, Color.WHITE) >= contrast(ground, Color.BLACK) ? Color.WHITE : Color.BLACK;
        // At least 4.5 to 1 (the usual bar for text): darker under white letters, lighter under black.
        for (int step = 0; step < 40 && contrast(ground, letters) < 4.5f; step++) {
            hsv[2] = letters == Color.WHITE ? hsv[2] * 0.96f : Math.min(1f, hsv[2] * 1.04f);
            if (letters == Color.BLACK) hsv[1] *= 0.97f;
            ground = Color.HSVToColor(hsv);
        }
        return new int[] {ground, letters};
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

    /**
     * The cloth, width pixels long (the pole at the left): the colour with a
     * darker sleeve, a trim along each long edge in the lettering's colour, the
     * words between, and the swallowtail cut out of the free end.
     */
    static Bitmap cloth(ArPlace.Phrase community, int width) {
        int height = Math.round(width * HEIGHT / LENGTH);
        int[] colours = colours(community);
        int ground = colours[0];
        int ink = colours[1];
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(ground);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        // The sleeve the pole runs through, a shade darker, stitched along its edge.
        float sleeve = SLEEVE * width;
        paint.setColor(shade(ground, 0.82f));
        canvas.drawRect(0, 0, sleeve, height, paint);
        Paint stitch = new Paint(Paint.ANTI_ALIAS_FLAG);
        stitch.setStyle(Paint.Style.STROKE);
        stitch.setStrokeWidth(Math.max(1f, height * 0.008f));
        stitch.setColor(withAlpha(ink, 110));
        stitch.setPathEffect(new DashPathEffect(new float[] {height * 0.03f, height * 0.02f}, 0f));
        canvas.drawLine(sleeve, 0, sleeve, height, stitch);
        // A trim along each long edge.
        paint.setColor(ink);
        float inset = height * 0.075f;
        float trim = height * 0.032f;
        canvas.drawRect(sleeve, inset, width, inset + trim, paint);
        canvas.drawRect(sleeve, height - inset - trim, width, height - inset, paint);
        // The words, as large as fit between the trims and inside the band.
        Paint letters = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        letters.setTypeface(Typeface.create("sans-serif-condensed", Typeface.BOLD));
        letters.setColor(ink);
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
        float size = Math.min(bySpace, byHeight);
        letters.setTextSize(size);
        float capitalHeight = capitalPer100 * size / 100f;
        canvas.drawText(words, TEXT_CENTRE * width, height / 2f + capitalHeight / 2f, letters);
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

    /** A drawer tile: the banner flying from its pole, with a gentle wave. */
    static Bitmap tile(ArPlace.Phrase community, float[] poleColor) {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        paint.setColor(Color.rgb(Math.round(poleColor[0] * 255), Math.round(poleColor[1] * 255), Math.round(poleColor[2] * 255)));
        canvas.drawRect(14, 40, 22, 240, paint);
        paint.setColor(Color.rgb(214, 172, 66));
        canvas.drawCircle(18, 36, 9, paint);
        Bitmap cloth = cloth(community, 720);
        // Bent into a slow wave as it flies.
        int columns = 24;
        float left = 22f;
        float length = 230f;
        float high = length * HEIGHT / LENGTH;
        float[] mesh = new float[(columns + 1) * 2 * 2];
        for (int c = 0; c <= columns; c++) {
            float along = c / (float) columns;
            float lift = 7f * along * (float) Math.sin(along * 4.2f - 0.6f);
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
