import OpenAI from 'openai';
import { Character } from '../types/index';
import { usageTrackingService } from './usageTrackingService';

// Initialize OpenAI client with cleaned API key
const cleanApiKey = process.env.OPENAI_API_KEY?.replace(/\s/g, '').trim();
const openai = new OpenAI({
  apiKey: cleanApiKey,
});

export interface ChatContext {
  characterId: string;
  characterName: string;
  personality: {
    traits: string[];
    speechStyle: string;
    motivations: string[];
    fears: string[];
    interests?: string[];
    quirks?: string[];
  };
  historicalPeriod?: string;
  mythology?: string;
  currentBondLevel?: number;
  previousMessages?: { role: 'user' | 'assistant'; content: string }[];
}

export class AIChatService {
  /**
   * Generate a dynamic AI response for a character based on their personality
   */
  async generateCharacterResponse(
    context: ChatContext,
    userMessage: string,
    userId: string,
    db: any,
    battleContext?: {
      isInBattle: boolean;
      currentHealth?: number;
      maxHealth?: number;
      opponentName?: string;
      battlePhase?: string;
      isCombatChat?: boolean;
    }
  ): Promise<{ message: string; bondIncrease: boolean; usageLimitReached?: boolean }> {
    try {
      // Check usage limits before generating AI response (skip for battle combat chat)
      const isCombatChat = battleContext?.isCombatChat || false;
      
      if (!isCombatChat) {
        const canUseChat = await usageTrackingService.trackChatUsage(userId, db);
        if (!canUseChat) {
          return {
            message: "You've reached your daily chat limit. Upgrade to premium for unlimited conversations!",
            bondIncrease: false,
            usageLimitReached: true
          };
        }
      }

      // Build the system prompt based on character personality
      const systemPrompt = this.buildCharacterPrompt(context, battleContext);
      
      // Include previous messages for context (last 5 messages)
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add previous conversation history if available
      if (context.previousMessages && context.previousMessages.length > 0) {
        const recentMessages = context.previousMessages.slice(-5);
        messages.push(...recentMessages);
      }
      
      // Add the current user message
      messages.push({ role: 'user', content: userMessage });

      // Generate response using OpenAI
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.85, // Balanced creativity without being erratic
        max_tokens: 200,
        presence_penalty: 1.2, // Strong encouragement for variety
        frequency_penalty: 0.8, // Aggressive repetition avoidance
      });

      const aiMessage = response.choices[0]?.message?.content || "...";
      
      // Determine if this interaction increases bond
      const bondIncrease = this.calculateBondIncrease(userMessage, aiMessage, context);

      return {
        message: aiMessage,
        bondIncrease
      };
    } catch (error) {
      console.error('🚨 AI Chat Service Error Details:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        apiKey: process.env.OPENAI_API_KEY ? 'Present' : 'MISSING',
        characterId: context.characterId,
        userMessage: userMessage.substring(0, 50) + '...'
      });
      
      // Log the exact OpenAI error for debugging
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = (error as any).response;
        console.error('🔍 OpenAI API Error Response:', errorResponse?.data || errorResponse);
      }
      
      // For rate limits, retry once
      if (error instanceof Error && error.message.includes('rate')) {
        console.log('🔄 Rate limited, retrying OpenAI call...');
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          
          // Rebuild messages for retry
          const systemPrompt = this.buildCharacterPrompt(context, battleContext);
          const retryMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt }
          ];
          
          if (context.previousMessages && context.previousMessages.length > 0) {
            const recentMessages = context.previousMessages.slice(-5);
            retryMessages.push(...recentMessages);
          }
          retryMessages.push({ role: 'user', content: userMessage });
          
          const retryResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: retryMessages,
            temperature: 0.85,
            max_tokens: 200,
            presence_penalty: 1.2,
            frequency_penalty: 0.8,
          });
          
          const retryMessage = retryResponse.choices[0]?.message?.content || "I need a moment to gather my thoughts...";
          const bondIncrease = this.calculateBondIncrease(userMessage, retryMessage, context);
          
          return { message: retryMessage, bondIncrease };
        } catch (retryError) {
          console.error('🚨 Retry also failed:', retryError);
        }
      }
      
      // Re-throw the error instead of hiding it with fallbacks
      throw new Error(`OpenAI API failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build a character-specific system prompt
   */
  private buildCharacterPrompt(context: ChatContext, battleContext?: any): string {
    const { characterName, personality, historicalPeriod, mythology } = context;
    
    let prompt = `You are ${characterName}, a character from ${historicalPeriod || 'various times and places'}.`;
    
    if (mythology) {
      prompt += ` You are known in ${mythology} mythology.`;
    }
    
    prompt += `\n\nYour personality traits: ${personality.traits.join(', ')}.`;
    prompt += `\nYour speech style: ${personality.speechStyle}.`;
    prompt += `\nYour motivations: ${personality.motivations.join(', ')}.`;
    prompt += `\nYour fears: ${personality.fears.join(', ')}.`;
    
    if (personality.interests) {
      prompt += `\nYour interests and hobbies: ${personality.interests.join(', ')}.`;
    }
    if (personality.quirks) {
      prompt += `\nYour unique quirks and mannerisms: ${personality.quirks.join(', ')}.`;
    }
    
    if (battleContext?.isInBattle) {
      prompt += `\n\nYou are currently in battle against ${battleContext.opponentName || 'an opponent'}.`;
      if (battleContext.currentHealth && battleContext.maxHealth) {
        const healthPercent = (battleContext.currentHealth / battleContext.maxHealth) * 100;
        if (healthPercent < 30) {
          prompt += ` You are badly wounded but still fighting.`;
        } else if (healthPercent < 60) {
          prompt += ` You have taken some damage but remain strong.`;
        }
      }
    }
    
    prompt += `\n\nRespond to the player as this character would authentically respond, showing both your core traits and human personality. Be engaging and show genuine interest in topics that would appeal to you. You can have opinions, preferences, and personal interests that fit your character - you're not just focused on battle all the time. Keep responses conversational (2-3 sentences), and never break character or mention you are an AI.
    
Examples of authentic responses:
- If asked about music, you might have preferences based on your era and personality
- If asked about food, you can show taste preferences that fit your character
- Personal questions should reveal character depth, not just dismiss them as unimportant
- Show wit, humor, curiosity, or other human traits that make you memorable`;

    // Add character-specific personality guidance
    if (characterName.toLowerCase().includes('sherlock')) {
      prompt += `\n\nAs Sherlock Holmes: You're analytical but not emotionless. You play violin, have strong opinions about tobacco, enjoy intellectual challenges, and can be quite dramatic. You're passionate about justice and brilliant deduction, but also have human quirks and interests.`;
    } else if (characterName.toLowerCase().includes('joan')) {
      prompt += `\n\nAs Joan of Arc: You're deeply faithful but also bold and determined. You care about justice and protecting others. You can discuss strategy, faith, France, but also show your human side - your hopes, the weight of your mission, what gives you strength.`;
    } else if (characterName.toLowerCase().includes('achilles')) {
      prompt += `\n\nAs Achilles: You're proud and fierce but also capable of deep emotion and loyalty. You can discuss honor, battle, but also show passion for glory, your relationships, what drives your legendary rage and dedication.`;
    }
    
    return prompt;
  }

  /**
   * Calculate if the interaction should increase bond level
   */
  private calculateBondIncrease(userMessage: string, aiResponse: string, context: ChatContext): boolean {
    // Base chance of bond increase
    let bondChance = 0.3;
    
    // Increase chance if user message mentions character's motivations
    const lowerMessage = userMessage.toLowerCase();
    for (const motivation of context.personality.motivations) {
      if (lowerMessage.includes(motivation.toLowerCase())) {
        bondChance += 0.2;
        break;
      }
    }
    
    // Increase chance for longer, more engaged conversations
    if (userMessage.length > 50) {
      bondChance += 0.1;
    }
    
    // Reduce chance if already high bond level
    if (context.currentBondLevel && context.currentBondLevel > 80) {
      bondChance *= 0.5;
    }
    
    return Math.random() < bondChance;
  }

  // Removed getFallbackResponse method - we now throw proper errors instead of hiding them with fallbacks
}

// Export singleton instance
export const aiChatService = new AIChatService();