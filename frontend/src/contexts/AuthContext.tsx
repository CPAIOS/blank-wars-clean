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
  character_slot_capacity: number; // Added for dynamic character slots
  completed_challenges: string[]; // Added for battle system
}

// Coach progression system
export const getCoachTitle = (level: number, wins: number): string => {
  if (level >= 50 && wins >= 500) return 'Grandmaster Coach';
  if (level >= 40 && wins >= 300) return 'Master Coach';
  if (level >= 30 && wins >= 200) return 'Expert Coach';
  if (level >= 20 && wins >= 100) return 'Veteran Coach';
  if (level >= 15 && wins >= 50) return 'Senior Coach';
  if (level >= 10 && wins >= 25) return 'Advanced Coach';
  if (level >= 5 && wins >= 10) return 'Junior Coach';
  return 'Rookie Coach';
};

export const getCoachDisplayName = (user: UserProfile): string => {
  const title = getCoachTitle(user.level, user.total_wins);
  return `${title} Lv.${user.level}`;
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  claimToken?: string;
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
  showOnboarding: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => void;
  setShowOnboarding: (show: boolean) => void;
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


export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      // Check if we have any cookies first to avoid unnecessary network calls
      const hasCookies = document.cookie.includes('accessToken') || document.cookie.includes('refreshToken');
      
      if (!hasCookies) {
        // No cookies = definitely not logged in, skip network calls
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch (error) {
        // Silently handle expected "not logged in" state
        setUser(null);
        // If we get a token expired error on initial load, try to refresh once
        if (error instanceof Error && error.message.includes('Token expired')) {
          try {
            await authService.refreshToken();
            const profile = await authService.getProfile();
            setUser(profile);
          } catch (refreshError) {
            // Silently handle expected "no refresh token" state
            setUser(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

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
      
      // Show onboarding for new users
      setShowOnboarding(true);
      
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

  const isAuthenticated = !!user && !isLoading;

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    showOnboarding,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    setShowOnboarding
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}