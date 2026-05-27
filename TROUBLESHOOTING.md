# Troubleshooting

## Obtainium Says Conflict Or Android Refuses To Update

Android can only update an installed app when the new APK has all three of these:

- The same package name: `com.nativelongisland.onthissite`
- The same signing certificate
- A higher `versionCode`

Obtainium cannot bypass these Android rules.

This repo previously published debug-signed APKs from normal pushes and release-signed APKs from tagged releases. Those APKs can have the same package name but different signing certificates, which Android treats as a conflict.

The workflow now publishes one APK asset for Obtainium:

`on-this-site-latest.apk`

Use this APK filter in Obtainium:

`on-this-site-latest.apk`

Stable latest APK URL:

`https://github.com/jeremynative/on-this-site-android-apk/releases/latest/download/on-this-site-latest.apk`

## One-Time Reinstall May Be Needed

If the app currently installed on the phone came from an older debug APK or from a different signing key, Android will reject the next release APK as a conflict.

Fix:

1. Uninstall the currently installed On This Site app once.
2. Install the newest `on-this-site-latest.apk` from GitHub Releases through Obtainium.
3. Future updates should install normally as long as the signing key stays the same and `versionCode` keeps increasing.

## Signing Notes

Debug APKs are signed with a debug key. They are useful only for active phone testing and should not be treated as a public release.

Published Obtainium releases should use only one asset name:

`on-this-site-latest.apk`

## If A Future Release Fails

Check the GitHub Actions run:

- Signing secrets must exist.
- The workflow must build `assembleRelease`.
- The uploaded release asset must be `on-this-site-latest.apk`.
- The `versionCode` must be higher than the installed app.

If the signing key was lost or replaced, Android will require another uninstall/reinstall because it will see the APK as a different app owner.
