# Google Play release readiness

Updated: August 10, 2026

## Automated release gates

- Package: `com.nativelongisland.onthissite`
- Minimum Android: API 23
- Compile and target Android: API 36
- CI outputs the existing signed universal APK for Obtainium and a separately retained signed Android App Bundle for Google Play.
- When the repository secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` is present, each successful main-branch Obtainium release also publishes the matching bundle to the Google Play closed-testing `alpha` track. Documentation-only and workflow-only commits do not create app releases, and tagged `v*` releases are deliberately excluded from this beta automation.
- Release builds require the existing keystore environment variables; unsigned release APKs and bundles fail closed.
- Android backup and cleartext traffic are disabled.
- The camera is optional; no background-location, broad-storage, or all-packages permission is declared.
- Camera capture uses a non-exported private provider.
- Adaptive and legacy launcher icon resources are present.
- The generated bundle contains no native `.so` libraries, so there is no NDK binary alignment exposure; CI stops if a native library is added without a new 16 KB page-size audit.
- The APK no longer initiates the Android location prompt during startup. Location begins only from a location-dependent action such as Near me, check-in, or Use my location.
- `node verify-google-play-readiness.js` locks these requirements in CI.

## Play Console data-safety working inventory

Confirm every answer against the production Directus configuration and Mapbox terms immediately before submission.

| Play data category | Current app use | Collection/sharing draft |
| --- | --- | --- |
| Name and email | Contributor registration, login, public display name | Collected for account management and app functionality; email is not public |
| User IDs | Directus account/profile IDs | Collected for account management and security |
| Precise/approximate location | Near me, check-in distance, site suggestions, plant/map stories | Requested only in the foreground after user action; exact coordinates are processed for map features and may be submitted when the user intentionally contributes location-based content |
| Photos | Optional comment, plant, story, and profile contributions | Collected only after the user chooses or captures and submits media |
| Other user-generated content | Comments, site suggestions, feedback, language attempts, check-ins | Collected for app functionality and community moderation |
| App activity | Check-ins, learning progress, points, contribution activity | Collected for app functionality and account features |
| Device or other IDs | Locally generated identifiers may be used by contribution/story flows | Verify production request payloads and declare if transmitted |
| Diagnostics | No native crash-reporting SDK is currently bundled | Recheck all web-loaded third-party scripts before submission |

All first-party traffic is HTTPS. Mapbox is a third-party mapping service and must be included wherever its production data handling qualifies as collection or sharing under the current Data safety definitions.

## Manual blockers before external/production testing

1. Enter the published `https://nativelongisland.com/privacy-policy.html` and `https://nativelongisland.com/account-deletion.html` URLs in Play Console. Confirm that deletion requests sent to `onthissiteny@gmail.com` are monitored and fulfilled, including associated user data.
2. Complete the Play Console Data safety and data-deletion forms using the verified production inventory above.
3. Enroll in Play App Signing. Keep the current keystore as the upload key unless the account owner intentionally separates upload and app-signing keys. Record certificate fingerprints before upload.
4. Complete Play developer identity verification and package-name registration for `com.nativelongisland.onthissite`.
5. Supply store listing copy, contact details, app category, content rating, target-audience declaration, screenshots, feature graphic, and a reviewer login/instructions for gated contributor features.
6. Upload the CI-produced `.aab` to an internal testing track first. Review the pre-launch report and generated device catalog before closed or production release.
7. On one physical Samsung device, verify: clean install with no startup permission dialog; Near me contextual location request; denial fallback; check-in distance; camera and library comment photos; notification opt-in; login/registration; offline recovery; search and keyboard submit; account deletion entry point.

For automated closed-testing uploads, grant the service account access only to this app and only the permissions needed to manage testing-track releases. If the repository secret is absent, the Play step is skipped and the Obtainium release still completes normally.

Do not describe the app as production-ready until the Play Console declarations are accepted and the internal-track review has passed.
