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
    // Devices ARCore can't run on get the camera with the bubbles over it.
    static final String EXTRA_CAMERA_ONLY = "camera_only";

    private static final int REQUEST_CAMERA = 41;
    private static final int REQUEST_MICROPHONE = 42;
    private static final String PREF_ASKED_MICROPHONE = "asked_microphone";
    // The name on the selfie name tag; it stays on this phone.
    private static final String PREF_SELFIE_NAME = "selfie_name";
    private static final float[] IDENTITY = new float[16];

    static {
        Matrix.setIdentityM(IDENTITY, 0);
    }


    // Free roam reveals bubbles gradually as the visitor explores: at most two
    // unopened at once, spread out, a new one after opening one, walking a
    // little, or a short wait.
    private static final int FREE_WAITING_MAX = 2;
    private static final float FREE_SPACING_M = 2f;
    private static final float FREE_STEP_M = 1.5f;
    private static final long FREE_GAP_MS = 8000;
    private static final double FREE_APART_DEG = 40;
    private long lastFreeSpawnAt;
    private long lastDismissAt;
    private float[] lastCameraPoint;
    private final List<float[]> dismissedSpots = new ArrayList<>();
    private float[] lastFreeSpawnFrom;
    // Real places float in their real direction once the compass is lined
    // up with the AR world; bubbles stay in front of walls and furniture.
    private static final double FREE_VIEW_DEG = 25;
    private static final float FREE_WALL_GAP_M = 0.4f;
    private static final float FREE_MIN_M = 0.9f;
    private static final float FREE_PLACE_MIN_M = 0.7f;
    private static final float FREE_UNKNOWN_M = 2.2f;
    private static final long FREE_COMPASS_WAIT_MS = 15000;
    // "You are here" opens just ahead, below eye level, before anything else. Nearby
    // sites rise into the sky in their real directions, one after another, far enough
    // to read as the landscape; signs that lie the same way stack up.
    // Far enough that the visitor walks up to it (DISCOVER_DISTANCE) to open it.
    private static final float HERE_AHEAD_M = 2.4f;
    private static final float HERE_BELOW_EYE_M = 0.3f;
    private static final float HERE_WIDTH_M = 0.42f;
    private static final float SKY_DISTANCE_M = 9f;
    private static final float SKY_HEIGHT_M = 3.2f;
    private static final float SKY_STACK_M = 1.7f;
    private static final float SKY_WIDTH_M = 2.1f;
    private static final double SKY_APART_DEG = 14;
    private static final long SKY_RISE_MS = 1300;
    private static final long SKY_STAGGER_MS = 280;
    private static final float SKY_RISE_FROM_M = 2.4f;
    // Walking this far from where the signs were set out places them again around you.
    private static final float SKY_REPLACE_M = 6f;
    private final Map<String, Long> skyShownAt = new HashMap<>();
    private final Map<String, float[]> skyFrom = new HashMap<>();
    private final Map<String, Double> skyHeading = new HashMap<>();
    private final Map<String, Integer> skyTier = new HashMap<>();
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
    // Pressing on a bubble or card and dragging down brings it closer, up
    // pushes it away: a third of the screen doubles or halves the distance,
    // within these limits (metres).
    private static final float DRAG_NEAREST_BUBBLE_M = 0.5f;
    private static final float DRAG_NEAREST_CARD_M = 0.6f;
    private static final float DRAG_FARTHEST_M = 5f;
    // A ✕ badge's draw is the item's id after this.
    private static final String DISMISS = "dismiss:";
    private static final float DRAG_START = 0f;
    private static final float DRAG_MOVE = 1f;
    private static final float DRAG_END = 2f;
    // Two fingers on a recognized thing's label: its size and turn.
    private static final float PINCH_START = 3f;
    private static final float PINCH_MOVE = 4f;
    private static final float PINCH_END = 5f;
    // Spots of bubbles put away with their ✕ that new bubbles keep clear of.
    private static final int DISMISSED_SPOTS_MAX = 6;

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
    // Posts the AR photo to this place's Community Notes ("Visitor experiences").
    private TextView photoPost;
    private Uri photoSavedUri;
    private String photoSavedType = "image/jpeg";
    // AR video (hold the shutter): the recording while it runs, and in full AR
    // the frame it draws again (GL thread only).
    private volatile ArVideo video;
    private boolean recordedVideo;
    private ImageView shutter;
    private TextView recordPill;
    private final android.os.Handler videoTicker = new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable videoTick = this::tickVideo;
    private Frame videoFrameSource;
    private List<Draw> videoDraws = Collections.emptyList();
    private float[] videoViewProjection;
    private final ConcurrentLinkedQueue<float[]> taps = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<float[]> drags = new ConcurrentLinkedQueue<>();
    private final Random random = new Random();

    // "Place": stickers and a flag the visitor puts into their own space, held
    // by ARCore anchors where they were placed while AR stays open. The one
    // chosen in the drawer waits for a tap; the selected one can be resized,
    // turned or removed (guarded by lock).
    private static final int PLACED_MAX = 12;
    private static final ArGl.Mesh POLE = ArPlace.cylinder(18, ArPlace.POLE_RADIUS, ArPlace.POLE_HEIGHT);
    private static final ArGl.Mesh FINIAL = ArPlace.sphere(8, 12, ArPlace.FINIAL_RADIUS);
    private static final ArGl.Mesh CLOTH = ArPlace.cloth(24, 12);
    private final List<ArPlace.Placed> placed = new ArrayList<>();
    private ArPlace.Placed selectedPlace;
    private ArPlace.Asset placingAsset;
    private volatile boolean aimFound;
    private final long placeClock = SystemClock.uptimeMillis();
    private List<MeshDraw> videoMeshes = Collections.emptyList();
    // QA builds: assets to place as soon as tracking starts (files/qa-ar-place).
    private final List<ArPlace.Asset> qaPlace = new ArrayList<>();
    private View placeButton;
    private LinearLayout placeDrawer;
    private LinearLayout placeList;
    private LinearLayout placeTools;

    // Scene state (guarded by lock).
    private ArScene scene;
    private final Map<String, Anchor> discoverAnchors = new HashMap<>();  // itemId -> anchor
    private final Map<String, Float> discoverLift = new HashMap<>();
    // Bubbles the visitor moved by hand: how far from their anchor (metres).
    // These open only with a tap, not by coming near.
    private final Map<String, float[]> discoverNudge = new HashMap<>();
    private String dragId;
    private float dragFromY;
    private float dragFromDistance;
    private float dragTo = Float.NaN;
    private boolean draggedOnce;
    private final Set<String> discovered = new HashSet<>();
    private final Set<String> loading = new HashSet<>();
    private final Set<String> enabledLayers = new HashSet<>();
    // Put away with their ✕ (for this visit), and every bubble hidden at once
    // (the Hide all button, to work with stickers and the flag in a clear view).
    private final Set<String> dismissed = Collections.synchronizedSet(new HashSet<>());
    private volatile boolean bubblesHidden;
    // The item whose card the info panel last opened (put away with it, the panel closes).
    private volatile String shownItemId;
    // Real things the camera recognized on the phone (a door), each labeled with
    // its words where it was seen. Found on the recognizer's thread, made into
    // labels (with anchors) on the GL thread.
    private ArObjects objects;
    private final List<SeenThing> seenThings = new ArrayList<>();
    private final ConcurrentLinkedQueue<SeenThing> seenPending = new ConcurrentLinkedQueue<>();
    private long lastLookAt;
    private long lastSteadyAt;
    private float[] lastSteadyFrom;
    private float[] lastSteadyFacing;
    private boolean steadyNow;
    private int seenCount;
    // A recognized thing's label held by one finger (moved across the view at its
    // distance) or by two (sized and turned); seenGestured once either is done.
    private SeenThing movingSeen;
    private float movingDistance;
    private SeenThing pinchSeen;
    private float pinchFromSpacing;
    private float pinchFromAngle;
    private float pinchFromScale;
    private float pinchFromRoll;
    private boolean seenGestured;
    private int cameraImageRotation = -1;

    private long lastSpawnAttempt;

    private GLSurfaceView surface;
    private boolean cameraOnly;
    private ArCameraField cameraField;
    // Selfie mode: the front camera and the visitor's name tag, in place of AR.
    private ArSelfie selfie;
    private boolean selfieMode;
    private TextView modeAr;
    private TextView modeSelfie;
    private View hideButton;
    private View statusCapsule;
    private Session session;
    private boolean installRequested;
    private boolean resumed;
    private int availabilityChecks;
    private int resumeRetries;
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
        cameraOnly = getIntent().getBooleanExtra(EXTRA_CAMERA_ONLY, false);
        if (!cameraOnly) objects = ArObjects.create(this);
        identifyQaPhoto();
        // Camera-only AR turns with the device (a tablet is often held
        // sideways); full AR keeps the portrait screen it was built for.
        if (cameraOnly) setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            backCallback = this::handleBack;
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCallback);
        }
        sensors = (android.hardware.SensorManager) getSystemService(SENSOR_SERVICE);
        if (!Double.isNaN(scene.hereLat)) compass.setLocation(scene.hereLat, scene.hereLng);
        locations = (android.location.LocationManager) getSystemService(LOCATION_SERVICE);
        buildUi();
        if (BuildConfig.DEBUG) {
            runQaCardHooks();
            readQaPlace();
            openQaDrawer();
        }
    }

    /**
     * QA builds only: with a file "qa-ar-cards" in the app's files folder, every bubble's card
     * (its floating card, plus the pin and sky signs as drawn) is rendered to files/qa-cards/
     * to be pulled and checked, even with the device lying on a desk. The file's text, if any,
     * names an item whose opened card is shown, as a tap would.
     */
    private void runQaCardHooks() {
        java.io.File flag = new java.io.File(getFilesDir(), "qa-ar-cards");
        if (!flag.exists()) return;
        String openId = "";
        try (java.io.FileInputStream in = new java.io.FileInputStream(flag)) {
            byte[] bytes = new byte[(int) flag.length()];
            int read = in.read(bytes);
            openId = new String(bytes, 0, Math.max(0, read), java.nio.charset.StandardCharsets.UTF_8).trim();
        } catch (Exception ignored) {
            // No item to open.
        }
        java.io.File out = new java.io.File(getFilesDir(), "qa-cards");
        java.io.File[] old = out.listFiles();
        if (old != null) for (java.io.File file : old) file.delete();
        out.mkdirs();
        loader.execute(() -> {
            int index = 0;
            for (ArScene.Item item : scene.items) {
                String name = String.format(Locale.US, "%02d-%s", index++, item.id.replaceAll("[^A-Za-z0-9_-]", "_"));
                try {
                    Bitmap photo = decodeImage(item.image, 900);
                    saveQaCard(new java.io.File(out, name + "-card.png"), ArCards.promptCard(item, photo));
                    if (item.isHere()) saveQaCard(new java.io.File(out, name + "-pin.png"), ArCards.hereMarker(item));
                    if (item.isSky()) saveQaCard(new java.io.File(out, name + "-sky.png"), ArCards.skySign(item, decodeImage(item.image, 256)));
                } catch (Exception error) {
                    android.util.Log.w("OnThisSiteAR", "QA card " + item.id + " failed: " + error);
                }
            }
            // Each thing the camera can name: its small label, and ("seen-<key>" in the file) its opened card.
            for (ArObjects.Thing thing : ArObjects.THINGS) {
                try {
                    saveQaCard(new java.io.File(out, "seen-" + thing.key + "-label.png"), ArCards.objectLabel(thingItem(thing, 0)));
                } catch (Exception error) {
                    android.util.Log.w("OnThisSiteAR", "QA label " + thing.key + " failed: " + error);
                }
            }
            android.util.Log.i("OnThisSiteAR", "QA cards rendered: " + index);
        });
        for (ArObjects.Thing thing : ArObjects.THINGS) {
            if (openId.equals("seen-" + thing.key)) infoPanel.postDelayed(() -> showItem(thingItem(thing, 0)), 1500);
        }
        for (ArScene.Item item : scene.items) {
            if (item.id.equals(openId)) {
                infoPanel.postDelayed(() -> showItem(item), 1500);
                break;
            }
        }
    }

    private static void saveQaCard(java.io.File file, Bitmap bitmap) throws java.io.IOException {
        try (java.io.FileOutputStream stream = new java.io.FileOutputStream(file)) {
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
        }
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
        if (selfieMode) {
            selfie.start();
            return;
        }
        if (cameraOnly) {
            if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[] {Manifest.permission.CAMERA}, REQUEST_CAMERA);
                return;
            }
            cameraField.start();
            return;
        }
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
                // The bubbles still float over the plain camera.
                startActivity(new Intent(getIntent()).putExtra(EXTRA_CAMERA_ONLY, true));
                finish();
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
            // Just after selfie mode the front camera may still be closing.
            if (resumeRetries++ < 6) {
                surface.postDelayed(this::startAr, 300);
                return;
            }
            showFatal("The camera is busy in another app. Close it and try again.");
            session = null;
            return;
        }
        resumeRetries = 0;
        surface.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        stopArVideo();
        resumed = false;
        compass.stop(sensors);
        if (locations != null) locations.removeUpdates(fixListener);
        if (cameraField != null) cameraField.stop();
        if (selfie != null) selfie.stop();
        if (session != null && !selfieMode) {
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
        if (objects != null) objects.close();
        objects = null;
        loader.shutdownNow();
        stopAudio();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_CAMERA && (grantResults.length == 0 || grantResults[0] != PackageManager.PERMISSION_GRANTED)) {
            showFatal("AR needs the camera. You can allow it in Settings → Apps → On This Site.");
        }
        if (requestCode == REQUEST_MICROPHONE) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            toast(granted ? "Now hold the camera button to record a video." : "Hold the camera button to record a video (without sound).");
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
        // The Place drawer's shared pieces; each sticker's and flag's artwork is
        // drawn the first time it is used (placeArtwork).
        gl.queueTexture("place:shadow", ArPlace.shadowBlob());
        gl.queueTexture("place:ring", ArPlace.ring());
        gl.queueTexture("place:outline", ArPlace.outline());
        gl.queueTexture("ui:dismiss", ArCards.dismissBadge());
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
        ArVideo recording = video;
        if (recording != null && !cameraOnly) recording.drawGl(this::drawVideoFrame, viewportWidth, viewportHeight);
    }

    /** Full AR: this frame again for the video, with the credit along the bottom. */
    private void drawVideoFrame() {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT | GLES20.GL_DEPTH_BUFFER_BIT);
        if (videoFrameSource == null) return;
        gl.drawBackground(videoFrameSource);
        if (videoViewProjection != null && !videoMeshes.isEmpty()) drawMeshes(videoViewProjection, videoMeshes);
        gl.beginQuads();
        if (videoViewProjection != null) {
            for (Draw draw : videoDraws) {
                if (!isDismiss(draw)) gl.drawQuad(videoViewProjection, draw.model, gl.texture(draw.texture), draw.alpha);
            }
        }
        ArVideo recording = video;
        float aspect = gl.aspect("video-credit");
        if (recording != null && aspect > 0f) {
            // The whole width, at the bottom, in screen coordinates (-1 to 1).
            float high = 2f * aspect * recording.width / recording.height;
            float[] model = new float[16];
            Matrix.setIdentityM(model, 0);
            Matrix.translateM(model, 0, 0f, -1f + high / 2f, 0f);
            Matrix.scaleM(model, 0, 2f, high, 1f);
            gl.drawQuad(IDENTITY, model, gl.texture("video-credit"), 1f);
        }
        gl.endQuads();
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
        videoFrameSource = frame;
        videoDraws = Collections.emptyList();
        videoMeshes = Collections.emptyList();
        videoViewProjection = null;
        synchronized (lock) {
            if (camera.getTrackingState() != TrackingState.TRACKING) {
                if (wasTracking) android.util.Log.i("OnThisSiteAR", "Tracking lost: " + camera.getTrackingFailureReason());
                wasTracking = false;
                taps.clear();
                drags.clear();
                dragId = null;
                if (movingSeen != null) movingSeen.heldAt = null;
                movingSeen = null;
                pinchSeen = null;
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
            lookForThings(frame, cameraPose);
            collectSeenThings(draws, cameraPoint);
            List<MeshDraw> meshes = new ArrayList<>();
            placeQaAssets(frame, cameraPose);
            collectPlaced(frame, draws, meshes, cameraPoint);

            float[] tap;
            while ((tap = taps.poll()) != null) handleTap(frame, tap[0], tap[1], draws, viewProjection, cameraPose);
            float[] drag;
            while ((drag = drags.poll()) != null) handleDrag(drag, draws, viewProjection, cameraPoint);

            Collections.sort(draws, (a, b) -> Float.compare(b.distance, a.distance));
            videoDraws = draws;
            videoMeshes = meshes;
            videoViewProjection = viewProjection;
            drawMeshes(viewProjection, meshes);
            gl.beginQuads();
            // The ✕ badges stay out of a photo being taken from this frame.
            boolean photo = captureWanted;
            for (Draw draw : draws) {
                if (photo && isDismiss(draw)) continue;
                gl.drawQuad(viewProjection, draw.model, gl.texture(draw.texture), draw.alpha);
            }
            gl.endQuads();

            postStatus(statusText(), hintText());
        }
    }

    // ---- Markers and rooms ----

    // ---- Content ----

    private boolean visible(ArScene.Item item) {
        return inLayers(item) && !bubblesHidden && !dismissed.contains(item.id);
    }

    private boolean inLayers(ArScene.Item item) {
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
                } else if (key.startsWith("seen:")) {
                    bitmap = ArCards.objectLabel(item);
                } else if (key.startsWith("here:")) {
                    bitmap = ArCards.hereMarker(item);
                } else if (key.startsWith("sky:")) {
                    bitmap = ArCards.skySign(item, decodeImage(item.image, 256));
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
        lastCameraPoint = cameraPoint.clone();
        long now = SystemClock.uptimeMillis();
        if (now - lastSpawnAttempt < 500) return;
        lastSpawnAttempt = now;
        if (freeStartedAt == 0) freeStartedAt = now;
        double facing = ArCompass.arHeading(forward);
        if (Double.isNaN(facing)) return;  // looking straight up or down
        // First of all, the "You are here" arrow, just ahead and below eye level.
        ArScene.Item here = hereItem();
        if (here != null && visible(here) && !discoverAnchors.containsKey(here.id)) {
            discoverAnchors.put(here.id, session.createAnchor(Pose.makeTranslation(
                cameraPoint[0] + (float) Math.sin(facing) * HERE_AHEAD_M, cameraPoint[1] - HERE_BELOW_EYE_M,
                cameraPoint[2] - (float) Math.cos(facing) * HERE_AHEAD_M)));
            discoverLift.put(here.id, 0f);
            return;
        }
        // Without a compass after a while, places are placed like the rest.
        boolean compassReady = compass.ready();
        boolean ignoreDirections = !compassReady && now - freeStartedAt > FREE_COMPASS_WAIT_MS;
        // The signs rise once the visitor looks out (not at the floor), so the rise is seen,
        // and only after the other bubbles: the nearby sites come last.
        if ((compassReady || ignoreDirections) && forward[1] > -0.6f && skyReady()) placeSkySigns(cameraPoint, facing, !compassReady, now);
        int waiting = 0;
        // Bubbles come in list order: one with a direction waits until those before it are up.
        boolean earlierWaiting = false;
        ArScene.Item ambient = null;
        ArScene.Item ahead = null;
        ArScene.Item spot = null;
        double aheadHeading = 0;
        double[] visitor = whereNow();
        for (ArScene.Item item : scene.items) {
            if (!visible(item)) continue;
            if (item.isHere() || item.isSky()) continue;
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
                if (!compassReady || ahead != null || earlierWaiting) continue;
                double heading = compass.arHeadingFor(item.bearing);
                if (Math.abs(angleBetween(heading, facing)) <= Math.toRadians(FREE_VIEW_DEG)) {
                    ahead = item;
                    aheadHeading = heading;
                }
            } else {
                if (!discovered.contains(item.id)) earlierWaiting = true;
                if (ambient == null || (discovered.contains(ambient.id) && !discovered.contains(item.id))) {
                    // New bubbles before found ones coming back after a tracking reset.
                    ambient = item;
                }
            }
        }
        if (spot != null) {
            placeAtSpot(spot, cameraPoint, facing);
            return;
        }
        ArScene.Item next;
        boolean directional = ahead != null && waiting <= FREE_WAITING_MAX;
        boolean walked = lastFreeSpawnFrom == null
            || Math.hypot(cameraPoint[0] - lastFreeSpawnFrom[0], cameraPoint[2] - lastFreeSpawnFrom[2]) > FREE_STEP_M;
        // Just after one is put away with its ✕, nothing new comes for a while (or until
        // the visitor walks on), so another doesn't pop up in its place.
        if (now - lastDismissAt < FREE_GAP_MS && !walked) return;
        if (directional) {
            next = ahead;
        } else {
            if (ambient == null || waiting >= FREE_WAITING_MAX) return;
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
            // The marker and the sky signs sit apart from the bubbles; they don't crowd them.
            if (skyHeading.containsKey(entry.getKey()) || (here != null && here.id.equals(entry.getKey()))) continue;
            float[] at = entry.getValue().getPose().getTranslation();
            taken.add(at);
            if (!discovered.contains(entry.getKey())) {
                waitingHeadings.add(ArCompass.arHeading(new float[] {at[0] - cameraPoint[0], 0f, at[2] - cameraPoint[2]}));
            }
        }
        // Nor where one was just put away: new ones come elsewhere.
        taken.addAll(dismissedSpots);
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

    /** The nearby sites' signs rise once this many other bubbles are open (scene.skyAfter). */
    private boolean skyReady() {
        if (scene.skyAfter <= 0) return true;
        int opened = 0;
        for (ArScene.Item item : scene.items) {
            // One put away with its ✕ counts as seen.
            if (!item.isHere() && !item.isSky() && (discovered.contains(item.id) || dismissed.contains(item.id))) opened++;
        }
        return opened >= scene.skyAfter;
    }

    private ArScene.Item hereItem() {
        for (ArScene.Item item : scene.items) if (item.isHere()) return item;
        return null;
    }

    /**
     * Every nearby site at once, high up in its real direction (or, without a compass,
     * spread across the view): each rises in turn, and signs that lie the same way stack.
     */
    private void placeSkySigns(float[] cameraPoint, double facing, boolean noCompass, long now) {
        List<ArScene.Item> waiting = new ArrayList<>();
        for (ArScene.Item item : scene.items) {
            if (item.isSky() && visible(item) && !discoverAnchors.containsKey(item.id)) waiting.add(item);
        }
        for (int index = 0; index < waiting.size(); index++) {
            ArScene.Item item = waiting.get(index);
            double heading = noCompass
                ? facing + Math.toRadians(waiting.size() == 1 ? 0 : -40 + 80.0 * index / (waiting.size() - 1))
                : compass.arHeadingFor(item.bearing);
            int tier = 0;
            while (tier < 4 && skyTierTaken(heading, tier)) tier++;
            float[] point = {
                cameraPoint[0] + (float) Math.sin(heading) * SKY_DISTANCE_M,
                cameraPoint[1] + SKY_HEIGHT_M + tier * SKY_STACK_M,
                cameraPoint[2] - (float) Math.cos(heading) * SKY_DISTANCE_M};
            discoverAnchors.put(item.id, session.createAnchor(Pose.makeTranslation(point[0], point[1], point[2])));
            discoverLift.put(item.id, 0f);
            skyShownAt.put(item.id, now + index * SKY_STAGGER_MS);
            skyFrom.put(item.id, cameraPoint.clone());
            skyHeading.put(item.id, heading);
            skyTier.put(item.id, tier);
        }
    }

    private boolean skyTierTaken(double heading, int tier) {
        for (Map.Entry<String, Double> other : skyHeading.entrySet()) {
            Integer otherTier = skyTier.get(other.getKey());
            if (otherTier != null && otherTier == tier
                && Math.abs(Math.toDegrees(angleBetween(heading, other.getValue()))) < SKY_APART_DEG) return true;
        }
        return false;
    }

    /**
     * The marker bounces gently over the visitor's spot; a sky sign rises and fades in
     * from the horizon, then drifts. Both keep their look once opened (the card opens below).
     */
    private void addMarker(List<Draw> draws, ArScene.Item item, float[] point, Pose cameraPose, float[] cameraPoint, long now, List<String> stopped) {
        float alpha = 1f;
        if (item.isSky()) {
            float[] from = skyFrom.get(item.id);
            if (from != null && Math.hypot(cameraPoint[0] - from[0], cameraPoint[2] - from[2]) > SKY_REPLACE_M) {
                stopped.add(item.id);
                return;
            }
            Long shownAt = skyShownAt.get(item.id);
            if (shownAt == null || now < shownAt) return;
            float t = Math.min(1f, (now - shownAt) / (float) SKY_RISE_MS);
            float ease = 1f - (1f - t) * (1f - t) * (1f - t);
            point[1] += -(1f - ease) * SKY_RISE_FROM_M + 0.06f * (float) Math.sin(now / 1600.0 + (item.id.hashCode() & 0xff));
            alpha = ease;
        } else {
            if (Math.hypot(point[0] - cameraPoint[0], point[2] - cameraPoint[2]) > FREE_LEFT_BEHIND_M) {
                stopped.add(item.id);
                return;
            }
            // The landmark floats gently; a bounce would make its ground ring hop.
            point[1] += 0.015f * (float) Math.sin(now / 900.0);
        }
        String key = (item.isHere() ? "here:" : "sky:") + item.id;
        ensureTexture(item, key);
        float aspect = gl.aspect(key);
        if (aspect <= 0f) return;
        float width = item.isHere() ? HERE_WIDTH_M : SKY_WIDTH_M;
        draws.add(Draw.billboard(item.id, point, cameraPose, key, width, width * aspect, alpha, distance(point, cameraPoint)));
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
        boolean earlierWaiting = false;
        for (ArScene.Item item : scene.items) {
            if (!visible(item) || item.isHere()) continue;
            if (Double.isNaN(item.bearing)) {
                if (!discoverAnchors.containsKey(item.id) && !discovered.contains(item.id)) earlierWaiting = true;
                continue;
            }
            // As the bubbles come: places in list order, the nearby sites' signs last.
            if (item.isSky() ? !skyReady() : earlierWaiting && !item.hasSpot() && !discoverAnchors.containsKey(item.id)) continue;
            double turn = Math.toDegrees(angleBetween(Math.toRadians(item.bearing), Math.toRadians(facing)));
            // A sky sign is already up there: point to it only while it is out of view.
            if (discoverAnchors.containsKey(item.id) && !(item.isSky() && Math.abs(turn) > FREE_VIEW_DEG)) continue;
            String arrow = Math.abs(turn) <= FREE_VIEW_DEG ? "↑" : Math.abs(turn) > 135 ? "↓" : turn > 0 ? "→" : "←";
            String name = !item.name.isEmpty() ? item.name : item.title.replaceFirst("^(Nearby|Meet): ", "").replaceFirst("^Meet ", "");
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
            float[] nudge = discoverNudge.get(item.id);
            float[] point = {base.tx(), base.ty() + discoverLift.get(item.id) + bob, base.tz()};
            if (nudge != null) {
                for (int i = 0; i < 3; i++) point[i] += nudge[i];
            }
            float distance = distance(point, cameraPoint);
            // Held by the visitor (a bubble, a card, the "You are here" pin or a
            // sign): along the line from the camera to the distance the drag asks for.
            if (item.id.equals(dragId) && !Float.isNaN(dragTo) && nudge != null && distance > 0.01f) {
                float stretch = dragTo / distance - 1f;
                for (int i = 0; i < 3; i++) {
                    float step = (point[i] - cameraPoint[i]) * stretch;
                    nudge[i] += step;
                    point[i] += step;
                }
                distance = dragTo;
            }
            int drawn = draws.size();
            if (item.isHere() && discovered.contains(item.id)) {
                // Walked up to (or tapped), the pin opens into the land's card, like every bubble.
                addCard(draws, item, point, cameraPoint, 0.5f);
                addCardDismiss(draws, drawn, 0.5f, distance);
                continue;
            }
            if (item.isHere() || item.isSky()) {
                addMarker(draws, item, point, cameraPose, cameraPoint, now, stopped);
                // A sign is a window and has its ✕; the pin's orb gets one once it opens into its card.
                if (item.isSky()) addCardDismiss(draws, drawn, SKY_WIDTH_M, distance);
                // Moved by hand, it opens with a tap, like a bubble.
                if (item.isHere() && nudge == null && distance < DISCOVER_DISTANCE && discovered.add(item.id)) {
                    runOnUiThread(() -> onDiscovered(item));
                }
                continue;
            }
            // An unopened bubble left behind in another room makes way for new ones.
            if (!discovered.contains(item.id) && !item.hasSpot()
                && Math.hypot(point[0] - cameraPoint[0], point[2] - cameraPoint[2]) > FREE_LEFT_BEHIND_M) {
                stopped.add(item.id);
                continue;
            }
            if (!discovered.contains(item.id) && nudge == null && distance < DISCOVER_DISTANCE) {
                discovered.add(item.id);
                runOnUiThread(() -> onDiscovered(item));
            }
            if (discovered.contains(item.id)) {
                addCard(draws, item, point, cameraPoint, 0.5f);
                addCardDismiss(draws, drawn, 0.5f, distance);
            } else {
                String key = "bubble:" + item.id;
                ensureTexture(item, key);
                if (gl.aspect(key) <= 0f) key = "orb:" + item.layer;
                float pulse = 0.85f + 0.15f * (float) Math.sin(now / 300.0);
                // A find over a spot across the yard stays big enough to see.
                float size = item.hasSpot() ? Math.max(0.26f, distance * 0.05f) : 0.26f;
                // No ✕ on an orb (a reach for it too easily put it away); its card has one once opened.
                draws.add(Draw.billboard(item.id, point, cameraPose, key, size, size, pulse, distance));
            }
        }
        for (String id : stopped) {
            android.util.Log.i("OnThisSiteAR", "Let go of " + id + (discoverLostSince.containsKey(id) ? " (lost with tracking)" : " (stopped or left behind)"));
            letGo(id);
        }
    }

    /** Forgets a bubble's anchor and how it was placed, so it can be placed again (or not, once dismissed). */
    private void letGo(String id) {
        discoverLostSince.remove(id);
        Anchor anchor = discoverAnchors.remove(id);
        if (anchor != null) anchor.detach();
        discoverLift.remove(id);
        discoverNudge.remove(id);
        skyShownAt.remove(id);
        skyFrom.remove(id);
        skyHeading.remove(id);
        skyTier.remove(id);
    }

    /** The ✕ badge's width (metres): easy to see from afar, within a share of what it sits on. */
    private static float dismissSize(float width, float least, float most, float distance) {
        return Math.max(least * width, Math.min(most * width, 0.035f * distance));
    }

    /** The ✕ in a card's or sign's top-right corner, a little in from the edge. */
    private void addCardDismiss(List<Draw> draws, int drawn, float width, float distance) {
        if (draws.size() <= drawn) return;
        float height = width * gl.aspect(draws.get(drawn).texture);
        float badge = dismissSize(width, 0.12f, 0.2f, distance);
        float inset = 0.3f * badge;
        addDismiss(draws, drawn, width, height, width / 2f - inset, height / 2f - inset, badge);
    }

    /**
     * A ✕ badge over the item drawn at draws[drawn] (width by height metres),
     * centred x, y metres from its middle (up and right). Tapping it puts the
     * item away; its quad is larger than the badge, so it is easy to hit.
     */
    private void addDismiss(List<Draw> draws, int drawn, float width, float height, float x, float y, float badge) {
        if (draws.size() <= drawn || height <= 0f || !gl.hasTexture("ui:dismiss")) return;
        Draw target = draws.get(drawn);
        float[] model = target.model.clone();
        Matrix.translateM(model, 0, x / width, y / height, 0f);
        float quad = badge / ArCards.BADGE_SHARE;
        Matrix.scaleM(model, 0, quad / width, quad / height, 1f);
        // Steady while a bubble pulses; fades in with a rising sign.
        draws.add(Draw.of(DISMISS + target.itemId, model, "ui:dismiss", target.alpha < 0.7f ? target.alpha : 1f, target.distance - 0.002f));
    }

    private static boolean isDismiss(Draw draw) {
        return draw.itemId != null && draw.itemId.startsWith(DISMISS);
    }

    /** Puts a bubble, card, pin or sign away for the rest of this visit. */
    private void dismiss(String id) {
        dismissed.add(id);
        Anchor anchor = discoverAnchors.get(id);
        ArScene.Item here = hereItem();
        if (anchor != null && !skyHeading.containsKey(id) && (here == null || !here.id.equals(id))) {
            // Its spot stays taken, and the next bubble waits as if this one had just appeared.
            dismissedSpots.add(anchor.getPose().getTranslation());
            if (dismissedSpots.size() > DISMISSED_SPOTS_MAX) dismissedSpots.remove(0);
            lastDismissAt = SystemClock.uptimeMillis();
            lastFreeSpawnAt = lastDismissAt;
            if (lastCameraPoint != null) lastFreeSpawnFrom = lastCameraPoint.clone();
        }
        letGo(id);
        seenThings.removeIf(seen -> {
            if (!seen.item.id.equals(id)) return false;
            seen.anchor.detach();
            return true;
        });
        if (id.equals(dragId)) dragId = null;
        android.util.Log.i("OnThisSiteAR", "Dismissed " + id);
        runOnUiThread(() -> {
            vibrateConfirm();
            if (id.equals(shownItemId)) infoPanel.setVisibility(View.GONE);
        });
    }

    // ---- Things the camera recognizes ----

    // As soon as the last look is done, at most once a second.
    private static final long LOOK_EVERY_MS = 1000;

    /** A thing the camera recognized, labeled where the middle of the view met it. */
    private static final class SeenThing {
        final ArObjects.Thing thing;
        final float[] point;
        Anchor anchor;
        ArScene.Item item;
        // Pinched: how much bigger than 30 cm, and turned how far (radians).
        float scale = 1f;
        float roll;
        // While dragged: where the finger holds it (anchored there when let go).
        float[] heldAt;

        float[] where() {
            return heldAt != null ? heldAt : anchor.getPose().getTranslation();
        }

        SeenThing(ArObjects.Thing thing, float[] point) {
            this.thing = thing;
            this.point = point;
        }
    }

    /**
     * Every few seconds while the phone is held still, the middle of the view is
     * described on the phone; a door there gets its Mohegan and Natick names,
     * floating on it where the middle of the view met its surface.
     */
    private void lookForThings(Frame frame, Pose cameraPose) {
        SeenThing found;
        while ((found = seenPending.poll()) != null) addSeenThing(found);
        if (objects == null || !objects.ready() || bubblesHidden || placingAsset != null || video != null) return;
        if (infoPanel.getVisibility() == View.VISIBLE) return;
        long now = SystemClock.uptimeMillis();
        // Held, not swung: under 15 cm and about 12 degrees of movement in the last half
        // second (a quick turn blurs the picture), so an ordinary hand-held aim counts.
        if (now - lastSteadyAt >= 500) {
            float[] from = cameraPose.getTranslation();
            float[] facing = cameraPose.getZAxis();
            steadyNow = lastSteadyFrom != null && distance(from, lastSteadyFrom) < 0.15f
                && facing[0] * lastSteadyFacing[0] + facing[1] * lastSteadyFacing[1] + facing[2] * lastSteadyFacing[2] > 0.978f;
            lastSteadyFrom = from;
            lastSteadyFacing = facing;
            lastSteadyAt = now;
        }
        if (!steadyNow || now - lastLookAt < LOOK_EVERY_MS) return;
        lastLookAt = now;
        float[] point = surfaceAtCenter(frame, cameraPose);
        byte[] nv21;
        int width;
        int height;
        try (android.media.Image image = frame.acquireCameraImage()) {
            nv21 = ArObjects.nv21(image);
            width = image.getWidth();
            height = image.getHeight();
        } catch (Exception error) {
            return;
        }
        objects.describeCenter(nv21, width, height, cameraImageRotation(), (description, thing) -> {
            if (thing != null) seenPending.add(new SeenThing(thing, point));
        });
    }

    /** Where the middle of the view meets a surface (or 1.5 m ahead in the air), a little toward the visitor. */
    private float[] surfaceAtCenter(Frame frame, Pose cameraPose) {
        float[] eye = cameraPose.getTranslation();
        float[] at = null;
        for (HitResult hit : frame.hitTest(viewportWidth / 2f, viewportHeight / 2f)) {
            Trackable trackable = hit.getTrackable();
            if ((trackable instanceof Plane && ((Plane) trackable).isPoseInPolygon(hit.getHitPose()))
                || trackable instanceof DepthPoint || trackable instanceof Point) {
                at = hit.getHitPose().getTranslation();
                break;
            }
        }
        if (at == null) at = cameraPose.compose(Pose.makeTranslation(0f, 0f, -1.5f)).getTranslation();
        // 8 cm out from the door, so its name floats on it rather than sinking in.
        float length = Math.max(0.01f, distance(at, eye));
        for (int i = 0; i < 3; i++) at[i] += (eye[i] - at[i]) / length * Math.min(0.08f, length * 0.5f);
        return at;
    }

    /** Degrees to turn the camera's own image upright on this (portrait) screen. */
    private int cameraImageRotation() {
        if (cameraImageRotation >= 0) return cameraImageRotation;
        int sensor = 90;
        try {
            android.hardware.camera2.CameraManager manager = (android.hardware.camera2.CameraManager) getSystemService(CAMERA_SERVICE);
            Integer orientation = manager.getCameraCharacteristics(session.getCameraConfig().getCameraId())
                .get(android.hardware.camera2.CameraCharacteristics.SENSOR_ORIENTATION);
            if (orientation != null) sensor = orientation;
        } catch (Exception ignored) {
            // The usual back camera: 90 degrees.
        }
        int display = 0;
        switch (getWindowManager().getDefaultDisplay().getRotation()) {
            case android.view.Surface.ROTATION_90: display = 90; break;
            case android.view.Surface.ROTATION_180: display = 180; break;
            case android.view.Surface.ROTATION_270: display = 270; break;
            default: break;
        }
        cameraImageRotation = (sensor - display + 360) % 360;
        return cameraImageRotation;
    }

    /** A recognized thing becomes a label, unless the same thing already has one within 1.2 m. */
    private void addSeenThing(SeenThing found) {
        if (session == null) return;
        for (SeenThing other : seenThings) {
            if (other.thing == found.thing && distance(other.anchor.getPose().getTranslation(), found.point) < 1.2f) return;
        }
        // At most ten at once: the oldest makes way.
        if (seenThings.size() >= 10) seenThings.remove(0).anchor.detach();
        found.anchor = session.createAnchor(Pose.makeTranslation(found.point[0], found.point[1], found.point[2]));
        found.item = thingItem(found.thing, ++seenCount);
        seenThings.add(found);
        android.util.Log.i("OnThisSiteAR", "Labeled a " + found.thing.key + " as " + found.thing.headline());
        runOnUiThread(() -> {
            vibrateConfirm();
            showFound("✨ " + found.thing.english.substring(0, 1).toUpperCase(Locale.US) + found.thing.english.substring(1) + ": " + found.thing.headline());
        });
    }

    /**
     * A recognized thing's card: it floats as a small label (its name over its
     * words) and opens into its words with their languages, then what the
     * Knowledgebase teaches about those languages and how to learn them.
     */
    private static ArScene.Item thingItem(ArObjects.Thing thing, int number) {
        ArScene.Item item = new ArScene.Item();
        item.id = "seen-" + thing.key + "-" + number;
        item.kind = ArScene.KIND_PHRASE;
        item.layer = ArScene.LAYER_LANGUAGE;
        item.title = thing.title();
        item.brief = thing.headline();
        item.word = thing.wordsLine();
        item.more = thing.notes() + "\n\nYour phone recognized this itself: what the camera sees is never sent anywhere.";
        item.credit = thing.sources();
        return item;
    }

    private void collectSeenThings(List<Draw> draws, float[] cameraPoint) {
        if (bubblesHidden) return;
        seenThings.removeIf(seen -> {
            if (seen.anchor.getTrackingState() != TrackingState.STOPPED) return false;
            seen.anchor.detach();
            return true;
        });
        for (SeenThing seen : seenThings) {
            if (dismissed.contains(seen.item.id) || seen.anchor.getTrackingState() != TrackingState.TRACKING) continue;
            float[] point = seen.where();
            String key = "seen:" + seen.item.id;
            ensureTexture(seen.item, key);
            float aspect = gl.aspect(key);
            if (aspect <= 0f) continue;
            // A small label on the thing (30 cm across, or as pinched), facing the visitor.
            float yaw = ArPlacement.yawTowards(point[0], point[2], cameraPoint[0], cameraPoint[2]);
            Pose pose = new Pose(point, ArPlacement.yawQuaternion(yaw));
            if (seen.roll != 0f) pose = pose.compose(Pose.makeRotation(0f, 0f, (float) Math.sin(seen.roll / 2), (float) Math.cos(seen.roll / 2)));
            float width = 0.3f * seen.scale;
            int drawn = draws.size();
            draws.add(Draw.posed(seen.item.id, pose, key, width, width * aspect, 0.97f, distance(point, cameraPoint)));
            addCardDismiss(draws, drawn, width, distance(point, cameraPoint));
        }
    }

    /** QA builds: files/qa-ar-identify.jpg (a photo of a door) is described once, and the result logged. */
    private void identifyQaPhoto() {
        java.io.File photo = new java.io.File(getFilesDir(), "qa-ar-identify.jpg");
        if (!BuildConfig.DEBUG || objects == null || !photo.exists()) return;
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            if (objects == null) return;
            Bitmap picture = BitmapFactory.decodeFile(photo.getAbsolutePath());
            android.util.Log.i("OnThisSiteAR", "Identify QA: available=" + objects.available() + " ready=" + objects.ready());
            objects.describe(picture, (description, thing) ->
                android.util.Log.i("OnThisSiteAR", "Identify QA: \"" + description + "\" -> " + (thing != null ? thing.key + " " + thing.headline() : "nothing known")));
        }, 4000);
    }

    // ---- Place ----

    /** Seconds the flag has been waving (wrapped so the shader keeps its precision). */
    private float placeSeconds() {
        return (SystemClock.uptimeMillis() - placeClock) / 1000f % 600f;
    }

    /** A surface under a screen point, and how the chosen sticker or flag would sit there. */
    private static final class Aim {
        final Pose pose;
        final Trackable trackable;

        Aim(Pose pose, Trackable trackable) {
            this.pose = pose;
            this.trackable = trackable;
        }
    }

    /**
     * Where the asset would go if placed now: a detected wall, floor or table, or
     * any surface the depth sensor sees there; null when none is under the point.
     * The flag only stands on something facing up.
     */
    private Aim aim(Frame frame, float x, float y, ArPlace.Asset asset, float[] cameraPoint) {
        for (HitResult hit : frame.hitTest(x, y)) {
            Trackable trackable = hit.getTrackable();
            Pose hitPose = hit.getHitPose();
            boolean surface = trackable instanceof Plane
                ? ((Plane) trackable).isPoseInPolygon(hitPose) && ((Plane) trackable).getSubsumedBy() == null
                : trackable instanceof DepthPoint
                    || trackable instanceof Point && ((Point) trackable).getOrientationMode() == Point.OrientationMode.ESTIMATED_SURFACE_NORMAL;
            if (!surface) continue;
            float[] normal = hitPose.getYAxis();
            if (asset.model && normal[1] < 0.8f) continue;
            float[] point = hitPose.getTranslation();
            return new Aim(new Pose(point, ArPlacement.placedRotation(normal, point, cameraPoint, asset.model)), trackable);
        }
        return null;
    }

    /**
     * Places the asset chosen in the drawer where the centre of the view meets a
     * surface (or under the tap). With no surface found yet it is held in space
     * ahead: a sticker at arm's length facing the visitor, the flag a few steps
     * away at about floor height.
     */
    private void placeChosen(Frame frame, float x, float y, Pose cameraPose) {
        ArPlace.Asset asset = placingAsset;
        float[] cameraPoint = cameraPose.getTranslation();
        Aim aim = aim(frame, viewportWidth / 2f, viewportHeight / 2f, asset, cameraPoint);
        if (aim == null) aim = aim(frame, x, y, asset, cameraPoint);
        Anchor anchor;
        try {
            if (aim != null) {
                anchor = aim.trackable.createAnchor(aim.pose);
            } else {
                float[] back = cameraPose.getZAxis();
                float length = (float) Math.hypot(back[0], back[2]);
                float[] forward = length < 1e-3f ? new float[] {0f, 0f, -1f} : new float[] {-back[0] / length, 0f, -back[2] / length};
                float ahead = asset.model ? 2.5f : 1.2f;
                float[] point = {cameraPoint[0] + forward[0] * ahead, cameraPoint[1] - (asset.model ? 1.4f : 0f), cameraPoint[2] + forward[2] * ahead};
                float[] normal = asset.model ? new float[] {0f, 1f, 0f} : new float[] {-forward[0], 0f, -forward[2]};
                anchor = session.createAnchor(new Pose(point, ArPlacement.placedRotation(normal, point, cameraPoint, asset.model)));
                toast(asset.model ? "No ground found yet, so the flag stands a few steps ahead. Aim at the ground to plant it there."
                    : "No wall found yet, so it hangs in the air ahead of you.");
            }
        } catch (RuntimeException error) {
            android.util.Log.w("OnThisSiteAR", "Couldn't place " + asset.id + ": " + error);
            toast("Couldn't place it here. Move the phone slowly and try again.");
            return;
        }
        if (placed.size() >= PLACED_MAX) placed.get(0).removed = true;
        ArPlace.Placed thing = new ArPlace.Placed(asset, anchor);
        placed.add(thing);
        selectedPlace = thing;
        placingAsset = null;
        runOnUiThread(() -> {
            vibrateConfirm();
            showPlaceTools();
        });
    }

    private ArPlace.Placed placedById(String id) {
        if (id == null) return null;
        for (ArPlace.Placed thing : placed) if (thing.id.equals(id)) return thing;
        return null;
    }

    /** Placed stickers and flags, and while aiming, where the chosen one would go. */
    private void collectPlaced(Frame frame, List<Draw> draws, List<MeshDraw> meshes, float[] cameraPoint) {
        for (java.util.Iterator<ArPlace.Placed> it = placed.iterator(); it.hasNext(); ) {
            ArPlace.Placed thing = it.next();
            if (thing.removed) {
                thing.anchor.detach();
                it.remove();
                continue;
            }
            if (thing.anchor.getTrackingState() != TrackingState.TRACKING) continue;
            Pose pose = thing.anchor.getPose();
            float[] base = new float[16];
            pose.toMatrix(base, 0);
            Matrix.rotateM(base, 0, (float) Math.toDegrees(thing.turn), 0f, 1f, 0f);
            addPlacedDraws(thing.id, thing.asset, base, thing.scale, distance(pose.getTranslation(), cameraPoint), 1f,
                thing == selectedPlace, cameraPoint, draws, meshes);
        }
        if (placingAsset == null) return;
        Aim aim = aim(frame, viewportWidth / 2f, viewportHeight / 2f, placingAsset, cameraPoint);
        aimFound = aim != null;
        if (aim == null) return;
        float[] base = new float[16];
        aim.pose.toMatrix(base, 0);
        // A see-through preview of the sticker (or the flag with a ring at its foot).
        addPlacedDraws(null, placingAsset, base, 1f, distance(aim.pose.getTranslation(), cameraPoint), 0.6f, true, cameraPoint, draws, meshes);
    }

    /**
     * One placed thing's draws: a sticker is a quad lying on its surface (the
     * anchor's +Y is the normal, so the quad's +Z is turned onto it); the flag is
     * its pole, the ball on top and the waving cloth, with an invisible box round
     * them for taps. id null draws a preview that can't be tapped.
     */
    private void addPlacedDraws(String id, ArPlace.Asset asset, float[] base, float scale, float distance, float alpha,
                                boolean selected, float[] cameraPoint, List<Draw> draws, List<MeshDraw> meshes) {
        placeArtwork(asset);
        if (asset.model) {
            float[] pole = base.clone();
            Matrix.scaleM(pole, 0, scale, scale, scale);
            int first = meshes.size();
            meshes.add(MeshDraw.solid(POLE, pole.clone(), ArPlace.poleColor(asset)));
            float[] finial = pole.clone();
            Matrix.translateM(finial, 0, 0f, ArPlace.POLE_HEIGHT + ArPlace.FINIAL_RADIUS * 0.6f, 0f);
            meshes.add(MeshDraw.solid(FINIAL, finial, new float[] {0.84f, 0.67f, 0.26f, 1f}));
            // The cloth shows once its colour's artwork is ready (a moment after it is first chosen).
            if (gl.hasTexture(asset.texture())) {
                float[] cloth = pole.clone();
                Matrix.translateM(cloth, 0, ArPlace.POLE_RADIUS, ArPlace.POLE_HEIGHT - ArPlace.FLAG_TOP_GAP - ArPlace.FLAG_HEIGHT, 0f);
                Matrix.scaleM(cloth, 0, ArPlace.FLAG_WIDTH, ArPlace.FLAG_HEIGHT, 1f);
                meshes.add(MeshDraw.cloth(CLOTH, cloth, asset.texture(), ArPlace.FLAG_WAVE * scale));
            }
            float[] foot = {pole[12], pole[13], pole[14]};
            for (int index = first; index < meshes.size(); index++) {
                meshes.get(index).shadowFoot = foot;
                meshes.get(index).shadowFade = 3.5f * scale;
            }
            addFootShadow(foot, scale, distance, draws);
            if (id != null) {
                // The tap box turns to face the visitor, so the flag can be tapped from any side.
                float[] middle = new float[4];
                Matrix.multiplyMV(middle, 0, pole, 0, new float[] {ArPlace.FLAG_WIDTH / 2f, ArPlace.POLE_HEIGHT / 2f, 0f, 1f}, 0);
                float[] point = {middle[0], middle[1], middle[2]};
                float yaw = ArPlacement.yawTowards(point[0], point[2], cameraPoint[0], cameraPoint[2]);
                draws.add(Draw.posed(id, new Pose(point, ArPlacement.yawQuaternion(yaw)), null,
                    (ArPlace.FLAG_WIDTH * 2f + 0.3f) * scale, (ArPlace.POLE_HEIGHT + 0.1f) * scale, 0f, distance));
            }
            if (selected) {
                float[] ring = pole.clone();
                Matrix.rotateM(ring, 0, -90f, 1f, 0f, 0f);
                Matrix.translateM(ring, 0, 0f, 0f, 0.005f);
                Matrix.scaleM(ring, 0, 0.6f, 0.6f, 1f);
                draws.add(Draw.of(null, ring, "place:ring", 0.9f, distance + 0.01f));
            }
            return;
        }
        String key = asset.texture();
        float aspect = gl.aspect(key);
        if (aspect <= 0f) return;
        float width = asset.width * scale;
        float[] model = base.clone();
        Matrix.rotateM(model, 0, -90f, 1f, 0f, 0f);
        // A few millimetres off the surface, so it doesn't flicker into it.
        Matrix.translateM(model, 0, 0f, 0f, 0.004f);
        if (selected && id != null) {
            float[] edge = model.clone();
            Matrix.scaleM(edge, 0, width * 1.08f, width * aspect + width * 0.08f, 1f);
            draws.add(Draw.of(null, edge, "place:outline", 1f, distance + 0.001f));
        }
        Matrix.scaleM(model, 0, width, width * aspect, 1f);
        draws.add(Draw.of(id, model, key, alpha, distance));
    }

    /** Draws a sticker's or flag's artwork the first time it is needed, off the GL thread. */
    private void placeArtwork(ArPlace.Asset asset) {
        String key = asset.texture();
        if (gl.hasTexture(key) || !loading.add(key)) return;
        loader.execute(() -> {
            try {
                gl.queueTexture(key, ArPlace.artwork(asset, getResources()));
            } catch (RuntimeException error) {
                android.util.Log.w("OnThisSiteAR", "Artwork " + key + " failed: " + error);
            }
        });
    }

    /**
     * A small soft dark patch where the pole meets the ground, so it looks
     * planted. The pole and flag cast their own shadow (drawMeshes).
     */
    private void addFootShadow(float[] foot, float scale, float distance, List<Draw> draws) {
        float[] patch = new float[16];
        Matrix.setIdentityM(patch, 0);
        Matrix.translateM(patch, 0, foot[0], foot[1] + 0.002f, foot[2]);
        Matrix.rotateM(patch, 0, -90f, 1f, 0f, 0f);
        Matrix.scaleM(patch, 0, 0.16f * scale, 0.16f * scale, 1f);
        draws.add(Draw.of(null, patch, "place:shadow", 0.75f, distance + 0.02f));
    }

    /**
     * The placed 3D things: first their shadows, flattened onto the ground along
     * the same light they are shaded with (so a flag's shadow is its pole and
     * its cloth, moving with the wind), then the things themselves.
     */
    private void drawMeshes(float[] viewProjection, List<MeshDraw> meshes) {
        float time = placeSeconds();
        gl.beginMeshes();
        for (MeshDraw mesh : meshes) {
            if (mesh.shadowFoot != null) gl.drawShadow(viewProjection, mesh.model, mesh.mesh, mesh.wave, time, mesh.shadowFoot, mesh.shadowFade, 0.42f);
        }
        for (MeshDraw mesh : meshes) gl.drawMesh(viewProjection, mesh.model, mesh.mesh, gl.texture(mesh.texture), mesh.color, mesh.wave, time);
        gl.endMeshes();
    }

    /** QA builds: places what files/qa-ar-place names, once tracking starts, for a screenshot. */
    private void placeQaAssets(Frame frame, Pose cameraPose) {
        if (qaPlace.isEmpty() || session == null) return;
        placingAsset = qaPlace.remove(0);
        placeChosen(frame, viewportWidth / 2f, viewportHeight / 2f, cameraPose);
    }

    // ---- Taps ----

    /** The nearest bubble or card under a point on the screen, or null. */
    private Draw pick(float x, float y, List<Draw> draws, float[] viewProjection) {
        Draw picked = null;
        for (Draw draw : draws) {
            if (draw.itemId == null || !draw.contains(x, y, viewProjection, viewportWidth, viewportHeight)) continue;
            if (picked == null || draw.distance < picked.distance) picked = draw;
        }
        return picked;
    }

    private void handleTap(Frame frame, float x, float y, List<Draw> draws, float[] viewProjection, Pose cameraPose) {
        if (placingAsset != null) {
            placeChosen(frame, x, y, cameraPose);
            return;
        }
        Draw picked = pick(x, y, draws, viewProjection);
        if (picked != null && picked.itemId.startsWith(DISMISS)) {
            dismiss(picked.itemId.substring(DISMISS.length()));
            return;
        }
        ArPlace.Placed thing = picked == null ? null : placedById(picked.itemId);
        if (thing != null || selectedPlace != null) {
            // A placed sticker or flag is chosen to resize, turn or remove; a tap elsewhere lets it go.
            selectedPlace = thing;
            runOnUiThread(this::showPlaceTools);
            if (thing != null) {
                runOnUiThread(() -> infoPanel.setVisibility(View.GONE));
                return;
            }
        }
        if (picked == null) {
            runOnUiThread(() -> infoPanel.setVisibility(View.GONE));
            return;
        }
        for (SeenThing seen : seenThings) {
            if (seen.item.id.equals(picked.itemId)) {
                runOnUiThread(() -> showItem(seen.item));
                return;
            }
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

    /**
     * A press on a bubble or card dragged down brings it closer; up pushes it
     * away. A recognized thing's label follows the finger across the view
     * instead, and two fingers on it size and turn it.
     */
    private void handleDrag(float[] drag, List<Draw> draws, float[] viewProjection, float[] cameraPoint) {
        if (drag[0] == PINCH_START) {
            pinchSeen = seenAt(drag[1], drag[2], draws, viewProjection);
            if (pinchSeen == null) pinchSeen = seenAt(drag[5], drag[6], draws, viewProjection);
            if (pinchSeen == null) pinchSeen = seenAt(drag[7], drag[8], draws, viewProjection);
            if (pinchSeen == null) return;
            pinchFromSpacing = Math.max(1f, drag[3]);
            pinchFromAngle = drag[4];
            pinchFromScale = pinchSeen.scale;
            pinchFromRoll = pinchSeen.roll;
            seenGestured = true;
        } else if (drag[0] == PINCH_MOVE) {
            if (pinchSeen == null) return;
            pinchSeen.scale = Math.max(0.4f, Math.min(4f, pinchFromScale * drag[1] / pinchFromSpacing));
            // Screen angles run clockwise; the label turns the same way as the fingers.
            pinchSeen.roll = pinchFromRoll - (drag[2] - pinchFromAngle);
        } else if (drag[0] == PINCH_END) {
            pinchSeen = null;
        } else if (drag[0] == DRAG_START) {
            movingSeen = seenAt(drag[1], drag[2], draws, viewProjection);
            if (movingSeen != null) {
                movingDistance = distance(movingSeen.where(), cameraPoint);
                dragId = null;
                seenGestured = true;
                return;
            }
            // Sideways drags move only a recognized thing's label.
            if (drag[4] < 0.5f) {
                dragId = null;
                return;
            }
            Draw picked = pick(drag[1], drag[2], draws, viewProjection);
            // Pressing on a ✕ and dragging moves what it sits on.
            String id = picked == null ? null : picked.itemId.startsWith(DISMISS) ? picked.itemId.substring(DISMISS.length()) : picked.itemId;
            dragId = id == null || !discoverAnchors.containsKey(id) ? null : id;
            dragFromY = drag[3];
            dragFromDistance = picked == null ? 0f : picked.distance;
            dragTo = Float.NaN;
            if (dragId == null) return;
            if (!discoverNudge.containsKey(dragId)) discoverNudge.put(dragId, new float[3]);
            draggedOnce = true;
        } else if (drag[0] == DRAG_MOVE) {
            if (movingSeen != null) {
                float[] held = pointUnder(drag[1], drag[2], viewProjection, cameraPoint, movingDistance);
                if (held != null) movingSeen.heldAt = held;
                return;
            }
            if (dragId == null) return;
            float nearest = discovered.contains(dragId) ? DRAG_NEAREST_CARD_M : DRAG_NEAREST_BUBBLE_M;
            // A find over a spot farther than this can still be pushed back to it.
            float farthest = Math.max(DRAG_FARTHEST_M, dragFromDistance);
            float want = dragFromDistance * (float) Math.pow(2, (dragFromY - drag[2]) / (viewportHeight / 3f));
            dragTo = Math.max(nearest, Math.min(farthest, want));
        } else if (drag[0] == DRAG_END) {
            if (movingSeen != null && movingSeen.heldAt != null && session != null && seenThings.contains(movingSeen)) {
                // Anchored again where it was let go.
                float[] held = movingSeen.heldAt;
                movingSeen.anchor.detach();
                movingSeen.anchor = session.createAnchor(Pose.makeTranslation(held[0], held[1], held[2]));
            }
            if (movingSeen != null) movingSeen.heldAt = null;
            movingSeen = null;
            dragId = null;
        }
    }

    /** How far apart the first two fingers are (pixels). */
    static float fingerSpacing(MotionEvent event) {
        return (float) Math.hypot(event.getX(1) - event.getX(0), event.getY(1) - event.getY(0));
    }

    /** The line between the first two fingers, as a screen angle (radians, clockwise). */
    static float fingerAngle(MotionEvent event) {
        return (float) Math.atan2(event.getY(1) - event.getY(0), event.getX(1) - event.getX(0));
    }

    /** The recognized thing whose label (or its ✕) is under a point on the screen, or null. */
    private SeenThing seenAt(float x, float y, List<Draw> draws, float[] viewProjection) {
        Draw picked = pick(x, y, draws, viewProjection);
        if (picked == null) return null;
        String id = picked.itemId.startsWith(DISMISS) ? picked.itemId.substring(DISMISS.length()) : picked.itemId;
        for (SeenThing seen : seenThings) if (seen.item.id.equals(id)) return seen;
        return null;
    }

    /** The point this far from the camera along the line through a point on the screen. */
    private float[] pointUnder(float x, float y, float[] viewProjection, float[] cameraPoint, float far) {
        float[] inverse = new float[16];
        if (!Matrix.invertM(inverse, 0, viewProjection, 0)) return null;
        float[] at = new float[4];
        Matrix.multiplyMV(at, 0, inverse, 0, new float[] {2f * x / viewportWidth - 1f, 1f - 2f * y / viewportHeight, 1f, 1f}, 0);
        if (Math.abs(at[3]) < 1e-6f) return null;
        float[] direction = {at[0] / at[3] - cameraPoint[0], at[1] / at[3] - cameraPoint[1], at[2] / at[3] - cameraPoint[2]};
        float length = (float) Math.sqrt(direction[0] * direction[0] + direction[1] * direction[1] + direction[2] * direction[2]);
        if (length < 1e-6f) return null;
        return new float[] {
            cameraPoint[0] + direction[0] / length * far,
            cameraPoint[1] + direction[1] / length * far,
            cameraPoint[2] + direction[2] / length * far,
        };
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
        if (bubblesHidden) return "Bubbles hidden · Show all brings them back";
        int found = discovered.size();
        int total = 0;
        // Hidden ones still count; one put away unopened doesn't.
        for (ArScene.Item item : scene.items) {
            if (inLayers(item) && (discovered.contains(item.id) || !dismissed.contains(item.id))) total++;
        }
        return found >= total && total > 0
            ? "You found all " + total + ". Thank you for learning with us!"
            : found + " of " + total + " found · "
                + (cameraOnly && !cameraField.hasCompass() ? "more appear as you open them" : "turn around to find more");
    }

    private String hintText() {
        if (selfieMode) return selfieHint();
        if (cameraOnly) {
            if (bubblesHidden) return "";
            String turn = cameraField.turnHint();
            if (!turn.isEmpty()) return turn;
            if (discovered.isEmpty()) return "Tap a bubble to open it";
            return cameraField.draggedOnce() ? "" : "Drag a bubble down or up to move it";
        }
        if (placingAsset != null) {
            if (!aimFound) return placingAsset.model ? "Aim at the ground nearby, moving the phone slowly" : "Aim at a wall or the ground, moving the phone slowly";
            return placingAsset.model ? "Tap to plant the flag here" : "Tap to place it here";
        }
        if (selectedPlace != null || bubblesHidden) return "";
        String turn = directionHint();
        if (turn != null) return turn;
        if (discovered.isEmpty()) return "Walk up to a bubble or tap it";
        if (!draggedOnce) return "Drag a bubble down or up to move it";
        if (!seenThings.isEmpty()) return seenGestured ? "" : "Drag a word to move it · pinch to size and turn it";
        return objects != null && objects.available() ? "Point at a door, a house or a beach to see its Native name" : "";
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
        if (cameraOnly) {
            cameraField = new ArCameraField(this, scene, cameraHost(), loader);
            root.addView(cameraField, new FrameLayout.LayoutParams(-1, -1));
        } else {
            addArSurface(root);
        }
        selfie = new ArSelfie(this, selfieHost());
        selfie.setVisibility(View.GONE);
        root.addView(selfie, new FrameLayout.LayoutParams(-1, -1));
        buildOverlay(root);
    }

    /** RGBA 8-bit with a depth buffer; one a video encoder can record when the phone has one. */
    private static EGLConfig chooseConfig(javax.microedition.khronos.egl.EGL10 egl, javax.microedition.khronos.egl.EGLDisplay display) {
        int[] base = {
            javax.microedition.khronos.egl.EGL10.EGL_RED_SIZE, 8,
            javax.microedition.khronos.egl.EGL10.EGL_GREEN_SIZE, 8,
            javax.microedition.khronos.egl.EGL10.EGL_BLUE_SIZE, 8,
            javax.microedition.khronos.egl.EGL10.EGL_ALPHA_SIZE, 8,
            javax.microedition.khronos.egl.EGL10.EGL_DEPTH_SIZE, 16,
            javax.microedition.khronos.egl.EGL10.EGL_RENDERABLE_TYPE, 4, // OpenGL ES 2
        };
        for (boolean recordable : new boolean[] {true, false}) {
            int[] attributes = java.util.Arrays.copyOf(base, base.length + (recordable ? 3 : 1));
            if (recordable) {
                attributes[base.length] = ArVideo.EGL_RECORDABLE_ANDROID;
                attributes[base.length + 1] = 1;
            }
            attributes[attributes.length - 1] = javax.microedition.khronos.egl.EGL10.EGL_NONE;
            int[] count = new int[1];
            if (!egl.eglChooseConfig(display, attributes, null, 0, count) || count[0] < 1) continue;
            EGLConfig[] configs = new EGLConfig[count[0]];
            if (!egl.eglChooseConfig(display, attributes, configs, configs.length, count)) continue;
            // Exactly 8 bits a channel (the list can start with deeper colour).
            int[] value = new int[1];
            for (int i = 0; i < count[0]; i++) {
                boolean exact = true;
                for (int channel : new int[] {javax.microedition.khronos.egl.EGL10.EGL_RED_SIZE, javax.microedition.khronos.egl.EGL10.EGL_GREEN_SIZE,
                    javax.microedition.khronos.egl.EGL10.EGL_BLUE_SIZE, javax.microedition.khronos.egl.EGL10.EGL_ALPHA_SIZE}) {
                    if (!egl.eglGetConfigAttrib(display, configs[i], channel, value) || value[0] != 8) exact = false;
                }
                if (exact) return configs[i];
            }
        }
        throw new IllegalArgumentException("No OpenGL configuration for AR.");
    }

    private void addArSurface(FrameLayout root) {
        surface = new GLSurfaceView(this);
        surface.setPreserveEGLContextOnPause(true);
        surface.setEGLContextClientVersion(2);
        surface.setEGLConfigChooser(ArActivity::chooseConfig);
        surface.setRenderer(this);
        surface.setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
        surface.setWillNotDraw(false);
        final float[] down = new float[2];
        final boolean[] dragging = new boolean[1];
        final boolean[] pinching = new boolean[1];
        surface.setOnTouchListener((view, event) -> {
            float dx = event.getX() - down[0];
            float dy = event.getY() - down[1];
            switch (event.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    down[0] = event.getX();
                    down[1] = event.getY();
                    dragging[0] = false;
                    pinching[0] = false;
                    break;
                case MotionEvent.ACTION_POINTER_DOWN:
                    // A second finger: a pinch, which sizes and turns a recognized thing's label.
                    if (event.getPointerCount() == 2) {
                        if (dragging[0]) drags.add(new float[] {DRAG_END});
                        dragging[0] = false;
                        pinching[0] = true;
                        drags.add(new float[] {PINCH_START, (event.getX(0) + event.getX(1)) / 2f, (event.getY(0) + event.getY(1)) / 2f,
                            fingerSpacing(event), fingerAngle(event), event.getX(0), event.getY(0), event.getX(1), event.getY(1)});
                    }
                    break;
                case MotionEvent.ACTION_MOVE:
                    if (pinching[0]) {
                        if (event.getPointerCount() >= 2) drags.add(new float[] {PINCH_MOVE, fingerSpacing(event), fingerAngle(event)});
                        break;
                    }
                    // A move past a small slop is a drag; the render loop finds what was
                    // pressed (up or down moves a bubble nearer or farther; a recognized
                    // thing's label follows the finger any way).
                    if (!dragging[0] && Math.hypot(dx, dy) >= dp(16)) {
                        dragging[0] = true;
                        drags.add(new float[] {DRAG_START, down[0], down[1], event.getY(), Math.abs(dy) > Math.abs(dx) ? 1f : 0f});
                    }
                    if (dragging[0]) drags.add(new float[] {DRAG_MOVE, event.getX(), event.getY()});
                    break;
                case MotionEvent.ACTION_POINTER_UP:
                    if (pinching[0] && event.getPointerCount() == 2) drags.add(new float[] {PINCH_END});
                    break;
                case MotionEvent.ACTION_UP:
                    // The pinch ended when its second finger lifted; this is no tap.
                    if (pinching[0]) break;
                    if (dragging[0]) {
                        drags.add(new float[] {DRAG_END});
                    } else if (Math.hypot(dx, dy) < dp(16)) {
                        taps.add(new float[] {event.getX(), event.getY()});
                        view.performClick();
                    }
                    break;
                case MotionEvent.ACTION_CANCEL:
                    if (dragging[0]) drags.add(new float[] {DRAG_END});
                    if (pinching[0]) drags.add(new float[] {PINCH_END});
                    break;
                default:
                    break;
            }
            return true;
        });
        root.addView(surface, new FrameLayout.LayoutParams(-1, -1));
    }

    /**
     * The Place button, its drawer (a tile for each sticker and the flag) and,
     * once one is chosen or tapped, its tools. Placing needs ARCore's surfaces,
     * so camera-only mode has no Place button.
     */
    private void buildPlaceControls(LinearLayout bottom) {
        LinearLayout button = column();
        button.setGravity(Gravity.CENTER_HORIZONTAL);
        ImageView icon = new ImageView(this);
        icon.setImageResource(R.drawable.ic_ar_place);
        icon.setPadding(dp(13), dp(13), dp(13), dp(13));
        icon.setBackground(oval(Color.argb(150, 20, 26, 23)));
        button.addView(icon, new LinearLayout.LayoutParams(dp(52), dp(52)));
        TextView label = text(12, true, "Place");
        label.setGravity(Gravity.CENTER);
        button.addView(label, new LinearLayout.LayoutParams(-2, -2));
        button.setContentDescription("Place a sticker or a flag in your space");
        button.setOnClickListener(v -> {
            synchronized (lock) {
                placingAsset = null;
            }
            fillPlaceDrawer();
            placeDrawer.setVisibility(placeDrawer.getVisibility() == View.VISIBLE ? View.GONE : View.VISIBLE);
            showPlaceTools();
        });
        button.setVisibility(cameraOnly ? View.INVISIBLE : View.VISIBLE);
        placeButton = button;

        placeDrawer = column();
        placeDrawer.setVisibility(View.GONE);
        placeDrawer.setBackground(rounded(Color.argb(235, 20, 26, 23), 22));
        placeDrawer.setPadding(dp(16), dp(14), dp(16), dp(12));
        placeDrawer.setClickable(true);
        placeDrawer.addView(text(17, true, "Place in your space"));
        TextView how = text(13, false, "Choose one, aim at a wall or the ground, then tap. It stays put while AR is open.");
        how.setTextColor(Color.rgb(200, 214, 205));
        how.setPadding(0, dp(2), 0, dp(10));
        placeDrawer.addView(how);
        // The choices scroll up and down, grouped: each sticker's looks, then the flag's colours.
        placeList = column();
        ScrollView scroller = new ScrollView(this);
        scroller.setVerticalScrollBarEnabled(true);
        scroller.addView(placeList, new FrameLayout.LayoutParams(-1, -2));
        placeDrawer.addView(scroller, new LinearLayout.LayoutParams(-1,
            Math.round(getResources().getDisplayMetrics().heightPixels * 0.42f)));
        LinearLayout.LayoutParams drawerParams = new LinearLayout.LayoutParams(-1, -2);
        drawerParams.topMargin = dp(10);
        bottom.addView(placeDrawer, drawerParams);

        placeTools = row();
        placeTools.setGravity(Gravity.CENTER);
        placeTools.setVisibility(View.GONE);
        LinearLayout.LayoutParams toolsParams = new LinearLayout.LayoutParams(-1, -2);
        toolsParams.topMargin = dp(10);
        bottom.addView(placeTools, toolsParams);
    }

    /**
     * Hides every bubble, card, pin and sign at once (to place stickers and the
     * flag in a clear view, or take a plain photo), and shows them again where
     * they were.
     */
    private LinearLayout buildHideButton() {
        LinearLayout button = column();
        button.setGravity(Gravity.CENTER_HORIZONTAL);
        ImageView icon = new ImageView(this);
        icon.setPadding(dp(13), dp(13), dp(13), dp(13));
        icon.setBackground(oval(Color.argb(150, 20, 26, 23)));
        button.addView(icon, new LinearLayout.LayoutParams(dp(52), dp(52)));
        TextView label = text(12, true, "");
        label.setGravity(Gravity.CENTER);
        button.addView(label, new LinearLayout.LayoutParams(-2, -2));
        Runnable show = () -> {
            icon.setImageResource(bubblesHidden ? R.drawable.ic_ar_show : R.drawable.ic_ar_hide);
            label.setText(bubblesHidden ? "Show all" : "Hide all");
            button.setContentDescription(bubblesHidden ? "Show the floating bubbles again" : "Hide all the floating bubbles");
        };
        button.setOnClickListener(v -> {
            bubblesHidden = !bubblesHidden;
            if (bubblesHidden) infoPanel.setVisibility(View.GONE);
            show.run();
        });
        show.run();
        return button;
    }

    /** "AR  Selfie": the AR camera, or the front camera with the visitor's name tag. */
    private LinearLayout buildModeSwitch() {
        LinearLayout modes = row();
        modes.setBackground(rounded(Color.argb(150, 20, 26, 23), 18));
        modes.setPadding(dp(4), dp(4), dp(4), dp(4));
        modeAr = text(14, true, "AR");
        modeAr.setContentDescription("AR camera");
        modeAr.setOnClickListener(v -> setSelfieMode(false));
        modeSelfie = text(14, true, "Selfie");
        modeSelfie.setContentDescription("Selfie camera, with your name tag");
        modeSelfie.setOnClickListener(v -> setSelfieMode(true));
        for (TextView mode : new TextView[] {modeAr, modeSelfie}) {
            mode.setGravity(Gravity.CENTER);
            mode.setPadding(dp(16), dp(6), dp(16), dp(6));
            modes.addView(mode, new LinearLayout.LayoutParams(-2, -2));
        }
        showMode();
        return modes;
    }

    private void showMode() {
        modeAr.setBackground(selfieMode ? null : rounded(Color.rgb(46, 125, 84), 14));
        modeSelfie.setBackground(selfieMode ? rounded(Color.rgb(46, 125, 84), 14) : null);
        modeAr.setTextColor(selfieMode ? Color.rgb(200, 214, 205) : Color.WHITE);
        modeSelfie.setTextColor(selfieMode ? Color.WHITE : Color.rgb(200, 214, 205));
    }

    /**
     * Selfie mode puts AR to sleep (the bubbles, stickers and flag stay where
     * they were) and opens the front camera with the visitor's name tag; AR
     * mode closes it and wakes AR again.
     */
    private void setSelfieMode(boolean on) {
        if (on == selfieMode) return;
        stopArVideo();
        if (on) {
            if (cameraField != null) cameraField.stop();
            if (session != null) {
                surface.onPause();
                session.pause();
            }
            selfieMode = true;
            infoPanel.setVisibility(View.GONE);
            placeDrawer.setVisibility(View.GONE);
            placeTools.setVisibility(View.GONE);
            foundPill.setVisibility(View.GONE);
            selfie.setName(selfieName());
            selfie.setVisibility(View.VISIBLE);
            startAr();
            if (BuildConfig.DEBUG && new java.io.File(getFilesDir(), "qa-ar-pinch").exists()) selfie.postDelayed(this::qaPinchSelfie, 2500);
        } else {
            selfie.stop();
            selfie.setVisibility(View.GONE);
            selfieMode = false;
            startAr();
            showPlaceTools();
        }
        placeButton.setVisibility(on || cameraOnly ? View.INVISIBLE : View.VISIBLE);
        hideButton.setVisibility(on ? View.INVISIBLE : View.VISIBLE);
        statusCapsule.setVisibility(on ? View.INVISIBLE : View.VISIBLE);
        shutter.setContentDescription(on ? "Take a selfie" : "Take a photo. Hold to record a video.");
        showMode();
        lastStatusText = "";
        hint.setText(on ? selfieHint() : "");
        hint.setVisibility(on ? View.VISIBLE : View.GONE);
    }

    private String selfieHint() {
        return selfieName().isEmpty() ? "Tap the name tag to write your name" : "Drag the name tag to move it · pinch to size and turn it";
    }

    private String selfieName() {
        return getPreferences(MODE_PRIVATE).getString(PREF_SELFIE_NAME, "");
    }

    /** Writing the name on the tag; it is kept on this phone for the next selfie. */
    private void editSelfieName() {
        android.widget.EditText field = new android.widget.EditText(this);
        field.setSingleLine(true);
        field.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_PERSON_NAME
            | android.text.InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        field.setFilters(new android.text.InputFilter[] {new android.text.InputFilter.LengthFilter(30)});
        field.setHint("Your name");
        field.setText(selfieName());
        field.setSelection(field.getText().length());
        FrameLayout box = new FrameLayout(this);
        box.setPadding(dp(22), dp(6), dp(22), 0);
        box.addView(field);
        android.app.AlertDialog dialog = new android.app.AlertDialog.Builder(this)
            .setTitle("_____ nutusuwis")
            .setMessage("_____ is my name. Write yours for your name tag; it stays on this phone and shows only on the selfies you take.")
            .setView(box)
            .setPositiveButton("Done", (shown, which) -> {
                String name = field.getText().toString().trim().replaceAll("\\s+", " ");
                getPreferences(MODE_PRIVATE).edit().putString(PREF_SELFIE_NAME, name).apply();
                selfie.setName(name);
                hint.setText(selfieHint());
            })
            .setNegativeButton("Cancel", null)
            .create();
        if (dialog.getWindow() != null) dialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE);
        // The keyboard's ✓ (or a keyboard's Enter) is Done too.
        field.setImeOptions(android.view.inputmethod.EditorInfo.IME_ACTION_DONE);
        field.setOnEditorActionListener((view, action, event) -> {
            boolean enter = event != null && event.getKeyCode() == android.view.KeyEvent.KEYCODE_ENTER;
            if (action != android.view.inputmethod.EditorInfo.IME_ACTION_DONE && !enter) return false;
            if (!enter || event.getAction() == android.view.KeyEvent.ACTION_DOWN) {
                dialog.getButton(android.app.AlertDialog.BUTTON_POSITIVE).performClick();
            }
            return true;
        });
        dialog.show();
        field.requestFocus();
    }

    private ArSelfie.Host selfieHost() {
        return new ArSelfie.Host() {
            @Override public void editName() {
                editSelfieName();
            }
            @Override public void failed(String message) {
                hint.setText(message);
                hint.setVisibility(View.VISIBLE);
            }
        };
    }

    /**
     * The drawer's choices, made when it first opens: a heading for each group
     * and its tiles in rows, as many to a row as fit. Pictures are drawn in the
     * background and appear as they are ready.
     */
    private void fillPlaceDrawer() {
        if (placeList.getChildCount() > 0) return;
        float tileDp = 100f;
        float widthDp = getResources().getDisplayMetrics().widthPixels / getResources().getDisplayMetrics().density;
        int perRow = Math.max(3, (int) ((widthDp - 56f) / tileDp));
        String group = null;
        LinearLayout tiles = null;
        for (ArPlace.Asset asset : ArPlace.ASSETS) {
            if (!asset.group.equals(group)) {
                group = asset.group;
                TextView heading = text(14, true, group);
                heading.setTextColor(Color.rgb(126, 211, 158));
                heading.setPadding(dp(2), dp(placeList.getChildCount() == 0 ? 0 : 12), 0, dp(6));
                placeList.addView(heading);
                tiles = null;
            }
            if (tiles == null || tiles.getChildCount() >= perRow) {
                tiles = row();
                tiles.setGravity(Gravity.START);
                LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(-1, -2);
                rowParams.bottomMargin = dp(8);
                placeList.addView(tiles, rowParams);
            }
            LinearLayout tile = column();
            tile.setGravity(Gravity.CENTER_HORIZONTAL);
            tile.setPadding(dp(5), dp(5), dp(5), dp(5));
            tile.setBackground(rounded(Color.argb(60, 255, 255, 255), 14));
            ImageView picture = new ImageView(this);
            picture.setScaleType(ImageView.ScaleType.FIT_CENTER);
            tile.addView(picture, new LinearLayout.LayoutParams(-1, dp(72)));
            TextView name = text(12, true, asset.label);
            name.setGravity(Gravity.CENTER);
            name.setMaxLines(2);
            tile.addView(name, new LinearLayout.LayoutParams(-1, -2));
            tile.setContentDescription("Place " + asset.group + ", " + asset.label);
            tile.setOnClickListener(v -> choosePlace(asset));
            LinearLayout.LayoutParams tileParams = new LinearLayout.LayoutParams(0, -2, 1f);
            tileParams.rightMargin = dp(8);
            tiles.addView(tile, tileParams);
            loader.execute(() -> {
                try {
                    Bitmap art = ArPlace.tile(asset, getResources());
                    runOnUiThread(() -> picture.setImageBitmap(art));
                } catch (RuntimeException error) {
                    android.util.Log.w("OnThisSiteAR", "Tile " + asset.id + " failed: " + error);
                }
            });
        }
        // A short last row keeps its tiles the same width as the others.
        for (int i = 0; i < placeList.getChildCount(); i++) {
            View child = placeList.getChildAt(i);
            if (!(child instanceof LinearLayout)) continue;
            LinearLayout row = (LinearLayout) child;
            while (row.getChildCount() < perRow) {
                LinearLayout.LayoutParams spacer = new LinearLayout.LayoutParams(0, 1, 1f);
                spacer.rightMargin = dp(8);
                row.addView(new View(this), spacer);
            }
        }
    }

    private void choosePlace(ArPlace.Asset asset) {
        synchronized (lock) {
            placingAsset = asset;
            selectedPlace = null;
            aimFound = false;
        }
        placeDrawer.setVisibility(View.GONE);
        showPlaceTools();
    }

    /** While aiming: Cancel. With a placed sticker or flag chosen: Smaller, Bigger, Turn, Remove, Done. */
    private void showPlaceTools() {
        ArPlace.Placed thing;
        ArPlace.Asset choosing;
        synchronized (lock) {
            thing = selectedPlace;
            choosing = placingAsset;
        }
        placeTools.removeAllViews();
        if (choosing != null) {
            placeTools.addView(placeTool("Cancel", "cancel"));
        } else if (thing != null) {
            placeTools.addView(placeTool("Smaller", "smaller"));
            placeTools.addView(placeTool("Bigger", "bigger"));
            placeTools.addView(placeTool("Turn", "turn"));
            placeTools.addView(placeTool("Remove", "remove"));
            placeTools.addView(placeTool("Done", "done"));
        }
        placeTools.setVisibility(placeTools.getChildCount() > 0 ? View.VISIBLE : View.GONE);
    }

    private TextView placeTool(String label, String action) {
        TextView tool = text(14, true, label);
        tool.setGravity(Gravity.CENTER);
        tool.setBackground(rounded("done".equals(action) ? Color.rgb(46, 125, 84) : Color.argb(200, 20, 26, 23), 18));
        tool.setPadding(dp(12), dp(9), dp(12), dp(9));
        tool.setOnClickListener(v -> placeAction(action));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-2, -2);
        params.leftMargin = dp(3);
        params.rightMargin = dp(3);
        tool.setLayoutParams(params);
        return tool;
    }

    private void placeAction(String action) {
        synchronized (lock) {
            ArPlace.Placed thing = selectedPlace;
            if ("cancel".equals(action)) {
                placingAsset = null;
            } else if (thing != null) {
                switch (action) {
                    case "smaller":
                        thing.scale = Math.max(0.2f, thing.scale / 1.25f);
                        break;
                    case "bigger":
                        thing.scale = Math.min(6f, thing.scale * 1.25f);
                        break;
                    case "turn":
                        thing.turn += (float) Math.toRadians(15);
                        break;
                    case "remove":
                        thing.removed = true;
                        selectedPlace = null;
                        break;
                    default:
                        selectedPlace = null;
                        break;
                }
            }
        }
        showPlaceTools();
    }

    /**
     * QA builds: with files/qa-ar-pinch, selfie mode gets a two-finger pinch (spread
     * to about twice as far apart, turning 15 degrees) around the screen's middle,
     * through the window like a real touch, since adb can only send one finger.
     */
    private void qaPinchSelfie() {
        View window = getWindow().getDecorView();
        float centerX = window.getWidth() / 2f;
        float centerY = window.getHeight() * 0.6f;
        long start = SystemClock.uptimeMillis();
        for (int step = 0; step <= 12; step++) {
            float share = Math.min(1f, step / 10f);
            double angle = Math.toRadians(15 * share);
            float half = 150 + 160 * share;
            float[][] fingers = {
                {centerX - half * (float) Math.cos(angle), centerY - half * (float) Math.sin(angle)},
                {centerX + half * (float) Math.cos(angle), centerY + half * (float) Math.sin(angle)},
            };
            int action = step == 0 ? MotionEvent.ACTION_DOWN : step == 1 ? MotionEvent.ACTION_POINTER_DOWN | (1 << MotionEvent.ACTION_POINTER_INDEX_SHIFT)
                : step == 11 ? MotionEvent.ACTION_POINTER_UP | (1 << MotionEvent.ACTION_POINTER_INDEX_SHIFT) : step == 12 ? MotionEvent.ACTION_UP : MotionEvent.ACTION_MOVE;
            int count = step == 0 || step == 12 ? 1 : 2;
            MotionEvent.PointerProperties[] properties = new MotionEvent.PointerProperties[count];
            MotionEvent.PointerCoords[] coords = new MotionEvent.PointerCoords[count];
            for (int i = 0; i < count; i++) {
                properties[i] = new MotionEvent.PointerProperties();
                properties[i].id = i;
                properties[i].toolType = MotionEvent.TOOL_TYPE_FINGER;
                coords[i] = new MotionEvent.PointerCoords();
                coords[i].x = fingers[i][0];
                coords[i].y = fingers[i][1];
                coords[i].pressure = 1f;
                coords[i].size = 0.1f;
            }
            MotionEvent event = MotionEvent.obtain(start, start + step * 16L, action, count, properties, coords, 0, 0, 1f, 1f, 0, 0,
                android.view.InputDevice.SOURCE_TOUCHSCREEN, 0);
            window.dispatchTouchEvent(event);
            event.recycle();
        }
        android.util.Log.i("OnThisSiteAR", "QA pinch sent to selfie mode");
    }

    /** QA builds: files/qa-ar-drawer opens the Place drawer (even camera-only) to check its layout. */
    private void openQaDrawer() {
        if (!new java.io.File(getFilesDir(), "qa-ar-drawer").exists()) return;
        placeDrawer.postDelayed(() -> {
            placeButton.setVisibility(View.VISIBLE);
            fillPlaceDrawer();
            placeDrawer.setVisibility(View.VISIBLE);
        }, 1500);
    }

    private static void saveQaShadows(java.io.File out) {
        try {
            saveQaCard(new java.io.File(out, "place-shadow.png"), ArPlace.shadowBlob());
        } catch (Exception error) {
            android.util.Log.w("OnThisSiteAR", "QA shadows failed: " + error);
        }
    }

    /** QA builds: what to place as soon as tracking starts, from files/qa-ar-place (asset ids, comma-separated). */
    private void readQaPlace() {
        java.io.File flag = new java.io.File(getFilesDir(), "qa-ar-place");
        if (!flag.exists()) return;
        try {
            String ids = new String(java.nio.file.Files.readAllBytes(flag.toPath()), java.nio.charset.StandardCharsets.UTF_8);
            for (String id : ids.split(",")) {
                ArPlace.Asset asset = ArPlace.asset(id.trim());
                if (asset != null) qaPlace.add(asset);
            }
            // The artwork as placed, and the drawer's tiles, for checking without an ARCore device.
            java.io.File out = new java.io.File(getFilesDir(), "qa-cards");
            if (out.isDirectory() || out.mkdirs()) {
                loader.execute(() -> {
                    for (ArPlace.Asset asset : ArPlace.ASSETS) {
                        String name = "place-" + asset.id.replace(':', '-');
                        try {
                            saveQaCard(new java.io.File(out, name + "-tile.png"), ArPlace.tile(asset, getResources()));
                            saveQaCard(new java.io.File(out, name + ".png"), ArPlace.artwork(asset, getResources()));
                        } catch (Exception error) {
                            android.util.Log.w("OnThisSiteAR", "QA artwork " + name + " failed: " + error);
                        }
                    }
                    saveQaShadows(out);
                });
            }
        } catch (Exception error) {
            android.util.Log.w("OnThisSiteAR", "QA place file unreadable: " + error);
        }
    }

    /** Camera-only mode: the field asks about and reports on bubbles here. */
    private ArCameraField.Host cameraHost() {
        return new ArCameraField.Host() {
            @Override public boolean visible(ArScene.Item item) {
                return ArActivity.this.visible(item);
            }
            @Override public boolean discovered(ArScene.Item item) {
                return discovered.contains(item.id);
            }
            @Override public boolean skyReady() {
                return ArActivity.this.skyReady();
            }
            @Override public Bitmap markerBitmap(ArScene.Item item) {
                return item.isHere() ? ArCards.hereMarker(item) : ArCards.skySign(item, decodeImage(item.image, 256));
            }
            @Override public Bitmap bubbleBitmap(ArScene.Item item) {
                Bitmap inner = decodeImage(item.figure.isEmpty() ? item.image : item.figure, 512);
                int color = ArCards.layerColor(item.layer);
                return inner == null ? ArCards.orb(color) : ArCards.bubble(inner, color);
            }
            @Override public void tapped(ArScene.Item item) {
                if (item == null) {
                    infoPanel.setVisibility(View.GONE);
                    return;
                }
                if (discovered.add(item.id)) onDiscovered(item);
                showItem(item);
            }
            @Override public void dismiss(ArScene.Item item) {
                dismissed.add(item.id);
                vibrateConfirm();
                if (item.id.equals(shownItemId)) infoPanel.setVisibility(View.GONE);
            }
            @Override public void changed() {
                postStatus(statusText(), hintText());
            }
            @Override public void failed(String message) {
                showFatal(message);
            }
        };
    }

    private void buildOverlay(FrameLayout root) {
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
        statusCapsule = capsule;
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
            // While a video records: a red dot and the time.
            recordPill = text(14, true, "");
            recordPill.setVisibility(View.GONE);
            recordPill.setBackground(rounded(Color.rgb(196, 40, 40), 16));
            recordPill.setPadding(dp(12), dp(6), dp(12), dp(6));
            LinearLayout.LayoutParams pillParams = new LinearLayout.LayoutParams(-2, -2);
            pillParams.gravity = Gravity.CENTER_HORIZONTAL;
            pillParams.topMargin = dp(10);
            bottom.addView(recordPill, pillParams);
            // The shutter: saves what the camera sees, bubbles and all, to
            // Photos. Holding it records a video until it is let go.
            shutter = new ImageView(this);
            setShutterRing(false);
            shutter.setImageResource(R.drawable.ic_ar_camera);
            shutter.setScaleType(ImageView.ScaleType.FIT_CENTER);
            shutter.setPadding(dp(19), dp(19), dp(19), dp(19));
            shutter.setContentDescription("Take a photo. Hold to record a video.");
            shutter.setOnClickListener(v -> takeArPhoto());
            shutter.setOnLongClickListener(v -> startArVideo());
            shutter.setOnTouchListener((v, event) -> {
                int action = event.getActionMasked();
                if ((action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_CANCEL) && video != null) stopArVideo();
                return false;
            });
            // Place, left of the shutter: stickers and the flag to put into the
            // visitor's own space, from a drawer that opens above it.
            buildPlaceControls(bottom);
            LinearLayout controls = row();
            controls.setGravity(Gravity.CENTER);
            controls.addView(placeButton, new LinearLayout.LayoutParams(dp(68), -2));
            LinearLayout.LayoutParams shutterParams = new LinearLayout.LayoutParams(dp(68), dp(68));
            shutterParams.leftMargin = dp(28);
            shutterParams.rightMargin = dp(28);
            controls.addView(shutter, shutterParams);
            // Hide all / Show all, right of the shutter (keeping it centred).
            hideButton = buildHideButton();
            controls.addView(hideButton, new LinearLayout.LayoutParams(dp(68), -2));
            // AR or Selfie, above the shutter, as a phone's camera switches modes.
            LinearLayout.LayoutParams modeParams = new LinearLayout.LayoutParams(-2, -2);
            modeParams.gravity = Gravity.CENTER_HORIZONTAL;
            modeParams.topMargin = dp(10);
            bottom.addView(buildModeSwitch(), modeParams);
            LinearLayout.LayoutParams controlsParams = new LinearLayout.LayoutParams(-2, -2);
            controlsParams.gravity = Gravity.CENTER_HORIZONTAL;
            controlsParams.topMargin = dp(10);
            bottom.addView(controls, controlsParams);
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
        photoPost = text(16, true, "Post");
        photoPost.setGravity(Gravity.CENTER);
        photoPost.setPadding(dp(16), dp(12), dp(16), dp(12));
        photoPost.setContentDescription("Post this photo to the place's Community Notes");
        photoPost.setVisibility(View.GONE);
        photoPost.setOnClickListener(v -> {
            ArScene.Item visitors = visitorsItem();
            if (visitors != null && photoSavedUri != null) joinConversation(visitors, photoSavedUri);
        });
        savedActions.addView(photoPost);
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
        shownItemId = item.id;
        showInfoImage(item);
        infoChoices.removeAllViews();
        infoScroll.scrollTo(0, 0);
        if (ArScene.KIND_PHRASE.equals(item.kind) && item.choices.length >= 2 && !answered.contains(item.id)) {
            askMeaning(item, "");
            return;
        }
        if (ArScene.KIND_VISITORS.equals(item.kind)) {
            showVisitors(item);
            return;
        }
        String heading = item.title.isEmpty() ? (item.word.isEmpty() ? "Untitled" : item.word) : item.title;
        setCardHeader(item, heading);
        StringBuilder body = new StringBuilder();
        if (!item.word.isEmpty() && !item.word.equals(item.title)) body.append(item.word);
        if (!item.pronunciation.isEmpty()) body.append(body.length() > 0 ? "\n" : "").append("say: ").append(item.pronunciation);
        if (!item.meaning.isEmpty()) body.append(body.length() > 0 ? "\n" : "").append(item.meaning);
        if (!item.caption.isEmpty()) body.append(body.length() > 0 ? "\n\n" : "").append(item.caption);
        // Opened, a card tells more than the floating card showed.
        if (!item.more.isEmpty()) body.append(body.length() > 0 ? "\n\n" : "").append(item.more);
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
            : item.id.startsWith("story-") || item.id.startsWith("note-") || item.id.startsWith("plant-")
                || ArScene.KIND_VISITORS.equals(item.kind) ? "FROM THE COMMUNITY"
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

    // ---- Visitor experiences ----

    /** A post AR hands back to the app: the place's slug, and the AR photo to attach (or null). */
    static final class Join {
        final String slug;
        final Uri photo;

        Join(String slug, Uri photo) {
            this.slug = slug;
            this.photo = photo;
        }
    }

    private static volatile Join pendingJoin;

    /** The post the app opens as it comes back from AR, taken once. */
    static Join takePendingJoin() {
        Join join = pendingJoin;
        pendingJoin = null;
        return join;
    }

    /**
     * "Visitor experiences": what people shared at this place (their words and
     * photos, newest first) and the ways to add yours. Either closes AR and opens
     * the place's Community Notes in the app, with the AR photo attached.
     */
    private void showVisitors(ArScene.Item item) {
        // The visits carry their own photos; the card's big photo stays hidden.
        infoImage.setTag(null);
        infoImageFrame.setVisibility(View.GONE);
        setCardHeader(item, item.title);
        infoText.setText(item.caption);
        infoText.setVisibility(item.caption.isEmpty() ? View.GONE : View.VISIBLE);
        if (!item.join.isEmpty()) {
            if (photoSavedUri != null && "image/jpeg".equals(photoSavedType)) {
                infoChoices.addView(joinButton("Post my AR photo here", v -> joinConversation(item, photoSavedUri)));
            }
            infoChoices.addView(joinButton("Leave a note or photo", v -> joinConversation(item, null)));
        }
        for (ArScene.Visit visit : item.visits) infoChoices.addView(visitRow(visit));
        setCredit(item);
        infoActions.removeAllViews();
        infoActions.addView(doneButton());
        infoPanel.setVisibility(View.VISIBLE);
    }

    private TextView joinButton(String label, View.OnClickListener listener) {
        TextView join = choiceButton(label, listener);
        join.setBackground(rounded(Color.rgb(46, 125, 84), 14));
        return join;
    }

    /** One visit: its photo (loaded in the background), its words, and who and when. */
    private View visitRow(ArScene.Visit visit) {
        LinearLayout row = column();
        row.setPadding(0, dp(16), 0, 0);
        if (!visit.image.isEmpty()) {
            ImageView photo = new ImageView(this);
            photo.setScaleType(ImageView.ScaleType.CENTER_CROP);
            photo.setBackground(rounded(Color.argb(255, 10, 14, 12), 14));
            photo.setClipToOutline(true);
            photo.setContentDescription(visit.text.isEmpty() ? "A visitor's photo" : visit.text);
            row.addView(photo, new LinearLayout.LayoutParams(-1, dp(190)));
            loader.execute(() -> {
                Bitmap bitmap = decodeImage(visit.image, 720);
                if (bitmap != null) runOnUiThread(() -> photo.setImageBitmap(bitmap));
            });
        }
        if (!visit.text.isEmpty()) {
            TextView words = text(16, false, "“" + visit.text + "”");
            words.setTextColor(Color.rgb(232, 238, 233));
            words.setPadding(0, dp(6), 0, 0);
            row.addView(words, matchWrap());
        }
        StringBuilder who = new StringBuilder(visit.author);
        if (!visit.place.isEmpty()) who.append(", at ").append(visit.place);
        if (!visit.date.isEmpty()) who.append(" · ").append(visit.date);
        TextView by = text(13, false, who.toString());
        by.setTextColor(Color.rgb(159, 176, 166));
        by.setPadding(0, dp(3), 0, 0);
        row.addView(by, matchWrap());
        return row;
    }

    /** Closes AR; the app then opens the place's Community Notes (MainActivity.onResume). */
    private void joinConversation(ArScene.Item item, Uri photo) {
        pendingJoin = new Join(item.join, photo);
        finish();
    }

    /** The scene's "Visitor experiences" bubble, where an AR photo can be posted. */
    private ArScene.Item visitorsItem() {
        if (scene == null) return null;
        for (ArScene.Item item : scene.items) {
            if (ArScene.KIND_VISITORS.equals(item.kind) && !item.join.isEmpty()) return item;
        }
        return null;
    }

    // ---- AR photos ----

    private void takeArPhoto() {
        if (captureWanted) return;
        captureWanted = !cameraOnly && !selfieMode;
        flash.animate().cancel();
        flash.setAlpha(0.85f);
        flash.setVisibility(View.VISIBLE);
        flash.animate().alpha(0f).setDuration(350).withEndAction(() -> flash.setVisibility(View.GONE)).start();
        vibrateConfirm();
        if (cameraOnly || selfieMode) {
            Bitmap photo = selfieMode ? selfie.capture() : cameraField.capture();
            if (photo != null) loader.execute(() -> savePhoto(photo));
        }
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
        savePhoto(photo);
    }

    /** Stamps the credit on an AR photo and saves it to Photos (or for sharing). */
    private void savePhoto(Bitmap photo) {
        int width = photo.getWidth();
        int height = photo.getHeight();
        Canvas canvas = new Canvas(photo);
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
        photoSavedType = "image/jpeg";
        photoSavedImage.setImageBitmap(photo);
        photoSavedImage.setContentDescription("Your AR photo");
        photoSavedImage.setOnClickListener(null);
        photoSavedText.setText((inPhotos ? "Saved to your photos, in the On This Site album."
            : shareable != null ? "This phone didn't let it into your photos, but you can still share it."
            : "The photo couldn't be saved.")
            + (recordedVideo || selfieMode ? "" : "\nHold the camera button to record a video."));
        photoShare.setVisibility(shareable != null ? View.VISIBLE : View.GONE);
        photoPost.setVisibility(shareable != null && visitorsItem() != null ? View.VISIBLE : View.GONE);
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
        boolean isVideo = "video/mp4".equals(photoSavedType);
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType(photoSavedType);
        send.putExtra(Intent.EXTRA_STREAM, photoSavedUri);
        send.setClipData(android.content.ClipData.newRawUri("", photoSavedUri));
        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            startActivity(Intent.createChooser(send, isVideo ? "Share your AR video" : "Share your AR photo"));
        } catch (android.content.ActivityNotFoundException error) {
            toast("No app on this phone can share photos.");
        }
    }

    // ---- AR videos ----

    private void setShutterRing(boolean recording) {
        GradientDrawable ring = oval(recording ? Color.argb(170, 196, 40, 40) : Color.argb(120, 20, 26, 23));
        ring.setStroke(dp(4), Color.WHITE);
        shutter.setBackground(ring);
    }

    /** Holding the shutter: records a video until it is let go, up to a minute. */
    private boolean startArVideo() {
        if (selfieMode || video != null || captureWanted || (!cameraOnly && session == null)) return false;
        boolean microphone = checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
        android.content.SharedPreferences prefs = getPreferences(MODE_PRIVATE);
        if (!microphone && !prefs.getBoolean(PREF_ASKED_MICROPHONE, false)) {
            // Asked once, for sound; the visitor holds the button again after answering.
            prefs.edit().putBoolean(PREF_ASKED_MICROPHONE, true).apply();
            requestPermissions(new String[] {Manifest.permission.RECORD_AUDIO}, REQUEST_MICROPHONE);
            return true;
        }
        int width = cameraOnly ? cameraField.getWidth() : viewportWidth;
        int height = cameraOnly ? cameraField.getHeight() : viewportHeight;
        if (width <= 0 || height <= 0) return false;
        ArVideo started;
        try {
            started = ArVideo.start(this, CaptureFileProvider.createArVideoFile(this), width, height, microphone, this::creditStrip);
        } catch (Exception error) {
            android.util.Log.w("OnThisSiteAR", "AR video did not start: " + error.getMessage());
            toast("This phone couldn't start a video.");
            return true;
        }
        android.util.Log.i("OnThisSiteAR", String.format(Locale.US, "AR video started: %dx%d, %s",
            started.width, started.height, microphone ? "with sound" : "no sound"));
        video = started;
        recordedVideo = true;
        if (cameraOnly) cameraField.setVideo(started);
        else gl.queueTexture("video-credit", started.credit);
        vibrateConfirm();
        setShutterRing(true);
        recordPill.setText("\u25CF 0:00");
        recordPill.setVisibility(View.VISIBLE);
        videoTicker.postDelayed(videoTick, 250);
        return true;
    }

    private void tickVideo() {
        ArVideo recording = video;
        if (recording == null) return;
        long seconds = (SystemClock.elapsedRealtime() - recording.startedAt) / 1000;
        if (recording.failed() || seconds >= ArVideo.MAX_SECONDS) {
            stopArVideo();
            return;
        }
        recordPill.setText(String.format(Locale.US, "\u25CF %d:%02d", seconds / 60, seconds % 60));
        videoTicker.postDelayed(videoTick, 250);
    }

    /** Letting go of the shutter (or a minute up, or leaving AR): stops, saves and shows the video. */
    private void stopArVideo() {
        ArVideo recording = video;
        if (recording == null) return;
        video = null;
        videoTicker.removeCallbacks(videoTick);
        recordPill.setVisibility(View.GONE);
        setShutterRing(false);
        vibrateConfirm();
        if (cameraOnly) {
            cameraField.setVideo(null);
            loader.execute(() -> saveArVideo(recording));
        } else {
            // The GL thread lets go of the video's surface before it is closed.
            surface.queueEvent(() -> {
                recording.releaseGl();
                loader.execute(() -> saveArVideo(recording));
            });
        }
    }

    /** The credit for a video, as a strip as wide as the video: the place, and On This Site. */
    private Bitmap creditStrip(int width) {
        Bitmap strip = Bitmap.createBitmap(width, Math.round(width * 0.16f), Bitmap.Config.ARGB_8888);
        stampCredit(new Canvas(strip), width, strip.getHeight());
        return strip;
    }

    private void saveArVideo(ArVideo recording) {
        if (!recording.finish()) {
            toast(recording.failed() ? "This phone couldn't record the AR view." : "Hold the button a little longer to record a video.");
            return;
        }
        Bitmap still = videoStill(recording);
        String name = "on-this-site-ar-" + new java.text.SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(new java.util.Date()) + ".mp4";
        Uri saved = saveVideoToGallery(recording.file, name);
        Uri shareable = saved != null ? saved : CaptureFileProvider.uriFor(recording.file);
        if (saved != null && !recording.file.delete()) recording.file.deleteOnExit();
        runOnUiThread(() -> showVideoSaved(still, shareable, saved != null, recording.withSound));
    }

    /** The video's first frame with a play button, for the saved card. */
    private Bitmap videoStill(ArVideo recording) {
        Bitmap frame = null;
        android.media.MediaMetadataRetriever retriever = new android.media.MediaMetadataRetriever();
        try {
            retriever.setDataSource(recording.file.getAbsolutePath());
            frame = retriever.getFrameAtTime(0, android.media.MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
        } catch (RuntimeException error) {
            android.util.Log.w("OnThisSiteAR", "No still from the AR video: " + error.getMessage());
        } finally {
            try {
                retriever.release();
            } catch (Exception ignored) {
                // Nothing left to free.
            }
        }
        Bitmap still = frame != null ? frame.copy(Bitmap.Config.ARGB_8888, true)
            : Bitmap.createBitmap(recording.width / 4, recording.height / 4, Bitmap.Config.ARGB_8888);
        if (frame != null) frame.recycle();
        Canvas canvas = new Canvas(still);
        if (frame == null) canvas.drawColor(Color.rgb(20, 26, 23));
        float radius = Math.min(still.getWidth(), still.getHeight()) * 0.12f;
        float cx = still.getWidth() / 2f;
        float cy = still.getHeight() / 2f;
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(Color.argb(150, 0, 0, 0));
        canvas.drawCircle(cx, cy, radius, paint);
        paint.setColor(Color.WHITE);
        android.graphics.Path play = new android.graphics.Path();
        play.moveTo(cx - radius * 0.35f, cy - radius * 0.5f);
        play.lineTo(cx + radius * 0.55f, cy);
        play.lineTo(cx - radius * 0.35f, cy + radius * 0.5f);
        play.close();
        canvas.drawPath(play, paint);
        return still;
    }

    /** Copies the video to Photos, in the On This Site album; null when this phone won't allow it. */
    private Uri saveVideoToGallery(java.io.File file, String name) {
        android.content.ContentResolver resolver = getContentResolver();
        // Pictures keeps photos and videos in one album; some Android 10 phones take videos only in Movies.
        for (String folder : new String[] {"Pictures/On This Site", "Movies/On This Site"}) {
            android.content.ContentValues values = new android.content.ContentValues();
            values.put(android.provider.MediaStore.Video.Media.DISPLAY_NAME, name);
            values.put(android.provider.MediaStore.Video.Media.MIME_TYPE, "video/mp4");
            values.put(android.provider.MediaStore.Video.Media.DATE_TAKEN, System.currentTimeMillis());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.put(android.provider.MediaStore.Video.Media.RELATIVE_PATH, folder);
                values.put(android.provider.MediaStore.Video.Media.IS_PENDING, 1);
            }
            Uri uri = null;
            try {
                uri = resolver.insert(android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return null;
                try (OutputStream output = resolver.openOutputStream(uri);
                     InputStream input = new java.io.FileInputStream(file)) {
                    if (output == null) throw new java.io.IOException("no output stream");
                    byte[] buffer = new byte[64 * 1024];
                    int read;
                    while ((read = input.read(buffer)) > 0) output.write(buffer, 0, read);
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    android.content.ContentValues ready = new android.content.ContentValues();
                    ready.put(android.provider.MediaStore.Video.Media.IS_PENDING, 0);
                    resolver.update(uri, ready, null, null);
                }
                return uri;
            } catch (IllegalArgumentException wrongFolder) {
                removeQuietly(resolver, uri);
            } catch (Exception error) {
                // Before Android 10 saving to Photos needs a storage permission this app doesn't ask for.
                android.util.Log.w("OnThisSiteAR", "AR video not saved to Photos: " + error.getMessage());
                removeQuietly(resolver, uri);
                return null;
            }
        }
        return null;
    }

    private static void removeQuietly(android.content.ContentResolver resolver, Uri uri) {
        if (uri == null) return;
        try {
            resolver.delete(uri, null, null);
        } catch (RuntimeException ignored) {
            // Already gone.
        }
    }

    private void showVideoSaved(Bitmap still, Uri shareable, boolean inPhotos, boolean withSound) {
        if (isFinishing()) return;
        photoSavedUri = shareable;
        photoSavedType = "video/mp4";
        photoSavedImage.setImageBitmap(still);
        photoSavedImage.setContentDescription("Your AR video. Tap to play it.");
        photoSavedImage.setOnClickListener(shareable == null ? null : v -> playArVideo());
        photoSavedText.setText((inPhotos ? "Video saved to your photos, in the On This Site album."
            : shareable != null ? "This phone didn't let it into your photos, but you can still share it."
            : "The video couldn't be saved.")
            + (withSound ? "" : "\nNo sound: allow the microphone for On This Site in Settings to record sound."));
        photoShare.setVisibility(shareable != null ? View.VISIBLE : View.GONE);
        // Community Notes take photos, not videos.
        photoPost.setVisibility(View.GONE);
        photoSaved.setVisibility(View.VISIBLE);
    }

    private void playArVideo() {
        if (photoSavedUri == null) return;
        Intent play = new Intent(Intent.ACTION_VIEW);
        play.setDataAndType(photoSavedUri, "video/mp4");
        play.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            startActivity(play);
        } catch (android.content.ActivityNotFoundException error) {
            toast("No app on this phone can play the video.");
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
        } else if (selfieMode) {
            setSelfieMode(false);
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

    /** The question as it is asked: its prompt (who asks, and the question), or the plain one. */
    private static String question(ArScene.Item item) {
        if (!item.prompt.isEmpty()) return item.prompt;
        return (item.title.isEmpty() ? "" : item.title + " asks you:\n") + "What does this word mean?";
    }

    /** A language question: what does this word mean? Wrong answers can be tried again. */
    private void askMeaning(ArScene.Item item, String feedback) {
        setCardHeader(item, "“" + item.word + "”");
        infoText.setVisibility(View.VISIBLE);
        infoText.setText((item.pronunciation.isEmpty() ? "" : "say: " + item.pronunciation + "\n\n")
            + question(item) + (feedback.isEmpty() ? "" : "\n\n" + feedback));
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
                    infoText.setText(question(item) + "\n\nNot quite. Try another answer.");
                }
            }));
        }
        infoActions.addView(doneButton());
        infoPanel.setVisibility(View.VISIBLE);
    }

    private void onDiscovered(ArScene.Item item) {
        vibrateConfirm();
        String name = !item.word.isEmpty() ? item.word : !item.name.isEmpty() ? item.name : item.title.isEmpty() ? "a story" : item.title;
        showFound(item.isHere() ? "📍 " + item.title : "✨ You found " + name.replaceFirst("^(Nearby: |Meet )", ""));
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
        (cameraOnly ? cameraField : surface).performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY);
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

    /** One part of a placed 3D thing to draw this frame. */
    private static final class MeshDraw {
        ArGl.Mesh mesh;
        float[] model;
        String texture;
        float[] color = {1f, 1f, 1f, 1f};
        float wave;
        // Where its shadow falls (world x, y, z of the ground it stands on) and how far it fades out; null casts none.
        float[] shadowFoot;
        float shadowFade;

        static MeshDraw solid(ArGl.Mesh mesh, float[] model, float[] color) {
            MeshDraw draw = new MeshDraw();
            draw.mesh = mesh;
            draw.model = model;
            draw.color = color;
            return draw;
        }

        static MeshDraw cloth(ArGl.Mesh mesh, float[] model, String texture, float wave) {
            MeshDraw draw = new MeshDraw();
            draw.mesh = mesh;
            draw.model = model;
            draw.texture = texture;
            draw.wave = wave;
            return draw;
        }
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

        /** A quad already placed by its model matrix (a placed sticker, or a tap box with no texture). */
        static Draw of(String itemId, float[] model, String texture, float alpha, float distance) {
            Draw draw = new Draw();
            draw.itemId = itemId;
            draw.texture = texture;
            draw.model = model;
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
