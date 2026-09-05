# Photo orientation regression

Comment camera capture, comment library selection, and Plant ID capture share
`MediaStorePhotoHelper.compressedJpegBytes`. It must apply EXIF display orientation
to the sampled pixels before encoding a JPEG; the output must not need another
rotation, and the source photo must remain untouched.

Run on a dedicated Android emulator or QA device:

```text
gradle :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.nativelongisland.onthissite.PhotoOrientationTest
```

The twelve native tests use private camera-provider content URIs and real Android
bitmap decoding/encoding. They verify all eight EXIF orientations by corner colors,
missing metadata, PNG, large-image sampling, invalid input, dimensions, the upload
size limit, and unchanged source bytes. They delete only their own fixture files.
The QA package is separate from the installed production app.

During daily photo/comment QA, also select portrait and landscape camera/library
photos in the actual UI. Check that the prepared preview is upright and that a
posted QA photo matches it. Only post using the existing dedicated-account and
cleanup authorization; otherwise report submission as blocked. A native helper
test pass does not establish camera chooser or production submission behavior.

Record the APK version and device/emulator used. If the S25 is disconnected,
report that limitation rather than treating emulator checks as S25 coverage.
