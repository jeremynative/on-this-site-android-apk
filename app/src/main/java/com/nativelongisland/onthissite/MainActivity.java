package com.nativelongisland.onthissite;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private static final int LOCATION_REQUEST = 41;
    private static final int CAMERA_REQUEST = 42;
    private static final long RESUME_REFRESH_COOLDOWN_MS = 1500;
    private static final String APP_VERSION = "20260519-system-bar-safe-area";
    private static final String APP_BASE_URL =
        "https://nativelongisland.com/archive-test/mobile-app-live.html";

    private WebView webView;
    private GeolocationPermissions.Callback pendingLocationCallback;
    private String pendingLocationOrigin;
    private PermissionRequest pendingCameraRequest;
    private boolean created;
    private long lastRefreshAt;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(0, 0, 0, insets.getSystemWindowInsetBottom());
            return insets;
        });
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.clearCache(true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                    return;
                }
                pendingLocationOrigin = origin;
                pendingLocationCallback = callback;
                requestPermissions(new String[] {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                }, LOCATION_REQUEST);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                for (String resource : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                        if (hasCameraPermission()) {
                            request.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
                            return;
                        }
                        pendingCameraRequest = request;
                        requestPermissions(new String[] { Manifest.permission.CAMERA }, CAMERA_REQUEST);
                        return;
                    }
                }
                request.deny();
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternallyWhenNeeded(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openExternallyWhenNeeded(Uri.parse(url));
            }
        });

        refreshApp();
        created = true;
    }

    private String freshAppUrl() {
        return APP_BASE_URL + "?app-version=" + APP_VERSION + "&refresh=" + System.currentTimeMillis();
    }

    private void refreshApp() {
        if (webView == null) return;
        lastRefreshAt = System.currentTimeMillis();
        webView.clearCache(true);
        webView.loadUrl(freshAppUrl());
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (!created) return;
        long now = System.currentTimeMillis();
        if (now - lastRefreshAt > RESUME_REFRESH_COOLDOWN_MS) {
            refreshApp();
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        refreshApp();
    }

    private boolean openExternallyWhenNeeded(Uri uri) {
        String host = uri.getHost();
        String path = uri.getPath();
        boolean isArchiveApp = "nativelongisland.com".equalsIgnoreCase(host)
            && path != null
            && ("/archive-test/mobile-app-live.html".equals(path)
                || "/archive-test/native-long-island-staging-site-20260516-100502/mobile-app-live.html".equals(path));
        if (isArchiveApp) return false;

        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        startActivity(intent);
        return true;
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasCameraPermission() {
        return checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        boolean granted = false;
        for (int result : grantResults) {
            if (result == PackageManager.PERMISSION_GRANTED) {
                granted = true;
                break;
            }
        }

        if (requestCode == LOCATION_REQUEST && pendingLocationCallback != null) {
            pendingLocationCallback.invoke(pendingLocationOrigin, granted, false);
            pendingLocationCallback = null;
            pendingLocationOrigin = null;
            return;
        }

        if (requestCode == CAMERA_REQUEST && pendingCameraRequest != null) {
            if (granted) {
                pendingCameraRequest.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
            } else {
                pendingCameraRequest.deny();
            }
            pendingCameraRequest = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }
}
