import React, { useState, useEffect } from 'react';
import socket, { getConnectionStatus } from './socket';

/**
 * Root App component with connection status UI
 */
function App() {
  const [connectionStatus, setConnectionStatus] = useState(getConnectionStatus());
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    // Update connection status when socket events occur
    const updateStatus = () => {
      setConnectionStatus(getConnectionStatus());
      setSocketId(socket.id || null);
    };

    // Listen to connection events
    socket.on('connect', () => {
      updateStatus();
    });

    socket.on('disconnect', () => {
      updateStatus();
    });

    socket.on('connect_error', () => {
      updateStatus();
    });

    socket.on('reconnect', () => {
      updateStatus();
    });

    // Initial status check
    updateStatus();

    // Cleanup listeners on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect');
    };
  }, []);

  // Listen for server connection confirmation
  useEffect(() => {
    const handleConnected = (data) => {
      console.log('Server confirmed connection:', data);
      setSocketId(data.sid);
    };

    socket.on('connected', handleConnected);

    return () => {
      socket.off('connected', handleConnected);
    };
  }, []);

  const getStatusColor = () => {
    if (connectionStatus.connected) return '#10b981'; // green
    if (connectionStatus.connecting) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getStatusText = () => {
    if (connectionStatus.connected) return 'Connected';
    if (connectionStatus.connecting) return 'Connecting...';
    return 'Disconnected';
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Lightweight Chat App</h1>
        <div style={styles.statusContainer}>
          <div
            style={{
              ...styles.statusIndicator,
              backgroundColor: getStatusColor(),
            }}
          />
          <span style={styles.statusText}>{getStatusText()}</span>
          {connectionStatus.error && (
            <span style={styles.errorText}> - {connectionStatus.error}</span>
          )}
        </div>
        {socketId && (
          <div style={styles.socketId}>
            Socket ID: <code style={styles.code}>{socketId}</code>
          </div>
        )}
      </header>

      <main style={styles.main}>
        <div style={styles.placeholder}>
          <h2 style={styles.placeholderTitle}>Welcome to Lightweight Chat</h2>
          <p style={styles.placeholderText}>
            {connectionStatus.connected
              ? 'Connected to server. Chat functionality will be available here.'
              : 'Connecting to server...'}
          </p>
          {!connectionStatus.connected && (
            <p style={styles.helpText}>
              Make sure the Flask server is running on port 5000
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

// Inline styles for the placeholder UI
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '1rem 2rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#111827',
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  statusIndicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  },
  statusText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },
  errorText: {
    fontSize: '0.875rem',
    color: '#ef4444',
  },
  socketId: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '0.25rem',
  },
  code: {
    backgroundColor: '#f3f4f6',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  placeholder: {
    textAlign: 'center',
    maxWidth: '600px',
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  placeholderTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
  },
  placeholderText: {
    margin: '0 0 0.5rem 0',
    fontSize: '1rem',
    color: '#6b7280',
  },
  helpText: {
    margin: '1rem 0 0 0',
    fontSize: '0.875rem',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
};

export default App;