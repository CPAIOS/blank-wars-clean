import { apiClient } from './apiClient';

export interface ConversationEntry {
  player_message: string;
  character_response: string;
  timestamp: string;
  context?: any;
  bond_increase: boolean;
}

export interface ConversationHistory {
  success: boolean;
  character_name: string;
  bond_level: number;
  conversations: ConversationEntry[];
  total_conversations: number;
}

export interface ConversationSaveResponse {
  success: boolean;
  bond_level: number;
  conversation_count: number;
  bond_increased: boolean;
}

export interface BondUpdateResponse {
  success: boolean;
  old_bond_level: number;
  new_bond_level: number;
  change: number;
  reason?: string;
}

class ConversationService {

  /**
   * Get conversation memory limit based on subscription tier
   */
  getMemoryLimit(subscriptionTier: string): number {
    const limits = {
      free: 20,        // Free tier: 20 conversations
      premium: 50,     // Premium tier: 50 conversations 
      legendary: 100   // Legendary tier: 100 conversations
    };
    
    return limits[subscriptionTier as keyof typeof limits] || limits.free;
  }
  
  /**
   * Save a conversation to character memory
   */
  async saveConversation(
    characterId: string, 
    playerMessage: string, 
    characterResponse: string,
    context?: any,
    bondIncrease: boolean = false
  ): Promise<ConversationSaveResponse> {
    try {
      console.log('💬 [ConversationService] Saving conversation for character:', characterId);
      
      const response = await apiClient.post(`/user/characters/${characterId}/conversation`, {
        player_message: playerMessage,
        character_response: characterResponse,
        context,
        bond_increase: bondIncrease
      });

      console.log('✅ [ConversationService] Conversation saved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [ConversationService] Error saving conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a character
   */
  async getConversationHistory(characterId: string, limit: number = 20): Promise<ConversationHistory> {
    try {
      console.log('📚 [ConversationService] Getting conversation history for character:', characterId);
      
      const response = await apiClient.get(`/user/characters/${characterId}/conversations`, {
        params: { limit }
      });

      console.log('✅ [ConversationService] Retrieved', response.data.conversations?.length || 0, 'conversations');
      return response.data;
    } catch (error) {
      console.error('❌ [ConversationService] Error getting conversation history:', error);
      throw error;
    }
  }

  /**
   * Update character bond level directly
   */
  async updateBondLevel(characterId: string, bondChange: number, reason?: string): Promise<BondUpdateResponse> {
    try {
      console.log('💖 [ConversationService] Updating bond level for character:', characterId, 'change:', bondChange);
      
      const response = await apiClient.put(`/user/characters/${characterId}/bond`, {
        bond_change: bondChange,
        reason
      });

      console.log('✅ [ConversationService] Bond level updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [ConversationService] Error updating bond level:', error);
      throw error;
    }
  }

  /**
   * Determine if a conversation should increase bond level
   * This is a simple heuristic - you could make this more sophisticated
   */
  shouldIncreaseBond(playerMessage: string, characterResponse: string): boolean {
    const bondKeywords = [
      'thank you', 'thanks', 'appreciate', 'love', 'like', 'amazing', 'wonderful',
      'great job', 'well done', 'proud', 'respect', 'trust', 'friend', 'care'
    ];

    const message = playerMessage.toLowerCase();
    const response = characterResponse.toLowerCase();
    
    // Check if player message contains positive keywords
    const playerPositive = bondKeywords.some(keyword => message.includes(keyword));
    
    // Check if character response is positive/warm
    const characterPositive = bondKeywords.some(keyword => response.includes(keyword)) ||
                             response.includes('smile') || 
                             response.includes('happy') ||
                             response.includes('glad');

    // Random chance for meaningful conversations (10% base chance)
    const randomBond = Math.random() < 0.1;

    return playerPositive || characterPositive || randomBond;
  }

  /**
   * Format conversation for display
   */
  formatConversationForDisplay(conversations: ConversationEntry[]): Array<{
    type: 'player' | 'character';
    message: string;
    timestamp: Date;
    bondIncrease?: boolean;
  }> {
    const formatted: Array<{
      type: 'player' | 'character';
      message: string;
      timestamp: Date;
      bondIncrease?: boolean;
    }> = [];

    conversations.forEach(conv => {
      const timestamp = new Date(conv.timestamp);
      
      // Add player message
      formatted.push({
        type: 'player',
        message: conv.player_message,
        timestamp
      });

      // Add character response
      formatted.push({
        type: 'character',
        message: conv.character_response,
        timestamp,
        bondIncrease: conv.bond_increase
      });
    });

    return formatted;
  }

  /**
   * Get conversation context for AI (last few messages)
   */
  getConversationContext(conversations: ConversationEntry[], maxMessages: number = 5): string {
    if (!conversations.length) return '';

    const recent = conversations.slice(-maxMessages);
    const context = recent.map(conv => 
      `Player: ${conv.player_message}\nCharacter: ${conv.character_response}`
    ).join('\n\n');

    return context;
  }
}

export const conversationService = new ConversationService();
export default conversationService;