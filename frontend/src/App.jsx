import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';

// Temporary dashboard placeholder — we'll build this properly later
const Dashboard = () => {
  const { useAuth } = require('./context/AuthContext');
  return null;
};

import { useAuth } from './context/AuthContext';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">StreamFlow Dashboard</h1>
          <button
            onClick={logout}
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Welcome back,</p>
          <p className="text-xl font-semibold">{user?.username}</p>
          <p className="text-gray-400 text-sm mt-4">Stream Key:</p>
          <p className="font-mono text-purple-400 text-sm mt-1 bg-gray-800 px-3 py-2 rounded-lg">
            {user?.streamKey}
          </p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;