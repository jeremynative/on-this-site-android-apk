package com.nativelongisland.onthissite;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Tracks which parts of the space a scan has covered, for the live preview.
 * ARCore feature points seen when a photo is taken are binned into 15 cm
 * cells; a cell's colour shows how many photos saw it (red 1, yellow 2,
 * green 3+). A coarser 50 cm floor grid and the walked path feed the
 * top-down mini map. Plain Java so it can be checked without a device.
 */
final class ScanCoverage {
    static final float CELL_M = 0.15f;
    static final float FLOOR_CELL_M = 0.5f;
    private static final int MAX_CELLS = 60000;
    private static final int MAX_PATH = 4000;

    /** One 3D cell: centre and how many photos saw it. */
    static final class Cell {
        final float x, y, z;
        int views;
        int lastPhoto = -1;

        Cell(float x, float y, float z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    private final Map<Long, Cell> cells = new HashMap<>();
    private final Map<Long, int[]> floor = new HashMap<>(); // key -> {ix, iz, maxViews}
    private final List<float[]> path = new ArrayList<>();
    private int version;

    static long key(int ix, int iy, int iz) {
        return ((long) (ix + 1_000_000) << 42) | ((long) (iy + 1_000_000) << 21) | (long) (iz + 1_000_000);
    }

    /** Points as x,y,z,confidence quads (ARCore PointCloud layout), seen in photo number photoIndex. */
    synchronized void addPhoto(float[] points, int count, int photoIndex, float minConfidence) {
        for (int i = 0; i < count; i++) {
            float x = points[i * 4], y = points[i * 4 + 1], z = points[i * 4 + 2], confidence = points[i * 4 + 3];
            if (confidence < minConfidence) continue;
            int ix = (int) Math.floor(x / CELL_M), iy = (int) Math.floor(y / CELL_M), iz = (int) Math.floor(z / CELL_M);
            long k = key(ix, iy, iz);
            Cell cell = cells.get(k);
            if (cell == null) {
                if (cells.size() >= MAX_CELLS) continue;
                cell = new Cell((ix + 0.5f) * CELL_M, (iy + 0.5f) * CELL_M, (iz + 0.5f) * CELL_M);
                cells.put(k, cell);
            }
            if (cell.lastPhoto == photoIndex) continue;
            cell.lastPhoto = photoIndex;
            cell.views++;
            int fx = (int) Math.floor(x / FLOOR_CELL_M), fz = (int) Math.floor(z / FLOOR_CELL_M);
            long fk = key(fx, 0, fz);
            int[] f = floor.get(fk);
            if (f == null) floor.put(fk, new int[] {fx, fz, cell.views});
            else f[2] = Math.max(f[2], cell.views);
        }
        version++;
    }

    synchronized void addPathPoint(float x, float z) {
        if (!path.isEmpty()) {
            float[] last = path.get(path.size() - 1);
            if (Math.hypot(last[0] - x, last[1] - z) < 0.1) return;
        }
        if (path.size() < MAX_PATH) path.add(new float[] {x, z});
        version++;
    }

    synchronized int version() {
        return version;
    }

    synchronized int cellCount() {
        return cells.size();
    }

    /** Covered floor area in m² (cells seen by 2+ photos count as covered). */
    synchronized float coveredAreaM2() {
        int covered = 0;
        for (int[] f : floor.values()) if (f[2] >= 2) covered++;
        return covered * FLOOR_CELL_M * FLOOR_CELL_M;
    }

    /** xyzrgba floats for every cell, coloured by how many photos saw it. */
    synchronized float[] pointVertices() {
        float[] out = new float[cells.size() * 7];
        int i = 0;
        for (Cell c : cells.values()) {
            float[] rgba = colour(c.views);
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

    /** Snapshot for the mini map: floor cells {ix, iz, views} and the path. */
    synchronized Snapshot snapshot() {
        Snapshot s = new Snapshot();
        s.floor = new ArrayList<>(floor.size());
        for (int[] f : floor.values()) s.floor.add(f.clone());
        s.path = new ArrayList<>(path);
        return s;
    }

    static final class Snapshot {
        List<int[]> floor;
        List<float[]> path;
    }

    static float[] colour(int views) {
        if (views >= 3) return new float[] {0.25f, 0.85f, 0.45f, 0.85f};
        if (views == 2) return new float[] {0.98f, 0.80f, 0.20f, 0.85f};
        return new float[] {0.95f, 0.35f, 0.30f, 0.80f};
    }
}
