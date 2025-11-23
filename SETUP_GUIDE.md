# VoteNow - Complete Setup Guide

This guide will help you set up the VoteNow application with Node.js/Express backend, MongoDB database, and Firebase Authentication.

## Prerequisites

Before you begin, make sure you have the following installed:
- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- A Firebase project (for authentication)

## Project Structure

```
VoteNow/
├── backend/                 # Node.js/Express Backend
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Auth middleware
│   ├── models/             # MongoDB/Mongoose models
│   ├── .env                # Backend environment variables
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── src/                    # React Frontend
│   ├── components/         # React components
│   ├── contexts/           # React contexts (Auth)
│   ├── pages/             # Page components
│   ├── firebase.ts        # Firebase configuration
│   └── ...
├── .env                   # Frontend environment variables
└── package.json          # Frontend dependencies
```

## Step 1: Firebase Setup

### 1.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or select existing)
3. Enable Authentication:
   - Go to **Authentication** → **Sign-in method**
   - Enable **Email/Password** authentication

### 1.2 Get Frontend Firebase Config

1. In Firebase Console, go to **Project Settings** → **General**
2. Under "Your apps", click the **Web icon (</>)**
3. Register your app and copy the config object
4. Save these values for later

### 1.3 Generate Service Account for Backend

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file (save it securely)
4. You'll need these values from the JSON:
   - `project_id`
   - `private_key`
   - `client_email`

## Step 2: MongoDB Setup

### Option A: Local MongoDB

1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```
3. Your MongoDB URI will be: `mongodb://localhost:27017/votenow`

### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user (username + password)
4. Get your connection string (replace `<password>` with your actual password)
5. Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/votenow`

## Step 3: Backend Configuration

### 3.1 Create Backend Environment File

1. Navigate to `backend/` directory
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit `backend/.env` with your values:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/votenow
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   CORS_ORIGIN=http://localhost:3000
   ```

   **Important Notes:**
   - Replace `MONGODB_URI` with your actual MongoDB connection string
   - Get Firebase values from the Service Account JSON you downloaded
   - Keep the quotes around `FIREBASE_PRIVATE_KEY`
   - Make sure to preserve the `\n` characters in the private key

### 3.2 Install Backend Dependencies

```bash
cd backend
npm install
```

### 3.3 Start Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📡 Socket.IO server ready
```

## Step 4: Frontend Configuration

### 4.1 Create Frontend Environment File

1. Navigate to project root directory
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your Firebase config values:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

   Get these values from Firebase Console → Project Settings → General → Your apps

### 4.2 Install Frontend Dependencies

```bash
# From project root
npm install
```

### 4.3 Start Frontend Development Server

```bash
npm run dev
```

The app should open at `http://localhost:3000`

## Step 5: Verify Setup

### 5.1 Test Authentication

1. Open the app at `http://localhost:3000`
2. Go to Sign Up page
3. Create a new account with email and password
4. You should be redirected to the home page after successful signup
5. Try logging out and logging back in

### 5.2 Test Poll Creation

1. Make sure you're logged in
2. Click "Create Poll" button
3. Fill in poll details:
   - Title
   - Description (optional)
   - At least 2 options
4. Click "Create Poll"
5. You should be redirected to the poll detail page

### 5.3 Test Real-time Voting

1. Open the poll in two browser windows
2. Vote in one window
3. The vote count should update automatically in the other window (real-time)

## Troubleshooting

### Backend Issues

**Problem: MongoDB connection failed**
```
❌ MongoDB connection error
```
- Solution: Check if MongoDB is running
- Verify `MONGODB_URI` in `backend/.env`
- For local MongoDB: `mongodb://localhost:27017/votenow`
- For Atlas: Check your connection string and network access

**Problem: Firebase token verification failed**
```
Token verification error
```
- Solution: Check Firebase service account credentials in `backend/.env`
- Make sure `FIREBASE_PRIVATE_KEY` includes `\n` characters
- Verify `FIREBASE_PROJECT_ID` and `FIREBASE_CLIENT_EMAIL`

### Frontend Issues

**Problem: Cannot connect to backend**
```
Failed to create poll
```
- Solution: Make sure backend is running on port 5000
- Check browser console for CORS errors
- Verify `CORS_ORIGIN` in `backend/.env` matches your frontend URL

**Problem: Firebase auth errors**
```
Firebase: Error (auth/...)
```
- Solution: Check Firebase config in frontend `.env`
- Make sure Email/Password auth is enabled in Firebase Console
- Verify all `VITE_FIREBASE_*` environment variables are set

**Problem: Port already in use**
- Backend (5000): Change `PORT` in `backend/.env`
- Frontend (3000): The dev server will prompt you to use a different port

## API Endpoints

### Public Endpoints
- `GET /api/polls` - Get all polls
- `GET /api/polls/:id` - Get specific poll
- `POST /api/polls/:id/vote` - Vote on a poll

### Protected Endpoints (Require Authentication)
- `POST /api/polls` - Create a new poll
  - Requires `Authorization: Bearer <token>` header

## Socket.IO Events

### Client → Server
- `join_poll` - Join a poll room for real-time updates
- `leave_poll` - Leave a poll room

### Server → Client
- `update_poll` - Broadcast poll updates to all clients in the room

## Security Notes

1. **Never commit `.env` files** to version control
2. Keep your Firebase service account JSON file secure
3. Use strong passwords for MongoDB Atlas
4. In production:
   - Use environment variables for sensitive data
   - Enable Firebase App Check
   - Add rate limiting to API endpoints
   - Use HTTPS for all connections

## Production Deployment

### Backend
1. Set environment variables on your hosting platform
2. Update `CORS_ORIGIN` to your production frontend URL
3. Use MongoDB Atlas for production database
4. Consider using PM2 for process management

### Frontend
1. Build the frontend: `npm run build`
2. Set production environment variables
3. Deploy the `dist/` folder to your hosting platform
4. Update Firebase authorized domains

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Express Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)

## Support

If you encounter any issues not covered in this guide, please check:
1. Backend console for error messages
2. Browser console for frontend errors
3. MongoDB connection status
4. Firebase Authentication settings

---

**Happy Voting! 🗳️**
