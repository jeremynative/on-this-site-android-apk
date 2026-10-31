package com.nativelongisland.onthissite;

import android.hardware.GeomagneticField;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

/**
 * Lines the AR world up with true north so a bubble for a nearby place can
 * float in the real direction of that place. ARCore's world has an
 * arbitrary heading; the phone's rotation sensor knows where north is. Each
 * frame compares the camera's heading in both and keeps a smoothed offset.
 *
 * Angles: an AR heading is atan2(x, -z) of a horizontal direction (0 =
 * looking down -Z, increasing clockwise seen from above), the same sense as
 * a compass bearing (0 = north, 90 = east).
 */
final class ArCompass implements SensorEventListener {
    private static final int SAMPLES_NEEDED = 30;
    private static final float SMOOTHING = 0.05f;

    private final float[] rotation = new float[9];
    private boolean haveRotation;
    private float declinationDeg;
    private double sumCos;
    private double sumSin;
    private int samples;

    void setLocation(double lat, double lng) {
        declinationDeg = new GeomagneticField((float) lat, (float) lng, 0f, System.currentTimeMillis()).getDeclination();
    }

    void start(SensorManager sensors) {
        Sensor sensor = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        if (sensor != null) sensors.registerListener(this, sensor, SensorManager.SENSOR_DELAY_GAME);
    }

    void stop(SensorManager sensors) {
        if (sensors != null) sensors.unregisterListener(this);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        synchronized (rotation) {
            SensorManager.getRotationMatrixFromVector(rotation, event.values);
            haveRotation = true;
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    /** Adds one comparison; cameraForward is the camera's look direction in the AR world. */
    void sample(float[] cameraForward) {
        double ar = arHeading(cameraForward);
        Double north = trueHeadingDeg();
        if (Double.isNaN(ar) || north == null) return;
        double offset = Math.toRadians(north) - ar;
        float weight = samples < SAMPLES_NEEDED ? 1f / (samples + 1) : SMOOTHING;
        sumCos = sumCos * (1 - weight) + Math.cos(offset) * weight;
        sumSin = sumSin * (1 - weight) + Math.sin(offset) * weight;
        samples++;
    }

    boolean ready() {
        return samples >= SAMPLES_NEEDED;
    }

    /** The AR heading (radians) that points toward a compass bearing. */
    double arHeadingFor(double bearingDeg) {
        return Math.toRadians(bearingDeg) - Math.atan2(sumSin, sumCos);
    }

    /** The compass bearing (degrees) the camera faces, or NaN. */
    double facingDeg(float[] cameraForward) {
        double ar = arHeading(cameraForward);
        if (Double.isNaN(ar) || !ready()) return Double.NaN;
        return (Math.toDegrees(ar + Math.atan2(sumSin, sumCos)) % 360 + 360) % 360;
    }

    /** Heading of a horizontal direction in the AR world, or NaN when looking up or down. */
    static double arHeading(float[] direction) {
        double length = Math.hypot(direction[0], direction[2]);
        return length < 0.5 ? Double.NaN : Math.atan2(direction[0], -direction[2]);
    }

    /** True-north bearing of the back camera from the rotation sensor, or null. */
    private Double trueHeadingDeg() {
        float east;
        float north;
        synchronized (rotation) {
            if (!haveRotation) return null;
            // The back camera looks along the device's -Z axis.
            east = -rotation[2];
            north = -rotation[5];
        }
        if (Math.hypot(east, north) < 0.5) return null;
        return Math.toDegrees(Math.atan2(east, north)) + declinationDeg;
    }
}
