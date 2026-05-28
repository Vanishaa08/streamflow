import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Chat from '../components/Chat';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const Stream = () => {
  const { username } = useParams();
  const { socket, connected } = useSocket();
  const [streamer, setStreamer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    const fetchStreamer = async () => {
      try {
        const res = await api.get(`/users/${username}`);
        setStreamer(res.data.data.user);
      } catch {
        setError('Streamer not found');
      } finally {
        setLoading(false);
      }
    };
    fetchStreamer();
  }, [username]);

  // Listen for viewer count updates
  useEffect(() => {
    if (!socket) return;

    socket.on('viewerCount', ({ count }) => {
      setViewerCount(count);
    });

    socket.on('joinedStream', ({ viewerCount }) => {
      setViewerCount(viewerCount);
    });

    return () => {
      socket.off('viewerCount');
      socket.off('joinedStream');
    };
  }, [socket]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Loading stream...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-red-400">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">{streamer?.username}'s Stream</h1>
          <div className="flex items-center gap-3">
            {/* Viewer count */}
            <div className="flex items-center gap-2 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-300">{viewerCount} watching</span>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${streamer?.isLive ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
              {streamer?.isLive ? '🔴 LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 aspect-video flex items-center justify-center">
              <p className="text-gray-500">
                {streamer?.isLive ? 'Stream loading...' : 'Stream is offline'}
              </p>
            </div>
          </div>

          <div className="h-[600px]">
            <Chat streamId={streamer?._id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stream;