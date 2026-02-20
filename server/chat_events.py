"""
Socket.IO event handlers for the chat application.

This module defines all Socket.IO event handlers including:
- connect/disconnect lifecycle events
- test_message handler for debugging
- join/leave room handlers with participant tracking
- message handlers for chat functionality with timestamps and sender IDs
"""
from flask_socketio import join_room, leave_room, emit
from flask import request
from datetime import datetime
from collections import defaultdict

# SocketIO instance - set during initialization
socketio = None
# Logger instance - set during initialization
logger = None

# Participant tracking: room_name -> set of session IDs
room_participants = defaultdict(set)
# Client room tracking: session_id -> set of room names
client_rooms = defaultdict(set)


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
    
    # ========== HELPER FUNCTIONS ==========
    
    def get_timestamp():
        """Get current timestamp in ISO format"""
        return datetime.utcnow().isoformat() + 'Z'
    
    def add_participant_to_room(room, sid):
        """Add a participant to a room and track the relationship"""
        room_participants[room].add(sid)
        client_rooms[sid].add(room)
        if logger:
            logger.debug(f'Added {sid} to room {room}. Room now has {len(room_participants[room])} participants')
    
    def remove_participant_from_room(room, sid):
        """Remove a participant from a room and clean up empty rooms"""
        room_participants[room].discard(sid)
        client_rooms[sid].discard(room)
        
        # Clean up empty room
        if not room_participants[room]:
            del room_participants[room]
        
        # Clean up client if no rooms
        if not client_rooms[sid]:
            del client_rooms[sid]
        
        if logger:
            logger.debug(f'Removed {sid} from room {room}')
    
    def get_room_participants(room):
        """Get list of participant session IDs in a room"""
        return list(room_participants.get(room, set()))
    
    def cleanup_client_rooms(sid):
        """Remove client from all rooms on disconnect"""
        rooms_to_leave = list(client_rooms.get(sid, set()))
        for room in rooms_to_leave:
            remove_participant_from_room(room, sid)
            leave_room(room)
            # Notify room members
            emit('user_left', {
                'room': room,
                'sid': sid,
                'timestamp': get_timestamp(),
                'participants': get_room_participants(room)
            }, room=room, skip_sid=sid)
        return rooms_to_leave
    
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
            
            # Clean up all rooms the client was in
            rooms_left = cleanup_client_rooms(client_id)
            
            if logger:
                logger.info(f'Client disconnected: {client_id} (was in {len(rooms_left)} rooms)')
            else:
                print(f'Client disconnected: {client_id} (was in {len(rooms_left)} rooms)')
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
        Tracks participants using request.sid and broadcasts participant list updates.
        
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
            
            # Validate room name (basic sanitization)
            room = str(room).strip()
            if not room or len(room) > 100:
                error_msg = 'Invalid room name'
                if logger:
                    logger.warning(f'Invalid room name from {client_id}: {room}')
                emit('error', {'message': error_msg})
                return
            
            # Join the Socket.IO room
            join_room(room)
            
            # Track participant
            was_new_participant = client_id not in room_participants[room]
            add_participant_to_room(room, client_id)
            
            # Get current participants list
            participants = get_room_participants(room)
            
            if logger:
                logger.info(f'Client {client_id} joined room: {room} ({len(participants)} participants)')
            else:
                print(f'Client {client_id} joined room: {room} ({len(participants)} participants)')
            
            # Send confirmation to the joining client
            emit('joined', {
                'room': room,
                'sid': client_id,
                'timestamp': get_timestamp(),
                'participants': participants,
                'status': 'success'
            })
            
            # Notify other room members (skip the joining client)
            if was_new_participant:
                emit('user_joined', {
                    'room': room,
                    'sid': client_id,
                    'timestamp': get_timestamp(),
                    'participants': participants
                }, room=room, skip_sid=client_id)
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
        Removes participant tracking and broadcasts updates to room members.
        
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
            
            room = str(room).strip()
            
            # Check if client is actually in the room
            if client_id not in room_participants.get(room, set()):
                error_msg = 'Not a member of this room'
                if logger:
                    logger.warning(f'Leave request for non-member {client_id} from room {room}')
                emit('error', {'message': error_msg})
                return
            
            # Leave the Socket.IO room
            leave_room(room)
            
            # Remove participant tracking
            remove_participant_from_room(room, client_id)
            
            # Get updated participants list
            participants = get_room_participants(room)
            
            if logger:
                logger.info(f'Client {client_id} left room: {room} ({len(participants)} remaining)')
            else:
                print(f'Client {client_id} left room: {room} ({len(participants)} remaining)')
            
            # Send confirmation to the leaving client
            emit('left', {
                'room': room,
                'sid': client_id,
                'timestamp': get_timestamp(),
                'status': 'success'
            })
            
            # Notify remaining room members
            emit('user_left', {
                'room': room,
                'sid': client_id,
                'timestamp': get_timestamp(),
                'participants': participants
            }, room=room)
        except Exception as e:
            error_msg = f'Error handling leave event: {e}'
            if logger:
                logger.error(error_msg, exc_info=True)
            else:
                print(error_msg)
            emit('error', {'message': 'Failed to leave room'})
    
    @socketio.on('get_participants')
    def on_get_participants(data):
        """
        Get the list of participants in a room.
        
        Expected data format:
        {
            'room': 'room_name'
        }
        
        Returns:
        {
            'room': 'room_name',
            'participants': [list of session IDs],
            'count': number of participants
        }
        """
        try:
            room = data.get('room') if isinstance(data, dict) else None
            client_id = request.sid
            
            if not room:
                error_msg = 'Room name is required'
                if logger:
                    logger.warning(f'Get participants request without room from {client_id}')
                emit('error', {'message': error_msg})
                return
            
            room = str(room).strip()
            participants = get_room_participants(room)
            
            emit('participants_list', {
                'room': room,
                'participants': participants,
                'count': len(participants),
                'timestamp': get_timestamp()
            })
        except Exception as e:
            error_msg = f'Error handling get_participants event: {e}'
            if logger:
                logger.error(error_msg, exc_info=True)
            else:
                print(error_msg)
            emit('error', {'message': 'Failed to get participants list'})
    
    # ========== CHAT MESSAGE HANDLER ==========
    
    @socketio.on('message')
    def on_message(data):
        """
        Handle chat messages and broadcast to room.
        Automatically adds timestamp and sender ID (request.sid) to all messages.
        Validates that sender is a member of the room before broadcasting.
        
        Expected data format:
        {
            'room': 'room_name',
            'message': 'message content',
            'username': optional username
        }
        
        Server adds:
        - 'timestamp': ISO format timestamp
        - 'sid': sender session ID
        """
        try:
            if not isinstance(data, dict):
                error_msg = 'Invalid message format'
                if logger:
                    logger.warning(f'Invalid message format from {request.sid}')
                emit('error', {'message': error_msg})
                return
            
            room = data.get('room')
            message_text = data.get('message', '').strip()
            client_id = request.sid
            
            # Validate room
            if not room:
                error_msg = 'Room name is required'
                if logger:
                    logger.warning(f'Message without room from {client_id}')
                emit('error', {'message': error_msg})
                return
            
            room = str(room).strip()
            
            # Validate message content
            if not message_text:
                error_msg = 'Message content cannot be empty'
                if logger:
                    logger.warning(f'Empty message from {client_id} in room {room}')
                emit('error', {'message': error_msg})
                return
            
            # Check if client is a member of the room
            if client_id not in room_participants.get(room, set()):
                error_msg = 'You must join the room before sending messages'
                if logger:
                    logger.warning(f'Message from non-member {client_id} in room {room}')
                emit('error', {'message': error_msg})
                return
            
            # Prepare message with server-added fields
            message_data = {
                'room': room,
                'message': message_text,
                'sid': client_id,  # Sender session ID
                'timestamp': get_timestamp(),  # Server-generated timestamp
                'username': data.get('username'),  # Optional username from client
            }
            
            if logger:
                logger.debug(f'Message in room {room} from {client_id}: {message_text[:50]}')
            
            # Broadcast message to all clients in the room (including sender)
            emit('message', message_data, room=room)
        except Exception as e:
            error_msg = f'Error handling message event: {e}'
            if logger:
                logger.error(error_msg, exc_info=True)
            else:
                print(error_msg)
            emit('error', {'message': 'Failed to send message'})
    
    if logger:
        logger.info('Socket.IO event handlers registered successfully')