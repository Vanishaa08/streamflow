import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.utils.js';
import User from '../models/user.model.js';
import { registerChatHandlers } from './chat.socket.js';

const connectedUsers = new Map(); // socketId → user data

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Socket.io middleware — runs before every connection
  // This is where we authenticate the WebSocket handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket — available in all handlers
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

    // Track connected user
    connectedUsers.set(socket.id, socket.user);

    // Register chat event handlers
    registerChatHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] Disconnected: ${socket.user.username} — ${reason}`);
      connectedUsers.delete(socket.id);
    });
  });

  return io;
};

export const getConnectedUsers = () => connectedUsers;