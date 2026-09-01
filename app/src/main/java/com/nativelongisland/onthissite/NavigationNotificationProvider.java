package com.nativelongisland.onthissite;

import android.app.Application;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import com.google.android.libraries.navigation.NotificationContentProviderBase;

final class NavigationNotificationProvider extends NotificationContentProviderBase {
    static final int NOTIFICATION_ID = 2102;
    static final String CHANNEL_ID = "on_this_site_navigation";
    static final String ACTION_RESUME = "com.nativelongisland.onthissite.action.RESUME_NAVIGATION";
    static final String ACTION_STOP = "com.nativelongisland.onthissite.action.STOP_NAVIGATION";
    private static final String PREFERENCES = "on_this_site_navigation_session";
    private static final String PREF_TITLE = "destination_title";
    private static final String PREF_SLUG = "destination_slug";
    private static final String PREF_LATITUDE = "destination_latitude";
    private static final String PREF_LONGITUDE = "destination_longitude";
    private static final String PREF_ACTIVE = "guidance_active";

    private final Application application;

    NavigationNotificationProvider(Application application) {
        super(application);
        this.application = application;
        createNotificationChannel();
    }

    void setActiveDestination(String title, String slug, double latitude, double longitude) {
        application.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(PREF_ACTIVE, true)
            .putString(PREF_TITLE, safeTitle(title))
            .putString(PREF_SLUG, slug == null ? "" : slug.trim())
            .putLong(PREF_LATITUDE, Double.doubleToRawLongBits(latitude))
            .putLong(PREF_LONGITUDE, Double.doubleToRawLongBits(longitude))
            .apply();
        updateNotification();
    }

    void clearActiveDestination() {
        application.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE).edit().clear().apply();
        updateNotification();
    }

    static Intent createResumeIntent(Context context) {
        android.content.SharedPreferences preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
        Intent intent = new Intent(context, OnThisSiteNavigationActivity.class)
            .setAction(ACTION_RESUME)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (preferences.getBoolean(PREF_ACTIVE, false)) {
            intent.putExtra(OnThisSiteNavigationActivity.EXTRA_TITLE, preferences.getString(PREF_TITLE, "On This Site destination"));
            intent.putExtra(OnThisSiteNavigationActivity.EXTRA_SLUG, preferences.getString(PREF_SLUG, ""));
            intent.putExtra(
                OnThisSiteNavigationActivity.EXTRA_LATITUDE,
                Double.longBitsToDouble(preferences.getLong(PREF_LATITUDE, Double.doubleToRawLongBits(Double.NaN)))
            );
            intent.putExtra(
                OnThisSiteNavigationActivity.EXTRA_LONGITUDE,
                Double.longBitsToDouble(preferences.getLong(PREF_LONGITUDE, Double.doubleToRawLongBits(Double.NaN)))
            );
        }
        return intent;
    }

    @Override
    public Notification getNotification() {
        android.content.SharedPreferences preferences = application.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
        String title = safeTitle(preferences.getString(PREF_TITLE, "On This Site destination"));
        PendingIntent resumePendingIntent = PendingIntent.getActivity(
            application,
            2102,
            createResumeIntent(application),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Intent stopIntent = new Intent(application, NavigationActionReceiver.class).setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
            application,
            2103,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(application, CHANNEL_ID)
            : new Notification.Builder(application);
        return builder
            .setSmallIcon(R.drawable.ic_launcher_monochrome)
            .setContentTitle("On This Site navigation")
            .setContentText("To " + title + " · Tap to return")
            .setContentIntent(resumePendingIntent)
            .setCategory(Notification.CATEGORY_NAVIGATION)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .addAction(new Notification.Action.Builder(
                R.drawable.ic_launcher_monochrome,
                "Exit navigation",
                stopPendingIntent
            ).build())
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Active navigation",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Return to or stop active On This Site navigation.");
        channel.setSound(null, null);
        NotificationManager manager = application.getSystemService(NotificationManager.class);
        if (manager != null) manager.createNotificationChannel(channel);
    }

    private static String safeTitle(String value) {
        String clean = value == null ? "" : value.trim();
        return clean.isEmpty() ? "On This Site destination" : clean;
    }
}
