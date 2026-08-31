# Android APK — Codex Handoff

## August 31 in-app Google navigation and nearby edge indicators

- Branch `feature/in-app-google-navigation-20260831` replaces the rejected notification companion with an optional in-app Google Navigation SDK 7.6 experience. Existing article Directions links become Navigate only when a build contains a configured key; keyless builds retain the official Google Maps link and expose no dead navigation control.
- The native navigation screen calculates Google traffic-aware driving routes, provides voice/Bluetooth guidance and standard navigation UI, shows up to 8 screen-spaced nearby labeled On This Site pins, and lets a user confirm adding a selected public site as the next stop. It loads 250 current public Point records while excluding approximate, broad, reservation-wide, ceremonial, sensitive, burial, sacred, archaeological, private-residence, and other unsafe records. Google Maps remains available as a one-tap fallback.
- Removed the prior companion service, action activity, foreground-notification toggle, and companion JavaScript. No background-location permission was added. The Google API key is injected only from an ignored local file or the `GOOGLE_NAVIGATION_API_KEY` GitHub secret. Required Google terms and the SDK license are available from the navigation screen.
- Physical iPlay tablet QA passed first with a dummy key: the Navigate link opened the native activity, the screen layout and legal notice rendered, and the invalid-key timeout produced a clear authorization message after 15 seconds without crashing. A separate keyless build preserved Directions. Live Google Cloud QA then produced three traffic-aware route choices to Ma's House, rendered the spaced public pin labels without the earlier overlap, and successfully added Shinnecock Outpost Tax Demonstrations as an intermediate stop.
- Follow-up branch `feature/navigation-nearby-edge-indicators-20260831` adds up to three compact edge indicators for safe public sites within five miles but outside the current viewport. Each shows a map-relative arrow, live straight-line distance, cardinal direction, and opens the same Add stop confirmation. Tablet QA showed Sebonac Creek Settlement / Seponack at 3.7 mi N, Nippaug at 3.7 mi N, and Niamuck / Merosuck at 4.1 mi W; tapping Sebonac opened the correct route-through confirmation. A Google location-callback threading crash and an initial full-screen layout inheritance issue were both caught in QA, fixed, and absent from the final rerun. Build marker is `20260831-navigation-edge-indicators-r211`.
- `verify-app-shell.js`, Google Play readiness, JavaScript syntax, whitespace, debug build, optimized/R8 QA build, and ARM native-library/16 KB compatibility checks passed. The optimized universal ARM APK is 53,632,102 bytes. Google SDK resource-format and configuration-resolution warnings are non-fatal.
- Google Cloud project `On This Site Map API` already had a linked Maps billing account. Navigation SDK is now enabled. New QA and production credentials are each restricted to the matching Android package/signing SHA-1 and only the Navigation SDK; the production value is stored as encrypted GitHub secret `GOOGLE_NAVIGATION_API_KEY`. Legacy unrestricted 2017 keys were not reused or exposed. PR `#54` merged as `8a43d8c`; its signed publication was allowed to proceed while the edge-indicator follow-up was implemented.
- Edge-indicator PR `#55` merged as `d552397`. Workflow `33425185892` completed successfully and published Obtainium release `apk-618` / app `0.1.618`. The public APK is 53,630,174 bytes with SHA-256 `D3D5D24951078826540294245021822159F1591B8A65E97BE583F67C444B5D97`; it verifies with the existing production certificate, version code `618`, minimum API 24, and target API 36.
- Installed that exact public APK over production on the iPlay without clearing data. The existing first-install time remained `2026-08-11 12:52:41`. Production Google authorization succeeded, a live traffic-aware route to Ma's House reached `Route ready`, and the screen showed three compact edge indicators with live arrow/distance/direction. Tapping Lake Agawam opened the correct confirmation and Add stop changed status to `Historical stop added before Ma's House.` No production fatal exception or ANR appeared.
- Removed the separate QA package and deleted both temporary local plaintext key files after confirming the encrypted GitHub Actions secret. Only production `com.nativelongisland.onthissite` remains installed.

This navigation and nearby-edge-indicator release is complete. No immediate follow-up is required; future navigation changes should retain the safe-public-site filter, the three-indicator/five-mile limits, and production-key injection through GitHub Actions only.

## August 31 mobile map-first startup

- Unrouted mobile launches now begin with the map unobstructed: the bottom panel is collapsed, Nearby is the hidden selected feed, and no detail or sheet is opened. Routed links and restored active Android content still reopen their requested content, and desktop behavior is unchanged.
- Startup location is requested after map initialization, then retried after the Android WebView settles if its first provider request times out. The native geolocation gate now permits the automatic startup request while retaining the short permission window.
- Added regression coverage for the collapsed map-first state, startup location sequencing/retry, and an APK WebView audit. Build marker is `20260831-mobile-map-first-r206`.
- Physical iPlay 50 mini Pro QA passed with the packaged corrected runtime: both content feeds were hidden, no content surface was open, location became ready, and the map centered at zoom `10.5`. Wi-Fi was restored; production app data was not cleared. Web counterpart merged as PR `#158`.
- `node verify-app-shell.js`, `node verify-google-play-readiness.js`, `git diff --check`, debug APK build, and the real-device audit pass.

Current branch is `fix/mobile-map-first-user-center-20260831`, based on `origin/main` at `0173376`. Safest next action is to merge the focused Android PR, wait for the signed Obtainium workflow, verify the published version/hash, and install it over the connected production app without clearing data.

## August 31 biography introductions

- Synchronized the 34 reviewed biography article bodies from Directus/web into the maintained Android offline source archive, including Sunksqua Weany and the conservative Jeremiah Pharoah correction. No unrelated site, timeline, geometry, or Android-specific runtime data was replaced.
- Added a release guard requiring every reviewed biography to begin with its identifying `biography-introduction` paragraph. Exact parity with the web bundle was checked for all 34 articles.
- Bumped the native cache marker to `20260831-biography-introductions-r205` so installed apps request the newly deployed hosted runtime.
- `node verify-app-shell.js`, exact offline biography parity, `node verify-google-play-readiness.js`, `git diff --check`, and `build-debug-apk.ps1` pass.

Current branch is `content/biography-introductions-20260831`, based on `origin/main` at `bab9a71`. Safest next action is to merge the focused Android PR, wait for the signed Obtainium workflow, verify the published APK hash/version, and install it over a connected production app only if a device is available without clearing data.

## August 31 polygon shoreline edge audit

- Synced the audited deferred polygon geometry from web PR `#153` without replacing Android-specific UI/runtime files or enlarging the compact first-frame land mask. The bundled archive retains 439 site geometry rows and now includes 16 high-detail display polygons; cache version `20260831-shoreline-edge-audit-v4` prevents an older geometry snapshot from persisting after upgrade.
- Added a hard 2.85 MB deferred-geometry budget and exact row/detail checks to `verify-app-shell.js`. The detailed geometry remains post-startup work, so the lightweight initial map handoff is unchanged.
- Added `audit-apk-polygon-edge.mjs` for repeatable real-device verification of a routed polygon and its packaged geometry.
- On the USB iPlay 50 mini Pro, separate QA package testing passed both Wi-Fi and cleared-data airplane-mode cold starts. Corchaug opened as a `MultiPolygon` with all 439 geometry rows and 16 detailed rows; the packaged Corchaug geometry measured about 232 KB. No fatal exception or ANR appeared during the clean online/offline runs. The tablet's production `0.1.610` app and data remained untouched.
- `node verify-app-shell.js`, `node verify-google-play-readiness.js`, `git diff --check`, and `assembleDebug` pass. Shell marker is `20260831-polygon-edge-audit-r204`.

Current branch is `fix/polygon-edge-audit-20260831`, based on `origin/main` at `e712884`. Safest next action is to merge, wait for the signed Obtainium workflow, verify the exact published APK, and install it over the tablet production package without clearing data.

## August 29 Android performance and startup optimization

- Branch `codex/android-performance-20260829` removes the largest measured Android startup redundancies without changing public map behavior. The native map now becomes usable from compact geometry, then hydrates detailed site geometry once after the first stable frame instead of blocking the loading handoff and repeatedly rebuilding the same full state.
- Native viewport updates now skip unchanged bounds, occlusion, visibility, and blocked-touch payloads. Map padding/layout work only runs when its inputs change, and native tile prefetch is disabled to reduce offscreen graphics allocation.
- The Samsung search reconciliation loop now runs only while the search field is focused and the page is visible. Moving biography updates use the native bridge's 480 ms cadence instead of serializing frames faster than Java can apply them.
- Fixed a bundled-fallback race that could replace a successfully rendered native map with the browser-compatibility fallback after its deadline. Also restored missing shoreline-refinement constants that caused a bundled `ReferenceError`.
- Shared web runtime optimizations were merged as web PRs `#131` and `#132`; the first deployment succeeded and the final coalesced calendar-state deployment is being monitored before release.
- `node verify-app-shell.js`, `node verify-google-play-readiness.js`, the targeted web startup/motion/search/request verifiers, repeated debug builds, and S25 QA passed. On the S25, the bundled app reached a usable native map in roughly 2.1–2.7 seconds, Ma's House remained the first prediction/search result, and the compatibility fallback no longer replaced the rendered map. No fatal exception or ANR was observed.
- Commit `4c9ce44` contains the Android product changes. Safest next action: confirm the final web deployment, run one final live S25 startup trace, merge this branch, and verify the signed Obtainium/Google Play artifacts before calling the work live.

## August 23 Amethyst global-whaling route

- Added a small generic nineteenth-century bark that leaves Sag Harbor on a slow one-way eastbound route, fades at the route end, and resets invisibly. It is explicitly an illustrative global-whaling route rather than a reconstruction of the lost <em>Amethyst</em>.
- The WebView and native MapLibre paths share the same moving feature, open the Whaling article when selected, hide during contributor-profile map mode, and preserve the newer Android bearing/pitch camera synchronization.
- Added the four new Hunter/Shoemaker Historic Moments to the packaged timeline index. The live Directus content remains the source of truth; a later complete offline snapshot rebuild can embed the expanded article bodies.
- Build marker is `20260823-amethyst-global-whaling-r185`. `verify-app-shell.js`, JavaScript syntax, `git diff --check`, `assembleDebug`, and `lintDebug` pass.

Current branch is `feature/amethyst-moving-ship-r2-20260823`, based on `origin/main` at `944e49e8`. Safest next action is to merge this focused change and verify the signed Obtainium workflow; do not replace the Google Play release unless separately requested.

## August 23 ancestral-land Long Island launcher icon

- Replaced the former green map-pin launcher artwork with a Long Island silhouette divided across the exact 13 ancestral-land colors stored in the bundled site catalog. Adaptive, round, legacy, and Android themed/monochrome icon modes now share the Long Island identity.
- Added `scripts/generate-ancestral-launcher-icon.js`, which derives the simplified launcher-safe silhouette from the bundled Long Island land mask and reads the palette from the 13 canonical territory rows. This keeps future icon regeneration tied to project data instead of hand-copied artwork.
- Bumped the native shell marker to `20260823-ancestral-land-launcher-r183` and extended `verify-app-shell.js` so the old pin cannot silently return and every launcher mode must retain the new silhouette and palette.
- `verify-app-shell.js`, Google Play readiness, `git diff --check`, `assembleDebug`, and `lintDebug` pass. The separate QA package installed on the USB tablet and Android Recents rendered the new multicolor Long Island icon correctly; the QA package was removed afterward and the production app/data were not touched.

Current branch is `fix/apk-ancestral-land-icon-20260823`, based on `origin/main` at `a8700e4`. Safest next action is to merge this focused icon change, wait for the signed APK/AAB workflow, verify the exact published Obtainium icon, and upload that workflow's AAB to Google Play closed testing when the release is ready.

## August 18 Android 16 Back navigation repair

- Root cause: API 36 apps on Android 16 no longer receive the legacy `Activity.onBackPressed()` callback. The existing panel-first JavaScript handler and native exit dialog were correct but unreachable on the S25 Ultra.
- `MainActivity` now registers Android's supported `OnBackInvokedCallback` on API 33+, routes it through the same panel-first handler used on older Android versions, and unregisters it during activity destruction. The legacy override remains for API 23–32.
- Build marker is `20260818-android16-back-r168`. The shell verifier now requires platform callback registration, lifecycle cleanup, and the existing web-layer/exit-dialog contract.
- `node verify-app-shell.js`, `git diff --check`, `assembleDebug`, and `lintDebug` pass.
- Exact final QA was installed separately as `com.nativelongisland.onthissite.qa` over wireless ADB. On the S25, Back closed Ma's House while keeping the QA activity foregrounded, then dismissed the remaining search/panel state, then displayed the native `Exit app?` dialog with Cancel and Exit. A cleared-data cold start also reached the dialog after collapsing the default bottom panel. No fatal exception or ANR was logged.
- QA was removed. Signed production `0.1.578` and its data remain untouched and foregrounded; device `stay_on_while_plugged_in` remains restored to `15`.

Current branch is `fix/android-back-dispatch` based on `origin/main` at `78be3e7`. Safest next action is to commit, push, publish the next signed Obtainium release, then upload that exact workflow AAB to Play closed testing after confirming how Play handles the already-reviewing 0.1.578 release.

## August 18 Google Play 0.1.578 submission and S25 install

- Uploaded exact workflow `32205332662` artifact `on-this-site-play-bundle` (`app-release.aab`, 23,333,609 bytes, SHA-256 `481DB13A95961B907E54A356E68FD05C7A1366779761FEE36C12A1079073EDEC`) to Google Play closed-testing Alpha at 100% rollout.
- Play recognized `578 (0.1.578)`, target SDK 36, four ABIs, the embedded ReTrace mapping, zero lost devices in every form-factor category, and an estimated 11.7 MB new-install download. The only warning is optional native debug symbols.
- Publishing Overview confirmed `1 change sent for review` and currently shows `Changes in review`. The prior 0.1.568 release remains available to testers until review completes; 0 testers are currently opted in.
- Installed exact public APK SHA-256 `93C2A3CC6F2140AE73A5D33DE40D7B9A69984BC7AEF5952ED3E6A440603F22F7` over the S25 Ultra's 0.1.577 install. Package state verified version code/name `578` / `0.1.578`, preserved first-install time `2026-06-01 10:41:17`, and update time `2026-08-18 21:50:21`.
- The S25 USB connection became unavailable after launch evidence was captured on-device, before it could be pulled. On a brief reconnect, the original `stay_on_while_plugged_in` value `15` was restored and read back successfully. Wireless ADB at `192.168.50.193:5555` then enabled the complete smoke pass: exact 0.1.578 cold-launched in 680 ms, rendered 439 listings / 93 wiki articles, opened Ma's House, and remained alive with no app fatal exception or ANR.
- The smoke pass confirmed one pre-existing APK regression: Android Back leaves the app for the prior Android activity instead of closing an open site panel. After closing the panel with its X, Back also leaves without showing the required exit-confirmation dialog. This needs a focused lifecycle/back-dispatch fix before the next APK release; it is not a crash and does not block the current Play review.

Current branch is `optimize/apk-size-startup` at `b68be74`; its remote feature branch is gone because PR `#15` merged to main as `78be3e7f5d2d63870bb3eef43b0c23a84d4c426b`. Safest next action is to wait for Play review, then verify the Alpha tester-facing version is 0.1.578. Implement and physically verify Android Back panel-closing and exit-confirmation behavior as the next focused APK change; the S25 stay-on setting is already restored.

## August 18 APK size reduction and modular offline archive

- Release packaging now excludes four redundant assets: the 9.7 MB legacy self-contained mobile shell, its 2.9 MB bundled duplicate, the desktop-only 1.15 MB map runtime, and the superseded 3.85 MB full-resolution land mask. Their maintained source files remain in the repository; only Android packaging excludes them.
- The legacy `/mobile-app.html` fallback URL now reuses the current modular `mobile-app-live.html` shell. Cold airplane-mode testing initially exposed two Directus-only configuration requests that blocked that modular shell; APK snapshot mode now bypasses those requests and loads its packaged site, geometry, wiki, and timeline indexes directly.
- Release builds now enable R8 code optimization and resource shrinking with explicit WebView JavaScript-interface keep rules. A non-debuggable `optimizedQa` build type provides future real-device coverage of the same shrinker behavior without replacing the production package.
- Signed-release-equivalent universal ARM size fell from 33,257,124 bytes to 27,032,583 bytes: 6,224,541 bytes / 18.72% smaller. The 5,350,542-byte PMTiles offline basemap, modular shell, site index, lightweight land mask, both ARM ABIs, and MapLibre native renderer remain packaged.
- Physical iPlay QA passed cleared-data cold starts for the minified build in both validated-Wi-Fi and airplane/offline modes. Online rendered the 439-listing/93-wiki live map; offline rendered the 439-listing/93-wiki saved archive and native bundled map. Menu/panel interaction and a JavaScript-to-Android location bridge call remained functional. No AndroidRuntime fatal or ANR was logged.
- `node verify-app-shell.js`, `node verify-google-play-readiness.js`, JavaScript syntax, `git diff --check`, `lintRelease`, `assembleRelease`, and the exact APK entry/mapping audit pass. The CDP-only offline audit scripts were not applicable without their local Chrome debugging endpoint; their real-device equivalents passed.

Current branch is `optimize/apk-size-startup`, based on `origin/main` at `cb94e8f` / public `apk-577`. Build marker is `20260818-apk-size-offline-r167`. Publish through the signed GitHub workflow, verify the public APK size/hash, then install it over production without clearing app data.

## August 18 startup map settled-frame handoff and APK size audit

- Follow-up build marker `20260818-startup-controls-settle-r166` closes the last signed-release gap found after `0.1.576`: the Daily map feature dock and activity/notification badge totals could still refresh during the first visible second. Startup now shares the app's existing full deferred-data promise, waits for its promo/badge refresh, and requires that DOM signature to remain stable before the cover fades. This does not add duplicate requests.
- Final instrumentation-free iPlay QA held the loader through second 6, revealed the complete map at second 7 with the star, information, learning, question, activity, and notification controls already present, and kept the same map camera/layout through second 10. Only the intentionally moving biography icons changed position. The complete native state remained 13 territories, 49 polygons, 388 sites, 51 custom icons, and 2 events, with no fatal exception or ANR.
- Fixed the native APK handoff that uncovered the map while detailed site geometry, deferred calendar/timeline data, the intentional site reveal, moving biography features, camera state, and native viewport were still changing.
- The Long Island loading cover now remains over both online and offline startup until the WebView is complete and the native renderer has held a fully composed frame stable for 900 ms. It still animates only once and does not restart during live-to-saved fallback.
- Physical iPlay QA passed repeated online and airplane/offline cold starts. Online startup now applied one complete native state (13 territories, 49 polygons, 388 sites, 51 custom icons, 2 events) before reveal; one-second screenshots showed a stable camera, controls, panels, and map from the first visible frame onward. Offline startup revealed only after the saved map index, region controls, bundled native state, and viewport were ready. No fatal exception or ANR was logged.
- `node verify-app-shell.js`, `git diff --check`, `assembleDebug`, and final `lintDebug` pass. Product changes are limited to `MainActivity.java`, `NativeMapController.java`, and `verify-app-shell.js`; build marker is `20260818-startup-map-settle-r165`.
- APK size was measured rather than inferred from the 57.46 MB multi-ABI debug build. The current signed universal ARM Obtainium APK is about 33.25 MB: MapLibre's arm64 and 32-bit native libraries account for about 17.9 MB, the offline PMTiles map 5.1 MB, and bundled app/data assets about 5.8 MB. The startup fix adds negligible size. Google Play's AAB already delivers ABI-specific splits. A future arm64-only Obtainium asset should reduce the common download to roughly 25 MB, provided a separate 32-bit fallback is retained and updater asset selection is verified.

Current branch is `fix/startup-controls-settle`, based on merged PR `#13` / `origin/main` at `19752bc`, with the focused r166 follow-up pending commit/publication. `0.1.576` is live and verified but still has the smaller control-dock pop; publish and verify the follow-up release before declaring the startup goal complete.

## August 18 native map labels, permanent territories, biography icons, and touch responsiveness

- Added a dedicated native point-site title layer at zoom 11.4+ while retaining the existing polygon and ancestral-land labels. Point labels participate in exact and expanded hit testing.
- Made the 13 bundled ancestral territories and their labels a permanent fallback whenever the WebView filter/state payload is empty or incomplete. Their fill, dotted boundary, and label layers stay visible independently of ordinary boundary toggles and in profile mode.
- Increased moving biography-person icon size across zoom levels and fixed their hit testing by querying the rendered frame before accepting a newer moving-source position.
- Coalesced moving-feature GeoJSON updates to 480 ms and replaced the slow native click callback with a bounded 300 ms app-owned tap confirmation that cancels on a second tap. Specific pins and site polygons now receive their accessible hit area before the broad territory beneath them.
- Hardened `verify-app-shell.js` for CRLF worktrees and added assertions for point labels, permanent territories, biography visibility, moving-source throttling, and tap confirmation.
- Tablet QA passed at zoom 8.4, 9.2, 11.2, 12.3, and 14.5; portrait and landscape; online self-hosted z14 and fully offline bundled z10; boundaries disabled; pin, polygon, biography, drag, panel, and rotation interactions. `assembleDebug`, `lintDebug`, `node verify-app-shell.js`, and `git diff --check` pass with no AndroidRuntime fatal.

Current working branch is `fix/lightweight-nearby-media-rebased` based on origin/main, with the focused native-map and verifier changes pending commit/release. QA screenshots are untracked and must not be committed. Safest next action is to commit, push, publish the signed Obtainium/Play artifacts, verify the exact signed APK, then restore the production app in portrait with normal Wi-Fi and rotation settings.

## August 12 compact numbered unread map badges

- Replaced the oversized outlined unread map circles with compact 12–14px red badges and no stroke. Point, polygon-detail, and territory badges use a 9px centered white count.
- Fixed the missing-number regression by moving every unread count layer above every badge-circle layer after the map finishes adding its other labels and overlays. The count symbols are non-optional and ignore placement so a red circle cannot render without its number.
- Synced the rebuilt hosted/mobile runtime from web commit `ef4fb2f9` and bumped the APK shell to `20260812-compact-unread-badges-r74`. Public Mapbox tokens remain build-time placeholders.
- `node verify-app-shell.js`, JavaScript syntax, `git diff --check`, and `build-debug-apk.ps1` pass.

Safest next action: publish the signed Obtainium release, inspect the exact APK for the compact/no-outline/required-count rules, and install it over a test device without clearing data.

## August 11 persistent content notification bundle

- Synced the tested mobile runtime for persistent per-content activity notifications into both Android fallbacks. Community Activity no longer clears merely because its panel opens; each update remains unread until the visitor opens the linked site/article or explicitly presses that card's Dismiss action.
- Added weighted per-site red map badges, a Knowledgebase total badge, and article/site card badges. Grouped activity keeps its member identities so the displayed count represents the actual number of unseen updates.
- APK shell build ID is `20260811-persistent-content-unread-r73`. The Android shell verifier now protects the item-key store, weighted count, map badges, Knowledgebase badge, Dismiss action, and absence of the former blanket-clear call.
- `node verify-app-shell.js`, JavaScript syntax checks, `git diff --check`, and `build-debug-apk.ps1` pass. The hosted APK runtime was separately deployed and read back with all new notification markers.

Safest next action: publish this focused APK bundle through the signed release workflow, verify the exact Obtainium artifact, and install it over an existing test device without clearing app data.

## August 11 Plant ID system-navigation clearance

- Added Plant-ID-specific Android bottom clearance so the expanded plant report form, its photo actions, and the in-app camera controls stay above gesture and three-button system navigation even if WebView briefly reports a partial inset while opening the drawer or returning from Camera.
- The shared site drawer keeps its existing position; only Plant ID receives the extra minimum clearance, avoiding a new blank gap elsewhere in the APK.
- Shell build ID is `20260811-plant-safe-area-r72`. Focused Plant ID/layout verification, shell verification, diff hygiene, and the debug APK build pass.
- Android WebView QA at 412x915 with a 24 CSS-pixel native bottom inset measured 56px Plant ID bottom padding, 72px drawer scroll padding, and both 44px photo buttons fully above the system navigation region. The temporary QA package was removed and the previously installed signed APK was left intact.

Safest next action: publish the signed Obtainium release, install it over the current APK without clearing data, and repeat the Plant ID open/photo-return check on a Samsung device using three-button navigation.

## August 11 APK learning-path navigation (publishing)

- Replaced the APK Learn action's hard-coded Knowledgebase route with a mobile-native Learning Paths browser backed by the public `learning_paths` and `learning_path_sites` collections.
- Bundled 3 public paths and 29 ordered stops for offline use, including path questions, short activities, progress saved on-device, and linked site navigation.
- Refreshed the offline catalog to the current 439 published sites while retaining the 305 currently published reviewed place-name quotations and their content-safety checks.
- Synced the mobile runtime, CSS, generated shells, media cache map, and site index/geometry from web commit `8b99446a`; raw Mapbox tokens remain excluded from the APK.
- APK shell ID is `20260811-mobile-learning-paths-r66`; `node verify-app-shell.js`, the token scan, `git diff --check`, and `build-debug-apk.ps1` pass.

Safest next action: push this focused APK bundle, wait for the signed Obtainium release, install that exact signed APK on the S25 without clearing data, and verify More -> Learn opens the 3 guided paths rather than Knowledgebase.

## August 11 S25 hardware QA and lowercase close control (publishing)

- Exact signed `0.1.467` was exercised on the connected Samsung S25 Ultra over stable wireless ADB while preserving app data and the signed-in Jeremy Dennis session.
- Passed on real hardware: cold launch without a blank screen, responsive `Ma's House` type-ahead and Samsung keyboard Search submission, GPS recenter, disabled grey `Checked In!` state, collapsed/full Timeline panel behavior, comment camera capture returning `Photo ready (41 KB)`, AR Story open/cancel, Plant ID camera open/cancel, and compact thumbnail tap restoring the full site header image.
- The close button already contains lowercase `x`, but its 18px Arial rendering looked uppercase on the S25. The focused UI adjustment sets the site-detail close glyph to 16px while retaining the explicit lowercase transform. The web source and both generated mobile shells are synchronized at web commit `7b79d8d6`.
- APK shell ID is bumped to `20260811-close-control-r65`; `node verify-app-shell.js`, the public-token scan, `git diff --check`, and `build-debug-apk.ps1` pass.

Safest next action: push this focused APK bundle, wait for the signed Obtainium workflow, install the exact signed release on the S25 without clearing data, and visually confirm the smaller lowercase close glyph.

## August 11 startup-watchdog correction (pending release)

- Reproduced a premature live-to-offline fallback on the Android 16 emulator with the exact signed 0.1.466 release. During a heavily loaded cold start, WebView process creation consumed most of the 22-second watchdog before the main page request began, leaving the actual hosted app only a few seconds before fallback.
- `MainActivity.onPageStarted` now restarts the bounded readiness watchdog when the trusted app shell actually begins loading. The emulator log proved the fallback moved from roughly 5 seconds after `onPageStarted` to the full allowance (over 22 seconds despite emulator stalls).
- Hardened the Android-injected panel CSS against a transitional page with neither `document.head` nor `document.documentElement`, removing the observed `appendChild` console exception.
- Bumped the native shell build ID to `20260811-startup-watchdog-r64`; `node verify-app-shell.js`, `git diff --check`, and `build-debug-apk.ps1` pass.
- The full offline emulator audit passes: all four region filters, 424/93 saved catalog counts, punctuation-normalized `Mas House` search, Ma's House text-only article, and no online media placeholders.
- The physical S25 was not attached. The emulator was severely CPU-starved by Google Play Services/WebView and could not complete the hosted live shell before the now-correctly timed fallback, so full online interaction coverage and real Samsung camera/location checks remain unverified.

Safest next action: commit and publish this focused native fix, verify the exact signed release/Obtainium artifact, then repeat cold online startup and camera/location flows on the S25 when USB is available.

## August 10 Google Play readiness release (pending publication)

- Upgraded the Android build to compile/target API 36 with Android Gradle Plugin 8.10.1 and Gradle 8.11.1. The release workflow now builds both the signed Obtainium APK and a Play-ready AAB, runs release lint/readiness checks, and uploads the AAB as a workflow artifact.
- Added adaptive/legacy/monochrome launcher icon coverage, explicit backup exclusions, package-visibility queries for camera/document selection, locale-safe string normalization, and a release-signing guard that also protects `bundleRelease`.
- Removed the native APK's startup location request. Location now prompts only after an explicit Near me, check-in, or Use my location action. A clean emulator launch showed no permission dialog; tapping Near me showed the contextual Android permission prompt and denial left the app usable.
- Added public `privacy-policy.html` and `account-deletion.html` pages and exposed both in the APK account screen. Web commits `36b1d22`, `c1aeb02`, and `e71174d` are deployed; workflow `31357939356` succeeded.
- Fixed the native readiness watchdog so first-party policy pages are not mistaken for a failed app shell and replaced by the archive. On `emulator-5554`, the account-deletion page remained open for 28 seconds with no readiness-timeout/fallback log, and Android Back returned to the app.
- Added `verify-google-play-readiness.js`, `build-play-bundle.ps1`, `docs/google-play-release-readiness.md`, and `docs/google-play-console-draft.md`. Focused shell/readiness checks, `assembleDebug`, `bundleDebug`, and `lintDebug` pass. The debug AAB contains no native `.so` libraries.
- The physical S25 was disconnected and deliberately untouched. All final behavior checks used `emulator-5554`.

Safest next action: commit only the focused Play-readiness files, push `main`, wait for the GitHub release workflow, then verify the exact signed APK and AAB artifact. Play Console account setup, store listing submission, Data Safety answers, privacy/deletion URLs, app access instructions, content rating, and signing enrollment remain manual publisher actions.

Updated: August 10, 2026

## August 9 APK 460 lifecycle restoration release

- Android commit `64fd546` (`Restore APK reading state after cold starts`) is pushed to `main`; workflow `31345324112` succeeded and published Obtainium `apk-460` / `0.1.460`.
- Web commits through `d22b479` preserve a meaningful article snapshot during native startup fallback, reapply reading position after layout and map startup, and prevent async comment refresh from resetting the article to the top. SiteGround workflow `31344808075` succeeded.
- Debug build `20260809-lifecycle-restore-r59` passed pause/resume, Android Back, portrait/landscape rotation, broad UI audit, and real forced-stop restoration of Ma's House at visible scroll `479.619`, matching the stored value.
- Exact signed APK SHA-256: `18246E6A16CEEBEC6CC5AFCADB56D11CFE0B7B6AE11143F2088AA00BC01E5CC1`. It is installed on `emulator-5554` as version code `460` / name `0.1.460`; the signed build rendered the offline archive and automatically recovered to the live map when validated networking returned.
- Preserve the unrelated tracked generated map/data modifications and all untracked audit/emulator artifacts.

Safest next action: when the S25 reconnects, install 0.1.460 through Obtainium and repeat the article process-restoration plus authenticated contributor interaction checks. Signed builds disable CDP, so exact scroll-value instrumentation is available only in the matching debug runtime.

## August 9 APK 459 permission, recovery, and search stability release

- Android commit `3004a75` (`Stabilize APK permissions and recovery`) is pushed to `origin/main`.
- Runtime permission dialogs now suspend both native startup fallback paths. Location, camera, file-capture, plant-photo, comment-photo, and notification permission requests all mark the prompt active; readiness checks restart only after Android returns the result.
- A denied location request is remembered for the Activity session, preventing the live page from immediately opening a second identical permission dialog.
- A validated connection that fails while recovering from the offline archive no longer leaves the APK offline indefinitely. Failed live recovery stays usable in the saved archive, waits 30 seconds, and retries without overlapping attempts.
- Shared search runtime commit `e6f1e25` is deployed through web workflow `31339565750`. Typing remains type-ahead only, submitting hides autocomplete and opens maximized results, and tapping the visible search field again restores predictions.
- Static verification and build passed: `node verify-app-shell.js`, JavaScript syntax, focused diff checks, and `build-debug-apk.ps1`.
- Android 16 emulator evidence:
  - held the location permission dialog open beyond 25 seconds; no `live-startup-timeout` or `app-readiness-timeout` replaced the live page;
  - denying location returned to the app and did not open a second prompt;
  - airplane-mode cold start passed the complete offline audit, including four region filters and the cached Coopers Beach article with no online media;
  - restoring networking recovered automatically to the 424-listing, 93-wiki, 10-blog, 4-calendar live shell;
  - an intentionally invalid WebView proxy forced two live recovery failures while Android networking remained validated; the offline archive stayed usable, the 30-second retry fired each time, and the app returned live automatically after the proxy was removed;
  - actual search typing for `mas` left the existing map/list context unchanged, ranked Ma's House first, hid suggestions on submit, opened the maximized results view, and restored suggestions after an actual tap back into the visible field;
  - `audit-apk-startup.mjs` and the broad `audit-apk-webview.mjs` passed with no layout, panel, hit-target, or overlap failures.
- GitHub Actions run `31340174253` succeeded and published latest Obtainium/GitHub release `apk-459` / `On This Site Android 0.1.459`.
- Exact signed APK: 3,937,702 bytes, SHA-256 `6A451A745194817F141E47E50632CAC490B59D628190F1AF9D0757901497C319`.
- The exact signed release was installed and reported version code `459` / version name `0.1.459`. Its permission dialog also remained stable beyond the watchdog threshold. Signed 459 is left installed on `emulator-5554`; airplane mode is off and the global HTTP proxy is unset.
- Preserve unrelated modified generated geometry/index/map files and all existing untracked audit artifacts. New exact-release download is under `release-459-test/`.

Safest next action: when the S25 is available, update it through Obtainium to 0.1.459 and repeat the permission, keyboard-search, offline/recovery, and comment-photo smoke tests on Samsung hardware. The broader authenticated login/profile/comment/vote/language/map-story persistence pass still needs an approved disposable contributor account.

## July 30 synchronized-runtime smoke check

- No Android source or package change was required for the desktop-only movement/world-overlay fix.
- Web deployment workflow `30527587978` successfully synchronized its mobile web runtime to the APK VPS after uploading SiteGround.
- Existing emulator `emulator-5554` still reports installed signed app `0.1.422` / version code `422`.
- A forced cold launch showed the loading screen, then reached the normal mobile shell with 424 listings, 93 wiki articles, 10 blog posts, and 4 calendar events. Nearby listings rendered normally.
- The current app process remained foreground and its recent process log contained no fatal app or WebView errors.
- Preserve every existing untracked screenshot, copied asset, generated file, and audit artifact. Safest next action remains the broader signed-APK interaction audit; no Android rebuild is needed for this desktop-only release.

## Repository state

- Repository: `jeremynative/on-this-site-android-apk`
- Branch: `main`, tracking `origin/main`
- Latest commit: `ea69923` — `Prevent APK cold-start fallback bounce`
- That startup/offline recovery fix was deployed and its GitHub Actions run was reported successful.
- There are currently hundreds of untracked generated assets and APK audit artifacts. They predate this handoff and must not be deleted or bulk-cleaned without inspecting them.

## Immediate task

Investigate why an APK timeline item can show `Read` when it has only coordinates and no usable linked content. Audit the underlying timeline data and UI decision logic. A public timeline item should link to actual article, site, wiki, or calendar content; otherwise it must not present a dead reading action.

Also audit, in a separate bounded pass:

- wrong feature activation when markers overlap polygons,
- duplicate touch handling,
- panel positioning and scroll targets,
- offline search/article/map behavior.

## Safe starting procedure

1. Run `git status --short --branch`.
2. Treat the current untracked assets and screenshots as preserved user/project work.
3. Identify the timeline source of truth and the code that decides whether `Read` is displayed.
4. Make the smallest coherent fix.
5. Add or run focused regression checks.
6. Update this file with findings, verification, and the next action.

## July 27 timeline-integrity work

Completed locally; not committed, pushed, or deployed.

### Bundled fix

- Bundled the rebuilt full and live mobile shells from the web repository.
- Bundled the 1,374-row timeline index with explicit `site` and `wiki_article` relationships.
- Bundled updated mobile, Directus-config, and shared timeline utilities.
- Valid published relationships now resolve even when `source_type` describes research provenance rather than a UI content type.
- `Full article`, `Read history`, and `Learn more` are suppressed unless published content resolves.
- Timeline taps use the same filtered event list as the visible card, so a filtered index cannot open the wrong moment.
- The 14 coordinate-only draft Montaukett moments use `Show on map`.
- The 14 draft-linked moments without coordinates expose no primary action.
- Public Mapbox tokens were replaced with `__NLI_MAPBOX_TOKEN__`.
- Bumped `APP_VERSION` and the shell verifier expectation to `20260727-timeline-integrity-r9`.

### Verification

- `node verify-app-shell.js` passed.
- JavaScript syntax checks passed for the copied mobile/config/timeline assets.
- Packaged fallback audit: 1,374 total, 1,346 linked, 14 map-only, 14 no-action.
- 497 linked moments with provenance-oriented source types resolve through explicit relationships.
- `.\build-debug-apk.ps1` completed successfully.
- Debug APK: `app/build/outputs/apk/debug/app-debug.apk`.
- ADB is installed, but `adb devices -l` reported no attached device. No on-device tap behavior is claimed.

### Repository state

- Branch: `main`, tracking `origin/main`.
- HEAD remains `ea69923` (`Prevent APK cold-start fallback bounce`).
- Focused tracked changes:
  - `app/src/main/assets/mobile-app.html`
  - `app/src/main/assets/mobile-app-live.html`
  - `app/src/main/assets/assets/data/mobile-timeline-index.json`
  - `app/src/main/assets/assets/js/mobile-app.js`
  - `app/src/main/assets/assets/js/shared-directus-config.js`
  - `app/src/main/assets/assets/js/shared-timeline-utils.js`
  - `app/src/main/java/com/nativelongisland/onthissite/MainActivity.java`
  - `verify-app-shell.js`
- All pre-existing untracked screenshots, XML captures, generated site assets, and audit artifacts remain untouched.

### Safest next action

Attach an Android device and install `app/build/outputs/apk/debug/app-debug.apk`. Verify:

1. a relationship-restored moment opens its real site/wiki article,
2. a draft Montaukett moment offers `Show on map`, not `Read`,
3. a draft-linked moment without coordinates has no primary action,
4. the same rules hold in the bundled offline fallback.

If those checks pass, selectively commit the focused tracked files, push `main`, and watch the APK workflow.

## July 27 deployment result

- Committed the focused APK bundle as `44e7019` (`Bundle timeline content action fixes`).
- Pushed `44e7019` to `origin/main`.
- GitHub Actions run `30285359854` completed successfully.
- The app-shell verifier, signed release build, artifact upload, and Obtainium testing-release publication all passed.
- Published `apk-405` / `On This Site Android 0.1.405` with `on-this-site-latest.apk`.
- `apk-405` is the latest GitHub/Obtainium release and the tag resolves exactly to `44e7019`.
- Branch `main`, HEAD and `origin/main`: `44e7019`.
- All existing untracked screenshots, XML captures, generated asset copies, and audit artifacts remain preserved.
- No device was attached, so no on-device behavior is claimed.

The release is complete. The safest next action is to install/update to `apk-405` and verify:

1. a relationship-restored moment opens its real site/wiki article,
2. a Montaukett coordinate-only moment shows `Show on map`,
3. a targetless event exposes no primary action,
4. all three rules remain correct after an offline cold start.

## Post-release archive and device check

- Confirmed no physical Android device is attached through ADB.
- Confirmed no Android emulator is installed/configured.
- The workflow's Google Drive steps skipped because `GDRIVE_SERVICE_ACCOUNT_JSON` is not configured.
- Downloaded the exact signed `apk-405` release artifact and verified SHA-256 `5AED8F31DE43D11DC2B2B001167578AF8D3AC3B358F37C286411FA7467D82F7B`.
- Uploaded that signed artifact to the configured Google Drive latest folder as `on-this-site-latest.apk`.
- Drive file ID: `11GBImTfjmkF5dw5Y8GGmaB9yftPGIECt`.
- Drive readback confirmed a 3,880,889-byte Android package.
- No prior latest APK existed in that folder, so no OLD-folder copy was necessary.

The only remaining release check is on-device behavior. Attach a USB-debugging Android device, then install/update `apk-405` and run the online/offline timeline smoke tests above.

## APK 405 emulator verification

Completed July 27, 2026:

- Used the existing workspace `medium_phone` AVD with Android 16 and WHPX acceleration.
- Installed the exact signed `apk-405`; package metadata reported version code `405` and version name `0.1.405`.
- The first launch's location permission dialog delayed readiness and caused a fallback. Once permission was granted, a clean online cold start loaded the live map successfully.
- Timeline event `1206`, “Uncawamuck (Reeve's Creek) in Indian Place-Names,” displayed `Read` and opened its real full site article.
- Coordinate-only Montaukett event `334` displayed a map action and no `Read`.
- Targetless event `790`, “Wallage is recorded in a Thompson paper,” displayed no `Read`.
- Airplane-mode cold start opened the lightweight offline archive immediately.
- Offline search for `Uncawamuck` found and opened the cached text-only article.
- Re-enabling connectivity recovered automatically from the offline archive to the live map.

Confirmed follow-up defects:

1. Closing the linked article with its `X` allowed the delayed native map-tap bridge to activate the underlying map, unexpectedly selecting Corchaug Ancestral Land.
2. Montaukett event `334` has a long title that pushes its timeline action row below the viewport until the tray is swiped.

No tracked source changes were made. Branch `main`, HEAD and `origin/main` remain `44e7019` / `apk-405`. The safest next action is a focused fix for close-tap propagation and timeline-tray sizing, with emulator regression checks before publishing a follow-up APK.

## Prompt for a fresh Codex task

Copy this into a new task opened from this repository:

> Read the root `AGENTS.md`, the root `CODEX_HANDOFF.md`, and this repository's `CODEX_HANDOFF.md`. Inspect Git status first and preserve all existing untracked generated assets and test artifacts. Fix the APK timeline-integrity bug where an event can show `Read` despite having only coordinates or no real content linkage. Audit all public timeline entries, repair valid links, suppress dead reading actions for orphan entries, and add focused regression coverage. Verify online and offline behavior, then update this handoff. Keep the task bounded and do not use the legacy June 16 Codex task.

## APK 406 interaction release

Completed July 27, 2026:

- Bundled the deployed mobile close-tap fix.
- Changed the APK timeline tray override from four explicit content rows to five, reserving the last row for actions.
- Constrained full timeline mode to the available panel height so action buttons cannot fall into an implicit overflow row.
- Bumped the app build ID to `20260727-apk-interaction-r10`.
- Added shell-verifier checks for the five-row layout and contained panel height.
- `node verify-app-shell.js` passed.
- `.\build-debug-apk.ps1` passed.

Emulator verification:

- Installed the debug APK on the Android 16 `medium_phone` emulator.
- Against the newly deployed live runtime, opened the Uncawamuck detail and closed it with an actual ADB tap.
- The asynchronous native overlay probes returned after the detail disappeared, but the shared interaction marker still caused `Map bridge result: false`.
- No underlying map feature opened and no selected map label remained.
- Navigated to timeline event `334`; its long title, source, teaser, and `Map` action all fit inside the visible card without scrolling.
- Accessibility bounds placed the `Map` action at `[157,1942][535,2037]`, fully on-screen.

Deployment and signed-release verification:

- Committed as `32333f3` (`Fix APK overlay taps and timeline tray`) and pushed to `origin/main`.
- GitHub Actions run `30294526850` succeeded.
- Published latest release `apk-406` / `On This Site Android 0.1.406`.
- Signed APK size: 3,880,943 bytes.
- Signed APK SHA-256: `CAF76D417760A73716056C2F798B99E0EFE002816E1B5B3A969EC4C65E2455CF`.
- Installed the exact signed artifact; Android reported version code `406` and version name `0.1.406`.
- Signed APK 406 cold-started online, opened the 424-listing/93-wiki offline archive with networking disabled, and automatically recovered to the fully loaded live app after networking returned.

Google Drive:

- Archived the prior latest APK 405 in `OLD` as `on-this-site-previous-before-run-316-32333f3.apk`, file ID `1ACo1CoqAqn1LL8TXF10A0pQv-FkwgriD`.
- Replaced the stable latest file in place with signed APK 406, preserving file ID `11GBImTfjmkF5dw5Y8GGmaB9yftPGIECt`.
- Drive readback confirmed the latest APK MIME type and 3,880,943-byte size.

Branch `main`, HEAD and `origin/main`: `32333f3`.

All pre-existing untracked screenshots, XML captures, generated assets, and audit artifacts remain preserved. The emulator remains available, with signed APK 406 installed and networking restored. The safest next action is the broader authenticated account/points/feedback audit plus continued overlap-priority testing for site markers, biography icons, and territories.

## APK 407 Community Activity release

Completed July 27, 2026:

- Synced the corrected `mobile-app.html`, bundled live shell, and `assets/js/mobile-app.js` from web commit `d0154ae`.
- Removed the redundant post-await activity-sheet render.
- Added a stable activity-sheet content signature so background refresh callers cannot replace identical contents or reset scroll.
- Bumped the Android build ID to `20260727-activity-feed-r11`.
- `node verify-app-shell.js` passed.
- `.\build-debug-apk.ps1` completed successfully.
- On the Android 16 `medium_phone` emulator, WebView mutation instrumentation recorded one Community Activity render and a stable 40-item sheet for 12 seconds against the deployed live page.
- Committed as `6ce7d5d` (`Prevent APK activity feed reloads`) and pushed to `origin/main`.
- GitHub Actions run `30302117348` succeeded.
- Published latest Obtainium release `apk-407` / `On This Site Android 0.1.407`.
- Signed APK size: 3,881,596 bytes.
- Signed APK SHA-256: `38F80A6F05687AA41D29F011C235C6513909517DD7991A8CCD41EC652644C1A8`.
- Installed the exact signed release artifact; Android reported version code `407` and version name `0.1.407`.
- Signed APK 407 completed its cold start to the live map with 424 listings, 93 wiki articles, 10 blog posts, and 4 calendar events.

Branch `main`, HEAD and `origin/main`: `6ce7d5d`.

All earlier untracked audit files remain preserved. New untracked verification artifacts include `apk-407-online.png`, `apk-407-ready.png`, and the downloaded `release-407/` signed artifact directory. The safest next action is the broader authenticated account/points/feedback audit plus continued overlap-priority, panel-position, map-story, and offline-interaction testing.

## APK 408 UI, loader, and feedback release

Completed July 28, 2026:

- Audited the Android 16 `medium_phone` emulator in portrait and landscape.
- Verified overlap touch priority with actual taps:
  - biography icon over map features opened Elizabeth Thunder Bird Haile;
  - site marker over a territory opened West Woods Sweat Lodge;
  - territory-only tap opened Shinnecock Ancestral Land.
- Exercised search, map layers, basemaps, location/nearby, timeline, promo cards, main menu pages, login validation, feedback capture/delivery, and offline search/article/map behavior.
- Exercised all 46 public mobile timeline events: 44 valid reading actions opened content, two map-only events used map actions, and no dead `Read` action remained.
- Bundled the shared fixes for Learn, Directus-backed Blog posts, the 41vh map, Mapbox attribution spacing, spotlight control suppression, and landscape control/panel layout.
- Replaced the text-only native startup cover with a pulsing Long Island outline and `Loading On This Site`.
- The native cover now yields as soon as valid WebView content is visible, exposing the web Long Island animation while the map finishes.
- Extended `audit-apk-webview.mjs` to check Learn/Blog content, settled panel bounds, spotlight suppression, attribution/control overlaps, and portrait/landscape behavior.
- Added `audit-apk-feedback.mjs` for screenshot capture, submission response, and delivery verification.
- A labeled screenshot-feedback test returned HTTP 204 and `Feedback sent. Thank you.`; Directus record `5944` read back as private, pending, and screenshot-attached.
- `node verify-app-shell.js` passed.
- `build-debug-apk.ps1` passed.
- The production emulator audit passed with no overlaps and no failures.

Release:

- Commit `92c7018` (`Polish APK layout and startup loader`) pushed to `origin/main`.
- GitHub Actions run `30369466948` succeeded.
- Published latest Obtainium/GitHub release `apk-408` / `On This Site Android 0.1.408`.
- Signed APK size: 3,894,536 bytes.
- SHA-256: `13670c81dd4ec5553e8c3c7ab6f5b2e7c5d248f1f5b4049d2e660f32a6a9940c`.
- Installed the exact signed artifact; Android reported version code `408` and version name `0.1.408`.
- Signed APK 408 showed both corrected loader stages, reached the live 424-listing/93-wiki app, opened the offline archive with networking disabled, and automatically recovered when networking returned.

Repository state:

- Branch `main`, HEAD and `origin/main`: `92c7018`.
- All prior and new screenshots, XML files, downloaded release folders, generated assets, and audit artifacts remain untracked and preserved.
- `CODEX_HANDOFF.md` remains intentionally untracked.

Authenticated limitation:

- Live backend probes passed for account/session reliability, points, comments/votes, language attempts, map stories, and cross-session sync.
- No disposable contributor credentials were available on the emulator. Do not create or modify a real contributor account merely to complete UI testing.

Safest next action: use an approved disposable contributor account for the remaining UI-level authenticated login/profile/comment/vote/language/map-story persistence pass across desktop and APK.

## APK 409 activity/menu overlap release

Completed July 28, 2026:

- Synced the deployed mobile shells and shared mobile CSS from web commit `e7aaa31`.
- The floating Community Activity and notification buttons now hide while either the `More` or `Labels` top menu is expanded, then return after it closes.
- Extended `audit-apk-webview.mjs` to open both menus and require both floating controls to have no rendered bounds while each menu is open.
- Bumped the Android build ID to `20260728-apk-menu-overlap-r13`.
- `node verify-app-shell.js` passed.
- The debug APK build completed successfully.
- The Android 16 `medium_phone` emulator audit passed with no failures or control overlaps. Both menu results reported `floatingControlsHidden: true`.
- A direct emulator probe confirmed both controls had `display: none` and zero width/height with More open.

Release:

- Commit `d9ed7b0` (`Keep APK feed controls clear of menus`) pushed to `origin/main`.
- GitHub Actions run `30377312279` succeeded.
- Published latest Obtainium/GitHub release `apk-409` / `On This Site Android 0.1.409`.
- Signed APK size: 3,894,587 bytes.
- SHA-256: `B7E8F5CF9FE0328FA9724916B6473519249F7F420F914BD3B568EB8B79236B03`.
- Installed the exact signed artifact over APK 408; Android reported version code `409` and version name `0.1.409`.
- An actual signed-release tap opened More with no Community Activity or notification button in the menu area.

Repository state:

- Branch `main`, HEAD and `origin/main`: `d9ed7b0`.
- All earlier untracked screenshots, XML files, generated assets, and audit artifacts remain preserved.
- `CODEX_HANDOFF.md` remains intentionally untracked.
- The signed APK 409 remains installed on the emulator with networking restored.

Safest next action: use an approved disposable contributor account for the remaining UI-level authenticated login/profile/comment/vote/language/map-story persistence pass, or address another bounded APK interaction report.

## APK 410 repeated location-button zoom release

Completed July 28, 2026:

- Synced the rebuilt mobile shells and `assets/js/mobile-app.js` from web commit `a605199`.
- The floating map location button now uses the original recenter behavior when the map is away from the user location.
- If already centered, every additional press zooms in exactly one level.
- Moving the map away resets the sequence, so the next press recenters at zoom `10.5`.
- Added `AppBridge.isDebugBuild()` so the web runtime can expose its location-control audit hook only in debug APKs.
- Added `audit-apk-location-control.mjs` and extended `verify-app-shell.js`.
- Bumped the Android build ID to `20260728-apk-location-zoom-r14`.
- `node verify-app-shell.js`, JavaScript syntax checks, `git diff --check`, and the debug APK build passed.
- The Android 16 `medium_phone` emulator audit passed:
  - away -> recentered at `10.5`;
  - next press -> `11.5`;
  - next press -> `12.5`;
  - pan away -> recentered at `10.5`.

Release:

- Commit `9a55577` (`Release repeated location-button zoom`) pushed to `origin/main`.
- GitHub Actions run `30381018515` succeeded.
- Published latest Obtainium/GitHub release `apk-410` / `On This Site Android 0.1.410`.
- Signed APK size: 3,896,203 bytes.
- SHA-256: `218783F5622847DEA9FBBD513CA7A099C16C92F74E99F3C7A468719BDB7712A0`.
- Installed the exact signed artifact over APK 409; Android reported version code `410` and version name `0.1.410`.
- The signed release started successfully to the live map with the location-based nearby list and expected activity, notification, timeline, and menu controls.

Repository state:

- Branch `main`, HEAD and `origin/main`: `9a55577`.
- All earlier untracked screenshots, XML files, generated assets, and audit artifacts remain preserved.
- `CODEX_HANDOFF.md` remains intentionally untracked.
- The signed APK 410 remains installed on the emulator with networking restored.

Safest next action: use an approved disposable contributor account for the remaining authenticated UI persistence audit, or address another bounded APK interaction report.

## APK 411 Ma's House library-moment release

Completed July 28, 2026:

- Rebuilt and bundled the full and live mobile shells from clean web commit `9d59f8a`.
- The bundled offline archive contains the new 2022 Ma's House historic moment about John Jermain Memorial Library's donation of more than 400 Native American books and the searchable online catalog.
- Preserved `__NLI_MAPBOX_TOKEN__` runtime substitution and verified no raw Mapbox public token remains in either bundled HTML file.
- Bumped the Android build ID to `20260728-mas-house-library-r15`.
- Added a shell-verifier assertion for the bundled historic moment.
- `node verify-app-shell.js`, token checks, `git diff --check`, and `build-debug-apk.ps1` passed.

Release:

- Commit `0c9be61` (`Bundle Ma's House library moment`) pushed to `origin/main`.
- GitHub Actions run `30384194262` succeeded.
- Published latest Obtainium/GitHub release `apk-411` / `On This Site Android 0.1.411`.
- Signed APK size: 3,885,998 bytes.
- SHA-256: `82F7A1D2F251C4C116696CFAD2D15DF4138B75C46C30EF53FA58509485DDC02D`.
- Tag `apk-411` resolves exactly to `0c9be61`.
- Installed the exact signed APK on the Android 16 `medium_phone` emulator; Android reported version code `411` and version name `0.1.411`, and `MainActivity` resumed successfully.
- Extracted the signed package's `assets/mobile-app.html`; it contains the new title and catalog wording, keeps the token placeholder, and contains no raw Mapbox token.

Repository state:

- Branch `main`, HEAD and `origin/main`: `0c9be61`.
- All earlier untracked screenshots, XML captures, generated assets, and audit artifacts remain preserved.
- New release verification artifacts are under `release-411/`.
- `CODEX_HANDOFF.md` remains intentionally untracked.

Safest next action: routine visual content QA of the Ma's House timeline card in the signed APK; no APK deployment step remains for this addition.

## APK 412 general place-name quotation release

Completed July 28, 2026:

- Synced the corrected offline and bundled-live mobile shells from web commit `3fcd8d23`.
- The bundled offline archive contains 307 distinct quotations that discuss place names or naming in general.
- Added a release verifier that rejects missing/repeated quote blocks, text not explicitly about place names, named outside people/places/countries, and homeland/territory-specific claims.
- Preserved `__NLI_MAPBOX_TOKEN__` runtime substitution and verified no raw Mapbox token remains in either bundled shell.
- Bumped the Android build ID to `20260728-general-place-name-quotes-r16`.
- `node verify-app-shell.js`, JavaScript syntax, token checks, `git diff --check`, and the debug build passed.
- On the Android 16 `medium_phone` emulator, build 412 opened Accabonac and displayed the new UNGEGN general place-name quotation with author, work, year, and PDF page. The territory-specific check was false.

Release:

- Commit `d90e45b` (`Bundle general place-name quotations`) pushed to `origin/main`.
- GitHub Actions run `30411156694` succeeded.
- Published latest Obtainium/GitHub release `apk-412` / `On This Site Android 0.1.412`.
- Signed APK size: 3,936,595 bytes.
- SHA-256: `E03A2B2B27207715E4B3022644468401461205541791533B57A8346A84EA4A9A`.
- Tag `apk-412` resolves exactly to `d90e45b`.
- Installed the exact signed release on the emulator; Android reports version code `412`, version name `0.1.412`, and resumed `MainActivity`.
- Direct inspection of the signed package found 307 place-name listings, 307 distinct quotations, no Tsilhqot'in quotation text, no homeland/territory-specific quotation claim, the token placeholder, and no raw Mapbox token.

Repository state:

- Branch `main`, HEAD and `origin/main`: `d90e45b`.
- All earlier untracked screenshots, XML captures, generated assets, and audit artifacts remain preserved.
- New release verification artifacts are under `release-412/`; `apk-412-debug-startup.png` is an untracked emulator artifact.
- `CODEX_HANDOFF.md` remains intentionally untracked.

Safest next action: routine visual sampling of additional place-name listings in the signed APK. No APK deployment step remains for this correction.
## July 29 diverse place-name quotation package (ready to release)

- Synced the revised public place-name catalogue: 306 distinct, general-audience quotations, including the removal of Amagansett Indian Well from the place-name category.
- Updated the Android build marker to `20260729-diverse-place-name-quotes-r17` and tightened the package verifier for the 306-card catalogue and `placenames` wording.
- Restored Android's existing `__NLI_MAPBOX_TOKEN__` build-time placeholder in both bundled shells; no raw Mapbox token is packaged.
- `node verify-app-shell.js`, `git diff --check`, and the local debug APK build passed.
- Installed the debug build on the existing Android 16 `medium_phone` emulator. It starts and loads the live mobile shell; the emulator permission prompt was accepted.
- The web deployment for commit `8dc7669` completed successfully in workflow `30422544432`.

Current Android branch: `main`; the intended tracked changes are `MainActivity.java`, `verify-app-shell.js`, `mobile-app.html`, and `mobile-app-live.html`. Existing generated assets, screenshots, and other untracked artifacts remain preserved and must not be bulk staged or removed.

Safest next action: selectively commit these four Android files, push `main`, and confirm the signed Obtainium/GitHub APK workflow succeeds.

## July 29 diverse place-name quotation package (released)

- Android commit `061c793` (`Bundle diverse place-name quotations`) was pushed to `origin/main`.
- GitHub Actions workflow `30422781711` completed successfully, including its strict shell verifier and signed release build.
- The current Obtainium/GitHub release is `apk-413` / `On This Site Android 0.1.413`, targeting `061c793`, with signed asset SHA-256 `382e49515645db6dbcd74427cbebf59b796a01f911af38d2b226b657563ea171`.
- The web counterpart was deployed successfully in workflow `30422544432` from web commit `8dc7669`.
- Existing untracked generated assets, screenshots, and audit artifacts remain deliberately preserved; do not bulk-stage or remove them.

Safest next action: routine visual sampling of additional live listings and an Obtainium update on a real device, if desired; this place-name quotation deployment is complete.

## July 29 activity-control header overlap fix (released)

- Bundled the shared mobile fix that anchors activity and notification controls 28px inside the actual map top on native Android, avoiding overlap with a tall header/menu.
- `node verify-app-shell.js`, the local debug build, and a full Android 16 `medium_phone` emulator install passed.
- The emulator portrait capture confirmed the activity and notification controls are entirely inside the map rather than over the header boundary.
- Android commit `6a48d38` (`Keep activity controls inside Android map`) was pushed to `origin/main`.
- GitHub Actions workflow `30463402959` succeeded and published `apk-414` / `On This Site Android 0.1.414`.
- Signed APK SHA-256: `37b60733b3e8a0d5ea5d786fe6d4f5d76a9ba8f2f1b9e3a0a2bd0c523b231adb`.
- Existing untracked generated assets, screenshots, and audit artifacts remain deliberately preserved.

### Exact Samsung device confirmation

- Connected and tested the user's Samsung Galaxy S25 Ultra (`SM-S938U1`, 1080×2340, Android Debug Bridge authorized).
- It already had signed `apk-414` installed. The captured signed-in layout confirmed the activity button begins inside the map below the header/menu boundary, with no overlap.
- The device capture is retained locally as `s25-activity-fix.png`; the preceding USB settings capture is `s25-before-activity-fix.png`.

Safest next action: install `apk-414` through Obtainium or on a USB-debugging-enabled real device to compare the exact phone layout; the focused overlap fix is released.

## July 29 map regression audit APK release

- Bundled the matching biography-animation, attached-story-position, and immediate-story-refresh fixes.
- Android commit `a2f50b4` (`Bundle map regression fixes`) completed workflow `30474660183` successfully and published the Obtainium testing APK.
- `node verify-app-shell.js` and the local debug build passed before publishing.
- Preserve all pre-existing untracked assets, screenshots, and audit artifacts.

## July 29 public timeline source-record APK release

- Bundled the mobile repair so public primary/source-record moments without a linked site/wiki record no longer disappear from the APK timeline.
- Both bundled shells contain all 1,375 public moments, including 288 unlinked source records. The existing action resolver keeps those cards safe: no dead article action is shown.
- Added package checks for the full count, retained unlinked records, and absence of the old linked-source-only filter.
- Restored Android's build-time Mapbox-token placeholders after syncing the generated shells.
- `node verify-app-shell.js`, `build-debug-apk.ps1`, and `git diff --check` passed.
- Android commit `f91835c` (`Bundle public timeline source records`) was pushed to `main`. Workflow `30475467088` succeeded and published `apk-416` / `On This Site Android 0.1.416`.
- Signed APK: `on-this-site-latest.apk`, 4,000,505 bytes, SHA-256 `3ee970be990e582ded541efd210b23377943e74c91c8635408ba2c2931843b94`.
- Preserve all prior untracked screenshots, captured assets, and audit artifacts. Safest next action: update a real Android device to APK 416 and verify an unlinked source record appears without a Read action.

## July 29 clean APK-416 emulator audit

- Created a separate Android 16 `nli_audit_416` AVD so the existing `medium_phone` emulator and its app data were not touched.
- Installed the exact signed `apk-416` artifact and verified its SHA-256 is `3ee970be990e582ded541efd210b23377943e74c91c8635408ba2c2931843b94` before launch.
- A fresh signed-release startup reached the map, then completed its deferred load with 424 listings, 93 wiki articles, 10 blog posts, and 4 calendar events.
- Installed the matching debug build only on that disposable AVD for inspection. `audit-apk-webview.mjs` and `audit-apk-startup.mjs` passed: tested controls had correct hit targets, panels were within the viewport, menus suppressed the floating controls, and no control overlaps were reported.
- The location zoom audit does not pass against this emulator's non-Long-Island simulated location: it successfully performs the initial recenter to zoom 10.5 but the location is immediately considered outside the normal Long Island view. This is not evidence of a production regression; repeat it with a Long Island mock location or the connected S25 Ultra.
- No source, generated shell, or release changes were made. The new clean-emulator screenshots/XML and `release-416/` signed artifact are local audit artifacts; preserve them as untracked files.

## July 29 immediate map-story APK package

- Synced the web mobile shells and runtime so Android refreshes visitor stories directly when the map becomes ready rather than waiting for idle time.
- Restored Android's build-time Mapbox-token placeholders in both shells and the bundled JavaScript; the shell verifier caught and prevented a raw-token copy during this sync.
- Bumped the Android build marker to `20260729-immediate-map-stories-r21` and added a verifier rule that rejects the old idle-scheduled story refresh.
- `node verify-app-shell.js`, `build-debug-apk.ps1`, and `git diff --check` passed.
- Android commit `55911b9` (`Refresh APK stories at map startup`) completed workflow `30477461033` successfully and published `apk-417` / `On This Site Android 0.1.417`.
- Signed asset `on-this-site-latest.apk`: 3,999,190 bytes, SHA-256 `570b9eaad97ade01173047d3d108f4bba3149fa12907ec311fb3ad60b0d9e5fe`.
- Existing untracked screenshots, copied assets, generated data, and audit artifacts remain preserved. Safest next action: confirm the signed release workflow, then test a newly submitted story on an approved contributor account or a real device.

## July 29 attached-story proximity APK package

- Tightened the low-zoom offset used for an attached visitor-story bubble. It now tops out at 28px rather than 58px so it remains visibly tied to its listing while still clearing the site icon.
- Added a shell regression assertion covering the close offset in both bundled mobile shells. `node verify-app-shell.js`, `git diff --check`, and the local debug build passed.
- Android commit `a0482fc` (`Keep attached APK stories near their sites`) completed workflow `30479485459` successfully and published `apk-418` / `On This Site Android 0.1.418`.
- Signed asset `on-this-site-latest.apk`: 3,999,354 bytes, SHA-256 `b22690f6797e5315956a49ea26a63a88ee747ae242a52f0456ac8a45735a50ea`.
- Downloaded and hash-verified that signed APK, upgraded the disposable emulator, and confirmed it reached the live map shell with an active story marker and community-activity control and no startup error after a cold start.
- Existing untracked screenshots, copied assets, generated data, and audit artifacts remain deliberately preserved. Safest next action: test the exact overlap/touch behavior on the user’s S25 Ultra when it is connected.

## July 29 anonymous activity-feed APK package

- A fresh public community load is now considered synced for logged-out visitors. This removes the follow-on full refresh that could make the activity sheet appear to load a second time.
- Added an Android shell regression guard preventing the old profile-gated completion state. `node verify-app-shell.js`, local debug build, and diff checks passed.
- Android commit `c4774e6` (`Avoid duplicate APK activity refresh`) completed workflow `30480734848` successfully and published `apk-419` / `On This Site Android 0.1.419`.
- Signed asset `on-this-site-latest.apk`: 3,999,507 bytes, SHA-256 `f493a9bf9688e307cc22149fb0f9fca61eba946b225b4f5d5ade81c0730b27a1`.
- Existing untracked screenshots, copied assets, generated data, and audit artifacts remain deliberately preserved. Safest next action: use the connected S25 Ultra to verify the activity sheet and overlap tap priority on the signed release.

## July 29 promo-card map-tap follow-up

- Emulator testing showed the original promo action could dismiss its card yet let the same touch select the map underneath. The promo bridge had been invoked after the WebView click had already removed the card.
- Native `MainActivity` now invokes the promo-action bridge on `ACTION_DOWN`, before ordinary WebView dispatch and the delayed map-tap bridge. This lets its existing overlay mark suppress the following map touch.
- `node verify-app-shell.js` and `build-debug-apk.ps1` passed. Android commit `d0ea5b7` (`Claim APK promo actions before map taps`) completed workflow `30489780808` successfully and published signed `apk-421` / `On This Site Android 0.1.421`.
- The exact signed APK 421 was installed on `emulator-5554` and reached the live map normally after a clean permission reset. The daily promo is randomized and was not selected in the subsequent clean starts, so the final card-specific on-device tap proof remains the safest next action when a card appears.
- Preserve all existing untracked screenshots, copied assets, and generated data.

### Final signed-release touch proof

- After resolving the emulator notification prompt, the randomized Daily Learning card appeared in signed APK 421.
- Tapping its correctly scaled native `Not now` target dismissed the card and left the existing map position intact; no site or territory detail opened underneath. Screenshot: `C:\Users\JD\AppData\Local\Temp\on-this-site-421-dismiss-final.png`.

## July 29 APK biography-motion release

- Found the bundled APK shell still used the obsolete `animate === true` rule, so multi-stop biographies without an explicit literal-travel flag could appear as static icons in offline or cached fallback mode even though the live web map animated them.
- Bundled runtime and both fallback HTML shells now animate reviewed multi-stop biographies by default; `animate: false` remains the explicit per-record opt-out.
- Before land-mask data is ready, the marker uses the safe canoe state rather than depicting a person crossing water on foot.
- Added verifier coverage to reject the old explicit-travel-only rule and require the safe pre-land-mask state in every packaged runtime copy.
- `node verify-app-shell.js`, `git diff --check`, and the local debug APK build passed.
- Android commit `34929e7` (`Restore APK biography motion`) was pushed to `main`. GitHub Actions workflow `30492794612` succeeded, including the shell verification and signed release build.
- Published latest Obtainium/GitHub release `apk-422` / `On This Site Android 0.1.422`; signed asset SHA-256: `43a23d7a81bab3222fd30840cadb71b4d1ccddbe84e321922b1b2e61f97f844a`.
- The existing emulator has signed APK 421 installed; the local debug APK cannot be installed over it because it has the intentionally lower debug version code and a different signing certificate. Static package and build verification passed; install APK 422 for the exact signed on-device confirmation.
- Downloaded the exact signed APK 422 release and hash-verified it against the published SHA-256. Inspection of all three packaged copies (`mobile-app.html`, `mobile-app-live.html`, and `assets/js/mobile-app.js`) confirmed the default-motion rule and safe canoe state are present, and the obsolete explicit-travel-only rule is absent.
- Installed exact signed APK 422 over 421 on `emulator-5554`; Android reports version code `422` / version name `0.1.422`. It cold-started to the loaded 424-listing map. The corresponding desktop/web pre-land-mask canoe repair is deployed in web workflow `30493096481`; the APK’s online runtime receives that deployed fix as well.

## July 30 distinct place-name insight APK release

- Synced the rebuilt web mobile shell so the packaged offline archive contains the 58 corrected place-name quotations and source citations.
- Restored all three `__NLI_MAPBOX_TOKEN__` placeholders after the shell sync; package inspection found no raw `pk.` or `sk.` token and no BOM.
- Bumped the package build marker to `20260730-place-name-insights-r23` and aligned the Android quote validator with the reviewed general territory/homeland language rules.
- `node verify-app-shell.js`, `git diff --check`, and the local debug APK build passed.
- Android commit `b950ed8` (`Sync distinct place-name quotes offline`) was pushed to `main`.
- GitHub Actions workflow `30570172293` succeeded and published `apk-423` / `On This Site Android 0.1.423`: https://github.com/jeremynative/on-this-site-android-apk/releases/tag/apk-423
- Signed asset `on-this-site-latest.apk`:
  - 3,947,822 bytes;
  - SHA-256 `C8D2978BB6ADC5DB37F2A9350CB335C69BA9EA0B893F7B86325EC2925159B298`;
  - package `com.nativelongisland.onthissite`;
  - version code `423`, version name `0.1.423`, target SDK 35;
  - v1/v2 signature verification passed with one signer.
- The packaged `mobile-app.html` exactly matches the repository source after normalization and contains the new Areshunk William Wallace Tooker quotation/citation.
- Installed the exact signed release on `emulator-5554`; Android reported `0.1.423` / code `423`, and a cold launch reached the map with 424 listings and 93 wiki articles loaded.

Current branch, HEAD, and `origin/main`: `main` at `b950ed8`.

Preserve all existing untracked emulator screenshots/XML files, copied/generated asset files, and this untracked handoff.

Safest next action: allow Obtainium to update a real device to APK 423 and sample an affected listing offline. No further APK build or publishing step remains for this quotation batch.

## July 30 single-introduction APK release

- Synced the final mobile runtime from clean web commit `907a64f6`, using the self-contained `mobile-app-live-bundled.html` as the packaged live fallback.
- All packaged web assets use boundary-safe `__NLI_MAPBOX_TOKEN__` replacement. Verifiers found no raw public Mapbox token and preserved filename substrings that merely contain `pk.`.
- Added APK verifier coverage for:
  - the shared `siteIntroductionPresentation()` export;
  - structured and summary-fallback markers in all three bundled runtime representations;
  - absence of the obsolete unconditional article summary.
- Bumped the native build marker to `20260730-single-introduction-r24`.
- Independent Android review found no release blockers. `verify-app-shell.js`, JavaScript syntax checks, `git diff --check`, and the debug APK build passed.
- Android commit `a1994e6` (`Bundle single listing introductions`) is on `origin/main`.
- GitHub Actions workflow `30585748433` succeeded and published latest release `apk-424` / `On This Site Android 0.1.424`:
  - asset `on-this-site-latest.apk`;
  - 3,952,055 bytes;
  - SHA-256 `57B8DAA542EF29D077A881ACCB36B546CD4F435536C51AF7C41CA7CCA8E00A2B`;
  - package `com.nativelongisland.onthissite`;
  - version code `424`, version name `0.1.424`.
- Downloaded and hash-verified the exact signed release, installed it on disposable `emulator-5556`, and confirmed the 424-listing live map loaded.
- Signed-APK search opened Weckatuck. Visual inspection confirmed the hero is followed by tags and exactly one Introduction; the former standalone summary is absent.

Current branch, HEAD, and `origin/main`: `main` at `a1994e6`.

Preserve all existing untracked emulator screenshots/XML files, copied/generated asset files, and this intentionally untracked handoff.

Safest next action: allow Obtainium to update the real S25 Ultra to APK 424 and spot-check Weckatuck. No further APK publishing step remains for this repair.

## July 30 mobile Labels panel release

- Synced the deployed mobile Labels panel stacking fix and sticky side-by-side bulk controls into both packaged fallback shells.
- Added Android shell-verifier coverage for:
  - both bulk controls and their listeners;
  - header/panel stacking;
  - all primary/category/era state updates;
  - Biography Paths remaining false during bulk actions;
  - the 400 ms opening-touch guard.
- Bumped the native build marker first to `20260730-mobile-layer-menu-r25`, then to final `20260730-mobile-layer-menu-r26`.
- Local checks passed: `verify-app-shell.js`, packaged JavaScript syntax, token-placeholder audit, focused diff checks, and a clean debug APK build.
- Disposable emulator testing of the exact r26 package confirmed:
  - opening Labels did not alter `22/23`;
  - Disable all produced `0/23`;
  - Enable all produced `22/23`;
  - Biography Paths stayed unchecked;
  - the fixed panel stayed above the bottom map tabs.
- Commits/releases:
  - `10f0ff1` (`Bundle mobile label menu controls`) -> workflow `30592073488`, APK 425;
  - `9bd6f52` (`Exclude biography paths from bulk labels`) -> workflow `30593108692`, final APK 426.
- Final release:
  - tag `apk-426`, version `0.1.426`, code 426;
  - exact target `9bd6f525a3b09187df1ed58d81a906a78d7a090f`;
  - asset `on-this-site-latest.apk`, 3,954,549 bytes;
  - SHA-256 `1fa7410673eab6049d14ccdba601cae33525b9c2f22f207de6dd6aae86db25f9`.
- Downloaded and hash-verified the exact signed APK 426, then installed it over the existing app on S25 serial `R5CXC26KWJW` without clearing app data. Android reports version code 426/name 0.1.426.
- Real-device validation against the final deployed runtime confirmed correct panel layering, functional bulk controls, `0/23` then `22/23`, Biography Paths unchecked, and dotted biography routes removed.

Current branch, HEAD, and `origin/main`: `main` at `9bd6f52`.

Preserve all existing untracked emulator/S25 screenshots and XML files, copied/generated assets, and this intentionally untracked handoff.

Safest next action: no further APK publication is required. APK 426 is current and already installed and verified on the S25.

## July 30-31 native safe-area and S25 bottom-control releases

- Commit `fb9a040` (`Keep APK UI inside system bars`) added native window-inset capture for all four edges, exposed those values through `AppBridge`, notified the web runtime after rotation, and expanded the WebView audit across fixed controls, sheets, menus, Timeline actions, hit testing, and the bundled offline fallback.
- The packaged build marker became `20260730-native-safe-area-r29`. Local verifier, JavaScript syntax, offline/live portrait and landscape audits, debug build, and independent review passed.
- GitHub workflow `30600553488` published APK 427 / `0.1.427`:
  - signed asset size 3,959,157 bytes;
  - SHA-256 `6b0cec06d3ca3c95096e39c7ee90595df868a7b95685d6f717dba7c9a5ebc011`.
- Exact APK 427 was installed over 426 on S25 serial `R5CXC26KWJW` without clearing app data. The signed-in Jeremy Dennis account remained present. Real-device checks confirmed the header, bottom tabs, Labels panel, last Labels category, Timeline arrows, and Map/Read actions all remained above Android navigation.
- S25 testing exposed a separate More-menu failure: 17 controls were forced into one column, while WebView 150 did not scroll that fixed CSS grid. Admin reported y=2120-2247 against navigation safe top y=2205.
- Commit `d152274` (`Fit APK More menu inside safe area`) syncs web commit `ee78d83f` into all three packaged runtime copies and changes the build marker to `20260730-mobile-more-menu-r30`.
- The More menu now uses:
  - two columns for normal portrait phones;
  - one column only below 340 CSS pixels;
  - six compact columns in short landscape;
  - the existing safe-area maximum plus `touch-action: pan-y`.
- `audit-apk-webview.mjs` now forces the Admin disclosure open and fails if More needs scrolling, leaves the safe panel, or places any control outside it.
- Local checks passed:
  - `node verify-app-shell.js`;
  - JavaScript syntax and `git diff --check`;
  - clean debug APK build;
  - live emulator audits at 412x915 and 915x412, with forced-expanded Admin, zero scroll range, two/six columns, safe controls, and no overlaps.
- Independent review found no release blocker and confirmed Android CSS exactly matches web `ee78d83f`; all Mapbox placeholders remain intact with no raw token in the package.
- GitHub workflow `30602961332` published APK 428 / `0.1.428`:
  - signed asset size 3,959,520 bytes;
  - SHA-256 `735bbb0d5ea53f91f138027b4fadc674f7f8b5575e528ee8adb48d8915a68eb3`;
  - package `com.nativelongisland.onthissite`, version code 428, target SDK 35;
  - v1/v2 signature verification passed with the existing certificate.
- The exact release was downloaded, hash-verified, inspected for the portrait/landscape/pan-y rules, and installed over APK 427 on the S25 without clearing data. Android reports code 428/name 0.1.428.
- The S25 was securely locked after installation. The final APK 428 portrait/landscape screenshot and UIAutomator bounds check remain pending; no attempt was made to bypass the lock.

Current branch, HEAD, and `origin/main`: `main` at `d152274`.

Preserve all existing untracked emulator/S25 screenshots and XML files, copied/generated assets, release folders, and this intentionally untracked handoff.

Safest next action: unlock the S25 and leave On This Site open, then verify More in portrait and landscape. No further build, publishing, download, or installation step remains.

## July 31 rich learning feeds / APK 429

- Commit `8242486` (`Bundle rich learning feeds`) synced the final web runtime into the APK:
  - richer Community Activity cards;
  - vertical batched Timeline feed;
  - image-first batched Nearby feed;
  - shared collapsed/normal/maximized bottom-panel states;
  - strict blank-coordinate rejection;
  - safe Helpful/comment action recovery;
  - short-landscape and native-safe-area panel fitting;
  - shared `shared-learning-card-utils.js`.
- Packaged build marker: `20260731-learning-feeds-safe-ui-r35`.
- `verify-app-shell.js`, audit syntax, scoped whitespace checks, and a clean debug build passed.
- GitHub workflow `30611577267` succeeded and published signed APK 429 / `0.1.429`:
  - package `com.nativelongisland.onthissite`;
  - version code 429, target SDK 35;
  - SHA-256 `1f68b55e538a07f5ea308709802147b062d1f0510d060d7696211dd5096214f4`;
  - v1/v2 signatures verified with certificate SHA-256 `b17b4d4505513c52adfaa215cac95ee062431d22410938fa5c13d34a70025787`.
- Exact signed APK 429 installed over release 423 on `emulator-5554`. Visual portrait checks confirmed normal and maximized Timeline, the vertical feed, and Map/Read/Discuss actions remain above system navigation with no clipped controls.
- The final deployed live runtime was audited through the debug shell on `emulator-5556`:
  - portrait viewport 412x915, safe rectangle x=0..412/y=28..891;
  - landscape viewport 915x412, safe rectangle x=24..891/y=24..388;
  - all top controls, Labels/More endpoints, sheets, bottom tabs, Hide, Max/Normal, Timeline actions, and load-more control were hit-testable and inside the safe rectangle;
  - zero unintended overlaps; the only landscape overlap was the explicitly allowed promo-dock/Mapbox-logo placement;
  - both audits reported `pass: true`.

Current branch, HEAD, and `origin/main`: `main` at `8242486`.

Preserve the modified generated `mobile-site-index.json` and `mobile-site-geometry.json`, all untracked emulator/S25 screenshots and XML, copied fallback assets, release folders, and this intentionally untracked handoff.

Remaining physical-device check:

- ADB sees only `emulator-5554` and `emulator-5556`; S25 serial `R5CXC26KWJW` is absent and no wireless ADB service is advertised.
- Update the S25 to APK 429 through Obtainium, leave the app foregrounded, and repeat one portrait/landscape Timeline/Nearby bottom-boundary spot-check. No build, publishing, or installation work remains elsewhere.

## July 31 stable Community Activity media / APK 430

- Android commit `18ee9bb` (`Bundle stable community activity media`) is on `origin/main`.
- Packaged build marker: `20260731-stable-activity-media-r36`.
- Synced the verified web mobile runtime into the bundled full archive, bundled live fallback, mobile JavaScript, and mobile CSS while preserving Mapbox placeholders and excluding raw/secret tokens.
- Community Activity now waits for one settled public-data pass, avoids logged-out account-only requests, keeps stable ordering across close/reopen, and inherits listing/wiki media for related events and moments.
- Activity cards prefer listing thumbnails over full hero files. Preservation Long Island therefore uses the cached 600px/approximately 79 KB derivative instead of its 2.4 MB source image; the hero remains the error fallback.
- `node verify-app-shell.js`, token/BOM checks, and the local debug APK build passed. The bundled offline archive opened with 424 listings and 93 wiki articles.
- Deployed runtime audit on `emulator-5556`: 16 expanded activity cards before/after reopen with identical ordering and no loading skeleton left behind. Golf Club loaded cached media at natural width 768; both Preservation cards loaded the cached thumbnail at natural width 600.
- GitHub Actions workflow `30654057420` succeeded and published latest release `apk-430` / `0.1.430`.
- Signed asset `on-this-site-latest.apk`: 4,007,552 bytes; SHA-256 `970c911612795d0504efbd340a4ec68e52482fb8b11388c4d0c891ae4ce846be`.
- Downloaded and hash-verified the exact release, then installed it over APK 429 on `emulator-5554`; Android reports version code 430/name 0.1.430.
- Current branch, HEAD, and `origin/main`: `main` at `18ee9bb`.
- Preserve the pre-existing modified generated `mobile-site-index.json` and `mobile-site-geometry.json`, all emulator/S25 captures, release folders, copied/generated assets, and this intentionally untracked handoff.

Safest next action: allow Obtainium to update the real S25 to APK 430 and spot-check Community Activity once. No build or publication step remains.

## August 1 hosted APK timeline controls

- Web commit `acf28b86` deployed the synchronized hosted APK runtime with a semi-hidden right-edge Timeline scrubber and `Collapse` / `Full` panel controls (`Open` / `Restore` in alternate states).
- Live hosted-runtime verification covered all 1,374 moments, a jump to position 1,368 with a bounded 30-card render window, true full-screen panel layout, and collapse/reopen behavior.
- No Android repository files, version code, or signed APK asset changed; APK 430 continues to consume the synchronized hosted runtime.
- Attached emulators `emulator-5554` and `emulator-5556` were blocked by Android Digital Wellbeing/process-system ANRs. A reboot of `emulator-5554` did not complete, so final device-only visual confirmation remains for the S25. The S25 was not attached.
- Android branch, HEAD, and `origin/main` remain `main` at `18ee9bb`.

Safest next action: relaunch APK 430 on the S25, open Timeline, drag the thin right-edge scrubber near both ends, and check `Collapse`, `Full`, `Restore`, and `Open` once. No build or publication step remains.

## August 3 hosted timeline fishbone runtime

- Web commit `6e81b5ec` and successful workflow `30835965647` deployed the synchronized hosted APK runtime.
- The right-edge Timeline control is now a reactive horizontal-tick fishbone with a continuously updated held-finger date, bounded 30-card jumping, and popup/menu cleanup when Full opens.
- No Android files, version code, or signed APK asset changed; APK 430 continues to consume the hosted runtime.
- Physical validation remains pending. Windows detects S25 serial `R5CXC26KWJW` only as `SAMSUNG File-Stor Gadget`; ADB shows no device or unauthorized row. Android branch/HEAD/origin remain `main` at `18ee9bb`.

Safest next action: choose `Transferring files / Android Auto` from the unlocked S25 USB notification and accept the debugging prompt, then inspect the deployed Timeline in normal/full modes and capture portrait bounds.

## August 3 physical S25 verification complete

- Web commit `90b18ca4` and successful workflow `30837694880` deployed the synchronized hosted runtime consumed by APK 430.
- ADB connected to physical S25 `SM-S938U1`, serial `R5CXC26KWJW`; installed package remains version code `430`, version name `0.1.430`.
- Verified without clearing app data: Full controls now clear the Android status bar, the Labels menu remains inside the portrait viewport with Biography Paths excluded from enable-all, and the right-edge fishbone updates continuously during a held drag (`1693 - 514 of 1363` captured) with the requested local line amplification/taper.
- The delayed startup promo/full-panel layering regression is guarded in the hosted runtime. No Android source, version code, or signed APK release changed; Android branch/HEAD/origin remain `main` at `18ee9bb`.

Safest next action: no Android rebuild or release is required for this hosted-runtime repair. Preserve existing generated files and device artifacts.

## August 4 hosted scrubber usability follow-up

- Web commit `8645f04` and workflow `30878048891` deployed the hosted runtime consumed by APK 430.
- Full mode now has one `Map view` exit action; Timeline/Nearby image-less cards render without initial placeholders; the idle fishbone is visually retracted while preserving a 76px invisible touch target; rapid movement uses a 32ms latest-position throttle; the held date bubble is removed immediately on release.
- The S25 showed the simplified controls and no released bubble before its ADB session disconnected. APK source/version/signature remain unchanged.

Safest next action: reconnect S25 ADB and perform the final inward-edge drag capture. No Android rebuild is required.

## August 4 comment-camera draft attachment repair

- Commit `25592bc` adds a dedicated comment-camera bridge instead of relying on the WebView file-picker return path that could lose a captured image.
- The wrapper now keeps a pending MediaStore URI through the camera activity, requests permission when needed, compresses the returned image, and calls `window.onAndroidCommentPhoto()` so the web composer creates a visible draft preview before posting. Both bundled offline shells include the matching handler.
- `verify-app-shell.js`, both bundled inline-runtime syntax checks, and `build-debug-apk.ps1` passed locally. GitHub Actions workflow `30929747910` passed all shell, signed-release, and Obtainium publication steps.
- A new signed testing APK was published. Existing unrelated generated assets and audit captures were preserved.

Safest next action: update through Obtainium, then take a Community Notes photo and check that its preview appears in the draft before pressing Post comment.

## August 4 Samsung comment-photo result-code repair

- Reproduced on the physical S25 Ultra: Samsung Camera captured the photo and showed its review screen, but returned from `ACTION_IMAGE_CAPTURE` with `RESULT_CANCELED` while the requested MediaStore `EXTRA_OUTPUT` URI contained the captured image.
- Commit `20145fc` updates the comment-camera callback to accept a non-empty output URI regardless of the camera result code. A genuinely empty URI still produces the normal cancellation message.
- Added a small MediaStore byte-presence check before JPEG compression and draft delivery.
- Android workflow `30952907826` succeeded; the signed testing APK installed successfully on the S25 as version `0.1.432` / version code `432` before the USB connection dropped.
- Final post-install physical recapture could not be completed because the S25 disconnected after installation. Reconnect USB and repeat Take photo -> shutter -> OK to confirm the preview appears in the draft.

Current Android branch, HEAD, and `origin/main`: `main` at `20145fc`.

Safest next action: reconnect the S25, relaunch version 0.1.432, and repeat the captured comment-photo flow. Preserve existing unrelated generated audit files and mobile data edits.

## August 4 single animated APK startup loader

- The APK was rendering two startup covers: the native Android wrapper's static logo card and the WebView's animated `loading-screen`. The native layer obscured the WebView's left-to-right Long Island animation and made the title/logo appear twice.
- Commit `2e87f45` removes only the redundant native cover from the root view. The WebView retains the single animated loader and its existing loading/fallback behavior.
- `node verify-app-shell.js` and `git diff --check` passed.
- Android workflow `30963023721` succeeded, including shell verification, signed release build, artifact upload, and Obtainium testing publication.
- No physical-device visual check was possible after the S25 ADB connection dropped; reconnecting the phone and watching one cold launch remains the final spot check.

Current Android branch, HEAD, and `origin/main`: `main` at `2e87f45`.

Safest next action: update/relaunch the APK on the S25 and confirm one `On This Site` startup card with the Long Island image filling from left to right once.

## August 5 APK startup and bottom-panel exclusivity repair

- Physical S25 reproduction confirmed the site-detail drawer was visible together with the Timeline/Nearby tabs and list panel.
- Commit `74d51fa` injects a small Android-side CSS guard after every WebView page load: while `body.mobile-detail-open` is active, the Timeline/Nearby tabs and both bottom panels are removed from layout and cannot receive input. They return when the detail drawer closes. This covers the hosted WebView and bundled fallback without relying on a generated web snapshot.
- The S25 now runs APK `0.1.434` / version code `434`; the site-detail check showed `Community Notes` while zero Timeline/Nearby tab nodes remained visible. The cold-start UI hierarchy contained exactly one `On This Site` label.
- Android workflow `30965740904` succeeded, including signed build, artifact upload, and Obtainium testing publication.
- `verify-app-shell.js` and `git diff --check` passed. Existing generated data edits and audit captures remain preserved.

Current Android branch, HEAD, and `origin/main`: `main` at `74d51fa`.

Safest next action: use APK `0.1.434` for normal site browsing and confirm closing a site drawer restores the selected Timeline/Nearby panel without overlap.

## August 5 bottom-panel gap correction

- The first exclusivity fix hid the Timeline/Nearby elements but left the app's original four-row grid reserving their bottom row, which appeared as a large blank gap behind the site drawer.
- Commit `8e4ba77` extends the Android-injected CSS to collapse the app grid to `auto minmax(0,1fr) 0 0` while `mobile-detail-open` is active, allowing the map to occupy the released space behind the drawer.
- `verify-app-shell.js` and `git diff --check` passed. Workflow `30966063431` succeeded.
- Installed APK `0.1.435` / version code `435` on the S25 and reopened a site detail. The site drawer showed `Community Notes` with no Timeline/Nearby panel nodes present.

Current Android branch, HEAD, and `origin/main`: `main` at `8e4ba77`.

Safest next action: on APK `0.1.435`, close the site drawer and confirm the selected bottom panel returns at the normal map/list boundary.

## 2026-08-04 comment camera follow-up
- Reproduced Samsung Camera returning to the comment composer with Comment photo was cancelled. after pressing OK, despite a captured output URI.
- Updated MainActivity.onActivityResult in commit 41b8299 to pass RESULT_CANCELED output URIs through JPEG validation instead of deleting them prematurely.
- Pushed to main; workflow 30966920188 completed successfully and published the testing APK.
- Next safest action: install the new APK on the connected S25 and repeat Take photo -> shutter -> OK; verify the image preview appears in the draft.


## 2026-08-04 map blank recovery
- Confirmed S25 was not a WebView crash: Mapbox style/tile area could remain a solid blue surface while the app UI and site drawer stayed alive.
- Updated
ative-long-island-map.js so Mapbox style errors immediately switch to the existing local Leaflet fallback instead of leaving the blank map state.
- Commit 6fc1615 pushed to main; workflow 30968651939 is building.

## 2026-08-08 S25 live reliability check

- Confirmed the S25 has version `0.1.437` installed and a cold launch loaded the map normally without a duplicate startup card or blank map.
- The detail drawer remained exclusive: no Timeline/Nearby panel appeared behind it.
- A direct tap in the visible Community Notes composer was still capable of being forwarded by the Android map-tap bridge to the map beneath. Commit `cd17f39` adds a final UI-overlay check immediately before the bridge can forward a tap, preventing visible composer controls from becoming map actions.
- Workflow `31260561006` succeeded. Installed its APK on the S25 as `0.1.438` / version code `438`; a cold launch showed one animated startup card and recovered to a fully rendered map and a single detail drawer.
- Remaining physical proof: repeat Take photo -> shutter -> Samsung OK and verify the preview appears in the draft without opening a map item.

## 2026-08-05 broader map fallback hardening
- Broadened the live map recovery rule in both the hosted runtime and the Android-bundled copy of `native-long-island-map.js`.
- The fallback now treats not just `style` failures but also `source`, `tile`, `sprite`, `glyph`, `network`, and WebGL initialization/load failures as reasons to switch to the Leaflet fallback.
- Both JS copies passed `node --check` after the change.
- The remaining proof is a device test on the S25 or emulator with a real map-load failure scenario. If the blank blue map still appears, the next fix likely needs deeper runtime instrumentation, not another model switch.

## 2026-08-05 live mobile map error recovery
- Found that the hosted APK shell loads `assets/js/mobile-app.js`, while the self-contained Android shells embed the same map initializer inline; the earlier native-map-only change could not cover this live path.
- Added a guarded pre-load error fallback to the hosted runtime and both Android bundled HTML shells. A Mapbox error now removes the failed map instance and shows the saved-place index instead of leaving a solid blue surface. Healthy maps still resolve normally after `load`.
- `node verify-mobile-map-taps.js`, `node verify-js-syntax-selection.js`, `node verify-app-shell.js`, both relevant `node --check` runs, and `build-debug-apk.ps1` all passed.
- The S25 remains on the already-installed APK and the hosted site still serves the pre-fix runtime until the web change is committed to `main` and deployed. The web checkout contains unrelated existing edits, so no commit or deployment was made in this pass.

## 2026-08-05 live map fallback deployed
- Prepared isolated web commit `2b9697d4` from `origin/main` so the unrelated dirty web checkout was not included.
- GitHub deployment workflow `30970669711` succeeded. The hosted `mobile-app.js` now contains `fallbackToOfflineIndex`, and the hosted shell hash matches the fetched runtime hash.
- Restarted the connected S25 onto the live path, but the device was in doze/lockscreen and remained covered by `NotificationShade`; no visual map assertion was possible without unlocking it.
- Manual follow-up: unlock the S25, open On This Site, and confirm the map renders normally. To test recovery specifically, reproduce a Mapbox load failure and confirm the saved-place index replaces the blue surface.

## 2026-08-08 Samsung photo-read retry

- Commit `f08a8c2` keeps the comment camera's persisted MediaStore URI for up to three short retries when Samsung returns from a completed capture before the JPEG stream is readable. It therefore no longer reports a captured photo as cancelled merely because the first immediate read races Samsung Camera's write.
- `node verify-app-shell.js`, `git diff --check`, and `build-debug-apk.ps1` passed locally.
- Workflow `31261280598` completed successfully: the app-shell verifier, signed release build, and Obtainium testing-release publication all passed. The S25 was disconnected by request before final manual confirmation; when it is next attached, use Take photo -> shutter -> Samsung OK and ensure the draft preview appears before posting.

## 2026-08-08 Biography labels and icons

- The Labels menu already had a `Biography Paths` checkbox, but moving biography Mapbox markers ignored it. `Disable all` therefore left those icons visible and interactive.
- Commit `733c3cf` changes the control to `Biography paths & icons` and makes it immediately remove queued and existing moving biography markers whenever it is off; both bundled fallback shells now use the same rule.
- `node verify-app-shell.js`, JavaScript syntax checking, whitespace checking, and `build-debug-apk.ps1` passed. Workflow `31261643099` is running.

## 2026-08-08 Offline archive navigation

- The lightweight offline fallback was a visually unrelated archive page with an oversized title and no app navigation.
- Commit `9876c40` gives it the compact On This Site / Native Long Island header, an explicit Offline badge, and app-style `Map` / `Browse saved places` controls that jump to the appropriate saved content. It preserves the offline-only map, search, region filters, and saved article reader.
- Shell verification and the debug APK build passed. The device-only offline visual audit needs a connected debug target; workflow `31261740878` is publishing the signed testing APK.

## 2026-08-09 comment photo library permission fix

- Current branch `main`, commit `32d15b0` (`Import comment photos through native picker`), pushed to `origin/main` after rebasing over remote carousel/search commits through `a190eea`.
- `AppBridge.chooseCommentPhoto()` now launches a dedicated `ACTION_OPEN_DOCUMENT` result path. `MainActivity` requests read/persistable access and imports/compresses the selected photo immediately, so WebView never has to retain the provider's temporary `content://` permission.
- The shared mobile runtime calls the native bridge only in the APK and preserves the normal browser file-input fallback. Camera failures now show a user-facing retry message instead of leaking a raw package/URI permission exception.
- Shell build ID is `20260809-comment-photo-picker-r51`. `node verify-app-shell.js`, public-comment checks, JavaScript syntax checks, diff checks, and the debug build passed.
- SiteGround/VPS workflow `31335248489` and APK workflow `31335358855` succeeded. Normal Chrome/CDP readback verified both live hosts serve the bridge. Obtainium release `apk-457` / `0.1.457` is latest; APK SHA-256 is `f761f906a1e27f74e5fccd1c00fea8631a03b426f6d6f3f3b190e54a42cb7476`.
- Preserve unrelated dirty generated data/map files and the many untracked emulator/audit artifacts. The emulator's System UI was unstable, so the remaining manual check is one real S25 photo-library selection after installing 0.1.457.

## 2026-08-09 resilient comment camera, signed 0.1.458 verified on S25

- Signed 0.1.457 still failed the actual Samsung `Take photo` round trip after Camera OK. This was reproduced before making the final change; no test comment was posted from the failing attempt.
- Commit `b086026` (`Make comment camera capture resilient`) is pushed on `main`. It adds a non-exported app-private `CaptureFileProvider`, passes its URI by `EXTRA_OUTPUT` plus `ClipData`, removes the comment camera's dependency on shared MediaStore permissions, and deletes temporary captures after delivery.
- Native-owned `native-comment-photo-compat.js` is injected after every hosted/bundled page load. It captures comment photo actions before replaceable web handlers and supplies a `DataTransfer`/`change` fallback receiver if the hosted `window.onAndroidCommentPhoto` contract changes. `verify-app-shell.js` now locks the native provider, manifest, private storage, ClipData, non-MediaStore invariant, compatibility injection, click routing, and fallback delivery.
- Shell ID `20260809-private-comment-camera-r52`; workflow `31336320229` succeeded and published Obtainium `apk-458` / 0.1.458. Exact signed APK SHA-256: `d7da9034e5ad2368c9d17936ed257ff2a0d5e651ada04b6d943d2043601aa601`.
- Installed exact signed artifact on connected S25 `R5CXC26KWJW`, preserving app data. End-to-end result: Samsung Camera capture -> OK -> `Photo ready (7 KB)` -> posted temporary comment -> photo visible as comment attachment and listing carousel slide -> Delete -> confirm -> temporary text absent and `No community notes yet` restored.
- Preserve unrelated dirty generated map/data files and untracked audit artifacts. No temporary test comment remains live.

## August 9 Obtainium 0.1.462 offline-search and release audit

- Android commit `da589da` normalizes the lightweight offline archive search across straight/curly apostrophes, accents, punctuation, and spacing. `Mas House` now matches `Ma's House` instead of returning zero saved results. The build ID is `20260809-offline-search-normalization-r61`, and the offline runtime audit now locks that exact punctuation-insensitive query.
- `node verify-app-shell.js`, `git diff --check`, a clean debug APK build, the full debug offline WebView audit, and the full recovered-live WebView interaction audit passed. The offline audit found exactly one Ma's House result, opened its 562-character saved article, verified all four regions, and confirmed no online media/placeholders were visible.
- GitHub workflow `31349769337` succeeded and published latest Obtainium release `apk-462`, **On This Site Android 0.1.462**. The exact downloaded `on-this-site-latest.apk` is 3,939,669 bytes with SHA-256 `af5ba5d213ce2aa00f8fa0b5c376c6900a3c5b6b8d866551fb667e3e159ccce0`; its bytes matched GitHub's published digest and size. Android reported versionCode `462` / versionName `0.1.462` after installation.
- Exact signed 0.1.462 emulator checks passed: cold no-network launch reached the complete 424-listing/93-wiki offline archive; `Mas House` produced one saved Ma's House result with address and article text; restoring validated connectivity retried recovery, displayed the labelled `Loading map...` shield rather than a blank surface, and reached the live Mapbox map with 424 listings, 93 wiki articles, 10 blog posts, and 4 calendar events.
- Physical S25 `R5CXC26KWJW` was available by USB and already had 0.1.462. Reinstalling the exact verified APK with `-r` preserved app data. The signed-in live map was interactive within the three-second cold-start capture. Typing `Ma's` showed Ma's House first and continued with Mashashimuet/Mashmanock; the Samsung keyboard search action opened a 59-result page with Ma's House first. Opening it showed the signed-in, disabled grey `Checked In!` button at 0.0 mi. Closing the site, collapsing Nearby, and tapping Timeline opened Timeline in the full panel with no simultaneous site/nearby panel or empty gap.
- The previously verified private-cache comment camera/provider path is unchanged and remains guarded by `verify-app-shell.js`; no comments were posted or deleted during this release audit.
- Preserve unrelated tracked generated-asset edits and untracked screenshots/helpers. Android `main` is clean for the four product files and matches `origin/main` at `da589da`.

Safest next action: leave 0.1.462 installed through Obtainium and report only newly reproducible issues; the release/fallback and core interaction audit is complete.

## August 10 APK security hardening and Obtainium 0.1.463

- Android commits `2be4e67` and `35bdff2` are pushed to `main`/`origin/main`. They disable Android backup, forbid WebView file access and mixed content, keep Safe Browsing enabled, strip URL queries/fragments and web-console content from release logs, cap story base64 input before decode, and restrict camera/geolocation permission grants to the two trusted HTTPS app origins.
- Sensitive JavaScript bridges now require a fresh per-launch UUID capability injected only into the top-level app page. Camera, comment-photo library, notifications, refresh, and story save/open/share reject missing or invalid capabilities. Emulator runtime proof found a 36-character capability and returned `false` for an invalid notification call.
- External WebView navigation now permits only HTTPS/HTTP, `geo:`, `mailto:`, and `tel:` routes; unsafe schemes are consumed. First-party and third-party cookies remain enabled because an emulator experiment proved that blocking third-party cookies forces the Directus-hosted shell into the offline index by preventing its SiteGround-protected cross-origin asset session.
- The APK-bundled live runtime was synchronized with the hardened web Directus, registration, rich-text, feedback, support, and bridge code. Mobile search now has an accessible name. `node verify-app-shell.js`, repeated debug builds, the full online WebView interaction audit, invalid-capability probe, and signed release smoke test passed.
- Workflow `31355659353` succeeded and published latest Obtainium `apk-463`, **On This Site Android 0.1.463**. The release asset is 3,941,234 bytes with SHA-256 `b2a3401460ae031748fbf203048bcc89555cb2e8a4b9826c636b5f20f659aa3c`.
- The exact signed asset installed on `emulator-5554`, reported versionCode `463` / versionName `0.1.463`, displayed the normal Android location permission prompt, and reached the complete live map after denial. The physical S25 was left untouched on signed 0.1.462.
- Preserve the pre-existing modified generated map/data files, modified audit helper, and untracked screenshots/XML. Only the two security commits were pushed.

Safest next action: refresh Obtainium on the S25 and install 0.1.463 when convenient. No debug APK was installed on the physical phone.
## 2026-08-19 Android map-motion optimization

- Branch `optimize/shared-runtime-android-20260819` refactors the bundled moving biography/dog/whale runtime without changing visible cadence or public behavior.
- The runtime now uses a due-work timer at the existing 180 ms cadence instead of waking on every animation frame, memoizes route geometry, and bounds/reuses shoreline checks while clearing them whenever land-mask geometry changes.
- Bundled support assets were refreshed and the native build marker is `20260819-map-motion-efficiency-r170`.
- `verify-app-shell.js`, Google Play readiness, JavaScript syntax, whitespace checks, debug APK build, and `lintDebug` passed. The QA APK installed without replacing the production app; the bundled offline archive reached its complete 439-listing/93-wiki UI with no fatal/ANR logs. Full online motion/location verification should be repeated after the matching web runtime is live.
- No schema, auth, API, environment, content, or production-app data changes were made.
- Safest next action: commit/push and merge, publish the next Obtainium APK, then run the online WebView and location audits on the connected S25 against the deployed shared runtime.
## 2026-08-19 site-open interaction regression follow-up

- Branch `fix/site-open-interaction-performance-20260819` removes the expensive full Nearby-feed rebuild that ran on every site selection and changes the detail, timeline, and source loads from sequential to concurrent work.
- Logged-in visit/points reconciliation now refreshes the rendered visit controls in the background instead of blocking the first complete article render.
- The matching hosted mobile runtime is being updated in parallel. Native marker is `20260819-site-open-performance-r171`.
- Safest next action: run the shell verifier/build, merge, wait for signed publication, and test repeated site opens on the S25 against the live hosted runtime.
## 2026-08-19 persistent map labels and biography endpoint fading

- Branch `fix/map-labels-motion-20260819` adds a forward-only biography route cycle to the APK: fade out at the final point, reset invisibly to the first point, then fade back in. Both the WebView fallback and native MapLibre payload carry the motion phase/opacity, and native icon/title layers render that opacity.
- Native build marker is `20260819-map-labels-biography-fade-r176`.
- `verify-app-shell.js`, JavaScript syntax, whitespace, and the debug APK build passed. The separate QA app was installed on USB tablet `T811MA256GB23516041180`; its live native map reached ready state with 13 territories, and a screenshot captured during a 3.5-second drag retained ancestral-land titles, basemap text, site marks, and biography artwork. No fatal/native-map errors appeared in logcat.
- The production/Obtainium app was not replaced during QA.
- Safest next action: merge and publish the signed Obtainium build, install it when convenient, and leave the older Google Play review undisturbed unless a new Play submission is explicitly requested.

## 2026-08-19 listing featured-image scroll-frame fix

- Branch `fix/site-header-scroll-frame-20260819` removes the scale/translate FLIP animation that could paint a full-size listing hero outside its compact sticky-header frame during fast panel scrolling. The hero now moves at its final dimensions and fades in, with revision guards preventing stale transition cleanup during rapid direction changes.
- The compact hero dock now clips overflow and uses paint containment. Native build marker is `20260819-site-hero-scroll-frame-r177`; the hosted live-shell asset hashes were refreshed without changing schema, authentication, APIs, or environment configuration.
- `verify-app-shell.js`, JavaScript syntax, whitespace checks, and the debug APK build passed. The QA build was installed alongside the production app on USB tablet `T811MA256GB23516041180`. Ma's House was opened, scrolled rapidly into compact mode, and the resulting thumbnail stayed fully inside the header. CDP measured identical 54 x 44 CSS-pixel hero/dock bounds, `overflow: hidden`, `contain: paint`, `transform: none`, and no fatal/ANR logs.
- The production/Obtainium app and existing Google Play review were not replaced during QA.
- Safest next action: commit/push and merge this branch, confirm the signed Obtainium release, and leave Google Play untouched unless a new submission is explicitly requested.

## 2026-08-19 APK/tablet responsive UI audit

- Branch `fix/apk-ui-audit-20260819` makes native Android cold launches map-first: Timeline is selected but collapsed, so Nearby no longer opens into a redundant or empty content area.
- Daily/on-this-date/learning shortcut controls now sit deliberately along the lower-left map edge. Map attribution moved to the lower-right beneath the location control in both WebView and native/offline map renderers.
- Tablet landscape collapsed mode uses one compact Menu/Labels header row. Full panel mode now hides the otherwise unused map/header strip, and resize/orientation changes preserve the current panel state instead of unexpectedly reopening it.
- Native build marker is `20260819-native-ui-audit-r182`. `verify-app-shell.js`, JavaScript/runtime checks, whitespace checks, and the debug APK build passed. The separate QA app was tested on USB tablet `T811MA256GB23516041180`; the cold-start interaction audit passed with zero failures in portrait, and landscape screenshots confirmed the compact map-first layout, menus, labels, full panels, and lower-edge controls. The production app on the tablet was not replaced.
- The matching shared web runtime was merged through web PR #32 and its SiteGround/VPS workflow `32310778179` succeeded. Direct readback confirmed the deployed shell uses the new panel, attribution, and edge-control rules.
- Safest next action: push/merge this Android branch and verify the resulting signed Obtainium release. Leave Google Play untouched unless a new submission is explicitly requested.

## 2026-08-31 APK timeline edge and lower-end tablet startup optimization

- Branch `fix/apk-timeline-edge-performance-v2-20260830`, commit `a9e71d8`, keeps the Android-specific runtime while adding a persistent right-edge timeline trace. The timeline content now reserves a 38 px right gutter; inactive ticks remain visible at reduced width, nearby ticks are larger than distant ones, and interaction expands the trace without covering cards.
- Tablet QA on `T811MA256GB23516041180` verified the bundled/offline timeline at the beginning and after jumping to `Showing 695-724 of 1425`: the position peak moved correctly and surrounding tick lengths tapered with distance. No fatal exception or ANR was logged.
- Online native-map startup no longer parses/renders the same bundled 400+ site records before the WebView sends its authoritative state. Bundled image decoding is paced in batches of four, the native icon lookup is precomputed in `map/site-icon-keys.json`, and a compact 13-polygon `map/ancestral-territory-fallback.json` replaces repeated parsing of the 3.85 MB full geometry archive. Offline mode still preserves and renders the complete saved map.
- On the USB tablet, skipped-frame counts around the first online authoritative map handoff improved from 89 to 56 (about 37% fewer), and the later source refresh improved from 96 to 76 (about 21% fewer). The first fully offline map draw remains comparatively expensive because it intentionally renders the complete archive immediately.
- `node verify-app-shell.js`, `node verify-google-play-readiness.js`, JavaScript syntax checking, whitespace checking, `build-debug-apk.ps1`, `lintDebug`, and `assembleOptimizedQa` passed. The optimized QA APK is ready for final hosted-runtime verification after web deployment workflow `33355418891` completes.
- Android PR #46 is open and clean. Safest next action: verify the hosted runtime on the tablet, merge PR #46, then monitor the normal signed Obtainium release workflow. Do not submit a Google Play build unless explicitly requested.

## 2026-08-31 compact Android site-detail layout

- Branch `fix/apk-panel-header-collapse-20260831` is based on Android `c59f59d6a3b262a59383f6736f2a1ba045c585d3`. Native build marker is `20260831-content-panel-compact-r203`.
- Ordinary site/biography detail mode now keeps only the title/account row above the map. Search, counts/instructions, territory subtitle, and quick actions return immediately when the detail closes. Contributor-profile mode remains excluded so its established map/profile geometry is unchanged.
- Android portrait's default half drawer is reduced from 58dvh to 48dvh. Tablet landscape retains its existing side-by-side auto-height panel. The native shell injects the same compact rules so a cached/older hosted runtime cannot restore the oversized layout, while hidden Timeline/Nearby grid rows remain reserved to prevent the map from briefly stretching during a site tap.
- `node verify-app-shell.js`, `node verify-google-play-readiness.js`, JavaScript syntax/whitespace checks, `assembleOptimizedQa`, and `lintDebug` passed.
- Physical QA on iPlay tablet `T811MA256GB23516041180` passed in portrait and landscape. Portrait showed only the title row and an approximately half-screen detail drawer; closing restored the full header. Landscape kept the expected split map/panel layout. No fatal exception or ANR appeared. The production/Obtainium package was not replaced during QA, and temporary rotation/screen-awake settings were restored.
- Matching hosted runtime was merged as web PR #152 (`57dcdcdeedaf95ea444db8165fc7afaf2006d004`). Safest next action: merge this Android branch after that deployment succeeds, monitor the signed Obtainium release, install the exact signed release over the tablet production app preserving data, and leave Google Play unchanged unless explicitly requested.
