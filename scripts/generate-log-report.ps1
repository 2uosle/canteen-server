# ============================================
# System Log Report Generator
# For Thesis Defense Presentation
# ============================================

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  SMART CANTEEN SYSTEM - LOG REPORT" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Get today's date
$today = Get-Date -Format "yyyy-MM-dd"
$combinedLog = "logs\combined-$today.log"
$errorLog = "logs\error-$today.log"
$accessLog = "logs\access-$today.log"

# Check if log files exist
if (-not (Test-Path $combinedLog)) {
    Write-Host "⚠️  No logs found for today ($today)" -ForegroundColor Yellow
    Write-Host "Available log files:" -ForegroundColor Yellow
    Get-ChildItem logs\*.log | ForEach-Object { Write-Host "  - $($_.Name)" }
    Write-Host ""
    Write-Host "To generate logs: Start the server with 'node server.js'" -ForegroundColor Cyan
    exit
}

Write-Host "📅 Log Report for: $today" -ForegroundColor Green
Write-Host ""

# ============================================
# 1. SYSTEM OVERVIEW
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "📊 SYSTEM OVERVIEW" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

$allLogs = Get-Content $combinedLog -ErrorAction SilentlyContinue
$totalEvents = $allLogs.Count
$infoEvents = ($allLogs | Select-String -Pattern "\[INFO\]").Count
$warnEvents = ($allLogs | Select-String -Pattern "\[WARN\]").Count
$errorEvents = ($allLogs | Select-String -Pattern "\[ERROR\]").Count

Write-Host "Total Events Logged: $totalEvents"
Write-Host "  ✅ INFO:    $infoEvents"
Write-Host "  ⚠️  WARN:    $warnEvents"
Write-Host "  ❌ ERROR:   $errorEvents"
Write-Host ""

# ============================================
# 2. SERVER STARTUP
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "🚀 SERVER STARTUP EVENTS" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

$startupLogs = $allLogs | Select-String -Pattern "(server started|Database connection|Cleanup job)"
if ($startupLogs) {
    $startupLogs | ForEach-Object { Write-Host $_.Line -ForegroundColor Green }
} else {
    Write-Host "No startup events found"
}
Write-Host ""

# ============================================
# 3. DATABASE OPERATIONS
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "💾 DATABASE OPERATIONS" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

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

# ============================================
# 4. CLEANUP OPERATIONS
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "🧹 CLEANUP OPERATIONS" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

$cleanupLogs = $allLogs | Select-String -Pattern "Cleanup"
if ($cleanupLogs) {
    $cleanupLogs | ForEach-Object { Write-Host $_.Line -ForegroundColor Magenta }
} else {
    Write-Host "No cleanup events found (runs every 10 minutes)"
}
Write-Host ""

# ============================================
# 5. ERROR SUMMARY
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "❌ ERROR SUMMARY" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

if (Test-Path $errorLog) {
    $errors = Get-Content $errorLog -ErrorAction SilentlyContinue
    if ($errors) {
        $errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    } else {
        Write-Host "✅ No errors logged today! System running smoothly." -ForegroundColor Green
    }
} else {
    Write-Host "✅ No errors logged today! System running smoothly." -ForegroundColor Green
}
Write-Host ""

# ============================================
# 6. RECENT ACTIVITY (Last 10 events)
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "📝 RECENT ACTIVITY (Last 10 Events)" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

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

# ============================================
# 7. FILE INFORMATION
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "📁 LOG FILE INFORMATION" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

Get-ChildItem logs\*.log | ForEach-Object {
    $size = "{0:N2} KB" -f ($_.Length / 1KB)
    Write-Host "$($_.Name) - $size"
}
Write-Host ""

# ============================================
# 8. STATISTICS FOR THESIS
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
Write-Host "📈 SYSTEM STATISTICS (For Thesis)" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue

Write-Host "Log Retention Policy:"
Write-Host "  - Error logs: 30 days"
Write-Host "  - Combined logs: 14 days"
Write-Host "  - Access logs: 7 days"
Write-Host ""
Write-Host "Log Rotation:"
Write-Host "  - Daily rotation: new file per day"
Write-Host "  - Size-based rotation: 20 MB per file"
Write-Host ""
Write-Host "Log Levels Implemented:"
Write-Host "  - ERROR  - Critical failures"
Write-Host "  - WARN   - Warnings"
Write-Host "  - INFO   - Important events"
Write-Host "  - HTTP   - HTTP requests"
Write-Host "  - DEBUG  - Development debugging"
Write-Host ""

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  📋 Report Generated Successfully!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 TIP: Run 'node server.js' to generate more logs" -ForegroundColor Yellow
Write-Host "💡 TIP: Use the system to create transaction logs" -ForegroundColor Yellow
Write-Host ""

