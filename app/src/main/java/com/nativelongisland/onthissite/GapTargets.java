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
    /**
     * Spots are shown and counted once the camera has come within this
     * distance of them. A room built apart from the others sits hundreds of
     * metres away in the place's frame, so its spots can't be reached here.
     */
    static final float NEARBY_M = 15f;

    private final float[] xyz;
    private final boolean[] done;
    private final boolean[] nearby;

    GapTargets(float[] xyz) {
        this.xyz = xyz;
        this.done = new boolean[xyz.length / 3];
        this.nearby = new boolean[xyz.length / 3];
    }

    /** Every spot the server sent, reachable or not. */
    int count() {
        return done.length;
    }

    /** The spots near enough to this scan to show and count. */
    int nearbyCount() {
        int n = 0;
        for (boolean near : nearby) if (near) n++;
        return n;
    }

    boolean filled(int index) {
        return done[index];
    }

    /**
     * Re-checks the nearby spots not yet filled and returns how many nearby
     * spots are filled. spaceToSession is the column-major 4x4 that maps place
     * coordinates into this scan's frame (the matrix the earlier scans are
     * drawn with); camera is the phone's position in this scan's frame.
     */
    int update(float[] spaceToSession, SurfaceCoverage coverage, float[] camera) {
        float[] m = spaceToSession;
        int filled = 0;
        for (int i = 0; i < done.length; i++) {
            float x = xyz[i * 3], y = xyz[i * 3 + 1], z = xyz[i * 3 + 2];
            float sx = m[0] * x + m[4] * y + m[8] * z + m[12];
            float sy = m[1] * x + m[5] * y + m[9] * z + m[13];
            float sz = m[2] * x + m[6] * y + m[10] * z + m[14];
            if (!nearby[i] && camera != null) {
                float dx = sx - camera[0], dy = sy - camera[1], dz = sz - camera[2];
                nearby[i] = dx * dx + dy * dy + dz * dz < NEARBY_M * NEARBY_M;
            }
            if (nearby[i] && !done[i]) done[i] = coverage.completeNear(sx, sy, sz, RADIUS_M) >= COMPLETE_CELLS;
            if (nearby[i] && done[i]) filled++;
        }
        return filled;
    }

    /**
     * Point vertices (x, y, z, r, g, b, a) in the place frame for the nearby
     * spots: pulsing orange, green once filled. nearbyCount() points.
     */
    float[] vertices(float pulse) {
        float[] out = new float[nearbyCount() * 7];
        int k = 0;
        for (int i = 0; i < done.length; i++) {
            if (!nearby[i]) continue;
            System.arraycopy(xyz, i * 3, out, k * 7, 3);
            out[k * 7 + 3] = done[i] ? 0.25f : 1f;
            out[k * 7 + 4] = done[i] ? 0.85f : 0.55f;
            out[k * 7 + 5] = done[i] ? 0.35f : 0.12f;
            out[k * 7 + 6] = done[i] ? 0.9f : pulse;
            k++;
        }
        return out;
    }
}
