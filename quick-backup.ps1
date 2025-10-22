# Quick Backup Script for Canteen Server
# Usage: .\quick-backup.ps1 "Your commit message"

param(
    [Parameter(Position=0)]
    [string]$Message = "Auto backup - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

Write-Host "🔄 Creating backup snapshot..." -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not a git repository. Run this from C:\MyProj\canteen-server" -ForegroundColor Red
    exit 1
}

# Stage all changes
Write-Host "📦 Staging changes..." -ForegroundColor Yellow
git add .

# Check if there are changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ No changes to backup - everything is up to date!" -ForegroundColor Green
    exit 0
}

# Commit
Write-Host "💾 Committing: $Message" -ForegroundColor Yellow
git commit -m "$Message"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Recent backups:" -ForegroundColor Cyan
    git log --oneline -5
    Write-Host ""
    Write-Host "💡 Tip: Run 'git log --oneline' to see all backups" -ForegroundColor Gray
} else {
    Write-Host "❌ Backup failed!" -ForegroundColor Red
    exit 1
}

