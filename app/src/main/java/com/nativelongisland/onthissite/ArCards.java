package com.nativelongisland.onthissite;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;

/** Bitmaps for the AR quads: framed photos, language/audio cards, orbs, floor rings. */
final class ArCards {
    private ArCards() {}

    static int layerColor(String layer) {
        switch (layer) {
            case ArScene.LAYER_FAMILY: return 0xFFE8A33D;
            case ArScene.LAYER_LANGUAGE: return 0xFF6BC58A;
            case ArScene.LAYER_AUDIO: return 0xFFC07BE0;
            default: return 0xFF4FA3D9;
        }
    }

    static String layerLabel(String layer) {
        switch (layer) {
            case ArScene.LAYER_FAMILY: return "Family photos";
            case ArScene.LAYER_LANGUAGE: return "Language";
            case ArScene.LAYER_AUDIO: return "Audio";
            default: return "Archival";
        }
    }

    /** A photo with a white frame and a caption strip, or the bare photo for before/after alignment. */
    static Bitmap photoCard(Bitmap photo, ArScene.Item item, boolean framed) {
        if (!framed) return photo;
        int width = 1024;
        int border = 28;
        int photoWidth = width - border * 2;
        int photoHeight = Math.round(photoWidth * (photo.getHeight() / (float) photo.getWidth()));
        TextPaint titlePaint = textPaint(40, Color.rgb(30, 30, 30), true);
        TextPaint creditPaint = textPaint(28, Color.rgb(90, 90, 90), false);
        StaticLayout title = layout(item.title.isEmpty() ? "Untitled photo" : item.title, titlePaint, photoWidth);
        StaticLayout credit = item.credit.isEmpty() ? null : layout(item.credit, creditPaint, photoWidth);
        int captionHeight = 22 + title.getHeight() + (credit == null ? 0 : 8 + credit.getHeight()) + 24;
        Bitmap card = Bitmap.createBitmap(width, border + photoHeight + captionHeight, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(card);
        canvas.drawColor(Color.rgb(250, 248, 242));
        Paint photoPaint = new Paint(Paint.FILTER_BITMAP_FLAG | Paint.ANTI_ALIAS_FLAG);
        canvas.drawBitmap(photo, null, new RectF(border, border, border + photoWidth, border + photoHeight), photoPaint);
        Paint stripe = new Paint();
        stripe.setColor(layerColor(item.layer));
        canvas.drawRect(0, card.getHeight() - 10, width, card.getHeight(), stripe);
        canvas.save();
        canvas.translate(border, border + photoHeight + 22);
        title.draw(canvas);
        if (credit != null) {
            canvas.translate(0, title.getHeight() + 8);
            credit.draw(canvas);
        }
        canvas.restore();
        return card;
    }

    /** Language prompt or audio clip card, revealed once the visitor walks up to an orb. */
    static Bitmap promptCard(ArScene.Item item) {
        int width = 900;
        int pad = 44;
        int inner = width - pad * 2;
        int accent = layerColor(item.layer);
        TextPaint tagPaint = textPaint(28, accent, true);
        TextPaint wordPaint = textPaint(76, Color.WHITE, true);
        TextPaint sayPaint = textPaint(36, Color.rgb(220, 220, 220), false);
        sayPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.ITALIC));
        TextPaint bodyPaint = textPaint(36, Color.rgb(235, 235, 235), false);
        TextPaint hintPaint = textPaint(28, accent, true);

        boolean phrase = ArScene.KIND_PHRASE.equals(item.kind);
        String tag = phrase ? "LANGUAGE" : "LISTEN";
        String headline = phrase && !item.word.isEmpty() ? item.word : (item.title.isEmpty() ? "Audio clip" : item.title);
        StaticLayout[] lines = {
            layout(tag + (item.sample ? " · TEST CARD" : ""), tagPaint, inner),
            layout(headline, wordPaint, inner),
            phrase && !item.pronunciation.isEmpty() ? layout("say: " + item.pronunciation, sayPaint, inner) : null,
            phrase && !item.meaning.isEmpty() ? layout(item.meaning, bodyPaint, inner) : null,
            !item.caption.isEmpty() ? layout(item.caption, bodyPaint, inner) : null,
            !item.audio.isEmpty() ? layout("Tap to hear it again", hintPaint, inner) : null,
        };
        int height = pad;
        for (StaticLayout line : lines) if (line != null) height += line.getHeight() + 14;
        height += pad - 14;
        Bitmap card = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(card);
        Paint background = new Paint(Paint.ANTI_ALIAS_FLAG);
        background.setColor(Color.argb(225, 18, 24, 22));
        canvas.drawRoundRect(new RectF(0, 0, width, height), 48, 48, background);
        Paint edge = new Paint(Paint.ANTI_ALIAS_FLAG);
        edge.setStyle(Paint.Style.STROKE);
        edge.setStrokeWidth(6);
        edge.setColor(accent);
        canvas.drawRoundRect(new RectF(3, 3, width - 3, height - 3), 46, 46, edge);
        canvas.translate(pad, pad);
        for (StaticLayout line : lines) {
            if (line == null) continue;
            line.draw(canvas);
            canvas.translate(0, line.getHeight() + 14);
        }
        return card;
    }

    /** Soft glowing orb shown before a discoverable prompt has been found. */
    static Bitmap orb(int color) {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        float c = size / 2f;
        Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
        glow.setShader(new RadialGradient(c, c, c,
            new int[] {Color.argb(255, 255, 255, 255), withAlpha(color, 220), withAlpha(color, 0)},
            new float[] {0f, 0.35f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawCircle(c, c, c, glow);
        Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
        ring.setStyle(Paint.Style.STROKE);
        ring.setStrokeWidth(6);
        ring.setColor(Color.WHITE);
        canvas.drawCircle(c, c, c * 0.42f, ring);
        return bitmap;
    }

    /** Flat floor ring; used for the placement reticle and the before/after "stand here" spot. */
    static Bitmap floorRing(int color, String label) {
        int size = 512;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        float c = size / 2f;
        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        fill.setColor(withAlpha(color, 70));
        canvas.drawCircle(c, c, c - 8, fill);
        Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
        ring.setStyle(Paint.Style.STROKE);
        ring.setStrokeWidth(16);
        ring.setColor(color);
        canvas.drawCircle(c, c, c - 12, ring);
        if (label != null && !label.isEmpty()) {
            TextPaint paint = textPaint(64, Color.WHITE, true);
            paint.setTextAlign(Paint.Align.CENTER);
            paint.setShadowLayer(6, 0, 2, Color.BLACK);
            canvas.drawText(label, c, c + 22, paint);
        } else {
            Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
            dot.setColor(Color.WHITE);
            canvas.drawCircle(c, c, 18, dot);
        }
        return bitmap;
    }

    private static int withAlpha(int color, int alpha) {
        return (color & 0x00FFFFFF) | (alpha << 24);
    }

    private static TextPaint textPaint(float size, int color, boolean bold) {
        TextPaint paint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        paint.setTextSize(size);
        paint.setColor(color);
        paint.setTypeface(bold ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
        return paint;
    }

    @SuppressWarnings("deprecation")
    private static StaticLayout layout(String text, TextPaint paint, int width) {
        return new StaticLayout(text, paint, width, Layout.Alignment.ALIGN_NORMAL, 1.08f, 0f, false);
    }
}
