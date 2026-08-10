$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path -Parent $projectRoot
$localJava = Join-Path $workspaceRoot ".tools\jdk-17"
$localGradle = Join-Path $workspaceRoot ".tools\gradle-8.11.1\bin\gradle.bat"
$localSdk = Join-Path $workspaceRoot "android-sdk-local"
$bundle = Join-Path $projectRoot "app\build\outputs\bundle\release\app-release.aab"

if (Test-Path (Join-Path $localJava "bin\java.exe")) {
    $env:JAVA_HOME = $localJava
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}
if (Test-Path $localSdk) {
    $env:ANDROID_HOME = $localSdk
    $env:ANDROID_SDK_ROOT = $localSdk
}

foreach ($name in "ANDROID_KEYSTORE_PATH", "ANDROID_KEYSTORE_PASSWORD", "ANDROID_KEY_ALIAS", "ANDROID_KEY_PASSWORD") {
    if (-not (Get-Item "Env:$name" -ErrorAction SilentlyContinue).Value) {
        throw "$name is required to produce the signed Google Play upload bundle."
    }
}
if (-not (Test-Path $localGradle)) {
    throw "Gradle 8.11.1 was not found at $localGradle."
}

Push-Location $projectRoot
try {
    & $localGradle bundleRelease --no-daemon
    if ($LASTEXITCODE -ne 0) { throw "Gradle bundleRelease failed with exit code $LASTEXITCODE." }
} finally {
    Pop-Location
}

if (-not (Test-Path $bundle)) { throw "The release bundle was not created at $bundle" }
Get-Item $bundle | Select-Object FullName, Length, LastWriteTime
