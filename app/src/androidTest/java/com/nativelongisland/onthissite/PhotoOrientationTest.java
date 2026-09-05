package com.nativelongisland.onthissite;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.net.Uri;
import androidx.exifinterface.media.ExifInterface;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import org.junit.Test;
import static org.junit.Assert.*;

/** Real Android decode/EXIF/encode regression, using the camera content provider. */
public class PhotoOrientationTest {
    private static final int R = Color.RED, G = Color.GREEN, B = Color.BLUE, Y = Color.YELLOW;

    @Test public void normal() throws Exception { check(1, new int[] {R,G,B,Y}, false, false); }
    @Test public void mirrored() throws Exception { check(2, new int[] {G,R,Y,B}, false, false); }
    @Test public void upsideDown() throws Exception { check(3, new int[] {Y,B,G,R}, false, false); }
    @Test public void verticallyFlipped() throws Exception { check(4, new int[] {B,Y,R,G}, false, false); }
    @Test public void transposed() throws Exception { check(5, new int[] {R,B,G,Y}, false, false); }
    @Test public void cameraPortrait90() throws Exception { check(6, new int[] {B,R,Y,G}, false, false); }
    @Test public void transverse() throws Exception { check(7, new int[] {Y,G,B,R}, false, false); }
    @Test public void cameraPortrait270() throws Exception { check(8, new int[] {G,Y,R,B}, false, false); }
    @Test public void missingOrientation() throws Exception { check(0, new int[] {R,G,B,Y}, false, false); }
    @Test public void pngWithoutExif() throws Exception { check(0, new int[] {R,G,B,Y}, false, true); }
    @Test public void largeCameraImageIsSampledBeforeRotation() throws Exception { check(6, new int[] {B,R,Y,G}, true, false); }

    private void check(int orientation, int[] expected, boolean large, boolean png) throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Uri uri = CaptureFileProvider.createCommentCaptureUri(context);
        File file = new File(new File(context.getCacheDir(), "camera-captures"), uri.getLastPathSegment());
        try {
            Bitmap source = Bitmap.createBitmap(large ? 4000 : 800, large ? 2400 : 480, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(source);
            Paint paint = new Paint();
            int[] colors = {R,G,B,Y};
            for (int i = 0; i < 4; i++) {
                paint.setColor(colors[i]);
                int x = i % 2, y = i / 2;
                canvas.drawRect(x * source.getWidth()/2, y * source.getHeight()/2,
                    (x+1) * source.getWidth()/2, (y+1) * source.getHeight()/2, paint);
            }
            try (FileOutputStream output = new FileOutputStream(file)) {
                assertTrue(source.compress(png ? Bitmap.CompressFormat.PNG : Bitmap.CompressFormat.JPEG, 95, output));
            } finally { source.recycle(); }
            if (orientation != 0) {
                ExifInterface exif = new ExifInterface(file);
                exif.setAttribute(ExifInterface.TAG_ORIENTATION, String.valueOf(orientation));
                exif.saveAttributes();
            }
            byte[] original = Files.readAllBytes(file.toPath());
            byte[] result = MediaStorePhotoHelper.compressedJpegBytes(context, uri);
            assertArrayEquals("Source photo must remain unchanged", original, Files.readAllBytes(file.toPath()));
            assertTrue("Upload size remains bounded", result.length <= 900 * 1024);
            assertEquals(0xff, result[0] & 0xff);
            assertEquals(0xd8, result[1] & 0xff);
            ExifInterface encoded = new ExifInterface(new ByteArrayInputStream(result));
            assertEquals("Encoded pixels must not be rotated a second time", 0, encoded.getRotationDegrees());
            assertFalse(encoded.isFlipped());
            Bitmap decoded = BitmapFactory.decodeByteArray(result, 0, result.length);
            try {
                boolean swap = orientation >= 5;
                int width = large ? 1000 : 800, height = large ? 600 : 480;
                assertEquals(swap ? height : width, decoded.getWidth());
                assertEquals(swap ? width : height, decoded.getHeight());
                for (int i=0; i<4; i++) {
                    int actual = decoded.getPixel((i%2*2+1)*decoded.getWidth()/4, (i/2*2+1)*decoded.getHeight()/4);
                    assertTrue("Corner " + i + " for EXIF " + orientation,
                        Math.abs(Color.red(actual)-Color.red(expected[i])) < 25
                        && Math.abs(Color.green(actual)-Color.green(expected[i])) < 25
                        && Math.abs(Color.blue(actual)-Color.blue(expected[i])) < 25);
                }
            } finally { decoded.recycle(); }
        } finally { context.getContentResolver().delete(uri, null, null); }
    }

    @Test public void unreadablePhotoFailsInsteadOfReturningAnEmptyUpload() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Uri uri = CaptureFileProvider.createCommentCaptureUri(context);
        try {
            try {
                MediaStorePhotoHelper.compressedJpegBytes(context, uri);
                fail("Empty photo should fail");
            } catch (Exception expected) {
                assertEquals("Could not read the photo.", expected.getMessage());
            }
        } finally { context.getContentResolver().delete(uri, null, null); }
    }
}
