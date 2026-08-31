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
    public boolean hasLocationPermission() {
        return activity.hasLocationPermission();
    }

    @JavascriptInterface
    public void syncNativeMapViewport(
        String token,
        double left,
        double top,
        double width,
        double height,
        double bottomOcclusion,
        double viewportWidth,
        double viewportHeight,
        boolean visible
    ) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> activity.syncNativeMapViewport(
            left,
            top,
            width,
            height,
            bottomOcclusion,
            viewportWidth,
            viewportHeight,
            visible
        ));
    }

    @JavascriptInterface
    public void syncNativeMapTouchRegions(
        String token,
        String regionsJson,
        double viewportWidth,
        double viewportHeight
    ) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> activity.syncNativeMapTouchRegions(
            regionsJson,
            viewportWidth,
            viewportHeight
        ));
    }

    @JavascriptInterface
    public void syncNativeMapState(String token, String stateJson) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> activity.syncNativeMapState(stateJson));
    }

    @JavascriptInterface
    public void syncNativeMapTransientState(String token, String stateJson) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> activity.syncNativeMapTransientState(stateJson));
    }

    @JavascriptInterface
    public void syncNativeMapMovingFeatures(String token, String featuresJson) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> activity.syncNativeMapMovingFeatures(featuresJson));
    }

    @JavascriptInterface
    public void syncNativeMapCamera(String token, double longitude, double latitude, double zoom) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> activity.syncNativeMapCamera(longitude, latitude, zoom));
    }

    @JavascriptInterface
    public void syncNativeMapCameraPose(String token, double longitude, double latitude, double zoom, double bearing, double tilt) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> activity.syncNativeMapCamera(longitude, latitude, zoom, bearing, tilt));
    }

    @JavascriptInterface
    public boolean runNativeMapGestureDiagnostic(String token, String gestureName) {
        if (!BuildConfig.DEBUG || !activity.validBridgeToken(token)) return false;
        if (Looper.myLooper() == Looper.getMainLooper()) return activity.runNativeMapGestureDiagnostic(gestureName);
        AtomicBoolean completed = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);
        activity.runOnUiThread(() -> {
            completed.set(activity.runNativeMapGestureDiagnostic(gestureName));
            latch.countDown();
        });
        try {
            latch.await(2, TimeUnit.SECONDS);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
        }
        return completed.get();
    }

    @JavascriptInterface
    public float getSafeInsetTop() {
        return activity.safeInsetTopCss();
    }

    @JavascriptInterface
    public float getSafeInsetRight() {
        return activity.safeInsetRightCss();
    }

    @JavascriptInterface
    public float getSafeInsetBottom() {
        return activity.safeInsetBottomCss();
    }

    @JavascriptInterface
    public float getSafeInsetLeft() {
        return activity.safeInsetLeftCss();
    }

    @JavascriptInterface
    public void refreshNow(String token) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(activity::refreshApp);
    }

    @JavascriptInterface
    public boolean showNotification(String token, String title, String body) {
        if (!activity.validBridgeToken(token)) return false;
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
    public boolean isInAppGoogleNavigationAvailable(String token) {
        return activity.validBridgeToken(token) && activity.isInAppGoogleNavigationAvailable();
    }

    @JavascriptInterface
    public boolean startInAppGoogleNavigation(
        String token,
        String title,
        String slug,
        double latitude,
        double longitude
    ) {
        if (!activity.validBridgeToken(token)) return false;
        if (Looper.myLooper() == Looper.getMainLooper()) {
            return activity.startInAppGoogleNavigation(title, slug, latitude, longitude);
        }
        AtomicBoolean opened = new AtomicBoolean(false);
        CountDownLatch latch = new CountDownLatch(1);
        activity.runOnUiThread(() -> {
            opened.set(activity.startInAppGoogleNavigation(title, slug, latitude, longitude));
            latch.countDown();
        });
        try {
            latch.await(1500, TimeUnit.MILLISECONDS);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
        }
        return opened.get();
    }

    @JavascriptInterface
    public void takePlantPhoto(String token) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> {
            if (!activity.hasCameraPermission()) {
                activity.beginRuntimePermissionPrompt();
                activity.requestPermissions(
                    new String[] { Manifest.permission.CAMERA },
                    MainActivity.PLANT_BRIDGE_CAMERA_PERMISSION_REQUEST
                );
                return;
            }
            activity.suppressResumeRefreshAfterPermissionPrompt();
            activity.launchPlantBridgeCamera();
        });
    }

    @JavascriptInterface
    public void takeCommentPhoto(String token) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> {
            if (!activity.hasCameraPermission()) {
                activity.beginRuntimePermissionPrompt();
                activity.requestPermissions(
                    new String[] { Manifest.permission.CAMERA },
                    MainActivity.COMMENT_BRIDGE_CAMERA_PERMISSION_REQUEST
                );
                return;
            }
            activity.suppressResumeRefreshAfterPermissionPrompt();
            activity.launchCommentBridgeCamera();
        });
    }

    @JavascriptInterface
    public void chooseCommentPhoto(String token) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(activity::launchCommentBridgePicker);
    }

    @JavascriptInterface
    public boolean isPlayBillingReady(String token) {
        return activity.validBridgeToken(token) && activity.isPlayBillingReady();
    }

    @JavascriptInterface
    public boolean isGooglePlayInstall(String token) {
        return activity.validBridgeToken(token) && activity.isGooglePlayInstall();
    }

    @JavascriptInterface
    public void queryPlayProducts(String token, String productType, String productIdsJson) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> activity.queryPlayProducts(productType, productIdsJson));
    }

    @JavascriptInterface
    public void purchasePlayProduct(String token, String productId, String productType, String obfuscatedAccountId) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> activity.purchasePlayProduct(productId, productType, obfuscatedAccountId));
    }

    @JavascriptInterface
    public void restorePlayPurchases(String token) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(activity::restorePlayPurchases);
    }

    @JavascriptInterface
    public void completePlayPurchase(String token, String purchaseToken, String productType, boolean consume) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> activity.completePlayPurchase(purchaseToken, productType, consume));
    }
}
