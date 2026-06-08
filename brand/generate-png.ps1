# Generate channel profile (800x800) and banner (2560x1440) PNG via System.Drawing
$ErrorActionPreference = "Stop"
$outDir = Join-Path $PSScriptRoot "png"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Drawing

function New-GradientBrush($rect, $c1, $c2) {
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45)
    return $brush
}

# --- Profile 800x800 ---
$w, $h = 800, 800
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$g.FillRectangle((New-GradientBrush $rect ([System.Drawing.Color]::FromArgb(15,23,42)) ([System.Drawing.Color]::FromArgb(30,27,75))), $rect)

$blue = [System.Drawing.Color]::FromArgb(59, 130, 246)
$purple = [System.Drawing.Color]::FromArgb(139, 92, 246)
$penB = New-Object System.Drawing.Pen($blue, 6)
$penP = New-Object System.Drawing.Pen($purple, 6)
$brushB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 59, 130, 246))

# nodes
$g.DrawEllipse($penB, 152, 352, 96, 96)
$g.FillEllipse($brushB, 344, 344, 112, 112)
$g.DrawEllipse($penB, 344, 344, 112, 112)
$g.DrawEllipse($penP, 552, 352, 96, 96)
$g.DrawLine($penB, 248, 400, 344, 400)
$g.DrawLine($penP, 456, 400, 552, 400)

# robot head
$g.FillRectangle((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 41, 59))), 340, 280, 120, 90)
$g.DrawRectangle($penB, 340, 280, 120, 90)
$g.FillEllipse((New-Object System.Drawing.SolidBrush($blue)), 360, 310, 20, 20)
$g.FillEllipse((New-Object System.Drawing.SolidBrush($blue)), 420, 310, 20, 20)
$g.DrawArc($penP, 365, 340, 70, 40, 0, 180)
$g.FillRectangle((New-Object System.Drawing.SolidBrush($blue)), 385, 250, 30, 24)
$g.DrawLine($penP, 400, 250, 400, 228)
$g.DrawLine($penP, 385, 228, 415, 228)

# star
$gold = [System.Drawing.Color]::FromArgb(251, 191, 36)
$pts = @(
    [System.Drawing.Point]::new(520, 260),
    [System.Drawing.Point]::new(530, 290),
    [System.Drawing.Point]::new(560, 300),
    [System.Drawing.Point]::new(530, 310),
    [System.Drawing.Point]::new(520, 340),
    [System.Drawing.Point]::new(510, 310),
    [System.Drawing.Point]::new(480, 300),
    [System.Drawing.Point]::new(510, 290)
)
$g.FillPolygon((New-Object System.Drawing.SolidBrush($gold)), $pts)

$profilePath = Join-Path $outDir "profile-800x800.png"
$bmp.Save($profilePath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "Created: $profilePath"

# --- Banner 2560x1440 ---
$bw, $bh = 2560, 1440
$bbmp = New-Object System.Drawing.Bitmap($bw, $bh)
$bg = [System.Drawing.Graphics]::FromImage($bbmp)
$bg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$brect = New-Object System.Drawing.Rectangle(0, 0, $bw, $bh)
$bg.FillRectangle((New-GradientBrush $brect ([System.Drawing.Color]::FromArgb(15,23,42)) ([System.Drawing.Color]::FromArgb(49,46,129))), $brect)

# decorative circles
$bg.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 59, 130, 246))), 360, 680, 40, 40)
$bg.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 139, 92, 246))), 1240, 696, 48, 48)
$bg.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 59, 130, 246))), 2120, 680, 40, 40)

$fontTitle = New-Object System.Drawing.Font("Arial", 96, [System.Drawing.FontStyle]::Bold)
$fontSub = New-Object System.Drawing.Font("Arial", 42, [System.Drawing.FontStyle]::Regular)
$fontSmall = New-Object System.Drawing.Font("Arial", 32, [System.Drawing.FontStyle]::Regular)
$white = [System.Drawing.Brushes]::White
$gray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))
$blueB = New-Object System.Drawing.SolidBrush($blue)
$purpleB = New-Object System.Drawing.SolidBrush($purple)

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$bg.DrawString("AUTOPILOT AI LAB", $fontTitle, $white, 1280, 580, $sf)
$bg.DrawString("Automate Your Business with AI", $fontSub, $gray, 1280, 700, $sf)
$bg.DrawString("Make.com  •  n8n  •  Zapier  •  No-Code", $fontSmall, $blueB, 1280, 780, $sf)
$bg.DrawString("New automation tutorials every week", $fontSmall, $purpleB, 1280, 850, $sf)

$barRect = New-Object System.Drawing.Rectangle(980, 900, 600, 6)
$bg.FillRectangle((New-GradientBrush $barRect $blue $purple), $barRect)

$bannerPath = Join-Path $outDir "banner-2560x1440.png"
$bbmp.Save($bannerPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bg.Dispose(); $bbmp.Dispose()
Write-Host "Created: $bannerPath"
Write-Host "Done. Open folder: $outDir"
