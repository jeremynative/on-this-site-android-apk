package com.nativelongisland.onthissite;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageFormat;
import android.graphics.Rect;
import android.graphics.YuvImage;
import java.io.ByteArrayOutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Live "what have I captured" guide that needs no AR tracking: each photo is
 * sent (small) to the scan server during the scan, and about once a second
 * the current camera view is sent too. The server matches the view against
 * the photos (with geometric verification) and returns a grid saying how many
 * photos already cover each part of the view. The overlay tints it.
 */
final class LiveCoverage {
    static final int ROWS = 6;
    static final int COLS = 10;

    interface Listener {
        /** grid[r][c]: -1 = too little detail, 0 = not captured yet, n = photos covering it. */
        void onCoverage(int[][] grid, float[] viewVertices);
    }

    private final String sessionId;
    private final String uploadKey;
    private final Listener listener;
    private final ExecutorService photos = Executors.newSingleThreadExecutor();
    private final ExecutorService views = Executors.newSingleThreadExecutor();
    private final AtomicInteger photoBacklog = new AtomicInteger();
    private final AtomicBoolean viewBusy = new AtomicBoolean();
    private volatile boolean closed;

    LiveCoverage(String sessionId, String uploadKey, Listener listener) {
        this.sessionId = sessionId;
        this.uploadKey = uploadKey;
        this.listener = listener;
    }

    /** A photo was just taken (NV21 camera image). Drops photos if the network falls behind. */
    void addPhoto(int index, byte[] nv21, int width, int height) {
        if (closed || photoBacklog.get() > 6) return;
        photoBacklog.incrementAndGet();
        photos.execute(() -> {
            try {
                ScanUploader.postLive("/sessions/" + sessionId + "/live-photo?index=" + index, uploadKey, smallJpeg(nv21, width, height));
            } catch (Exception error) {
                android.util.Log.w("OnThisSiteScan", "Live photo failed: " + error.getMessage());
            } finally {
                photoBacklog.decrementAndGet();
            }
        });
    }

    boolean wantsView() {
        return !closed && !viewBusy.get();
    }

    /**
     * Current view (NV21) plus where the grid's (ROWS+1)x(COLS+1) corner points
     * land on screen for this frame, so the answer is drawn in the right place.
     */
    void checkView(byte[] nv21, int width, int height, float[] viewVertices) {
        if (!viewBusy.compareAndSet(false, true)) return;
        views.execute(() -> {
            try {
                JSONObject result = ScanUploader.postLive("/sessions/" + sessionId + "/live-coverage?rows=" + ROWS + "&cols=" + COLS,
                    uploadKey, smallJpeg(nv21, width, height));
                JSONArray rows = result.optJSONArray("grid");
                if (rows == null || closed) return;
                int[][] grid = new int[ROWS][COLS];
                for (int r = 0; r < ROWS && r < rows.length(); r++) {
                    JSONArray row = rows.getJSONArray(r);
                    for (int c = 0; c < COLS && c < row.length(); c++) grid[r][c] = row.getInt(c);
                }
                listener.onCoverage(grid, viewVertices);
            } catch (Exception error) {
                android.util.Log.w("OnThisSiteScan", "Live coverage failed: " + error.getMessage());
            } finally {
                viewBusy.set(false);
            }
        });
    }

    void close() {
        closed = true;
        photos.shutdownNow();
        views.shutdownNow();
    }

    /** About 640 px wide JPEG: enough for matching, small enough for mobile data. */
    private static byte[] smallJpeg(byte[] nv21, int width, int height) throws Exception {
        ByteArrayOutputStream full = new ByteArrayOutputStream();
        new YuvImage(nv21, ImageFormat.NV21, width, height, null).compressToJpeg(new Rect(0, 0, width, height), 75, full);
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inSampleSize = Math.max(1, width / 640);
        Bitmap small = BitmapFactory.decodeByteArray(full.toByteArray(), 0, full.size(), options);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        small.compress(Bitmap.CompressFormat.JPEG, 80, out);
        small.recycle();
        return out.toByteArray();
    }
}
