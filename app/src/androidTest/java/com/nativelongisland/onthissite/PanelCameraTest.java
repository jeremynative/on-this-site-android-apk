package com.nativelongisland.onthissite;

import org.junit.Test;
import org.maplibre.android.camera.CameraPosition;
import org.maplibre.android.geometry.LatLng;
import static org.junit.Assert.*;

public class PanelCameraTest {
    @Test public void restoringCameraKeepsCurrentDrawerPadding() {
        CameraPosition original = new CameraPosition.Builder()
            .target(new LatLng(40.88, -72.4)).zoom(12).bearing(20).tilt(15)
            .padding(new double[] {0, 0, 0, 0}).build();
        CameraPosition phone = NativeMapController.cameraWithPanelPadding(original, 0, 600);
        assertArrayEquals(new double[] {0, 0, 0, 600}, phone.padding, 0);
        assertEquals(original.target, phone.target);
        assertEquals(original.zoom, phone.zoom, 0);
        assertEquals(original.bearing, phone.bearing, 0);
        CameraPosition tablet = NativeMapController.cameraWithPanelPadding(phone, 480, 0);
        assertArrayEquals(new double[] {0, 0, 480, 0}, tablet.padding, 0);
        CameraPosition closed = NativeMapController.cameraWithPanelPadding(tablet, 0, 0);
        assertArrayEquals(new double[] {0, 0, 0, 0}, closed.padding, 0);
        assertArrayEquals(new double[] {0, 0, 0, 0}, original.padding, 0);
        assertNull(NativeMapController.cameraWithPanelPadding(null, 0, 600));
    }
}
