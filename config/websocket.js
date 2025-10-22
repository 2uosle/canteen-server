// config/websocket.js
// WebSocket server for real-time updates

const WebSocket = require('ws');

const WS_PORT = process.env.WS_PORT || 3001;
const wss = new WebSocket.Server({ port: WS_PORT });

// Store connected clients with metadata
const clients = new Map();

wss.on('connection', (ws, req) => {
    const clientId = Math.random().toString(36).substring(7);
    
    // Initialize client
    clients.set(clientId, {
        ws,
        isAlive: true,
        connectedAt: new Date(),
        userId: null,
        role: null,
        ip: req.socket.remoteAddress
    });
    
    console.log(`[WebSocket] New connection: ${clientId} from ${req.socket.remoteAddress}`);
    console.log(`[WebSocket] Total clients: ${clients.size}`);
    
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
        case 'authenticate':
            // Store user info for targeted messages
            client.userId = message.data.userId;
            client.role = message.data.role;
            console.log(`[WebSocket] Client ${clientId} authenticated as user ${client.userId} (${client.role})`);
            break;
            
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