# GitHub Setup Script for Canteen Server
# This script helps you push your project to GitHub

Write-Host "🌐 GitHub Setup Wizard" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Check if already has remote
$hasRemote = git remote -v 2>$null
if ($hasRemote) {
    Write-Host "✅ GitHub remote already configured:" -ForegroundColor Green
    git remote -v
    Write-Host ""
    Write-Host "To push changes: git push" -ForegroundColor Yellow
    exit 0
}

Write-Host "First, create a repository on GitHub:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com/new" -ForegroundColor White
Write-Host "2. Repository name: canteen-server" -ForegroundColor White
Write-Host "3. IMPORTANT: Leave all checkboxes UNCHECKED" -ForegroundColor Red
Write-Host "4. Click 'Create repository'" -ForegroundColor White
Write-Host ""

$ready = Read-Host "Have you created the GitHub repository? (yes/no)"

if ($ready -ne "yes") {
    Write-Host "❌ Please create the repository first, then run this script again." -ForegroundColor Red
    exit 1
}

Write-Host ""
$username = Read-Host "Enter your GitHub username"
$repoName = Read-Host "Enter repository name (default: canteen-server)"

if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = "canteen-server"
}

$githubUrl = "https://github.com/$username/$repoName.git"

Write-Host ""
Write-Host "🔗 Connecting to GitHub..." -ForegroundColor Cyan

# Add remote
git remote add origin $githubUrl

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to add remote. Check your URL." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Remote added: $githubUrl" -ForegroundColor Green

# Rename branch to main
Write-Host "🔄 Renaming branch to 'main'..." -ForegroundColor Cyan
git branch -M main

# Push
Write-Host ""
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
Write-Host "⚠️  You may be asked for your GitHub credentials:" -ForegroundColor Yellow
Write-Host "   Username: your GitHub username" -ForegroundColor White
Write-Host "   Password: Personal Access Token (NOT your GitHub password!)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Get token at: https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! Your code is now backed up on GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "View it at: https://github.com/$username/$repoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📚 Next steps:" -ForegroundColor Yellow
    Write-Host "  • After making changes: git push" -ForegroundColor White
    Write-Host "  • To download on another computer: git clone $githubUrl" -ForegroundColor White
    Write-Host "  • Read GITHUB-GUIDE.md for recovery scenarios" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Push failed. Common issues:" -ForegroundColor Red
    Write-Host "  • Using GitHub password instead of Personal Access Token" -ForegroundColor Yellow
    Write-Host "  • Repository URL is wrong" -ForegroundColor Yellow
    Write-Host "  • Repository already has content" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Get Personal Access Token at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "   (Select 'repo' scope when creating)" -ForegroundColor Gray
}

