import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { verifyToken } from './middleware/auth.js';
import {
  createPoll,
  getPolls,
  getPollById,
  voteOnPoll,
  setSocketIO,
} from './controllers/pollController.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/votenow')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setSocketIO(io);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.post('/api/polls', verifyToken, createPoll);
app.get('/api/polls', getPolls);
app.get('/api/polls/:id', getPollById);
app.post('/api/polls/:id/vote', voteOnPoll);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join_poll', (pollId) => {
    const roomName = `poll_${pollId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  socket.on('leave_poll', (pollId) => {
    const roomName = `poll_${pollId}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
});

export { io };
