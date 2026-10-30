package com.nativelongisland.onthissite;

import android.graphics.ImageFormat;
import android.graphics.Rect;
import android.graphics.YuvImage;
import android.media.Image;
import android.os.SystemClock;
import com.google.ar.core.Camera;
import com.google.ar.core.CameraIntrinsics;
import com.google.ar.core.Frame;
import com.google.ar.core.Pose;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Finds this phone in a scanned space with our own positioning service
 * (/nli-scan-queue/spaces/:id/localize): a camera frame goes up, the server
 * matches it against the space's position map and returns where the camera
 * was in the space. Paired with ARCore's pose for the same frame, a few fixes
 * give the session -> space transform (yaw + translation; both are
 * gravity-aligned). Replaces cloud anchors: no third-party service.
 */
final class SpaceLocalizer {
    private static final long SEARCH_EVERY_MS = 1500;
    private static final long REFINE_EVERY_MS = 12000;
    private static final int GOOD_FIXES = 6;
    private static final float OUTLIER_M = 0.35f;

    private final String spaceId;
    private final String accessToken;
    // Sign-in tokens expire after 15 minutes; a visit pass (from the token,
    // on the first request) keeps positioning working for hours.
    private String visitPass;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final List<float[]> sessionPoses = new ArrayList<>();
    private final List<float[]> spacePoses = new ArrayList<>();
    private volatile boolean busy;
    private volatile String status = "Looking around to find where you are…";
    private volatile boolean unavailable;
    private long lastRequestAt;
    private float[] transform;
    private float residual = -1f;
    private int attempts;
    // Latest camera pose in the space straight from the server (works without
    // ARCore tracking: "photo mode" re-locates about once a second).
    private volatile float[] lastSpacePose;
    private volatile long lastSpacePoseAt;

    SpaceLocalizer(String spaceId, String accessToken) {
        this.spaceId = spaceId;
        this.accessToken = accessToken;
    }

    /** Call on the GL thread every tracked frame; sends a frame now and then. */
    void onFrame(Frame frame, Camera camera) {
        onFrame(frame, camera, true);
    }

    /** tracked=false: ARCore isn't tracking, so keep re-locating every second and use the server pose directly. */
    void onFrame(Frame frame, Camera camera, boolean tracked) {
        long now = SystemClock.uptimeMillis();
        long every = !tracked ? 1000 : locked() ? REFINE_EVERY_MS : SEARCH_EVERY_MS;
        if (busy || unavailable || now - lastRequestAt < every) return;
        if (tracked && locked() && sessionPoses.size() >= GOOD_FIXES) return;
        Image image;
        try {
            image = frame.acquireCameraImage();
        } catch (Exception error) {
            return;
        }
        int width = image.getWidth();
        int height = image.getHeight();
        byte[] nv21 = toNv21(image);
        image.close();
        CameraIntrinsics intrinsics = camera.getImageIntrinsics();
        float[] focal = intrinsics.getFocalLength();
        float[] principal = intrinsics.getPrincipalPoint();
        float[] cameraPose = poseArray(camera.getPose());
        lastRequestAt = now;
        busy = true;
        attempts++;
        worker.execute(() -> {
            try {
                ByteArrayOutputStream jpeg = new ByteArrayOutputStream();
                new YuvImage(nv21, ImageFormat.NV21, width, height, null).compressToJpeg(new Rect(0, 0, width, height), 85, jpeg);
                JSONObject result = post(jpeg.toByteArray(), focal[0], focal[1], principal[0], principal[1]);
                if (result.optBoolean("ok")) {
                    JSONArray pose = result.getJSONArray("pose");
                    float[] space = new float[7];
                    for (int i = 0; i < 7; i++) space[i] = (float) pose.getDouble(i);
                    lastSpacePose = space;
                    lastSpacePoseAt = SystemClock.uptimeMillis();
                    if (tracked) addFix(cameraPose, space);
                    else status = "Found your place in the scan";
                } else if (!locked()) {
                    status = attempts < 4 ? "Looking around to find where you are…"
                        : "Point at walls and objects that were scanned (" + result.optString("reason", "no match") + ").";
                }
            } catch (Exception error) {
                status = error.getMessage();
            } finally {
                busy = false;
            }
        });
    }

    private synchronized void addFix(float[] session, float[] space) {
        sessionPoses.add(session);
        spacePoses.add(space);
        float[] fit = ArPlacement.fitYawTranslation(sessionPoses, spacePoses);
        // Drop fixes that disagree with the rest (a mismatched view).
        if (sessionPoses.size() >= 3) {
            float[] t = java.util.Arrays.copyOf(fit, 7);
            for (int i = sessionPoses.size() - 1; i >= 0; i--) {
                float[] mapped = ArPlacement.compose(t, sessionPoses.get(i));
                float[] s = spacePoses.get(i);
                double error = Math.sqrt(Math.pow(mapped[0] - s[0], 2) + Math.pow(mapped[1] - s[1], 2) + Math.pow(mapped[2] - s[2], 2));
                if (error > OUTLIER_M) {
                    sessionPoses.remove(i);
                    spacePoses.remove(i);
                }
            }
            fit = ArPlacement.fitYawTranslation(sessionPoses, spacePoses);
        }
        if (fit == null) return;
        transform = java.util.Arrays.copyOf(fit, 7);
        residual = fit[7];
        status = String.format(Locale.US, "Found your place (%d fix%s, ±%.0f cm)",
            sessionPoses.size(), sessionPoses.size() == 1 ? "" : "es", residual * 100);
    }

    /** Camera pose in the space from the last server fix, or null if older than maxAgeMs. */
    float[] recentSpacePose(long maxAgeMs) {
        float[] pose = lastSpacePose;
        return pose != null && SystemClock.uptimeMillis() - lastSpacePoseAt <= maxAgeMs ? pose : null;
    }

    synchronized float[] transform() {
        return transform == null ? null : transform.clone();
    }

    synchronized float residual() {
        return residual;
    }

    synchronized int fixes() {
        return sessionPoses.size();
    }

    boolean locked() {
        return transform != null;
    }

    String status() {
        return status;
    }

    void close() {
        worker.shutdownNow();
    }

    private JSONObject post(byte[] jpeg, float fx, float fy, float cx, float cy) throws Exception {
        if (visitPass == null) {
            try {
                visitPass = ScanUploader.post("/spaces/" + spaceId + "/visit", accessToken).getJSONObject("data").getString("pass");
            } catch (Exception error) {
                visitPass = "";  // older server: keep using the sign-in token
            }
        }
        String query = String.format(Locale.US, "?fx=%.3f&fy=%.3f&cx=%.3f&cy=%.3f", fx, fy, cx, cy);
        HttpURLConnection connection = (HttpURLConnection) new URL(ScanUploader.QUEUE + "/spaces/" + spaceId + "/localize" + query).openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(25000);
        if (visitPass.isEmpty()) connection.setRequestProperty("Authorization", "Bearer " + accessToken);
        else connection.setRequestProperty("X-AR-Visit", visitPass);
        connection.setRequestProperty("Content-Type", "image/jpeg");
        connection.setFixedLengthStreamingMode(jpeg.length);
        connection.setDoOutput(true);
        try (OutputStream out = connection.getOutputStream()) {
            out.write(jpeg);
        }
        int code = connection.getResponseCode();
        InputStream in = code < 400 ? connection.getInputStream() : connection.getErrorStream();
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        if (in != null) try (InputStream stream = in) {
            ArScene.copy(stream, body);
        }
        String text = body.toString("UTF-8");
        if (code == 401) throw new IllegalStateException("Sign in again to use AR here.");
        if (code == 404) {
            unavailable = true;
            throw new IllegalStateException("This place doesn't have a position map yet. It's added when the scan is processed.");
        }
        if (code >= 400 && !text.startsWith("{")) throw new IllegalStateException("Positioning is unavailable right now (" + code + ").");
        return new JSONObject(text.isEmpty() ? "{}" : text);
    }

    /** YUV_420_888 camera image to NV21, respecting row and pixel strides. */
    static byte[] toNv21(Image image) {
        int width = image.getWidth();
        int height = image.getHeight();
        byte[] out = new byte[width * height * 3 / 2];
        Image.Plane[] planes = image.getPlanes();
        ByteBuffer y = planes[0].getBuffer();
        int yRow = planes[0].getRowStride();
        for (int row = 0; row < height; row++) {
            y.position(row * yRow);
            y.get(out, row * width, width);
        }
        ByteBuffer u = planes[1].getBuffer();
        ByteBuffer v = planes[2].getBuffer();
        int uvRow = planes[1].getRowStride();
        int uvPixel = planes[1].getPixelStride();
        int offset = width * height;
        for (int row = 0; row < height / 2; row++) {
            for (int col = 0; col < width / 2; col++) {
                int index = row * uvRow + col * uvPixel;
                out[offset++] = v.get(index);
                out[offset++] = u.get(index);
            }
        }
        return out;
    }

    static float[] poseArray(Pose pose) {
        return new float[] {pose.tx(), pose.ty(), pose.tz(), pose.qx(), pose.qy(), pose.qz(), pose.qw()};
    }
}
