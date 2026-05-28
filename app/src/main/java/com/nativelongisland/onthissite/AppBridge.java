package com.nativelongisland.onthissite;

import android.Manifest;
import android.webkit.JavascriptInterface;

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
    public void refreshNow() {
        activity.runOnUiThread(activity::refreshApp);
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
