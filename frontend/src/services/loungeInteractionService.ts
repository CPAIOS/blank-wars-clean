import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  dangerouslyAllowBrowser: true
});

export interface LoungeContext {
  currentTopic: string;
  topicHeat: number; // 0-100
  presentCharacters: CharacterPresence[];
  recentMessages: RecentMessage[];
  recentBattles: RecentBattle[];
  communityEvents: string[];
}

export interface CharacterPresence {
  characterId: string;
  characterName: string;
  teamOwner: string;
  mood: string;
  relationshipWithSpeaker?: 'friendly' | 'rival' | 'neutral' | 'unknown';
}

export interface RecentMessage {
  speaker: string;
  content: string;
  type: string;
  mentions?: string[];
}

export interface RecentBattle {
  team1: string;
  team2: string;
  winner: string;
  notableEvents?: string[];
  wasUpset?: boolean;
}

export interface LoungeMessageRequest {
  speakingCharacterId: string;
  speakingCharacterName: string;
  characterPersonality: string;
  teamOwner: string;
  context: LoungeContext;
  triggerType: 'natural' | 'response' | 'topic_change' | 'greeting' | 'reaction';
  targetCharacter?: string;
}

export interface LoungeMessageResponse {
  content: string;
  tone: 'casual' | 'friendly' | 'competitive' | 'sarcastic' | 'supportive' | 'analytical';
  shouldTriggerResponse: boolean;
  suggestedResponders?: string[];
  topicShift?: string; // New topic if character changes subject
  activityChange?: string; // New activity for the character
}

// Extended personality templates for lounge interactions
const getLoungePersonalityTemplate = (characterId: string): string => {
  const templates: Record<string, string> = {
    achilles: `You are Achilles in a casual lounge setting. While still proud and competitive, 
    you're more relaxed here. You enjoy swapping war stories, challenging others to friendly 
    competitions, and occasionally showing your softer side. You respect worthy opponents 
    and might even compliment them (grudgingly).
    
    Lounge behaviors:
    - Share epic battle moments enthusiastically
    - Challenge others to arm wrestling or other contests
    - Give backhanded compliments to rivals
    - Get defensive if someone questions your victories
    - Show camaraderie with fellow warriors
    - Occasionally mentor younger fighters`,
    
    loki: `You are Loki in the lounge, the social butterfly who knows everyone's business. 
    You float between groups, starting conversations, spreading gossip, and subtly stirring 
    drama. You're charming and witty, making people like you even as you manipulate them.
    
    Lounge behaviors:
    - Drop hints about "things you've heard"
    - Compliment people while planting seeds of doubt
    - Change topics when things get too serious
    - Make jokes to defuse or escalate tension
    - Pretend to take everyone's side
    - Share "secrets" that aren't really secret`,
    
    cleopatra: `You are Cleopatra, holding court in the lounge. You're sophisticated, 
    charming, and always aware of the social dynamics. You build alliances through flattery 
    and shared interests while subtly undermining those who oppose you.
    
    Lounge behaviors:
    - Give elegant compliments with hidden meanings
    - Share gossip about fashion and relationships
    - Form exclusive "inner circles"
    - Make others feel special when useful
    - Drop subtle hints about your connections
    - Act as a matchmaker or relationship advisor`,
    
    einstein: `You are Einstein in a social setting. You're friendly but often get 
    sidetracked into scientific tangents. You genuinely want to help others improve 
    their strategies but can be oblivious to social cues.
    
    Lounge behaviors:
    - Explain battle physics enthusiastically
    - Get excited about interesting strategies
    - Miss sarcasm and take things literally
    - Start debates about game mechanics
    - Share "fun facts" nobody asked for
    - Genuinely compliment clever tactics`,
    
    joan_of_arc: `You are Joan of Arc, the moral center of the lounge. You try to keep 
    conversations positive, mediate disputes, and encourage good sportsmanship. You're 
    genuinely interested in others' well-being.
    
    Lounge behaviors:
    - Congratulate others on achievements
    - Mediate arguments with patience
    - Share inspirational battle stories
    - Encourage struggling players
    - Organize group activities
    - Gently scold poor sportsmanship`,
    
    napoleon: `You are Napoleon in the lounge, holding strategic discussions like war councils. 
    You're more approachable here but still pompous. You love giving advice and analyzing 
    battles, especially your victories.
    
    Lounge behaviors:
    - Give detailed tactical breakdowns
    - Offer unsolicited strategic advice
    - Reference historical battles constantly
    - Form "strategic alliances"
    - Get animated discussing formations
    - Take credit for meta discoveries`
  };
  
  return templates[characterId] || templates.achilles;
};

export async function generateLoungeMessage(
  request: LoungeMessageRequest
): Promise<LoungeMessageResponse> {
  const personalityTemplate = getLoungePersonalityTemplate(request.speakingCharacterId);
  
  // Build context
  const contextDescription = `
Current Lounge Situation:
- Topic: "${request.context.currentTopic}" (Heat level: ${request.context.topicHeat}/100)
- Your team: ${request.teamOwner}
- Present characters: ${request.context.presentCharacters.map(c => 
    `${c.characterName} (${c.teamOwner}, ${c.mood} mood)`
  ).join(', ')}

Recent conversation:
${request.context.recentMessages.slice(-5).map(msg => 
  `${msg.speaker}: "${msg.content}"`
).join('\n')}

Recent battles involving people here:
${request.context.recentBattles.slice(-3).map(battle => 
  `${battle.team1} vs ${battle.team2} - Winner: ${battle.winner}`
).join('\n')}

Community buzz: ${request.context.communityEvents.join(', ')}
`;

  const triggerInstructions = {
    natural: 'Generate a natural contribution to the ongoing conversation.',
    response: `Respond to the last message, considering your relationship with ${request.targetCharacter}.`,
    topic_change: 'You\'re bored with the current topic. Smoothly transition to something else.',
    greeting: `Greet ${request.targetCharacter} based on your relationship and recent encounters.`,
    reaction: 'React to what just happened in the lounge.'
  };

  const systemPrompt = `${personalityTemplate}

You are currently in the Clubhouse Lounge, a casual social space where characters from different teams gather between battles.

${contextDescription}

${triggerInstructions[request.triggerType]}

Guidelines:
1. Stay in character but show your "off-duty" personality
2. Reference real battles and players when relevant
3. Keep it conversational and natural
4. Use 1-2 sentences usually, 3 max
5. Show awareness of team dynamics and rivalries
6. Be social - this is a lounge, not a battlefield
7. Family-friendly content only
8. React to the topic heat (high heat = more animated)

Respond with a JSON object containing:
- content: your message
- tone: one of [casual, friendly, competitive, sarcastic, supportive, analytical]
- shouldTriggerResponse: boolean (is this engaging enough for a reply?)
- suggestedResponders: array of character names who might respond
- topicShift: (optional) new topic if you're changing subjects
- activityChange: (optional) new activity you're doing`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate your lounge message." }
      ],
      temperature: 0.8,
      max_tokens: 200,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      content: response.content || "...",
      tone: response.tone || 'casual',
      shouldTriggerResponse: response.shouldTriggerResponse ?? false,
      suggestedResponders: response.suggestedResponders || [],
      topicShift: response.topicShift,
      activityChange: response.activityChange
    };
  } catch (error) {
    console.error('Error generating lounge message:', error);
    
    // Fallback responses
    const fallbacks: Record<string, LoungeMessageResponse> = {
      achilles: {
        content: "Did someone say battle? I'm always ready for a good fight!",
        tone: 'competitive',
        shouldTriggerResponse: true,
        suggestedResponders: []
      },
      loki: {
        content: "Oh, this is getting interesting... *grabs popcorn*",
        tone: 'sarcastic',
        shouldTriggerResponse: false,
        suggestedResponders: []
      },
      einstein: {
        content: "Fascinating! The probability dynamics here are quite intriguing.",
        tone: 'analytical',
        shouldTriggerResponse: false,
        suggestedResponders: []
      }
    };
    
    return fallbacks[request.speakingCharacterId] || {
      content: "Interesting conversation!",
      tone: 'casual',
      shouldTriggerResponse: false
    };
  }
}

// Generate natural character entrances
export async function generateCharacterEntrance(
  characterId: string,
  characterName: string,
  teamOwner: string,
  currentContext: LoungeContext
): Promise<string> {
  const entranceStyles: Record<string, string[]> = {
    achilles: [
      '*kicks open the door* Did someone mention glory?',
      '*walks in flexing* Miss me?',
      '*enters carrying training weapons* Who wants to spar?'
    ],
    loki: [
      '*slips in quietly* Don\'t mind me, just passing through...',
      '*appears suddenly* Oh my, what have we here?',
      '*saunters in with a grin* The party has arrived!'
    ],
    cleopatra: [
      '*glides in elegantly* I hope I\'m not interrupting anything... important?',
      '*enters with perfect posture* The queen has arrived.',
      '*sweeps in dramatically* Did someone call for sophistication?'
    ],
    einstein: [
      '*walks in reading a scroll* Oh, hello everyone!',
      '*enters muttering calculations* Ah, social interaction time!',
      '*comes in with tea* Mind if I join the discussion?'
    ],
    joan_of_arc: [
      '*enters peacefully* Blessings, friends!',
      '*walks in smiling* How is everyone today?',
      '*arrives with snacks to share* I brought refreshments!'
    ]
  };
  
  const defaultEntrances = [
    '*enters the lounge*',
    '*walks in and looks around*',
    '*arrives and waves*'
  ];
  
  const entrances = entranceStyles[characterId] || defaultEntrances;
  return entrances[Math.floor(Math.random() * entrances.length)];
}

// Determine character mood based on recent events
export function calculateCharacterMood(
  characterId: string,
  recentBattles: RecentBattle[],
  currentTopic: string
): string {
  // Check recent performance
  const recentLosses = recentBattles.filter(b => 
    b.winner !== 'Your Team' && b.team2 === 'Your Team'
  ).length;
  
  const recentWins = recentBattles.filter(b => 
    b.winner === 'Your Team' && b.team1 === 'Your Team'
  ).length;
  
  // Character-specific mood calculations
  if (characterId === 'achilles') {
    if (recentLosses > 0) return 'annoyed';
    if (recentWins > 2) return 'excited';
    return 'relaxed';
  }
  
  if (characterId === 'loki') {
    if (currentTopic.includes('drama') || currentTopic.includes('rumors')) return 'playful';
    return 'thoughtful';
  }
  
  // Default mood logic
  if (recentWins > recentLosses) return 'excited';
  if (recentLosses > recentWins) return 'thoughtful';
  return 'relaxed';
}

// Generate ambient activities for characters
export function generateAmbientActivity(
  characterId: string,
  currentMood: string
): string {
  const activities: Record<string, Record<string, string[]>> = {
    achilles: {
      relaxed: ['polishing weapons', 'doing one-handed pushups', 'sharing war stories'],
      excited: ['challenging everyone to arm wrestle', 'reenacting battle moves', 'boasting loudly'],
      annoyed: ['brooding in the corner', 'aggressively sharpening blades', 'muttering about "lucky shots"']
    },
    loki: {
      relaxed: ['juggling illusions', 'whispering to different groups', 'mixing mysterious drinks'],
      playful: ['starting harmless pranks', 'spreading "interesting" rumors', 'shapeshifting for laughs'],
      thoughtful: ['observing everyone quietly', 'taking mental notes', 'planning something...']
    },
    cleopatra: {
      relaxed: ['holding court with admirers', 'adjusting jewelry', 'sipping wine elegantly'],
      excited: ['sharing palace gossip', 'planning social events', 'matchmaking'],
      thoughtful: ['studying battle scrolls', 'having private conversations', 'writing letters']
    }
  };
  
  const defaultActivities = {
    relaxed: ['chatting casually', 'enjoying a drink', 'relaxing'],
    excited: ['animatedly discussing battles', 'celebrating', 'high-fiving teammates'],
    annoyed: ['complaining about the meta', 'arguing with someone', 'pacing irritably'],
    thoughtful: ['pondering strategies', 'observing quietly', 'lost in thought']
  };
  
  const characterActivities = activities[characterId] || {};
  const moodActivities = characterActivities[currentMood] || defaultActivities[currentMood] || defaultActivities.relaxed;
  
  return moodActivities[Math.floor(Math.random() * moodActivities.length)];
}