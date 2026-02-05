// Polyfill escapeHtml if not present (ensures global availability)
if (typeof window.escapeHtml !== 'function') {
  window.escapeHtml = function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };
}

// Token expiration checker
function isTokenExpired() {
  const token = localStorage.getItem('token');
  if (!token) return true;
  
  try {
    // Decode JWT payload (2nd part of token)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const isExpired = now >= exp;
    
    if (isExpired) {
      console.warn('[Auth] Token expired at', new Date(exp));
    }
    
    return isExpired;
  } catch (e) {
    console.error('[Auth] Failed to decode token:', e);
    return true;
  }
}

// Check token validity on page load
if (isTokenExpired()) {
  console.warn('[Auth] Token expired, clearing session');
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  // Redirect to login if not already there
  if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
    window.location.href = '/';
  }
}

/* Theme */
    const root = document.documentElement;
    const themeKey = 'canteen_theme';
  // Chart instances (must be declared before any function uses them)
  let spendingChartInstance = null;
  let reloadsChartInstance = null;

  // Create debounced version of refreshChartStyles for better performance
  const debouncedRefreshChartStyles = debounce(function refreshChartStylesImpl() {
    const ch = window._reloadChartInstance;
    if (ch) {
      const theme = getThemeColors();
      ch.options.scales.x.ticks.color = theme.text;
      ch.options.scales.y.ticks.color = theme.text;
      ch.options.scales.x.grid.color = theme.border;
      ch.options.scales.y.grid.color = theme.border;
      ch.options.plugins.tooltip.backgroundColor = theme.surface2;
      ch.options.plugins.tooltip.titleColor = theme.text;
      ch.options.plugins.tooltip.bodyColor = theme.text;
      ch.options.plugins.tooltip.borderColor = theme.border;
      ch.data.datasets[0].borderColor = theme.accent2;

      const canvas = ch.canvas;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
      gradient.addColorStop(0, hexToRgba(theme.accent2, 0.25));
      gradient.addColorStop(1, hexToRgba(theme.accent2, 0.05));
      ch.data.datasets[0].backgroundColor = gradient;
      ch.update();
    }

    // Update sales chart
    const ch2 = window._salesChartInstance;
    if (ch2) {
      const theme = getThemeColors();
      const isDark = document.documentElement.classList.contains('theme-dark');
      const textColor = isDark ? '#ffffff' : '#1a1a1a';
      const gridColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
      
      ch2.options.scales.x.ticks.color = textColor;
      ch2.options.scales.y.ticks.color = textColor;
      ch2.options.scales.x.grid.color = gridColor;
      ch2.options.scales.y.grid.color = gridColor;
      ch2.options.plugins.tooltip.backgroundColor = theme.surface2;
      ch2.options.plugins.tooltip.titleColor = textColor;
      ch2.options.plugins.tooltip.bodyColor = textColor;
      ch2.options.plugins.tooltip.borderColor = gridColor;
      ch2.data.datasets[0].borderColor = theme.danger;

      const canvas2 = ch2.canvas;
      const ctx2 = canvas2.getContext('2d');
      const gradient2 = ctx2.createLinearGradient(0,0,0,canvas2.height);
      gradient2.addColorStop(0, hexToRgba(theme.danger, 0.25));
      gradient2.addColorStop(1, hexToRgba(theme.danger, 0.05));
      ch2.data.datasets[0].backgroundColor = gradient2;
      ch2.update();
    }

    // Update spending pattern chart
    if (spendingChartInstance) {
      const theme = getThemeColors();
      spendingChartInstance.options.scales.x.ticks.color = theme.text;
      spendingChartInstance.options.scales.y.ticks.color = theme.text;
      spendingChartInstance.options.scales.x.grid.color = theme.border;
      spendingChartInstance.options.scales.y.grid.color = theme.border;
      spendingChartInstance.options.plugins.tooltip.backgroundColor = theme.surface2;
      spendingChartInstance.options.plugins.tooltip.titleColor = theme.text;
      spendingChartInstance.options.plugins.tooltip.bodyColor = theme.text;
      spendingChartInstance.options.plugins.tooltip.borderColor = theme.border;
      spendingChartInstance.data.datasets[0].borderColor = theme.accent;
      spendingChartInstance.data.datasets[0].backgroundColor = hexToRgba(theme.accent, 0.2);
      spendingChartInstance.update();
    }

    // Update reloads trend chart
    if (reloadsChartInstance) {
      const theme = getThemeColors();
      reloadsChartInstance.options.scales.x.ticks.color = theme.text;
      reloadsChartInstance.options.scales.y.ticks.color = theme.text;
      reloadsChartInstance.options.scales.x.grid.color = theme.border;
      reloadsChartInstance.options.scales.y.grid.color = theme.border;
      reloadsChartInstance.options.plugins.tooltip.backgroundColor = theme.surface2;
      reloadsChartInstance.options.plugins.tooltip.titleColor = theme.text;
      reloadsChartInstance.options.plugins.tooltip.bodyColor = theme.text;
      reloadsChartInstance.options.plugins.tooltip.borderColor = theme.border;
      reloadsChartInstance.data.datasets[0].borderColor = theme.success;
      reloadsChartInstance.data.datasets[0].backgroundColor = hexToRgba(theme.success, 0.2);
      reloadsChartInstance.update();
    }

    // Update admin vendor sales chart
    if (window._adminVendorSalesChart) {
      const isDark = document.documentElement.classList.contains('theme-dark');
      const textColor = isDark ? '#ffffff' : '#1a1a1a';
      const gridColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
      
      window._adminVendorSalesChart.options.scales.x.ticks.color = textColor;
      window._adminVendorSalesChart.options.scales.y.ticks.color = textColor;
      window._adminVendorSalesChart.options.scales.x.grid.color = gridColor;
      window._adminVendorSalesChart.options.scales.y.grid.color = gridColor;
      window._adminVendorSalesChart.update();
    }

    // Update admin reload trends chart
    if (window._adminReloadTrendsChart) {
      const isDark = document.documentElement.classList.contains('theme-dark');
      const textColor = isDark ? '#ffffff' : '#1a1a1a';
      const gridColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
      
      window._adminReloadTrendsChart.options.scales.x.ticks.color = textColor;
      window._adminReloadTrendsChart.options.scales.y.ticks.color = textColor;
      window._adminReloadTrendsChart.options.scales.x.grid.color = gridColor;
      window._adminReloadTrendsChart.options.scales.y.grid.color = gridColor;
      window._adminReloadTrendsChart.update();
    }
  }, 150); // Debounce chart updates by 150ms

  function applyTheme(mode){
      root.classList.remove('theme-dark');
      let effective = mode;
      if (mode === 'dark') root.classList.add('theme-dark');
      if (mode === 'system'){
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('theme-dark', prefersDark);
        effective = prefersDark ? 'dark' : 'light';
      }
      // Keep Bootstrap components in sync with our theme
      root.setAttribute('data-bs-theme', effective === 'dark' ? 'dark' : 'light');

      localStorage.setItem(themeKey, mode);
      
      // Update theme dropdown button if it exists
      const themeIcon = document.getElementById('themeIcon');
      const themeLabel = document.getElementById('themeLabel');
      if (themeIcon && themeLabel) {
        if (mode === 'system') {
          themeIcon.className = 'bi bi-circle-half me-1';
          themeLabel.textContent = 'System';
        } else if (mode === 'light') {
          themeIcon.className = 'bi bi-sun me-1';
          themeLabel.textContent = 'Light';
        } else if (mode === 'dark') {
          themeIcon.className = 'bi bi-moon me-1';
          themeLabel.textContent = 'Dark';
        }
      }
      
      debouncedRefreshChartStyles();
    }
    function initTheme(){
      const saved = localStorage.getItem(themeKey) || 'system';
      applyTheme(saved);
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', e=>{
        if ((localStorage.getItem(themeKey) || 'system') === 'system'){
          applyTheme('system');
        }
      });
    }
    
    // Initialize theme when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTheme);
    } else {
      initTheme();
    }
    
    // Expose applyTheme globally for ui.js integration
    window.applyTheme = applyTheme;
    
    // Expose changeTheme globally for HTML onclick handlers
    window.changeTheme = function(theme) {
      applyTheme(theme);
    };
    
    /* Login form - Press Enter to submit */
    document.addEventListener('DOMContentLoaded', () => {
      const loginName = $('loginName');
      const loginPass = $('loginPass');
      
      if (loginName) {
        loginName.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            login();
          }
        });
      }
      
      if (loginPass) {
        loginPass.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            login();
          }
        });
      }
    });

    /* ==========================================
       SOUND SYSTEM
       ========================================== */
    const SoundEffects = {
      enabled: localStorage.getItem('soundEnabled') !== 'false', // Enabled by default
      
      // Sound effect URLs (using Web Audio API with generated tones)
      sounds: {},
      
      // Initialize audio context
      audioContext: null,
      
      init() {
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
      },
      
      // Play a beep tone
      playTone(frequency, duration, type = 'sine') {
        if (!this.enabled) return;
        
        try {
          this.init();
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = type;
          
          gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
          
          oscillator.start(this.audioContext.currentTime);
          oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
          console.warn('Sound playback failed:', e);
        }
      },
      
      // Predefined sound effects
      success() {
        // Happy ascending tone
        this.playTone(523.25, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 0.1), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.15), 200); // G5
      },
      
      error() {
        // Descending warning tone
        this.playTone(392.00, 0.15); // G4
        setTimeout(() => this.playTone(329.63, 0.25), 150); // E4
      },
      
      tap() {
        // Quick blip for card tap
        this.playTone(880, 0.08); // A5
      },
      
      click() {
        // Subtle click
        this.playTone(1000, 0.05);
      },
      
      complete() {
        // Transaction complete (triumph sound)
        this.playTone(523.25, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 0.1), 80); // E5
        setTimeout(() => this.playTone(783.99, 0.1), 160); // G5
        setTimeout(() => this.playTone(1046.50, 0.2), 240); // C6
      },
      
      notify() {
        // Gentle notification
        this.playTone(659.25, 0.1); // E5
        setTimeout(() => this.playTone(783.99, 0.1), 100); // G5
      },
      
      warning() {
        // Double beep warning
        this.playTone(440, 0.1); // A4
        setTimeout(() => this.playTone(440, 0.1), 150);
      },
      
      toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        if (this.enabled) {
          this.success(); // Play a sound to confirm enabled
        }
        return this.enabled;
      }
    };
    
    // Initialize on page load
    SoundEffects.init();

    /* Helpers */
    // Dynamic API_BASE - works on localhost and network devices
    const API_BASE = window.location.origin;
    let token = null, userRole = null, pendingCheckInterval = null, pendingSaleId = null;
    let studentProfile = null; // filled when opening Settings (student)

    // Helper functions are now in utils.js ($, show, hide, fmtMoney, httpGet, etc.)

    // Read error text/json safely from a failed fetch Response
    async function safeReadError(res) {
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const j = await res.json();
          return j?.error || j?.message || JSON.stringify(j);
        }
        return await res.text();
      } catch {
        return '';
      }
    }

    // Toast deduplication system
    const recentToasts = new Map(); // Track recent toasts to prevent duplicates
    const TOAST_DEDUPE_WINDOW = 2000; // 2 seconds window for deduplication
    
    function toast(message, type="info"){
      // Generate a unique key for this toast message
      const toastKey = `${type}:${message}`;
      const now = Date.now();
      
      // Check if we recently showed this exact toast
      if (recentToasts.has(toastKey)) {
        const lastShown = recentToasts.get(toastKey);
        if (now - lastShown < TOAST_DEDUPE_WINDOW) {
          console.log('[Toast] Prevented duplicate:', message);
          return; // Skip duplicate toast
        }
      }
      
      // Record this toast
      recentToasts.set(toastKey, now);
      
      // Clean up old entries (older than dedupe window)
      for (const [key, timestamp] of recentToasts.entries()) {
        if (now - timestamp > TOAST_DEDUPE_WINDOW) {
          recentToasts.delete(key);
        }
      }
      
      // Play sound based on type
      if (type === "success") SoundEffects.success();
      else if (type === "error") SoundEffects.error();
      else if (type === "warn" || type === "warning") SoundEffects.warning();
      else SoundEffects.notify();
      
      const id = "t" + Math.random().toString(36).slice(2);
      const colors = { info:"primary", success:"success", error:"danger", warn:"warning", warning:"warning" };
      const icon   = { info:"info-circle", success:"check-circle", error:"exclamation-octagon", warn:"exclamation-triangle", warning:"exclamation-triangle" }[type] || "info-circle";
      const node = document.createElement("div");
      node.id = id;
      node.className = `toast align-items-center text-bg-${colors[type]||"primary"} border-0 show`;
      node.role = "alert"; node.ariaLive = "assertive"; node.ariaAtomic = "true";
      node.style.minWidth="280px";
      node.innerHTML = `
        <div class="d-flex">
          <div class="toast-body"><i class="bi bi-${icon} me-2"></i>${message}</div>
          <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>`;
      $("toastRegion").appendChild(node);
      setTimeout(()=> node.remove(), 3500);
    }
    // fmtMoney is now in utils.js
    const fmtTime  = s => new Date(s).toLocaleString();
    function setAlert(elId, msg, status="info"){
      const el = $(elId);
      el.className = `alert alert-${status} mt-3`;
      el.textContent = msg;
      show(el);
      if (status !== 'danger') setTimeout(()=>hide(el), 3500);
    }

    /* Auth */
    async function login(){
      const username = $("loginName").value.trim();
      const password = $("loginPass").value;
      $("loginAlert").classList.add('d-none');
      
      // Prevent multiple submissions
      if (login.isSubmitting) return;
      login.isSubmitting = true;

      try {
        const res = await fetch(API_BASE + "/login", {
          method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.token){
          SoundEffects.success(); // Login success sound
          token = data.token; userRole = data.role;
          localStorage.setItem("token", token);
          localStorage.setItem("role", userRole);
          localStorage.setItem("username", data.username || username);

          hide($("loginStage"));
          show($("dashboard"));
          document.querySelectorAll('.auth-only').forEach(show);
          $("welcomeMsg").textContent = "Welcome, " + (data.username || username) + " (" + userRole + ")";
          $("navUserLabel").textContent = (data.username || username);

          if (userRole === "staff") { 
            show($("staffDashboard")); 
            loadReloads(); 
            initializeDateRangeInputs(); // Initialize date range inputs with last 7 days
            wireStaffReloadTabHandlers();
          }
          else if (userRole === "vendor") { 
            show($("vendorDashboard")); 
            loadMenuItems(); 
            loadSales(); 
            initializeVendorSalesDateRangeInputs(); 
            wireVendorSalesTabHandlers();
          }
          else if (userRole === "canteen_manager") {
            console.log("✓ Canteen Manager login detected");
            console.log("Dashboard element:", $("canteenManagerDashboard"));
            show($("canteenManagerDashboard"));
            loadCanteenMenuItems();
            loadMenuAnalytics();
          }
          else if (userRole === "student") { show($("studentDashboard")); loadMyBalance(); loadMyTransactions(); loadMyReloads(); }
          else if (userRole === "admin") { 
            show($("adminDashboard")); 
            setTimeout(() => {
              initializeDateRangeToToday();
              adminLoadStats();
              adminLoadUsers();
              adminLoadVendorCounters();
            }, 100);
          }

          toast("Login successful", "success");
          
          // Initialize WebSocket for real-time notifications
          if (typeof initWebSocket === 'function') {
            initWebSocket();
          }

          // Initialize Bootstrap tooltips globally
          if (window.bootstrap) {
            document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
              window.bootstrap.Tooltip.getOrCreateInstance(el);
            });
          }
        } else {
          setAlert("loginAlert", data.error || "Login failed", "danger");
        }
      } catch(e){
        setAlert("loginAlert", "Network error during login", "danger");
      } finally {
        login.isSubmitting = false;
      }
    }
    
    // Expose functions globally for onclick handlers
    window.login = login;

// ==================== DATE RANGE PICKER ====================
let dateRangeState = {
  currentMonth: new Date(),
  startDate: null,
  endDate: null,
  tempStartDate: null,
  tempEndDate: null
};

// Initialize with today's date
function initializeDateRangeToToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  dateRangeState.startDate = today;
  dateRangeState.endDate = today;
  dateRangeState.tempStartDate = today;
  dateRangeState.tempEndDate = today;
  
  // Update hidden inputs
  $("adminVendorDateStart").value = formatDateForInput(today);
  $("adminVendorDateEnd").value = formatDateForInput(today);
  
  // Update display text
  updateDateRangeText();
}

function toggleDateRangePicker(e) {
  if (e) e.stopPropagation();
  const picker = $("dateRangePicker");
  if (picker.style.display === "none" || !picker.style.display) {
    picker.style.display = "block";
    // Initialize temp dates with current selection
    dateRangeState.tempStartDate = dateRangeState.startDate;
    dateRangeState.tempEndDate = dateRangeState.endDate;
    
    // Set current month to start date or today
    if (dateRangeState.startDate) {
      dateRangeState.currentMonth = new Date(dateRangeState.startDate);
    } else {
      dateRangeState.currentMonth = new Date();
    }
    renderCalendar();
    
    // Close picker when clicking outside
    setTimeout(() => {
      document.addEventListener('click', closeDatePickerOnClickOutside);
    }, 0);
  } else {
    picker.style.display = "none";
    document.removeEventListener('click', closeDatePickerOnClickOutside);
  }
}

function closeDatePickerOnClickOutside(e) {
  const picker = $("dateRangePicker");
  const wrapper = document.querySelector('.date-range-picker-wrapper');
  if (!wrapper.contains(e.target)) {
    picker.style.display = "none";
    document.removeEventListener('click', closeDatePickerOnClickOutside);
  }
}

function changeMonth(direction) {
  event.stopPropagation();
  dateRangeState.currentMonth = new Date(
    dateRangeState.currentMonth.getFullYear(),
    dateRangeState.currentMonth.getMonth() + direction,
    1
  );
  renderCalendar();
}

function renderCalendar() {
  const { currentMonth, tempStartDate, tempEndDate } = dateRangeState;
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  // Update month/year display
  $("currentMonthYear").textContent = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const daysContainer = $("calendarDays");
  daysContainer.innerHTML = "";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "day empty";
    daysContainer.appendChild(emptyDay);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    
    const dayEl = document.createElement("div");
    dayEl.className = "day";
    dayEl.textContent = day;
    
    // Check if it's today
    if (date.getTime() === today.getTime()) {
      dayEl.classList.add("today");
    }
    
    // Check if disabled (future dates)
    if (date > today) {
      dayEl.classList.add("disabled");
    } else {
      // Check selection state
      if (tempStartDate && date.getTime() === tempStartDate.getTime()) {
        dayEl.classList.add("start-date", "selected");
      }
      if (tempEndDate && date.getTime() === tempEndDate.getTime()) {
        dayEl.classList.add("end-date", "selected");
      }
      if (tempStartDate && tempEndDate && 
          date > tempStartDate && date < tempEndDate) {
        dayEl.classList.add("in-range");
      }
      
      dayEl.onclick = () => selectDate(date, dayEl);
    }
    
    daysContainer.appendChild(dayEl);
  }
}

function selectDate(date, element) {
  event.stopPropagation(); // Prevent calendar from closing
  
  const { tempStartDate, tempEndDate } = dateRangeState;
  
  // If clicking on already selected start date, clear selection
  if (tempStartDate && date.getTime() === tempStartDate.getTime()) {
    dateRangeState.tempStartDate = null;
    dateRangeState.tempEndDate = null;
  }
  // If no start date or clicking before start date, set as start
  else if (!tempStartDate || date < tempStartDate) {
    dateRangeState.tempStartDate = date;
    dateRangeState.tempEndDate = null;
  }
  // If start date exists but no end date, set as end
  else if (tempStartDate && !tempEndDate) {
    dateRangeState.tempEndDate = date;
  }
  // If both dates exist, start new selection
  else {
    dateRangeState.tempStartDate = date;
    dateRangeState.tempEndDate = null;
  }
  
  renderCalendar();
}

function applyDateRange() {
  event.stopPropagation();
  const { tempStartDate, tempEndDate } = dateRangeState;
  
  if (!tempStartDate) {
    toast("Please select a start date", "warn");
    return;
  }
  
  // Apply selection
  dateRangeState.startDate = tempStartDate;
  dateRangeState.endDate = tempEndDate || tempStartDate;
  
  // Update hidden inputs
  $("adminVendorDateStart").value = formatDateForInput(dateRangeState.startDate);
  $("adminVendorDateEnd").value = formatDateForInput(dateRangeState.endDate);
  
  // Update display text
  updateDateRangeText();
  
  // Close picker
  $("dateRangePicker").style.display = "none";
  document.removeEventListener('click', closeDatePickerOnClickOutside);
  
  // Auto-refresh data
  adminLoadVendorStats();
}

function cancelDateRange() {
  event.stopPropagation();
  // Restore previous selection
  dateRangeState.tempStartDate = dateRangeState.startDate;
  dateRangeState.tempEndDate = dateRangeState.endDate;
  
  // Close picker
  $("dateRangePicker").style.display = "none";
  document.removeEventListener('click', closeDatePickerOnClickOutside);
}

function updateDateRangeText() {
  const { startDate, endDate } = dateRangeState;
  const textEl = $("dateRangeText");
  
  if (!startDate) {
    textEl.textContent = "Select date range";
    return;
  }
  
  const formatOptions = { month: 'short', day: 'numeric' };
  const startStr = startDate.toLocaleDateString('en-US', formatOptions);
  
  if (!endDate || endDate.getTime() === startDate.getTime()) {
    textEl.textContent = startStr;
  } else {
    const endStr = endDate.toLocaleDateString('en-US', formatOptions);
    
  // Format as "Oct 20 – Oct 28" (with en dash)
    if (startDate.getMonth() === endDate.getMonth()) {
  // Same month: "Oct 20 – 28"
  const endDay = endDate.getDate();
  textEl.textContent = `${startStr} – ${endDay}`;
    } else {
  // Different months: "Oct 20 – Nov 5"
  textEl.textContent = `${startStr} – ${endStr}`;
    }
  }
}

function formatDateForInput(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==================== ADMIN VENDOR PERFORMANCE DASHBOARD ====================
function togglePerformanceDashboard() {
  const dashboard = $("vendorPerformanceDashboard");
  const chevron = $("dashboardChevron");
  
  if (dashboard.style.display === "none" || !dashboard.style.display) {
    // Show dashboard with animation
    dashboard.style.display = "block";
    setTimeout(() => {
      dashboard.style.opacity = "1";
      dashboard.style.transform = "translateY(0)";
    }, 10);
    
    // Rotate chevron
    if (chevron) {
      chevron.style.transform = "rotate(180deg)";
    }
    
    // Initialize to today's date if not set
    const startInput = $("adminVendorDateStart");
    const endInput = $("adminVendorDateEnd");
    if (!startInput.value || !endInput.value) {
      initializeDateRangeToToday();
    }
    
    // Load data
    adminLoadVendorStats();
    
    // Scroll to dashboard smoothly
    setTimeout(() => {
      dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  } else {
    // Hide dashboard
    dashboard.style.opacity = "0";
    dashboard.style.transform = "translateY(-20px)";
    
    // Rotate chevron back
    if (chevron) {
      chevron.style.transform = "rotate(0deg)";
    }
    
    setTimeout(() => {
      dashboard.style.display = "none";
    }, 300);
  }
}

// ==================== ADMIN ANALYTICS INNER TABS ====================
function showAdminAnalyticsSection(which) {
  const vendorIds = ["vendorPerformanceTriggerCard", "adminVendorCounters", "vendorPerformanceDashboard"]; // Removed vendorTransactionsPage & adminVendorTxCard (deprecated)
  const reloadIds = ["reloadPerformanceTriggerCard", "adminReloadPerformanceDashboard"];
  const cancellationIds = ["adminCancellationLogs"];

  // Helper to set display
  function setGroup(ids, show) {
    ids.forEach(id => {
      const el = $(id);
      if (!el) return;
      el.style.display = show ? (el.getAttribute('data-display-original') || (el.tagName === 'DIV' ? 'block' : '')) : 'none';
    });
  }

  // Preserve original display values once
  [...vendorIds, ...reloadIds, ...cancellationIds].forEach(id => {
    const el = $(id);
    if (el && !el.getAttribute('data-display-original') && el.style.display && el.style.display !== 'none') {
      el.setAttribute('data-display-original', el.style.display);
    }
  });

  // Show/hide groups based on selection
  setGroup(vendorIds, which === 'vendor');
  setGroup(reloadIds, which === 'reload');
  setGroup(cancellationIds, which === 'cancellation');

  if (which === 'cancellation') {
    // Initialize date range if not set
    const startHidden = $("adminCancellationDateStart");
    if (startHidden && !startHidden.value) {
      initializeAdminCancellationDateRangeToToday();
    }
    if (typeof adminLoadCancellationLogs === 'function') {
      adminLoadCancellationLogs();
    }
  }

  // If switching to reload and dashboard is hidden internally, trigger its toggle
  if (which === 'reload') {
    const dash = $("adminReloadPerformanceDashboard");
    if (dash && dash.style.display === 'none') {
      // Try to open via existing toggle if available
      if (typeof toggleAdminReloadPerformanceDashboard === 'function') {
        toggleAdminReloadPerformanceDashboard();
      } else {
        dash.style.display = 'block';
      }
    }
  }

  // If switching to vendor and dashboard previously hidden, leave as is until user clicks trigger
  // Update active classes in nav
  const tabsContainer = document.getElementById('adminAnalyticsInnerTabs');
  if (tabsContainer) {
    const buttons = tabsContainer.querySelectorAll('button.nav-link');
    buttons.forEach(btn => btn.classList.remove('active'));
    const whichIndex = which === 'vendor' ? 0 : which === 'reload' ? 1 : 2;
    if (buttons[whichIndex]) buttons[whichIndex].classList.add('active');
  }
  // Auto-load cancellation logs on first switch
  if (which === 'cancellation') {
    adminLoadCancellationLogs();
  }
}

// Expose globally for inline handlers
window.showAdminAnalyticsSection = showAdminAnalyticsSection;

// Initialize default view (vendor only) when Analytics tab is first shown
const _adminStatsTab = document.getElementById('adminStatisticsTab');
if (_adminStatsTab) {
  _adminStatsTab.addEventListener('shown.bs.tab', () => {
    if (!window._adminAnalyticsInit) {
      showAdminAnalyticsSection('vendor');
      window._adminAnalyticsInit = true;
    }
  });
}

// ==================== ADMIN CANCELLATION LOGS ====================
const adminCancellationDateRangeState = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  startDate: null,
  endDate: null
};

function initializeAdminCancellationDateRangeToToday() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  adminCancellationDateRangeState.startDate = today;
  adminCancellationDateRangeState.endDate = today;
  $("adminCancellationDateStart").value = dateStr;
  $("adminCancellationDateEnd").value = dateStr;
  updateAdminCancellationDateRangeText();
}

function toggleAdminCancellationDatePicker(event) {
  event.stopPropagation();
  const picker = $("adminCancellationDateRangePicker");
  const isVisible = picker.style.display === "block";
  if (!isVisible) {
    picker.style.display = "block";
    renderAdminCancellationCalendar();
    document.addEventListener('click', closeAdminCancellationDatePicker);
  } else {
    closeAdminCancellationDatePicker();
  }
}

function closeAdminCancellationDatePicker() {
  const picker = $("adminCancellationDateRangePicker");
  if (picker) picker.style.display = "none";
  document.removeEventListener('click', closeAdminCancellationDatePicker);
}

function changeAdminCancellationMonth(delta) {
  adminCancellationDateRangeState.currentMonth += delta;
  if (adminCancellationDateRangeState.currentMonth > 11) {
    adminCancellationDateRangeState.currentMonth = 0;
    adminCancellationDateRangeState.currentYear++;
  } else if (adminCancellationDateRangeState.currentMonth < 0) {
    adminCancellationDateRangeState.currentMonth = 11;
    adminCancellationDateRangeState.currentYear--;
  }
  renderAdminCancellationCalendar();
}

function renderAdminCancellationCalendar() {
  const monthYear = $("adminCancellationCurrentMonthYear");
  const daysContainer = $("adminCancellationCalendarDays");
  if (!monthYear || !daysContainer) return;
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  monthYear.textContent = `${monthNames[adminCancellationDateRangeState.currentMonth]} ${adminCancellationDateRangeState.currentYear}`;
  const firstDay = new Date(adminCancellationDateRangeState.currentYear, adminCancellationDateRangeState.currentMonth, 1);
  const lastDay = new Date(adminCancellationDateRangeState.currentYear, adminCancellationDateRangeState.currentMonth + 1, 0);
  const prevLastDay = new Date(adminCancellationDateRangeState.currentYear, adminCancellationDateRangeState.currentMonth, 0);
  const firstDayIndex = firstDay.getDay();
  const lastDateNum = lastDay.getDate();
  const prevLastDateNum = prevLastDay.getDate();
  daysContainer.innerHTML = "";
  // Previous month days (non-clickable unless viewing that month logic omitted for simplicity)
  for (let i = firstDayIndex; i > 0; i--) {
    const day = document.createElement('div');
    day.className = 'day other-month disabled';
    day.textContent = prevLastDateNum - i + 1;
    daysContainer.appendChild(day);
  }
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i=1; i<=lastDateNum; i++) {
    const day = document.createElement('div');
    day.className = 'day';
    day.textContent = i;
    const currentDate = new Date(adminCancellationDateRangeState.currentYear, adminCancellationDateRangeState.currentMonth, i);
    currentDate.setHours(0,0,0,0);
    if (currentDate > today) {
      day.classList.add('disabled');
      day.style.visibility = 'hidden';
      daysContainer.appendChild(day);
      continue;
    }
    const startStr = adminCancellationDateRangeState.startDate?.toISOString().split('T')[0];
    const endStr = adminCancellationDateRangeState.endDate?.toISOString().split('T')[0];
    const dateStr = currentDate.toISOString().split('T')[0];
    if (dateStr === startStr) {
      day.classList.add('start-date');
      if (dateStr === endStr) day.classList.add('end-date');
    } else if (dateStr === endStr) {
      day.classList.add('end-date');
    }
    if (adminCancellationDateRangeState.startDate && adminCancellationDateRangeState.endDate) {
      if (currentDate > adminCancellationDateRangeState.startDate && currentDate < adminCancellationDateRangeState.endDate) {
        day.classList.add('in-range');
      }
    }
    day.onclick = (e) => { e.stopPropagation(); selectAdminCancellationDate(currentDate); };
    daysContainer.appendChild(day);
  }
}

function selectAdminCancellationDate(date) {
  if (!adminCancellationDateRangeState.startDate || (adminCancellationDateRangeState.startDate && adminCancellationDateRangeState.endDate)) {
    adminCancellationDateRangeState.startDate = date;
    adminCancellationDateRangeState.endDate = null;
  } else {
    if (date < adminCancellationDateRangeState.startDate) {
      adminCancellationDateRangeState.endDate = adminCancellationDateRangeState.startDate;
      adminCancellationDateRangeState.startDate = date;
    } else {
      adminCancellationDateRangeState.endDate = date;
    }
  }
  renderAdminCancellationCalendar();
}

function applyAdminCancellationDateRange() {
  if (adminCancellationDateRangeState.startDate && adminCancellationDateRangeState.endDate) {
    $("adminCancellationDateStart").value = adminCancellationDateRangeState.startDate.toISOString().split('T')[0];
    $("adminCancellationDateEnd").value = adminCancellationDateRangeState.endDate.toISOString().split('T')[0];
    updateAdminCancellationDateRangeText();
    closeAdminCancellationDatePicker();
    adminLoadCancellationLogs();
  }
}

function cancelAdminCancellationDateRange() { closeAdminCancellationDatePicker(); }

function updateAdminCancellationDateRangeText() {
  const start = adminCancellationDateRangeState.startDate;
  const end = adminCancellationDateRangeState.endDate;
  const el = $("adminCancellationDateRangeText");
  if (!el) return;
  if (!start || !end) { el.textContent = 'Select date range'; return; }
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const startMonth = monthNames[start.getMonth()];
  const endMonth = monthNames[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();
  if (start.toISOString().split('T')[0] === end.toISOString().split('T')[0]) {
    el.textContent = `${startMonth} ${startDay}`;
  } else if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    el.textContent = `${startMonth} ${startDay} - ${endDay}`;
  } else {
    el.textContent = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}

// Data + pagination state
let _adminCancellationLogs = [];
let _adminCancellationPage = 1;
const ADMIN_CANCELLATION_PAGE_SIZE = 10;

async function adminLoadCancellationLogs() {
  const start = $("adminCancellationDateStart").value;
  const end = $("adminCancellationDateEnd").value;
  // If not initialized, set to today and continue
  if (!start || !end) {
    initializeAdminCancellationDateRangeToToday();
  }
  const finalStart = $("adminCancellationDateStart").value;
  const finalEnd = $("adminCancellationDateEnd").value;
  if (!finalStart || !finalEnd) {
    console.warn('adminLoadCancellationLogs: date range not set');
    return;
  }
  let url = API_BASE + '/admin/cancellation-logs';
  url += `?start=${finalStart}&end=${finalEnd}`;
  try {
    const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token }});
    if (!res.ok) throw new Error('Failed to load cancellation logs');
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn('Unexpected cancellation logs response format');
      _adminCancellationLogs = [];
    } else {
      _adminCancellationLogs = data;
    }
  } catch (e) {
    console.error('adminLoadCancellationLogs error:', e.message);
    // Fallback placeholder (simulate empty or sample data)
    _adminCancellationLogs = [];
  }
  _adminCancellationPage = 1;
  renderAdminCancellationLogs();
}

function renderAdminCancellationLogs() {
  const tbody = $("adminCancellationLogsTbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!_adminCancellationLogs.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-secondary py-4"><i class='bi bi-inbox fs-4 d-block mb-2 opacity-50'></i><div class='small'>No cancellation logs for selected period</div></td></tr>`;
    const pag = $("adminCancellationPagination"); if (pag) pag.style.display = 'none';
    return;
  }
  const startIdx = (_adminCancellationPage - 1) * ADMIN_CANCELLATION_PAGE_SIZE;
  const endIdx = Math.min(startIdx + ADMIN_CANCELLATION_PAGE_SIZE, _adminCancellationLogs.length);
  const pageItems = _adminCancellationLogs.slice(startIdx, endIdx);
  pageItems.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fmtTime(log.cancelled_at || log.timestamp || '')}</td>
      <td>${escapeHtml(log.vendor_name || log.user_name || '—')}</td>
      <td>${escapeHtml(log.item_name || '—')}</td>
      <td>${fmtMoney(log.amount || 0)}</td>
      <td>${escapeHtml(log.cancelled_by || log.vendor_name || '—')}</td>
      <td>${escapeHtml(log.reason || '—')}</td>`;
    tbody.appendChild(tr);
  });
  const pag = $("adminCancellationPagination");
  const info = $("adminCancellationPaginationInfo");
  const prevBtn = $("adminCancellationPrevBtn");
  const nextBtn = $("adminCancellationNextBtn");
  if (pag && info && prevBtn && nextBtn) {
    pag.style.display = 'flex';
    info.textContent = `Showing ${startIdx + 1}-${endIdx} of ${_adminCancellationLogs.length}`;
    prevBtn.disabled = _adminCancellationPage === 1;
    nextBtn.disabled = endIdx >= _adminCancellationLogs.length;
  }
}

function adminCancellationPrev() { if (_adminCancellationPage > 1){ _adminCancellationPage--; renderAdminCancellationLogs(); } }
function adminCancellationNext() { const max = Math.ceil(_adminCancellationLogs.length / ADMIN_CANCELLATION_PAGE_SIZE); if (_adminCancellationPage < max){ _adminCancellationPage++; renderAdminCancellationLogs(); } }

function adminExportCancellationLogs() {
  if (!_adminCancellationLogs.length) { toast('No logs to export', 'warning'); return; }
  let csv = 'Time,User,Item,Amount,Cancelled By,Reason\n';
  _adminCancellationLogs.forEach(l => {
    csv += `"${fmtTime(l.cancelled_at || l.timestamp || '')}","${(l.vendor_name||l.user_name||'').replace(/"/g,'')}","${(l.item_name||'').replace(/"/g,'')}","${(l.amount||0)}","${(l.cancelled_by||l.vendor_name||'').replace(/"/g,'')}","${(l.reason||'').replace(/"/g,'')}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'cancellation_logs.csv';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast('Cancellation logs exported', 'success');
}

// Expose functions globally
window.adminLoadCancellationLogs = adminLoadCancellationLogs;
window.adminExportCancellationLogs = adminExportCancellationLogs;
window.adminCancellationPrev = adminCancellationPrev;
window.adminCancellationNext = adminCancellationNext;
window.toggleAdminCancellationDatePicker = toggleAdminCancellationDatePicker;
window.changeAdminCancellationMonth = changeAdminCancellationMonth;
window.applyAdminCancellationDateRange = applyAdminCancellationDateRange;
window.cancelAdminCancellationDateRange = cancelAdminCancellationDateRange;

// Reload chart view state (for booth staff)
let currentReloadChartView = '7d'; // Default to 7 days

function switchReloadChartView(viewType) {
  currentReloadChartView = viewType;
  
  // Update button states
  const btn24h = $("reloadChart24HBtn");
  const btn7d = $("reloadChart7DBtn");
  
  if (viewType === '24h') {
    btn24h.classList.add('active');
    btn7d.classList.remove('active');
  } else {
    btn24h.classList.remove('active');
    btn7d.classList.add('active');
  }
  
  // Reload data with new view
  loadReloads();
}


function toggleStatisticsDashboard() {
  const dashboard = $("statisticsDashboard");
  const chevron = $("statisticsDashboardChevron");
  
  if (dashboard.style.display === "none" || !dashboard.style.display) {
    // Show dashboard with animation
    dashboard.style.display = "block";
    setTimeout(() => {
      dashboard.style.opacity = "1";
      dashboard.style.transform = "translateY(0)";
    }, 10);
    
    // Rotate chevron
    if (chevron) {
      chevron.style.transform = "rotate(180deg)";
    }
    
    // Scroll to dashboard smoothly
    setTimeout(() => {
      dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  } else {
    // Hide dashboard
    dashboard.style.opacity = "0";
    dashboard.style.transform = "translateY(-20px)";
    
    // Rotate chevron back
    if (chevron) {
      chevron.style.transform = "rotate(0deg)";
    }
    
    setTimeout(() => {
      dashboard.style.display = "none";
    }, 300);
  }
}

// ==================== ADMIN VENDOR STATISTICS ====================
async function adminLoadVendorStats() {
  try {
    const start = $("adminVendorDateStart").value;
    const end = $("adminVendorDateEnd").value;
    
    // If no dates set, initialize to today first
    if (!start || !end) {
      initializeDateRangeToToday();
      // Call again with the initialized values
      return adminLoadVendorStats();
    }
    
    let url = API_BASE + "/admin/vendor-stats";
    if (start && end) url += `?start=${start}&end=${end}`;
    
    console.log('Fetching vendor stats:', url);
    const res = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
    console.log('Response status:', res.status);
    
    const stats = await res.json();
    console.log('Vendor stats data:', stats);
    
    // Render summary cards
    adminRenderVendorSummaryCards(stats);
    
  // Render table
    const tbody = $("adminVendorStatsTbody");
    if (!tbody) return; // Guard: table doesn't exist on vendor-transactions page
    tbody.innerHTML = "";
    
    if (!Array.isArray(stats) || !stats.length) {
      tbody.innerHTML = `<tr>
        <td colspan='4' class='text-center text-secondary py-4'>
          <i class="bi bi-inbox fs-4 d-block mb-2 opacity-50"></i>
          <div class="small">No data available for selected period</div>
        </td>
      </tr>`;
      adminRenderVendorSalesChart([]);
      return;
    }
    
    // Calculate totals for performance percentage
    const totalSales = stats.reduce((sum, v) => sum + (v.totalSales || 0), 0);
    
    // Save map for quick lookup
    window._adminVendorStatsMap = new Map(stats.map(v => [v.user_id, v]));

    stats.forEach(vendor => {
  const items = vendor.items.map(i => `${i.name} (${i.qty})`).join(", ");
      const performance = totalSales > 0 ? ((vendor.totalSales / totalSales) * 100).toFixed(1) : 0;
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="d-flex align-items-center">
            <div class="vendor-avatar me-2">
              <i class="bi bi-shop"></i>
            </div>
            <div>
              <div class="fw-semibold">${vendor.name}</div>
              <div class="small text-muted">${vendor.items.length} items</div>
            </div>
          </div>
        </td>
        <td>
          <div class="fw-semibold text-success">${fmtMoney(vendor.totalSales)}</div>
        </td>
        <td>
          <div class="small text-secondary text-truncate" style="max-width: 520px;" data-bs-toggle="tooltip" title="${items}">${items}</div>
        </td>
        <td class="text-end">
          <div class="d-flex align-items-center justify-content-end gap-2">
            <div class="progress flex-grow-1" style="height: 6px; max-width: 100px;">
              <div class="progress-bar bg-primary" role="progressbar" 
                   style="width: ${performance}%" 
                   aria-valuenow="${performance}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <span class="badge bg-primary">${performance}%</span>
          </div>
        </td>
      `;
      tr.classList.add('cursor-pointer');
      tr.addEventListener('click', () => {
        adminShowVendorDetails(vendor);
        // highlight selection
        Array.from(tbody.children).forEach(row => row.classList.remove('table-active'));
        tr.classList.add('table-active');
      });
      tbody.appendChild(tr);
    });
    
    adminRenderVendorSalesChart(stats);
  } catch (e) {
    console.error("Error loading vendor stats:", e);
    toast("Failed to load vendor statistics", "error");
  }
}

function adminRenderVendorSummaryCards(stats) {
  const container = $("adminVendorSummaryCards");
  if (!container) return;
  
  if (!Array.isArray(stats) || !stats.length) {
    container.innerHTML = `
      <div class="col-12 text-center text-secondary py-4">
        <i class="bi bi-inbox fs-3 d-block mb-2 opacity-50"></i>
        <div class="small">No vendor data available</div>
      </div>
    `;
    return;
  }
  
  // Calculate summary metrics
  const totalSales = stats.reduce((sum, v) => sum + (v.totalSales || 0), 0);
  const totalItems = stats.reduce((sum, v) => sum + (v.items?.length || 0), 0);
  const totalQuantity = stats.reduce((sum, v) => {
    return sum + v.items.reduce((qSum, item) => qSum + (item.qty || 0), 0);
  }, 0);
  const avgSalesPerVendor = stats.length > 0 ? totalSales / stats.length : 0;
  const topVendor = stats.reduce((top, v) => v.totalSales > (top?.totalSales || 0) ? v : top, null);
  
  container.innerHTML = `
    <div class="col-md-3 col-sm-6">
      <div class="stat-card">
        <div class="stat-icon bg-success">
          <i class="bi bi-cash-stack"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${fmtMoney(totalSales)}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stat-card">
        <div class="stat-icon bg-primary">
          <i class="bi bi-shop-window"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${stats.length}</div>
          <div class="stat-label">Active Vendors</div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stat-card">
        <div class="stat-icon bg-info">
          <i class="bi bi-box-seam"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">${totalQuantity}</div>
          <div class="stat-label">Items Sold</div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-sm-6">
      <div class="stat-card">
        <div class="stat-icon bg-warning">
          <i class="bi bi-trophy"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value text-truncate" style="font-size: 1.25rem;">${topVendor ? topVendor.name : '₱'}</div>
          <div class="stat-label">Top Performer</div>
        </div>
      </div>
    </div>
  `;
}

function adminRenderVendorSalesChart(stats) {
  const ctx = $("adminVendorSalesChart");
  if (!ctx) return;
  if (window._adminVendorSalesChart) {
    window._adminVendorSalesChart.destroy();
    window._adminVendorSalesChart = null;
  }
  if (!stats.length) return;
  
  const theme = getThemeColors();
  const isDark = document.documentElement.classList.contains('theme-dark');
  
  // Ensure visible text colors - prioritize explicit values
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const gridColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
  
  window._adminVendorSalesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: stats.map(v => v.name),
      datasets: [{
    label: 'Total Sales (₱)',
        data: stats.map(v => v.totalSales),
        backgroundColor: theme.accent2 || '#34C759',
        borderColor: theme.accent2 || '#34C759',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.surface2 || (isDark ? '#1c2026' : '#ffffff'),
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
              label: function(context) {
                return 'Sales: ₱' + context.parsed.y.toLocaleString();
              }
          }
        }
      },
      scales: {
        x: { 
          ticks: { 
            color: textColor,
            font: { size: 12 }
          }, 
          grid: { 
            color: gridColor,
            drawBorder: false
          } 
        },
        y: { 
          ticks: { 
            color: textColor,
            font: { size: 11 },
              callback: function(value) {
                return '₱' + value.toLocaleString();
              }
          }, 
          grid: { 
            color: gridColor,
            drawBorder: false
          }, 
          beginAtZero: true 
        }
      }
    }
  });
}

// Show details for selected vendor in the side card
function adminShowVendorDetails(vendor) {
  // Ensure global selected vendor ID is set for downstream actions (page load, exports)
  if (vendor && vendor.user_id) {
    adminSelectedVendorId = vendor.user_id;
  }
  window._adminSelectedVendorObj = vendor;
  const nameEl = $("adminSelectedVendorName");
  const salesEl = $("adminSelectedVendorSales");
  const txCountEl = $("adminSelectedVendorTxCount");
  const itemsList = $("adminTopItemsList");
  const viewBtn = $("adminViewVendorTxBtn");
  if (!nameEl || !salesEl || !txCountEl || !itemsList) return;

  nameEl.textContent = vendor.name || '—';
  salesEl.textContent = fmtMoney(vendor.totalSales || 0);
  txCountEl.textContent = (vendor.totalTransactions != null ? vendor.totalTransactions : '0');
  viewBtn && (viewBtn.style.display = '');

  // Top items
  itemsList.innerHTML = '';
  if (!vendor.items || !vendor.items.length) {
    const li = document.createElement('li');
    li.className = 'list-group-item bg-transparent text-secondary';
    li.textContent = 'No items sold in range';
    itemsList.appendChild(li);
  } else {
    vendor.items.slice(0, 5).forEach(it => {
      const li = document.createElement('li');
      li.className = 'list-group-item bg-transparent d-flex justify-content-between align-items-center';
      li.innerHTML = `<span>${it.name}</span><span class="badge bg-secondary">${it.qty}</span>`;
      itemsList.appendChild(li);
    });
  }
}

function adminExportVendorStats() {
  const tbody = $("adminVendorStatsTbody");
  let csv = "Vendor,Total Sales,Items Sold\n";
  Array.from(tbody.children).forEach(tr => {
    const tds = tr.querySelectorAll("td");
    if (tds.length === 3) {
      csv += `${tds[0].textContent},${tds[1].textContent},${tds[2].textContent}\n`;
    }
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: "vendor_stats.csv" });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// Guard for pages that don't render the admin vendor stats date inputs
if ($("adminVendorDateStart")) { $("adminVendorDateStart").onchange = adminLoadVendorStats; }
if ($("adminVendorDateEnd"))   { $("adminVendorDateEnd").onchange   = adminLoadVendorStats; }

// ==================== ADMIN RELOAD STATISTICS ====================
const adminReloadDateRangeState = {
  startDate: null,
  endDate: null,
  isSelecting: false,
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear()
};

function toggleAdminReloadPerformanceDashboard() {
  const dashboard = $("adminReloadPerformanceDashboard");
  const chevron = $("adminReloadDashboardChevron");
  
  if (dashboard.style.display === "none" || !dashboard.style.display) {
    dashboard.style.display = "block";
    setTimeout(() => {
      dashboard.style.opacity = "1";
      dashboard.style.transform = "translateY(0)";
    }, 10);
    
    if (chevron) chevron.style.transform = "rotate(180deg)";
    
    // Initialize to today's date if not set
    const startInput = $("adminReloadDateStart");
    const endInput = $("adminReloadDateEnd");
    if (!startInput.value || !endInput.value) {
      initializeAdminReloadDateRangeToToday();
    }
    
    // Load data
    adminLoadReloadStats();
    
    setTimeout(() => {
      dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  } else {
    dashboard.style.opacity = "0";
    dashboard.style.transform = "translateY(-20px)";
    if (chevron) chevron.style.transform = "rotate(0deg)";
    setTimeout(() => {
      dashboard.style.display = "none";
    }, 300);
  }
}

function initializeAdminReloadDateRangeToToday() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  adminReloadDateRangeState.startDate = today;
  adminReloadDateRangeState.endDate = today;
  
  $("adminReloadDateStart").value = dateStr;
  $("adminReloadDateEnd").value = dateStr;
  
  updateAdminReloadDateRangeText();
}

function toggleAdminReloadDatePicker(event) {
  event.stopPropagation();
  const picker = $("adminReloadDateRangePicker");
  const isVisible = picker.style.display === "block";
  
  if (!isVisible) {
    picker.style.display = "block";
    renderAdminReloadCalendar();
    document.addEventListener('click', closeAdminReloadDatePicker);
  } else {
    closeAdminReloadDatePicker();
  }
}

function closeAdminReloadDatePicker() {
  const picker = $("adminReloadDateRangePicker");
  if (picker) picker.style.display = "none";
  document.removeEventListener('click', closeAdminReloadDatePicker);
}

function renderAdminReloadCalendar() {
  const monthYear = $("adminReloadCurrentMonthYear");
  const daysContainer = $("adminReloadCalendarDays");
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  monthYear.textContent = `${monthNames[adminReloadDateRangeState.currentMonth]} ${adminReloadDateRangeState.currentYear}`;
  
  const firstDay = new Date(adminReloadDateRangeState.currentYear, adminReloadDateRangeState.currentMonth, 1);
  const lastDay = new Date(adminReloadDateRangeState.currentYear, adminReloadDateRangeState.currentMonth + 1, 0);
  const prevLastDay = new Date(adminReloadDateRangeState.currentYear, adminReloadDateRangeState.currentMonth, 0);
  
  const firstDayIndex = firstDay.getDay();
  const lastDateNum = lastDay.getDate();
  const prevLastDateNum = prevLastDay.getDate();
  
  daysContainer.innerHTML = "";
  
  // Show previous month's days, but only allow click if viewing that month
  for (let i = firstDayIndex; i > 0; i--) {
    const day = document.createElement("div");
    day.className = "day other-month";
    day.textContent = prevLastDateNum - i + 1;
    // Calculate the date for previous month's day
    const prevMonthDate = new Date(adminReloadDateRangeState.currentYear, adminReloadDateRangeState.currentMonth - 1, prevLastDateNum - i + 1);
    // Only allow click if calendar is showing previous month
    if (
      adminReloadDateRangeState.currentMonth === (new Date().getMonth() - 1) &&
      adminReloadDateRangeState.currentYear === new Date().getFullYear()
    ) {
      day.onclick = (e) => {
        e.stopPropagation();
        selectAdminReloadDate(prevMonthDate);
      };
    } else {
      day.classList.add("disabled");
    }
    daysContainer.appendChild(day);
  }
  
  const today = new Date();
  for (let i = 1; i <= lastDateNum; i++) {
    const day = document.createElement("div");
    day.className = "day";
    day.textContent = i;
    const currentDate = new Date(adminReloadDateRangeState.currentYear, adminReloadDateRangeState.currentMonth, i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const startStr = adminReloadDateRangeState.startDate?.toISOString().split('T')[0];
    const endStr = adminReloadDateRangeState.endDate?.toISOString().split('T')[0];
    // Hide future dates
    if (
      currentDate > today &&
      (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear())
    ) {
      day.classList.add("disabled");
      day.style.visibility = "hidden";
      daysContainer.appendChild(day);
      continue;
    }
    if (dateStr === startStr) {
      day.classList.add("start-date");
      if (dateStr === endStr) {
        day.classList.add("end-date");
      }
    } else if (dateStr === endStr) {
      day.classList.add("end-date");
    }
    if (adminReloadDateRangeState.startDate && adminReloadDateRangeState.endDate) {
      if (currentDate > adminReloadDateRangeState.startDate && currentDate < adminReloadDateRangeState.endDate) {
        day.classList.add("in-range");
      }
    }
    // Only allow click if not disabled
    if (!day.classList.contains("disabled")) {
      day.onclick = (e) => {
        e.stopPropagation();
        selectAdminReloadDate(currentDate);
      };
    }
    daysContainer.appendChild(day);
  }
}

function selectAdminReloadDate(date) {
  if (!adminReloadDateRangeState.startDate || (adminReloadDateRangeState.startDate && adminReloadDateRangeState.endDate)) {
    adminReloadDateRangeState.startDate = date;
    adminReloadDateRangeState.endDate = null;
  } else {
    if (date < adminReloadDateRangeState.startDate) {
      adminReloadDateRangeState.endDate = adminReloadDateRangeState.startDate;
      adminReloadDateRangeState.startDate = date;
    } else {
      adminReloadDateRangeState.endDate = date;
    }
  }
  renderAdminReloadCalendar();
}

function changeAdminReloadMonth(delta) {
  adminReloadDateRangeState.currentMonth += delta;
  if (adminReloadDateRangeState.currentMonth > 11) {
    adminReloadDateRangeState.currentMonth = 0;
    adminReloadDateRangeState.currentYear++;
  } else if (adminReloadDateRangeState.currentMonth < 0) {
    adminReloadDateRangeState.currentMonth = 11;
    adminReloadDateRangeState.currentYear--;
  }
  renderAdminReloadCalendar();
}

function applyAdminReloadDateRange() {
  if (adminReloadDateRangeState.startDate && adminReloadDateRangeState.endDate) {
    $("adminReloadDateStart").value = adminReloadDateRangeState.startDate.toISOString().split('T')[0];
    $("adminReloadDateEnd").value = adminReloadDateRangeState.endDate.toISOString().split('T')[0];
    updateAdminReloadDateRangeText();
    closeAdminReloadDatePicker();
    adminLoadReloadStats();
  }
}

function cancelAdminReloadDateRange() {
  closeAdminReloadDatePicker();
}

function updateAdminReloadDateRangeText() {
  const start = adminReloadDateRangeState.startDate;
  const end = adminReloadDateRangeState.endDate;
  const textEl = $("adminReloadDateRangeText");
  
  if (!start || !end) {
    textEl.textContent = "Select date range";
    return;
  }
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const startMonth = monthNames[start.getMonth()];
  const endMonth = monthNames[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  if (start.toISOString().split('T')[0] === end.toISOString().split('T')[0]) {
    textEl.textContent = `${startMonth} ${startDay}`;
  } else if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    textEl.textContent = `${startMonth} ${startDay} - ${endDay}`;
  } else {
    textEl.textContent = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}

async function adminLoadReloadStats() {
  try {
    const start = $("adminReloadDateStart").value;
    const end = $("adminReloadDateEnd").value;
    
    if (!start || !end) {
      initializeAdminReloadDateRangeToToday();
      return;
    }
    
    const params = new URLSearchParams({ start, end });
    const res = await fetch(API_BASE + "/admin/reload-stats?" + params, {
      headers: { "Authorization": "Bearer " + token }
    });
    
    if (!res.ok) throw new Error("Failed to load reload stats");
    
    const data = await res.json();
    
    // Update summary cards
    $("adminTotalReloadAmount").textContent = fmtMoney(data.totalAmount || 0);
    $("adminTotalReloadCount").textContent = (data.totalCount || 0).toLocaleString();
    $("adminAvgReloadAmount").textContent = fmtMoney(data.avgAmount || 0);
    $("adminTopReloadAmount").textContent = fmtMoney(data.topAmount || 0);
    
    // Render chart (hourly or daily based on response)
    adminRenderReloadTrendsChart(data.chartData || [], data.isSingleDay, start);
    
    // Render table
    const tbody = $("adminReloadStatsTbody");
    tbody.innerHTML = "";
    
    if (!data.chartData || data.chartData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-secondary py-4">
            <i class="bi bi-inbox fs-4 d-block mb-2 opacity-50"></i>
            <div class="small">No data available for selected period</div>
          </td>
        </tr>
      `;
      return;
    }
    
    // Render table based on data type
    if (data.isSingleDay) {
      // Hourly breakdown
      data.chartData.forEach((hourData, index) => {
        const tr = document.createElement("tr");
        const trend = index > 0 ? hourData.amount - data.chartData[index - 1].amount : 0;
        const trendIcon = trend > 0 ? 'bi-arrow-up text-success' : trend < 0 ? 'bi-arrow-down text-danger' : 'bi-dash text-secondary';
        
        const hour = hourData.hour;
        const hourLabel = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
        
        tr.innerHTML = `
          <td>${hourLabel}</td>
          <td><span class="fw-semibold text-success">${fmtMoney(hourData.amount)}</span></td>
          <td><span class="badge bg-info">${hourData.count}</span></td>
          <td class="text-end">
            <i class="bi ${trendIcon}"></i>
            ${trend !== 0 ? fmtMoney(Math.abs(trend)) : '-'}
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      // Daily breakdown
      data.chartData.forEach((day, index) => {
        const tr = document.createElement("tr");
        const trend = index > 0 ? day.amount - data.chartData[index - 1].amount : 0;
        const trendIcon = trend > 0 ? 'bi-arrow-up text-success' : trend < 0 ? 'bi-arrow-down text-danger' : 'bi-dash text-secondary';
        
        tr.innerHTML = `
          <td>${new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })}</td>
          <td><span class="fw-semibold text-success">${fmtMoney(day.amount)}</span></td>
          <td><span class="badge bg-info">${day.count}</span></td>
          <td class="text-end">
            <i class="bi ${trendIcon}"></i>
            ${trend !== 0 ? fmtMoney(Math.abs(trend)) : '-'}
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
    
  } catch (e) {
    console.error("Error loading reload stats:", e);
    toast("Failed to load reload statistics", "danger");
  }
}

function adminRenderReloadTrendsChart(chartData, isSingleDay, selectedDate) {
  const ctx = $("adminReloadTrendsChart");
  if (!ctx) return;
  
  if (window._adminReloadTrendsChart) {
    window._adminReloadTrendsChart.destroy();
    window._adminReloadTrendsChart = null;
  }
  
  if (!chartData.length) return;
  
  const isDark = document.documentElement.classList.contains('theme-dark');
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const gridColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
  const theme = getThemeColors();
  
  // Get Manila date/time for title
  const manilaDate = new Date().toLocaleDateString('en-US', { 
    timeZone: 'Asia/Manila', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });
  
  let labels, data, titleText;
  
  if (isSingleDay) {
    // 24-hour hourly chart
    const dateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
      timeZone: 'Asia/Manila',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    // Create full 24-hour array (0-23)
    const hourlyMap = new Map(chartData.map(d => [d.hour, d.amount]));
    data = Array.from({ length: 24 }, (_, hour) => hourlyMap.get(hour) || 0);
    labels = Array.from({ length: 24 }, (_, hour) => {
      if (hour === 0) return '12 AM';
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return '12 PM';
      return `${hour - 12} PM`;
    });
    
    titleText = `Hourly Reloads - ${dateLabel}`;
  } else {
    // Daily chart
    labels = chartData.map(d => new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { 
      timeZone: 'Asia/Manila',
      month: 'short', 
      day: 'numeric' 
    }));
    data = chartData.map(d => d.amount);
    titleText = 'Daily Reload Trends';
  }
  
  window._adminReloadTrendsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Reload Amount (₱)',
        data: data,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        borderColor: theme.accent2 || '#34C759',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: isSingleDay ? 3 : 4,
        pointBackgroundColor: theme.accent2 || '#34C759',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: titleText,
          color: textColor,
          font: { size: 14, weight: 'normal' },
          padding: { bottom: 15 }
        },
        subtitle: {
          display: isSingleDay,
          text: `Manila Time: ${manilaDate}`,
          color: textColor,
          font: { size: 11 },
          padding: { bottom: 10 }
        },
        tooltip: {
          backgroundColor: theme.surface2 || (isDark ? '#1c2026' : '#ffffff'),
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return 'Amount: ₱' + context.parsed.y.toLocaleString();
            }
          }
        }
      },
      scales: {
        x: { 
          ticks: { 
            color: textColor,
            font: { size: isSingleDay ? 9 : 12 },
            maxRotation: isSingleDay ? 45 : 0,
            minRotation: isSingleDay ? 45 : 0
          }, 
          grid: { 
            color: gridColor,
            drawBorder: false
          } 
        },
        y: { 
          ticks: { 
            color: textColor,
            font: {
              size: 11,
              family: 'Segoe UI Symbol, Arial Unicode MS, Noto Sans Symbols, Noto Sans, Arial, sans-serif'
            },
            callback: function(value) {
              return '₱' + value.toLocaleString();
            }
          }, 
          grid: { 
            color: gridColor,
            drawBorder: false
          }, 
          beginAtZero: true 
        }
      }
    }
  });
}

function adminExportReloadStats() {
  const tbody = $("adminReloadStatsTbody");
  let csv = "Date,Total Amount,Count,Trend\n";
  Array.from(tbody.children).forEach(tr => {
    const tds = tr.querySelectorAll("td");
    if (tds.length === 4) {
      csv += `${tds[0].textContent},${tds[1].textContent},${tds[2].textContent},${tds[3].textContent}\n`;
    }
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: "reload_stats.csv" });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// ==================== ADMIN VENDOR COUNTERS & TRANSACTIONS ====================
let adminSelectedVendorId = null;
let adminVendors = [];

async function adminLoadVendorCounters() {
  try {
    const res = await fetch(API_BASE + "/admin/vendors", { headers: { "Authorization": "Bearer " + token } });
    const vendors = await res.json();
    adminVendors = vendors.slice(0, 3); // Only show first 3 vendors
    
    const container = $("adminVendorCounters");
    if (!container) return;
    
    container.innerHTML = "";
    
    adminVendors.forEach((vendor, index) => {
      const col = document.createElement("div");
      col.className = "col-4";
      col.innerHTML = `
        <button class="card glass w-100 text-center py-4" onclick="adminSelectVendor(${vendor.user_id}, '${vendor.name}')" style="border: none; cursor: pointer;">
          <div class="card-body">
            <i class="bi bi-shop fs-2 text-warning mb-2"></i>
            <div class="fs-5 fw-bold">${vendor.name || 'Vendor ' + (index + 1)}</div>
          </div>
        </button>
      `;
      container.appendChild(col);
    });
    
    // Fill remaining slots if less than 3 vendors
    for (let i = adminVendors.length; i < 3; i++) {
      const col = document.createElement("div");
      col.className = "col-4";
      col.innerHTML = `
        <div class="card glass w-100 text-center py-4" style="opacity: 0.5;">
          <div class="card-body">
            <i class="bi bi-shop fs-2 text-secondary mb-2"></i>
            <div class="fs-5 text-secondary">Counter ${i + 1}</div>
            <div class="small text-muted">No vendor</div>
          </div>
        </div>
      `;
      container.appendChild(col);
    }
  } catch (e) {
    console.error("Error loading vendor counters:", e);
  }
}

function adminSelectVendor(vendorId, vendorName) {
  adminSelectedVendorId = vendorId;
  // Keep old card hidden by default; we now use a modal
  const txCard = $("adminVendorTxCard");
  if (txCard) txCard.style.display = "none";
  // If stats are loaded, also update the details card
  if (window._adminVendorStatsMap && window._adminVendorStatsMap.has(vendorId)) {
    const v = window._adminVendorStatsMap.get(vendorId);
    adminShowVendorDetails(v);
    window._adminSelectedVendorObj = v;
  } else {
    // Fallback: at least set the name
    const nameEl = $("adminSelectedVendorName");
    if (nameEl) nameEl.textContent = vendorName;
    const viewBtn = $("adminViewVendorTxBtn");
    if (viewBtn) viewBtn.style.display = '';
    window._adminSelectedVendorObj = { user_id: vendorId, name: vendorName, totalSales: 0, totalTransactions: 0, items: [] };
  }
}

// Open modal for vendor transactions with consistent calendar UX
function adminOpenVendorTxModal() {
  if (!window._adminSelectedVendorObj) return;
  const vendor = window._adminSelectedVendorObj;
  const nameEl = $("vendorTxModalName");
  if (nameEl) nameEl.textContent = vendor.name || 'Vendor';
  // Initialize date range to today if not set
  const startEl = $("adminVendorTxDateStart");
  const endEl = $("adminVendorTxDateEnd");
  if (!startEl.value || !endEl.value) {
    initializeVendorTxDateRangeToToday();
  }
  // Show modal
  const modalEl = document.getElementById('vendorTxModal');
  if (modalEl && window.bootstrap) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
  // Load data
  adminLoadVendorTransactions();
}

// ==================== VENDOR TX DATE RANGE PICKER (consistent) ====================
let vendorTxRangeState = {
  currentMonth: new Date(),
  startDate: null,
  endDate: null,
  tempStartDate: null,
  tempEndDate: null
};

function initializeVendorTxDateRangeToToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  vendorTxRangeState.startDate = today;
  vendorTxRangeState.endDate = today;
  vendorTxRangeState.tempStartDate = today;
  vendorTxRangeState.tempEndDate = today;
  $("adminVendorTxDateStart").value = formatDateForInput(today);
  $("adminVendorTxDateEnd").value = formatDateForInput(today);
  const txt = $("vendorTxDateRangeText");
  if (txt) txt.textContent = today.toLocaleString('en-US', { month: 'short', day: '2-digit' });
}

function toggleVendorTxDatePicker(e) {
  e.stopPropagation();
  const picker = $("vendorTxDateRangePicker");
  if (!picker) return;
  if (picker.style.display === "none" || !picker.style.display) {
    renderVendorTxCalendar();
    picker.style.display = "block";
    document.addEventListener('click', closeVendorTxPickerOnClickOutside);
  } else {
    picker.style.display = "none";
    document.removeEventListener('click', closeVendorTxPickerOnClickOutside);
  }
}

function closeVendorTxPickerOnClickOutside(e) {
  const picker = $("vendorTxDateRangePicker");
  const wrapper = picker?.parentElement?.closest('.date-range-picker-wrapper');
  if (picker && !picker.contains(e.target) && !wrapper.contains(e.target)) {
    picker.style.display = "none";
    document.removeEventListener('click', closeVendorTxPickerOnClickOutside);
  }
}

function changeVendorTxMonth(delta) {
  // Prevent navigating into future months
  const next = new Date(vendorTxRangeState.currentMonth);
  next.setMonth(next.getMonth() + delta);
  const today = new Date(); today.setHours(0,0,0,0);
  const cap = new Date(today.getFullYear(), today.getMonth(), 1);
  if (next > cap) {
    vendorTxRangeState.currentMonth = new Date(cap);
  } else {
    vendorTxRangeState.currentMonth = next;
  }
  renderVendorTxCalendar();
}

function renderVendorTxCalendar() {
  const month = vendorTxRangeState.currentMonth;
  const year = month.getFullYear();
  const firstDay = new Date(year, month.getMonth(), 1).getDay();
  const daysInMonth = new Date(year, month.getMonth() + 1, 0).getDate();
  const daysContainer = $("vendorTxCalendarDays");
  const header = $("vendorTxCurrentMonthYear");
  if (!daysContainer || !header) return;
  header.textContent = month.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  let html = '';
  for (let i = 0; i < firstDay; i++) html += `<div class="day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month.getMonth(), d);
    date.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    // Hide future dates completely (no number, no click)
    if (date > today) {
      html += `<div class="day empty"></div>`;
      continue;
    }
    let classes = ['day'];
    if (+date === +today) classes.push('today');
    const s = vendorTxRangeState.tempStartDate;
    const e = vendorTxRangeState.tempEndDate;
    if (s && !e) {
      if (+date === +s) classes.push('start-date','end-date');
    }
    if (s && e) {
      if (+date === +s) classes.push('start-date');
      else if (+date === +e) classes.push('end-date');
      else if (date > s && date < e) classes.push('in-range');
    }
    html += `<button type="button" class="${classes.join(' ')}" onclick="selectVendorTxDate(${year},${month.getMonth()},${d}); event.stopPropagation();">${d}</button>`;
  }
  daysContainer.innerHTML = html;
}

function selectVendorTxDate(y, m, d) {
  const clicked = new Date(y, m, d); clicked.setHours(0,0,0,0);
  if (!vendorTxRangeState.tempStartDate || (vendorTxRangeState.tempStartDate && vendorTxRangeState.tempEndDate)) {
    vendorTxRangeState.tempStartDate = clicked;
    vendorTxRangeState.tempEndDate = null;
  } else if (clicked < vendorTxRangeState.tempStartDate) {
    vendorTxRangeState.tempEndDate = vendorTxRangeState.tempStartDate;
    vendorTxRangeState.tempStartDate = clicked;
  } else {
    vendorTxRangeState.tempEndDate = clicked;
  }
  renderVendorTxCalendar();
}

function cancelVendorTxDateRange() {
  const picker = $("vendorTxDateRangePicker");
  if (picker) picker.style.display = "none";
  document.removeEventListener('click', closeVendorTxPickerOnClickOutside);
}

function applyVendorTxDateRange() {
  const picker = $("vendorTxDateRangePicker");
  if (!vendorTxRangeState.tempStartDate) return;
  const start = vendorTxRangeState.tempStartDate;
  const end = vendorTxRangeState.tempEndDate || vendorTxRangeState.tempStartDate;
  vendorTxRangeState.startDate = start;
  vendorTxRangeState.endDate = end;
  $("adminVendorTxDateStart").value = formatDateForInput(start);
  $("adminVendorTxDateEnd").value = formatDateForInput(end);
  const textEl = $("vendorTxDateRangeText");
  if (textEl) {
    const startStr = start.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    if (start.getMonth() === end.getMonth()) {
      textEl.textContent = `${startStr} – ${end.getDate()}`;
    } else {
      textEl.textContent = `${startStr} – ${endStr}`;
    }
  }
  if (picker) picker.style.display = "none";
  document.removeEventListener('click', closeVendorTxPickerOnClickOutside);
}

// ==================== VENDOR TX DEDICATED PAGE ====================

async function adminLoadVendorTransactions() {
  // Check both module-scoped and window-scoped vendor ID (for standalone pages)
  const vendorId = adminSelectedVendorId || window.adminSelectedVendorId;
  
  if (!vendorId) {
    console.warn('adminLoadVendorTransactions: No vendor selected');
    return;
  }
  
  // Support both modal and dedicated page inputs
  const startInput = $("adminVendorDateStart") || $("vendorPageTxDateStart");
  const endInput = $("adminVendorDateEnd") || $("vendorPageTxDateEnd");
  
  if (!startInput || !endInput) {
    console.error('adminLoadVendorTransactions: Date inputs not found');
    toast("Date inputs not found", "error");
    return;
  }
  
  const start = startInput.value;
  const end = endInput.value;
  
  console.log('Loading vendor transactions:', { vendorId, start, end });
  
  let url = API_BASE + `/admin/vendor/${vendorId}/transactions`;
  if (start && end) url += `?start=${start}&end=${end}`;
  
  try {
    const res = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API error:', res.status, errorText);
      toast(`Failed to load transactions: ${res.status}`, "error");
      return;
    }
    
    const txs = await res.json();
    console.log('Received transactions:', txs);
    
    const tbody = $("vendorPageTxTbody") || $("adminVendorTxTbody");
    if (!tbody) {
      console.error('Transaction table body not found');
      return;
    }
    
    tbody.innerHTML = "";
    
    if (!Array.isArray(txs) || !txs.length) {
      tbody.innerHTML = `<tr><td colspan='3' class='text-center text-secondary'>No transactions found for this date range</td></tr>`;
      // Update summary cards on dedicated page
      const salesEl = $("vendorPageSales");
      const countEl = $("vendorPageTxCount");
      const topItemsEl = $("vendorPageTopItems");
      if (salesEl) salesEl.textContent = "₱0";
      if (countEl) countEl.textContent = "0";
      if (topItemsEl) topItemsEl.textContent = "—";
      // Hide pagination
      const paginationContainer = $("vendorTxPagination");
      if (paginationContainer) paginationContainer.style.display = "none";
      return;
    }
    
    // Calculate summary
    const totalSales = txs.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    
    // Calculate top items from transaction data
    const itemCounts = {};
    txs.forEach(tx => {
      const name = tx.item_name || tx.custom_item || '-';
      if (!name || name === '-') return;
      itemCounts[name] = (itemCounts[name] || 0) + 1;
    });
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)
      .join(', ');
    
    // Update summary cards on dedicated page
    const salesEl = $("vendorPageSales");
    const countEl = $("vendorPageTxCount");
    const topItemsEl = $("vendorPageTopItems");
    if (salesEl) salesEl.textContent = fmtMoney(totalSales);
    if (countEl) countEl.textContent = txs.length;
    if (topItemsEl) topItemsEl.textContent = topItems || "—";
    
    // Store transactions for pagination
    window._vendorTransactions = txs;
    window._vendorTxCurrentPage = 1;
    
    // Render first page
    renderVendorTransactionsPage(1);
    
    toast(`Loaded ${txs.length} transaction${txs.length !== 1 ? 's' : ''}`, "success");
  } catch (e) {
    console.error("Error loading vendor transactions:", e);
    toast("Failed to load vendor transactions", "error");
  }
}

function renderVendorTransactionsPage(page) {
  const txs = window._vendorTransactions || [];
  const tbody = $("vendorPageTxTbody") || $("adminVendorTxTbody");
  if (!tbody) return;
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(txs.length / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, txs.length);
  
  // Clear table
  tbody.innerHTML = "";
  
  // Render current page items
  const pageTransactions = txs.slice(startIdx, endIdx);
  pageTransactions.forEach(tx => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${fmtTime(tx.timestamp)}</td><td>${tx.item_name || tx.custom_item || '-'}</td><td>${fmtMoney(tx.amount)}</td>`;
    tbody.appendChild(tr);
  });
  
  // Update pagination UI (only on dedicated page)
  const paginationContainer = $("vendorTxPagination");
  const pageInfo = $("vendorTxPageInfo");
  const pageNumbers = $("vendorTxPageNumbers");
  
  if (paginationContainer && pageInfo && pageNumbers) {
    if (totalPages > 1) {
      paginationContainer.style.display = "block";
      pageInfo.textContent = `Showing ${startIdx + 1}-${endIdx} of ${txs.length}`;
      
      // Build pagination buttons
      pageNumbers.innerHTML = "";
      
      // Previous button
      const prevLi = document.createElement("li");
      prevLi.className = `page-item ${page === 1 ? 'disabled' : ''}`;
      prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
      if (page > 1) {
        prevLi.querySelector('a').onclick = (e) => { e.preventDefault(); renderVendorTransactionsPage(page - 1); };
      }
      pageNumbers.appendChild(prevLi);
      
      // Page numbers (show max 5 pages at a time)
      let startPage = Math.max(1, page - 2);
      let endPage = Math.min(totalPages, startPage + 4);
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }
      
      for (let p = startPage; p <= endPage; p++) {
        const pageLi = document.createElement("li");
        pageLi.className = `page-item ${p === page ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${p}</a>`;
        const currentP = p;
        pageLi.querySelector('a').onclick = (e) => { e.preventDefault(); renderVendorTransactionsPage(currentP); };
        pageNumbers.appendChild(pageLi);
      }
      
      // Next button
      const nextLi = document.createElement("li");
      nextLi.className = `page-item ${page === totalPages ? 'disabled' : ''}`;
      nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
      if (page < totalPages) {
        nextLi.querySelector('a').onclick = (e) => { e.preventDefault(); renderVendorTransactionsPage(page + 1); };
      }
      pageNumbers.appendChild(nextLi);
      
      window._vendorTxCurrentPage = page;
    } else {
      paginationContainer.style.display = "none";
    }
  }
}

function adminExportVendorTx() {
  // Export all transactions, not just current page
  const txs = window._vendorTransactions || [];
  
  if (!txs.length) {
    toast("No transactions to export", "warning");
    return;
  }
  
  let csv = "Date,Item,Amount\n";
  txs.forEach(tx => {
    const date = fmtTime(tx.timestamp);
    const item = tx.item_name || tx.custom_item || '-';
    const amount = fmtMoney(tx.amount);
    csv += `"${date}","${item}","${amount}"\n`;
  });
  
  const vendorId = adminSelectedVendorId || window.adminSelectedVendorId || 'vendor';
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `vendor_${vendorId}_transactions.csv` });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast("Export downloaded", "success");
}

if ($("adminVendorTxDateStart")) $("adminVendorTxDateStart").onchange = adminLoadVendorTransactions;
if ($("adminVendorTxDateEnd")) $("adminVendorTxDateEnd").onchange = adminLoadVendorTransactions;

function logout(){
      // Close WebSocket connection
      if (typeof closeWebSocket === 'function') {
        closeWebSocket();
      }
      
      token = null; userRole = null;
      localStorage.removeItem("token"); localStorage.removeItem("role"); localStorage.removeItem("username");
      hide($("dashboard"));
      hide($("staffDashboard")); hide($("vendorDashboard")); hide($("studentDashboard")); hide($("adminDashboard")); hide($("canteenManagerDashboard"));
      document.querySelectorAll('.auth-only').forEach(hide);
      show($("loginStage"));
      $("loginAlert").classList.add('d-none');
      $("loginName").value = ""; $("loginPass").value = "";
      toast("Logged out", "info");
    }
    (function restoreSession(){
      const savedToken = localStorage.getItem("token");
      const savedRole  = localStorage.getItem("role");
      const savedUser  = localStorage.getItem("username");
      if (!(savedToken && savedRole)) return;
      token = savedToken; userRole = savedRole;

      // If we're on pages without the main dashboard layout (e.g., vendor-transactions.html),
      // skip DOM mutations for absent elements and just keep token available.
      const hasDashboard = Boolean($("dashboard"));
      if (!hasDashboard) {
        // Still try to init WebSocket for notifications if available
        if (typeof initWebSocket === 'function') {
          try { initWebSocket(); } catch(_) {}
        }
        return;
      }

      // Main index.html path
      const loginStage = $("loginStage");
      const dashboardEl = $("dashboard");
      if (loginStage && dashboardEl) { hide(loginStage); show(dashboardEl); }
      document.querySelectorAll('.auth-only').forEach(show);
      const welcome = $("welcomeMsg");
      if (welcome) welcome.textContent = "Welcome, " + (savedUser || "(user)") + " (" + userRole + ")";
      const userLbl = $("navUserLabel");
      if (userLbl) userLbl.textContent = (savedUser || "User");

      if (userRole === "staff") { const el=$("staffDashboard"); el&&show(el); loadReloads(); }
      else if (userRole === "vendor") { const el=$("vendorDashboard"); el&&show(el); loadMenuItems(); loadSales(); }
      else if (userRole === "canteen_manager") { 
        const el=$("canteenManagerDashboard"); el&&show(el);
        loadCanteenMenuItems(); 
        loadMenuAnalytics(); 
      }
      else if (userRole === "student") { const el=$("studentDashboard"); el&&show(el); loadMyBalance(); loadMyTransactions(); loadMyReloads(); }
      else if (userRole === "admin") { 
        const el=$("adminDashboard"); el&&show(el);
        setTimeout(() => { 
          initializeDateRangeToToday();
          adminLoadStats(); 
          adminLoadUsers(); 
        }, 100);
      }

      if (typeof initWebSocket === 'function') {
        try { initWebSocket(); } catch(_) {}
      }
    })();

    /* ==================== POS SYSTEM FUNCTIONS ==================== */
    let posState = {
      topup: { amount: '', pendingId: null, interval: null, pollCount: 0 },
      sale: { 
        amount: '', 
        itemId: '', 
        itemName: '', 
        pendingId: null, 
        interval: null, 
        pollCount: 0, 
        isCustomItem: false, 
        isMenuItemSelected: false, 
        menuItems: [],
        cart: {
          orderId: null,
          items: [],
          total: 0
        }
      }
    };

    // Format amount as currency
    function posFormatAmount(value) {
      // Remove non-numeric characters except decimal point
      let cleaned = value.replace(/[^0-9.]/g, '');
      
      // Only allow one decimal point
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit to 2 decimal places
      if (parts.length === 2 && parts[1].length > 2) {
        cleaned = parts[0] + '.' + parts[1].substring(0, 2);
      }
      
      return cleaned;
    }

    // Keypad functions
    function posAddDigit(mode, digit) {
      // Don't allow editing if menu item is selected (fixed price)
      if (mode === 'sale' && posState.sale.isMenuItemSelected) {
        return;
      }
      
      const input = $(mode === 'topup' ? 'posTopupAmount' : 'posSaleAmount');
      let current = input.value;
      
      // If empty or just starting, allow digit
      if (!current || current === '0' || current === '0.00') {
        input.value = digit;
      } else {
        // Check if we already have a decimal point
        const hasDot = current.includes('.');
        
        if (hasDot) {
          // Check decimal places
          const parts = current.split('.');
          if (parts[1] && parts[1].length >= 2) {
            // Already have 2 decimal places, don't add more
            return;
          }
        }
        
        // Add the digit
        input.value = current + digit;
      }
      
      input.value = posFormatAmount(input.value);
      posState[mode].amount = input.value;
    }

    function posClearAmount(mode) {
      // Don't allow clearing if menu item is selected (fixed price)
      if (mode === 'sale' && posState.sale.isMenuItemSelected) {
        return;
      }
      
      const input = $(mode === 'topup' ? 'posTopupAmount' : 'posSaleAmount');
      const current = input.value;
      
      if (current.length > 0) {
        // Remove last character
        input.value = current.slice(0, -1);
        posState[mode].amount = input.value;
      }
    }

    function posSetAmount(mode, amount) {
      const input = $(mode === 'topup' ? 'posTopupAmount' : 'posSaleAmount');
      input.value = amount + '.00';
      posState[mode].amount = amount + '.00';
    }

    // Setup keyboard input for POS amount fields
    function setupPosKeyboardInput() {
      const topupInput = $('posTopupAmount');
      const saleInput = $('posSaleAmount');
      
      // Guard: only run if POS inputs exist (not present on vendor-transactions.html)
      if (!topupInput || !saleInput) return;
      
      [topupInput, saleInput].forEach((input, idx) => {
        const mode = idx === 0 ? 'topup' : 'sale';
        
        input.addEventListener('input', function(e) {
          let value = e.target.value;
          
          // Format the input
          value = posFormatAmount(value);
          e.target.value = value;
          posState[mode].amount = value;
        });
        
        input.addEventListener('keypress', function(e) {
          // Allow: numbers, decimal point, backspace, delete, arrow keys
          const char = String.fromCharCode(e.which);
          
          // Check if Enter key was pressed
          if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            // Trigger the Continue button for the respective mode
            if (mode === 'topup') {
              posConfirmTopup();
            } else {
              posConfirmSale();
            }
            return;
          }
          
          // Allow decimal point only once
          if (char === '.') {
            if (e.target.value.includes('.')) {
              e.preventDefault();
              return;
            }
          }
          // Only allow numbers and decimal point
          else if (!/[0-9]/.test(char)) {
            e.preventDefault();
            return;
          }
        });
        
        input.addEventListener('blur', function(e) {
          let value = e.target.value;
          if (value && !value.includes('.')) {
            // Add .00 if no decimal
            e.target.value = value + '.00';
            posState[mode].amount = e.target.value;
          } else if (value && value.includes('.')) {
            // Ensure 2 decimal places
            const parts = value.split('.');
            if (parts[1].length === 0) {
              e.target.value = parts[0] + '.00';
            } else if (parts[1].length === 1) {
              e.target.value = parts[0] + '.' + parts[1] + '0';
            }
            posState[mode].amount = e.target.value;
          }
        });
      });
    }

    // Call this when page loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupPosKeyboardInput);
    } else {
      setupPosKeyboardInput();
    }

    function posShowStep(mode, step) {
      // Hide all steps
      for (let i = 1; i <= 4; i++) {
        hide($(`${mode}Step${i}`));
      }
      // Show target step
      show($(`${mode}Step${step}`));
      
      // Remove any existing Enter key listener
      if (window.posConfirmKeyHandler) {
        document.removeEventListener('keypress', window.posConfirmKeyHandler);
        window.posConfirmKeyHandler = null;
      }
      
      // Add Enter key listener ONLY for confirmation step (Step 2)
      if (step === 2) {
        // Use setTimeout to avoid triggering immediately from the previous Enter press
        setTimeout(() => {
          window.posConfirmKeyHandler = function(e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
              e.preventDefault();
              // Double-check we're still on step 2
              const step2Element = $(`${mode}Step2`);
              if (step2Element && !step2Element.classList.contains('d-none')) {
                if (mode === 'topup') {
                  posStartTopupTap();
                } else {
                  posStartSaleTap();
                }
              }
            }
          };
          
          document.addEventListener('keypress', window.posConfirmKeyHandler);
        }, 100);
      }
    }

    function posBackToStep(mode, step) {
      // Reset sale state when going back to step 1
      if (mode === 'sale' && step === 1) {
        posState.sale.isCustomItem = false;
        posState.sale.isMenuItemSelected = false;
        $('posSaleItemSearch').value = '';
        $('posSaleAmount').value = '';
        $('posSaleDropdown').style.display = 'none';
        enableSaleKeypad(true);
      }
      
      posShowStep(mode, step);
    }

    // ========== TOP-UP FLOW ==========
    function posConfirmTopup() {
      const amount = $('posTopupAmount').value.trim();
      if (!amount || parseFloat(amount) <= 0) {
        toast('Please enter a valid amount', 'warn');
        return;
      }
      
      $('topupConfirmAmount').textContent = fmtMoney(amount);
      posShowStep('topup', 2);
    }

    async function posStartTopupTap() {
      const amount = $('posTopupAmount').value.trim();
      if (!amount || parseFloat(amount) <= 0) {
        toast('Invalid amount', 'error');
        return;
      }

      try {
        const res = await fetch(API_BASE + "/pending-reload", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({ amount: parseFloat(amount) })
        });
        const data = await res.json();

        if (data.success && data.pending_id) {
          posState.topup.pendingId = data.pending_id;
          posState.topup.pollCount = 0; // Reset counter
          $('topupTapAmount').textContent = fmtMoney(amount);
          $('topupTapStatus').textContent = 'Waiting for card...';
          posShowStep('topup', 3);

          // Poll immediately, then start fast polling (every 500ms)
          posCheckTopupStatus();
          posState.topup.interval = setInterval(posCheckTopupStatus, 500);
        } else {
          toast(data.error || 'Failed to start top-up', 'error');
        }
      } catch (e) {
        toast('Network error', 'error');
      }
    }

    async function posCheckTopupStatus() {
      if (!posState.topup.pendingId) return;

      // Increment counter and check timeout (300 polls * 500ms = 150 seconds = 2.5 minutes)
      posState.topup.pollCount++;
      if (posState.topup.pollCount > 300) {
        clearInterval(posState.topup.interval);
        posState.topup.interval = null;
        $('topupTapStatus').textContent = 'Transaction timeout - please try again';
        toast('Top-up timed out', 'error');
        setTimeout(() => posResetTopup(), 3000);
        return;
      }

      try {
        const res = await fetch(API_BASE + "/pending-reload/status/" + posState.topup.pendingId, {
          headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();

        if (data.confirmed) {
          clearInterval(posState.topup.interval);
          posState.topup.interval = null;
          
          // Play transaction complete sound
          SoundEffects.complete();
          
          $('topupSuccessAmount').textContent = fmtMoney(data.amount);
          $('topupSuccessDetails').innerHTML = `
            <strong>Student:</strong> ${data.student_name || 'N/A'}
          `;
          posShowStep('topup', 4);
          loadReloads(); // Refresh the table
          toast('Top-up completed!', 'success');
        } else if (data.failed || data.expired) {
          clearInterval(posState.topup.interval);
          posState.topup.interval = null;
          $('topupTapStatus').textContent = 'Transaction failed!';
          toast('Top-up failed', 'error');
          setTimeout(() => posResetTopup(), 3000);
        }
      } catch (e) {
        console.error('Status check error:', e);
      }
    }

    let topupCancelSelectedReason = null;

    function posCancelTopup() {
      // Show unified cancellation reason modal
      const cancelModal = new bootstrap.Modal(document.getElementById('topupCancelModal'));
      cancelModal.show();

      // Wire up buttons once (idempotent)
      document.querySelectorAll('.topup-cancel-reason').forEach(btn => {
        if (btn._wired) return;
        btn._wired = true;
        btn.addEventListener('click', () => topupSelectCancelReason(btn.dataset.reason, btn));
      });
    }

    function topupSelectCancelReason(reason, btnEl) {
      topupCancelSelectedReason = reason;
      // Toggle selected state
      document.querySelectorAll('.topup-cancel-reason').forEach(b => b.classList.remove('selected'));
      if (btnEl) btnEl.classList.add('selected');

      const customBox = document.getElementById('topupCustomReasonContainer');
      if (reason === 'custom') {
        customBox?.classList.remove('d-none');
        document.getElementById('topupCustomReasonInput')?.focus();
      } else {
        customBox?.classList.add('d-none');
        // Immediately confirm cancellation for non-custom reasons
        confirmTopupCancellation();
      }
    }

    async function confirmTopupCancellation() {
      let reasonText = getTopupReasonText(topupCancelSelectedReason);
      if (topupCancelSelectedReason === 'custom') {
        const custom = (document.getElementById('topupCustomReasonInput')?.value || '').trim();
        if (!custom) {
          toast('Please specify a cancellation reason', 'warning');
          return;
        }
        reasonText = custom;
      }
      if (!reasonText) {
        toast('Please select a cancellation reason', 'warning');
        return;
      }

      // Defensive check: Ensure pendingId exists
      if (!posState.topup.pendingId) {
        console.error('Cannot cancel top-up: No pending ID found', posState.topup);
        toast('No pending top-up to cancel', 'error');
        posResetTopup();
        return;
      }

      // Hide the cancellation modal with defensive check
      const topupModalElement = document.getElementById('topupCancelModal');
      const topupModal = bootstrap.Modal.getInstance(topupModalElement);
      if (topupModal) {
        topupModal.hide();
      } else {
        // If no instance exists, create and hide
        const modalInstance = new bootstrap.Modal(topupModalElement);
        modalInstance.hide();
      }

      // Send cancellation to server
      if (posState.topup.pendingId) {
        try {
          const res = await fetch(API_BASE + "/pending-reload/cancel", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json", 
              "Authorization": "Bearer " + token 
            },
            body: JSON.stringify({ 
              pending_id: posState.topup.pendingId,
              reason: reasonText
            })
          });
          const data = await res.json();

          if (data.success) {
            toast('Top-up cancelled: ' + reasonText, 'info');
          } else {
            toast(data.error || 'Failed to cancel top-up', 'error');
          }
        } catch (e) {
          console.error('Cancel error:', e);
          toast('Network error during cancellation', 'error');
        }
      }

      // Clear polling interval
      if (posState.topup.interval) {
        clearInterval(posState.topup.interval);
        posState.topup.interval = null;
      }

      // Reset the form
      posResetTopup();
      // Reset selection state
      topupCancelSelectedReason = null;
      const customBox = document.getElementById('topupCustomReasonContainer');
      if (customBox) customBox.classList.add('d-none');
      const input = document.getElementById('topupCustomReasonInput');
      if (input) input.value = '';
    }

    function getTopupReasonText(code) {
      const map = {
        wrong_amount: 'Wrong Amount Entered',
        student_cancelled: 'Customer Changed Mind',
        card_issue: 'Card Reading Issue',
        timeout: 'Timeout - Customer took too long',
        system_error: 'System Error',
        custom: ''
      };
      return map[code] ?? '';
    }

    // (Removed duplicate/broken posRenderCart implementation)

    async function posStartSaleTap() {
      const amount = posState.sale.amount;
      const itemId = posState.sale.itemId;
      const itemName = posState.sale.itemName;

      if (!amount || parseFloat(amount) <= 0) {
        toast('Invalid amount', 'error');
        return;
      }

      try {
        const body = itemId 
          ? { item_id: itemId, amount: parseFloat(amount) }
          : { item_name: itemName, amount: parseFloat(amount) };

        const res = await fetch(API_BASE + "/pending-sale", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.success && data.pending_id) {
          posState.sale.pendingId = data.pending_id;
          posState.sale.pollCount = 0; // Reset counter
          $('saleTapItem').textContent = itemName;
          $('saleTapAmount').textContent = fmtMoney(amount);
          $('saleTapStatus').textContent = 'Waiting for card...';
          posShowStep('sale', 3);

          // Poll immediately, then start fast polling (every 500ms)
          posCheckSaleStatus();
          posState.sale.interval = setInterval(posCheckSaleStatus, 500);
        } else {
          toast(data.error || 'Failed to start sale', 'error');
        }
      } catch (e) {
        toast('Network error', 'error');
      }
    }

    async function posCheckSaleStatus() {
      if (!posState.sale.pendingId) return;

      // Increment counter and check timeout (300 polls * 500ms = 150 seconds = 2.5 minutes)
      posState.sale.pollCount++;
      if (posState.sale.pollCount > 300) {
        clearInterval(posState.sale.interval);
        posState.sale.interval = null;
        $('saleTapStatus').textContent = 'Transaction timeout - please try again';
        toast('Sale timed out', 'error');
        setTimeout(() => posResetSale(), 3000);
        return;
      }

      try {
        const res = await fetch(API_BASE + "/pending-sale/status/" + posState.sale.pendingId, {
          headers: { "Authorization": "Bearer " + token }
        });
        const data = await res.json();

        if (data.confirmed) {
          clearInterval(posState.sale.interval);
          posState.sale.interval = null;
          
          // Play transaction complete sound
          SoundEffects.complete();
          
          $('saleSuccessAmount').textContent = fmtMoney(data.amount);
          $('saleSuccessDetails').innerHTML = `
            <strong>Item:</strong> ${data.item_name || posState.sale.itemName}<br>
            <strong>Student:</strong> ${data.student_name || 'N/A'}
          `;

          // Clear cart after successful transaction
          posState.sale.cart = { orderId: null, items: [], total: 0 };
          try { posRenderCart(); } catch(_) {}
          posState.sale.pendingId = null;
          posShowStep('sale', 4);
          loadSales(); // Refresh the table
          toast('Sale completed!', 'success');
        } else if (data.failed) {
          clearInterval(posState.sale.interval);
          posState.sale.interval = null;
          $('saleTapStatus').textContent = 'Transaction failed!';
          toast('Sale failed (insufficient balance or locked card)', 'error');
          // Clear cart on failure as well for safety
          posState.sale.cart = { orderId: null, items: [], total: 0 };
          try { posRenderCart(); } catch(_) {}
          posState.sale.pendingId = null;
          setTimeout(() => posResetSale(), 3000);
        }
      } catch (e) {
        console.error('Status check error:', e);
      }
    }

    // Start polling for a sale that has already created a pending_id (used by cart checkout)
    function posStartSalePolling() {
      if (!posState.sale.pendingId) return;
      // Reset/ensure status label
      const st = $('saleTapStatus');
      if (st) st.textContent = 'Waiting for card...';
      // Clear any previous interval
      if (posState.sale.interval) clearInterval(posState.sale.interval);
      posState.sale.pollCount = 0;
      // Kick an immediate check then start interval
      posCheckSaleStatus();
      posState.sale.interval = setInterval(posCheckSaleStatus, 500);
    }

    async function posCancelSale() {
      if (posState.sale.interval) {
        clearInterval(posState.sale.interval);
        posState.sale.interval = null;
      }
      
      // If there's a pending transaction, show reason modal
      if (posState.sale.pendingId) {
        const modal = new bootstrap.Modal(document.getElementById('cancelReasonModal'));
        modal.show();
      } else {
        posResetSale();
      }
    }
    
    // Handle cancellation reason selection
    function selectCancelReason(reason) {
      if (reason === 'custom') {
        // Show custom input
        document.querySelector('.custom-reason-container').classList.remove('d-none');
        document.querySelectorAll('.cancel-reason-btn').forEach(btn => {
          btn.classList.remove('selected');
        });
        document.querySelector('[data-reason="custom"]').classList.add('selected');
      } else {
        // Hide custom input if visible
        document.querySelector('.custom-reason-container').classList.add('d-none');
        
        // Deselect all buttons
        document.querySelectorAll('.cancel-reason-btn').forEach(btn => {
          btn.classList.remove('selected');
        });
        
        // Select clicked button
        document.querySelector(`[data-reason="${reason}"]`).classList.add('selected');
        
        // Confirm cancellation immediately
        performCancellation(getReasonText(reason));
      }
    }
    
    // Get human-readable reason text
    function getReasonText(reasonCode) {
      const reasons = {
        'insufficient_funds': 'Insufficient Funds - Student cannot pay',
        'item_unavailable': 'Item Unavailable - Out of stock or not available',
        'wrong_item': 'Wrong Item Selected - Mistakenly selected wrong product',
        'student_cancelled': 'Student Changed Mind - Student decided not to buy',
        'card_issue': 'Card Reading Issue - RFID card not detected',
        'system_error': 'System Error - Technical issue occurred',
        'custom': document.getElementById('customReasonInput')?.value || 'Other reason'
      };
      return reasons[reasonCode] || 'No reason provided';
    }
    
    // Confirm custom cancellation
    function confirmCustomCancellation() {
      const customReason = document.getElementById('customReasonInput')?.value || 'Custom reason';
      performCancellation(customReason);
    }
    
    // Perform the actual cancellation
    async function performCancellation(reason) {
      try {
        // Defensive check: Ensure pendingId exists
        if (!posState.sale.pendingId) {
          console.error('Cannot cancel: No pending ID found', posState.sale);
          toast('No pending transaction to cancel', 'error');
          posResetSale();
          return;
        }
        
        // Close modal with defensive check
        const modalElement = document.getElementById('cancelReasonModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        } else {
          // If no instance exists, try to hide via Bootstrap's static method
          const modalInstance = new bootstrap.Modal(modalElement);
          modalInstance.hide();
        }
        
        // Debug: Log what we're sending
        console.log('Cancel request data:', {
          pending_id: posState.sale.pendingId,
          reason: reason
        });
        
        const res = await fetch(API_BASE + "/pending-sale/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({
            pending_id: posState.sale.pendingId,
            reason: reason
          })
        });
        
        const data = await res.json();
        
        if (data.success) {
          // Only show one toast - WebSocket will handle notifications for other users
          toast(`Transaction cancelled: ${posState.sale.itemName || 'Unknown item'}`, 'warning');
        } else {
          toast('Failed to cancel transaction', 'error');
        }
      } catch (e) {
        console.error('Cancel error:', e);
        toast('Error cancelling transaction', 'error');
      }
      
      // Reset
      posResetSale();
    }
    
    // Setup cancel reason button listeners on page load
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.cancel-reason-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          selectCancelReason(this.dataset.reason);
        });
      });
    });

    function posResetSale() {
      if (posState.sale.interval) {
        clearInterval(posState.sale.interval);
      }
      // Preserve already-loaded menu items so "NEW SALE" doesn't lose them
      const existingMenuItems = (posState.sale && Array.isArray(posState.sale.menuItems)) ? posState.sale.menuItems : [];
      posState.sale = { 
        amount: '', 
        itemId: '', 
        itemName: '', 
        pendingId: null, 
        interval: null, 
        pollCount: 0,
        menuItems: existingMenuItems,
        cart: { orderId: null, items: [], total: 0 },
        isMenuItemSelected: false,
        isCustomItem: false
      };
      $('posSaleAmount').value = '';
      $('posSaleItemSearch').value = '';
      $('posSaleQty').value = '1';
      posRenderCart();
      posShowStep('sale', 1);
      // If we somehow don't have menu items yet (first run or vendor switched), load them now
      try {
        if (!posState.sale.menuItems || posState.sale.menuItems.length === 0) {
          if (typeof loadMenuItems === 'function') {
            loadMenuItems();
          }
        }
      } catch (_) {}
      // Close modal
      bootstrap.Modal.getInstance(document.getElementById('saleModal'))?.hide();
    }

    function posResetTopup() {
      if (posState.topup.interval) {
        clearInterval(posState.topup.interval);
      }
      posState.topup = { 
        amount: '', 
        pendingId: null, 
        interval: null, 
        pollCount: 0
      };
      $('posTopupAmount').value = '';
      posShowStep('topup', 1);
      // Close modal
      bootstrap.Modal.getInstance(document.getElementById('topupModal'))?.hide();
    }

    // Sale item search and dropdown
    function posSaleSearchItems() {
      const searchInput = $('posSaleItemSearch');
      const searchTerm = searchInput.value.toLowerCase().trim();
      const dropdown = $('posSaleDropdown');
      const dropdownItems = $('posSaleDropdownItems');
      
      if (searchTerm.length === 0) {
        // Show all menu items when empty
        posRenderSaleDropdown(posState.sale.menuItems);
        dropdown.style.display = 'block';
      } else {
        // Filter menu items by search term
        const filtered = posState.sale.menuItems.filter(item => 
          item.item_name.toLowerCase().includes(searchTerm)
        );
        
        if (filtered.length > 0) {
          posRenderSaleDropdown(filtered);
          dropdown.style.display = 'block';
        } else {
          // No matches - treat as custom item
          dropdown.style.display = 'none';
          posSelectCustomItem(searchTerm);
        }
      }
    }
    
    function posShowSaleDropdown() {
      const dropdown = $('posSaleDropdown');
      posRenderSaleDropdown(posState.sale.menuItems);
      dropdown.style.display = 'block';
    }
    
    function posRenderSaleDropdown(items) {
      const dropdownItems = $('posSaleDropdownItems');
      dropdownItems.innerHTML = '';
      
      if (items.length === 0) {
        dropdownItems.innerHTML = '<div class="pos-dropdown-item pos-dropdown-empty">No menu items found</div>';
        return;
      }
      
      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'pos-dropdown-item';
        div.innerHTML = `
          <span class="pos-dropdown-item-name">${item.item_name}</span>
          <span class="pos-dropdown-item-price">${fmtMoney(item.price)}</span>
        `;
        // Quick-add: clicking a menu item adds qty=1 to cart immediately
        div.onclick = () => posQuickAddMenuItem(item);
        dropdownItems.appendChild(div);
      });
    }
    
    function posSelectMenuItem(item) {
      const searchInput = $('posSaleItemSearch');
      const amountInput = $('posSaleAmount');
      const dropdown = $('posSaleDropdown');
      
      // Set as menu item
      posState.sale.isMenuItemSelected = true;
      posState.sale.isCustomItem = false;
      posState.sale.itemId = item.item_id;
      posState.sale.itemName = item.item_name;
      
      // Update UI
      searchInput.value = item.item_name;
      amountInput.value = parseFloat(item.price).toFixed(2);
      posState.sale.amount = parseFloat(item.price).toFixed(2);
      
      // Hide dropdown
      dropdown.style.display = 'none';
      
      // Disable keypad (fixed price)
      enableSaleKeypad(false);
    }
    
    function posSelectCustomItem(itemName) {
      const amountInput = $('posSaleAmount');
      
      // Set as custom item
      posState.sale.isCustomItem = true;
      posState.sale.isMenuItemSelected = false;
      posState.sale.itemId = '';
      posState.sale.itemName = itemName;
      
      // Clear amount for custom item
      amountInput.value = '';
      posState.sale.amount = '';
      
      // Enable keypad (editable price)
      enableSaleKeypad(true);
    }
    
    function enableSaleKeypad(enabled) {
      const keypadButtons = document.querySelectorAll('#saleStep1 .pos-keypad .pos-key');
      const amountInput = $('posSaleAmount');
      
      keypadButtons.forEach(btn => {
        btn.disabled = !enabled;
        btn.style.opacity = enabled ? '1' : '0.3';
        btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
      });
      
      amountInput.readOnly = !enabled;
      amountInput.style.cursor = enabled ? 'text' : 'not-allowed';
    }

    // Quick add a menu item to the cart with qty = 1
    async function posQuickAddMenuItem(item) {
      try {
        // Ensure cart object exists
        if (!posState.sale.cart) {
          posState.sale.cart = { orderId: null, items: [], total: 0 };
        }

        // Ensure order exists
        if (!posState.sale.cart.orderId) {
          const resOrder = await fetch(API_BASE + '/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ device_id: 'web-pos' })
          });
          const dataOrder = await resOrder.json();
          if (!dataOrder.success) throw new Error(dataOrder.error || 'Failed to create order');
          posState.sale.cart.orderId = dataOrder.order_id;
        }

        // Add one unit of the item
        const payload = {
          item_id: item.item_id || null,
          price: parseFloat(item.price),
          qty: 1
        };
        
        const resAdd = await fetch(API_BASE + `/orders/${posState.sale.cart.orderId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(payload)
        });
        const dataAdd = await resAdd.json();
        if (!dataAdd.success) {
          console.error('Add item failed:', dataAdd);
          throw new Error(dataAdd.error || dataAdd.message || 'Failed to add item');
        }

        // Update cart state
        posState.sale.cart.items = dataAdd.items || [];
        posState.sale.cart.total = dataAdd.order?.total_amount || 0;

        // Render cart and keep dropdown open for rapid entries
        posRenderCart();
        const searchInput = $('posSaleItemSearch');
        if (searchInput) searchInput.focus();
        const dropdown = $('posSaleDropdown');
        if (dropdown) dropdown.style.display = 'block';
        
        toast(`Added ${item.item_name}`, 'success');
      } catch (err) {
        console.error('Quick add error:', err);
        toast(err.message || 'Failed to add item', 'error');
      }
    }
    
    /* ==================== CART FUNCTIONS ==================== */
    async function posAddItemToCart() {
      const searchInput = $('posSaleItemSearch');
      const amountInput = $('posSaleAmount');
      const qtyInput = $('posSaleQty');
      
      const itemName = searchInput.value.trim();
      const price = parseFloat(amountInput.value);
      const qty = parseInt(qtyInput.value) || 1;
      
      if (!itemName) {
        toast('Please enter item name', 'warn');
        return;
      }
      if (!price || price <= 0) {
        toast('Please enter valid price', 'warn');
        return;
      }
      
      try {
        // Create order if not exists
        if (!posState.sale.cart.orderId) {
          const res = await fetch(API_BASE + '/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ device_id: 'web-pos' })
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error || 'Failed to create order');
          posState.sale.cart.orderId = data.order_id;
        }
        
        // Add item to order
        const res = await fetch(API_BASE + `/orders/${posState.sale.cart.orderId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            item_id: posState.sale.itemId || null,
            custom_item: posState.sale.isMenuItemSelected ? null : itemName,
            price: price,
            qty: qty
          })
        });
        
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to add item');
        
        // Update cart state
        posState.sale.cart.items = data.items || [];
        posState.sale.cart.total = data.order?.total_amount || 0;
        
        // Play click sound for adding item
        SoundEffects.click();
        
        // Render cart
        posRenderCart();
        
        // Clear inputs
        searchInput.value = '';
        amountInput.value = '';
        qtyInput.value = '1';
        posState.sale.itemId = '';
        posState.sale.itemName = '';
        posState.sale.isMenuItemSelected = false;
        posState.sale.isCustomItem = false;
        enableSaleKeypad(true);
        
        toast('Item added to cart', 'success');
      } catch (err) {
        console.error('Add to cart error:', err);
        toast(err.message || 'Failed to add item', 'error');
      }
    }
    
    function posRenderCart() {
      const cartEmpty = $('saleCartEmpty');
      const cartItems = $('saleCartItems');
      const cartTotalSection = $('saleCartTotalSection');
      const cartTotal = $('saleCartTotal');
      const cartCount = $('saleCartCount');
      const cart = (posState && posState.sale && posState.sale.cart) ? posState.sale.cart : { items: [], total: 0 };
      
      if (!cart.items || cart.items.length === 0) {
        if (cartEmpty) cartEmpty.classList.remove('d-none');
        if (cartItems) cartItems.classList.add('d-none');
        if (cartTotalSection) cartTotalSection.classList.add('d-none');
        if (cartTotal) cartTotal.textContent = '₱0.00';
        if (cartCount) cartCount.textContent = '0';
        return;
      }
      
      if (cartEmpty) cartEmpty.classList.add('d-none');
      if (cartItems) cartItems.classList.remove('d-none');
      if (cartTotalSection) cartTotalSection.classList.remove('d-none');
      
      // Render items
      cartItems.innerHTML = cart.items.map(item => {
        const itemName = item.custom_item || posState.sale.menuItems.find(m => m.item_id === item.item_id)?.item_name || `Item #${item.item_id}`;
        const lineTotal = parseFloat(item.line_total || (item.price * item.qty)).toFixed(2);
        
        return `
          <div class="cart-item">
            <div class="cart-item-info">
              <div class="cart-item-name">${itemName}</div>
              <div class="cart-item-details">
                <span class="cart-item-qty">×${item.qty}</span>
                <span class="cart-item-price">₱${parseFloat(item.price).toFixed(2)} each</span>
              </div>
            </div>
            <div class="fw-bold">₱${lineTotal}</div>
            <button class="cart-item-remove" onclick="posRemoveFromCart(${item.id})" title="Remove">
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </div>
        `;
      }).join('');
      
      // Update total
      if (cartTotal) cartTotal.textContent = '₱' + parseFloat(cart.total || 0).toFixed(2);
      if (cartCount) cartCount.textContent = cart.items.length;
    }
    
    async function posRemoveFromCart(lineId) {
      if (!posState.sale.cart.orderId) return;
      
      try {
        const res = await fetch(API_BASE + `/orders/${posState.sale.cart.orderId}/items/${lineId}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to remove item');
        
        // Update cart state
        posState.sale.cart.items = data.items || [];
        posState.sale.cart.total = data.order?.total_amount || 0;
        
        posRenderCart();
        toast('Item removed', 'info');
      } catch (err) {
        console.error('Remove from cart error:', err);
        toast(err.message || 'Failed to remove item', 'error');
      }
    }
    
    async function posSubmitCart() {
      if (!posState.sale.cart.orderId || posState.sale.cart.items.length === 0) {
        toast('Cart is empty', 'warn');
        return;
      }
      
      try {
        const res = await fetch(API_BASE + `/orders/${posState.sale.cart.orderId}/submit`, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to submit order');
        
        // Store pending ID and show tap screen
        posState.sale.pendingId = data.pending_id;
        posState.sale.amount = data.amount;
        
        // Update tap screen
        const tapAmount = $('saleTapAmount');
        const tapItem = $('saleTapItem');
        if (tapAmount) tapAmount.textContent = '₱' + parseFloat(data.amount).toFixed(2);
        if (tapItem) tapItem.textContent = `${posState.sale.cart.items.length} items`;
        
        // Go to tap screen
        posShowStep('sale', 3);
        posStartSalePolling();
        
      } catch (err) {
        console.error('Submit cart error:', err);
        toast(err.message || 'Failed to submit order', 'error');
      }
    }
    
    function posClearCart() {
      if (!confirm('Clear all items from cart?')) return;
      
      // Reset cart state
      posState.sale.cart = {
        orderId: null,
        items: [],
        total: 0
      };
      
      posRenderCart();
      toast('Cart cleared', 'info');
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      const searchInput = $('posSaleItemSearch');
      const dropdown = $('posSaleDropdown');
      
      if (searchInput && dropdown && 
          !searchInput.contains(e.target) && 
          !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    /* Vendor: menu & sales */
    async function loadMenuItems(){
      const res = await fetch(API_BASE + "/menu", { headers:{ "Authorization":"Bearer " + token }});
      const data = await res.json();
      
      if (Array.isArray(data) && data.length){
        // Store menu items in posState for the search dropdown
        posState.sale.menuItems = data;
      } else {
        posState.sale.menuItems = [];
        toast("No menu items found", "warn");
      }
    }
    async function loadSales(){
      const res = await fetch(API_BASE + "/sales", { headers:{ "Authorization":"Bearer " + token }});
      const rows = await res.json();
      const tbody = $("salesTbody");
      tbody.innerHTML = "";
      
      // Check if rows is an array
      if (!Array.isArray(rows)) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to load sales</td></tr>`;
        return;
      }
      
      const list = rows.slice(0,10);
      if (!list.length){
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary">No data</td></tr>`;
      } else {
        let todayTotal = 0;
        const todayStr = new Date().toDateString();

        const now = new Date();
        const start7d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-6);
        let sevenDayTotal = 0;

        list.forEach(r=>{
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td class="text-secondary">${fmtTime(r.timestamp)}</td>
            <td>${r.user_name || ""}</td>
            <td>${r.item_name || ""}</td>
            <td class="text-end fw-semibold">${fmtMoney(r.amount)}</td>`;
          tbody.appendChild(tr);
        });

        // Calculate statistics
        let totalCount = rows.length;
        let totalAmount = 0;
        let highest = 0;

        rows.forEach(r=>{
          const amt = Number(r.amount||0);
          totalAmount += amt;
          if (amt > highest) highest = amt;
          
          const t = new Date(r.timestamp);
          if (t.toDateString() === todayStr) todayTotal += amt;
          if (t >= start7d) sevenDayTotal += amt;
        });

        const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;

        // Update KPI pills
        const kpiToday = $("salesKpiToday");
        const kpi7d = $("salesKpi7d");
        kpiToday.textContent = `Today: ${fmtMoney(todayTotal)}`;
        kpi7d.textContent = `7-day: ${fmtMoney(sevenDayTotal)}`;
        show(kpiToday); show(kpi7d);

        // Update stat cards
        if ($('salesRecentTotalCount')) $('salesRecentTotalCount').textContent = totalCount;
        if ($('salesRecentTotalAmount')) $('salesRecentTotalAmount').textContent = fmtMoney(totalAmount);
        if ($('salesRecentAvgAmount')) $('salesRecentAvgAmount').textContent = fmtMoney(avgAmount);
        if ($('salesRecentHighestAmount')) $('salesRecentHighestAmount').textContent = fmtMoney(highest);

        try {
          const daysBack = 7;
          const totals = {};
          for (let i=0;i<daysBack;i++){
            const d = new Date(); d.setDate(d.getDate()-i);
            totals[new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString()] = 0;
          }
          rows.forEach(r=>{
            const d = new Date(new Date(r.timestamp).getFullYear(), new Date(r.timestamp).getMonth(), new Date(r.timestamp).getDate()).toDateString();
            if (Object.prototype.hasOwnProperty.call(totals, d)) totals[d] += Number(r.amount||0);
          });

          const labels = Object.keys(totals).reverse();
          const dataPoints = labels.map(l=>totals[l]);

          const theme = getThemeColors();
          const canvas = document.getElementById('salesChart');
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          const isDark = document.documentElement.classList.contains('theme-dark');
          const textColor = isDark ? '#ffffff' : '#1a1a1a';
          const gridColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
          
          const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
          gradient.addColorStop(0, hexToRgba(theme.danger, 0.25));
          gradient.addColorStop(1, hexToRgba(theme.danger, 0.05));

          if (window._salesChartInstance) {
            const ch = window._salesChartInstance;
            ch.data.labels = labels;
            ch.data.datasets[0].data = dataPoints;
            ch.data.datasets[0].borderColor = theme.danger;
            ch.data.datasets[0].backgroundColor = gradient;
            ch.update();
          } else {
            window._salesChartInstance = new Chart(ctx, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [{
                  label: 'Sales (?)',
                  data: dataPoints,
                  borderColor: theme.danger,
                  backgroundColor: gradient,
                  borderWidth: 3,
                  pointRadius: 4,
                  pointBackgroundColor: theme.danger,
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointHoverRadius: 6,
                  fill: true,
                  tension: 0.4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: theme.surface2,
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                      label: c=> 'Sales: ' + fmtMoney(c.parsed.y)
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: textColor, font:{ size:10 }, callback:(v,i,ticks)=>{
                      const l = labels[i];
                      const d = new Date(l);
                      return (d.getMonth()+1) + '/' + d.getDate();
                    }},
                    grid: { color: gridColor, drawBorder: false }
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { color: textColor, font:{size:10}, callback: v=>'?'+v },
                    grid: { color: gridColor, drawBorder: false }
                  }
                }
              }
            });
          }
        } catch(e){
          console.error('Sales chart error:', e);
        }
      }
    }

    /* Vendor Sales Date Range Functions */
    const vendorSalesDateRangeState = {
      currentMonth: new Date(),
      startDate: null,
      endDate: null,
      tempStartDate: null,
      tempEndDate: null
    };
    
    function initializeVendorSalesDateRangeInputs() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      vendorSalesDateRangeState.startDate = new Date(today);
      vendorSalesDateRangeState.endDate = today;
      vendorSalesDateRangeState.tempStartDate = new Date(today);
      vendorSalesDateRangeState.tempEndDate = today;
      
      $('vendorSalesStartDate').value = formatDateForInput(today);
      $('vendorSalesEndDate').value = formatDateForInput(today);
      
      updateVendorSalesDateRangeText();
    }
    
    function toggleVendorSalesDatePicker(e) {
      if (e) e.stopPropagation();
      const picker = $("vendorSalesDateRangePicker");
      if (picker.style.display === "none" || !picker.style.display) {
        picker.style.display = "block";
        vendorSalesDateRangeState.tempStartDate = vendorSalesDateRangeState.startDate;
        vendorSalesDateRangeState.tempEndDate = vendorSalesDateRangeState.endDate;
        
        if (vendorSalesDateRangeState.startDate) {
          vendorSalesDateRangeState.currentMonth = new Date(vendorSalesDateRangeState.startDate);
        } else {
          vendorSalesDateRangeState.currentMonth = new Date();
        }
        renderVendorSalesCalendar();
        
        setTimeout(() => {
          document.addEventListener('click', closeVendorSalesDatePickerOnClickOutside);
        }, 0);
      } else {
        picker.style.display = "none";
        document.removeEventListener('click', closeVendorSalesDatePickerOnClickOutside);
      }
    }
    
    function closeVendorSalesDatePickerOnClickOutside(e) {
      const picker = $("vendorSalesDateRangePicker");
      const wrapper = picker.closest('.date-range-picker-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        picker.style.display = "none";
        document.removeEventListener('click', closeVendorSalesDatePickerOnClickOutside);
      }
    }
    
    function changeVendorSalesMonth(direction) {
      event.stopPropagation();
      vendorSalesDateRangeState.currentMonth = new Date(
        vendorSalesDateRangeState.currentMonth.getFullYear(),
        vendorSalesDateRangeState.currentMonth.getMonth() + direction,
        1
      );
      renderVendorSalesCalendar();
    }
    
    function renderVendorSalesCalendar() {
      const { currentMonth, tempStartDate, tempEndDate } = vendorSalesDateRangeState;
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      $("vendorSalesCurrentMonthYear").textContent = currentMonth.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const daysContainer = $("vendorSalesCalendarDays");
      daysContainer.innerHTML = "";
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "day empty";
        daysContainer.appendChild(emptyDay);
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        
        const dayEl = document.createElement("div");
        dayEl.className = "day";
        dayEl.textContent = day;
        
        if (date.getTime() === today.getTime()) {
          dayEl.classList.add("today");
        }
        
        if (date > today) {
          dayEl.classList.add("disabled");
        } else {
          if (tempStartDate && date.getTime() === tempStartDate.getTime()) {
            dayEl.classList.add("start-date", "selected");
          }
          if (tempEndDate && date.getTime() === tempEndDate.getTime()) {
            dayEl.classList.add("end-date", "selected");
          }
          if (tempStartDate && tempEndDate && 
              date > tempStartDate && date < tempEndDate) {
            dayEl.classList.add("in-range");
          }
          
          dayEl.onclick = () => selectVendorSalesDate(date, dayEl);
        }
        
        daysContainer.appendChild(dayEl);
      }
    }
    
    function selectVendorSalesDate(date, element) {
      event.stopPropagation();
      
      const { tempStartDate, tempEndDate } = vendorSalesDateRangeState;
      
      if (tempStartDate && date.getTime() === tempStartDate.getTime()) {
        vendorSalesDateRangeState.tempStartDate = null;
        vendorSalesDateRangeState.tempEndDate = null;
      }
      else if (!tempStartDate || date < tempStartDate) {
        vendorSalesDateRangeState.tempStartDate = date;
        vendorSalesDateRangeState.tempEndDate = null;
      }
      else if (tempStartDate && !tempEndDate) {
        vendorSalesDateRangeState.tempEndDate = date;
      }
      else {
        vendorSalesDateRangeState.tempStartDate = date;
        vendorSalesDateRangeState.tempEndDate = null;
      }
      
      renderVendorSalesCalendar();
    }
    
    function applyVendorSalesDateRange() {
      event.stopPropagation();
      const { tempStartDate, tempEndDate } = vendorSalesDateRangeState;
      
      if (!tempStartDate) {
        toast("Please select a start date", "warning");
        return;
      }
      
      vendorSalesDateRangeState.startDate = tempStartDate;
      vendorSalesDateRangeState.endDate = tempEndDate || tempStartDate;
      
      $("vendorSalesStartDate").value = formatDateForInput(vendorSalesDateRangeState.startDate);
      $("vendorSalesEndDate").value = formatDateForInput(vendorSalesDateRangeState.endDate);
      
      updateVendorSalesDateRangeText();
      
      $("vendorSalesDateRangePicker").style.display = "none";
      document.removeEventListener('click', closeVendorSalesDatePickerOnClickOutside);
      
      loadSalesByDateRange();
    }
    
    function cancelVendorSalesDateRange() {
      event.stopPropagation();
      vendorSalesDateRangeState.tempStartDate = vendorSalesDateRangeState.startDate;
      vendorSalesDateRangeState.tempEndDate = vendorSalesDateRangeState.endDate;
      
      $("vendorSalesDateRangePicker").style.display = "none";
      document.removeEventListener('click', closeVendorSalesDatePickerOnClickOutside);
    }
    
    function updateVendorSalesDateRangeText() {
      const { startDate, endDate } = vendorSalesDateRangeState;
      const textEl = $("vendorSalesDateRangeText");
      
      if (!startDate) {
        textEl.textContent = "Select date range";
        return;
      }
      
      const formatOptions = { month: 'short', day: 'numeric' };
      const startStr = startDate.toLocaleDateString('en-US', formatOptions);
      
      if (!endDate || endDate.getTime() === startDate.getTime()) {
        textEl.textContent = startStr;
      } else {
        const endStr = endDate.toLocaleDateString('en-US', formatOptions);
        
        if (startDate.getMonth() === endDate.getMonth()) {
          textEl.textContent = `${startDate.toLocaleDateString('en-US', { month: 'short' })} ${startDate.getDate()} – ${endDate.getDate()}`;
        } else {
          textEl.textContent = `${startStr} – ${endStr}`;
        }
      }
    }
    
    async function loadSalesByDateRange() {
      const startDateInput = $('vendorSalesStartDate');
      const endDateInput = $('vendorSalesEndDate');
      
      if (!startDateInput.value || !endDateInput.value) {
        toast('Please select both start and end dates', 'warning');
        return;
      }
      
      const startDate = new Date(startDateInput.value);
      const endDate = new Date(endDateInput.value);
      
      if (startDate > endDate) {
        toast('Start date must be before end date', 'warning');
        return;
      }
      
      // Use 'from' and 'to' params for /sales endpoint
      const params = new URLSearchParams({
        from: startDateInput.value,
        to: endDateInput.value
      });
      
      const res = await fetch(API_BASE + "/sales?" + params, { 
        headers:{ "Authorization":"Bearer " + token }
      });
      const rows = await res.json();
      
      if (!Array.isArray(rows)) {
        toast('Failed to load date range data', 'error');
        return;
      }
      
      const resultsDiv = $('salesDateRangeResults');
      resultsDiv.classList.remove('d-none');
      
      const totalCount = rows.length;
      const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;
      const highestAmount = totalCount > 0 ? Math.max(...rows.map(r => Number(r.amount || 0))) : 0;
      
      $('drSalesTotalCount').textContent = totalCount;
      $('drSalesTotalAmount').textContent = fmtMoney(totalAmount);
      $('drSalesAvgAmount').textContent = fmtMoney(avgAmount);
      $('drSalesHighestAmount').textContent = fmtMoney(highestAmount);
      
      const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      $('drSalesChartTitle').textContent = `Sales Trends: ${startFormatted} - ${endFormatted}`;
      
      renderSalesDateRangeChart(rows, startDate, endDate);
      
      window._salesDateRangeAllRows = rows;
      window._salesDateRangePage = 1;
      window._salesDateRangePageSize = 10;
      renderSalesDateRangePage();
      
      toast(`Loaded ${totalCount} transaction${totalCount !== 1 ? 's' : ''}`, 'success');
    }
    
    function renderSalesDateRangeChart(rows, startDate, endDate) {
      const canvas = $('salesDateRangeChart');
      if (!canvas) return;
      
      if (window._salesDateRangeChartInstance) {
        window._salesDateRangeChartInstance.destroy();
      }
      
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      const totals = {};
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateKey = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toDateString();
        totals[dateKey] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      rows.forEach(r => {
        const date = new Date(r.timestamp);
        const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString();
        if (Object.prototype.hasOwnProperty.call(totals, dateKey)) {
          totals[dateKey] += Number(r.amount || 0);
        }
      });
      
      const labels = Object.keys(totals);
      const dataPoints = labels.map(l => totals[l]);
      
      const formattedLabels = labels.map(dateStr => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      const theme = getThemeColors();
      
      const ctx = canvas.getContext('2d');
      window._salesDateRangeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: formattedLabels,
          datasets: [{
            label: 'Sales Amount',
            data: dataPoints,
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            borderColor: theme.danger || 'rgba(255, 59, 48, 1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: theme.danger || 'rgba(255, 59, 48, 1)',
            pointBorderColor: 'rgba(0,0,0,0)',
            pointRadius: 3.5,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: theme.danger || 'rgba(255, 59, 48, 1)',
            pointHoverBorderColor: 'rgba(0,0,0,0)'
          }]
        },
        options: {
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 600, easing: 'easeOutCubic' },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              backgroundColor: theme.surface2,
              borderColor: theme.border,
              borderWidth: 1,
              titleColor: theme.text,
              bodyColor: theme.text,
              padding: 10,
              callbacks: { 
                label: (ctx) => ` ${fmtMoney(ctx.parsed.y)}` 
              }
            }
          },
          scales: {
            x: { 
              ticks: { 
                color: theme.text,
                maxRotation: 45,
                minRotation: 0
              }, 
              grid: { color: theme.border } 
            },
            y: {
              ticks: { 
                color: theme.text,
                font: {
                  size: 11,
                  family: 'Segoe UI, Segoe UI Symbol, Arial Unicode MS, Noto Sans, system-ui, sans-serif'
                }, 
                callback: (v) => '₱' + Number(v).toLocaleString() 
              },
              grid: { color: theme.border }
            }
          }
        }
      });
    }
    
    function renderSalesDateRangePage(){
      const rows = window._salesDateRangeAllRows || [];
      const page = window._salesDateRangePage || 1;
      const pageSize = window._salesDateRangePageSize || 10;
      const tbody = $('salesDateRangeTbody');
      tbody.innerHTML = '';
      
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">No transactions found in this date range</td></tr>';
      } else {
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, rows.length);
        rows.slice(start, end).forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="text-secondary">${new Date(r.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            <td>${r.user_name || '-'}</td>
            <td>${r.item_name || '-'}</td>
            <td class="text-end fw-semibold">${fmtMoney(r.amount)}</td>
          `;
          tbody.appendChild(tr);
        });
      }
      
      const pageInfo = $('drSalesPageInfo');
      const prevBtn = $('drSalesPrevBtn');
      const nextBtn = $('drSalesNextBtn');
      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const startIdx = total ? (page - 1) * pageSize + 1 : 0;
      const endIdx = total ? Math.min(page * pageSize, total) : 0;
      if (pageInfo) pageInfo.textContent = `Showing ${startIdx}-${endIdx} of ${total}`;
      if (prevBtn) prevBtn.disabled = (page <= 1 || total === 0);
      if (nextBtn) nextBtn.disabled = (page >= totalPages || total === 0);
    }
    
    function prevSalesDateRangePage(){
      const total = (window._salesDateRangeAllRows || []).length;
      if (!total) return;
      if (window._salesDateRangePage > 1){
        window._salesDateRangePage -= 1;
        renderSalesDateRangePage();
      }
    }
    
    function nextSalesDateRangePage(){
      const rows = window._salesDateRangeAllRows || [];
      const pageSize = window._salesDateRangePageSize || 10;
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (window._salesDateRangePage < totalPages){
        window._salesDateRangePage += 1;
        renderSalesDateRangePage();
      }
    }
    
    function exportSalesDateRangeCSV(){
      const rows = window._salesDateRangeAllRows || [];
      if (!rows.length){
        toast('No data to export for this range', 'info');
        return;
      }
      const header = ['Date & Time','Student','Item','Amount'];
      const lines = [header.join(',')];
      rows.forEach(r => {
        const dt = new Date(r.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const student = (r.user_name || '-').toString().replace(/"/g,'""');
        const item = (r.item_name || '-').toString().replace(/"/g,'""');
        const amt = Number(r.amount || 0).toFixed(2);
        lines.push([`"${dt}"`,`"${student}"`,`"${item}"`,amt].join(','));
      });
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      const startVal = $('vendorSalesStartDate')?.value || 'start';
      const endVal = $('vendorSalesEndDate')?.value || 'end';
      a.href = URL.createObjectURL(blob);
      a.download = `sales_${startVal}_to_${endVal}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast('Exported CSV for selected range', 'success');
    }
    
    function wireVendorSalesTabHandlers(){
      const recentTab = document.getElementById('recent-sales-tab');
      const rangeTab = document.getElementById('daterange-sales-tab');
      const refreshBtn = document.querySelector('#salesDashboardTabs')?.closest('.card')?.querySelector('button.btn-outline-secondary');
      const hidePicker = () => {
        const picker = document.getElementById('vendorSalesDateRangePicker');
        if (picker) picker.style.display = 'none';
        document.removeEventListener('click', closeVendorSalesDatePickerOnClickOutside);
      };
      if (recentTab) recentTab.addEventListener('shown.bs.tab', hidePicker);
      if (rangeTab) rangeTab.addEventListener('shown.bs.tab', () => {
        hidePicker();
        const resultsDiv = document.getElementById('salesDateRangeResults');
        if (resultsDiv && resultsDiv.classList.contains('d-none')) {
          loadSalesByDateRange();
        }
      });
      if (refreshBtn) refreshBtn.addEventListener('click', hidePicker);
    }

    /* Staff: reloads + tap-to-top-up */
    function hexToRgba(hex, alpha=1){
      const m = hex.replace('#','');
      const bigint = parseInt(m.length===3 ? m.split('').map(c=>c+c).join('') : m, 16);
      const r = (bigint>>16)&255, g=(bigint>>8)&255, b=bigint&255;
      return `rgba(${r},${g},${b},${alpha})`;
    }
    function getThemeColors(){
      const cs = getComputedStyle(document.documentElement);
      const isDark = document.documentElement.classList.contains('theme-dark');
      
      // Ensure we get proper contrast for text in both themes
      const textColor = cs.getPropertyValue('--text').trim() || (isDark ? '#e6eef8' : '#0b1220');
      const mutedColor = cs.getPropertyValue('--text-muted').trim() || (isDark ? '#aeb8c4' : '#5b6472');
      const borderColor = cs.getPropertyValue('--border').trim() || (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)');
      const surface2Color = cs.getPropertyValue('--surface-2').trim() || (isDark ? 'rgba(16, 20, 26, 0.98)' : 'rgba(255,255,255,0.92)');
      
      return {
        text: textColor,
        muted: mutedColor,
        border: borderColor,
        surface2: surface2Color,
        accent: (cs.getPropertyValue('--accent').trim() || '#0A84FF'),
        accent2: (cs.getPropertyValue('--accent-2').trim() || '#34C759'),
        danger: (cs.getPropertyValue('--danger').trim() || '#FF3B30')
      };
    }
    async function doReload(){
      const uid = $("studentUid").value.trim();
      const amount = $("reloadAmount").value;
      const res = await fetch(API_BASE + "/reload", {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":"Bearer " + token },
        body: JSON.stringify({ rfid_uid: uid, amount })
      });
      const data = await res.json();
      if (data?.success){
        setAlert("reloadAlert", `Reload successful - New balance: ${fmtMoney(data.new_balance)}`, "success");
        loadReloads();
      } else {
        setAlert("reloadAlert", data?.error || "Reload failed", "danger");
      }
    }
    async function loadReloads(){
      const res = await fetch(API_BASE + "/reloads", { headers:{ "Authorization":"Bearer " + token }});
      const rows = await res.json();
      const tbody = $("reloadsTbody");
      tbody.innerHTML = "";
      
      // Check if rows is an array (successful response) or error object
      if (!Array.isArray(rows)) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to load reloads</td></tr>`;
        return;
      }
      
      const list = rows.slice(0,10);
      if (!list.length){
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-secondary">No data</td></tr>`;
      } else {
        let todayTotal = 0;
        const todayStr = new Date().toDateString();

        const now = new Date();
        const start7d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-6);
        let sevenDayTotal = 0;

        list.forEach(r=>{
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td class="text-secondary">${fmtTime(r.timestamp)}</td>
            <td>${r.student}</td>
            <td>${r.cashier || "-"}</td>
            <td class="text-end fw-semibold">${fmtMoney(r.amount)}</td>`;
          tbody.appendChild(tr);
        });

        // Calculate statistics
        let totalCount = rows.length;
        let totalAmount = 0;
        let highest = 0;

        rows.forEach(r=>{
          const amt = Number(r.amount||0);
          totalAmount += amt;
          if (amt > highest) highest = amt;
          
          const t = new Date(r.timestamp);
          if (t.toDateString() === todayStr) todayTotal += amt;
          if (t >= start7d) sevenDayTotal += amt;
        });

        const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;

        // Update KPI pills
        const kpiToday = $("reloadKpiToday");
        const kpi7d = $("reloadKpi7d");
        kpiToday.textContent = `Today: ${fmtMoney(todayTotal)}`;
        kpi7d.textContent = `7-day: ${fmtMoney(sevenDayTotal)}`;
        show(kpiToday); show(kpi7d);

        // Update stat cards
        if ($('recentTotalCount')) $('recentTotalCount').textContent = totalCount;
        if ($('recentTotalAmount')) $('recentTotalAmount').textContent = fmtMoney(totalAmount);
        if ($('recentAvgAmount')) $('recentAvgAmount').textContent = fmtMoney(avgAmount);
        if ($('recentHighestAmount')) $('recentHighestAmount').textContent = fmtMoney(highest);

        try {
          // Render chart based on current view
          if (currentReloadChartView === '24h') {
            renderReloadChart24Hour(rows);
          } else {
            renderReloadChart7Days(rows);
          }
        } catch(e){ console.error('Chart build failed', e); }
      }
    }
    
    function renderReloadChart24Hour(rows) {
      // Filter today's data
      const today = new Date();
      const todayStr = today.toDateString();
      const todayData = rows.filter(r => new Date(r.timestamp).toDateString() === todayStr);
      
      // Create 24-hour array (0-23)
      const hourlyTotals = new Array(24).fill(0);
      
      todayData.forEach(r => {
        const hour = new Date(r.timestamp).getHours();
        hourlyTotals[hour] += Number(r.amount || 0);
      });
      
      // Create hour labels (12 AM, 1 AM, ..., 11 PM)
      const labels = [];
      for (let i = 0; i < 24; i++) {
        if (i === 0) labels.push('12 AM');
        else if (i < 12) labels.push(`${i} AM`);
        else if (i === 12) labels.push('12 PM');
        else labels.push(`${i - 12} PM`);
      }
      
      // Update chart title
      const chartTitle = $("reloadChartTitle");
      if (chartTitle) {
        const dateStr = today.toLocaleDateString('en-US', { 
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        });
        chartTitle.textContent = `Hourly Reloads - ${dateStr}`;
      }
      
      const theme = getThemeColors();
      const canvas = document.getElementById('reloadChart');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
      gradient.addColorStop(0, hexToRgba(theme.accent2, 0.25));
      gradient.addColorStop(1, hexToRgba(theme.accent2, 0.05));

      if (window._reloadChartInstance) {
        const ch = window._reloadChartInstance;
        ch.data.labels = labels;
        ch.data.datasets[0].data = hourlyTotals;
        ch.data.datasets[0].borderColor = theme.accent2;
        ch.data.datasets[0].backgroundColor = gradient;
        ch.update();
      } else {
        window._reloadChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Reloads (₱)',
              data: hourlyTotals,
              backgroundColor: gradient,
              borderColor: theme.accent2,
              fill: true,
              tension: 0.35,
              pointRadius: 3,
              pointHoverRadius: 5,
              pointBackgroundColor: theme.accent2,
              pointHoverBackgroundColor: theme.accent2,
              pointBorderColor: 'rgba(0,0,0,0)',
              pointHoverBorderColor: 'rgba(0,0,0,0)'
            }]
          },
          options: {
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            animation: { duration: 600, easing: 'easeOutCubic' },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                backgroundColor: theme.surface2,
                borderColor: theme.border,
                borderWidth: 1,
                titleColor: theme.text,
                bodyColor: theme.text,
                padding: 10,
                callbacks: { label: (ctx) => ` ${fmtMoney(ctx.parsed.y)}` }
              }
            },
            scales: {
              x: { ticks: { color: theme.text }, grid: { color: theme.border } },
              y: {
                ticks: { 
                  color: theme.text, 
                  font: { family: 'Segoe UI Symbol, Arial Unicode MS, Noto Sans Symbols, Noto Sans, Arial, sans-serif' },
                  callback: (v) => '₱' + Number(v).toLocaleString() 
                },
                grid: { color: theme.border }
              }
            }
          }
        });
      }
    }
    
    function renderReloadChart7Days(rows) {
      const daysBack = 7;
      const totals = {};
      for (let i=0;i<daysBack;i++){
        const d = new Date(); d.setDate(d.getDate()-i);
        totals[new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString()] = 0;
      }
      rows.forEach(r=>{
        const d = new Date(new Date(r.timestamp).getFullYear(), new Date(r.timestamp).getMonth(), new Date(r.timestamp).getDate()).toDateString();
        if (Object.prototype.hasOwnProperty.call(totals, d)) totals[d] += Number(r.amount||0);
      });

      const labels = Object.keys(totals).reverse();
      const dataPoints = labels.map(l=>totals[l]);
      
      // Update chart title
      const chartTitle = $("reloadChartTitle");
      if (chartTitle) {
        chartTitle.textContent = 'Reload Trends - Last 7 Days';
      }

      const theme = getThemeColors();
      const canvas = document.getElementById('reloadChart');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0,0,0,canvas.height);
      gradient.addColorStop(0, hexToRgba(theme.accent2, 0.25));
      gradient.addColorStop(1, hexToRgba(theme.accent2, 0.05));

      if (window._reloadChartInstance) {
        const ch = window._reloadChartInstance;
        ch.data.labels = labels;
        ch.data.datasets[0].data = dataPoints;
        ch.data.datasets[0].borderColor = theme.accent2;
        ch.data.datasets[0].backgroundColor = gradient;
        ch.update();
      } else {
        window._reloadChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Reloads (₱)',
              data: dataPoints,
              backgroundColor: gradient,
              borderColor: theme.accent2,
              fill: true,
              tension: 0.35,
              pointRadius: 3,
              pointHoverRadius: 5,
              pointBackgroundColor: theme.accent2,
              pointHoverBackgroundColor: theme.accent2,
              pointBorderColor: 'rgba(0,0,0,0)',
              pointHoverBorderColor: 'rgba(0,0,0,0)'
            }]
          },
          options: {
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            animation: { duration: 600, easing: 'easeOutCubic' },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                backgroundColor: theme.surface2,
                borderColor: theme.border,
                borderWidth: 1,
                titleColor: theme.text,
                bodyColor: theme.text,
                padding: 10,
                callbacks: { label: (ctx) => ` ${fmtMoney(ctx.parsed.y)}` }
              }
            },
            scales: {
              x: { ticks: { color: theme.text }, grid: { color: theme.border } },
              y: {
                ticks: { 
                  color: theme.text, 
                  font: { family: 'Segoe UI Symbol, Arial Unicode MS, Noto Sans Symbols, Noto Sans, Arial, sans-serif' },
                  callback: (v) => '₱' + Number(v).toLocaleString() 
                },
                grid: { color: theme.border }
              }
            }
          }
        });
      }
    }
    // Wrapper function for backward compatibility
    function refreshChartStyles() {
      debouncedRefreshChartStyles();
    }

    async function downloadReport(){
      const res = await fetch(API_BASE + "/report/csv", { headers:{ "Authorization":"Bearer " + token }});
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href:url, download:"transactions.csv" });
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast("Transactions CSV downloaded", "info");
    }
    async function downloadReloads(){
      const res = await fetch(API_BASE + "/reloads/csv", { headers:{ "Authorization":"Bearer " + token }});
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href:url, download:"reloads.csv" });
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      toast("Reloads CSV downloaded", "info");
    }
    
    // Date Range Functions for Staff Reload Dashboard
    async function loadReloadsByDateRange() {
      const startDateInput = $('staffReloadStartDate');
      const endDateInput = $('staffReloadEndDate');
      
      if (!startDateInput.value || !endDateInput.value) {
        toast('Please select both start and end dates', 'warning');
        return;
      }
      
      const startDate = new Date(startDateInput.value);
      const endDate = new Date(endDateInput.value);
      
      if (startDate > endDate) {
        toast('Start date must be before end date', 'warning');
        return;
      }
      
      // Fetch reloads with date range
      const params = new URLSearchParams({
        start_date: startDateInput.value,
        end_date: endDateInput.value
      });
      
      const res = await fetch(API_BASE + "/reloads?" + params, { 
        headers:{ "Authorization":"Bearer " + token }
      });
      const rows = await res.json();
      
      if (!Array.isArray(rows)) {
        toast('Failed to load date range data', 'error');
        return;
      }
      
      // Show results section
      const resultsDiv = $('dateRangeResults');
      resultsDiv.classList.remove('d-none');
      
      // Calculate statistics
      const totalCount = rows.length;
      const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;
      const highestAmount = totalCount > 0 ? Math.max(...rows.map(r => Number(r.amount || 0))) : 0;
      
      // Update KPI cards
      $('drTotalCount').textContent = totalCount;
      $('drTotalAmount').textContent = fmtMoney(totalAmount);
      $('drAvgAmount').textContent = fmtMoney(avgAmount);
      $('drHighestAmount').textContent = fmtMoney(highestAmount);
      
      // Update chart title
      const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      $('drChartTitle').textContent = `Reload Trends: ${startFormatted} - ${endFormatted}`;
      
      // Render chart
      renderDateRangeChart(rows, startDate, endDate);
      
      // Store rows and render first page (pagination)
      window._dateRangeAllRows = rows;
      window._dateRangePage = 1;
      window._dateRangePageSize = 10;
      renderDateRangePage();
      
      toast(`Loaded ${totalCount} transaction${totalCount !== 1 ? 's' : ''}`, 'success');
    }
    
    function renderDateRangeChart(rows, startDate, endDate) {
      const canvas = $('dateRangeChart');
      if (!canvas) return;
      
      // Destroy existing chart
      if (window._dateRangeChartInstance) {
        window._dateRangeChartInstance.destroy();
      }
      
      // Calculate number of days in range
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // Create date-keyed totals object
      const totals = {};
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateKey = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toDateString();
        totals[dateKey] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Sum amounts by date
      rows.forEach(r => {
        const date = new Date(r.timestamp);
        const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString();
        if (Object.prototype.hasOwnProperty.call(totals, dateKey)) {
          totals[dateKey] += Number(r.amount || 0);
        }
      });
      
      // Prepare labels and data
      const labels = Object.keys(totals);
      const dataPoints = labels.map(l => totals[l]);
      
      // Format labels based on range length
      const formattedLabels = labels.map(dateStr => {
        const d = new Date(dateStr);
        if (daysDiff <= 7) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      });
      
  // Get current theme colors
  const theme = getThemeColors();
      
      // Create chart
      const ctx = canvas.getContext('2d');
      window._dateRangeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: formattedLabels,
          datasets: [{
            label: 'Reload Amount',
            data: dataPoints,
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            borderColor: theme.success || 'rgba(40, 167, 69, 1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: theme.success || 'rgba(40, 167, 69, 1)',
            pointBorderColor: 'rgba(0,0,0,0)',
            pointRadius: 3.5,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: theme.success || 'rgba(40, 167, 69, 1)',
            pointHoverBorderColor: 'rgba(0,0,0,0)'
          }]
        },
        options: {
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 600, easing: 'easeOutCubic' },
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              backgroundColor: theme.surface2,
              borderColor: theme.border,
              borderWidth: 1,
              titleColor: theme.text,
              bodyColor: theme.text,
              padding: 10,
              callbacks: { 
                label: (ctx) => ` ${fmtMoney(ctx.parsed.y)}` 
              }
            }
          },
          scales: {
            x: { 
              ticks: { 
                color: theme.text,
                maxRotation: 45,
                minRotation: 0
              }, 
              grid: { color: theme.border } 
            },
            y: {
              ticks: { 
                color: theme.text,
                font: {
                  size: 11,
                  family: 'Segoe UI, Segoe UI Symbol, Arial Unicode MS, Noto Sans, system-ui, sans-serif'
                }, 
                callback: (v) => '₱' + Number(v).toLocaleString() 
              },
              grid: { color: theme.border }
            }
          }
        }
      });
    }
    
    // Pagination + Export for Date Range Results
    function renderDateRangePage(){
      const rows = window._dateRangeAllRows || [];
      const page = window._dateRangePage || 1;
      const pageSize = window._dateRangePageSize || 10;
      const tbody = $('dateRangeTbody');
      tbody.innerHTML = '';
      
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">No transactions found in this date range</td></tr>';
      } else {
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, rows.length);
        rows.slice(start, end).forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="text-secondary">${new Date(r.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            <td>${r.student}</td>
            <td>${r.cashier || '-'}</td>
            <td class="text-end fw-semibold">${fmtMoney(r.amount)}</td>
          `;
          tbody.appendChild(tr);
        });
      }
      
      // Update pagination UI
      const pageInfo = $('drPageInfo');
      const prevBtn = $('drPrevBtn');
      const nextBtn = $('drNextBtn');
      const total = rows.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const startIdx = total ? (page - 1) * pageSize + 1 : 0;
      const endIdx = total ? Math.min(page * pageSize, total) : 0;
      if (pageInfo) pageInfo.textContent = `Showing ${startIdx}-${endIdx} of ${total}`;
      if (prevBtn) prevBtn.disabled = (page <= 1 || total === 0);
      if (nextBtn) nextBtn.disabled = (page >= totalPages || total === 0);
    }
    function prevDateRangePage(){
      const total = (window._dateRangeAllRows || []).length;
      if (!total) return;
      if (window._dateRangePage > 1){
        window._dateRangePage -= 1;
        renderDateRangePage();
      }
    }
    function nextDateRangePage(){
      const rows = window._dateRangeAllRows || [];
      const pageSize = window._dateRangePageSize || 10;
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (window._dateRangePage < totalPages){
        window._dateRangePage += 1;
        renderDateRangePage();
      }
    }
    function exportDateRangeCSV(){
      const rows = window._dateRangeAllRows || [];
      if (!rows.length){
        toast('No data to export for this range', 'info');
        return;
      }
      const header = ['Date & Time','Student','Cashier','Amount'];
      const lines = [header.join(',')];
      rows.forEach(r => {
        const dt = new Date(r.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const student = (r.student || '').toString().replace(/"/g,'""');
        const cashier = (r.cashier || '-').toString().replace(/"/g,'""');
        const amt = Number(r.amount || 0).toFixed(2);
        lines.push([`"${dt}"`,`"${student}"`,`"${cashier}"`,amt].join(','));
      });
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      const startVal = $('staffReloadStartDate')?.value || 'start';
      const endVal = $('staffReloadEndDate')?.value || 'end';
      a.href = URL.createObjectURL(blob);
      a.download = `reloads_${startVal}_to_${endVal}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast('Exported CSV for selected range', 'success');
    }
    
    // Staff Reload Date Range Picker State
    const staffReloadDateRangeState = {
      currentMonth: new Date(),
      startDate: null,
      endDate: null,
      tempStartDate: null,
      tempEndDate: null
    };
    
    // Initialize date range with TODAY by default
    function initializeDateRangeInputs() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(today);
      // Default to single-day range (today)
      staffReloadDateRangeState.startDate = startDate;
      staffReloadDateRangeState.endDate = today;
      staffReloadDateRangeState.tempStartDate = startDate;
      staffReloadDateRangeState.tempEndDate = today;
      
      // Update hidden inputs
      $('staffReloadStartDate').value = formatDateForInput(startDate);
      $('staffReloadEndDate').value = formatDateForInput(today);
      
      // Update display text
      updateStaffReloadDateRangeText();
    }
    
    function toggleStaffReloadDatePicker(e) {
      if (e) e.stopPropagation();
      const picker = $("staffReloadDateRangePicker");
      if (picker.style.display === "none" || !picker.style.display) {
        picker.style.display = "block";
        // Initialize temp dates with current selection
        staffReloadDateRangeState.tempStartDate = staffReloadDateRangeState.startDate;
        staffReloadDateRangeState.tempEndDate = staffReloadDateRangeState.endDate;
        
        // Set current month to start date or today
        if (staffReloadDateRangeState.startDate) {
          staffReloadDateRangeState.currentMonth = new Date(staffReloadDateRangeState.startDate);
        } else {
          staffReloadDateRangeState.currentMonth = new Date();
        }
        renderStaffReloadCalendar();
        
        // Close picker when clicking outside
        setTimeout(() => {
          document.addEventListener('click', closeStaffReloadDatePickerOnClickOutside);
        }, 0);
      } else {
        picker.style.display = "none";
        document.removeEventListener('click', closeStaffReloadDatePickerOnClickOutside);
      }
    }
    
    function closeStaffReloadDatePickerOnClickOutside(e) {
      const picker = $("staffReloadDateRangePicker");
      const wrapper = picker.closest('.date-range-picker-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        picker.style.display = "none";
        document.removeEventListener('click', closeStaffReloadDatePickerOnClickOutside);
      }
    }
    
    function changeStaffReloadMonth(direction) {
      event.stopPropagation();
      staffReloadDateRangeState.currentMonth = new Date(
        staffReloadDateRangeState.currentMonth.getFullYear(),
        staffReloadDateRangeState.currentMonth.getMonth() + direction,
        1
      );
      renderStaffReloadCalendar();
    }
    
    function renderStaffReloadCalendar() {
      const { currentMonth, tempStartDate, tempEndDate } = staffReloadDateRangeState;
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Update month/year display
      $("staffReloadCurrentMonthYear").textContent = currentMonth.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      // Get first day of month and total days
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const daysContainer = $("staffReloadCalendarDays");
      daysContainer.innerHTML = "";
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Empty cells for days before month starts
      for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "day empty";
        daysContainer.appendChild(emptyDay);
      }
      
      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        
        const dayEl = document.createElement("div");
        dayEl.className = "day";
        dayEl.textContent = day;
        
        // Check if it's today
        if (date.getTime() === today.getTime()) {
          dayEl.classList.add("today");
        }
        
        // Check if disabled (future dates)
        if (date > today) {
          dayEl.classList.add("disabled");
        } else {
          // Check selection state
          if (tempStartDate && date.getTime() === tempStartDate.getTime()) {
            dayEl.classList.add("start-date", "selected");
          }
          if (tempEndDate && date.getTime() === tempEndDate.getTime()) {
            dayEl.classList.add("end-date", "selected");
          }
          if (tempStartDate && tempEndDate && 
              date > tempStartDate && date < tempEndDate) {
            dayEl.classList.add("in-range");
          }
          
          dayEl.onclick = () => selectStaffReloadDate(date, dayEl);
        }
        
        daysContainer.appendChild(dayEl);
      }
    }
    
    function selectStaffReloadDate(date, element) {
      event.stopPropagation(); // Prevent calendar from closing
      
      const { tempStartDate, tempEndDate } = staffReloadDateRangeState;
      
      // If clicking on already selected start date, clear selection
      if (tempStartDate && date.getTime() === tempStartDate.getTime()) {
        staffReloadDateRangeState.tempStartDate = null;
        staffReloadDateRangeState.tempEndDate = null;
      }
      // If no start date or clicking before start date, set as start
      else if (!tempStartDate || date < tempStartDate) {
        staffReloadDateRangeState.tempStartDate = date;
        staffReloadDateRangeState.tempEndDate = null;
      }
      // If start date exists but no end date, set as end
      else if (tempStartDate && !tempEndDate) {
        staffReloadDateRangeState.tempEndDate = date;
      }
      // If both dates exist, start new selection
      else {
        staffReloadDateRangeState.tempStartDate = date;
        staffReloadDateRangeState.tempEndDate = null;
      }
      
      renderStaffReloadCalendar();
    }
    
    function applyStaffReloadDateRange() {
      event.stopPropagation();
      const { tempStartDate, tempEndDate } = staffReloadDateRangeState;
      
      if (!tempStartDate) {
        toast("Please select a start date", "warning");
        return;
      }
      
      // Apply selection
      staffReloadDateRangeState.startDate = tempStartDate;
      staffReloadDateRangeState.endDate = tempEndDate || tempStartDate;
      
      // Update hidden inputs
      $("staffReloadStartDate").value = formatDateForInput(staffReloadDateRangeState.startDate);
      $("staffReloadEndDate").value = formatDateForInput(staffReloadDateRangeState.endDate);
      
      // Update display text
      updateStaffReloadDateRangeText();
      
      // Close picker
      $("staffReloadDateRangePicker").style.display = "none";
      document.removeEventListener('click', closeStaffReloadDatePickerOnClickOutside);
      
      // Auto-load data
      loadReloadsByDateRange();
    }
    
    function cancelStaffReloadDateRange() {
      event.stopPropagation();
      // Restore previous selection
      staffReloadDateRangeState.tempStartDate = staffReloadDateRangeState.startDate;
      staffReloadDateRangeState.tempEndDate = staffReloadDateRangeState.endDate;
      
      // Close picker
      $("staffReloadDateRangePicker").style.display = "none";
      document.removeEventListener('click', closeStaffReloadDatePickerOnClickOutside);
    }
    
    function updateStaffReloadDateRangeText() {
      const { startDate, endDate } = staffReloadDateRangeState;
      const textEl = $("staffReloadDateRangeText");
      
      if (!startDate) {
        textEl.textContent = "Select date range";
        return;
      }
      
      const formatOptions = { month: 'short', day: 'numeric' };
      const startStr = startDate.toLocaleDateString('en-US', formatOptions);
      
      if (!endDate || endDate.getTime() === startDate.getTime()) {
        textEl.textContent = startStr;
      } else {
        const endStr = endDate.toLocaleDateString('en-US', formatOptions);
        
        // Format as "Oct 20 – Oct 28" (with en dash)
        if (startDate.getMonth() === endDate.getMonth()) {
          textEl.textContent = `${startDate.toLocaleDateString('en-US', { month: 'short' })} ${startDate.getDate()} – ${endDate.getDate()}`;
        } else {
          textEl.textContent = `${startStr} – ${endStr}`;
        }
      }
    }

    // Ensure picker closes on tab switch or refresh
    function wireStaffReloadTabHandlers(){
      const recentTab = document.getElementById('recent-tab');
      const rangeTab = document.getElementById('daterange-tab');
      const refreshBtn = document.querySelector('#reloadDashboardTabs')?.closest('.card')?.querySelector('button.btn-outline-secondary');
      const hidePicker = () => {
        const picker = document.getElementById('staffReloadDateRangePicker');
        if (picker) picker.style.display = 'none';
        document.removeEventListener('click', closeStaffReloadDatePickerOnClickOutside);
      };
      if (recentTab) recentTab.addEventListener('shown.bs.tab', hidePicker);
      if (rangeTab) rangeTab.addEventListener('shown.bs.tab', () => {
        hidePicker();
        // Auto-load data for current selection (defaults to Today)
        const resultsDiv = document.getElementById('dateRangeResults');
        if (resultsDiv && resultsDiv.classList.contains('d-none')) {
          loadReloadsByDateRange();
        }
      });
      if (refreshBtn) refreshBtn.addEventListener('click', hidePicker);
    }

    /* Settings (top-right) */
    function bsModal(id){ return new bootstrap.Modal(document.getElementById(id)); }
    function openRegisterModal(){
      // Reset password rules display
      ["regRuleLen", "regRuleUpper", "regRuleNum", "regRuleSpec"].forEach(id => {
        $(id).className = "";
      });
      // Initialize event listeners
      initRegisterModal();
      bsModal('registerModal').show();
    }
    function openTopupModal(){
      bsModal('topupModal').show();
    }
    function openSaleModal(){
      // Reset sale state (preserve menuItems)
      const menuItems = posState.sale.menuItems || [];
      // Preserve existing cart if present, or initialize a new empty cart
      const existingCart = (posState && posState.sale && posState.sale.cart) ? posState.sale.cart : { orderId: null, items: [], total: 0 };
      posState.sale = { 
        amount: '', 
        itemId: '', 
        itemName: '', 
        pendingId: null, 
        interval: null, 
        pollCount: 0, 
        isCustomItem: false, 
        isMenuItemSelected: false,
        menuItems: menuItems,
        cart: existingCart
      };
      
      // Reset UI - guard against missing elements
      const itemSearch = $('posSaleItemSearch');
      const amount = $('posSaleAmount');
      const qty = $('posSaleQty');
      const dropdown = $('posSaleDropdown');
      
      if (itemSearch) itemSearch.value = '';
      if (amount) amount.value = '';
      if (qty) qty.value = '1';
      if (dropdown) dropdown.style.display = 'none';
      
      // Enable keypad by default
      enableSaleKeypad(true);
      
  // Render cart on modal open (defensive if cart not initialized for any reason)
  try { posRenderCart(); } catch (e) { console.warn('posRenderCart failed on open:', e); }
      
      posShowStep('sale', 1);
      bsModal('saleModal').show();
    }
    async function openSettings(){
      // Defensive check: ensure modal element exists
      const modalEl = document.getElementById('settingsModal');
      if (!modalEl) {
        console.error('Settings modal element not found');
        toast('Settings unavailable. Please refresh the page.', 'error');
        return;
      }

      // Fill common info
      $("settingsRole").textContent = (userRole || "—");
      $("settingsUsername").textContent = (localStorage.getItem("username") || "—");
      
      // Set User ID from token or student profile
      if (studentProfile && studentProfile.user_id) {
        $("settingsUserId").textContent = studentProfile.user_id;
      } else if (token) {
        // Try to decode user_id from token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          $("settingsUserId").textContent = payload.user_id || "—";
        } catch (e) {
          $("settingsUserId").textContent = "—";
        }
      } else {
        $("settingsUserId").textContent = "—";
      }

      if (userRole === 'student'){
        // Fetch profile for student
        try{
          const res = await fetch(API_BASE + "/student/me", { headers:{ "Authorization":"Bearer " + token }});
          const data = await res.json();
          studentProfile = data;

          $("settingsName").textContent = data.name || "—";
          $("settingsRfid").textContent = data.rfid_uid || "Not linked";

          const locked = !!data.card_locked;
          const pill = $("settingsLockState");
          pill.innerHTML = locked
            ? `<i class="bi bi-shield-lock"></i><span>Locked</span>`
            : `<i class="bi bi-shield-check"></i><span>Unlocked</span>`;
          pill.className = `pill ${locked ? 'pill-info' : ''}`;

          const lockBtn = $("settingsLockBtn");
          lockBtn.innerHTML = locked
            ? `<i class="bi bi-unlock me-1"></i> Unlock Card`
            : `<i class="bi bi-lock me-1"></i> Lock Card`;

          hide($("settingsPwdDisabled"));
          show($("settingsPwdArea"));
          show($("settingsStudentOnly"));
        }catch(e){
          toast("Failed to load profile", "error");
        }
      } else {
        // Non-students: no password/lock controls
        show($("settingsPwdDisabled"));
        hide($("settingsPwdArea"));
        hide($("settingsStudentOnly"));
      }

      // Set sound toggle state
      const soundToggle = $('soundToggle');
      if (soundToggle) {
        soundToggle.checked = SoundEffects.enabled;
        soundToggle.onchange = function() {
          SoundEffects.toggle();
          toast(SoundEffects.enabled ? 'Sound effects enabled' : 'Sound effects disabled', 'info');
        };
      }

      // Defer modal show to ensure Bootstrap is fully initialized
      requestAnimationFrame(() => {
        try {
          bsModal('settingsModal').show();
        } catch (e) {
          console.error('Failed to show settings modal:', e);
          toast('Failed to open settings. Please try again.', 'error');
        }
      });
    }

    async function toggleCardLock(){
      if (userRole !== 'student') return;
      try{
        const locked = !!(studentProfile?.card_locked);
        const url = locked ? "/student/card/unlock" : "/student/card/lock";
        const res = await fetch(API_BASE + url, { method:"POST", headers:{ "Authorization":"Bearer "+token }});
        const data = await res.json();
        if (data?.ok){
          toast(locked ? "Card unlocked" : "Card locked", "success");
          // refresh settings view
          openSettings();
        } else {
          setAlert("settingsPwdAlert", data.error || "Failed to toggle card lock", "danger");
        }
      }catch(e){
        setAlert("settingsPwdAlert", "Network error", "danger");
      }
    }

    function openChangePasswordModal() {
      if (userRole !== 'student') {
        toast('Password changes are available for student accounts only.', 'warning');
        return;
      }
      
      // Clear previous inputs and alerts
      $("changePwdCurrent").value = "";
      $("changePwdNew").value = "";
      $("changePwdConfirm").value = "";
      hide($("changePwdAlert"));
      
      // Get the settings modal element
      const settingsModalEl = document.getElementById('settingsModal');
      const settingsModal = bootstrap.Modal.getInstance(settingsModalEl);
      
      if (settingsModal) {
        // Modal is open, hide it first and wait for it to fully close
        settingsModalEl.addEventListener('hidden.bs.modal', function openChangePwd() {
          // Remove this listener after it fires once
          settingsModalEl.removeEventListener('hidden.bs.modal', openChangePwd);
          
          // Now show the change password modal
          const changePwdModal = bsModal('changePasswordModal');
          changePwdModal.show();
          
          // Add listener to return to settings when change password modal closes
          const changePwdModalEl = document.getElementById('changePasswordModal');
          changePwdModalEl.addEventListener('hidden.bs.modal', function returnToSettings() {
            changePwdModalEl.removeEventListener('hidden.bs.modal', returnToSettings);
            bsModal('settingsModal').show();
          });
        });
        
        // Trigger the hide
        settingsModal.hide();
      } else {
        // Settings modal not open, just show change password modal
        const changePwdModal = bsModal('changePasswordModal');
        changePwdModal.show();
      }
    }

    async function changeMyPassword(){
      if (userRole !== 'student'){ setAlert("changePwdAlert", "Only students can change password here.", "warning"); return; }
      const cur = $("changePwdCurrent").value;
      const n1  = $("changePwdNew").value;
      const n2  = $("changePwdConfirm").value;
      
      if (!cur || !n1 || !n2){ setAlert("changePwdAlert", "Please fill all fields", "warning"); return; }
      if (n1 !== n2){ setAlert("changePwdAlert", "New passwords do not match", "danger"); return; }
      if (n1.length < 8){ setAlert("changePwdAlert", "New password must be at least 8 characters", "warning"); return; }
      
      // Check for uppercase letter
      if (!/[A-Z]/.test(n1)) { setAlert("changePwdAlert", "Password must contain at least 1 uppercase letter", "warning"); return; }
      
      // Check for special character
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(n1)) { setAlert("changePwdAlert", "Password must contain at least 1 special character", "warning"); return; }

      try{
        const res = await fetch(API_BASE + "/student/password", {
          method:"PUT",
          headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+token },
          body: JSON.stringify({ current_password: cur, new_password: n1 })
        });
        const data = await res.json();
        if (data?.success){
          SoundEffects.success(); // Play success sound
          setAlert("changePwdAlert", "Password updated successfully!", "success");
          $("changePwdCurrent").value = $("changePwdNew").value = $("changePwdConfirm").value = "";
          
          // Close modal after 1.5 seconds
          setTimeout(() => {
            bsModal('changePasswordModal').hide();
          }, 1500);
        } else {
          SoundEffects.error(); // Play error sound
          setAlert("changePwdAlert", data.error || "Password update failed", "danger");
        }
      }catch(e){
        setAlert("changePwdAlert", "Network error", "danger");
      }
    }
    
    // Expose settings-related functions globally
    window.openSettings = openSettings;
    window.toggleCardLock = toggleCardLock;
    window.openChangePasswordModal = openChangePasswordModal;
    window.changeMyPassword = changeMyPassword;

    /* Staff — Register & Pair */
    let staffPairInterval = null;
    let staffPairDeadline = null;

    // Wire up registration modal events when opened
    function initRegisterModal() {
      // Password visibility toggle
      $("toggleRegPasswordVisibility").onclick = () => {
        const passInput = $("regPassword");
        const icon = $("regPasswordToggleIcon");
        if (passInput.type === "password") {
          passInput.type = "text";
          icon.className = "bi bi-eye-slash";
        } else {
          passInput.type = "password";
          icon.className = "bi bi-eye";
        }
      };
      
      // Live password validation
      $("regPassword").oninput = () => {
        const val = $("regPassword").value;
        $("regRuleLen").className = val.length >= 8 ? "ok" : "bad";
        $("regRuleUpper").className = /[A-Z]/.test(val) ? "ok" : "bad";
        $("regRuleNum").className = /\d/.test(val) ? "ok" : "bad";
        $("regRuleSpec").className = /[^A-Za-z0-9]/.test(val) ? "ok" : "bad";
      };
    }

    async function registerUser(){
      const name = $("regName").value.trim();
      const username = $("regUsername").value.trim();
      const role = $("regRole").value;
      const password = $("regPassword").value;
      
      if (!name || !username || !password){ 
        setAlert("regAlert", "Name, username and password are required", "warning"); 
        return; 
      }
      
      // Validate password requirements
      const passOk = password.length >= 8 && 
                     /[A-Z]/.test(password) && 
                     /\d/.test(password) && 
                     /[^A-Za-z0-9]/.test(password);
      if (!passOk) {
        setAlert("regAlert", "Password does not meet requirements (min 8 chars, 1 uppercase, 1 number, 1 special)", "danger");
        return;
      }

      try{
        const res = await fetch(API_BASE + "/register", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ name, username, role, password })
        });
        const data = await res.json();
        if (data?.user_id){
          setAlert("regAlert", `User created successfully (ID: ${data.user_id}).`, "success");
          
          // Clear form
          $("regPassword").value = "";
          $("regName").value = "";
          $("regUsername").value = "";
          
          // Reset password rules
          ["regRuleLen", "regRuleUpper", "regRuleNum", "regRuleSpec"].forEach(id => {
            $(id).className = "";
          });
          
          if ($("regAutoPair").checked){
            // Close register modal and open pairing modal
            bootstrap.Modal.getInstance($("registerModal")).hide();
            setTimeout(() => {
              openPairingModal(data.user_id);
            }, 300);
          }
        } else {
          setAlert("regAlert", data.error || "Registration failed", "danger");
        }
      }catch(e){
        setAlert("regAlert", "Network error during registration", "danger");
      }
    }
    
    // Open dedicated pairing modal
    function openPairingModal(userId) {
      // Reset states
      show($("tapWaiting"));
      hide($("tapSuccess"));
      hide($("tapError"));
      
      // Open modal
      bsModal("rfidPairingModal").show();
      
      // Start pairing
      staffStartPairingForUser(userId);
    }
    
    function closePairingModal() {
      if (staffPairInterval) {
        clearInterval(staffPairInterval);
        staffPairInterval = null;
      }
      bootstrap.Modal.getInstance($("rfidPairingModal")).hide();
    }
    
    function retryPairing() {
      // Get the last user ID from the current context
      const userId = lastCreatedUserId || (adminCurrentUser && adminCurrentUser.user_id);
      if (userId) {
        hide($("tapError"));
        show($("tapWaiting"));
        staffStartPairingForUser(userId);
      } else {
        closePairingModal();
        toast("Unable to retry - user ID not found", "error");
      }
    }
    
    async function staffStartPairingExisting(){
      const uid = $("pairUserId").value.trim();
      if (!uid){ setAlert("pairExistingAlert", "Enter a User ID", "warning"); return; }
      
      // Open pairing modal for existing user
      openPairingModal(uid);
    }
    
    async function staffStartPairingForUser(userId, isExistingUser = false){
      try{
        const res = await fetch(API_BASE + "/rfid/link/start", {
          method:"POST",
          headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+token },
          body: JSON.stringify({ user_id: Number(userId) })
        });
        const data = await res.json();
        if (!(data?.success && data?.pending_id)){
          // Show error in modal
          hide($("tapWaiting"));
          show($("tapError"));
          $("errorMessage").textContent = data.error || "Could not start pairing";
          return;
        }
        
        const ttl = Number(data.ttl_seconds || 120);
        staffPairDeadline = Date.now() + ttl*1000;
        
        // Update timer
        $("tapTimer").textContent = ttl;

        if (staffPairInterval) clearInterval(staffPairInterval);
        staffPairInterval = setInterval(async ()=>{
          const res2 = await fetch(API_BASE + "/rfid/link/status/" + data.pending_id, {
            headers:{ "Authorization":"Bearer "+token }
          });
          const s = await res2.json();
          const remaining = Math.max(0, Math.ceil((staffPairDeadline - Date.now())/1000));
          
          // Update countdown timer
          $("tapTimer").textContent = remaining;
          
          if (s.confirmed){
            clearInterval(staffPairInterval);
            staffPairInterval = null;
            
            // Play success sound
            SoundEffects.complete();
            
            // Show success
            hide($("tapWaiting"));
            show($("tapSuccess"));
            
            // Display RFID UID if available
            const cardUID = s.rfid || s.uid || 'XXXX-XXXX';
            $("successCardUID").textContent = cardUID;
            $("successCardInfo").textContent = `The card has been successfully linked to the account`;
            
            // Reload admin users if in admin panel
            if (typeof adminLoadAllUsers === 'function') {
              setTimeout(() => adminLoadAllUsers(), 500);
            }
            
            // Auto-close modal after 3 seconds
            setTimeout(() => {
              closePairingModal();
              toast("RFID card linked successfully!", "success");
            }, 3000);
            
          } else if (s.failed || s.expired || remaining<=0){
            clearInterval(staffPairInterval);
            staffPairInterval = null;
            
            // Show error
            hide($("tapWaiting"));
            show($("tapError"));
            $("errorMessage").textContent = s.failed ? 
              (s.error || "Pairing failed - this card may already be linked to another user") : 
              "Pairing expired. Please try again.";
          }
        }, 1000);
      }catch(e){
        hide($("tapWaiting"));
        show($("tapError"));
        $("errorMessage").textContent = "Network error while starting pairing";
      }
    }

    /* Student: balance/tx/reloads */
    async function loadMyBalance(){
      try {
        const res = await fetch(API_BASE + "/student/me", { headers:{ "Authorization":"Bearer " + token }});
        if (!res.ok) {
          const msg = await safeReadError(res);
          console.warn("loadMyBalance failed:", res.status, msg);
          toast(`Balance load failed (${res.status})${msg ? ": " + msg : ""}`, "error");
          return;
        }
        const data = await res.json();
        $("balanceValue").textContent = fmtMoney(data.balance || 0);
      } catch (e) {
        console.error("loadMyBalance error", e);
        toast("Network error loading balance", "error");
      }
    }
    // In-memory store for student lists (max 25)
    let _studentTx = [];
    let _studentTxPage = 1;
    let _studentReloads = [];
    let _studentReloadsPage = 1;

    const STUDENT_PAGE_SIZE = 5;
    const STUDENT_MAX_ITEMS = 25;

    function updatePaginationControls(prefix, page, total) {
      const pages = Math.max(1, Math.min(5, Math.ceil(total / STUDENT_PAGE_SIZE)));
      const container = $(prefix + 'Pagination');
      const prevBtn = $(prefix + 'PrevBtn');
      const nextBtn = $(prefix + 'NextBtn');
      const info = $(prefix + 'PageInfo');
      if (!container || !prevBtn || !nextBtn || !info) return;
      if (total === 0) {
        container.classList.add('d-none');
        return;
      }
      container.classList.remove('d-none');
      prevBtn.disabled = page <= 1;
      nextBtn.disabled = page >= pages;
      const start = (page - 1) * STUDENT_PAGE_SIZE + 1;
      const end = Math.min(page * STUDENT_PAGE_SIZE, total);
      info.textContent = `Showing ${start}–${end} of ${total}`;
    }

    function renderStudentTxPage(page){
      const tbody = $("myTxTbody");
      if (!tbody) return;
      tbody.innerHTML = "";
      const total = _studentTx.length;
      const pages = Math.max(1, Math.min(5, Math.ceil(total / STUDENT_PAGE_SIZE)));
      _studentTxPage = Math.max(1, Math.min(page, pages));
      if (total === 0){
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-secondary py-4"><i class="bi bi-inbox fs-4 d-block mb-2"></i><div class="small">No transactions yet</div></td></tr>`;
        updatePaginationControls('myTx', 1, 0);
        return;
      }
      const startIdx = (_studentTxPage - 1) * STUDENT_PAGE_SIZE;
      const pageItems = _studentTx.slice(startIdx, startIdx + STUDENT_PAGE_SIZE);
      pageItems.forEach(r => {
        const tr = document.createElement('tr');
        const name = (r.item_name ?? r.custom_item ?? "-");
        tr.innerHTML = `<td class="text-secondary">${fmtTime(r.timestamp)}</td>
                        <td>${name}</td>
                        <td class="text-end fw-semibold">${fmtMoney(r.amount)}</td>`;
        tbody.appendChild(tr);
      });
      updatePaginationControls('myTx', _studentTxPage, total);
    }

    function renderStudentReloadsPage(page){
      const tbody = $("myReloadsTbody");
      if (!tbody) return;
      tbody.innerHTML = "";
      const total = _studentReloads.length;
      const pages = Math.max(1, Math.min(5, Math.ceil(total / STUDENT_PAGE_SIZE)));
      _studentReloadsPage = Math.max(1, Math.min(page, pages));
      if (total === 0){
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-secondary py-4"><i class="bi bi-inbox fs-4 d-block mb-2"></i><div class="small">No reloads yet</div></td></tr>`;
        updatePaginationControls('myReloads', 1, 0);
        return;
      }
      const startIdx = (_studentReloadsPage - 1) * STUDENT_PAGE_SIZE;
      const pageItems = _studentReloads.slice(startIdx, startIdx + STUDENT_PAGE_SIZE);
      pageItems.forEach(r => {
        const cashier = r.cashier || r.cashier_name || "-";
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="text-secondary">${fmtTime(r.timestamp)}</td>
                        <td>${cashier}</td>
                        <td class="text-end fw-semibold">${fmtMoney(r.amount)}</td>`;
        tbody.appendChild(tr);
      });
      updatePaginationControls('myReloads', _studentReloadsPage, total);
    }

    // Handlers for pagination buttons (wired via onclick in HTML)
    window.studentTxPrev = function(){ renderStudentTxPage(_studentTxPage - 1); };
    window.studentTxNext = function(){ renderStudentTxPage(_studentTxPage + 1); };
    window.studentReloadsPrev = function(){ renderStudentReloadsPage(_studentReloadsPage - 1); };
    window.studentReloadsNext = function(){ renderStudentReloadsPage(_studentReloadsPage + 1); };

    async function loadMyTransactions(){
      let rows = [];
      try {
        const res = await fetch(API_BASE + "/student/transactions", { headers:{ "Authorization":"Bearer " + token }});
        if (!res.ok) {
          const msg = await safeReadError(res);
          console.warn("loadMyTransactions failed:", res.status, msg);
          const tbody = $("myTxTbody");
          tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Transactions failed (${res.status})${msg ? ": " + msg : ""}</td></tr>`;
          return;
        }
        rows = await res.json();
      } catch (e) {
        console.error("loadMyTransactions error", e);
        const tbody = $("myTxTbody");
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Network error loading transactions</td></tr>`;
        return;
      }
      // Check if rows is an array
      if (!Array.isArray(rows)) {
        const tbody = $("myTxTbody");
        tbody.innerHTML = `<tr><td colspan=\"3\" class=\"text-center text-danger\">Failed to load transactions</td></tr>`;
        updatePaginationControls('myTx', 1, 0);
        return;
      }

      // keep at most 25
      _studentTx = rows.slice(0, STUDENT_MAX_ITEMS);
      // Update stats based on limited set
      updateStudentStats(_studentTx);
      renderStudentTxPage(1);
    }
    
    function updateStudentStats(transactions) {
      // Calculate stats
      const today = new Date().toDateString();
      const todayTransactions = transactions.filter(t => new Date(t.timestamp).toDateString() === today);
      
      const todaySpent = todayTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const totalTx = transactions.length;
      const avgSpending = totalTx > 0 ? transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) / totalTx : 0;
      
      // Update UI
      if ($('statTodaySpent')) $('statTodaySpent').textContent = fmtMoney(todaySpent);
      if ($('statTotalTx')) $('statTotalTx').textContent = totalTx;
      if ($('statAvgSpending')) $('statAvgSpending').textContent = fmtMoney(avgSpending);
    }
    async function loadMyReloads(){
      let rows = [];
      try {
        const res = await fetch(API_BASE + "/student/reloads", { headers:{ "Authorization":"Bearer " + token }});
        if (!res.ok) {
          const msg = await safeReadError(res);
          console.warn("loadMyReloads failed:", res.status, msg);
          const tbody = $("myReloadsTbody");
          tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Reloads failed (${res.status})${msg ? ": " + msg : ""}</td></tr>`;
          return;
        }
        rows = await res.json();
      } catch (e) {
        console.error("loadMyReloads error", e);
        const tbody = $("myReloadsTbody");
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Network error loading reloads</td></tr>`;
        return;
      }
      // Check if rows is an array
      if (!Array.isArray(rows)) {
        const tbody = $("myReloadsTbody");
        tbody.innerHTML = `<tr><td colspan=\"3\" class=\"text-center text-danger\">Failed to load reloads</td></tr>`;
        updatePaginationControls('myReloads', 1, 0);
        return;
      }

      // keep at most 25
      _studentReloads = rows.slice(0, STUDENT_MAX_ITEMS);
      updateLastReload(_studentReloads[0] || null);
      renderStudentReloadsPage(1);
      
      // Update last reload stat
      if (rows.length > 0) {
        updateLastReload(rows[0]);
      }
    }
    
    function updateLastReload(reload) {
      if ($('statLastReload')) {
        if (reload) {
          $('statLastReload').textContent = fmtMoney(reload.amount);
        } else {
          $('statLastReload').textContent = '?0.00';
        }
      }
    }

    /* ==================== HISTORY & STATS MODALS ==================== */
    async function openHistoryModal() {
      bsModal('historyStatsModal').show();
      
      // Load and display transactions
      const res = await fetch(API_BASE + "/student/transactions", { 
        headers: { "Authorization": "Bearer " + token }
      });
      const transactions = await res.json();
      
      const tbody = $("historyModalTbody");
      tbody.innerHTML = "";
      
      if (!Array.isArray(transactions) || !transactions.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-secondary py-4">
          <i class="bi bi-inbox fs-4 d-block mb-2"></i><div class="small">No transactions yet</div>
        </td></tr>`;
      } else {
        transactions.forEach(t => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td class="text-secondary">${fmtTime(t.timestamp)}</td>
                          <td>${t.item_name || "-"}</td>
                          <td class="text-end fw-semibold">${fmtMoney(t.amount)}</td>`;
          tbody.appendChild(tr);
        });
      }
      
      // Calculate and display statistics
      updateTransactionStats(transactions);
      
      // Create spending pattern chart
      createSpendingPatternChart(transactions);
    }
    
    function updateTransactionStats(transactions) {
      const today = new Date().toDateString();
      const todayTx = transactions.filter(t => new Date(t.timestamp).toDateString() === today);
      
      const totalTx = transactions.length;
      const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const todaySpent = todayTx.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const avgSpending = totalTx > 0 ? totalSpent / totalTx : 0;
      
      // Update stats in modal
      if ($('totalTransactions')) $('totalTransactions').textContent = totalTx;
      if ($('totalSpent')) $('totalSpent').textContent = fmtMoney(totalSpent);
      if ($('todaySpent')) $('todaySpent').textContent = fmtMoney(todaySpent);
      if ($('avgSpending')) $('avgSpending').textContent = fmtMoney(avgSpending);
      
      // Find most bought item
      const itemCounts = {};
      transactions.forEach(t => {
        const item = t.item_name || 'Unknown';
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      });
      const mostBought = Object.entries(itemCounts).sort((a,b) => b[1] - a[1])[0];
      if ($('mostBoughtItem')) $('mostBoughtItem').textContent = mostBought ? `${mostBought[0]} (${mostBought[1]}×)` : '-';
      
      // Favorite spending range
      const amounts = transactions.map(t => parseFloat(t.amount || 0));
      const ranges = {
        '₱0-₱50': amounts.filter(a => a <= 50).length,
        '₱50-₱100': amounts.filter(a => a > 50 && a <= 100).length,
        '₱100-₱200': amounts.filter(a => a > 100 && a <= 200).length,
        '₱200+': amounts.filter(a => a > 200).length
      };
      const favRange = Object.entries(ranges).sort((a,b) => b[1] - a[1])[0];
      if ($('favSpendingRange')) $('favSpendingRange').textContent = favRange ? favRange[0] : '-';
    }
    
  // ...existing code...
    function createSpendingPatternChart(transactions) {
      const ctx = document.getElementById('spendingPatternChart');
      if (!ctx) return;
      
      // Destroy previous chart if exists
      if (spendingChartInstance) {
        spendingChartInstance.destroy();
        spendingChartInstance = null;
      }
      
      if (!transactions || transactions.length === 0) {
        // Show empty state
        return;
      }
      
      // Group by date
      const dailySpending = {};
      transactions.forEach(t => {
        const date = new Date(t.timestamp).toLocaleDateString();
        dailySpending[date] = (dailySpending[date] || 0) + parseFloat(t.amount || 0);
      });
      
      // Sort by date
      const sortedDates = Object.keys(dailySpending).sort((a, b) => {
        return new Date(a) - new Date(b);
      });
      
      const labels = sortedDates;
      const data = labels.map(date => dailySpending[date]);
      
      // Get current theme colors
      const theme = getThemeColors();
      
      spendingChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Daily Spending (?)',
            data,
            borderColor: theme.accent,
            backgroundColor: hexToRgba(theme.accent, 0.2),
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: theme.accent,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: theme.surface2,
              titleColor: theme.text,
              bodyColor: theme.text,
              borderColor: theme.border,
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `?${parseFloat(context.parsed.y).toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: theme.text,
                maxRotation: 45,
                minRotation: 45
              },
              grid: {
                color: theme.border,
                drawBorder: false
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: theme.text,
                callback: function(value) {
                  return '?' + value.toFixed(0);
                }
              },
              grid: {
                color: theme.border,
                drawBorder: false
              }
            }
          }
        }
      });
    }
    
    async function openReloadsModal() {
      bsModal('reloadsStatsModal').show();
      
      // Load and display reloads
      const res = await fetch(API_BASE + "/student/reloads", { 
        headers: { "Authorization": "Bearer " + token }
      });
      const reloads = await res.json();
      
      const tbody = $("reloadsModalTbody");
      tbody.innerHTML = "";
      
      if (!Array.isArray(reloads) || !reloads.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-secondary py-4">
          <i class="bi bi-inbox fs-4 d-block mb-2"></i><div class="small">No reloads yet</div>
        </td></tr>`;
      } else {
        reloads.forEach(r => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td class="text-secondary">${fmtTime(r.timestamp)}</td>
                          <td>${r.cashier || "-"}</td>
                          <td class="text-end fw-semibold text-success">+${fmtMoney(r.amount)}</td>`;
          tbody.appendChild(tr);
        });
      }
      
      // Calculate and display statistics
      updateReloadStats(reloads);
      
      // Create trend chart
      createReloadTrendChart(reloads);
    }
    
    function updateReloadStats(reloads) {
      const totalReloads = reloads.length;
      const totalReloaded = reloads.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const avgReload = totalReloads > 0 ? totalReloaded / totalReloads : 0;
      
      if ($('totalReloads')) $('totalReloads').textContent = totalReloads;
      if ($('totalReloaded')) $('totalReloaded').textContent = fmtMoney(totalReloaded);
      if ($('avgReload')) $('avgReload').textContent = fmtMoney(avgReload);
      
      if (reloads.length > 0) {
        const lastReload = new Date(reloads[0].timestamp);
        if ($('lastReloadDate')) $('lastReloadDate').textContent = lastReload.toLocaleDateString();
      } else {
        if ($('lastReloadDate')) $('lastReloadDate').textContent = '-';
      }
    }
    
  // ...existing code...
    function createReloadTrendChart(reloads) {
      const ctx = document.getElementById('reloadsTrendChart');
      if (!ctx) return;
      
      // Destroy previous chart if exists
      if (reloadsChartInstance) {
        reloadsChartInstance.destroy();
        reloadsChartInstance = null;
      }
      
      if (!reloads || reloads.length === 0) {
        // Show empty state
        return;
      }
      
      const sortedReloads = [...reloads].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      const labels = sortedReloads.map(r => {
        const date = new Date(r.timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      const data = sortedReloads.map(r => parseFloat(r.amount || 0));
      
      // Get current theme colors
      const theme = getThemeColors();
      
      reloadsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Reload Amount (?)',
            data,
            borderColor: theme.accent2,
            backgroundColor: hexToRgba(theme.accent2, 0.2),
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: theme.accent2,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: theme.surface2,
              titleColor: theme.text,
              bodyColor: theme.text,
              borderColor: theme.border,
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `+?${parseFloat(context.parsed.y).toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: theme.text
              },
              grid: {
                color: theme.border,
                drawBorder: false
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: theme.text,
                callback: function(value) {
                  return '?' + value.toFixed(0);
                }
              },
              grid: {
                color: theme.border,
                drawBorder: false
              }
            }
          }
        }
      });
    }

    /* ==================== ADMIN FUNCTIONS ==================== */
    let adminCurrentUser = null; // Currently selected user for detail/edit/delete
    let adminCurrentPage = 1;

    // Load admin statistics
    async function adminLoadStats() {
      try {
        const res = await fetch(API_BASE + "/admin/stats", {
          headers: { "Authorization": "Bearer " + token }
        });
        const stats = await res.json();
        
        $("adminTotalUsers").textContent = stats.total_users || 0;
        $("adminTotalStudents").textContent = stats.total_students || 0;
        $("adminTotalStaff").textContent = stats.total_staff || 0;
        $("adminTotalVendors").textContent = stats.total_vendors || 0;
  if ($("adminTotalManagers")) { $("adminTotalManagers").textContent = stats.total_managers || 0; }
      } catch(e) {
        console.error("Admin stats error:", e);
      }
    }

    // Load users list
    async function adminLoadUsers(page = 1) {
      const tbody = $("adminUsersTbody");
      if (tbody) {
        // Show skeleton rows while loading
        const skeletonRow = `
          <tr>
            <td><div class="skeleton skeleton-text" style="width: 60%"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 40%"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 50%"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 24px; height: 24px; border-radius: 9999px"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 50%"></div></td>
            <td class="text-end"><div class="skeleton skeleton-text" style="width: 72px"></div></td>
          </tr>`;
        tbody.innerHTML = skeletonRow + skeletonRow + skeletonRow + skeletonRow + skeletonRow;
      }
      try {
        adminCurrentPage = page;
        const search = $("adminSearchInput")?.value || '';
        const role = $("adminFilterRole")?.value || '';
        const cardStatus = $("adminFilterCardStatus")?.value || '';
        const rfidStatus = $("adminFilterRFID")?.value || '';

        const params = new URLSearchParams({
          page,
          limit: 5,
          search,
          role,
          card_status: cardStatus,
          rfid_status: rfidStatus
        });

        const res = await fetch(API_BASE + "/admin/users?" + params, {
          headers: { "Authorization": "Bearer " + token }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
  const data = await res.json();

  const tbody = $("adminUsersTbody");
        tbody.innerHTML = "";

        if (!data.users || data.users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">No users found</td></tr>';
        } else {
          data.users.forEach(u => {
            const rfidBadge = u.rfid_uid ? '<span class="badge bg-success"><i class="bi bi-check-circle"></i></span>' : '<span class="badge bg-secondary"><i class="bi bi-x-circle"></i></span>';
            const cardBadge = u.is_card_locked ? '<span class="badge bg-danger">Locked</span>' : '<span class="badge bg-success">Active</span>';
            const roleBadge =
              u.role === 'student' ? '<span class="badge bg-info"><i class="bi bi-mortarboard me-1"></i>Student</span>' :
              u.role === 'staff' ? '<span class="badge bg-success"><i class="bi bi-person me-1"></i>Staff</span>' :
              u.role === 'vendor' ? '<span class="badge bg-warning"><i class="bi bi-shop me-1"></i>Vendor</span>' :
              '<span class="badge" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;"><i class="bi bi-person-badge me-1"></i>Admin</span>';

            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${u.name}</td>
              <td class="text-secondary">${u.username}</td>
              <td>${roleBadge}</td>
              <td class="text-center">${rfidBadge}</td>
              <td>${cardBadge}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary" onclick="adminViewUser(${u.user_id})">
                  <i class="bi bi-eye"></i>
                </button>
              </td>
            `;
            tbody.appendChild(tr);
          });
        }

        // Update pagination
        $("adminPaginationInfo").textContent = `Showing ${data.users.length} of ${data.pagination.total} users`;
        adminRenderPagination(data.pagination);
      } catch(e) {
        console.error("Admin load users error:", e);
        toast("Failed to load users", "error");
      }
    }

    // Admin search suggestions
    (function setupAdminSearchSuggestions(){
      const input = $("adminSearchInput");
      const list = $("adminSearchSuggestions");
      if (!input || !list) return;

      let abortCtrl = null;
      let lastQuery = "";
      let activeIndex = -1;

      function hideList(){
        list.classList.add('d-none');
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        activeIndex = -1;
      }
      function showList(){
        list.classList.remove('d-none');
        input.setAttribute('aria-expanded', 'true');
      }
      function updateActive(items){
        items.forEach((el, idx)=>{
          if (idx === activeIndex) {
            el.classList.add('active');
            const id = el.id || (`adminSug-${idx}`);
            el.id = id;
            input.setAttribute('aria-activedescendant', id);
            el.scrollIntoView({ block: 'nearest' });
          } else {
            el.classList.remove('active');
          }
        });
      }

      input.addEventListener('input', async () => {
        const q = input.value.trim();
        if (q.length < 2){ hideList(); return; }
        if (q === lastQuery) return;
        lastQuery = q;

        // cancel previous request
        if (abortCtrl) abortCtrl.abort();
        abortCtrl = new AbortController();
        const params = new URLSearchParams({ page: 1, limit: 5, search: q });
        try {
          const res = await fetch(API_BASE + "/admin/users?" + params.toString(), {
            headers: { "Authorization": "Bearer " + token },
            signal: abortCtrl.signal
          });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          list.innerHTML = '';
          if (!data.users || data.users.length === 0){ hideList(); return; }
          data.users.forEach((u, idx) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action d-flex align-items-center gap-2';
            item.innerHTML = `<i class="bi bi-person-circle text-secondary"></i>
              <div class="text-start">
                <div class="fw-semibold">${u.name || u.username}</div>
                <div class="small text-secondary">@${u.username}${u.rfid_uid ? ' • RFID' : ''}</div>
              </div>`;
            item.onclick = () => {
              input.value = u.username || u.name || q;
              hideList();
              adminLoadUsers(1);
            };
            list.appendChild(item);
          });
          showList();
          activeIndex = -1;
        } catch(err){
          // Ignore abort errors
          if (err.name !== 'AbortError') hideList();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (list.classList.contains('d-none')) return;
        const items = Array.from(list.querySelectorAll('.list-group-item'));
        if (items.length === 0) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          activeIndex = (activeIndex + 1) % items.length;
          updateActive(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          activeIndex = (activeIndex - 1 + items.length) % items.length;
          updateActive(items);
        } else if (e.key === 'Enter') {
          if (activeIndex >= 0) {
            e.preventDefault();
            items[activeIndex].click();
          }
        } else if (e.key === 'Escape') {
          hideList();
        }
      });

      // Hide on blur/click outside
      document.addEventListener('click', (e)=>{
        if (!list.contains(e.target) && e.target !== input){ hideList(); }
      });
    })();

    // Lightweight 3D tilt on summary cards
    (function enableTiltCards(){
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;
      const cards = document.querySelectorAll('.tilt-card');
      cards.forEach(card => {
        const bounds = 10; // max degrees
        card.style.transformStyle = 'preserve-3d';
        card.style.transition = 'transform 120ms ease';
        card.addEventListener('mousemove', (e)=>{
          const rect = card.getBoundingClientRect();
          const cx = rect.left + rect.width/2;
          const cy = rect.top + rect.height/2;
          const dx = (e.clientX - cx) / (rect.width/2);
          const dy = (e.clientY - cy) / (rect.height/2);
          const rx = Math.max(Math.min(-dy * bounds, bounds), -bounds);
          const ry = Math.max(Math.min(dx * bounds, bounds), -bounds);
          card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
        card.addEventListener('mouseleave', ()=>{
          card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
        });
        card.addEventListener('touchstart', ()=>{}, {passive: true}); // avoid hover on touch
      });
    })();

    // Render pagination buttons
    function adminRenderPagination(pagination) {
      const container = $("adminPaginationButtons");
      container.innerHTML = "";

      if (pagination.pages <= 1) return;

      const btnGroup = document.createElement("div");
      btnGroup.className = "btn-group btn-group-sm";

      // Previous button
      const prevBtn = document.createElement("button");
      prevBtn.className = "btn btn-outline-secondary";
      prevBtn.innerHTML = '<i class="bi bi-chevron-left"></i>';
      prevBtn.disabled = pagination.page === 1;
      prevBtn.onclick = () => adminLoadUsers(pagination.page - 1);
      btnGroup.appendChild(prevBtn);

      // Page numbers (show max 5 pages)
      let startPage = Math.max(1, pagination.page - 2);
      let endPage = Math.min(pagination.pages, startPage + 4);
      startPage = Math.max(1, endPage - 4);

      for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.className = "btn " + (i === pagination.page ? "btn-primary" : "btn-outline-secondary");
        pageBtn.textContent = i;
        pageBtn.onclick = () => adminLoadUsers(i);
        btnGroup.appendChild(pageBtn);
      }

      // Next button
      const nextBtn = document.createElement("button");
      nextBtn.className = "btn btn-outline-secondary";
      nextBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
      nextBtn.disabled = pagination.page === pagination.pages;
      nextBtn.onclick = () => adminLoadUsers(pagination.page + 1);
      btnGroup.appendChild(nextBtn);

      container.appendChild(btnGroup);
    }

    // View user details
    async function adminViewUser(userId) {
      try {
        const res = await fetch(API_BASE + "/admin/users/" + userId, {
          headers: { "Authorization": "Bearer " + token }
        });
        const user = await res.json();
        adminCurrentUser = user;

        // Fill modal
        $("adminUserDetailName").textContent = user.name;
        $("adminUserDetailUsername").textContent = user.username;
        $("adminUserDetailRole").textContent = user.role;
        $("adminUserDetailCreated").textContent = fmtTime(user.created_at);
        $("adminUserDetailRFID").textContent = user.rfid_uid || "Not paired";
        $("adminUserDetailCardStatus").innerHTML = user.is_card_locked ? 
          '<span class="badge bg-danger">🔒 Locked</span>' : 
          '<span class="badge bg-success">🔓 Unlocked</span>';

        // Activity stats (counts only, no amounts!)
        $("adminUserDetailTxCount").textContent = user.stats.transaction_count || 0;
        $("adminUserDetailReloadCount").textContent = user.stats.reload_count || 0;
        $("adminUserDetailLastTx").textContent = user.stats.last_transaction ? fmtTime(user.stats.last_transaction) : "Never";
        $("adminUserDetailLastReload").textContent = user.stats.last_reload ? fmtTime(user.stats.last_reload) : "Never";

        // Show/hide buttons based on state
        $("adminUserLockBtn").style.display = user.is_card_locked ? "none" : "inline-block";
        $("adminUserUnlockBtn").style.display = user.is_card_locked ? "inline-block" : "none";
        $("adminUserUnpairBtn").style.display = user.rfid_uid ? "inline-block" : "none";
        $("adminUserLinkBtn").style.display = user.rfid_uid ? "none" : "inline-block";

        bsModal("adminUserDetailModal").show();
      } catch(e) {
        console.error("Admin view user error:", e);
        toast("Failed to load user details", "error");
      }
    }

    // Username availability state
    let usernameCheckTimeout = null;
    let usernameAvailable = false;
    let lastCreatedUserId = null;
    let rfidLinkPending = null;
    let rfidLinkInterval = null;

    // Open create user modal
    function openAdminCreateUserModal() {
      // Clear form
      $("adminCreateUsername").value = "";
      $("adminCreatePassword").value = "";
      $("adminCreatePassword2").value = "";
      $("adminCreateName").value = "";
      $("adminCreateRole").value = "student";
      
      // Reset UI states
      const statusEl = $("usernameStatus");
      statusEl.innerHTML = "—";
      statusEl.className = "input-group-text";
      usernameAvailable = false;
      lastCreatedUserId = null;
      
      // Reset password rules
      ["ruleLen", "ruleUpper", "ruleNum", "ruleSpec"].forEach(id => {
        $(id).className = "";
      });
      $("passwordMatchHelp").textContent = "";
      
      // Reset RFID link UI
      show($("linkStepIdle"));
      hide($("linkStepActive"));
      hide($("linkStepSuccess"));
      $("linkStatusText").textContent = "";
      $("btnStartLink").disabled = true;
      
      // Wire up event listeners
      wireCreateUserModalEvents();
      
      bsModal("adminCreateUserModal").show();
    }

    function wireCreateUserModalEvents() {
      // Debounced username availability check
      const usernameInput = $("adminCreateUsername");
      usernameInput.oninput = () => {
        clearTimeout(usernameCheckTimeout);
        const val = usernameInput.value.trim();
        if (!val) {
          const statusEl = $("usernameStatus");
          statusEl.innerHTML = "—";
          statusEl.className = "input-group-text";
          usernameAvailable = false;
          return;
        }
        
        // Show checking state
        const statusEl = $("usernameStatus");
        statusEl.innerHTML = '<i class="bi bi-hourglass-split username-checking"></i>';
        statusEl.className = "input-group-text";
        
        usernameCheckTimeout = setTimeout(async () => {
          try {
            const res = await fetch(API_BASE + `/admin/username-available?username=${encodeURIComponent(val)}`, {
              headers: { "Authorization": "Bearer " + token }
            });
            const data = await res.json();
            
            if (!data.valid) {
              statusEl.innerHTML = '<i class="bi bi-x-circle username-invalid"></i>';
              statusEl.className = "input-group-text";
              usernameAvailable = false;
            } else if (!data.available) {
              statusEl.innerHTML = '<i class="bi bi-exclamation-circle username-invalid"></i>';
              statusEl.className = "input-group-text";
              usernameAvailable = false;
            } else {
              statusEl.innerHTML = '<i class="bi bi-check-circle username-valid"></i>';
              statusEl.className = "input-group-text";
              usernameAvailable = true;
            }
          } catch (e) {
            console.error("Username check error:", e);
            statusEl.innerHTML = '<i class="bi bi-exclamation-triangle username-invalid"></i>';
            statusEl.className = "input-group-text";
            usernameAvailable = false;
          }
        }, 400);
      };
      
      // Password visibility toggles
      $("togglePasswordVisibility").onclick = () => {
        const passInput = $("adminCreatePassword");
        const icon = $("passwordToggleIcon");
        if (passInput.type === "password") {
          passInput.type = "text";
          icon.className = "bi bi-eye-slash";
        } else {
          passInput.type = "password";
          icon.className = "bi bi-eye";
        }
      };
      
      $("toggleConfirmPasswordVisibility").onclick = () => {
        const confirmInput = $("adminCreatePassword2");
        const icon = $("confirmPasswordToggleIcon");
        if (confirmInput.type === "password") {
          confirmInput.type = "text";
          icon.className = "bi bi-eye-slash";
        } else {
          confirmInput.type = "password";
          icon.className = "bi bi-eye";
        }
      };
      
      // Live password validation
      const passInput = $("adminCreatePassword");
      passInput.oninput = () => {
        const val = passInput.value;
        $("ruleLen").className = val.length >= 8 ? "ok" : "bad";
        $("ruleUpper").className = /[A-Z]/.test(val) ? "ok" : "bad";
        $("ruleNum").className = /\d/.test(val) ? "ok" : "bad";
        $("ruleSpec").className = /[^A-Za-z0-9]/.test(val) ? "ok" : "bad";
        checkPasswordMatch();
      };
      
      // Confirm password match
      const confirmInput = $("adminCreatePassword2");
      confirmInput.oninput = checkPasswordMatch;
    }
    
    function checkPasswordMatch() {
      const pass = $("adminCreatePassword").value;
      const confirm = $("adminCreatePassword2").value;
      const hint = $("passwordMatchHelp");
      
      if (!confirm) {
        hint.textContent = "";
        return;
      }
      
      if (pass === confirm) {
        hint.textContent = "✓ Passwords match";
        hint.className = "form-text text-success";
      } else {
        hint.textContent = "✗ Passwords do not match";
        hint.className = "form-text text-danger";
      }
    }

    // Create new user
    async function adminCreateUser() {
      try {
        const username = $("adminCreateUsername").value.trim();
        const password = $("adminCreatePassword").value;
        const confirmPassword = $("adminCreatePassword2").value;
        const name = $("adminCreateName").value.trim();
        const role = $("adminCreateRole").value;

        // Validation
        if (!username || !password || !confirmPassword || !name) {
          toast("All fields are required", "error");
          return;
        }
        
        if (!usernameAvailable) {
          toast("Please choose a valid and available username", "error");
          return;
        }
        
        // Check password rules
        const passOk = password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
        if (!passOk) {
          toast("Password does not meet requirements", "error");
          return;
        }
        
        if (password !== confirmPassword) {
          toast("Passwords do not match", "error");
          return;
        }

        // Confirmation dialog
        const roleLabel = $("adminCreateRole").options[$("adminCreateRole").selectedIndex].text;
        const confirmMsg = `Create new user?\n\n` +
                          `Username: ${username}\n` +
                          `Full Name: ${name}\n` +
                          `Role: ${roleLabel}\n\n` +
                          `Are you sure you want to proceed?`;
        
        if (!confirm(confirmMsg)) {
          return;
        }

        const res = await fetch(API_BASE + "/admin/users", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, password, name, role })
        });

        const data = await res.json();

        if (data.success) {
          toast("User created successfully!", "success");
          lastCreatedUserId = data.user_id;
          
          // Enable RFID link button
          $("btnStartLink").disabled = false;
          $("btnStartLink").onclick = adminStartRFIDLink;
          
          // Wire cancel/retry buttons
          $("btnCancelLink").onclick = adminCancelRFIDLink;
          
          // Refresh user list
          adminLoadUsers(adminCurrentPage);
          adminLoadStats();
        } else {
          toast(data.error || "Failed to create user", "error");
        }
      } catch(e) {
        console.error("Admin create user error:", e);
        toast("Failed to create user", "error");
      }
    }
    
    // RFID Link Flow (Admin Create User)
    async function adminStartRFIDLink() {
      if (!lastCreatedUserId) return;
      
      // Close create user modal
      bootstrap.Modal.getInstance($("adminCreateUserModal")).hide();
      
      // Open the RFID pairing modal
      setTimeout(() => {
        openPairingModal(lastCreatedUserId);
      }, 300);
    }
    
    async function adminCheckRFIDLinkStatus() {
      if (!rfidLinkPending) return;
      
      try {
        const res = await fetch(API_BASE + `/rfid/link/status/${rfidLinkPending}`, {
          headers: { "Authorization": "Bearer " + token }
        });
        
        const data = await res.json();
        
        if (data.status === "confirmed") {
          clearInterval(rfidLinkInterval);
          rfidLinkInterval = null;
          
          hide($("linkStepActive"));
          show($("linkStepSuccess"));
          
          toast("RFID card linked successfully!", "success");
          
          // Close modal after 2 seconds
          setTimeout(() => {
            bootstrap.Modal.getInstance($("adminCreateUserModal")).hide();
          }, 2000);
        } else if (data.status === "expired" || data.status === "failed") {
          clearInterval(rfidLinkInterval);
          rfidLinkInterval = null;
          
          $("linkStatusText").textContent = data.status === "expired" ? "Link expired. Please try again." : "Link failed.";
          $("linkStatusText").className = "small mt-2 text-danger";
          
          // Show retry button
          show($("btnRetryLink"));
          $("btnRetryLink").onclick = () => {
            hide($("btnRetryLink"));
            adminStartRFIDLink();
          };
        }
      } catch (e) {
        console.error("RFID link status error:", e);
      }
    }
    
    function adminCancelRFIDLink() {
      clearInterval(rfidLinkInterval);
      rfidLinkInterval = null;
      rfidLinkPending = null;
      
      hide($("linkStepActive"));
      show($("linkStepIdle"));
      $("btnStartLink").disabled = false;
    }

    // Open edit user modal
    function adminOpenEditUserModal() {
      if (!adminCurrentUser) return;

      // Fill form with current data
      $("adminEditName").value = adminCurrentUser.name;
      $("adminEditRole").value = adminCurrentUser.role;

      // Hide detail modal, show edit modal
      bootstrap.Modal.getInstance($("adminUserDetailModal")).hide();
      bsModal("adminEditUserModal").show();
    }

    // Update user
    async function adminUpdateUser() {
      if (!adminCurrentUser) return;

      try {
        const name = $("adminEditName").value.trim();
        const role = $("adminEditRole").value;

        const res = await fetch(API_BASE + "/admin/users/" + adminCurrentUser.user_id, {
          method: "PUT",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, role })
        });

        const data = await res.json();

        if (data.success) {
          toast("User updated successfully!", "success");
          bootstrap.Modal.getInstance($("adminEditUserModal")).hide();
          adminLoadUsers(adminCurrentPage);
          adminCurrentUser = null;
        } else {
          toast(data.error || "Failed to update user", "error");
        }
      } catch(e) {
        console.error("Admin update user error:", e);
        toast("Failed to update user", "error");
      }
    }

    // Reset password
    async function adminResetPassword() {
      if (!adminCurrentUser) return;

      if (!confirm(`Reset password for ${adminCurrentUser.name}?`)) return;

      try {
        const res = await fetch(API_BASE + "/admin/users/" + adminCurrentUser.user_id + "/reset-password", {
          method: "POST",
          headers: { "Authorization": "Bearer " + token }
        });

        const data = await res.json();

        if (data.success) {
          $("adminTempPassword").value = data.temporary_password;
          bootstrap.Modal.getInstance($("adminUserDetailModal")).hide();
          bsModal("adminResetPasswordModal").show();
        } else {
          toast(data.error || "Failed to reset password", "error");
        }
      } catch(e) {
        console.error("Admin reset password error:", e);
        toast("Failed to reset password", "error");
      }
    }

    // Copy temp password
    function adminCopyTempPassword() {
      const input = $("adminTempPassword");
      input.select();
      document.execCommand("copy");
      toast("Password copied to clipboard!", "success");
    }

    // Lock card
    async function adminLockCard() {
      if (!adminCurrentUser) return;

      const reason = prompt("Enter reason for locking card (optional):");

      try {
        const res = await fetch(API_BASE + "/admin/users/" + adminCurrentUser.user_id + "/lock", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ reason })
        });

        const data = await res.json();

        if (data.success) {
          toast("Card locked successfully!", "success");
          bootstrap.Modal.getInstance($("adminUserDetailModal")).hide();
          adminLoadUsers(adminCurrentPage);
          adminCurrentUser = null;
        } else {
          toast(data.error || "Failed to lock card", "error");
        }
      } catch(e) {
        console.error("Admin lock card error:", e);
        toast("Failed to lock card", "error");
      }
    }

    // Unlock card
    async function adminUnlockCard() {
      if (!adminCurrentUser) return;

      if (!confirm(`Unlock card for ${adminCurrentUser.name}?`)) return;

      try {
        const res = await fetch(API_BASE + "/admin/users/" + adminCurrentUser.user_id + "/unlock", {
          method: "POST",
          headers: { "Authorization": "Bearer " + token }
        });

        const data = await res.json();

        if (data.success) {
          toast("Card unlocked successfully!", "success");
          bootstrap.Modal.getInstance($("adminUserDetailModal")).hide();
          adminLoadUsers(adminCurrentPage);
          adminCurrentUser = null;
        } else {
          toast(data.error || "Failed to unlock card", "error");
        }
      } catch(e) {
        console.error("Admin unlock card error:", e);
        toast("Failed to unlock card", "error");
      }
    }

    // Link RFID for user from detail modal
    function adminLinkRFID() {
      if (!adminCurrentUser) return;
      
      // Close detail modal
      bootstrap.Modal.getInstance($("adminUserDetailModal")).hide();
      
      // Open RFID pairing modal
      setTimeout(() => {
        openPairingModal(adminCurrentUser.user_id);
      }, 300);
    }

    // Unpair RFID
    async function adminUnpairRFID() {
      if (!adminCurrentUser) return;

      if (!confirm(`Unpair RFID card for ${adminCurrentUser.name}? This is used for lost/stolen cards.`)) return;

      try {
        const res = await fetch(API_BASE + "/admin/users/" + adminCurrentUser.user_id + "/unpair-rfid", {
          method: "POST",
          headers: { "Authorization": "Bearer " + token }
        });

        const data = await res.json();

        if (data.success) {
          toast("RFID unpaired successfully!", "success");
          bootstrap.Modal.getInstance($("adminUserDetailModal")).hide();
          adminLoadUsers(adminCurrentPage);
          adminCurrentUser = null;
        } else {
          toast(data.error || "Failed to unpair RFID", "error");
        }
      } catch(e) {
        console.error("Admin unpair RFID error:", e);
        toast("Failed to unpair RFID", "error");
      }
    }

    // Delete user
    async function adminDeleteUser() {
      if (!adminCurrentUser) return;

      if (!confirm(`⚠️ DELETE user "${adminCurrentUser.name}"? This action cannot be undone!`)) return;
      if (!confirm("Are you ABSOLUTELY SURE? This will permanently delete the user and all related data.")) return;

      try {
        const res = await fetch(API_BASE + "/admin/users/" + adminCurrentUser.user_id, {
          method: "DELETE",
          headers: { "Authorization": "Bearer " + token }
        });

        const data = await res.json();

        if (data.success) {
          toast("User deleted successfully!", "success");
          bootstrap.Modal.getInstance($("adminUserDetailModal")).hide();
          adminLoadUsers(adminCurrentPage);
          adminLoadStats();
          adminCurrentUser = null;
        } else {
          toast(data.error || "Failed to delete user", "error");
        }
      } catch(e) {
        console.error("Admin delete user error:", e);
        toast("Failed to delete user", "error");
      }
    }

    /* ==================== CANTEEN MANAGER FUNCTIONS ==================== */
    
    // Store menu items data for sorting and pagination
    let menuItemsData = [];
    let currentSortColumn = 'id';
    let currentSortDirection = 'asc';
    let currentPage = 1;
    const itemsPerPage = 10;
    
    // Load all menu items (including inactive ones)
    async function loadCanteenMenuItems() {
      try {
        const data = await httpGet(API_BASE + "/menu-items");
        menuItemsData = data; // Store for sorting
        currentPage = 1; // Reset to first page
        renderMenuItems();
      } catch (err) {
        console.error("Error loading menu items:", err);
        toast("Failed to load menu items", "error");
      }
    }
    
    // Render menu items table with pagination
    function renderMenuItems(dataToRender = null) {
      const data = dataToRender || menuItemsData;
      const tbody = $("menuItemsTbody");
      tbody.innerHTML = "";
      
      if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary">No menu items found</td></tr>';
        $("menuItemsInfo").textContent = "Showing 0 - 0 of 0 items";
        $("menuItemsPagination").innerHTML = "";
        return;
      }
      
      // Calculate pagination
      const totalItems = data.length;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
      const paginatedData = data.slice(startIndex, endIndex);
      
      // Render table rows
      paginatedData.forEach(item => {
        const row = document.createElement("tr");
        const statusBadge = item.active 
          ? '<span class="badge bg-success">Active</span>'
          : '<span class="badge bg-secondary">Inactive</span>';
        
        row.innerHTML = `
          <td>${item.item_id}</td>
          <td>${item.item_name}</td>
          <td class="text-end fw-semibold">${fmtMoney(item.price)}</td>
          <td>${statusBadge}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" onclick="editMenuItem(${item.item_id}, '${item.item_name.replace(/'/g, "\\'")}', ${item.price}, ${item.active})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteMenuItem(${item.item_id}, '${item.item_name.replace(/'/g, "\\'")}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      // Update info text
      $("menuItemsInfo").textContent = `Showing ${startIndex + 1} - ${endIndex} of ${totalItems} items`;
      
      // Render pagination controls
      renderPagination(totalPages);
    }
    
    // Render pagination buttons
    function renderPagination(totalPages) {
      const pagination = $("menuItemsPagination");
      pagination.innerHTML = "";
      
      if (totalPages <= 1) return; // Don't show pagination if only 1 page
      
      // Previous button
      const prevLi = document.createElement("li");
      prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
      if (currentPage === 1) {
        prevLi.innerHTML = `<span class="page-link">Previous</span>`;
      } else {
        prevLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">Previous</a>`;
      }
      pagination.appendChild(prevLi);
      
      // Page numbers
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      // First page + ellipsis
      if (startPage > 1) {
        const firstLi = document.createElement("li");
        firstLi.className = "page-item";
        firstLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(1); return false;">1</a>`;
        pagination.appendChild(firstLi);
        
        if (startPage > 2) {
          const ellipsisLi = document.createElement("li");
          ellipsisLi.className = "page-item disabled";
          ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
          pagination.appendChild(ellipsisLi);
        }
      }
      
      // Page number buttons
      for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement("li");
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        if (i === currentPage) {
          // Active page - not clickable
          li.innerHTML = `<span class="page-link">${i}</span>`;
        } else {
          li.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>`;
        }
        pagination.appendChild(li);
      }
      
      // Ellipsis + last page
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          const ellipsisLi = document.createElement("li");
          ellipsisLi.className = "page-item disabled";
          ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
          pagination.appendChild(ellipsisLi);
        }
        
        const lastLi = document.createElement("li");
        lastLi.className = "page-item";
        lastLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a>`;
        pagination.appendChild(lastLi);
      }
      
      // Next button
      const nextLi = document.createElement("li");
      nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
      if (currentPage === totalPages) {
        nextLi.innerHTML = `<span class="page-link">Next</span>`;
      } else {
        nextLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">Next</a>`;
      }
      pagination.appendChild(nextLi);
    }
    
    // Go to specific page
    function goToPage(page) {
      const totalPages = Math.ceil(menuItemsData.length / itemsPerPage);
      if (page < 1 || page > totalPages || page === currentPage) return; // Don't reload if already on this page
      currentPage = page;
      renderMenuItems();
    }
    
    // Sort menu items by column
    function sortMenuItems(column) {
      // Toggle sort direction if clicking the same column
      if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
      }
      
      // Sort the data
      menuItemsData.sort((a, b) => {
        let valA, valB;
        
        switch (column) {
          case 'id':
            valA = a.item_id;
            valB = b.item_id;
            break;
          case 'name':
            valA = a.item_name.toLowerCase();
            valB = b.item_name.toLowerCase();
            break;
          case 'price':
            valA = parseFloat(a.price);
            valB = parseFloat(b.price);
            break;
          case 'status':
            valA = a.active;
            valB = b.active;
            break;
          default:
            return 0;
        }
        
        if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      // Update sort indicators
      document.querySelectorAll('#menuTab th.sortable i').forEach(icon => {
        icon.className = 'bi bi-arrow-down-up ms-1';
      });
      
      const columnMap = {
        'id': 0,
        'name': 1,
        'price': 2,
        'status': 3
      };
      
      const headerIcon = document.querySelectorAll('#menuTab th.sortable')[columnMap[column]].querySelector('i');
      if (headerIcon) {
        headerIcon.className = currentSortDirection === 'asc' 
          ? 'bi bi-sort-up ms-1' 
          : 'bi bi-sort-down ms-1';
      }
      
      // Reset to first page after sorting
      currentPage = 1;
      renderMenuItems();
    }
    
    // Open add menu item modal
    function openAddMenuItemModal() {
      $("menuItemModalTitle").innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add Menu Item';
      $("menuItemId").value = "";
      $("menuItemName").value = "";
      $("menuItemPrice").value = "";
      $("menuItemActive").checked = true;
      
      const modal = new bootstrap.Modal($("menuItemModal"));
      modal.show();
    }
    
    // Edit menu item
    function editMenuItem(id, name, price, active) {
      $("menuItemModalTitle").innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Menu Item';
      $("menuItemId").value = id;
      $("menuItemName").value = name;
      $("menuItemPrice").value = price;
      $("menuItemActive").checked = active === 1;
      
      const modal = new bootstrap.Modal($("menuItemModal"));
      modal.show();
    }
    
    // Save menu item (add or update)
    async function saveMenuItem() {
      const id = $("menuItemId").value;
      const name = $("menuItemName").value.trim();
      const price = parseFloat($("menuItemPrice").value);
      const active = $("menuItemActive").checked;
      
      if (!name) {
        toast("Please enter an item name", "warn");
        return;
      }
      
      if (isNaN(price) || price <= 0) {
        toast("Please enter a valid price", "warn");
        return;
      }
      
      try {
        let data;
        if (id) {
          // Update existing item
          data = await httpPut(API_BASE + "/menu-items/" + id, {
            item_name: name,
            price: price,
            active: active
          });
        } else {
          // Add new item
          data = await httpPost(API_BASE + "/menu-items", {
            item_name: name,
            price: price,
            active: active
          });
        }
        
        if (data.success) {
          toast(data.message || (id ? "Menu item updated!" : "Menu item added!"), "success");
          bootstrap.Modal.getInstance($("menuItemModal")).hide();
          loadCanteenMenuItems();
          loadMenuAnalytics(); // Refresh analytics
        } else {
          toast(data.error || "Failed to save menu item", "error");
        }
      } catch (err) {
        console.error("Error saving menu item:", err);
        toast("Failed to save menu item", "error");
      }
    }
    
    // Delete menu item
    function deleteMenuItem(id, name) {
      $("deleteMenuItemId").value = id;
      $("deleteMenuItemName").textContent = name;
      
      const modal = new bootstrap.Modal($("deleteMenuItemModal"));
      modal.show();
    }
    
    // Confirm delete menu item
    async function confirmDeleteMenuItem() {
      const id = $("deleteMenuItemId").value;
      
      try {
        const data = await httpDelete(API_BASE + "/menu-items/" + id);
        
        if (data.success) {
          toast(data.message || "Menu item deleted!", "success");
          bootstrap.Modal.getInstance($("deleteMenuItemModal")).hide();
          loadCanteenMenuItems();
          loadMenuAnalytics(); // Refresh analytics
        } else {
          toast(data.error || "Failed to delete menu item", "error");
        }
      } catch (err) {
        console.error("Error deleting menu item:", err);
        toast("Failed to delete menu item", "error");
      }
    }
    
    // Load menu analytics
    async function loadMenuAnalytics() {
      try {
        const data = await httpGet(API_BASE + "/menu-analytics");
        
        // Update statistics
        if (data.stats) {
          $("totalMenuItems").textContent = data.stats.total_items || 0;
          $("activeMenuItems").textContent = data.stats.active_items || 0;
          $("avgMenuPrice").textContent = fmtMoney(data.stats.avg_price || 0);
          
          const minPrice = data.stats.min_price || 0;
          const maxPrice = data.stats.max_price || 0;
          $("priceRange").textContent = `${fmtMoney(minPrice)} – ${fmtMoney(maxPrice)}`;
        }
        
        // Render top items chart
        if (data.topItems && data.topItems.length > 0) {
          renderTopItemsChart(data.topItems);
        }
      } catch (err) {
        console.error("Error loading menu analytics:", err);
        toast("Failed to load analytics", "error");
      }
    }
    
    // Render top selling items chart
    function renderTopItemsChart(items) {
      const ctx = $("topItemsChart");
      
      // Destroy existing chart if any
      if (window.topItemsChartInstance) {
        window.topItemsChartInstance.destroy();
      }
      
      const labels = items.map(item => item.item_name);
      const salesData = items.map(item => item.sales_count);
      const revenueData = items.map(item => parseFloat(item.total_revenue));
      
      const colors = getThemeColors();
      
      window.topItemsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Sales Count',
            data: salesData,
            backgroundColor: colors.accent + '80',
            borderColor: colors.accent,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              labels: { color: colors.text }
            },
            tooltip: {
              callbacks: {
                afterLabel: function(context) {
                  const revenue = revenueData[context.dataIndex];
                  return 'Revenue: ' + fmtMoney(revenue);
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: colors.text },
              grid: { color: colors.border }
            },
            x: {
              ticks: { color: colors.text },
              grid: { color: colors.border }
            }
          }
        }
      });
    }

// ==================== RFID LINKING PAGE ====================

let rfidLinkingActive = false;
let rfidLinkingUserId = null;
let rfidLinkingPollInterval = null;

// Show RFID Linking Page
function showRfidLinking() {
  const dashboard = $('staffDashboard');
  const linkingPage = $('rfidLinkingPage');
  
  if (dashboard) dashboard.classList.add('d-none');
  if (linkingPage) {
    linkingPage.classList.remove('d-none');
    // Auto-search for users without RFID
    $('rfidFilterNoRfid').checked = true;
    searchRfidUsers();
  }
}

// Hide RFID Linking Page
function hideRfidLinking() {
  const dashboard = $('staffDashboard');
  const linkingPage = $('rfidLinkingPage');
  
  if (linkingPage) linkingPage.classList.add('d-none');
  if (dashboard) dashboard.classList.remove('d-none');
  
  // Clear search
  $('rfidSearchInput').value = '';
  $('rfidFilterNoRfid').checked = false;
}

// Search users for RFID linking
async function searchRfidUsers() {
  try {
    const searchInput = $('rfidSearchInput');
    const filterNoRfid = $('rfidFilterNoRfid');
    const tbody = $('rfidUsersTbody');
    const searchInfo = $('rfidSearchInfo');

    if (!tbody) return;

    // Show loading
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-4"><i class="bi bi-arrow-repeat spin me-2"></i>Searching...</td></tr>';

    const query = searchInput.value.trim();
    const onlyNoRfid = filterNoRfid.checked;

    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (onlyNoRfid) params.append('onlyNoRfid', 'true');

    const res = await fetch(API_BASE + '/rfid/search-users?' + params, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const users = data.users || [];

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-secondary py-4">
            <i class="bi bi-inbox fs-3 d-block mb-2"></i>
            No students found matching your search
          </td>
        </tr>
      `;
      searchInfo.textContent = 'No results found';
      return;
    }

    // Render results
    tbody.innerHTML = users.map(user => {
      const hasRfid = user.has_rfid;
      const statusBadge = hasRfid
        ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>RFID Linked</span>'
        : '<span class="badge bg-warning text-dark"><i class="bi bi-exclamation-circle me-1"></i>No RFID</span>';
      
      const actionButton = hasRfid
        ? `<button class="btn btn-sm btn-outline-secondary" onclick="confirmUnlinkRfid(${user.user_id}, '${user.name}')" title="Unlink RFID">
             <i class="bi bi-x-circle me-1"></i>Unlink
           </button>`
        : `<button class="btn btn-sm btn-accent" onclick="startRfidLink(${user.user_id}, '${user.name}', '${user.student_number}')">
             <i class="bi bi-credit-card-2-front me-1"></i>Link RFID
           </button>`;

      return `
        <tr>
          <td><span class="font-monospace">${user.student_number}</span></td>
          <td>${user.name}</td>
          <td>${user.course}</td>
          <td>${statusBadge}</td>
          <td class="text-end">${actionButton}</td>
        </tr>
      `;
    }).join('');

    searchInfo.textContent = `Found ${users.length} student${users.length !== 1 ? 's' : ''}`;

  } catch (err) {
    console.error('Error searching users:', err);
    toast('Failed to search users: ' + err.message, 'danger');
    const tbody = $('rfidUsersTbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle fs-3 d-block mb-2"></i>
            Error loading results: ${err.message}
          </td>
        </tr>
      `;
    }
  }
}

// Start RFID linking process
function startRfidLink(userId, userName, studentNo) {
  rfidLinkingUserId = userId;
  rfidLinkingActive = true;

  // Update modal content
  $('linkUserName').textContent = userName;
  $('linkUserInfo').textContent = `Student No: ${studentNo}`;

  // Reset modal state
  $('linkStatusWaiting').classList.remove('d-none');
  $('linkStatusSuccess').classList.add('d-none');
  $('linkStatusError').classList.add('d-none');
  $('linkStatusTimeout').classList.add('d-none');
  $('linkBtnRetry').classList.add('d-none');
  $('linkBtnCancelText').textContent = 'Cancel';

  // Show modal
  const modal = new bootstrap.Modal($('rfidLinkModal'));
  modal.show();

  // Start polling for RFID scans
  startRfidPolling();

  // Set timeout (60 seconds)
  setTimeout(() => {
    if (rfidLinkingActive && rfidLinkingUserId === userId) {
      handleRfidTimeout();
    }
  }, 60000);
}

// Poll for pending RFID scans
function startRfidPolling() {
  if (rfidLinkingPollInterval) {
    clearInterval(rfidLinkingPollInterval);
  }

  rfidLinkingPollInterval = setInterval(async () => {
    if (!rfidLinkingActive || !rfidLinkingUserId) {
      stopRfidPolling();
      return;
    }

    try {
      const res = await fetch(
        API_BASE + '/rfid/pending?userId=' + rfidLinkingUserId,
        { headers: { 'Authorization': 'Bearer ' + token } }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.status === 'success') {
        handleRfidSuccess(data);
      } else if (data.status === 'error') {
        handleRfidError(data.message);
      }
      // If status === 'waiting', continue polling

    } catch (err) {
      console.error('Polling error:', err);
      // Continue polling on network errors
    }
  }, 500); // Poll every 500ms
}

// Stop polling
function stopRfidPolling() {
  if (rfidLinkingPollInterval) {
    clearInterval(rfidLinkingPollInterval);
    rfidLinkingPollInterval = null;
  }
  rfidLinkingActive = false;
}

// Handle successful link
function handleRfidSuccess(data) {
  stopRfidPolling();

  $('linkStatusWaiting').classList.add('d-none');
  $('linkStatusSuccess').classList.remove('d-none');
  $('linkSuccessUid').textContent = data.uid;
  $('linkBtnCancelText').textContent = 'Close';

  toast(`RFID card linked successfully to ${data.user.name}`, 'success');

  // Refresh the search results after 2 seconds
  setTimeout(() => {
    searchRfidUsers();
  }, 2000);
}

// Handle link error
function handleRfidError(message) {
  stopRfidPolling();

  $('linkStatusWaiting').classList.add('d-none');
  $('linkStatusError').classList.remove('d-none');
  $('linkErrorMessage').textContent = message;
  $('linkBtnRetry').classList.remove('d-none');
  $('linkBtnCancelText').textContent = 'Cancel';

  toast('RFID linking failed: ' + message, 'danger');
}

// Handle timeout
function handleRfidTimeout() {
  stopRfidPolling();

  $('linkStatusWaiting').classList.add('d-none');
  $('linkStatusTimeout').classList.remove('d-none');
  $('linkBtnRetry').classList.remove('d-none');
  $('linkBtnCancelText').textContent = 'Cancel';

  toast('No card detected. Please try again.', 'warning');
}

// Cancel linking
function cancelRfidLink() {
  stopRfidPolling();
  rfidLinkingUserId = null;
}

// Retry linking
function retryRfidLink() {
  if (!rfidLinkingUserId) return;

  // Get user info from modal
  const userName = $('linkUserName').textContent;
  const studentNo = $('linkUserInfo').textContent.replace('Student No: ', '');

  // Restart the process
  startRfidLink(rfidLinkingUserId, userName, studentNo);
}

// Confirm unlinking RFID
function confirmUnlinkRfid(userId, userName) {
  if (!confirm(`Are you sure you want to unlink the RFID card from ${userName}?\n\nThey will need to link a new card to use the system.`)) {
    return;
  }

  unlinkRfid(userId);
}

// Unlink RFID from user
async function unlinkRfid(userId) {
  try {
    const res = await fetch(API_BASE + '/rfid/unlink', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }

    toast('RFID card unlinked successfully', 'success');
    
    // Refresh search results
    searchRfidUsers();

  } catch (err) {
    console.error('Error unlinking RFID:', err);
    toast('Failed to unlink RFID: ' + err.message, 'danger');
  }
}

