# Mobile Support Documentation

## ✅ What's Been Added

Your NEUTap system now has **professional mobile support** with:

### 📱 Responsive Design
- ✅ Mobile-optimized layouts for all screens
- ✅ Touch-friendly tap targets (minimum 44px)
- ✅ Proper viewport configuration
- ✅ Prevents unwanted zoom on input focus
- ✅ Responsive tables with card-style layout
- ✅ Mobile-optimized modals and forms

### 🎯 Touch Interactions
- ✅ Swipe gestures support
- ✅ Pull-to-refresh functionality
- ✅ Haptic feedback on actions
- ✅ Bottom sheets for mobile-friendly dialogs
- ✅ Action sheets for menu options
- ✅ Touch-optimized POS keypad

### 🎨 Mobile UI Components
- ✅ Bottom navigation bar
- ✅ Sticky mobile header
- ✅ Floating action button (FAB)
- ✅ Mobile-friendly search bar
- ✅ Full-screen modals option
- ✅ Card-style tables
- ✅ Responsive charts

### 📐 Platform Support
- ✅ iOS optimization (notch/safe areas)
- ✅ Android optimization
- ✅ Landscape mode support
- ✅ PWA-ready with safe areas
- ✅ Dark mode optimized

## 🚀 How to Use Mobile Features

### Basic Usage

The mobile features activate automatically when the viewport is ≤768px wide. No additional configuration needed!

### Pull to Refresh

```javascript
// Enable pull-to-refresh on any page
Mobile.pullToRefresh(() => {
  // Your refresh logic
  return loadSales(); // Must return a Promise
});
```

### Swipe Gestures

```javascript
// Add swipe actions to any element
const tableRow = document.querySelector('.transaction-row');

Mobile.swipe(tableRow, {
  onSwipeLeft: (element) => {
    // Swipe left action (e.g., delete)
    console.log('Swiped left!');
  },
  onSwipeRight: (element) => {
    // Swipe right action (e.g., archive)
    console.log('Swiped right!');
  }
});
```

### Bottom Sheet

```javascript
// Show a bottom sheet (mobile-style modal)
const sheet = Mobile.bottomSheet(`
  <h5>Transaction Details</h5>
  <p>Amount: ₱150.00</p>
  <button class="btn btn-primary full-width-mobile">Confirm</button>
`, {
  title: 'Details',
  dismissible: true,
  onDismiss: () => console.log('Sheet closed')
});

// Dismiss programmatically
sheet.dismiss();
```

### Action Sheet

```javascript
// Show mobile action menu
Mobile.actionSheet([
  {
    id: 'edit',
    icon: 'pencil',
    label: 'Edit Transaction',
    handler: () => editTransaction()
  },
  {
    id: 'delete',
    icon: 'trash',
    label: 'Delete',
    destructive: true,
    handler: () => deleteTransaction()
  }
], {
  title: 'Transaction Actions',
  cancelText: 'Cancel'
});
```

### Haptic Feedback

```javascript
// Light vibration
Mobile.haptic.light();

// Medium vibration
Mobile.haptic.medium();

// Heavy vibration
Mobile.haptic.heavy();

// Success pattern
Mobile.haptic.success();

// Error pattern
Mobile.haptic.error();
```

### Mobile Detection

```javascript
// Check if mobile
if (Mobile.detect.isMobile()) {
  console.log('Running on mobile!');
}

// Check if touch device
if (Mobile.detect.isTouch()) {
  console.log('Touch device detected');
}

// Check platform
if (Mobile.detect.isIOS()) {
  console.log('iOS device');
} else if (Mobile.detect.isAndroid()) {
  console.log('Android device');
}

// Get orientation
const orientation = Mobile.detect.getOrientation(); // 'portrait' or 'landscape'
```

## 🎨 Mobile CSS Classes

### Utility Classes

```html
<!-- Hide on mobile -->
<div class="hide-mobile">Desktop only content</div>

<!-- Show only on mobile -->
<div class="show-mobile">Mobile only content</div>

<!-- Stack vertically on mobile -->
<div class="stack-mobile d-flex">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Full width on mobile -->
<button class="btn btn-primary full-width-mobile">Submit</button>

<!-- Center text on mobile -->
<div class="text-center-mobile">Centered on mobile</div>
```

### Mobile Tables

```html
<!-- Automatically becomes card-style on mobile -->
<table class="table table-mobile-cards">
  <thead>
    <tr>
      <th>Name</th>
      <th>Amount</th>
      <th>Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Name">John Doe</td>
      <td data-label="Amount">₱150.00</td>
      <td data-label="Date">Nov 10, 2025</td>
    </tr>
  </tbody>
</table>
```

### Mobile Modals

```html
<!-- Full-screen modal on mobile -->
<div class="modal modal-fullscreen-mobile">
  <div class="modal-dialog">
    <div class="modal-content">
      <!-- Content -->
    </div>
  </div>
</div>

<!-- Bottom sheet modal -->
<div class="modal modal-bottom-sheet">
  <div class="modal-dialog">
    <div class="modal-content">
      <!-- Automatically gets swipe handle -->
      <!-- Content -->
    </div>
  </div>
</div>
```

### Mobile Button Groups

```html
<!-- Stack buttons vertically on mobile -->
<div class="btn-group-mobile-stack">
  <button class="btn btn-primary">Save</button>
  <button class="btn btn-secondary">Cancel</button>
</div>
```

## 📱 Testing on Mobile

### 1. **Same Network Testing**
Access from your phone using your computer's IP:
```
http://192.168.1.7:3000
```

### 2. **Chrome DevTools**
- Press F12 in Chrome
- Click the device toggle button (or Ctrl+Shift+M)
- Select a mobile device from the dropdown
- Test different screen sizes

### 3. **Responsive Design Mode (Firefox)**
- Press F12
- Click the responsive design mode button (or Ctrl+Shift+M)
- Test various screen sizes and orientations

## 🎯 Mobile Best Practices

### DO ✅
- Use `full-width-mobile` class for buttons on mobile
- Add `data-label` to table cells for card-style layout
- Use bottom sheets instead of regular modals for better UX
- Enable haptic feedback on important actions
- Test on actual devices, not just browser DevTools
- Use `hide-mobile` to remove non-essential content

### DON'T ❌
- Don't use hover effects (mobile has no hover)
- Don't make tap targets smaller than 44px
- Don't disable zoom completely (accessibility)
- Don't use modals for simple confirmations (use action sheets)
- Don't forget to test in landscape orientation

## 📊 Mobile Breakpoints

```css
/* Phone portrait */
@media (max-width: 576px) { }

/* Phone landscape / small tablet */
@media (max-width: 768px) { }

/* Tablet */
@media (max-width: 1024px) { }
```

## 🔧 Customization

### Change Mobile Breakpoint

Edit `public/css/mobile.css`:
```css
/* Change from 768px to your preferred breakpoint */
@media (max-width: 768px) {
  /* Mobile styles */
}
```

### Customize Bottom Navigation

Add to your HTML:
```html
<nav class="mobile-bottom-nav">
  <a href="#dashboard" class="mobile-nav-item active">
    <i class="bi bi-house-door"></i>
    <span>Home</span>
  </a>
  <a href="#transactions" class="mobile-nav-item">
    <i class="bi bi-receipt"></i>
    <span>Sales</span>
  </a>
  <a href="#profile" class="mobile-nav-item">
    <i class="bi bi-person"></i>
    <span>Profile</span>
  </a>
</nav>
```

### Add Floating Action Button

```html
<button class="mobile-fab" onclick="openSaleModal()">
  <i class="bi bi-plus-lg"></i>
</button>
```

## 🎉 Result

Your NEUTap system now provides a **professional mobile experience** that:

- ✅ Feels native on mobile devices
- ✅ Uses modern mobile UI patterns
- ✅ Supports touch gestures
- ✅ Optimizes for small screens
- ✅ Works great on iOS and Android
- ✅ Maintains full functionality
- ✅ Looks polished and professional

## 📱 Quick Test Checklist

- [ ] Open on mobile device (same network)
- [ ] Test login form (no zoom on input)
- [ ] Try pull-to-refresh on vendor dashboard
- [ ] Swipe on transaction rows
- [ ] Test POS keypad (large buttons)
- [ ] Check tables (should be card-style)
- [ ] Test modals (should be bottom sheets)
- [ ] Verify navigation is touch-friendly
- [ ] Test in landscape orientation
- [ ] Check dark mode on mobile

**Enjoy your professional mobile experience!** 📱✨
