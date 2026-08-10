package com.nativelongisland.onthissite;

import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import android.webkit.JavascriptInterface;

class StoryBridge {
    private static final int MAX_STORY_BASE64_CHARS = 48 * 1024 * 1024;
    private final MainActivity activity;

    StoryBridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void saveVideo(String token, String base64Video, String filename, String mimeType) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> {
            try {
                if (base64Video == null || base64Video.isEmpty()) {
                    throw new IllegalArgumentException("The story video was empty.");
                }
                if (base64Video.length() > MAX_STORY_BASE64_CHARS) {
                    throw new IllegalArgumentException("The story video is too large to save safely.");
                }
                activity.lastStoryVideoMimeType = activity.safeMimeType(mimeType);
                String safeName = activity.safeStoryFilename(filename);
                byte[] bytes = Base64.decode(base64Video, Base64.DEFAULT);
                activity.lastStoryVideoUri = activity.saveStoryVideo(bytes, safeName, activity.lastStoryVideoMimeType);
                activity.notifyStorySaved(true, "Saved to Movies/On This Site.", activity.lastStoryVideoUri.toString());
            } catch (Exception error) {
                activity.notifyStorySaved(false, error.getMessage(), "");
            }
        });
    }

    @JavascriptInterface
    public void openLastVideo(String token) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> {
            Uri uri = activity.lastStoryVideoUri;
            if (uri == null) {
                activity.notifyStorySaved(false, "No story video has been saved yet.", "");
                return;
            }
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, activity.lastStoryVideoMimeType);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(Intent.createChooser(intent, "Open story video"));
        });
    }

    @JavascriptInterface
    public void shareLastVideo(String token) {
        if (!activity.validBridgeToken(token)) return;
        activity.runOnUiThread(() -> {
            Uri uri = activity.lastStoryVideoUri;
            if (uri == null) {
                activity.notifyStorySaved(false, "No story video has been saved yet.", "");
                return;
            }
            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType(activity.lastStoryVideoMimeType);
            intent.putExtra(Intent.EXTRA_STREAM, uri);
            intent.putExtra(Intent.EXTRA_TEXT, "Recorded with On This Site.");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(Intent.createChooser(intent, "Share story video"));
        });
    }
}
