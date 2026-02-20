# Frontend Configuration Guide

## Environment Variables

The React frontend uses environment variables to configure the backend connection and development server settings.

### Available Variables

- **`REACT_APP_API_URL`** - Backend API URL
  - **Development (with proxy)**: Leave empty or unset to use webpack proxy
  - **Development (direct)**: Set to `http://localhost:5000` for direct connection
  - **Production**: Set to your production backend URL (e.g., `https://api.example.com`)

- **`PORT`** - Webpack dev server port (default: 8080)

- **`OPEN_BROWSER`** - Auto-open browser on start (default: true)

### Environment Files

The project uses different environment files for different scenarios:

1. **`.env.development`** - Used automatically by `npm start` and `npm run dev`
   - Configured to use webpack proxy (REACT_APP_API_URL is empty)
   - Webpack dev server proxies Socket.IO requests to backend

2. **`.env.production`** - Used automatically by `npm run build`
   - Must set REACT_APP_API_URL to production backend URL
   - No proxy in production builds

3. **`.env`** - Local overrides (gitignored)
   - Overrides other environment files
   - Use for local development customizations

## Webpack Proxy Configuration

The webpack dev server includes a proxy configuration in `webpack.config.js` that:

- Proxies `/socket.io/*` requests to the Flask backend
- Enables WebSocket proxying for Socket.IO connections
- Eliminates CORS issues during development
- Works automatically when `REACT_APP_API_URL` is empty

### How It Works

1. React app makes Socket.IO request to `/socket.io/...`
2. Webpack dev server intercepts the request
3. Proxy forwards it to `http://localhost:5000/socket.io/...`
4. Response is proxied back to the React app
5. No CORS headers needed because request appears to come from same origin

## Socket.IO Connection Logic

The `socket.js` file implements smart connection logic:

1. **Check for `REACT_APP_API_URL` environment variable**
   - If set, use it directly (production or direct connection)

2. **Check if running in development with webpack dev server**
   - If port is 8080 and in development mode, use relative URL
   - Webpack proxy will handle routing

3. **Fallback to default**
   - Defaults to `http://localhost:5000` if nothing else matches

## Configuration Examples

### Development with Proxy (Recommended)

```bash
# client/.env.development
REACT_APP_API_URL=
PORT=8080
OPEN_BROWSER=true
```

**Benefits:**
- No CORS configuration needed
- Automatic proxy routing
- Works seamlessly with webpack dev server

### Development with Direct Connection

```bash
# client/.env
REACT_APP_API_URL=http://localhost:5000
```

**Note:** Requires backend CORS configuration to allow `http://localhost:8080`

### Production Build

```bash
# client/.env.production
REACT_APP_API_URL=https://api.yourdomain.com
```

Then build:
```bash
npm run build
```

## Troubleshooting

### Socket.IO Connection Fails

1. **Check backend is running**: `http://localhost:5000/health` should return "ok"
2. **Check environment variables**: Verify `REACT_APP_API_URL` is set correctly
3. **Check webpack proxy**: If using proxy, verify webpack.config.js proxy settings
4. **Check CORS**: If using direct connection, verify backend CORS settings

### CORS Errors

- **Using proxy**: Should not occur. Verify proxy is configured correctly
- **Direct connection**: Add `http://localhost:8080` to backend `CORS_ORIGINS` or set `DEBUG=True`

### Port Conflicts

If port 8080 is busy:
```bash
PORT=3000 npm start
```

Then update backend CORS_ORIGINS to include the new port.
