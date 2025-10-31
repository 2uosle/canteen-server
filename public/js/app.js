/* Theme */
    const root = document.documentElement;
    const themeKey = 'canteen_theme';
  // Chart instances (must be declared before any function uses them)
  let spendingChartInstance = null;
  let reloadsChartInstance = null;

  function applyTheme(mode){
      root.classList.remove('theme-dark');
      if (mode === 'dark') root.classList.add('theme-dark');
      if (mode === 'system'){
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('theme-dark', prefersDark);
      }
      localStorage.setItem(themeKey, mode);
      document.querySelectorAll('.segmented .seg').forEach(btn => btn.classList.remove('active'));
      document.getElementById(
        mode === 'dark' ? 'segThemeDark' :
        mode === 'light' ? 'segThemeLight' : 'segThemeSystem'
      ).classList.add('active');
      refreshChartStyles();
    }
    function initTheme(){
      const saved = localStorage.getItem(themeKey) || 'system';
      applyTheme(saved);
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e=>{
        if ((localStorage.getItem(themeKey) || 'system') === 'system'){
          applyTheme('system');
        }
      });
    }
    document.getElementById('segThemeSystem').onclick = ()=>applyTheme('system');
    document.getElementById('segThemeLight').onclick = ()=>applyTheme('light');
    document.getElementById('segThemeDark').onclick = ()=>applyTheme('dark');
    initTheme();
    
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

    /* Helpers */
    const API_BASE = "http://127.0.0.1:3000";
    let token = null, userRole = null, pendingCheckInterval = null, pendingSaleId = null;
    let studentProfile = null; // filled when opening Settings (student)

    // Helper functions are now in utils.js ($, show, hide, fmtMoney, httpGet, etc.)

    function toast(message, type="info"){
      const id = "t" + Math.random().toString(36).slice(2);
      const colors = { info:"primary", success:"success", error:"danger", warn:"warning" };
      const icon   = { info:"info-circle", success:"check-circle", error:"exclamation-octagon", warn:"exclamation-triangle" }[type] || "info-circle";
      const node = document.createElement("div");
      node.id = id;
      node.className = `toast align-items-center text-bg-${colors[type]||"primary"} border-0 show`;
      node.role = "alert"; node.ariaLive = "assertive"; node.ariaAtomic = "true";
      node.style.minWidth="280px";
      node.innerHTML = `
        <div class="d-flex">
          <div class="toast-body"><i class="bi bi-${icon} me-2"></i>${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
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
        } else {
          setAlert("loginAlert", data.error || "Login failed", "danger");
        }
      } catch(e){
        setAlert("loginAlert", "Network error during login", "danger");
      } finally {
        login.isSubmitting = false;
      }
    }

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
    
    // Format as "Oct 20 � Oct 28" (with en dash)
    if (startDate.getMonth() === endDate.getMonth()) {
      // Same month: "Oct 20 � 28"
      const endDay = endDate.getDate();
      textEl.textContent = `${startStr} � ${endDay}`;
    } else {
      // Different months: "Oct 20 � Nov 5"
      textEl.textContent = `${startStr} � ${endStr}`;
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
          <div class="small text-secondary">${items}</div>
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
          <div class="stat-value text-truncate" style="font-size: 1.25rem;">${topVendor ? topVendor.name : '�'}</div>
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
        label: 'Total Sales (?)',
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
              return 'Sales: ?' + context.parsed.y.toLocaleString();
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
              return '?' + value.toLocaleString();
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

$("adminVendorDateStart").onchange = adminLoadVendorStats;
$("adminVendorDateEnd").onchange = adminLoadVendorStats;

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
  
  for (let i = firstDayIndex; i > 0; i--) {
    const day = document.createElement("div");
    day.className = "day other-month";
    day.textContent = prevLastDateNum - i + 1;
    daysContainer.appendChild(day);
  }
  
  for (let i = 1; i <= lastDateNum; i++) {
    const day = document.createElement("div");
    day.className = "day";
    day.textContent = i;
    
    const currentDate = new Date(adminReloadDateRangeState.currentYear, adminReloadDateRangeState.currentMonth, i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const startStr = adminReloadDateRangeState.startDate?.toISOString().split('T')[0];
    const endStr = adminReloadDateRangeState.endDate?.toISOString().split('T')[0];
    
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
    
    day.onclick = (e) => {
      e.stopPropagation();
      selectAdminReloadDate(currentDate);
    };
    
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
    textEl.textContent = `${startMonth} ${startDay} � ${endDay}`;
  } else {
    textEl.textContent = `${startMonth} ${startDay} � ${endMonth} ${endDay}`;
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
        label: 'Reload Amount (?)',
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
              return 'Amount: ?' + context.parsed.y.toLocaleString();
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
            font: { size: 11 },
            callback: function(value) {
              return '?' + value.toLocaleString();
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
  $("adminVendorTxCard").style.display = "";
  $("adminVendorTxTitle").innerHTML = `<i class='bi bi-shop me-2'></i>${vendorName} - Transactions`;
  adminLoadVendorTransactions();
}

async function adminLoadVendorTransactions() {
  if (!adminSelectedVendorId) return;
  const start = $("adminVendorTxDateStart").value;
  const end = $("adminVendorTxDateEnd").value;
  let url = API_BASE + `/admin/vendor/${adminSelectedVendorId}/transactions`;
  if (start && end) url += `?start=${start}&end=${end}`;
  try {
    const res = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
    const txs = await res.json();
    const tbody = $("adminVendorTxTbody");
    tbody.innerHTML = "";
    if (!Array.isArray(txs) || !txs.length) {
      tbody.innerHTML = `<tr><td colspan='3' class='text-center text-secondary'>No transactions</td></tr>`;
      return;
    }
    txs.forEach(tx => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${fmtTime(tx.timestamp)}</td><td>${tx.item_name || tx.custom_item || '-'}</td><td>${fmtMoney(tx.amount)}</td>`;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("Error loading vendor transactions:", e);
    toast("Failed to load vendor transactions", "error");
  }
}

function adminExportVendorTx() {
  const tbody = $("adminVendorTxTbody");
  let csv = "Date,Item,Amount\n";
  Array.from(tbody.children).forEach(tr => {
    const tds = tr.querySelectorAll("td");
    if (tds.length === 3) {
      csv += `"${tds[0].textContent}","${tds[1].textContent}","${tds[2].textContent}"\n`;
    }
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `vendor_${adminSelectedVendorId}_transactions.csv` });
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
      if (savedToken && savedRole){
        token = savedToken; userRole = savedRole;
        hide($("loginStage")); show($("dashboard")); document.querySelectorAll('.auth-only').forEach(show);
        $("welcomeMsg").textContent = "Welcome, " + (savedUser || "(user)") + " (" + userRole + ")";
        $("navUserLabel").textContent = (savedUser || "User");
        if (userRole === "staff") { show($("staffDashboard")); loadReloads(); }
        else if (userRole === "vendor") { show($("vendorDashboard")); loadMenuItems(); loadSales(); }
        else if (userRole === "canteen_manager") { 
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
          }, 100);
        }
        
        // Initialize WebSocket for real-time notifications
        if (typeof initWebSocket === 'function') {
          initWebSocket();
        }
      }
    })();

    /* ==================== POS SYSTEM FUNCTIONS ==================== */
    let posState = {
      topup: { amount: '', pendingId: null, interval: null, pollCount: 0 },
      sale: { amount: '', itemId: '', itemName: '', pendingId: null, interval: null, pollCount: 0, isCustomItem: false, isMenuItemSelected: false, menuItems: [] }
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

    function posCancelTopup() {
      // Show cancellation reason modal
      const cancelModal = new bootstrap.Modal(document.getElementById('topupCancelModal'));
      cancelModal.show();
    }

    function toggleCustomCancelReason() {
      const select = $('cancelReasonSelect');
      const customDiv = $('customCancelReasonDiv');
      const customTextarea = $('customCancelReason');
      
      if (select.value === 'custom') {
        customDiv.classList.remove('d-none');
        customTextarea.focus();
      } else {
        customDiv.classList.add('d-none');
        customTextarea.value = '';
      }
    }

    async function confirmTopupCancellation() {
      const select = $('cancelReasonSelect');
      const customReason = $('customCancelReason').value.trim();
      
      let reason = select.value;
      if (reason === 'custom') {
        if (!customReason) {
          toast('Please specify a cancellation reason', 'warning');
          return;
        }
        reason = customReason;
      } else if (!reason) {
        toast('Please select a cancellation reason', 'warning');
        return;
      }

      // Hide the cancellation modal
      bootstrap.Modal.getInstance(document.getElementById('topupCancelModal'))?.hide();

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
              reason: reason
            })
          });
          const data = await res.json();

          if (data.success) {
            toast('Top-up cancelled: ' + reason, 'info');
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
      
      // Reset cancellation modal
      $('cancelReasonSelect').value = '';
      $('customCancelReason').value = '';
      $('customCancelReasonDiv').classList.add('d-none');
    }

    function posResetTopup() {
      if (posState.topup.interval) {
        clearInterval(posState.topup.interval);
      }
      posState.topup = { amount: '', pendingId: null, interval: null, pollCount: 0 };
      $('posTopupAmount').value = '';
      posShowStep('topup', 1);
      // Close modal
      bootstrap.Modal.getInstance(document.getElementById('topupModal'))?.hide();
    }

    // ========== SALE FLOW ==========
    function posConfirmSale() {
      const searchInput = $('posSaleItemSearch');
      const itemName = searchInput ? searchInput.value.trim() : '';
      const amount = $('posSaleAmount').value.trim();

      // Validate item name
      if (!itemName) {
        toast('Please enter or select an item', 'warn');
        return;
      }
      
      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        toast('Please enter a valid price', 'warn');
        return;
      }
      
      // If itemName is not in posState yet (user didn't select from dropdown), treat as custom
      if (!posState.sale.itemName) {
        posState.sale.itemName = itemName;
        posState.sale.isCustomItem = true;
        posState.sale.itemId = '';
      }
      
      posState.sale.amount = amount;

      $('saleConfirmItem').textContent = posState.sale.itemName;
      $('saleConfirmAmount').textContent = fmtMoney(amount);
      posShowStep('sale', 2);
    }

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
          
          $('saleSuccessAmount').textContent = fmtMoney(data.amount);
          $('saleSuccessDetails').innerHTML = `
            <strong>Item:</strong> ${data.item_name || posState.sale.itemName}<br>
            <strong>Student:</strong> ${data.student_name || 'N/A'}
          `;
          posShowStep('sale', 4);
          loadSales(); // Refresh the table
          toast('Sale completed!', 'success');
        } else if (data.failed) {
          clearInterval(posState.sale.interval);
          posState.sale.interval = null;
          $('saleTapStatus').textContent = 'Transaction failed!';
          toast('Sale failed (insufficient balance or locked card)', 'error');
          setTimeout(() => posResetSale(), 3000);
        }
      } catch (e) {
        console.error('Status check error:', e);
      }
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
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('cancelReasonModal'));
        modal.hide();
        
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
          toast('Transaction cancelled and logged', 'info');
          
          // Notify other users
          if (typeof showNotification === 'function') {
            showNotification(
              `Transaction cancelled: ${posState.sale.itemName || 'Unknown item'}`,
              'warning',
              'bi-x-circle-fill'
            );
          }
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
      posState.sale = { amount: '', itemId: '', itemName: '', pendingId: null, interval: null, pollCount: 0 };
      $('posSaleAmount').value = '';
      $('posSaleItemManual').value = '';
      $('posSaleItemSelect').selectedIndex = 0;
      posShowStep('sale', 1);
      // Close modal
      bootstrap.Modal.getInstance(document.getElementById('saleModal'))?.hide();
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
        div.onclick = () => posSelectMenuItem(item);
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
      const res = await fetch(API_BASE + "/report", { headers:{ "Authorization":"Bearer " + token }});
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

        rows.forEach(r=>{
          const t = new Date(r.timestamp);
          if (t.toDateString() === todayStr) todayTotal += Number(r.amount||0);
          if (t >= start7d) sevenDayTotal += Number(r.amount||0);
        });

        const kpiToday = $("salesKpiToday");
        const kpi7d = $("salesKpi7d");
        kpiToday.textContent = `Today: ${fmtMoney(todayTotal)}`;
        kpi7d.textContent = `7-day: ${fmtMoney(sevenDayTotal)}`;
        show(kpiToday); show(kpi7d);

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
      
      // Use 'from' and 'to' params for /report endpoint
      const params = new URLSearchParams({
        from: startDateInput.value,
        to: endDateInput.value
      });
      
      const res = await fetch(API_BASE + "/report?" + params, { 
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
                callback: (v) => '?' + Number(v).toLocaleString() 
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
      if (pageInfo) pageInfo.textContent = `Showing ${startIdx}�${endIdx} of ${total}`;
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
        setAlert("reloadAlert", `Reload successful � New balance: ${fmtMoney(data.new_balance)}`, "success");
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

        rows.forEach(r=>{
          const t = new Date(r.timestamp);
          if (t.toDateString() === todayStr) todayTotal += Number(r.amount||0);
          if (t >= start7d) sevenDayTotal += Number(r.amount||0);
        });

        const kpiToday = $("reloadKpiToday");
        const kpi7d = $("reloadKpi7d");
        kpiToday.textContent = `Today: ${fmtMoney(todayTotal)}`;
        kpi7d.textContent = `7-day: ${fmtMoney(sevenDayTotal)}`;
        show(kpiToday); show(kpi7d);

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
              label: 'Reloads (?)',
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
                ticks: { color: theme.text, callback: (v) => '?' + Number(v).toLocaleString() },
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
              label: 'Reloads (?)',
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
                ticks: { color: theme.text, callback: (v) => '?' + Number(v).toLocaleString() },
                grid: { color: theme.border }
              }
            }
          }
        });
      }
    }
    function refreshChartStyles(){
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
        reloadsChartInstance.data.datasets[0].borderColor = theme.accent2;
        reloadsChartInstance.data.datasets[0].backgroundColor = hexToRgba(theme.accent2, 0.2);
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
                callback: (v) => '?' + Number(v).toLocaleString() 
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
      if (pageInfo) pageInfo.textContent = `Showing ${startIdx}�${endIdx} of ${total}`;
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
      bsModal('registerModal').show();
    }
    function openTopupModal(){
      bsModal('topupModal').show();
    }
    function openSaleModal(){
      // Reset sale state (preserve menuItems)
      const menuItems = posState.sale.menuItems || [];
      posState.sale = { 
        amount: '', 
        itemId: '', 
        itemName: '', 
        pendingId: null, 
        interval: null, 
        pollCount: 0, 
        isCustomItem: false, 
        isMenuItemSelected: false,
        menuItems: menuItems
      };
      
      // Reset UI
      $('posSaleItemSearch').value = '';
      $('posSaleAmount').value = '';
      $('posSaleDropdown').style.display = 'none';
      
      // Enable keypad by default
      enableSaleKeypad(true);
      
      posShowStep('sale', 1);
      bsModal('saleModal').show();
    }
    async function openSettings(){
      // Fill common info
      $("settingsRole").textContent = (userRole || "�");
      $("settingsUsername").textContent = (localStorage.getItem("username") || "�");
      
      // Set User ID from token or student profile
      if (studentProfile && studentProfile.user_id) {
        $("settingsUserId").textContent = studentProfile.user_id;
      } else if (token) {
        // Try to decode user_id from token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          $("settingsUserId").textContent = payload.user_id || "�";
        } catch (e) {
          $("settingsUserId").textContent = "�";
        }
      } else {
        $("settingsUserId").textContent = "�";
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

      bsModal('settingsModal').show();
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

    async function changeMyPassword(){
      if (userRole !== 'student'){ setAlert("settingsPwdAlert", "Only students can change password here.", "warning"); return; }
      const cur = $("settingsPwdCurrent").value;
      const n1  = $("settingsPwdNew").value;
      const n2  = $("settingsPwdNew2").value;
      if (!cur || !n1 || !n2){ setAlert("settingsPwdAlert", "Please fill all fields", "warning"); return; }
      if (n1 !== n2){ setAlert("settingsPwdAlert", "New passwords do not match", "danger"); return; }
      if (n1.length < 8){ setAlert("settingsPwdAlert", "New password must be at least 8 characters", "warning"); return; }

      try{
        const res = await fetch(API_BASE + "/student/password", {
          method:"PUT",
          headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+token },
          body: JSON.stringify({ current_password: cur, new_password: n1 })
        });
        const data = await res.json();
        if (data?.success){
          setAlert("settingsPwdAlert", "Password updated", "success");
          $("settingsPwdCurrent").value = $("settingsPwdNew").value = $("settingsPwdNew2").value = "";
        } else {
          setAlert("settingsPwdAlert", data.error || "Password update failed", "danger");
        }
      }catch(e){
        setAlert("settingsPwdAlert", "Network error", "danger");
      }
    }

    /* Staff — Register & Pair */
    let staffPairInterval = null;
    let staffPairDeadline = null;

    async function registerUser(){
      const name = $("regName").value.trim();
      const username = $("regUsername").value.trim();
      const role = $("regRole").value;
      const password = $("regPassword").value;
      if (!name || !username || !password){ setAlert("regAlert", "Name, username and password are required", "warning"); return; }

      try{
        const res = await fetch(API_BASE + "/register", {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ name, username, role, password })
        });
        const data = await res.json();
        if (data?.user_id){
          setAlert("regAlert", `User created (ID: ${data.user_id}).`, "success");
          if ($("regAutoPair").checked){
            staffStartPairingForUser(data.user_id, "staffPairStatus");
          }
          $("regPassword").value = "";
        } else {
          setAlert("regAlert", data.error || "Registration failed", "danger");
        }
      }catch(e){
        setAlert("regAlert", "Network error during registration", "danger");
      }
    }
    async function staffStartPairingExisting(){
      const uid = $("pairUserId").value.trim();
      if (!uid){ setAlert("pairExistingAlert", "Enter a User ID", "warning"); return; }
      staffStartPairingForUser(uid, "pairExistingAlert");
    }
    async function staffStartPairingForUser(userId, statusElId){
      try{
        const res = await fetch(API_BASE + "/rfid/link/start", {
          method:"POST",
          headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+token },
          body: JSON.stringify({ user_id: Number(userId) })
        });
        const data = await res.json();
        if (!(data?.success && data?.pending_id)){
          setAlert(statusElId, data.error || "Could not start pairing", "danger"); return;
        }
        const ttl = Number(data.ttl_seconds || 120);
        staffPairDeadline = Date.now() + ttl*1000;
        setAlert(statusElId, `Pairing started (User ${userId}). Ask user to tap card. Expires in ${ttl}s…`, "info");

        if (staffPairInterval) clearInterval(staffPairInterval);
        staffPairInterval = setInterval(async ()=>{
          const res2 = await fetch(API_BASE + "/rfid/link/status/" + data.pending_id, {
            headers:{ "Authorization":"Bearer "+token }
          });
          const s = await res2.json();
          const remaining = Math.max(0, Math.ceil((staffPairDeadline - Date.now())/1000));
          if (s.confirmed){
            clearInterval(staffPairInterval);
            setAlert(statusElId, `RFID linked to user ${userId} ✅`, "success");
          } else if (s.failed || s.expired || remaining<=0){
            clearInterval(staffPairInterval);
            setAlert(statusElId, `Pairing failed/expired for user ${userId}`, "danger");
          } else {
            setAlert(statusElId, `Waiting for tap… ${remaining}s (user ${userId})`, "info");
          }
        }, 1500);
      }catch(e){
        setAlert(statusElId, "Network error while starting pairing", "danger");
      }
    }

    /* Student: balance/tx/reloads */
    async function loadMyBalance(){
      const res = await fetch(API_BASE + "/student/me", { headers:{ "Authorization":"Bearer " + token }});
      const data = await res.json();
      $("balanceValue").textContent = fmtMoney(data.balance || 0);
    }
    async function loadMyTransactions(){
      const res = await fetch(API_BASE + "/student/transactions", { headers:{ "Authorization":"Bearer " + token }});
      const rows = await res.json();
      const tbody = $("myTxTbody");
      tbody.innerHTML = "";
      
      // Check if rows is an array
      if (!Array.isArray(rows)) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Failed to load transactions</td></tr>`;
        return;
      }
      
      if (!rows.length){ 
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-secondary py-4"><i class="bi bi-inbox fs-4 d-block mb-2"></i><div class="small">No transactions yet</div></td></tr>`; 
        updateStudentStats(rows); 
        return; 
      }
      
      rows.forEach(r=>{
        const tr = document.createElement("tr");
        const name = (r.item_name ?? r.custom_item ?? "-");
        tr.innerHTML = `<td class="text-secondary">${fmtTime(r.timestamp)}</td>
                        <td>${name}</td>
                        <td class="text-end fw-semibold">${fmtMoney(r.amount)}</td>`;
        tbody.appendChild(tr);
      });
      
      // Update stats
      updateStudentStats(rows);
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
      const res = await fetch(API_BASE + "/student/reloads", { headers:{ "Authorization":"Bearer " + token }});
      const rows = await res.json();
      const tbody = $("myReloadsTbody");
      tbody.innerHTML = "";
      
      // Check if rows is an array
      if (!Array.isArray(rows)) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Failed to load reloads</td></tr>`;
        return;
      }
      
      if (!rows.length){ 
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-secondary py-4"><i class="bi bi-inbox fs-4 d-block mb-2"></i><div class="small">No reloads yet</div></td></tr>`; 
        updateLastReload(null);
        return; 
      }
      
      rows.forEach(r => {
        const cashier = r.cashier || r.cashier_name || "-";
        const tr = document.createElement("tr");
        tr.innerHTML = `<td class="text-secondary">${fmtTime(r.timestamp)}</td>
                        <td>${cashier}</td>
                        <td class="text-end fw-semibold">${fmtMoney(r.amount)}</td>`;
        tbody.appendChild(tr);
      });
      
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
      if ($('mostBoughtItem')) $('mostBoughtItem').textContent = mostBought ? `${mostBought[0]} (${mostBought[1]}�)` : '-';
      
      // Favorite spending range
      const amounts = transactions.map(t => parseFloat(t.amount || 0));
      const ranges = {
        '?0-?50': amounts.filter(a => a <= 50).length,
        '?50-?100': amounts.filter(a => a > 50 && a <= 100).length,
        '?100-?200': amounts.filter(a => a > 100 && a <= 200).length,
        '?200+': amounts.filter(a => a > 200).length
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
      } catch(e) {
        console.error("Admin stats error:", e);
      }
    }

    // Load users list
    async function adminLoadUsers(page = 1) {
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
      
      try {
        const res = await fetch(API_BASE + "/rfid/link/start", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ user_id: lastCreatedUserId })
        });
        
        const data = await res.json();
        
        if (data.pending_id) {
          rfidLinkPending = data.pending_id;
          hide($("linkStepIdle"));
          show($("linkStepActive"));
          $("linkStatusText").textContent = "Waiting for card tap...";
          $("linkStatusText").className = "small mt-2 text-primary";
          
          // Start polling
          rfidLinkInterval = setInterval(() => adminCheckRFIDLinkStatus(), 1000);
        } else {
          toast(data.error || "Failed to start RFID link", "error");
        }
      } catch (e) {
        console.error("RFID link start error:", e);
        toast("Failed to start RFID link", "error");
      }
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

