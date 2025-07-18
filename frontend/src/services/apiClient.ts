
import axios from 'axios';

const apiClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3006') + '/api',
  withCredentials: true,
  timeout: 35000, // 35 second timeout to accommodate AI processing
});

// Add request interceptor for error handling
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and automatic token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('API Response Error:', error);
    
    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check your connection');
    }
    
    if (error.response?.status === 401) {
      // Prevent infinite retry loops - only retry once
      if (error.config._retry) {
        console.error('Token refresh already attempted, failing request');
        throw new Error('Session expired - please log in again');
      }
      
      // Try to refresh token automatically
      try {
        const { authService } = await import('./authService');
        await authService.refreshToken();
        
        // Mark request as retry and retry with new token
        error.config._retry = true;
        console.log('🔄 Token refreshed, retrying original request');
        return apiClient.request(error.config);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, the auth context will handle logout
        throw new Error('Session expired - please log in again');
      }
    }
    
    if (error.response?.status === 403) {
      throw new Error('Permission denied');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Resource not found');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error - please try again later');
    }
    
    throw new Error(error.response?.data?.message || 'Network error - please check your connection');
  }
);

// Character API interfaces
export interface FinancialData {
  wallet: number;
  financialStress: number;
  coachTrustLevel: number;
}

export interface FinancialDecision {
  decision: string;
  amount: number;
  coachDecision: string;
  outcome: string;
  timestamp: Date;
}

export interface CharacterStats {
  [key: string]: number;
}

export interface ConflictReward {
  type: 'stat_boost' | 'skill_unlock' | 'relationship_bonus' | 'experience_multiplier' | 'special_ability';
  name: string;
  description: string;
  value: number;
  duration?: number;
  permanent?: boolean;
}

export interface TherapySessionData {
  sessionId: string;
  rewards: {
    immediate: ConflictReward[];
    longTerm: ConflictReward[];
    relationshipChanges: Record<string, number>;
    experienceBonus: number;
  };
  experienceBonus: number;
  immediateRewards: ConflictReward[];
  longTermRewards: ConflictReward[];
  relationshipChanges: Record<string, number>;
}

export interface TrainingData {
  statType: string;
  improvement: number;
  trainingType: string;
  timestamp: Date;
}

export interface CharacterUpdates {
  [key: string]: string | number | boolean | Date | null;
}

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

export const characterAPI = {
  getUserCharacters: async () => {
    console.log('🔄 [characterAPI] Making request to:', '/user/characters');
    console.log('🔄 [characterAPI] Base URL:', apiClient.defaults.baseURL);
    const response = await apiClient.get('/user/characters');
    console.log('🔄 [characterAPI] Response status:', response.status);
    console.log('🔄 [characterAPI] Response data:', response.data);
    return response.data;
  },
  
  updateCharacter: async (characterId: string, updates: CharacterUpdates) => {
    const response = await apiClient.put(`/characters/${characterId}`, updates);
    return response.data;
  },
  
  updateFinancials: async (characterId: string, financialData: FinancialData) => {
    const response = await apiClient.put(`/characters/${characterId}/financials`, financialData);
    return response.data;
  },
  
  saveDecision: async (characterId: string, decision: FinancialDecision) => {
    const response = await apiClient.post(`/characters/${characterId}/decisions`, decision);
    return response.data;
  },
  
  updateStats: async (characterId: string, stats: CharacterStats) => {
    const response = await apiClient.put(`/characters/${characterId}/stats`, stats);
    return response.data;
  },
  
  incrementStats: async (characterId: string, statChanges: CharacterStats) => {
    const response = await apiClient.post(`/characters/${characterId}/stats/increment`, statChanges);
    return response.data;
  },
  
  saveTherapySession: async (characterId: string, sessionData: TherapySessionData) => {
    const response = await apiClient.post(`/characters/${characterId}/therapy`, sessionData);
    return response.data;
  },
  
  saveTrainingProgress: async (characterId: string, trainingData: TrainingData) => {
    const response = await apiClient.post(`/characters/${characterId}/training`, trainingData);
    return response.data;
  },
  
  getHeadquarters: async (userId: string) => {
    const response = await apiClient.get(`/headquarters`);
    return response.data;
  }
};

export const realEstateAPI = {
  sendMessage: async (context: any) => {
    const response = await apiClient.post('/headquarters/real-estate-chat', context);
    return response.data;
  },
};

export { apiClient };
export default apiClient;
