package com.nativelongisland.onthissite;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Plain-JVM checks for ArPlacement (no device or ARCore needed):
 *
 *   javac -d build/ar-verify app/src/main/java/com/nativelongisland/onthissite/ArPlacement.java scripts/VerifyArPlacement.java
 *   java -cp build/ar-verify com.nativelongisland.onthissite.VerifyArPlacement
 */
public final class VerifyArPlacement {
    private static int failures;

    public static void main(String[] args) {
        // A card on a wall whose face points along world +X: the room's +Z
        // (into the room) must point along +X too.
        float[] wall = ArPlacement.roomPoseFromMarker(new float[] {1, 1.5f, 2}, new float[] {1, 0, 0}, new float[] {0, -1, 0});
        near("wall card faces into room", ArPlacement.rotate(quat(wall), new float[] {0, 0, 1}), 1, 0, 0);
        near("wall room keeps gravity up", ArPlacement.rotate(quat(wall), new float[] {0, 1, 0}), 0, 1, 0);

        // A card lying flat with its top edge towards world -Z.
        float[] flat = ArPlacement.roomPoseFromMarker(new float[] {0, 0.8f, 0}, new float[] {0, 1, 0}, new float[] {0, 0, 1});
        near("flat card faces its top edge", ArPlacement.rotate(quat(flat), new float[] {0, 0, 1}), 0, 0, -1);

        // Item poses survive the room-frame round trip.
        float[] item = {0.4f, 0.2f, -1.1f, 0, (float) Math.sin(0.3), 0, (float) Math.cos(0.3)};
        float[] world = ArPlacement.compose(wall, item);
        float[] back = ArPlacement.compose(ArPlacement.inverse(wall), world);
        near("room round trip", Arrays.copyOf(back, 3), item[0], item[1], item[2]);
        near("toRoom matches compose", ArPlacement.toRoom(wall, Arrays.copyOf(world, 3)), item[0], item[1], item[2]);

        List<float[]> square = new ArrayList<>();
        square.add(new float[] {-1, -1});
        square.add(new float[] {2, -1});
        square.add(new float[] {2, 3});
        square.add(new float[] {-1, 3});
        check("inside zone", ArPlacement.insideRoomArea(0.5f, 2.5f, square, 0));
        check("outside zone", !ArPlacement.insideRoomArea(2.5f, 0, square, 99));
        check("radius used without zone", ArPlacement.insideRoomArea(1, 1, new ArrayList<>(), 1.5f));
        check("beyond radius", !ArPlacement.insideRoomArea(2, 2, new ArrayList<>(), 1.5f));

        float[] eye = {0, 1.5f, 0};
        check("floor 2 m ahead is fine", ArPlacement.dropSpotProblem(eye, new float[] {0, 0, -2}) == null);
        check("tabletop is fine", ArPlacement.dropSpotProblem(eye, new float[] {1, 0.75f, -1}) == null);
        check("shelf at eye level rejected", "too high".equals(ArPlacement.dropSpotProblem(eye, new float[] {0, 1.4f, -2})));
        check("stairwell drop rejected", "too low".equals(ArPlacement.dropSpotProblem(eye, new float[] {0, -1.5f, -2})));
        check("under the visitor rejected", "too close".equals(ArPlacement.dropSpotProblem(eye, new float[] {0.3f, 0, 0})));
        check("far end of hall rejected", "too far".equals(ArPlacement.dropSpotProblem(eye, new float[] {0, 0, -6})));
        check("floor orb floats at chest height", ArPlacement.floatHeight(eye, new float[] {0, 0, -2}) > 1f);
        check("table orb floats just above", ArPlacement.floatHeight(eye, new float[] {0, 0.75f, -2}) < 0.5f);

        List<float[]> taken = new ArrayList<>();
        taken.add(new float[] {0, 0, -2});
        check("crowded spot rejected", !ArPlacement.wellSpaced(new float[] {0.5f, 0, -2}, taken));
        check("spaced spot accepted", ArPlacement.wellSpaced(new float[] {1.5f, 0, -2}, taken));

        // 60° horizontal FOV: projection x-scale = 1/tan(30°).
        float width = ArPlacement.rephotoWidth(3f, (float) (1 / Math.tan(Math.toRadians(30))), 1f);
        check("before/after width fills the view", Math.abs(width - 3.464f) < 0.01f);
        check("landscape photo fills phone width", ArPlacement.fitCenterWidthFraction(1080, 2340, 0.75f) == 1f);
        check("very tall photo is narrower", ArPlacement.fitCenterWidthFraction(1080, 2340, 3f) < 1f);

        // A second volunteer's session, rotated 30 degrees and shifted, joins the
        // first scan's frame through three shared anchors.
        float[] truth = {2f, 0.1f, -1f, 0f, (float) Math.sin(Math.toRadians(15)), 0f, (float) Math.cos(Math.toRadians(15))};
        List<float[]> inSession = new ArrayList<>();
        List<float[]> inSpace = new ArrayList<>();
        float[][] anchorPoses = {
            {0.5f, 0f, -2f, 0, (float) Math.sin(0.4), 0, (float) Math.cos(0.4)},
            {3f, 0.8f, 1f, 0, (float) Math.sin(-1.1), 0, (float) Math.cos(-1.1)},
            {-2f, 0f, 4f, 0, 0, 0, 1},
        };
        for (float[] p : anchorPoses) {
            inSession.add(p);
            inSpace.add(ArPlacement.compose(truth, p));
        }
        float[] fit = ArPlacement.fitYawTranslation(inSession, inSpace);
        near("anchor fit translation", Arrays.copyOf(fit, 3), 2f, 0.1f, -1f);
        check("anchor fit rotation", Math.abs(Math.abs(fit[4]) - Math.sin(Math.toRadians(15))) < 1e-4);
        check("anchor fit residual ~0", fit[7] < 1e-4);
        check("no anchors gives no fit", ArPlacement.fitYawTranslation(new ArrayList<>(), new ArrayList<>()) == null);

        System.out.println(failures == 0 ? "AR placement checks passed." : failures + " AR placement check(s) failed.");
        System.exit(failures == 0 ? 0 : 1);
    }

    private static float[] quat(float[] pose) {
        return new float[] {pose[3], pose[4], pose[5], pose[6]};
    }

    private static void near(String name, float[] v, float x, float y, float z) {
        check(name + " " + Arrays.toString(v), Math.abs(v[0] - x) < 1e-4 && Math.abs(v[1] - y) < 1e-4 && Math.abs(v[2] - z) < 1e-4);
    }

    private static void check(String name, boolean ok) {
        if (!ok) {
            failures++;
            System.out.println("FAIL " + name);
        }
    }
}
