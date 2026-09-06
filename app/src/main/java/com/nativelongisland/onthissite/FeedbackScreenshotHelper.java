package com.nativelongisland.onthissite;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Rect;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.PixelCopy;
import android.view.View;
import java.io.ByteArrayOutputStream;
import java.util.function.BiConsumer;

/** Copies only this app's visible content, including the native map TextureView. */
final class FeedbackScreenshotHelper {
    static void capture(Activity activity, View content, BiConsumer<String, String> result) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || content.getWidth() < 1 || content.getHeight() < 1) {
            result.accept("", "Screen capture is unavailable. Upload a screenshot instead.");
            return;
        }
        int[] location = new int[2];
        content.getLocationInWindow(location);
        Rect bounds = new Rect(location[0], location[1], location[0] + content.getWidth(), location[1] + content.getHeight());
        float scale = Math.min(1f, 1280f / Math.max(bounds.width(), bounds.height()));
        Bitmap bitmap = Bitmap.createBitmap(Math.max(1, Math.round(bounds.width() * scale)), Math.max(1, Math.round(bounds.height() * scale)), Bitmap.Config.ARGB_8888);
        try {
            PixelCopy.request(activity.getWindow(), bounds, bitmap, status -> {
                String data = "", error = "";
                try {
                    if (status != PixelCopy.SUCCESS) throw new IllegalStateException("Capture unavailable");
                    ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                    if (!bitmap.compress(Bitmap.CompressFormat.JPEG, 85, bytes)) throw new IllegalStateException("Capture encoding failed");
                    data = Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP);
                } catch (Exception ignored) {
                    error = "Could not capture the screen. Try again or upload a screenshot.";
                } finally {
                    bitmap.recycle();
                }
                result.accept(data, error);
            }, new Handler(Looper.getMainLooper()));
        } catch (Exception ignored) {
            bitmap.recycle();
            result.accept("", "Could not capture the screen. Try again or upload a screenshot.");
        }
    }
}
