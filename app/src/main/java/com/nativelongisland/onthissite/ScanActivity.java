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
public class ScanActivity extends Activity implements GLSurfaceView.Renderer, SensorEventListener {
    static final String EXTRA_SPACE_ID = "space_id";
    static final String EXTRA_ACCESS_TOKEN = "access_token";
    static final String EXTRA_CREDIT_NAME = "credit_name";

    private static final float KEYFRAME_MOVE_M = 0.12f;
    private static final float KEYFRAME_TURN_DEG = 8f;
    private static final long KEYFRAME_MIN_MS = 300;

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
            spaceTitle = space.optString("title");
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
        Sensor rotation = sensors.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        if (rotation != null) sensors.registerListener(this, rotation, SensorManager.SENSOR_DELAY_UI);
    }

    private void onResumeRetry() {
        if (!isFinishing()) onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        ((SensorManager) getSystemService(Context.SENSOR_SERVICE)).unregisterListener(this);
        if (session != null) {
            surface.onPause();
            session.pause();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (session != null) session.close();
        if (localizer != null) localizer.close();
        encoder.shutdown();
    }

    private void configure() {
        // The largest CPU image gives photogrammetry the most detail.
        CameraConfigFilter filter = new CameraConfigFilter(session);
        CameraConfig best = null;
        for (CameraConfig config : session.getSupportedCameraConfigs(filter)) {
            Size size = config.getImageSize();
            if (best == null || size.getWidth() * size.getHeight() > best.getImageSize().getWidth() * best.getImageSize().getHeight()) best = config;
        }
        if (best != null) session.setCameraConfig(best);
        Config config = new Config(session);
        config.setPlaneFindingMode(Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL);
        config.setFocusMode(Config.FocusMode.FIXED);
        config.setUpdateMode(Config.UpdateMode.LATEST_CAMERA_IMAGE);
        config.setLightEstimationMode(Config.LightEstimationMode.DISABLED);
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
                .put("started_at", System.currentTimeMillis());
            ScanUploader.write(new File(sessionDir, "meta.json"), meta.toString());
        } catch (Exception error) {
            detail.setText("Couldn't start: " + error.getMessage());
            return;
        }
        synchronized (lock) {
            recording = true;
            frames = 0;
            distance = 0f;
            lastKeyPose = null;
            lastPosition = null;
        }
        if (spaceHasModel && accessToken != null) localizer = new SpaceLocalizer(spaceId, accessToken);
        startButton.setVisibility(View.GONE);
        finishButton.setVisibility(View.VISIBLE);
    }

    @Override
    public void onSurfaceCreated(GL10 unused, EGLConfig config) {
        GLES20.glClearColor(0f, 0f, 0f, 1f);
        gl.init();
        textureBound = false;
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
            return;
        }
        gl.drawBackground(frame);
        Camera camera = frame.getCamera();
        if (camera.getTrackingState() != TrackingState.TRACKING) {
            postStatus("Hold still a moment — finding your place…", null);
            return;
        }
        synchronized (lock) {
            if (!recording) return;
            Pose pose = camera.getPose();
            float[] position = pose.getTranslation();
            if (lastPosition != null) distance += dist(position, lastPosition);
            lastPosition = position;
            maybeKeyframe(frame, camera, pose);
            if (localizer != null) localizer.onFrame(frame, camera);
            postStatus(null, String.format(Locale.US, "%d photos · %.0f m walked\n%s",
                frames, distance,
                localizer == null ? (spaceHasModel ? "Will be fitted to the space when processed" : "First scan of this place")
                    : localizer.locked() ? "Lined up with earlier scans ✓ " + localizer.status() : localizer.status()));
        }
    }

    private void maybeKeyframe(Frame frame, Camera camera, Pose pose) {
        long now = SystemClock.uptimeMillis();
        float[] p = poseArray(pose);
        if (lastKeyPose != null) {
            boolean moved = dist(p, lastKeyPose) >= KEYFRAME_MOVE_M;
            boolean turned = angleDeg(p, lastKeyPose) >= KEYFRAME_TURN_DEG;
            if ((!moved && !turned) || now - lastKeyAt < KEYFRAME_MIN_MS) return;
        }
        if (encodeQueue.get() > 3) return; // phone is busy encoding; skip rather than lag
        Image image;
        try {
            image = frame.acquireCameraImage();
        } catch (Exception error) {
            return;
        }
        int width = image.getWidth();
        int height = image.getHeight();
        byte[] nv21 = SpaceLocalizer.toNv21(image);
        image.close();
        CameraIntrinsics intrinsics = camera.getImageIntrinsics();
        float[] focal = intrinsics.getFocalLength();
        float[] principal = intrinsics.getPrincipalPoint();
        int index = ++frames;
        lastKeyPose = p;
        lastKeyAt = now;
        float compass = compassDeg;
        encodeQueue.incrementAndGet();
        encoder.execute(() -> {
            try {
                String name = String.format(Locale.US, "frames/%06d.jpg", index);
                try (OutputStream out = new FileOutputStream(new File(sessionDir, name))) {
                    new YuvImage(nv21, ImageFormat.NV21, width, height, null).compressToJpeg(new Rect(0, 0, width, height), 92, out);
                }
                JSONObject line = new JSONObject()
                    .put("i", index).put("t", now).put("file", name)
                    .put("pose", new JSONArray(p))
                    .put("intrinsics", new JSONObject().put("fx", focal[0]).put("fy", focal[1])
                        .put("cx", principal[0]).put("cy", principal[1]).put("w", width).put("h", height))
                    .put("tracking", "TRACKING");
                if (!Float.isNaN(compass)) line.put("compass_deg", compass);
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
        if (!spaceHasModel) {
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
            .put("alignment", new JSONObject().put("method", method).put("fixes", fixes).put("residual_m", residual))
            .put("transform", new JSONArray(transform));
    }

    private void upload(File dir) {
        progressBar.setVisibility(View.VISIBLE);
        new Thread(() -> {
            try {
                new ScanUploader(dir, (message, percent) -> runOnUiThread(() -> {
                    detail.setText(message);
                    progressBar.setProgress(percent);
                })).upload(accessToken);
                runOnUiThread(() -> {
                    status.setText("Scan uploaded");
                    detail.setText("Thank you! It will be added to the 3D space the next time the processing computer runs.");
                    finishButton.setVisibility(View.GONE);
                });
            } catch (Exception error) {
                runOnUiThread(() -> {
                    status.setText("Upload paused");
                    detail.setText(error.getMessage() + "\nYour scan is saved on this phone; it will offer to resume next time.");
                });
            }
        }).start();
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
        finishButton.setOnClickListener(v -> finishScan());
        Button close = new Button(this);
        close.setText("Close");
        close.setOnClickListener(v -> finish());
        bottom.addView(close);
        bottom.addView(startButton);
        bottom.addView(finishButton);
        root.addView(bottom, new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM));
        setContentView(root);
    }

    private void askAreaThenStart() {
        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(20), dp(8), dp(20), 0);
        EditText area = new EditText(this);
        area.setHint("What are you scanning? (e.g. Kitchen, Front porch)");
        area.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        EditText credit = new EditText(this);
        credit.setHint("Your name for the credits");
        credit.setText(creditName == null ? "" : creditName);
        CheckBox show = new CheckBox(this);
        show.setText("Show my name in the credits");
        show.setChecked(true);
        TextView tips = new TextView(this);
        tips.setText("Walk slowly, keep the phone at chest height, and point at walls and objects from a few angles. Skip private rooms.");
        form.addView(area);
        form.addView(credit);
        form.addView(show);
        form.addView(tips);
        new AlertDialog.Builder(this)
            .setTitle("Start a scan")
            .setView(form)
            .setPositiveButton("Start", (d, w) -> startScan(area.getText().toString().trim(), credit.getText().toString().trim(), show.isChecked()))
            .setNegativeButton("Cancel", null)
            .show();
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
        float[] rotation = new float[9];
        float[] orientation = new float[3];
        SensorManager.getRotationMatrixFromVector(rotation, event.values);
        SensorManager.getOrientation(rotation, orientation);
        compassDeg = (float) ((Math.toDegrees(orientation[0]) + 360) % 360);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

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
