# Simple Log Viewer for Thesis Defense
# =====================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  SMART CANTEEN SYSTEM - LOG VIEWER" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$today = Get-Date -Format "yyyy-MM-dd"
$combinedLog = "logs\combined-$today.log"
$errorLog = "logs\error-$today.log"

# Check if log files exist
if (-not (Test-Path $combinedLog)) {
    Write-Host "No logs found for today: $today" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available log files:" -ForegroundColor Yellow
    Get-ChildItem logs\*.log | ForEach-Object { 
        Write-Host "  $($_.Name)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "TIP: Start the server with 'node server.js' to generate logs" -ForegroundColor Cyan
    exit
}

Write-Host "Date: $today" -ForegroundColor Green
Write-Host ""

# System Overview
Write-Host "SYSTEM OVERVIEW" -ForegroundColor Blue
Write-Host "---------------" -ForegroundColor Blue

$allLogs = Get-Content $combinedLog
$totalEvents = $allLogs.Count
$infoEvents = ($allLogs | Select-String -Pattern "\[INFO\]").Count
$warnEvents = ($allLogs | Select-String -Pattern "\[WARN\]").Count
$errorEvents = ($allLogs | Select-String -Pattern "\[ERROR\]").Count

Write-Host "Total Events: $totalEvents"
Write-Host "  INFO:    $infoEvents"
Write-Host "  WARN:    $warnEvents"
Write-Host "  ERROR:   $errorEvents"
Write-Host ""

# Server Startup
Write-Host "SERVER STARTUP EVENTS" -ForegroundColor Blue
Write-Host "---------------------" -ForegroundColor Blue

$startupLogs = $allLogs | Select-String -Pattern "(server started|Database connection|Cleanup job)"
if ($startupLogs) {
    $startupLogs | ForEach-Object { Write-Host $_.Line -ForegroundColor Green }
} else {
    Write-Host "No startup events found"
}
Write-Host ""

# Database Operations
Write-Host "DATABASE OPERATIONS" -ForegroundColor Blue
Write-Host "-------------------" -ForegroundColor Blue

$dbLogs = $allLogs | Select-String -Pattern "Database"
if ($dbLogs) {
    $dbLogs | ForEach-Object { 
        if ($_.Line -match "ERROR") {
            Write-Host $_.Line -ForegroundColor Red
        } else {
            Write-Host $_.Line -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "No database events found"
}
Write-Host ""

# Error Summary
Write-Host "ERROR SUMMARY" -ForegroundColor Blue
Write-Host "-------------" -ForegroundColor Blue

if (Test-Path $errorLog) {
    $errors = Get-Content $errorLog
    if ($errors) {
        $errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    } else {
        Write-Host "No errors logged today! System running smoothly." -ForegroundColor Green
    }
} else {
    Write-Host "No errors logged today! System running smoothly." -ForegroundColor Green
}
Write-Host ""

# Recent Activity
Write-Host "RECENT ACTIVITY (Last 10 Events)" -ForegroundColor Blue
Write-Host "---------------------------------" -ForegroundColor Blue

$recentLogs = Get-Content $combinedLog -Tail 10
$recentLogs | ForEach-Object {
    if ($_ -match "\[ERROR\]") {
        Write-Host $_ -ForegroundColor Red
    } elseif ($_ -match "\[WARN\]") {
        Write-Host $_ -ForegroundColor Yellow
    } else {
        Write-Host $_ -ForegroundColor White
    }
}
Write-Host ""

# File Information
Write-Host "LOG FILES" -ForegroundColor Blue
Write-Host "---------" -ForegroundColor Blue

Get-ChildItem logs\*.log | ForEach-Object {
    $size = "{0:N2} KB" -f ($_.Length / 1KB)
    Write-Host "$($_.Name) - $size"
}
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Report Complete" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "TIP: Run 'node server.js' to generate more logs" -ForegroundColor Yellow
Write-Host "TIP: Use the system to create transaction logs" -ForegroundColor Yellow
Write-Host ""

