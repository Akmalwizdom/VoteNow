import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { verifyToken, optionalAuth } from './middleware/auth.js';
import {
  createPoll,
  getPolls,
  getPollById,
  voteOnPoll,
  updatePoll,
  deletePoll,
  getShareLink,
  setSocketIO,
} from './controllers/pollController.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/votenow')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Configure CORS - Allow same-origin requests and specific origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin requests, mobile apps, Postman)
    if (!origin) {
      console.log('✅ Same-origin request allowed');
      return callback(null, true);
    }
    
    // Allow all origins (since we're handling this via ngrok and localhost)
    console.log(`✅ CORS request from origin: ${origin}`);
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(httpServer, {
  cors: corsOptions,
});

setSocketIO(io);

app.use(cors(corsOptions));

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Protected routes - require authentication
app.post('/api/polls', verifyToken, createPoll);
app.get('/api/polls', verifyToken, getPolls); // Now requires authentication
app.get('/api/polls/:id/share', verifyToken, getShareLink);
app.put('/api/polls/:id', verifyToken, updatePoll);
app.delete('/api/polls/:id', verifyToken, deletePoll);

// Public routes - allow anonymous access (for shared links)
app.get('/api/polls/:id', getPollById); // Public for shared links
app.post('/api/polls/:id/vote', optionalAuth, voteOnPoll); // Public voting

// Serve static files from the React app (production only)
const buildPath = path.join(__dirname, '..', 'build');
app.use(express.static(buildPath));

// All remaining requests return the React app, so it can handle routing
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  // Track which rooms this socket has joined
  const joinedRooms = new Set();

  socket.on('join_poll', (pollId) => {
    const roomName = `poll_${pollId}`;
    
    // Check if already in room to prevent duplicate joins
    if (joinedRooms.has(roomName)) {
      console.log(`⚠️  Socket ${socket.id} already in room: ${roomName}`);
      return;
    }
    
    socket.join(roomName);
    joinedRooms.add(roomName);
    console.log(`📥 Socket ${socket.id} joined room: ${roomName}`);
    console.log(`   Total rooms for this socket: ${joinedRooms.size}`);
  });

  socket.on('leave_poll', (pollId) => {
    const roomName = `poll_${pollId}`;
    
    if (!joinedRooms.has(roomName)) {
      console.log(`⚠️  Socket ${socket.id} not in room: ${roomName}`);
      return;
    }
    
    socket.leave(roomName);
    joinedRooms.delete(roomName);
    console.log(`📤 Socket ${socket.id} left room: ${roomName}`);
    console.log(`   Remaining rooms for this socket: ${joinedRooms.size}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    console.log(`   Was in ${joinedRooms.size} rooms`);
    joinedRooms.clear();
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});

export { io };
