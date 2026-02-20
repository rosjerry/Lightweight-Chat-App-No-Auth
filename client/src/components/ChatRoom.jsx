import React, { useState, useEffect, useRef } from 'react';
import socket, { isConnected } from '../socket';

/**
 * ChatRoom component with room selector and real-time messaging
 * Features:
 * - Room selection and creation
 * - Real-time message display
 * - Message input and sending
 * - Participant tracking
 * - Responsive layout
 */
export default function ChatRoom() {
  // Room management state
  const [currentRoom, setCurrentRoom] = useState('main');
  const [roomInput, setRoomInput] = useState('');
  const [availableRooms] = useState(['main', 'general', 'random', 'tech', 'gaming']);
  
  // Message state - organized by room
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  
  // Participant tracking
  const [participants, setParticipants] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  
  // Refs for auto-scrolling
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // Get current room messages
  const currentMessages = messagesByRoom[currentRoom] || [];
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);
  
  // Initialize username from localStorage or generate one
  useEffect(() => {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      const generatedUsername = `User_${Math.random().toString(36).substr(2, 6)}`;
      setUsername(generatedUsername);
      localStorage.setItem('chatUsername', generatedUsername);
    }
  }, []);
  
  // Join room when currentRoom changes
  useEffect(() => {
    if (isConnected() && currentRoom) {
      joinRoom(currentRoom);
    }
  }, [currentRoom]);
  
  // Socket event subscriptions
  useEffect(() => {
    if (!isConnected()) return;
    
    // Handle successful join
    const handleJoined = (data) => {
      if (data.room === currentRoom) {
        setParticipants(data.participants || []);
        setIsJoining(false);
        addSystemMessage(currentRoom, `You joined room: ${data.room}`, data.timestamp);
      }
    };
    
    // Handle user joined notification
    const handleUserJoined = (data) => {
      if (data.room === currentRoom) {
        setParticipants(data.participants || []);
        addSystemMessage(currentRoom, `User ${data.sid.substring(0, 8)} joined`, data.timestamp);
      }
    };
    
    // Handle user left notification
    const handleUserLeft = (data) => {
      if (data.room === currentRoom) {
        setParticipants(data.participants || []);
        addSystemMessage(currentRoom, `User ${data.sid.substring(0, 8)} left`, data.timestamp);
      }
    };
    
    // Handle incoming messages
    const handleMessage = (data) => {
      if (data.room === currentRoom) {
        addMessage(data.room, {
          id: `${data.sid}-${data.timestamp}`,
          message: data.message,
          sid: data.sid,
          username: data.username || `User_${data.sid.substring(0, 8)}`,
          timestamp: data.timestamp,
          isOwn: data.sid === socket.id,
        });
      }
    };
    
    // Handle errors
    const handleError = (data) => {
      console.error('Socket error:', data.message);
      addSystemMessage(currentRoom, `Error: ${data.message}`, new Date().toISOString());
      setIsJoining(false);
    };
    
    // Subscribe to events
    socket.on('joined', handleJoined);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('message', handleMessage);
    socket.on('error', handleError);
    
    // Cleanup on unmount
    return () => {
      socket.off('joined', handleJoined);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('message', handleMessage);
      socket.off('error', handleError);
    };
  }, [currentRoom]);
  
  // Helper function to add a message
  const addMessage = (room, message) => {
    setMessagesByRoom(prev => ({
      ...prev,
      [room]: [...(prev[room] || []), message],
    }));
  };
  
  // Helper function to add system message
  const addSystemMessage = (room, text, timestamp) => {
    addMessage(room, {
      id: `system-${Date.now()}`,
      message: text,
      sid: 'system',
      username: 'System',
      timestamp: timestamp || new Date().toISOString(),
      isSystem: true,
    });
  };
  
  // Join a room
  const joinRoom = (roomName) => {
    if (!roomName || !roomName.trim()) return;
    
    const room = roomName.trim();
    setIsJoining(true);
    
    // Leave current room if different
    if (currentRoom && currentRoom !== room) {
      socket.emit('leave', { room: currentRoom });
    }
    
    // Join new room
    socket.emit('join', { room }, (response) => {
      if (response && response.error) {
        console.error('Join error:', response.error);
        setIsJoining(false);
      }
    });
    
    // Initialize room messages if needed
    if (!messagesByRoom[room]) {
      setMessagesByRoom(prev => ({
        ...prev,
        [room]: [],
      }));
    }
  };
  
  // Handle room selection
  const handleRoomSelect = (room) => {
    if (room && room !== currentRoom) {
      setCurrentRoom(room);
      setRoomInput('');
    }
  };
  
  // Handle room input submit
  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (roomInput.trim()) {
      handleRoomSelect(roomInput.trim());
    }
  };
  
  // Send a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom || !isConnected()) return;
    
    socket.emit('message', {
      room: currentRoom,
      message: newMessage.trim(),
      username: username,
    });
    
    setNewMessage('');
    messageInputRef.current?.focus();
  };
  
  // Format timestamp for display
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };
  
  return (
    <div style={styles.container}>
      {/* Room Selector Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Rooms</h2>
        </div>
        
        {/* Room List */}
        <div style={styles.roomList}>
          {availableRooms.map(room => (
            <button
              key={room}
              onClick={() => handleRoomSelect(room)}
              style={{
                ...styles.roomButton,
                ...(currentRoom === room ? styles.roomButtonActive : {}),
              }}
            >
              #{room}
            </button>
          ))}
        </div>
        
        {/* Room Input */}
        <form onSubmit={handleRoomSubmit} style={styles.roomForm}>
          <input
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="Join or create room..."
            style={styles.roomInput}
            maxLength={50}
          />
          <button type="submit" style={styles.roomSubmitButton}>
            Join
          </button>
        </form>
        
        {/* Username Display */}
        <div style={styles.usernameSection}>
          <label style={styles.usernameLabel}>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              const newUsername = e.target.value.trim() || `User_${Math.random().toString(36).substr(2, 6)}`;
              setUsername(newUsername);
              localStorage.setItem('chatUsername', newUsername);
            }}
            style={styles.usernameInput}
            maxLength={20}
          />
        </div>
        
        {/* Participant Count */}
        {participants.length > 0 && (
          <div style={styles.participantCount}>
            {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
          </div>
        )}
      </aside>
      
      {/* Main Chat Area */}
      <main style={styles.chatArea}>
        {/* Chat Header */}
        <header style={styles.chatHeader}>
          <h2 style={styles.chatTitle}>#{currentRoom}</h2>
          {isJoining && <span style={styles.joiningText}>Joining...</span>}
        </header>
        
        {/* Messages List */}
        <div style={styles.messagesContainer}>
          {currentMessages.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            currentMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.message,
                  ...(msg.isOwn ? styles.messageOwn : {}),
                  ...(msg.isSystem ? styles.messageSystem : {}),
                }}
              >
                {!msg.isSystem && (
                  <div style={styles.messageHeader}>
                    <span style={styles.messageUsername}>{msg.username}</span>
                    <span style={styles.messageTime}>{formatTime(msg.timestamp)}</span>
                  </div>
                )}
                <div style={styles.messageContent}>{msg.message}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isConnected() ? `Message #${currentRoom}...` : 'Connecting...'}
            disabled={!isConnected() || isJoining}
            style={styles.messageInput}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!isConnected() || !newMessage.trim() || isJoining}
            style={{
              ...styles.sendButton,
              ...((!isConnected() || !newMessage.trim() || isJoining) ? styles.sendButtonDisabled : {}),
            }}
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

// Styles
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
  },
  roomList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem',
  },
  roomButton: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151',
    transition: 'all 0.2s',
  },
  roomButtonActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    borderColor: '#3b82f6',
    fontWeight: '600',
  },
  roomForm: {
    padding: '0.5rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '0.5rem',
  },
  roomInput: {
    flex: 1,
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
  },
  roomSubmitButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  usernameSection: {
    padding: '0.5rem',
    borderTop: '1px solid #e5e7eb',
  },
  usernameLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
  },
  usernameInput: {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
  },
  participantCount: {
    padding: '0.5rem',
    fontSize: '0.75rem',
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '1rem 1.5rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
  },
  joiningText: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: '0.875rem',
  },
  message: {
    maxWidth: '70%',
    padding: '0.75rem',
    backgroundColor: '#ffffff',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
  },
  messageOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  messageSystem: {
    alignSelf: 'center',
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    maxWidth: '90%',
    fontStyle: 'italic',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.25rem',
    gap: '0.5rem',
  },
  messageUsername: {
    fontWeight: '600',
    fontSize: '0.875rem',
    color: '#374151',
  },
  messageTime: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  messageContent: {
    fontSize: '0.875rem',
    color: '#111827',
    wordBreak: 'break-word',
  },
  inputForm: {
    padding: '1rem 1.5rem',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '0.75rem',
  },
  messageInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
  },
  sendButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  
  // Responsive styles
  '@media (max-width: 768px)': {
    sidebar: {
      width: '200px',
    },
    message: {
      maxWidth: '85%',
    },
  },
};