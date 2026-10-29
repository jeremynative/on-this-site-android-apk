# Generates the printable AR room marker cards bundled with the app.
# ARCore tracks images by corner-rich texture, so each card is a dense,
# seeded field of overlapping shapes (identical output on every run) with
# its number printed large for people placing the cards.
#
#   powershell -ExecutionPolicy Bypass -File scripts/generate-ar-markers.ps1
#
# Print each card exactly 20 cm wide (the width the scene declares).
param(
    [int]$Count = 8,
    [string]$Output = (Join-Path $PSScriptRoot "..\app\src\main\assets\ar\markers")
)

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $Output | Out-Null
$size = 1024
$palette = @(
    [System.Drawing.Color]::FromArgb(20, 20, 20),
    [System.Drawing.Color]::FromArgb(196, 64, 40),
    [System.Drawing.Color]::FromArgb(232, 163, 61),
    [System.Drawing.Color]::FromArgb(40, 110, 80),
    [System.Drawing.Color]::FromArgb(40, 90, 160),
    [System.Drawing.Color]::FromArgb(245, 240, 228)
)

for ($n = 1; $n -le $Count; $n++) {
    $random = New-Object System.Random (7919 * $n)
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::FromArgb(250, 248, 242))

    for ($i = 0; $i -lt 340; $i++) {
        $brush = New-Object System.Drawing.SolidBrush ($palette[$random.Next($palette.Count)])
        $x = $random.Next(-40, $size)
        $y = $random.Next(-40, $size)
        $s = $random.Next(18, 110)
        switch ($random.Next(3)) {
            0 { $g.FillEllipse($brush, $x, $y, $s, $s) }
            1 { $g.FillRectangle($brush, $x, $y, $s, [int]($s * (0.3 + $random.NextDouble()))) }
            2 {
                $points = @(
                    (New-Object System.Drawing.Point $x, $y),
                    (New-Object System.Drawing.Point ($x + $random.Next(-$s, $s)), ($y + $s)),
                    (New-Object System.Drawing.Point ($x + $s), ($y + $random.Next(-$s, $s)))
                )
                $g.FillPolygon($brush, $points)
            }
        }
        $brush.Dispose()
    }

    $panel = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(250, 248, 242))
    $g.FillRectangle($panel, 312, 312, 400, 400)
    $border = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(20, 20, 20)), 10
    $g.DrawRectangle($border, 312, 312, 400, 400)
    $ink = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(20, 20, 20))
    $center = New-Object System.Drawing.StringFormat
    $center.Alignment = [System.Drawing.StringAlignment]::Center
    $big = New-Object System.Drawing.Font "Arial", 170, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $small = New-Object System.Drawing.Font "Arial", 30, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $g.DrawString("AR ROOM CARD", $small, $ink, (New-Object System.Drawing.RectangleF 312, 340, 400, 40), $center)
    $g.DrawString("$n", $big, $ink, (New-Object System.Drawing.RectangleF 312, 400, 400, 200), $center)
    $g.DrawString("Print 20 cm wide", $small, $ink, (New-Object System.Drawing.RectangleF 312, 630, 400, 40), $center)
    $g.Dispose()
    $bitmap.Save((Join-Path $Output "marker-$n.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
}
Write-Output "Wrote $Count markers to $Output"
