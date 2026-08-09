package com.nativelongisland.onthissite;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;
import java.util.List;

/**
 * Narrow provider for camera output owned by the app. Keeping comment captures
 * in app-private storage avoids MediaStore ownership and READ_MEDIA_IMAGES
 * changes across Android/Samsung camera releases.
 */
public class CaptureFileProvider extends ContentProvider {
    static final String AUTHORITY = BuildConfig.APPLICATION_ID + ".capture";
    private static final String CAPTURE_DIRECTORY = "comment-camera";

    static Uri createCommentCaptureUri(Context context) throws Exception {
        File directory = new File(context.getCacheDir(), CAPTURE_DIRECTORY);
        if (!directory.exists() && !directory.mkdirs()) {
            throw new Exception("Could not create the private camera directory.");
        }
        File file = File.createTempFile("comment-photo-", ".jpg", directory);
        return new Uri.Builder()
            .scheme("content")
            .authority(AUTHORITY)
            .appendPath(file.getName())
            .build();
    }

    private File resolveCaptureFile(Uri uri) throws FileNotFoundException {
        if (uri == null || !AUTHORITY.equals(uri.getAuthority())) {
            throw new FileNotFoundException("Unknown capture URI.");
        }
        List<String> segments = uri.getPathSegments();
        if (segments.size() != 1) throw new FileNotFoundException("Invalid capture path.");
        String name = segments.get(0);
        if (!name.matches("comment-photo-[A-Za-z0-9._-]+\\.jpg")) {
            throw new FileNotFoundException("Invalid capture filename.");
        }
        File directory = new File(getContext().getCacheDir(), CAPTURE_DIRECTORY);
        File file = new File(directory, name);
        try {
            if (!file.getCanonicalPath().startsWith(directory.getCanonicalPath() + File.separator)) {
                throw new FileNotFoundException("Capture path escaped its directory.");
            }
        } catch (Exception error) {
            throw new FileNotFoundException("Could not resolve capture file.");
        }
        return file;
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public String getType(Uri uri) {
        return "image/jpeg";
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File file = resolveCaptureFile(uri);
        int flags = mode != null && mode.contains("w")
            ? ParcelFileDescriptor.MODE_CREATE | ParcelFileDescriptor.MODE_TRUNCATE | ParcelFileDescriptor.MODE_READ_WRITE
            : ParcelFileDescriptor.MODE_READ_ONLY;
        return ParcelFileDescriptor.open(file, flags);
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        try {
            File file = resolveCaptureFile(uri);
            String[] columns = projection == null
                ? new String[] { OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE }
                : projection;
            MatrixCursor cursor = new MatrixCursor(columns, 1);
            MatrixCursor.RowBuilder row = cursor.newRow();
            for (String column : columns) {
                if (OpenableColumns.DISPLAY_NAME.equals(column)) row.add(file.getName());
                else if (OpenableColumns.SIZE.equals(column)) row.add(file.length());
                else row.add(null);
            }
            return cursor;
        } catch (FileNotFoundException error) {
            return new MatrixCursor(projection == null ? new String[0] : projection, 0);
        }
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        try {
            return resolveCaptureFile(uri).delete() ? 1 : 0;
        } catch (FileNotFoundException error) {
            return 0;
        }
    }

    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { return 0; }
}
