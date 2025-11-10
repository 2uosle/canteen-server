# Fix Encoding Script for NEUTap Canteen Server
# This script ensures all source files are properly UTF-8 encoded with BOM

Write-Host "=== NEUTap Encoding Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Define the files to fix
$filesToFix = @(
    "public\index.html",
    "public\vendor-transactions.html",
    "public\css\components.css",
    "public\css\mobile.css",
    "public\css\notifications.css",
    "public\css\styles.css",
    "public\css\theme.css",
    "public\css\variables.css",
    "public\js\app.js",
    "public\js\enhancements.js",
    "public\js\mobile.js",
    "public\js\notifications.js",
    "public\js\ui.js",
    "public\js\utils.js"
)

$fixedCount = 0
$errorCount = 0

foreach ($file in $filesToFix) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        try {
            Write-Host "Processing: $file" -ForegroundColor Yellow
            
            # Read the file content
            $content = Get-Content -Path $fullPath -Raw -Encoding UTF8
            
            # Write it back with UTF-8 BOM encoding
            $utf8BOM = New-Object System.Text.UTF8Encoding $true
            [System.IO.File]::WriteAllText($fullPath, $content, $utf8BOM)
            
            Write-Host "  CheckMark Fixed encoding" -ForegroundColor Green
            $fixedCount++
        }
        catch {
            Write-Host "  X Error: $_" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host "  ! File not found: $fullPath" -ForegroundColor Magenta
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Fixed: $fixedCount files" -ForegroundColor Green
Write-Host "Errors: $errorCount files" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "All files have been re-encoded to UTF-8 with BOM." -ForegroundColor Cyan
Write-Host "This ensures proper display of special characters." -ForegroundColor Cyan
