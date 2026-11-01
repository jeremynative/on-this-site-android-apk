package com.nativelongisland.onthissite;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Where the browser hands a Google or Facebook sign-in back to the app:
 * sso-app-return.html opens onthissite://signin with an intent naming this
 * package. A refresh token is passed on only with the state value the app
 * saved when it opened the browser (MainActivity.openSignIn), and only within
 * half an hour; a failure is passed on as one. Then the main screen takes it
 * and this closes.
 */
public class SignInReturnActivity extends Activity {
    private static final long MAX_AGE_MS = 30 * 60 * 1000L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Intent main = new Intent(this, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        String result = result(getIntent());
        if (result != null) main.putExtra(MainActivity.EXTRA_SIGN_IN_RESULT, result);
        startActivity(main);
        finish();
    }

    private String result(Intent intent) {
        SharedPreferences prefs = getSharedPreferences(MainActivity.PREFS_NAME, MODE_PRIVATE);
        String expected = prefs.getString(MainActivity.PREF_SIGN_IN_STATE, "");
        String provider = prefs.getString(MainActivity.PREF_SIGN_IN_PROVIDER, "");
        long startedAt = prefs.getLong(MainActivity.PREF_SIGN_IN_STARTED_AT, 0L);
        // Not a sign-in this app started (or too long ago): nothing to pass on.
        if (expected.isEmpty() || System.currentTimeMillis() - startedAt > MAX_AGE_MS) return null;
        String state = intent.getStringExtra("state");
        String token = intent.getStringExtra("refresh_token");
        String error = intent.getStringExtra("error");
        try {
            JSONObject out = new JSONObject().put("provider", provider);
            if (token != null && !token.isEmpty() && error == null) {
                // Someone else's token must not sign the visitor in.
                if (!expected.equals(state)) return null;
                out.put("refresh_token", token);
            } else {
                out.put("error", error == null || error.isEmpty() ? "NO_SESSION" : error);
            }
            prefs.edit()
                .remove(MainActivity.PREF_SIGN_IN_STATE)
                .remove(MainActivity.PREF_SIGN_IN_PROVIDER)
                .remove(MainActivity.PREF_SIGN_IN_STARTED_AT)
                .apply();
            return out.toString();
        } catch (JSONException failure) {
            return null;
        }
    }
}
