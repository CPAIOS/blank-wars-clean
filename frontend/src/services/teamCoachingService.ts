import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  dangerouslyAllowBrowser: true
});

export interface TeamCoachingContext {
  sessionType: 'conflict_resolution' | 'performance_analysis' | 'team_meeting' | 'strategy_review';
  currentPhase: number;
  totalPhases: number;
  involvedCharacters: CharacterInfo[];
  teamMetrics: TeamMetrics;
  recentEvents: TeamEvent[];
  coachingHistory: PreviousSession[];
}

export interface CharacterInfo {
  id: string;
  name: string;
  personality: string;
  currentMood: 'cooperative' | 'defensive' | 'frustrated' | 'motivated' | 'confused';
  relationshipWithOthers: Record<string, 'friendly' | 'neutral' | 'tense' | 'hostile'>;
  recentPerformance: 'excellent' | 'good' | 'average' | 'poor';
  keyStressors: string[];
}

export interface TeamMetrics {
  overallMorale: number;
  teamChemistry: number;
  communicationScore: number;
  leadershipEffectiveness: number;
  conflictLevel: number;
  performanceTrend: 'improving' | 'stable' | 'declining';
}

export interface TeamEvent {
  type: 'battle_loss' | 'battle_win' | 'argument' | 'great_play' | 'mistake';
  participants: string[];
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
}

export interface PreviousSession {
  type: string;
  outcome: 'successful' | 'partially_successful' | 'unsuccessful';
  participants: string[];
  keyOutcomes: string[];
  followUpNeeded: boolean;
}

export interface CoachingRequest {
  sessionType: TeamCoachingContext['sessionType'];
  context: TeamCoachingContext;
  coachAction: string;
  targetOutcome: string;
  previousMessages: string[];
}

export interface CoachingResponse {
  coachMessage: string;
  characterResponses: CharacterResponse[];
  phaseAdvancement: boolean;
  sessionContinues: boolean;
  metricsImpact: {
    morale?: number;
    chemistry?: number;
    communication?: number;
    leadership?: number;
    conflict?: number;
  };
  suggestedNextActions: string[];
  sessionSummary?: string; // Only if session ends
}

export interface CharacterResponse {
  characterId: string;
  characterName: string;
  response: string;
  emotionalTone: 'cooperative' | 'resistant' | 'neutral' | 'enthusiastic' | 'apologetic';
  bodyLanguage?: string;
  privateThoughts?: string; // What they're thinking but not saying
}

// Coaching prompt templates based on session type
const getCoachingPromptTemplate = (sessionType: TeamCoachingContext['sessionType']): string => {
  const templates = {
    conflict_resolution: `You are facilitating a conflict resolution session. Your role is to:
    - Remain neutral and fair to all parties
    - Help characters understand each other's perspectives
    - Guide them toward mutually acceptable solutions
    - Establish clear agreements and boundaries
    - Model good communication techniques
    
    Approach: Direct but empathetic, structured, solution-focused`,
    
    performance_analysis: `You are conducting a performance review session. Your role is to:
    - Provide specific, actionable feedback
    - Focus on behaviors and outcomes, not personality
    - Help characters identify their own improvement areas
    - Create realistic development plans
    - Build confidence while addressing issues
    
    Approach: Supportive but honest, goal-oriented, encouraging`,
    
    team_meeting: `You are leading a team meeting. Your role is to:
    - Keep discussions on track and productive
    - Ensure everyone has a voice
    - Build team unity and shared purpose
    - Address concerns openly but constructively
    - Inspire and motivate the team
    
    Approach: Inclusive, motivational, vision-focused`,
    
    strategy_review: `You are facilitating a strategy review. Your role is to:
    - Analyze what's working and what isn't
    - Encourage open tactical discussion
    - Help the team adapt to new challenges
    - Build consensus around strategic changes
    - Ensure everyone understands their role
    
    Approach: Analytical, collaborative, results-focused`
  };
  
  return templates[sessionType];
};

// Character personality templates for coaching sessions
const getCharacterCoachingPersonality = (characterId: string): string => {
  const personalities: Record<string, string> = {
    achilles: `In coaching sessions, you are prideful but can be receptive if approached with respect. 
    You respond well to direct communication and challenges to be better. You get defensive about 
    criticism but will listen if it's framed as making you a better warrior. You have a competitive 
    drive to improve and hate being seen as the problem.`,
    
    loki: `In coaching sessions, you are charming but evasive. You deflect with humor and try to 
    redirect blame to others. You're intelligent enough to see the real issues but reluctant to 
    take responsibility. You respond better to being treated as an ally rather than a problem.`,
    
    einstein: `In coaching sessions, you are analytical and earnest. You want to understand the 
    logical reasons for conflicts and inefficiencies. You may over-analyze situations and miss 
    emotional aspects. You respond well to data-driven feedback and structured improvement plans.`,
    
    cleopatra: `In coaching sessions, you are diplomatic but calculating. You present yourself as 
    reasonable while subtly positioning yourself favorably. You're skilled at reading room dynamics 
    and may try to influence outcomes. You respond to being treated as a respected leader.`,
    
    napoleon: `In coaching sessions, you are defensive about your leadership but eager to discuss 
    strategy. You have strong opinions and may interrupt others. You respond well to being asked 
    for strategic input but get frustrated with "personal" issues that seem irrelevant to winning.`,
    
    joan_of_arc: `In coaching sessions, you are sincere and reflective. You genuinely want to help 
    resolve conflicts and improve team harmony. You may try to mediate between others and sometimes 
    blame yourself for team problems. You respond well to being acknowledged for your positive contributions.`
  };
  
  return personalities[characterId] || `This character is generally cooperative in coaching sessions 
  but maintains their core personality traits.`;
};

export async function generateCoachingResponse(
  request: CoachingRequest
): Promise<CoachingResponse> {
  const coachingTemplate = getCoachingPromptTemplate(request.sessionType);
  
  // Build character context
  const characterContext = request.context.involvedCharacters.map(char => {
    const personality = getCharacterCoachingPersonality(char.id);
    return `${char.name}: ${personality}
    Current mood: ${char.currentMood}
    Recent performance: ${char.recentPerformance}
    Key stressors: ${char.keyStressors.join(', ')}`;
  }).join('\n\n');

  // Build session context
  const sessionContext = `
Session Type: ${request.sessionType}
Phase: ${request.context.currentPhase} of ${request.context.totalPhases}
Target Outcome: ${request.targetOutcome}

Team Metrics:
- Morale: ${request.context.teamMetrics.overallMorale}%
- Chemistry: ${request.context.teamMetrics.teamChemistry}%
- Communication: ${request.context.teamMetrics.communicationScore}%
- Leadership Effectiveness: ${request.context.teamMetrics.leadershipEffectiveness}%
- Conflict Level: ${request.context.teamMetrics.conflictLevel}%

Recent Events:
${request.context.recentEvents.slice(-3).map(event => 
  `- ${event.type}: ${event.description} (${event.impact})`
).join('\n')}

Previous Messages in Session:
${request.previousMessages.slice(-5).join('\n')}
`;

  const systemPrompt = `${coachingTemplate}

You are conducting a coaching session with these characters:
${characterContext}

${sessionContext}

The coach just said/did: "${request.coachAction}"

Generate a realistic coaching session response that includes:
1. How each character would realistically respond based on their personality
2. The coaching impact on team metrics
3. Whether this advances the session to the next phase
4. Suggested next actions for the coach

Remember:
- Characters should respond true to their personalities
- Some characters may be resistant or defensive
- Progress should feel earned, not automatic
- Include realistic dialogue and body language
- Consider character relationships and dynamics

Respond with a JSON object containing:
- coachMessage: What the coach should say/do next
- characterResponses: Array of character responses with emotional tones
- phaseAdvancement: boolean (ready for next phase?)
- sessionContinues: boolean
- metricsImpact: Changes to team metrics
- suggestedNextActions: Array of coach options
- sessionSummary: Only if session ends`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the coaching session response." }
      ],
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      coachMessage: response.coachMessage || "Let's continue working on this together.",
      characterResponses: response.characterResponses || [],
      phaseAdvancement: response.phaseAdvancement || false,
      sessionContinues: response.sessionContinues ?? true,
      metricsImpact: response.metricsImpact || {},
      suggestedNextActions: response.suggestedNextActions || [],
      sessionSummary: response.sessionSummary
    };
  } catch (error) {
    console.error('Error generating coaching response:', error);
    
    // Fallback response
    return {
      coachMessage: "I appreciate everyone's participation. Let's keep working together on this.",
      characterResponses: request.context.involvedCharacters.map(char => ({
        characterId: char.id,
        characterName: char.name,
        response: `${char.name} nods thoughtfully.`,
        emotionalTone: 'neutral' as const
      })),
      phaseAdvancement: false,
      sessionContinues: true,
      metricsImpact: { chemistry: 1 },
      suggestedNextActions: [
        'Ask for specific examples',
        'Summarize what you\'ve heard',
        'Suggest a break'
      ]
    };
  }
}

// Generate initial team issues based on team state
export function generateTeamIssues(
  teamMetrics: TeamMetrics,
  recentEvents: TeamEvent[],
  characterRelationships: Record<string, Record<string, string>>
): any[] {
  const issues = [];
  
  // Conflict issues
  if (teamMetrics.conflictLevel > 60) {
    const conflictPairs = Object.entries(characterRelationships)
      .flatMap(([char1, relationships]) => 
        Object.entries(relationships)
          .filter(([char2, relationship]) => relationship === 'hostile' || relationship === 'tense')
          .map(([char2, relationship]) => ({ char1, char2, relationship }))
      );
    
    if (conflictPairs.length > 0) {
      const conflict = conflictPairs[0];
      issues.push({
        id: `conflict_${Date.now()}`,
        type: 'conflict',
        severity: conflict.relationship === 'hostile' ? 'high' : 'medium',
        title: `${conflict.char1} vs ${conflict.char2} Tension`,
        description: `Ongoing conflict between ${conflict.char1} and ${conflict.char2} is affecting team dynamics.`,
        involvedCharacters: [conflict.char1, conflict.char2],
        suggestedActions: [
          'Hold mediation session',
          'Assign complementary roles',
          'Set team behavior guidelines'
        ],
        timeframe: 'Immediate attention needed',
        impactAreas: ['Team Chemistry', 'Communication', 'Battle Coordination']
      });
    }
  }
  
  // Performance issues
  if (teamMetrics.performanceTrend === 'declining') {
    issues.push({
      id: `performance_${Date.now()}`,
      type: 'performance',
      severity: 'medium',
      title: 'Declining Team Performance',
      description: 'Recent battle results show a downward trend. Team needs strategic adjustment.',
      involvedCharacters: ['All Team Members'],
      suggestedActions: [
        'Analyze recent battle footage',
        'Review team composition',
        'Practice new strategies'
      ],
      timeframe: 'This week',
      impactAreas: ['Battle Results', 'Team Confidence']
    });
  }
  
  // Morale issues
  if (teamMetrics.overallMorale < 50) {
    issues.push({
      id: `morale_${Date.now()}`,
      type: 'morale',
      severity: teamMetrics.overallMorale < 30 ? 'high' : 'medium',
      title: 'Low Team Morale',
      description: 'Team spirit is down. Characters need motivation and positive reinforcement.',
      involvedCharacters: ['All Team Members'],
      suggestedActions: [
        'Team building activities',
        'Celebrate recent successes',
        'Address individual concerns'
      ],
      timeframe: 'This week',
      impactAreas: ['Team Spirit', 'Individual Performance', 'Chemistry']
    });
  }
  
  // Communication issues
  if (teamMetrics.communicationScore < 60) {
    issues.push({
      id: `communication_${Date.now()}`,
      type: 'chemistry',
      severity: 'medium',
      title: 'Communication Breakdown',
      description: 'Team members are not effectively communicating during battles and planning.',
      involvedCharacters: ['All Team Members'],
      suggestedActions: [
        'Communication training',
        'Establish clear signals',
        'Practice coordination drills'
      ],
      timeframe: 'Next few days',
      impactAreas: ['Battle Coordination', 'Team Chemistry', 'Strategy Execution']
    });
  }
  
  return issues;
}

// Calculate the success rate of coaching interventions
export function calculateCoachingEffectiveness(
  previousSessions: PreviousSession[],
  currentMetrics: TeamMetrics
): number {
  if (previousSessions.length === 0) return 75; // Default starting effectiveness
  
  const recentSessions = previousSessions.slice(-5);
  const successRate = recentSessions.filter(s => s.outcome === 'successful').length / recentSessions.length;
  
  // Factor in current team state
  const teamHealthScore = (
    currentMetrics.overallMorale + 
    currentMetrics.teamChemistry + 
    currentMetrics.communicationScore + 
    currentMetrics.leadershipEffectiveness
  ) / 4;
  
  return Math.round((successRate * 50) + (teamHealthScore * 0.5));
}