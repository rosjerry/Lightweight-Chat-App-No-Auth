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

# Optional: Configure environment variables
# Copy .env.example to .env and modify as needed
cp .env.example .env
```

**Environment Variables:**
- `SECRET_KEY` - Flask secret key (default: 'secret-dev-key-change-in-production')
- `PORT` - Server port (default: 5000)
- `DEBUG` - Enable debug mode (default: False)
- `ASYNC_MODE` - Socket.IO async mode: 'eventlet' or 'gevent' (default: 'eventlet')

### Frontend Setup
```bash
cd client
npm install

# Optional: Configure environment variables
# Copy .env.example to .env and modify as needed
cp .env.example .env
cd ..
```

**Frontend Environment Variables:**
- `REACT_APP_API_URL` - Backend API URL (default: `http://localhost:5000`)
  - Leave empty in development to use webpack proxy
  - Set to production URL when building for production
- `PORT` - Webpack dev server port (default: 8080)
- `OPEN_BROWSER` - Auto-open browser on start (default: true)

## Usage

### Quick Start (Recommended)

**Option 1: Start both servers with one command (Easiest)**

**Windows:**
```bash
start_dev.bat
```

**Linux/Mac:**
```bash
chmod +x start_dev.sh
./start_dev.sh
```

This will start both the backend and frontend servers automatically.

**Option 2: Start servers separately**

**Windows:**
```bash
# Terminal 1 - Backend
run_server.bat

# Terminal 2 - Frontend
run_client.bat
```

**Linux/Mac:**
```bash
# Terminal 1 - Backend
chmod +x run_server.sh
./run_server.sh

# Terminal 2 - Frontend
chmod +x run_client.sh
./run_client.sh
```

**Option 3: Manual startup**

```bash
# Terminal 1 - Backend
cd server
python app.py

# Terminal 2 - Frontend
cd client
npm start
```

### Running the Server (Backend)

The Flask-SocketIO server runs on `http://localhost:5000` by default.

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

**Environment Variables:**
- `PORT` - Server port (default: 5000)
- `DEBUG` - Enable debug mode (default: False). When True, allows all CORS origins
- `CORS_ORIGINS` - Comma-separated list of allowed origins (only used when DEBUG=False)
- `SECRET_KEY` - Flask secret key
- `ASYNC_MODE` - Socket.IO async mode (default: 'eventlet')

### Running the Client (Frontend)

The React dev server runs on `http://localhost:8080` by default (or another port if 8080 is busy).

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

**Available npm scripts:**
- `npm start` - Start dev server with webpack proxy (recommended)
- `npm run dev` - Start dev server without auto-open browser
- `npm run build` - Build for production (uses production env vars)
- `npm run build:dev` - Build for development
- `npm run build:prod` - Build for production (explicit)

**Frontend Configuration Files:**
- `client/webpack.config.js` - Webpack configuration with proxy setup
- `client/.env.example` - Example environment variables
- `client/.env.development` - Development environment (used by `npm start`)
- `client/.env.production` - Production environment (used by `npm run build`)
- `client/CONFIGURATION.md` - Detailed configuration guide

For detailed frontend configuration options, see [client/CONFIGURATION.md](client/CONFIGURATION.md).

### Frontend-Backend Integration

**Webpack Proxy Configuration:**
The React dev server is configured with a proxy that forwards Socket.IO requests to the Flask backend. This eliminates CORS issues during development.

- Webpack dev server runs on `http://localhost:8080`
- Proxy forwards `/socket.io/*` requests to `http://localhost:5000`
- No CORS configuration needed when using the proxy

**Environment-Based Configuration:**
The frontend uses environment variables to configure the backend connection:

**Development (with proxy):**
```bash
# client/.env.development (or leave REACT_APP_API_URL empty)
REACT_APP_API_URL=
PORT=8080
```
The webpack proxy will handle routing Socket.IO requests to the backend.

**Development (direct connection):**
```bash
# client/.env
REACT_APP_API_URL=http://localhost:5000
```
Socket.IO will connect directly to the backend (requires CORS configuration).

**Production:**
```bash
# client/.env.production
REACT_APP_API_URL=https://your-production-api.com
```
Set to your production backend URL when building.

### CORS Configuration

**Backend CORS Settings:**
The Flask backend is configured to allow connections from common React dev server ports:
- `http://localhost:3000` (Create React App default)
- `http://localhost:8080` (Webpack dev server default)
- `http://localhost:5173` (Vite default)

**Development Mode:**
When `DEBUG=True`, all origins are allowed for development flexibility.

**Production Mode:**
When `DEBUG=False`, only origins specified in `CORS_ORIGINS` are allowed.

To customize allowed origins, set the `CORS_ORIGINS` environment variable:
```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:8080,https://yourdomain.com
```

**Note:** When using the webpack proxy (default in development), CORS is not required as requests are proxied through the same origin.

### Concurrent Development

**Option 1: Using startup scripts (Recommended)**
```bash
# Windows
start_dev.bat

# Linux/Mac
chmod +x start_dev.sh
./start_dev.sh
```

**Option 2: Manual startup**

For the best development experience, run both servers in separate terminals:

1. **Terminal 1** - Start the Flask backend:
   ```bash
   cd server
   python app.py
   ```
   Backend will start on `http://localhost:5000`

2. **Terminal 2** - Start the React frontend:
   ```bash
   cd client
   npm start
   ```
   Frontend will start on `http://localhost:8080`

**How it works:**
- The React app connects to the Flask-SocketIO server
- In development, webpack proxy forwards Socket.IO requests from `http://localhost:8080` to `http://localhost:5000`
- No CORS issues because requests are proxied through the same origin
- Socket.IO WebSocket connections are properly proxied

**Configuration Files:**
- `client/webpack.config.js` - Webpack proxy configuration
- `client/.env.development` - Development environment variables
- `client/.env.production` - Production environment variables
- `server/app.py` - Flask CORS and Socket.IO configuration

## Socket.IO Events

### Server Event Handlers
All event handlers include comprehensive error handling and logging:

- **`connect`** - Handles client connection lifecycle event
  - Logs connection with client session ID
  - Emits `connected` event with session details
  
- **`disconnect`** - Handles client disconnection lifecycle event
  - Logs disconnection with client session ID
  
- **`test_message`** - Test/debug message handler
  - Accepts: `{message: string, timestamp?: number}`
  - Emits: `test_response` with original data and status
  
- **`join`** - Join a chat room
  - Accepts: `{room: string}`
  - Emits: `joined` event to room members
  
- **`leave`** - Leave a chat room
  - Accepts: `{room: string}`
  - Emits: `left` event confirmation
  
- **`message`** - Send a chat message to room
  - Accepts: `{room: string, message: string, username?: string, timestamp?: number}`
  - Broadcasts message to all clients in the room

### Client Events (Emitted by Server)
- **`connected`** - Connection confirmation with session ID
- **`test_response`** - Response to test messages
- **`joined`** - Confirmation of joining a room
- **`left`** - Confirmation of leaving a room
- **`message`** - Chat message broadcast
- **`error`** - Error notifications

## Features

- ✅ Explicit async_mode configuration (eventlet/gevent) for production consistency
- ✅ Comprehensive logging for all Socket.IO lifecycle events
- ✅ Error handling with try-catch blocks for all event handlers
- ✅ Environment variable configuration for security (SECRET_KEY, PORT, DEBUG, ASYNC_MODE)
- ✅ Verifiable event handler definitions in `server/chat_events.py`

## Implementation Steps
1. Initialize Flask app and configure Socket.IO server.
2. Define Socket.IO events for joining rooms and sending messages.
3. Create React components for chatroom selection and message view.
4. Connect React to Socket.IO for real-time updates.
5. Ensure layout is simple and responsive.

## API Endpoints
- WebSocket events via Socket.IO for joining rooms and exchanging messages.