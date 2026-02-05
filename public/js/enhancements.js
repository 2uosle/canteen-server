/**
 * NEUTap UI Enhancements
 * 
 * Interactive features for improved usability:
 * - Table sorting
 * - Keyboard shortcuts
 * - Loading states
 * - Form validation
 * - Context menus
 * - Search highlighting
 * - Auto-save indicators
 * 
 * PRESENTATION ONLY - Does not modify core app logic
 */

(function() {
  'use strict';

  /* =========================================================================
     TABLE SORTING
     ========================================================================= */

  const TableSort = {
    init() {
      document.addEventListener('click', (e) => {
        const th = e.target.closest('th[data-sortable]');
        if (!th) return;

        const table = th.closest('table');
        if (!table) return;

        this.sortTable(table, th);
      });
    },

    sortTable(table, th) {
      const tbody = table.querySelector('tbody');
      if (!tbody) return;

      const columnIndex = Array.from(th.parentElement.children).indexOf(th);
      const rows = Array.from(tbody.querySelectorAll('tr'));
      
      // Determine sort direction
      const currentSort = th.classList.contains('sort-asc') ? 'asc' : 
                          th.classList.contains('sort-desc') ? 'desc' : 'none';
      const newSort = currentSort === 'none' ? 'asc' : 
                      currentSort === 'asc' ? 'desc' : 'asc';

      // Clear all sort indicators
      th.parentElement.querySelectorAll('th').forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
      });

      // Set new sort indicator
      th.classList.add(`sort-${newSort}`);

      // Sort rows
      rows.sort((a, b) => {
        const aCell = a.cells[columnIndex];
        const bCell = b.cells[columnIndex];
        
        if (!aCell || !bCell) return 0;

        const aValue = this.getCellValue(aCell);
        const bValue = this.getCellValue(bCell);

        if (aValue < bValue) return newSort === 'asc' ? -1 : 1;
        if (aValue > bValue) return newSort === 'asc' ? 1 : -1;
        return 0;
      });

      // Reorder rows
      rows.forEach(row => tbody.appendChild(row));
    },

    getCellValue(cell) {
      // Check for data-sort attribute first
      if (cell.hasAttribute('data-sort')) {
        return cell.getAttribute('data-sort');
      }

      // Try to parse as number
      const text = cell.textContent.trim();
      const num = parseFloat(text.replace(/[^0-9.-]/g, ''));
      
      return isNaN(num) ? text.toLowerCase() : num;
    }
  };

  /* =========================================================================
     KEYBOARD SHORTCUTS
     ========================================================================= */

  const KeyboardShortcuts = {
    shortcuts: new Map(),

    init() {
      document.addEventListener('keydown', (e) => {
        const key = this.getKeyCombo(e);
        const handler = this.shortcuts.get(key);

        if (handler) {
          // Don't trigger if user is typing in an input
          if (e.target.matches('input, textarea, select')) return;
          
          e.preventDefault();
          handler(e);
        }
      });

      this.registerDefaultShortcuts();
    },

    register(key, handler, description) {
      this.shortcuts.set(key.toLowerCase(), handler);
    },

    getKeyCombo(e) {
      const parts = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');
      parts.push(e.key.toLowerCase());
      return parts.join('+');
    },

    registerDefaultShortcuts() {
      // Ctrl+K: Focus search
      this.register('ctrl+k', () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      });

      // ESC: Close modals/dialogs
      this.register('escape', () => {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
          const closeBtn = openModal.querySelector('[data-bs-dismiss="modal"]');
          if (closeBtn) closeBtn.click();
        }
      });

      // Ctrl+/: Show keyboard shortcuts help
      this.register('ctrl+/', () => {
        this.showShortcutsHelp();
      });
    },

    showShortcutsHelp() {
      const shortcuts = [
        { key: 'Ctrl+K', description: 'Focus search' },
        { key: 'Esc', description: 'Close modal/dialog' },
        { key: 'Ctrl+/', description: 'Show this help' }
      ];

      const html = `
        <div class="p-3">
          <h6 class="mb-3"><i class="bi bi-keyboard me-2"></i>Keyboard Shortcuts</h6>
          <div class="space-y-sm">
            ${shortcuts.map(s => `
              <div class="shortcut-hint">
                <span>${s.description}</span>
                <kbd>${s.key}</kbd>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      if (window.UIToast) {
        window.UIToast.info(html, { duration: 5000 });
      }
    }
  };

  /* =========================================================================
     LOADING STATE MANAGEMENT
     ========================================================================= */

  const LoadingStates = {
    show(element, type = 'spinner') {
      if (!element) return;

      // Add loading class to buttons
      if (element.tagName === 'BUTTON') {
        element.classList.add('is-loading');
        element.disabled = true;
        return;
      }

      // Add overlay for containers
      const overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = type === 'spinner' 
        ? '<div class="spinner"></div>'
        : this.createSkeleton(element);
      
      element.style.position = 'relative';
      element.appendChild(overlay);
    },

    hide(element) {
      if (!element) return;

      // Remove loading class from buttons
      if (element.tagName === 'BUTTON') {
        element.classList.remove('is-loading');
        element.disabled = false;
        return;
      }

      // Remove overlay
      const overlay = element.querySelector('.loading-overlay');
      if (overlay) {
        overlay.remove();
      }
    },

    createSkeleton(container) {
      // Create skeleton based on content type
      const isTable = container.querySelector('table');
      if (isTable) {
        return this.createTableSkeleton();
      }

      return '<div class="spinner"></div>';
    },

    createTableSkeleton() {
      return `
        <div class="p-4">
          ${Array(5).fill(0).map(() => `
            <div class="skeleton skeleton-text mb-2"></div>
          `).join('')}
        </div>
      `;
    }
  };

  /* =========================================================================
     FORM VALIDATION ENHANCEMENTS
     ========================================================================= */

  const FormValidation = {
    init() {
      // Add live validation to forms with data-validate attribute
      document.querySelectorAll('form[data-validate]').forEach(form => {
        this.enhanceForm(form);
      });

      // Add validation to all inputs with validation attributes
      document.querySelectorAll('input[required], input[pattern], input[minlength], input[maxlength]').forEach(input => {
        this.addLiveValidation(input);
      });
    },

    enhanceForm(form) {
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
          form.classList.add('shake');
          setTimeout(() => form.classList.remove('shake'), 500);
        }
      });
    },

    addLiveValidation(input) {
      let timeout;

      input.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.validateInput(input);
        }, 300);
      });

      input.addEventListener('blur', () => {
        this.validateInput(input);
      });
    },

    validateInput(input) {
      const isValid = input.checkValidity();
      
      input.classList.remove('is-valid', 'is-invalid');
      input.classList.add(isValid ? 'is-valid' : 'is-invalid');

      // Update feedback message
      const feedback = input.parentElement.querySelector('.invalid-feedback');
      if (feedback && !isValid) {
        feedback.textContent = input.validationMessage;
      }

      return isValid;
    },

    validateForm(form) {
      let isValid = true;
      
      form.querySelectorAll('input, select, textarea').forEach(field => {
        if (!this.validateInput(field)) {
          isValid = false;
        }
      });

      return isValid;
    }
  };

  /* =========================================================================
     SEARCH HIGHLIGHTING
     ========================================================================= */

  const SearchHighlight = {
    highlight(text, query) {
      if (!query) return text;
      
      const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
      return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    },

    escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    applyToTable(table, query) {
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let rowMatches = false;

        cells.forEach(cell => {
          const originalText = cell.getAttribute('data-original-text') || cell.textContent;
          if (!cell.hasAttribute('data-original-text')) {
            cell.setAttribute('data-original-text', originalText);
          }

          if (query) {
            const highlighted = this.highlight(originalText, query);
            if (highlighted !== originalText) {
              cell.innerHTML = highlighted;
              rowMatches = true;
            } else {
              cell.textContent = originalText;
            }
          } else {
            cell.textContent = originalText;
            rowMatches = true;
          }
        });

        // Hide rows that don't match
        row.style.display = rowMatches || !query ? '' : 'none';
      });
    }
  };

  /* =========================================================================
     AUTO-SAVE INDICATOR
     ========================================================================= */

  const AutoSave = {
    indicator: null,

    init() {
      // Create indicator element
      this.indicator = document.createElement('div');
      this.indicator.className = 'auto-save-indicator';
      this.indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 8px 16px;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        font-size: var(--text-sm);
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(this.indicator);
    },

    show(message, type = 'saving') {
      const icons = {
        saving: '⏳',
        saved: '✓',
        error: '✗'
      };

      const colors = {
        saving: 'var(--text-muted)',
        saved: 'var(--success)',
        error: 'var(--danger)'
      };

      this.indicator.innerHTML = `${icons[type]} ${message}`;
      this.indicator.style.color = colors[type];
      this.indicator.style.opacity = '1';

      if (type !== 'saving') {
        setTimeout(() => {
          this.indicator.style.opacity = '0';
        }, 2000);
      }
    },

    hide() {
      this.indicator.style.opacity = '0';
    }
  };

  /* =========================================================================
     CONTEXT MENU
     ========================================================================= */

  const ContextMenu = {
    menu: null,

    init() {
      // Create context menu element
      this.menu = document.createElement('div');
      this.menu.className = 'context-menu';
      document.body.appendChild(this.menu);

      // Close on click outside
      document.addEventListener('click', () => this.hide());
      
      // Prevent default context menu on elements with data-context-menu
      document.addEventListener('contextmenu', (e) => {
        const target = e.target.closest('[data-context-menu]');
        if (target) {
          e.preventDefault();
          this.show(e, target);
        }
      });
    },

    show(e, target) {
      const menuId = target.getAttribute('data-context-menu');
      const items = this.getMenuItems(menuId, target);

      this.menu.innerHTML = items.map(item => {
        if (item.divider) {
          return '<div class="context-menu-divider"></div>';
        }
        return `
          <div class="context-menu-item ${item.class || ''}" data-action="${item.action}">
            ${item.icon ? `<i class="bi bi-${item.icon}"></i>` : ''}
            <span>${item.label}</span>
          </div>
        `;
      }).join('');

      // Position menu
      this.menu.style.left = `${e.pageX}px`;
      this.menu.style.top = `${e.pageY}px`;
      this.menu.classList.add('show');

      // Add click handlers
      this.menu.querySelectorAll('[data-action]').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.getAttribute('data-action');
          this.handleAction(action, target);
          this.hide();
        });
      });
    },

    hide() {
      this.menu.classList.remove('show');
    },

    getMenuItems(menuId, target) {
      // Define context menus
      const menus = {
        'table-row': [
          { icon: 'eye', label: 'View Details', action: 'view' },
          { icon: 'pencil', label: 'Edit', action: 'edit' },
          { divider: true },
          { icon: 'trash', label: 'Delete', action: 'delete', class: 'danger' }
        ]
      };

      return menus[menuId] || [];
    },

    handleAction(action, target) {
      // Emit custom event that the app can listen to
      const event = new CustomEvent('contextmenu-action', {
        detail: { action, target }
      });
      document.dispatchEvent(event);
    }
  };

  /* =========================================================================
     EMPTY STATE MANAGEMENT
     ========================================================================= */

  const EmptyStates = {
    show(container, options = {}) {
      const {
        icon = 'inbox',
        title = 'No data available',
        description = '',
        actionLabel = '',
        actionHandler = null
      } = options;

      const html = `
        <div class="empty-state">
          <i class="bi bi-${icon} empty-state-icon"></i>
          <div class="empty-state-title">${title}</div>
          ${description ? `<div class="empty-state-description">${description}</div>` : ''}
          ${actionLabel ? `
            <div class="empty-state-action">
              <button class="btn btn-primary" id="empty-state-action-btn">
                ${actionLabel}
              </button>
            </div>
          ` : ''}
        </div>
      `;

      container.innerHTML = html;

      if (actionHandler) {
        const btn = container.querySelector('#empty-state-action-btn');
        if (btn) btn.addEventListener('click', actionHandler);
      }
    }
  };

  /* =========================================================================
     NOTIFICATION BADGE MANAGER
     ========================================================================= */

  const NotificationBadge = {
    update(element, count) {
      if (!element) return;

      element.classList.add('notification-badge');
      element.setAttribute('data-count', count);
    },

    increment(element) {
      const current = parseInt(element.getAttribute('data-count') || '0');
      this.update(element, current + 1);
    },

    clear(element) {
      this.update(element, 0);
    }
  };

  /* =========================================================================
     TREND INDICATORS
     ========================================================================= */

  const TrendIndicators = {
    create(value, previousValue) {
      const change = value - previousValue;
      const percentChange = previousValue !== 0 
        ? ((change / previousValue) * 100).toFixed(1)
        : 0;

      const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
      const icon = change > 0 ? '↑' : change < 0 ? '↓' : '→';

      return `
        <span class="trend-indicator trend-${direction}">
          ${icon} ${Math.abs(percentChange)}%
        </span>
      `;
    }
  };

  /* =========================================================================
     QUICK ACTIONS MENU
     ========================================================================= */

  const QuickActions = {
    init() {
      // Only show on larger screens
      if (window.innerWidth < 768) return;

      const container = document.createElement('div');
      container.className = 'quick-actions';
      container.innerHTML = `
        <button class="quick-action-btn" id="quick-actions-toggle" title="Quick Actions">
          <i class="bi bi-plus-lg"></i>
        </button>
        <div class="quick-action-menu">
          <!-- Actions will be populated dynamically -->
        </div>
      `;

      document.body.appendChild(container);

      const btn = container.querySelector('#quick-actions-toggle');
      const menu = container.querySelector('.quick-action-menu');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
        btn.querySelector('i').classList.toggle('bi-plus-lg');
        btn.querySelector('i').classList.toggle('bi-x-lg');
      });

      document.addEventListener('click', () => {
        menu.classList.remove('show');
        btn.querySelector('i').classList.add('bi-plus-lg');
        btn.querySelector('i').classList.remove('bi-x-lg');
      });
    }
  };

  /* =========================================================================
     PUBLIC API
     ========================================================================= */

  window.UIEnhancements = {
    // Loading states
    showLoading: (element) => LoadingStates.show(element),
    hideLoading: (element) => LoadingStates.hide(element),

    // Empty states
    showEmpty: (container, options) => EmptyStates.show(container, options),

    // Search highlighting
    highlightSearch: (table, query) => SearchHighlight.applyToTable(table, query),

    // Notifications
    updateBadge: (element, count) => NotificationBadge.update(element, count),

    // Trends
    createTrend: (value, previous) => TrendIndicators.create(value, previous),

    // Auto-save
    showSaving: () => AutoSave.show('Saving...', 'saving'),
    showSaved: () => AutoSave.show('Saved', 'saved'),
    showSaveError: () => AutoSave.show('Error saving', 'error'),

    // Form validation
    validateForm: (form) => FormValidation.validateForm(form),
    validateInput: (input) => FormValidation.validateInput(input)
  };

  /* =========================================================================
     REDUCED MOTION OVERRIDE (Optional)
     ========================================================================= */
  const ReducedMotion = {
    media: window.matchMedia('(prefers-reduced-motion: reduce)'),
    isReduced() { return this.media.matches; },
    force(enable = true) {
      document.documentElement.classList.toggle('force-animate', !!enable);
      localStorage.setItem('forceAnimate', enable ? '1' : '0');
    },
    init() {
      // Reapply saved preference
      if (localStorage.getItem('forceAnimate') === '1') {
        this.force(true);
      }
      // Listen for system changes; if user opted in, keep override
      if (this.media.addEventListener) {
        this.media.addEventListener('change', () => {
          if (localStorage.getItem('forceAnimate') === '1') {
            this.force(true);
          }
        });
      } else if (this.media.addListener) { // Older browsers
        this.media.addListener(() => {
          if (localStorage.getItem('forceAnimate') === '1') {
            this.force(true);
          }
        });
      }
    }
  };

  // Expose a tiny API for toggling animations even if OS prefers reduced motion
  window.UIEnhancements.forceAnimations = (enable = true) => ReducedMotion.force(enable);
  window.UIEnhancements.isReducedMotion = () => ReducedMotion.isReduced();

  /* =========================================================================
     INITIALIZATION
     ========================================================================= */

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        TableSort.init();
        KeyboardShortcuts.init();
        FormValidation.init();
        AutoSave.init();
        ContextMenu.init();
        QuickActions.init();
        ReducedMotion.init();
      });
    } else {
      TableSort.init();
      KeyboardShortcuts.init();
      FormValidation.init();
      AutoSave.init();
      ContextMenu.init();
      QuickActions.init();
      ReducedMotion.init();
    }
  }

  init();

})();
