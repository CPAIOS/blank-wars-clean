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
    const today = new Date().toISOString().split('T')[0];
    
    // Reset daily count if it's a new day
    if (user.daily_chat_reset_date !== today) {
      return true; // Will be reset when tracking the usage
    }

    const limits = this.USAGE_LIMITS[user.subscription_tier];
    
    // Unlimited for legendary tier
    if (limits.dailyChatLimit === -1) {
      return true;
    }

    return user.daily_chat_count < limits.dailyChatLimit;
  }

  /**
   * Check if user can generate an image
   */
  static canUserGenerateImage(user: User): boolean {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset daily count if it's a new day
    if (user.daily_image_reset_date !== today) {
      return true; // Will be reset when tracking the usage
    }

    const limits = this.USAGE_LIMITS[user.subscription_tier];
    
    // Unlimited for legendary tier
    if (limits.dailyImageLimit === -1) {
      return true;
    }

    return user.daily_image_count < limits.dailyImageLimit;
  }

  /**
   * Get comprehensive usage status for a user
   */
  static getUserUsageStatus(user: User): UsageStatus {
    const today = new Date().toISOString().split('T')[0];
    const limits = this.USAGE_LIMITS[user.subscription_tier];
    
    // Calculate reset times
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // Check if counts need to be reset
    const chatCount = user.daily_chat_reset_date === today ? user.daily_chat_count : 0;
    const imageCount = user.daily_image_reset_date === today ? user.daily_image_count : 0;
    const battleCount = user.daily_battle_reset_date === today ? user.daily_battle_count : 0;
    const trainingCount = user.daily_training_reset_date === today ? user.daily_training_count : 0;
    
    return {
      canChat: limits.dailyChatLimit === -1 ? true : chatCount < limits.dailyChatLimit,
      canGenerateImage: limits.dailyImageLimit === -1 ? true : imageCount < limits.dailyImageLimit,
      canBattle: limits.dailyBattleLimit === -1 ? true : battleCount < limits.dailyBattleLimit,
      canTraining: limits.dailyTrainingLimit === -1 ? true : trainingCount < limits.dailyTrainingLimit,
      remainingChats: limits.dailyChatLimit === -1 ? -1 : Math.max(0, limits.dailyChatLimit - chatCount),
      remainingImages: limits.dailyImageLimit === -1 ? -1 : Math.max(0, limits.dailyImageLimit - imageCount),
      remainingBattles: limits.dailyBattleLimit === -1 ? -1 : Math.max(0, limits.dailyBattleLimit - battleCount),
      remainingTraining: limits.dailyTrainingLimit === -1 ? -1 : Math.max(0, limits.dailyTrainingLimit - trainingCount),
      resetTime: tomorrow.toISOString()
    };
  }

  /**
   * Track a chat usage and update user record
   */
  static async trackChatUsage(userId: string, db: any): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get current user data
      const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
      
      // For anonymous users, allow limited chat usage for testing/demos
      if (!user) {
        if (userId === 'anonymous') {
          // Anonymous users get 3 free chats per session (no persistence)
          // In a real app, you'd track this in memory or require signup
          console.log('🔓 Allowing anonymous user limited chat access for demo');
          return true;
        }
        return false;
      }

      // Reset count if it's a new day
      let newChatCount = user.daily_chat_count;
      if (user.daily_chat_reset_date !== today) {
        newChatCount = 0;
      }

      // Check if user can chat
      if (!this.canUserChat({ ...user, daily_chat_count: newChatCount, daily_chat_reset_date: today })) {
        return false;
      }

      // Increment count
      newChatCount += 1;

      // Update database
      await db.run(
        'UPDATE users SET daily_chat_count = ?, daily_chat_reset_date = ? WHERE id = ?',
        [newChatCount, today, userId]
      );

      return true;
    } catch (error) {
      console.error('Error tracking chat usage:', error);
      return false;
    }
  }

  /**
   * Track an image generation usage and update user record
   */
  static async trackImageUsage(userId: string, db: any): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get current user data
      const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) return false;

      // Reset count if it's a new day
      let newImageCount = user.daily_image_count;
      if (user.daily_image_reset_date !== today) {
        newImageCount = 0;
      }

      // Check if user can generate image
      if (!this.canUserGenerateImage({ ...user, daily_image_count: newImageCount, daily_image_reset_date: today })) {
        return false;
      }

      // Increment count
      newImageCount += 1;

      // Update database
      await db.run(
        'UPDATE users SET daily_image_count = ?, daily_image_reset_date = ? WHERE id = ?',
        [newImageCount, today, userId]
      );

      return true;
    } catch (error) {
      console.error('Error tracking image usage:', error);
      return false;
    }
  }

  /**
   * Check if user can start a battle
   */
  static canUserBattle(user: User): boolean {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset daily count if it's a new day
    if (user.daily_battle_reset_date !== today) {
      return true; // Will be reset when tracking the usage
    }

    const limits = this.USAGE_LIMITS[user.subscription_tier];
    
    // Unlimited for legendary tier
    if (limits.dailyBattleLimit === -1) {
      return true;
    }

    return user.daily_battle_count < limits.dailyBattleLimit;
  }

  /**
   * Track a battle usage and update user record
   */
  static async trackBattleUsage(userId: string, db: any): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get current user data
      const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) return false;

      // Reset count if it's a new day
      let newBattleCount = user.daily_battle_count;
      if (user.daily_battle_reset_date !== today) {
        newBattleCount = 0;
      }

      // Check if user can battle
      if (!this.canUserBattle({ ...user, daily_battle_count: newBattleCount, daily_battle_reset_date: today })) {
        return false;
      }

      // Increment count
      newBattleCount += 1;

      // Update database
      await db.run(
        'UPDATE users SET daily_battle_count = ?, daily_battle_reset_date = ? WHERE id = ?',
        [newBattleCount, today, userId]
      );

      return true;
    } catch (error) {
      console.error('Error tracking battle usage:', error);
      return false;
    }
  }

  /**
   * Check if user can start training (with gym bonuses)
   */
  static canUserTraining(user: User, gymTier: string = 'community'): boolean {
    const today = new Date().toISOString().split('T')[0];
    
    // Reset daily count if it's a new day
    if (user.daily_training_reset_date !== today) {
      return true; // Will be reset when tracking the usage
    }

    const limits = this.USAGE_LIMITS[user.subscription_tier];
    
    // Unlimited for legendary tier
    if (limits.dailyTrainingLimit === -1) {
      return true;
    }

    // Apply gym facility bonuses
    let baseLimit = limits.dailyTrainingLimit;
    switch (gymTier) {
      case 'bronze': baseLimit += 2; break;
      case 'elite': baseLimit += 5; break;
      case 'legendary': baseLimit += 10; break;
      default: baseLimit += 0; // community gym
    }

    return user.daily_training_count < baseLimit;
  }

  /**
   * Track a training usage and update user record
   */
  static async trackTrainingUsage(userId: string, db: any, gymTier: string = 'community'): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get current user data
      const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) return false;

      // Reset count if it's a new day
      let newTrainingCount = user.daily_training_count;
      if (user.daily_training_reset_date !== today) {
        newTrainingCount = 0;
      }

      // Check if user can train (with gym bonuses)
      if (!this.canUserTraining({ ...user, daily_training_count: newTrainingCount, daily_training_reset_date: today }, gymTier)) {
        return false;
      }

      // Increment count
      newTrainingCount += 1;

      // Update database
      await db.run(
        'UPDATE users SET daily_training_count = ?, daily_training_reset_date = ? WHERE id = ?',
        [newTrainingCount, today, userId]
      );

      return true;
    } catch (error) {
      console.error('Error tracking training usage:', error);
      return false;
    }
  }



  /**
   * Get tier limits for display purposes
   */
  static getTierLimits(): UsageLimits {
    return this.USAGE_LIMITS;
  }
}

export const usageTrackingService = UsageTrackingService;