import redisClient from '../config/redis.js';

export const registerChatHandlers = (io, socket) => {
  // Join a stream's chat room
  socket.on('joinStream', async (streamId) => {
    socket.join(streamId);
    console.log(`[SOCKET] ${socket.user.username} joined stream: ${streamId}`);

    // Increment viewer count in Redis
    // INCR is atomic — safe even with multiple server instances
    const viewerCount = await redisClient.incr(`viewers:${streamId}`);

    // Notify others in the room
    socket.to(streamId).emit('userJoined', {
      username: socket.user.username,
      timestamp: new Date().toISOString(),
    });

    // Send confirmation + current viewer count to joining user
    socket.emit('joinedStream', { streamId, viewerCount });

    // Broadcast updated viewer count to everyone in room
    io.to(streamId).emit('viewerCount', { count: viewerCount });
  });

  // Leave a stream's chat room
  socket.on('leaveStream', async (streamId) => {
    socket.leave(streamId);
    console.log(`[SOCKET] ${socket.user.username} left stream: ${streamId}`);

    // Decrement viewer count — never go below 0
    const current = await redisClient.get(`viewers:${streamId}`);
    if (current && parseInt(current) > 0) {
      const viewerCount = await redisClient.decr(`viewers:${streamId}`);
      io.to(streamId).emit('viewerCount', { count: viewerCount });
    }

    socket.to(streamId).emit('userLeft', {
      username: socket.user.username,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle disconnect — clean up viewer count
  socket.on('disconnecting', async () => {
    for (const room of socket.rooms) {
      if (room === socket.id) continue; // skip default room

      const current = await redisClient.get(`viewers:${room}`);
      if (current && parseInt(current) > 0) {
        const viewerCount = await redisClient.decr(`viewers:${room}`);
        io.to(room).emit('viewerCount', { count: viewerCount });
      }
    }
  });

  // Handle incoming chat message
  socket.on('sendMessage', ({ streamId, message }) => {
    if (!streamId || !message?.trim()) return;

    const sanitized = message.trim().slice(0, 500);

    const chatMessage = {
      id: `${socket.id}-${Date.now()}`,
      username: socket.user.username,
      message: sanitized,
      timestamp: new Date().toISOString(),
    };

    io.to(streamId).emit('newMessage', chatMessage);
    console.log(`[CHAT] ${socket.user.username} in ${streamId}: ${sanitized}`);
  });
};