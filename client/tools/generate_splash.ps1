Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root "assets"
$srcPath = Join-Path $assets "midrain.png"
if (-not (Test-Path $srcPath)) {
  throw "Source icon not found: $srcPath"
}

$width = 1242
$height = 2436
$bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::Transparent)

# soft ambient glow shapes for glassy look
$glowBrush1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(42, 255, 255, 255))
$glowBrush2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(28, 167, 139, 250))
$glowBrush3 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(24, 255, 215, 106))
$g.FillEllipse($glowBrush2, 120, 220, 1000, 640)
$g.FillEllipse($glowBrush1, 180, 300, 880, 520)
$g.FillEllipse($glowBrush3, 450, 560, 340, 180)

# frosted card outline
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(52, 255, 255, 255), 4)
$g.DrawArc($pen, 220, 260, 800, 460, 200, 140)

# main weather icon
$src = [System.Drawing.Image]::FromFile($srcPath)
$iconW = 420
$iconH = [int]([double]$src.Height / [double]$src.Width * $iconW)
$iconX = [int](($width - $iconW) / 2)
$iconY = 650
$g.DrawImage($src, $iconX, $iconY, $iconW, $iconH)

# app name
$fontMain = New-Object System.Drawing.Font("Segoe UI", 64, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontSub = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$brushMain = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
$brushSub = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 235, 235, 245))

$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center

$g.DrawString("SkyNest", $fontMain, $brushMain, (New-Object System.Drawing.RectangleF(0, 1140, $width, 100)), $sfCenter)
$g.DrawString("Weather intelligence, softly lit.", $fontSub, $brushSub, (New-Object System.Drawing.RectangleF(0, 1235, $width, 50)), $sfCenter)

# subtle bottom accent pills
$pillBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 255, 255, 255))
$g.FillEllipse($pillBrush, 410, 1360, 180, 18)
$g.FillEllipse($pillBrush, 610, 1360, 220, 18)

$outPath = Join-Path $assets "splash-brand.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$src.Dispose()
$glowBrush1.Dispose(); $glowBrush2.Dispose(); $glowBrush3.Dispose(); $pillBrush.Dispose()
$pen.Dispose(); $fontMain.Dispose(); $fontSub.Dispose(); $brushMain.Dispose(); $brushSub.Dispose(); $sfCenter.Dispose()
$g.Dispose(); $bmp.Dispose()

Write-Host "Generated:" $outPath
