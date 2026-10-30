package com.nativelongisland.onthissite;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/**
 * Tells contributors when their uploaded scan goes live, even with the app
 * closed. Every ~15 minutes (while any upload is waiting) it asks our scan
 * server about each uploaded session, authenticating with that session's
 * upload key (no sign-in needed, no push service), and posts a notification
 * when the scan is processed or fails. The web panel shares the same
 * "notified" marker through the bridge so nobody hears about it twice.
 */
public class ScanStatusJob extends JobService {
    private static final int JOB_ID = 74_201;
    private static final String CHANNEL_ID = "scan_status";
    private static final long EVERY_MS = 15 * 60 * 1000L;

    static void schedule(Context context) {
        JobScheduler scheduler = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (scheduler == null) return;
        scheduler.schedule(new JobInfo.Builder(JOB_ID, new ComponentName(context, ScanStatusJob.class))
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
            .setPeriodic(EVERY_MS)
            .setPersisted(true)
            .build());
    }

    @Override
    public boolean onStartJob(JobParameters params) {
        new Thread(() -> {
            boolean waiting = false;
            try {
                waiting = checkAll(this);
            } catch (Exception error) {
                android.util.Log.w("OnThisSiteScan", "Scan status check failed: " + error.getMessage());
                waiting = true;
            }
            if (!waiting) {
                JobScheduler scheduler = (JobScheduler) getSystemService(Context.JOB_SCHEDULER_SERVICE);
                if (scheduler != null) scheduler.cancel(JOB_ID);
            }
            jobFinished(params, false);
        }).start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        return true;
    }

    /** Checks every uploaded, not-yet-announced scan; returns true if any is still waiting. */
    static boolean checkAll(Context context) throws Exception {
        File[] dirs = new File(context.getFilesDir(), "scans").listFiles();
        if (dirs == null) return false;
        boolean waiting = false;
        for (File dir : dirs) {
            File uploaded = new File(dir, "uploaded");
            File stateFile = new File(dir, "upload.json");
            if (!uploaded.isFile() || !stateFile.isFile() || new File(dir, "notified").isFile()) continue;
            JSONObject state = new JSONObject(ScanUploader.read(stateFile));
            String sessionId = state.optString("session_id");
            String key = state.optString("upload_key");
            if (sessionId.isEmpty() || key.isEmpty()) continue;
            JSONObject session;
            try {
                session = ScanUploader.getWithKey("/sessions/" + sessionId, key).getJSONObject("data");
            } catch (Exception error) {
                waiting = true;
                continue;
            }
            String status = session.optString("status");
            String place = session.optString("space_title", "your place");
            String area = session.optString("area_label", "");
            String what = area.isEmpty() ? "Your scan of " + place : "Your scan of " + area + " in " + place;
            if ("processed".equals(status)) {
                if (claim(context, sessionId)) notify(context, sessionId.hashCode(), "Your scan is live", what + " is now in 3D. Thank you!");
            } else if ("failed".equals(status)) {
                if (claim(context, sessionId)) notify(context, sessionId.hashCode(), "Your scan couldn't be processed",
                    what + " couldn't be turned into 3D. An administrator will look at it; scanning again with slow, steady movement usually helps.");
            } else {
                waiting = true;
            }
        }
        return waiting;
    }

    /** Marks a session's notification as sent; returns false if it already was (by this job or the web panel). */
    static synchronized boolean claim(Context context, String sessionId) {
        File[] dirs = new File(context.getFilesDir(), "scans").listFiles();
        if (dirs == null) return true;
        for (File dir : dirs) {
            File uploaded = new File(dir, "uploaded");
            try {
                if (!uploaded.isFile() || !sessionId.equals(ScanUploader.read(uploaded).trim())) continue;
                File marker = new File(dir, "notified");
                if (marker.isFile()) return false;
                try (FileOutputStream out = new FileOutputStream(marker)) {
                    out.write("1".getBytes(StandardCharsets.UTF_8));
                }
                return true;
            } catch (Exception error) {
                return true;
            }
        }
        return true; // scanned on another phone: nothing to dedupe against
    }

    private static void notify(Context context, int id, String title, String body) {
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "Your 3D scans", NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent open = new Intent(context, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent tap = PendingIntent.getActivity(context, id, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(context, CHANNEL_ID) : new Notification.Builder(context);
        manager.notify(id, builder
            .setSmallIcon(android.R.drawable.ic_dialog_map)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new Notification.BigTextStyle().bigText(body))
            .setContentIntent(tap)
            .setAutoCancel(true)
            .build());
    }
}
