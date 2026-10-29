package com.nativelongisland.onthissite;

import java.util.List;

/**
 * Pure geometry for AR placement, kept free of Android and ARCore types so
 * it can be checked on a plain JVM (see scripts/verify-ar-placement.java).
 * Poses are float[7]: tx, ty, tz, qx, qy, qz, qw.
 */
final class ArPlacement {
    // A discoverable prompt is only dropped on an upward-facing surface the
    // camera can currently see (so never inside a wall or behind a door),
    // between knee/table height and well below the visitor's eye line, and
    // close enough to walk to without leaving the room.
    static final float MIN_DROP_BELOW_CAMERA = 0.25f;
    static final float MAX_DROP_BELOW_CAMERA = 2.2f;
    static final float MIN_HORIZONTAL_DISTANCE = 0.8f;
    static final float MAX_HORIZONTAL_DISTANCE = 4.0f;
    static final float MIN_SPACING = 1.0f;
    static final float FLOOR_DROP = 1.0f;

    private ArPlacement() {}

    /**
     * Builds the room frame from a detected marker: origin at the marker
     * centre, +Y = gravity up, +Z = out of a wall-mounted card into the room,
     * or towards the top edge of a card lying flat on a table.
     */
    static float[] roomPoseFromMarker(float[] center, float[] markerYAxis, float[] markerZAxis) {
        float fx;
        float fz;
        if (Math.abs(markerYAxis[1]) < 0.7f) {
            fx = markerYAxis[0];
            fz = markerYAxis[2];
        } else {
            fx = -markerZAxis[0];
            fz = -markerZAxis[2];
        }
        float yaw = (float) Math.atan2(fx, fz);
        float[] q = yawQuaternion(yaw);
        return new float[] {center[0], center[1], center[2], q[0], q[1], q[2], q[3]};
    }

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

    /** Is a point (room-frame x/z) inside the room's authored zone, or its radius when no zone is drawn? */
    static boolean insideRoomArea(float x, float z, List<float[]> zone, float radius) {
        if (zone != null && zone.size() >= 3) return pointInPolygon(x, z, zone);
        return Math.hypot(x, z) <= radius;
    }

    /** Null when a surface hit is a reasonable drop spot, otherwise why it was rejected. */
    static String dropSpotProblem(float[] camera, float[] hit) {
        float below = camera[1] - hit[1];
        if (below < MIN_DROP_BELOW_CAMERA) return "too high";
        if (below > MAX_DROP_BELOW_CAMERA) return "too low";
        double distance = Math.hypot(hit[0] - camera[0], hit[2] - camera[2]);
        if (distance < MIN_HORIZONTAL_DISTANCE) return "too close";
        if (distance > MAX_HORIZONTAL_DISTANCE) return "too far";
        return null;
    }

    /** How far above the surface the orb floats: chest height over a floor, just above a table. */
    static float floatHeight(float[] camera, float[] hit) {
        return camera[1] - hit[1] > FLOOR_DROP ? 1.15f : 0.3f;
    }

    static boolean wellSpaced(float[] point, List<float[]> others) {
        for (float[] other : others) {
            if (Math.hypot(point[0] - other[0], point[2] - other[2]) < MIN_SPACING) return false;
        }
        return true;
    }

    /** Before/after: quad width that fills the given fraction of the screen width at this distance. */
    static float rephotoWidth(float distance, float projectionXScale, float screenFraction) {
        return 2f * distance / projectionXScale * screenFraction;
    }

    /** Fraction of the screen width a fit-centre photo occupies. */
    static float fitCenterWidthFraction(float screenWidth, float screenHeight, float photoHeightOverWidth) {
        return Math.min(1f, (screenHeight / screenWidth) / photoHeightOverWidth);
    }

    // ---- Joining a scanned space via Cloud Anchors ----

    /** Heading of a pose's forward (-Z) direction about the up axis. */
    static double yaw(float[] pose) {
        float[] forward = rotate(new float[] {pose[3], pose[4], pose[5], pose[6]}, new float[] {0, 0, -1});
        return Math.atan2(-forward[0], -forward[2]);
    }

    /**
     * Session -> space transform from anchors seen in both frames. Both are
     * gravity-aligned (ARCore), so only yaw and translation are solved: the
     * circular mean of the yaw differences, then the mean translation.
     * Returns {tx,ty,tz,qx,qy,qz,qw, rmsResidualMetres}, or null without anchors.
     */
    static float[] fitYawTranslation(List<float[]> sessionPoses, List<float[]> spacePoses) {
        int n = Math.min(sessionPoses.size(), spacePoses.size());
        if (n == 0) return null;
        double sin = 0;
        double cos = 0;
        for (int i = 0; i < n; i++) {
            double d = yaw(spacePoses.get(i)) - yaw(sessionPoses.get(i));
            sin += Math.sin(d);
            cos += Math.cos(d);
        }
        float[] q = yawQuaternion((float) Math.atan2(sin, cos));
        float tx = 0;
        float ty = 0;
        float tz = 0;
        for (int i = 0; i < n; i++) {
            float[] a = sessionPoses.get(i);
            float[] r = rotate(q, new float[] {a[0], a[1], a[2]});
            tx += spacePoses.get(i)[0] - r[0];
            ty += spacePoses.get(i)[1] - r[1];
            tz += spacePoses.get(i)[2] - r[2];
        }
        float[] transform = {tx / n, ty / n, tz / n, q[0], q[1], q[2], q[3]};
        double sum = 0;
        for (int i = 0; i < n; i++) {
            float[] mapped = compose(transform, sessionPoses.get(i));
            float[] b = spacePoses.get(i);
            sum += Math.pow(mapped[0] - b[0], 2) + Math.pow(mapped[1] - b[1], 2) + Math.pow(mapped[2] - b[2], 2);
        }
        return new float[] {transform[0], transform[1], transform[2], transform[3], transform[4], transform[5], transform[6], (float) Math.sqrt(sum / n)};
    }

    // ---- Pose maths (matches ARCore's Pose conventions) ----

    static float[] rotate(float[] q, float[] v) {
        float qx = q[0], qy = q[1], qz = q[2], qw = q[3];
        float tx = 2f * (qy * v[2] - qz * v[1]);
        float ty = 2f * (qz * v[0] - qx * v[2]);
        float tz = 2f * (qx * v[1] - qy * v[0]);
        return new float[] {
            v[0] + qw * tx + (qy * tz - qz * ty),
            v[1] + qw * ty + (qz * tx - qx * tz),
            v[2] + qw * tz + (qx * ty - qy * tx),
        };
    }

    static float[] multiply(float[] a, float[] b) {
        return new float[] {
            a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
            a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
            a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
            a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
        };
    }

    static float[] compose(float[] a, float[] b) {
        float[] qa = {a[3], a[4], a[5], a[6]};
        float[] t = rotate(qa, new float[] {b[0], b[1], b[2]});
        float[] q = multiply(qa, new float[] {b[3], b[4], b[5], b[6]});
        return new float[] {a[0] + t[0], a[1] + t[1], a[2] + t[2], q[0], q[1], q[2], q[3]};
    }

    static float[] inverse(float[] p) {
        float[] q = {-p[3], -p[4], -p[5], p[6]};
        float[] t = rotate(q, new float[] {-p[0], -p[1], -p[2]});
        return new float[] {t[0], t[1], t[2], q[0], q[1], q[2], q[3]};
    }

    /** World point to room-frame point. */
    static float[] toRoom(float[] roomPose, float[] worldPoint) {
        float[] inv = inverse(roomPose);
        float[] t = rotate(new float[] {inv[3], inv[4], inv[5], inv[6]}, worldPoint);
        return new float[] {t[0] + inv[0], t[1] + inv[1], t[2] + inv[2]};
    }
}
