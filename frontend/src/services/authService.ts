import { apiClient } from './apiClient';
import type { UserProfile, LoginCredentials, RegisterCredentials, AuthTokens } from '@/contexts/AuthContext';

interface AuthResponse {
  success: boolean;
  user: UserProfile;
  tokens: AuthTokens;
  error?: string;
}

interface ProfileResponse {
  success: boolean;
  user: UserProfile;
  error?: string;
}

interface TokenRefreshResponse {
  success: boolean;
  tokens: AuthTokens;
  error?: string;
}

class AuthService {
  private readonly baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006';
  private readonly timeout = 10000; // 10 seconds

  // Helper method to add timeout to fetch requests
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: UserProfile }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SECURITY: Include cookies in request
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // SECURITY: Tokens are now in httpOnly cookies, only return user
      return {
        user: data.user
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error instanceof Error ? error : new Error('Login failed');
    }
  }

  async register(credentials: RegisterCredentials): Promise<{ user: UserProfile }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SECURITY: Include cookies in request
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      // SECURITY: Tokens are now in httpOnly cookies, only return user
      return {
        user: data.user
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error instanceof Error ? error : new Error('Registration failed');
    }
  }

  async getProfile(): Promise<UserProfile> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SECURITY: Send cookies with request
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token expired');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get profile');
      }

      const data: ProfileResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get profile');
      }

      return data.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error instanceof Error ? error : new Error('Failed to get profile');
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SECURITY: Send refresh token cookie
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Token refresh failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Token refresh failed');
      }

      // SECURITY: New tokens are now set as httpOnly cookies by server
      // No need to return them
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error instanceof Error ? error : new Error('Token refresh failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.fetchWithTimeout(`${this.baseURL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SECURITY: Send cookies to clear them
      });
    } catch (error) {
      // Don't throw on logout errors - just log them
      console.error('Logout error:', error);
    }
  }
}

export const authService = new AuthService();
