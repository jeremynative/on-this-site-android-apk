package com.nativelongisland.onthissite;

import java.util.HashMap;
import java.util.Map;

/**
 * Live "what's been captured" surface for the scanner, built from ARCore depth.
 *
 * Surfaces the camera sees are binned into 8 cm cells. Every depth frame marks
 * the cells it sees as found; every kept photo also records the direction it
 * saw each cell from (one of 24 compass sectors x 2 heights). Photogrammetry
 * needs each surface photographed from several directions, so a cell is drawn
 * red until photos have seen it from 2 directions, yellow at 2, and pale white
 * (captured) from 3. Plain Java so it can be checked without a device.
 */
final class SurfaceCoverage {
    static final float CELL_M = 0.08f;
    static final float MAX_DEPTH_M = 6f;
    private static final int MAX_CELLS = 150000;
    private static final int AZIMUTH_BINS = 24; // 15 degrees: ~0.5 m of walking at 2 m

    static final class Cell {
        final float x, y, z;
        long directions; // bitmask of sectors photos saw this cell from

        Cell(float x, float y, float z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        int angles() {
            return Long.bitCount(directions);
        }
    }

    private final Map<Long, Cell> cells = new HashMap<>();
    private int version;

    static long key(int ix, int iy, int iz) {
        return ((long) (ix + 1_000_000) << 42) | ((long) (iy + 1_000_000) << 21) | (long) (iz + 1_000_000);
    }

    /** Sector (bit index) of the direction from a cell towards the camera. */
    static int directionBit(float dx, float dy, float dz) {
        double horizontal = Math.hypot(dx, dz);
        double azimuth = Math.atan2(dx, dz); // -pi..pi around the vertical axis
        int a = (int) Math.floor((azimuth + Math.PI) / (2 * Math.PI) * AZIMUTH_BINS) % AZIMUTH_BINS;
        double elevation = Math.toDegrees(Math.atan2(dy, horizontal));
        int e = elevation > 35 ? 1 : 0;
        return e * AZIMUTH_BINS + a;
    }

    /**
     * World points (x,y,z triples) seen from the camera at (cx,cy,cz). When
     * photographed is true the points are in a kept photo, so their cells gain
     * this viewing direction; otherwise the cells are only marked as found.
     */
    synchronized void add(float[] points, int count, float cx, float cy, float cz, boolean photographed) {
        boolean changed = false;
        for (int i = 0; i < count; i++) {
            float x = points[i * 3], y = points[i * 3 + 1], z = points[i * 3 + 2];
            int ix = (int) Math.floor(x / CELL_M), iy = (int) Math.floor(y / CELL_M), iz = (int) Math.floor(z / CELL_M);
            long k = key(ix, iy, iz);
            Cell cell = cells.get(k);
            if (cell == null) {
                if (cells.size() >= MAX_CELLS) continue;
                cell = new Cell((ix + 0.5f) * CELL_M, (iy + 0.5f) * CELL_M, (iz + 0.5f) * CELL_M);
                cells.put(k, cell);
                changed = true;
            }
            if (photographed) {
                long bit = 1L << directionBit(cx - cell.x, cy - cell.y, cz - cell.z);
                if ((cell.directions & bit) == 0) {
                    cell.directions |= bit;
                    changed = true;
                }
            }
        }
        if (changed) version++;
    }

    synchronized int version() {
        return version;
    }

    synchronized int cellCount() {
        return cells.size();
    }

    /** Share of found cells photographed from at least 3 directions. */
    synchronized float capturedFraction() {
        if (cells.isEmpty()) return 0f;
        int captured = 0;
        for (Cell c : cells.values()) if (c.angles() >= 3) captured++;
        return captured / (float) cells.size();
    }

    /** xyzrgba floats for every cell. */
    synchronized float[] pointVertices() {
        float[] out = new float[cells.size() * 7];
        int i = 0;
        for (Cell c : cells.values()) {
            float[] rgba = colour(c.angles());
            out[i++] = c.x;
            out[i++] = c.y;
            out[i++] = c.z;
            out[i++] = rgba[0];
            out[i++] = rgba[1];
            out[i++] = rgba[2];
            out[i++] = rgba[3];
        }
        return out;
    }

    static float[] colour(int angles) {
        if (angles >= 3) return new float[] {0.97f, 0.97f, 0.97f, 0.28f};
        if (angles == 2) return new float[] {1.00f, 0.78f, 0.20f, 0.55f};
        return new float[] {0.95f, 0.22f, 0.22f, 0.60f};
    }

    /**
     * Unprojects a 16-bit depth image (millimetres) into world points, sampling
     * about cols x rows pixels. Camera axes follow ARCore's Camera.getPose():
     * x right, y up, z towards the viewer; poseMatrix is that pose, column-major.
     * fx, fy, cx, cy are the intrinsics scaled to the depth image. Returns the
     * number of points written to out (x,y,z triples).
     */
    static int unproject(short[] depthMm, int width, int height, float fx, float fy, float cx, float cy,
                         float[] poseMatrix, int cols, int rows, float[] out) {
        int stepX = Math.max(1, width / cols), stepY = Math.max(1, height / rows);
        int n = 0;
        for (int v = stepY / 2; v < height; v += stepY) {
            for (int u = stepX / 2; u < width; u += stepX) {
                int mm = depthMm[v * width + u] & 0xffff;
                if (mm == 0) continue;
                float d = mm / 1000f;
                if (d > MAX_DEPTH_M) continue;
                if (n * 3 + 2 >= out.length) return n;
                float xc = (u + 0.5f - cx) / fx * d;
                float yc = -(v + 0.5f - cy) / fy * d;
                float zc = -d;
                float[] m = poseMatrix;
                out[n * 3] = m[0] * xc + m[4] * yc + m[8] * zc + m[12];
                out[n * 3 + 1] = m[1] * xc + m[5] * yc + m[9] * zc + m[13];
                out[n * 3 + 2] = m[2] * xc + m[6] * yc + m[10] * zc + m[14];
                n++;
            }
        }
        return n;
    }
}
