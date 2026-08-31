package com.nativelongisland.onthissite;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import java.util.Locale;

public class NavigationCompanionActionActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        showReviewDialog(getIntent());
    }

    private void showReviewDialog(Intent intent) {
        String title = intent == null ? "Nearby site" : intent.getStringExtra("site_title");
        double latitude = intent == null ? Double.NaN : intent.getDoubleExtra("site_latitude", Double.NaN);
        double longitude = intent == null ? Double.NaN : intent.getDoubleExtra("site_longitude", Double.NaN);
        if (!Double.isFinite(latitude) || !Double.isFinite(longitude)) {
            finish();
            return;
        }
        new AlertDialog.Builder(this)
            .setTitle(title == null || title.trim().isEmpty() ? "Nearby On This Site stop" : title)
            .setMessage("Open this public site in Google Maps? Google Maps controls whether it can be added to your current route. Canceling here leaves your route unchanged.")
            .setPositiveButton("Open Google Maps", (dialog, which) -> {
                openGoogleMaps(title, latitude, longitude);
                finish();
            })
            .setNegativeButton("Cancel", (dialog, which) -> finish())
            .setNeutralButton("Turn off companion", (dialog, which) -> {
                NavigationCompanionService.stop(this);
                finish();
            })
            .setOnCancelListener(dialog -> finish())
            .show();
    }

    private void openGoogleMaps(String title, double latitude, double longitude) {
        String label = title == null ? "On This Site" : title;
        String query = String.format(Locale.US, "%f,%f(%s)", latitude, longitude, label);
        Uri uri = Uri.parse("geo:" + latitude + "," + longitude + "?q=" + Uri.encode(query));
        Intent mapsIntent = new Intent(Intent.ACTION_VIEW, uri).setPackage("com.google.android.apps.maps");
        try {
            startActivity(mapsIntent);
        } catch (ActivityNotFoundException error) {
            Uri fallback = Uri.parse(
                "https://www.google.com/maps/search/?api=1&query="
                    + Uri.encode(latitude + "," + longitude)
            );
            startActivity(new Intent(Intent.ACTION_VIEW, fallback));
        }
    }
}
