'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/authService';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  subscription_tier: 'free' | 'premium' | 'legendary';
  level: number;
  experience: number;
  total_battles: number;
  total_wins: number;
  rating: number;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// Demo user for development
const DEMO_USER: UserProfile = {
  id: 'demo-user',
  username: 'Demo Player',
  email: 'demo@example.com',
  subscription_tier: 'premium',
  level: 25,
  experience: 12500,
  total_battles: 150,
  total_wins: 95,
  rating: 1850,
  created_at: new Date().toISOString()
};

export function AuthProvider({ children }: AuthProviderProps) {
  // Initialize with demo user immediately - no loading state
  const [user, setUser] = useState<UserProfile | null>(DEMO_USER);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      
      setUser(response.user);
      // SECURITY: Tokens are now in httpOnly cookies, don't store in state
      setTokens(null);
      
      // SECURITY: Don't store tokens in localStorage anymore
      // Tokens are automatically sent via httpOnly cookies
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      const response = await authService.register(credentials);
      
      setUser(response.user);
      // SECURITY: Tokens are now in httpOnly cookies, don't store in state
      setTokens(null);
      
      // SECURITY: Don't store tokens in localStorage anymore
      // Tokens are automatically sent via httpOnly cookies
      
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    
    // SECURITY: Don't need to clear localStorage anymore
    // httpOnly cookies are cleared by the server
    
    // Call backend logout to clear httpOnly cookies
    authService.logout().catch(console.error);
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      // SECURITY: Refresh token is now in httpOnly cookie
      // No need to pass it explicitly
      await authService.refreshToken();
      
      // SECURITY: New tokens are set as httpOnly cookies by server
      // No need to store them in state or localStorage
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear invalid tokens and logout
      logout();
      throw error;
    }
  }, [logout]);

  const updateProfile = useCallback((profileData: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...profileData } : null);
  }, []);

  const isAuthenticated = !!user; // Simplified for development

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}