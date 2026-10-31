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

    /** Characters of a long caption shown on a floating card; the rest is read by tapping. */
    static final int CARD_PREVIEW_CHARS = 170;

    /** Language prompt or audio clip card, revealed once the visitor walks up to an orb. */
    static Bitmap promptCard(ArScene.Item item) {
        return promptCard(item, null);
    }

    /** The same card with the item's photo across the top. */
    static Bitmap promptCard(ArScene.Item item, Bitmap photo) {
        int width = 900;
        int pad = 44;
        int inner = width - pad * 2;
        int accent = layerColor(item.layer);
        TextPaint tagPaint = textPaint(28, accent, true);
        // A word is the headline of a language card; stories get a smaller title.
        TextPaint wordPaint = textPaint(ArScene.KIND_PHRASE.equals(item.kind) ? 76 : 54, Color.WHITE, true);
        TextPaint sayPaint = textPaint(36, Color.rgb(220, 220, 220), false);
        sayPaint.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.ITALIC));
        TextPaint bodyPaint = textPaint(36, Color.rgb(235, 235, 235), false);
        TextPaint hintPaint = textPaint(28, accent, true);

        boolean phrase = ArScene.KIND_PHRASE.equals(item.kind);
        String tag = phrase ? "LANGUAGE" : ArScene.KIND_AUDIO.equals(item.kind) ? "LISTEN" : "ON THIS SITE";
        String headline = phrase && !item.word.isEmpty() ? item.word : (item.title.isEmpty() ? "Audio clip" : item.title);
        // A question waits for an answer; long text is a preview, read in full by tapping.
        boolean quiz = phrase && item.choices.length >= 2 && !item.answered;
        boolean longText = item.caption.length() > CARD_PREVIEW_CHARS;
        String preview = longText ? item.caption.substring(0, item.caption.lastIndexOf(' ', CARD_PREVIEW_CHARS) > 0
            ? item.caption.lastIndexOf(' ', CARD_PREVIEW_CHARS) : CARD_PREVIEW_CHARS) + "\u2026" : item.caption;
        String hint = quiz ? "Tap to answer: what does it mean?"
            : longText ? "Tap to read more"
            : !item.audio.isEmpty() ? "Tap to hear it again" : null;
        StaticLayout[] lines = {
            layout(tag + (item.sample ? " · TEST CARD" : ""), tagPaint, inner),
            layout(headline, wordPaint, inner),
            phrase && !item.pronunciation.isEmpty() ? layout("say: " + item.pronunciation, sayPaint, inner) : null,
            phrase && !quiz && !item.meaning.isEmpty() ? layout(item.meaning, bodyPaint, inner) : null,
            !quiz && !preview.isEmpty() ? layout(preview, bodyPaint, inner) : null,
            hint != null ? layout(hint, hintPaint, inner) : null,
            !quiz && !item.credit.isEmpty() ? layout(item.credit, textPaint(24, Color.rgb(170, 178, 174), false), inner) : null,
        };
        int photoHeight = photo == null ? 0 : Math.min(Math.round(inner * 0.62f), Math.round(inner * photo.getHeight() / (float) photo.getWidth()));
        int height = pad + (photoHeight > 0 ? photoHeight + 22 : 0);
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
        if (photoHeight > 0) {
            // Centre-crop the photo into a rounded frame.
            float scale = Math.max(inner / (float) photo.getWidth(), photoHeight / (float) photo.getHeight());
            float w = photo.getWidth() * scale;
            float h = photo.getHeight() * scale;
            canvas.save();
            android.graphics.Path frame = new android.graphics.Path();
            frame.addRoundRect(new RectF(0, 0, inner, photoHeight), 24, 24, android.graphics.Path.Direction.CW);
            canvas.clipPath(frame);
            canvas.drawBitmap(photo, null, new RectF((inner - w) / 2, (photoHeight - h) / 2, (inner + w) / 2, (photoHeight + h) / 2), new Paint(Paint.FILTER_BITMAP_FLAG));
            canvas.restore();
            canvas.translate(0, photoHeight + 22);
        }
        for (StaticLayout line : lines) {
            if (line == null) continue;
            line.draw(canvas);
            canvas.translate(0, line.getHeight() + 14);
        }
        return card;
    }

    /**
     * A glowing bubble with a picture inside (a guide animal, or a place's
     * photo), shown before a nearby bubble has been opened.
     */
    static Bitmap bubble(Bitmap inner, int color) {
        int size = 256;
        Bitmap bitmap = orb(color);
        Canvas canvas = new Canvas(bitmap);
        float c = size / 2f;
        float r = c * 0.5f;
        Paint clear = new Paint(Paint.ANTI_ALIAS_FLAG);
        clear.setColor(Color.argb(235, 250, 250, 246));
        canvas.drawCircle(c, c, r, clear);
        // Figures (transparent PNGs) sit whole inside the bubble; photos fill it.
        float scale = inner.hasAlpha()
            ? Math.min(1.7f * r / inner.getWidth(), 1.7f * r / inner.getHeight())
            : Math.max(2 * r / inner.getWidth(), 2 * r / inner.getHeight());
        float w = inner.getWidth() * scale;
        float h = inner.getHeight() * scale;
        android.graphics.Path clip = new android.graphics.Path();
        clip.addCircle(c, c, r, android.graphics.Path.Direction.CW);
        canvas.save();
        canvas.clipPath(clip);
        canvas.drawBitmap(inner, null, new RectF(c - w / 2, c - h / 2, c + w / 2, c + h / 2), new Paint(Paint.FILTER_BITMAP_FLAG));
        canvas.restore();
        Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
        ring.setStyle(Paint.Style.STROKE);
        ring.setStrokeWidth(7);
        ring.setColor(Color.WHITE);
        canvas.drawCircle(c, c, r, ring);
        return bitmap;
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
