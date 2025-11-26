# Single Ngrok Tunnel Solution

## Problem
Ngrok free tier only allows **1 active tunnel** at a time, but you need both frontend (port 3000) and backend (port 5000) accessible.

## Solution: Serve Frontend from Backend Server ✅

Instead of running 2 separate servers, bundle your frontend and serve it from the Express backend. This way you only need **1 ngrok tunnel**!

## How It Works

```
User → Ngrok Tunnel → Backend Server (Port 5000)
                           ├─ /api/* → API endpoints
                           └─ /*     → React frontend (static files)
```

## Setup Steps

### 1. Update Frontend .env for Relative API Calls

Edit `.env` to use **empty** `VITE_API_URL` (this makes it use relative paths):

```env
VITE_API_URL=
```

This way, when the frontend runs from `https://your-ngrok.com`, API calls go to `https://your-ngrok.com/api/*` (same origin).

### 2. Build the Frontend

```bash
npm run build
```

This creates a `build/` folder with your compiled React app.

### 3. Backend Already Configured! ✅

I've already updated `backend/server.js` to:
- Serve static files from `../build` directory
- Route all non-API requests to `index.html` (for React Router)

### 4. Start Only the Backend Server

```bash
cd backend
npm start
```

The backend now serves:
- API at `http://localhost:5000/api/*`
- Frontend at `http://localhost:5000/`

### 5. Start Single Ngrok Tunnel

```bash
ngrok http 5000
```

You'll see:
```
Forwarding   https://abc-xyz-123.ngrok-free.dev -> http://localhost:5000
```

### 6. Share the Link! 🎉

Share `https://abc-xyz-123.ngrok-free.dev` with users. They can:
- ✅ Access the full frontend UI
- ✅ View all polls
- ✅ Vote on polls
- ✅ See real-time updates
- ✅ Create polls (if logged in)

## Testing Checklist

- [ ] `.env` has `VITE_API_URL=` (empty)
- [ ] Run `npm run build` successfully
- [ ] `build/` folder exists in project root
- [ ] Backend server running: `cd backend && npm start`
- [ ] Can access frontend at http://localhost:5000
- [ ] Start ngrok: `ngrok http 5000`
- [ ] Open ngrok URL in browser
- [ ] Create a poll (as logged-in user)
- [ ] Open ngrok URL in incognito/another browser
- [ ] Verify poll displays and voting works

## When to Rebuild Frontend

Rebuild the frontend (`npm run build`) whenever you make changes to:
- React components
- Frontend code (`.tsx`, `.ts`, `.css` files)
- Frontend configuration

Backend changes don't require rebuilding - just restart the backend server.

## Development vs Production

### Development (localhost)
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
npm run dev

# Access at: http://localhost:3000
```

Use `.env` with:
```env
VITE_API_URL=http://localhost:5000
```

### Production (ngrok sharing)
```bash
# Build frontend
npm run build

# Start backend only
cd backend
npm start

# Start ngrok
ngrok http 5000

# Access at: https://your-ngrok-url.ngrok-free.dev
```

Use `.env` with:
```env
VITE_API_URL=
```

## Troubleshooting

### Frontend shows blank page
- Check `build/` folder exists
- Check backend console for errors
- Verify backend is serving static files
- Check browser console for errors

### API calls fail (404)
- Ensure `VITE_API_URL=` is empty in `.env`
- Rebuild frontend after changing `.env`
- Check API routes start with `/api/`

### Changes not reflected
- Rebuild frontend: `npm run build`
- Restart backend: Ctrl+C then `npm start`
- Hard refresh browser: Ctrl+Shift+R

### Socket.IO not connecting
- Check browser console for connection errors
- Verify backend Socket.IO CORS is configured
- Ensure using same origin (ngrok URL)

---

## Alternative: Paid Ngrok Plan

If you prefer keeping frontend/backend separate:

**Ngrok Personal Plan** ($8/month):
- Up to 3 simultaneous tunnels
- Custom domains
- More bandwidth

Then you can run:
```bash
# Terminal 1
ngrok http 5000 --region us

# Terminal 2  
ngrok http 3000 --region us
```

Update `.env`:
```env
VITE_API_URL=https://your-backend-ngrok.ngrok-free.dev
```

---

## Alternative: Other Free Tunneling Services

### LocalTunnel (Allows Multiple Tunnels)
```bash
# Install
npm install -g localtunnel

# Terminal 1 - Backend
lt --port 5000 --subdomain votenow-api

# Terminal 2 - Frontend
lt --port 3000 --subdomain votenow-app
```

### Cloudflare Tunnel (Free, Unlimited Tunnels)
```bash
# Install cloudflared
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/

# Terminal 1 - Backend
cloudflared tunnel --url http://localhost:5000

# Terminal 2 - Frontend
cloudflared tunnel --url http://localhost:3000
```

**But the single-server solution is simplest and most reliable!** 🚀
