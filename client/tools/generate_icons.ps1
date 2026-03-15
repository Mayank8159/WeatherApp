Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root "assets"
$srcPath = Join-Path $assets "midrain.png"
if (-not (Test-Path $srcPath)) {
  throw "Source icon not found: $srcPath"
}

$src = [System.Drawing.Image]::FromFile($srcPath)

# Adaptive foreground with transparency (smaller logo)
$fgSize = 432
$fg = New-Object System.Drawing.Bitmap($fgSize, $fgSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g1 = [System.Drawing.Graphics]::FromImage($fg)
$g1.Clear([System.Drawing.Color]::Transparent)
$g1.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$targetW = 240
$targetH = [int]([double]$src.Height / [double]$src.Width * $targetW)
$x = [int](($fgSize - $targetW) / 2)
$y = [int](($fgSize - $targetH) / 2)
$g1.DrawImage($src, $x, $y, $targetW, $targetH)

$fgOut = Join-Path $assets "midrain-foreground.png"
$fg.Save($fgOut, [System.Drawing.Imaging.ImageFormat]::Png)
$g1.Dispose(); $fg.Dispose()

# Full app icon with purple liquid-style background + centered logo
$iconSize = 1024
$icon = New-Object System.Drawing.Bitmap($iconSize, $iconSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g2 = [System.Drawing.Graphics]::FromImage($icon)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(0, 0)),
  (New-Object System.Drawing.Point($iconSize, $iconSize)),
  ([System.Drawing.Color]::FromArgb(255, 30, 24, 84)),
  ([System.Drawing.Color]::FromArgb(255, 91, 63, 211))
)
$g2.FillRectangle($bgBrush, 0, 0, $iconSize, $iconSize)

$hlBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 255, 255, 255))
$g2.FillEllipse($hlBrush, 72, 56, 880, 580)

$markW = 500
$markH = [int]([double]$src.Height / [double]$src.Width * $markW)
$mx = [int](($iconSize - $markW) / 2)
$my = [int](($iconSize - $markH) / 2 + 8)
$g2.DrawImage($src, $mx, $my, $markW, $markH)

$iconOut = Join-Path $assets "app-icon-liquid.png"
$icon.Save($iconOut, [System.Drawing.Imaging.ImageFormat]::Png)

$hlBrush.Dispose(); $bgBrush.Dispose(); $g2.Dispose(); $icon.Dispose(); $src.Dispose()

Write-Host "Generated:" $fgOut
Write-Host "Generated:" $iconOut
