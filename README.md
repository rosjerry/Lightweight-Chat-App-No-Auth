# Bitasmbl-Lightweight-Chat-App-No-Auth-182910

## Description
Build a web application that allows users to join anonymous chatrooms and exchange messages in real-time using WebSockets. The focus is on fast communication, simple interface, and responsive updates without requiring user registration.

## Tech Stack
- React
- Flask
- Socket.IO

## Requirements
- React
- Flask
- Socket.IO

## Installation

```bash
git clone https://github.com/rosjerry/Lightweight-Chat-App-No-Auth.git
cd Lightweight-Chat-App-No-Auth
```

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd client
npm install
cd ..
```

## Usage

### Running the Server (Backend)
**Windows:**
```bash
run_server.bat
```

**Linux/Mac:**
```bash
chmod +x run_server.sh
./run_server.sh
```

**Or manually:**
```bash
cd server
python app.py
```

The server will start on `http://localhost:5000`

### Running the Client (Frontend)
**Windows:**
```bash
run_client.bat
```

**Linux/Mac:**
```bash
chmod +x run_client.sh
./run_client.sh
```

**Or manually:**
```bash
cd client
npm start
```

The client will start on `http://localhost:8080` (or another port if 8080 is busy)

## Socket.IO Events

### Server Events
- `connect` - Client connects to server
- `disconnect` - Client disconnects from server
- `test_message` - Test message handler for debugging
- `join` - Join a chat room
- `message` - Send a chat message

### Client Events
- `connected` - Server confirms connection
- `test_response` - Response to test message
- `joined` - Confirmation of joining a room
- `message` - Receive a chat message

## Implementation Steps
1. Initialize Flask app and configure Socket.IO server.
2. Define Socket.IO events for joining rooms and sending messages.
3. Create React components for chatroom selection and message view.
4. Connect React to Socket.IO for real-time updates.
5. Ensure layout is simple and responsive.

## API Endpoints
- WebSocket events via Socket.IO for joining rooms and exchanging messages.