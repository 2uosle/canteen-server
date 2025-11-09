// tests/setup.js
// Jest setup file to handle test environment initialization

// Ensure test env has a deterministic JWT secret for signing/verification
process.env.NODE_ENV = 'test';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key';
}

// Mock the WebSocket server to prevent port conflicts during testing
jest.mock('../config/websocket', () => {
  // Create a mock WebSocket server
  const mockClients = new Map();
  
  return {
    sendToUser: jest.fn((userId, event, data) => {
      // Mock implementation - just log during tests
      // console.log(`[Mock WS] Sending to user ${userId}:`, event);
    }),
    sendToRole: jest.fn((role, event, data) => {
      // Mock implementation
      // console.log(`[Mock WS] Sending to role ${role}:`, event);
    }),
    broadcastToAll: jest.fn((event, data) => {
      // Mock implementation
      // console.log(`[Mock WS] Broadcasting:`, event);
    }),
    getWsStats: jest.fn(() => ({
      totalConnections: 0,
      studentConnections: 0,
      staffConnections: 0,
      vendorConnections: 0
    }))
  };
});

// Suppress console.log during tests (optional)
// Comment this out if you need to see logs during test development
global.console = {
  ...console,
  log: jest.fn(), // Mock console.log
  // Keep error, warn, etc for debugging
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

