import { authService } from './authService';

// Global auth state - this will be set by AuthProvider
let globalAuthActions: {
  refreshToken: () => Promise<void>;
  logout: () => void;
} | null = null;

// Set the auth actions from AuthProvider
export const setGlobalAuthActions = (actions: {
  refreshToken: () => Promise<void>;
  logout: () => void;
}) => {
  globalAuthActions = actions;
};

// Enhanced fetch wrapper that handles token refresh automatically
export const fetchWithAuthRetry = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const makeRequest = async (): Promise<Response> => {
    return fetch(url, {
      ...options,
      credentials: 'include', // Always include cookies
    });
  };

  try {
    // First attempt
    const response = await makeRequest();

    // If we get a 401 and have auth actions available, try to refresh
    if (response.status === 401 && globalAuthActions) {
      try {
        // Attempt to refresh the token
        await globalAuthActions.refreshToken();

        // Retry the original request
        const retryResponse = await makeRequest();

        // If still 401 after refresh, logout user
        if (retryResponse.status === 401) {
          globalAuthActions.logout();
        }

        return retryResponse;
      } catch (refreshError) {
        // If refresh fails, logout user
        globalAuthActions.logout();
        return response; // Return original 401 response
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

// Enhanced version of authService methods that use the retry mechanism
export const createAuthServiceWithRetry = () => {
  const baseURL = typeof window !== 'undefined'
    ? (window as any).ENV?.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006'
    : 'http://localhost:3006';

  return {
    async getProfile() {
      const response = await fetchWithAuthRetry(`${baseURL}/api/auth/profile`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token expired');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get profile');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get profile');
      }

      return data.user;
    }
  };
};
