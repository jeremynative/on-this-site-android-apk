package com.nativelongisland.onthissite;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.NetworkRequest;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.MimeTypeMap;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final String LOG_TAG = "OnThisSite";
    private static final int LOCATION_REQUEST = 41;
    private static final int CAMERA_REQUEST = 42;
    private static final int FILE_CHOOSER_REQUEST = 43;
    private static final int PHOTO_CAMERA_REQUEST = 44;
    private static final int PLANT_BRIDGE_CAMERA_REQUEST = 45;
    static final int PLANT_BRIDGE_CAMERA_PERMISSION_REQUEST = 46;
    private static final int NOTIFICATION_REQUEST = 47;
    private static final long MAP_TAP_BRIDGE_DELAY_MS = 90;
    private static final String NEARBY_NOTIFICATION_CHANNEL_ID = "nearby_sites";
    static final String APP_VERSION = "20260727-apk-interaction-r10";
    // Cold first loads can spend more than eight seconds preparing the land mask and map.
    // Let the page-readiness probe finish before treating a validated connection as failed.
    private static final long LIVE_STARTUP_FALLBACK_DELAY_MS = 22000;
    private static final long APP_READINESS_RETRY_DELAY_MS = 350;
    private static final int APP_READINESS_MAX_ATTEMPTS = 60;
    private static final long VALIDATED_NETWORK_STABLE_DELAY_MS = 1500;
    private static final long NETWORK_LOSS_GRACE_DELAY_MS = 4000;
    private static final long ACTIVE_WORK_RECHECK_DELAY_MS = 15000;
    private static final long OFFLINE_COVER_REVEAL_DELAY_MS = 900;
    private static final String PREFS_NAME = "on_this_site_native_state";
    private static final String PREF_PENDING_PLANT_URI = "pending_plant_camera_uri";
    private static final String APP_BASE_URL =
        "https://directus.nativelongisland.com/app/mobile-app-live.html";
    private static final String OFFLINE_BASE_URL =
        "https://directus.nativelongisland.com/app/";

    private WebView webView;
    private View loadingCover;
    private GeolocationPermissions.Callback pendingLocationCallback;
    private String pendingLocationOrigin;
    private PermissionRequest pendingCameraRequest;
    private ValueCallback<Uri[]> pendingFileChooserCallback;
    private Uri pendingCameraCaptureUri;
    private Uri pendingPlantBridgeCameraUri;
    private boolean pendingPlantPhotoOk;
    private String pendingPlantPhotoMessage;
    private String pendingPlantPhotoBase64;
    private String pendingPlantPhotoMimeType;
    private String pendingPlantPhotoFilename;
    private boolean hasPendingPlantPhotoDelivery;
    private boolean pendingPhotoCaptureAfterPermission;
    private boolean created;
    private long lastRefreshAt;
    private float webTouchStartX;
    private float webTouchStartY;
    private long webTouchStartedAt;
    private boolean loadingBundledFallback;
    private boolean appShellLoaded;
    private int appReadinessProbeAttempts;
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback connectivityCallback;
    private boolean connectivityCallbackRegistered;
    private boolean lastValidatedNetworkState;
    private boolean networkStateInitialized;
    private boolean liveRecoveryAttemptedForCurrentNetwork;
    private final Handler startupHandler = new Handler(Looper.getMainLooper());
    private final Runnable startupFallback = () -> {
        if (webView != null && !appShellLoaded && !loadingBundledFallback) {
            loadBundledFallback("live-startup-timeout");
        }
    };
    private final Runnable validatedNetworkRecovery = () -> {
        if (webView == null
            || !hasUsableNetwork()
            || !loadingBundledFallback
            || liveRecoveryAttemptedForCurrentNetwork) return;
        captureRuntimeStateThen(() -> {
            if (webView == null
                || !hasUsableNetwork()
                || !loadingBundledFallback
                || liveRecoveryAttemptedForCurrentNetwork) return;
            liveRecoveryAttemptedForCurrentNetwork = true;
            Log.i(LOG_TAG, "Validated network is stable; recovering the live app shell.");
            refreshApp();
        });
    };
    private final Runnable unusableNetworkFallback = () -> {
        if (webView == null || hasUsableNetwork() || loadingBundledFallback) return;
        requestBundledFallbackPreservingActiveWork("validated-network-unavailable");
    };
    private final Runnable revealBundledFallback = () -> {
        if (webView != null && loadingBundledFallback) hideLoadingCover();
    };
    Uri lastStoryVideoUri;
    String lastStoryVideoMimeType = "video/webm";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true);

        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(238, 243, 237));
        webView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(0, insets.getSystemWindowInsetTop(), 0, insets.getSystemWindowInsetBottom());
            return insets;
        });
        root.addView(webView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));
        loadingCover = createLoadingCover();
        root.addView(loadingCover, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));
        setContentView(root);
        createNotificationChannel();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);
        webView.addJavascriptInterface(new AppBridge(this), "AndroidApp");
        webView.addJavascriptInterface(new StoryBridge(this), "AndroidStory");

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage message) {
                if (message != null && (BuildConfig.DEBUG
                    || message.messageLevel() == ConsoleMessage.MessageLevel.ERROR
                    || message.messageLevel() == ConsoleMessage.MessageLevel.WARNING)) {
                    Log.d(LOG_TAG, "Web console: " + message.messageLevel() + " " + message.message()
                        + " at " + message.sourceId() + ":" + message.lineNumber());
                }
                return super.onConsoleMessage(message);
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                    return;
                }
                pendingLocationOrigin = origin;
                pendingLocationCallback = callback;
                suppressResumeRefreshAfterPermissionPrompt();
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
                        suppressResumeRefreshAfterPermissionPrompt();
                        requestPermissions(new String[] { Manifest.permission.CAMERA }, CAMERA_REQUEST);
                        return;
                    }
                }
                request.deny();
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (pendingFileChooserCallback != null) {
                    pendingFileChooserCallback.onReceiveValue(null);
                }
                pendingFileChooserCallback = filePathCallback;
                suppressResumeRefreshAfterPermissionPrompt();

                if (wantsImageCapture(fileChooserParams)) {
                    if (!hasCameraPermission()) {
                        pendingPhotoCaptureAfterPermission = true;
                        requestPermissions(new String[] { Manifest.permission.CAMERA }, PHOTO_CAMERA_REQUEST);
                        return true;
                    }
                    return launchImageCaptureOrPicker(filePathCallback);
                }

                return launchFileChooserIntent(filePathCallback, fileChooserParams);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                Log.d(LOG_TAG, "WebView page started: " + url);
                if (isSiteGroundChallengeUrl(url)) {
                    if (shouldIgnoreLifecycleMainFrameReload("siteground-challenge-start")) {
                        view.stopLoading();
                        return;
                    }
                    loadBundledFallback("siteground-challenge-start");
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternallyWhenNeeded(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openExternallyWhenNeeded(Uri.parse(url));
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse bundled = bundledAppResponse(request == null ? null : request.getUrl());
                return bundled != null ? bundled : super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame()) {
                    Log.e(LOG_TAG, "Main WebView load error: " + error.getErrorCode() + " " + error.getDescription());
                    if (shouldIgnoreLifecycleMainFrameReload("main-frame-error")) return;
                    loadBundledFallback("main-frame-error");
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                if (request == null || !request.isForMainFrame() || errorResponse == null) return;
                int status = errorResponse.getStatusCode();
                if (status >= 400) {
                    Log.e(LOG_TAG, "Main WebView HTTP error: " + status);
                    if (shouldIgnoreLifecycleMainFrameReload("main-frame-http-" + status)) return;
                    loadBundledFallback("main-frame-http-" + status);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(LOG_TAG, "WebView page finished: " + url);
                if (isSiteGroundChallengeUrl(url)) {
                    if (shouldIgnoreLifecycleMainFrameReload("siteground-challenge")) return;
                    loadBundledFallback("siteground-challenge");
                    return;
                }
                if (loadingBundledFallback) hideLoadingCover();
                validateLoadedAppShell(url);
            }
        });

        registerConnectivityMonitoring();
        if (savedInstanceState != null && hasUsableNetwork()) {
            restorePendingPlantCameraUri();
            android.webkit.WebBackForwardList restoredState = webView.restoreState(savedInstanceState);
            lastRefreshAt = System.currentTimeMillis();
            suppressResumeRefreshAfterPermissionPrompt();
            if (restoredState != null && restoredState.getSize() > 0) {
                appShellLoaded = false;
                scheduleLiveStartupFallback();
            } else {
                Log.w(LOG_TAG, "Saved WebView state was empty after restore; loading app shell.");
                refreshApp();
            }
        } else {
            restorePendingPlantCameraUri();
            refreshApp();
        }
        created = true;
    }

    private View createLoadingCover() {
        TextView cover = new TextView(this);
        cover.setText("On This Site");
        cover.setTextColor(Color.rgb(18, 34, 25));
        cover.setTextSize(28);
        cover.setTypeface(Typeface.DEFAULT_BOLD);
        cover.setGravity(Gravity.CENTER);
        cover.setBackgroundColor(Color.rgb(238, 243, 237));
        cover.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        return cover;
    }

    private void hideLoadingCover() {
        startupHandler.removeCallbacks(startupFallback);
        if (loadingCover == null || loadingCover.getVisibility() != View.VISIBLE) return;
        loadingCover.animate()
            .alpha(0f)
            .setDuration(180)
            .withEndAction(() -> loadingCover.setVisibility(View.GONE))
            .start();
    }

    private void showLoadingCover(String message) {
        if (loadingCover == null) return;
        if (loadingCover instanceof TextView) {
            ((TextView) loadingCover).setText(message == null || message.trim().isEmpty()
                ? "On This Site"
                : message);
        }
        loadingCover.animate().cancel();
        loadingCover.setAlpha(1f);
        loadingCover.setVisibility(View.VISIBLE);
    }

    private WebResourceResponse bundledAppResponse(Uri uri) {
        if (uri == null) return null;
        // Live mode must use the deployed app assets so Android receives the
        // same sites, geometry, and UI as the website. Packaged assets are
        // reserved for a real network/server fallback.
        if (!loadingBundledFallback) return null;
        String host = uri.getHost();
        boolean isArchiveHost = "nativelongisland.com".equalsIgnoreCase(host)
            || "directus.nativelongisland.com".equalsIgnoreCase(host);
        if (!isArchiveHost) return null;
        String path = uri.getPath();
        String assetName;
        String mimeType;
        if ("nativelongisland.com".equalsIgnoreCase(host) && path != null && path.startsWith("/assets/") && !path.contains("..")) {
            assetName = path.substring(1);
            mimeType = mimeTypeForAsset(assetName);
        } else if (path != null && path.startsWith("/app/assets/") && !path.contains("..")) {
            assetName = path.substring("/app/".length());
            mimeType = mimeTypeForAsset(assetName);
        } else if (loadingBundledFallback && "/app/offline-app.html".equals(path)) {
            assetName = "offline-app.html";
            mimeType = "text/html";
        } else if (loadingBundledFallback && "/mobile-app-live.html".equals(path)) {
            assetName = "mobile-app-live.html";
            mimeType = "text/html";
        } else if (loadingBundledFallback && "/mobile-app.html".equals(path)) {
            assetName = "mobile-app.html";
            mimeType = "text/html";
        } else if ("/long-island-land-mask.geojson".equals(path)) {
            assetName = "long-island-land-mask.geojson";
            mimeType = "application/geo+json";
        } else if ("/app/long-island-land-mask.geojson".equals(path)) {
            assetName = "long-island-land-mask.geojson";
            mimeType = "application/geo+json";
        } else if ("/long-island-land-mask-lite.json".equals(path)) {
            assetName = "long-island-land-mask-lite.json";
            mimeType = "application/json";
        } else if ("/app/long-island-land-mask-lite.json".equals(path)) {
            assetName = "long-island-land-mask-lite.json";
            mimeType = "application/json";
        } else {
            return null;
        }
        try {
            InputStream stream = bundledAssetStream(assetName);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
            WebResourceResponse response = new WebResourceResponse(mimeType, "UTF-8", stream);
            response.setResponseHeaders(headers);
            return response;
        } catch (IOException error) {
            Log.w(LOG_TAG, "Bundled mobile archive could not be opened.", error);
            return null;
        }
    }

    private InputStream bundledAssetStream(String assetName) throws IOException {
        if ("mobile-app.html".equals(assetName) || "mobile-app-live.html".equals(assetName)) {
            return new ByteArrayInputStream(bundledMobileHtml(assetName).getBytes(StandardCharsets.UTF_8));
        }
        if ("assets/js/mobile-app.js".equals(assetName)) {
            return new ByteArrayInputStream(injectMapboxToken(readBundledTextAsset(assetName)).getBytes(StandardCharsets.UTF_8));
        }
        return getAssets().open(assetName);
    }

    private String bundledMobileHtml() throws IOException {
        return bundledMobileHtml("mobile-app.html");
    }

    private String bundledMobileHtml(String assetName) throws IOException {
        String html = injectMapboxToken(readBundledTextAsset(assetName));
        return html.replace("</head>", androidApkStartupScript() + "</head>");
    }

    private String readBundledTextAsset(String assetName) throws IOException {
        InputStream stream = getAssets().open(assetName);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int read;
        try {
            while ((read = stream.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
        } finally {
            stream.close();
        }
        return new String(output.toByteArray(), StandardCharsets.UTF_8);
    }

    private String injectMapboxToken(String content) {
        if (BuildConfig.MAPBOX_TOKEN != null && !BuildConfig.MAPBOX_TOKEN.isEmpty()) {
            return content.replace("__NLI_MAPBOX_TOKEN__", BuildConfig.MAPBOX_TOKEN);
        }
        return content;
    }

    private boolean isSiteGroundChallengeUrl(String url) {
        if (url == null || loadingBundledFallback) return false;
        Uri uri = Uri.parse(url);
        return "nativelongisland.com".equalsIgnoreCase(uri.getHost())
            && uri.getPath() != null
            && uri.getPath().startsWith("/.well-known/sgcaptcha/");
    }

    private void logLoadedAppState() {
        if (webView == null) return;
        webView.evaluateJavascript(
            "(function(){try{return JSON.stringify({readyState:document.readyState,title:document.title,bodyText:(document.body&&document.body.innerText||'').slice(0,120),hasApp:!!document.querySelector('.app'),hasMap:!!document.getElementById('map'),url:location.href});}catch(error){return 'probe-error:'+String(error&&error.message||error);}})();",
            value -> Log.d(LOG_TAG, "WebView app probe: " + value)
        );
    }

    private void validateLoadedAppShell(String url) {
        appReadinessProbeAttempts = 0;
        probeLoadedAppReadiness(url);
    }

    private void probeLoadedAppReadiness(String url) {
        if (webView == null) return;
        webView.evaluateJavascript(
            "(function(){try{"
                + "var shell=!!(document.getElementById('map')&&document.querySelector('.app'));"
                + "var loader=document.getElementById('loading-screen');"
                + "var loaderHidden=!loader||loader.hidden||loader.classList.contains('hidden');"
                + "var offline=document.body&&document.body.classList.contains('offline-text-mode');"
                + "var offlineReady=offline&&!!document.querySelector('.offline-map-index')&&!!document.querySelector('.site-card[data-slug],.site-card[data-wiki-slug]');"
                + "var onlineReady=!offline&&loaderHidden&&!!document.querySelector('.site-card[data-slug],.site-card[data-wiki-slug]')&&!!document.querySelector('#map');"
                + "return offlineReady||onlineReady?'ready':shell?'starting':'empty';"
                + "}catch(error){return 'empty:'+String(error&&error.message||error);}})();",
            value -> {
                if (BuildConfig.DEBUG) logLoadedAppState();
                if (value != null && value.contains("ready")) {
                    appShellLoaded = true;
                    applyApkTimelineTrayFix();
                    dispatchPendingPlantPhoto();
                    hideLoadingCover();
                    if (loadingBundledFallback
                        && hasUsableNetwork()
                        && !liveRecoveryAttemptedForCurrentNetwork) {
                        startupHandler.removeCallbacks(validatedNetworkRecovery);
                        startupHandler.postDelayed(
                            validatedNetworkRecovery,
                            VALIDATED_NETWORK_STABLE_DELAY_MS
                        );
                    }
                    return;
                }

                if (value != null
                    && value.contains("starting")
                    && appReadinessProbeAttempts < APP_READINESS_MAX_ATTEMPTS) {
                    appReadinessProbeAttempts += 1;
                    startupHandler.postDelayed(
                        () -> probeLoadedAppReadiness(url),
                        APP_READINESS_RETRY_DELAY_MS
                    );
                    return;
                }

                Log.w(LOG_TAG, "WebView did not produce usable archive content: " + url + " probe=" + value);
                if (!loadingBundledFallback && isNativeLongIslandUrl(url)) {
                    loadBundledFallback("app-readiness-timeout");
                    return;
                }

                // Reveal the bundled page's own error state instead of leaving
                // visitors trapped behind the native title cover.
                hideLoadingCover();
            }
        );
    }

    private boolean isNativeLongIslandUrl(String url) {
        if (url == null) return false;
        Uri uri = Uri.parse(url);
        return "nativelongisland.com".equalsIgnoreCase(uri.getHost());
    }

    private boolean hasUsableNetwork() {
        ConnectivityManager manager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (manager == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Network network = manager.getActiveNetwork();
            if (network == null) return false;
            NetworkCapabilities capabilities = manager.getNetworkCapabilities(network);
            return capabilities != null
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
                && (
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                    || capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
                    || capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
                    || capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)
                );
        }
        NetworkInfo networkInfo = manager.getActiveNetworkInfo();
        return networkInfo != null && networkInfo.isConnected();
    }

    private void registerConnectivityMonitoring() {
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (connectivityManager == null || connectivityCallbackRegistered) return;
        lastValidatedNetworkState = hasUsableNetwork();
        networkStateInitialized = true;
        connectivityCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                scheduleNetworkStateEvaluation("available");
            }

            @Override
            public void onCapabilitiesChanged(Network network, NetworkCapabilities capabilities) {
                scheduleNetworkStateEvaluation("capabilities-changed");
            }

            @Override
            public void onLost(Network network) {
                scheduleNetworkStateEvaluation("lost");
            }

            @Override
            public void onUnavailable() {
                scheduleNetworkStateEvaluation("unavailable");
            }
        };
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                connectivityManager.registerDefaultNetworkCallback(connectivityCallback);
            } else {
                NetworkRequest request = new NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build();
                connectivityManager.registerNetworkCallback(request, connectivityCallback);
            }
            connectivityCallbackRegistered = true;
        } catch (RuntimeException error) {
            connectivityCallback = null;
            Log.w(LOG_TAG, "Runtime connectivity monitoring could not be registered.", error);
        }
    }

    private void unregisterConnectivityMonitoring() {
        if (!connectivityCallbackRegistered || connectivityManager == null || connectivityCallback == null) return;
        try {
            connectivityManager.unregisterNetworkCallback(connectivityCallback);
        } catch (RuntimeException error) {
            Log.w(LOG_TAG, "Runtime connectivity monitoring was already unavailable.", error);
        } finally {
            connectivityCallbackRegistered = false;
            connectivityCallback = null;
        }
    }

    private void scheduleNetworkStateEvaluation(String reason) {
        startupHandler.postDelayed(() -> handleNetworkStateChange(reason), 250);
    }

    private void handleNetworkStateChange(String reason) {
        if (webView == null) return;
        boolean validated = hasUsableNetwork();
        if (networkStateInitialized && validated == lastValidatedNetworkState) {
            if (validated && loadingBundledFallback && !liveRecoveryAttemptedForCurrentNetwork) {
                startupHandler.removeCallbacks(validatedNetworkRecovery);
                startupHandler.postDelayed(validatedNetworkRecovery, VALIDATED_NETWORK_STABLE_DELAY_MS);
            } else if (!validated && !loadingBundledFallback) {
                startupHandler.removeCallbacks(unusableNetworkFallback);
                startupHandler.postDelayed(unusableNetworkFallback, NETWORK_LOSS_GRACE_DELAY_MS);
            }
            return;
        }
        networkStateInitialized = true;
        lastValidatedNetworkState = validated;
        startupHandler.removeCallbacks(validatedNetworkRecovery);
        startupHandler.removeCallbacks(unusableNetworkFallback);
        Log.i(LOG_TAG, "Validated network state changed to " + validated + " (" + reason + ").");
        if (validated) {
            liveRecoveryAttemptedForCurrentNetwork = false;
            startupHandler.postDelayed(validatedNetworkRecovery, VALIDATED_NETWORK_STABLE_DELAY_MS);
        } else {
            liveRecoveryAttemptedForCurrentNetwork = false;
            startupHandler.postDelayed(unusableNetworkFallback, NETWORK_LOSS_GRACE_DELAY_MS);
        }
    }

    private void requestBundledFallbackPreservingActiveWork(String reason) {
        if (webView == null || hasUsableNetwork() || loadingBundledFallback) return;
        if (!appShellLoaded) {
            loadBundledFallback(reason);
            return;
        }
        captureRuntimeStateThen(activeWork -> {
            if (webView == null || hasUsableNetwork() || loadingBundledFallback) return;
            if (activeWork) {
                Log.i(LOG_TAG, "Keeping the live shell open while active user work is present offline.");
                startupHandler.removeCallbacks(unusableNetworkFallback);
                startupHandler.postDelayed(unusableNetworkFallback, ACTIVE_WORK_RECHECK_DELAY_MS);
                return;
            }
            loadBundledFallback(reason);
        });
    }

    private void captureRuntimeStateThen(Runnable continuation) {
        captureRuntimeStateThen(activeWork -> continuation.run());
    }

    private void captureRuntimeStateThen(ActiveWorkCallback callback) {
        if (webView == null) {
            callback.onResult(false);
            return;
        }
        webView.evaluateJavascript(
            "(function(){try{"
                + "if(window.__nliCaptureAndroidLifecycleSnapshot)window.__nliCaptureAndroidLifecycleSnapshot();"
                + "var fields=Array.prototype.slice.call(document.querySelectorAll('input,textarea,select,[contenteditable=\"true\"]'));"
                + "var active=fields.some(function(el){"
                    + "if(el.disabled||el.readOnly||el.type==='hidden'||el.type==='button'||el.type==='submit'||el.type==='reset'||el.type==='search'||el.hasAttribute('data-mobile-search'))return false;"
                    + "if(el.type==='file')return !!(el.files&&el.files.length);"
                    + "if(el.type==='checkbox'||el.type==='radio')return el.checked!==el.defaultChecked;"
                    + "if(el.tagName==='SELECT')return Array.prototype.some.call(el.options,function(option){return option.selected!==option.defaultSelected;});"
                    + "if(el.isContentEditable)return String(el.textContent||'').trim().length>0;"
                    + "return String(el.value||'')!==String(el.defaultValue||'');"
                + "});"
                + "return active?'active-work':'idle';"
            + "}catch(error){return 'idle';}})();",
            value -> callback.onResult(value != null && value.contains("active-work"))
        );
    }

    private interface ActiveWorkCallback {
        void onResult(boolean activeWork);
    }

    private void scheduleLiveStartupFallback() {
        startupHandler.removeCallbacks(startupFallback);
        startupHandler.postDelayed(startupFallback, LIVE_STARTUP_FALLBACK_DELAY_MS);
    }

    private String androidApkStartupScript() {
        String script = "(function(){"
            + "if(window.__nliAndroidGeoGateInstalled)return;"
            + "window.__nliAndroidGeoGateInstalled=true;"
            + "window.NLI_APK_SNAPSHOT_MODE=true;"
            + "window.NLI_APK_OFFLINE_TEXT_MODE=true;"
            + "window.NLI_APK_FALLBACK_REASON='bundled';"
            + "window.NLI_DISABLE_DIRECTUS_RUNTIME=true;"
            + "window.NLI_DIRECTUS_PAUSED_MESSAGE='Account and community updates are unavailable while the app is offline.';"
            + "if(!window.__nliAndroidDirectusPauseInstalled&&window.fetch){"
                + "window.__nliAndroidDirectusPauseInstalled=true;"
                + "var originalFetch=window.fetch.bind(window);"
                + "window.fetch=function(input,init){"
                    + "var url='';"
                    + "try{url=String((input&&input.url)||input||'');}catch(error){url='';}"
                    + "if(url.indexOf('directus.nativelongisland.com')!==-1){"
                        + "return Promise.reject(new Error(window.NLI_DIRECTUS_PAUSED_MESSAGE));"
                    + "}"
                    + "return originalFetch(input,init);"
                + "};"
            + "}"
            + "window.__nliAllowGeoUntil=Date.now()+120000;"
            + "function allowGeo(){window.__nliAllowGeoUntil=Date.now()+30000;}"
            + "document.addEventListener('click',function(event){"
                + "var target=event.target&&event.target.closest&&event.target.closest('#locate,#mobile-map-locate,#suggest-use-location,[data-allow-geolocation]');"
                + "if(target)allowGeo();"
            + "},true);"
            + "if(!navigator.geolocation)return;"
            + "var originalGet=navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);"
            + "var originalWatch=navigator.geolocation.watchPosition.bind(navigator.geolocation);"
            + "function blocked(error){setTimeout(function(){if(error)error({code:1,message:'Location is available from the Near me button.'});},0);}"
            + "navigator.geolocation.getCurrentPosition=function(success,error,options){"
                + "if(Date.now()>window.__nliAllowGeoUntil)return blocked(error);"
                + "return originalGet(success,error,options);"
            + "};"
            + "navigator.geolocation.watchPosition=function(success,error,options){"
                + "if(Date.now()>window.__nliAllowGeoUntil){blocked(error);return 0;}"
                + "return originalWatch(success,error,options);"
            + "};"
        + "})();";
        return "<script>" + script + "</script>";
    }

    private void handleWebViewTap(MotionEvent event) {
        if (webView == null || event == null) return;
        if (event.getActionMasked() == MotionEvent.ACTION_DOWN) {
            webTouchStartX = event.getX();
            webTouchStartY = event.getY();
            webTouchStartedAt = System.currentTimeMillis();
            cacheAndroidUiOverlayTap(event);
            cacheAndroidSearchResultTap(event);
            return;
        }
        if (event.getActionMasked() != MotionEvent.ACTION_UP) return;
        cacheAndroidUiOverlayTap(event);
        float dx = event.getX() - webTouchStartX;
        float dy = event.getY() - webTouchStartY;
        if ((dx * dx + dy * dy) > 144f) return;
        if (System.currentTimeMillis() - webTouchStartedAt > 700) return;
        final float tapX = event.getX();
        final float tapY = event.getY();
        final int viewWidth = webView.getWidth();
        final int viewHeight = webView.getHeight();
        String script = "(function(){try{"
            + "if(!window.onAndroidMapTap)return 'missing-map-tap-bridge';"
            + "return String(window.onAndroidMapTap("
            + tapX + ","
            + tapY + ","
            + viewWidth + ","
            + viewHeight
            + "));"
            + "}catch(error){return 'map-tap-error:'+(error&&error.message?error.message:String(error));}})()";
        Log.d(LOG_TAG, "Scheduling WebView tap for map bridge: x=" + tapX + " y=" + tapY);
        webView.postDelayed(() -> {
            if (webView == null) return;
            Log.d(LOG_TAG, "Forwarding WebView tap to map bridge: x=" + tapX + " y=" + tapY);
            webView.evaluateJavascript(script, value -> Log.d(LOG_TAG, "Map bridge result: " + value));
        }, MAP_TAP_BRIDGE_DELAY_MS);
    }

    private String mimeTypeForAsset(String assetName) {
        String extension = MimeTypeMap.getFileExtensionFromUrl(assetName);
        String mimeType = extension == null ? null : MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension.toLowerCase());
        if (mimeType != null && !mimeType.isEmpty()) return mimeType;
        if (assetName.endsWith(".js")) return "application/javascript";
        if (assetName.endsWith(".css")) return "text/css";
        if (assetName.endsWith(".svg")) return "image/svg+xml";
        if (assetName.endsWith(".webp")) return "image/webp";
        if (assetName.endsWith(".png")) return "image/png";
        if (assetName.endsWith(".jpg") || assetName.endsWith(".jpeg")) return "image/jpeg";
        if (assetName.endsWith(".json") || assetName.endsWith(".geojson")) return "application/json";
        return "application/octet-stream";
    }

    private void cacheAndroidSearchResultTap(MotionEvent event) {
        if (webView == null || event == null) return;
        String script = "(function(){try{"
            + "if(!window.onAndroidSearchResultTapStart)return 'missing-search-result-tap-bridge';"
            + "return String(window.onAndroidSearchResultTapStart("
            + event.getX() + ","
            + event.getY() + ","
            + webView.getWidth() + ","
            + webView.getHeight()
            + "));"
            + "}catch(error){return 'search-result-tap-error:'+(error&&error.message?error.message:String(error));}})()";
        webView.evaluateJavascript(script, value -> Log.d(LOG_TAG, "Search result tap bridge result: " + value));
    }

    private void cacheAndroidUiOverlayTap(MotionEvent event) {
        if (webView == null || event == null) return;
        String script = "(function(){try{"
            + "if(!window.onAndroidUiOverlayTapStart)return 'missing-ui-overlay-tap-bridge';"
            + "return String(window.onAndroidUiOverlayTapStart("
            + event.getX() + ","
            + event.getY() + ","
            + webView.getWidth() + ","
            + webView.getHeight()
            + "));"
            + "}catch(error){return 'ui-overlay-tap-error:'+(error&&error.message?error.message:String(error));}})()";
        webView.evaluateJavascript(script, value -> Log.d(LOG_TAG, "UI overlay tap bridge result: " + value));
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent event) {
        int action = event == null ? MotionEvent.ACTION_CANCEL : event.getActionMasked();
        if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_UP) {
            handleWebViewTap(event);
        }
        return super.dispatchTouchEvent(event);
    }

    private boolean wantsImageCapture(WebChromeClient.FileChooserParams params) {
        if (params == null || !params.isCaptureEnabled()) return false;
        String[] acceptTypes = params.getAcceptTypes();
        if (acceptTypes == null || acceptTypes.length == 0) return true;
        for (String type : acceptTypes) {
            if (type == null || type.trim().isEmpty() || type.toLowerCase().startsWith("image/")) return true;
        }
        return false;
    }

    private boolean launchFileChooserIntent(ValueCallback<Uri[]> callback, WebChromeClient.FileChooserParams params) {
        Intent intent;
        try {
            intent = params == null ? imagePickerIntent() : params.createIntent();
        } catch (Exception error) {
            intent = imagePickerIntent();
        }

        try {
            startActivityForResult(intent, FILE_CHOOSER_REQUEST);
            return true;
        } catch (ActivityNotFoundException error) {
            return launchImagePickerFallback(callback);
        }
    }

    private boolean launchImageCaptureOrPicker(ValueCallback<Uri[]> callback) {
        pendingCameraCaptureUri = null;
        try {
            pendingCameraCaptureUri = MediaStorePhotoHelper.createPlantPhotoUri(this);
            if (pendingCameraCaptureUri == null) return launchImagePickerFallback(callback);

            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            intent.putExtra(MediaStore.EXTRA_OUTPUT, pendingCameraCaptureUri);
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                for (android.content.pm.ResolveInfo activity : getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)) {
                    grantUriPermission(activity.activityInfo.packageName, pendingCameraCaptureUri, Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                }
            }

            startActivityForResult(intent, FILE_CHOOSER_REQUEST);
            return true;
        } catch (Exception error) {
            if (pendingCameraCaptureUri != null) {
                getContentResolver().delete(pendingCameraCaptureUri, null, null);
                pendingCameraCaptureUri = null;
            }
            return launchImagePickerFallback(callback);
        }
    }

    private boolean launchImagePickerFallback(ValueCallback<Uri[]> callback) {
        try {
            startActivityForResult(imagePickerIntent(), FILE_CHOOSER_REQUEST);
            return true;
        } catch (ActivityNotFoundException error) {
            pendingFileChooserCallback = null;
            pendingCameraCaptureUri = null;
            callback.onReceiveValue(null);
            return false;
        }
    }

    private Intent imagePickerIntent() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("image/*");
        return intent;
    }

    Uri saveStoryVideo(byte[] bytes, String filename, String mimeType) throws Exception {
        ContentValues values = new ContentValues();
        values.put(MediaStore.Video.Media.DISPLAY_NAME, filename);
        values.put(MediaStore.Video.Media.MIME_TYPE, mimeType);
        values.put(MediaStore.Video.Media.DATE_ADDED, System.currentTimeMillis() / 1000);
        values.put(MediaStore.Video.Media.DATE_TAKEN, System.currentTimeMillis());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            values.put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/On This Site");
            values.put(MediaStore.Video.Media.IS_PENDING, 1);
        }

        Uri uri = getContentResolver().insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values);
        if (uri == null) throw new Exception("Could not create local video file.");
        try (OutputStream output = getContentResolver().openOutputStream(uri)) {
            if (output == null) throw new Exception("Could not write local video file.");
            output.write(bytes);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues ready = new ContentValues();
            ready.put(MediaStore.Video.Media.IS_PENDING, 0);
            getContentResolver().update(uri, ready, null, null);
        }
        return uri;
    }

    String safeStoryFilename(String filename) {
        String value = filename == null ? "" : filename.replaceAll("[^A-Za-z0-9._-]+", "-");
        if (value.length() < 5) value = "on-this-site-ar-story.webm";
        if (!value.toLowerCase().endsWith(".webm")) value = value + ".webm";
        return value;
    }

    String safeMimeType(String mimeType) {
        if (mimeType != null && mimeType.startsWith("video/")) return mimeType;
        return "video/webm";
    }

    void notifyStorySaved(boolean ok, String message, String uri) {
        if (webView == null) return;
        String safeMessage = jsString(message == null ? "" : message);
        String safeUri = jsString(uri == null ? "" : uri);
        webView.evaluateJavascript(
            "window.onAndroidStorySaved && window.onAndroidStorySaved(" + ok + "," + safeMessage + "," + safeUri + ")",
            null
        );
    }

    String jsString(String value) {
        return "\"" + value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r") + "\"";
    }

    private String freshAppUrl() {
        return APP_BASE_URL
            + "?app-version=" + APP_VERSION
            + "&apk-version=" + Uri.encode(packageVersionName())
            + "&apk-code=" + packageVersionCode()
            + "&refresh=" + System.currentTimeMillis();
    }

    void refreshApp() {
        if (webView == null) return;
        showLoadingCover("On This Site");
        lastRefreshAt = System.currentTimeMillis();
        appShellLoaded = false;
        loadingBundledFallback = false;
        appReadinessProbeAttempts = 0;
        startupHandler.removeCallbacks(startupFallback);
        startupHandler.removeCallbacks(validatedNetworkRecovery);
        startupHandler.removeCallbacks(unusableNetworkFallback);
        startupHandler.removeCallbacks(revealBundledFallback);
        if (!hasUsableNetwork()) {
            loadBundledFallback("offline-at-launch");
            return;
        }
        String url = freshAppUrl();
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-cache");
        webView.loadUrl(url, headers);
        scheduleLiveStartupFallback();
    }

    private boolean shouldIgnoreLifecycleMainFrameReload(String reason) {
        if (!appShellLoaded) return false;
        String currentUrl = webView == null ? "" : webView.getUrl();
        if (currentUrl == null || currentUrl.isEmpty() || "about:blank".equals(currentUrl)) return false;
        Log.w(LOG_TAG, "Ignoring non-explicit main-frame reload after app shell loaded: " + reason);
        return true;
    }

    private void loadBundledFallback(String reason) {
        if (webView == null || loadingBundledFallback) return;
        startupHandler.removeCallbacks(startupFallback);
        startupHandler.removeCallbacks(validatedNetworkRecovery);
        startupHandler.removeCallbacks(unusableNetworkFallback);
        startupHandler.removeCallbacks(revealBundledFallback);
        loadingBundledFallback = true;
        appShellLoaded = false;
        appReadinessProbeAttempts = 0;
        showLoadingCover("Opening saved map...");
        Log.w(LOG_TAG, "Loading bundled mobile archive fallback: " + reason);
        webView.stopLoading();
        try {
            String offlineHtml = readBundledTextAsset("offline-app.html");
            webView.loadDataWithBaseURL(
                OFFLINE_BASE_URL,
                offlineHtml,
                "text/html",
                "UTF-8",
                null
            );
            startupHandler.postDelayed(revealBundledFallback, OFFLINE_COVER_REVEAL_DELAY_MS);
        } catch (IOException error) {
            Log.e(LOG_TAG, "Lightweight offline archive could not be opened.", error);
            hideLoadingCover();
        }
    }

    private void applyApkTimelineTrayFix() {
        if (webView == null) return;
        String css =
            "html.android-apk-timeline-fix .mobile-timeline{"
                + "grid-template-columns:34px minmax(0,1fr) 34px!important;"
                + "gap:6px!important;align-items:stretch!important;"
                + "padding:7px 10px calc(7px + min(env(safe-area-inset-bottom),8px))!important;"
                + "min-height:0!important;max-height:clamp(92px,17dvh,132px)!important;"
                + "overflow:visible!important;box-sizing:border-box!important;"
            + "}"
            + "html.android-apk-timeline-fix .timeline-step{"
                + "align-self:stretch!important;width:34px!important;min-height:0!important;"
                + "max-height:76px!important;font-size:20px!important;"
            + "}"
            + "html.android-apk-timeline-fix .timeline-current{"
                + "position:relative!important;grid-template-rows:auto auto auto minmax(0,1fr) auto!important;"
                + "gap:3px!important;min-height:0!important;max-height:100%!important;"
                + "overflow:hidden!important;padding:7px 8px!important;box-sizing:border-box!important;"
            + "}"
            + "html.android-apk-timeline-fix .timeline-current strong{"
                + "display:-webkit-box!important;white-space:normal!important;line-height:1.15!important;"
                + "-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;"
            + "}"
            + "html.android-apk-timeline-fix .timeline-source-row{min-height:22px!important;}"
            + "html.android-apk-timeline-fix .timeline-source-row .source{display:none!important;}"
            + "html.android-apk-timeline-fix .timeline-source-popover{"
                + "right:8px!important;bottom:34px!important;z-index:6!important;"
                + "width:min(260px,calc(100vw - 40px))!important;max-width:calc(100% - 16px)!important;"
            + "}"
            + "html.android-apk-timeline-fix .timeline-current .teaser{display:none!important;}"
            + "html.android-apk-timeline-fix .timeline-actions{"
                + "display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;"
                + "gap:5px!important;"
            + "}"
            + "html.android-apk-timeline-fix .timeline-actions button{"
                + "min-width:0!important;min-height:34px!important;padding:0 8px!important;"
            + "}"
            + "html.android-apk-timeline-fix .timeline-actions [data-timeline-hide],"
            + "html.android-apk-timeline-fix .timeline-toggle{display:none!important;}"
            + "html.android-apk-timeline-fix.panel-timeline .mobile-timeline,"
            + "html.android-apk-timeline-fix .app.panel-timeline .mobile-timeline{"
                + "grid-template-columns:36px minmax(0,1fr) 36px!important;max-height:none!important;"
                + "height:100%!important;min-height:0!important;overflow:hidden!important;"
            + "}"
            + "html.android-apk-timeline-fix.panel-timeline .timeline-current,"
            + "html.android-apk-timeline-fix .app.panel-timeline .timeline-current{"
                + "height:100%!important;min-height:0!important;overflow:hidden!important;"
            + "}"
            + "html.android-apk-timeline-fix.panel-timeline .timeline-source-row .source,"
            + "html.android-apk-timeline-fix .app.panel-timeline .timeline-source-row .source{display:block!important;}"
            + "html.android-apk-timeline-fix.panel-timeline .timeline-current .teaser,"
            + "html.android-apk-timeline-fix .app.panel-timeline .timeline-current .teaser{"
                + "display:-webkit-box!important;-webkit-line-clamp:3!important;"
            + "}";
        String script = "(function(){try{"
            + "document.documentElement.classList.add('android-apk-timeline-fix');"
            + "var style=document.getElementById('android-apk-timeline-tray-fix');"
            + "if(!style){style=document.createElement('style');style.id='android-apk-timeline-tray-fix';document.head.appendChild(style);}"
            + "style.textContent=" + jsString(css) + ";"
            + "function shortenTimelineButtons(){document.querySelectorAll('[data-timeline-open]').forEach(function(button){"
                + "if(button.textContent&&button.textContent.trim()==='Full article')button.textContent='Read';"
            + "});}"
            + "shortenTimelineButtons();"
            + "if(!window.__androidApkTimelineTrayObserver&&document.body){"
                + "window.__androidApkTimelineTrayObserver=new MutationObserver(shortenTimelineButtons);"
                + "window.__androidApkTimelineTrayObserver.observe(document.body,{childList:true,subtree:true});"
            + "}"
            + "return true;"
            + "}catch(error){return false;}})();";
        webView.evaluateJavascript(script, null);
    }

    void suppressResumeRefreshAfterPermissionPrompt() {
        Log.d(LOG_TAG, "Permission prompt resume will not reload the app shell.");
    }

    String packageVersionName() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception error) {
            return "0.0.0";
        }
    }

    long packageVersionCode() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return getPackageManager().getPackageInfo(getPackageName(), 0).getLongVersionCode();
            }
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
        } catch (Exception error) {
            return 0;
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            scheduleNetworkStateEvaluation("resume");
        }
    }

    @Override
    protected void onPause() {
        if (webView != null) {
            webView.evaluateJavascript(
                "(function(){try{if(window.__nliCaptureAndroidLifecycleSnapshot){window.__nliCaptureAndroidLifecycleSnapshot();return true;}return false;}catch(error){return false;}})();",
                value -> Log.d(LOG_TAG, "Android lifecycle snapshot saved before pause: " + value)
            );
            webView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        unregisterConnectivityMonitoring();
        startupHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    void launchPlantBridgeCamera() {
        try {
            pendingPlantBridgeCameraUri = MediaStorePhotoHelper.createPlantPhotoUri(this);
            if (pendingPlantBridgeCameraUri == null) {
                queuePlantPhoto(false, "Could not create a local photo file.", "", "", "");
                return;
            }
            savePendingPlantCameraUri(pendingPlantBridgeCameraUri);
            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            intent.putExtra(MediaStore.EXTRA_OUTPUT, pendingPlantBridgeCameraUri);
            intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                for (android.content.pm.ResolveInfo activity : getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)) {
                    grantUriPermission(activity.activityInfo.packageName, pendingPlantBridgeCameraUri, Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                }
            }
            startActivityForResult(intent, PLANT_BRIDGE_CAMERA_REQUEST);
        } catch (Exception error) {
            if (pendingPlantBridgeCameraUri != null) {
                getContentResolver().delete(pendingPlantBridgeCameraUri, null, null);
                pendingPlantBridgeCameraUri = null;
            }
            clearPendingPlantCameraUri();
            queuePlantPhoto(false, "Could not open the camera.", "", "", "");
        }
    }

    private void deliverPlantBridgePhoto(Uri uri) {
        try {
            MediaStorePhotoHelper.markPlantPhotoReady(this, uri);
            byte[] bytes = MediaStorePhotoHelper.compressedJpegBytes(this, uri);
            String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
            clearPendingPlantCameraUri();
            queuePlantPhoto(true, "", base64, "image/jpeg", "plant-observation-" + System.currentTimeMillis() + ".jpg");
        } catch (Exception error) {
            clearPendingPlantCameraUri();
            queuePlantPhoto(false, error.getMessage(), "", "", "");
        }
    }

    private void savePendingPlantCameraUri(Uri uri) {
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .edit()
            .putString(PREF_PENDING_PLANT_URI, uri == null ? "" : uri.toString())
            .apply();
    }

    private void restorePendingPlantCameraUri() {
        String uri = getSharedPreferences(PREFS_NAME, MODE_PRIVATE).getString(PREF_PENDING_PLANT_URI, "");
        if (uri != null && !uri.isEmpty()) pendingPlantBridgeCameraUri = Uri.parse(uri);
    }

    private void clearPendingPlantCameraUri() {
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .edit()
            .remove(PREF_PENDING_PLANT_URI)
            .apply();
    }

    private void queuePlantPhoto(boolean ok, String message, String base64, String mimeType, String filename) {
        pendingPlantPhotoOk = ok;
        pendingPlantPhotoMessage = message == null ? "" : message;
        pendingPlantPhotoBase64 = base64 == null ? "" : base64;
        pendingPlantPhotoMimeType = mimeType == null ? "" : mimeType;
        pendingPlantPhotoFilename = filename == null ? "" : filename;
        hasPendingPlantPhotoDelivery = true;
        dispatchPendingPlantPhoto();
        if (webView != null) {
            webView.postDelayed(this::dispatchPendingPlantPhoto, 500);
            webView.postDelayed(this::dispatchPendingPlantPhoto, 1500);
            webView.postDelayed(this::dispatchPendingPlantPhoto, 3000);
        }
    }

    private void dispatchPendingPlantPhoto() {
        if (!hasPendingPlantPhotoDelivery || webView == null) return;
        notifyPlantPhoto(
            pendingPlantPhotoOk,
            pendingPlantPhotoMessage,
            pendingPlantPhotoBase64,
            pendingPlantPhotoMimeType,
            pendingPlantPhotoFilename
        );
    }

    private void notifyPlantPhoto(boolean ok, String message, String base64, String mimeType, String filename) {
        if (webView == null) return;
        webView.evaluateJavascript(
            "window.onAndroidPlantPhoto && window.onAndroidPlantPhoto("
                + ok + ","
                + jsString(message == null ? "" : message) + ","
                + jsString(base64 == null ? "" : base64) + ","
                + jsString(mimeType == null ? "" : mimeType) + ","
                + jsString(filename == null ? "" : filename) + ")",
            value -> {
                if ("true".equals(value)) {
                    hasPendingPlantPhotoDelivery = false;
                    pendingPlantPhotoBase64 = "";
                }
            }
        );
    }

    private boolean openExternallyWhenNeeded(Uri uri) {
        String host = uri.getHost();
        String path = uri.getPath();
        boolean isArchiveApp = "nativelongisland.com".equalsIgnoreCase(host);
        if (isArchiveApp) return false;

        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        startActivity(intent);
        return true;
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    boolean hasCameraPermission() {
        return checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasNotificationPermission() {
        return Build.VERSION.SDK_INT < 33
            || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationChannel channel = new NotificationChannel(
            NEARBY_NOTIFICATION_CHANNEL_ID,
            "Nearby sites",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("Nearby On This Site visit reminders");
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.createNotificationChannel(channel);
    }

    boolean showNearbyNotification(String title, String body) {
        if (!hasNotificationPermission()) {
            if (Build.VERSION.SDK_INT >= 33) {
                suppressResumeRefreshAfterPermissionPrompt();
                requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, NOTIFICATION_REQUEST);
            }
            return false;
        }
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            1001,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
            ? new Notification.Builder(this, NEARBY_NOTIFICATION_CHANNEL_ID)
            : new Notification.Builder(this);
        Notification notification = builder
            .setSmallIcon(android.R.drawable.ic_dialog_map)
            .setContentTitle(title == null || title.isEmpty() ? "On This Site nearby" : title)
            .setContentText(body == null ? "" : body)
            .setStyle(new Notification.BigTextStyle().bigText(body == null ? "" : body))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build();
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return false;
        manager.notify(1001, notification);
        return true;
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
            suppressResumeRefreshAfterPermissionPrompt();
            pendingLocationCallback.invoke(pendingLocationOrigin, granted, false);
            pendingLocationCallback = null;
            pendingLocationOrigin = null;
            return;
        }

        if (requestCode == CAMERA_REQUEST && pendingCameraRequest != null) {
            suppressResumeRefreshAfterPermissionPrompt();
            if (granted) {
                pendingCameraRequest.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
            } else {
                pendingCameraRequest.deny();
            }
            pendingCameraRequest = null;
            return;
        }

        if (requestCode == PHOTO_CAMERA_REQUEST && pendingFileChooserCallback != null) {
            suppressResumeRefreshAfterPermissionPrompt();
            ValueCallback<Uri[]> callback = pendingFileChooserCallback;
            pendingPhotoCaptureAfterPermission = false;
            if (granted) {
                launchImageCaptureOrPicker(callback);
            } else {
                launchImagePickerFallback(callback);
            }
            return;
        }

        if (requestCode == PLANT_BRIDGE_CAMERA_PERMISSION_REQUEST) {
            suppressResumeRefreshAfterPermissionPrompt();
            if (granted) launchPlantBridgeCamera();
            else queuePlantPhoto(false, "Camera permission is needed to take a plant photo.", "", "", "");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == PLANT_BRIDGE_CAMERA_REQUEST) {
            suppressResumeRefreshAfterPermissionPrompt();
            if (pendingPlantBridgeCameraUri == null) restorePendingPlantCameraUri();
            if (resultCode == RESULT_OK && pendingPlantBridgeCameraUri != null) {
                deliverPlantBridgePhoto(pendingPlantBridgeCameraUri);
            } else {
                if (pendingPlantBridgeCameraUri != null) getContentResolver().delete(pendingPlantBridgeCameraUri, null, null);
                clearPendingPlantCameraUri();
                queuePlantPhoto(false, "Plant photo was cancelled.", "", "", "");
            }
            pendingPlantBridgeCameraUri = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || pendingFileChooserCallback == null) return;

        Uri[] results = null;
        if (resultCode == RESULT_OK) {
            results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            if ((results == null || results.length == 0) && pendingCameraCaptureUri != null) {
                MediaStorePhotoHelper.markPlantPhotoReady(this, pendingCameraCaptureUri);
                results = new Uri[] { pendingCameraCaptureUri };
            }
        } else if (pendingCameraCaptureUri != null) {
            getContentResolver().delete(pendingCameraCaptureUri, null, null);
        }
        pendingFileChooserCallback.onReceiveValue(results);
        pendingFileChooserCallback = null;
        pendingCameraCaptureUri = null;
        suppressResumeRefreshAfterPermissionPrompt();
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        webView.evaluateJavascript(
            "(function(){try{return !!(window.onAndroidBackPressed && window.onAndroidBackPressed());}catch(error){return false;}})();",
            handled -> {
                if ("true".equals(handled)) return;
                if (webView.canGoBack()) {
                    webView.goBack();
                    return;
                }
                MainActivity.super.onBackPressed();
            }
        );
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        Log.d(LOG_TAG, "Skipping oversized WebView saveState; lightweight app snapshot is stored in localStorage.");
    }
}

