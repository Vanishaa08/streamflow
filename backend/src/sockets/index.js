import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyAccessToken } from '../utils/jwt.utils.js';
import User from '../models/user.model.js';
import { registerChatHandlers } from './chat.socket.js';
import { pubClient, subClient } from '../config/redis.js';

const connectedUsers = new Map();

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Attach Redis adapter — this is what enables multi-server pub/sub
  // Every emit now goes through Redis and fans out to all server instances
  io.adapter(createAdapter(pubClient, subClient));
  console.log('[SOCKET] Redis adapter attached');

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication token required'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      if (!user) return next(new Error('User not found'));

      socket.user = {
        _id: user._id.toString(),
        username: user.username,
        role: user.role,
      };
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Connected: ${socket.user.username} (${socket.id})`);
    connectedUsers.set(socket.id, socket.user);

    registerChatHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] Disconnected: ${socket.user.username} — ${reason}`);
      connectedUsers.delete(socket.id);
    });
  });

  return io;
};

export const getConnectedUsers = () => connectedUsers;