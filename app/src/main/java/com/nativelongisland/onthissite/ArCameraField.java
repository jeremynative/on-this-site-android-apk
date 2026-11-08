package com.nativelongisland.onthissite;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.SurfaceTexture;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.SystemClock;
import android.util.Size;
import android.util.SizeF;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.TextureView;
import android.widget.FrameLayout;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ExecutorService;

/**
 * AR for devices ARCore can't run on (no gyroscope, not certified, or ARCore
 * missing while offline): the plain camera with the same bubbles over it,
 * each held at a spot in the air as the visitor looks around. With a compass
 * (a rotation vector sensor) bubbles sit in real directions, a real place in
 * its own. Without one (tablets with only an accelerometer) the tilt comes
 * from gravity and the turn from how the camera image slides, and a few
 * bubbles at a time appear in front of the visitor at eye level.
 * Tapping a bubble opens its card, as in full AR; pressing one and dragging
 * down brings it closer (larger), up pushes it away.
 */
final class ArCameraField extends FrameLayout implements SensorEventListener {
    interface Host {
        boolean visible(ArScene.Item item);
        boolean discovered(ArScene.Item item);
        /** Whether the nearby sites' sky signs may rise yet (they come after the other bubbles). */
        boolean skyReady();
        /** The bubble's picture; called off the UI thread. */
        Bitmap bubbleBitmap(ArScene.Item item);
        /** The "You are here" marker or a sky sign; called off the UI thread. */
        Bitmap markerBitmap(ArScene.Item item);
        /** A tap on a bubble, or on empty camera view (null). */
        void tapped(ArScene.Item item);
        /** A tap on a bubble's or marker's ✕: put it away for this visit. */
        void dismiss(ArScene.Item item);
        void changed();
        void failed(String message);
    }

    private static final int MAX_PLACED = 3;
    // "You are here" sits ahead, below the middle of the view; with a compass, nearby
    // sites rise one after another to signs high in their real directions.
    private static final double HERE_BELOW_DEG = 16;
    private static final double SKY_ELEVATION = 22;
    private static final double SKY_RISE_DEG = 12;
    private static final long SKY_RISE_MS = 1300;
    private static final long SKY_STAGGER_MS = 1500;
    // Without a compass (the iPlay tablets have only an accelerometer), bubbles come
    // over time and space as on a phone with ARCore: one at a time where the visitor
    // looks and nothing is waiting, at least this long apart however far the visitor
    // walks; an unopened one left out of view after a walk (or a long while) makes
    // way for new ones, so the next room gets its own.
    private static final long REVEAL_GAP_MS = 15000;
    private static final int LEFT_BEHIND_STEPS = 10;
    private static final long LEFT_BEHIND_MS = 40000;
    // After a bubble is opened or put away with its ✕, the next one takes its time.
    private static final long REVEAL_AFTER_CLOSE_MS = 10000;
    // Below this (degrees) the camera is looking at the floor; above the
    // other, at the ceiling or sky.
    private static final double LOOKING_DOWN = -45;
    private static final double LOOKING_UP = 55;
    // The camera image sampled to measure turning, and how often.
    private static final int FLOW_WIDTH = 96;
    private static final int FLOW_HEIGHT = 160;
    private static final long FLOW_EVERY_MS = 40;
    private static final int FLOW_SEARCH = 12;
    // How near or far a dragged bubble can look, as a share of its size.
    private static final float NEAREST = 2f;
    private static final float FARTHEST = 0.5f;

    private static final class Bubble {
        final ArScene.Item item;
        Bitmap bitmap;
        boolean loading;
        // Compass mode: the direction and height (degrees) it floats at.
        double bearing;
        double elevation;
        // Without a compass: placed in front of the visitor when revealed, the steps
        // walked by then, and since when it has been out of view (0: in view).
        boolean placed;
        long shownAt;
        int stepsAtReveal;
        long outOfViewSince;
        // Brought closer (above 1) or pushed away (below) by a drag.
        float near = 1f;
        // The marker or a sky sign: drawn as its own picture, kept after it is opened.
        boolean marker;
        boolean sky;
        long riseAt;
        final float phase;
        float drawX;
        float drawY;
        float drawRadius;
        boolean onScreen;
        // Its ✕ badge on screen this frame: the middle and the radius that takes a tap (0: none).
        float closeX;
        float closeY;
        float closeRadius;

        Bubble(ArScene.Item item, Random random) {
            this.item = item;
            phase = random.nextFloat() * 6.28f;
        }
    }

    private final Host host;
    private final ExecutorService loader;
    private final TextureView preview;
    private final List<Bubble> bubbles = new ArrayList<>();
    private final Random random = new Random();
    private final Paint bitmapPaint = new Paint(Paint.FILTER_BITMAP_FLAG | Paint.ANTI_ALIAS_FLAG);
    private final Paint labelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint placeholderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Bitmap badge;
    // QA builds: files/qa-ar-level holds the view level, so a tablet lying on a desk shows bubbles.
    private final boolean qaLevel;
    private final SensorManager sensors;
    private final Sensor rotationSensor;
    private final Sensor accelerometer;
    private final float[] rotation = new float[9];
    private final float[] down = new float[2];
    // An AR video while it records, and the camera image copied for it.
    private ArVideo video;
    private Bitmap videoFrame;
    private boolean dragging;
    private Bubble dragged;
    private float dragFromY;
    private float dragFromNear;
    private boolean draggedOnce;

    private boolean started;
    private CameraDevice camera;
    private CameraCaptureSession session;
    private HandlerThread cameraThread;
    private Handler cameraHandler;
    private Size previewSize;
    // The camera's view across its short and long sides, and what the
    // cropped preview shows across the screen's width and height (degrees).
    private float lensAcross = 60f;
    private float lensUp = 80f;
    private float fovAcross = 60f;
    private float fovUp = 80f;
    // Where the camera points (degrees, smoothed): from the compass, or
    // without one relative to where AR opened. NaN until known.
    private double heading = Double.NaN;
    private double pitch;
    private long lastReveal;
    private long revealNotBefore;
    // Steps counted from the accelerometer: its reading less gravity (slowly
    // followed), smoothed, rising through a threshold about twice a second.
    private int steps;
    private long lastStepAt;
    private float gravityLevel = SensorManager.GRAVITY_EARTH;
    private float stepSignal;
    private boolean stepArmed = true;
    // Turn tracking from the camera image (no compass).
    private Bitmap flowFrame;
    private int[] flowPixels;
    private float[] lastFlowProfile;
    private long lastFlowAt;
    private long lastFlowLog;

    ArCameraField(Context context, ArScene scene, Host host, ExecutorService loader) {
        super(context);
        this.host = host;
        this.loader = loader;
        sensors = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        Sensor rotationVector = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
        if (rotationVector == null && sensors != null) rotationVector = sensors.getDefaultSensor(Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR);
        rotationSensor = rotationVector;
        accelerometer = sensors == null ? null : sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        qaLevel = BuildConfig.DEBUG && new java.io.File(context.getFilesDir(), "qa-ar-level").exists();
        for (ArScene.Item item : scene.items) {
            Bubble bubble = new Bubble(item, random);
            // A real place floats its real way; the rest spread all round.
            bubble.bearing = Double.isNaN(item.bearing) ? random.nextDouble() * 360 : item.bearing;
            bubble.elevation = -4 + random.nextDouble() * 14;
            bubble.sky = item.isSky() && rotationSensor != null;
            bubble.marker = item.isHere() || bubble.sky;
            if (bubble.sky) bubble.elevation = SKY_ELEVATION;
            bubbles.add(bubble);
        }
        spreadOut();
        preview = new TextureView(context);
        addView(preview, new LayoutParams(-1, -1));
        setWillNotDraw(false);
        labelPaint.setColor(Color.WHITE);
        labelPaint.setTextAlign(Paint.Align.CENTER);
        labelPaint.setFakeBoldText(true);
        labelPaint.setTextSize(15 * getResources().getDisplayMetrics().scaledDensity);
        labelPaint.setShadowLayer(dp(4), 0, dp(1), Color.argb(220, 0, 0, 0));
    }

    // Bubbles closer than this (degrees across and up) would overlap.
    private static final double MIN_APART = 15;

    /**
     * Places that lie the same way (several sites to the northwest) would
     * pile into one unreadable cluster: each bubble keeps its direction but
     * takes the nearest free height, moving at most 8 degrees sideways.
     */
    private void spreadOut() {
        List<Bubble> placed = new ArrayList<>();
        double[] heights = {0, 14, -12, 28, 42};
        double[] nudges = {0, 8, -8};
        for (Bubble bubble : bubbles) {
            double baseBearing = bubble.bearing;
            double bestBearing = baseBearing;
            double bestElevation = bubble.elevation;
            double bestGap = -1;
            search:
            for (double height : heights) {
                for (double nudge : nudges) {
                    double bearing = (baseBearing + nudge + 360) % 360;
                    double elevation = bubble.elevation + height;
                    double gap = Double.MAX_VALUE;
                    for (Bubble other : placed) {
                        gap = Math.min(gap, Math.hypot(angleBetween(other.bearing, bearing), other.elevation - elevation));
                    }
                    if (gap >= MIN_APART) {
                        bestBearing = bearing;
                        bestElevation = elevation;
                        break search;
                    }
                    if (gap > bestGap) {
                        bestGap = gap;
                        bestBearing = bearing;
                        bestElevation = elevation;
                    }
                }
            }
            bubble.bearing = bestBearing;
            bubble.elevation = bestElevation;
            placed.add(bubble);
        }
    }

    /** True when bubbles sit in real directions (the device has a compass). */
    boolean hasCompass() {
        return rotationSensor != null;
    }

    void start() {
        if (started) return;
        started = true;
        if (rotationSensor != null) sensors.registerListener(this, rotationSensor, SensorManager.SENSOR_DELAY_GAME);
        if (accelerometer != null) sensors.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_GAME);
        // With no motion sensors at all, the turn still comes from the camera.
        if (rotationSensor == null && accelerometer == null) heading = 0;
        if (preview.isAvailable()) openCamera();
        preview.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
            @Override public void onSurfaceTextureAvailable(SurfaceTexture texture, int width, int height) { openCamera(); }
            @Override public void onSurfaceTextureSizeChanged(SurfaceTexture texture, int width, int height) { fitPreview(); }
            @Override public boolean onSurfaceTextureDestroyed(SurfaceTexture texture) { return true; }
            @Override public void onSurfaceTextureUpdated(SurfaceTexture texture) { }
        });
        postInvalidateOnAnimation();
    }

    void stop() {
        started = false;
        if (sensors != null) sensors.unregisterListener(this);
        closeCamera();
    }

    /** The camera view with its bubbles, for an AR photo. */
    Bitmap capture() {
        Bitmap frame = preview.getBitmap();
        if (frame == null) return null;
        Bitmap photo = frame.copy(Bitmap.Config.ARGB_8888, true);
        frame.recycle();
        drawBubbles(new Canvas(photo), false);
        return photo;
    }

    /** Each drawn frame also goes into the video while one records (null to stop). */
    void setVideo(ArVideo next) {
        video = next;
        if (next == null && videoFrame != null) {
            videoFrame.recycle();
            videoFrame = null;
        }
    }

    /** The camera image, the bubbles over it and the credit along the bottom. */
    private void recordFrame(ArVideo recording) {
        recording.drawCanvas(canvas -> {
            if (videoFrame == null) videoFrame = Bitmap.createBitmap(recording.width, recording.height, Bitmap.Config.ARGB_8888);
            Bitmap frame = preview.getBitmap(videoFrame);
            canvas.drawColor(Color.BLACK);
            if (frame != null) canvas.drawBitmap(frame, 0f, 0f, null);
            canvas.save();
            canvas.scale(recording.width / (float) getWidth(), recording.height / (float) getHeight());
            drawBubbles(canvas, false);
            canvas.restore();
            canvas.drawBitmap(recording.credit, 0f, recording.height - recording.credit.getHeight(), null);
        });
    }

    // ---- Camera ----

    @SuppressLint("MissingPermission")
    private void openCamera() {
        if (!started || camera != null || !preview.isAvailable()) return;
        CameraManager manager = (CameraManager) getContext().getSystemService(Context.CAMERA_SERVICE);
        try {
            String id = backCameraId(manager);
            if (id == null) {
                host.failed("This device has no camera for AR.");
                return;
            }
            CameraCharacteristics characteristics = manager.getCameraCharacteristics(id);
            StreamConfigurationMap map = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);
            previewSize = choosePreviewSize(map == null ? new Size[0] : map.getOutputSizes(SurfaceTexture.class));
            readFieldOfView(characteristics);
            cameraThread = new HandlerThread("ArCameraField");
            cameraThread.start();
            cameraHandler = new Handler(cameraThread.getLooper());
            manager.openCamera(id, new CameraDevice.StateCallback() {
                @Override public void onOpened(CameraDevice device) {
                    if (!started) {
                        device.close();
                        return;
                    }
                    camera = device;
                    startPreview();
                }
                @Override public void onDisconnected(CameraDevice device) {
                    device.close();
                    camera = null;
                }
                @Override public void onError(CameraDevice device, int error) {
                    device.close();
                    camera = null;
                    post(() -> host.failed("The camera is busy in another app. Close it and try again."));
                }
            }, cameraHandler);
        } catch (Exception error) {
            host.failed("The camera couldn't open. (" + error.getClass().getSimpleName() + ")");
        }
    }

    private void startPreview() {
        try {
            SurfaceTexture texture = preview.getSurfaceTexture();
            if (texture == null || camera == null) return;
            texture.setDefaultBufferSize(previewSize.getWidth(), previewSize.getHeight());
            Surface surface = new Surface(texture);
            CaptureRequest.Builder request = camera.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
            request.addTarget(surface);
            request.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
            camera.createCaptureSession(Collections.singletonList(surface), new CameraCaptureSession.StateCallback() {
                @Override public void onConfigured(CameraCaptureSession configured) {
                    if (camera == null) return;
                    session = configured;
                    try {
                        session.setRepeatingRequest(request.build(), null, cameraHandler);
                    } catch (Exception error) {
                        post(() -> host.failed("The camera preview couldn't start."));
                    }
                }
                @Override public void onConfigureFailed(CameraCaptureSession failed) {
                    post(() -> host.failed("The camera preview couldn't start."));
                }
            }, cameraHandler);
            post(this::fitPreview);
        } catch (Exception error) {
            post(() -> host.failed("The camera preview couldn't start."));
        }
    }

    private void closeCamera() {
        if (session != null) session.close();
        session = null;
        if (camera != null) camera.close();
        camera = null;
        if (cameraThread != null) cameraThread.quitSafely();
        cameraThread = null;
        cameraHandler = null;
    }

    private static String backCameraId(CameraManager manager) throws Exception {
        String any = null;
        for (String id : manager.getCameraIdList()) {
            Integer facing = manager.getCameraCharacteristics(id).get(CameraCharacteristics.LENS_FACING);
            if (facing != null && facing == CameraCharacteristics.LENS_FACING_BACK) return id;
            if (any == null) any = id;
        }
        return any;
    }

    /** The largest preview up to 1920 px long whose shape best fits the portrait screen. */
    private Size choosePreviewSize(Size[] sizes) {
        float want = Math.max(getWidth(), getHeight()) / (float) Math.max(1, Math.min(getWidth(), getHeight()));
        Size best = null;
        float bestScore = Float.MAX_VALUE;
        for (Size size : sizes) {
            int longSide = Math.max(size.getWidth(), size.getHeight());
            if (longSide > 1920 || longSide < 640) continue;
            float shape = longSide / (float) Math.min(size.getWidth(), size.getHeight());
            float score = Math.abs(shape - want) * 4000 - longSide;
            if (score < bestScore) {
                bestScore = score;
                best = size;
            }
        }
        return best != null ? best : sizes.length > 0 ? sizes[0] : new Size(1280, 720);
    }

    /**
     * Fills the screen with the camera preview, upright and without
     * stretching, in portrait or landscape, and works out how much of the
     * lens's view the cropped preview shows across and up the screen.
     */
    private void fitPreview() {
        if (previewSize == null || getWidth() == 0 || getHeight() == 0) return;
        float viewWidth = getWidth();
        float viewHeight = getHeight();
        float longSide = Math.max(previewSize.getWidth(), previewSize.getHeight());
        float shortSide = Math.min(previewSize.getWidth(), previewSize.getHeight());
        int rotation = getDisplay() == null ? Surface.ROTATION_0 : getDisplay().getRotation();
        boolean sideways = rotation == Surface.ROTATION_90 || rotation == Surface.ROTATION_270;
        float centerX = viewWidth / 2f;
        float centerY = viewHeight / 2f;
        android.graphics.Matrix matrix = new android.graphics.Matrix();
        // The preview's shape on screen, and how much of it each side keeps.
        float contentShape = sideways ? longSide / shortSide : shortSide / longSide;
        float viewShape = viewWidth / viewHeight;
        float cropAcross = contentShape > viewShape ? contentShape / viewShape : 1f;
        float cropUp = contentShape > viewShape ? 1f : viewShape / contentShape;
        if (sideways) {
            // The camera delivers frames for the portrait screen; map the view
            // onto that frame, fill it, and turn it to the screen's rotation.
            android.graphics.RectF viewRect = new android.graphics.RectF(0, 0, viewWidth, viewHeight);
            android.graphics.RectF bufferRect = new android.graphics.RectF(0, 0, shortSide, longSide);
            bufferRect.offset(centerX - bufferRect.centerX(), centerY - bufferRect.centerY());
            matrix.setRectToRect(viewRect, bufferRect, android.graphics.Matrix.ScaleToFit.FILL);
            float scale = Math.max(viewHeight / shortSide, viewWidth / longSide);
            matrix.postScale(scale, scale, centerX, centerY);
            matrix.postRotate(90 * (rotation - 2), centerX, centerY);
            // Landscape: the lens's long side runs across the screen.
            fovAcross = lensUp / cropAcross;
            fovUp = lensAcross / cropUp;
        } else {
            matrix.setScale(cropAcross, cropUp, centerX, centerY);
            if (rotation == Surface.ROTATION_180) matrix.postRotate(180, centerX, centerY);
            fovAcross = lensAcross / cropAcross;
            fovUp = lensUp / cropUp;
        }
        preview.setTransform(matrix);
    }

    private void readFieldOfView(CameraCharacteristics characteristics) {
        SizeF sensor = characteristics.get(CameraCharacteristics.SENSOR_INFO_PHYSICAL_SIZE);
        float[] focal = characteristics.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS);
        if (sensor == null || focal == null || focal.length == 0 || focal[0] <= 0) return;
        // Portrait: the sensor's short side runs across the screen.
        lensAcross = (float) Math.toDegrees(2 * Math.atan(Math.min(sensor.getWidth(), sensor.getHeight()) / (2 * focal[0])));
        lensUp = (float) Math.toDegrees(2 * Math.atan(Math.max(sensor.getWidth(), sensor.getHeight()) / (2 * focal[0])));
        fovAcross = lensAcross;
        fovUp = lensUp;
    }

    // ---- Sensors ----

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (qaLevel) {
            pitch = 0;
            if (Double.isNaN(heading)) heading = 0;
            return;
        }
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            if (rotationSensor != null) return;
            // How far the camera looks up or down: gravity along the device's
            // z axis (face up, camera to the floor: -90; face down: +90).
            float g = (float) Math.sqrt(event.values[0] * event.values[0] + event.values[1] * event.values[1] + event.values[2] * event.values[2]);
            if (g < 1f) return;
            double nextPitch = -Math.toDegrees(Math.asin(clamp(event.values[2] / g)));
            pitch += (nextPitch - pitch) * 0.12;
            if (Double.isNaN(heading)) heading = 0;
            countSteps(g, event.timestamp / 1000000L);
            return;
        }
        SensorManager.getRotationMatrixFromVector(rotation, event.values);
        // The camera looks out of the back of the device (its -Z axis); in
        // world terms x points east, y north and z up.
        double east = -rotation[2];
        double north = -rotation[5];
        double up = -rotation[8];
        double nextHeading = (Math.toDegrees(Math.atan2(east, north)) + 360) % 360;
        double nextPitch = Math.toDegrees(Math.atan2(up, Math.hypot(east, north)));
        if (Double.isNaN(heading)) heading = nextHeading;
        else heading = (heading + angleBetween(heading, nextHeading) * 0.15 + 360) % 360;
        pitch += (nextPitch - pitch) * 0.15;
    }

    /** A walking step: the bounce above gravity passing 0.6 m/s² (then back under 0.15), at most every 280 ms. */
    private void countSteps(float magnitude, long nowMs) {
        gravityLevel += (magnitude - gravityLevel) * 0.02f;
        stepSignal += ((magnitude - gravityLevel) - stepSignal) * 0.3f;
        if (stepArmed && stepSignal > 0.6f && nowMs - lastStepAt > 280) {
            steps++;
            lastStepAt = nowMs;
            stepArmed = false;
        } else if (stepSignal < 0.15f) {
            stepArmed = true;
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    private static float clamp(float value) {
        return Math.max(-1f, Math.min(1f, value));
    }

    /** The signed turn (degrees, -180..180) from a to b. */
    private static double angleBetween(double a, double b) {
        return ((b - a + 540) % 360) - 180;
    }

    // ---- Bubbles ----

    @Override
    protected void dispatchDraw(Canvas canvas) {
        super.dispatchDraw(canvas);
        if (!started) return;
        trackTurning();
        drawBubbles(canvas, true);
        if (video != null) recordFrame(video);
        host.changed();
        postInvalidateOnAnimation();
    }

    /** badges: the ✕ on each (on screen, not in a photo or video). */
    private void drawBubbles(Canvas canvas, boolean badges) {
        long now = SystemClock.uptimeMillis();
        // In view coordinates, also on a photo or a video frame scaled to them.
        int width = getWidth();
        int height = getHeight();
        float radius = dp(56);
        if (Double.isNaN(heading)) return;
        boolean compass = hasCompass();
        placeMarkers(now);
        if (!compass) revealInFront(now);
        for (Bubble bubble : bubbles) {
            bubble.onScreen = false;
            bubble.closeRadius = 0f;
            if (!host.visible(bubble.item) || (host.discovered(bubble.item) && !bubble.marker)) continue;
            if (bubble.marker) {
                drawMarker(canvas, bubble, now, width, height, badges);
                continue;
            }
            if (!compass && !bubble.placed) continue;
            // Held at its spot in the air: across by its direction, up by its height.
            double across = angleBetween(heading, bubble.bearing);
            if (Math.abs(across) > fovAcross / 2 + 15) continue;
            float bob = dp(6) * (float) Math.sin(now / 900.0 + bubble.phase);
            float x = width / 2f + (float) (across / fovAcross) * width;
            float y = height / 2f - (float) ((bubble.elevation - pitch) / fovUp) * height + bob;
            // A fresh bubble slowly fades and grows in; all of them pulse gently.
            float fade = compass ? 1f : Math.min(1f, (now - bubble.shownAt) / 1800f);
            float grow = 0.75f + 0.25f * fade;
            float size = radius * grow * bubble.near * (0.94f + 0.06f * (float) Math.sin(now / 300.0 + bubble.phase));
            bubble.drawX = x;
            bubble.drawY = y;
            bubble.drawRadius = size;
            bubble.onScreen = x > -size && x < width + size && y > -size && y < height + size;
            if (!bubble.onScreen) continue;
            Bitmap bitmap = bitmapFor(bubble);
            if (bitmap != null) {
                // No ✕ on an orb (a reach for it too easily put it away); its card opens instead.
                bitmapPaint.setAlpha(Math.round(255 * fade * fade * (3f - 2f * fade)));
                canvas.drawBitmap(bitmap, null, new RectF(x - size, y - size, x + size, y + size), bitmapPaint);
                bitmapPaint.setAlpha(255);
            } else {
                placeholderPaint.setColor(ArCards.layerColor(bubble.item.layer));
                placeholderPaint.setAlpha(200);
                canvas.drawCircle(x, y, size * 0.8f, placeholderPaint);
            }
            String label = label(bubble.item, width);
            if (!label.isEmpty() && grow >= 1f) {
                // Keep the whole name on screen.
                float half = labelPaint.measureText(label) / 2 + dp(8);
                canvas.drawText(label, Math.max(half, Math.min(width - half, x)), y + size + dp(18), labelPaint);
            }
        }
    }

    /**
     * The marker ahead and below the view's middle, and sky signs rising in turn, once the
     * visitor raises the device (not while it faces the floor, or the rise goes unseen).
     */
    private void placeMarkers(long now) {
        if (pitch < LOOKING_DOWN || pitch > LOOKING_UP) return;
        int skyIndex = 0;
        boolean skyReady = host.skyReady();
        for (Bubble bubble : bubbles) {
            if (!bubble.marker || bubble.placed || (bubble.sky && !skyReady)) continue;
            if (bubble.item.isHere()) {
                bubble.bearing = heading;
                bubble.elevation = Math.max(-30, pitch - HERE_BELOW_DEG);
            } else {
                bubble.riseAt = now + skyIndex++ * SKY_STAGGER_MS;
            }
            bubble.placed = true;
            bubble.shownAt = now;
        }
    }

    private void drawMarker(Canvas canvas, Bubble bubble, long now, int width, int height, boolean badges) {
        if (bubble.sky && now < bubble.riseAt) return;
        double across = angleBetween(heading, bubble.bearing);
        if (Math.abs(across) > fovAcross / 2 + 25) return;
        float alpha = 1f;
        double elevation = bubble.elevation;
        float bob;
        if (bubble.sky) {
            float t = Math.min(1f, (now - bubble.riseAt) / (float) SKY_RISE_MS);
            float ease = 1f - (1f - t) * (1f - t) * (1f - t);
            elevation -= (1f - ease) * SKY_RISE_DEG;
            alpha = ease;
            bob = dp(4) * (float) Math.sin(now / 1600.0 + bubble.phase);
        } else {
            bob = dp(3) * (float) Math.sin(now / 900.0);
        }
        Bitmap bitmap = bitmapFor(bubble);
        if (bitmap == null) return;
        float w = dp(bubble.sky ? 200 : 210) * bubble.near;
        float h = w * bitmap.getHeight() / (float) bitmap.getWidth();
        float x = width / 2f + (float) (across / fovAcross) * width;
        float y = height / 2f - (float) ((elevation - pitch) / fovUp) * height + bob;
        bubble.drawX = x;
        bubble.drawY = y;
        bubble.drawRadius = Math.max(w, h) * 0.45f;
        bubble.onScreen = x > -w && x < width + w && y > -h && y < height + h;
        if (!bubble.onScreen) return;
        bitmapPaint.setAlpha(Math.round(255 * alpha));
        canvas.drawBitmap(bitmap, null, new RectF(x - w / 2, y - h / 2, x + w / 2, y + h / 2), bitmapPaint);
        bitmapPaint.setAlpha(255);
        if (!badges) return;
        if (bubble.sky) {
            // In the sign's top-right corner.
            float radius = Math.max(dp(11), w * 0.06f);
            drawBadge(canvas, bubble, x + w / 2 - radius * 0.6f, y - h / 2 + radius * 0.6f, radius, Math.round(255 * alpha));
        } else if (host.discovered(bubble.item)) {
            // On the "You are here" pin's orb, once it has been opened (an orb has no ✕ before).
            float radius = Math.max(dp(11), w * 0.07f);
            float along = (ArCards.HERE_RING * w + radius * 0.4f) * 0.7071f;
            drawBadge(canvas, bubble, x + along, y - h / 2 + ArCards.HERE_ORB_Y * w - along, radius, 255);
        }
    }

    /** A ✕ badge of this radius centred at x, y; a tap within its whole picture puts the bubble away. */
    private void drawBadge(Canvas canvas, Bubble bubble, float x, float y, float radius, int alpha) {
        if (badge == null) badge = ArCards.dismissBadge();
        float half = radius / ArCards.BADGE_SHARE;
        bitmapPaint.setAlpha(alpha);
        canvas.drawBitmap(badge, null, new RectF(x - half, y - half, x + half, y + half), bitmapPaint);
        bitmapPaint.setAlpha(255);
        bubble.closeX = x;
        bubble.closeY = y;
        bubble.closeRadius = half;
    }

    /**
     * Without a compass: at most three unopened bubbles at a time, each
     * appearing in front of the visitor near eye level where none is waiting,
     * at least REVEAL_GAP_MS after the last.
     * An unopened bubble out of view after LEFT_BEHIND_STEPS steps or
     * LEFT_BEHIND_MS is let go, to come again later where the visitor is. Not
     * while the camera looks at the floor or the ceiling.
     */
    private void revealInFront(long now) {
        // The pin comes first, on its own; the first bubble waits its turn too.
        if (lastReveal == 0) lastReveal = now;
        int placed = 0;
        boolean waitingInView = false;
        Bubble next = null;
        for (Bubble bubble : bubbles) {
            if (bubble.marker || !host.visible(bubble.item) || host.discovered(bubble.item)) continue;
            if (!bubble.placed) {
                if (next == null) next = bubble;
                continue;
            }
            double across = Math.abs(angleBetween(heading, bubble.bearing));
            if (across <= fovAcross / 2 + 10) {
                bubble.outOfViewSince = 0;
                waitingInView = true;
            } else {
                if (bubble.outOfViewSince == 0) bubble.outOfViewSince = now;
                if (bubble != dragged && (steps - bubble.stepsAtReveal >= LEFT_BEHIND_STEPS || now - bubble.outOfViewSince >= LEFT_BEHIND_MS)) {
                    android.util.Log.i("OnThisSiteAR", "Camera-only: let go of " + bubble.item.id + " after " + (steps - bubble.stepsAtReveal) + " steps");
                    bubble.placed = false;
                    bubble.outOfViewSince = 0;
                    continue;
                }
            }
            placed++;
        }
        if (next == null || placed >= MAX_PLACED || waitingInView || now < revealNotBefore
            || now - lastReveal < REVEAL_GAP_MS
            || pitch < LOOKING_DOWN || pitch > LOOKING_UP) return;
        // A spot in view, clear of the others, above the shutter.
        double bestBearing = heading;
        double bestElevation = pitch;
        double bestGap = -1;
        for (int attempt = 0; attempt < 30; attempt++) {
            double bearing = (heading + (random.nextDouble() - 0.5) * fovAcross * 0.7 + 360) % 360;
            // Upper middle of the view: clear of the shutter and the hint.
            double elevation = Math.max(-30, Math.min(30, pitch + fovUp * (0.02 + random.nextDouble() * 0.2)));
            double gap = Double.MAX_VALUE;
            for (Bubble other : bubbles) {
                if (!other.placed || host.discovered(other.item)) continue;
                gap = Math.min(gap, Math.hypot(angleBetween(other.bearing, bearing) / fovAcross, (other.elevation - elevation) / fovUp));
            }
            if (gap > bestGap) {
                bestGap = gap;
                bestBearing = bearing;
                bestElevation = elevation;
            }
        }
        next.bearing = bestBearing;
        next.elevation = bestElevation;
        next.placed = true;
        next.shownAt = now;
        next.stepsAtReveal = steps;
        next.outOfViewSince = 0;
        lastReveal = now;
        android.util.Log.i("OnThisSiteAR", "Camera-only: revealed " + next.item.id + " at " + Math.round(bestBearing) + " degrees, " + steps + " steps");
    }

    /**
     * Without a compass, the turn comes from the camera image: a small copy
     * of each frame is reduced to the brightness change across each column,
     * and the shift that best lines it up with the last frame is how far the
     * view slid sideways (the scene moves left as the camera turns right).
     */
    private void trackTurning() {
        if (hasCompass() || Double.isNaN(heading) || !preview.isAvailable()) return;
        long now = SystemClock.uptimeMillis();
        if (now - lastFlowAt < FLOW_EVERY_MS) return;
        lastFlowAt = now;
        if (flowFrame == null) {
            flowFrame = Bitmap.createBitmap(FLOW_WIDTH, FLOW_HEIGHT, Bitmap.Config.ARGB_8888);
            flowPixels = new int[FLOW_WIDTH * FLOW_HEIGHT];
        }
        try {
            preview.getBitmap(flowFrame);
        } catch (RuntimeException error) {
            return;
        }
        flowFrame.getPixels(flowPixels, 0, FLOW_WIDTH, 0, 0, FLOW_WIDTH, FLOW_HEIGHT);
        float[] columns = new float[FLOW_WIDTH];
        // The middle band of the view (the top bar and shutter are not camera).
        for (int y = FLOW_HEIGHT / 5; y < FLOW_HEIGHT * 4 / 5; y++) {
            for (int x = 0; x < FLOW_WIDTH; x++) {
                int pixel = flowPixels[y * FLOW_WIDTH + x];
                columns[x] += ((pixel >> 16) & 0xff) * 0.3f + ((pixel >> 8) & 0xff) * 0.59f + (pixel & 0xff) * 0.11f;
            }
        }
        float[] profile = new float[FLOW_WIDTH - 1];
        float texture = 0;
        for (int x = 0; x < profile.length; x++) {
            profile[x] = columns[x + 1] - columns[x];
            texture += Math.abs(profile[x]);
        }
        float[] last = lastFlowProfile;
        lastFlowProfile = profile;
        // A blank wall or a dark room has nothing to follow.
        if (last == null || texture / profile.length < 40f) return;
        // Coarse first (half the columns, so a quick turn still lines up),
        // then exact around it.
        float rough = profileShift(halve(last), halve(profile), 0, FLOW_SEARCH);
        float shift = Float.isNaN(rough) ? Float.NaN : profileShift(last, profile, Math.round(rough * 2), 3);
        if (BuildConfig.DEBUG && now - lastFlowLog > 1000) {
            lastFlowLog = now;
            android.util.Log.i("OnThisSiteAR", String.format(java.util.Locale.US,
                "Camera-only heading=%.1f pitch=%.1f texture=%.0f shift=%.2f steps=%d", heading, pitch, texture / profile.length, shift, steps));
        }
        if (Float.isNaN(shift) || Math.abs(shift) < 0.2f) return;
        heading = (heading - shift / FLOW_WIDTH * fovAcross + 360) % 360;
    }

    private static float[] halve(float[] profile) {
        float[] half = new float[profile.length / 2];
        for (int i = 0; i < half.length; i++) half[i] = profile[2 * i] + profile[2 * i + 1];
        return half;
    }

    /**
     * How many columns b is shifted right of a (sub-column), searching
     * center ± range, or NaN if there is no clear best match.
     */
    private static float profileShift(float[] a, float[] b, int center, int range) {
        int n = a.length;
        float[] cost = new float[range * 2 + 1];
        float sum = 0;
        int best = 0;
        for (int k = 0; k < cost.length; k++) {
            int shift = center - range + k;
            float total = 0;
            int count = 0;
            for (int i = Math.max(0, -shift); i < Math.min(n, n - shift); i++) {
                total += Math.abs(a[i] - b[i + shift]);
                count++;
            }
            // Too little overlap to compare.
            cost[k] = count < n / 2 ? Float.MAX_VALUE : total / count;
            if (cost[k] < Float.MAX_VALUE) sum += cost[k];
            if (cost[k] < cost[best]) best = k;
        }
        float bestCost = cost[best];
        // Only a clear match counts (the coarse pass), and not one at the
        // edge of the search.
        if (bestCost == Float.MAX_VALUE || best == 0 || best == cost.length - 1) return Float.NaN;
        if (range > 3 && bestCost > sum / cost.length * 0.8f) return Float.NaN;
        float left = cost[best - 1];
        float right = cost[best + 1];
        float curve = left - 2 * bestCost + right;
        float offset = curve > 0 && left < Float.MAX_VALUE && right < Float.MAX_VALUE ? 0.5f * (left - right) / curve : 0f;
        return center - range + best + offset;
    }

    private Bitmap bitmapFor(Bubble bubble) {
        if (bubble.bitmap == null && !bubble.loading) {
            bubble.loading = true;
            loader.execute(() -> {
                Bitmap bitmap = bubble.marker ? host.markerBitmap(bubble.item) : host.bubbleBitmap(bubble.item);
                post(() -> bubble.bitmap = bitmap);
            });
        }
        return bubble.bitmap;
    }

    /**
     * A bubble's name, short enough to sit under it: what tells bubbles of
     * one place apart ("the history", "the people") goes first, so a cut
     * never leaves two identical names. Wider screens show more of it.
     */
    private String label(ArScene.Item item, int screenWidth) {
        String text = item.title.isEmpty() ? item.word : item.title;
        text = text.replaceFirst("^Nearby: ", "");
        java.util.regex.Matcher part = java.util.regex.Pattern.compile("^(.+): the ([A-Za-z]+)$").matcher(text);
        if (part.matches()) text = Character.toUpperCase(part.group(2).charAt(0)) + part.group(2).substring(1) + " of " + part.group(1);
        int limit = screenWidth > getHeight() ? 40 : 28;
        return text.length() > limit ? text.substring(0, limit - 2).trim() + "…" : text;
    }

    /**
     * Compass mode with nothing in view: which way to turn for the nearest
     * unopened bubble ("" when one is in view or none are left).
     */
    String turnHint() {
        if (Double.isNaN(heading)) return "";
        if (pitch < LOOKING_DOWN) return "Raise the device to look around";
        if (pitch > LOOKING_UP) return "Lower the device to look around";
        double nearest = Double.NaN;
        for (Bubble bubble : bubbles) {
            if (!host.visible(bubble.item) || host.discovered(bubble.item)) continue;
            if (!hasCompass() && !bubble.placed) continue;
            if (bubble.onScreen) return "";
            double turn = angleBetween(heading, bubble.bearing);
            if (Double.isNaN(nearest) || Math.abs(turn) < Math.abs(nearest)) nearest = turn;
        }
        if (Double.isNaN(nearest)) return "";
        if (Math.abs(nearest) <= fovAcross / 2) return "Look up or down to find a bubble";
        return nearest < 0 ? "← Turn left to find a bubble" : "Turn right to find a bubble →";
    }

    /** Whether the visitor has moved a bubble yet (to stop teaching it). */
    boolean draggedOnce() {
        return draggedOnce;
    }

    @SuppressLint("ClickableViewAccessibility")
    @Override
    public boolean onTouchEvent(MotionEvent event) {
        float dx = event.getX() - down[0];
        float dy = event.getY() - down[1];
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                down[0] = event.getX();
                down[1] = event.getY();
                dragging = false;
                dragged = null;
                break;
            case MotionEvent.ACTION_MOVE:
                // A mostly up-or-down move past a small slop drags the bubble pressed.
                if (!dragging && Math.abs(dy) >= dp(16) && Math.abs(dy) > Math.abs(dx)) {
                    dragging = true;
                    // Pressing on a ✕ and dragging moves what it sits on.
                    dragged = badgeAt(down[0], down[1]);
                    if (dragged == null) dragged = bubbleAt(down[0], down[1]);
                    dragFromY = event.getY();
                    dragFromNear = dragged == null ? 1f : dragged.near;
                    if (dragged != null) draggedOnce = true;
                }
                if (dragged != null) {
                    float want = dragFromNear * (float) Math.pow(2, (event.getY() - dragFromY) / (getHeight() / 3f));
                    dragged.near = Math.max(FARTHEST, Math.min(NEAREST, want));
                }
                break;
            case MotionEvent.ACTION_UP:
                if (!dragging && Math.hypot(dx, dy) < dp(16)) {
                    Bubble closing = badgeAt(event.getX(), event.getY());
                    if (closing != null) {
                        host.dismiss(closing.item);
                        // Its spot stays taken (placed bubbles keep theirs) while the next waits.
                        revealNotBefore = SystemClock.uptimeMillis() + REVEAL_AFTER_CLOSE_MS;
                    } else {
                        Bubble picked = bubbleAt(event.getX(), event.getY());
                        if (picked != null) revealNotBefore = SystemClock.uptimeMillis() + REVEAL_AFTER_CLOSE_MS;
                        host.tapped(picked == null ? null : picked.item);
                    }
                    performClick();
                }
                dragged = null;
                break;
            case MotionEvent.ACTION_CANCEL:
                dragged = null;
                break;
            default:
                break;
        }
        return true;
    }

    private Bubble bubbleAt(float x, float y) {
        Bubble picked = null;
        double pickedDistance = Double.MAX_VALUE;
        for (Bubble bubble : bubbles) {
            // The marker and sky signs stay up once opened, and open again with a tap.
            if (!bubble.onScreen || (host.discovered(bubble.item) && !bubble.marker)) continue;
            double distance = Math.hypot(x - bubble.drawX, y - bubble.drawY);
            if (distance <= bubble.drawRadius * 1.15 && distance < pickedDistance) {
                picked = bubble;
                pickedDistance = distance;
            }
        }
        return picked;
    }

    /** The bubble whose ✕ is under a point, or null. */
    private Bubble badgeAt(float x, float y) {
        for (Bubble bubble : bubbles) {
            if (bubble.closeRadius > 0f && Math.hypot(x - bubble.closeX, y - bubble.closeY) <= bubble.closeRadius) return bubble;
        }
        return null;
    }

    @Override
    public boolean performClick() {
        return super.performClick();
    }

    private float dp(float value) {
        return value * getResources().getDisplayMetrics().density;
    }
}
