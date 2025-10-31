# Animation Quick Reference Guide

## 🎯 Quick Start - Common Animations

### Button Loading State
```javascript
// Start loading
submitBtn.classList.add('loading');

// When done
fetch('/api/endpoint')
  .then(response => response.json())
  .finally(() => {
    submitBtn.classList.remove('loading');
  });
```

### Toast Notifications
```javascript
function showToast(type, title, message) {
  // Ensure container exists
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`; // type: success, error, info
  
  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    info: 'bi-info-circle-fill'
  };
  
  toast.innerHTML = `
    <i class="toast-icon bi ${icons[type]}"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="bi bi-x"></i>
    </button>
  `;
  
  container.appendChild(toast);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Usage
showToast('success', 'Success!', 'User created successfully');
showToast('error', 'Error', 'Failed to save data');
showToast('info', 'Info', 'Processing your request...');
```

### Skeleton Loading
```html
<!-- Show while loading -->
<div class="card glass">
  <div class="card-body">
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text" style="width: 80%;"></div>
  </div>
</div>

<!-- Replace with real content -->
<script>
fetch('/api/data')
  .then(response => response.json())
  .then(data => {
    // Remove skeleton
    document.querySelectorAll('.skeleton').forEach(el => el.remove());
    // Add real content with animation
    // ...
  });
</script>
```

### Badge Update Animation
```javascript
function updateBadge(badgeElement, newValue) {
  badgeElement.textContent = newValue;
  badgeElement.classList.add('changed');
  setTimeout(() => {
    badgeElement.classList.remove('changed');
  }, 400);
}

// Usage
updateBadge(notificationBadge, 5);
```

### Progress Bar
```html
<div class="progress">
  <div class="progress-bar" id="uploadProgress" style="width: 0%"></div>
</div>

<script>
// Update progress
function updateProgress(percentage) {
  document.getElementById('uploadProgress').style.width = percentage + '%';
}

// Simulate upload
let progress = 0;
const interval = setInterval(() => {
  progress += 10;
  updateProgress(progress);
  if (progress >= 100) clearInterval(interval);
}, 200);
</script>
```

### Empty State
```html
<div class="empty-state">
  <div class="empty-state-icon">
    <i class="bi bi-inbox"></i>
  </div>
  <div class="empty-state-title">No transactions yet</div>
  <div class="empty-state-description">
    Your transaction history will appear here once you make your first purchase.
  </div>
  <button class="btn btn-accent mt-3">
    <i class="bi bi-plus-circle me-2"></i>
    Make First Purchase
  </button>
</div>
```

## 🎨 Animation Classes

### Cards
- `.glass` - Glass morphism effect with backdrop blur
- `.stat-card` - Dashboard stat card with hover animations
- `.card.glass:hover` - Automatic lift and shadow on hover

### Buttons
- `.btn` - Base button with ripple effect
- `.btn.loading` - Loading state with spinner
- `.btn-accent` - Primary action button
- `.btn-success-apple` - Success/confirmation button

### Badges
- `.badge` - Base badge
- `.badge.pulse` - Pulsing animation
- `.badge.changed` - Scale animation on value change

### Form Elements
- `.form-control:focus` - Animated focus ring
- `.input-group:focus-within` - Group-wide focus effect

### Tables
- `.table tbody tr` - Automatic staggered row animation
- `.table tbody tr:hover` - Row hover effect

## 🎭 Modal Animations

All modals automatically animate:
- Backdrop blur on open
- Scale + fade entrance
- Staggered content appearance

No additional classes needed - just use Bootstrap's modal structure.

## 🎪 Special Components

### Card Flip
```html
<div class="card-flip" id="myCard">
  <div class="card-flip-inner">
    <div class="card-flip-front">
      <div class="card glass">Front content</div>
    </div>
    <div class="card-flip-back">
      <div class="card glass">Back content</div>
    </div>
  </div>
</div>

<script>
// Flip the card
document.getElementById('myCard').classList.toggle('flipped');
</script>
```

## ⚡ Performance Tips

### Use CSS Transforms
✅ **Good** - Hardware accelerated
```css
transform: translateY(-4px);
transform: scale(1.05);
```

❌ **Avoid** - Causes reflow
```css
top: -4px;
width: 105%;
```

### Debounce Expensive Operations
```javascript
let timeout;
element.addEventListener('input', () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    // Expensive operation
  }, 300);
});
```

### Use IntersectionObserver for Scroll Animations
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
});

document.querySelectorAll('.card').forEach(card => {
  observer.observe(card);
});
```

## ♿ Accessibility

All animations respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Add Skip Links
```html
<a href="#main-content" class="skip-to-content">
  Skip to main content
</a>

<main id="main-content">
  <!-- Your content -->
</main>
```

## 🎯 Animation Timing Reference

| Duration | Use Case |
|----------|----------|
| 0.15s - 0.2s | Micro-interactions (hover, focus) |
| 0.25s - 0.3s | UI feedback (clicks, toggles) |
| 0.4s - 0.5s | Content transitions |
| 0.6s - 0.75s | Modal/overlay animations |
| 1s+ | Loading animations, complex transitions |

### Easing Functions
```css
/* Natural feel (recommended) */
cubic-bezier(0.4, 0, 0.2, 1)

/* Bounce effect */
cubic-bezier(0.68, -0.55, 0.265, 1.55)

/* Smooth entrance */
cubic-bezier(0, 0, 0.2, 1)

/* Smooth exit */
cubic-bezier(0.4, 0, 1, 1)
```

## 🔍 Debugging Animations

### Slow Down Animations (Dev Only)
```css
/* Add to your CSS temporarily */
* {
  animation-duration: 3s !important;
  transition-duration: 3s !important;
}
```

### Chrome DevTools
1. Open DevTools (F12)
2. Go to "More tools" → "Animations"
3. Trigger animation
4. Scrub timeline to inspect

## 📱 Mobile Considerations

### Touch-Friendly Ripples
```css
.btn::before {
  /* Ripple effect works on touch */
  pointer-events: none;
}

.btn:active::before {
  /* Activated on touchstart */
  width: 300px;
  height: 300px;
}
```

### Reduce Motion on Low-End Devices
```javascript
// Feature detection
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
  // Disable complex animations
  document.body.classList.add('reduced-motion');
}
```

## 🎨 Customizing Colors

All animations use CSS custom properties:

```css
:root {
  --accent: #0a84ff;
  --accent-2: #34c759;
  --danger: #ff3b30;
  --surface: #fff;
  --border: rgba(0, 0, 0, 0.1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --accent: #0a84ff;
    --surface: #1c1c1e;
    --border: rgba(255, 255, 255, 0.1);
  }
}
```

## 🚀 Quick Wins

### Instant Polish Checklist
- [ ] Add `.loading` class to async buttons
- [ ] Replace alerts with toast notifications
- [ ] Show skeleton loaders during data fetch
- [ ] Use empty states instead of blank divs
- [ ] Add badge animations for real-time updates
- [ ] Ensure all modals use standard Bootstrap structure
- [ ] Test with keyboard navigation
- [ ] Verify reduced-motion compliance

---

**Pro Tip**: Start with the most-used flows (login, main dashboard, primary actions) and progressively enhance secondary features.
