'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginPayload, RegisterPayload } from '../types/auth';
import { authApi, getAuthToken, setAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const existingToken = getAuthToken();
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      setUser(res.user);
      setToken(existingToken);
    } catch (err) {
      console.warn('[AuthContext] Token validation failed:', err);
      setAuthToken(null);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    setUser(res.user);
    setToken(res.token);
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    setUser(res.user);
    setToken(res.token);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
