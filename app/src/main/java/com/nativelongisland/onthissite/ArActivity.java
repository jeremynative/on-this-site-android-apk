package com.nativelongisland.onthissite;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.media.MediaPlayer;
import android.net.Uri;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import com.google.ar.core.Anchor;
import com.google.ar.core.ArCoreApk;
import com.google.ar.core.Camera;
import com.google.ar.core.Config;
import com.google.ar.core.Frame;
import com.google.ar.core.HitResult;
import com.google.ar.core.Pose;
import com.google.ar.core.Session;
import com.google.ar.core.TrackingFailureReason;
import com.google.ar.core.TrackingState;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

/**
 * AR bubbles like Pokemon GO: the web app passes a scene of stories, people,
 * words and finds near the visitor, and they float around the camera view
 * to walk up to or tap, open as cards, and can be photographed and shared.
 * (The marker walk-through and photogrammetry were removed on 2026-11-01.)
 */
public class ArActivity extends Activity implements GLSurfaceView.Renderer {
    /**
     * Bubbles from places near the visitor (an ArScene JSON with discover
     * items), passed by the web app. They float on open floors and tables
     * wherever the visitor is: no scan, marker card or placing needed.
     */
    static final String EXTRA_NEARBY = "nearby_bubbles";

    private static final int REQUEST_CAMERA = 41;


    // Free roam reveals bubbles gradually as the visitor explores: at most two
    // unopened at once, spread out, a new one after opening one, walking a
    // little, or a short wait.
    private static final int FREE_WAITING_MAX = 2;
    private static final float FREE_SPACING_M = 2f;
    private static final float FREE_STEP_M = 1.5f;
    private static final long FREE_GAP_MS = 8000;
    private static final double FREE_APART_DEG = 40;
    private long lastFreeSpawnAt;
    private float[] lastFreeSpawnFrom;
    // Real places float in their real direction once the compass is lined
    // up with the AR world; bubbles stay in front of walls and furniture.
    private static final double FREE_VIEW_DEG = 25;
    private static final float FREE_WALL_GAP_M = 0.4f;
    private static final float FREE_MIN_M = 0.9f;
    private static final float FREE_PLACE_MIN_M = 0.7f;
    private static final float FREE_UNKNOWN_M = 2.2f;
    private static final long FREE_COMPASS_WAIT_MS = 15000;
    private final ArCompass compass = new ArCompass();
    // Unopened bubbles left in another room, or lost with tracking (a dark
    // hallway makes ARCore start a new map), are let go so new ones keep
    // appearing near the visitor.
    private static final float FREE_LEFT_BEHIND_M = 6f;
    private static final long FREE_LOST_MS = 2500;
    private final Map<String, Long> discoverLostSince = new HashMap<>();
    private boolean wasTracking;
    // Finds with a GPS point (plant IDs, photo stories) float over the spot
    // where they were photographed once the visitor is this close.
    private static final double SPOT_NEAR_M = 40;
    private static final float SPOT_MIN_M = 1.2f;
    private static final float SPOT_BELOW_EYE_M = 0.4f;
    private android.location.LocationManager locations;
    // Latest live fix: lat, lng, accuracy (m), when (elapsed ms).
    private volatile double[] fix;
    // A full listener: before Android 11 the provider callbacks have no defaults.
    private final android.location.LocationListener fixListener = new android.location.LocationListener() {
        @Override
        public void onLocationChanged(android.location.Location location) {
            double[] current = fix;
            long now = SystemClock.elapsedRealtime();
            double accuracy = location.hasAccuracy() ? location.getAccuracy() : 50;
            // A coarser fix only replaces a finer one once that has aged a few seconds.
            if (current != null && accuracy > current[2] && now - current[3] < 5000) return;
            fix = new double[] {location.getLatitude(), location.getLongitude(), accuracy, now};
        }

        @Override
        public void onStatusChanged(String provider, int status, android.os.Bundle extras) {
        }

        @Override
        public void onProviderEnabled(String provider) {
        }

        @Override
        public void onProviderDisabled(String provider) {
        }
    };
    private android.hardware.SensorManager sensors;
    private long freeStartedAt;
    private float[] lastForward;
    private final Set<String> answered = new HashSet<>();
    private static final float DISCOVER_DISTANCE = 1.6f;

    private final Object lock = new Object();
    private final ArGl gl = new ArGl();
    private final ExecutorService loader = Executors.newSingleThreadExecutor();
    // AR photos: the camera view with its bubbles, saved to Photos and shareable.
    private volatile boolean captureWanted;
    private View flash;
    private FrameLayout photoSaved;
    private ImageView photoSavedImage;
    private TextView photoSavedText;
    private TextView photoShare;
    private Uri photoSavedUri;
    private final ConcurrentLinkedQueue<float[]> taps = new ConcurrentLinkedQueue<>();
    private final Random random = new Random();

    // Scene state (guarded by lock).
    private ArScene scene;
    private final Map<String, Anchor> discoverAnchors = new HashMap<>();  // itemId -> anchor
    private final Map<String, Float> discoverLift = new HashMap<>();
    private final Set<String> discovered = new HashSet<>();
    private final Set<String> loading = new HashSet<>();
    private final Set<String> enabledLayers = new HashSet<>();

    private long lastSpawnAttempt;

    private GLSurfaceView surface;
    private Session session;
    private boolean installRequested;
    private boolean resumed;
    private int availabilityChecks;
    private boolean textureBound;
    private int viewportWidth = 1;
    private int viewportHeight = 1;
    private MediaPlayer player;

    private TextView status;
    private TextView hint;
    // A dimmed full-screen layer holding the centred card; tapping the dim closes it.
    private FrameLayout infoPanel;
    private FrameLayout infoImageFrame;
    private String infoImageSource = "";
    private FrameLayout photoViewer;
    private ZoomImageView photoZoom;
    private TextView photoCaption;
    private TextView infoText;
    private TextView infoKicker;
    private TextView infoTitle;
    private TextView infoCredit;
    private TextView foundPill;
    private View progressFill;
    private View progressTrack;
    private ImageView infoImage;
    private LinearLayout infoChoices;
    private ScrollView infoScroll;
    private LinearLayout infoActions;
    private long lastStatusPost;
    private String lastStatusText = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        String nearby = getIntent().getStringExtra(EXTRA_NEARBY);
        try {
            scene = ArScene.fromJson(nearby);
        } catch (Exception error) {
            Toast.makeText(this, "Nothing to show in AR here yet.", Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        Collections.addAll(enabledLayers, ArScene.LAYERS);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            backCallback = this::handleBack;
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCallback);
        }
        sensors = (android.hardware.SensorManager) getSystemService(SENSOR_SERVICE);
        if (!Double.isNaN(scene.hereLat)) compass.setLocation(scene.hereLat, scene.hereLng);
        locations = (android.location.LocationManager) getSystemService(LOCATION_SERVICE);
        buildUi();
    }

    // ---- Lifecycle ----

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
        compass.start(sensors);
        startFixes();
        startAr();
    }

    private void startAr() {
        if (scene == null || !resumed) return;
        if (session == null) {
            if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[] {Manifest.permission.CAMERA}, REQUEST_CAMERA);
                return;
            }
            ArCoreApk.Availability availability = ArCoreApk.getInstance().checkAvailability(this);
            if (availability.isTransient()) {
                // The first check on a device without ARCore asks Google
                // Play; wait for its answer before offering any install.
                if (availabilityChecks++ < 25) surface.postDelayed(this::startAr, 200);
                else showFatal("Couldn't confirm AR support. Check the connection and try again.");
                return;
            }
            if (!availability.isSupported()) {
                showFatal("This device doesn't support AR. The photos and prompts are still in the site's article.");
                return;
            }
            try {
                ArCoreApk.InstallStatus install = ArCoreApk.getInstance().requestInstall(this, !installRequested);
                if (install == ArCoreApk.InstallStatus.INSTALL_REQUESTED) {
                    installRequested = true;
                    return;
                }
                session = new Session(this);
                configureSession();
            } catch (Exception error) {
                showFatal("AR isn't available on this device. (" + error.getClass().getSimpleName() + ")");
                return;
            }
        }
        try {
            session.resume();
        } catch (Exception error) {
            showFatal("The camera is busy in another app. Close it and try again.");
            session = null;
            return;
        }
        surface.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        resumed = false;
        compass.stop(sensors);
        if (locations != null) locations.removeUpdates(fixListener);
        if (session != null) {
            surface.onPause();
            session.pause();
        }
        stopAudio();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (backCallback != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(backCallback);
        }
        if (session != null) session.close();
        session = null;
        loader.shutdownNow();
        stopAudio();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CAMERA && (grantResults.length == 0 || grantResults[0] != PackageManager.PERMISSION_GRANTED)) {
            showFatal("AR needs the camera. You can allow it in Settings → Apps → On This Site.");
        }
    }

    private void configureSession() {
        Config config = new Config(session);
        config.setPlaneFindingMode(Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL);
        config.setFocusMode(Config.FocusMode.AUTO);
        config.setUpdateMode(Config.UpdateMode.LATEST_CAMERA_IMAGE);
        config.setLightEstimationMode(Config.LightEstimationMode.DISABLED);
        if (session.isDepthModeSupported(Config.DepthMode.AUTOMATIC)) {
            // Depth keeps bubbles in front of plain walls ARCore hasn't
            // detected as planes yet.
            config.setDepthMode(Config.DepthMode.AUTOMATIC);
        }
        session.configure(config);
    }

    // ---- GL ----

    @Override
    public void onSurfaceCreated(GL10 unused, EGLConfig config) {
        GLES20.glClearColor(0f, 0f, 0f, 1f);
        gl.init();
        textureBound = false;
        synchronized (lock) {
            loading.clear();
        }
        for (String layer : ArScene.LAYERS) gl.queueTexture("orb:" + layer, ArCards.orb(ArCards.layerColor(layer)));
    }

    @Override
    public void onSurfaceChanged(GL10 unused, int width, int height) {
        GLES20.glViewport(0, 0, width, height);
        viewportWidth = width;
        viewportHeight = height;
        if (session != null) {
            session.setDisplayGeometry(getWindowManager().getDefaultDisplay().getRotation(), width, height);
        }
    }

    @Override
    public void onDrawFrame(GL10 unused) {
        drawFrame();
        if (captureWanted) capturePixels();
    }

    private void drawFrame() {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT | GLES20.GL_DEPTH_BUFFER_BIT);
        Session current = session;
        if (current == null) return;
        if (!textureBound) {
            current.setCameraTextureName(gl.cameraTexture);
            current.setDisplayGeometry(getWindowManager().getDefaultDisplay().getRotation(), viewportWidth, viewportHeight);
            textureBound = true;
        }
        gl.processUploads();
        Frame frame;
        try {
            frame = current.update();
        } catch (Exception error) {
            return;
        }
        Camera camera = frame.getCamera();
        gl.drawBackground(frame);
        synchronized (lock) {
            if (camera.getTrackingState() != TrackingState.TRACKING) {
                if (wasTracking) android.util.Log.i("OnThisSiteAR", "Tracking lost: " + camera.getTrackingFailureReason());
                wasTracking = false;
                taps.clear();
                postStatus(trackingProblem(camera), "");
                return;
            }
            float[] view = new float[16];
            float[] projection = new float[16];
            float[] viewProjection = new float[16];
            camera.getViewMatrix(view, 0);
            camera.getProjectionMatrix(projection, 0, 0.05f, 100f);
            Matrix.multiplyMM(viewProjection, 0, projection, 0, view, 0);
            if (!wasTracking) android.util.Log.i("OnThisSiteAR", "Tracking");
            wasTracking = true;
            Pose cameraPose = camera.getDisplayOrientedPose();
            float[] cameraPoint = cameraPose.getTranslation();
            spawnAnywhere(frame, cameraPoint);

            List<Draw> draws = new ArrayList<>();
            collectFreeDraws(draws, cameraPose);

            float[] tap;
            while ((tap = taps.poll()) != null) handleTap(tap[0], tap[1], draws, viewProjection);

            Collections.sort(draws, (a, b) -> Float.compare(b.distance, a.distance));
            gl.beginQuads();
            for (Draw draw : draws) gl.drawQuad(viewProjection, draw.model, gl.texture(draw.texture), draw.alpha);
            gl.endQuads();

            postStatus(statusText(), hintText());
        }
    }

    // ---- Markers and rooms ----

    // ---- Content ----

    private boolean visible(ArScene.Item item) {
        return enabledLayers.contains(item.layer) && (!item.sample || BuildConfig.DEBUG);
    }

    private void addCard(List<Draw> draws, ArScene.Item item, float[] point, float[] cameraPoint, float width) {
        String key = "card:" + item.id;
        ensureTexture(item, key);
        float aspect = gl.aspect(key);
        if (aspect <= 0f) return;
        float yaw = ArPlacement.yawTowards(point[0], point[2], cameraPoint[0], cameraPoint[2]);
        Pose pose = new Pose(point, ArPlacement.yawQuaternion(yaw));
        draws.add(Draw.posed(item.id, pose, key, width, width * aspect, 0.97f, distance(point, cameraPoint)));
    }

    private void ensureTexture(ArScene.Item item, String key) {
        if (gl.hasTexture(key) || !loading.add(key)) return;
        loader.execute(() -> {
            try {
                Bitmap bitmap;
                if (key.startsWith("card:")) {
                    bitmap = ArCards.promptCard(item, decodeImage(item.image, 900));
                } else {
                    Bitmap inner = decodeImage(item.figure.isEmpty() ? item.image : item.figure, 512);
                    int color = ArCards.layerColor(item.layer);
                    bitmap = inner == null ? ArCards.orb(color) : ArCards.bubble(inner, color);
                }
                gl.queueTexture(key, bitmap);
            } catch (Exception error) {
                android.util.Log.w("OnThisSiteAR", "Texture " + key + " failed: " + error);
            }
        });
    }

    /** Re-renders an item's floating card after it changes (a word answered). */
    private void invalidateTextures(ArScene.Item item) {
        synchronized (lock) {
            loading.remove("card:" + item.id);
        }
        loader.execute(() -> {
            try {
                gl.queueTexture("card:" + item.id, ArCards.promptCard(item, decodeImage(item.image, 900)));
            } catch (Exception ignored) {
                // The next frame retries through ensureTexture.
            }
        });
    }

    /**
     * Free roam: like Pokémon GO, bubbles appear in the air at eye level.
     * A real place's bubble appears in that place's real direction once the
     * visitor faces it (the compass lines up north first). Others appear
     * within view, revealed gradually as the visitor explores: at most two
     * unopened at once, the next after opening one, walking about 1.5 m or a
     * short wait, spaced from the others. Every bubble stays in front of the
     * nearest wall or object in its direction, so none is out of reach.
     */
    private void spawnAnywhere(Frame frame, float[] cameraPoint) {
        Camera camera = frame.getCamera();
        float[] back = camera.getDisplayOrientedPose().getZAxis();
        float[] forward = {-back[0], -back[1], -back[2]};
        compass.sample(forward);
        lastForward = forward;
        long now = SystemClock.uptimeMillis();
        if (now - lastSpawnAttempt < 500) return;
        lastSpawnAttempt = now;
        if (freeStartedAt == 0) freeStartedAt = now;
        double facing = ArCompass.arHeading(forward);
        if (Double.isNaN(facing)) return;  // looking straight up or down
        // Without a compass after a while, places are placed like the rest.
        boolean compassReady = compass.ready();
        boolean ignoreDirections = !compassReady && now - freeStartedAt > FREE_COMPASS_WAIT_MS;
        int waiting = 0;
        ArScene.Item ambient = null;
        ArScene.Item ahead = null;
        ArScene.Item spot = null;
        double aheadHeading = 0;
        double[] visitor = whereNow();
        for (ArScene.Item item : scene.items) {
            if (!visible(item)) continue;
            if (item.hasSpot() && visitor != null) {
                // Keeps the direction pill true as the visitor walks.
                double[] offset = metresTo(visitor, item);
                item.distanceM = Math.hypot(offset[0], offset[1]);
                item.bearing = (Math.toDegrees(Math.atan2(offset[0], offset[1])) + 360) % 360;
            }
            if (discoverAnchors.containsKey(item.id)) {
                // Finds stay at their spots, so they don't hold up new bubbles.
                if (!discovered.contains(item.id) && !item.hasSpot()) waiting++;
                continue;
            }
            if (item.hasSpot()) {
                // Never anywhere else: only over its spot, once close enough.
                if (spot == null && compassReady && visitor != null && item.distanceM <= SPOT_NEAR_M) spot = item;
                continue;
            }
            if (!Double.isNaN(item.bearing) && !ignoreDirections) {
                if (!compassReady || ahead != null) continue;
                double heading = compass.arHeadingFor(item.bearing);
                if (Math.abs(angleBetween(heading, facing)) <= Math.toRadians(FREE_VIEW_DEG)) {
                    ahead = item;
                    aheadHeading = heading;
                }
            } else if (ambient == null || (discovered.contains(ambient.id) && !discovered.contains(item.id))) {
                // New bubbles before found ones coming back after a tracking reset.
                ambient = item;
            }
        }
        if (spot != null) {
            placeAtSpot(spot, cameraPoint, facing);
            return;
        }
        ArScene.Item next;
        boolean directional = ahead != null && waiting <= FREE_WAITING_MAX;
        if (directional) {
            next = ahead;
        } else {
            if (ambient == null || waiting >= FREE_WAITING_MAX) return;
            boolean walked = lastFreeSpawnFrom == null
                || Math.hypot(cameraPoint[0] - lastFreeSpawnFrom[0], cameraPoint[2] - lastFreeSpawnFrom[2]) > FREE_STEP_M;
            if (waiting > 0 && !walked && now - lastFreeSpawnAt < FREE_GAP_MS) return;
            next = ambient;
        }
        float[] view = new float[16];
        float[] projection = new float[16];
        float[] viewProjection = new float[16];
        camera.getViewMatrix(view, 0);
        camera.getProjectionMatrix(projection, 0, 0.05f, 100f);
        Matrix.multiplyMM(viewProjection, 0, projection, 0, view, 0);
        List<float[]> taken = new ArrayList<>();
        List<Double> waitingHeadings = new ArrayList<>();
        for (Map.Entry<String, Anchor> entry : discoverAnchors.entrySet()) {
            float[] at = entry.getValue().getPose().getTranslation();
            taken.add(at);
            if (!discovered.contains(entry.getKey())) {
                waitingHeadings.add(ArCompass.arHeading(new float[] {at[0] - cameraPoint[0], 0f, at[2] - cameraPoint[2]}));
            }
        }
        for (int attempt = 0; attempt < (directional ? 5 : 12); attempt++) {
            // Places sharing a direction fan out a little and sit at different distances.
            double fan = 6 + 4 * attempt;
            double heading = directional
                ? aheadHeading + Math.toRadians(-fan + 2 * fan * random.nextFloat())
                : facing + Math.toRadians(-FREE_VIEW_DEG + 2 * FREE_VIEW_DEG * random.nextFloat());
            float dx = (float) Math.sin(heading);
            float dz = (float) -Math.cos(heading);
            float want = directional ? 2.2f + 1.2f * random.nextFloat() : 2f + 1.5f * random.nextFloat();
            float distance = freeDistance(frame, viewProjection, cameraPoint, dx, dz, want, directional ? FREE_PLACE_MIN_M : FREE_MIN_M);
            if (distance < 0) continue;
            float[] point = {cameraPoint[0] + dx * distance, cameraPoint[1] - 0.05f + 0.2f * (random.nextFloat() - 0.5f), cameraPoint[2] + dz * distance};
            boolean spaced = true;
            for (float[] other : taken) {
                if (Math.hypot(point[0] - other[0], point[2] - other[2]) < (directional ? 1f : FREE_SPACING_M)) spaced = false;
            }
            if (!directional) {
                for (double other : waitingHeadings) {
                    if (Math.abs(Math.toDegrees(angleBetween(heading, other))) < FREE_APART_DEG) spaced = false;
                }
            }
            if (!spaced) continue;
            discoverAnchors.put(next.id, session.createAnchor(Pose.makeTranslation(point[0], point[1], point[2])));
            discoverLift.put(next.id, 0f);
            if (!directional) {
                lastFreeSpawnAt = now;
                lastFreeSpawnFrom = cameraPoint.clone();
            }
            return;
        }
    }

    /** A find floats over the spot where it was photographed, a little below eye level. */
    private void placeAtSpot(ArScene.Item item, float[] cameraPoint, double facing) {
        // Standing on the spot, the direction means nothing: it floats ahead.
        double heading = item.distanceM < SPOT_MIN_M ? facing : compass.arHeadingFor(item.bearing);
        float distance = (float) Math.max(item.distanceM, SPOT_MIN_M);
        float[] point = {cameraPoint[0] + (float) Math.sin(heading) * distance, cameraPoint[1] - SPOT_BELOW_EYE_M,
            cameraPoint[2] - (float) Math.cos(heading) * distance};
        discoverAnchors.put(item.id, session.createAnchor(Pose.makeTranslation(point[0], point[1], point[2])));
        discoverLift.put(item.id, 0f);
        android.util.Log.i("OnThisSiteAR", String.format(Locale.US, "Placed %s at its spot, %.0f m at %.0f deg",
            item.id, item.distanceM, item.bearing));
    }

    /** Where the visitor is: the live GPS fix, else where the scene was built. */
    private double[] whereNow() {
        double[] live = fix;
        if (live != null) return live;
        return Double.isNaN(scene.hereLat) || Double.isNaN(scene.hereLng) ? null : new double[] {scene.hereLat, scene.hereLng};
    }

    /** Metres east and north from a GPS point to a find's spot. */
    private static double[] metresTo(double[] from, ArScene.Item item) {
        double north = (item.spotLat - from[0]) * 111320.0;
        double east = (item.spotLng - from[1]) * 111320.0 * Math.cos(Math.toRadians(from[0]));
        return new double[] {east, north};
    }

    private boolean hasSpots() {
        for (ArScene.Item item : scene.items) if (item.hasSpot()) return true;
        return false;
    }

    /** Live GPS while the scene has finds with a spot, to float them where they were photographed. */
    @android.annotation.SuppressLint("MissingPermission") // Checked just above; a revoked permission throws, caught below.
    private void startFixes() {
        if (locations == null || !hasSpots()) return;
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
            && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) return;
        try {
            for (String provider : new String[] {android.location.LocationManager.GPS_PROVIDER, android.location.LocationManager.NETWORK_PROVIDER}) {
                if (locations.isProviderEnabled(provider)) locations.requestLocationUpdates(provider, 1000L, 0f, fixListener);
            }
        } catch (RuntimeException error) {
            android.util.Log.w("OnThisSiteAR", "No live location for finds: " + error.getMessage());
        }
    }

    /**
     * How far a bubble can go in a direction: short of the nearest wall or
     * object the depth sensor finds there, or a cautious distance when
     * nothing is found. -1 when that spot is off screen (it can't be
     * checked) or too close to reach comfortably.
     */
    private float freeDistance(Frame frame, float[] viewProjection, float[] cameraPoint, float dx, float dz, float want, float minimum) {
        float[] world = {cameraPoint[0] + dx * want, cameraPoint[1], cameraPoint[2] + dz * want, 1f};
        float[] clip = new float[4];
        Matrix.multiplyMV(clip, 0, viewProjection, 0, world, 0);
        if (clip[3] <= 0) return -1;
        float x = (clip[0] / clip[3] + 1) / 2 * viewportWidth;
        float y = (1 - clip[1] / clip[3]) / 2 * viewportHeight;
        if (x < viewportWidth * 0.08f || x > viewportWidth * 0.92f || y < viewportHeight * 0.15f || y > viewportHeight * 0.85f) return -1;
        float nearest = Float.MAX_VALUE;
        for (HitResult hit : frame.hitTest(x, y)) nearest = Math.min(nearest, hit.getDistance());
        float room = nearest == Float.MAX_VALUE ? Math.min(want, FREE_UNKNOWN_M) : Math.min(want, nearest - FREE_WALL_GAP_M);
        return room < minimum ? -1 : room;
    }

    /** Signed difference a - b of two headings, in radians within (-pi, pi]. */
    private static double angleBetween(double a, double b) {
        return Math.atan2(Math.sin(a - b), Math.cos(a - b));
    }

    /** "The Point is to your left · 397 m": the next real place to turn toward. */
    private String directionHint() {
        float[] forward = lastForward;
        if (forward == null || !compass.ready()) return null;
        double facing = compass.facingDeg(forward);
        if (Double.isNaN(facing)) return null;
        for (ArScene.Item item : scene.items) {
            if (!visible(item) || Double.isNaN(item.bearing) || discoverAnchors.containsKey(item.id)) continue;
            double turn = Math.toDegrees(angleBetween(Math.toRadians(item.bearing), Math.toRadians(facing)));
            String arrow = Math.abs(turn) <= FREE_VIEW_DEG ? "↑" : Math.abs(turn) > 135 ? "↓" : turn > 0 ? "→" : "←";
            String name = item.title.replaceFirst("^(Nearby|Meet): ", "").replaceFirst("^Meet ", "");
            String far = Double.isNaN(item.distanceM) ? "" : item.distanceM < 1000
                ? String.format(Locale.US, " · %d m", Math.round(item.distanceM))
                : String.format(Locale.US, " · %.1f km", item.distanceM / 1000);
            return Math.abs(turn) > 135 ? arrow + "  Turn around: " + name + far
                : turn > FREE_VIEW_DEG ? name + far + "  " + arrow
                : turn < -FREE_VIEW_DEG ? arrow + "  " + name + far
                : arrow + "  " + name + far + " ahead";
        }
        return null;
    }

    /** Free roam: bubbles bob gently, open when walked up to, and grow with nearness. */
    private void collectFreeDraws(List<Draw> draws, Pose cameraPose) {
        float[] cameraPoint = cameraPose.getTranslation();
        long now = SystemClock.uptimeMillis();
        List<String> stopped = new ArrayList<>();
        for (ArScene.Item item : scene.items) {
            if (!visible(item)) continue;
            Anchor anchor = discoverAnchors.get(item.id);
            if (anchor == null) continue;
            // ARCore stops every anchor when it has to restart tracking (fast
            // movement, a covered camera); those bubbles are placed again.
            if (anchor.getTrackingState() == TrackingState.STOPPED) {
                stopped.add(item.id);
                continue;
            }
            // After a tracking loss ARCore can start a new map and leave the
            // old anchors paused for good; those are placed again too.
            if (anchor.getTrackingState() != TrackingState.TRACKING) {
                Long since = discoverLostSince.get(item.id);
                if (since == null) discoverLostSince.put(item.id, now);
                else if (now - since > FREE_LOST_MS) stopped.add(item.id);
                continue;
            }
            discoverLostSince.remove(item.id);
            Pose base = anchor.getPose();
            // A slow drift (about 8 s a cycle) while closed; opened cards hold still to be read.
            float bob = discovered.contains(item.id) ? 0f : 0.02f * (float) Math.sin(now / 1300.0 + (item.id.hashCode() & 0xff));
            float[] point = {base.tx(), base.ty() + discoverLift.get(item.id) + bob, base.tz()};
            float distance = distance(point, cameraPoint);
            // An unopened bubble left behind in another room makes way for new ones.
            if (!discovered.contains(item.id) && !item.hasSpot()
                && Math.hypot(point[0] - cameraPoint[0], point[2] - cameraPoint[2]) > FREE_LEFT_BEHIND_M) {
                stopped.add(item.id);
                continue;
            }
            if (!discovered.contains(item.id) && distance < DISCOVER_DISTANCE) {
                discovered.add(item.id);
                runOnUiThread(() -> onDiscovered(item));
            }
            if (discovered.contains(item.id)) {
                addCard(draws, item, point, cameraPoint, 0.5f);
            } else {
                String key = "bubble:" + item.id;
                ensureTexture(item, key);
                if (gl.aspect(key) <= 0f) key = "orb:" + item.layer;
                float pulse = 0.85f + 0.15f * (float) Math.sin(now / 300.0);
                // A find over a spot across the yard stays big enough to see.
                float size = item.hasSpot() ? Math.max(0.26f, distance * 0.05f) : 0.26f;
                draws.add(Draw.billboard(item.id, point, cameraPose, key, size, size, pulse, distance));
            }
        }
        for (String id : stopped) {
            android.util.Log.i("OnThisSiteAR", "Let go of " + id + (discoverLostSince.containsKey(id) ? " (lost with tracking)" : " (stopped or left behind)"));
            discoverLostSince.remove(id);
            Anchor anchor = discoverAnchors.remove(id);
            if (anchor != null) anchor.detach();
            discoverLift.remove(id);
        }
    }

    // ---- Taps ----

    private void handleTap(float x, float y, List<Draw> draws, float[] viewProjection) {
        Draw picked = null;
        for (Draw draw : draws) {
            if (draw.itemId == null || !draw.contains(x, y, viewProjection, viewportWidth, viewportHeight)) continue;
            if (picked == null || draw.distance < picked.distance) picked = draw;
        }
        if (picked == null) {
            runOnUiThread(() -> infoPanel.setVisibility(View.GONE));
            return;
        }
        for (ArScene.Item item : scene.items) {
            if (item.id.equals(picked.itemId)) {
                // Like walking up to it: a tapped bubble counts as found.
                if (discovered.add(item.id)) runOnUiThread(() -> onDiscovered(item));
                runOnUiThread(() -> showItem(item));
                return;
            }
        }
    }

    // ---- Status ----

    private String trackingProblem(Camera camera) {
        TrackingFailureReason reason = camera.getTrackingFailureReason();
        switch (reason) {
            case INSUFFICIENT_LIGHT: return "Low light: the camera tracks better with a light on.";
            case EXCESSIVE_MOTION: return "The camera is catching up.";
            case INSUFFICIENT_FEATURES: return "Plain surfaces are hard to track; include something detailed in view.";
            case CAMERA_UNAVAILABLE: return "The camera is unavailable.";
            default: return "Finding its place: sweep the phone gently across the view.";
        }
    }

    private String statusText() {
        int found = discovered.size();
        int total = 0;
        for (ArScene.Item item : scene.items) if (visible(item)) total++;
        return found >= total && total > 0
            ? "You found all " + total + ". Thank you for learning with us!"
            : found + " of " + total + " found · turn around to find more";
    }

    private String hintText() {
        String turn = directionHint();
        if (turn != null) return turn;
        return discovered.isEmpty() ? "Walk up to a bubble or tap it" : "";
    }

    private void postStatus(String text, String hintValue) {
        long now = SystemClock.uptimeMillis();
        String combined = text + "\n" + hintValue;
        if (combined.equals(lastStatusText) || now - lastStatusPost < 250) return;
        lastStatusPost = now;
        lastStatusText = combined;
        runOnUiThread(() -> {
            status.setText(text);
            hint.setText(hintValue);
            hint.setVisibility(hintValue.isEmpty() ? View.GONE : View.VISIBLE);
            if (progressFill != null) {
                int total = 0;
                for (ArScene.Item item : scene.items) if (visible(item)) total++;
                float share = total == 0 ? 0f : Math.min(1f, discovered.size() / (float) total);
                ViewGroup.LayoutParams params = progressFill.getLayoutParams();
                params.width = Math.round(progressTrack.getWidth() * share);
                progressFill.setLayoutParams(params);
            }
        });
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
        surface.setWillNotDraw(false);
        final float[] down = new float[2];
        surface.setOnTouchListener((view, event) -> {
            if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
                down[0] = event.getX();
                down[1] = event.getY();
            } else if (event.getActionMasked() == MotionEvent.ACTION_UP
                && Math.hypot(event.getX() - down[0], event.getY() - down[1]) < dp(16)) {
                taps.add(new float[] {event.getX(), event.getY()});
                view.performClick();
            }
            return true;
        });
        root.addView(surface, new FrameLayout.LayoutParams(-1, -1));

        // Top: a round close button and a translucent capsule with the
        // place's name, how many bubbles are found and a thin progress bar;
        // below it, a pill pointing to the next real place. The camera view
        // stays clear.
        LinearLayout top = column();
        top.setPadding(dp(14), dp(40), dp(14), dp(8));
        top.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
            new int[] {Color.argb(150, 0, 0, 0), Color.argb(0, 0, 0, 0)}));
        LinearLayout titleRow = row();
        titleRow.setGravity(Gravity.CENTER_VERTICAL);
        TextView close = text(20, true, "✕");
        close.setGravity(Gravity.CENTER);
        close.setBackground(oval(Color.argb(150, 20, 26, 23)));
        close.setContentDescription("Close AR");
        close.setOnClickListener(v -> finish());
        titleRow.addView(close, new LinearLayout.LayoutParams(dp(46), dp(46)));
        LinearLayout capsule = column();
        capsule.setBackground(rounded(Color.argb(150, 20, 26, 23), 23));
        capsule.setPadding(dp(16), dp(7), dp(16), dp(9));
        TextView heading = text(16, true, scene.title);
        heading.setSingleLine(true);
        heading.setEllipsize(android.text.TextUtils.TruncateAt.END);
        capsule.addView(heading);
        status = text(13, false);
        status.setTextColor(Color.rgb(200, 214, 205));
        capsule.addView(status);
        FrameLayout bar = new FrameLayout(this);
        progressTrack = new View(this);
        progressTrack.setBackground(rounded(Color.argb(70, 255, 255, 255), 2));
        bar.addView(progressTrack, new FrameLayout.LayoutParams(-1, dp(4)));
        progressFill = new View(this);
        progressFill.setBackground(rounded(Color.rgb(126, 211, 158), 2));
        bar.addView(progressFill, new FrameLayout.LayoutParams(0, dp(4)));
        LinearLayout.LayoutParams barParams = new LinearLayout.LayoutParams(-1, dp(4));
        barParams.topMargin = dp(6);
        capsule.addView(bar, barParams);
        LinearLayout.LayoutParams capsuleParams = new LinearLayout.LayoutParams(0, -2, 1f);
        capsuleParams.leftMargin = dp(10);
        titleRow.addView(capsule, capsuleParams);
        top.addView(titleRow);
        hint = text(14, true);
        hint.setSingleLine(true);
        hint.setEllipsize(android.text.TextUtils.TruncateAt.MIDDLE);
        hint.setVisibility(View.GONE);
        hint.setBackground(rounded(Color.argb(170, 20, 26, 23), 18));
        hint.setPadding(dp(14), dp(8), dp(14), dp(8));
        LinearLayout.LayoutParams hintParams = new LinearLayout.LayoutParams(-2, -2);
        hintParams.gravity = Gravity.CENTER_HORIZONTAL;
        hintParams.topMargin = dp(10);
        root.addView(top, new FrameLayout.LayoutParams(-1, -2, Gravity.TOP));

        foundPill = text(14, true);
        foundPill.setVisibility(View.GONE);
        foundPill.setBackground(rounded(Color.rgb(46, 125, 84), 20));
        foundPill.setPadding(dp(16), dp(9), dp(16), dp(9));
        FrameLayout.LayoutParams foundParams = new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER_HORIZONTAL | Gravity.CENTER_VERTICAL);
        foundParams.topMargin = dp(120);
        root.addView(foundPill, foundParams);

        LinearLayout bottom = column();
        bottom.setPadding(dp(12), dp(8), dp(12), dp(28));
        // Bubbles float at eye level, near the top of the view, so the hint
        // sits at the bottom instead of over them.
        {
            bottom.addView(hint, hintParams);
            // The shutter: saves what the camera sees, bubbles and all, to Photos.
            ImageView shutter = new ImageView(this);
            GradientDrawable ring = oval(Color.argb(120, 20, 26, 23));
            ring.setStroke(dp(4), Color.WHITE);
            shutter.setBackground(ring);
            shutter.setImageResource(R.drawable.ic_ar_camera);
            shutter.setScaleType(ImageView.ScaleType.FIT_CENTER);
            shutter.setPadding(dp(19), dp(19), dp(19), dp(19));
            shutter.setContentDescription("Take a photo");
            shutter.setOnClickListener(v -> takeArPhoto());
            LinearLayout.LayoutParams shutterParams = new LinearLayout.LayoutParams(dp(68), dp(68));
            shutterParams.gravity = Gravity.CENTER_HORIZONTAL;
            shutterParams.topMargin = dp(12);
            bottom.addView(shutter, shutterParams);
        }

        // The card a bubble opens into, centred over the dimmed camera view:
        // coloured kicker, title, the whole photo (tap to zoom), readable
        // text and source, and one clear Done button.
        infoPanel = new FrameLayout(this);
        infoPanel.setVisibility(View.GONE);
        infoPanel.setBackgroundColor(Color.argb(120, 0, 0, 0));
        infoPanel.setClickable(true);
        infoPanel.setOnClickListener(v -> infoPanel.setVisibility(View.GONE));
        LinearLayout infoCard = column();
        infoCard.setClickable(true);
        infoCard.setBackground(rounded(Color.argb(248, 20, 26, 23), 26));
        infoCard.setPadding(dp(20), dp(18), dp(20), dp(14));
        infoKicker = text(12, true);
        infoKicker.setLetterSpacing(0.08f);
        infoTitle = text(22, true);
        infoTitle.setPadding(0, dp(2), 0, dp(10));
        infoImage = new ImageView(this);
        infoImage.setScaleType(ImageView.ScaleType.FIT_CENTER);
        infoImage.setOnClickListener(v -> openPhotoViewer());
        infoImage.setContentDescription("Photo. Tap to zoom.");
        infoImageFrame = new FrameLayout(this);
        infoImageFrame.setBackground(rounded(Color.argb(255, 10, 14, 12), 16));
        infoImageFrame.setClipToOutline(true);
        infoImageFrame.setVisibility(View.GONE);
        infoImageFrame.addView(infoImage, new FrameLayout.LayoutParams(-1, -1));
        TextView zoomTag = text(12, true, "\u2922  Tap to zoom");
        zoomTag.setBackground(rounded(Color.argb(170, 0, 0, 0), 12));
        zoomTag.setPadding(dp(10), dp(5), dp(10), dp(5));
        FrameLayout.LayoutParams zoomTagParams = new FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM | Gravity.END);
        zoomTagParams.setMargins(0, 0, dp(8), dp(8));
        infoImageFrame.addView(zoomTag, zoomTagParams);
        infoText = text(16, false);
        infoText.setTextColor(Color.rgb(232, 238, 233));
        infoText.setLineSpacing(0f, 1.25f);
        infoText.setPadding(0, dp(12), 0, 0);
        infoChoices = column();
        infoChoices.setPadding(0, dp(6), 0, 0);
        infoCredit = text(13, false);
        infoCredit.setTextColor(Color.rgb(159, 176, 166));
        infoCredit.setPadding(0, dp(12), 0, dp(4));
        LinearLayout infoBody = column();
        infoBody.addView(infoKicker, matchWrap());
        infoBody.addView(infoTitle, matchWrap());
        infoBody.addView(infoImageFrame, new LinearLayout.LayoutParams(-1, dp(260)));
        infoBody.addView(infoText, matchWrap());
        infoBody.addView(infoChoices, matchWrap());
        infoBody.addView(infoCredit, matchWrap());
        infoScroll = new ScrollView(this);
        infoScroll.setVerticalScrollBarEnabled(true);
        infoScroll.addView(infoBody);
        infoCard.addView(infoScroll, new LinearLayout.LayoutParams(-1, 0, 1f));
        infoActions = row();
        infoActions.setGravity(Gravity.END);
        infoActions.setPadding(0, dp(10), 0, 0);
        infoCard.addView(infoActions, matchWrap());
        FrameLayout.LayoutParams cardParams = new FrameLayout.LayoutParams(-1,
            Math.round(getResources().getDisplayMetrics().heightPixels * 0.74f), Gravity.CENTER);
        cardParams.setMargins(dp(14), 0, dp(14), 0);
        infoPanel.addView(infoCard, cardParams);

        // Full-screen photo: pinch to zoom, drag, double-tap.
        photoViewer = new FrameLayout(this);
        photoViewer.setVisibility(View.GONE);
        photoViewer.setBackgroundColor(Color.argb(250, 0, 0, 0));
        photoViewer.setClickable(true);
        photoZoom = new ZoomImageView(this);
        photoViewer.addView(photoZoom, new FrameLayout.LayoutParams(-1, -1));
        TextView closePhoto = text(20, true, "\u2715");
        closePhoto.setGravity(Gravity.CENTER);
        closePhoto.setBackground(oval(Color.argb(170, 40, 52, 46)));
        closePhoto.setContentDescription("Close photo");
        closePhoto.setOnClickListener(v -> photoViewer.setVisibility(View.GONE));
        FrameLayout.LayoutParams closePhotoParams = new FrameLayout.LayoutParams(dp(46), dp(46), Gravity.TOP | Gravity.END);
        closePhotoParams.setMargins(0, dp(40), dp(14), 0);
        photoViewer.addView(closePhoto, closePhotoParams);
        photoCaption = text(14, false);
        photoCaption.setTextColor(Color.rgb(220, 228, 222));
        photoCaption.setBackground(rounded(Color.argb(160, 0, 0, 0), 14));
        photoCaption.setPadding(dp(14), dp(8), dp(14), dp(8));
        FrameLayout.LayoutParams captionParams = new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM);
        captionParams.setMargins(dp(14), 0, dp(14), dp(56));
        photoViewer.addView(photoCaption, captionParams);

        root.addView(bottom, new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM));
        keepAboveNavigationBar(bottom);
        root.addView(infoPanel, new FrameLayout.LayoutParams(-1, -1));
        root.addView(photoViewer, new FrameLayout.LayoutParams(-1, -1));

        flash = new View(this);
        flash.setBackgroundColor(Color.WHITE);
        flash.setVisibility(View.GONE);
        root.addView(flash, new FrameLayout.LayoutParams(-1, -1));

        // After a photo: the picture, where it was saved, Share and Done.
        photoSaved = new FrameLayout(this);
        photoSaved.setVisibility(View.GONE);
        photoSaved.setBackgroundColor(Color.argb(150, 0, 0, 0));
        photoSaved.setClickable(true);
        photoSaved.setOnClickListener(v -> photoSaved.setVisibility(View.GONE));
        LinearLayout savedCard = column();
        savedCard.setClickable(true);
        savedCard.setBackground(rounded(Color.argb(248, 20, 26, 23), 26));
        savedCard.setPadding(dp(16), dp(16), dp(16), dp(14));
        photoSavedImage = new ImageView(this);
        photoSavedImage.setScaleType(ImageView.ScaleType.FIT_CENTER);
        photoSavedImage.setContentDescription("Your AR photo");
        savedCard.addView(photoSavedImage, new LinearLayout.LayoutParams(-1, Math.round(getResources().getDisplayMetrics().heightPixels * 0.5f)));
        photoSavedText = text(15, false);
        photoSavedText.setTextColor(Color.rgb(220, 228, 222));
        photoSavedText.setPadding(dp(4), dp(12), dp(4), dp(4));
        savedCard.addView(photoSavedText, matchWrap());
        LinearLayout savedActions = row();
        // Retake throws this photo away (out of Photos too) and goes back to the camera.
        TextView retake = text(16, true, "Retake");
        retake.setGravity(Gravity.CENTER);
        retake.setPadding(dp(14), dp(12), dp(14), dp(12));
        retake.setOnClickListener(v -> retakeArPhoto());
        savedActions.addView(retake);
        savedActions.addView(new View(this), new LinearLayout.LayoutParams(0, 1, 1f));
        TextView savedDone = text(16, true, "Done");
        savedDone.setGravity(Gravity.CENTER);
        savedDone.setPadding(dp(16), dp(12), dp(16), dp(12));
        savedDone.setOnClickListener(v -> photoSaved.setVisibility(View.GONE));
        savedActions.addView(savedDone);
        photoShare = text(16, true, "Share");
        photoShare.setGravity(Gravity.CENTER);
        photoShare.setBackground(rounded(Color.rgb(46, 125, 84), 24));
        photoShare.setPadding(dp(28), dp(12), dp(28), dp(12));
        photoShare.setOnClickListener(v -> shareArPhoto());
        savedActions.addView(photoShare);
        savedCard.addView(savedActions, matchWrap());
        FrameLayout.LayoutParams savedParams = new FrameLayout.LayoutParams(-1, -2, Gravity.CENTER);
        savedParams.setMargins(dp(18), 0, dp(18), 0);
        photoSaved.addView(savedCard, savedParams);
        root.addView(photoSaved, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        status.setText("Starting camera…");
    }

    private void showItem(ArScene.Item item) {
        showInfoImage(item);
        infoChoices.removeAllViews();
        infoScroll.scrollTo(0, 0);
        if (ArScene.KIND_PHRASE.equals(item.kind) && item.choices.length >= 2 && !answered.contains(item.id)) {
            askMeaning(item, "");
            return;
        }
        String heading = item.title.isEmpty() ? (item.word.isEmpty() ? "Untitled" : item.word) : item.title;
        setCardHeader(item, heading);
        StringBuilder body = new StringBuilder();
        if (!item.word.isEmpty() && !item.word.equals(item.title)) body.append(item.word);
        if (!item.pronunciation.isEmpty()) body.append(body.length() > 0 ? "\n" : "").append("say: ").append(item.pronunciation);
        if (!item.meaning.isEmpty()) body.append(body.length() > 0 ? "\n" : "").append(item.meaning);
        if (!item.caption.isEmpty()) body.append(body.length() > 0 ? "\n\n" : "").append(item.caption);
        infoText.setText(body);
        infoText.setVisibility(body.length() > 0 ? View.VISIBLE : View.GONE);
        setCredit(item);
        infoActions.removeAllViews();
        if (!item.audio.isEmpty()) infoActions.addView(button("Play", v -> playAudio(item)));
        infoActions.addView(doneButton());
        infoPanel.setVisibility(View.VISIBLE);
    }

    /** "MEET SOMEONE", "LANGUAGE", "ON THIS SITE"…: what kind of bubble this is, in its colour. */
    private void setCardHeader(ArScene.Item item, String heading) {
        String kind = ArScene.KIND_PHRASE.equals(item.kind) ? "LANGUAGE"
            : ArScene.KIND_AUDIO.equals(item.kind) ? "LISTEN"
            : item.id.startsWith("person-") ? "MEET SOMEONE"
            : item.id.startsWith("story-") || item.id.startsWith("note-") || item.id.startsWith("plant-") ? "FROM THE COMMUNITY"
            : "ON THIS SITE";
        String far = Double.isNaN(item.distanceM) ? "" : item.distanceM < 1000
            ? String.format(Locale.US, " · %d M AWAY", Math.round(item.distanceM))
            : String.format(Locale.US, " · %.1f KM AWAY", item.distanceM / 1000);
        infoKicker.setText(kind + far);
        infoKicker.setTextColor(ArCards.layerColor(item.layer));
        infoTitle.setText(heading);
    }

    private void setCredit(ArScene.Item item) {
        infoCredit.setText(item.credit.isEmpty() ? "" : "Source: " + item.credit);
        infoCredit.setVisibility(item.credit.isEmpty() ? View.GONE : View.VISIBLE);
    }

    // ---- AR photos ----

    private void takeArPhoto() {
        if (captureWanted) return;
        captureWanted = true;
        flash.animate().cancel();
        flash.setAlpha(0.85f);
        flash.setVisibility(View.VISIBLE);
        flash.animate().alpha(0f).setDuration(350).withEndAction(() -> flash.setVisibility(View.GONE)).start();
        vibrateConfirm();
    }

    /** Reads the finished frame (the camera and the bubbles, not the buttons) on the GL thread. */
    private void capturePixels() {
        captureWanted = false;
        int width = viewportWidth;
        int height = viewportHeight;
        ByteBuffer pixels = ByteBuffer.allocateDirect(width * height * 4);
        GLES20.glReadPixels(0, 0, width, height, GLES20.GL_RGBA, GLES20.GL_UNSIGNED_BYTE, pixels);
        loader.execute(() -> saveArPhoto(pixels, width, height));
    }

    private void saveArPhoto(ByteBuffer pixels, int width, int height) {
        // GL rows run bottom-up and may carry no alpha; every pixel is made opaque.
        for (int i = 3; i < width * height * 4; i += 4) pixels.put(i, (byte) 0xff);
        pixels.rewind();
        Bitmap upsideDown = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        upsideDown.copyPixelsFromBuffer(pixels);
        Bitmap photo = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(photo);
        android.graphics.Matrix flip = new android.graphics.Matrix();
        flip.setScale(1f, -1f, 0f, height / 2f);
        canvas.drawBitmap(upsideDown, flip, null);
        upsideDown.recycle();
        stampCredit(canvas, width, height);
        java.io.ByteArrayOutputStream jpeg = new java.io.ByteArrayOutputStream();
        photo.compress(Bitmap.CompressFormat.JPEG, 92, jpeg);
        String name = "on-this-site-ar-" + new java.text.SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(new java.util.Date()) + ".jpg";
        Uri saved = savePhotoToGallery(jpeg.toByteArray(), name);
        Uri shareable = saved != null ? saved : savePhotoForSharing(jpeg.toByteArray());
        runOnUiThread(() -> showPhotoSaved(photo, shareable, saved != null));
    }

    /** A small credit in the corner: the place, and On This Site. */
    private void stampCredit(Canvas canvas, int width, int height) {
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(Color.WHITE);
        paint.setShadowLayer(width * 0.006f, 0f, width * 0.002f, Color.argb(160, 0, 0, 0));
        float margin = width * 0.045f;
        float y = height - margin;
        paint.setTextSize(width * 0.03f);
        canvas.drawText("On This Site \u00b7 nativelongisland.com", margin, y, paint);
        if (!scene.title.isEmpty() && !"Around you".equals(scene.title)) {
            paint.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
            paint.setTextSize(width * 0.04f);
            canvas.drawText(scene.title, margin, y - width * 0.05f, paint);
        }
    }

    /** Saves a JPEG to Photos in an "On This Site" album; null when this phone won't allow it. */
    private Uri savePhotoToGallery(byte[] jpeg, String name) {
        android.content.ContentResolver resolver = getContentResolver();
        android.content.ContentValues values = new android.content.ContentValues();
        values.put(android.provider.MediaStore.Images.Media.DISPLAY_NAME, name);
        values.put(android.provider.MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
        values.put(android.provider.MediaStore.Images.Media.DATE_TAKEN, System.currentTimeMillis());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            values.put(android.provider.MediaStore.Images.Media.RELATIVE_PATH, "Pictures/On This Site");
            values.put(android.provider.MediaStore.Images.Media.IS_PENDING, 1);
        }
        Uri uri = null;
        try {
            uri = resolver.insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
            if (uri == null) return null;
            try (OutputStream output = resolver.openOutputStream(uri)) {
                if (output == null) throw new java.io.IOException("no output stream");
                output.write(jpeg);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                android.content.ContentValues ready = new android.content.ContentValues();
                ready.put(android.provider.MediaStore.Images.Media.IS_PENDING, 0);
                resolver.update(uri, ready, null, null);
            }
            return uri;
        } catch (Exception error) {
            // Before Android 10 saving to Photos needs a storage permission this app doesn't ask for.
            android.util.Log.w("OnThisSiteAR", "AR photo not saved to Photos: " + error.getMessage());
            if (uri != null) {
                try {
                    resolver.delete(uri, null, null);
                } catch (RuntimeException ignored) {
                }
            }
            return null;
        }
    }

    /** A private copy that can still be shared when Photos is off limits. */
    private Uri savePhotoForSharing(byte[] jpeg) {
        try {
            Uri uri = CaptureFileProvider.createArPhotoUri(this);
            try (OutputStream output = getContentResolver().openOutputStream(uri)) {
                if (output == null) throw new java.io.IOException("no output stream");
                output.write(jpeg);
            }
            return uri;
        } catch (Exception error) {
            android.util.Log.w("OnThisSiteAR", "AR photo not kept for sharing: " + error.getMessage());
            return null;
        }
    }

    private void showPhotoSaved(Bitmap photo, Uri shareable, boolean inPhotos) {
        if (isFinishing()) return;
        photoSavedUri = shareable;
        photoSavedImage.setImageBitmap(photo);
        photoSavedText.setText(inPhotos ? "Saved to your photos, in the On This Site album."
            : shareable != null ? "This phone didn't let it into your photos, but you can still share it."
            : "The photo couldn't be saved.");
        photoShare.setVisibility(shareable != null ? View.VISIBLE : View.GONE);
        photoSaved.setVisibility(View.VISIBLE);
    }

    /** Discards the photo just taken, from Photos too, and goes back to the camera. */
    private void retakeArPhoto() {
        Uri discard = photoSavedUri;
        photoSavedUri = null;
        photoSaved.setVisibility(View.GONE);
        photoSavedImage.setImageDrawable(null);
        if (discard == null) return;
        loader.execute(() -> {
            try {
                getContentResolver().delete(discard, null, null);
            } catch (RuntimeException error) {
                android.util.Log.w("OnThisSiteAR", "Retaken photo not removed: " + error.getMessage());
            }
        });
    }

    /** The phone's share sheet: Instagram, Facebook, Messages, email; the visitor picks and posts. */
    private void shareArPhoto() {
        if (photoSavedUri == null) return;
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("image/jpeg");
        send.putExtra(Intent.EXTRA_STREAM, photoSavedUri);
        send.setClipData(android.content.ClipData.newRawUri("", photoSavedUri));
        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            startActivity(Intent.createChooser(send, "Share your AR photo"));
        } catch (android.content.ActivityNotFoundException error) {
            toast("No app on this phone can share photos.");
        }
    }

    /** The card's one clear way out. */
    private TextView doneButton() {
        TextView done = text(16, true, "Done");
        done.setGravity(Gravity.CENTER);
        done.setBackground(rounded(Color.rgb(46, 125, 84), 24));
        done.setPadding(dp(28), dp(12), dp(28), dp(12));
        done.setOnClickListener(v -> infoPanel.setVisibility(View.GONE));
        return done;
    }

    /** A full-width answer button for a language question. */
    private TextView choiceButton(String label, View.OnClickListener listener) {
        TextView choice = text(17, true, label);
        choice.setGravity(Gravity.CENTER);
        GradientDrawable outline = rounded(Color.argb(40, 255, 255, 255), 14);
        outline.setStroke(dp(1), Color.argb(110, 255, 255, 255));
        choice.setBackground(outline);
        choice.setPadding(dp(16), dp(13), dp(16), dp(13));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.topMargin = dp(8);
        choice.setLayoutParams(params);
        choice.setOnClickListener(listener);
        return choice;
    }

    /** "You found …": a short-lived pill in the middle of the view. */
    private void showFound(String message) {
        foundPill.setText(message);
        foundPill.setAlpha(0f);
        foundPill.setVisibility(View.VISIBLE);
        foundPill.animate().alpha(1f).setDuration(180).withEndAction(() ->
            foundPill.animate().alpha(0f).setStartDelay(1800).setDuration(400)
                .withEndAction(() -> foundPill.setVisibility(View.GONE)).start()).start();
    }

    /**
     * The item's photo above the text, loaded in the background. Guide and
     * person figures are small map icons, so cards without a photo show none.
     */
    private void showInfoImage(ArScene.Item item) {
        infoImageFrame.setVisibility(View.GONE);
        infoImage.setImageDrawable(null);
        String source = item.image;
        infoImageSource = source;
        if (source.isEmpty()) return;
        infoImage.setTag(item.id);
        photoCaption.setText(item.title);
        loader.execute(() -> {
            Bitmap bitmap = decodeImage(source, 1200);
            if (bitmap == null) return;
            runOnUiThread(() -> {
                if (!item.id.equals(infoImage.getTag())) return;
                infoImage.setImageBitmap(bitmap);
                infoImageFrame.setVisibility(View.VISIBLE);
            });
        });
    }

    /** The card's photo full screen, sharp enough to zoom into. */
    private void openPhotoViewer() {
        String source = infoImageSource;
        if (source.isEmpty()) return;
        photoZoom.setImageDrawable(infoImage.getDrawable());
        photoCaption.setVisibility(photoCaption.getText().length() > 0 ? View.VISIBLE : View.GONE);
        photoViewer.setVisibility(View.VISIBLE);
        loader.execute(() -> {
            Bitmap sharp = decodeImage(source, 2600);
            if (sharp != null) runOnUiThread(() -> {
                if (source.equals(infoImageSource) && photoViewer.getVisibility() == View.VISIBLE) photoZoom.setImageBitmap(sharp);
            });
        });
    }

    /** Back closes the zoomed photo first, then the card, and only then leaves AR. */
    private void handleBack() {
        if (photoSaved != null && photoSaved.getVisibility() == View.VISIBLE) {
            photoSaved.setVisibility(View.GONE);
        } else if (photoViewer != null && photoViewer.getVisibility() == View.VISIBLE) {
            photoViewer.setVisibility(View.GONE);
        } else if (infoPanel != null && infoPanel.getVisibility() == View.VISIBLE) {
            infoPanel.setVisibility(View.GONE);
        } else {
            finish();
        }
    }

    // Android 13+ delivers Back here; apps targeting Android 16 no longer get onBackPressed().
    private android.window.OnBackInvokedCallback backCallback;

    @Override
    public void onBackPressed() {
        handleBack();
    }

    /** A guide's question: what does this word mean? Wrong answers can be tried again. */
    private void askMeaning(ArScene.Item item, String feedback) {
        setCardHeader(item, "“" + item.word + "”");
        infoText.setVisibility(View.VISIBLE);
        infoText.setText((item.title.isEmpty() ? "" : item.title + " asks you:\n")
            + (item.pronunciation.isEmpty() ? "" : "say: " + item.pronunciation + "\n")
            + "What does this word mean?" + (feedback.isEmpty() ? "" : "\n\n" + feedback));
        infoCredit.setVisibility(View.GONE);
        infoActions.removeAllViews();
        infoChoices.removeAllViews();
        for (String choice : item.choices) {
            infoChoices.addView(choiceButton(choice, v -> {
                if (choice.equalsIgnoreCase(item.meaning)) {
                    answered.add(item.id);
                    item.answered = true;
                    invalidateTextures(item);
                    vibrateConfirm();
                    v.setBackground(rounded(Color.rgb(46, 125, 84), 14));
                    infoText.setText("Yes! “" + item.word + "” means " + item.meaning + "."
                        + (item.caption.isEmpty() ? "" : "\n\n" + item.caption));
                    setCredit(item);
                    for (int i = 0; i < infoChoices.getChildCount(); i++) {
                        View other = infoChoices.getChildAt(i);
                        other.setEnabled(false);
                        if (other != v) other.setAlpha(0.35f);
                    }
                } else {
                    v.setBackground(rounded(Color.argb(150, 160, 50, 40), 14));
                    v.setEnabled(false);
                    infoText.setText((item.title.isEmpty() ? "" : item.title + " asks you:\n")
                        + "What does this word mean?\n\nNot quite. Try another answer.");
                }
            }));
        }
        infoActions.addView(doneButton());
        infoPanel.setVisibility(View.VISIBLE);
    }

    private void onDiscovered(ArScene.Item item) {
        vibrateConfirm();
        String name = item.word.isEmpty() ? (item.title.isEmpty() ? "a story" : item.title) : item.word;
        showFound("✨ You found " + name.replaceFirst("^(Nearby: |Meet )", ""));
        if (!item.audio.isEmpty()) playAudio(item);
    }

    // ---- Media ----

    private Bitmap decodeImage(String image, int maxSide) {
        if (image == null || image.isEmpty()) return null;
        try {
            BitmapFactory.Options bounds = new BitmapFactory.Options();
            bounds.inJustDecodeBounds = true;
            try (InputStream in = openMedia(image)) {
                BitmapFactory.decodeStream(in, null, bounds);
            }
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inSampleSize = sampleSize(bounds, maxSide);
            try (InputStream in = openMedia(image)) {
                return BitmapFactory.decodeStream(in, null, options);
            }
        } catch (Exception error) {
            return null;
        }
    }

    private InputStream openMedia(String name) throws Exception {
        if (name.startsWith("asset:")) return getAssets().open(name.substring(6));
        return new java.io.FileInputStream(cachedDownload(name));
    }

    /** A web image (a place photo, a guide figure), downloaded once into the app's cache. */
    private java.io.File cachedDownload(String url) throws Exception {
        java.io.File dir = new java.io.File(getCacheDir(), "ar-media");
        if (!dir.exists() && !dir.mkdirs()) throw new java.io.IOException("No cache directory");
        java.io.File file = new java.io.File(dir, Integer.toHexString(url.hashCode()) + "-" + url.length());
        if (file.length() > 0) return file;
        java.net.HttpURLConnection connection = (java.net.HttpURLConnection) new java.net.URL(url).openConnection();
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(15000);
        java.io.File partial = new java.io.File(dir, file.getName() + ".part");
        try (InputStream in = connection.getInputStream(); java.io.FileOutputStream out = new java.io.FileOutputStream(partial)) {
            byte[] buffer = new byte[16384];
            int read;
            long total = 0;
            while ((read = in.read(buffer)) > 0) {
                total += read;
                if (total > 8_000_000) throw new java.io.IOException("Image too large");
                out.write(buffer, 0, read);
            }
        } finally {
            connection.disconnect();
        }
        if (!partial.renameTo(file)) throw new java.io.IOException("Couldn't cache " + url);
        return file;
    }

    private static int sampleSize(BitmapFactory.Options bounds, int maxSide) {
        int sample = 1;
        while (Math.max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= maxSide) sample *= 2;
        return sample;
    }

    // ---- Audio ----

    private void playAudio(ArScene.Item item) {
        stopAudio();
        try {
            player = new MediaPlayer();
            if (item.audio.startsWith("https://")) {
                player.setDataSource(item.audio);
                player.setOnPreparedListener(MediaPlayer::start);
                player.setOnCompletionListener(MediaPlayer::release);
                player.prepareAsync();
                return;
            }
            try (AssetFileDescriptor fd = getAssets().openFd(item.audio.replaceFirst("^asset:", ""))) {
                player.setDataSource(fd.getFileDescriptor(), fd.getStartOffset(), fd.getLength());
            }
            player.setOnCompletionListener(MediaPlayer::release);
            player.prepare();
            player.start();
        } catch (Exception error) {
            toast("Couldn't play that clip.");
        }
    }

    private void stopAudio() {
        if (player == null) return;
        try {
            player.release();
        } catch (Exception ignored) {
            // Already released by its completion listener.
        }
        player = null;
    }

    // ---- Helpers ----

    private void showFatal(String message) {
        status.setText(message);
        hint.setVisibility(View.GONE);
    }

    /** Keeps a bottom bar's buttons above the system navigation bar. */
    private static void keepAboveNavigationBar(View view) {
        int left = view.getPaddingLeft(), top = view.getPaddingTop(), right = view.getPaddingRight(), bottom = view.getPaddingBottom();
        view.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(left, top, right, bottom + insets.getSystemWindowInsetBottom());
            return insets;
        });
        view.requestApplyInsets();
    }

    private void toast(String message) {
        runOnUiThread(() -> Toast.makeText(this, message, Toast.LENGTH_SHORT).show());
    }

    private void vibrateConfirm() {
        surface.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY);
    }

    private static Pose toPose(float[] p) {
        return new Pose(new float[] {p[0], p[1], p[2]}, new float[] {p[3], p[4], p[5], p[6]});
    }

    private static float[] poseArray(Pose pose) {
        return new float[] {pose.tx(), pose.ty(), pose.tz(), pose.qx(), pose.qy(), pose.qz(), pose.qw()};
    }

    private static float distance(float[] a, float[] b) {
        float dx = a[0] - b[0];
        float dy = a[1] - b[1];
        float dz = a[2] - b[2];
        return (float) Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    private int dp(float value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private LinearLayout row() {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        return row;
    }

    private LinearLayout column() {
        LinearLayout column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);
        return column;
    }

    private static LinearLayout.LayoutParams matchWrap() {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.bottomMargin = 12;
        return params;
    }

    private TextView text(float size, boolean bold) {
        return text(size, bold, "");
    }

    private TextView text(float size, boolean bold, String value) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(Color.WHITE);
        if (bold) view.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        return view;
    }

    private Button button(String label, View.OnClickListener listener) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setMinHeight(dp(48));
        button.setTextColor(Color.WHITE);
        button.setBackground(rounded(Color.argb(170, 40, 52, 46), 22));
        button.setPadding(dp(18), 0, dp(18), 0);
        button.setOnClickListener(listener);
        return button;
    }

    private GradientDrawable rounded(int color) {
        return rounded(color, 16);
    }

    private GradientDrawable rounded(int color, int radiusDp) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(radiusDp));
        return drawable;
    }

    private GradientDrawable oval(int color) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setShape(GradientDrawable.OVAL);
        drawable.setColor(color);
        return drawable;
    }

    /** One textured quad to draw this frame. */
    private static final class Draw {
        String itemId;
        String texture;
        float[] model;
        float alpha;
        float distance;

        static Draw posed(String itemId, Pose pose, String texture, float width, float height, float alpha, float distance) {
            Draw draw = new Draw();
            draw.itemId = itemId;
            draw.texture = texture;
            draw.model = new float[16];
            pose.toMatrix(draw.model, 0);
            Matrix.scaleM(draw.model, 0, width, height, 1f);
            draw.alpha = alpha;
            draw.distance = distance;
            return draw;
        }

        static Draw billboard(String itemId, float[] point, Pose cameraPose, String texture, float width, float height, float alpha, float distance) {
            Pose pose = new Pose(point, cameraPose.getRotationQuaternion());
            return posed(itemId, pose, texture, width, height, alpha, distance);
        }

        boolean contains(float x, float y, float[] viewProjection, int width, int height) {
            float[][] corners = {{-0.5f, -0.5f}, {0.5f, -0.5f}, {0.5f, 0.5f}, {-0.5f, 0.5f}};
            List<float[]> screen = new ArrayList<>();
            float[] mvp = new float[16];
            Matrix.multiplyMM(mvp, 0, viewProjection, 0, model, 0);
            for (float[] corner : corners) {
                float[] clip = new float[4];
                Matrix.multiplyMV(clip, 0, mvp, 0, new float[] {corner[0], corner[1], 0f, 1f}, 0);
                if (clip[3] <= 0f) return false;
                screen.add(new float[] {(clip[0] / clip[3] + 1f) / 2f * width, (1f - clip[1] / clip[3]) / 2f * height});
            }
            return ArPlacement.pointInPolygon(x, y, screen);
        }
    }
}
