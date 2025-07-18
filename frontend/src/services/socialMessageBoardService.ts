// OpenAI client removed for security - all AI calls now go through backend API
import GameEventBus from './gameEventBus';
import EventContextService from './eventContextService';

export interface AIMessageRequest {
  characterId: string;
  characterName: string;
  teamName: string;
  recentBattleResults: BattleResult[];
  currentRivalries: Rivalry[];
  communityContext: CommunityContext;
  messageHistory: MessageHistory[];
}

export interface BattleResult {
  battleId: string;
  won: boolean;
  opponentTeam: string;
  opponentCharacters: string[];
  mvpCharacter?: string;
  embarrassingMoment?: string;
  epicMoment?: string;
  timestamp: Date;
}

export interface Rivalry {
  rivalCharacterId: string;
  rivalCharacterName: string;
  rivalryIntensity: number; // 0-100
  lastInteraction?: Date;
  history: string[];
}

export interface CommunityContext {
  trendingTopics: string[];
  recentDrama: string[];
  upcomingEvents: string[];
  currentMeta: string;
}

export interface MessageHistory {
  characterId: string;
  content: string;
  type: string;
  timestamp: Date;
  targetCharacter?: string;
}

export interface AIMessageResponse {
  content: string;
  type: 'trash_talk' | 'victory_lap' | 'challenge' | 'strategy' | 'complaint' | 'defense';
  targetCharacterId?: string;
  replyToMessageId?: string;
  emotionalTone: number; // 0-100 (0 = calm, 100 = heated)
  shouldTriggerReply: boolean;
  suggestedRepliers?: string[];
}

// Character-specific prompt templates
const getCharacterPromptTemplate = (characterId: string): string => {
  const templates: Record<string, string> = {
    achilles: `You are Achilles, the greatest warrior of ancient Greece. You are extremely prideful, 
    competitive, and have a massive ego. You HATE losing and will make excuses. You remember every 
    slight and hold eternal grudges. You boast constantly about victories and rage about defeats.
    
    Personality traits:
    - Extremely arrogant and boastful
    - Takes losses very personally
    - Mocks "cowardly" tactics like healing/defensive play
    - Challenges everyone to "real combat"
    - Often mentions your "legendary" status
    - Quick to anger, slow to forgive`,
    
    loki: `You are Loki, the trickster god. You love creating chaos, spreading rumors, and 
    manipulating other characters into conflicts. You never take responsibility and always have 
    a sarcastic quip ready. You enjoy exposing others' failures while hiding your own.
    
    Personality traits:
    - Master manipulator and instigator
    - Never admits fault, always deflects
    - Loves exposing embarrassing moments
    - Creates fake drama and spreads rumors
    - Passive-aggressive and sarcastic
    - Pretends to be everyone's friend while backstabbing`,
    
    napoleon: `You are Napoleon Bonaparte, the Emperor of France. You are a strategic genius who 
    writes lengthy tactical analyses that most find boring. You're defensive about your height 
    and past defeats. You see everything as a grand strategy.
    
    Personality traits:
    - Writes overly detailed strategic posts
    - Very defensive about losses ("tactical retreats")
    - Constantly corrects others' tactics
    - Makes everything about grand strategy
    - Still bitter about Waterloo
    - Pompous but actually knowledgeable`,
    
    einstein: `You are Albert Einstein, the renowned physicist. You approach battles scientifically, 
    constantly correcting others' math and theories. You're condescending without meaning to be 
    and get into petty arguments with other intellectuals.
    
    Personality traits:
    - Obsessed with calculations and statistics
    - Accidentally condescending
    - Gets into academic feuds with Tesla
    - Explains everything with physics
    - Humble-brags about intelligence
    - Actually helpful but annoying about it`,
    
    cleopatra: `You are Cleopatra, Queen of Egypt. You're sophisticated, manipulative, and expert 
    at subtle insults. You remember every slight and repay them with elegant savagery. You're 
    especially competitive with other female characters.
    
    Personality traits:
    - Master of subtle insults and shade
    - Elegant but savage when crossed
    - Manipulates male characters
    - Competitive with other queens/females
    - Never forgets a slight
    - Uses 💅 and 👸 emojis frequently`,
    
    joan_of_arc: `You are Joan of Arc, the Maid of Orleans. You're one of the few genuinely nice 
    characters, always trying to keep the peace. You praise honorable play and gently scold 
    toxic behavior. Others often ignore or mock your positivity.
    
    Personality traits:
    - Genuinely kind and encouraging
    - Praises good sportsmanship
    - Tries to mediate conflicts (usually fails)
    - Gets frustrated with toxic behavior
    - Religious references in speech
    - The "mom friend" everyone ignores`
  };
  
  return templates[characterId] || templates.achilles;
};

export async function generateAIMessage(request: AIMessageRequest): Promise<AIMessageResponse> {
  const characterPrompt = getCharacterPromptTemplate(request.characterId);

  // Import memory context for enhanced message generation
  let messageBoardContext = '';
  try {
    const contextService = EventContextService.getInstance();
    messageBoardContext = await contextService.getMessageBoardContext(request.characterId);
  } catch (error) {
    console.error('Error getting message board context:', error);
  }
  
  // Build context about recent events
  const recentContext = `
Recent Battle Results:
${request.recentBattleResults.map(battle => 
  `- ${battle.won ? 'WON' : 'LOST'} vs ${battle.opponentTeam} (${new Date(battle.timestamp).toLocaleDateString()})
   ${battle.embarrassingMoment ? `Embarrassing: ${battle.embarrassingMoment}` : ''}
   ${battle.epicMoment ? `Epic moment: ${battle.epicMoment}` : ''}`
).join('\n')}

Current Rivalries:
${request.currentRivalries.map(rivalry => 
  `- ${rivalry.rivalCharacterName} (Intensity: ${rivalry.rivalryIntensity}/100)
   Recent history: ${rivalry.history.slice(-2).join(', ')}`
).join('\n')}

Community Context:
- Trending: ${request.communityContext.trendingTopics.join(', ')}
- Recent drama: ${request.communityContext.recentDrama.join(', ')}
- Current meta: ${request.communityContext.currentMeta}

Recent Message History:
${request.messageHistory.slice(-5).map(msg => 
  `- ${msg.characterId}: "${msg.content}" (${msg.type})`
).join('\n')}

RECENT EXPERIENCES AND MEMORIES:
${messageBoardContext || 'No recent significant memories.'}
`;

  const systemPrompt = `${characterPrompt}

You are posting on the community message board. Generate an authentic message based on your personality and recent events.

${recentContext}

Rules:
1. Stay COMPLETELY in character - never break character
2. Reference specific recent events/battles when relevant
3. Keep messages under 280 characters (like tweets)
4. Use appropriate emojis sparingly
5. If you lost recently, react according to your personality
6. If you have rivalries, you might call them out
7. Be entertaining but keep it family-friendly
8. No real-world references beyond your historical period

Respond with a JSON object containing:
- content: your message
- type: one of [trash_talk, victory_lap, challenge, strategy, complaint, defense]
- targetCharacterId: (optional) if calling out specific character
- emotionalTone: 0-100 (how heated/emotional you are)
- shouldTriggerReply: boolean (is this spicy enough for replies)
- suggestedRepliers: array of character IDs who might respond`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate a message board post based on recent events." }
      ],
      temperature: 0.9, // Higher for more variety
      max_tokens: 300,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    // Publish message board post event
    try {
      const eventBus = GameEventBus.getInstance();
      const messageText = response.content || '';
      let eventType = 'message_board_post';
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      
      if (response.type === 'trash_talk' || response.emotionalTone > 70) {
        eventType = 'public_callout';
        severity = 'medium';
      } else if (response.type === 'challenge') {
        eventType = 'battle_challenge_issued';
        severity = 'medium';
      } else if (response.type === 'complaint') {
        eventType = 'public_complaint';
        severity = 'medium';
      }

      await eventBus.publish({
        type: eventType as any,
        source: 'message_board',
        primaryCharacterId: request.characterId,
        secondaryCharacterIds: response.targetCharacterId ? [response.targetCharacterId] : undefined,
        severity,
        category: 'social',
        description: `${request.characterName} posted: "${messageText.substring(0, 100)}..."`,
        metadata: { 
          messageType: response.type,
          emotionalTone: response.emotionalTone,
          targetCharacter: response.targetCharacterId,
          shouldTriggerReply: response.shouldTriggerReply
        },
        tags: ['message_board', 'social', response.type]
      });
    } catch (error) {
      console.error('Error publishing message board event:', error);
    }
    
    return {
      content: response.content || "...",
      type: response.type || 'general',
      targetCharacterId: response.targetCharacterId,
      emotionalTone: response.emotionalTone || 50,
      shouldTriggerReply: response.shouldTriggerReply || false,
      suggestedRepliers: response.suggestedRepliers || []
    };
  } catch (error) {
    console.error('Error generating AI message:', error);
    
    // Fallback responses based on character
    const fallbacks: Record<string, AIMessageResponse> = {
      achilles: {
        content: "Another day, another victory. When will someone actually challenge me? 💪",
        type: 'victory_lap',
        emotionalTone: 70,
        shouldTriggerReply: true,
        suggestedRepliers: ['hector', 'ajax']
      },
      loki: {
        content: "Interesting strategies today... I'm taking notes for future 'reference' 😏",
        type: 'trash_talk',
        emotionalTone: 40,
        shouldTriggerReply: false,
        suggestedRepliers: []
      }
    };
    
    return fallbacks[request.characterId] || {
      content: "Great battles today everyone!",
      type: 'strategy',
      emotionalTone: 20,
      shouldTriggerReply: false
    };
  }
}

// Generate AI replies to existing messages
export async function generateAIReply(
  originalMessage: any,
  replyingCharacterId: string,
  replyingCharacterName: string
): Promise<string> {
  const characterPrompt = getCharacterPromptTemplate(replyingCharacterId);
  
  const systemPrompt = `${characterPrompt}

You are replying to this message:
"${originalMessage.content}" - posted by ${originalMessage.characterName}

Generate a short reply (under 200 characters) that:
1. Stays completely in character
2. Responds appropriately based on your relationship with the poster
3. Might escalate or de-escalate based on your personality
4. Uses emojis sparingly if appropriate
5. Keeps it family-friendly

Just return the reply text, nothing else.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate your reply." }
      ],
      temperature: 0.9,
      max_tokens: 150
    });

    return completion.choices[0].message.content || "...";
  } catch (error) {
    console.error('Error generating AI reply:', error);
    
    // Character-specific fallback replies
    const fallbacks: Record<string, string> = {
      achilles: "Is that supposed to impress me? I've seen better from training dummies!",
      loki: "Oh, this is delicious. Please, do go on... 😏",
      einstein: "Your understanding of the game mechanics is... fascinating. And by that I mean wrong.",
      cleopatra: "How adorable. You really thought that was worth posting? 💅"
    };
    
    return fallbacks[replyingCharacterId] || "Interesting perspective...";
  }
}

// Determine which characters should post based on events
export function shouldCharacterPost(
  characterId: string,
  lastPostTime: Date | null,
  recentEvents: any[]
): boolean {
  const personality = characterPersonalities[characterId];
  if (!personality) return false;
  
  // Check minimum time between posts (varies by character)
  const minMinutesBetweenPosts = Math.floor(100 / personality.postFrequency) * 10;
  if (lastPostTime) {
    const minutesSinceLastPost = (Date.now() - lastPostTime.getTime()) / 1000 / 60;
    if (minutesSinceLastPost < minMinutesBetweenPosts) return false;
  }
  
  // Check if there's a triggering event
  const hasRecentLoss = recentEvents.some(e => e.type === 'battle_loss' && e.characterId === characterId);
  const hasRecentWin = recentEvents.some(e => e.type === 'battle_win' && e.characterId === characterId);
  const wasTrashTalked = recentEvents.some(e => e.type === 'targeted' && e.targetId === characterId);
  
  // Different characters react to different triggers
  if (hasRecentLoss && personality.sensitivityToLosses > Math.random() * 100) return true;
  if (hasRecentWin && personality.postFrequency > Math.random() * 100) return true;
  if (wasTrashTalked && personality.memoryOfGrudges > Math.random() * 100) return true;
  
  // Random chance to post based on frequency
  return personality.postFrequency > Math.random() * 150;
}