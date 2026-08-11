# AviPC-Care :: Setup.ps1
# One-time installer. Run once in PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\Setup.ps1
# Or straight from the web (no download needed first):
#   irm https://raw.githubusercontent.com/avi7756-design/avi-sites/main/pc-maintenance/Setup.ps1 | iex
#
# What it does:
#   1. Installs the kit to  %USERPROFILE%\AviPC-Care
#   2. Registers two background scheduled tasks (no admin needed):
#        - "AviPC-Care Health"      : health check every 4 hours
#        - "AviPC-Care Maintenance" : safe cleanup every Sunday 09:00
#   3. Puts a dashboard shortcut on the Desktop
#   4. Runs a first health check and opens the dashboard

$ErrorActionPreference = 'Stop'
$BaseUrl    = 'https://raw.githubusercontent.com/avi7756-design/avi-sites/main/pc-maintenance'
$InstallDir = Join-Path $env:USERPROFILE 'AviPC-Care'
$files      = @('HealthCheck.ps1', 'Maintenance.ps1', 'dashboard.html')

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

# Copy from local folder when running next to the files, otherwise download.
$localDir = $null
if ($MyInvocation.MyCommand.Path) { $localDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
foreach ($f in $files) {
    if ($localDir -and (Test-Path (Join-Path $localDir $f))) {
        Copy-Item (Join-Path $localDir $f) (Join-Path $InstallDir $f) -Force
    } else {
        Invoke-WebRequest "$BaseUrl/$f" -OutFile (Join-Path $InstallDir $f) -UseBasicParsing
    }
    Write-Host "  installed: $f"
}

# Scheduled tasks (per-user via schtasks — works without admin)
$ps = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File"
schtasks /Create /F /TN "AviPC-Care Health" `
    /TR "$ps `"$InstallDir\HealthCheck.ps1`" -Quiet" `
    /SC HOURLY /MO 4 | Out-Null
schtasks /Create /F /TN "AviPC-Care Maintenance" `
    /TR "$ps `"$InstallDir\Maintenance.ps1`"" `
    /SC WEEKLY /D SUN /ST 09:00 | Out-Null
Write-Host "  scheduled tasks registered (health: every 4h, maintenance: Sunday 09:00)"

# Desktop shortcut to the dashboard
$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut((Join-Path $shell.SpecialFolders('Desktop') 'AviPC Dashboard.lnk'))
$lnk.TargetPath = Join-Path $InstallDir 'dashboard.html'
$lnk.IconLocation = 'shell32.dll,13'
$lnk.Save()
Write-Host "  desktop shortcut created: AviPC Dashboard"

# First run + open dashboard
& (Join-Path $InstallDir 'HealthCheck.ps1') -Quiet
Start-Process (Join-Path $InstallDir 'dashboard.html')
Write-Host ""
Write-Host "AviPC-Care installed successfully. Dashboard: $InstallDir\dashboard.html"
