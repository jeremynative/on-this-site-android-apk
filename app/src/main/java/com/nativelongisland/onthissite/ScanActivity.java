package com.nativelongisland.onthissite;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.ImageFormat;
import android.graphics.Rect;
import android.graphics.YuvImage;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.Image;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.text.InputType;
import android.util.Size;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import com.google.ar.core.ArCoreApk;
import com.google.ar.core.Camera;
import com.google.ar.core.CameraConfig;
import com.google.ar.core.CameraConfigFilter;
import com.google.ar.core.CameraIntrinsics;
import com.google.ar.core.Config;
import com.google.ar.core.Frame;
import com.google.ar.core.Pose;
import com.google.ar.core.Session;
import com.google.ar.core.TrackingState;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Contributor scan mode: walk a space while the app records keyframes with
 * ARCore's metric, gravity-aligned camera poses. If the space already has a
 * 3D model, our own positioning service (SpaceLocalizer) finds the phone in
 * it so this session joins the same space frame; otherwise the processing PC
 * places it by matching photos. The finished session is uploaded to the scan
 * queue for the processing PC.
 */
public class ScanActivity extends Activity implements GLSurfaceView.Renderer, SensorEventListener, android.location.LocationListener {
    static final String EXTRA_SPACE_ID = "space_id";
    static final String EXTRA_ACCESS_TOKEN = "access_token";
    static final String EXTRA_CREDIT_NAME = "credit_name";

    private static final float KEYFRAME_MOVE_M = 0.12f;
    private static final float KEYFRAME_TURN_DEG = 8f;
    private static final long KEYFRAME_MIN_MS = 300;
    // Without motion tracking, photos are timed; skip ones that look the same
    // as the last (phone held still) unless this long has passed.
    private static final long STILL_PHOTO_MS = 4000;
    private static final float STILL_LUMA_DIFF = 5f;
    // 3D needs each spot seen from several places; below this, warn before upload.
    private static final int FEW_PHOTOS = 25;

    private final ArGl gl = new ArGl();
    private final ExecutorService encoder = Executors.newSingleThreadExecutor();
    private final AtomicInteger encodeQueue = new AtomicInteger();
    private final Object lock = new Object();

    private GLSurfaceView surface;
    private Session session;
    private boolean installRequested;
    private boolean textureBound;
    private int viewportWidth = 1;
    private int viewportHeight = 1;

    private String spaceId;
    private String accessToken;
    private String creditName;
    private boolean spaceHasModel;
    private String spaceTitle = "";
    private SpaceLocalizer localizer;
    private File sessionDir;
    private FileWriter framesOut;

    // Capture state (guarded by lock).
    private boolean recording;
    private int frames;
    private float distance;
    private float[] lastKeyPose;
    private long lastKeyAt;
    private float[] lastPosition;
    private float compassDeg = Float.NaN;
    // Device attitude in east-north-up (rotation vector sensor), x,y,z,w, and
    // the latest GPS fix: every photo carries both so scans can be placed on
    // the map and synced by location even when ARCore never starts tracking.
    private volatile float[] attitude;
    private volatile float[] gravity;
    private volatile android.location.Location lastFix;
    private double[] gpsOrigin;
    // Turn speed and walking, for photos and coaching while ARCore isn't tracking.
    private final ScanMotion motion = new ScanMotion();
    private float[] lastKeyAttitude;
    private static final long TIMED_PHOTO_MS = 600;
    private int trackedPhotos;
    private int updateErrors;
    private int imageErrors;
    private long lastDiagnosticAt;
    private volatile String lastTrackingHelp = "no tracking";

    // Live coverage preview: coloured points on scanned surfaces + mini map.
    private final ScanCoverage coverage = new ScanCoverage();
    private ScanCoverageMapView coverageMap;
    // Live coverage guide over the whole camera view (works without AR tracking).
    private volatile LiveCoverage live;
    private CoverageOverlayView coverageOverlay;
    private long lastViewCheckAt;
    private FloatBuffer coveragePoints;
    // Depth-based surface coverage (red = needs more angles, white = captured).
    private final SurfaceCoverage surfaceCoverage = new SurfaceCoverage();
    private boolean depthEnabled;
    private long lastDepthAt;
    private short[] depthMm = new short[0];
    private final float[] depthSamples = new float[SurfaceCoverage.SAMPLE_FLOATS * 64 * 48];
    private final float[] depthPose = new float[16];
    // The live mesh replaces the flat photo-mode grid while tracking.
    private volatile boolean meshActive;
    private float[] meshTris = new float[0];
    private float[] meshLines = new float[0];
    private FloatBuffer surfaceTris;
    private FloatBuffer surfaceLines;
    private int surfaceTriCount;
    private int surfaceLineCount;
    private static final int MESH_TILES = 25000;
    // Earlier scans of this place, drawn once the localizer has lined us up.
    private FloatBuffer archivePoints;
    private int archivePointCount;
    private final float[] archiveModel = new float[16];
    private final float[] archiveMvp = new float[16];
    // Rough placement of earlier scans from GPS + compass, before the camera recognises the spot.
    private volatile GeoAlign.Placement placeGeo;
    private volatile GeoAlign.Estimator geoEstimator;
    private long geoSampledAt;
    private float[] archiveCentroid;
    private int meshTriBuffer;
    private int meshLineBuffer;
    private long meshLoggedAt;
    private long recordingStartedAt;
    private int surfaceVersionDrawn = -1;
    private long surfaceRebuiltAt;
    private int coveragePointCount;
    private int coverageVersionDrawn = -1;
    private long coverageRebuiltAt;
    private long coverageMapAt;
    private final float[] viewMatrix = new float[16];
    private final float[] projectionMatrix = new float[16];
    private final float[] viewProjection = new float[16];

    private TextView status;
    private TextView detail;
    private Button startButton;
    private Button finishButton;
    private ProgressBar progressBar;
    private long lastStatusAt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        spaceId = getIntent().getStringExtra(EXTRA_SPACE_ID);
        accessToken = getIntent().getStringExtra(EXTRA_ACCESS_TOKEN);
        creditName = getIntent().getStringExtra(EXTRA_CREDIT_NAME);
        buildUi();
        new Thread(this::loadSpace).start();
        File[] pending = ScanUploader.pending(scansRoot());
        if (pending.length > 0) offerPendingUploads(pending);
    }

    private File scansRoot() {
        File root = new File(getFilesDir(), "scans");
        if (!root.isDirectory()) root.mkdirs();
        return root;
    }

    private void loadSpace() {
        try {
            if (spaceId == null || spaceId.isEmpty()) {
                JSONArray spaces = ScanUploader.get("/spaces", accessToken).getJSONArray("data");
                if (spaces.length() == 0) throw new IllegalStateException("No spaces are set up for scanning yet.");
                spaceId = spaces.getJSONObject(0).getString("id");
            }
            JSONObject space = ScanUploader.get("/spaces/" + spaceId, accessToken).getJSONObject("data");
            spaceHasModel = space.optInt("model_version") > 0;
            JSONObject stats = space.optJSONObject("model_stats");
            JSONObject geo = stats == null ? null : stats.optJSONObject("geo");
            if (geo != null && geo.has("lat0") && geo.optJSONArray("t") != null) {
                JSONArray t = geo.getJSONArray("t");
                placeGeo = new GeoAlign.Placement(Math.toRadians(geo.getDouble("yaw_deg")),
                    new double[] {t.getDouble(0), t.getDouble(1), t.getDouble(2)});
                geoEstimator = new GeoAlign.Estimator(geo.getDouble("lat0"), geo.getDouble("lng0"));
            }
            spaceTitle = space.optString("title");
            // Line up with earlier scans and show them while still in the preview.
            if (spaceHasModel && accessToken != null) {
                synchronized (lock) {
                    if (localizer == null) localizer = new SpaceLocalizer(spaceId, accessToken);
                }
                new Thread(this::loadArchivePoints, "scan-archive").start();
            }
            StringBuilder areas = new StringBuilder();
            JSONArray credits = space.optJSONArray("credits");
            for (int i = 0; credits != null && i < credits.length(); i++) {
                JSONObject c = credits.getJSONObject(i);
                areas.append("\n• ").append(c.optString("name")).append(": ").append(join(c.optJSONArray("areas")));
            }
            String title = space.optString("title");
            String summary = credits == null || credits.length() == 0
                ? "Nobody has scanned " + title + " yet. Your scan starts it."
                : "Already scanned in " + title + ":" + areas
                    + (spaceHasModel ? "\n\nStart where someone already scanned so your scan lines up with theirs."
                        : "\n\nAdd any room or area; it will be fitted to the others when processed.");
            runOnUiThread(() -> {
                status.setText(title);
                detail.setText(summary);
                startButton.setEnabled(true);
            });
        } catch (Exception error) {
            runOnUiThread(() -> {
                status.setText("Can't load the space");
                detail.setText(error.getMessage());
            });
        }
    }

    private static String join(JSONArray array) {
        if (array == null || array.length() == 0) return "unnamed areas";
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < array.length(); i++) out.append(i == 0 ? "" : ", ").append(array.optString(i));
        return out.toString();
    }

    // ---- Lifecycle ----

    @Override
    protected void onResume() {
        super.onResume();
        if (session == null) {
            if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[] {Manifest.permission.CAMERA}, 51);
                return;
            }
            try {
                ArCoreApk.Availability availability = ArCoreApk.getInstance().checkAvailability(this);
                if (availability.isTransient()) {
                    surface.postDelayed(this::onResumeRetry, 300);
                    return;
                }
                if (!availability.isSupported()) {
                    status.setText("This device can't scan");
                    detail.setText("Scanning needs a phone that supports Google Play Services for AR.");
                    return;
                }
                if (ArCoreApk.getInstance().requestInstall(this, !installRequested) == ArCoreApk.InstallStatus.INSTALL_REQUESTED) {
                    installRequested = true;
                    return;
                }
                session = new Session(this);
                configure();
            } catch (Exception error) {
                status.setText("AR isn't available");
                detail.setText(error.getClass().getSimpleName());
                return;
            }
        }
        try {
            session.resume();
        } catch (Exception error) {
            status.setText("The camera is busy in another app.");
            return;
        }
        surface.onResume();
        SensorManager sensors = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        // Gravity from the accelerometer (every phone has one) lets the PC level
        // the 3D model even when there's no gyroscope, compass or AR tracking.
        Sensor accelerometer = sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (accelerometer != null) sensors.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);
        Sensor rotation = sensors.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        if (rotation != null) sensors.registerListener(this, rotation, SensorManager.SENSOR_DELAY_GAME);
        startLocationUpdates();
    }

    private void onResumeRetry() {
        if (!isFinishing()) onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        ((SensorManager) getSystemService(Context.SENSOR_SERVICE)).unregisterListener(this);
        try {
            ((android.location.LocationManager) getSystemService(Context.LOCATION_SERVICE)).removeUpdates(this);
        } catch (Exception ignored) {
            // Location was never started.
        }
        if (session != null) {
            surface.onPause();
            session.pause();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // The upload carries on in its service; just stop updating this screen.
        ScanUploadService.listener = null;
        if (session != null) session.close();
        if (localizer != null) localizer.close();
        if (live != null) live.close();
        encoder.shutdown();
    }

    private void configure() {
        // A sharp CPU image helps photogrammetry, but ARCore's tracking must
        // keep up: the largest mode on the S25 overflowed ARCore's feature and
        // IMU buffers and it never started tracking. Use the largest image up
        // to 1920 px wide at <= 30 fps, else ARCore's default.
        CameraConfigFilter filter = new CameraConfigFilter(session);
        filter.setTargetFps(java.util.EnumSet.of(CameraConfig.TargetFps.TARGET_FPS_30));
        CameraConfig best = null;
        for (CameraConfig config : session.getSupportedCameraConfigs(filter)) {
            Size size = config.getImageSize();
            if (size.getWidth() > 1920) continue;
            if (best == null || size.getWidth() * size.getHeight() > best.getImageSize().getWidth() * best.getImageSize().getHeight()) best = config;
        }
        if (best != null) session.setCameraConfig(best);
        android.util.Log.i("OnThisSiteScan", "camera config " + (best == null ? "default" : best.getImageSize() + " @ " + best.getFpsRange()));
        Config config = new Config(session);
        config.setPlaneFindingMode(Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL);
        config.setFocusMode(Config.FocusMode.AUTO);
        config.setUpdateMode(Config.UpdateMode.LATEST_CAMERA_IMAGE);
        config.setLightEstimationMode(Config.LightEstimationMode.DISABLED);
        depthEnabled = session.isDepthModeSupported(Config.DepthMode.AUTOMATIC);
        if (depthEnabled) config.setDepthMode(Config.DepthMode.AUTOMATIC);
        android.util.Log.i("OnThisSiteScan", "depth " + (depthEnabled ? "on" : "unsupported"));
        session.configure(config);
    }

    // ---- Capture ----

    private void startScan(String areaLabel, String credit, boolean creditPublic) {
        try {
            sessionDir = new File(scansRoot(), new java.text.SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(new java.util.Date()) + "-" + UUID.randomUUID().toString().substring(0, 6));
            new File(sessionDir, "frames").mkdirs();
            framesOut = new FileWriter(new File(sessionDir, "frames.jsonl"));
            JSONObject meta = new JSONObject()
                .put("schema", 1).put("space_id", spaceId).put("area_label", areaLabel)
                .put("credit_name", credit).put("credit_public", creditPublic)
                .put("device", Build.MANUFACTURER + " " + Build.MODEL).put("arcore", "1.56.0")
                .put("started_at", System.currentTimeMillis())
                .put("sensor_orientation", cameraSensorOrientation())
                .put("declination_deg", declinationDeg());
            ScanUploader.write(new File(sessionDir, "meta.json"), meta.toString());
            File dir = sessionDir;
            if (accessToken != null && spaceId != null) new Thread(() -> {
                try {
                    String[] ids = ScanUploader.createSession(dir, spaceId, meta, accessToken);
                    live = new LiveCoverage(ids[0], ids[1], (grid, vertices) -> runOnUiThread(() -> {
                        if (!meshActive) coverageOverlay.show(grid, vertices);
                    }));
                } catch (Exception error) {
                    android.util.Log.w("OnThisSiteScan", "Live coverage unavailable: " + error.getMessage());
                }
            }).start();
        } catch (Exception error) {
            detail.setText("Couldn't start: " + error.getMessage());
            return;
        }
        synchronized (lock) {
            recording = true;
            recordingStartedAt = SystemClock.uptimeMillis();
            frames = 0;
            distance = 0f;
            lastKeyPose = null;
            lastPosition = null;
        }
        if (spaceHasModel && accessToken != null && localizer == null) {
            localizer = new SpaceLocalizer(spaceId, accessToken);
            new Thread(this::loadArchivePoints, "scan-archive").start();
        }
        startButton.setVisibility(View.GONE);
        finishButton.setVisibility(View.VISIBLE);
    }

    @Override
    public void onSurfaceCreated(GL10 unused, EGLConfig config) {
        GLES20.glClearColor(0f, 0f, 0f, 1f);
        gl.init();
        textureBound = false;
        // Buffers from the old GL context are gone: rebuild the mesh.
        meshTriBuffer = 0;
        meshLineBuffer = 0;
        surfaceVersionDrawn = -1;
    }

    @Override
    public void onSurfaceChanged(GL10 unused, int width, int height) {
        GLES20.glViewport(0, 0, width, height);
        viewportWidth = width;
        viewportHeight = height;
        if (session != null) session.setDisplayGeometry(getWindowManager().getDefaultDisplay().getRotation(), width, height);
    }

    @Override
    public void onDrawFrame(GL10 unused) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT | GLES20.GL_DEPTH_BUFFER_BIT);
        Session current = session;
        if (current == null) return;
        if (!textureBound) {
            current.setCameraTextureName(gl.cameraTexture);
            current.setDisplayGeometry(getWindowManager().getDefaultDisplay().getRotation(), viewportWidth, viewportHeight);
            textureBound = true;
        }
        Frame frame;
        try {
            frame = current.update();
        } catch (Exception error) {
            if (updateErrors++ % 120 == 0) android.util.Log.w("OnThisSiteScan", "Frame update failed", error);
            postStatus("The camera isn't delivering frames", "Close the scanner and try again. (" + error.getClass().getSimpleName() + ")");
            return;
        }
        gl.drawBackground(frame);
        Camera camera = frame.getCamera();
        TrackingState tracking = camera.getTrackingState();
        long now = SystemClock.uptimeMillis();
        if (now - lastDiagnosticAt > 2000) {
            lastDiagnosticAt = now;
            android.util.Log.i("OnThisSiteScan", "tracking=" + tracking + " reason=" + camera.getTrackingFailureReason()
                + " recording=" + recording + " photos=" + frames + " encodeQueue=" + encodeQueue.get() + " imageErrors=" + imageErrors);
        }
        boolean tracked = tracking == TrackingState.TRACKING;
        synchronized (lock) {
            if (!recording) {
                // Scanning never waits for ARCore: photos + GPS are enough.
                String ready = lastFix == null ? "Ready · finding GPS…" : String.format(Locale.US, "Ready · GPS ±%.0f m", lastFix.getAccuracy());
                String archive = null;
                if (tracked && localizer != null) {
                    // Preview: find this place's earlier scans and show them before recording.
                    localizer.onFrame(frame, camera);
                    sampleGeo(camera, now);
                    camera.getViewMatrix(viewMatrix, 0);
                    camera.getProjectionMatrix(projectionMatrix, 0, 0.05f, 100f);
                    android.opengl.Matrix.multiplyMM(viewProjection, 0, projectionMatrix, 0, viewMatrix, 0);
                    drawArchive();
                    String where = archiveDirection(camera);
                    archive = localizer.locked() && archivePointCount > 0
                        ? "Earlier scans of this place are shown as dots: blue = well captured, violet = thin. Start where you want to add or redo detail."
                        : where != null ? where
                        : "Point the camera at part of the place that was scanned before to see the earlier scans.";
                }
                postStatus(ready, archive);
                return;
            }
            Pose pose = tracked ? camera.getPose() : null;
            if (pose != null) {
                float[] position = pose.getTranslation();
                if (lastPosition != null) distance += dist(position, lastPosition);
                lastPosition = position;
                coverage.addPathPoint(position[0], position[2]);
            } else if (lastFix != null) {
                float[] xz = gpsLocalXZ(lastFix);
                coverage.addPathPoint(xz[0], xz[1]);
            }
            maybeKeyframe(frame, camera, pose);
            if (tracked) sampleGeo(camera, now);
            checkLiveView(frame, now);
            if (tracked && depthEnabled && now - lastDepthAt >= 250) {
                lastDepthAt = now;
                addDepth(frame, camera, false);
            }
            if (tracked) {
                drawCoverage(camera, now);
                if (localizer != null) localizer.onFrame(frame, camera);
            } else {
                updateGpsMap(now);
            }
            String placement = tracked
                ? (localizer == null ? (spaceHasModel ? "Will be fitted to the space when processed" : "First scan of this place")
                    : localizer.locked() ? "Lined up with earlier scans ✓ " + localizer.status() : localizer.status())
                : (lastFix == null ? "Recording photos · waiting for GPS" : String.format(Locale.US, "Recording photos · GPS ±%.0f m", lastFix.getAccuracy()));
            String motionHint = tracked ? null : motion.hint(now);
            if (motionHint != null) {
                placement = motionHint;
            } else if (!tracked && recording && frames > 0 && now - lastKeyAt > 2500) {
                placement = "The view hasn't changed. Take a step to the side, then keep walking slowly.";
            }
            String legend = tracked && depthEnabled && surfaceCoverage.cellCount() > 0
                ? String.format(Locale.US, "\nRed = needs photos from more angles · green = complete (%.0f%%)", surfaceCoverage.capturedFraction() * 100)
                : live != null ? "\nRed = not captured yet · green = covered" : "";
            if (archivePointCount > 0 && localizer != null && localizer.locked()) {
                legend += "\nBlue dots = already in the archive · violet = thin, worth rescanning";
            } else if (archivePointCount > 0 && roughArchiveTransform() != null) {
                legend += "\nBlue dots = earlier scans, placed roughly by GPS until the camera recognises the spot";
            }
            postStatus(null, String.format(Locale.US, "Recording %s \u00b7 %d photos%s\n%s%s", ScanUploader.clock(now - recordingStartedAt), frames,
                distance > 0.5f ? String.format(Locale.US, " · %.0f m walked", distance) : "", placement, legend));
        }
    }

    /** About once a second, ask which parts of the current view are already captured. */
    private void checkLiveView(Frame frame, long now) {
        LiveCoverage guide = live;
        if (guide == null || !guide.wantsView() || now - lastViewCheckAt < 900) return;
        Image image;
        try {
            image = frame.acquireCameraImage();
        } catch (Exception error) {
            return;
        }
        lastViewCheckAt = now;
        int width = image.getWidth();
        int height = image.getHeight();
        byte[] nv21 = SpaceLocalizer.toNv21(image);
        image.close();
        // Where the grid's corners land on screen for this frame.
        int rows = LiveCoverage.ROWS, cols = LiveCoverage.COLS;
        float[] corners = new float[(rows + 1) * (cols + 1) * 2];
        for (int r = 0, i = 0; r <= rows; r++) {
            for (int c = 0; c <= cols; c++) {
                corners[i++] = width * c / (float) cols;
                corners[i++] = height * r / (float) rows;
            }
        }
        float[] onScreen = new float[corners.length];
        frame.transformCoordinates2d(com.google.ar.core.Coordinates2d.IMAGE_PIXELS, corners, com.google.ar.core.Coordinates2d.VIEW, onScreen);
        guide.checkView(nv21, width, height, onScreen);
    }

    /** Mini map from GPS while ARCore isn't tracking. */
    private void updateGpsMap(long now) {
        android.location.Location fix = lastFix;
        if (coverageMap == null || fix == null || now - coverageMapAt < 500) return;
        coverageMapAt = now;
        float[] xz = gpsLocalXZ(fix);
        float heading = Float.isNaN(compassDeg) ? 0f : (float) Math.toRadians(compassDeg);
        ScanCoverage.Snapshot snapshot = coverage.snapshot();
        String label = String.format(Locale.US, "%d photos · GPS ±%.0f m", frames, fix.getAccuracy());
        runOnUiThread(() -> coverageMap.update(snapshot, xz[0], xz[1], heading, label));
    }

    /** Coloured points on the surfaces captured so far, and a 3 Hz mini-map refresh. */
    private void drawCoverage(Camera camera, long now) {
        int version = coverage.version();
        if (version != coverageVersionDrawn && now - coverageRebuiltAt > 400) {
            float[] vertices = coverage.pointVertices();
            if (coveragePoints == null || coveragePoints.capacity() < vertices.length) {
                coveragePoints = ByteBuffer.allocateDirect(Math.max(vertices.length, 7 * 4096) * 2 * 4).order(ByteOrder.nativeOrder()).asFloatBuffer();
            }
            coveragePoints.clear();
            coveragePoints.put(vertices);
            coveragePointCount = vertices.length / 7;
            coverageVersionDrawn = version;
            coverageRebuiltAt = now;
        }
        camera.getViewMatrix(viewMatrix, 0);
        camera.getProjectionMatrix(projectionMatrix, 0, 0.05f, 100f);
        android.opengl.Matrix.multiplyMM(viewProjection, 0, projectionMatrix, 0, viewMatrix, 0);
        if (depthEnabled && surfaceCoverage.cellCount() > 0) {
            if (!meshActive) {
                meshActive = true;
                runOnUiThread(() -> coverageOverlay.setVisibility(View.GONE));
            }
            int surfaceVersion = surfaceCoverage.version();
            boolean stale = surfaceVersion != surfaceVersionDrawn || now - surfaceRebuiltAt > 2000;
            if (stale && now - surfaceRebuiltAt > 400) {
                // Detailed tiles near the phone, merged ones farther out; shrink the detailed radius until it fits.
                if (meshTris.length == 0) {
                    meshTris = new float[MESH_TILES * 6 * SurfaceCoverage.VERTEX_FLOATS];
                    meshLines = new float[MESH_TILES * 8 * SurfaceCoverage.VERTEX_FLOATS];
                    surfaceTris = ByteBuffer.allocateDirect(meshTris.length * 4).order(ByteOrder.nativeOrder()).asFloatBuffer();
                    surfaceLines = ByteBuffer.allocateDirect(meshLines.length * 4).order(ByteOrder.nativeOrder()).asFloatBuffer();
                }
                Pose at = camera.getPose();
                long started = SystemClock.uptimeMillis();
                int[] counts = null;
                for (float radius : new float[] {4f, 3f, 2f, 1.2f}) {
                    counts = surfaceCoverage.mesh(at.tx(), at.ty(), at.tz(), radius, 2.5f, meshTris, meshLines);
                    if (counts[2] == 0) break;
                }
                if (meshTriBuffer == 0) {
                    meshTriBuffer = gl.newMeshBuffer();
                    meshLineBuffer = gl.newMeshBuffer();
                }
                surfaceTris.clear();
                surfaceTris.put(meshTris, 0, counts[0] * SurfaceCoverage.VERTEX_FLOATS);
                surfaceLines.clear();
                surfaceLines.put(meshLines, 0, counts[1] * SurfaceCoverage.VERTEX_FLOATS);
                gl.fillMeshBuffer(meshTriBuffer, surfaceTris, counts[0]);
                gl.fillMeshBuffer(meshLineBuffer, surfaceLines, counts[1]);
                surfaceTriCount = counts[0];
                surfaceLineCount = counts[1];
                surfaceVersionDrawn = surfaceVersion;
                surfaceRebuiltAt = now;
                if (now - meshLoggedAt > 5000) {
                    meshLoggedAt = now;
                    android.util.Log.i("OnThisSiteScan", "mesh cells=" + surfaceCoverage.cellCount() + " detailed=" + surfaceCoverage.detailedCells() + " tiles=" + counts[0] / 6
                        + " lines=" + counts[1] / 8 + " full=" + counts[2] + " built_ms=" + (SystemClock.uptimeMillis() - started)
                        + " glError=" + GLES20.glGetError());
                }
            }
            gl.drawMesh(viewProjection, meshTriBuffer, surfaceTriCount, GLES20.GL_TRIANGLES, true);
            gl.drawMesh(viewProjection, meshLineBuffer, surfaceLineCount, GLES20.GL_LINES, false);
        } else {
            gl.drawPoints(viewProjection, coveragePoints, coveragePointCount, 22f * getResources().getDisplayMetrics().density / 2.6f);
        }
        drawArchive();
        if (now - coverageMapAt > 330 && coverageMap != null) {
            coverageMapAt = now;
            Pose display = camera.getDisplayOrientedPose();
            float[] forward = display.getZAxis();
            float heading = (float) Math.atan2(-forward[0], forward[2]);
            float x = display.tx(), z = display.tz();
            ScanCoverage.Snapshot snapshot = coverage.snapshot();
            String label = String.format(Locale.US, "~%.0f m² covered · %d photos", coverage.coveredAreaM2(), frames);
            runOnUiThread(() -> coverageMap.update(snapshot, x, z, heading, label));
        }
    }

    /** Earlier scans of this place, in place, once the localizer has lined this session up with them. */
    private void drawArchive() {
        if (archivePoints == null) return;
        // Session -> place: exact once the camera has recognised the spot, else rough from GPS + compass.
        float[] transform = localizer != null && localizer.locked() ? localizer.transform() : roughArchiveTransform();
        if (transform == null) return;
        // The transform maps this session into the space; points come in space coordinates.
        float[] origin = ArPlacement.inverse(transform);
        new Pose(new float[] {origin[0], origin[1], origin[2]}, new float[] {origin[3], origin[4], origin[5], origin[6]})
            .toMatrix(archiveModel, 0);
        android.opengl.Matrix.multiplyMM(archiveMvp, 0, viewProjection, 0, archiveModel, 0);
        gl.drawPoints(archiveMvp, archivePoints, archivePointCount, 28f * getResources().getDisplayMetrics().density / 2.6f);
    }

    /** Session -> place from GPS + compass, or null until there are enough readings. */
    private float[] roughArchiveTransform() {
        GeoAlign.Estimator estimator = geoEstimator;
        GeoAlign.Placement place = placeGeo;
        GeoAlign.Placement session = estimator == null ? null : estimator.placement();
        return place == null || session == null ? null : GeoAlign.sessionToPlace(session, place);
    }

    /** Twice a second while tracking: where the phone is (GPS) and which way the camera faces (compass). */
    private void sampleGeo(Camera camera, long now) {
        GeoAlign.Estimator estimator = geoEstimator;
        android.location.Location fix = lastFix;
        float[] att = attitude;
        if (estimator == null || fix == null || att == null || now - geoSampledAt < 500) return;
        geoSampledAt = now;
        Pose pose = camera.getPose();
        float[] z = pose.getZAxis();
        estimator.add(new double[] {pose.tx(), pose.ty(), pose.tz()}, new double[] {-z[0], -z[1], -z[2]},
            new double[] {att[0], att[1], att[2], att[3]}, declinationDeg(), fix.getLatitude(), fix.getLongitude(), fix.getAccuracy());
    }

    /** Magnetic declination here (degrees, east positive): compass bearings + this = true bearings. */
    private float declinationDeg() {
        android.location.Location fix = lastFix;
        if (fix == null) return 0f;
        return new android.hardware.GeomagneticField((float) fix.getLatitude(), (float) fix.getLongitude(),
            (float) fix.getAltitude(), System.currentTimeMillis()).getDeclination();
    }

    /** "Earlier scans are about 35 m north-east of you" while they're too far away to see. */
    private String archiveDirection(Camera camera) {
        GeoAlign.Estimator estimator = geoEstimator;
        GeoAlign.Placement place = placeGeo, session = estimator == null ? null : estimator.placement();
        float[] centroid = archiveCentroid;
        if (place == null || session == null || centroid == null) return null;
        Pose pose = camera.getPose();
        double[] me = session.toGeo(new double[] {pose.tx(), pose.ty(), pose.tz()});
        double[] them = place.toGeo(new double[] {centroid[0], centroid[1], centroid[2]});
        double east = them[0] - me[0], north = -(them[2] - me[2]);
        double distance = Math.hypot(east, north);
        if (distance < 8) return "Earlier scans are around you (placed roughly by GPS). They snap into place when the camera recognises the spot.";
        String[] names = {"north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"};
        double bearing = (Math.toDegrees(Math.atan2(east, north)) + 360) % 360;
        return String.format(Locale.US, "Earlier scans of this place are about %.0f m %s of you. Walk there to continue them.",
            distance, names[(int) Math.round(bearing / 45) % 8]);
    }

    /**
     * The place's existing 3D points (what earlier scans already captured),
     * shown once this scan has lined up with them so people can extend the
     * archive or redo thin parts. Dense areas are blue, thin ones violet.
     */
    private void loadArchivePoints() {
        try {
            JSONArray values = ScanUploader.get("/spaces/" + spaceId + "/points", accessToken).getJSONArray("points");
            float[] xyz = new float[values.length() / 3 * 3];
            for (int i = 0; i < xyz.length; i++) xyz[i] = (float) values.getDouble(i);
            float[] vertices = ArchiveDensity.colour(xyz);
            float[] centroid = new float[3];
            for (int i = 0; i < xyz.length; i++) centroid[i % 3] += xyz[i] / Math.max(1, xyz.length / 3);
            archiveCentroid = centroid;
            FloatBuffer buffer = ByteBuffer.allocateDirect(vertices.length * 4).order(ByteOrder.nativeOrder()).asFloatBuffer();
            buffer.put(vertices).position(0);
            synchronized (lock) {
                archivePoints = buffer;
                archivePointCount = vertices.length / 7;
            }
            android.util.Log.i("OnThisSiteScan", "archive points=" + archivePointCount);
        } catch (Exception error) {
            android.util.Log.w("OnThisSiteScan", "Archive points unavailable: " + error.getMessage());
        }
    }

    private short[] rawDepthMm = new short[0];
    private byte[] rawConfidence = new byte[0];

    /**
     * ARCore's measured (unsmoothed) depth and its confidence, used to drop
     * surfaces the smoothed depth only guessed. False if unavailable or a
     * different size, in which case the smoothed depth is used alone.
     */
    private boolean readRawDepth(Frame frame, int width, int height) {
        try (Image raw = frame.acquireRawDepthImage16Bits(); Image confidence = frame.acquireRawDepthConfidenceImage()) {
            if (raw.getWidth() != width || raw.getHeight() != height
                || confidence.getWidth() != width || confidence.getHeight() != height) return false;
            if (rawDepthMm.length != width * height) {
                rawDepthMm = new short[width * height];
                rawConfidence = new byte[width * height];
            }
            Image.Plane depthPlane = raw.getPlanes()[0];
            ByteBuffer depthBuffer = depthPlane.getBuffer().order(ByteOrder.nativeOrder());
            Image.Plane confidencePlane = confidence.getPlanes()[0];
            ByteBuffer confidenceBuffer = confidencePlane.getBuffer();
            for (int v = 0; v < height; v++) {
                for (int u = 0; u < width; u++) {
                    rawDepthMm[v * width + u] = depthBuffer.getShort(v * depthPlane.getRowStride() + u * depthPlane.getPixelStride());
                    rawConfidence[v * width + u] = confidenceBuffer.get(v * confidencePlane.getRowStride() + u * confidencePlane.getPixelStride());
                }
            }
            return true;
        } catch (Exception error) {
            return false;
        }
    }

    /** Samples ARCore's depth image into the live surface coverage. */
    private void addDepth(Frame frame, Camera camera, boolean photographed) {
        try (Image depth = frame.acquireDepthImage16Bits()) {
            int width = depth.getWidth(), height = depth.getHeight();
            Image.Plane plane = depth.getPlanes()[0];
            ByteBuffer buffer = plane.getBuffer().order(ByteOrder.nativeOrder());
            int rowStride = plane.getRowStride(), pixelStride = plane.getPixelStride();
            if (depthMm.length != width * height) depthMm = new short[width * height];
            for (int v = 0; v < height; v++) {
                for (int u = 0; u < width; u++) depthMm[v * width + u] = buffer.getShort(v * rowStride + u * pixelStride);
            }
            boolean raw = readRawDepth(frame, width, height);
            // Depth is aligned with the GPU texture, so scale its intrinsics.
            CameraIntrinsics k = camera.getTextureIntrinsics();
            int[] dims = k.getImageDimensions();
            float sx = width / (float) dims[0], sy = height / (float) dims[1];
            float[] f = k.getFocalLength(), c = k.getPrincipalPoint();
            Pose pose = camera.getPose();
            pose.toMatrix(depthPose, 0);
            int n = SurfaceCoverage.unproject(depthMm, width, height, f[0] * sx, f[1] * sy, c[0] * sx, c[1] * sy,
                depthPose, 64, 48, depthSamples, raw ? rawDepthMm : null, raw ? rawConfidence : null);
            surfaceCoverage.add(depthSamples, n, pose.tx(), pose.ty(), pose.tz(), photographed);
        } catch (Exception error) {
            // Depth isn't ready for the first frames after tracking starts.
        }
    }

    private byte[] lastKeyThumb;

    /** 16x12 grid of brightness samples, to tell whether the view changed. */
    private static byte[] lumaThumb(byte[] nv21, int width, int height) {
        byte[] out = new byte[16 * 12];
        for (int y = 0; y < 12; y++) {
            for (int x = 0; x < 16; x++) out[y * 16 + x] = nv21[(height * (2 * y + 1) / 24) * width + width * (2 * x + 1) / 32];
        }
        return out;
    }

    private static float lumaDiff(byte[] a, byte[] b) {
        long sum = 0;
        for (int i = 0; i < a.length; i++) sum += Math.abs((a[i] & 0xff) - (b[i] & 0xff));
        return sum / (float) a.length;
    }

    private void maybeKeyframe(Frame frame, Camera camera, Pose pose) {
        long now = SystemClock.uptimeMillis();
        float[] p = pose == null ? null : poseArray(pose);
        float[] att = attitude;
        String trigger = p != null ? "pose" : "timer";
        if (p != null && lastKeyPose != null) {
            boolean moved = dist(p, lastKeyPose) >= KEYFRAME_MOVE_M;
            boolean turned = angleDeg(p, lastKeyPose) >= KEYFRAME_TURN_DEG;
            boolean timed = now - lastKeyAt >= TIMED_PHOTO_MS * 3;
            if ((!moved && !turned && !timed) || now - lastKeyAt < KEYFRAME_MIN_MS) return;
        } else if (p == null && now - lastKeyAt < TIMED_PHOTO_MS) {
            // Untracked photos are timed, but a turn between ticks would leave
            // a gap the reconstruction can't bridge: keep one per ~8 degrees.
            boolean turned = att != null && lastKeyAttitude != null
                && ScanMotion.angleDeg(att, lastKeyAttitude) >= ScanMotion.PHOTO_TURN_DEG;
            if (!turned || now - lastKeyAt < KEYFRAME_MIN_MS) return;
            trigger = "turn";
        }
        if (encodeQueue.get() > 3) return; // phone is busy encoding; skip rather than lag
        Image image;
        try {
            image = frame.acquireCameraImage();
        } catch (Exception error) {
            if (imageErrors++ % 30 == 0) android.util.Log.w("OnThisSiteScan", "Camera image unavailable", error);
            return;
        }
        int width = image.getWidth();
        int height = image.getHeight();
        byte[] nv21 = SpaceLocalizer.toNv21(image);
        image.close();
        if (p == null) {
            byte[] thumb = lumaThumb(nv21, width, height);
            if (!"turn".equals(trigger) && lastKeyThumb != null && now - lastKeyAt < STILL_PHOTO_MS
                && lumaDiff(thumb, lastKeyThumb) < STILL_LUMA_DIFF) return;
            lastKeyThumb = thumb;
        }
        CameraIntrinsics intrinsics = camera.getImageIntrinsics();
        float[] focal = intrinsics.getFocalLength();
        float[] principal = intrinsics.getPrincipalPoint();
        int index = ++frames;
        LiveCoverage guide = live;
        if (guide != null) guide.addPhoto(index, nv21, width, height);
        if (p != null) trackedPhotos++;
        if (p != null) try (com.google.ar.core.PointCloud cloud = frame.acquirePointCloud()) {
            FloatBuffer points = cloud.getPoints();
            float[] values = new float[points.remaining()];
            points.get(values);
            coverage.addPhoto(values, values.length / 4, index, 0.2f);
        } catch (Exception error) {
            android.util.Log.w("OnThisSiteScan", "Point cloud unavailable", error);
        }
        if (p != null) lastKeyPose = p;
        if (p != null && depthEnabled) addDepth(frame, camera, true);
        lastKeyAt = now;
        lastKeyAttitude = att;
        float compass = compassDeg;
        float[] up = gravity;
        String photoTrigger = trigger;
        float turnRate = motion.turnRate(now);
        boolean walking = motion.walking();
        android.location.Location fix = lastFix;
        encodeQueue.incrementAndGet();
        encoder.execute(() -> {
            try {
                String name = String.format(Locale.US, "frames/%06d.jpg", index);
                try (OutputStream out = new FileOutputStream(new File(sessionDir, name))) {
                    new YuvImage(nv21, ImageFormat.NV21, width, height, null).compressToJpeg(new Rect(0, 0, width, height), 92, out);
                }
                JSONObject line = new JSONObject()
                    .put("i", index).put("t", now).put("file", name)
                    .put("intrinsics", new JSONObject().put("fx", focal[0]).put("fy", focal[1])
                        .put("cx", principal[0]).put("cy", principal[1]).put("w", width).put("h", height))
                    .put("tracking", p != null ? "TRACKING" : "NONE");
                if (p != null) line.put("pose", new JSONArray(p));
                if (att != null) line.put("attitude_enu", new JSONArray(att));
                if (up != null) line.put("gravity_device", new JSONArray(up));
                if (fix != null) line.put("gps", new JSONObject().put("lat", fix.getLatitude()).put("lng", fix.getLongitude())
                    .put("alt", fix.hasAltitude() ? fix.getAltitude() : JSONObject.NULL).put("acc", fix.getAccuracy())
                    .put("age_ms", Math.max(0, System.currentTimeMillis() - fix.getTime())));
                if (!Float.isNaN(compass)) line.put("compass_deg", compass);
                // Why this photo was kept and how the phone was moving, for diagnosing scans.
                line.put("trigger", photoTrigger).put("turn_dps", Math.round(turnRate)).put("walking", walking);
                synchronized (framesOut) {
                    framesOut.write(line.toString());
                    framesOut.write('\n');
                }
            } catch (Exception error) {
                android.util.Log.w("OnThisSiteScan", "Keyframe failed: " + error);
            } finally {
                encodeQueue.decrementAndGet();
            }
        });
    }

    // ---- Finish ----

    /** Too few distinct photos rarely become 3D (the S25 desk test failed that way): say so first. */
    private void confirmFinish() {
        if (frames >= FEW_PHOTOS) {
            finishScan();
            return;
        }
        new AlertDialog.Builder(this)
            .setTitle("Only " + frames + " different view" + (frames == 1 ? "" : "s"))
            .setMessage("A 3D space usually needs " + FEW_PHOTOS + "+ photos taken while walking, so each spot is seen from a few places. Keep scanning a little longer?")
            .setPositiveButton("Keep scanning", null)
            .setNegativeButton("Upload anyway", (d, w) -> finishScan())
            .show();
    }

    private void finishScan() {
        finishButton.setEnabled(false);
        detail.setText("Saving the last photos…");
        new Thread(() -> {
            long deadline = SystemClock.uptimeMillis() + 20000;
            while (SystemClock.uptimeMillis() < deadline) {
                synchronized (lock) {
                    if (encodeQueue.get() == 0) break;
                }
                SystemClock.sleep(250);
            }
            try {
                JSONObject anchors;
                synchronized (lock) {
                    recording = false;
                    anchors = alignment();
                }
                synchronized (framesOut) {
                    framesOut.close();
                }
                if (frames == 0) {
                    // Nothing to process: don't queue an empty scan.
                    ScanUploader.deleteTree(sessionDir);
                    runOnUiThread(() -> {
                        status.setText("No photos were recorded");
                        detail.setText("The camera never locked on (" + lastTrackingHelp + "). Try again in good light, moving slowly while pointing at walls and objects.");
                        finishButton.setVisibility(View.GONE);
                    });
                    return;
                }
                ScanUploader.write(new File(sessionDir, "anchors.json"), anchors.toString());
                JSONObject meta = new JSONObject(ScanUploader.read(new File(sessionDir, "meta.json")));
                meta.put("frames", frames).put("distance_m", distance).put("finished_at", System.currentTimeMillis());
                ScanUploader.write(new File(sessionDir, "meta.json"), meta.toString());
                runOnUiThread(() -> upload(sessionDir));
            } catch (Exception error) {
                runOnUiThread(() -> detail.setText("Couldn't save the scan: " + error.getMessage()));
            }
        }).start();
    }

    /** Session -> space transform from our positioning fixes, if any. */
    private JSONObject alignment() throws Exception {
        String method;
        float[] transform = {0, 0, 0, 0, 0, 0, 1};
        float residual = 0f;
        int fixes = 0;
        if (trackedPhotos < frames / 2) {
            // Mostly photos without ARCore positions: the processing PC builds
            // this scan from the photos and places it with GPS + compass.
            method = "gps";
        } else if (!spaceHasModel) {
            method = "first";
        } else if (localizer != null && localizer.locked()) {
            method = "localized";
            transform = localizer.transform();
            residual = localizer.residual();
            fixes = localizer.fixes();
        } else {
            method = "unaligned"; // the processing PC places it by matching photos
        }
        return new JSONObject()
            .put("alignment", new JSONObject().put("method", method).put("fixes", fixes).put("residual_m", residual)
                .put("photos", frames).put("tracked_photos", trackedPhotos))
            .put("transform", new JSONArray(transform));
    }

    /** "Expected live around 3:40 AM tomorrow." from the server's estimate. */
    static String goLiveText(org.json.JSONObject queued) {
        String eta = queued == null ? "" : queued.optString("eta_at", "");
        if (!eta.isEmpty() && !"null".equals(eta)) {
            try {
                java.text.SimpleDateFormat iso = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
                iso.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                java.util.Date at = iso.parse(eta.substring(0, 19));
                java.util.Calendar day = java.util.Calendar.getInstance();
                int today = day.get(java.util.Calendar.DAY_OF_YEAR);
                day.setTime(at);
                int diff = day.get(java.util.Calendar.DAY_OF_YEAR) - today;
                String time = new java.text.SimpleDateFormat("h:mm a", Locale.US).format(at); // 12-hour with AM/PM everywhere
                return "Expected live around " + time + (diff == 0 ? " today." : diff == 1 ? " tomorrow." : " on "
                    + new java.text.SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(at) + ".");
            } catch (Exception ignored) {
                // fall through to the queue note
            }
        }
        String note = queued == null ? "" : queued.optString("note", "");
        return note.isEmpty() ? "It will be added to the 3D space the next time the processing computer runs." : note;
    }

    /** Keeps a bottom bar's buttons above the navigation bar (the app draws edge to edge). */
    static void keepAboveNavigationBar(View view) {
        int left = view.getPaddingLeft(), top = view.getPaddingTop(), right = view.getPaddingRight(), bottom = view.getPaddingBottom();
        view.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(left, top, right, bottom + insets.getSystemWindowInsetBottom());
            return insets;
        });
        view.requestApplyInsets();
    }

    private void upload(File dir) {
        progressBar.setVisibility(View.VISIBLE);
        status.setText("Uploading your scan");
        detail.setText("You can leave this screen; the upload continues with a notification.");
        // The upload runs in a foreground service so it survives leaving the app.
        ScanUploadService.listener = new ScanUploadService.Listener() {
            @Override
            public void progress(String path, String message, int percent) {
                runOnUiThread(() -> {
                    detail.setText(message + "\nYou can leave this screen; the upload continues with a notification.");
                    progressBar.setProgress(percent);
                });
            }

            @Override
            public void finished(String path, org.json.JSONObject queued) {
                String when = goLiveText(queued);
                runOnUiThread(() -> {
                    status.setText("Scan uploaded");
                    detail.setText("Thank you! " + when + "\nYou'll get a notification when it's live.");
                    progressBar.setProgress(100);
                    finishButton.setVisibility(View.GONE);
                });
            }

            @Override
            public void failed(String path, String message) {
                runOnUiThread(() -> {
                    status.setText("Upload paused");
                    detail.setText(message + "\nYour scan is saved on this phone; it will offer to resume next time.");
                });
            }
        };
        ScanUploadService.start(getApplicationContext(), dir, accessToken);
    }

    private void offerPendingUploads(File[] pending) {
        new AlertDialog.Builder(this)
            .setTitle("Finish uploading?")
            .setMessage(pending.length + " earlier scan(s) haven't finished uploading.")
            .setPositiveButton("Upload now", (d, w) -> {
                for (File dir : pending) upload(dir);
            })
            .setNegativeButton("Later", null)
            .show();
    }

    // ---- UI ----

    private void buildUi() {
        FrameLayout root = new FrameLayout(this);
        surface = new GLSurfaceView(this);
        surface.setPreserveEGLContextOnPause(true);
        surface.setEGLContextClientVersion(2);
        surface.setEGLConfigChooser(8, 8, 8, 8, 16, 0);
        surface.setRenderer(this);
        surface.setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
        root.addView(surface, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setBackgroundColor(Color.argb(170, 0, 0, 0));
        int pad = dp(14);
        panel.setPadding(pad, dp(36), pad, pad);
        status = text(17, true);
        status.setText("Loading…");
        detail = text(14, false);
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        panel.addView(status);
        panel.addView(detail);
        panel.addView(progressBar);
        root.addView(panel, new FrameLayout.LayoutParams(-1, -2, Gravity.TOP));

        LinearLayout bottom = new LinearLayout(this);
        bottom.setGravity(Gravity.CENTER);
        bottom.setPadding(pad, pad, pad, dp(32));
        startButton = new Button(this);
        startButton.setText("Start scanning");
        startButton.setEnabled(false);
        startButton.setOnClickListener(v -> askAreaThenStart());
        finishButton = new Button(this);
        finishButton.setText("Finish & upload");
        finishButton.setVisibility(View.GONE);
        finishButton.setOnClickListener(v -> confirmFinish());
        Button close = new Button(this);
        close.setText("Close");
        close.setOnClickListener(v -> finish());
        bottom.addView(close);
        bottom.addView(startButton);
        bottom.addView(finishButton);
        root.addView(bottom, new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM));
        keepAboveNavigationBar(bottom);
        // The coverage tint sits directly over the camera, under the panels.
        coverageOverlay = new CoverageOverlayView(this);
        root.addView(coverageOverlay, 1, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
    }

    private void askAreaThenStart() {
        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(20), dp(8), dp(20), 0);
        EditText area = new EditText(this);
        area.setHint("Which room or outdoor area? (e.g. Kitchen, Front porch)");
        area.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        EditText credit = new EditText(this);
        credit.setHint("Your name for the credits");
        credit.setText(creditName == null ? "" : creditName);
        CheckBox show = new CheckBox(this);
        show.setText("Show my name in the credits");
        show.setChecked(true);
        TextView tips = new TextView(this);
        // Each named room or area becomes its own 3D model, so one per scan.
        tips.setText("Scan one room or outdoor area at a time. Walk slowly around its edges with the phone "
            + "facing into the room, then once through the middle. About 1 to 2 minutes per room. Skip private rooms.");
        form.addView(area);
        form.addView(credit);
        form.addView(show);
        form.addView(tips);
        AlertDialog dialog = new AlertDialog.Builder(this)
            .setTitle("Start a scan")
            .setView(form)
            .setPositiveButton("Start", (d, w) -> startScan(area.getText().toString().trim(), credit.getText().toString().trim(), show.isChecked()))
            .setNegativeButton("Cancel", null)
            .show();
        // The room name is required: it decides which model the photos build.
        android.widget.Button start = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
        start.setEnabled(false);
        area.addTextChangedListener(new android.text.TextWatcher() {
            @Override public void beforeTextChanged(CharSequence text, int a, int b, int c) { }
            @Override public void onTextChanged(CharSequence text, int a, int b, int c) { }
            @Override public void afterTextChanged(android.text.Editable text) {
                start.setEnabled(text.toString().trim().length() > 0);
            }
        });
    }

    private String trackingHelp(com.google.ar.core.TrackingFailureReason reason) {
        String help;
        switch (reason) {
            case INSUFFICIENT_LIGHT: help = "Too dark: turn on lights or move to a brighter spot."; break;
            case EXCESSIVE_MOTION: help = "Moving too fast: slow down."; break;
            case INSUFFICIENT_FEATURES: help = "Point at something with more detail (not a blank wall or sky)."; break;
            case CAMERA_UNAVAILABLE: help = "The camera is busy in another app."; break;
            default: help = "Move the phone slowly side to side so it can see the space.";
        }
        lastTrackingHelp = help;
        return help;
    }

    private void postStatus(String statusText, String detailText) {
        long now = SystemClock.uptimeMillis();
        if (now - lastStatusAt < 300) return;
        lastStatusAt = now;
        runOnUiThread(() -> {
            if (statusText != null) status.setText(statusText);
            else if (recording) status.setText("Scanning — move slowly");
            if (detailText != null) detail.setText(detailText);
        });
    }

    private TextView text(float size, boolean bold) {
        TextView view = new TextView(this);
        view.setTextColor(Color.WHITE);
        view.setTextSize(size);
        if (bold) view.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        return view;
    }

    private int dp(float value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void vibrate() {
        surface.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY);
    }

    // ---- Sensors and maths ----

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            motion.onAccel(event.values[0], event.values[1], event.values[2]);
            float[] g = gravity;
            float k = 0.9f; // low-pass: keep gravity, drop hand shake
            gravity = g == null ? event.values.clone()
                : new float[] {g[0] * k + event.values[0] * (1 - k), g[1] * k + event.values[1] * (1 - k), g[2] * k + event.values[2] * (1 - k)};
            return;
        }
        float[] rotation = new float[9];
        float[] orientation = new float[3];
        SensorManager.getRotationMatrixFromVector(rotation, event.values);
        float[] q = new float[4];
        SensorManager.getQuaternionFromVector(q, event.values); // w,x,y,z
        attitude = new float[] {q[1], q[2], q[3], q[0]};
        motion.onAttitude(attitude, SystemClock.uptimeMillis());
        SensorManager.getOrientation(rotation, orientation);
        compassDeg = (float) ((Math.toDegrees(orientation[0]) + 360) % 360);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    /** How the camera sensor is mounted (usually 90): maps device gravity into image axes. */
    private int cameraSensorOrientation() {
        try {
            String id = session.getCameraConfig().getCameraId();
            android.hardware.camera2.CameraManager manager = (android.hardware.camera2.CameraManager) getSystemService(Context.CAMERA_SERVICE);
            Integer value = manager.getCameraCharacteristics(id).get(android.hardware.camera2.CameraCharacteristics.SENSOR_ORIENTATION);
            return value == null ? 90 : value;
        } catch (Exception error) {
            return 90;
        }
    }

    private void startLocationUpdates() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] {Manifest.permission.ACCESS_FINE_LOCATION}, 52);
            return;
        }
        try {
            android.location.LocationManager manager = (android.location.LocationManager) getSystemService(Context.LOCATION_SERVICE);
            for (String provider : new String[] {android.location.LocationManager.GPS_PROVIDER, android.location.LocationManager.NETWORK_PROVIDER}) {
                if (!manager.isProviderEnabled(provider)) continue;
                manager.requestLocationUpdates(provider, 500L, 0f, this, android.os.Looper.getMainLooper());
                android.location.Location known = manager.getLastKnownLocation(provider);
                if (known != null && (lastFix == null || known.getAccuracy() < lastFix.getAccuracy())) lastFix = known;
            }
        } catch (SecurityException error) {
            android.util.Log.w("OnThisSiteScan", "Location unavailable", error);
        }
    }

    @Override
    public void onLocationChanged(android.location.Location location) {
        android.location.Location current = lastFix;
        // Prefer fresh GPS; ignore a coarse network fix when a good GPS one is recent.
        if (current == null || location.getAccuracy() <= current.getAccuracy() + 5
            || location.getTime() - current.getTime() > 5000) lastFix = location;
    }

    @Override
    public void onProviderEnabled(String provider) {}

    @Override
    public void onProviderDisabled(String provider) {}

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 52 && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) startLocationUpdates();
    }

    /** Local metres east/north of the first fix, for the mini map when ARCore isn't tracking. */
    private float[] gpsLocalXZ(android.location.Location fix) {
        if (gpsOrigin == null) gpsOrigin = new double[] {fix.getLatitude(), fix.getLongitude()};
        double east = (fix.getLongitude() - gpsOrigin[1]) * 111320.0 * Math.cos(Math.toRadians(gpsOrigin[0]));
        double north = (fix.getLatitude() - gpsOrigin[0]) * 110540.0;
        return new float[] {(float) east, (float) -north};
    }

    private static float[] poseArray(Pose pose) {
        return new float[] {pose.tx(), pose.ty(), pose.tz(), pose.qx(), pose.qy(), pose.qz(), pose.qw()};
    }

    private static float[] poseFromJson(JSONArray array) {
        if (array == null || array.length() != 7) return null;
        float[] p = new float[7];
        for (int i = 0; i < 7; i++) p[i] = (float) array.optDouble(i);
        return p;
    }

    private static float dist(float[] a, float[] b) {
        float dx = a[0] - b[0];
        float dy = a[1] - b[1];
        float dz = a[2] - b[2];
        return (float) Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    private static float angleDeg(float[] a, float[] b) {
        double dot = Math.abs(a[3] * b[3] + a[4] * b[4] + a[5] * b[5] + a[6] * b[6]);
        return (float) Math.toDegrees(2 * Math.acos(Math.min(1.0, dot)));
    }

}
