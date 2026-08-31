$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path -Parent $projectRoot
$localJava = Join-Path $workspaceRoot ".tools\jdk-17"
$localGradle = Join-Path $workspaceRoot ".tools\gradle-8.11.1\bin\gradle.bat"
$localSdk = Join-Path $workspaceRoot "android-sdk-local"
$apk = Join-Path $projectRoot "app\build\outputs\apk\debug\app-debug.apk"
$localMapboxToken = Join-Path $projectRoot "mapbox-token.local.txt"
$localGoogleNavigationKey = Join-Path $projectRoot "google-navigation-api-key.local.txt"

if (Test-Path (Join-Path $localJava "bin\java.exe")) {
    $env:JAVA_HOME = $localJava
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}

if (Test-Path $localSdk) {
    $env:ANDROID_HOME = $localSdk
    $env:ANDROID_SDK_ROOT = $localSdk
    $env:Path = "$localSdk\cmdline-tools\latest\bin;$localSdk\platform-tools;$env:Path"
}

if (-not $env:MAPBOX_TOKEN -and (Test-Path $localMapboxToken)) {
    $env:MAPBOX_TOKEN = (Get-Content -LiteralPath $localMapboxToken -Raw).Trim()
}

if (-not $env:GOOGLE_NAVIGATION_API_KEY -and (Test-Path $localGoogleNavigationKey)) {
    $env:GOOGLE_NAVIGATION_API_KEY = (Get-Content -LiteralPath $localGoogleNavigationKey -Raw).Trim()
}

$gradleCommand = if (Test-Path $localGradle) { $localGradle } else { "gradle" }
if ($gradleCommand -eq "gradle" -and -not (Get-Command gradle -ErrorAction SilentlyContinue)) {
    throw "Gradle was not found. Run the local APK environment setup first, or open the project in Android Studio."
}

Push-Location $projectRoot
try {
    & $gradleCommand assembleDebug --no-daemon
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle assembleDebug failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}

if (-not (Test-Path $apk)) {
    throw "The build finished, but the debug APK was not created at $apk"
}

Get-Item $apk | Select-Object FullName, Length, LastWriteTime
