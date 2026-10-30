package com.nativelongisland.onthissite;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.zip.Deflater;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Packs a finished scan session and uploads it to the scan queue in
 * checksummed parts. Progress is kept in upload.json beside the scan, so an
 * interrupted upload (no signal at the site, app closed) resumes later with
 * only the missing parts.
 */
final class ScanUploader {
    static final String QUEUE = "https://directus.nativelongisland.com/nli-scan-queue";
    private static final int PART_BYTES = 16 * 1024 * 1024;

    interface Progress {
        void update(String message, int percent);
    }

    private final File dir;
    private final Progress progress;

    ScanUploader(File sessionDir, Progress progress) {
        this.dir = sessionDir;
        this.progress = progress;
    }

    /** "m:ss" (or "h:mm:ss") for elapsed and remaining times. */
    static String clock(long ms) {
        long seconds = Math.max(0, ms / 1000);
        long h = seconds / 3600, m = (seconds % 3600) / 60, sec = seconds % 60;
        return h > 0 ? String.format(java.util.Locale.US, "%d:%02d:%02d", h, m, sec) : String.format(java.util.Locale.US, "%d:%02d", m, sec);
    }

    /**
     * Upload status line: percent of the scan sent, time so far, and time left
     * from the speed of this run (null until a few seconds of data).
     */
    static String uploadLine(long sentTotal, long total, long sentThisRun, long elapsedMs) {
        int percent = total <= 0 ? 0 : (int) Math.min(100, sentTotal * 100 / total);
        StringBuilder line = new StringBuilder("Uploading ").append(percent).append("% \u00b7 ").append(clock(elapsedMs)).append(" so far");
        if (sentThisRun > 0 && elapsedMs >= 3000) {
            long left = (long) ((total - sentTotal) / (sentThisRun / (double) elapsedMs));
            line.append(" \u00b7 about ").append(clock(left)).append(" left");
        }
        return line.toString();
    }

    /** Scans in app storage that were finished but not fully uploaded. */
    static File[] pending(File root) {
        File[] dirs = root.listFiles(f -> f.isDirectory() && new File(f, "meta.json").isFile() && !new File(f, "uploaded").exists());
        return dirs == null ? new File[0] : dirs;
    }

    /**
     * Creates the server session when recording starts, so photos can be sent
     * for the live coverage guide during the scan. Returns {sessionId, uploadKey}.
     */
    static String[] createSession(File dir, String spaceId, JSONObject meta, String accessToken) throws Exception {
        JSONObject body = new JSONObject()
            .put("area_label", meta.optString("area_label"))
            .put("credit_name", meta.optString("credit_name"))
            .put("credit_public", meta.optBoolean("credit_public", true))
            .put("device", meta.optString("device"));
        JSONObject data = request("POST", "/spaces/" + spaceId + "/sessions", body, "Bearer " + accessToken, null).getJSONObject("data");
        JSONObject state = new JSONObject().put("session_id", data.getString("id")).put("upload_key", data.getString("upload_key"));
        write(new File(dir, "upload.json"), state.toString());
        return new String[] {data.getString("id"), data.getString("upload_key")};
    }

    /** Small JPEG to a live-coverage route, authorised by the session's upload key. */
    static JSONObject postLive(String path, String uploadKey, byte[] jpeg) throws Exception {
        HttpURLConnection connection = open("POST", path, null, uploadKey);
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(15000);
        connection.setRequestProperty("Content-Type", "image/jpeg");
        connection.setFixedLengthStreamingMode(jpeg.length);
        connection.setDoOutput(true);
        try (OutputStream out = connection.getOutputStream()) {
            out.write(jpeg);
        }
        return readResponse(connection);
    }

    /** Runs on a background thread. accessToken is only needed the first time (to create the session). */
    /** Returns the server's queue estimate (eta_at, note), or null if it was already uploaded. */
    JSONObject upload(String accessToken) throws Exception {
        JSONObject meta = new JSONObject(read(new File(dir, "meta.json")));
        JSONObject anchors = new JSONObject(read(new File(dir, "anchors.json")));
        File stateFile = new File(dir, "upload.json");
        JSONObject state = stateFile.isFile() ? new JSONObject(read(stateFile)) : new JSONObject();

        File zip = new File(dir, "session.zip");
        if (!zip.isFile()) {
            progress.update("Packing photos…", 0);
            pack(zip);
        }
        int parts = (int) ((zip.length() + PART_BYTES - 1) / PART_BYTES);

        if (!state.has("session_id")) {
            if (accessToken == null || accessToken.isEmpty()) throw new IllegalStateException("Sign in to the app to upload this scan.");
            JSONObject body = new JSONObject()
                .put("area_label", meta.optString("area_label"))
                .put("credit_name", meta.optString("credit_name"))
                .put("credit_public", meta.optBoolean("credit_public", true))
                .put("device", meta.optString("device"))
                .put("parts_expected", parts)
                .put("alignment", anchors.optJSONObject("alignment"))
                .put("transform", anchors.optJSONArray("transform"));
            JSONObject created = request("POST", "/spaces/" + meta.getString("space_id") + "/sessions", body, "Bearer " + accessToken, null);
            JSONObject data = created.getJSONObject("data");
            state.put("session_id", data.getString("id")).put("upload_key", data.getString("upload_key"));
            write(stateFile, state.toString());
        }
        String sessionId = state.getString("session_id");
        String key = state.getString("upload_key");

        JSONArray received = request("GET", "/sessions/" + sessionId, null, null, key).getJSONObject("data").optJSONArray("parts");
        boolean[] done = new boolean[parts];
        for (int i = 0; received != null && i < received.length(); i++) {
            int idx = received.getJSONObject(i).getInt("idx");
            if (idx < parts) done[idx] = true;
        }
        byte[] buffer = new byte[PART_BYTES];
        long total = zip.length();
        long resumedBytes = 0;
        for (int idx = 0; idx < parts; idx++) if (done[idx]) resumedBytes += Math.min(PART_BYTES, total - (long) idx * PART_BYTES);
        final long already = resumedBytes;
        long startedAt = android.os.SystemClock.uptimeMillis();
        long[] sentThisRun = {0};
        long[] lastReport = {0};
        try (java.io.RandomAccessFile file = new java.io.RandomAccessFile(zip, "r")) {
            for (int idx = 0; idx < parts; idx++) {
                if (done[idx]) continue;
                file.seek((long) idx * PART_BYTES);
                int length = (int) Math.min(PART_BYTES, total - (long) idx * PART_BYTES);
                file.readFully(buffer, 0, length);
                final long before = already + sentThisRun[0];
                putPart(sessionId, key, idx, buffer, length, written -> {
                    long now = android.os.SystemClock.uptimeMillis();
                    if (now - lastReport[0] < 700 && written < length) return;
                    lastReport[0] = now;
                    long sent = before + written;
                    progress.update(uploadLine(sent, total, sent - already, now - startedAt), 5 + (int) (90 * sent / total));
                });
                sentThisRun[0] += length;
            }
        }
        progress.update("Submitting for processing…", 97);
        JSONObject queued = request("POST", "/sessions/" + sessionId + "/finish",
            new JSONObject().put("parts", parts).put("frames", meta.optInt("frames"))
                .put("area_label", meta.optString("area_label"))
                .put("alignment", anchors.optJSONObject("alignment"))
                .put("transform", anchors.optJSONArray("transform")), null, key);
        write(new File(dir, "uploaded"), sessionId);
        // Keep meta/anchors as a receipt; the photos are now safely queued.
        deleteTree(new File(dir, "frames"));
        zip.delete();
        progress.update("Uploaded. Thank you!", 100);
        return queued;
    }

    private void pack(File zip) throws Exception {
        File temp = new File(dir, "session.zip.tmp");
        try (ZipOutputStream out = new ZipOutputStream(new FileOutputStream(temp))) {
            out.setLevel(Deflater.NO_COMPRESSION); // JPEGs don't compress further
            for (String name : new String[] {"meta.json", "frames.jsonl", "anchors.json"}) addFile(out, new File(dir, name), name);
            File[] frames = new File(dir, "frames").listFiles();
            if (frames != null) {
                java.util.Arrays.sort(frames);
                for (File frame : frames) addFile(out, frame, "frames/" + frame.getName());
            }
        }
        if (!temp.renameTo(zip)) throw new IllegalStateException("Couldn't pack the scan.");
    }

    private static void addFile(ZipOutputStream out, File file, String name) throws Exception {
        if (!file.isFile()) return;
        out.putNextEntry(new ZipEntry(name));
        try (InputStream in = new FileInputStream(file)) {
            ArScene.copy(in, out);
        }
        out.closeEntry();
    }

    interface Written {
        void bytes(long written);
    }

    private void putPart(String sessionId, String key, int idx, byte[] data, int length, Written written) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        digest.update(data, 0, length);
        String sha = hex(digest.digest());
        Exception last = null;
        for (int attempt = 0; attempt < 4; attempt++) {
            try {
                HttpURLConnection connection = open("PUT", "/sessions/" + sessionId + "/parts/" + idx, null, key);
                connection.setRequestProperty("Content-Type", "application/octet-stream");
                connection.setRequestProperty("X-Sha256", sha);
                connection.setFixedLengthStreamingMode(length);
                connection.setDoOutput(true);
                try (OutputStream out = connection.getOutputStream()) {
                    // In 256 KB pieces so the progress and time left move smoothly.
                    for (int offset = 0; offset < length; offset += 256 * 1024) {
                        int n = Math.min(256 * 1024, length - offset);
                        out.write(data, offset, n);
                        written.bytes(offset + n);
                    }
                }
                readResponse(connection);
                return;
            } catch (Exception error) {
                last = error;
                Thread.sleep(2000L << attempt);
            }
        }
        throw last;
    }

    private static JSONObject request(String method, String path, JSONObject body, String authorization, String uploadKey) throws Exception {
        HttpURLConnection connection = open(method, path, authorization, uploadKey);
        if (body != null) {
            byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setFixedLengthStreamingMode(bytes.length);
            connection.setDoOutput(true);
            try (OutputStream out = connection.getOutputStream()) {
                out.write(bytes);
            }
        }
        return readResponse(connection);
    }

    static JSONObject getWithKey(String path, String uploadKey) throws Exception {
        return request("GET", path, null, null, uploadKey);
    }

    static JSONObject post(String path, String accessToken) throws Exception {
        return request("POST", path, null, accessToken == null ? null : "Bearer " + accessToken, null);
    }

    static JSONObject get(String path, String accessToken) throws Exception {
        return request("GET", path, null, accessToken == null ? null : "Bearer " + accessToken, null);
    }

    private static HttpURLConnection open(String method, String path, String authorization, String uploadKey) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(QUEUE + path).openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(20000);
        connection.setReadTimeout(120000);
        if (authorization != null) connection.setRequestProperty("Authorization", authorization);
        if (uploadKey != null) connection.setRequestProperty("X-Upload-Key", uploadKey);
        return connection;
    }

    private static JSONObject readResponse(HttpURLConnection connection) throws Exception {
        int status = connection.getResponseCode();
        InputStream in = status < 400 ? connection.getInputStream() : connection.getErrorStream();
        String text = in == null ? "" : readStream(in);
        if (status >= 400) {
            String message = text;
            try {
                message = new JSONObject(text).optString("error", text);
            } catch (Exception ignored) {
                // Not JSON; show the raw text.
            }
            if (status == 401) message = "Your sign-in expired. Open the map, sign in again, then retry the upload.";
            throw new IllegalStateException(message);
        }
        return text.isEmpty() ? new JSONObject() : new JSONObject(text);
    }

    static String read(File file) throws Exception {
        return readStream(new FileInputStream(file));
    }

    private static String readStream(InputStream in) throws Exception {
        try (InputStream stream = in) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ArScene.copy(stream, out);
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    static void write(File file, String text) throws Exception {
        try (OutputStream out = new FileOutputStream(file)) {
            out.write(text.getBytes(StandardCharsets.UTF_8));
        }
    }

    static void deleteTree(File file) {
        File[] children = file.listFiles();
        if (children != null) for (File child : children) deleteTree(child);
        file.delete();
    }

    private static String hex(byte[] bytes) {
        StringBuilder out = new StringBuilder();
        for (byte b : bytes) out.append(String.format("%02x", b));
        return out.toString();
    }
}
