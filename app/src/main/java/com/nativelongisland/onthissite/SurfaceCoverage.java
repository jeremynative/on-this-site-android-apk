package com.nativelongisland.onthissite;

import java.util.HashMap;
import java.util.Map;

/**
 * Live "what's been captured" mesh for the scanner, built from ARCore depth.
 *
 * Depth samples become small surface tiles: each 6 cm cell keeps the average
 * position and surface direction (normal) of the depth points that fell in it,
 * and is drawn as a square lying on that surface, with thin white edges, so
 * the tiles wrap around walls and objects like a scan mesh. Every kept photo
 * records the direction it saw each cell from (24 compass sectors x 2
 * heights). Photogrammetry needs each surface photographed from several
 * directions: a tile is red until photos have seen it from 2 directions,
 * orange at 2, and green (complete) from 3. Plain Java so it can be checked
 * without a device.
 */
final class SurfaceCoverage {
    static final float CELL_M = 0.06f;
    static final float MAX_DEPTH_M = 5f;
    /** Depth frames that must see a cell before it is drawn (drops one-off noise). */
    static final int MIN_HITS = 2;
    private static final int MAX_CELLS = 120000;
    private static final int AZIMUTH_BINS = 24; // 15 degrees: ~0.5 m of walking at 2 m
    /** Floats per sample from unproject(): x, y, z, nx, ny, nz. */
    static final int SAMPLE_FLOATS = 6;
    /** Floats per vertex for drawing: x, y, z, r, g, b, a. */
    static final int VERTEX_FLOATS = 7;

    static final class Cell {
        float sx, sy, sz;    // summed positions
        float nx, ny, nz;    // summed normals
        int hits;            // samples averaged
        int frames;          // depth frames that saw it
        int lastFrame = -1;
        long directions;     // bitmask of sectors photos saw this cell from

        int angles() {
            return Long.bitCount(directions);
        }
    }

    private final Map<Long, Cell> cells = new HashMap<>();
    private int version;
    private int frameCount;

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
     * Samples from unproject() seen from the camera at (cx,cy,cz). When
     * photographed is true the samples are in a kept photo, so their cells gain
     * this viewing direction; otherwise they only refine the surface.
     */
    synchronized void add(float[] samples, int count, float cx, float cy, float cz, boolean photographed) {
        boolean changed = false;
        int frame = ++frameCount;
        for (int i = 0; i < count; i++) {
            int o = i * SAMPLE_FLOATS;
            float x = samples[o], y = samples[o + 1], z = samples[o + 2];
            int ix = (int) Math.floor(x / CELL_M), iy = (int) Math.floor(y / CELL_M), iz = (int) Math.floor(z / CELL_M);
            long k = key(ix, iy, iz);
            Cell cell = cells.get(k);
            if (cell == null) {
                if (cells.size() >= MAX_CELLS) continue;
                cell = new Cell();
                cells.put(k, cell);
            }
            // Keep averaging only for the first few dozen hits so a cell settles.
            if (cell.hits < 40) {
                cell.sx += x;
                cell.sy += y;
                cell.sz += z;
                cell.nx += samples[o + 3];
                cell.ny += samples[o + 4];
                cell.nz += samples[o + 5];
                cell.hits++;
            }
            if (cell.lastFrame != frame) {
                cell.lastFrame = frame;
                cell.frames++;
                if (cell.frames == MIN_HITS) changed = true;
            }
            if (photographed) {
                float px = cell.sx / cell.hits, py = cell.sy / cell.hits, pz = cell.sz / cell.hits;
                long bit = 1L << directionBit(cx - px, cy - py, cz - pz);
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

    /** Cells seen often enough to draw. */
    synchronized int cellCount() {
        int n = 0;
        for (Cell c : cells.values()) if (c.frames >= MIN_HITS) n++;
        return n;
    }

    /** Share of drawn cells photographed from at least 3 directions. */
    synchronized float capturedFraction() {
        int drawn = 0, captured = 0;
        for (Cell c : cells.values()) {
            if (c.frames < MIN_HITS) continue;
            drawn++;
            if (c.angles() >= 3) captured++;
        }
        return drawn == 0 ? 0f : captured / (float) drawn;
    }

    static float[] colour(int angles) {
        if (angles >= 3) return new float[] {0.20f, 0.85f, 0.40f, 0.30f};
        if (angles == 2) return new float[] {1.00f, 0.62f, 0.15f, 0.38f};
        return new float[] {0.92f, 0.16f, 0.16f, 0.42f};
    }

    private static final float[] EDGE = {1f, 1f, 1f, 0.55f};

    /**
     * Writes the tiles within maxDistance of (cx,cy,cz) as triangles (6
     * vertices per tile) into tris and their outlines as lines (8 vertices per
     * tile) into lines, VERTEX_FLOATS each. Returns {triangleVertices, lineVertices};
     * stops when either array is full.
     */
    synchronized int[] mesh(float cx, float cy, float cz, float maxDistance, float[] tris, float[] lines) {
        int t = 0, l = 0;
        float half = CELL_M * 0.55f; // slight overlap closes seams between tiles
        float max2 = maxDistance * maxDistance;
        float[] a = new float[3], b = new float[3], corner = new float[12];
        for (Cell c : cells.values()) {
            if (c.frames < MIN_HITS) continue;
            if (t + 6 * VERTEX_FLOATS > tris.length || l + 8 * VERTEX_FLOATS > lines.length) break;
            float px = c.sx / c.hits, py = c.sy / c.hits, pz = c.sz / c.hits;
            float dx = px - cx, dy = py - cy, dz = pz - cz;
            if (dx * dx + dy * dy + dz * dz > max2) continue;
            float nl = (float) Math.sqrt(c.nx * c.nx + c.ny * c.ny + c.nz * c.nz);
            if (nl < 1e-4f) continue;
            float nx = c.nx / nl, ny = c.ny / nl, nz = c.nz / nl;
            tangents(nx, ny, nz, a, b);
            for (int i = 0; i < 4; i++) {
                float su = (i == 0 || i == 3) ? -half : half;
                float sv = (i < 2) ? -half : half;
                corner[i * 3] = px + a[0] * su + b[0] * sv;
                corner[i * 3 + 1] = py + a[1] * su + b[1] * sv;
                corner[i * 3 + 2] = pz + a[2] * su + b[2] * sv;
            }
            float[] rgba = colour(c.angles());
            // Corners go round the square: 0 (-,-), 1 (+,-), 2 (+,+), 3 (-,+).
            int[] triOrder = {0, 1, 2, 0, 2, 3};
            for (int i : triOrder) t = put(tris, t, corner, i, rgba);
            int[] lineOrder = {0, 1, 1, 2, 2, 3, 3, 0};
            for (int i : lineOrder) l = put(lines, l, corner, i, EDGE);
        }
        return new int[] {t / VERTEX_FLOATS, l / VERTEX_FLOATS};
    }

    private static int put(float[] out, int o, float[] corner, int i, float[] rgba) {
        out[o++] = corner[i * 3];
        out[o++] = corner[i * 3 + 1];
        out[o++] = corner[i * 3 + 2];
        out[o++] = rgba[0];
        out[o++] = rgba[1];
        out[o++] = rgba[2];
        out[o++] = rgba[3];
        return o;
    }

    /** Two unit vectors spanning the plane with normal n (kept level where possible). */
    static void tangents(float nx, float ny, float nz, float[] a, float[] b) {
        // a = up x n, unless n is nearly vertical (floors, ceilings): then x x n.
        float ux = 0, uy = 1, uz = 0;
        if (Math.abs(ny) > 0.9f) {
            ux = 1;
            uy = 0;
        }
        float ax = uy * nz - uz * ny, ay = uz * nx - ux * nz, az = ux * ny - uy * nx;
        float al = (float) Math.sqrt(ax * ax + ay * ay + az * az);
        a[0] = ax / al;
        a[1] = ay / al;
        a[2] = az / al;
        b[0] = ny * a[2] - nz * a[1];
        b[1] = nz * a[0] - nx * a[2];
        b[2] = nx * a[1] - ny * a[0];
    }

    /**
     * Unprojects a 16-bit depth image (millimetres) on a cols x rows grid into
     * world samples (x, y, z, nx, ny, nz). Normals come from neighbouring grid
     * points and face the camera; samples on depth edges (neighbours more than
     * 12% nearer or farther) are skipped so tiles don't bridge gaps between
     * objects. Camera axes follow ARCore's Camera.getPose(): x right, y up,
     * z towards the viewer; poseMatrix is that pose, column-major. fx, fy, cx,
     * cy are the intrinsics scaled to the depth image. Returns the sample count.
     */
    static int unproject(short[] depthMm, int width, int height, float fx, float fy, float cx, float cy,
                         float[] poseMatrix, int cols, int rows, float[] out) {
        float[] grid = new float[cols * rows * 3];
        float[] depth = new float[cols * rows];
        for (int j = 0; j < rows; j++) {
            int v = (int) ((j + 0.5f) * height / rows);
            for (int i = 0; i < cols; i++) {
                int u = (int) ((i + 0.5f) * width / cols);
                int mm = depthMm[v * width + u] & 0xffff;
                float d = mm / 1000f;
                int g = j * cols + i;
                if (mm == 0 || d > MAX_DEPTH_M) {
                    depth[g] = 0;
                    continue;
                }
                depth[g] = d;
                float xc = (u + 0.5f - cx) / fx * d;
                float yc = -(v + 0.5f - cy) / fy * d;
                float zc = -d;
                float[] m = poseMatrix;
                grid[g * 3] = m[0] * xc + m[4] * yc + m[8] * zc + m[12];
                grid[g * 3 + 1] = m[1] * xc + m[5] * yc + m[9] * zc + m[13];
                grid[g * 3 + 2] = m[2] * xc + m[6] * yc + m[10] * zc + m[14];
            }
        }
        float camX = poseMatrix[12], camY = poseMatrix[13], camZ = poseMatrix[14];
        int n = 0;
        for (int j = 1; j < rows - 1; j++) {
            for (int i = 1; i < cols - 1; i++) {
                int g = j * cols + i;
                float d = depth[g];
                if (d == 0) continue;
                int l = g - 1, r = g + 1, up = g - cols, dn = g + cols;
                if (!near(d, depth[l]) || !near(d, depth[r]) || !near(d, depth[up]) || !near(d, depth[dn])) continue;
                if ((n + 1) * SAMPLE_FLOATS > out.length) return n;
                float ex = grid[r * 3] - grid[l * 3], ey = grid[r * 3 + 1] - grid[l * 3 + 1], ez = grid[r * 3 + 2] - grid[l * 3 + 2];
                float fx2 = grid[dn * 3] - grid[up * 3], fy2 = grid[dn * 3 + 1] - grid[up * 3 + 1], fz2 = grid[dn * 3 + 2] - grid[up * 3 + 2];
                float nx = ey * fz2 - ez * fy2, ny = ez * fx2 - ex * fz2, nz = ex * fy2 - ey * fx2;
                float len = (float) Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (len < 1e-6f) continue;
                nx /= len;
                ny /= len;
                nz /= len;
                float px = grid[g * 3], py = grid[g * 3 + 1], pz = grid[g * 3 + 2];
                if (nx * (camX - px) + ny * (camY - py) + nz * (camZ - pz) < 0) {
                    nx = -nx;
                    ny = -ny;
                    nz = -nz;
                }
                int o = n * SAMPLE_FLOATS;
                out[o] = px;
                out[o + 1] = py;
                out[o + 2] = pz;
                out[o + 3] = nx;
                out[o + 4] = ny;
                out[o + 5] = nz;
                n++;
            }
        }
        return n;
    }

    private static boolean near(float d, float other) {
        return other > 0 && Math.abs(other - d) <= 0.12f * d;
    }
}
