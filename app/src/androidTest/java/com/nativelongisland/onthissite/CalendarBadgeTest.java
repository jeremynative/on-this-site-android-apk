package com.nativelongisland.onthissite;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import org.junit.Test;
import static org.junit.Assert.*;

public class CalendarBadgeTest {
    @Test public void fullRangesFitInsideCalendarFace() throws Exception {
        String[] labels = {"9/26", "9/26–5/9", "11/26–12/31"};
        Bitmap preview = Bitmap.createBitmap(240, 210, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(preview);
        canvas.drawColor(Color.rgb(170, 210, 220));
        int previousWidth = 0;
        for (int i = 0; i < labels.length; i++) {
            Bitmap badge = NativeMapController.createCalendarBadgeBitmap(labels[i]);
            assertTrue("Longer ranges need wider badges", badge.getWidth() > previousWidth);
            assertEquals(54, badge.getHeight());
            assertEquals("White date face", Color.WHITE, badge.getPixel(5, 34));
            for (int y = 23; y < 49; y++) {
                assertEquals("Left text padding", Color.WHITE, badge.getPixel(5, y));
                assertEquals("Right text padding", Color.WHITE, badge.getPixel(badge.getWidth() - 6, y));
            }
            canvas.drawBitmap(badge, 12, 8 + i * 66, null);
            previousWidth = badge.getWidth();
        }
        File output = new File(InstrumentationRegistry.getInstrumentation().getTargetContext().getFilesDir(), "calendar-badge-preview.png");
        try (FileOutputStream stream = new FileOutputStream(output)) {
            preview.compress(Bitmap.CompressFormat.PNG, 100, stream);
        }
    }
}
