import { apiClient } from './apiClient';

export interface CharacterEcho {
  character_id: string;
  count: number;
}

export interface EchoSpendResult {
  success: boolean;
  remainingEchoes: number;
  message?: string;
}

export class EchoService {
  private static instance: EchoService;

  static getInstance(): EchoService {
    if (!EchoService.instance) {
      EchoService.instance = new EchoService();
    }
    return EchoService.instance;
  }

  async getUserEchoes(): Promise<CharacterEcho[]> {
    try {
      const response = await apiClient.get('/echoes');
      return response.data.echoes || [];
    } catch (error) {
      console.error('Error fetching user echoes:', error);
      return [];
    }
  }

  async getEchoCount(characterId: string): Promise<number> {
    try {
      const response = await apiClient.get(`/echoes/${characterId}`);
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching echo count:', error);
      return 0;
    }
  }

  async spendEchoes(
    characterId: string, 
    amount: number, 
    action: 'ascend' | 'rankUp'
  ): Promise<EchoSpendResult> {
    try {
      const response = await apiClient.post('/echoes/spend', {
        characterId,
        amount,
        action
      });
      return response.data;
    } catch (error: any) {
      console.error('Error spending echoes:', error);
      return {
        success: false,
        remainingEchoes: 0,
        message: error.response?.data?.error || 'Failed to spend echoes'
      };
    }
  }

  async ascendCharacter(userCharacterId: string, echoesToSpend: number): Promise<EchoSpendResult> {
    try {
      const response = await apiClient.post('/echoes/ascend', {
        userCharacterId,
        echoesToSpend
      });
      return response.data;
    } catch (error: any) {
      console.error('Error ascending character:', error);
      return {
        success: false,
        remainingEchoes: 0,
        message: error.response?.data?.error || 'Failed to ascend character'
      };
    }
  }

  async rankUpAbility(
    userCharacterId: string, 
    abilityId: string, 
    echoesToSpend: number
  ): Promise<EchoSpendResult> {
    try {
      const response = await apiClient.post('/echoes/rankup', {
        userCharacterId,
        abilityId,
        echoesToSpend
      });
      return response.data;
    } catch (error: any) {
      console.error('Error ranking up ability:', error);
      return {
        success: false,
        remainingEchoes: 0,
        message: error.response?.data?.error || 'Failed to rank up ability'
      };
    }
  }
}

export const echoService = EchoService.getInstance();