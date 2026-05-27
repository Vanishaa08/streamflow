import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import Stream from './pages/Stream';
import Chat from './components/Chat';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">StreamFlow</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">@{user?.username}</span>
            <button
              onClick={logout}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 aspect-video flex items-center justify-center">
              <p className="text-gray-500">Stream will appear here</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">Your Stream Key</p>
              <p className="font-mono text-purple-400 text-sm bg-gray-800 px-3 py-2 rounded-lg">
                {user?.streamKey}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Use this key in OBS → Settings → Stream → Stream Key
              </p>
            </div>
          </div>

          <div className="h-[600px]">
            <Chat streamId={user?._id} />
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stream/:username"
              element={
                <ProtectedRoute>
                  <Stream />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;