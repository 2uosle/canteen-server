/* Theme */
    const root = document.documentElement;
    const themeKey = 'canteen_theme';
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

          if (userRole === "staff") { show($("staffDashboard")); loadReloads(); }
          else if (userRole === "vendor") { show($("vendorDashboard")); loadMenuItems(); loadSales(); }
          else if (userRole === "student") { show($("studentDashboard")); loadMyBalance(); loadMyTransactions(); loadMyReloads(); }
          else if (userRole === "admin") { 
            show($("adminDashboard")); 
            setTimeout(() => { adminLoadStats(); adminLoadUsers(); }, 100);
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
    function logout(){
      // Close WebSocket connection
      if (typeof closeWebSocket === 'function') {
        closeWebSocket();
      }
      
      token = null; userRole = null;
      localStorage.removeItem("token"); localStorage.removeItem("role"); localStorage.removeItem("username");
      hide($("dashboard"));
      hide($("staffDashboard")); hide($("vendorDashboard")); hide($("studentDashboard")); hide($("adminDashboard"));
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
        else if (userRole === "student") { show($("studentDashboard")); loadMyBalance(); loadMyTransactions(); loadMyReloads(); }
        else if (userRole === "admin") { 
          show($("adminDashboard")); 
          setTimeout(() => { adminLoadStats(); adminLoadUsers(); }, 100);
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
      sale: { amount: '', itemId: '', itemName: '', pendingId: null, interval: null, pollCount: 0 }
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
    }

    function posBackToStep(mode, step) {
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
      if (posState.topup.interval) {
        clearInterval(posState.topup.interval);
        posState.topup.interval = null;
      }
      posResetTopup();
      toast('Top-up cancelled', 'info');
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
      const itemSelect = $('posSaleItemSelect');
      const itemManual = $('posSaleItemManual').value.trim();
      const amount = $('posSaleAmount').value.trim();

      if ((!itemSelect.value && !itemManual) || !amount || parseFloat(amount) <= 0) {
        toast('Please select/enter an item and valid amount', 'warn');
        return;
      }

      let itemName = itemManual;
      if (itemSelect.value) {
        posState.sale.itemId = itemSelect.value;
        itemName = itemSelect.options[itemSelect.selectedIndex].text.split(' â€” ')[0];
      } else {
        posState.sale.itemId = '';
      }
      
      posState.sale.itemName = itemName;
      posState.sale.amount = amount;

      $('saleConfirmItem').textContent = itemName;
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

    function posUpdateSalePrice() {
      const sel = $('posSaleItemSelect');
      const price = sel.options[sel.selectedIndex]?.getAttribute('data-price');
      if (price) {
        $('posSaleAmount').value = parseFloat(price).toFixed(2);
        posState.sale.amount = parseFloat(price).toFixed(2);
        $('posSaleItemManual').value = ''; // Clear manual input
      }
    }

    /* Vendor: menu & sales */
    async function loadMenuItems(){
      const res = await fetch(API_BASE + "/menu", { headers:{ "Authorization":"Bearer " + token }});
      const data = await res.json();
      const sel = $("posSaleItemSelect");
      sel.innerHTML = '<option value="">-- Choose from menu --</option>';
      if (Array.isArray(data) && data.length){
        data.forEach(item=>{
          const opt = document.createElement("option");
          opt.value = item.item_id;
          opt.setAttribute("data-price", item.price);
          opt.textContent = `${item.item_name} — ${fmtMoney(item.price)}`;
          sel.appendChild(opt);
        });
      } else {
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
                  label: 'Sales (₱)',
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
                    titleColor: theme.text,
                    bodyColor: theme.text,
                    borderColor: theme.border,
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
                    ticks: { color: theme.text, font:{ size:10 }, callback:(v,i,ticks)=>{
                      const l = labels[i];
                      const d = new Date(l);
                      return (d.getMonth()+1) + '/' + d.getDate();
                    }},
                    grid: { color: theme.border, drawBorder: false }
                  },
                  y: {
                    beginAtZero: true,
                    ticks: { color: theme.text, font:{size:10}, callback: v=>'₱'+v },
                    grid: { color: theme.border, drawBorder: false }
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

    /* Staff: reloads + tap-to-top-up */
    function hexToRgba(hex, alpha=1){
      const m = hex.replace('#','');
      const bigint = parseInt(m.length===3 ? m.split('').map(c=>c+c).join('') : m, 16);
      const r = (bigint>>16)&255, g=(bigint>>8)&255, b=bigint&255;
      return `rgba(${r},${g},${b},${alpha})`;
    }
    function getThemeColors(){
      const cs = getComputedStyle(document.documentElement);
      return {
        text: (cs.getPropertyValue('--text').trim() || '#0b1220'),
        muted: (cs.getPropertyValue('--text-muted').trim() || '#5b6472'),
        border: (cs.getPropertyValue('--border').trim() || 'rgba(0,0,0,0.08)'),
        surface2: (cs.getPropertyValue('--surface-2').trim() || 'rgba(255,255,255,0.92)'),
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
        setAlert("reloadAlert", `Reload successful · New balance: ${fmtMoney(data.new_balance)}`, "success");
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
                    ticks: { color: theme.text, callback: (v) => '₱' + Number(v).toLocaleString() },
                    grid: { color: theme.border }
                  }
                }
              }
            });
          }
        } catch(e){ console.error('Chart build failed', e); }
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
        ch2.options.scales.x.ticks.color = theme.text;
        ch2.options.scales.y.ticks.color = theme.text;
        ch2.options.scales.x.grid.color = theme.border;
        ch2.options.scales.y.grid.color = theme.border;
        ch2.options.plugins.tooltip.backgroundColor = theme.surface2;
        ch2.options.plugins.tooltip.titleColor = theme.text;
        ch2.options.plugins.tooltip.bodyColor = theme.text;
        ch2.options.plugins.tooltip.borderColor = theme.border;
        ch2.data.datasets[0].borderColor = theme.danger;

        const canvas2 = ch2.canvas;
        const ctx2 = canvas2.getContext('2d');
        const gradient2 = ctx2.createLinearGradient(0,0,0,canvas2.height);
        gradient2.addColorStop(0, hexToRgba(theme.danger, 0.25));
        gradient2.addColorStop(1, hexToRgba(theme.danger, 0.05));
        ch2.data.datasets[0].backgroundColor = gradient2;
        ch2.update();
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

    /* Settings (top-right) */
    function bsModal(id){ return new bootstrap.Modal(document.getElementById(id)); }
    function openRegisterModal(){
      bsModal('registerModal').show();
    }
    function openTopupModal(){
      bsModal('topupModal').show();
    }
    function openSaleModal(){
      bsModal('saleModal').show();
    }
    async function openSettings(){
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

          $("settingsName").textContent = data.name || "â€”";
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

    /* Staff â€” Register & Pair */
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
        setAlert(statusElId, `Pairing started (User ${userId}). Ask user to tap card. Expires in ${ttl}sâ€¦`, "info");

        if (staffPairInterval) clearInterval(staffPairInterval);
        staffPairInterval = setInterval(async ()=>{
          const res2 = await fetch(API_BASE + "/rfid/link/status/" + data.pending_id, {
            headers:{ "Authorization":"Bearer "+token }
          });
          const s = await res2.json();
          const remaining = Math.max(0, Math.ceil((staffPairDeadline - Date.now())/1000));
          if (s.confirmed){
            clearInterval(staffPairInterval);
            setAlert(statusElId, `RFID linked to user ${userId} âœ…`, "success");
          } else if (s.failed || s.expired || remaining<=0){
            clearInterval(staffPairInterval);
            setAlert(statusElId, `Pairing failed/expired for user ${userId}`, "danger");
          } else {
            setAlert(statusElId, `Waiting for tapâ€¦ ${remaining}s (user ${userId})`, "info");
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
          $('statLastReload').textContent = '₱0.00';
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
    
    let spendingChartInstance = null;
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
      
      // Get current theme
      const isDark = document.documentElement.classList.contains('theme-dark') || 
                    (!document.documentElement.classList.contains('theme-dark') && 
                     !document.documentElement.classList.contains('theme-light') && 
                     window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      const textColor = isDark ? '#ffffff' : '#000000';
      
      spendingChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Daily Spending (₱)',
            data,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.2)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#0d6efd',
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
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `₱${parseFloat(context.parsed.y).toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: textColor,
                maxRotation: 45,
                minRotation: 45
              },
              grid: {
                color: gridColor
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: textColor,
                callback: function(value) {
                  return '₱' + value.toFixed(0);
                }
              },
              grid: {
                color: gridColor
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
    
    let reloadsChartInstance = null;
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
      
      // Get current theme
      const isDark = document.documentElement.classList.contains('theme-dark') || 
                    (!document.documentElement.classList.contains('theme-dark') && 
                     !document.documentElement.classList.contains('theme-light') && 
                     window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      const textColor = isDark ? '#ffffff' : '#000000';
      
      reloadsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Reload Amount (₱)',
            data,
            borderColor: '#198754',
            backgroundColor: 'rgba(25, 135, 84, 0.2)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#198754',
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
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              displayColors: false,
              callbacks: {
                label: function(context) {
                  return `+₱${parseFloat(context.parsed.y).toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: textColor
              },
              grid: {
                color: gridColor
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: textColor,
                callback: function(value) {
                  return '₱' + value.toFixed(0);
                }
              },
              grid: {
                color: gridColor
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
              u.role === 'student' ? '<span class="badge bg-info">ðŸŽ“ Student</span>' :
              u.role === 'staff' ? '<span class="badge bg-success">ðŸ‘” Staff</span>' :
              u.role === 'vendor' ? '<span class="badge bg-warning">ðŸ½ï¸ Vendor</span>' :
              '<span class="badge" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">ðŸ‘‘ Admin</span>';

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
          '<span class="badge bg-danger">ðŸ”’ Locked</span>' : 
          '<span class="badge bg-success">ðŸ”“ Unlocked</span>';

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

    // Open create user modal
    function openAdminCreateUserModal() {
      // Clear form
      $("adminCreateUsername").value = "";
      $("adminCreatePassword").value = "";
      $("adminCreateName").value = "";
      $("adminCreateRole").value = "student";
      
      bsModal("adminCreateUserModal").show();
    }

    // Create new user
    async function adminCreateUser() {
      try {
        const username = $("adminCreateUsername").value.trim();
        const password = $("adminCreatePassword").value;
        const name = $("adminCreateName").value.trim();
        const role = $("adminCreateRole").value;

        if (!username || !password || !name) {
          toast("Username, password, and name are required", "error");
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
          bootstrap.Modal.getInstance($("adminCreateUserModal")).hide();
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

      if (!confirm(`âš ï¸ DELETE user "${adminCurrentUser.name}"? This action cannot be undone!`)) return;
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
