package com.nativelongisland.onthissite;

import android.app.Application;
import android.util.Log;
import com.google.android.libraries.navigation.NavigationApi;

public class OnThisSiteApplication extends Application {
    private static final String LOG_TAG = "OnThisSiteGoogleNav";
    private static boolean navigationApiConfigured;
    private NavigationNotificationProvider navigationNotificationProvider;

    @Override
    public void onCreate() {
        super.onCreate();
        String apiKey = BuildConfig.GOOGLE_NAVIGATION_API_KEY == null
            ? ""
            : BuildConfig.GOOGLE_NAVIGATION_API_KEY.trim();
        if (!apiKey.isEmpty()) {
            NavigationApi.setApiKey(apiKey);
            navigationNotificationProvider = new NavigationNotificationProvider(this);
            try {
                NavigationApi.initForegroundServiceManagerProvider(
                    this,
                    NavigationNotificationProvider.NOTIFICATION_ID,
                    navigationNotificationProvider
                );
            } catch (IllegalStateException error) {
                Log.w(LOG_TAG, "Navigation notification manager was already initialized.", error);
            }
            navigationApiConfigured = true;
        }
    }

    static boolean isNavigationApiConfigured() {
        return navigationApiConfigured;
    }

    void setActiveNavigationDestination(String title, String slug, double latitude, double longitude) {
        if (navigationNotificationProvider != null) {
            navigationNotificationProvider.setActiveDestination(title, slug, latitude, longitude);
        }
    }

    void clearActiveNavigationDestination() {
        if (navigationNotificationProvider != null) {
            navigationNotificationProvider.clearActiveDestination();
        }
    }
}
