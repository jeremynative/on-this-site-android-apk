package com.nativelongisland.onthissite;

import android.graphics.Bitmap;
import android.graphics.BlurMaskFilter;
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
    /**
     * The small label a recognized thing floats as, on the thing itself: what it
     * is (in English, small) over its words. The opened card has the rest.
     */
    static Bitmap objectLabel(ArScene.Item item) {
        int width = 720;
        int pad = 30;
        int accent = layerColor(item.layer);
        TextPaint whatPaint = textPaint(30, accent, true);
        whatPaint.setLetterSpacing(0.08f);
        TextPaint wordPaint = textPaint(64, Color.WHITE, true);
        StaticLayout what = layout(item.title.toUpperCase(java.util.Locale.US), whatPaint, width - pad * 2);
        StaticLayout words = layout(item.brief, wordPaint, width - pad * 2);
        int height = pad + what.getHeight() + 6 + words.getHeight() + pad;
        Bitmap label = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(label);
        Paint background = new Paint(Paint.ANTI_ALIAS_FLAG);
        background.setColor(Color.argb(215, 18, 24, 22));
        canvas.drawRoundRect(new RectF(0, 0, width, height), 36, 36, background);
        Paint edge = new Paint(Paint.ANTI_ALIAS_FLAG);
        edge.setStyle(Paint.Style.STROKE);
        edge.setStrokeWidth(5);
        edge.setColor(accent);
        canvas.drawRoundRect(new RectF(2.5f, 2.5f, width - 2.5f, height - 2.5f), 34, 34, edge);
        canvas.translate(pad, pad);
        what.draw(canvas);
        canvas.translate(0, what.getHeight() + 6);
        words.draw(canvas);
        return label;
    }

    /**
     * The selfie's name tag, like the site's people greet: "Jeremy nutusuwis"
     * over "(Jeremy is my name)", or blanks to fill before a name is written.
     */
    static Bitmap nameTag(String name) {
        String who = name == null || name.trim().isEmpty() ? "_______" : name.trim();
        int width = 760;
        int pad = 34;
        int accent = Color.rgb(126, 211, 158);
        TextPaint namePaint = textPaint(70, Color.WHITE, true);
        TextPaint meaningPaint = textPaint(36, Color.rgb(205, 222, 211), false);
        StaticLayout line = centred(who + " nutusuwis", namePaint, width - pad * 2, 3);
        StaticLayout meaning = centred("(" + who + " is my name)", meaningPaint, width - pad * 2, 2);
        int height = pad + line.getHeight() + 8 + meaning.getHeight() + pad;
        Bitmap label = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(label);
        Paint background = new Paint(Paint.ANTI_ALIAS_FLAG);
        background.setColor(Color.argb(215, 18, 24, 22));
        canvas.drawRoundRect(new RectF(0, 0, width, height), 40, 40, background);
        Paint edge = new Paint(Paint.ANTI_ALIAS_FLAG);
        edge.setStyle(Paint.Style.STROKE);
        edge.setStrokeWidth(5);
        edge.setColor(accent);
        canvas.drawRoundRect(new RectF(2.5f, 2.5f, width - 2.5f, height - 2.5f), 38, 38, edge);
        canvas.translate(pad, pad);
        line.draw(canvas);
        canvas.translate(0, line.getHeight() + 8);
        meaning.draw(canvas);
        return label;
    }

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
        boolean visitors = ArScene.KIND_VISITORS.equals(item.kind);
        String tag = phrase ? "LANGUAGE" : ArScene.KIND_AUDIO.equals(item.kind) ? "LISTEN"
            : visitors ? "VISITOR EXPERIENCES" : "ON THIS SITE";
        String headline = phrase && !item.word.isEmpty() ? item.word : (item.title.isEmpty() ? "Audio clip" : item.title);
        // A question waits for an answer; long text is a preview, read in full by tapping.
        boolean quiz = phrase && item.choices.length >= 2 && !item.answered;
        boolean longText = item.caption.length() > CARD_PREVIEW_CHARS;
        String preview = preview(item.caption);
        // The teaching comes first: sources are small print in the opened card. Only a
        // community find keeps its line (who shared it) on the floating card.
        boolean community = item.id.startsWith("story-") || item.id.startsWith("plant-") || item.id.startsWith("note-");
        String hint = quiz ? "Tap to answer: what does it mean?"
            : visitors ? (item.visits.length > 0 ? "Tap to see them and add yours" : "Tap to add yours")
            : longText || !item.more.isEmpty() ? "Tap to read more"
            : !item.audio.isEmpty() ? "Tap to hear it again" : null;
        StaticLayout[] lines = {
            layout(tag + (item.sample ? " · TEST CARD" : ""), tagPaint, inner),
            layout(headline, wordPaint, inner),
            phrase && !item.pronunciation.isEmpty() ? layout("say: " + item.pronunciation, sayPaint, inner) : null,
            phrase && !quiz && !item.meaning.isEmpty() ? layout(item.meaning, bodyPaint, inner) : null,
            // While unanswered, a question shows who asks it (the opening of its prompt).
            quiz && !item.prompt.isEmpty() ? layout(preview(item.prompt), bodyPaint, inner) : null,
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

    // The marker's size in its bitmap, and where its head sits as shares of that width:
    // the middle's depth from the top, and its radius.
    private static final int HERE_WIDTH = 520;
    static final float HERE_ORB_Y = 176f / HERE_WIDTH;
    static final float HERE_RING = 92f / HERE_WIDTH;

    /**
     * "You are here": a bubble drawn out into a drop that points down at the visitor's spot.
     * One shape with one white rim, lit from a white core like every orb, in a soft red halo,
     * with "You are here" and the land's name on a plate like the floating cards. Walked up to
     * or tapped, it opens into the land's card.
     */
    static Bitmap hereMarker(ArScene.Item item) {
        int width = HERE_WIDTH;
        float c = width / 2f;
        float radius = HERE_RING * width;
        float cy = HERE_ORB_Y * width;
        float tipY = cy + radius * 2.5f;
        String land = item.land.isEmpty() ? "Long Island" : item.land.replaceFirst("^On ", "");
        int textWidth = width - 72;
        StaticLayout you = centred("You are here", textPaint(40, Color.WHITE, true), textWidth, 1);
        StaticLayout where = centred(land, textPaint(32, Color.rgb(221, 221, 221), false), textWidth, 2);
        float plateWidth = Math.max(widest(you), widest(where)) + 64f;
        float plateHeight = you.getHeight() + 6f + where.getHeight() + 36f;
        float plateTop = tipY + 26f;
        Bitmap bitmap = Bitmap.createBitmap(width, Math.round(plateTop + plateHeight) + 8, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint halo = new Paint(Paint.ANTI_ALIAS_FLAG);
        halo.setColor(withAlpha(HERE_RED, 191));
        halo.setMaskFilter(new BlurMaskFilter(44f, BlurMaskFilter.Blur.NORMAL));
        canvas.drawPath(hereDrop(c, cy, radius * 1.12f, tipY + 10f), halo);
        android.graphics.Path drop = hereDrop(c, cy, radius, tipY);
        Paint body = new Paint(Paint.ANTI_ALIAS_FLAG);
        body.setShader(new RadialGradient(c, cy, radius * 2.3f,
            new int[] {Color.WHITE, 0xFFFFD7D0, withAlpha(HERE_RED, 245), withAlpha(0xFFB81F1A, 235)},
            new float[] {0f, 0.2f, 0.42f, 1f}, Shader.TileMode.CLAMP));
        canvas.drawPath(drop, body);
        Paint rim = new Paint(Paint.ANTI_ALIAS_FLAG);
        rim.setStyle(Paint.Style.STROKE);
        rim.setStrokeWidth(7);
        rim.setStrokeJoin(Paint.Join.ROUND);
        rim.setColor(Color.WHITE);
        canvas.drawPath(drop, rim);
        RectF plate = new RectF(c - plateWidth / 2f, plateTop, c + plateWidth / 2f, plateTop + plateHeight);
        Paint background = new Paint(Paint.ANTI_ALIAS_FLAG);
        background.setColor(Color.argb(225, 18, 24, 22));
        canvas.drawRoundRect(plate, 28, 28, background);
        Paint edge = new Paint(Paint.ANTI_ALIAS_FLAG);
        edge.setStyle(Paint.Style.STROKE);
        edge.setStrokeWidth(4);
        edge.setColor(HERE_RED);
        canvas.drawRoundRect(new RectF(plate.left + 2, plate.top + 2, plate.right - 2, plate.bottom - 2), 26, 26, edge);
        canvas.save();
        canvas.translate((width - textWidth) / 2f, plateTop + 18f);
        you.draw(canvas);
        canvas.translate(0, you.getHeight() + 6f);
        where.draw(canvas);
        canvas.restore();
        return bitmap;
    }

    /** A round head of the given radius tapering in smooth curves to a point straight below it. */
    private static android.graphics.Path hereDrop(float c, float cy, float radius, float tipY) {
        android.graphics.Path path = new android.graphics.Path();
        path.moveTo(c, tipY);
        path.cubicTo(c - radius * 0.18f, tipY - radius * 0.85f, c - radius, cy + radius * 0.8f, c - radius, cy);
        path.arcTo(new RectF(c - radius, cy - radius, c + radius, cy + radius), 180f, 180f, false);
        path.cubicTo(c + radius, cy + radius * 0.8f, c + radius * 0.18f, tipY - radius * 0.85f, c, tipY);
        path.close();
        return path;
    }

    private static float widest(StaticLayout layout) {
        float widest = 0f;
        for (int line = 0; line < layout.getLineCount(); line++) widest = Math.max(widest, layout.getLineWidth(line));
        return widest;
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
    // The ✕ badge's share of its picture's width; the clear rest round it is extra room to tap.
    static final float BADGE_SHARE = 0.6f;

    /** The ✕ at a bubble's, card's or sign's top right that puts it away: white on a dark disc. */
    static Bitmap dismissBadge() {
        int size = 160;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        float c = size / 2f;
        float r = size * BADGE_SHARE / 2f;
        Paint disc = new Paint(Paint.ANTI_ALIAS_FLAG);
        disc.setColor(Color.argb(225, 20, 26, 23));
        canvas.drawCircle(c, c, r, disc);
        Paint line = new Paint(Paint.ANTI_ALIAS_FLAG);
        line.setStyle(Paint.Style.STROKE);
        line.setColor(Color.WHITE);
        line.setStrokeWidth(5);
        canvas.drawCircle(c, c, r - 2.5f, line);
        line.setStrokeWidth(9);
        line.setStrokeCap(Paint.Cap.ROUND);
        float arm = r * 0.36f;
        canvas.drawLine(c - arm, c - arm, c + arm, c + arm, line);
        canvas.drawLine(c - arm, c + arm, c + arm, c - arm, line);
        return bitmap;
    }

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
