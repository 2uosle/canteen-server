/**
 * NEUTap UI Enhancement Module
 * 
 * PRESENTATION ONLY - Does not modify app logic
 * 
 * Features:
 * - Theme toggle with localStorage persistence
 * - Toast notification API
 * - Respects prefers-reduced-motion
 * - Accessibility enhancements
 */

(function() {
  'use strict';

  /* =========================================================================
     THEME MANAGEMENT
     ========================================================================= */

  const ThemeManager = {
    STORAGE_KEY: 'neutap-theme-preference',
    THEMES: {
      SYSTEM: 'system',
      LIGHT: 'light',
      DARK: 'dark'
    },

    init() {
      this.applyTheme(this.getPreference());
      this.setupToggleListeners();
      this.watchSystemTheme();
    },

    getPreference() {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && Object.values(this.THEMES).includes(stored)) {
        return stored;
      }
      return this.THEMES.SYSTEM;
    },

    setPreference(theme) {
      localStorage.setItem(this.STORAGE_KEY, theme);
      this.applyTheme(theme);
      this.updateToggleUI(theme);
    },

    applyTheme(preference) {
      const htmlEl = document.documentElement;
      
      if (preference === this.THEMES.SYSTEM) {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        htmlEl.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
        if (systemPrefersDark) {
          htmlEl.classList.add('theme-dark');
        } else {
          htmlEl.classList.remove('theme-dark');
        }
      } else if (preference === this.THEMES.DARK) {
        htmlEl.setAttribute('data-theme', 'dark');
        htmlEl.classList.add('theme-dark');
      } else {
        htmlEl.setAttribute('data-theme', 'light');
        htmlEl.classList.remove('theme-dark');
      }
    },

    updateToggleUI(preference) {
      const themeIcon = document.getElementById('themeIcon');
      const themeLabel = document.getElementById('themeLabel');

      if (!themeIcon || !themeLabel) return;

      if (preference === this.THEMES.SYSTEM) {
        themeIcon.className = 'bi bi-circle-half me-1';
        themeLabel.textContent = 'System';
      } else if (preference === this.THEMES.LIGHT) {
        themeIcon.className = 'bi bi-sun me-1';
        themeLabel.textContent = 'Light';
      } else if (preference === this.THEMES.DARK) {
        themeIcon.className = 'bi bi-moon me-1';
        themeLabel.textContent = 'Dark';
      }
    },

    setupToggleListeners() {
      // Update UI on page load
      this.updateToggleUI(this.getPreference());
    },

    watchSystemTheme() {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Modern API
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', (e) => {
          if (this.getPreference() === this.THEMES.SYSTEM) {
            this.applyTheme(this.THEMES.SYSTEM);
          }
        });
      } 
      // Fallback for older browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener((e) => {
          if (this.getPreference() === this.THEMES.SYSTEM) {
            this.applyTheme(this.THEMES.SYSTEM);
          }
        });
      }
    }
  };

  /* =========================================================================
     TOAST NOTIFICATIONS
     ========================================================================= */

  const ToastManager = {
    container: null,
    toasts: [],
    idCounter: 0,

    init() {
      this.createContainer();
    },

    createContainer() {
      if (!document.getElementById('ui-toast-container')) {
        const container = document.createElement('div');
        container.id = 'ui-toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(container);
        this.container = container;
      } else {
        this.container = document.getElementById('ui-toast-container');
      }
    },

    show(message, options = {}) {
      const {
        variant = 'info', // info, success, error, warning
        duration = 5000,
        dismissible = true
      } = options;

      const toastId = ++this.idCounter;
      const toast = this.createToastElement(toastId, message, variant, dismissible);
      
      this.container.appendChild(toast);
      this.toasts.push({ id: toastId, element: toast });

      // Auto-dismiss
      if (duration > 0) {
        setTimeout(() => {
          this.dismiss(toastId);
        }, duration);
      }

      // Announce to screen readers
      this.announceToScreenReader(message);

      return toastId;
    },

    createToastElement(id, message, variant, dismissible) {
      const toast = document.createElement('div');
      toast.className = `ui-toast ui-toast-${variant}`;
      toast.setAttribute('data-toast-id', id);
      toast.setAttribute('role', 'alert');

      const icon = this.getIcon(variant);
      
      toast.innerHTML = `
        <span class="ui-toast-icon">${icon}</span>
        <div class="ui-toast-content">${this.escapeHtml(message)}</div>
        ${dismissible ? `
          <button class="ui-toast-close" aria-label="Close notification">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        ` : ''}
      `;

      if (dismissible) {
        const closeBtn = toast.querySelector('.ui-toast-close');
        closeBtn.addEventListener('click', () => {
          this.dismiss(id);
        });
      }

      return toast;
    },

    getIcon(variant) {
      const icons = {
        success: '<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>'
      };
      return icons[variant] || icons.info;
    },

    dismiss(id) {
      const toastData = this.toasts.find(t => t.id === id);
      if (!toastData) return;

      const toast = toastData.element;
      toast.classList.add('toast-exiting');

      // Check for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = prefersReducedMotion ? 10 : 200;

      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, duration);
    },

    announceToScreenReader(message) {
      const ariaAlerts = document.getElementById('ariaAlerts');
      if (ariaAlerts) {
        ariaAlerts.textContent = message;
        // Clear after announcement
        setTimeout(() => {
          ariaAlerts.textContent = '';
        }, 1000);
      }
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // Expose escapeHtml globally
  window.escapeHtml = UI.escapeHtml;

  /* =========================================================================
     ACCESSIBILITY ENHANCEMENTS
     ========================================================================= */

  const A11yEnhancements = {
    init() {
      this.setupFocusVisible();
      this.setupSkipLinks();
      this.enhanceKeyboardNav();
    },

    setupFocusVisible() {
      // Add focus-visible class for better keyboard navigation
      // (This is handled by CSS :focus-visible, but we add a polyfill for older browsers)
      let hadKeyboardEvent = false;
      
      document.addEventListener('keydown', () => {
        hadKeyboardEvent = true;
      });

      document.addEventListener('mousedown', () => {
        hadKeyboardEvent = false;
      });

      document.addEventListener('focus', (e) => {
        if (hadKeyboardEvent && e.target.matches('button, a, input, select, textarea')) {
          e.target.setAttribute('data-focus-visible', 'true');
        }
      }, true);

      document.addEventListener('blur', (e) => {
        e.target.removeAttribute('data-focus-visible');
      }, true);
    },

    setupSkipLinks() {
      const skipLinks = document.querySelectorAll('.skip-link');
      skipLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const targetId = link.getAttribute('href').substring(1);
          const target = document.getElementById(targetId);
          if (target) {
            e.preventDefault();
            target.setAttribute('tabindex', '-1');
            target.focus();
            target.addEventListener('blur', () => {
              target.removeAttribute('tabindex');
            }, { once: true });
          }
        });
      });
    },

    enhanceKeyboardNav() {
      // ESC to close modals (if Bootstrap hasn't already handled it)
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          // Allow Bootstrap and other handlers to work first
          const openModal = document.querySelector('.modal.show');
          if (openModal && !e.defaultPrevented) {
            const closeBtn = openModal.querySelector('[data-bs-dismiss="modal"]');
            if (closeBtn) {
              closeBtn.click();
            }
          }
        }
      });
    }
  };

  /* =========================================================================
     INITIALIZATION
     ========================================================================= */

  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        ThemeManager.init();
        ToastManager.init();
        A11yEnhancements.init();
      });
    } else {
      ThemeManager.init();
      ToastManager.init();
      A11yEnhancements.init();
    }
  }

  /* =========================================================================
     PUBLIC API
     ========================================================================= */

  window.UIToast = {
    show: (message, options) => ToastManager.show(message, options),
    success: (message, options) => ToastManager.show(message, { ...options, variant: 'success' }),
    error: (message, options) => ToastManager.show(message, { ...options, variant: 'error' }),
    warning: (message, options) => ToastManager.show(message, { ...options, variant: 'warning' }),
    info: (message, options) => ToastManager.show(message, { ...options, variant: 'info' }),
    dismiss: (id) => ToastManager.dismiss(id)
  };

  window.UITheme = {
    get: () => ThemeManager.getPreference(),
    set: (theme) => ThemeManager.setPreference(theme),
    toggle: () => {
      const current = ThemeManager.getPreference();
      const next = current === ThemeManager.THEMES.DARK 
        ? ThemeManager.THEMES.LIGHT 
        : ThemeManager.THEMES.DARK;
      ThemeManager.setPreference(next);
    }
  };

  // Global function for theme dropdown
  window.changeTheme = function(theme) {
    ThemeManager.setPreference(theme);
    // Also call applyTheme from app.js if it exists
    if (typeof window.applyTheme === 'function') {
      window.applyTheme(theme);
    }
  };

  // Auto-initialize
  init();

})();
