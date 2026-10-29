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

    /** Scans in app storage that were finished but not fully uploaded. */
    static File[] pending(File root) {
        File[] dirs = root.listFiles(f -> f.isDirectory() && new File(f, "meta.json").isFile() && !new File(f, "uploaded").exists());
        return dirs == null ? new File[0] : dirs;
    }

    /** Runs on a background thread. accessToken is only needed the first time (to create the session). */
    void upload(String accessToken) throws Exception {
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
            state.put("session_id", data.getString("id")).put("upload_key", data.getString("upload_key")).put("parts", parts);
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
        try (java.io.RandomAccessFile file = new java.io.RandomAccessFile(zip, "r")) {
            for (int idx = 0; idx < parts; idx++) {
                if (done[idx]) continue;
                progress.update("Uploading part " + (idx + 1) + " of " + parts, 5 + 90 * idx / parts);
                file.seek((long) idx * PART_BYTES);
                int length = (int) Math.min(PART_BYTES, zip.length() - (long) idx * PART_BYTES);
                file.readFully(buffer, 0, length);
                putPart(sessionId, key, idx, buffer, length);
            }
        }
        progress.update("Submitting for processing…", 97);
        request("POST", "/sessions/" + sessionId + "/finish",
            new JSONObject().put("parts", parts).put("frames", meta.optInt("frames")), null, key);
        write(new File(dir, "uploaded"), sessionId);
        // Keep meta/anchors as a receipt; the photos are now safely queued.
        deleteTree(new File(dir, "frames"));
        zip.delete();
        progress.update("Uploaded. Thank you!", 100);
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

    private void putPart(String sessionId, String key, int idx, byte[] data, int length) throws Exception {
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
                    out.write(data, 0, length);
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
