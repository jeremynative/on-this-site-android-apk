package com.nativelongisland.onthissite;

/**
 * Phone motion while scanning without ARCore tracking, from the rotation
 * vector and accelerometer only.
 *
 * The Ma's House scan lost half its photos because the scanner turned on the
 * spot: timed photos 600 ms apart were too far apart in angle to overlap, and
 * spinning from one place gives no parallax. This class tells the scanner when
 * the phone has turned enough since the last photo to need another, when it is
 * turning too fast, and when it has been turning a lot without walking.
 */
final class ScanMotion {
    /** Keep a photo after this much turn even if the timer hasn't fired. */
    static final float PHOTO_TURN_DEG = 8f;
    /** Faster than this, consecutive photos stop overlapping. */
    static final float FAST_TURN_DEG_PER_S = 40f;
    /** This much turning in the window with little walking is "spinning in place". */
    static final float SPIN_DEG = 120f;
    static final long SPIN_WINDOW_MS = 8000;
    /** Walking shakes the phone; holding it still while turning doesn't (m/s², std of |a|). */
    static final float WALK_SHAKE = 0.6f;

    private static final int CAPACITY = 512; // ~10 s at SENSOR_DELAY_GAME
    private final long[] times = new long[CAPACITY];
    private final float[][] quats = new float[CAPACITY][];
    private final boolean[] walkingAt = new boolean[CAPACITY];
    private int head;
    private int count;

    private float meanAcc = 9.81f;
    private float varAcc;
    private boolean accSeen;

    /** Accelerometer sample (m/s², device axes). */
    synchronized void onAccel(float x, float y, float z) {
        float magnitude = (float) Math.sqrt(x * x + y * y + z * z);
        if (!accSeen) {
            meanAcc = magnitude;
            accSeen = true;
            return;
        }
        // ~1 s memory at SENSOR_DELAY_GAME (50 Hz).
        float k = 0.04f;
        float delta = magnitude - meanAcc;
        meanAcc += k * delta;
        varAcc = (1 - k) * (varAcc + k * delta * delta);
    }

    synchronized boolean walking() {
        return accSeen && Math.sqrt(varAcc) >= WALK_SHAKE;
    }

    /** Rotation-vector attitude as x, y, z, w. */
    synchronized void onAttitude(float[] q, long nowMs) {
        int at = (head + count) % CAPACITY;
        if (count == CAPACITY) {
            head = (head + 1) % CAPACITY;
        } else {
            count++;
        }
        times[at] = nowMs;
        quats[at] = q.clone();
        walkingAt[at] = walking();
    }

    /** Angle between two attitudes, degrees. */
    static float angleDeg(float[] a, float[] b) {
        double dot = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);
        return (float) Math.toDegrees(2 * Math.acos(Math.min(1.0, dot)));
    }

    synchronized float[] latest() {
        return count == 0 ? null : quats[(head + count - 1) % CAPACITY].clone();
    }

    /** Turn rate over roughly the last half second, degrees per second. */
    synchronized float turnRate(long nowMs) {
        if (count < 2) return 0f;
        int last = (head + count - 1) % CAPACITY;
        int first = last;
        for (int i = count - 2; i >= 0; i--) {
            int at = (head + i) % CAPACITY;
            first = at;
            if (nowMs - times[at] >= 500) break;
        }
        long dt = times[last] - times[first];
        if (dt < 150) return 0f;
        return angleDeg(quats[first], quats[last]) * 1000f / dt;
    }

    /** Total turning in the recent window, and how much of that window was spent walking. */
    synchronized boolean spinningInPlace(long nowMs) {
        if (count < 2) return false;
        float turned = 0f;
        int samples = 0;
        int walkingSamples = 0;
        long oldest = Long.MAX_VALUE;
        for (int i = 1; i < count; i++) {
            int at = (head + i) % CAPACITY;
            if (nowMs - times[at] > SPIN_WINDOW_MS) continue;
            int previous = (head + i - 1) % CAPACITY;
            turned += angleDeg(quats[previous], quats[at]);
            samples++;
            if (walkingAt[at]) walkingSamples++;
            oldest = Math.min(oldest, times[at]);
        }
        if (samples < 5 || nowMs - oldest < SPIN_WINDOW_MS / 2) return false;
        return turned >= SPIN_DEG && walkingSamples < samples * 0.3f;
    }

    /** One-line coaching for the status text, or null when the motion looks fine. */
    String hint(long nowMs) {
        if (turnRate(nowMs) >= FAST_TURN_DEG_PER_S) {
            return "Quick turn: a slower turn lets each photo overlap the last.";
        }
        if (spinningInPlace(nowMs)) {
            return "Turning in one spot gives one viewpoint. Walking around adds depth.";
        }
        return null;
    }
}
