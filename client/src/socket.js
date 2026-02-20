import { io } from 'socket.io-client';

/**
 * Shared Socket.IO client instance
 * Configured to connect to the Flask-SocketIO server
 * 
 * API URL priority:
 * 1. REACT_APP_API_URL environment variable (for production builds)
 * 2. Window location origin + '/socket.io' (when using webpack proxy)
 * 3. Default: http://localhost:5000
 */
const getApiUrl = () => {
  // Use environment variable if set (for production)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In development with webpack proxy, use relative path
  // Webpack dev server will proxy /socket.io requests to backend
  if (process.env.NODE_ENV === 'development' && window.location.port === '8080') {
    return window.location.origin;
  }
  
  // Fallback to default backend URL
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const apiUrl = getApiUrl();
console.log('Socket.IO connecting to:', apiUrl);

const socket = io(apiUrl, {
  // Connection options
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  // Use path if proxying through webpack dev server
  path: window.location.port === '8080' ? '/socket.io' : undefined,
});

// Connection status tracking
let connectionStatus = {
  connected: false,
  connecting: true,
  error: null,
};

// Listen for connection events
socket.on('connect', () => {
  connectionStatus.connected = true;
  connectionStatus.connecting = false;
  connectionStatus.error = null;
  console.log('Socket.IO connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  connectionStatus.connected = false;
  connectionStatus.connecting = false;
  console.log('Socket.IO disconnected:', reason);
});

socket.on('connect_error', (error) => {
  connectionStatus.connected = false;
  connectionStatus.connecting = false;
  connectionStatus.error = error.message;
  console.error('Socket.IO connection error:', error);
});

socket.on('reconnect', (attemptNumber) => {
  connectionStatus.connected = true;
  connectionStatus.connecting = false;
  connectionStatus.error = null;
  console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_attempt', () => {
  connectionStatus.connecting = true;
  console.log('Socket.IO attempting to reconnect...');
});

socket.on('reconnect_error', (error) => {
  connectionStatus.error = error.message;
  console.error('Socket.IO reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  connectionStatus.connecting = false;
  connectionStatus.error = 'Failed to reconnect';
  console.error('Socket.IO reconnection failed');
});

// Helper function to get current connection status
export const getConnectionStatus = () => ({ ...connectionStatus });

// Helper function to check if connected
export const isConnected = () => connectionStatus.connected;

export default socket;