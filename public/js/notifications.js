// ============================================
// Real-Time Notifications via WebSocket
// ============================================

let ws = null;
let reconnectInterval = null;
let isConnected = false;
let isInitializing = false; // Prevent duplicate initialization
let hasShownConnectedToast = false; // Only show "Connected" toast once per session

// Notification queue for display
const notificationQueue = [];
let isShowingNotification = false;

// Initialize WebSocket connection
function initWebSocket() {
  // Check if user is logged in with a valid token
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token || !role) {
    console.log('[WebSocket] No authentication token found, skipping WebSocket connection');
    return;
  }
  
  // Prevent duplicate connections
  if (isInitializing || (ws && ws.readyState === WebSocket.CONNECTING)) {
    console.log('[WebSocket] Already initializing, skipping...');
    return;
  }
  
  // Close existing connection if any
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.log('[WebSocket] Closing existing connection before reconnect');
    ws.close();
    ws = null;
  }
  
  isInitializing = true;
  const hostname = window.location.hostname; const WS_PORT = 3001; const WS_URL = `ws://${hostname}:${WS_PORT}`; console.log('[WebSocket] Connecting to:', WS_URL); // WebSocket server port
  
  try {
    ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('[WebSocket] Connected to notification server');
      isConnected = true;
      isInitializing = false;
      
      // Clear reconnect interval if connected
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
      
      // Authenticate with server if logged in
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      
      if (token && role) {
        console.log('[WebSocket] Token found, length:', token.length);
        console.log('[WebSocket] Token preview:', token.substring(0, 30) + '...');
        // Send authentication message with token
        ws.send(JSON.stringify({
          type: 'authenticate',
          data: {
            token: token
          }
        }));
        console.log('[WebSocket] Authenticating as', role);
      } else {
        console.warn('[WebSocket] No valid token found, skipping authentication');
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      isInitializing = false;
    };
    
    ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      isConnected = false;
      isInitializing = false;
      
      // Attempt to reconnect every 5 seconds
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          console.log('[WebSocket] Attempting to reconnect...');
          initWebSocket();
        }, 5000);
      }
    };
    
  } catch (error) {
    console.error('[WebSocket] Connection failed:', error);
    isInitializing = false;
  }
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(message) {
  console.log('[WebSocket] Received:', message.type, message.data);
  
  switch (message.type) {
    case 'connected':
      // Only show this toast on the first connection after login/refresh
      if (!hasShownConnectedToast) {
        showNotification('Connected to real-time updates', 'success');
        hasShownConnectedToast = true;
      }
      break;
      
    case 'auth_error':
      console.error('[WebSocket] Authentication failed:', message.data?.message || 'Invalid token');
      console.error('[WebSocket] Auth error detail:', message.data?.detail || 'No additional info');
      // Stop reconnecting on auth errors - likely token expired
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
      isConnected = false;
      isInitializing = false;
      // Show a one-time notification that login may be needed
      if (typeof showNotification === 'function') {
        showNotification('Session may have expired. Please refresh or log in again.', 'warning');
      }
      break;
      
    case 'auth_ok':
      console.log('[WebSocket] Authentication successful');
      break;
      
    case 'balance_updated':
      handleBalanceUpdate(message.data);
      break;
      
    case 'reload_completed':
      handleReloadNotification(message.data);
      break;
      
    case 'sale_completed':
      handleSaleNotification(message.data);
      break;
      
    case 'new_user':
      handleNewUserNotification(message.data);
      break;
      
    case 'card_locked':
      handleCardLockNotification(message.data);
      break;
      
    case 'low_balance':
      handleLowBalanceNotification(message.data);
      break;
      
    case 'sale_cancelled':
      handleSaleCancelledNotification(message.data);
      break;
      
    default:
      console.log('[WebSocket] Unknown message type:', message.type);
  }
}

// Handle balance update notification
function handleBalanceUpdate(data) {
  const currentRole = localStorage.getItem('role');
  
  // If student, update their balance display
  if (currentRole === 'student' && typeof loadMyBalance === 'function') {
    loadMyBalance();
    
    if (data.type === 'reload') {
      showNotification(`?${parseFloat(data.amount).toFixed(2)} added to your balance!`, 'success', 'bi-cash-coin');
      playNotificationSound('success');
    } else if (data.type === 'transaction' || data.type === 'sale') {
      const amount = Math.abs(data.amount);
      showNotification(`Purchase of ?${amount.toFixed(2)} completed`, 'info', 'bi-cart-check');
      playNotificationSound('info');
    }
    
    // Refresh transaction history
    if (typeof loadMyTransactions === 'function') {
      setTimeout(() => loadMyTransactions(), 500);
    }
  }
}

// Handle reload completed notification (for staff)
function handleReloadNotification(data) {
  const currentRole = localStorage.getItem('role');
  
  if (currentRole === 'staff') {
    showNotification(
      `Top-up completed: ?${parseFloat(data.amount).toFixed(2)}`,
      'success',
      'bi-cash-stack'
    );
    
    // Refresh reload list
    if (typeof loadReloads === 'function') {
      setTimeout(() => loadReloads(), 500);
    }
  }
}

// Handle sale notification (for vendors)
function handleSaleNotification(data) {
  const currentRole = localStorage.getItem('role');
  
  if (currentRole === 'vendor') {
    showNotification(
      `Sale completed: ?${parseFloat(data.amount).toFixed(2)}`,
      'success',
      'bi-cart-check-fill'
    );
    playNotificationSound('success');
    
    // Refresh sales list
    if (typeof loadSales === 'function') {
      setTimeout(() => loadSales(), 500);
    }

    // If the POS modal is currently waiting for this sale, advance it to Success
    try {
      const isSaleStep3Visible = (function() {
        const el = document.getElementById('saleStep3');
        return el && !el.classList.contains('d-none');
      })();

      if (window.posState && window.posState.sale && isSaleStep3Visible) {
        const pendingMatches = (typeof data.pending_id !== 'undefined') && (data.pending_id === window.posState.sale.pendingId);
        if (pendingMatches) {
          // Stop polling if any
          if (window.posState.sale.interval) {
            try { clearInterval(window.posState.sale.interval); } catch(_) {}
            window.posState.sale.interval = null;
          }

          // Update success UI like the polling path would
          const fmt = (n) => `?${Number(n).toFixed(2)}`;
          const amountEl = document.getElementById('saleSuccessAmount');
          if (amountEl) amountEl.textContent = fmt(data.amount);
          const detailsEl = document.getElementById('saleSuccessDetails');
          if (detailsEl) {
            const itemName = data.item_name || (window.posState.sale && window.posState.sale.itemName) || 'Item';
            detailsEl.innerHTML = `
              <strong>Item:</strong> ${itemName}<br>
              <strong>Student:</strong> ${data.student_name || 'N/A'}
            `;
          }

          // Clear cart on success
          if (window.posState && window.posState.sale) {
            window.posState.sale.cart = { orderId: null, items: [], total: 0 };
            try { window.posRenderCart && window.posRenderCart(); } catch(_) {}
          }

          if (typeof window.SoundEffects?.complete === 'function') {
            window.SoundEffects.complete();
          }
          if (typeof window.posShowStep === 'function') {
            window.posShowStep('sale', 4);
          }
          // Clear pending id
          window.posState.sale.pendingId = null;
        }
      }
    } catch (e) {
      console.warn('[WebSocket] Failed to sync POS modal:', e);
    }
  }
}

// Handle new user registration notification
function handleNewUserNotification(data) {
  const currentRole = localStorage.getItem('role');
  
  if (currentRole === 'admin') {
    showNotification(
      `New ${data.role} registered: ${data.name}`,
      'info',
      'bi-person-plus-fill'
    );
    
    // Refresh user list
    if (typeof adminLoadUsers === 'function') {
      setTimeout(() => adminLoadUsers(), 500);
    }
  }
}

// Handle card lock notification
function handleCardLockNotification(data) {
  showNotification(
    `Card has been ${data.locked ? 'locked' : 'unlocked'}`,
    data.locked ? 'warning' : 'success',
    'bi-shield-lock-fill'
  );
}

// Handle low balance warning
function handleLowBalanceNotification(data) {
  showNotification(
    `Low balance warning: ?${parseFloat(data.balance).toFixed(2)} remaining`,
    'warning',
    'bi-exclamation-triangle-fill'
  );
  playNotificationSound('warning');
}

// Handle sale cancellation notification
function handleSaleCancelledNotification(data) {
  const currentRole = localStorage.getItem('role');
  
  if (currentRole === 'vendor') {
    // Check if this is our own cancellation (skip duplicate notification)
    if (window.posState && window.posState.sale && data.pending_id === window.posState.sale.pendingId) {
      console.log('[WebSocket] Skipping own cancellation notification');
      // Just refresh the sales list
      if (typeof loadSales === 'function') {
        setTimeout(() => loadSales(), 500);
      }
      return;
    }
    
    // Show notification for other vendors' cancellations
    showNotification(
      `Transaction cancelled: ${data.item_name || 'Unknown'} - ${data.reason || 'No reason provided'}`,
      'warning',
      'bi-x-circle-fill'
    );
    playNotificationSound('warning');
    
    // Refresh sales list
    if (typeof loadSales === 'function') {
      setTimeout(() => loadSales(), 500);
    }
  } else if (currentRole === 'student') {
    showNotification(
      `Transaction cancelled: ${data.item_name || 'Item'} - ${data.reason || 'Cancelled by vendor'}`,
      'warning',
      'bi-exclamation-triangle-fill'
    );
    playNotificationSound('warning');
  }
}

// Show notification toast
function showNotification(message, type = 'info', icon = 'bi-info-circle-fill') {
  // Prefer unified Bootstrap toasts if available
  if (typeof window.toast === 'function') {
    // Map types from notifications.js to app.js toast types
    const map = { success: 'success', info: 'info', warning: 'warn', danger: 'error', error: 'error' };
    window.toast(message, map[type] || 'info');
    return;
  }

  // Fallback to custom notification queue
  notificationQueue.push({ message, type, icon });
  if (!isShowingNotification) {
    processNotificationQueue();
  }
}

// Process notification queue (show one at a time)
function processNotificationQueue() {
  if (notificationQueue.length === 0) {
    isShowingNotification = false;
    return;
  }
  
  isShowingNotification = true;
  const notification = notificationQueue.shift();
  
  // Create notification element
  const notifEl = document.createElement('div');
  notifEl.className = `notification notification-${notification.type}`;
  notifEl.innerHTML = `
    <i class="bi ${notification.icon} me-2"></i>
    <span>${notification.message}</span>
  `;
  
  // Add to container
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
  
  container.appendChild(notifEl);
  
  // Animate in
  setTimeout(() => notifEl.classList.add('show'), 10);
  
  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    notifEl.classList.remove('show');
    setTimeout(() => {
      if (notifEl.parentNode) {
        notifEl.remove();
      }
      // Process next notification
      processNotificationQueue();
    }, 300);
  }, 4000);
}

// Play notification sound
function playNotificationSound(type) {
  // Create a simple beep using Web Audio API
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different notification types
    const frequencies = {
      success: 800,
      info: 600,
      warning: 500,
      danger: 400
    };
    
    oscillator.frequency.value = frequencies[type] || 600;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    // Audio API not supported or user hasn't interacted with page yet
    console.log('[Audio] Could not play sound:', error.message);
  }
}

// Send message to WebSocket server
function sendWebSocketMessage(type, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  } else {
    console.warn('[WebSocket] Not connected, cannot send message');
  }
}

// Close WebSocket connection (call on logout)
function closeWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
  }
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
  isConnected = false;
}

// Export functions for use in other scripts
window.initWebSocket = initWebSocket;
window.closeWebSocket = closeWebSocket;
window.sendWebSocketMessage = sendWebSocketMessage;
window.showNotification = showNotification;

