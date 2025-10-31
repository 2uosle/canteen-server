# 🌐 GitHub Backup & Recovery Guide

GitHub acts as a **cloud backup** of your entire project, including all history.

---

## 📤 STEP 1: Push to GitHub (First Time)

### **A. Create GitHub Repository**

1. Go to https://github.com/new
2. Repository name: `canteen-server`
3. Description: "RFID-based Smart Canteen System"
4. **IMPORTANT:** Leave all checkboxes UNCHECKED (no README, no .gitignore, no license)
5. Click "Create repository"

### **B. Link Your Local Project to GitHub**

```powershell
cd C:\MyProj\canteen-server

# Add GitHub as remote backup location
git remote add origin https://github.com/YOUR-USERNAME/canteen-server.git

# Rename branch to 'main' (GitHub's default)
git branch -M main

# Push everything to GitHub (first time)
git push -u origin main
```

**That's it!** Your code is now backed up online.

---

## 📤 Daily Push (After First Setup)

Every time you make changes and commit:

```powershell
# Save locally
git add .
git commit -m "Your changes description"

# Push to GitHub cloud backup
git push
```

Or use the quick script:
```powershell
.\quick-backup.ps1 "Your changes"
git push
```

---

## 📥 RECOVERY SCENARIOS

### **Scenario 1: "I messed up my local files but haven't pushed"**

✅ **Easy fix - restore from local Git:**

```powershell
# See your local backups
git log --oneline

# Restore to previous commit
git reset --hard <commit-hash>
```

Or use: `.\restore.ps1`

---

### **Scenario 2: "I pushed bad code to GitHub"**

✅ **Fix - restore to older version then force push:**

```powershell
# Find good commit
git log --oneline

# Go back to good commit
git reset --hard <good-commit-hash>

# Force update GitHub
git push --force
```

⚠️ **Warning:** `--force` overwrites GitHub history. Use carefully!

---

### **Scenario 3: "My computer crashed / hard drive died"**

✅ **Complete recovery from GitHub to any computer:**

```powershell
# On new/different computer, download everything:
git clone https://github.com/YOUR-USERNAME/canteen-server.git

cd canteen-server

# Install dependencies
npm install

# You're back in business!
```

**Result:** You get your ENTIRE project with FULL HISTORY back!

---

### **Scenario 4: "I accidentally deleted my entire project folder"**

✅ **Re-download from GitHub:**

```powershell
# Go to parent directory
cd C:\MyProj

# Delete corrupted folder (if still exists)
Remove-Item -Recurse -Force canteen-server

# Download fresh copy from GitHub
git clone https://github.com/YOUR-USERNAME/canteen-server.git

cd canteen-server
npm install
```

---

### **Scenario 5: "I want to work on multiple computers"**

✅ **Sync between computers:**

**On Computer A (after making changes):**
```powershell
git add .
git commit -m "Changes from computer A"
git push
```

**On Computer B (before working):**
```powershell
git pull  # Downloads latest changes from GitHub
```

---

### **Scenario 6: "I broke everything, want original working version"**

✅ **Restore to first commit (your baseline):**

```powershell
# See all commits
git log --oneline

# Restore to initial commit (8199084)
git reset --hard 8199084

# Update GitHub with this version
git push --force
```

Or download fresh:
```powershell
cd C:\MyProj
Remove-Item -Recurse -Force canteen-server
git clone https://github.com/YOUR-USERNAME/canteen-server.git
cd canteen-server
git checkout 8199084  # Go to specific backup point
```

---

## 🔍 Check GitHub Backup Status

### **Verify push succeeded:**
```powershell
git remote -v  # Shows GitHub URL
git log --oneline -5  # Shows local commits
git log origin/main --oneline -5  # Shows GitHub commits
```

If they match → ✅ Backed up successfully!

---

## 📊 GitHub Web Interface

You can also browse/download from GitHub website:

1. **View all commits:** `https://github.com/YOUR-USERNAME/canteen-server/commits`
2. **Download ZIP:** Click green "Code" button → "Download ZIP"
3. **View old versions:** Click commit → "Browse files"
4. **Compare changes:** Click any commit to see what changed

---

## 🔐 Authentication Options

GitHub may ask for authentication when pushing:

### **Option 1: Personal Access Token (Recommended)**

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Select scopes: `repo` (full control)
4. Copy token (you won't see it again!)
5. When Git asks for password, paste the token

### **Option 2: SSH Keys (Advanced)**

```powershell
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub → Settings → SSH Keys
```

Then use SSH URL:
```powershell
git remote set-url origin git@github.com:YOUR-USERNAME/canteen-server.git
```

---

## 🚨 Emergency Recovery Checklist

If disaster strikes:

- [ ] Go to https://github.com/YOUR-USERNAME/canteen-server
- [ ] Verify your code is there (check commits)
- [ ] Open new terminal/computer
- [ ] Run: `git clone https://github.com/YOUR-USERNAME/canteen-server.git`
- [ ] Run: `cd canteen-server && npm install`
- [ ] Test: `node server.js`
- [ ] ✅ You're recovered!

---

## 🎯 Best Practices

### **DO:**
✅ Push to GitHub after every major change  
✅ Write clear commit messages  
✅ Create tags for important versions: `git tag v1.0`  
✅ Keep your GitHub token/SSH key secure  
✅ Test recovery process occasionally  

### **DON'T:**
❌ Don't commit sensitive data (.env files, passwords)  
❌ Don't push broken code without testing  
❌ Don't share your GitHub access token  
❌ Don't delete GitHub repository (your backup!)  

---

## 📦 Complete Backup Strategy

**3-2-1 Rule:**

1. **Local Git** (on your computer) ← Working copy
2. **GitHub** (cloud) ← Online backup
3. **USB/External Drive** (optional) ← Physical backup

```powershell
# Optional: Create USB backup
git clone C:\MyProj\canteen-server D:\Backups\canteen-server
```

---

## 🆘 "I Lost Everything" Recovery Steps

**Worst case: Computer destroyed, no local files**

1. Get any computer with internet
2. Install Git: https://git-scm.com/download/win
3. Install Node.js: https://nodejs.org/
4. Open PowerShell:
   ```powershell
   cd C:\
   git clone https://github.com/YOUR-USERNAME/canteen-server.git
   cd canteen-server
   npm install
   ```
5. ✅ **Your entire project is back, with full history!**

---

## 💡 Pro Tips

### **View what's on GitHub vs Local:**
```powershell
git fetch  # Check GitHub without downloading
git log HEAD..origin/main --oneline  # See commits on GitHub you don't have
git log origin/main..HEAD --oneline  # See commits you haven't pushed
```

### **Create release versions:**
```powershell
git tag -a v1.0 -m "Production ready version"
git push origin v1.0
```

### **Download specific version:**
```powershell
git clone https://github.com/YOUR-USERNAME/canteen-server.git
cd canteen-server
git checkout v1.0  # Or any commit hash
```

---

## 📞 Quick Reference

| Situation | Command |
|-----------|---------|
| **First time push** | `git push -u origin main` |
| **Daily push** | `git push` |
| **Get updates** | `git pull` |
| **Fresh download** | `git clone <URL>` |
| **Check backup status** | `git status` |
| **See GitHub commits** | `git log origin/main` |
| **Force overwrite GitHub** | `git push --force` |
| **Restore from GitHub** | `git pull --force` |

---

## 🎓 Summary

**GitHub = Time Machine in the Cloud**

- Every commit is saved forever (unless you delete repo)
- You can restore any version at any time
- Works from any computer
- Even if your computer explodes, your code is safe
- Free for public repositories
- Free for private repositories (with GitHub account)

**Bottom line:** Once pushed to GitHub, your code is basically indestructible! 🛡️

