const fs = require("fs");

const read = path => fs.readFileSync(path, "utf8");
const rootGradle = read("build.gradle");
const appGradle = read("app/build.gradle");
const manifest = read("app/src/main/AndroidManifest.xml");
const workflow = read(".github/workflows/build-release-apk.yml");
const activity = read("app/src/main/java/com/nativelongisland/onthissite/MainActivity.java");
const mobile = read("app/src/main/assets/assets/js/mobile-app.js");
const supportUtils = read("app/src/main/assets/assets/js/shared-support-utils.js");
const supportConfig = read("app/src/main/assets/assets/js/support-public-config.js");
const appBridge = read("app/src/main/java/com/nativelongisland/onthissite/AppBridge.java");
const billingManager = read("app/src/main/java/com/nativelongisland/onthissite/BillingManager.java");

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
requireMatch(workflow, /RELEASE_ABIS="arm64-v8a,armeabi-v7a" gradle lintRelease assembleRelease/,
  "CI must build and lint the compact Obtainium APK with both production ARM ABIs.");
requireMatch(workflow, /RELEASE_ABIS="arm64-v8a,armeabi-v7a,x86,x86_64" gradle bundleRelease/,
  "CI must build the Play AAB with all supported ABIs for per-device delivery.");
requireMatch(appGradle, /releaseNativeAbis[\s\S]*?RELEASE_ABIS[\s\S]*?abiFilters\.addAll\(releaseNativeAbis\)/,
  "Release packaging must accept the audited distribution-specific ABI list.");
requireMatch(workflow, /verify-native-library-compat\.js[\s\S]*?--expected=arm64-v8a,armeabi-v7a/,
  "CI must audit the exact production native ABIs and ELF segment alignment.");
requireMatch(workflow, /apk-native-audit[\s\S]*?app-release\.apk[\s\S]*?apk_native_root\/lib/,
  "CI must audit libraries extracted from the exact signed Obtainium APK rather than stale intermediates.");
requireMatch(workflow, /"\$ANDROID_HOME\/build-tools\/35\.0\.0\/zipalign" -c -P 16 -v 4 app\/build\/outputs\/apk\/release\/app-release\.apk/,
  "CI must verify 16 KB ZIP alignment on the signed Obtainium APK.");
requireMatch(workflow, /aab-native-audit[\s\S]*?base\/lib[\s\S]*?--expected=arm64-v8a,armeabi-v7a,x86,x86_64/,
  "CI must audit all four native architectures packaged in the Play App Bundle.");
requireMatch(workflow, /app\/build\/outputs\/bundle\/release\/app-release\.aab/,
  "CI must retain the Play App Bundle as an artifact.");
requireMatch(manifest, /android:allowBackup="false"/, "Backups must remain disabled for account-bearing app data.");
requireMatch(manifest, /android:usesCleartextTraffic="false"/, "Cleartext network traffic must remain disabled.");
requireMatch(manifest, /android:icon="@mipmap\/ic_launcher"/, "Manifest must use the adaptive launcher icon resource.");
requireMatch(manifest, /android:roundIcon="@mipmap\/ic_launcher_round"/, "Manifest must provide a round launcher icon.");
requireMatch(manifest, /android:dataExtractionRules="@xml\/data_extraction_rules"/,
  "Android 12+ backup and device-transfer exclusions must be explicit.");
requireMatch(manifest, /com\.android\.vending\.BILLING/, "Google Play Billing permission is missing.");
requireMatch(appGradle, /com\.android\.billingclient:billing:8\.2\.1/,
  "Google Play Billing 8.2.1 dependency is missing.");
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
requireMatch(mobile, /function nativeLocationPermissionGranted\(\)[\s\S]*?if \(!nativeLocationPermissionGranted\(\)\) return false;[\s\S]*?requestUserLocation\(\{ centerMap: false, silent: true/,
  "APK must reuse granted location permission without opening a new startup prompt.");
requireMatch(mobile, /data-find-nearby-sites/,
  "APK Nearby must offer a dedicated location action instead of showing an alphabetical archive list.");
forbid(mobile, "if (nativeAndroid && !isOfflineTextMode()) await requestStartupLocation();",
  "APK must not request location during startup.");
for (const productId of ["support_10", "support_25", "support_50", "support_100", "support_monthly_10", "support_monthly_25", "support_monthly_50", "support_monthly_100"]) {
  requireMatch(billingManager, new RegExp(`"${productId}"`), `Billing product is missing from the native allowlist: ${productId}`);
}
requireMatch(appBridge, /completePlayPurchase\(String token, String purchaseToken/,
  "The guarded WebView bridge cannot complete verified Play purchases.");
requireMatch(supportUtils, /playVerificationEndpoint/, "APK support form cannot request server-side Google Play verification.");
requireMatch(supportUtils, /completePlayPurchase/, "APK support form cannot consume or acknowledge a verified purchase.");
requireMatch(supportConfig, /\/support\/google-play\/verify/, "APK support config is missing the Google Play verification endpoint.");
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
