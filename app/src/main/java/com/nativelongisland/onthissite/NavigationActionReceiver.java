package com.nativelongisland.onthissite;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public final class NavigationActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && NavigationNotificationProvider.ACTION_STOP.equals(intent.getAction())) {
            OnThisSiteNavigationActivity.stopActiveNavigationFromNotification(context);
        }
    }
}
