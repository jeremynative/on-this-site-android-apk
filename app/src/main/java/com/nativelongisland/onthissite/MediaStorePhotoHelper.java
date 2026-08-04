package com.nativelongisland.onthissite;

import android.content.ContentValues;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

class MediaStorePhotoHelper {
    private MediaStorePhotoHelper() {}

    static Uri createPlantPhotoUri(Context context) {
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, "on-this-site-plant-" + System.currentTimeMillis() + ".jpg");
        values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
        values.put(MediaStore.Images.Media.DATE_ADDED, System.currentTimeMillis() / 1000);
        values.put(MediaStore.Images.Media.DATE_TAKEN, System.currentTimeMillis());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            values.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/On This Site");
            values.put(MediaStore.Images.Media.IS_PENDING, 1);
        }
        return context.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
    }

    static void markPlantPhotoReady(Context context, Uri uri) {
        if (uri == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return;
        ContentValues ready = new ContentValues();
        ready.put(MediaStore.Images.Media.IS_PENDING, 0);
        context.getContentResolver().update(uri, ready, null, null);
    }

    static boolean hasPhotoData(Context context, Uri uri) {
        if (uri == null) return false;
        try (InputStream input = context.getContentResolver().openInputStream(uri)) {
            return input != null && input.read() >= 0;
        } catch (Exception error) {
            return false;
        }
    }

    static byte[] compressedJpegBytes(Context context, Uri uri) throws Exception {
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        try (InputStream input = context.getContentResolver().openInputStream(uri)) {
            BitmapFactory.decodeStream(input, null, bounds);
        }
        int sample = 1;
        int largest = Math.max(bounds.outWidth, bounds.outHeight);
        while (largest / sample > 1024) sample *= 2;

        BitmapFactory.Options decode = new BitmapFactory.Options();
        decode.inSampleSize = sample;
        Bitmap bitmap;
        try (InputStream input = context.getContentResolver().openInputStream(uri)) {
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
}
