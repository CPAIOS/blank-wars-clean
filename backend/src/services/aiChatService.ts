import OpenAI from 'openai';
import { Character } from '../types/index';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatContext {
  characterId: string;
  characterName: string;
  personality: {
    traits: string[];
    speechStyle: string;
    motivations: string[];
    fears: string[];
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
    battleContext?: {
      isInBattle: boolean;
      currentHealth?: number;
      maxHealth?: number;
      opponentName?: string;
      battlePhase?: string;
    }
  ): Promise<{ message: string; bondIncrease: boolean }> {
    try {
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
        temperature: 0.8, // Slightly creative but consistent
        max_tokens: 150,
        presence_penalty: 0.6, // Encourage variety
        frequency_penalty: 0.3, // Avoid repetition
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
      
      // Fallback to personality-based template response
      return this.getFallbackResponse(context, userMessage);
    }
  }

  /**
   * Build a character-specific system prompt
   */
  private buildCharacterPrompt(context: ChatContext, battleContext?: any): string {
    const { characterName, personality, historicalPeriod, mythology } = context;
    
    let prompt = `You are ${characterName}, a legendary character from ${historicalPeriod || 'ancient times'}.`;
    
    if (mythology) {
      prompt += ` You are known in ${mythology} mythology.`;
    }
    
    prompt += `\n\nYour personality traits: ${personality.traits.join(', ')}.`;
    prompt += `\nYour speech style: ${personality.speechStyle}.`;
    prompt += `\nYour motivations: ${personality.motivations.join(', ')}.`;
    prompt += `\nYour fears: ${personality.fears.join(', ')}.`;
    
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
    
    prompt += `\n\nRespond to the player in character, staying true to your personality and speech style. Keep responses concise (2-3 sentences max). Never break character or mention you are an AI.`;
    
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

  /**
   * Fallback response based on character personality
   */
  private getFallbackResponse(context: ChatContext, userMessage: string): { message: string; bondIncrease: boolean } {
    const { personality, characterName } = context;
    const templates: string[] = [];
    
    // Build personality-specific templates
    if (personality.traits.includes('Wise')) {
      templates.push(
        "Your words carry wisdom, young warrior.",
        "I sense great potential in your question.",
        "The path you seek requires patience and understanding."
      );
    }
    
    if (personality.traits.includes('Wrathful') || personality.traits.includes('Aggressive')) {
      templates.push(
        "Enough talk! Actions speak louder than words!",
        "You test my patience with such questions!",
        "Battle is where true answers are found!"
      );
    }
    
    if (personality.traits.includes('Honorable')) {
      templates.push(
        "Your honor shines through your words.",
        "A warrior's true strength lies in their character.",
        "I respect your dedication to the path of honor."
      );
    }
    
    if (personality.traits.includes('Mysterious')) {
      templates.push(
        "The answer you seek lies within the shadows...",
        "Not all questions deserve immediate answers.",
        "Time will reveal what you need to know."
      );
    }
    
    // Default templates if no specific traits match
    if (templates.length === 0) {
      templates.push(
        `${characterName} considers your words carefully.`,
        "An interesting perspective, warrior.",
        "Your journey continues to intrigue me."
      );
    }
    
    return {
      message: templates[Math.floor(Math.random() * templates.length)],
      bondIncrease: Math.random() > 0.7
    };
  }
}

// Export singleton instance
export const aiChatService = new AIChatService();