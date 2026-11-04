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

    /** Characters of a long caption shown on a floating card; the rest is read by tapping. */
    static final int CARD_PREVIEW_CHARS = 260;

    /**
     * The start of a long caption for a floating card: whole sentences where they fit
     * (a teaching is never cut mid-thought), else up to a word.
     */
    static String preview(String caption) {
        if (caption.length() <= CARD_PREVIEW_CHARS) return caption;
        String head = caption.substring(0, CARD_PREVIEW_CHARS);
        for (int i = head.length() - 2; i >= CARD_PREVIEW_CHARS / 3; i--) {
            char c = head.charAt(i);
            if (c == '\n') return head.substring(0, i).trim();
            if (c != '.' && c != '!' && c != '?') continue;
            int j = i + 1;
            while (j < head.length() && (head.charAt(j) == '\u201d' || head.charAt(j) == '"' || head.charAt(j) == ')')) j++;
            if (j < head.length() && Character.isWhitespace(head.charAt(j))) return head.substring(0, j);
        }
        int space = head.lastIndexOf(' ');
        return head.substring(0, space > 0 ? space : CARD_PREVIEW_CHARS) + "\u2026";
    }

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
        String preview = preview(item.caption);
        // The teaching comes first: sources are small print in the opened card. Only a
        // community find keeps its line (who shared it) on the floating card.
        boolean community = item.id.startsWith("story-") || item.id.startsWith("plant-") || item.id.startsWith("note-");
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
            !quiz && community && !item.credit.isEmpty() ? layout(item.credit, textPaint(24, Color.rgb(170, 178, 174), false), inner) : null,
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

    static final int HERE_RED = 0xFFE0352B;

    /**
     * "You are here": a glowing red orb like the other bubbles, shaped as a map pin
     * whose point rests on the visitor's spot, with a "you" dot inside and the land's
     * name beneath. Opening it reads the land (and what is near) in full.
     */
    static Bitmap hereMarker(ArScene.Item item) {
        int width = 420;
        float c = width / 2f;
        float cy = 150f;
        float head = 84f;
        float tip = cy + head + 66f;
        TextPaint youPaint = textPaint(34, Color.WHITE, true);
        TextPaint landPaint = textPaint(30, Color.WHITE, false);
        for (TextPaint paint : new TextPaint[] {youPaint, landPaint}) paint.setShadowLayer(8, 0, 2, Color.argb(230, 0, 0, 0));
        String land = item.land.isEmpty() ? "Long Island" : item.land.replaceFirst("^On ", "");
        StaticLayout you = centred("You are here", youPaint, width - 20, 1);
        StaticLayout where = centred(land, landPaint, width - 20, 2);
        int labelTop = Math.round(tip) + 14;
        Bitmap bitmap = Bitmap.createBitmap(width, labelTop + you.getHeight() + 4 + where.getHeight() + 12, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        // The same soft glow as every orb, in red.
        Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
        glow.setShader(new RadialGradient(c, cy, 150f,
            new int[] {Color.argb(255, 255, 255, 255), withAlpha(HERE_RED, 220), withAlpha(HERE_RED, 0)},
            new float[] {0f, 0.45f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawCircle(c, cy, 150f, glow);
        // The pin: a round head and a point, its sides tangent to the head.
        double cos = head / (tip - cy);
        double sin = Math.sqrt(1 - cos * cos);
        android.graphics.Path pin = new android.graphics.Path();
        pin.addCircle(c, cy, head, android.graphics.Path.Direction.CW);
        android.graphics.Path point = new android.graphics.Path();
        point.moveTo(c - (float) (head * sin), cy + (float) (head * cos));
        point.lineTo(c, tip);
        point.lineTo(c + (float) (head * sin), cy + (float) (head * cos));
        point.lineTo(c, cy);
        point.close();
        pin.op(point, android.graphics.Path.Op.UNION);
        Paint red = new Paint(Paint.ANTI_ALIAS_FLAG);
        red.setColor(HERE_RED);
        red.setShadowLayer(10, 0, 4, Color.argb(150, 0, 0, 0));
        canvas.drawPath(pin, red);
        Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
        ring.setStyle(Paint.Style.STROKE);
        ring.setStrokeWidth(7);
        ring.setColor(Color.WHITE);
        canvas.drawPath(pin, ring);
        // Inside, as in the other bubbles: a pale disc, here holding a "you" dot.
        Paint disc = new Paint(Paint.ANTI_ALIAS_FLAG);
        disc.setColor(Color.argb(240, 250, 250, 246));
        canvas.drawCircle(c, cy, head * 0.66f, disc);
        Paint halo = new Paint(Paint.ANTI_ALIAS_FLAG);
        halo.setColor(withAlpha(HERE_RED, 70));
        canvas.drawCircle(c, cy, head * 0.42f, halo);
        Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
        dot.setColor(HERE_RED);
        canvas.drawCircle(c, cy, head * 0.24f, dot);
        canvas.save();
        canvas.translate(10, labelTop);
        you.draw(canvas);
        canvas.translate(0, you.getHeight() + 4);
        where.draw(canvas);
        canvas.restore();
        return bitmap;
    }

    /**
     * A nearby site's sign in the sky: its photo, name, distance and one line, with a
     * small pointer down toward the horizon where the site lies.
     */
    static Bitmap skySign(ArScene.Item item, Bitmap photo) {
        int width = 680;
        int pad = 28;
        int photoSize = photo == null ? 0 : 136;
        int text = width - pad * 2 - (photoSize > 0 ? photoSize + 22 : 0);
        int accent = layerColor(item.layer);
        String name = !item.name.isEmpty() ? item.name : item.title.replaceFirst("^Nearby: ", "");
        String far = Double.isNaN(item.distanceM) ? "" : item.distanceM < 1000
            ? Math.round(item.distanceM) + " m away"
            : String.format(java.util.Locale.US, "%.1f km away", item.distanceM / 1000);
        StaticLayout title = layout(name, textPaint(40, Color.WHITE, true), text, 2);
        StaticLayout distance = far.isEmpty() ? null : layout(far, textPaint(30, accent, true), text, 1);
        StaticLayout brief = item.brief.isEmpty() ? null : layout(item.brief, textPaint(28, Color.rgb(222, 226, 224), false), text, 3);
        int textHeight = title.getHeight() + (distance == null ? 0 : 8 + distance.getHeight()) + (brief == null ? 0 : 10 + brief.getHeight());
        int cardHeight = pad * 2 + Math.max(photoSize, textHeight);
        int pointer = 34;
        Bitmap bitmap = Bitmap.createBitmap(width, cardHeight + pointer, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint background = new Paint(Paint.ANTI_ALIAS_FLAG);
        background.setColor(Color.argb(222, 18, 24, 22));
        canvas.drawRoundRect(new RectF(0, 0, width, cardHeight), 36, 36, background);
        android.graphics.Path tip = new android.graphics.Path();
        tip.moveTo(width / 2f - 30, cardHeight - 2);
        tip.lineTo(width / 2f + 30, cardHeight - 2);
        tip.lineTo(width / 2f, cardHeight + pointer);
        tip.close();
        canvas.drawPath(tip, background);
        Paint edge = new Paint(Paint.ANTI_ALIAS_FLAG);
        edge.setStyle(Paint.Style.STROKE);
        edge.setStrokeWidth(5);
        edge.setColor(accent);
        canvas.drawRoundRect(new RectF(2.5f, 2.5f, width - 2.5f, cardHeight - 2.5f), 34, 34, edge);
        float x = pad;
        if (photoSize > 0) {
            float top = (cardHeight - photoSize) / 2f;
            float scale = Math.max(photoSize / (float) photo.getWidth(), photoSize / (float) photo.getHeight());
            float w = photo.getWidth() * scale;
            float h = photo.getHeight() * scale;
            android.graphics.Path round = new android.graphics.Path();
            round.addCircle(x + photoSize / 2f, top + photoSize / 2f, photoSize / 2f, android.graphics.Path.Direction.CW);
            canvas.save();
            canvas.clipPath(round);
            canvas.drawBitmap(photo, null, new RectF(x + (photoSize - w) / 2, top + (photoSize - h) / 2, x + (photoSize + w) / 2, top + (photoSize + h) / 2), new Paint(Paint.FILTER_BITMAP_FLAG));
            canvas.restore();
            Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
            ring.setStyle(Paint.Style.STROKE);
            ring.setStrokeWidth(5);
            ring.setColor(Color.WHITE);
            canvas.drawCircle(x + photoSize / 2f, top + photoSize / 2f, photoSize / 2f, ring);
            x += photoSize + 22;
        }
        canvas.save();
        canvas.translate(x, (cardHeight - textHeight) / 2f);
        title.draw(canvas);
        canvas.translate(0, title.getHeight());
        if (distance != null) {
            canvas.translate(0, 8);
            distance.draw(canvas);
            canvas.translate(0, distance.getHeight());
        }
        if (brief != null) {
            canvas.translate(0, 10);
            brief.draw(canvas);
        }
        canvas.restore();
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

    /** Centred lines (at most maxLines), for the labels under a marker. */
    private static StaticLayout centred(String text, TextPaint paint, int width, int maxLines) {
        return StaticLayout.Builder.obtain(text, 0, text.length(), paint, width)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setLineSpacing(0f, 1.08f)
            .setIncludePad(false)
            .setMaxLines(maxLines)
            .setEllipsize(android.text.TextUtils.TruncateAt.END)
            .build();
    }

    /** At most maxLines, the last ending in an ellipsis. */
    private static StaticLayout layout(String text, TextPaint paint, int width, int maxLines) {
        return StaticLayout.Builder.obtain(text, 0, text.length(), paint, width)
            .setLineSpacing(0f, 1.08f)
            .setIncludePad(false)
            .setMaxLines(maxLines)
            .setEllipsize(android.text.TextUtils.TruncateAt.END)
            .build();
    }
}
