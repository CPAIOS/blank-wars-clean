import { apiClient } from './apiClient';

export interface PackClaimResult {
  grantedCharacters: string[];
  echoesGained: { character_id: string; count: number }[];
}

export interface PackGenerationResult {
  claimToken: string;
}

export class PackService {
  private static instance: PackService;

  static getInstance(): PackService {
    if (!PackService.instance) {
      PackService.instance = new PackService();
    }
    return PackService.instance;
  }

  async generatePack(packType: string): Promise<PackGenerationResult> {
    const response = await apiClient.post('/packs/generate', { packType });
    return response.data;
  }

  async claimPack(claimToken: string): Promise<PackClaimResult> {
    const response = await apiClient.post('/packs/claim', { claimToken });
    return response.data;
  }

  async createGiftPack(characterIds: string[]): Promise<PackGenerationResult> {
    const response = await apiClient.post('/packs/gift', { characterIds });
    return response.data;
  }

  // Map pack IDs from the frontend to backend pack types
  mapPackIdToType(packId: string): string {
    switch (packId) {
      case 'starter':
        return 'standard_starter';
      case 'warrior':
        return 'premium_starter';
      case 'legendary':
        return 'premium_starter';
      case 'mythic':
        return 'premium_starter';
      default:
        return 'standard_starter';
    }
  }
}

export const packService = PackService.getInstance();