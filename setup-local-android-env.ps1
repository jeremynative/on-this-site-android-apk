$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceRoot = Split-Path -Parent $projectRoot
$toolsRoot = Join-Path $workspaceRoot ".tools"
$downloadsRoot = Join-Path $workspaceRoot ".downloads"
$jdkRoot = Join-Path $toolsRoot "jdk-17"
$gradleRoot = Join-Path $toolsRoot "gradle-8.10.2"
$sdkRoot = Join-Path $workspaceRoot "android-sdk-local"
$cmdlineLatest = Join-Path $sdkRoot "cmdline-tools\latest"

$jdkUrl = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
$gradleUrl = "https://services.gradle.org/distributions/gradle-8.10.2-bin.zip"
$cmdlineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-14742923_latest.zip"

New-Item -ItemType Directory -Force -Path $toolsRoot, $downloadsRoot, $sdkRoot | Out-Null

function Expand-SingleRootZip {
    param(
        [Parameter(Mandatory = $true)] [string] $ZipPath,
        [Parameter(Mandatory = $true)] [string] $DestinationPath
    )

    $extractPath = Join-Path $downloadsRoot ([IO.Path]::GetFileNameWithoutExtension($ZipPath))
    if (Test-Path $extractPath) {
        Remove-Item -LiteralPath $extractPath -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $extractPath -Force

    $root = Get-ChildItem -LiteralPath $extractPath | Where-Object { $_.PSIsContainer } | Select-Object -First 1
    if (-not $root) {
        throw "Could not find expanded root folder in $extractPath"
    }

    if (Test-Path $DestinationPath) {
        Remove-Item -LiteralPath $DestinationPath -Recurse -Force
    }
    Move-Item -LiteralPath $root.FullName -Destination $DestinationPath
}

if (-not (Test-Path (Join-Path $jdkRoot "bin\java.exe"))) {
    $jdkZip = Join-Path $downloadsRoot "temurin-jdk-17.zip"
    Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkZip
    Expand-SingleRootZip -ZipPath $jdkZip -DestinationPath $jdkRoot
}

if (-not (Test-Path (Join-Path $gradleRoot "bin\gradle.bat"))) {
    $gradleZip = Join-Path $downloadsRoot "gradle-8.10.2-bin.zip"
    Invoke-WebRequest -Uri $gradleUrl -OutFile $gradleZip
    Expand-SingleRootZip -ZipPath $gradleZip -DestinationPath $gradleRoot
}

if (-not (Test-Path (Join-Path $cmdlineLatest "bin\sdkmanager.bat"))) {
    $cmdlineZip = Join-Path $downloadsRoot "commandlinetools-win-14742923_latest.zip"
    $cmdlineExtract = Join-Path $downloadsRoot "commandlinetools"
    Invoke-WebRequest -Uri $cmdlineToolsUrl -OutFile $cmdlineZip
    if (Test-Path $cmdlineExtract) {
        Remove-Item -LiteralPath $cmdlineExtract -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $cmdlineExtract | Out-Null
    Expand-Archive -LiteralPath $cmdlineZip -DestinationPath $cmdlineExtract -Force

    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $cmdlineLatest) | Out-Null
    if (Test-Path $cmdlineLatest) {
        Remove-Item -LiteralPath $cmdlineLatest -Recurse -Force
    }
    Move-Item -LiteralPath (Join-Path $cmdlineExtract "cmdline-tools") -Destination $cmdlineLatest
}

$env:JAVA_HOME = $jdkRoot
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$jdkRoot\bin;$cmdlineLatest\bin;$(Join-Path $sdkRoot 'platform-tools');$env:Path"

$sdkManager = Join-Path $cmdlineLatest "bin\sdkmanager.bat"
$licenseInput = ("y`n" * 100)
$licenseInput | & $sdkManager --licenses | Out-Host
& $sdkManager "platform-tools" "platforms;android-35" "build-tools;35.0.0"

& (Join-Path $jdkRoot "bin\java.exe") -version
& (Join-Path $gradleRoot "bin\gradle.bat") --version
& (Join-Path $sdkRoot "platform-tools\adb.exe") version
