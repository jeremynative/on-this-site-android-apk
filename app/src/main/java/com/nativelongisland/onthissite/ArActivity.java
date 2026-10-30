package com.nativelongisland.onthissite;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.media.MediaPlayer;
import android.net.Uri;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import android.os.Bundle;
import android.os.SystemClock;
import android.text.InputType;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;
import com.google.ar.core.Anchor;
import com.google.ar.core.ArCoreApk;
import com.google.ar.core.AugmentedImage;
import com.google.ar.core.AugmentedImageDatabase;
import com.google.ar.core.Camera;
import com.google.ar.core.Config;
import com.google.ar.core.DepthPoint;
import com.google.ar.core.Frame;
import com.google.ar.core.HitResult;
import com.google.ar.core.Plane;
import com.google.ar.core.Point;
import com.google.ar.core.Pose;
import com.google.ar.core.Session;
import com.google.ar.core.Trackable;
import com.google.ar.core.TrackingFailureReason;
import com.google.ar.core.TrackingState;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

/**
 * Walk-through AR for a site such as Ma's House. Each room has a printed
 * marker card; scanning it sets the room's frame and shows that room's
 * layers (family photos, archival photos with before/after viewpoints,
 * language prompts, audio). Discoverable prompts are dropped at runtime on
 * surfaces the camera can see inside public rooms only.
 */
public class ArActivity extends Activity implements GLSurfaceView.Renderer {
    static final String EXTRA_SITE_ID = "site_id";
    static final String EXTRA_AUTHOR = "author";

    private static final int REQUEST_CAMERA = 41;
    private static final int PICK_PHOTO = 42;
    private static final int PICK_REPHOTO = 43;
    private static final int PICK_AUDIO = 44;
    private static final int EXPORT_SCENE = 45;
    private static final int IMPORT_SCENE = 46;

    private static final int MODE_NONE = 0;
    private static final int MODE_SURFACE = 1;
    private static final int MODE_REPHOTO = 2;
    private static final int MODE_ZONE = 3;

    private static final float STAND_HERE_RADIUS = 0.75f;
    private static final float DISCOVER_DISTANCE = 1.6f;

    private final Object lock = new Object();
    private final ArGl gl = new ArGl();
    private final ExecutorService loader = Executors.newSingleThreadExecutor();
    private final ConcurrentLinkedQueue<float[]> taps = new ConcurrentLinkedQueue<>();
    private final Random random = new Random();

    // Scene state (guarded by lock).
    private ArScene scene;
    private ArScene.Store store;
    private final Map<String, Anchor> roomAnchors = new HashMap<>();      // markerId -> anchor
    private final Map<String, Anchor> discoverAnchors = new HashMap<>();  // itemId -> anchor
    private final Map<String, Float> discoverLift = new HashMap<>();
    private final Map<String, String> discoverRoom = new HashMap<>();
    private final Set<String> discovered = new HashSet<>();
    private final Set<String> loading = new HashSet<>();
    private final Set<String> enabledLayers = new HashSet<>();
    private final Set<String> promptedMarkers = new HashSet<>();
    private String lastMarkerId;

    // Scanned-space localization: our own positioning service finds the phone
    // in the space's 3D scan, giving the session -> space transform; the space
    // frame then acts as a "room" keyed SPACE_MARKER, so content is placed
    // without printed cards or any third-party anchor service.
    static final String SPACE_MARKER = "space";
    private String spaceId;
    private SpaceLocalizer spaceLocalizer;
    private int spaceFixesApplied;
    // The scan's 3D points (from the server), drawn as faint dots over the real
    // place so the visitor can see the AR lining up even before content exists.
    private java.nio.FloatBuffer scanPoints;
    private int scanPointCount;
    private int mode = MODE_NONE;
    private ArScene.Item pendingItem;
    private boolean anchorRephotoRequested;
    private float rephotoDistance = 3f;
    private float rephotoAspect = 0.75f;
    private long lastSpawnAttempt;

    private GLSurfaceView surface;
    private Session session;
    private boolean installRequested;
    private boolean resumed;
    private int availabilityChecks;
    private boolean textureBound;
    private boolean authorMode;
    private int viewportWidth = 1;
    private int viewportHeight = 1;
    private volatile float beforeAfter = 0.85f;
    private MediaPlayer player;
    private ArScene.Item awaitingAudioFor;

    private TextView status;
    private TextView hint;
    private LinearLayout authorBar;
    private LinearLayout placementBar;
    private LinearLayout infoPanel;
    private TextView infoText;
    private LinearLayout infoActions;
    private LinearLayout compareBar;
    private ImageView alignOverlay;
    private SeekBar distanceSlider;
    private long lastStatusPost;
    private String lastStatusText = "";
    private boolean compareVisible;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        String siteId = getIntent().getStringExtra(EXTRA_SITE_ID);
        if (siteId == null || siteId.isEmpty()) siteId = "mas-house";
        authorMode = BuildConfig.DEBUG && getIntent().getBooleanExtra(EXTRA_AUTHOR, false);
        spaceId = getIntent().getStringExtra(ScanActivity.EXTRA_SPACE_ID);
        String spaceToken = getIntent().getStringExtra(ScanActivity.EXTRA_ACCESS_TOKEN);
        if (spaceId != null && spaceToken != null) {
            spaceLocalizer = new SpaceLocalizer(spaceId, spaceToken);
            String token = spaceToken;
            loader.execute(() -> loadScanPoints(token));
        }
        store = new ArScene.Store(this, siteId);
        try {
            scene = store.load();
        } catch (Exception error) {
            Toast.makeText(this, "This site has no AR scene yet.", Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        Collections.addAll(enabledLayers, ArScene.LAYERS);
        buildUi();
    }

    // ---- Lifecycle ----

    @Override
    protected void onResume() {
        super.onResume();
        resumed = true;
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
        if (session != null) {
            surface.onPause();
            session.pause();
        }
        stopAudio();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (session != null) session.close();
        session = null;
        if (spaceLocalizer != null) spaceLocalizer.close();
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
        AugmentedImageDatabase database = new AugmentedImageDatabase(session);
        for (ArScene.Marker marker : scene.markers) {
            try (InputStream in = getAssets().open(marker.asset.replaceFirst("^asset:", ""))) {
                Bitmap bitmap = BitmapFactory.decodeStream(in);
                database.addImage(marker.id, bitmap, marker.widthMeters);
            } catch (Exception error) {
                android.util.Log.w("OnThisSiteAR", "Marker " + marker.id + " skipped: " + error);
            }
        }
        config.setAugmentedImageDatabase(database);
        config.setPlaneFindingMode(Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL);
        config.setFocusMode(Config.FocusMode.AUTO);
        config.setUpdateMode(Config.UpdateMode.LATEST_CAMERA_IMAGE);
        config.setLightEstimationMode(Config.LightEstimationMode.DISABLED);
        if (session.isDepthModeSupported(Config.DepthMode.AUTOMATIC)) {
            // Depth lets authors place photos on plain walls ARCore has not
            // yet detected as planes.
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
        gl.queueTexture("ring:reticle", ArCards.floorRing(Color.WHITE, null));
        gl.queueTexture("ring:stand", ArCards.floorRing(0xFFE8A33D, "STAND HERE"));
        gl.queueTexture("ring:zone", ArCards.floorRing(0xFF6BC58A, null));
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
            trackMarkers(frame);
            localizeInSpace(frame, camera);
            if (camera.getTrackingState() != TrackingState.TRACKING) {
                taps.clear();
                if (spaceLocalizer != null) {
                    drawPhotoMode(frame, camera);
                } else {
                    postStatus(trackingProblem(camera), "");
                }
                return;
            }
            float[] view = new float[16];
            float[] projection = new float[16];
            float[] viewProjection = new float[16];
            camera.getViewMatrix(view, 0);
            camera.getProjectionMatrix(projection, 0, 0.05f, 100f);
            Matrix.multiplyMM(viewProjection, 0, projection, 0, view, 0);
            Pose cameraPose = camera.getDisplayOrientedPose();
            float[] cameraPoint = cameraPose.getTranslation();
            ArScene.Room room = currentRoom(cameraPoint);
            Anchor roomAnchor = room == null ? null : roomAnchors.get(room.markerId);

            if (anchorRephotoRequested) {
                anchorRephotoRequested = false;
                finishRephoto(cameraPose, projection[0], room, roomAnchor);
            }
            spawnDiscoverables(frame, cameraPoint, room);

            List<Draw> draws = new ArrayList<>();
            boolean nearViewpoint = collectDraws(draws, cameraPose, room, roomAnchor);
            if (mode == MODE_SURFACE || mode == MODE_ZONE) {
                HitResult center = surfaceHit(frame, viewportWidth / 2f, viewportHeight / 2f, mode == MODE_ZONE);
                if (center != null) draws.add(Draw.flat(center.getHitPose(), "ring:reticle", 0.25f, 0.9f, distance(center.getHitPose().getTranslation(), cameraPoint)));
            }
            if (mode == MODE_ZONE && room != null && roomAnchor != null) {
                for (float[] p : room.zone) {
                    float[] corner = roomAnchor.getPose().transformPoint(new float[] {p[0], 0f, p[1]});
                    Pose world = Pose.makeTranslation(corner[0], cameraPoint[1] - 1.4f, corner[2]);
                    draws.add(Draw.flat(world, "ring:zone", 0.18f, 0.9f, distance(world.getTranslation(), cameraPoint)));
                }
            }

            float[] tap;
            while ((tap = taps.poll()) != null) handleTap(frame, tap[0], tap[1], draws, viewProjection, cameraPoint, room, roomAnchor);

            Collections.sort(draws, (a, b) -> Float.compare(b.distance, a.distance));
            gl.beginQuads();
            for (Draw draw : draws) gl.drawQuad(viewProjection, draw.model, gl.texture(draw.texture), draw.alpha);
            gl.endQuads();

            setCompareVisible(nearViewpoint);
            postStatus(statusText(room), hintText(room, nearViewpoint));
        }
    }

    // ---- Markers and rooms ----

    private void trackMarkers(Frame frame) {
        for (AugmentedImage image : frame.getUpdatedTrackables(AugmentedImage.class)) {
            if (image.getTrackingState() != TrackingState.TRACKING
                || image.getTrackingMethod() != AugmentedImage.TrackingMethod.FULL_TRACKING) continue;
            String markerId = image.getName();
            lastMarkerId = markerId;
            if (!roomAnchors.containsKey(markerId)) {
                Pose center = image.getCenterPose();
                float[] room = ArPlacement.roomPoseFromMarker(center.getTranslation(), center.getYAxis(), center.getZAxis());
                roomAnchors.put(markerId, image.createAnchor(toPose(room)));
                runOnUiThread(() -> vibrateConfirm());
            }
            if (scene.roomForMarker(markerId) == null && authorMode && promptedMarkers.add(markerId)) {
                runOnUiThread(() -> showRoomDialog(markerId, null));
            }
        }
    }

    private void loadScanPoints(String token) {
        try {
            org.json.JSONArray values = ScanUploader.get("/spaces/" + spaceId + "/points", token).getJSONArray("points");
            int count = values.length() / 3;
            java.nio.FloatBuffer buffer = java.nio.ByteBuffer.allocateDirect(count * 7 * 4).order(java.nio.ByteOrder.nativeOrder()).asFloatBuffer();
            for (int i = 0; i < count; i++) {
                buffer.put((float) values.getDouble(i * 3)).put((float) values.getDouble(i * 3 + 1)).put((float) values.getDouble(i * 3 + 2));
                buffer.put(0.35f).put(0.85f).put(1f).put(0.75f);
            }
            buffer.position(0);
            synchronized (lock) {
                scanPoints = buffer;
                scanPointCount = count;
            }
        } catch (Exception error) {
            android.util.Log.w("OnThisSiteAR", "Scan points unavailable: " + error.getMessage());
        }
    }

    /**
     * Photo mode, for phones whose AR tracking can't start (e.g. no gyroscope):
     * our positioning service re-locates the camera in the scanned space about
     * once a second, and the scan's points and placed photos are drawn from
     * that pose. Coarser than tracked AR, but works on any camera phone.
     */
    private void drawPhotoMode(Frame frame, Camera camera) {
        spaceLocalizer.onFrame(frame, camera, false);
        float[] pose = spaceLocalizer.recentSpacePose(4000);
        if (pose == null) {
            postStatus("Photo mode · point at the scanned place", spaceLocalizer.status()
                + "\nThis phone can't track motion for live AR, so the view updates about once a second.");
            return;
        }
        // The server pose uses the camera sensor's (landscape) axes; the projection
        // is for the display, so turn the pose the same way ARCore does.
        Pose sensorToDisplay = camera.getPose().inverse().compose(camera.getDisplayOrientedPose());
        float[] cameraWorld = new float[16];
        toPose(pose).compose(sensorToDisplay).toMatrix(cameraWorld, 0);
        float[] view = new float[16];
        Matrix.invertM(view, 0, cameraWorld, 0);
        float[] projection = new float[16];
        camera.getProjectionMatrix(projection, 0, 0.05f, 100f);
        float[] viewProjection = new float[16];
        Matrix.multiplyMM(viewProjection, 0, projection, 0, view, 0);
        if (scanPoints != null) gl.drawPoints(viewProjection, scanPoints, scanPointCount, 70f * getResources().getDisplayMetrics().density / 2.6f);
        // Placed photos and cards live in the space frame (the "space" room).
        ArScene.Room room = scene.roomForMarker(SPACE_MARKER);
        int shown = 0;
        List<Draw> draws = new ArrayList<>();
        if (room != null) {
            float[] cameraPoint = {pose[0], pose[1], pose[2]};
            for (ArScene.Item item : scene.items) {
                if (!visible(item) || !room.id.equals(item.roomId) || item.pose == null) continue;
                Pose world = toPose(item.pose);
                float distance = distance(world.getTranslation(), cameraPoint);
                if (ArScene.KIND_PHRASE.equals(item.kind) || ArScene.KIND_AUDIO.equals(item.kind)) {
                    addCard(draws, item, world.getTranslation(), cameraPoint, 0.5f);
                } else {
                    String key = textureKey(item);
                    ensureTexture(item, key);
                    float aspect = gl.aspect(key);
                    if (aspect > 0f) draws.add(Draw.posed(item.id, world, key, item.widthMeters, item.widthMeters * aspect, 0.95f, distance));
                }
                shown++;
            }
        }
        Collections.sort(draws, (a, b) -> Float.compare(b.distance, a.distance));
        gl.beginQuads();
        for (Draw draw : draws) gl.drawQuad(viewProjection, draw.model, gl.texture(draw.texture), draw.alpha);
        gl.endQuads();
        postStatus(scene.title + " · photo mode", shown == 0
            ? "Found your place in the scan (blue dots). Nothing has been placed here yet: photos and prompts added to this space will appear here."
            : "Showing " + shown + " placed item" + (shown == 1 ? "" : "s") + ". This phone can't track motion, so the view updates about once a second.");
    }

    /** Feeds frames to the positioning service and re-anchors the space frame on each new fix. */
    private void localizeInSpace(Frame frame, Camera camera) {
        if (spaceLocalizer == null || camera.getTrackingState() != TrackingState.TRACKING) return;
        spaceLocalizer.onFrame(frame, camera);
        int fixes = spaceLocalizer.fixes();
        float[] transform = spaceLocalizer.transform();
        if (transform == null || fixes == spaceFixesApplied) return;
        spaceFixesApplied = fixes;
        // The space frame's origin, expressed in this session, becomes the room anchor.
        float[] origin = ArPlacement.inverse(transform);
        Anchor previous = roomAnchors.put(SPACE_MARKER, session.createAnchor(toPose(origin)));
        if (previous != null) previous.detach();
        if (scene.roomForMarker(SPACE_MARKER) == null) {
            ArScene.Room room = new ArScene.Room();
            room.id = ArScene.newId("room");
            room.markerId = SPACE_MARKER;
            room.name = scene.title;
            room.publicAccess = false; // an author opens it to discoverable prompts
            scene.rooms.add(room);
            runOnUiThread(this::saveScene);
        }
        if (lastMarkerId == null) lastMarkerId = SPACE_MARKER;
        if (fixes == 1) runOnUiThread(this::vibrateConfirm);
    }

    /** The room whose drawn zone holds the visitor, else the room of the last marker scanned. */
    private ArScene.Room currentRoom(float[] cameraPoint) {
        for (ArScene.Room room : scene.rooms) {
            Anchor anchor = roomAnchors.get(room.markerId);
            if (anchor == null || anchor.getTrackingState() != TrackingState.TRACKING || room.zone.size() < 3) continue;
            float[] local = ArPlacement.toRoom(poseArray(anchor.getPose()), cameraPoint);
            if (ArPlacement.pointInPolygon(local[0], local[2], room.zone)) return room;
        }
        return lastMarkerId == null ? null : scene.roomForMarker(lastMarkerId);
    }

    // ---- Content ----

    private boolean visible(ArScene.Item item) {
        return enabledLayers.contains(item.layer) && (!item.sample || BuildConfig.DEBUG);
    }

    /** Adds this room's quads; returns true when the visitor stands on a before/after viewpoint. */
    private boolean collectDraws(List<Draw> draws, Pose cameraPose, ArScene.Room room, Anchor roomAnchor) {
        if (room == null || roomAnchor == null || roomAnchor.getTrackingState() != TrackingState.TRACKING) return false;
        float[] cameraPoint = cameraPose.getTranslation();
        Pose roomPose = roomAnchor.getPose();
        boolean nearViewpoint = false;
        for (ArScene.Item item : scene.items) {
            if (!visible(item)) continue;
            if (ArScene.PLACEMENT_DISCOVER.equals(item.placement)) {
                Anchor anchor = discoverAnchors.get(item.id);
                if (anchor == null || anchor.getTrackingState() != TrackingState.TRACKING || !room.id.equals(discoverRoom.get(item.id))) continue;
                Pose base = anchor.getPose();
                float[] point = {base.tx(), base.ty() + discoverLift.get(item.id), base.tz()};
                float distance = distance(point, cameraPoint);
                if (!discovered.contains(item.id) && distance < DISCOVER_DISTANCE) {
                    discovered.add(item.id);
                    runOnUiThread(() -> onDiscovered(item));
                }
                if (discovered.contains(item.id)) {
                    addCard(draws, item, point, cameraPoint, 0.5f);
                } else {
                    float pulse = 0.75f + 0.25f * (float) Math.sin(SystemClock.uptimeMillis() / 300.0);
                    draws.add(Draw.billboard(item.id, point, cameraPose, "orb:" + item.layer, 0.22f, 0.22f, pulse, distance));
                }
                continue;
            }
            if (!room.id.equals(item.roomId) || item.pose == null) continue;
            Pose world = roomPose.compose(toPose(item.pose));
            float distance = distance(world.getTranslation(), cameraPoint);
            if (ArScene.KIND_PHRASE.equals(item.kind) || ArScene.KIND_AUDIO.equals(item.kind)) {
                addCard(draws, item, world.getTranslation(), cameraPoint, 0.5f);
                continue;
            }
            boolean rephoto = ArScene.KIND_REPHOTO.equals(item.kind);
            String key = textureKey(item);
            ensureTexture(item, key);
            float aspect = gl.aspect(key);
            if (aspect <= 0f) continue;
            float alpha = 0.95f;
            if (rephoto && item.viewpoint != null) {
                Pose viewpoint = roomPose.compose(toPose(item.viewpoint));
                float apart = (float) Math.hypot(viewpoint.tx() - cameraPoint[0], viewpoint.tz() - cameraPoint[2]);
                if (apart < STAND_HERE_RADIUS) {
                    nearViewpoint = true;
                    alpha = beforeAfter;
                } else if (apart < 8f) {
                    Pose floor = new Pose(new float[] {viewpoint.tx(), viewpoint.ty() - 1.35f, viewpoint.tz()}, new float[] {0, 0, 0, 1});
                    draws.add(Draw.flat(floor, "ring:stand", 0.6f, 0.9f, distance(floor.getTranslation(), cameraPoint)));
                }
            }
            draws.add(Draw.posed(item.id, world, key, item.widthMeters, item.widthMeters * aspect, alpha, distance));
        }
        return nearViewpoint;
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

    private static String textureKey(ArScene.Item item) {
        return ArScene.KIND_REPHOTO.equals(item.kind) ? "photo:" + item.id : "framed:" + item.id;
    }

    private void ensureTexture(ArScene.Item item, String key) {
        if (gl.hasTexture(key) || !loading.add(key)) return;
        loader.execute(() -> {
            try {
                Bitmap bitmap;
                if (key.startsWith("card:")) {
                    bitmap = ArCards.promptCard(item);
                } else {
                    Bitmap photo = decodeImage(item.image, 1600);
                    if (photo == null) return;
                    bitmap = ArCards.photoCard(photo, item, key.startsWith("framed:"));
                }
                gl.queueTexture(key, bitmap);
            } catch (Exception error) {
                android.util.Log.w("OnThisSiteAR", "Texture " + key + " failed: " + error);
            }
        });
    }

    private void invalidateTextures(ArScene.Item item) {
        synchronized (lock) {
            loading.remove("card:" + item.id);
            loading.remove("framed:" + item.id);
            loading.remove("photo:" + item.id);
        }
        // Re-render on next use; the old texture is replaced on upload.
        loader.execute(() -> {
            try {
                if (ArScene.KIND_PHRASE.equals(item.kind) || ArScene.KIND_AUDIO.equals(item.kind)) {
                    gl.queueTexture("card:" + item.id, ArCards.promptCard(item));
                } else {
                    Bitmap photo = decodeImage(item.image, 1600);
                    if (photo != null) gl.queueTexture(textureKey(item), ArCards.photoCard(photo, item, !ArScene.KIND_REPHOTO.equals(item.kind)));
                }
            } catch (Exception ignored) {
                // The next frame retries through ensureTexture.
            }
        });
    }

    /**
     * Drops discoverable prompts onto real, visible surfaces: an upward
     * plane the camera is looking at right now (so never inside a wall),
     * inside a public room's zone, away from private rooms, and spaced out.
     */
    private void spawnDiscoverables(Frame frame, float[] cameraPoint, ArScene.Room room) {
        long now = SystemClock.uptimeMillis();
        if (now - lastSpawnAttempt < 400 || room == null || !room.publicAccess) return;
        lastSpawnAttempt = now;
        Anchor roomAnchor = roomAnchors.get(room.markerId);
        if (roomAnchor == null || roomAnchor.getTrackingState() != TrackingState.TRACKING) return;
        ArScene.Item next = null;
        for (ArScene.Item item : scene.items) {
            if (!ArScene.PLACEMENT_DISCOVER.equals(item.placement) || !visible(item) || discoverAnchors.containsKey(item.id)) continue;
            if (!item.roomId.isEmpty() && !item.roomId.equals(room.id)) continue;
            next = item;
            break;
        }
        if (next == null) return;
        List<float[]> taken = new ArrayList<>();
        for (Anchor anchor : discoverAnchors.values()) taken.add(anchor.getPose().getTranslation());
        Pose roomPose = roomAnchor.getPose();
        for (ArScene.Item item : scene.items) {
            if (room.id.equals(item.roomId) && item.pose != null) taken.add(roomPose.compose(toPose(item.pose)).getTranslation());
        }
        for (int attempt = 0; attempt < 6; attempt++) {
            float x = viewportWidth * (0.2f + 0.6f * random.nextFloat());
            float y = viewportHeight * (0.55f + 0.35f * random.nextFloat());
            for (HitResult hit : frame.hitTest(x, y)) {
                Trackable trackable = hit.getTrackable();
                if (!(trackable instanceof Plane)) continue;
                Plane plane = (Plane) trackable;
                if (plane.getType() != Plane.Type.HORIZONTAL_UPWARD_FACING || !plane.isPoseInPolygon(hit.getHitPose())) continue;
                float[] point = hit.getHitPose().getTranslation();
                if (ArPlacement.dropSpotProblem(cameraPoint, point) != null || !ArPlacement.wellSpaced(point, taken)) break;
                if (!allowedForDiscovery(point, room, roomPose)) break;
                discoverAnchors.put(next.id, hit.createAnchor());
                discoverLift.put(next.id, ArPlacement.floatHeight(cameraPoint, point));
                discoverRoom.put(next.id, room.id);
                return;
            }
        }
    }

    private boolean allowedForDiscovery(float[] point, ArScene.Room room, Pose roomPose) {
        float[] local = ArPlacement.toRoom(poseArray(roomPose), point);
        if (!ArPlacement.insideRoomArea(local[0], local[2], room.zone, room.discoverRadius)) return false;
        float ownDistance = (float) Math.hypot(local[0], local[2]);
        for (ArScene.Room other : scene.rooms) {
            if (other.publicAccess || other == room) continue;
            Anchor anchor = roomAnchors.get(other.markerId);
            if (anchor == null) continue;
            float[] otherLocal = ArPlacement.toRoom(poseArray(anchor.getPose()), point);
            if (other.zone.size() >= 3 && ArPlacement.pointInPolygon(otherLocal[0], otherLocal[2], other.zone)) return false;
            // Without a drawn zone, stay nearer this room's marker than any private room's.
            if (other.zone.size() < 3 && Math.hypot(otherLocal[0], otherLocal[2]) < ownDistance) return false;
        }
        return true;
    }

    // ---- Taps ----

    private void handleTap(Frame frame, float x, float y, List<Draw> draws, float[] viewProjection,
                           float[] cameraPoint, ArScene.Room room, Anchor roomAnchor) {
        if (mode == MODE_SURFACE || mode == MODE_ZONE) {
            if (room == null || roomAnchor == null) {
                toast("Scan this room's marker card first.");
                return;
            }
            HitResult hit = surfaceHit(frame, x, y, mode == MODE_ZONE);
            if (hit == null) {
                toast(mode == MODE_ZONE ? "Point at the floor until a ring appears." : "Point at a wall, table or floor until a ring appears.");
                return;
            }
            float[] roomPose = poseArray(roomAnchor.getPose());
            if (mode == MODE_ZONE) {
                float[] local = ArPlacement.toRoom(roomPose, hit.getHitPose().getTranslation());
                room.zone.add(new float[] {local[0], local[2]});
                runOnUiThread(this::saveScene);
                return;
            }
            Pose world = placementPose(hit, cameraPoint);
            ArScene.Item item = pendingItem;
            item.roomId = room.id;
            item.pose = ArPlacement.compose(ArPlacement.inverse(roomPose), poseArray(world));
            if (!scene.items.contains(item)) scene.items.add(item);
            pendingItem = null;
            mode = MODE_NONE;
            runOnUiThread(() -> {
                setPlacementBar(false, null);
                saveScene();
                toast("Placed in " + room.name + ".");
            });
            return;
        }
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
                runOnUiThread(() -> showItem(item));
                return;
            }
        }
    }

    /** A surface hit for placement: a real plane, or a depth/feature point on an undetected wall. */
    private HitResult surfaceHit(Frame frame, float x, float y, boolean floorOnly) {
        for (HitResult hit : frame.hitTest(x, y)) {
            Trackable trackable = hit.getTrackable();
            if (trackable instanceof Plane) {
                Plane plane = (Plane) trackable;
                if (!plane.isPoseInPolygon(hit.getHitPose())) continue;
                if (floorOnly && plane.getType() != Plane.Type.HORIZONTAL_UPWARD_FACING) continue;
                return hit;
            }
            if (!floorOnly && (trackable instanceof DepthPoint || trackable instanceof Point)) return hit;
        }
        return null;
    }

    /** Photos sit flat on walls; on a floor or table they stand upright, facing the author. */
    private Pose placementPose(HitResult hit, float[] cameraPoint) {
        Pose hitPose = hit.getHitPose();
        float[] p = hitPose.getTranslation();
        Trackable trackable = hit.getTrackable();
        if (trackable instanceof Plane && ((Plane) trackable).getType() == Plane.Type.VERTICAL) {
            float[] normal = hitPose.getYAxis();
            float yaw = (float) Math.atan2(normal[0], normal[2]);
            return new Pose(new float[] {p[0] + normal[0] * 0.02f, p[1], p[2] + normal[2] * 0.02f}, ArPlacement.yawQuaternion(yaw));
        }
        float yaw = ArPlacement.yawTowards(p[0], p[2], cameraPoint[0], cameraPoint[2]);
        if (trackable instanceof Plane) {
            float lift = cameraPoint[1] - p[1] > ArPlacement.FLOOR_DROP ? 1.4f : 0.35f;
            return new Pose(new float[] {p[0], p[1] + lift, p[2]}, ArPlacement.yawQuaternion(yaw));
        }
        return new Pose(p, ArPlacement.yawQuaternion(yaw));
    }

    /** Freezes the aligned before/after photo where the author is standing and looking. */
    private void finishRephoto(Pose cameraPose, float projectionXScale, ArScene.Room room, Anchor roomAnchor) {
        ArScene.Item item = pendingItem;
        if (item == null) return;
        if (room == null || roomAnchor == null) {
            toast("Scan this room's marker card first.");
            return;
        }
        float fraction = ArPlacement.fitCenterWidthFraction(viewportWidth, viewportHeight, rephotoAspect);
        Pose photo = cameraPose.compose(Pose.makeTranslation(0f, 0f, -rephotoDistance));
        float[] inverseRoom = ArPlacement.inverse(poseArray(roomAnchor.getPose()));
        item.roomId = room.id;
        item.widthMeters = ArPlacement.rephotoWidth(rephotoDistance, projectionXScale, fraction);
        item.pose = ArPlacement.compose(inverseRoom, poseArray(photo));
        item.viewpoint = ArPlacement.compose(inverseRoom, poseArray(cameraPose));
        if (!scene.items.contains(item)) scene.items.add(item);
        pendingItem = null;
        mode = MODE_NONE;
        runOnUiThread(() -> {
            alignOverlay.setVisibility(View.GONE);
            distanceSlider.setVisibility(View.GONE);
            setPlacementBar(false, null);
            saveScene();
            toast("Before/after photo anchored in " + room.name + ".");
        });
    }

    // ---- Status ----

    private String trackingProblem(Camera camera) {
        TrackingFailureReason reason = camera.getTrackingFailureReason();
        switch (reason) {
            case INSUFFICIENT_LIGHT: return "Too dark to track. Turn on a light.";
            case EXCESSIVE_MOTION: return "Moving too fast. Slow down.";
            case INSUFFICIENT_FEATURES: return "Point at something with more detail.";
            case CAMERA_UNAVAILABLE: return "The camera is unavailable.";
            default: return "Move your phone slowly to look around.";
        }
    }

    private String statusText(ArScene.Room room) {
        if (room == null) {
            if (lastMarkerId != null) return authorMode ? "New marker: name this room to start." : "This marker isn't set up yet.";
            if (spaceLocalizer != null) return spaceLocalizer.status();
            return "Point the camera at a " + scene.title + " marker card.";
        }
        int found = 0;
        int hidden = 0;
        for (ArScene.Item item : scene.items) {
            if (!visible(item) || !ArScene.PLACEMENT_DISCOVER.equals(item.placement)) continue;
            if (!item.roomId.isEmpty() && !item.roomId.equals(room.id)) continue;
            if (discovered.contains(item.id)) found++;
            else hidden++;
        }
        String counts = room.publicAccess && found + hidden > 0 ? " · " + found + " found, " + hidden + " to discover" : "";
        return room.name + (room.outdoor ? " (outside)" : "") + (room.publicAccess ? "" : " · private") + counts;
    }

    private String hintText(ArScene.Room room, boolean nearViewpoint) {
        if (mode == MODE_SURFACE) return "Aim the ring at a wall, table or floor, then tap to place.";
        if (mode == MODE_ZONE) return "Tap the floor at each corner of the open, walkable area. Prompts only appear inside it.";
        if (mode == MODE_REPHOTO) return "Stand where the photo was taken and line it up with the scene, then tap Anchor.";
        if (nearViewpoint) return "You're standing where this photo was taken. Slide to compare then and now.";
        return "";
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
        });
    }

    private void setCompareVisible(boolean visible) {
        if (visible == compareVisible) return;
        compareVisible = visible;
        runOnUiThread(() -> compareBar.setVisibility(visible ? View.VISIBLE : View.GONE));
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

        alignOverlay = new ImageView(this);
        alignOverlay.setScaleType(ImageView.ScaleType.FIT_CENTER);
        alignOverlay.setAlpha(0.5f);
        alignOverlay.setVisibility(View.GONE);
        root.addView(alignOverlay, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout top = column();
        top.setPadding(dp(12), dp(36), dp(12), dp(8));
        top.setBackgroundColor(Color.argb(150, 0, 0, 0));
        LinearLayout titleRow = row();
        Button close = button("Close", v -> finish());
        titleRow.addView(close);
        status = text(15, true);
        status.setPadding(dp(10), 0, 0, 0);
        titleRow.addView(status, new LinearLayout.LayoutParams(0, -2, 1f));
        top.addView(titleRow);
        LinearLayout chips = row();
        chips.setPadding(0, 0, 0, dp(6));
        for (String layer : ArScene.LAYERS) chips.addView(layerChip(layer));
        HorizontalScrollView chipScroll = new HorizontalScrollView(this);
        chipScroll.setHorizontalScrollBarEnabled(false);
        chipScroll.addView(chips);
        top.addView(chipScroll);
        hint = text(14, false);
        hint.setVisibility(View.GONE);
        top.addView(hint);
        root.addView(top, new FrameLayout.LayoutParams(-1, -2, Gravity.TOP));

        LinearLayout bottom = column();
        bottom.setPadding(dp(12), dp(8), dp(12), dp(28));

        compareBar = row();
        compareBar.setVisibility(View.GONE);
        compareBar.setBackground(rounded(Color.argb(190, 0, 0, 0)));
        compareBar.setPadding(dp(12), dp(8), dp(12), dp(8));
        compareBar.addView(text(14, true, "Now"));
        SeekBar compare = new SeekBar(this);
        compare.setMax(100);
        compare.setProgress(85);
        compare.setOnSeekBarChangeListener(seek(value -> beforeAfter = value / 100f));
        compareBar.addView(compare, new LinearLayout.LayoutParams(0, -2, 1f));
        compareBar.addView(text(14, true, "Then"));
        bottom.addView(compareBar, matchWrap());

        distanceSlider = new SeekBar(this);
        distanceSlider.setMax(70);
        distanceSlider.setProgress(20);
        distanceSlider.setVisibility(View.GONE);
        distanceSlider.setOnSeekBarChangeListener(seek(value -> {
            synchronized (lock) {
                rephotoDistance = 1f + value / 10f;
            }
        }));
        bottom.addView(distanceSlider, matchWrap());

        infoPanel = column();
        infoPanel.setVisibility(View.GONE);
        infoPanel.setBackground(rounded(Color.argb(225, 18, 24, 22)));
        infoPanel.setPadding(dp(16), dp(12), dp(16), dp(12));
        infoText = text(15, false);
        ScrollView infoScroll = new ScrollView(this);
        infoScroll.addView(infoText);
        infoPanel.addView(infoScroll, new LinearLayout.LayoutParams(-1, dp(140)));
        infoActions = row();
        infoPanel.addView(infoActions);
        bottom.addView(infoPanel, matchWrap());

        placementBar = row();
        placementBar.setVisibility(View.GONE);
        bottom.addView(placementBar);

        authorBar = row();
        authorBar.setVisibility(authorMode ? View.VISIBLE : View.GONE);
        authorBar.addView(button("Photo", v -> pick(PICK_PHOTO, "image/*")));
        authorBar.addView(button("Before/after", v -> pick(PICK_REPHOTO, "image/*")));
        authorBar.addView(button("Prompt", v -> showPromptDialog()));
        authorBar.addView(button("Zone", v -> startZone()));
        authorBar.addView(button("More", v -> showMoreMenu()));
        HorizontalScrollView authorScroll = new HorizontalScrollView(this);
        authorScroll.addView(authorBar);
        bottom.addView(authorScroll);

        root.addView(bottom, new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM));
        ScanActivity.keepAboveNavigationBar(bottom);
        setContentView(root);
        status.setText("Starting camera…");
    }

    private View layerChip(String layer) {
        TextView chip = text(13, true, ArCards.layerLabel(layer));
        chip.setPadding(dp(12), dp(6), dp(12), dp(6));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-2, -2);
        params.setMargins(0, dp(8), dp(8), 0);
        chip.setLayoutParams(params);
        int color = ArCards.layerColor(layer);
        Runnable paint = () -> {
            boolean on = enabledLayers.contains(layer);
            GradientDrawable background = rounded(on ? color : Color.argb(120, 60, 60, 60));
            chip.setBackground(background);
            chip.setTextColor(on ? Color.BLACK : Color.LTGRAY);
            chip.setContentDescription(ArCards.layerLabel(layer) + (on ? ", shown" : ", hidden"));
        };
        paint.run();
        chip.setOnClickListener(v -> {
            synchronized (lock) {
                if (!enabledLayers.remove(layer)) enabledLayers.add(layer);
            }
            paint.run();
        });
        return chip;
    }

    private void showItem(ArScene.Item item) {
        StringBuilder body = new StringBuilder();
        body.append(item.title.isEmpty() ? (item.word.isEmpty() ? "Untitled" : item.word) : item.title);
        if (!item.word.isEmpty() && !item.word.equals(item.title)) body.append("\n").append(item.word);
        if (!item.pronunciation.isEmpty()) body.append("\nsay: ").append(item.pronunciation);
        if (!item.meaning.isEmpty()) body.append("\n").append(item.meaning);
        if (!item.caption.isEmpty()) body.append("\n\n").append(item.caption);
        if (!item.credit.isEmpty()) body.append("\n\nCredit: ").append(item.credit);
        ArScene.Room room = scene.room(item.roomId);
        if (authorMode) body.append("\n\n[").append(ArCards.layerLabel(item.layer)).append(" · ")
            .append(item.placement).append(room == null ? "" : " · " + room.name).append("]");
        infoText.setText(body);
        infoActions.removeAllViews();
        if (!item.audio.isEmpty()) infoActions.addView(button("Play", v -> playAudio(item)));
        if (authorMode) {
            infoActions.addView(button("Edit", v -> showItemDialog(item, false, null)));
            if (!ArScene.PLACEMENT_DISCOVER.equals(item.placement)) {
                infoActions.addView(button("Move", v -> {
                    infoPanel.setVisibility(View.GONE);
                    if (ArScene.KIND_REPHOTO.equals(item.kind)) startRephoto(item);
                    else startSurfacePlacement(item);
                }));
            }
            infoActions.addView(button("Delete", v -> new AlertDialog.Builder(this)
                .setMessage("Remove \"" + body.toString().split("\n")[0] + "\" from the AR scene?")
                .setPositiveButton("Remove", (d, w) -> {
                    synchronized (lock) {
                        scene.items.remove(item);
                        Anchor anchor = discoverAnchors.remove(item.id);
                        if (anchor != null) anchor.detach();
                    }
                    infoPanel.setVisibility(View.GONE);
                    saveScene();
                })
                .setNegativeButton("Cancel", null)
                .show()));
        }
        infoActions.addView(button("Close", v -> infoPanel.setVisibility(View.GONE)));
        infoPanel.setVisibility(View.VISIBLE);
        if (!item.audio.isEmpty() && !ArScene.PLACEMENT_DISCOVER.equals(item.placement)) playAudio(item);
    }

    private void onDiscovered(ArScene.Item item) {
        vibrateConfirm();
        toast("You found " + (item.word.isEmpty() ? (item.title.isEmpty() ? "a story" : item.title) : item.word) + ".");
        if (!item.audio.isEmpty()) playAudio(item);
    }

    // ---- Authoring ----

    private void showRoomDialog(String markerId, ArScene.Room existing) {
        LinearLayout form = formLayout();
        EditText name = field(form, "Room name (e.g. Kitchen, Front porch)", existing == null ? "" : existing.name);
        CheckBox open = check(form, "Open to visitors (prompts can be discovered here)", existing == null || existing.publicAccess);
        CheckBox outdoor = check(form, "Outdoors", existing != null && existing.outdoor);
        new AlertDialog.Builder(this)
            .setTitle(existing == null ? "Marker " + markerId.replace("marker-", "#") + " found" : "Edit room")
            .setView(form)
            .setPositiveButton("Save", (d, w) -> {
                synchronized (lock) {
                    ArScene.Room room = existing;
                    if (room == null) {
                        room = new ArScene.Room();
                        room.id = ArScene.newId("room");
                        room.markerId = markerId;
                        scene.rooms.add(room);
                    }
                    room.name = name.getText().toString().trim().isEmpty() ? "Room " + markerId.replace("marker-", "") : name.getText().toString().trim();
                    room.publicAccess = open.isChecked();
                    room.outdoor = outdoor.isChecked();
                }
                saveScene();
            })
            .setNegativeButton("Later", null)
            .show();
    }

    private void showItemDialog(ArScene.Item item, boolean isNew, Runnable afterSave) {
        LinearLayout form = formLayout();
        boolean prompt = ArScene.KIND_PHRASE.equals(item.kind) || ArScene.KIND_AUDIO.equals(item.kind);
        RadioGroup layers = new RadioGroup(this);
        layers.setOrientation(RadioGroup.HORIZONTAL);
        String[] choices = prompt
            ? new String[] {ArScene.LAYER_LANGUAGE, ArScene.LAYER_AUDIO}
            : new String[] {ArScene.LAYER_FAMILY, ArScene.LAYER_ARCHIVAL};
        for (String layer : choices) {
            RadioButton radio = new RadioButton(this);
            radio.setText(ArCards.layerLabel(layer));
            radio.setTag(layer);
            radio.setId(View.generateViewId());
            layers.addView(radio);
            if (layer.equals(item.layer)) layers.check(radio.getId());
        }
        if (layers.getCheckedRadioButtonId() == -1) layers.check(layers.getChildAt(0).getId());
        form.addView(layers);
        EditText title = field(form, prompt ? "Title (shown in lists)" : "Title", item.title);
        EditText word = prompt ? field(form, "Word or phrase (community-approved)", item.word) : null;
        EditText say = prompt ? field(form, "Pronunciation guide", item.pronunciation) : null;
        EditText meaning = prompt ? field(form, "Meaning in English", item.meaning) : null;
        EditText caption = field(form, "Caption or story", item.caption);
        caption.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        caption.setMinLines(2);
        EditText credit = field(form, "Credit / source", item.credit);
        CheckBox discover = prompt ? check(form, "Discoverable: auto-place on open surfaces in public rooms", ArScene.PLACEMENT_DISCOVER.equals(item.placement)) : null;
        CheckBox thisRoomOnly = prompt ? check(form, "Only in the room I'm in now", !item.roomId.isEmpty()) : null;
        CheckBox addAudio = prompt && isNew ? check(form, "Attach an audio file next", false) : null;
        new AlertDialog.Builder(this)
            .setTitle(isNew ? (prompt ? "New prompt" : "New photo") : "Edit")
            .setView(form)
            .setPositiveButton(isNew ? "Next" : "Save", (d, w) -> {
                synchronized (lock) {
                    View checked = layers.findViewById(layers.getCheckedRadioButtonId());
                    item.layer = (String) checked.getTag();
                    item.title = title.getText().toString().trim();
                    item.caption = caption.getText().toString().trim();
                    item.credit = credit.getText().toString().trim();
                    if (prompt) {
                        item.word = word.getText().toString().trim();
                        item.pronunciation = say.getText().toString().trim();
                        item.meaning = meaning.getText().toString().trim();
                        item.placement = discover.isChecked() ? ArScene.PLACEMENT_DISCOVER : ArScene.PLACEMENT_ANCHORED;
                        if (discover.isChecked()) {
                            ArScene.Room room = lastMarkerId == null ? null : scene.roomForMarker(lastMarkerId);
                            item.roomId = thisRoomOnly.isChecked() && room != null ? room.id : "";
                            item.pose = null;
                        }
                    }
                }
                invalidateTextures(item);
                if (afterSave != null) afterSave.run();
                else if (ArScene.PLACEMENT_ANCHORED.equals(item.placement) && item.pose == null) startSurfacePlacement(item);
                else saveScene();
                if (addAudio != null && addAudio.isChecked()) {
                    awaitingAudioFor = item;
                    pick(PICK_AUDIO, "audio/*");
                }
            })
            .setNegativeButton("Cancel", null)
            .show();
    }

    private void showPromptDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Add a prompt")
            .setItems(new CharSequence[] {"Language word or phrase", "Audio clip"}, (d, which) -> {
                ArScene.Item item = new ArScene.Item();
                item.id = ArScene.newId("item");
                item.kind = which == 0 ? ArScene.KIND_PHRASE : ArScene.KIND_AUDIO;
                item.layer = which == 0 ? ArScene.LAYER_LANGUAGE : ArScene.LAYER_AUDIO;
                item.placement = ArScene.PLACEMENT_DISCOVER;
                showItemDialog(item, true, () -> {
                    if (ArScene.PLACEMENT_DISCOVER.equals(item.placement)) {
                        synchronized (lock) {
                            scene.items.add(item);
                        }
                        saveScene();
                        toast("Saved. It will appear on an open surface in a public room.");
                    } else {
                        startSurfacePlacement(item);
                    }
                });
            })
            .show();
    }

    private void startSurfacePlacement(ArScene.Item item) {
        synchronized (lock) {
            pendingItem = item;
            mode = MODE_SURFACE;
        }
        setPlacementBar(true, null);
    }

    private void startRephoto(ArScene.Item item) {
        Bitmap photo = decodeImage(item.image, 1600);
        if (photo == null) {
            toast("Couldn't open that photo.");
            return;
        }
        synchronized (lock) {
            pendingItem = item;
            mode = MODE_REPHOTO;
            rephotoAspect = photo.getHeight() / (float) photo.getWidth();
        }
        alignOverlay.setImageBitmap(photo);
        alignOverlay.setVisibility(View.VISIBLE);
        distanceSlider.setVisibility(View.VISIBLE);
        setPlacementBar(true, button("Anchor", v -> {
            synchronized (lock) {
                anchorRephotoRequested = true;
            }
        }));
        toast("Slider sets how far away the scene is (1–8 m).");
    }

    private void startZone() {
        synchronized (lock) {
            ArScene.Room room = lastMarkerId == null ? null : scene.roomForMarker(lastMarkerId);
            if (room == null) {
                toast("Scan and name this room's marker first.");
                return;
            }
            mode = MODE_ZONE;
        }
        setPlacementBar(true, button("Clear", v -> {
            synchronized (lock) {
                ArScene.Room room = scene.roomForMarker(lastMarkerId);
                if (room != null) room.zone.clear();
            }
            saveScene();
        }));
    }

    private void setPlacementBar(boolean show, Button extra) {
        placementBar.removeAllViews();
        if (show) {
            if (extra != null) placementBar.addView(extra);
            placementBar.addView(button("Done", v -> {
                synchronized (lock) {
                    mode = MODE_NONE;
                    pendingItem = null;
                }
                alignOverlay.setVisibility(View.GONE);
                distanceSlider.setVisibility(View.GONE);
                setPlacementBar(false, null);
            }));
        }
        placementBar.setVisibility(show ? View.VISIBLE : View.GONE);
        authorBar.setVisibility(!show && authorMode ? View.VISIBLE : View.GONE);
    }

    private void showMoreMenu() {
        new AlertDialog.Builder(this)
            .setItems(new CharSequence[] {"Edit this room", "Export scene (.zip)", "Import scene (.zip)", "Reset to the bundled scene"}, (d, which) -> {
                if (which == 0) {
                    ArScene.Room room = lastMarkerId == null ? null : scene.roomForMarker(lastMarkerId);
                    if (room == null) toast("Scan a room's marker first.");
                    else showRoomDialog(room.markerId, room);
                } else if (which == 1) {
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                        .setType("application/zip").putExtra(Intent.EXTRA_TITLE, scene.siteId + "-ar-scene.zip");
                    startActivityForResult(intent, EXPORT_SCENE);
                } else if (which == 2) {
                    pick(IMPORT_SCENE, "application/zip");
                } else {
                    new AlertDialog.Builder(this)
                        .setMessage("Discard every room, photo and prompt authored on this phone?")
                        .setPositiveButton("Discard", (d2, w2) -> {
                            store.resetToBundled();
                            reloadScene();
                        })
                        .setNegativeButton("Cancel", null)
                        .show();
                }
            })
            .show();
    }

    private void pick(int request, String mime) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime);
        startActivityForResult(intent, request);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        try {
            if (requestCode == PICK_PHOTO || requestCode == PICK_REPHOTO) {
                ArScene.Item item = new ArScene.Item();
                item.id = ArScene.newId("item");
                item.kind = requestCode == PICK_REPHOTO ? ArScene.KIND_REPHOTO : ArScene.KIND_PHOTO;
                item.layer = ArScene.LAYER_FAMILY;
                item.image = importPhoto(uri, item.id);
                showItemDialog(item, true, () -> {
                    if (requestCode == PICK_REPHOTO) startRephoto(item);
                    else startSurfacePlacement(item);
                });
            } else if (requestCode == PICK_AUDIO && awaitingAudioFor != null) {
                ArScene.Item item = awaitingAudioFor;
                awaitingAudioFor = null;
                String name = item.id + ".audio";
                try (InputStream in = getContentResolver().openInputStream(uri);
                     OutputStream out = new FileOutputStream(store.mediaFile(name))) {
                    ArScene.copy(in, out);
                }
                synchronized (lock) {
                    item.audio = name;
                }
                invalidateTextures(item);
                saveScene();
                toast("Audio attached.");
            } else if (requestCode == EXPORT_SCENE) {
                try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                    synchronized (lock) {
                        store.exportZip(scene, out);
                    }
                }
                toast("Scene exported.");
            } else if (requestCode == IMPORT_SCENE) {
                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    store.importZip(in);
                }
                reloadScene();
                toast("Scene imported.");
            }
        } catch (Exception error) {
            toast("That didn't work: " + error.getMessage());
        }
    }

    /** Copies a picked photo into app storage as a JPEG no larger than 2048 px. */
    private String importPhoto(Uri uri, String id) throws Exception {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            BitmapFactory.decodeStream(in, null, bounds);
        }
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inSampleSize = sampleSize(bounds, 2048);
        Bitmap bitmap;
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            bitmap = BitmapFactory.decodeStream(in, null, options);
        }
        if (bitmap == null) throw new IllegalArgumentException("not an image");
        String name = id + ".jpg";
        File file = store.mediaFile(name);
        try (OutputStream out = new FileOutputStream(file)) {
            bitmap.compress(Bitmap.CompressFormat.JPEG, 88, out);
        }
        return name;
    }

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
        return new java.io.FileInputStream(store.mediaFile(name));
    }

    private static int sampleSize(BitmapFactory.Options bounds, int maxSide) {
        int sample = 1;
        while (Math.max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= maxSide) sample *= 2;
        return sample;
    }

    private void saveScene() {
        try {
            synchronized (lock) {
                store.save(scene);
            }
        } catch (Exception error) {
            toast("Couldn't save: " + error.getMessage());
        }
    }

    private void reloadScene() {
        try {
            ArScene fresh = store.load();
            synchronized (lock) {
                scene = fresh;
                for (Anchor anchor : discoverAnchors.values()) anchor.detach();
                discoverAnchors.clear();
                discoverLift.clear();
                discoverRoom.clear();
                discovered.clear();
                loading.clear();
            }
        } catch (Exception error) {
            toast("Couldn't load the scene: " + error.getMessage());
        }
    }

    // ---- Audio ----

    private void playAudio(ArScene.Item item) {
        stopAudio();
        try {
            player = new MediaPlayer();
            if (item.audio.startsWith("asset:")) {
                try (AssetFileDescriptor fd = getAssets().openFd(item.audio.substring(6))) {
                    player.setDataSource(fd.getFileDescriptor(), fd.getStartOffset(), fd.getLength());
                }
            } else {
                player.setDataSource(store.mediaFile(item.audio).getAbsolutePath());
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
        button.setOnClickListener(listener);
        return button;
    }

    private GradientDrawable rounded(int color) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(16));
        return drawable;
    }

    private LinearLayout formLayout() {
        LinearLayout form = column();
        form.setPadding(dp(20), dp(8), dp(20), 0);
        return form;
    }

    private EditText field(LinearLayout form, String label, String value) {
        EditText field = new EditText(this);
        field.setHint(label);
        field.setText(value);
        field.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        form.addView(field, new ViewGroup.LayoutParams(-1, -2));
        return field;
    }

    private CheckBox check(LinearLayout form, String label, boolean checked) {
        CheckBox box = new CheckBox(this);
        box.setText(label);
        box.setChecked(checked);
        form.addView(box);
        return box;
    }

    private interface IntListener {
        void onValue(int value);
    }

    private static SeekBar.OnSeekBarChangeListener seek(IntListener listener) {
        return new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar bar, int value, boolean fromUser) { listener.onValue(value); }
            @Override public void onStartTrackingTouch(SeekBar bar) {}
            @Override public void onStopTrackingTouch(SeekBar bar) {}
        };
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

        /** Lies flat on the floor (the unit quad's +Z turned to world up). */
        static Draw flat(Pose pose, String texture, float size, float alpha, float distance) {
            Pose flat = new Pose(pose.getTranslation(), new float[] {0, 0, 0, 1})
                .compose(Pose.makeRotation((float) -Math.sin(Math.PI / 4), 0f, 0f, (float) Math.cos(Math.PI / 4)));
            Draw draw = posed(null, flat, texture, size, size, alpha, distance);
            return draw;
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
