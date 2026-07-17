import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../lib/api';

interface User {
  username: string;
  email: string;
  fullname: string;
  career_paths: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginUser: (token: string, userData: User) => void;
  logoutUser: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getMe()
        .then(data => {
          setUser(data);
        })
        .catch(() => {
          logoutUser();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginUser = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logoutUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
