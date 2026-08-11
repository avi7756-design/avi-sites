# AviPC-Care :: Maintenance.ps1
# Safe, non-destructive weekly maintenance. NEVER touches personal files
# (Documents, Desktop, Pictures, Downloads, OneDrive, mail, browsers).
# Cleans only: temp folders, Windows Update download cache, Delivery
# Optimization cache. Recycle Bin only with -IncludeRecycleBin.
param(
    [switch]$IncludeRecycleBin,
    [switch]$Deep   # adds DISM component cleanup (admin, slow, ~monthly)
)

$ErrorActionPreference = 'SilentlyContinue'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$log = "$dir\maintenance-log.txt"
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
$freedMB = 0

function Log($msg) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm') | $msg" | Add-Content $log -Encoding UTF8
}

function Clean-Folder($path, $olderThanDays) {
    if (-not (Test-Path $path)) { return 0 }
    $cutoff = (Get-Date).AddDays(-$olderThanDays)
    $files = Get-ChildItem $path -Recurse -Force -File | Where-Object { $_.LastWriteTime -lt $cutoff }
    $size = [math]::Round(($files | Measure-Object Length -Sum).Sum / 1MB, 1)
    $files | Remove-Item -Force -ErrorAction SilentlyContinue
    # remove now-empty subfolders
    Get-ChildItem $path -Recurse -Force -Directory |
        Sort-Object FullName -Descending |
        Where-Object { -not (Get-ChildItem $_.FullName -Force) } |
        Remove-Item -Force -ErrorAction SilentlyContinue
    return $size
}

Log "=== Maintenance started (admin=$isAdmin, deep=$Deep) ==="

# 1. User + system temp (files older than 3 days; in-use files skip themselves)
$freedMB += Clean-Folder $env:TEMP 3
$freedMB += Clean-Folder "$env:WINDIR\Temp" 3
Log "Temp folders cleaned."

# 2. Windows Update download cache (safe to delete; Windows re-downloads if needed)
if ($isAdmin) {
    $freedMB += Clean-Folder "$env:WINDIR\SoftwareDistribution\Download" 14
    Log "Windows Update download cache cleaned."
} else {
    Log "Skipped WU cache (needs admin)."
}

# 3. Delivery Optimization cache
if ($isAdmin -and (Get-Command Delete-DeliveryOptimizationCache -ErrorAction SilentlyContinue)) {
    Delete-DeliveryOptimizationCache -Force
    Log "Delivery Optimization cache cleaned."
}

# 4. Recycle Bin — only when explicitly requested
if ($IncludeRecycleBin) {
    Clear-RecycleBin -Force -ErrorAction SilentlyContinue
    Log "Recycle Bin emptied (explicitly requested)."
}

# 5. Deep component cleanup (optional, monthly)
if ($Deep -and $isAdmin) {
    Log "Running DISM StartComponentCleanup (this can take a while)..."
    Start-Process dism.exe -ArgumentList '/online','/Cleanup-Image','/StartComponentCleanup' -Wait -WindowStyle Hidden
    Log "DISM cleanup finished."
}

Log "=== Maintenance finished. Freed approx. $freedMB MB ==="
(Get-Date).ToString('yyyy-MM-dd HH:mm') | Set-Content "$dir\last-maintenance.txt" -Encoding UTF8

# Refresh dashboard data
& "$dir\HealthCheck.ps1" -Quiet
Write-Output "Maintenance done. Freed approx. $freedMB MB."
