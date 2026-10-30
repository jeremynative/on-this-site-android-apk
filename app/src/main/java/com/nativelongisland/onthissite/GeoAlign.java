package com.nativelongisland.onthissite;

import java.util.ArrayList;
import java.util.List;

/**
 * Places an ARCore session on the map from GPS and the compass, so earlier
 * scans of a place can be shown (roughly, within a few metres) as soon as the
 * scanner opens, before the camera recognizes the spot.
 *
 * The "geo frame" is metres around a reference latitude/longitude with
 * x = east, y = up, z = south (the scan pipeline's map frame). A frame is
 * placed in it by a turn about the vertical axis and a shift:
 *   p_geo = Ry(theta) * p + t.
 * The scan pipeline stores the same for each processed place, so
 * session -> place = (place -> geo)^-1 * (session -> geo).
 * Plain Java so it can be checked without a device.
 */
final class GeoAlign {
    static final double M_PER_DEG_LAT = 110540.0;
    static final double M_PER_DEG_LNG = 111320.0;

    /** East and north metres of (lat, lng) from (lat0, lng0). */
    static double[] eastNorth(double lat, double lng, double lat0, double lng0) {
        return new double[] {(lng - lng0) * M_PER_DEG_LNG * Math.cos(Math.toRadians(lat0)), (lat - lat0) * M_PER_DEG_LAT};
    }

    /** Rotates v by quaternion q (x, y, z, w). */
    static double[] rotate(double[] q, double[] v) {
        double x = q[0], y = q[1], z = q[2], w = q[3];
        double tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
        return new double[] {v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)};
    }

    /** Angle of a horizontal direction in the (x, z) plane, counter-clockwise seen from above. */
    static double planeAngle(double x, double z) {
        return Math.atan2(-z, x);
    }

    /**
     * Turn about the vertical that takes a session direction into the geo
     * frame, from the camera's viewing direction in the session and the
     * device's attitude (rotation vector: device -> east/north/up, magnetic)
     * plus the magnetic declination in degrees (east positive). The phone's
     * camera looks out of the back of the device, along device -z. NaN when
     * the camera points too steeply up or down for a heading.
     */
    static double yaw(double[] sessionForward, double[] attitudeEnu, double declinationDeg) {
        double[] f = rotate(attitudeEnu, new double[] {0, 0, -1}); // east, north(magnetic), up
        double horizontalGeo = Math.hypot(f[0], f[1]);
        double horizontalSession = Math.hypot(sessionForward[0], sessionForward[2]);
        if (horizontalGeo < 0.3 || horizontalSession < 0.3) return Double.NaN;
        // Geo frame (east, up, south); declination turns magnetic bearings clockwise.
        double alphaGeo = planeAngle(f[0], -f[1]) - Math.toRadians(declinationDeg);
        return wrap(alphaGeo - planeAngle(sessionForward[0], sessionForward[2]));
    }

    static double wrap(double a) {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
    }

    /** Ry(theta) * p for p = (x, y, z). */
    static double[] turn(double theta, double[] p) {
        double c = Math.cos(theta), s = Math.sin(theta);
        return new double[] {p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c};
    }

    /** A frame placed on the map: p_geo = Ry(theta) * p + t. */
    static final class Placement {
        final double theta;
        final double[] t;

        Placement(double theta, double[] t) {
            this.theta = theta;
            this.t = t;
        }

        double[] toGeo(double[] p) {
            double[] r = turn(theta, p);
            return new double[] {r[0] + t[0], r[1] + t[1], r[2] + t[2]};
        }

        double[] fromGeo(double[] g) {
            return turn(-theta, new double[] {g[0] - t[0], g[1] - t[1], g[2] - t[2]});
        }
    }

    /**
     * Session -> place pose (x, y, z, qx, qy, qz, qw), the same form as the
     * localizer's transform: compose(result, sessionPose) = placePose.
     */
    static float[] sessionToPlace(Placement session, Placement place) {
        double phi = session.theta - place.theta;
        double[] shift = turn(-place.theta, new double[] {session.t[0] - place.t[0], session.t[1] - place.t[1], session.t[2] - place.t[2]});
        return new float[] {(float) shift[0], (float) shift[1], (float) shift[2], 0f, (float) Math.sin(phi / 2), 0f, (float) Math.cos(phi / 2)};
    }

    /**
     * Collects GPS + compass samples during a session and estimates where the
     * session sits on the map around the place's reference point. Heights are
     * matched by camera height (the phone's average height in each scan).
     */
    static final class Estimator {
        private final double lat0, lng0;
        private final List<double[]> yaws = new ArrayList<>(); // sin, cos
        private final List<double[]> fixes = new ArrayList<>(); // session x, z, geo east, geo south, weight
        private double heightSum;
        private int heightCount;

        Estimator(double lat0, double lng0) {
            this.lat0 = lat0;
            this.lng0 = lng0;
        }

        synchronized void add(double[] cameraPosition, double[] forward, double[] attitudeEnu, double declinationDeg,
                              double lat, double lng, double accuracyM) {
            if (attitudeEnu != null) {
                double y = yaw(forward, attitudeEnu, declinationDeg);
                if (!Double.isNaN(y)) yaws.add(new double[] {Math.sin(y), Math.cos(y)});
            }
            heightSum += cameraPosition[1];
            heightCount++;
            if (!Double.isNaN(lat) && accuracyM <= 25) {
                double[] en = eastNorth(lat, lng, lat0, lng0);
                fixes.add(new double[] {cameraPosition[0], cameraPosition[2], en[0], -en[1], 1.0 / Math.max(2.0, accuracyM)});
            }
        }

        synchronized boolean ready() {
            return yaws.size() >= 10 && fixes.size() >= 5;
        }

        synchronized Placement placement() {
            if (!ready()) return null;
            double s = 0, c = 0;
            for (double[] y : yaws) {
                s += y[0];
                c += y[1];
            }
            double theta = Math.atan2(s, c);
            double wx = 0, wz = 0, w = 0;
            for (double[] f : fixes) {
                double[] r = turn(theta, new double[] {f[0], 0, f[1]});
                wx += (f[2] - r[0]) * f[4];
                wz += (f[3] - r[2]) * f[4];
                w += f[4];
            }
            return new Placement(theta, new double[] {wx / w, -heightSum / heightCount, wz / w});
        }

        /** Rough error in metres: the spread of the GPS fixes around the fit. */
        synchronized double gpsSpreadM() {
            Placement p = placement();
            if (p == null) return Double.NaN;
            double sum = 0;
            for (double[] f : fixes) {
                double[] g = p.toGeo(new double[] {f[0], 0, f[1]});
                sum += Math.hypot(g[0] - f[2], g[2] - f[3]);
            }
            return sum / fixes.size();
        }
    }
}
