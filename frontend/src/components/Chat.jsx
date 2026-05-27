import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const Chat = ({ streamId }) => {
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket || !connected) return;

    // Join the stream room
    socket.emit('joinStream', streamId);

    // Listen for new messages
    socket.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for user joined/left
    socket.on('userJoined', ({ username }) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), system: true, message: `${username} joined the chat` },
      ]);
    });

    socket.on('userLeft', ({ username }) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), system: true, message: `${username} left the chat` },
      ]);
    });

    // Cleanup — leave room and remove listeners when component unmounts
    return () => {
      socket.emit('leaveStream', streamId);
      socket.off('newMessage');
      socket.off('userJoined');
      socket.off('userLeft');
    };
  }, [socket, connected, streamId]);

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    socket.emit('sendMessage', { streamId, message: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-white font-medium">Live Chat</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center mt-4">No messages yet</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.system ? (
              <p className="text-gray-500 text-xs text-center">{msg.message}</p>
            ) : (
              <div className="flex gap-2 items-start">
                <span className={`text-sm font-medium ${msg.username === user?.username ? 'text-purple-400' : 'text-blue-400'}`}>
                  {msg.username}
                </span>
                <span className="text-gray-300 text-sm break-all">{msg.message}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          maxLength={500}
          className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={!connected || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;