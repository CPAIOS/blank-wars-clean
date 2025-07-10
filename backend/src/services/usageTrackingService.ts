import { User, UsageLimits, UsageStatus } from '../types/index';

export class UsageTrackingService {
  private static readonly USAGE_LIMITS: UsageLimits = {
    free: {
      dailyChatLimit: 5, // Unified limit for ALL AI interactions (character, kitchen, team chat)
      dailyImageLimit: 1, // Only 1 DALL-E image per day for free users
      dailyBattleLimit: 3, // 3 battles per day (each battle = 3 matches)
      dailyTrainingLimit: 3 // 3 training activities per day (base limit)
    },
    premium: {
      dailyChatLimit: 75, // Generous but reasonable for all AI interactions
      dailyImageLimit: 5, // 5 images per day for premium
      dailyBattleLimit: 15, // 15 battles per day for premium users
      dailyTrainingLimit: 5 // 5 training activities per day (base limit)
    },
    legendary: {
      dailyChatLimit: -1, // Unlimited
      dailyImageLimit: 10, // Plenty for any reasonable use case
      dailyBattleLimit: -1, // Unlimited battles for legendary tier
      dailyTrainingLimit: 10 // 10 training activities per day (base limit)
    }
  };

  /**
   * Check if user can perform a chat action
   */
  static canUserChat(user: User): boolean {
    // USAGE LIMITS DISABLED - Always allow unlimited usage
    return true;
  }

  /**
   * Check if user can generate an image
   */
  static canUserGenerateImage(user: User): boolean {
    // USAGE LIMITS DISABLED - Always allow unlimited usage
    return true;
  }

  /**
   * Get comprehensive usage status for a user
   */
  static getUserUsageStatus(user: User): UsageStatus {
    // USAGE LIMITS DISABLED - Return unlimited status for all features
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return {
      canChat: true,
      canGenerateImage: true,
      canBattle: true,
      canTraining: true,
      remainingChats: -1,
      remainingImages: -1,
      remainingBattles: -1,
      remainingTraining: -1,
      resetTime: tomorrow.toISOString()
    };
  }

  /**
   * Track a chat usage and update user record
   */
  static async trackChatUsage(userId: string, db: any): Promise<boolean> {
    // USAGE LIMITS DISABLED - Always allow unlimited usage
    return true;
  }

  /**
   * Track an image generation usage and update user record
   */
  static async trackImageUsage(userId: string, db: any): Promise<boolean> {
    // USAGE LIMITS DISABLED - Always allow unlimited usage
    return true;
  }

  /**
   * Check if user can start a battle
   */
  static canUserBattle(user: User): boolean {
    // USAGE LIMITS DISABLED - Always allow unlimited usage
    return true;
  }

  /**
   * Track a battle usage and update user record
   */
  static async trackBattleUsage(userId: string, db: any): Promise<boolean> {
    // USAGE LIMITS DISABLED - Always allow unlimited usage
    return true;
  }

  /**
   * Check if user can start training (with gym bonuses)
   */
  static canUserTraining(user: User, gymTier: string = 'community'): boolean {
    // USAGE LIMITS DISABLED - Always allow unlimited usage
    return true;
  }

  /**
   * Track a training usage and update user record
   */
  static async trackTrainingUsage(userId: string, db: any, gymTier: string = 'community'): Promise<boolean> {
    // USAGE LIMITS DISABLED - Always allow unlimited usage
    return true;
  }



  /**
   * Get tier limits for display purposes
   */
  static getTierLimits(): UsageLimits {
    return this.USAGE_LIMITS;
  }
}

export const usageTrackingService = UsageTrackingService;