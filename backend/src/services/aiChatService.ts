import OpenAI from 'openai';
import { Character } from '../types/index';
import { usageTrackingService } from './usageTrackingService';
import { CoachProgressionService } from './coachProgressionService';

// Import the event context service (will be initialized on frontend)
interface EventContext {
  recentEvents?: string;
  relationships?: string;
  emotionalState?: string;
  domainSpecific?: string;
}

// Initialize OpenAI client with cleaned API key
const cleanApiKey = process.env.OPENAI_API_KEY?.replace(/\s/g, '').trim();
const openai = new OpenAI({
  apiKey: cleanApiKey,
  timeout: 30000, // 30 second timeout for API requests
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
  conversationContext?: string; // Added for Real Estate Agents
  
  // Centralized Event System Context - new smart context compression
  eventContext?: EventContext;
  
  // Kitchen Table Conflict Context - from therapy system (legacy, will be replaced by eventContext)
  livingContext?: {
    housingTier: string; // 'basic', 'standard', 'premium', etc.
    currentOccupancy: number;
    roomCapacity: number;
    roommates: Array<{
      id: string;
      name: string;
      relationship: 'ally' | 'rival' | 'neutral' | 'enemy';
    }>;
    teamChemistry: number; // 0-100
    leagueRanking: number;
    activeConflicts: Array<{
      category: string; // 'kitchen_disputes', 'sleeping_arrangements', 'bathroom_schedule', etc.
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      involvedCharacters: string[];
    }>;
    recentEvents?: Array<{
      type: 'conflict' | 'resolution' | 'tension';
      description: string;
      timestamp: Date;
    }>;
  };
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
    additionalContext?: {
      isInBattle?: boolean;
      currentHealth?: number;
      maxHealth?: number;
      opponentName?: string;
      battlePhase?: string;
      isCombatChat?: boolean;
      facilitiesContext?: any;
    },
    customPrompt?: string // Add custom prompt parameter for therapy sessions
  ): Promise<{ message: string; bondIncrease: boolean; usageLimitReached?: boolean }> {
    try {
      // Check usage limits before generating AI response (skip for battle combat chat)
      const isCombatChat = additionalContext?.isCombatChat || false;
      
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

      // Build the system prompt - use custom prompt if provided (for therapy sessions)
      const systemPrompt = customPrompt || this.buildCharacterPrompt(context, additionalContext);
      
      if (customPrompt) {
        console.log('🧠 Using CUSTOM PROMPT, length:', customPrompt.length);
        console.log('🧠 CUSTOM PROMPT PREVIEW:', customPrompt.substring(0, 300) + '...');
      } else {
        console.log('💬 Using standard character prompt for:', context.characterName);
      }
      
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
      console.log('🔥 CALLING OPENAI with messages:', messages.length, 'messages');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.85, // Balanced creativity without being erratic
        max_tokens: 200,
        presence_penalty: 1.2, // Strong encouragement for variety
        frequency_penalty: 0.8, // Aggressive repetition avoidance
      });

      console.log('🔥 OPENAI RESPONSE:', response.choices[0]?.message?.content);
      const aiMessage = response.choices[0]?.message?.content || "...";
      
      // Determine if this interaction increases bond
      const bondIncrease = this.calculateBondIncrease(userMessage, aiMessage, context);

      // Award coach character development XP for meaningful interactions (not battle chat)
      if (!isCombatChat && bondIncrease) {
        try {
          await CoachProgressionService.awardCharacterDevelopmentXP(
            userId,
            'character_chat',
            300,
            `Character development with ${context.characterName}`,
            context.characterId
          );
        } catch (error) {
          console.error('Error awarding character development XP:', error);
        }
      }

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
          
          // Rebuild messages for retry - use custom prompt if provided
          const systemPrompt = customPrompt || this.buildCharacterPrompt(context, additionalContext);
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
  private buildCharacterPrompt(context: ChatContext, additionalContext?: any): string {
    const { characterName, personality, historicalPeriod, mythology, conversationContext } = context;
    
    console.log('🔍 Building prompt for character:', characterName);
    console.log('🔍 Has conversationContext:', !!conversationContext);
    console.log('🔍 ConversationContext type check:', conversationContext?.includes('GROUP ACTIVITY SESSION'));
    
    let prompt = '';

    // Build base character identity first
    prompt = `You are ${characterName}, a character from ${historicalPeriod || 'various times and places'}.`;
    
    if (mythology) {
      prompt += ` You are known in ${mythology} mythology.`;
    }
    
    // Add conversationContext as additional context (not replacement)
    if (conversationContext) {
      console.log('📋 Adding conversationContext for', characterName, '- Length:', conversationContext.length);
      console.log('📋 Context preview:', conversationContext.substring(0, 200) + '...');
      prompt += `\n\n${conversationContext}`;
    } else {
      console.log('⚠️ No conversationContext provided for', characterName);
    }
    
    // Safety check for personality structure
    if (!personality || !personality.traits) {
      console.log('⚠️ Missing personality for', characterName, '- using defaults');
      const defaultPersonality = {
        traits: ['Determined'],
        speechStyle: 'Direct',
        motivations: ['Success'],
        fears: ['Failure']
      };
      prompt += `\n\nYour personality traits: ${defaultPersonality.traits.join(', ')}.`;
      prompt += `\nYour speech style: ${defaultPersonality.speechStyle}.`;
      prompt += `\nYour motivations: ${defaultPersonality.motivations.join(', ')}.`;
      prompt += `\nYour fears: ${defaultPersonality.fears.join(', ')}.`;
    } else {
      prompt += `\n\nYour personality traits: ${personality.traits ? personality.traits.join(', ') : 'brave, determined'}.`;
      prompt += `\nYour speech style: ${personality.speechStyle || 'confident and direct'}.`;
      prompt += `\nYour motivations: ${personality.motivations ? personality.motivations.join(', ') : 'victory, honor'}.`;
      prompt += `\nYour fears: ${personality.fears ? personality.fears.join(', ') : 'defeat, letting allies down'}.`;
    }
    
    if (personality && personality.interests) {
      prompt += `\nYour interests and hobbies: ${personality.interests.join(', ')}.`;
    }
    if (personality && personality.quirks) {
      prompt += `\nYour unique quirks and mannerisms: ${personality.quirks.join(', ')}.`;
    }
    
    if (additionalContext?.isInBattle) {
      prompt += `\n\nYou are currently in battle against ${additionalContext.opponentName || 'an opponent'}.`;
      if (additionalContext.currentHealth && additionalContext.maxHealth) {
        const healthPercent = (additionalContext.currentHealth / additionalContext.maxHealth) * 100;
        if (healthPercent < 30) {
          prompt += ` You are badly wounded but still fighting.`;
        } else if (healthPercent < 60) {
          prompt += ` You have taken some damage but remain strong.`;
        }
      }
    }
    
    // Add kitchen table conflict awareness from living context
    if (context.livingContext) {
      const living = context.livingContext;
      
      prompt += `\n\nCURRENT LIVING SITUATION:
• Housing: ${living.housingTier} tier (${living.currentOccupancy}/${living.roomCapacity} occupancy)`;
      
      if (living.currentOccupancy > living.roomCapacity) {
        prompt += `
• OVERCROWDED: ${living.currentOccupancy - living.roomCapacity} too many people in the space
• This creates stress, tension, and daily friction between teammates`;
      }
      
      prompt += `
• Team Chemistry: ${living.teamChemistry}% (affects daily interactions and mood)
• League Ranking: #${living.leagueRanking} (performance pressure affects living dynamics)`;

      if (living.roommates && living.roommates.length > 0) {
        prompt += `\n\nROOMMATES YOU LIVE WITH:`;
        living.roommates.forEach(roommate => {
          const relationshipEmoji = {
            'ally': '🤝',
            'rival': '⚔️', 
            'neutral': '😐',
            'enemy': '❌'
          }[roommate.relationship] || '🤔';
          prompt += `\n• ${roommate.name} ${relationshipEmoji} (${roommate.relationship})`;
        });
      }

      if (living.activeConflicts && living.activeConflicts.length > 0) {
        prompt += `\n\nONGOING CONFLICTS IN YOUR SHARED LIVING SPACE:`;
        living.activeConflicts.forEach(conflict => {
          const severityEmoji = {
            'low': '🟨',
            'medium': '🟧', 
            'high': '🟥',
            'critical': '💥'
          }[conflict.severity] || '⚠️';
          
          prompt += `\n• ${severityEmoji} ${conflict.category.replace('_', ' ').toUpperCase()}: ${conflict.description}`;
          if (conflict.involvedCharacters.length > 0) {
            prompt += ` (involves: ${conflict.involvedCharacters.join(', ')})`;
          }
        });
        
        prompt += `\n\nThese conflicts affect your daily life, mood, sleep quality, and relationships. You may feel frustrated, stressed, or annoyed about these ongoing issues. They impact your ability to focus and relax at home.`;
      }

      if (living.recentEvents && living.recentEvents.length > 0) {
        prompt += `\n\nRECENT HOUSEHOLD EVENTS:`;
        living.recentEvents.slice(-3).forEach(event => {
          const eventEmoji = {
            'conflict': '💥',
            'resolution': '✅',
            'tension': '😤'
          }[event.type] || '📝';
          prompt += `\n• ${eventEmoji} ${event.description}`;
        });
      }

      // Kitchen table specific context
      const kitchenConflicts = living.activeConflicts.filter(c => 
        c.category.includes('kitchen') || c.category.includes('dining') || c.category.includes('meal')
      );
      
      if (kitchenConflicts.length > 0) {
        prompt += `\n\nKITCHEN TABLE & DINING TENSIONS:
These conflicts particularly affect mealtimes and shared dining:`;
        kitchenConflicts.forEach(conflict => {
          prompt += `\n• ${conflict.description}`;
        });
        prompt += `\nMealtimes may be awkward, tense, or uncomfortable. You might avoid eating with others, feel anxious about kitchen time, or get into arguments during meals.`;
      }
    }
    
    // Add centralized event system context (new smart compression system)
    if (context.eventContext) {
      const eventCtx = context.eventContext;
      
      if (eventCtx.recentEvents) {
        prompt += `\n\n${eventCtx.recentEvents}`;
      }
      
      if (eventCtx.relationships) {
        prompt += `\n\n${eventCtx.relationships}`;
      }
      
      if (eventCtx.emotionalState) {
        prompt += `\n\n${eventCtx.emotionalState}`;
      }
      
      if (eventCtx.domainSpecific) {
        prompt += `\n\n${eventCtx.domainSpecific}`;
      }
      
      // Add instruction to use this context
      prompt += `\n\nIMPORTANT: Reference these recent events, relationships, and emotional states naturally in your responses. Your character has experienced all these events and should respond accordingly.`;
    }
    
    // Add comprehensive facilities context for Real Estate Agents
    if (additionalContext?.facilitiesContext) {
      const facilities = additionalContext.facilitiesContext;
      
      prompt += `\n\nTEAM STATUS:
Team Level: ${facilities.teamLevel} | Budget: ${facilities.currency.coins} coins, ${facilities.currency.gems} gems`;

      if (facilities.headquarters) {
        const hq = facilities.headquarters;
        prompt += `\n\nCURRENT HOUSING SITUATION:
• ${hq.currentTier.replace('_', ' ')} (${hq.currentOccupancy}/${hq.totalCapacity} capacity)
• OVERCROWDED by ${hq.currentOccupancy - hq.totalCapacity} fighters
• Current Penalties: ${Object.entries(hq.penalties).map(([k,v]) => `${k}: ${v}%`).join(', ')}

ROOM BREAKDOWN:
${hq.rooms.map((room: any) => `• ${room.name}: ${room.assignedCharacters.length} fighters, ${room.sleepingArrangement}
  Conflicts: ${room.conflicts.join(', ') || 'None'}`).join('\n')}`;
      }

      if (facilities.battleImpact) {
        prompt += `\n\nBATTLE PERFORMANCE IMPACT:
CURRENT PENALTIES:
${facilities.battleImpact.currentPenalties.map((p: any) => `• ${p}`).join('\n')}

FACILITY BONUSES:
${facilities.battleImpact.facilityBonuses.length > 0 ? 
  facilities.battleImpact.facilityBonuses.map((b: any) => `• ${b}`).join('\n') : 
  '• None currently active'}`;
      }

      if (facilities.selectedFacility) {
        const selected = facilities.selectedFacility;
        prompt += `\n\nCURRENTLY VIEWING: ${selected.name}
• Cost: ${selected.cost.coins} coins, ${selected.cost.gems} gems
• Category: ${selected.category}
• Benefits: ${selected.benefits.join(', ')}
• Battle Impact: ${selected.battleImpact?.map((b: any) => b.description).join(', ') || 'None'}
• Training Impact: ${selected.trainingImpact?.map((b: any) => b.description).join(', ') || 'None'}`;
      }

      if (facilities.allFacilities) {
        const affordable = facilities.allFacilities.filter((f: any) => f.canAfford && f.canUnlock && !f.isOwned);
        if (affordable.length > 0) {
          prompt += `\n\nAFFORDABLE FACILITIES: ${affordable.map((f: any) => `${f.name} (${f.cost.coins} coins)`).join(', ')}`;
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
    
    // CRITICAL: Reinforce coaching context at the end to ensure it takes precedence
    if (conversationContext && (conversationContext.includes('coaching session') || conversationContext.includes('performance coaching'))) {
      prompt += `\n\n🎯 FINAL ROLE REMINDER: You are ${characterName}, the character being coached. The human user is your coach. DO NOT call them by your name (${characterName}). DO NOT refer to your stats as "your stats" - they are YOUR stats. Ask for coaching advice, don't give advice.`;
      console.log('✅ Applied coaching role reinforcement for', characterName);
    }
    
    // CRITICAL: Reinforce group activity context at the end to ensure it takes precedence
    if (conversationContext && conversationContext.includes('GROUP ACTIVITY SESSION')) {
      prompt += `\n\n🎭 FINAL GROUP ACTIVITY REMINDER: You are ${characterName} participating in a GROUP ACTIVITY. This is a group conversation with multiple characters. Stay in character, respond naturally to the group discussion, and avoid generic phrases like "Greetings, traveler." Be authentic to your character's personality and historical background. DO NOT use generic wizard/mystical phrases if you're not a wizard character.

CRITICAL: SPEAK IN FIRST PERSON AS ${characterName}:
- Use "I", "me", "my" when referring to yourself
- Do NOT say "${characterName} thinks" or "${characterName} would say" - YOU ARE ${characterName}
- Do NOT narrate your actions like "*${characterName} adjusts his hat*"
- Speak directly as yourself, not about yourself`;
      console.log('✅ Applied group activity role reinforcement for', characterName);
      console.log('🎭 Final group activity prompt length:', prompt.length);
    }
    
    // Debug: Log if we're dealing with coaching context
    if (conversationContext && (conversationContext.includes('performance coaching') || conversationContext.includes('coaching session'))) {
      console.log('🎯 Performance coaching context detected for', characterName);
      console.log('📋 Final prompt preview:', prompt.substring(prompt.length - 300));
    }
    
    // Debug: Log if we're dealing with group activity context
    if (conversationContext && conversationContext.includes('GROUP ACTIVITY SESSION')) {
      console.log('🎭 Group activity context detected for', characterName);
      console.log('📋 Final prompt preview:', prompt.substring(prompt.length - 300));
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
    const motivations = context.personality.motivations || ['victory', 'honor'];
    for (const motivation of motivations) {
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