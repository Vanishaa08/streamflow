export const registerChatHandlers = (io, socket) => {
  // Join a stream's chat room
  socket.on('joinStream', (streamId) => {
    socket.join(streamId);
    console.log(`[SOCKET] ${socket.user.username} joined stream: ${streamId}`);

    // Notify others in the room
    socket.to(streamId).emit('userJoined', {
      username: socket.user.username,
      timestamp: new Date().toISOString(),
    });

    // Send confirmation to the joining user
    socket.emit('joinedStream', {
      streamId,
      message: `Joined stream ${streamId}`,
    });
  });

  // Leave a stream's chat room
  socket.on('leaveStream', (streamId) => {
    socket.leave(streamId);
    console.log(`[SOCKET] ${socket.user.username} left stream: ${streamId}`);

    socket.to(streamId).emit('userLeft', {
      username: socket.user.username,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle incoming chat message
  socket.on('sendMessage', ({ streamId, message }) => {
    if (!streamId || !message?.trim()) return;

    // Sanitize — trim and limit length
    const sanitized = message.trim().slice(0, 500);

    const chatMessage = {
      id: `${socket.id}-${Date.now()}`,
      username: socket.user.username,
      message: sanitized,
      timestamp: new Date().toISOString(),
    };

    // Broadcast to everyone in the room including sender
    io.to(streamId).emit('newMessage', chatMessage);

    console.log(`[CHAT] ${socket.user.username} in ${streamId}: ${sanitized}`);
  });
};