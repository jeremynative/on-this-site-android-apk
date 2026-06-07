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
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
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
    private static final long PERMISSION_RESUME_GRACE_MS = 45000;
    private static final long MAP_TAP_BRIDGE_DELAY_MS = 90;
    private static final String NEARBY_NOTIFICATION_CHANNEL_ID = "nearby_sites";
    static final String APP_VERSION = "20260607-mobile-layer-menu";
    private static final String PREFS_NAME = "on_this_site_native_state";
    private static final String PREF_PENDING_PLANT_URI = "pending_plant_camera_uri";
    private static final String APP_BASE_URL =
        "https://nativelongisland.com/mobile-app-live.html";

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
    private long stoppedAt;
    private float webTouchStartX;
    private float webTouchStartY;
    private long webTouchStartedAt;
    private boolean wasStopped;
    private long suppressResumeRefreshUntil;
    private boolean loadingBundledFallback;
    Uri lastStoryVideoUri;
    String lastStoryVideoMimeType = "video/webm";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
                    loadBundledFallback("main-frame-http-" + status);
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(LOG_TAG, "WebView page finished: " + url);
                if (isSiteGroundChallengeUrl(url)) {
                    loadBundledFallback("siteground-challenge");
                    return;
                }
                if (BuildConfig.DEBUG) logLoadedAppState();
                applyApkTimelineTrayFix();
                dispatchPendingPlantPhoto();
                hideLoadingCover();
            }
        });

        if (savedInstanceState != null) {
            restorePendingPlantCameraUri();
            webView.restoreState(savedInstanceState);
            lastRefreshAt = System.currentTimeMillis();
            suppressResumeRefreshAfterPermissionPrompt();
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
        if (loadingCover == null || loadingCover.getVisibility() != View.VISIBLE) return;
        loadingCover.animate()
            .alpha(0f)
            .setDuration(180)
            .withEndAction(() -> loadingCover.setVisibility(View.GONE))
            .start();
    }

    private WebResourceResponse bundledAppResponse(Uri uri) {
        if (uri == null) return null;
        if (!"nativelongisland.com".equalsIgnoreCase(uri.getHost())) return null;
        String path = uri.getPath();
        String assetName;
        String mimeType;
        if (loadingBundledFallback && "/mobile-app-live.html".equals(path)) {
            assetName = "mobile-app-live.html";
            mimeType = "text/html";
        } else if (loadingBundledFallback && "/mobile-app.html".equals(path)) {
            assetName = "mobile-app.html";
            mimeType = "text/html";
        } else if ("/long-island-land-mask.geojson".equals(path)) {
            assetName = "long-island-land-mask.geojson";
            mimeType = "application/geo+json";
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
        if (!"mobile-app.html".equals(assetName) && !"mobile-app-live.html".equals(assetName)) return getAssets().open(assetName);
        return new ByteArrayInputStream(bundledMobileHtml(assetName).getBytes(StandardCharsets.UTF_8));
    }

    private String bundledMobileHtml() throws IOException {
        return bundledMobileHtml("mobile-app-live.html");
    }

    private String bundledMobileHtml(String assetName) throws IOException {
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
        String html = new String(output.toByteArray(), StandardCharsets.UTF_8);
        if (BuildConfig.MAPBOX_TOKEN != null && !BuildConfig.MAPBOX_TOKEN.isEmpty()) {
            html = html.replace("__NLI_MAPBOX_TOKEN__", BuildConfig.MAPBOX_TOKEN);
        }
        html = html.replace("</head>", androidApkStartupScript() + "</head>");
        return html;
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

    private String androidApkStartupScript() {
        String script = "(function(){"
            + "if(window.__nliAndroidGeoGateInstalled)return;"
            + "window.__nliAndroidGeoGateInstalled=true;"
            + "window.__nliAllowGeoUntil=Date.now()+120000;"
            + "function allowGeo(){window.__nliAllowGeoUntil=Date.now()+30000;}"
            + "document.addEventListener('click',function(event){"
                + "var target=event.target&&event.target.closest&&event.target.closest('#locate,#suggest-use-location,[data-allow-geolocation]');"
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
            cacheAndroidSearchResultTap(event);
            return;
        }
        if (event.getActionMasked() != MotionEvent.ACTION_UP) return;
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
        lastRefreshAt = System.currentTimeMillis();
        loadingBundledFallback = false;
        loadBundledFallback("startup-live-shell");
    }

    private void loadBundledFallback(String reason) {
        if (webView == null || loadingBundledFallback) return;
        loadingBundledFallback = true;
        Log.w(LOG_TAG, "Loading bundled mobile archive fallback: " + reason);
        String appUrl = freshAppUrl();
        Thread loader = new Thread(() -> {
            String html;
            try {
                html = bundledMobileHtml();
            } catch (IOException error) {
                Log.e(LOG_TAG, "Bundled mobile archive could not be prepared.", error);
                runOnUiThread(() -> {
                    if (webView != null && loadingBundledFallback) webView.loadUrl(appUrl);
                });
                return;
            }
            runOnUiThread(() -> {
                if (webView == null || !loadingBundledFallback) return;
                webView.loadDataWithBaseURL(appUrl, html, "text/html", "UTF-8", appUrl);
            });
        }, "ots-bundled-mobile-loader");
        loader.start();
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
                + "position:relative!important;grid-template-rows:auto auto minmax(0,1fr) auto!important;"
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
                + "grid-template-columns:36px minmax(0,1fr) 36px!important;max-height:none!important;overflow:auto!important;"
            + "}"
            + "html.android-apk-timeline-fix.panel-timeline .timeline-current,"
            + "html.android-apk-timeline-fix .app.panel-timeline .timeline-current{overflow:auto!important;}"
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
        suppressResumeRefreshUntil = System.currentTimeMillis() + PERMISSION_RESUME_GRACE_MS;
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
    }

    @Override
    protected void onStart() {
        super.onStart();
        wasStopped = false;
    }

    @Override
    protected void onStop() {
        super.onStop();
        wasStopped = true;
        stoppedAt = System.currentTimeMillis();
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
        if (webView != null) webView.saveState(outState);
    }
}

