// config/websocket.js
// WebSocket server for real-time updates

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./env');

const WS_PORT = process.env.WS_PORT || 3001;
const wss = new WebSocket.Server({ port: WS_PORT });

// Store connected clients with metadata
const clients = new Map();

wss.on('connection', (ws, req) => {
    const clientId = Math.random().toString(36).substring(7);
    const now = new Date();
    let authTimeout = null;
    
    // Initialize client
    clients.set(clientId, {
        ws,
        isAlive: true,
        connectedAt: now,
        userId: null,
        role: null,
        ip: req.socket.remoteAddress,
        authenticatedAt: null
    });
    
    console.log(`[WebSocket] New connection: ${clientId} from ${req.socket.remoteAddress}`);
    console.log(`[WebSocket] Total clients: ${clients.size}`);
    
    // Optionally authenticate via query param token on initial connection
    try {
        const url = new URL(req.url, `ws://${req.headers.host || 'localhost'}`);
        const token = url.searchParams.get('token');
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const client = clients.get(clientId);
            if (client) {
                client.userId = decoded.user_id || decoded.userId;
                client.role = decoded.role || null;
                client.authenticatedAt = new Date();
                ws.send(JSON.stringify({ type: 'auth_ok', data: { user_id: client.userId, role: client.role } }));
            }
        }
    } catch (e) {
        // If token is provided but invalid, reject connection
        try { ws.send(JSON.stringify({ type: 'auth_error', data: { message: 'Invalid token' } })); } catch (_) {}
        ws.close(4001, 'Invalid token');
        return;
    }

    // Enforce authentication within 15s if client will need privileged channels
    authTimeout = setTimeout(() => {
        const client = clients.get(clientId);
        if (!client) return;
        if (!client.role || !client.userId) {
            // Keep connection for public broadcasts if you prefer; we choose to close to prevent spoof windows
            try { ws.send(JSON.stringify({ type: 'auth_timeout', data: { message: 'Authentication required' } })); } catch (_) {}
            ws.close(4002, 'Authentication timeout');
        }
    }, 15000);

    // Send welcome message
    ws.send(JSON.stringify({
        type: 'connected',
        data: {
            clientId,
            message: 'Connected to Canteen Server',
            timestamp: new Date().toISOString()
        }
    }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(clientId, data);
        } catch (error) {
            console.error('[WebSocket] Invalid message format:', error);
            ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Invalid message format' }
            }));
        }
    });
    
    // Handle pong (keepalive)
    ws.on('pong', () => {
        const client = clients.get(clientId);
        if (client) client.isAlive = true;
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error(`[WebSocket] Client ${clientId} error:`, error);
    });
    
    // Handle disconnection
    ws.on('close', () => {
        if (authTimeout) clearTimeout(authTimeout);
        clients.delete(clientId);
        console.log(`[WebSocket] Client ${clientId} disconnected`);
        console.log(`[WebSocket] Total clients: ${clients.size}`);
    });
});

// Handle incoming messages from clients
function handleMessage(clientId, message) {
    const client = clients.get(clientId);
    if (!client) return;
    
    console.log(`[WebSocket] Message from ${clientId}:`, message.type);
    
    switch (message.type) {
        case 'authenticate': {
            const data = message.data || {};
            const token = data.token;
            try {
                if (!token) throw new Error('Missing token');
                const decoded = jwt.verify(token, JWT_SECRET);
                client.userId = decoded.user_id || decoded.userId;
                client.role = decoded.role || null;
                client.authenticatedAt = new Date();
                // Ignore any role/user passed from client; trust JWT only
                console.log(`[WebSocket] Client ${clientId} authenticated as user ${client.userId} (${client.role})`);
                client.ws.send(JSON.stringify({ type: 'auth_ok', data: { user_id: client.userId, role: client.role } }));
            } catch (err) {
                console.warn(`[WebSocket] Auth failed for ${clientId}: ${err.message}`);
                try {
                    client.ws.send(JSON.stringify({ type: 'auth_error', data: { message: 'Invalid token' } }));
                } catch (_) {}
                client.ws.close(4001, 'Invalid token');
            }
            break;
        }
            
        case 'ping':
            client.ws.send(JSON.stringify({
                type: 'pong',
                data: { timestamp: new Date().toISOString() }
            }));
            break;
            
        case 'subscribe':
            // Client wants to subscribe to specific events
            client.subscriptions = message.data.events || [];
            break;
            
        default:
            console.log(`[WebSocket] Unknown message type: ${message.type}`);
    }
}

// Broadcast to all connected clients
function broadcast(type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    let sent = 0;
    
    clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
            sent++;
        }
    });
    
    console.log(`[WebSocket] Broadcast ${type} to ${sent} clients`);
}

// Send message to specific user
function sendToUser(userId, type, data) {
    let sent = 0;
    
    clients.forEach((client) => {
        if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
                type,
                data,
                timestamp: new Date().toISOString()
            }));
            sent++;
        }
    });
    
    if (sent > 0) {
        console.log(`[WebSocket] Sent ${type} to user ${userId} (${sent} connections)`);
    }
    
    return sent > 0;
}

// Send message to specific role(s)
function sendToRole(role, type, data) {
    let sent = 0;
    
    clients.forEach((client) => {
        if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
                type,
                data,
                timestamp: new Date().toISOString()
            }));
            sent++;
        }
    });
    
    console.log(`[WebSocket] Sent ${type} to role ${role} (${sent} clients)`);
    return sent;
}

// Keep WebSocket connections alive (ping every 30 seconds)
setInterval(() => {
    clients.forEach((client, clientId) => {
        if (client.isAlive === false) {
            console.log(`[WebSocket] Terminating inactive client ${clientId}`);
            client.ws.terminate();
            clients.delete(clientId);
            return;
        }
        
        client.isAlive = false;
        client.ws.ping();
    });
}, 30000);

// Get connection statistics
function getStats() {
    const stats = {
        totalClients: clients.size,
        byRole: {
            staff: 0,
            vendor: 0,
            student: 0,
            anonymous: 0
        },
        authenticated: 0
    };
    
    clients.forEach((client) => {
        if (client.role) {
            stats.byRole[client.role]++;
            stats.authenticated++;
        } else {
            stats.byRole.anonymous++;
        }
    });
    
    return stats;
}

console.log(`[WebSocket] Server started on port ${WS_PORT}`);

module.exports = {
    wss,
    broadcast,
    sendToUser,
    sendToRole,
    getStats
};