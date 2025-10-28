# 📌 Quick File Reference Guide

## File Structure at a Glance

```
public/
├── index.html              Main HTML file (clean structure)
├── css/
│   ├── variables.css       Theme colors & design tokens
│   └── components.css      All component styles
└── js/
    ├── utils.js           Helper functions
    └── app.js             Main application logic
```

---

## When to Edit Which File

### 🎨 Changing Colors or Theme
**Edit:** `public/css/variables.css`

**What's inside:**
- Color palette (--accent, --danger, etc.)
- Border radius tokens
- Spacing tokens
- Shadow definitions
- Dark mode colors

**Example:**
```css
--accent: #0A84FF;    /* Change this for different primary color */
--accent-2: #34C759;  /* Change this for different success color */
```

---

### 💄 Changing Component Styles
**Edit:** `public/css/components.css`

**What's inside:**
- Buttons
- Forms
- Cards
- Tables
- Pills
- POS interface styles
- Animations

**Example:**
```css
.btn-accent { 
  background: var(--accent); 
  /* Customize button styles here */
}
```

---

### 🔧 Adding Utility Functions
**Edit:** `public/js/utils.js`

**What's inside:**
- DOM helpers ($, show, hide)
- Formatting functions (fmtMoney, formatDate)
- HTTP helpers (httpGet, httpPost, etc.)

**Example:**
```javascript
function formatPhone(phone) {
  // Add your utility function here
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}
```

---

### 🎯 Adding Features or Logic
**Edit:** `public/js/app.js`

**What's inside:**
- Theme system
- Authentication
- Dashboard logic
- POS systems
- RFID management
- Charts
- Admin functions

**Example:**
```javascript
async function myNewFeature() {
  const data = await httpGet('/api/my-endpoint');
  // Your feature logic here
}
```

---

### 🏗️ Changing HTML Structure
**Edit:** `public/index.html`

**What's inside:**
- Page structure
- Navigation bar
- Login form
- Dashboard sections
- Modals
- Links to CSS/JS

**Example:**
```html
<div class="my-new-section">
  <!-- Add your HTML here -->
</div>
```

---

## Common Tasks

### 1. Change Primary Color
1. Open `public/css/variables.css`
2. Find `--accent: #0A84FF;`
3. Change to your color: `--accent: #FF6B6B;`
4. Save and refresh browser

### 2. Add New API Helper
1. Open `public/js/utils.js`
2. Add function at the end:
   ```javascript
   async function myApiCall(id) {
     return httpGet(`/api/resource/${id}`);
   }
   ```
3. Save

### 3. Add New Dashboard Card
1. Open `public/index.html`
2. Find the dashboard section
3. Add card:
   ```html
   <div class="col-12">
     <div class="card glass">
       <div class="card-header">My New Card</div>
       <div class="card-body">Content here</div>
     </div>
   </div>
   ```
4. Save

### 4. Style the New Card
1. Open `public/css/components.css`
2. Add styles:
   ```css
   .my-new-card {
     background: var(--surface);
     border-radius: var(--radius-lg);
   }
   ```
3. Save

---

## File Dependencies

```
index.html
  ↓ loads
  ├── css/variables.css    (must load first for tokens)
  ├── css/components.css   (uses variables)
  ├── js/utils.js          (must load first for helpers)
  └── js/app.js            (uses utils)
```

**Important:** Don't change the load order!

---

## Quick Fixes

### Problem: Styles not applying
**Solution:** Clear browser cache (Ctrl+Shift+R)

### Problem: JavaScript error "$ is not defined"
**Solution:** Check that utils.js loads before app.js in index.html

### Problem: Variables not working in CSS
**Solution:** Make sure variables.css loads before components.css

### Problem: Changes not visible
**Solution:** Hard refresh browser (Ctrl+F5)

---

## File Sizes Reference

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| **index.html** | 883 | 44 KB | Structure |
| **variables.css** | 74 | 2 KB | Theme |
| **components.css** | 410 | 15 KB | Styles |
| **utils.js** | 62 | 2 KB | Helpers |
| **app.js** | 1,389 | 61 KB | Logic |

---

## Backup & Recovery

### Backup Before Making Changes
```bash
Copy-Item public/index.html public/index.html.backup -Force
Copy-Item public/css/components.css public/css/components.css.backup -Force
```

### Restore Original
```bash
# Original backup exists at:
public/index.html.backup

# To restore:
Copy-Item public/index.html.backup public/index.html -Force
```

---

## Testing After Changes

1. **Start server:**
   ```bash
   npm start
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Test each feature:**
   - Login/Logout
   - Theme switching
   - Dashboard displays
   - POS modals
   - Charts render

4. **Check browser console:**
   - Press F12
   - Look for errors (red text)

---

## Git Workflow

```bash
# 1. Check what changed
git status

# 2. Add changes
git add public/css/variables.css
git add public/js/app.js

# 3. Commit with message
git commit -m "Updated theme colors and added new feature"

# 4. Push to remote (if using GitHub)
git push
```

---

## Need Help?

- **File Structure:** See `FILE-STRUCTURE-REFACTORING.md`
- **Full Documentation:** See `README.md`
- **POS System:** See `POS-UI.md`
- **Security:** See `SECURITY.md`

---

**Quick Tip:** Use your IDE's search (Ctrl+Shift+F) to find code across all files!


