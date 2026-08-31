package com.nativelongisland.onthissite;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.text.method.LinkMovementMethod;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class GoogleNavigationLegalActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        int padding = Math.round(18 * getResources().getDisplayMetrics().density);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(padding, padding, padding, padding);
        root.setBackgroundColor(Color.WHITE);
        TextView title = new TextView(this);
        title.setText("Google navigation legal notices");
        title.setTextColor(Color.rgb(23, 59, 43));
        title.setTextSize(22);
        title.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        root.addView(title, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        Button close = new Button(this);
        close.setText("Close");
        close.setOnClickListener(view -> finish());
        root.addView(close, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        ScrollView scroll = new ScrollView(this);
        TextView body = new TextView(this);
        body.setText("Loading legal notices…");
        body.setTextColor(Color.rgb(35, 45, 40));
        body.setTextSize(13);
        body.setTextIsSelectable(true);
        body.setMovementMethod(LinkMovementMethod.getInstance());
        scroll.addView(body, new ScrollView.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        root.addView(scroll, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        setContentView(root);
        new Thread(() -> {
            String notices = readAsset("google-navigation-notice.txt");
            String licenses = readAsset("google-navigation-licenses.txt");
            runOnUiThread(() -> body.setText(notices + "\n\nOpen-source licenses\n\n" + licenses));
        }, "ots-google-navigation-legal").start();
    }

    private String readAsset(String name) {
        try (InputStream input = getAssets().open(name); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) >= 0) output.write(buffer, 0, count);
            return new String(output.toByteArray(), StandardCharsets.UTF_8);
        } catch (Exception error) {
            return "Could not load " + name + ".";
        }
    }
}
