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
 * Tapping a bubble opens its card, as in full AR.
 */
final class ArCameraField extends FrameLayout implements SensorEventListener {
    interface Host {
        boolean visible(ArScene.Item item);
        boolean discovered(ArScene.Item item);
        /** The bubble's picture; called off the UI thread. */
        Bitmap bubbleBitmap(ArScene.Item item);
        /** A tap on a bubble, or on empty camera view (null). */
        void tapped(ArScene.Item item);
        void changed();
        void failed(String message);
    }

    private static final int MAX_PLACED = 3;
    private static final long REVEAL_GAP_MS = 1400;
    // Below this (degrees) the camera is looking at the floor; above the
    // other, at the ceiling or sky.
    private static final double LOOKING_DOWN = -45;
    private static final double LOOKING_UP = 55;
    // The camera image sampled to measure turning, and how often.
    private static final int FLOW_WIDTH = 96;
    private static final int FLOW_HEIGHT = 160;
    private static final long FLOW_EVERY_MS = 40;
    private static final int FLOW_SEARCH = 12;

    private static final class Bubble {
        final ArScene.Item item;
        Bitmap bitmap;
        boolean loading;
        // Compass mode: the direction and height (degrees) it floats at.
        double bearing;
        double elevation;
        // Without a compass: placed in front of the visitor when revealed.
        boolean placed;
        long shownAt;
        final float phase;
        float drawX;
        float drawY;
        float drawRadius;
        boolean onScreen;

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
    private final SensorManager sensors;
    private final Sensor rotationSensor;
    private final Sensor accelerometer;
    private final float[] rotation = new float[9];
    private final float[] down = new float[2];

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
        for (ArScene.Item item : scene.items) {
            Bubble bubble = new Bubble(item, random);
            // A real place floats its real way; the rest spread all round.
            bubble.bearing = Double.isNaN(item.bearing) ? random.nextDouble() * 360 : item.bearing;
            bubble.elevation = -4 + random.nextDouble() * 14;
            bubbles.add(bubble);
        }
        preview = new TextureView(context);
        addView(preview, new LayoutParams(-1, -1));
        setWillNotDraw(false);
        labelPaint.setColor(Color.WHITE);
        labelPaint.setTextAlign(Paint.Align.CENTER);
        labelPaint.setFakeBoldText(true);
        labelPaint.setTextSize(15 * getResources().getDisplayMetrics().scaledDensity);
        labelPaint.setShadowLayer(dp(4), 0, dp(1), Color.argb(220, 0, 0, 0));
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
        drawBubbles(new Canvas(photo));
        return photo;
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
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            if (rotationSensor != null) return;
            // How far the camera looks up or down: gravity along the device's
            // z axis (face up, camera to the floor: -90; face down: +90).
            float g = (float) Math.sqrt(event.values[0] * event.values[0] + event.values[1] * event.values[1] + event.values[2] * event.values[2]);
            if (g < 1f) return;
            double nextPitch = -Math.toDegrees(Math.asin(clamp(event.values[2] / g)));
            pitch += (nextPitch - pitch) * 0.12;
            if (Double.isNaN(heading)) heading = 0;
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
        drawBubbles(canvas);
        host.changed();
        postInvalidateOnAnimation();
    }

    private void drawBubbles(Canvas canvas) {
        long now = SystemClock.uptimeMillis();
        int width = canvas.getWidth();
        int height = canvas.getHeight();
        float radius = dp(56);
        if (Double.isNaN(heading)) return;
        boolean compass = hasCompass();
        if (!compass) revealInFront(now);
        for (Bubble bubble : bubbles) {
            bubble.onScreen = false;
            if (!host.visible(bubble.item) || host.discovered(bubble.item)) continue;
            if (!compass && !bubble.placed) continue;
            // Held at its spot in the air: across by its direction, up by its height.
            double across = angleBetween(heading, bubble.bearing);
            if (Math.abs(across) > fovAcross / 2 + 15) continue;
            float bob = dp(6) * (float) Math.sin(now / 900.0 + bubble.phase);
            float x = width / 2f + (float) (across / fovAcross) * width;
            float y = height / 2f - (float) ((bubble.elevation - pitch) / fovUp) * height + bob;
            // A fresh bubble grows in; all of them pulse gently.
            float grow = compass ? 1f : Math.min(1f, (now - bubble.shownAt) / 450f);
            float size = radius * grow * (0.94f + 0.06f * (float) Math.sin(now / 300.0 + bubble.phase));
            bubble.drawX = x;
            bubble.drawY = y;
            bubble.drawRadius = size;
            bubble.onScreen = x > -size && x < width + size && y > -size && y < height + size;
            if (!bubble.onScreen) continue;
            Bitmap bitmap = bitmapFor(bubble);
            if (bitmap != null) {
                canvas.drawBitmap(bitmap, null, new RectF(x - size, y - size, x + size, y + size), bitmapPaint);
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
     * Without a compass: up to three bubbles at a time, each appearing in
     * front of the visitor near eye level, the next shortly after one is
     * opened. Not while the camera looks at the floor.
     */
    private void revealInFront(long now) {
        int placed = 0;
        Bubble next = null;
        for (Bubble bubble : bubbles) {
            if (!host.visible(bubble.item) || host.discovered(bubble.item)) continue;
            if (bubble.placed) placed++;
            else if (next == null) next = bubble;
        }
        if (next == null || placed >= MAX_PLACED || now - lastReveal < REVEAL_GAP_MS || pitch < LOOKING_DOWN || pitch > LOOKING_UP) return;
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
        lastReveal = now;
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
                "Camera-only heading=%.1f pitch=%.1f texture=%.0f shift=%.2f", heading, pitch, texture / profile.length, shift));
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
                Bitmap bitmap = host.bubbleBitmap(bubble.item);
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

    @SuppressLint("ClickableViewAccessibility")
    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
            down[0] = event.getX();
            down[1] = event.getY();
            return true;
        }
        if (event.getActionMasked() != MotionEvent.ACTION_UP
            || Math.hypot(event.getX() - down[0], event.getY() - down[1]) >= dp(16)) return true;
        Bubble picked = null;
        double pickedDistance = Double.MAX_VALUE;
        for (Bubble bubble : bubbles) {
            if (!bubble.onScreen || host.discovered(bubble.item)) continue;
            double distance = Math.hypot(event.getX() - bubble.drawX, event.getY() - bubble.drawY);
            if (distance <= bubble.drawRadius * 1.15 && distance < pickedDistance) {
                picked = bubble;
                pickedDistance = distance;
            }
        }
        host.tapped(picked == null ? null : picked.item);
        performClick();
        return true;
    }

    @Override
    public boolean performClick() {
        return super.performClick();
    }

    private float dp(float value) {
        return value * getResources().getDisplayMetrics().density;
    }
}
