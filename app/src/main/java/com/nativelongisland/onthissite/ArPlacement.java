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

}
