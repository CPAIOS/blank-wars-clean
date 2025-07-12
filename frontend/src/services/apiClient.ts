
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006',
  withCredentials: true,
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
    const response = await apiClient.get('/api/characters');
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
