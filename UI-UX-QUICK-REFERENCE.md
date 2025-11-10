# UI/UX Improvements - Quick Reference

## New CSS Classes Available

### Button States
```html
<!-- Loading State -->
<button class="btn btn-accent is-loading">Processing...</button>

<!-- Error State -->
<button class="btn btn-accent is-error">Failed</button>

<!-- Use in JavaScript -->
<script>
  async function handleClick(btn) {
    btn.classList.add('is-loading');
    try {
      await someAsyncOperation();
    } catch (error) {
      btn.classList.add('is-error');
      setTimeout(() => btn.classList.remove('is-error'), 2000);
    } finally {
      btn.classList.remove('is-loading');
    }
  }
</script>
```

### Form Validation
```html
<!-- Invalid Input -->
<input type="text" class="form-control is-invalid" />
<div class="invalid-feedback">This field is required</div>

<!-- Valid Input -->
<input type="text" class="form-control is-valid" />
<div class="valid-feedback">Looks good!</div>
```

### ARIA Labels (Accessibility)
```html
<!-- Icon-Only Buttons Need ARIA Labels -->
<button aria-label="Delete item">
  <i class="bi bi-trash"></i>
</button>

<button aria-label="Edit item">
  <i class="bi bi-pencil"></i>
</button>
```

## New JavaScript Utilities

### Debounce Function
```javascript
// Wait for user to stop typing before searching
const debouncedSearch = debounce(function(query) {
  performSearch(query);
}, 500); // Wait 500ms after last input

searchInput.addEventListener('input', (e) => {
  debouncedSearch(e.target.value);
});
```

### Throttle Function
```javascript
// Limit scroll handler to run max once per 100ms
const throttledScroll = throttle(function() {
  handleScrollEvent();
}, 100);

window.addEventListener('scroll', throttledScroll);
```

### Usage Examples
```javascript
// Debounce: Wait until user stops typing
// Use for: search, autocomplete, form validation
const debouncedFunc = debounce(myFunction, 300);

// Throttle: Limit execution rate
// Use for: scroll, resize, mousemove
const throttledFunc = throttle(myFunction, 100);
```

## CSS Design Tokens

### Spacing Scale
```css
/* Use tokens instead of hard-coded values */

/* Before */
.my-element {
  margin: 16px;
  padding: 24px;
  gap: 8px;
}

/* After */
.my-element {
  margin: var(--space-4);   /* 16px */
  padding: var(--space-6);  /* 24px */
  gap: var(--space-2);      /* 8px */
}

/* Available tokens */
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-7:  28px
--space-8:  32px
--space-9:  40px
--space-10: 48px
```

### Z-Index Scale
```css
/* Use tokens for consistent layering */

/* Before */
.my-modal {
  z-index: 9999;
}

/* After */
.my-modal {
  z-index: var(--z-modal); /* 1050 */
}

/* Available tokens */
--z-base: 1           /* Normal flow */
--z-raised: 10        /* Slightly elevated */
--z-dropdown: 1000    /* Dropdowns */
--z-sticky: 1020      /* Sticky headers */
--z-fixed: 1030       /* Fixed elements */
--z-modal-backdrop: 1040
--z-modal: 1050       /* Modals */
--z-calendar: 1050    /* Calendar (same as modal) */
--z-popover: 1060     /* Popovers */
--z-toast: 1080       /* Toast notifications */
--z-tooltip: 1090     /* Tooltips (highest) */
```

### Typography Scale
```css
/* Available text sizes */
font-size: var(--text-xs);   /* 12px */
font-size: var(--text-sm);   /* 14px */
font-size: var(--text-base); /* 16px */
font-size: var(--text-lg);   /* 18px */
font-size: var(--text-xl);   /* 20px */
font-size: var(--text-2xl);  /* 24px */
font-size: var(--text-3xl);  /* 30px */
font-size: var(--text-4xl);  /* 36px */
```

## Mobile Optimizations

### Touch Targets
All buttons now have minimum 44x44px touch targets (WCAG AAA):
```css
.btn {
  min-height: var(--tap-target-min); /* 44px */
}
```

### Responsive Breakpoints
```css
/* Extra small devices (phones, less than 576px) */
@media (max-width: 575.98px) { }

/* Small devices (landscape phones, less than 768px) */
@media (max-width: 767.98px) { }

/* Medium devices (tablets, less than 992px) */
@media (max-width: 991.98px) { }

/* Large devices (desktops, less than 1200px) */
@media (max-width: 1199.98px) { }
```

## Accessibility Features

### Focus-Visible (Keyboard Navigation)
```css
/* Automatic focus indicator for keyboard users */
/* No focus outline for mouse users */

/* Elements automatically get focus ring when using keyboard */
button:focus-visible { /* Has outline */ }
button:focus:not(:focus-visible) { /* No outline */ }
```

### Screen Reader Support
```html
<!-- Use sr-only class for screen reader only text -->
<span class="sr-only">Loading...</span>

<!-- Use aria-label for buttons without text -->
<button aria-label="Close dialog">
  <i class="bi bi-x"></i>
</button>

<!-- Use aria-live for dynamic content -->
<div aria-live="polite" aria-atomic="true">
  <!-- Toast messages appear here -->
</div>
```

## Dark Mode Improvements

### Enhanced Input Visibility
```css
/* Dark mode inputs now have better contrast */
.theme-dark .form-control:focus {
  background-color: rgba(255, 255, 255, 0.18); /* Increased from 0.12 */
}

.theme-dark .form-control::placeholder {
  color: rgba(255, 255, 255, 0.5); /* Increased from 0.4 */
}
```

## Performance Best Practices

### Chart Updates
Chart styles are now debounced to prevent excessive re-renders:
```javascript
// Automatically debounced (150ms)
refreshChartStyles(); // Call as normal, debouncing is handled internally
```

### When to Use Debounce vs Throttle

**Debounce** - Wait until activity stops
- ✅ Search input
- ✅ Form validation
- ✅ Window resize
- ✅ Autocomplete

**Throttle** - Limit execution rate
- ✅ Scroll events
- ✅ Mousemove tracking
- ✅ Animation frames
- ✅ API rate limiting

## Common Patterns

### Async Button Pattern
```javascript
async function handleSubmit(event) {
  const btn = event.target;
  
  // 1. Add loading state
  btn.classList.add('is-loading');
  btn.disabled = true;
  
  try {
    // 2. Perform async operation
    const result = await apiCall();
    
    // 3. Show success (optional)
    toast('Success!', 'success');
    
  } catch (error) {
    // 4. Show error state
    btn.classList.add('is-error');
    setTimeout(() => btn.classList.remove('is-error'), 2000);
    toast(error.message, 'error');
    
  } finally {
    // 5. Remove loading state
    btn.classList.remove('is-loading');
    btn.disabled = false;
  }
}
```

### Form Validation Pattern
```javascript
function validateForm(formElement) {
  const inputs = formElement.querySelectorAll('input[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    const feedback = input.nextElementSibling;
    
    if (!input.value.trim()) {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      if (feedback) feedback.textContent = 'This field is required';
      isValid = false;
    } else {
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      if (feedback) feedback.textContent = '';
    }
  });
  
  return isValid;
}

// Use with form submit
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (validateForm(form)) {
    handleSubmit(e);
  }
});
```

### Debounced Search Pattern
```javascript
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

const performSearch = debounce(async function(query) {
  if (query.length < 2) return;
  
  try {
    const results = await fetch(`/api/search?q=${query}`).then(r => r.json());
    displayResults(results);
  } catch (error) {
    console.error('Search failed:', error);
  }
}, 300); // Wait 300ms after user stops typing

searchInput.addEventListener('input', (e) => {
  performSearch(e.target.value);
});
```

## Migration Guide

### Updating Existing Code

#### Replace Hard-Coded Spacing
```css
/* Find and replace */
margin: 16px;        → margin: var(--space-4);
padding: 24px;       → padding: var(--space-6);
gap: 8px;           → gap: var(--space-2);
margin-top: 32px;    → margin-top: var(--space-8);
```

#### Add Loading States to Buttons
```html
<!-- Before -->
<button onclick="submitForm()">Submit</button>

<!-- After -->
<button onclick="submitFormWithLoading(this)">Submit</button>

<script>
async function submitFormWithLoading(btn) {
  btn.classList.add('is-loading');
  try {
    await submitForm();
  } finally {
    btn.classList.remove('is-loading');
  }
}
</script>
```

#### Add ARIA Labels
```html
<!-- Before -->
<button onclick="deleteItem()">
  <i class="bi bi-trash"></i>
</button>

<!-- After -->
<button onclick="deleteItem()" aria-label="Delete item">
  <i class="bi bi-trash"></i>
</button>
```

## Browser Support

All features are supported in:
- ✅ Chrome 90+ (including Edge)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+

Graceful degradation for older browsers.

## Additional Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN: CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [MDN: ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [Bootstrap 5 Validation](https://getbootstrap.com/docs/5.3/forms/validation/)

## Questions?

Refer to `UI-UX-IMPROVEMENTS-SUMMARY.md` for complete implementation details.
