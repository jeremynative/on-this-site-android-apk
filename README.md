# On This Site Android APK

This repo builds the Android APK for the On This Site / Native Long Island mobile app.

The APK is a small Android WebView wrapper around the live mobile site:

`https://nativelongisland.com/archive-test/mobile-app-live.html`

Because it opens the hosted live mobile app, site content stays synced with Directus/live data without rebuilding the APK for every content update.

## Android Package

The app package must stay stable so Android can install future APKs as updates:

`com.nativelongisland.onthissite`

Do not change `applicationId` unless this is intentionally becoming a different app.

## Versioning Before Public Release

Until the app is truly public, APK releases should stay below version `1.0`.

GitHub Actions sets:

- `versionCode` to the GitHub Actions run number.
- `versionName` to `0.1.<run number>` for testing releases.
- `versionName` to the tag name for tagged public-style releases.

Android requires `versionCode` to increase for updates. The workflow handles this automatically for GitHub-built APKs.

Use `1.0.0` only for the first real public release.

## Phone Updates With Obtainium

Most fixes do not require reinstalling the APK. UI, map, timeline, content, and data changes load from the live mobile page the next time the app refreshes.

Only reinstall the APK after native Android wrapper changes such as permissions, WebView behavior, or app packaging.

Best phone setup for this testing APK:

1. Install Obtainium from F-Droid or GitHub.
2. Add this GitHub repo as the app source:

`https://github.com/jeremynative/on-this-site-android-apk`

3. In Obtainium, let it watch GitHub Releases for APK updates.
4. Set the APK filter to:

`on-this-site-latest.apk`

5. Allow Obtainium to install unknown apps when Android asks.

Stable latest release APK link:

`https://github.com/jeremynative/on-this-site-android-apk/releases/latest/download/on-this-site-latest.apk`

Android will still ask you to approve each sideloaded update. Obtainium makes checking and downloading easier; it does not bypass Android install approval.

## Signed Releases

For install-over-existing-app updates to work, every published APK must have:

- The same package/applicationId: `com.nativelongisland.onthissite`
- The same signing certificate
- A higher `versionCode`

GitHub Actions publishes the APK asset used by Obtainium:

`on-this-site-latest.apk`

This APK is signed with the stable release key stored in GitHub Actions secrets. If those secrets are missing, the workflow must fail instead of publishing a differently signed APK that would conflict on phones.

GitHub Actions needs these repository secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Keep the signing key and passwords backed up. If the key changes, Android will not install the new APK as an update over the existing app.

Tag a release if you want a named release version:

```powershell
git tag v0.1.50
git push origin v0.1.50
```

Normal pushes to `main` also build signed testing releases as `0.1.<run number>`.

## Google Drive Archive

Target Drive folder:

`Art Project Documents and Images > On This Site > App APK`

Folder IDs:

- Latest APK folder: `1sfAI_MWpH91EVnAo2Q_bWUR-wQG8Gw1M`
- OLD folder: `12NPUpGl044BtywC0FWV9igPsCFHTDuDZ`

The workflow is ready to archive APKs to Google Drive when this GitHub secret exists:

`GDRIVE_SERVICE_ACCOUNT_JSON`

That secret should contain a Google Cloud service account JSON key. The service account email must be shared into the `App APK` and `OLD` Drive folders with Editor access.

## Local Builds

Local debug builds are only for direct developer testing. Do not publish debug APKs for Obtainium.

```powershell
.\build-debug-apk.ps1
```

Local debug APK path:

`app/build/outputs/apk/debug/app-debug.apk`

Release builds require the same signing environment variables used by GitHub Actions. If they are missing, Gradle intentionally fails instead of creating an APK that would conflict with Obtainium updates.
