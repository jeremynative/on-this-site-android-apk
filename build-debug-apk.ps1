$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$apk = Join-Path $projectRoot "app\build\outputs\apk\debug\app-debug.apk"

if (-not (Get-Command gradle -ErrorAction SilentlyContinue)) {
    throw "Gradle was not found. Open android-live-app in Android Studio first, or install Gradle/JDK and run this again."
}

Push-Location $projectRoot
try {
    gradle assembleDebug --no-daemon
} finally {
    Pop-Location
}

if (-not (Test-Path $apk)) {
    throw "The build finished, but the debug APK was not created at $apk"
}

Get-Item $apk | Select-Object FullName, Length, LastWriteTime
