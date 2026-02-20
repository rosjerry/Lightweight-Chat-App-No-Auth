from flask_socketio import join_room,leave_room,emit
from .app import socketio

@socketio.on('join')
def on_join(data):
    room=data.get('room')
    join_room(room)

@socketio.on('message')
def on_message(data):
    room=data.get('room')
    emit('message',data,room=room)