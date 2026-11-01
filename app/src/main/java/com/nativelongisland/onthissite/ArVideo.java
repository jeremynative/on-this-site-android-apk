package com.nativelongisland.onthissite;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.media.MediaCodecInfo;
import android.media.MediaCodecList;
import android.media.MediaRecorder;
import android.opengl.EGL14;
import android.opengl.EGLConfig;
import android.opengl.EGLContext;
import android.opengl.EGLDisplay;
import android.opengl.EGLExt;
import android.opengl.EGLSurface;
import android.opengl.GLES20;
import android.os.Build;
import android.os.SystemClock;
import android.view.Surface;
import java.io.File;
import java.io.IOException;
import java.util.function.Consumer;

/**
 * An AR video: what the AR view shows (the camera and its bubbles, with the
 * credit along the bottom) and, when the microphone is allowed, its sound.
 * Frames come from the GL renderer in full AR (drawGl, on the GL thread) or
 * from a canvas in camera-only mode (drawCanvas, on the UI thread), about 30
 * a second, into a MediaRecorder surface. The file is private until saved.
 */
final class ArVideo {
    static final int MAX_SECONDS = 60;
    // EGL_RECORDABLE_ANDROID: a GL config whose surfaces a video encoder can take.
    static final int EGL_RECORDABLE_ANDROID = 0x3142;
    private static final long FRAME_GAP_MS = 30;

    final File file;
    final int width;
    final int height;
    final boolean withSound;
    final Bitmap credit;
    final long startedAt = SystemClock.elapsedRealtime();
    private final MediaRecorder recorder;
    private final Surface input;
    private long lastFrameAt;
    private volatile boolean failed;
    // Full AR: the recorder's surface as a GL window surface.
    private EGLDisplay eglDisplay;
    private EGLSurface eglSurface;

    private ArVideo(File file, int width, int height, boolean withSound, Bitmap credit, MediaRecorder recorder) {
        this.file = file;
        this.width = width;
        this.height = height;
        this.withSound = withSound;
        this.credit = credit;
        this.recorder = recorder;
        this.input = recorder.getSurface();
    }

    /** Starts recording a view of this size; the credit strip is as wide as the video. */
    static ArVideo start(Context context, File file, int viewWidth, int viewHeight, boolean withSound,
                         java.util.function.IntFunction<Bitmap> creditFor) throws IOException {
        int[] size = videoSize(viewWidth, viewHeight);
        MediaRecorder recorder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? new MediaRecorder(context) : new MediaRecorder();
        try {
            if (withSound) recorder.setAudioSource(MediaRecorder.AudioSource.CAMCORDER);
            recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setOutputFile(file.getAbsolutePath());
            recorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264);
            recorder.setVideoSize(size[0], size[1]);
            recorder.setVideoFrameRate(30);
            recorder.setVideoEncodingBitRate(Math.max(2_500_000, Math.round(size[0] * size[1] * 30 * 0.12f)));
            if (withSound) {
                recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
                recorder.setAudioSamplingRate(44100);
                recorder.setAudioEncodingBitRate(128_000);
                recorder.setAudioChannels(1);
            }
            recorder.prepare();
            ArVideo video = new ArVideo(file, size[0], size[1], withSound, creditFor.apply(size[0]), recorder);
            recorder.start();
            return video;
        } catch (IOException | RuntimeException error) {
            recorder.release();
            throw error instanceof IOException ? (IOException) error : new IOException(error);
        }
    }

    /**
     * The view's shape at the largest size this phone's encoder takes, up to
     * 1920 on the long side; both sides a multiple of 16.
     */
    private static int[] videoSize(int viewWidth, int viewHeight) {
        int longest = Math.max(1, Math.max(viewWidth, viewHeight));
        for (int side : new int[] {1920, 1280, 960, 640}) {
            float scale = Math.min(1f, side / (float) longest);
            int width = Math.max(16, Math.round(viewWidth * scale / 16f) * 16);
            int height = Math.max(16, Math.round(viewHeight * scale / 16f) * 16);
            if (encoderTakes(width, height)) return new int[] {width, height};
        }
        return viewWidth >= viewHeight ? new int[] {640, 352} : new int[] {352, 640};
    }

    private static boolean encoderTakes(int width, int height) {
        try {
            for (MediaCodecInfo info : new MediaCodecList(MediaCodecList.REGULAR_CODECS).getCodecInfos()) {
                if (!info.isEncoder()) continue;
                for (String type : info.getSupportedTypes()) {
                    if (!"video/avc".equalsIgnoreCase(type)) continue;
                    MediaCodecInfo.VideoCapabilities video = info.getCapabilitiesForType(type).getVideoCapabilities();
                    if (video != null && video.areSizeAndRateSupported(width, height, 30)) return true;
                }
            }
        } catch (RuntimeException ignored) {
            // A codec that can't describe itself doesn't count.
        }
        return false;
    }

    boolean failed() {
        return failed;
    }

    /** Whether it's time for the next frame (about 30 a second). */
    private boolean due() {
        long now = SystemClock.uptimeMillis();
        if (now - lastFrameAt < FRAME_GAP_MS) return false;
        lastFrameAt = now;
        return true;
    }

    /**
     * Full AR, on the GL thread right after a frame is drawn: draws the scene
     * again into the video, then goes back to the screen.
     */
    void drawGl(Runnable scene, int screenWidth, int screenHeight) {
        if (failed || !due()) return;
        EGLDisplay display = EGL14.eglGetCurrentDisplay();
        EGLContext context = EGL14.eglGetCurrentContext();
        EGLSurface draw = EGL14.eglGetCurrentSurface(EGL14.EGL_DRAW);
        EGLSurface read = EGL14.eglGetCurrentSurface(EGL14.EGL_READ);
        if (eglSurface == null) {
            EGLConfig config = currentConfig(display, context);
            EGLSurface created = config == null ? null
                : EGL14.eglCreateWindowSurface(display, config, input, new int[] {EGL14.EGL_NONE}, 0);
            if (created == null || created == EGL14.EGL_NO_SURFACE) {
                android.util.Log.w("OnThisSiteAR", "Video surface failed: 0x" + Integer.toHexString(EGL14.eglGetError()));
                failed = true;
                return;
            }
            eglDisplay = display;
            eglSurface = created;
        }
        if (!EGL14.eglMakeCurrent(display, eglSurface, eglSurface, context)) {
            failed = true;
            EGL14.eglMakeCurrent(display, draw, read, context);
            return;
        }
        GLES20.glViewport(0, 0, width, height);
        scene.run();
        EGLExt.eglPresentationTimeANDROID(display, eglSurface, System.nanoTime());
        EGL14.eglSwapBuffers(display, eglSurface);
        EGL14.eglMakeCurrent(display, draw, read, context);
        GLES20.glViewport(0, 0, screenWidth, screenHeight);
    }

    /** The GL config the renderer's context was made with. */
    private static EGLConfig currentConfig(EGLDisplay display, EGLContext context) {
        int[] id = new int[1];
        if (!EGL14.eglQueryContext(display, context, EGL14.EGL_CONFIG_ID, id, 0)) return null;
        EGLConfig[] configs = new EGLConfig[1];
        int[] count = new int[1];
        int[] wanted = {EGL14.EGL_CONFIG_ID, id[0], EGL14.EGL_NONE};
        if (!EGL14.eglChooseConfig(display, wanted, 0, configs, 0, 1, count, 0) || count[0] < 1) return null;
        return configs[0];
    }

    /** Full AR, on the GL thread: lets go of the video's GL surface (before finish). */
    void releaseGl() {
        if (eglSurface != null) EGL14.eglDestroySurface(eglDisplay, eglSurface);
        eglSurface = null;
    }

    /** Camera-only mode, on the UI thread: one frame drawn on a canvas the video's size. */
    void drawCanvas(Consumer<Canvas> scene) {
        if (failed || !due()) return;
        Canvas canvas;
        try {
            canvas = input.lockHardwareCanvas();
        } catch (RuntimeException error) {
            failed = true;
            return;
        }
        try {
            scene.accept(canvas);
        } finally {
            input.unlockCanvasAndPost(canvas);
        }
    }

    /**
     * Stops and closes the recording (off the UI thread). False when there is
     * no usable video (too short to hold a frame); the file is then deleted.
     */
    boolean finish() {
        boolean ok = true;
        try {
            recorder.stop();
        } catch (RuntimeException error) {
            ok = false;
        }
        recorder.release();
        input.release();
        if (!ok || file.length() == 0) {
            if (!file.delete()) file.deleteOnExit();
            return false;
        }
        return true;
    }
}
