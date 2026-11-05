package com.nativelongisland.onthissite;

import java.util.List;

/**
 * Pure geometry for AR cards: turning a card to face the visitor, and
 * whether a tap falls inside a drawn shape. Poses are float[7]: tx, ty, tz,
 * qx, qy, qz, qw.
 */
final class ArPlacement {
    private ArPlacement() {}

    static float[] yawQuaternion(float yaw) {
        return new float[] {0f, (float) Math.sin(yaw / 2f), 0f, (float) Math.cos(yaw / 2f)};
    }

    /** Yaw that turns an object's +Z towards the target, ignoring height. */
    static float yawTowards(float fromX, float fromZ, float toX, float toZ) {
        return (float) Math.atan2(toX - fromX, toZ - fromZ);
    }

    static boolean pointInPolygon(float x, float z, List<float[]> polygon) {
        boolean inside = false;
        int count = polygon.size();
        for (int i = 0, j = count - 1; i < count; j = i++) {
            float[] a = polygon.get(i);
            float[] b = polygon.get(j);
            if ((a[1] > z) != (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) {
                inside = !inside;
            }
        }
        return inside;
    }

    // ---- Joining a scanned space via Cloud Anchors ----

    // ---- Pose maths (matches ARCore's Pose conventions) ----

    /** The rotation (qx, qy, qz, qw) whose axes are the given unit vectors (x × y = z). */
    static float[] quaternionFromAxes(float[] x, float[] y, float[] z) {
        float trace = x[0] + y[1] + z[2];
        float qx;
        float qy;
        float qz;
        float qw;
        if (trace > 0f) {
            float s = (float) Math.sqrt(trace + 1f) * 2f;
            qw = 0.25f * s;
            qx = (y[2] - z[1]) / s;
            qy = (z[0] - x[2]) / s;
            qz = (x[1] - y[0]) / s;
        } else if (x[0] > y[1] && x[0] > z[2]) {
            float s = (float) Math.sqrt(1f + x[0] - y[1] - z[2]) * 2f;
            qw = (y[2] - z[1]) / s;
            qx = 0.25f * s;
            qy = (y[0] + x[1]) / s;
            qz = (z[0] + x[2]) / s;
        } else if (y[1] > z[2]) {
            float s = (float) Math.sqrt(1f + y[1] - x[0] - z[2]) * 2f;
            qw = (z[0] - x[2]) / s;
            qx = (y[0] + x[1]) / s;
            qy = 0.25f * s;
            qz = (z[1] + y[2]) / s;
        } else {
            float s = (float) Math.sqrt(1f + z[2] - x[0] - y[1]) * 2f;
            qw = (x[1] - y[0]) / s;
            qx = (z[0] + x[2]) / s;
            qy = (z[1] + y[2]) / s;
            qz = 0.25f * s;
        }
        return new float[] {qx, qy, qz, qw};
    }

    /**
     * How a placed sticker or flag sits, as an anchor rotation: its +Y along the
     * surface normal, and for a sticker its lettering upright on a wall or, on
     * a floor or table, reading from where the visitor stands. A flag stands
     * straight up with its cloth facing the visitor.
     */
    static float[] placedRotation(float[] normal, float[] point, float[] cameraPoint, boolean upright) {
        float[] up = {0f, 1f, 0f};
        float[] y = upright ? up : normalize(normal);
        // Towards the visitor, along the ground.
        float[] toward = normalize(new float[] {cameraPoint[0] - point[0], 0f, cameraPoint[2] - point[2]});
        if (Float.isNaN(toward[0])) toward = new float[] {0f, 0f, 1f};
        float[] z;
        if (upright) {
            z = toward;
        } else if (Math.abs(y[1]) > 0.7f) {
            // Flat on the ground: the top of the lettering points away from the visitor.
            z = normalize(reject(toward, y));
        } else {
            // On a wall: the top of the lettering points up.
            float[] down = {0f, -1f, 0f};
            z = normalize(reject(down, y));
        }
        float[] x = cross(y, z);
        return quaternionFromAxes(x, y, z);
    }

    private static float[] reject(float[] v, float[] n) {
        float d = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
        return new float[] {v[0] - d * n[0], v[1] - d * n[1], v[2] - d * n[2]};
    }

    private static float[] cross(float[] a, float[] b) {
        return new float[] {a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]};
    }

    private static float[] normalize(float[] v) {
        float length = (float) Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return length < 1e-6f ? new float[] {Float.NaN, Float.NaN, Float.NaN} : new float[] {v[0] / length, v[1] / length, v[2] / length};
    }
}
