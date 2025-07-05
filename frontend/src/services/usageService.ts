interface UsageStatus {
  canChat: boolean;
  canGenerateImage: boolean;
  canBattle: boolean;
  remainingChats: number;
  remainingImages: number;
  remainingBattles: number;
  resetTime: string;
}

interface TierLimits {
  free: {
    dailyChatLimit: number;
    dailyImageLimit: number;
  };
  premium: {
    dailyChatLimit: number;
    dailyImageLimit: number;
  };
  legendary: {
    dailyChatLimit: number;
    dailyImageLimit: number;
  };
}

class UsageService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';

  /**
   * Get current user's usage status
   */
  async getUserUsageStatus(): Promise<UsageStatus> {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseUrl}/api/usage/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching usage status:', error);
      // Return default values for anonymous/error cases
      return {
        canChat: true,
        canGenerateImage: true,
        canBattle: true,
        remainingChats: 5,
        remainingImages: 1,
        remainingBattles: 3,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }

  /**
   * Get tier limits for all subscription tiers
   */
  async getTierLimits(): Promise<TierLimits> {
    try {
      const response = await fetch(`${this.baseUrl}/api/usage/limits`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tier limits');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tier limits:', error);
      // Return default limits
      return {
        free: { dailyChatLimit: 5, dailyImageLimit: 1, dailyBattleLimit: 3 },
        premium: { dailyChatLimit: 75, dailyImageLimit: 5, dailyBattleLimit: 15 },
        legendary: { dailyChatLimit: -1, dailyImageLimit: 10, dailyBattleLimit: -1 }
      };
    }
  }

  /**
   * Format remaining time until reset
   */
  formatTimeUntilReset(resetTime: string): string {
    const reset = new Date(resetTime);
    const now = new Date();
    const diff = reset.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Resets soon';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Resets in ${hours}h ${minutes}m`;
    } else {
      return `Resets in ${minutes}m`;
    }
  }

  /**
   * Get usage display text for UI
   */
  getUsageDisplayText(usageStatus: UsageStatus): {
    chatText: string;
    imageText: string;
    battleText: string;
    chatColor: string;
    imageColor: string;
    battleColor: string;
  } {
    const chatText = usageStatus.remainingChats === -1 
      ? 'Unlimited AI interactions' 
      : `${usageStatus.remainingChats} AI interactions remaining`;
    
    const imageText = usageStatus.remainingImages === -1 
      ? 'Unlimited images' 
      : `${usageStatus.remainingImages} images remaining`;

    const battleText = usageStatus.remainingBattles === -1 
      ? 'Unlimited battles' 
      : `${usageStatus.remainingBattles} battles remaining`;

    const chatColor = usageStatus.remainingChats === -1 
      ? 'text-yellow-400'
      : usageStatus.remainingChats > 3 
        ? 'text-green-400'
        : usageStatus.remainingChats > 1
          ? 'text-yellow-400'
          : 'text-red-400';

    const imageColor = usageStatus.remainingImages === -1 
      ? 'text-yellow-400'
      : usageStatus.remainingImages > 2 
        ? 'text-green-400'
        : usageStatus.remainingImages > 0
          ? 'text-yellow-400'
          : 'text-red-400';

    const battleColor = usageStatus.remainingBattles === -1 
      ? 'text-yellow-400'
      : usageStatus.remainingBattles > 1 
        ? 'text-green-400'
        : usageStatus.remainingBattles > 0
          ? 'text-yellow-400'
          : 'text-red-400';

    return { chatText, imageText, battleText, chatColor, imageColor, battleColor };
  }
}

export const usageService = new UsageService();
export type { UsageStatus, TierLimits };