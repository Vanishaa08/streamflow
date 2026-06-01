import redisClient from '../config/redis.js';

export const registerChatHandlers = (io, socket) => {
  socket.on('joinStream', async (streamId) => {
    socket.join(streamId);
    console.log(`[SOCKET] ${socket.user.username} joined stream: ${streamId}`);

    const viewerCount = await redisClient.incr(`viewers:${streamId}`);

    // Track peak viewers
    const peak = await redisClient.get(`viewers:peak:${streamId}`) || 0;
    if (viewerCount > parseInt(peak)) {
      await redisClient.set(`viewers:peak:${streamId}`, viewerCount);
    }

    socket.to(streamId).emit('userJoined', {
      username: socket.user.username,
      timestamp: new Date().toISOString(),
    });

    socket.emit('joinedStream', { streamId, viewerCount });
    io.to(streamId).emit('viewerCount', { count: viewerCount });
  });

  socket.on('leaveStream', async (streamId) => {
    socket.leave(streamId);

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

  socket.on('disconnecting', async () => {
    for (const room of socket.rooms) {
      if (room === socket.id) continue;

      const current = await redisClient.get(`viewers:${room}`);
      if (current && parseInt(current) > 0) {
        const viewerCount = await redisClient.decr(`viewers:${room}`);
        io.to(room).emit('viewerCount', { count: viewerCount });
      }
    }
  });

  socket.on('sendMessage', async ({ streamId, message }) => {
    if (!streamId || !message?.trim()) return;

    const sanitized = message.trim().slice(0, 500);

    // Track message count for analytics
    await redisClient.incr(`messages:${streamId}`);

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