const fs = require("fs");

const read = path => fs.readFileSync(path, "utf8");
const rootGradle = read("build.gradle");
const appGradle = read("app/build.gradle");
const manifest = read("app/src/main/AndroidManifest.xml");
const workflow = read(".github/workflows/build-release-apk.yml");
const activity = read("app/src/main/java/com/nativelongisland/onthissite/MainActivity.java");
const mobile = read("app/src/main/assets/assets/js/mobile-app.js");

function requireMatch(source, pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

function forbid(source, text, message) {
  if (source.includes(text)) throw new Error(message);
}

requireMatch(rootGradle, /com\.android\.application"\s+version\s+"8\.(?:1[0-9]|[2-9][0-9])\./,
  "Android Gradle Plugin must support API 36.");
requireMatch(appGradle, /compileSdk\s*=\s*36/, "Google Play build must compile with API 36.");
requireMatch(appGradle, /targetSdk\s*=\s*36/, "Google Play build must target API 36.");
requireMatch(workflow, /platforms;android-36/, "CI must install Android platform 36.");
requireMatch(workflow, /assembleRelease bundleRelease/, "CI must build both the Obtainium APK and Play AAB.");
requireMatch(workflow, /lintRelease assembleRelease bundleRelease/, "CI must run Android lint before publishing either artifact.");
requireMatch(workflow, /Native libraries require an explicit 16 KB page-size compatibility audit/,
  "CI must stop if an unaudited native library enters the Play bundle.");
requireMatch(workflow, /app\/build\/outputs\/bundle\/release\/app-release\.aab/,
  "CI must retain the Play App Bundle as an artifact.");
requireMatch(manifest, /android:allowBackup="false"/, "Backups must remain disabled for account-bearing app data.");
requireMatch(manifest, /android:usesCleartextTraffic="false"/, "Cleartext network traffic must remain disabled.");
requireMatch(manifest, /android:icon="@mipmap\/ic_launcher"/, "Manifest must use the adaptive launcher icon resource.");
requireMatch(manifest, /android:roundIcon="@mipmap\/ic_launcher_round"/, "Manifest must provide a round launcher icon.");
requireMatch(manifest, /android:dataExtractionRules="@xml\/data_extraction_rules"/,
  "Android 12+ backup and device-transfer exclusions must be explicit.");
requireMatch(manifest, /android:name="\.CaptureFileProvider"[\s\S]*?android:exported="false"/,
  "The capture provider must remain private.");
for (const permission of [
  "ACCESS_BACKGROUND_LOCATION",
  "MANAGE_EXTERNAL_STORAGE",
  "READ_EXTERNAL_STORAGE",
  "WRITE_EXTERNAL_STORAGE",
  "QUERY_ALL_PACKAGES"
]) forbid(manifest, permission, `Forbidden broad permission is present: ${permission}`);
requireMatch(activity, /setMixedContentMode\(WebSettings\.MIXED_CONTENT_NEVER_ALLOW\)/,
  "WebView mixed content must remain blocked.");
requireMatch(activity, /window\.__nliAllowGeoUntil=0/,
  "Bundled fallback must not grant a startup location-request window.");
requireMatch(activity, /validateLoadedAppShell\(String url\) \{\s*if \(!isAppShellUrl\(url\)\) return;/,
  "Privacy and account-deletion pages must not be rejected by the app-shell watchdog.");
requireMatch(mobile, /async function requestStartupLocation\(\) \{\s*if \(isNativeAndroidApp\(\)\) return false;/,
  "APK location must wait for an explicit user action.");
forbid(mobile, "if (nativeAndroid && !isOfflineTextMode()) await requestStartupLocation();",
  "APK must not request location during startup.");
for (const icon of [
  "app/src/main/res/mipmap-anydpi/ic_launcher.xml",
  "app/src/main/res/mipmap-anydpi/ic_launcher_round.xml",
  "app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
  "app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml"
]) {
  if (!fs.existsSync(icon)) throw new Error(`Launcher icon resource is missing: ${icon}`);
}
for (const file of [
  "app/src/main/res/drawable/ic_launcher_monochrome.xml",
  "app/src/main/res/xml/backup_rules.xml",
  "app/src/main/res/xml/data_extraction_rules.xml"
]) {
  if (!fs.existsSync(file)) throw new Error(`Play quality resource is missing: ${file}`);
}

console.log("Google Play code-readiness verifier passed (API 36, AAB, permissions, icons, WebView).");
