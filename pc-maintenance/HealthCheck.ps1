# AviPC-Care :: HealthCheck.ps1
# Collects system health data, evaluates alerts, and writes health-data.js
# consumed by dashboard.html. Safe: read-only, touches nothing but its own folder.
param([switch]$Quiet)

$ErrorActionPreference = 'SilentlyContinue'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ---------- collect ----------
$os       = Get-CimInstance Win32_OperatingSystem
$cs       = Get-CimInstance Win32_ComputerSystem
$procInfo = Get-CimInstance Win32_Processor | Select-Object -First 1

$cpuPct   = [int][math]::Round((Get-CimInstance Win32_Processor |
             Measure-Object -Property LoadPercentage -Average).Average)

$totalGB  = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
$freeGB   = [math]::Round($os.FreePhysicalMemory   / 1MB, 1)
$usedGB   = [math]::Round($totalGB - $freeGB, 1)
$ramPct   = if ($totalGB -gt 0) { [int][math]::Round(100 * $usedGB / $totalGB) } else { 0 }

$uptimeH  = [math]::Round(((Get-Date) - $os.LastBootUpTime).TotalHours, 1)

$disks = @(Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
    [pscustomobject]@{
        drive   = $_.DeviceID
        totalGB = [math]::Round($_.Size / 1GB, 0)
        freeGB  = [math]::Round($_.FreeSpace / 1GB, 1)
        freePct = if ($_.Size) { [int][math]::Round(100 * $_.FreeSpace / $_.Size) } else { 0 }
    }
})

$topRam = @(Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 8 |
    ForEach-Object { [pscustomobject]@{ name = $_.ProcessName; mb = [int][math]::Round($_.WorkingSet64 / 1MB) } })

$topCpu = @(Get-Process | Where-Object { $_.CPU } | Sort-Object CPU -Descending | Select-Object -First 8 |
    ForEach-Object { [pscustomobject]@{ name = $_.ProcessName; sec = [int][math]::Round($_.CPU) } })

$startup = @(Get-CimInstance Win32_StartupCommand | Select-Object -ExpandProperty Name -Unique)

$pendingReboot = (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired') -or
                 (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending')

$lastMaint = $null
if (Test-Path "$dir\last-maintenance.txt") { $lastMaint = (Get-Content "$dir\last-maintenance.txt" -First 1) }

# ---------- alerts (codes only; dashboard maps to Hebrew text) ----------
$alerts = New-Object System.Collections.ArrayList
function Add-Alert($level, $code, $value) {
    [void]$alerts.Add([pscustomobject]@{ level = $level; code = $code; value = "$value" })
}
$sysDisk = $disks | Where-Object { $_.drive -eq 'C:' } | Select-Object -First 1
if ($sysDisk) {
    if     ($sysDisk.freePct -lt 10) { Add-Alert 'critical' 'DISK_LOW'  $sysDisk.freeGB }
    elseif ($sysDisk.freePct -lt 20) { Add-Alert 'warning'  'DISK_LOW'  $sysDisk.freeGB }
}
if     ($ramPct -gt 90) { Add-Alert 'critical' 'RAM_HIGH' $ramPct }
elseif ($ramPct -gt 80) { Add-Alert 'warning'  'RAM_HIGH' $ramPct }
if ($cpuPct -gt 90)     { Add-Alert 'warning'  'CPU_HIGH' $cpuPct }
if ($uptimeH -gt 168)   { Add-Alert 'warning'  'UPTIME_LONG' ([int][math]::Round($uptimeH / 24)) }
if ($pendingReboot)     { Add-Alert 'warning'  'REBOOT_PENDING' '' }
if ($startup.Count -gt 12) { Add-Alert 'warning' 'STARTUP_MANY' $startup.Count }
if ($totalGB -gt 0 -and $totalGB -lt 8) { Add-Alert 'warning' 'RAM_SMALL' $totalGB }
if (-not $lastMaint) { Add-Alert 'warning' 'MAINT_NEVER' '' }
elseif (((Get-Date) - [datetime]$lastMaint).TotalDays -gt 14) { Add-Alert 'warning' 'MAINT_OLD' '' }

# ---------- score ----------
$score = 100
foreach ($a in $alerts) { $score -= @{ critical = 25; warning = 8 }[$a.level] }
if ($score -lt 0) { $score = 0 }

# ---------- history ----------
$histFile = "$dir\history.json"
$hist = @()
if (Test-Path $histFile) { $hist = @(Get-Content $histFile -Raw | ConvertFrom-Json) }
$hist += [pscustomobject]@{
    t = (Get-Date).ToString('yyyy-MM-dd HH:mm')
    cpu = $cpuPct; ram = $ramPct
    diskFree = if ($sysDisk) { $sysDisk.freePct } else { $null }
}
if ($hist.Count -gt 60) { $hist = $hist[-60..-1] }
ConvertTo-Json @($hist) -Compress | Set-Content $histFile -Encoding UTF8

# ---------- write health-data.js ----------
$data = [pscustomobject]@{
    generatedAt   = (Get-Date).ToString('yyyy-MM-dd HH:mm')
    computerName  = $env:COMPUTERNAME
    osCaption     = $os.Caption
    cpuName       = $procInfo.Name
    cpuPct        = $cpuPct
    ram           = [pscustomobject]@{ totalGB = $totalGB; usedGB = $usedGB; usedPct = $ramPct }
    uptimeHours   = $uptimeH
    disks         = $disks
    topRam        = $topRam
    topCpu        = $topCpu
    startupCount  = $startup.Count
    startupItems  = $startup
    pendingReboot = $pendingReboot
    lastMaintenance = $lastMaint
    alerts        = @($alerts)
    score         = $score
    history       = @($hist)
}
'window.HEALTH_DATA = ' + (ConvertTo-Json $data -Depth 6 -Compress) + ';' |
    Set-Content "$dir\health-data.js" -Encoding UTF8

# ---------- proactive notification on critical ----------
$critical = @($alerts | Where-Object { $_.level -eq 'critical' })
if ($critical.Count -gt 0 -and -not $Quiet) {
    $shell = New-Object -ComObject WScript.Shell
    [void]$shell.Popup("AviPC-Care: critical issue detected ($($critical.Count)). Open the dashboard for details.", 20, 'AviPC-Care', 48)
}

Write-Output "HealthCheck done. Score: $score. Alerts: $($alerts.Count)."
