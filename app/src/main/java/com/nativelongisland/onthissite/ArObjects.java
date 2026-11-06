package com.nativelongisland.onthissite;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageFormat;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.YuvImage;
import android.media.Image;
import android.os.Build;

import com.google.mlkit.genai.common.FeatureStatus;
import com.google.mlkit.genai.imagedescription.ImageDescriber;
import com.google.mlkit.genai.imagedescription.ImageDescriberOptions;
import com.google.mlkit.genai.imagedescription.ImageDescription;
import com.google.mlkit.genai.imagedescription.ImageDescriptionRequest;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

/**
 * Recognizes what the camera is pointed at and names it in Algonquian
 * languages: a door (a house's, a car's) is sqôt in Mohegan and quont in
 * Natick. The middle of the camera image is described on the device itself
 * (Gemini Nano through ML Kit's image description), so no picture leaves the
 * phone. It needs Android 8 and a phone with on-device AI (the Galaxy S25,
 * recent Pixels); elsewhere it stays off.
 */
final class ArObjects {
    /** A word for a thing, and the language it is in. */
    static final class Word {
        final String language;
        final String word;

        Word(String language, String word) {
            this.language = language;
            this.word = word;
        }
    }

    /** A thing the camera can name: how a description mentions it, and its words. */
    static final class Thing {
        final String key;
        final String english;
        final Pattern mention;
        final Word[] words;

        Thing(String key, String english, String mention, Word... words) {
            this.key = key;
            this.english = english;
            this.mention = Pattern.compile(mention, Pattern.CASE_INSENSITIVE);
            this.words = words;
        }

        /** "sqôt · quont" */
        String headline() {
            StringBuilder text = new StringBuilder();
            for (Word word : words) text.append(text.length() > 0 ? "  ·  " : "").append(word.word);
            return text.toString();
        }

        /** "Door. Mohegan: sqôt · Natick: quont" */
        String meaning() {
            StringBuilder text = new StringBuilder(english.substring(0, 1).toUpperCase(Locale.US) + english.substring(1) + ".");
            for (int i = 0; i < words.length; i++) text.append(i == 0 ? " " : " · ").append(words[i].language).append(": ").append(words[i].word);
            return text.toString();
        }
    }

    static final Thing[] THINGS = {
        // A house's front door, a car door, a doorway: "door" as a whole word.
        new Thing("door", "door", "\\bdoor(s|way|ways)?\\b", new Word("Mohegan", "sqôt"), new Word("Natick", "quont")),
    };

    /** The first thing a description names, or null. */
    static Thing thingIn(String description) {
        if (description == null) return null;
        for (Thing thing : THINGS) if (thing.mention.matcher(description).find()) return thing;
        return null;
    }

    interface Result {
        /** Called on the recognizer's own thread; thing is null when nothing known was named. */
        void described(String description, Thing thing);
    }

    private final ImageDescriber describer;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private volatile boolean available;
    private volatile boolean busy;
    private volatile boolean closed;

    /** The recognizer, or null on a phone that can't run it. */
    static ArObjects create(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return null;
        try {
            return new ArObjects(context.getApplicationContext());
        } catch (Throwable error) {
            android.util.Log.i("OnThisSiteAR", "On-device recognition unavailable: " + error);
            return null;
        }
    }

    private ArObjects(Context context) {
        describer = ImageDescription.getClient(ImageDescriberOptions.builder(context).build());
        worker.execute(() -> {
            try {
                int status = describer.checkFeatureStatus().get();
                // A downloadable model fetches itself with the first description.
                available = status == FeatureStatus.AVAILABLE || status == FeatureStatus.DOWNLOADABLE || status == FeatureStatus.DOWNLOADING;
                android.util.Log.i("OnThisSiteAR", "On-device recognition status " + status);
            } catch (Throwable error) {
                android.util.Log.i("OnThisSiteAR", "On-device recognition unavailable: " + error);
            }
        });
    }

    /** Whether it can look at a new picture now. */
    boolean ready() {
        return available && !busy && !closed;
    }

    boolean available() {
        return available && !closed;
    }

    /** Describes a whole picture in the background (QA: a saved photo of a door). */
    void describe(Bitmap picture, Result result) {
        if (!ready() || picture == null) return;
        busy = true;
        worker.execute(() -> finish(describeNow(picture), result));
    }

    /**
     * Describes the middle of a camera image (its NV21 bytes, copied while the
     * frame was current) in the background: cropped, turned upright and
     * described on the recognizer's thread.
     */
    void describeCenter(byte[] nv21, int width, int height, int rotationDegrees, Result result) {
        if (!ready() || nv21 == null) return;
        busy = true;
        worker.execute(() -> {
            Bitmap picture = null;
            String description = null;
            try {
                picture = centerOf(nv21, width, height, rotationDegrees, 0.6f);
                description = describeNow(picture);
            } catch (Throwable error) {
                android.util.Log.w("OnThisSiteAR", "On-device recognition failed: " + error);
            } finally {
                if (picture != null) picture.recycle();
            }
            finish(description, result);
        });
    }

    private String describeNow(Bitmap picture) {
        try {
            return describer.runInference(ImageDescriptionRequest.builder(picture).build()).get().getDescription();
        } catch (Throwable error) {
            android.util.Log.w("OnThisSiteAR", "On-device recognition failed: " + error);
            return null;
        }
    }

    private void finish(String description, Result result) {
        busy = false;
        if (!closed) result.described(description, thingIn(description));
    }

    void close() {
        closed = true;
        worker.execute(() -> {
            try {
                describer.close();
            } catch (Throwable ignored) {
                // Already gone with the activity.
            }
        });
        worker.shutdown();
    }

    /**
     * The middle of a camera image (a square, `share` of its short side), turned
     * upright for the screen: what the visitor is pointing the phone at.
     */
    static Bitmap centerOf(byte[] nv21, int width, int height, int rotationDegrees, float share) {
        int side = Math.round(Math.min(width, height) * share) & ~1;
        int left = ((width - side) / 2) & ~1;
        int top = ((height - side) / 2) & ~1;
        ByteArrayOutputStream jpeg = new ByteArrayOutputStream();
        new YuvImage(nv21, ImageFormat.NV21, width, height, null).compressToJpeg(new Rect(left, top, left + side, top + side), 88, jpeg);
        byte[] bytes = jpeg.toByteArray();
        Bitmap square = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        if (square == null || rotationDegrees % 360 == 0) return square;
        Matrix turn = new Matrix();
        turn.postRotate(rotationDegrees);
        Bitmap upright = Bitmap.createBitmap(square, 0, 0, square.getWidth(), square.getHeight(), turn, true);
        if (upright != square) square.recycle();
        return upright;
    }

    /** A YUV_420_888 camera image as NV21 bytes (Y, then V and U interleaved), whatever its strides. */
    static byte[] nv21(Image image) {
        int width = image.getWidth();
        int height = image.getHeight();
        Image.Plane[] planes = image.getPlanes();
        byte[] out = new byte[width * height * 3 / 2];
        ByteBuffer y = planes[0].getBuffer();
        int yRow = planes[0].getRowStride();
        int index = 0;
        for (int row = 0; row < height; row++) {
            y.position(row * yRow);
            y.get(out, index, width);
            index += width;
        }
        ByteBuffer u = planes[1].getBuffer();
        ByteBuffer v = planes[2].getBuffer();
        int uRow = planes[1].getRowStride();
        int uPixel = planes[1].getPixelStride();
        int vRow = planes[2].getRowStride();
        int vPixel = planes[2].getPixelStride();
        for (int row = 0; row < height / 2; row++) {
            for (int col = 0; col < width / 2; col++) {
                out[index++] = v.get(row * vRow + col * vPixel);
                out[index++] = u.get(row * uRow + col * uPixel);
            }
        }
        return out;
    }
}
