
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006',
  withCredentials: true,
  timeout: 30000,
});

export const paymentAPI = {
  purchasePack: async (packType: string, quantity: number) => {
    const response = await apiClient.post('/api/packs/purchase', { packType, quantity });
    return response.data;
  },
  redeemCard: async (serialNumber: string) => {
    const response = await apiClient.post('/api/cards/redeem', { serialNumber });
    return response.data;
  },
  getMintedCards: async () => {
    const response = await apiClient.get('/api/packs/minted-cards');
    return response.data;
  },
};

export const characterAPI = {
  getUserCharacters: async () => {
    console.log('🔄 [characterAPI] Making request to:', '/api/user/characters');
    console.log('🔄 [characterAPI] Base URL:', apiClient.defaults.baseURL);
    const response = await apiClient.get('/api/user/characters');
    console.log('🔄 [characterAPI] Response status:', response.status);
    console.log('🔄 [characterAPI] Response data:', response.data);
    return response.data;
  },
};

export const realEstateAPI = {
  sendMessage: async (context: any) => {
    const response = await apiClient.post('/api/headquarters/real-estate-chat', context);
    return response.data;
  },
};

export { apiClient };
export default apiClient;
