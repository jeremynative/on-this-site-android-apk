package com.nativelongisland.onthissite;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.view.View;

/**
 * Top-down mini map shown while scanning: covered floor (coloured by how
 * many photos saw it), the path walked so far, and where the phone is and
 * which way it faces. Gaps show what's left to scan.
 */
final class ScanCoverageMapView extends View {
    private final Paint background = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint cellPaint = new Paint();
    private final Paint pathPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint mePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF box = new RectF();
    private ScanCoverage.Snapshot snapshot;
    private float meX, meZ, headingRad;
    private boolean hasMe;
    private String label = "";

    ScanCoverageMapView(Context context) {
        super(context);
        background.setColor(Color.argb(170, 0, 0, 0));
        pathPaint.setStyle(Paint.Style.STROKE);
        pathPaint.setColor(Color.WHITE);
        pathPaint.setStrokeCap(Paint.Cap.ROUND);
        mePaint.setColor(Color.rgb(80, 170, 255));
        labelPaint.setColor(Color.WHITE);
        labelPaint.setTextSize(11 * getResources().getDisplayMetrics().scaledDensity);
        setContentDescription("Map of the area scanned so far");
    }

    /** Call on the UI thread. heading = direction the camera faces, radians in the x/z plane. */
    void update(ScanCoverage.Snapshot snapshot, float x, float z, float heading, String label) {
        this.snapshot = snapshot;
        this.meX = x;
        this.meZ = z;
        this.headingRad = heading;
        this.hasMe = true;
        this.label = label;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float density = getResources().getDisplayMetrics().density;
        box.set(0, 0, getWidth(), getHeight());
        canvas.drawRoundRect(box, 14 * density, 14 * density, background);
        if (snapshot == null || !hasMe) {
            canvas.drawText("Start scanning to see coverage", 10 * density, getHeight() / 2f, labelPaint);
            return;
        }
        // Fit the covered area, the path and the phone, with a little margin.
        float minX = meX, maxX = meX, minZ = meZ, maxZ = meZ;
        float cell = ScanCoverage.FLOOR_CELL_M;
        for (int[] f : snapshot.floor) {
            minX = Math.min(minX, f[0] * cell);
            maxX = Math.max(maxX, (f[0] + 1) * cell);
            minZ = Math.min(minZ, f[1] * cell);
            maxZ = Math.max(maxZ, (f[1] + 1) * cell);
        }
        for (float[] p : snapshot.path) {
            minX = Math.min(minX, p[0]);
            maxX = Math.max(maxX, p[0]);
            minZ = Math.min(minZ, p[1]);
            maxZ = Math.max(maxZ, p[1]);
        }
        float span = Math.max(4f, Math.max(maxX - minX, maxZ - minZ) + 1f);
        float pad = 10 * density;
        float scale = (Math.min(getWidth(), getHeight() - 16 * density) - 2 * pad) / span;
        float cx = (minX + maxX) / 2f, cz = (minZ + maxZ) / 2f;
        float ox = getWidth() / 2f, oz = (getHeight() - 16 * density) / 2f + 16 * density;

        for (int[] f : snapshot.floor) {
            float[] rgba = ScanCoverage.colour(f[2]);
            cellPaint.setColor(Color.argb(200, (int) (rgba[0] * 255), (int) (rgba[1] * 255), (int) (rgba[2] * 255)));
            float x0 = ox + (f[0] * cell - cx) * scale, z0 = oz + (f[1] * cell - cz) * scale;
            canvas.drawRect(x0, z0, x0 + cell * scale + 0.5f, z0 + cell * scale + 0.5f, cellPaint);
        }
        if (snapshot.path.size() > 1) {
            Path line = new Path();
            for (int i = 0; i < snapshot.path.size(); i++) {
                float[] p = snapshot.path.get(i);
                float px = ox + (p[0] - cx) * scale, pz = oz + (p[1] - cz) * scale;
                if (i == 0) line.moveTo(px, pz);
                else line.lineTo(px, pz);
            }
            pathPaint.setStrokeWidth(2 * density);
            canvas.drawPath(line, pathPaint);
        }
        float px = ox + (meX - cx) * scale, pz = oz + (meZ - cz) * scale;
        float r = 9 * density;
        Path arrow = new Path();
        float dx = (float) Math.sin(headingRad), dz = -(float) Math.cos(headingRad);
        arrow.moveTo(px + dx * r * 1.6f, pz + dz * r * 1.6f);
        arrow.lineTo(px - dz * r * 0.7f - dx * r * 0.5f, pz + dx * r * 0.7f - dz * r * 0.5f);
        arrow.lineTo(px + dz * r * 0.7f - dx * r * 0.5f, pz - dx * r * 0.7f - dz * r * 0.5f);
        arrow.close();
        canvas.drawPath(arrow, mePaint);
        canvas.drawText(label, 10 * density, 13 * density, labelPaint);
    }
}
