import os
import logging
from flask import Flask
from flask_socketio import SocketIO
from dotenv import load_dotenv
import chat_events

# Load environment variables from .env file if it exists
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Load SECRET_KEY from environment variable with fallback
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'secret-dev-key-change-in-production')

# Explicitly configure async_mode for production consistency
# eventlet is preferred for better performance with Socket.IO
async_mode = os.getenv('ASYNC_MODE', 'eventlet')
logger.info(f'Initializing Socket.IO with async_mode: {async_mode}')

# Configure CORS for React dev server and production
# Allow common React dev server ports and production origins
allowed_origins = os.getenv(
    'CORS_ORIGINS',
    'http://localhost:3000,http://localhost:8080,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:8080,http://127.0.0.1:5173'
).split(',')

# In development, allow all origins for flexibility
# In production, use specific origins from environment variable
cors_origins = '*' if os.getenv('DEBUG', 'False').lower() == 'true' else allowed_origins

logger.info(f'CORS allowed origins: {cors_origins if cors_origins != "*" else "all (development mode)"}')

socketio = SocketIO(
    app,
    cors_allowed_origins=cors_origins,
    async_mode=async_mode,
    logger=logger.getEffectiveLevel() <= logging.DEBUG,
    engineio_logger=logger.getEffectiveLevel() <= logging.DEBUG
)

# Initialize Socket.IO event handlers
try:
    chat_events.init_events(socketio, logger)
    logger.info('Socket.IO event handlers initialized successfully')
except Exception as e:
    logger.error(f'Failed to initialize Socket.IO event handlers: {e}', exc_info=True)
    raise

@app.route('/health')
def health():
    return 'ok'

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    logger.info(f'Starting server on port {port} (debug={debug})')
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)