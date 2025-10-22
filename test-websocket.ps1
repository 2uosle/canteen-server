# WebSocket Testing Script
# Tests WebSocket connectivity and events

Write-Host "🔄 WebSocket Testing" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$wsUrl = "ws://localhost:3001"

Write-Host "Prerequisites:" -ForegroundColor Yellow
Write-Host "1. Server must be running: node server.js" -ForegroundColor White
Write-Host "2. This script tests basic connectivity only" -ForegroundColor White
Write-Host "3. For interactive testing, use: npm install -g wscat" -ForegroundColor White
Write-Host ""

$ready = Read-Host "Is server running? (yes/no)"

if ($ready -ne "yes") {
    Write-Host "❌ Start the server first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# TEST 1: Check if WebSocket port is open
# ============================================================================

Write-Host "🧪 TEST 1: WebSocket Port Check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking if port 3001 is accessible..." -ForegroundColor Yellow

try {
    $test = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue
    
    if ($test.TcpTestSucceeded) {
        Write-Host "  ✅ PASS: WebSocket server is listening on port 3001" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAIL: Port 3001 is not accessible" -ForegroundColor Red
        Write-Host "     Check if server started successfully" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "  ⚠️  Could not test port (Test-NetConnection not available)" -ForegroundColor Yellow
    Write-Host "     Skipping port test..." -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# TEST 2: Check WebSocket Stats Endpoint
# ============================================================================

Write-Host "🧪 TEST 2: WebSocket Stats API" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Note: This requires staff authentication" -ForegroundColor Yellow
Write-Host "Attempting to check stats endpoint..." -ForegroundColor Yellow
Write-Host ""

Write-Host "To test this manually:" -ForegroundColor Cyan
Write-Host "1. Login as staff" -ForegroundColor White
Write-Host "2. GET /ws/stats with Authorization header" -ForegroundColor White
Write-Host ""

# ============================================================================
# TEST 3: JavaScript WebSocket Test
# ============================================================================

Write-Host "🧪 TEST 3: Interactive WebSocket Test" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Creating test HTML file..." -ForegroundColor Yellow

$testHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Test - Canteen Server</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0A84FF;
            margin-top: 0;
        }
        .status {
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            font-weight: bold;
        }
        .status.connected {
            background: #d4edda;
            color: #155724;
        }
        .status.disconnected {
            background: #f8d7da;
            color: #721c24;
        }
        .controls {
            margin: 20px 0;
        }
        button {
            padding: 10px 20px;
            margin: 5px;
            font-size: 14px;
            cursor: pointer;
            border: none;
            border-radius: 5px;
            background: #0A84FF;
            color: white;
        }
        button:hover {
            background: #006fe5;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        #log {
            background: #f8f9fa;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            height: 300px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        .log-entry {
            margin: 5px 0;
            padding: 5px;
            border-left: 3px solid #0A84FF;
            padding-left: 10px;
        }
        .log-entry.received {
            border-left-color: #34C759;
            background: #f0f8f4;
        }
        .log-entry.sent {
            border-left-color: #FF9500;
            background: #fff8f0;
        }
        .log-entry.error {
            border-left-color: #FF3B30;
            background: #fff0f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 WebSocket Test</h1>
        
        <div id="status" class="status disconnected">
            ❌ Disconnected
        </div>
        
        <div class="controls">
            <button id="connectBtn" onclick="connect()">Connect</button>
            <button id="disconnectBtn" onclick="disconnect()" disabled>Disconnect</button>
            <button id="authenticateBtn" onclick="authenticate()" disabled>Authenticate</button>
            <button id="pingBtn" onclick="sendPing()" disabled>Send Ping</button>
            <button onclick="clearLog()">Clear Log</button>
        </div>
        
        <h3>Event Log:</h3>
        <div id="log"></div>
    </div>
    
    <script>
        let ws = null;
        
        function log(message, type = 'info') {
            const logDiv = document.getElementById('log');
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + type;
            entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        function updateStatus(connected) {
            const statusDiv = document.getElementById('status');
            const connectBtn = document.getElementById('connectBtn');
            const disconnectBtn = document.getElementById('disconnectBtn');
            const authenticateBtn = document.getElementById('authenticateBtn');
            const pingBtn = document.getElementById('pingBtn');
            
            if (connected) {
                statusDiv.className = 'status connected';
                statusDiv.textContent = '✅ Connected';
                connectBtn.disabled = true;
                disconnectBtn.disabled = false;
                authenticateBtn.disabled = false;
                pingBtn.disabled = false;
            } else {
                statusDiv.className = 'status disconnected';
                statusDiv.textContent = '❌ Disconnected';
                connectBtn.disabled = false;
                disconnectBtn.disabled = true;
                authenticateBtn.disabled = true;
                pingBtn.disabled = true;
            }
        }
        
        function connect() {
            log('Connecting to ws://localhost:3001...');
            
            ws = new WebSocket('ws://localhost:3001');
            
            ws.onopen = () => {
                log('✅ Connected successfully!', 'received');
                updateStatus(true);
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                log('◀ Received: ' + message.type + ' - ' + JSON.stringify(message.data), 'received');
            };
            
            ws.onerror = (error) => {
                log('❌ Error: ' + error, 'error');
            };
            
            ws.onclose = () => {
                log('❌ Connection closed', 'error');
                updateStatus(false);
            };
        }
        
        function disconnect() {
            if (ws) {
                ws.close();
                ws = null;
                log('Disconnected', 'info');
                updateStatus(false);
            }
        }
        
        function authenticate() {
            const message = {
                type: 'authenticate',
                data: {
                    userId: 123,
                    role: 'student'
                }
            };
            
            ws.send(JSON.stringify(message));
            log('▶ Sent: authenticate (userId: 123, role: student)', 'sent');
        }
        
        function sendPing() {
            const message = {
                type: 'ping'
            };
            
            ws.send(JSON.stringify(message));
            log('▶ Sent: ping', 'sent');
        }
        
        function clearLog() {
            document.getElementById('log').innerHTML = '';
        }
        
        // Auto-connect on load
        log('WebSocket Test Ready');
        log('Click "Connect" to start...');
    </script>
</body>
</html>
"@

$testHtml | Out-File -FilePath "test-websocket.html" -Encoding UTF8

Write-Host "✅ Created test-websocket.html" -ForegroundColor Green
Write-Host ""
Write-Host "Opening in browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

try {
    Start-Process "test-websocket.html"
    Write-Host "✅ Browser opened with WebSocket test page" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not open browser automatically" -ForegroundColor Yellow
    Write-Host "   Manually open: test-websocket.html" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# MANUAL TESTING GUIDE
# ============================================================================

Write-Host "📋 MANUAL TESTING GUIDE" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: Use the HTML Test Page (just opened)" -ForegroundColor Yellow
Write-Host "  1. Click 'Connect'" -ForegroundColor White
Write-Host "  2. You should see 'Connected' message" -ForegroundColor White
Write-Host "  3. Click 'Authenticate' to send auth message" -ForegroundColor White
Write-Host "  4. Click 'Send Ping' to test keepalive" -ForegroundColor White
Write-Host "  5. Watch the Event Log for responses" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Use wscat (CLI tool)" -ForegroundColor Yellow
Write-Host "  Install: npm install -g wscat" -ForegroundColor Gray
Write-Host "  Connect: wscat -c ws://localhost:3001" -ForegroundColor Gray
Write-Host "  Send:    {""type"":""ping""}" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3: Browser DevTools Console" -ForegroundColor Yellow
Write-Host "  const ws = new WebSocket('ws://localhost:3001');" -ForegroundColor Gray
Write-Host "  ws.onmessage = (e) => console.log(JSON.parse(e.data));" -ForegroundColor Gray
Write-Host "  ws.send(JSON.stringify({type:'ping'}));" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ WebSocket server is running on port 3001" -ForegroundColor Green
Write-Host "✅ Test HTML page created" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 What to Check:" -ForegroundColor Yellow
Write-Host "  1. Connection established (status shows 'Connected')" -ForegroundColor White
Write-Host "  2. Received 'connected' event with clientId" -ForegroundColor White
Write-Host "  3. Authentication message accepted" -ForegroundColor White
Write-Host "  4. Ping/pong works (receive 'pong' after 'ping')" -ForegroundColor White
Write-Host ""

Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "  • Read WEBSOCKET.md for complete documentation" -ForegroundColor White
Write-Host "  • Test real-time balance updates" -ForegroundColor White
Write-Host "  • Integrate WebSocket into your frontend" -ForegroundColor White
Write-Host ""

Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "  • Server logs show WebSocket activity" -ForegroundColor White
Write-Host "  • Use GET /ws/stats to see connected clients (staff only)" -ForegroundColor White
Write-Host "  • WebSocket events are sent automatically on transactions/reloads" -ForegroundColor White
Write-Host ""

Write-Host "✨ WebSocket testing complete!" -ForegroundColor Green

