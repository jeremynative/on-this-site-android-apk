# On This Site Android APK

This repo builds a debug Android APK for the On This Site / Native Long Island mobile app.

The APK is a small Android WebView wrapper around the live mobile site:

`https://nativelongisland.com/archive-test/native-long-island-staging-site-20260516-100502/mobile-app-live.html`

Because it opens the hosted live mobile app, site content stays synced with Directus/live data without rebuilding the APK for every content update.

## Phone Updates With Obtainium

Most fixes do not require reinstalling the APK. UI, map, timeline, content, and data changes load from the live mobile page the next time the app refreshes.

Only reinstall the APK after native Android wrapper changes such as permissions, WebView behavior, or app packaging.

Best phone setup for this testing APK:

1. Install Obtainium from F-Droid or GitHub.
2. Add this GitHub repo as the app source:

`https://github.com/jeremynative/on-this-site-android-apk`

3. In Obtainium, let it watch GitHub Releases for APK updates.
4. Set the APK filter to `on-this-site-latest.apk` if Obtainium asks which file to use.
5. Allow Obtainium to install unknown apps when Android asks.

Stable latest release APK link:

`https://github.com/jeremynative/on-this-site-android-apk/releases/latest/download/on-this-site-latest.apk`

That link stays the same after future APK builds, so it can be bookmarked on your phone.

Current debug-build fallback link:

`https://github.com/jeremynative/on-this-site-android-apk/releases/download/latest-debug/on-this-site-latest-debug.apk`

Android will still usually ask you to approve each sideloaded update. Obtainium makes the checking/downloading easy; it does not bypass normal Android install approval.

## GitHub APK Artifact

GitHub Actions builds the APK on every push and manual workflow run.

Artifact name:

`on-this-site-debug-apk`

The artifact includes:

- `on-this-site-latest.apk`
- `on-this-site-latest-debug.apk`
- `on-this-site-debug-<run>-<commit>.apk`

The workflow also publishes debug APK files to a `Latest APK for phone testing` release so Obtainium can track the same latest-release URL during active testing.

## Signed Releases

For install-over-existing-app updates to work, every release APK must be signed with the same key.

Tag a release to build the signed APK:

```powershell
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions needs these repository secrets before tagged releases can build:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Keep the signing key and passwords backed up. If the key changes, Android will not install the new APK as an update over the existing app.

## Google Drive Archive

Target Drive folder:

`Art Project Documents and Images > On This Site > App APK`

Folder IDs:

- Latest APK folder: `1sfAI_MWpH91EVnAo2Q_bWUR-wQG8Gw1M`
- OLD folder: `12NPUpGl044BtywC0FWV9igPsCFHTDuDZ`

The workflow is ready to archive APKs to Google Drive when this GitHub secret exists:

`GDRIVE_SERVICE_ACCOUNT_JSON`

That secret should contain a Google Cloud service account JSON key. The service account email must be shared into the `App APK` and `OLD` Drive folders with Editor access.

When configured, each build will:

1. Move the previous `on-this-site-latest-debug.apk` into `OLD` with a run-specific name.
2. Upload the new build as `on-this-site-latest-debug.apk` in `App APK`.

## Local Build

After Android Studio/JDK/Gradle are installed:

```powershell
.\build-debug-apk.ps1
```

Local APK path:

`app/build/outputs/apk/debug/app-debug.apk`
