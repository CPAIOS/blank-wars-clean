
import axios from 'axios';

const apiClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006') + '/api',
  withCredentials: true,
});

// TEMPORARY: Add request interceptor for token fallback
apiClient.interceptors.request.use((config) => {
  // If we have stored tokens (fallback for cross-origin), add Authorization header
  const storedTokens = localStorage.getItem('authTokens');
  console.log('🔍 Request interceptor - checking for stored tokens:', !!storedTokens);
  
  if (storedTokens) {
    try {
      const tokens = JSON.parse(storedTokens);
      console.log('🔍 Parsed tokens:', { hasAccessToken: !!tokens.accessToken, hasRefreshToken: !!tokens.refreshToken });
      
      if (tokens.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        console.log('🔑 Using stored access token for request to:', config.url);
      }
    } catch (e) {
      console.error('Error parsing stored tokens:', e);
      localStorage.removeItem('authTokens');
    }
  } else {
    console.log('🚫 No stored tokens found for request to:', config.url);
  }
  return config;
});

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we get a 401 and haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.log('Token refresh failed, user needs to log in again');
        // Don't redirect here since this is a service - let the auth context handle it
        
        // Create a custom error to indicate authentication failure
        const authError = new Error('Authentication failed - user needs to log in');
        (authError as any).isAuthenticationError = true;
        (authError as any).status = 401;
        return Promise.reject(authError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const paymentAPI = {
  purchasePack: async (packType: string, quantity: number) => {
    const response = await apiClient.post('/packs/purchase', { packType, quantity });
    return response.data;
  },
  redeemCard: async (serialNumber: string) => {
    const response = await apiClient.post('/cards/redeem', { serialNumber });
    return response.data;
  },
  getMintedCards: async () => {
    const response = await apiClient.get('/packs/minted-cards');
    return response.data;
  },
};

// Request deduplication to prevent multiple concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

export const characterAPI = {
  getUserCharacters: async () => {
    const requestKey = 'getUserCharacters';
    
    // Check if request is already in progress
    if (pendingRequests.has(requestKey)) {
      console.log('🔄 [characterAPI] Request already in progress, reusing...');
      return pendingRequests.get(requestKey)!;
    }
    
    console.log('🔄 [characterAPI] Making request to:', '/user/characters');
    console.log('🔄 [characterAPI] Base URL:', apiClient.defaults.baseURL);
    
    const requestPromise = apiClient.get('/user/characters')
      .then(response => {
        console.log('🔄 [characterAPI] Response status:', response.status);
        console.log('🔄 [characterAPI] Response data:', response.data);
        pendingRequests.delete(requestKey);
        return response.data;
      })
      .catch(error => {
        pendingRequests.delete(requestKey);
        
        // Check if this is an authentication error to prevent retries
        if (error.status === 401 || error.isAuthenticationError || error.response?.status === 401) {
          console.log('🚫 [characterAPI] Authentication error - stopping retries');
          // Clear the pending request to prevent any caching issues
          pendingRequests.delete(requestKey);
          const authError = new Error('AUTHENTICATION_REQUIRED_NO_RETRY');
          (authError as any).isAuthenticationError = true;
          (authError as any).status = 401;
          (authError as any).name = 'AuthenticationError';
          throw authError;
        }
        
        throw error;
      });
    
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  },
};

export const realEstateAPI = {
  sendMessage: async (context: any) => {
    const response = await apiClient.post('/headquarters/real-estate-chat', context);
    return response.data;
  },
};

export { apiClient };
export default apiClient;
