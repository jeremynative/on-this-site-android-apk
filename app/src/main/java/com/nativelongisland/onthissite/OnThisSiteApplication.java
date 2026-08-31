package com.nativelongisland.onthissite;

import android.app.Application;
import com.google.android.libraries.navigation.NavigationApi;

public class OnThisSiteApplication extends Application {
    private static boolean navigationApiConfigured;

    @Override
    public void onCreate() {
        super.onCreate();
        String apiKey = BuildConfig.GOOGLE_NAVIGATION_API_KEY == null
            ? ""
            : BuildConfig.GOOGLE_NAVIGATION_API_KEY.trim();
        if (!apiKey.isEmpty()) {
            NavigationApi.setApiKey(apiKey);
            navigationApiConfigured = true;
        }
    }

    static boolean isNavigationApiConfigured() {
        return navigationApiConfigured;
    }
}
