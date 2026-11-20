package com.nativelongisland.onthissite;

import com.google.ar.core.Anchor;

/**
 * A photo fixed in AR at the spot it was taken, for everyone: an admin holds it up where the
 * original was taken, anchors it, and the anchor is saved as an ARCore Cloud Anchor (kept a year)
 * with the photo in Directus (ar_photo_anchors). Every phone with full AR nearby resolves the same
 * Cloud Anchor, so the photo appears in the same place, and its Then / Now slider fades between the
 * photo and the place today.
 */
final class ArPhotoAnchor {
    static final String DRAW_PREFIX = "photo:";
    // The longest a Cloud Anchor can be kept (keyless authorization); it is placed again after that.
    static final int TTL_DAYS = 365;

    enum State { RESOLVING, SHOWN, NOT_FOUND, SCANNING, HOSTING, SAVING, SAVE_FAILED }

    private static int nextId;
    final String drawId = DRAW_PREFIX + (++nextId);
    String recordId = "";
    String cloudAnchorId = "";
    String image = "";
    String imageId = "";
    String title = "";
    String caption = "";
    String credit = "";
    String dateLabel = "";
    float width = 1f;
    float height = 0.75f;
    // 1 shows the photo (then); 0 shows the place as it is now through it.
    float alpha = 1f;
    double headingDeg = Double.NaN;
    Anchor anchor;
    State state = State.RESOLVING;
    String message = "";
    String requestId = "";
    boolean removed;

    String texture() {
        return "photo-tex:" + image;
    }

    static ArPhotoAnchor from(ArScene.PlacedPhoto info) {
        ArPhotoAnchor photo = new ArPhotoAnchor();
        photo.recordId = info.id;
        photo.cloudAnchorId = info.cloudAnchorId;
        photo.image = info.image;
        photo.title = info.title;
        photo.caption = info.caption;
        photo.credit = info.credit;
        photo.dateLabel = info.dateLabel;
        photo.width = info.widthM;
        photo.height = info.heightM;
        return photo;
    }

    static ArPhotoAnchor placing(ArScene.AdminPhoto asset, float width, float aspect) {
        ArPhotoAnchor photo = new ArPhotoAnchor();
        photo.image = asset.image;
        photo.imageId = asset.id;
        photo.title = asset.title;
        photo.width = width;
        photo.height = width * (aspect > 0f ? aspect : 0.75f);
        photo.state = State.SCANNING;
        return photo;
    }

    /** A plain explanation of why a Cloud Anchor couldn't be saved or found. */
    static String errorMessage(Anchor.CloudAnchorState state) {
        String name = state == null ? "" : state.name();
        switch (name) {
            case "ERROR_NOT_AUTHORIZED":
                return "Cloud Anchors aren't switched on for this app yet (Google Cloud: the ARCore API and the app's key).";
            case "ERROR_RESOURCE_EXHAUSTED":
                return "Google's anchor service is busy for this app. Try again later.";
            case "ERROR_HOSTING_DATASET_PROCESSING_FAILED":
                return "Not enough detail to save the spot. Walk slowly a few steps to each side, keeping the photo in view, and try again.";
            case "ERROR_CLOUD_ID_NOT_FOUND":
                return "This photo's spot has expired or was removed.";
            case "ERROR_RESOLVING_SDK_VERSION_TOO_OLD":
            case "ERROR_RESOLVING_SDK_VERSION_TOO_NEW":
                return "Update the app to see this photo.";
            default:
                return "Couldn't reach Google's anchor service. Check the connection and try again.";
        }
    }
}
