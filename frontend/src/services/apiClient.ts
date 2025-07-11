
import axios from 'axios';

const apiClient = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006') + '/api',
  withCredentials: true,
});

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
    const response = await apiClient.get('/characters');
    return response.data;
  },
};

export { apiClient };
export default apiClient;
