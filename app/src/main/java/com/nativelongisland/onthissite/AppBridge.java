package com.nativelongisland.onthissite;

import android.Manifest;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

class AppBridge {
    private final MainActivity activity;

    AppBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public String getBuildId() {
        return MainActivity.APP_VERSION;
    }

    @JavascriptInterface
    public String getVersionName() {
        return activity.packageVersionName();
    }

    @JavascriptInterface
    public long getVersionCode() {
        return activity.packageVersionCode();
    }

    @JavascriptInterface
    public boolean isDebugBuild() {
        return BuildConfig.DEBUG;
    }

    @JavascriptInterface
    public void refreshNow() {
        activity.runOnUiThread(activity::refreshApp);
    }

    @JavascriptInterface
    public boolean showNotification(String title, String body) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            return activity.showNearbyNotification(title, body);
        }
        AtomicBoolean sent = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);
        activity.runOnUiThread(() -> {
            sent.set(activity.showNearbyNotification(title, body));
            latch.countDown();
        });
        try {
            latch.await(1500, TimeUnit.MILLISECONDS);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
        }
        return sent.get();
    }

    @JavascriptInterface
    public void takePlantPhoto() {
        activity.runOnUiThread(() -> {
            activity.suppressResumeRefreshAfterPermissionPrompt();
            if (!activity.hasCameraPermission()) {
                activity.requestPermissions(
                    new String[] { Manifest.permission.CAMERA },
                    MainActivity.PLANT_BRIDGE_CAMERA_PERMISSION_REQUEST
                );
                return;
            }
            activity.launchPlantBridgeCamera();
        });
    }
}
