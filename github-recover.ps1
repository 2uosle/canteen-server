# GitHub Recovery Script
# Use this to recover your project from GitHub backup

Write-Host "🆘 GitHub Recovery Tool" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script helps you recover your project from GitHub" -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose recovery scenario:" -ForegroundColor Cyan
Write-Host "1. Pull latest changes from GitHub (sync)" -ForegroundColor Green
Write-Host "2. Download fresh copy (full re-clone)" -ForegroundColor Yellow
Write-Host "3. Force restore from GitHub (discard local changes)" -ForegroundColor Red
Write-Host "4. Show GitHub backup status" -ForegroundColor White
Write-Host "5. Cancel" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📥 Pulling latest changes from GitHub..." -ForegroundColor Cyan
        
        # Check if we have remote
        $hasRemote = git remote -v 2>$null
        if (-not $hasRemote) {
            Write-Host "❌ No GitHub remote configured!" -ForegroundColor Red
            Write-Host "💡 Run: .\github-setup.ps1" -ForegroundColor Yellow
            exit 1
        }
        
        # Fetch first
        git fetch origin
        
        # Check for conflicts
        $status = git status --porcelain
        if ($status) {
            Write-Host "⚠️  You have uncommitted changes!" -ForegroundColor Yellow
            Write-Host ""
            $saveFirst = Read-Host "Save your changes first? (yes/no)"
            if ($saveFirst -eq "yes") {
                $message = Read-Host "Commit message"
                git add .
                git commit -m $message
            }
        }
        
        git pull origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully synced with GitHub!" -ForegroundColor Green
        } else {
            Write-Host "❌ Pull failed. You may have merge conflicts." -ForegroundColor Red
            Write-Host "💡 Try option 3 (force restore) if you want to discard local changes" -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host ""
        $username = Read-Host "GitHub username"
        $repoName = Read-Host "Repository name (default: canteen-server)"
        
        if ([string]::IsNullOrWhiteSpace($repoName)) {
            $repoName = "canteen-server"
        }
        
        $targetDir = Read-Host "Download to directory (default: C:\MyProj\canteen-server-recovered)"
        if ([string]::IsNullOrWhiteSpace($targetDir)) {
            $targetDir = "C:\MyProj\canteen-server-recovered"
        }
        
        Write-Host ""
        Write-Host "📦 Cloning fresh copy from GitHub..." -ForegroundColor Cyan
        
        $url = "https://github.com/$username/$repoName.git"
        git clone $url $targetDir
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Fresh copy downloaded!" -ForegroundColor Green
            Write-Host "📁 Location: $targetDir" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "📚 Next steps:" -ForegroundColor Yellow
            Write-Host "  cd $targetDir" -ForegroundColor White
            Write-Host "  npm install" -ForegroundColor White
        } else {
            Write-Host "❌ Clone failed. Check your username/repo name." -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "⚠️  WARNING: This will DELETE all local changes!" -ForegroundColor Red
        Write-Host "Your local files will be replaced with GitHub version." -ForegroundColor Red
        Write-Host ""
        $confirm = Read-Host "Are you ABSOLUTELY sure? Type 'RESTORE' to confirm"
        
        if ($confirm -eq "RESTORE") {
            # Check if we have remote
            $hasRemote = git remote -v 2>$null
            if (-not $hasRemote) {
                Write-Host "❌ No GitHub remote configured!" -ForegroundColor Red
                exit 1
            }
            
            Write-Host ""
            Write-Host "🔄 Fetching from GitHub..." -ForegroundColor Cyan
            git fetch origin
            
            Write-Host "🔄 Resetting to GitHub version..." -ForegroundColor Cyan
            git reset --hard origin/main
            
            Write-Host "🔄 Cleaning untracked files..." -ForegroundColor Cyan
            git clean -fd
            
            Write-Host ""
            Write-Host "✅ Restored from GitHub successfully!" -ForegroundColor Green
            Write-Host "Your local files now match GitHub." -ForegroundColor Cyan
        } else {
            Write-Host "❌ Cancelled. Nothing was changed." -ForegroundColor Yellow
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "📊 GitHub Backup Status:" -ForegroundColor Cyan
        Write-Host ""
        
        # Check if we have remote
        $hasRemote = git remote -v 2>$null
        if (-not $hasRemote) {
            Write-Host "❌ No GitHub remote configured!" -ForegroundColor Red
            Write-Host "💡 Run: .\github-setup.ps1" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "🔗 Remote URL:" -ForegroundColor Yellow
        git remote -v
        Write-Host ""
        
        Write-Host "📍 Local commits:" -ForegroundColor Yellow
        git log --oneline -5
        Write-Host ""
        
        # Fetch silently
        git fetch origin 2>$null
        
        Write-Host "📍 GitHub commits:" -ForegroundColor Yellow
        git log origin/main --oneline -5 2>$null
        Write-Host ""
        
        # Check if local is ahead/behind
        $local = git rev-parse HEAD 2>$null
        $remote = git rev-parse origin/main 2>$null
        
        if ($local -eq $remote) {
            Write-Host "✅ Local and GitHub are in sync!" -ForegroundColor Green
        } else {
            $ahead = git rev-list --count origin/main..HEAD 2>$null
            $behind = git rev-list --count HEAD..origin/main 2>$null
            
            if ($ahead -gt 0) {
                Write-Host "⚠️  Local is $ahead commit(s) ahead of GitHub" -ForegroundColor Yellow
                Write-Host "💡 Run: git push" -ForegroundColor Cyan
            }
            if ($behind -gt 0) {
                Write-Host "⚠️  Local is $behind commit(s) behind GitHub" -ForegroundColor Yellow
                Write-Host "💡 Run: git pull" -ForegroundColor Cyan
            }
        }
        Write-Host ""
        
        # Check for uncommitted changes
        $status = git status --porcelain
        if ($status) {
            Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
            git status --short
            Write-Host ""
            Write-Host "💡 Save them: .\quick-backup.ps1 'message'" -ForegroundColor Cyan
        } else {
            Write-Host "✅ No uncommitted changes" -ForegroundColor Green
        }
    }
    
    "5" {
        Write-Host "❌ Cancelled" -ForegroundColor Yellow
    }
    
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
    }
}

