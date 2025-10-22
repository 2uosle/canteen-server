# 🆘 GitHub Recovery Cheatsheet

## Quick Answer: "How do I get my code back?"

### **Scenario 1: Computer Still Works**
```powershell
cd C:\MyProj\canteen-server
git pull  # Downloads latest from GitHub
```

### **Scenario 2: Deleted Project Folder**
```powershell
cd C:\MyProj
git clone https://github.com/YOUR-USERNAME/canteen-server.git
cd canteen-server
npm install
```

### **Scenario 3: New/Different Computer**
```powershell
# Install Git first: https://git-scm.com/download/win
# Then:
cd C:\
git clone https://github.com/YOUR-USERNAME/canteen-server.git
cd canteen-server
npm install
node server.js  # Should work!
```

### **Scenario 4: Everything Broken, Start Fresh**
```powershell
cd C:\MyProj
Remove-Item -Recurse -Force canteen-server  # Delete broken folder
git clone https://github.com/YOUR-USERNAME/canteen-server.git
cd canteen-server
npm install
```

---

## 📱 No Computer? Use GitHub Web!

1. Go to `https://github.com/YOUR-USERNAME/canteen-server`
2. Click green "Code" button
3. Click "Download ZIP"
4. Extract ZIP
5. Run `npm install`

---

## 🔄 Visual Flow

```
┌─────────────────────┐
│   Your Computer     │
│  (Working files)    │
└──────┬──────────────┘
       │
       │ git push
       ▼
┌─────────────────────┐
│      GITHUB         │  ← This is your SAFE backup
│   (Cloud backup)    │     Lives forever online
└──────┬──────────────┘     Accessible from anywhere
       │
       │ git clone / git pull
       ▼
┌─────────────────────┐
│  Any Computer       │  ← Recover to any machine
│  (Fresh copy)       │     Even if original is destroyed
└─────────────────────┘
```

---

## 🎯 One-Command Recovery

**Bookmark this command:**
```powershell
git clone https://github.com/YOUR-USERNAME/canteen-server.git && cd canteen-server && npm install
```

Paste it anywhere → get your full project back instantly!

---

## 🔐 What Gets Backed Up?

✅ **Saved on GitHub:**
- All source code (`server.js`, `index.html`, etc.)
- All scripts (`.ps1` files)
- All documentation (`.md` files)
- Complete Git history (every version you committed)
- Arduino code
- Configuration files

❌ **NOT saved (intentionally):**
- `node_modules/` (too large, reinstall with `npm install`)
- `.env` file (secrets shouldn't be on GitHub)
- Log files
- Database backups (`.sql` files)

---

## 🚨 Emergency Contact Sheet

### If You Forget Everything Else, Remember This:

1. **GitHub URL:** `https://github.com/YOUR-USERNAME/canteen-server`
2. **Recovery Command:** `git clone <URL-above>`
3. **After Recovery:** `npm install`

**That's it!** These 3 things can save you.

---

## 💡 Pro Tip: Test Your Recovery!

Try this RIGHT NOW to see it works:

```powershell
# Go somewhere else
cd C:\Temp

# Download a copy
git clone https://github.com/YOUR-USERNAME/canteen-server.git test-recovery

# Test it
cd test-recovery
npm install
node server.js

# Clean up
cd ..
Remove-Item -Recurse -Force test-recovery
```

If that works, you know your backup is solid! 🛡️

---

## 📞 Help Scripts

| Script | What It Does |
|--------|-------------|
| `.\github-setup.ps1` | First-time push to GitHub |
| `.\github-recover.ps1` | Interactive recovery menu |
| `.\quick-backup.ps1 "msg"` | Save + commit locally |
| `.\restore.ps1` | Restore from local Git |

---

## 🎓 Remember

> **GitHub = Your Time Machine Insurance Policy**
> 
> Once pushed, your code is virtually indestructible.
> 
> Computer explodes? 💥 Git clone it back.
> Accidentally deleted? 🗑️ Git clone it back.
> Want to work elsewhere? 🌍 Git clone it back.
> 
> **Always works. Always there. Forever.**

---

**Questions? Read `GITHUB-GUIDE.md` for detailed scenarios.**

