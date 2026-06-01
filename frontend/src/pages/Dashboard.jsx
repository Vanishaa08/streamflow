import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('viewerCount', ({ count }) => setViewerCount(count));
    return () => socket.off('viewerCount');
  }, [socket]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/streams/analytics');
      setAnalytics(res.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">StreamFlow</h1>
            <p className="text-gray-400 text-sm mt-1">@{user?.username}</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`/stream/${user?.username}`}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              View Stream
            </a>
            <button
              onClick={logout}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Live status */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Stream Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${user?.isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
                <span className="text-lg font-semibold">
                  {user?.isLive ? 'LIVE' : 'Offline'}
                </span>
                {user?.isLive && (
                  <span className="text-gray-400 text-sm ml-2">
                    {viewerCount} watching
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Stream Key</p>
              <p className="font-mono text-purple-400 text-sm bg-gray-800 px-3 py-2 rounded-lg">
                {user?.streamKey}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">OBS Server URL</p>
              <p className="font-mono text-green-400 text-sm bg-gray-800 px-3 py-2 rounded-lg">
                rtmp://localhost/stream
              </p>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        {!loading && analytics && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-1">Total Streams</p>
                <p className="text-2xl font-bold">{analytics.totalStreams}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-1">Total Stream Time</p>
                <p className="text-2xl font-bold">
                  {formatDuration(analytics.totalDuration)}
                </p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-1">Avg Peak Viewers</p>
                <p className="text-2xl font-bold">{analytics.avgPeakViewers}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-1">Socket Status</p>
                <p className={`text-sm font-medium mt-1 ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>

            {/* Recent streams */}
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-semibold">Recent Streams</h2>
              </div>
              {analytics.recentStreams.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No streams yet. Start streaming with OBS!
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {analytics.recentStreams.map((stream) => (
                    <div key={stream._id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{stream.title}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {formatDate(stream.startedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Duration</p>
                          <p className="font-medium">{formatDuration(stream.duration)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Peak Viewers</p>
                          <p className="font-medium">{stream.peakViewers}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 text-xs">Messages</p>
                          <p className="font-medium">{stream.totalMessages}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${stream.isActive ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                          {stream.isActive ? 'LIVE' : 'Ended'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-400">
            Loading analytics...
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;