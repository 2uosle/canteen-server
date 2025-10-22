# 🔄 Git Backup & Restore Guide

Your project is now under version control! You can experiment freely and restore anytime.

## 📸 Quick Commands

### **Save Your Current Work (Create Backup Point)**
```bash
cd C:\MyProj\canteen-server
git add .
git commit -m "Brief description of what you changed"
```

**Example:**
```bash
git commit -m "Added new analytics feature"
git commit -m "Fixed balance calculation bug"
git commit -m "Improved UI design"
```

---

## 🕐 View History

### **See all your backup points:**
```bash
git log --oneline
```

### **See what changed in each commit:**
```bash
git log --stat
```

### **See detailed changes:**
```bash
git show <commit-hash>
```

---

## ⏪ Restore to Previous Version

### **Method 1: Temporary Look (Safe)**
```bash
# Just look at old version (doesn't change anything permanently)
git checkout <commit-hash>

# Return to latest version
git checkout master
```

### **Method 2: Undo Last Commit (Keep Changes)**
```bash
# Undo last commit but keep your file changes
git reset --soft HEAD~1
```

### **Method 3: Completely Restore (⚠️ Destroys Current Work)**
```bash
# DANGER: This deletes all uncommitted changes!
git reset --hard <commit-hash>
```

---

## 🌿 Safe Experimentation with Branches

### **Create a branch to try something risky:**
```bash
# Create and switch to experimental branch
git checkout -b experiment-feature

# Make changes, test things...
# If it works:
git checkout master
git merge experiment-feature

# If it fails:
git checkout master
git branch -D experiment-feature  # Delete failed experiment
```

---

## 📊 Check Current Status

### **See what files changed:**
```bash
git status
```

### **See exact line changes:**
```bash
git diff
```

---

## 💾 Common Workflows

### **Workflow 1: Daily Backup**
```bash
git add .
git commit -m "End of day backup - $(Get-Date -Format 'yyyy-MM-dd')"
```

### **Workflow 2: Before Big Change**
```bash
# Save current state
git add .
git commit -m "Before refactoring payment system"

# Make your risky changes...

# If things break:
git reset --hard HEAD  # Restore to before changes
```

### **Workflow 3: Try Multiple Approaches**
```bash
# Approach 1
git checkout -b approach1
# ... make changes ...
git commit -am "Tried approach 1"

# Approach 2
git checkout master
git checkout -b approach2
# ... make changes ...
git commit -am "Tried approach 2"

# Compare and pick the best one
git checkout master
git merge approach1  # or approach2
```

---

## 🆘 Emergency Recovery

### **"I messed everything up!"**
```bash
# See your commit history
git log --oneline

# Go back to last working version
git reset --hard <commit-hash-that-worked>
```

### **"I accidentally deleted files!"**
```bash
# Restore all files to last commit
git checkout -- .
```

### **"I want to see what I changed before committing"**
```bash
git diff
```

---

## 🏷️ Create Named Restore Points (Tags)

### **Mark important versions:**
```bash
git tag -a v1.0 -m "Version 1.0 - Production ready"
git tag -a v1.1 -m "Added analytics"
```

### **List all tags:**
```bash
git tag
```

### **Restore to a tag:**
```bash
git checkout v1.0
```

---

## 📤 Push to GitHub/GitLab (Optional but Recommended!)

### **Create remote backup on GitHub:**
1. Create repository on GitHub (don't initialize with README)
2. Link your local repo:
```bash
git remote add origin https://github.com/yourusername/canteen-server.git
git branch -M main
git push -u origin main
```

### **After that, push changes:**
```bash
git push
```

---

## ⚡ PowerShell Aliases (Optional)

Add to your PowerShell profile (`notepad $PROFILE`):

```powershell
function gsave { git add .; git commit -m "$args" }
function ghistory { git log --oneline --graph --all }
function gundo { git reset --soft HEAD~1 }

# Usage:
# gsave "Fixed bug in reload function"
# ghistory
# gundo
```

---

## 🎯 Your Current Status

✅ **Initial backup created!** (Commit: 8199084)

You can now:
- Make changes to any file
- Run `git status` to see what changed
- Run `git add .` and `git commit -m "message"` to save
- Run `git log --oneline` to see all backups
- Run `git checkout <hash>` to go back to any point

---

## 📚 Need More Help?

- **Learn Git**: https://learngitbranching.js.org/
- **Visual Git**: https://git-school.github.io/visualizing-git/
- **Git Cheat Sheet**: https://education.github.com/git-cheat-sheet-education.pdf

---

**Remember:** Commit often! It's free and gives you more restore points.

