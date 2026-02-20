import { io } from 'socket.io-client';

/**
 * Shared Socket.IO client instance
 * Configured to connect to the Flask-SocketIO server
 */
const socket = io('http://localhost:5000', {
  // Connection options
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
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