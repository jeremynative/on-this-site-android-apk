package com.nativelongisland.onthissite;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.os.SystemClock;
import android.view.View;

/**
 * Full-screen tint over the camera view showing scan coverage for what the
 * phone is looking at: red = not captured yet, orange = one photo, yellow =
 * two, green = three or more. Untextured areas stay clear. Fades out if the
 * answer gets stale (the phone has moved on).
 */
final class CoverageOverlayView extends View {
    private static final long STALE_MS = 2500;
    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint edge = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path tile = new Path();
    private int[][] grid;
    private float[] vertices;
    private long updatedAt;

    CoverageOverlayView(Context context) {
        super(context);
        edge.setStyle(Paint.Style.STROKE);
        edge.setStrokeWidth(1.5f * context.getResources().getDisplayMetrics().density);
        edge.setColor(Color.argb(60, 255, 255, 255));
        setContentDescription("Scan coverage: red areas still need photos, green areas are covered");
    }

    void show(int[][] grid, float[] vertices) {
        this.grid = grid;
        this.vertices = vertices;
        this.updatedAt = SystemClock.uptimeMillis();
        invalidate();
    }

    void clear() {
        grid = null;
        invalidate();
    }

    static int colour(int views) {
        if (views >= 3) return Color.argb(70, 60, 200, 110);
        if (views == 2) return Color.argb(85, 250, 205, 50);
        if (views == 1) return Color.argb(95, 250, 140, 40);
        return Color.argb(110, 235, 60, 50);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        if (grid == null || vertices == null) return;
        long age = SystemClock.uptimeMillis() - updatedAt;
        float fade = age < STALE_MS ? 1f : Math.max(0f, 1f - (age - STALE_MS) / 1500f);
        if (fade <= 0f) return;
        int rows = grid.length, cols = grid[0].length;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int views = grid[r][c];
                if (views < 0) continue;
                int base = colour(views);
                fill.setColor(Color.argb((int) (Color.alpha(base) * fade), Color.red(base), Color.green(base), Color.blue(base)));
                tile.reset();
                corner(r, c, true);
                corner(r, c + 1, false);
                corner(r + 1, c + 1, false);
                corner(r + 1, c, false);
                tile.close();
                canvas.drawPath(tile, fill);
                canvas.drawPath(tile, edge);
            }
        }
        if (fade < 1f) postInvalidateDelayed(50);
        else postInvalidateDelayed(STALE_MS - age + 16);
    }

    private void corner(int r, int c, boolean first) {
        int cols = grid[0].length;
        int i = (r * (cols + 1) + c) * 2;
        if (first) tile.moveTo(vertices[i], vertices[i + 1]);
        else tile.lineTo(vertices[i], vertices[i + 1]);
    }
}
