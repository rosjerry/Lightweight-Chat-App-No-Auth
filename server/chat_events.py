from flask_socketio import join_room, leave_room, emit
from flask import request

# Import socketio from app module
# This will be set when app.py imports this module
socketio = None

def init_events(sio):
    """Initialize event handlers with socketio instance"""
    global socketio
    socketio = sio
    
    @socketio.on('connect')
    def on_connect():
        """Handle client connection"""
        print(f'Client connected: {request.sid}')
        emit('connected', {'message': 'Connected to server', 'sid': request.sid})
    
    @socketio.on('disconnect')
    def on_disconnect():
        """Handle client disconnection"""
        print(f'Client disconnected: {request.sid}')
    
    @socketio.on('test_message')
    def on_test_message(data):
        """Test message handler for debugging"""
        print(f'Test message received from {request.sid}: {data}')
        emit('test_response', {
            'message': 'Test message received',
            'original_data': data,
            'sid': request.sid
        })
    
    @socketio.on('join')
    def on_join(data):
        """Handle joining a room"""
        room = data.get('room')
        if room:
            join_room(room)
            emit('joined', {'room': room, 'sid': request.sid}, room=room)
    
    @socketio.on('message')
    def on_message(data):
        """Handle chat messages"""
        room = data.get('room')
        if room:
            emit('message', data, room=room)