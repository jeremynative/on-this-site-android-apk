package com.nativelongisland.onthissite;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import java.io.File;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

/**
 * Uploads finished scans as a foreground service with a progress
 * notification, so leaving the scanner or going to the home screen doesn't
 * stop a long upload. The scanner screen listens for progress while it's open.
 */
public class ScanUploadService extends Service {
    private static final String CHANNEL = "scan-upload";
    private static final int ONGOING_ID = 47210;
    private static final int DONE_ID = 47211;

    /** Progress for whichever scanner screen is showing (called on the upload thread). */
    interface Listener {
        void progress(String dir, String message, int percent);

        void finished(String dir, JSONObject queued);

        void failed(String dir, String message);
    }

    static volatile Listener listener;

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private int queued;

    static void start(Context context, File dir, String accessToken) {
        Intent intent = new Intent(context, ScanUploadService.class)
            .putExtra("dir", dir.getAbsolutePath())
            .putExtra("token", accessToken);
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent);
        else context.startService(intent);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Scan uploads", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Progress while a 3D scan uploads");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification ongoing = notification("Preparing your scan upload…", 0, true);
        if (Build.VERSION.SDK_INT >= 29) startForeground(ONGOING_ID, ongoing, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        else startForeground(ONGOING_ID, ongoing);
        String dir = intent == null ? null : intent.getStringExtra("dir");
        String token = intent == null ? null : intent.getStringExtra("token");
        if (dir == null) {
            stopIfIdle();
            return START_NOT_STICKY;
        }
        queued++;
        worker.execute(() -> run(dir, token));
        return START_NOT_STICKY;
    }

    private void run(String dir, String token) {
        try {
            JSONObject result = new ScanUploader(new File(dir), (message, percent) -> {
                show(ONGOING_ID, notification(message, percent, true));
                Listener l = listener;
                if (l != null) l.progress(dir, message, percent);
            }).upload(token);
            ScanStatusJob.schedule(getApplicationContext());
            show(DONE_ID, notification("Scan uploaded. " + ScanActivity.goLiveText(result), -1, false));
            Listener l = listener;
            if (l != null) l.finished(dir, result);
        } catch (Exception error) {
            String message = error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage();
            show(DONE_ID, notification("Upload paused: " + message + " Your scan is saved; open the scanner to resume.", -1, false));
            Listener l = listener;
            if (l != null) l.failed(dir, message);
        } finally {
            synchronized (this) {
                queued--;
            }
            stopIfIdle();
        }
    }

    private synchronized void stopIfIdle() {
        if (queued > 0) return;
        if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE);
        else stopForeground(true);
        stopSelf();
    }

    private Notification notification(String text, int percent, boolean ongoing) {
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent tap = open == null ? null
            : PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        builder.setSmallIcon(android.R.drawable.stat_sys_upload)
            .setContentTitle(ongoing ? "Uploading your 3D scan" : "On This Site scan")
            .setContentText(text)
            .setStyle(new Notification.BigTextStyle().bigText(text))
            .setOngoing(ongoing)
            .setOnlyAlertOnce(true)
            .setAutoCancel(!ongoing);
        if (ongoing) builder.setProgress(100, Math.max(0, percent), percent < 0);
        if (tap != null) builder.setContentIntent(tap);
        return builder.build();
    }

    private void show(int id, Notification notification) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(id, notification);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        worker.shutdown();
        super.onDestroy();
    }
}
