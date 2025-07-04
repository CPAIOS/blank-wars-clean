interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requireAuth?: boolean;
}

class APIClient {
  private readonly baseURL: string;
  private getAuthToken: (() => string | null) | null = null;
  private onTokenExpired: (() => void) | null = null;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
  }

  // Set auth token getter (will be called by AuthContext)
  setAuthTokenGetter(getter: () => string | null) {
    this.getAuthToken = getter;
  }

  // Set token expiration handler
  setTokenExpiredHandler(handler: () => void) {
    this.onTokenExpired = handler;
  }

  private getHeaders(customHeaders: Record<string, string> = {}, requireAuth = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (requireAuth && this.getAuthToken) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401 && this.onTokenExpired) {
      this.onTokenExpired();
      throw new Error('Authentication expired');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      headers: customHeaders = {},
      body,
      requireAuth = false,
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(customHeaders, requireAuth);

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestInit);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  // Convenience methods
  get<T = any>(endpoint: string, requireAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  post<T = any>(endpoint: string, body?: any, requireAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, requireAuth });
  }

  put<T = any>(endpoint: string, body?: any, requireAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, requireAuth });
  }

  delete<T = any>(endpoint: string, requireAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth });
  }

  patch<T = any>(endpoint: string, body?: any, requireAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requireAuth });
  }
}

export const apiClient = new APIClient();

// Auth-specific API methods
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/api/auth/login', credentials),
  
  register: (credentials: { username: string; email: string; password: string }) =>
    apiClient.post('/api/auth/register', credentials),
  
  getProfile: () =>
    apiClient.get('/api/auth/profile', true),
  
  refreshToken: (refreshToken: string) =>
    apiClient.post('/api/auth/refresh', { refreshToken }),
  
  logout: () =>
    apiClient.post('/api/auth/logout', {}, true),
};

// Character-specific API methods
export const characterAPI = {
  getAll: () =>
    apiClient.get('/api/characters'),
  
  getUserCharacters: () =>
    apiClient.get('/api/user/characters', true),
  
  updateCharacterNickname: (characterId: string, nickname: string) =>
    apiClient.patch(`/api/user/characters/${characterId}`, { nickname }, true),
};

// Battle-specific API methods
export const battleAPI = {
  getStatus: () =>
    apiClient.get('/api/battles/status'),
  
  getUserBattles: () =>
    apiClient.get('/api/user/battles', true),
};

// Payment and Card API methods
export const paymentAPI = {
  purchasePack: (packType: string, quantity: number) =>
    apiClient.post('/api/packs/purchase', { packType, quantity }, true),

  redeemCard: (serialNumber: string) =>
    apiClient.post('/api/cards/redeem', { serialNumber }, true),
};