import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  accessToken: null,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        loading: false,
      };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On app load — try to restore session via refresh token cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.post('/auth/refresh');
        const { accessToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);

        const userRes = await api.get('/auth/me');
        dispatch({
          type: 'LOGIN',
          payload: {
            user: userRes.data.data.user,
            accessToken,
          },
        });
      } catch {
        // No valid refresh token — user needs to log in
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    dispatch({ type: 'LOGIN', payload: { user, accessToken } });
    return user;
  };

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password });
    const { user, accessToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    dispatch({ type: 'LOGIN', payload: { user, accessToken } });
    return user;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};