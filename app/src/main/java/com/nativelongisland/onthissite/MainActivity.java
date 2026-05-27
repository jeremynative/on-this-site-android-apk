package com.nativelongisland.onthissite;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.util.HashMap;
import java.util.Map;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final int LOCATION_REQUEST = 41;
    private static final int CAMERA_REQUEST = 42;
    private static final int FILE_CHOOSER_REQUEST = 43;
    private static final int PHOTO_CAMERA_REQUEST = 44;
    private static final int PLANT_BRIDGE_CAMERA_REQUEST = 45;
    private static final int PLANT_BRIDGE_CAMERA_PERMISSION_REQUEST = 46;
    private static final long PERMISSION_RESUME_GRACE_MS = 45000;
    private static final String APP_VERSION = "20260527-stable-signing-23";
    private static final String PREFS_NAME = "on_this_site_native_state";
    private static final String PREF_PENDING_PLANT_URI = "pending_plant_camera_uri";
    private static final String APP_BASE_URL =
        "https://nativelongisland.com/archive-test/mobile-app-live.html";

    private WebView webView;
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
    private boolean wasStopped;
    private long suppressResumeRefreshUntil;
    private Uri lastStoryVideoUri;
    private String lastStoryVideoMimeType = "video/webm";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(0, insets.getSystemWindowInsetTop(), 0, insets.getSystemWindowInsetBottom());
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
        webView.addJavascriptInterface(new AppBridge(), "AndroidApp");
        webView.addJavascriptInterface(new StoryBridge(), "AndroidStory");
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
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openExternallyWhenNeeded(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openExternallyWhenNeeded(Uri.parse(url));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                dispatchPendingPlantPhoto();
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
            pendingCameraCaptureUri = createPlantPhotoUri();
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

    private class AppBridge {
        @JavascriptInterface
        public String getBuildId() {
            return APP_VERSION;
        }

        @JavascriptInterface
        public String getVersionName() {
            return packageVersionName();
        }

        @JavascriptInterface
        public long getVersionCode() {
            return packageVersionCode();
        }

        @JavascriptInterface
        public void refreshNow() {
            runOnUiThread(() -> refreshApp());
        }

        @JavascriptInterface
        public void takePlantPhoto() {
            runOnUiThread(() -> {
                suppressResumeRefreshAfterPermissionPrompt();
                if (!hasCameraPermission()) {
                    requestPermissions(new String[] { Manifest.permission.CAMERA }, PLANT_BRIDGE_CAMERA_PERMISSION_REQUEST);
                    return;
                }
                launchPlantBridgeCamera();
            });
        }
    }

    private class StoryBridge {
        @JavascriptInterface
        public void saveVideo(String base64Video, String filename, String mimeType) {
            runOnUiThread(() -> {
                try {
                    lastStoryVideoMimeType = safeMimeType(mimeType);
                    String safeName = safeStoryFilename(filename);
                    byte[] bytes = Base64.decode(base64Video, Base64.DEFAULT);
                    lastStoryVideoUri = saveStoryVideo(bytes, safeName, lastStoryVideoMimeType);
                    notifyStorySaved(true, "Saved to Movies/On This Site.", lastStoryVideoUri.toString());
                } catch (Exception error) {
                    notifyStorySaved(false, error.getMessage(), "");
                }
            });
        }

        @JavascriptInterface
        public void openLastVideo() {
            runOnUiThread(() -> {
                if (lastStoryVideoUri == null) {
                    notifyStorySaved(false, "No story video has been saved yet.", "");
                    return;
                }
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(lastStoryVideoUri, lastStoryVideoMimeType);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(Intent.createChooser(intent, "Open story video"));
            });
        }

        @JavascriptInterface
        public void shareLastVideo() {
            runOnUiThread(() -> {
                if (lastStoryVideoUri == null) {
                    notifyStorySaved(false, "No story video has been saved yet.", "");
                    return;
                }
                Intent intent = new Intent(Intent.ACTION_SEND);
                intent.setType(lastStoryVideoMimeType);
                intent.putExtra(Intent.EXTRA_STREAM, lastStoryVideoUri);
                intent.putExtra(Intent.EXTRA_TEXT, "Recorded with On This Site.");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(Intent.createChooser(intent, "Share story video"));
            });
        }
    }

    private Uri saveStoryVideo(byte[] bytes, String filename, String mimeType) throws Exception {
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

    private String safeStoryFilename(String filename) {
        String value = filename == null ? "" : filename.replaceAll("[^A-Za-z0-9._-]+", "-");
        if (value.length() < 5) value = "on-this-site-ar-story.webm";
        if (!value.toLowerCase().endsWith(".webm")) value = value + ".webm";
        return value;
    }

    private String safeMimeType(String mimeType) {
        if (mimeType != null && mimeType.startsWith("video/")) return mimeType;
        return "video/webm";
    }

    private void notifyStorySaved(boolean ok, String message, String uri) {
        if (webView == null) return;
        String safeMessage = jsString(message == null ? "" : message);
        String safeUri = jsString(uri == null ? "" : uri);
        webView.evaluateJavascript(
            "window.onAndroidStorySaved && window.onAndroidStorySaved(" + ok + "," + safeMessage + "," + safeUri + ")",
            null
        );
    }

    private String jsString(String value) {
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

    private void refreshApp() {
        if (webView == null) return;
        lastRefreshAt = System.currentTimeMillis();
        webView.clearCache(true);
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-cache, no-store, max-age=0");
        headers.put("Pragma", "no-cache");
        webView.loadUrl(freshAppUrl(), headers);
    }

    private Uri createPlantPhotoUri() {
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, "on-this-site-plant-" + System.currentTimeMillis() + ".jpg");
        values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
        values.put(MediaStore.Images.Media.DATE_ADDED, System.currentTimeMillis() / 1000);
        values.put(MediaStore.Images.Media.DATE_TAKEN, System.currentTimeMillis());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            values.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/On This Site");
            values.put(MediaStore.Images.Media.IS_PENDING, 1);
        }
        return getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
    }

    private void markPlantPhotoReady(Uri uri) {
        if (uri == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return;
        ContentValues ready = new ContentValues();
        ready.put(MediaStore.Images.Media.IS_PENDING, 0);
        getContentResolver().update(uri, ready, null, null);
    }

    private void suppressResumeRefreshAfterPermissionPrompt() {
        suppressResumeRefreshUntil = System.currentTimeMillis() + PERMISSION_RESUME_GRACE_MS;
    }

    private String packageVersionName() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception error) {
            return "0.0.0";
        }
    }

    private long packageVersionCode() {
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

    private void launchPlantBridgeCamera() {
        try {
            pendingPlantBridgeCameraUri = createPlantPhotoUri();
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
            markPlantPhotoReady(uri);
            byte[] bytes = compressedJpegBytes(uri);
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

    private byte[] compressedJpegBytes(Uri uri) throws Exception {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        try (InputStream input = getContentResolver().openInputStream(uri)) {
            BitmapFactory.decodeStream(input, null, bounds);
        }
        int sample = 1;
        int largest = Math.max(bounds.outWidth, bounds.outHeight);
        while (largest / sample > 1024) sample *= 2;

        BitmapFactory.Options decode = new BitmapFactory.Options();
        decode.inSampleSize = sample;
        Bitmap bitmap;
        try (InputStream input = getContentResolver().openInputStream(uri)) {
            bitmap = BitmapFactory.decodeStream(input, null, decode);
        }
        if (bitmap == null) throw new Exception("Could not read the photo.");

        int quality = 78;
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        do {
            output.reset();
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, output);
            quality -= 10;
        } while (output.size() > 900 * 1024 && quality >= 38);
        bitmap.recycle();
        if (output.size() > 900 * 1024) throw new Exception("Photo is too large. Try a closer crop.");
        return output.toByteArray();
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
                markPlantPhotoReady(pendingCameraCaptureUri);
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


