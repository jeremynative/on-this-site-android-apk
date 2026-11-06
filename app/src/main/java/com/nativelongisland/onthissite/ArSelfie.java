package com.nativelongisland.onthissite;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.SurfaceTexture;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Size;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.TextureView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import java.util.Collections;

/**
 * Selfie mode: the front camera, full screen and mirrored like a mirror, with
 * the visitor's name tag ("Jeremy nutusuwis", "Jeremy is my name") floating
 * over it. A tap on the tag writes the name; a drag moves it. A photo is the
 * camera image as it was seen with the tag drawn on it, reading the right way
 * round.
 */
final class ArSelfie extends FrameLayout {
    interface Host {
        /** The name tag was tapped. */
        void editName();
        void failed(String message);
    }

    private final Host host;
    private final TextureView preview;
    private final ImageView tag;
    private Bitmap tagArt;
    // Where the tag sits, as a share of the free space across and down
    // (kept when the screen turns); placed under the face to begin with.
    private float tagAcross = 0.5f;
    private float tagDown = 0.62f;

    private boolean started;
    private CameraDevice camera;
    private CameraCaptureSession session;
    private HandlerThread cameraThread;
    private Handler cameraHandler;
    private Size previewSize;
    private boolean autoFocus;
    private int openRetries;

    @SuppressLint("ClickableViewAccessibility")
    ArSelfie(Context context, Host host) {
        super(context);
        this.host = host;
        setBackgroundColor(Color.BLACK);
        preview = new TextureView(context);
        addView(preview, new LayoutParams(-1, -1));
        tag = new ImageView(context);
        tag.setAdjustViewBounds(true);
        tag.setScaleType(ImageView.ScaleType.FIT_CENTER);
        addView(tag, new LayoutParams(-2, -2));
        float slop = 12 * getResources().getDisplayMetrics().density;
        final float[] down = new float[4];
        final boolean[] dragging = new boolean[1];
        tag.setOnTouchListener((view, event) -> {
            switch (event.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    down[0] = event.getRawX();
                    down[1] = event.getRawY();
                    down[2] = view.getX();
                    down[3] = view.getY();
                    dragging[0] = false;
                    return true;
                case MotionEvent.ACTION_MOVE: {
                    float dx = event.getRawX() - down[0];
                    float dy = event.getRawY() - down[1];
                    if (!dragging[0] && Math.hypot(dx, dy) >= slop) dragging[0] = true;
                    if (dragging[0]) moveTag(down[2] + dx, down[3] + dy);
                    return true;
                }
                case MotionEvent.ACTION_UP:
                    if (!dragging[0]) {
                        view.performClick();
                        host.editName();
                    }
                    return true;
                default:
                    return true;
            }
        });
    }

    /** The tag for this name (blank lines to fill before one is written). */
    void setName(String name) {
        tagArt = ArCards.nameTag(name);
        tag.setImageBitmap(tagArt);
        tag.setContentDescription(name.isEmpty() ? "Your name tag. Tap to write your name." : name + " nutusuwis: " + name + " is my name. Tap to change it.");
        requestLayout();
    }

    @Override
    protected void onSizeChanged(int width, int height, int oldWidth, int oldHeight) {
        super.onSizeChanged(width, height, oldWidth, oldHeight);
        // About two thirds of the screen's width, but no wider than a name tag on a tablet.
        tag.getLayoutParams().width = Math.round(Math.min(width * 0.72f, 340 * getResources().getDisplayMetrics().density));
        post(tag::requestLayout);
        fitPreview();
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        super.onLayout(changed, left, top, right, bottom);
        placeTag();
    }

    private void moveTag(float x, float y) {
        float freeAcross = Math.max(1f, getWidth() - tag.getWidth());
        float freeDown = Math.max(1f, getHeight() - tag.getHeight());
        tagAcross = Math.max(0f, Math.min(1f, x / freeAcross));
        tagDown = Math.max(0f, Math.min(1f, y / freeDown));
        placeTag();
    }

    private void placeTag() {
        tag.setX(tagAcross * Math.max(0, getWidth() - tag.getWidth()));
        tag.setY(tagDown * Math.max(0, getHeight() - tag.getHeight()));
    }

    void start() {
        if (started) return;
        started = true;
        preview.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {
            @Override public void onSurfaceTextureAvailable(SurfaceTexture texture, int width, int height) { openCamera(); }
            @Override public void onSurfaceTextureSizeChanged(SurfaceTexture texture, int width, int height) { fitPreview(); }
            @Override public boolean onSurfaceTextureDestroyed(SurfaceTexture texture) { return true; }
            @Override public void onSurfaceTextureUpdated(SurfaceTexture texture) { }
        });
        if (preview.isAvailable()) openCamera();
    }

    void stop() {
        started = false;
        closeCamera();
    }

    /** What the screen shows: the mirrored camera image with the name tag on it. */
    Bitmap capture() {
        Bitmap frame = preview.getBitmap();
        if (frame == null) return null;
        Bitmap photo = frame.copy(Bitmap.Config.ARGB_8888, true);
        frame.recycle();
        if (tagArt != null && tag.getWidth() > 0) {
            float scale = photo.getWidth() / (float) Math.max(1, getWidth());
            RectF where = new RectF(tag.getX() * scale, tag.getY() * scale,
                (tag.getX() + tag.getWidth()) * scale, (tag.getY() + tag.getHeight()) * scale);
            new Canvas(photo).drawBitmap(tagArt, null, where, new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG));
        }
        return photo;
    }

    // ---- Camera ----

    @SuppressLint("MissingPermission")
    private void openCamera() {
        if (!started || camera != null || !preview.isAvailable()) return;
        CameraManager manager = (CameraManager) getContext().getSystemService(Context.CAMERA_SERVICE);
        try {
            String id = frontCameraId(manager);
            if (id == null) {
                host.failed("This device has no front camera for selfies.");
                return;
            }
            CameraCharacteristics characteristics = manager.getCameraCharacteristics(id);
            StreamConfigurationMap map = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);
            previewSize = choosePreviewSize(map == null ? new Size[0] : map.getOutputSizes(SurfaceTexture.class));
            int[] focusModes = characteristics.get(CameraCharacteristics.CONTROL_AF_AVAILABLE_MODES);
            autoFocus = false;
            if (focusModes != null) for (int mode : focusModes) if (mode == CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE) autoFocus = true;
            cameraThread = new HandlerThread("ArSelfie");
            cameraThread.start();
            cameraHandler = new Handler(cameraThread.getLooper());
            manager.openCamera(id, new CameraDevice.StateCallback() {
                @Override public void onOpened(CameraDevice device) {
                    if (!started) {
                        device.close();
                        return;
                    }
                    camera = device;
                    openRetries = 0;
                    startPreview();
                }
                @Override public void onDisconnected(CameraDevice device) {
                    device.close();
                    camera = null;
                }
                @Override public void onError(CameraDevice device, int error) {
                    device.close();
                    camera = null;
                    // Just after AR the back camera may still be closing.
                    if (started && openRetries++ < 4) {
                        postDelayed(() -> {
                            closeCamera();
                            openCamera();
                        }, 400);
                        return;
                    }
                    post(() -> host.failed("The front camera is busy. Close other camera apps and try again."));
                }
            }, cameraHandler);
        } catch (Exception error) {
            host.failed("The front camera couldn't open. (" + error.getClass().getSimpleName() + ")");
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
            if (autoFocus) request.set(CaptureRequest.CONTROL_AF_MODE, CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
            camera.createCaptureSession(Collections.singletonList(surface), new CameraCaptureSession.StateCallback() {
                @Override public void onConfigured(CameraCaptureSession configured) {
                    if (camera == null) return;
                    session = configured;
                    try {
                        session.setRepeatingRequest(request.build(), null, cameraHandler);
                    } catch (Exception error) {
                        post(() -> host.failed("The selfie camera couldn't start."));
                    }
                }
                @Override public void onConfigureFailed(CameraCaptureSession failed) {
                    post(() -> host.failed("The selfie camera couldn't start."));
                }
            }, cameraHandler);
            post(this::fitPreview);
        } catch (Exception error) {
            post(() -> host.failed("The selfie camera couldn't start."));
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

    private static String frontCameraId(CameraManager manager) throws Exception {
        for (String id : manager.getCameraIdList()) {
            Integer facing = manager.getCameraCharacteristics(id).get(CameraCharacteristics.LENS_FACING);
            if (facing != null && facing == CameraCharacteristics.LENS_FACING_FRONT) return id;
        }
        return null;
    }

    /** The largest preview up to 1920 px long whose shape best fits the screen. */
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

    /** Fills the screen with the preview, upright and unstretched, in portrait or landscape (as ArCameraField). */
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
        float contentShape = sideways ? longSide / shortSide : shortSide / longSide;
        float viewShape = viewWidth / viewHeight;
        float cropAcross = contentShape > viewShape ? contentShape / viewShape : 1f;
        float cropUp = contentShape > viewShape ? 1f : viewShape / contentShape;
        if (sideways) {
            RectF viewRect = new RectF(0, 0, viewWidth, viewHeight);
            RectF bufferRect = new RectF(0, 0, shortSide, longSide);
            bufferRect.offset(centerX - bufferRect.centerX(), centerY - bufferRect.centerY());
            matrix.setRectToRect(viewRect, bufferRect, android.graphics.Matrix.ScaleToFit.FILL);
            float scale = Math.max(viewHeight / shortSide, viewWidth / longSide);
            matrix.postScale(scale, scale, centerX, centerY);
            matrix.postRotate(90 * (rotation - 2), centerX, centerY);
        } else {
            matrix.setScale(cropAcross, cropUp, centerX, centerY);
            if (rotation == Surface.ROTATION_180) matrix.postRotate(180, centerX, centerY);
        }
        preview.setTransform(matrix);
    }
}
