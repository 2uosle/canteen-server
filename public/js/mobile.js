/**
 * NEUTap Mobile Interactions
 * 
 * Handles mobile-specific features:
 * - Touch gestures
 * - Pull to refresh
 * - Swipe actions
 * - Mobile navigation
 * - Bottom sheets
 */

(function() {
  'use strict';

  /* =========================================================================
     MOBILE DETECTION
     ========================================================================= */

  const MobileDetect = {
    isMobile() {
      return window.innerWidth <= 768;
    },

    isTouch() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    isIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    },

    isAndroid() {
      return /Android/.test(navigator.userAgent);
    },

    getOrientation() {
      return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
  };

  /* =========================================================================
     PULL TO REFRESH
     ========================================================================= */

  const PullToRefresh = {
    enabled: false,
    threshold: 80,
    startY: 0,
    pulling: false,
    indicator: null,

    init(onRefresh) {
      if (!MobileDetect.isMobile() || !MobileDetect.isTouch()) return;

      this.onRefresh = onRefresh;
      this.createIndicator();
      this.attachListeners();
      this.enabled = true;
    },

    createIndicator() {
      this.indicator = document.createElement('div');
      this.indicator.className = 'pull-to-refresh';
      this.indicator.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Pull to refresh';
      document.body.appendChild(this.indicator);
    },

    attachListeners() {
      let scrollContainer = document.querySelector('main') || document.body;

      scrollContainer.addEventListener('touchstart', (e) => {
        if (scrollContainer.scrollTop === 0) {
          this.startY = e.touches[0].pageY;
          this.pulling = true;
        }
      });

      scrollContainer.addEventListener('touchmove', (e) => {
        if (!this.pulling) return;

        const currentY = e.touches[0].pageY;
        const distance = currentY - this.startY;

        if (distance > 0 && distance < this.threshold * 2) {
          if (distance > this.threshold) {
            this.indicator.classList.add('active');
          } else {
            this.indicator.classList.remove('active');
          }
        }
      });

      scrollContainer.addEventListener('touchend', (e) => {
        if (!this.pulling) return;

        const currentY = e.changedTouches[0].pageY;
        const distance = currentY - this.startY;

        if (distance > this.threshold) {
          this.refresh();
        }

        this.pulling = false;
        this.indicator.classList.remove('active');
      });
    },

    refresh() {
      if (this.onRefresh && typeof this.onRefresh === 'function') {
        this.indicator.innerHTML = '<i class="bi bi-arrow-clockwise rotating"></i> Refreshing...';
        
        Promise.resolve(this.onRefresh()).then(() => {
          this.indicator.innerHTML = '<i class="bi bi-check-circle"></i> Updated';
          setTimeout(() => {
            this.indicator.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Pull to refresh';
          }, 1000);
        });
      }
    }
  };

  /* =========================================================================
     SWIPE GESTURES
     ========================================================================= */

  const SwipeGesture = {
    init(element, callbacks = {}) {
      if (!element || !MobileDetect.isTouch()) return;

      let startX = 0;
      let startY = 0;
      let startTime = 0;
      const threshold = 50;
      const maxTime = 300;

      element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX;
        startY = e.touches[0].pageY;
        startTime = Date.now();
        element.classList.add('swipeable');
      });

      element.addEventListener('touchmove', (e) => {
        element.classList.add('swiping');
      });

      element.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].pageX;
        const endY = e.changedTouches[0].pageY;
        const endTime = Date.now();

        const diffX = endX - startX;
        const diffY = endY - startY;
        const diffTime = endTime - startTime;

        element.classList.remove('swipeable', 'swiping');

        if (diffTime > maxTime) return;

        const isSwipe = Math.abs(diffX) > threshold || Math.abs(diffY) > threshold;
        if (!isSwipe) return;

        if (Math.abs(diffX) > Math.abs(diffY)) {
          // Horizontal swipe
          if (diffX > 0 && callbacks.onSwipeRight) {
            callbacks.onSwipeRight(element);
          } else if (diffX < 0 && callbacks.onSwipeLeft) {
            callbacks.onSwipeLeft(element);
          }
        } else {
          // Vertical swipe
          if (diffY > 0 && callbacks.onSwipeDown) {
            callbacks.onSwipeDown(element);
          } else if (diffY < 0 && callbacks.onSwipeUp) {
            callbacks.onSwipeUp(element);
          }
        }
      });
    }
  };

  /* =========================================================================
     BOTTOM SHEET
     ========================================================================= */

  const BottomSheet = {
    create(content, options = {}) {
      const {
        title = '',
        showHandle = true,
        dismissible = true,
        onDismiss = null
      } = options;

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      
      const sheet = document.createElement('div');
      sheet.className = 'modal modal-bottom-sheet fade show';
      sheet.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            ${title ? `
              <div class="modal-header">
                ${showHandle ? '<div class="bottom-sheet-handle"></div>' : ''}
                <h5 class="modal-title">${title}</h5>
                ${dismissible ? '<button type="button" class="btn-close" data-dismiss="sheet"></button>' : ''}
              </div>
            ` : showHandle ? '<div class="modal-header"><div class="bottom-sheet-handle"></div></div>' : ''}
            <div class="modal-body">
              ${content}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(sheet);

      // Add dismiss functionality
      if (dismissible) {
        const dismiss = () => {
          sheet.classList.remove('show');
          backdrop.classList.remove('show');
          setTimeout(() => {
            sheet.remove();
            backdrop.remove();
            if (onDismiss) onDismiss();
          }, 300);
        };

        sheet.querySelector('[data-dismiss="sheet"]')?.addEventListener('click', dismiss);
        backdrop.addEventListener('click', dismiss);

        // Swipe down to dismiss
        SwipeGesture.init(sheet.querySelector('.modal-content'), {
          onSwipeDown: dismiss
        });
      }

      return {
        dismiss() {
          sheet.classList.remove('show');
          backdrop.classList.remove('show');
          setTimeout(() => {
            sheet.remove();
            backdrop.remove();
          }, 300);
        }
      };
    }
  };

  /* =========================================================================
     MOBILE ACTION SHEET
     ========================================================================= */

  const ActionSheet = {
    show(actions, options = {}) {
      const {
        title = '',
        cancelText = 'Cancel'
      } = options;

      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      
      const sheet = document.createElement('div');
      sheet.className = 'mobile-action-sheet';
      
      let html = '';
      if (title) {
        html += `<h6 class="mb-3">${title}</h6>`;
      }

      actions.forEach(action => {
        const variant = action.destructive ? 'text-danger' : '';
        html += `
          <button class="mobile-action-sheet-item ${variant}" data-action="${action.id || ''}">
            ${action.icon ? `<i class="bi bi-${action.icon}"></i>` : ''}
            <span>${action.label}</span>
          </button>
        `;
      });

      if (cancelText) {
        html += `
          <button class="mobile-action-sheet-item" data-action="cancel">
            <i class="bi bi-x-circle"></i>
            <span>${cancelText}</span>
          </button>
        `;
      }

      sheet.innerHTML = html;

      document.body.appendChild(backdrop);
      document.body.appendChild(sheet);

      setTimeout(() => sheet.classList.add('show'), 10);

      const dismiss = () => {
        sheet.classList.remove('show');
        backdrop.classList.remove('show');
        setTimeout(() => {
          sheet.remove();
          backdrop.remove();
        }, 300);
      };

      sheet.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const actionId = btn.dataset.action;
          const action = actions.find(a => a.id === actionId);
          
          if (action && action.handler) {
            action.handler();
          }
          
          dismiss();
        });
      });

      backdrop.addEventListener('click', dismiss);
    }
  };

  /* =========================================================================
     HAPTIC FEEDBACK
     ========================================================================= */

  const Haptic = {
    light() {
      if (window.navigator.vibrate) {
        window.navigator.vibrate(10);
      }
    },

    medium() {
      if (window.navigator.vibrate) {
        window.navigator.vibrate(20);
      }
    },

    heavy() {
      if (window.navigator.vibrate) {
        window.navigator.vibrate(30);
      }
    },

    success() {
      if (window.navigator.vibrate) {
        window.navigator.vibrate([10, 50, 10]);
      }
    },

    error() {
      if (window.navigator.vibrate) {
        window.navigator.vibrate([20, 50, 20, 50, 20]);
      }
    }
  };

  /* =========================================================================
     MOBILE KEYBOARD HANDLING
     ========================================================================= */

  const KeyboardHandler = {
    init() {
      if (!MobileDetect.isMobile()) return;

      // Prevent viewport resize on keyboard show
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const originalContent = viewport.content;
        
        document.addEventListener('focusin', (e) => {
          if (e.target.matches('input, textarea, select')) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
          }
        });

        document.addEventListener('focusout', () => {
          viewport.content = originalContent;
        });
      }

      // Scroll input into view
      document.addEventListener('focusin', (e) => {
        if (e.target.matches('input, textarea')) {
          setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      });
    }
  };

  /* =========================================================================
     MOBILE OPTIMIZATIONS
     ========================================================================= */

  const MobileOptimizations = {
    init() {
      if (!MobileDetect.isMobile()) return;

      // Add mobile class to body
      document.body.classList.add('is-mobile');

      // Add touch class
      if (MobileDetect.isTouch()) {
        document.body.classList.add('is-touch');
      }

      // Add platform classes
      if (MobileDetect.isIOS()) {
        document.body.classList.add('is-ios');
      } else if (MobileDetect.isAndroid()) {
        document.body.classList.add('is-android');
      }

      // Handle orientation changes
      window.addEventListener('orientationchange', () => {
        document.body.classList.toggle('is-landscape', MobileDetect.getOrientation() === 'landscape');
      });

      // Prevent double-tap zoom on buttons
      document.addEventListener('touchend', (e) => {
        if (e.target.matches('button, .btn, a')) {
          e.preventDefault();
          e.target.click();
        }
      }, { passive: false });

      // Initialize keyboard handling
      KeyboardHandler.init();
    }
  };

  /* =========================================================================
     PUBLIC API
     ========================================================================= */

  window.Mobile = {
    detect: MobileDetect,
    pullToRefresh: (callback) => PullToRefresh.init(callback),
    swipe: (element, callbacks) => SwipeGesture.init(element, callbacks),
    bottomSheet: (content, options) => BottomSheet.create(content, options),
    actionSheet: (actions, options) => ActionSheet.show(actions, options),
    haptic: Haptic
  };

  /* =========================================================================
     AUTO INITIALIZATION
     ========================================================================= */

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        MobileOptimizations.init();
      });
    } else {
      MobileOptimizations.init();
    }
  }

  init();

  // Add CSS for rotating animation
  if (MobileDetect.isMobile()) {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .rotating {
        animation: rotate 1s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }

})();
