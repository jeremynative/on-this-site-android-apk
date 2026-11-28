package com.nativelongisland.onthissite;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * Arrows a visitor sticks into a wall, the ground, a table or a tree in AR.
 * Each style is a real shaft (a wood, or carbon, aluminum or fiberglass) and
 * real fletching (a bird's feathers, or plastic vanes). Its shaft and fletching
 * are drawn here as textures and its parts built as meshes, so nothing is
 * downloaded.
 *
 * An arrow's own frame: the surface is y = 0, where the shaft goes in, and +Y
 * runs out along the shaft to the nock. The head is under the surface and only
 * drawn when the arrow hangs in the air.
 */
final class ArArrow {
    private ArArrow() {}

    // Along the arrow at scale 1 (metres): a 29-inch arrow with about 5 cm in the surface.
    static final float SHAFT_TOP = 0.70f;
    static final float NOCK_TOP = 0.716f;
    static final float AIR_BOTTOM = -0.05f;
    // The fletching starts this far from the axis, inside every shaft.
    private static final float INNER = 0.003f;
    // Feathers are longer and taller than plastic vanes (rear end, front end, height).
    private static final float[] FEATHER = {0.675f, 0.56f, 0.016f};
    private static final float[] VANE = {0.682f, 0.607f, 0.012f};

    enum Point { STONE, STEEL, BLUNT }

    /** One arrow: its shaft, fletching, nock and point. */
    static final class Style {
        final String id;
        final String label;
        // Wood and feathers, or carbon and plastic.
        final boolean traditional;
        // The shaft: what it is (for its grain), its colour, radius (metres) and shine.
        final String shaft;
        final int shaftColor;
        final float radius;
        final float gloss;
        // Painted rings ahead of the fletching, nock end first.
        final int[] crest;
        // A printed wrap under plastic vanes (0 for none).
        final int wrap;
        // The fletching: a bird's feathers by name, or plastic vanes in two colours.
        final String bird;
        final int hen;
        final int cock;
        final int nock;
        final Point point;
        final int pointColor;

        Style(String id, String label, boolean traditional, String shaft, int shaftColor, float radius, float gloss,
              int[] crest, int wrap, String bird, int hen, int cock, int nock, Point point, int pointColor) {
            this.id = id;
            this.label = label;
            this.traditional = traditional;
            this.shaft = shaft;
            this.shaftColor = shaftColor;
            this.radius = radius;
            this.gloss = gloss;
            this.crest = crest;
            this.wrap = wrap;
            this.bird = bird;
            this.hen = hen;
            this.cock = cock;
            this.nock = nock;
            this.point = point;
            this.pointColor = pointColor;
        }

        float[] fletching() {
            return traditional ? FEATHER : VANE;
        }
    }

    private static final int CARBON = Color.rgb(22, 22, 23);
    private static final int STEEL_COLOR = Color.rgb(184, 188, 194);

    // Wood and feathers first, then carbon and plastic. Arrowwood is the viburnum
    // named for its straight shoots.
    static final Style[] STYLES = {
        new Style("cedar-turkey", "Cedar, turkey", true, "cedar", Color.rgb(217, 179, 140), 0.0043f, 0.12f,
            new int[] {Color.rgb(178, 34, 34), Color.rgb(17, 17, 17), Color.rgb(178, 34, 34)}, 0, "turkey", 0, 0,
            Color.rgb(217, 179, 140), Point.STONE, Color.rgb(222, 218, 208)),
        new Style("arrowwood-goose", "Arrowwood, goose", true, "arrowwood", Color.rgb(226, 208, 170), 0.0045f, 0.08f,
            new int[] {}, 0, "goose", 0, 0, Color.rgb(226, 208, 170), Point.STONE, Color.rgb(168, 160, 146)),
        new Style("ash-jay", "Ash, blue jay", true, "ash", Color.rgb(230, 214, 178), 0.0043f, 0.12f,
            new int[] {Color.rgb(30, 79, 163), Color.rgb(242, 242, 242), Color.rgb(30, 79, 163)}, 0, "jay", 0, 0,
            Color.rgb(230, 214, 178), Point.STONE, Color.rgb(78, 76, 74)),
        new Style("hickory-flicker", "Hickory, flicker", true, "hickory", Color.rgb(184, 138, 91), 0.0044f, 0.14f,
            new int[] {Color.rgb(17, 17, 17), Color.rgb(242, 194, 48)}, 0, "flicker", 0, 0,
            Color.rgb(184, 138, 91), Point.STONE, Color.rgb(142, 59, 46)),
        new Style("walnut-crow", "Walnut, crow", true, "walnut", Color.rgb(92, 63, 44), 0.0043f, 0.2f,
            new int[] {Color.rgb(198, 40, 40)}, 0, "crow", 0, 0, Color.rgb(92, 63, 44), Point.STONE, Color.rgb(28, 28, 32)),
        new Style("birch-cardinal", "Birch, cardinal", true, "birch", Color.rgb(235, 221, 186), 0.0042f, 0.12f,
            new int[] {Color.rgb(17, 17, 17), Color.rgb(198, 40, 40), Color.rgb(17, 17, 17)}, 0, "cardinal", 0, 0,
            Color.rgb(235, 221, 186), Point.STONE, Color.rgb(168, 154, 130)),
        new Style("carbon-green", "Carbon, green", false, "carbon", CARBON, 0.0034f, 0.55f,
            new int[] {}, 0, "vane", Color.rgb(57, 230, 57), Color.rgb(255, 109, 0), Color.rgb(57, 230, 57), Point.STEEL, STEEL_COLOR),
        new Style("carbon-pink", "Carbon, pink", false, "carbon", CARBON, 0.0034f, 0.55f,
            new int[] {}, Color.rgb(245, 245, 245), "vane", Color.rgb(255, 46, 147), Color.rgb(245, 245, 245), Color.rgb(255, 46, 147),
            Point.STEEL, STEEL_COLOR),
        new Style("carbon-orange", "Carbon, orange", false, "carbon", CARBON, 0.0034f, 0.55f,
            new int[] {}, 0, "vane", Color.rgb(255, 106, 0), Color.rgb(255, 229, 0), Color.rgb(255, 229, 0), Point.STEEL, STEEL_COLOR),
        new Style("aluminum-blue", "Aluminum, blue", false, "aluminum", Color.rgb(45, 108, 210), 0.004f, 0.7f,
            new int[] {}, 0, "vane", Color.rgb(245, 245, 245), Color.rgb(45, 108, 210), Color.rgb(245, 245, 245), Point.STEEL, STEEL_COLOR),
        new Style("fiberglass-yellow", "Fiberglass, yellow", false, "fiberglass", Color.rgb(244, 194, 13), 0.0042f, 0.35f,
            new int[] {}, 0, "vane", Color.rgb(229, 57, 53), Color.rgb(245, 245, 245), Color.rgb(229, 57, 53), Point.BLUNT, Color.rgb(30, 30, 30)),
    };

    static Style style(String id) {
        for (Style style : STYLES) if (style.id.equals(id)) return style;
        return STYLES[0];
    }

    // ---- Textures ----

    /** Texture v of a point along the arrow: 0 at the nock, 1 at the head. */
    static float along(float y) {
        return (NOCK_TOP - y) / (NOCK_TOP - AIR_BOTTOM);
    }

    /**
     * The shaft, unrolled: around it across, along it down (nock at the top).
     * Its grain, then cresting rings, a wrap, and on wood the sinew bindings at
     * the fletching's ends, under the nock and round the point.
     */
    static Bitmap shaft(Style style) {
        int width = 32;
        int height = 1024;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor(style.shaftColor);
        Random random = new Random(style.id.hashCode());
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        switch (style.shaft) {
            case "carbon":
                // A fine woven sheen.
                for (int y = 0; y < height; y += 2) {
                    for (int x = 0; x < width; x += 2) {
                        paint.setColor(((x + y) / 2) % 2 == 0 ? Color.argb(26, 255, 255, 255) : Color.argb(30, 0, 0, 0));
                        canvas.drawRect(x, y, x + 2, y + 2, paint);
                    }
                }
                break;
            case "aluminum":
            case "fiberglass":
                // Brushed or drawn lengthwise.
                for (int x = 0; x < width; x++) {
                    paint.setColor(random.nextBoolean() ? Color.argb(10 + random.nextInt(18), 255, 255, 255) : Color.argb(10 + random.nextInt(14), 0, 0, 0));
                    canvas.drawRect(x, 0, x + 1, height, paint);
                }
                break;
            default:
                // The wood a little lighter and darker along its length, as one
                // stave never is the same all through.
                paint.setStyle(Paint.Style.FILL);
                for (int i = 0; i < 9; i++) {
                    float y = random.nextFloat() * height;
                    float reach = 60f + 160f * random.nextFloat();
                    int tint = random.nextBoolean() ? Color.argb(16 + random.nextInt(14), 255, 240, 210) : Color.argb(14 + random.nextInt(16), 60, 34, 12);
                    paint.setShader(new LinearGradient(0, y - reach, 0, y + reach, new int[] {tint & 0x00FFFFFF, tint, tint & 0x00FFFFFF},
                        null, Shader.TileMode.CLAMP));
                    canvas.drawRect(0, y - reach, width, y + reach, paint);
                }
                paint.setShader(null);
                // Grain: long streaks of darker late wood and paler early wood,
                // fine and broad, wandering a little, one or two running out.
                paint.setStyle(Paint.Style.STROKE);
                for (int i = 0; i < 34; i++) {
                    float x = random.nextFloat() * width;
                    paint.setStrokeWidth(0.4f + 2f * random.nextFloat() * random.nextFloat() * 2f);
                    paint.setColor(random.nextFloat() < 0.68f ? Color.argb(20 + random.nextInt(48), 66, 38, 14) : Color.argb(14 + random.nextInt(24), 255, 244, 222));
                    Path streak = new Path();
                    float top = random.nextFloat() < 0.15f ? random.nextFloat() * height : 0f;
                    streak.moveTo(x, top);
                    float drift = (random.nextFloat() - 0.5f) * 0.012f;
                    for (int y = (int) top + 48; y <= height + 48; y += 48) {
                        x += drift * 48f + (random.nextFloat() - 0.5f) * 1.6f;
                        streak.lineTo(x, y);
                    }
                    canvas.drawPath(streak, paint);
                }
                // Pores: tiny dark flecks along the grain.
                paint.setStrokeWidth(0.8f);
                for (int i = 0; i < 420; i++) {
                    float x = random.nextFloat() * width;
                    float y = random.nextFloat() * height;
                    paint.setColor(Color.argb(30 + random.nextInt(40), 50, 28, 10));
                    canvas.drawLine(x, y, x, y + 1.5f + 4f * random.nextFloat(), paint);
                }
                paint.setStyle(Paint.Style.FILL);
                // Darkened by hands at the nock end.
                paint.setShader(new LinearGradient(0, 0, 0, along(SHAFT_TOP - 0.12f) * height,
                    Color.argb(46, 52, 34, 16), Color.argb(0, 52, 34, 16), Shader.TileMode.CLAMP));
                canvas.drawRect(0, 0, width, along(SHAFT_TOP - 0.12f) * height, paint);
                paint.setShader(null);
                if ("arrowwood".equals(style.shaft)) {
                    // A shoot's leaf nodes, a little darker, every 12 cm or so.
                    for (float y = 0.62f; y > -0.04f; y -= 0.11f + 0.03f * random.nextFloat()) {
                        float row = along(y) * height;
                        paint.setColor(Color.argb(70, 110, 78, 40));
                        canvas.drawOval(new RectF(width * 0.2f, row - 5f, width * 0.55f, row + 5f), paint);
                        canvas.drawOval(new RectF(width * 0.7f, row - 4f, width * 0.95f, row + 4f), paint);
                    }
                }
                break;
        }
        paint.setStyle(Paint.Style.FILL);
        float[] fletch = style.fletching();
        if (style.wrap != 0) {
            paint.setColor(style.wrap);
            canvas.drawRect(0, along(fletch[0] + 0.01f) * height, width, along(fletch[1] - 0.012f) * height, paint);
        }
        // Cresting: bands of colour with a hair of shaft between.
        float top = fletch[1] - 0.012f;
        for (int color : style.crest) {
            paint.setColor(color);
            canvas.drawRect(0, along(top) * height, width, along(top - 0.009f) * height, paint);
            top -= 0.011f;
        }
        if (style.traditional) {
            sinew(canvas, width, height, fletch[0] + 0.006f, fletch[0] - 0.004f);
            sinew(canvas, width, height, fletch[1] + 0.005f, fletch[1] - 0.006f);
            sinew(canvas, width, height, SHAFT_TOP - 0.008f, SHAFT_TOP - 0.018f);
            sinew(canvas, width, height, AIR_BOTTOM + 0.028f, AIR_BOTTOM);
        } else {
            // The point's insert, seen only in the air.
            paint.setColor(Color.rgb(150, 154, 160));
            canvas.drawRect(0, along(AIR_BOTTOM + 0.008f) * height, width, height, paint);
        }
        return bitmap;
    }

    /** A sinew binding from y top to y bottom: amber, wound in fine turns. */
    private static void sinew(Canvas canvas, int width, int height, float top, float bottom) {
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        float from = along(top) * height;
        float to = along(bottom) * height;
        paint.setColor(Color.rgb(138, 104, 58));
        canvas.drawRect(0, from, width, to, paint);
        paint.setColor(Color.argb(90, 60, 38, 14));
        for (float y = from; y < to; y += 2.5f) canvas.drawRect(0, y, width, y + 0.9f, paint);
    }

    /**
     * The fletching, two pictures one above the other: the cock feather or vane
     * (the odd colour) on top, the two hens below. In each, the rear (nock) end
     * is at the left and the shaft along the bottom.
     */
    static Bitmap fletching(Style style) {
        int width = 512;
        int half = 256;
        Bitmap bitmap = Bitmap.createBitmap(width, half * 2, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        for (int which = 0; which < 2; which++) {
            boolean cock = which == 0;
            canvas.save();
            canvas.translate(0, which * half);
            canvas.clipRect(0, 2, width, half - 2);
            if (style.traditional) feather(canvas, width, half - 4, style.bird, cock, new Random(style.id.hashCode() * 31 + which));
            else vane(canvas, width, half - 4, cock ? style.cock : style.hen);
            canvas.restore();
        }
        return bitmap;
    }

    /** The cut feather's outline: height (0 to 1 of the picture) at t, 0 at the rear and 1 at the front. */
    private static float featherHeight(float t, boolean shield) {
        float h;
        if (shield) {
            // Shield cut: tall, a scoop, then down to the front.
            if (t < 0.46f) h = 0.92f - 0.08f * t;
            else if (t < 0.56f) h = 0.88f - 0.2f * (float) Math.sin((t - 0.46f) / 0.1f * Math.PI / 2);
            else h = 0.68f * (1f - (float) Math.pow((t - 0.56f) / 0.44f, 1.25f)) + 0.05f;
        } else {
            // Parabolic cut.
            h = 0.05f + 0.88f * (float) Math.pow(Math.sin((1f - t) * Math.PI / 2), 1.3);
        }
        // The rear corner rounded off.
        if (t < 0.05f) h = Math.min(h, 0.45f + 0.5f * t / 0.05f);
        return h;
    }

    private static void feather(Canvas canvas, int width, int height, String bird, boolean cock, Random random) {
        boolean shield = "turkey".equals(bird) || "goose".equals(bird);
        // The outline, a little ragged, with a few splits between barbs.
        Path shape = new Path();
        shape.moveTo(0, height);
        for (int x = 0; x <= width; x += 4) {
            float t = x / (float) width;
            float h = featherHeight(t, shield) * height + (random.nextFloat() - 0.5f) * 5f;
            shape.lineTo(x, height - h);
        }
        shape.lineTo(width, height);
        shape.close();
        canvas.save();
        canvas.clipPath(shape);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        int base = featherColor(bird, cock, 0.5f, 0.5f);
        canvas.drawColor(base);
        // The pattern, along the barbs: each runs from the quill out and back towards the nock.
        float slant = 0.75f;
        paint.setStrokeWidth(3.2f);
        paint.setStrokeCap(Paint.Cap.ROUND);
        for (float start = 0f; start < width + height * slant + 8f; start += 2.6f) {
            for (int segment = 0; segment < 8; segment++) {
                float lift0 = segment / 8f;
                float lift1 = (segment + 1) / 8f;
                float t = Math.max(0f, Math.min(1f, (start - height * slant * (lift0 + lift1) / 2f) / width));
                int color = featherColor(bird, cock, t, (lift0 + lift1) / 2f);
                float jitter = 0.9f + 0.2f * random.nextFloat();
                paint.setColor(Color.argb(255, clamp(Color.red(color) * jitter), clamp(Color.green(color) * jitter), clamp(Color.blue(color) * jitter)));
                canvas.drawLine(start - height * slant * lift0, height * (1f - lift0), start - height * slant * lift1, height * (1f - lift1), paint);
            }
        }
        // Light along the barbs' edges, and a darker line between some.
        paint.setStrokeWidth(1f);
        for (float start = 0f; start < width + height * slant; start += 5.2f) {
            paint.setColor(random.nextBoolean() ? Color.argb(28, 255, 255, 255) : Color.argb(40, 0, 0, 0));
            canvas.drawLine(start, height, start - height * slant, 0, paint);
        }
        // Splits: a few gaps opening from the edge along the barbs.
        Paint gap = new Paint(Paint.ANTI_ALIAS_FLAG);
        gap.setXfermode(new android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.CLEAR));
        gap.setStrokeWidth(3f);
        for (int i = 0; i < 3; i++) {
            float t = 0.15f + 0.6f * random.nextFloat();
            float top = height * (1f - featherHeight(t, shield));
            float depth = height * (0.12f + 0.16f * random.nextFloat());
            float x = t * width;
            canvas.drawLine(x, top - 4f, x + depth * slant, top + depth, gap);
        }
        // The quill along the bottom.
        paint.setColor(quillColor(bird));
        canvas.drawRect(0, height * 0.94f, width, height, paint);
        canvas.restore();
    }

    /** The feather's colour at t (0 rear to 1 front) and lift (0 at the quill to 1 at the edge). */
    private static int featherColor(String bird, boolean cock, float t, float lift) {
        switch (bird) {
            case "turkey": {
                // Wild turkey wing: dark brown barred with white, the bars a little
                // uneven and crossing the barbs; the cock feather pale with thin bars.
                float across = t * 7f - lift * 0.3f + 0.04f * (float) Math.sin(t * 41f + lift * 3f);
                float wave = (float) Math.sin(across * Math.PI * 2);
                boolean bar = cock ? wave > 0.55f : wave > 0.25f;
                if (cock) return bar ? Color.rgb(74, 54, 38) : mix(Color.rgb(236, 228, 210), Color.rgb(214, 202, 180), lift);
                return bar ? mix(Color.rgb(238, 232, 218), Color.rgb(222, 214, 196), lift) : mix(Color.rgb(64, 46, 32), Color.rgb(46, 33, 24), lift);
            }
            case "goose":
                // Canada goose grey with a paler fringe; the cock feather white.
                if (cock) return mix(Color.rgb(240, 238, 232), Color.rgb(226, 224, 218), lift);
                return mix(Color.rgb(104, 104, 102), Color.rgb(156, 154, 148), lift * lift);
            case "jay": {
                // Blue jay: bright blue with thin black bars; the cock feather's rear end white.
                if (cock && t < 0.2f) return Color.rgb(244, 244, 242);
                float wave = (float) Math.sin((t * 9f - lift * 0.3f) * Math.PI * 2);
                if (wave > 0.82f) return Color.rgb(16, 20, 26);
                return mix(Color.rgb(36, 98, 196), Color.rgb(84, 150, 232), lift);
            }
            case "flicker":
                // Northern flicker: golden yellow under the wing, dark at the tip.
                if (t < 0.12f) return Color.rgb(46, 42, 40);
                return mix(Color.rgb(236, 170, 30), Color.rgb(255, 210, 74), lift);
            case "crow":
                // Crow: black with a blue-violet sheen.
                return mix(Color.rgb(14, 14, 18), Color.rgb(44, 48, 92), Math.max(0f, 1f - Math.abs(t - 0.4f) * 2.2f) * lift);
            case "cardinal":
            default:
                // Northern cardinal: red, deeper at the quill; the cock feather darker.
                if (cock) return mix(Color.rgb(110, 20, 24), Color.rgb(150, 34, 34), lift);
                return mix(Color.rgb(160, 14, 36), Color.rgb(226, 52, 70), lift);
        }
    }

    private static int quillColor(String bird) {
        switch (bird) {
            case "flicker":
                return Color.rgb(242, 160, 30);
            case "crow":
                return Color.rgb(52, 52, 56);
            default:
                return Color.rgb(232, 224, 204);
        }
    }

    /** A plastic vane: low, tallest near the rear, a steep back edge; smooth and faintly see-through. */
    private static void vane(Canvas canvas, int width, int height, int color) {
        Path shape = new Path();
        shape.moveTo(0, height);
        for (int x = 0; x <= width; x += 4) {
            float t = x / (float) width;
            float h = 0.05f + 0.85f * (float) Math.pow(1f - t, 0.55);
            if (t < 0.1f) h *= 0.55f + 0.45f * t / 0.1f;
            shape.lineTo(x, height - h * height);
        }
        shape.lineTo(width, height);
        shape.close();
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        int light = mix(color, Color.WHITE, 0.25f);
        paint.setShader(new LinearGradient(0, 0, 0, height, Color.argb(236, Color.red(light), Color.green(light), Color.blue(light)),
            Color.argb(236, Color.red(color), Color.green(color), Color.blue(color)), Shader.TileMode.CLAMP));
        canvas.drawPath(shape, paint);
        paint.setShader(null);
        // The vane's base, glued along the shaft.
        paint.setColor(mix(color, Color.BLACK, 0.2f));
        canvas.drawRect(0, height * 0.9f, width, height, paint);
    }

    private static int mix(int a, int b, float share) {
        share = Math.max(0f, Math.min(1f, share));
        return Color.rgb(Math.round(Color.red(a) + (Color.red(b) - Color.red(a)) * share),
            Math.round(Color.green(a) + (Color.green(b) - Color.green(a)) * share),
            Math.round(Color.blue(a) + (Color.blue(b) - Color.blue(a)) * share));
    }

    private static int clamp(float value) {
        return Math.max(0, Math.min(255, Math.round(value)));
    }

    /** A drawer tile: the arrow across the tile, point down to the left, its fletching at the top right. */
    static Bitmap tile(Style style) {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        // Laid along x (head at 0, nock at the right), then turned.
        // Drawn bolder than true size, so it reads at the drawer's size.
        float length = 290f;
        // The point drawn longer than true too, so it keeps its shape beside the bolder shaft.
        float headTrue = 0.09f;
        float pixels = length / (NOCK_TOP - AIR_BOTTOM + headTrue);
        float thick = Math.max(10f, style.radius * 2f * pixels * 3.2f);
        canvas.translate(size / 2f, size / 2f);
        canvas.rotate(-40f);
        canvas.translate(-length / 2f, 0f);
        float headLength = headTrue * pixels;
        float shaftFrom = headLength;
        // The shaft texture turned so the nock is at the right.
        Bitmap shaft = shaft(style);
        Matrix turn = new Matrix();
        turn.postRotate(90f);
        Bitmap lying = Bitmap.createBitmap(shaft, 0, 0, shaft.getWidth(), shaft.getHeight(), turn, true);
        shaft.recycle();
        // Fletching: one vane above the shaft, one seen edge-on below.
        Bitmap fletch = fletching(style);
        float[] dims = style.fletching();
        float vaneRight = shaftFrom + (dims[0] - AIR_BOTTOM) * pixels;
        float vaneLeft = vaneRight - (dims[0] - dims[1]) * pixels * 1.3f;
        float vaneHigh = dims[2] * pixels * 3.4f;
        android.graphics.Rect hen = new android.graphics.Rect(0, 256, 512, 512);
        android.graphics.Rect cock = new android.graphics.Rect(0, 0, 512, 256);
        canvas.save();
        // Pictures have the rear at the left; here the rear is at the right.
        canvas.scale(-1f, 1f, (vaneLeft + vaneRight) / 2f, 0f);
        canvas.drawBitmap(fletch, cock, new RectF(vaneLeft, -thick / 2f - vaneHigh, vaneRight, -thick / 2f + 2f), paint);
        canvas.scale(1f, -0.6f, 0f, 0f);
        canvas.drawBitmap(fletch, hen, new RectF(vaneLeft, -thick / 2f - vaneHigh, vaneRight, -thick / 2f + 2f), paint);
        canvas.restore();
        canvas.drawBitmap(lying, null, new RectF(shaftFrom, -thick / 2f, length, thick / 2f), paint);
        lying.recycle();
        fletch.recycle();
        // A highlight along the shaft.
        paint.setColor(Color.argb(Math.round(60 + 120 * style.gloss), 255, 255, 255));
        canvas.drawRect(shaftFrom, -thick * 0.32f, length, -thick * 0.12f, paint);
        // The nock.
        paint.setColor(style.nock);
        float shaftEnd = shaftFrom + (SHAFT_TOP - AIR_BOTTOM) * pixels;
        canvas.drawRoundRect(new RectF(shaftEnd - 1f, -thick * 0.62f, length, thick * 0.62f), 3f, 3f, paint);
        // The point.
        Path head = new Path();
        paint.setColor(style.pointColor);
        if (style.point == Point.STONE) {
            // Leaf-shaped, wider than the shaft, narrowing into the binding.
            head.moveTo(0f, 0f);
            head.quadTo(shaftFrom * 0.45f, -thick * 1.05f, shaftFrom * 0.8f, -thick * 1.05f);
            head.lineTo(shaftFrom + 3f, -thick * 0.45f);
            head.lineTo(shaftFrom + 3f, thick * 0.45f);
            head.lineTo(shaftFrom * 0.8f, thick * 1.05f);
            head.quadTo(shaftFrom * 0.45f, thick * 1.05f, 0f, 0f);
            head.close();
        } else if (style.point == Point.STEEL) {
            head.moveTo(shaftFrom * 0.45f, 0f);
            head.quadTo(shaftFrom * 0.6f, -thick * 0.55f, shaftFrom + 2f, -thick * 0.55f);
            head.lineTo(shaftFrom + 2f, thick * 0.55f);
            head.quadTo(shaftFrom * 0.6f, thick * 0.55f, shaftFrom * 0.45f, 0f);
            head.close();
        } else {
            head.addRoundRect(new RectF(shaftFrom * 0.55f, -thick * 0.95f, shaftFrom + 4f, thick * 0.95f), thick * 0.8f, thick * 0.8f, Path.Direction.CW);
        }
        canvas.drawPath(head, paint);
        return bitmap;
    }

    // ---- Meshes (interleaved position, normal, texture coordinates), cached per style ----

    /** One style's parts, in the arrow's frame and at true size. */
    static final class Parts {
        ArGl.Mesh shaftInSurface;
        ArGl.Mesh shaftInAir;
        ArGl.Mesh nock;
        ArGl.Mesh fletching;
        ArGl.Mesh point;
    }

    private static final Map<String, Parts> PARTS = new HashMap<>();

    static synchronized Parts parts(Style style) {
        Parts parts = PARTS.get(style.id);
        if (parts != null) return parts;
        parts = new Parts();
        float r = style.radius;
        parts.shaftInSurface = lathe(new float[][] {{0f, 0f}, {0f, r}, {SHAFT_TOP, r}, {SHAFT_TOP, 0f}}, 12);
        parts.shaftInAir = lathe(new float[][] {{AIR_BOTTOM, 0f}, {AIR_BOTTOM, r}, {SHAFT_TOP, r}, {SHAFT_TOP, 0f}}, 12);
        parts.nock = nock(r);
        parts.fletching = fletchingMesh(style.fletching());
        switch (style.point) {
            case STEEL:
                // A field point.
                parts.point = lathe(new float[][] {
                    {AIR_BOTTOM - 0.024f, 0f}, {AIR_BOTTOM - 0.021f, r * 0.45f}, {AIR_BOTTOM - 0.015f, r * 0.85f},
                    {AIR_BOTTOM - 0.007f, r * 1.04f}, {AIR_BOTTOM + 0.004f, r * 1.05f}, {AIR_BOTTOM + 0.004f, 0f}}, 12);
                break;
            case BLUNT:
                // A rubber blunt.
                parts.point = lathe(new float[][] {
                    {AIR_BOTTOM - 0.016f, 0f}, {AIR_BOTTOM - 0.0155f, r * 0.9f}, {AIR_BOTTOM - 0.013f, r * 1.6f},
                    {AIR_BOTTOM - 0.008f, r * 1.9f}, {AIR_BOTTOM - 0.002f, r * 1.9f}, {AIR_BOTTOM + 0.008f, r * 1.25f}, {AIR_BOTTOM + 0.008f, 0f}}, 14);
                break;
            default:
                parts.point = stonePoint();
                break;
        }
        PARTS.put(style.id, parts);
        return parts;
    }

    /**
     * A surface of revolution about Y through the profile's (y, radius) points,
     * each step its own band so caps and shoulders keep sharp edges. Texture u
     * runs round it and v along the arrow (along()).
     */
    static ArGl.Mesh lathe(float[][] profile, int segments) {
        int bands = profile.length - 1;
        float[] vertices = new float[bands * (segments + 1) * 2 * 8];
        short[] indices = new short[bands * segments * 6];
        int v = 0;
        int n = 0;
        for (int b = 0; b < bands; b++) {
            float y0 = profile[b][0];
            float r0 = profile[b][1];
            float y1 = profile[b + 1][0];
            float r1 = profile[b + 1][1];
            // The band's outward normal in the (radius, y) plane.
            float dy = y1 - y0;
            float dr = r1 - r0;
            float length = (float) Math.hypot(dy, dr);
            float normalOut = length < 1e-9f ? 0f : dy / length;
            float normalUp = length < 1e-9f ? 1f : -dr / length;
            int first = v / 8;
            for (int i = 0; i <= segments; i++) {
                double angle = 2 * Math.PI * i / segments;
                float cx = (float) Math.cos(angle);
                float cz = (float) Math.sin(angle);
                float u = i / (float) segments;
                v = put(vertices, v, cx * r0, y0, cz * r0, cx * normalOut, normalUp, cz * normalOut, u, along(y0));
                v = put(vertices, v, cx * r1, y1, cz * r1, cx * normalOut, normalUp, cz * normalOut, u, along(y1));
            }
            for (int i = 0; i < segments; i++) {
                short a = (short) (first + i * 2);
                indices[n++] = a;
                indices[n++] = (short) (a + 1);
                indices[n++] = (short) (a + 2);
                indices[n++] = (short) (a + 1);
                indices[n++] = (short) (a + 3);
                indices[n++] = (short) (a + 2);
            }
        }
        return new ArGl.Mesh(vertices, indices);
    }

    /** The nock: a collar over the shaft's end and two prongs either side of the string's slot. */
    private static ArGl.Mesh nock(float r) {
        ArGl.Mesh collar = lathe(new float[][] {
            {SHAFT_TOP - 0.004f, 0f}, {SHAFT_TOP - 0.004f, r * 1.04f}, {SHAFT_TOP + 0.006f, r * 1.08f}, {SHAFT_TOP + 0.006f, 0f}}, 12);
        float slot = 0.0014f;
        float outer = r * 0.98f;
        ArGl.Mesh left = box(-outer, SHAFT_TOP + 0.006f, -r * 0.62f, -slot, NOCK_TOP, r * 0.62f);
        ArGl.Mesh right = box(slot, SHAFT_TOP + 0.006f, -r * 0.62f, outer, NOCK_TOP, r * 0.62f);
        return merge(collar, left, right);
    }

    /** Three vanes, 120 degrees apart, the first the cock vane (the top of the fletching picture). */
    private static ArGl.Mesh fletchingMesh(float[] dims) {
        float rear = dims[0];
        float front = dims[1];
        float high = dims[2];
        float[] vertices = new float[3 * 4 * 8];
        short[] indices = new short[3 * 6];
        int v = 0;
        int n = 0;
        for (int k = 0; k < 3; k++) {
            double angle = Math.PI / 2 + k * 2 * Math.PI / 3;
            float cx = (float) Math.cos(angle);
            float cz = (float) Math.sin(angle);
            // Facing round the shaft.
            float nx = -cz;
            float nz = cx;
            float top = k == 0 ? 0.008f : 0.508f;
            float bottom = k == 0 ? 0.49f : 0.99f;
            float in = INNER;
            float out = INNER + high;
            int first = v / 8;
            v = put(vertices, v, cx * in, rear, cz * in, nx, 0f, nz, 0f, bottom);
            v = put(vertices, v, cx * in, front, cz * in, nx, 0f, nz, 1f, bottom);
            v = put(vertices, v, cx * out, rear, cz * out, nx, 0f, nz, 0f, top);
            v = put(vertices, v, cx * out, front, cz * out, nx, 0f, nz, 1f, top);
            indices[n++] = (short) first;
            indices[n++] = (short) (first + 1);
            indices[n++] = (short) (first + 2);
            indices[n++] = (short) (first + 1);
            indices[n++] = (short) (first + 3);
            indices[n++] = (short) (first + 2);
        }
        return new ArGl.Mesh(vertices, indices);
    }

    /**
     * The stone of a knapped point (style.pointColor), seen flat: mottled and
     * speckled, and covered in overlapping flake scars, each a shallow scoop
     * shaded on one side and catching the light on the other, with the finer
     * pressure flakes along the edges.
     */
    static Bitmap stone(Style style) {
        int size = 256;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        int color = style.pointColor;
        canvas.drawColor(color);
        Random random = new Random(style.id.hashCode() * 7);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        // Mottling and banding in the stone itself.
        for (int i = 0; i < 26; i++) {
            float x = random.nextFloat() * size;
            float y = random.nextFloat() * size;
            float radius = 16f + 60f * random.nextFloat();
            int tint = random.nextBoolean() ? Color.argb(26 + random.nextInt(30), 255, 250, 240) : Color.argb(22 + random.nextInt(30), 0, 0, 0);
            paint.setShader(new android.graphics.RadialGradient(x, y, radius, tint, tint & 0x00FFFFFF, Shader.TileMode.CLAMP));
            canvas.drawCircle(x, y, radius, paint);
        }
        paint.setShader(null);
        // Flake scars: big ones in the middle, small ones nearer the edges.
        for (int i = 0; i < 46; i++) {
            boolean edge = i > 22;
            float x = edge ? (random.nextBoolean() ? 12f + random.nextFloat() * 30f : size - 12f - random.nextFloat() * 30f) : 40f + random.nextFloat() * (size - 80f);
            float y = random.nextFloat() * size;
            float wide = edge ? 10f + 12f * random.nextFloat() : 26f + 34f * random.nextFloat();
            float high = wide * (0.55f + 0.35f * random.nextFloat());
            canvas.save();
            canvas.rotate((random.nextFloat() - 0.5f) * 60f, x, y);
            RectF scar = new RectF(x - wide / 2f, y - high / 2f, x + wide / 2f, y + high / 2f);
            paint.setShader(new LinearGradient(scar.left, scar.top, scar.right, scar.bottom,
                new int[] {Color.argb(70, 255, 255, 255), Color.argb(0, 128, 128, 128), Color.argb(80, 0, 0, 0)}, null, Shader.TileMode.CLAMP));
            canvas.drawOval(scar, paint);
            // The ridge where it meets the next scar.
            Paint ridge = new Paint(Paint.ANTI_ALIAS_FLAG);
            ridge.setStyle(Paint.Style.STROKE);
            ridge.setStrokeWidth(1.2f);
            ridge.setColor(Color.argb(60, 255, 255, 255));
            canvas.drawArc(scar, 190f, 120f, false, ridge);
            canvas.restore();
        }
        paint.setShader(null);
        // Speckles.
        for (int i = 0; i < 260; i++) {
            paint.setColor(random.nextBoolean() ? Color.argb(70, 255, 255, 255) : Color.argb(70, 0, 0, 0));
            canvas.drawCircle(random.nextFloat() * size, random.nextFloat() * size, 0.6f + random.nextFloat() * 1.2f, paint);
        }
        return bitmap;
    }

    /** A knapped stone point: flat, leaf-shaped in outline, thick down its middle. */
    private static ArGl.Mesh stonePoint() {
        float base = AIR_BOTTOM + 0.006f;
        float tip = AIR_BOTTOM - 0.046f;
        float half = 0.012f;
        float thick = 0.0035f;
        // The outline round from the tip, with the middle's ridge front and back.
        float[][] edge = {
            {0f, tip}, {half * 0.55f, tip + 0.018f}, {half, base - 0.012f}, {half * 0.8f, base},
            {-half * 0.8f, base}, {-half, base - 0.012f}, {-half * 0.55f, tip + 0.018f},
        };
        float ridgeY = (base + tip) / 2f + 0.006f;
        float[][] faces = new float[edge.length * 2][];
        int count = 0;
        for (int side = -1; side <= 1; side += 2) {
            for (int i = 0; i < edge.length; i++) {
                float[] a = edge[i];
                float[] b = edge[(i + 1) % edge.length];
                faces[count++] = new float[] {a[0], a[1], 0f, b[0], b[1], 0f, 0f, ridgeY, side * thick};
            }
        }
        float[] vertices = new float[count * 3 * 8];
        short[] indices = new short[count * 3];
        int v = 0;
        for (int f = 0; f < count; f++) {
            float[] t = faces[f];
            float ux = t[3] - t[0];
            float uy = t[4] - t[1];
            float uz = t[5] - t[2];
            float wx = t[6] - t[0];
            float wy = t[7] - t[1];
            float wz = t[8] - t[2];
            float nx = uy * wz - uz * wy;
            float ny = uz * wx - ux * wz;
            float nz = ux * wy - uy * wx;
            float length = (float) Math.sqrt(nx * nx + ny * ny + nz * nz);
            for (int corner = 0; corner < 3; corner++) {
                // The stone's texture laid flat across it, from the tip (v 0) to the base (v 1).
                float u = (t[corner * 3] + half) / (2f * half);
                float w = (t[corner * 3 + 1] - tip) / (base - tip);
                v = put(vertices, v, t[corner * 3], t[corner * 3 + 1], t[corner * 3 + 2], nx / length, ny / length, nz / length, u, w);
                indices[f * 3 + corner] = (short) (f * 3 + corner);
            }
        }
        return new ArGl.Mesh(vertices, indices);
    }

    /** An axis-aligned box from (x0, y0, z0) to (x1, y1, z1), flat-shaded. */
    private static ArGl.Mesh box(float x0, float y0, float z0, float x1, float y1, float z1) {
        float[][][] quads = {
            {{x0, y0, z1}, {x1, y0, z1}, {x0, y1, z1}, {x1, y1, z1}, {0, 0, 1}},
            {{x1, y0, z0}, {x0, y0, z0}, {x1, y1, z0}, {x0, y1, z0}, {0, 0, -1}},
            {{x1, y0, z1}, {x1, y0, z0}, {x1, y1, z1}, {x1, y1, z0}, {1, 0, 0}},
            {{x0, y0, z0}, {x0, y0, z1}, {x0, y1, z0}, {x0, y1, z1}, {-1, 0, 0}},
            {{x0, y1, z1}, {x1, y1, z1}, {x0, y1, z0}, {x1, y1, z0}, {0, 1, 0}},
        };
        float[] vertices = new float[quads.length * 4 * 8];
        short[] indices = new short[quads.length * 6];
        int v = 0;
        for (int q = 0; q < quads.length; q++) {
            float[] normal = quads[q][4];
            for (int c = 0; c < 4; c++) v = put(vertices, v, quads[q][c][0], quads[q][c][1], quads[q][c][2], normal[0], normal[1], normal[2], 0f, 0f);
            int first = q * 4;
            indices[q * 6] = (short) first;
            indices[q * 6 + 1] = (short) (first + 1);
            indices[q * 6 + 2] = (short) (first + 2);
            indices[q * 6 + 3] = (short) (first + 1);
            indices[q * 6 + 4] = (short) (first + 3);
            indices[q * 6 + 5] = (short) (first + 2);
        }
        return new ArGl.Mesh(vertices, indices);
    }

    private static ArGl.Mesh merge(ArGl.Mesh... meshes) {
        int vertexFloats = 0;
        int indexCount = 0;
        for (ArGl.Mesh mesh : meshes) {
            vertexFloats += mesh.vertices.capacity();
            indexCount += mesh.count;
        }
        float[] vertices = new float[vertexFloats];
        short[] indices = new short[indexCount];
        int v = 0;
        int n = 0;
        for (ArGl.Mesh mesh : meshes) {
            int offset = v / 8;
            mesh.vertices.position(0);
            mesh.vertices.get(vertices, v, mesh.vertices.capacity());
            mesh.vertices.position(0);
            mesh.indices.position(0);
            for (int i = 0; i < mesh.count; i++) indices[n++] = (short) (mesh.indices.get(i) + offset);
            v += mesh.vertices.capacity();
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
