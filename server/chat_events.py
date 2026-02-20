"""
Socket.IO event handlers for the chat application.

This module defines all Socket.IO event handlers including:
- connect/disconnect lifecycle events
- test_message handler for debugging
- join/leave room handlers
- message handlers for chat functionality
"""
from flask_socketio import join_room, leave_room, emit
from flask import request

# SocketIO instance - set during initialization
socketio = None
# Logger instance - set during initialization
logger = None


def init_events(sio, log=None):
    """
    Initialize Socket.IO event handlers with socketio instance.
    
    Args:
        sio: SocketIO instance from Flask-SocketIO
        log: Logger instance (optional)
    """
    global socketio, logger
    socketio = sio
    logger = log
    
    if logger:
        logger.info('Registering Socket.IO event handlers')
    
    # ========== CONNECTION LIFECYCLE EVENTS ==========
    
    @socketio.on('connect')
    def on_connect():
        """Handle client connection - Socket.IO lifecycle event"""
        try:
            client_id = request.sid
            if logger:
                logger.info(f'Client connected: {client_id}')
            else:
                print(f'Client connected: {client_id}')
            
            emit('connected', {
                'message': 'Connected to server',
                'sid': client_id,
                'status': 'success'
            })
        except Exception as e:
            error_msg = f'Error handling connect event: {e}'
            if logger:
                logger.error(error_msg, exc_info=True)
            else:
                print(error_msg)
            emit('error', {'message': 'Connection error occurred'})
    
    @socketio.on('disconnect')
    def on_disconnect():
        """Handle client disconnection - Socket.IO lifecycle event"""
        try:
            client_id = request.sid
            if logger:
                logger.info(f'Client disconnected: {client_id}')
            else:
                print(f'Client disconnected: {client_id}')
        except Exception as e:
            error_msg = f'Error handling disconnect event: {e}'
            if logger:
                logger.error(error_msg, exc_info=True)
            else:
                print(error_msg)
    
    # ========== TEST MESSAGE HANDLER ==========
    
    @socketio.on('test_message')
    def on_test_message(data):
        """
        Test message handler for debugging and connection verification.
        
        Expected data format:
        {
            'message': 'test message content',
            'timestamp': optional timestamp
        }
        """
        try:
            client_id = request.sid
            if logger:
                logger.debug(f'Test message received from {client_id}: {data}')
            else:
                print(f'Test message received from {client_id}: {data}')
            
            emit('test_response', {
                'message': 'Test message received',
                'original_data': data,
                'sid': client_id,
                'status': 'success'
            })
        except Exception as e:
            error_msg = f'Error handling test_message event: {e}'
            if logger:
                logger.error(error_msg, exc_info=True)
            else:
                print(error_msg)
            emit('error', {'message': 'Failed to process test message'})
    
    # ========== ROOM MANAGEMENT HANDLERS ==========
    
    @socketio.on('join')
    def on_join(data):
        """
        Handle joining a chat room.
        
        Expected data format:
        {
            'room': 'room_name'
        }
        """
        try:
            room = data.get('room') if isinstance(data, dict) else None
            client_id = request.sid
            
            if not room:
                error_msg = 'Room name is required'
                if logger:
                    logger.warning(f'Join request without room from {client_id}')
                emit('error', {'message': error_msg})
                return
            
            join_room(room)
            if logger:
                logger.info(f'Client {client_id} joined room: {room}')
            else:
                print(f'Client {client_id} joined room: {room}')
            
            emit('joined', {
                'room': room,
                'sid': client_id,
                'status': 'success'
            }, room=room)
        except Exception as e:
            error_msg = f'Error handling join event: {e}'
            if logger:
                logger.error(error_msg, exc_info=True)
            else:
                print(error_msg)
            emit('error', {'message': 'Failed to join room'})
    
    @socketio.on('leave')
    def on_leave(data):
        """
        Handle leaving a chat room.
        
        Expected data format:
        {
            'room': 'room_name'
        }
        """
        try:
            room = data.get('room') if isinstance(data, dict) else None
            client_id = request.sid
            
            if not room:
                error_msg = 'Room name is required'
                if logger:
                    logger.warning(f'Leave request without room from {client_id}')
                emit('error', {'message': error_msg})
                return
            
            leave_room(room)
            if logger:
                logger.info(f'Client {client_id} left room: {room}')
            else:
                print(f'Client {client_id} left room: {room}')
            
            emit('left', {
                'room': room,
                'sid': client_id,
                'status': 'success'
            })
        except Exception as e:
            error_msg = f'Error handling leave event: {e}'
            if logger:
                logger.error(error_msg, exc_info=True)
            else:
                print(error_msg)
            emit('error', {'message': 'Failed to leave room'})
    
    # ========== CHAT MESSAGE HANDLER ==========
    
    @socketio.on('message')
    def on_message(data):
        """
        Handle chat messages and broadcast to room.
        
        Expected data format:
        {
            'room': 'room_name',
            'message': 'message content',
            'username': optional username,
            'timestamp': optional timestamp
        }
        """
        try:
            if not isinstance(data, dict):
                error_msg = 'Invalid message format'
                if logger:
                    logger.warning(f'Invalid message format from {request.sid}')
                emit('error', {'message': error_msg})
                return
            
            room = data.get('room')
            client_id = request.sid
            
            if not room:
                error_msg = 'Room name is required'
                if logger:
                    logger.warning(f'Message without room from {client_id}')
                emit('error', {'message': error_msg})
                return
            
            if logger:
                logger.debug(f'Message in room {room} from {client_id}: {data.get("message", "")[:50]}')
            
            # Broadcast message to all clients in the room
            emit('message', data, room=room)
        except Exception as e:
            error_msg = f'Error handling message event: {e}'
            if logger:
                logger.error(error_msg, exc_info=True)
            else:
                print(error_msg)
            emit('error', {'message': 'Failed to send message'})
    
    if logger:
        logger.info('Socket.IO event handlers registered successfully')