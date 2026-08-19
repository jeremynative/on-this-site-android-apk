# JavaScript calls these methods by their public names through WebView. The
# classes and constructors remain reachable from MainActivity; preserve each
# annotated method name while allowing the surrounding Java code to shrink.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
