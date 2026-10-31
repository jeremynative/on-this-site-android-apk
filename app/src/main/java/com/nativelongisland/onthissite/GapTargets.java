package com.nativelongisland.onthissite;

/**
 * An earlier build's "needs more angles" spots, in the place's (space) frame,
 * and whether this scan has covered each one yet. Kept free of Android so the
 * placement and fill logic can be tested without a phone.
 */
final class GapTargets {
    /**
     * A spot counts as filled once this many 6 cm tiles within half a metre are
     * photographed from 3+ directions (about 0.1 m² of surface).
     */
    static final int COMPLETE_CELLS = 25;
    static final float RADIUS_M = 0.5f;

    private final float[] xyz;
    private final boolean[] done;

    GapTargets(float[] xyz) {
        this.xyz = xyz;
        this.done = new boolean[xyz.length / 3];
    }

    int count() {
        return done.length;
    }

    boolean filled(int index) {
        return done[index];
    }

    /**
     * Re-checks the spots not yet filled and returns how many are.
     * spaceToSession is the column-major 4x4 that maps place coordinates into
     * this scan's frame (the matrix the earlier scans are drawn with).
     */
    int update(float[] spaceToSession, SurfaceCoverage coverage) {
        float[] m = spaceToSession;
        int filled = 0;
        for (int i = 0; i < done.length; i++) {
            if (!done[i]) {
                float x = xyz[i * 3], y = xyz[i * 3 + 1], z = xyz[i * 3 + 2];
                float sx = m[0] * x + m[4] * y + m[8] * z + m[12];
                float sy = m[1] * x + m[5] * y + m[9] * z + m[13];
                float sz = m[2] * x + m[6] * y + m[10] * z + m[14];
                done[i] = coverage.completeNear(sx, sy, sz, RADIUS_M) >= COMPLETE_CELLS;
            }
            if (done[i]) filled++;
        }
        return filled;
    }

    /** Point vertices (x, y, z, r, g, b, a) in the place frame: pulsing orange, green once filled. */
    float[] vertices(float pulse) {
        float[] out = new float[done.length * 7];
        for (int i = 0; i < done.length; i++) {
            System.arraycopy(xyz, i * 3, out, i * 7, 3);
            out[i * 7 + 3] = done[i] ? 0.25f : 1f;
            out[i * 7 + 4] = done[i] ? 0.85f : 0.55f;
            out[i * 7 + 5] = done[i] ? 0.35f : 0.12f;
            out[i * 7 + 6] = done[i] ? 0.9f : pulse;
        }
        return out;
    }
}
