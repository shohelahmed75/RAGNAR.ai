import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('ragnar_token'));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({ username: decoded.sub });
          // Set default axios header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {
        logout();
      }
    } else {
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('ragnar_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('ragnar_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
