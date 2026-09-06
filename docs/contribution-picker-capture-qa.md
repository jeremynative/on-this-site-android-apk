# Contribution picker and screenshot QA — September 6, 2026

Native map taps previously opened features while Suggest Site was selecting a location. The hosted runtime now includes the picker mode in transient map state. NativeMapController consumes a stationary tap before feature hit testing and returns its actual coordinates. The JavaScript bridge rejects feature openings during selection and ignores late picker callbacks after cancellation/completion.

On the physical S25 QA package, tapping an existing pin filled 40.901396 / -72.443664 and returned to the retained suggestion draft. Submitting through the actual form saved pending suggestion87 under dedicated profile290. The exact test record was removed and its absence verified. Location permissions were restored after the earlier permission-denial test.

Feedback capture previously used html2canvas, which cannot capture the separate native map. The recorded image contained controls and a blank map area. FeedbackScreenshotHelper now copies only the app WebView's visible window rectangle, including the map TextureView beneath it, at a maximum 1280 pixels. It adds no OS permission or device-wide capture. The existing capability token, bounded request ID, trusted app URL, same-page callback check, request lock and timeout protect delivery. Android versions below API26 show an upload-screenshot fallback.

Physical S25 capture after the fix includes the map, labels, icons and controls. One real feedback submission saved pending comment6292 with imageffa29dfa-9644-43c4-9fa6-604394f0791e. Its 591×1280, 94,995-byte JPEG was byte-identical to the captured file. Both exact QA artifacts were deleted and absence verified. Normal production package/account were preserved.

Debug build and shell verification pass. Hosted JavaScript behavior tests cover picker ownership/stale delivery, screenshot callbacks/duplicate taps/timeouts, shared capture restoration and clone sizing. Physical testing used the separate QA package with staged hosted files through QA-only request interception, not a production release. APP_VERSION was subsequently bumped to 20260906-contribution-capture-r246; final asset synchronization, release build and production verification remain.

Evidence is in the sibling `_contribution_reliability_evidence_20260905` directory: s25-native-picker-success.png, qa-s25-suggestion-saved.json, qa-s25-feedback-captured-before.png, qa-s25-feedback-captured-after.jpg, qa-s25-feedback-server.jpg, qa-s25-feedback-saved.json and exact cleanup records. Do not remove real comment6285 or its photo.

Final asset synchronization completed from web514880b3 (PR250). Debug build, lintDebug and shell/menu checks pass. Source marker is r246. Physical staged-runtime Search-key and Logout checks passed; no production release claim yet.
