import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(undefined);

const USER_KEY = 'gem_officer_user';
const TOKEN_KEY = 'gem_officer_token';

const memoryFallback = {};
const authStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryFallback[key] || null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryFallback[key] = value;
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      delete memoryFallback[key];
    }
  },
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => authStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    if (!authStorage.getItem(TOKEN_KEY)) return null;
    try {
      return JSON.parse(authStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  });

  const setSession = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    authStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    authStorage.setItem(TOKEN_KEY, nextToken);
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    authStorage.removeItem(USER_KEY);
    authStorage.removeItem(TOKEN_KEY);
  }, []);

  const login = async (username, password) => {
    const result = await api.login({ username, password });
    if (result && result.access_token && result.user) setSession(result.user, result.access_token);
    return result;
  };

  // The API client raises this event when the server rejects the stored token (expired or invalid).
  useEffect(() => {
    window.addEventListener('gem:unauthorized', logout);
    return () => window.removeEventListener('gem:unauthorized', logout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, token, login, setSession, logout, isAuthenticated: !!user && !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
