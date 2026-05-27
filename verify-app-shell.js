const fs = require("fs");

const expectedBuild = "20260527-android-polygon-dispatch-28";
const expectedUrl = "https://nativelongisland.com/archive-test/mobile-app-live.html";
const mainActivityPath = "app/src/main/java/com/nativelongisland/onthissite/MainActivity.java";

const source = fs.readFileSync(mainActivityPath, "utf8");

function requireText(text, message) {
  if (!source.includes(text)) {
    throw new Error(message);
  }
}

requireText(`APP_VERSION = "${expectedBuild}"`, `Android shell build id must be ${expectedBuild}.`);
requireText(expectedUrl, `Android shell must load ${expectedUrl}.`);
requireText("?app-version=", "Android shell must pass the app build id to the mobile web app.");
requireText("&apk-version=", "Android shell must pass the APK version to the mobile web app.");
requireText("&refresh=", "Android shell must use a refresh token when loading the mobile web app.");
requireText("Cache-Control", "Android shell must request a fresh copy of the mobile web app.");
requireText("dispatchTouchEvent", "Android shell must forward app taps into the mobile map.");
requireText("window.onAndroidMapTap", "Android shell must call the mobile map tap bridge.");
requireText("MotionEvent.ACTION_UP", "Android shell must only forward completed taps.");
requireText("path.startsWith(\"/.well-known/sgcaptcha/\")", "Android shell must keep SiteGround CAPTCHA inside the APK WebView.");

console.log(`Android shell verifier passed: ${expectedBuild}`);


