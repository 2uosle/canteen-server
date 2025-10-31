# Restore Script for Canteen Server
# Usage: .\restore.ps1

Write-Host "🔄 Canteen Server Restore Tool" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not a git repository. Run this from C:\MyProj\canteen-server" -ForegroundColor Red
    exit 1
}

# Show current status
Write-Host "📊 Current Status:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Show recent commits
Write-Host "📚 Available Restore Points (Recent 10):" -ForegroundColor Yellow
git log --oneline --decorate -10
Write-Host ""

# Ask user what to do
Write-Host "What would you like to do?" -ForegroundColor Cyan
Write-Host "1. Restore to a specific commit (PERMANENT - deletes current changes)" -ForegroundColor White
Write-Host "2. Just view an old version (SAFE - temporary)" -ForegroundColor Green
Write-Host "3. Discard all current changes and go back to last commit" -ForegroundColor Yellow
Write-Host "4. Cancel" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        $hash = Read-Host "Enter commit hash (e.g., 8199084)"
        Write-Host "⚠️  WARNING: This will permanently delete all uncommitted changes!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? Type 'YES' to confirm"
        
        if ($confirm -eq "YES") {
            git reset --hard $hash
            Write-Host "✅ Restored to commit $hash" -ForegroundColor Green
        } else {
            Write-Host "❌ Cancelled" -ForegroundColor Yellow
        }
    }
    "2" {
        Write-Host ""
        $hash = Read-Host "Enter commit hash to view (e.g., 8199084)"
        git checkout $hash
        Write-Host "✅ Viewing commit $hash" -ForegroundColor Green
        Write-Host "💡 To return to latest: git checkout master" -ForegroundColor Cyan
    }
    "3" {
        Write-Host "⚠️  WARNING: This will delete all uncommitted changes!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? Type 'YES' to confirm"
        
        if ($confirm -eq "YES") {
            git reset --hard HEAD
            Write-Host "✅ Restored to last commit" -ForegroundColor Green
        } else {
            Write-Host "❌ Cancelled" -ForegroundColor Yellow
        }
    }
    "4" {
        Write-Host "❌ Cancelled" -ForegroundColor Yellow
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
    }
}

