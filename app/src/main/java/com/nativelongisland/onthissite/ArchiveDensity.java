package com.nativelongisland.onthissite;

import java.util.HashMap;
import java.util.Map;

/**
 * Colours a place's existing 3D points by how densely earlier scans captured
 * them, for the live scanner: points in well-covered areas are blue, points
 * in thin areas violet, so a contributor can see what to extend or redo.
 * Plain Java so it can be checked without a device.
 */
final class ArchiveDensity {
    static final float CELL_M = 0.3f;
    /** Points per 30 cm cell below which an area counts as thin. */
    static final int THIN_BELOW = 6;

    private static final float[] DENSE = {0.30f, 0.72f, 1.00f, 0.85f};
    private static final float[] THIN = {0.72f, 0.42f, 1.00f, 0.85f};

    /** xyz triples in, xyzrgba vertices out. */
    static float[] colour(float[] xyz) {
        int count = xyz.length / 3;
        Map<Long, Integer> density = new HashMap<>();
        long[] keys = new long[count];
        for (int i = 0; i < count; i++) {
            keys[i] = SurfaceCoverage.key((int) Math.floor(xyz[i * 3] / CELL_M),
                (int) Math.floor(xyz[i * 3 + 1] / CELL_M), (int) Math.floor(xyz[i * 3 + 2] / CELL_M));
            density.merge(keys[i], 1, Integer::sum);
        }
        float[] out = new float[count * 7];
        for (int i = 0; i < count; i++) {
            float[] rgba = density.get(keys[i]) >= THIN_BELOW ? DENSE : THIN;
            System.arraycopy(xyz, i * 3, out, i * 7, 3);
            System.arraycopy(rgba, 0, out, i * 7 + 3, 4);
        }
        return out;
    }
}
