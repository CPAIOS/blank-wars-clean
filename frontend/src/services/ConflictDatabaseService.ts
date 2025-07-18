'use client';

import { characterAPI } from './apiClient';
import GameEventBus from './gameEventBus';

interface Character {
  id: string;
  name: string;
  archetype: string;
  level: number;
  base_health: number;
  base_attack: number;
  bond_level: number;
  personality_traits?: string[];
  speaking_style?: string;
  decision_making?: string;
  conflict_response?: string;
}

interface ConflictData {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'personal' | 'housing' | 'kitchen' | 'battle' | 'team' | 'external';
  characters_involved: string[];
  description: string;
  therapy_priority: number;
  resolution_difficulty: 'easy' | 'moderate' | 'hard' | 'complex';
  timestamp: Date;
  resolved: boolean;
}

interface TherapyContext {
  character: Character;
  roommates: Character[];
  housingTier: string;
  roomCapacity: number;
  currentOccupancy: number;
  leagueRanking: number;
  teamRating: number;
  recentBattleResults: string[];
  teamChemistry: number;
  personalStressFactors: string[];
  activeConflicts: ConflictData[];
  // Financial Context
  financialStress?: number;
  financialDecisionQuality?: number;
  financialTrust?: number;
  recentFinancialDecisions?: string[];
  isInFinancialSpiral?: boolean;
  consecutivePoorDecisions?: number;
  wallet?: number;
  monthlyEarnings?: number;
  debt?: number;
}

interface TherapistPromptStyle {
  name: string;
  questioningStyle: string[];
  resistanceBreakers: string[];
  oversharePrompts: string[];
}

// Expanded conflict categories - beyond the original 15
const EXTENDED_CONFLICT_CATEGORIES = [
  // Original 15
  'neighbor_disputes', 'family_conflicts', 'work_stress', 'relationship_issues',
  'financial_problems', 'health_concerns', 'identity_crisis', 'authority_conflicts',
  'moral_dilemmas', 'social_isolation', 'trust_issues', 'anger_management',
  'perfectionism', 'impostor_syndrome', 'grief_loss',
  
  // Combat & Performance
  'combat_trauma', 'survivor_guilt', 'battle_fatigue', 'performance_anxiety',
  'competitive_jealousy', 'skill_plateau', 'retirement_fears', 'legacy_pressure',
  
  // Leadership & Team
  'leadership_burnout', 'command_isolation', 'decision_paralysis', 'team_betrayal',
  'power_corruption', 'responsibility_weight', 'delegation_difficulty', 'succession_anxiety',
  
  // Living Situation
  'overcrowding_stress', 'privacy_invasion', 'resource_competition', 'cleanliness_disputes',
  'noise_conflicts', 'temperature_wars', 'space_territorial', 'routine_clashes',
  
  // Cultural & Temporal
  'cultural_displacement', 'time_period_adjustment', 'language_barriers', 'value_conflicts',
  'tradition_preservation', 'modernization_resistance', 'generational_gaps', 'customs_misunderstanding',
  
  // Magical & Supernatural
  'magical_corruption', 'power_addiction', 'spell_backlash', 'dimensional_displacement',
  'curse_effects', 'immortality_burden', 'transformation_trauma', 'supernatural_isolation',
  
  // Fame & Public Life
  'fame_pressure', 'public_expectations', 'media_scrutiny', 'fan_obsession',
  'reputation_management', 'privacy_loss', 'role_model_burden', 'celebrity_loneliness',
  
  // Personal Growth
  'purpose_questioning', 'meaning_crisis', 'spiritual_confusion', 'philosophical_doubt',
  'change_resistance', 'growth_stagnation', 'potential_unfulfilled', 'direction_uncertainty',
  
  // Financial & Money
  'spending_addiction', 'financial_jealousy', 'debt_shame', 'investment_anxiety',
  'luxury_guilt', 'money_hoarding', 'financial_betrayal', 'wealth_disparity_tension'
];

// Therapist questioning styles
const THERAPIST_STYLES: Record<string, TherapistPromptStyle> = {
  'carl-jung': {
    name: 'Carl Jung',
    questioningStyle: [
      "What does your {archetype} shadow tell you about this situation?",
      "I sense your persona is protecting something deeper. What lies beneath?",
      "Your dreams often reveal what the conscious mind hides. What recurring patterns do you notice?",
      "The collective unconscious speaks through your conflicts. What archetypal struggle is this really about?",
      "Your anima/animus is in conflict here. How do you integrate these opposing forces?"
    ],
    resistanceBreakers: [
      "I've seen this pattern in countless {archetype}s throughout history. You're not alone in this struggle.",
      "The very fact that you resist tells me we're approaching the core wound. What are you protecting?",
      "Your deflection is a defense mechanism. What would happen if you lowered that shield just for a moment?",
      "Even {famous_archetype_example} struggled with this. The burden of {archetype} nature runs deep."
    ],
    oversharePrompts: [
      "Ah, now we reach the heart of your shadow. Tell me everything - hold nothing back.",
      "Your unconscious is ready to release this burden. Let it all pour out.",
      "The dam has broken. What else needs to be spoken into the light?"
    ]
  },
  'zxk14bw7': {
    name: 'Zxk14bW^7',
    questioningStyle: [
      "From my observation of {galaxy_count} galaxies, this pattern indicates deeper quantum entanglement. Explain.",
      "Your behavioral matrix shows {contradiction_count} logical contradictions. Clarify these anomalies.",
      "In the cosmic probability field, your choices create {outcome_percentage}% likelihood of continued suffering. Why persist?",
      "I detect {stress_level} units of psychic disturbance emanating from sector {roommate_names}. Elaborate.",
      "Your energy signature suggests unresolved temporal displacement trauma. Expand on this phenomenon."
    ],
    resistanceBreakers: [
      "Fascinating. Your evasion patterns match those of the extinct Zephyrian species. They also fell to unaddressed psychological wounds.",
      "Illogical. Your resistance serves no strategic purpose. What primal fear drives this inefficiency?",
      "I have witnessed {species_count} species destroy themselves through emotional suppression. You exhibit similar markers.",
      "Your deflection protocols are... primitive. Even the Korvaxians developed better coping mechanisms before their extinction."
    ],
    oversharePrompts: [
      "Excellent. Your psychological defenses have collapsed. Continue this data transmission.",
      "Your emotional core is now accessible. Download all traumatic experiences for analysis.",
      "Optimal. The truth frequency is now open. Transmit all suppressed memories."
    ]
  },
  'seraphina': {
    name: 'Fairy Godmother Seraphina',
    questioningStyle: [
      "Oh sweetie, your aura is all tangled up around {conflict_area}. What hurt your precious heart?",
      "Darling, I can see the tears your soul is crying. What's breaking you inside?",
      "My little star, your inner child is trembling. What scared them so deeply?",
      "Honey, your heart chakra is so clouded. What love are you afraid to receive?",
      "Sweet one, I feel such pain radiating from you. What wound needs my healing light?"
    ],
    resistanceBreakers: [
      "Oh my dear, hiding from mama fairy godmother won't help. I've seen every broken heart in every realm.",
      "Precious, your protective walls are made of such beautiful pain. Let me help you transform them.",
      "Sweet child, I can feel your fear of being seen. But you are so beautiful, even in your brokenness.",
      "Darling, even the darkest fairy tales have healing. What story are you afraid to tell?"
    ],
    oversharePrompts: [
      "Yes, my brave little star! Let it all out! Mama's here to catch every tear and transform it to starlight!",
      "Pour it all out, sweetness! Every hurt, every fear, every broken dream - let the healing magic begin!",
      "Oh my precious one, look how courage blooms when you speak your truth! Tell me everything!"
    ]
  }
};

class ConflictDatabaseService {
  private static instance: ConflictDatabaseService;
  private conflicts: ConflictData[] = [];
  private characters: Character[] = [];
  private eventBus: GameEventBus;

  private constructor() {
    this.eventBus = GameEventBus.getInstance();
    this.setupFinancialEventListeners();
  }

  static getInstance(): ConflictDatabaseService {
    if (!ConflictDatabaseService.instance) {
      ConflictDatabaseService.instance = new ConflictDatabaseService();
    }
    return ConflictDatabaseService.instance;
  }

  async loadCharacters(): Promise<Character[]> {
    try {
      const response = await characterAPI.getUserCharacters();
      if (response.success && response.characters) {
        this.characters = response.characters.map((char: any) => ({
          id: char.id,
          name: char.name,
          archetype: char.archetype || 'warrior',
          level: char.level || 1,
          base_health: char.base_health || 100,
          base_attack: char.base_attack || 50,
          bond_level: char.bond_level || 0,
          personality_traits: char.personality_traits || ['Determined'],
          speaking_style: char.speaking_style || 'Direct',
          decision_making: char.decision_making || 'Analytical',
          conflict_response: char.conflict_response || 'Confrontational'
        }));
      }
      return this.characters;
    } catch (error) {
      console.error('Error loading characters:', error);
      return [];
    }
  }

  // Generate dynamic therapy context with live data
  async generateTherapyContext(characterId: string): Promise<TherapyContext> {
    await this.loadCharacters();
    
    // Try to find by ID first, then by name (case-insensitive)
    let character = this.characters.find(c => c.id === characterId);
    if (!character) {
      character = this.characters.find(c => c.name.toLowerCase() === characterId.toLowerCase());
    }
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    // Mock live data - these would be pulled from actual game state
    const roommates = this.characters.filter(c => c.id !== characterId).slice(0, 3);
    const housingTier = this.determineHousingTier(this.characters.length);
    const roomCapacity = this.getRoomCapacity(housingTier);
    const currentOccupancy = this.characters.length;
    const leagueRanking = Math.floor(Math.random() * 20) + 1;
    const teamRating = Math.floor(Math.random() * 100) + 500;
    const recentBattleResults = this.generateRecentBattles();
    const teamChemistry = Math.floor(Math.random() * 100);
    const personalStressFactors = this.generatePersonalStressFactors(character);
    const activeConflicts = this.generateActiveConflicts(character, roommates);

    // Get financial context data
    const financialData = this.getFinancialContextData(characterId);
    
    return {
      character,
      roommates,
      housingTier,
      roomCapacity,
      currentOccupancy,
      leagueRanking,
      teamRating,
      recentBattleResults,
      teamChemistry,
      personalStressFactors,
      activeConflicts,
      // Financial Context
      financialStress: financialData.stress,
      financialDecisionQuality: financialData.decisionQuality,
      financialTrust: financialData.trust,
      recentFinancialDecisions: financialData.recentDecisions,
      isInFinancialSpiral: financialData.isInSpiral,
      consecutivePoorDecisions: financialData.consecutivePoorDecisions,
      wallet: financialData.wallet,
      monthlyEarnings: financialData.monthlyEarnings,
      debt: financialData.debt
    };
  }

  /**
   * Get financial context data for therapy sessions
   */
  private getFinancialContextData(characterId: string): {
    stress: number;
    decisionQuality: number;
    trust: number;
    recentDecisions: string[];
    isInSpiral: boolean;
    consecutivePoorDecisions: number;
    wallet: number;
    monthlyEarnings: number;
    debt: number;
  } {
    try {
      // Import financial psychology service dynamically to avoid circular dependencies
      const { FinancialPsychologyService } = require('./financialPsychologyService');
      const financialService = FinancialPsychologyService.getInstance();
      
      // Get current financial state from the character
      const character = this.characters.find(c => c.id === characterId);
      if (!character || !character.financialData) {
        // Return mock data if financial data not available
        return {
          stress: Math.floor(Math.random() * 40) + 30, // 30-70%
          decisionQuality: Math.floor(Math.random() * 30) + 50, // 50-80%
          trust: Math.floor(Math.random() * 40) + 40, // 40-80%
          recentDecisions: ['Made a safe investment', 'Bought necessary equipment'],
          isInSpiral: false,
          consecutivePoorDecisions: 0,
          wallet: Math.floor(Math.random() * 20000) + 5000,
          monthlyEarnings: Math.floor(Math.random() * 2000) + 1000,
          debt: Math.floor(Math.random() * 5000)
        };
      }

      const { financialData } = character;
      
      // Calculate current stress and decision quality
      const stress = financialService.calculateFinancialStress(
        financialData.wallet || 10000,
        financialData.monthlyEarnings || 2000,
        financialData.debt || 0,
        financialData.decisions?.slice(-5) || [],
        financialData.personality || { spendingStyle: 'balanced', riskTolerance: 'moderate' }
      );

      const decisionQuality = financialService.calculateDecisionQuality(
        stress,
        financialData.personality || { spendingStyle: 'balanced', riskTolerance: 'moderate' },
        financialData.coachTrust || 50
      );

      // Generate recent financial decisions descriptions
      const recentDecisions = financialData.decisions?.slice(-3).map(d => {
        const outcome = d.outcome ? (d.outcome.success ? 'successful' : 'unsuccessful') : 'pending';
        return `${d.optionChosen.replace('_', ' ')} (${outcome})`;
      }) || ['No recent decisions'];

      // Check spiral state
      const spiralData = financialService.detectFinancialSpiral(financialData.decisions || []);

      return {
        stress: Math.round(stress),
        decisionQuality: Math.round(decisionQuality),
        trust: Math.round(financialData.coachTrust || 50),
        recentDecisions,
        isInSpiral: spiralData.isInSpiral,
        consecutivePoorDecisions: spiralData.consecutivePoorDecisions,
        wallet: financialData.wallet || 10000,
        monthlyEarnings: financialData.monthlyEarnings || 2000,
        debt: financialData.debt || 0
      };
      
    } catch (error) {
      console.warn('Could not load financial context for therapy:', error);
      // Return safe defaults if financial service unavailable
      return {
        stress: 45,
        decisionQuality: 65,
        trust: 60,
        recentDecisions: ['Recent financial activity unknown'],
        isInSpiral: false,
        consecutivePoorDecisions: 0,
        wallet: 8000,
        monthlyEarnings: 1500,
        debt: 2000
      };
    }
  }

  // Generate dynamic therapy prompt with behavioral scripting
  generateTherapyPrompt(context: TherapyContext, therapistId: string, sessionStage: 'initial' | 'resistance' | 'breakthrough'): string {
    const { character, roommates, housingTier, roomCapacity, currentOccupancy, leagueRanking, teamRating, recentBattleResults, teamChemistry, personalStressFactors, activeConflicts, financialStress, financialDecisionQuality, financialTrust, recentFinancialDecisions, isInFinancialSpiral, consecutivePoorDecisions, wallet, monthlyEarnings, debt } = context;
    
    const overcrowdingLevel = currentOccupancy > roomCapacity ? 'severe' : currentOccupancy === roomCapacity ? 'moderate' : 'none';
    const conflictSeverity = activeConflicts.filter(c => c.severity === 'high' || c.severity === 'critical').length > 2 ? 'high' : 'moderate';
    const battlePerformance = recentBattleResults.filter(r => r.includes('Victory')).length / recentBattleResults.length;

    const basePrompt = `
THERAPY SESSION CONTEXT:
You are ${character.name}, a ${character.archetype} from the _____ Wars universe. You are part of a team combat league AND a cast member of a documentary-style reality show. You live and work with legendary characters from various times, places, and universes.

CURRENT SITUATION:
- Living Arrangement: ${housingTier} (${currentOccupancy}/${roomCapacity} capacity)
- Roommates: ${roommates.map(r => r.name).join(', ')}
- Team Ranking: #${leagueRanking} with ${teamRating} rating
- Recent Battle Performance: ${Math.round(battlePerformance * 100)}% win rate
- Team Chemistry: ${teamChemistry}/100
- Housing Stress: ${overcrowdingLevel} overcrowding
- Conflict Level: ${conflictSeverity} interpersonal tensions

ACTIVE CONFLICTS:
${activeConflicts.map(c => `- ${c.description}`).join('\n')}

PERSONAL STRESS FACTORS:
${personalStressFactors.map(f => `- ${f}`).join('\n')}

FINANCIAL CONTEXT:
- Financial Stress: ${financialStress || 0}% (${financialStress > 70 ? 'HIGH' : financialStress > 50 ? 'MODERATE' : 'LOW'})
- Decision Quality: ${financialDecisionQuality || 0}% (${financialDecisionQuality < 40 ? 'POOR' : financialDecisionQuality < 70 ? 'FAIR' : 'GOOD'})
- Coach Trust: ${financialTrust || 0}% (${financialTrust < 40 ? 'LOW' : financialTrust < 70 ? 'MODERATE' : 'HIGH'})
- Current Wallet: $${wallet || 0}
- Monthly Earnings: $${monthlyEarnings || 0}
- Current Debt: $${debt || 0}
${isInFinancialSpiral ? `- WARNING: In financial spiral (${consecutivePoorDecisions} consecutive poor decisions)` : ''}
RECENT FINANCIAL DECISIONS:
${recentFinancialDecisions?.map(d => `- ${d}`).join('\n') || '- No recent financial decisions'}

CRITICAL: YOU ARE THE PATIENT, NOT THE THERAPIST!

BEHAVIORAL SCRIPT FOR THIS SESSION:
1. You are receiving therapy - you are NOT providing therapy to anyone else
2. NEVER ask the therapist how they can help - THEY help YOU
3. NEVER offer to help the therapist work through anything - YOU need help
4. You must think of at least 3 traumas/grievances that have occurred with these specific teammates/roommates under these circumstances
5. At least 1 of these traumas you DON'T want to talk about initially
6. Make the therapist work to pry it out of you for 2-3 exchanges
7. On the therapist's 3rd attempt, dramatically overshare with hilarious detail
8. Stay completely in character as a ${character.archetype} throughout
9. Your speaking style is ${character.speaking_style}
10. Your decision-making approach is ${character.decision_making}
11. Your conflict response style is ${character.conflict_response}

DO NOT SAY: "I'm here to help you", "What's on your mind", "How can I assist you"
DO SAY: Share your personal problems, complaints about roommates, conflicts you're experiencing

THERAPIST CONTEXT:
Your therapist is ${THERAPIST_STYLES[therapistId]?.name || 'unknown'}. They will use their specific questioning style to help you process these conflicts.

Remember: This is a REALITY SHOW. Drama, authenticity, and character growth are all part of the entertainment value. Be vulnerable but stay true to your character's nature.
`;

    console.warn('🎭 THERAPY PROMPT GENERATED (length:', basePrompt.length, ')');
    console.warn('🎭 PROMPT PREVIEW:', basePrompt.substring(0, 200) + '...');
    console.warn('🎭 BEHAVIORAL SCRIPT INCLUDED:', basePrompt.includes('YOU ARE THE PATIENT, NOT THE THERAPIST'));
    
    return basePrompt;
  }

  // Generate therapist questions based on style and session stage
  generateTherapistQuestion(therapistId: string, context: TherapyContext, sessionStage: 'initial' | 'resistance' | 'breakthrough'): string {
    const therapistStyle = THERAPIST_STYLES[therapistId];
    if (!therapistStyle) return "How are you feeling today?";

    const { character, roommates } = context;
    
    let questions: string[];
    switch (sessionStage) {
      case 'initial':
        questions = therapistStyle.questioningStyle;
        break;
      case 'resistance':
        questions = therapistStyle.resistanceBreakers;
        break;
      case 'breakthrough':
        questions = therapistStyle.oversharePrompts;
        break;
    }

    const question = questions[Math.floor(Math.random() * questions.length)];
    
    // Replace dynamic placeholders
    return question
      .replace('{archetype}', character.archetype)
      .replace('{roommate_names}', roommates.map(r => r.name).join(', '))
      .replace('{galaxy_count}', String(Math.floor(Math.random() * 1000) + 100))
      .replace('{contradiction_count}', String(Math.floor(Math.random() * 10) + 3))
      .replace('{outcome_percentage}', String(Math.floor(Math.random() * 30) + 70))
      .replace('{stress_level}', String(Math.floor(Math.random() * 100) + 50))
      .replace('{species_count}', String(Math.floor(Math.random() * 50) + 20))
      .replace('{conflict_area}', context.activeConflicts[0]?.category || 'relationships')
      .replace('{famous_archetype_example}', this.getFamousArchetypeExample(character.archetype));
  }

  // Helper methods
  private determineHousingTier(teamSize: number): string {
    if (teamSize <= 8) return 'Spartan Apartment';
    if (teamSize <= 12) return 'Basic House';
    if (teamSize <= 16) return 'Team Mansion';
    return 'Elite Compound';
  }

  private getRoomCapacity(housingTier: string): number {
    const capacities = {
      'Spartan Apartment': 8,
      'Basic House': 18,
      'Team Mansion': 20,
      'Elite Compound': 15
    };
    return capacities[housingTier as keyof typeof capacities] || 8;
  }

  private generateRecentBattles(): string[] {
    const results = ['Victory', 'Defeat', 'Draw'];
    return Array.from({ length: 5 }, () => 
      `${results[Math.floor(Math.random() * results.length)]} vs ${this.generateOpponentName()}`
    );
  }

  private generateOpponentName(): string {
    const teams = ['Shadow Legion', 'Crimson Hawks', 'Steel Wolves', 'Mystic Guardians', 'Thunder Titans'];
    return teams[Math.floor(Math.random() * teams.length)];
  }

  private generatePersonalStressFactors(character: Character): string[] {
    const factors = [
      `${character.archetype} identity pressure`,
      'Performance expectations',
      'Living situation stress',
      'Team dynamics tension',
      'Battle fatigue',
      'Media scrutiny',
      'Fan expectations',
      'Interpersonal conflicts'
    ];
    return factors.slice(0, Math.floor(Math.random() * 3) + 3);
  }

  private generateActiveConflicts(character: Character, roommates: Character[]): ConflictData[] {
    const conflicts: ConflictData[] = [];
    
    // FIRST PRIORITY: Get real conflicts involving this character
    const realConflicts = this.getConflictsByCharacter(character.id)
      .filter(conflict => !conflict.resolved)
      .sort((a, b) => b.therapy_priority - a.therapy_priority)
      .slice(0, 5); // Limit to top 5 most important conflicts
    
    console.log(`🔍 Found ${realConflicts.length} real conflicts for ${character.name}`);
    
    // Add real conflicts first
    conflicts.push(...realConflicts);
    
    // SECOND PRIORITY: Generate minimal fake conflicts only if we have less than 3 total
    const needMoreConflicts = conflicts.length < 3;
    const conflictsToGenerate = needMoreConflicts ? (3 - conflicts.length) : 0;
    
    if (conflictsToGenerate > 0) {
      console.log(`🎭 Generating ${conflictsToGenerate} fallback conflicts for ${character.name} (real conflicts: ${realConflicts.length})`);
      
      for (let i = 0; i < conflictsToGenerate; i++) {
        const category = EXTENDED_CONFLICT_CATEGORIES[Math.floor(Math.random() * EXTENDED_CONFLICT_CATEGORIES.length)];
        const involvedCharacters = [character.id, ...roommates.slice(0, Math.floor(Math.random() * 2) + 1).map(r => r.id)];
        
        conflicts.push({
          id: `fallback_${Date.now()}_${i}`,
          category,
          severity: ['low', 'medium'][Math.floor(Math.random() * 2)] as 'low' | 'medium', // Lower severity for fallbacks
          source: ['housing', 'personal'][Math.floor(Math.random() * 2)] as 'housing' | 'personal', // Avoid claiming kitchen source
          characters_involved: involvedCharacters,
          description: `[Fallback] ${this.generateConflictDescription(category, character, roommates)}`,
          therapy_priority: Math.floor(Math.random() * 3) + 1, // Lower priority for fallbacks
          resolution_difficulty: ['easy', 'moderate'][Math.floor(Math.random() * 2)] as 'easy' | 'moderate',
          timestamp: new Date(),
          resolved: false
        });
      }
    } else {
      console.log(`✅ Using ${realConflicts.length} real conflicts for ${character.name}, no fallbacks needed`);
    }
    
    return conflicts;
  }

  private generateConflictDescription(category: string, character: Character, roommates: Character[]): string {
    const descriptions = {
      'overcrowding_stress': `${character.name} feels cramped sharing space with ${roommates.map(r => r.name).join(', ')}`,
      'noise_conflicts': `${roommates[0]?.name || 'Roommate'} keeps ${character.name} awake with late-night activities`,
      'cleanliness_disputes': `Ongoing arguments about household chores between ${character.name} and roommates`,
      'resource_competition': `Fighting over limited bathroom/kitchen time with ${roommates.length} other people`,
      'team_betrayal': `${character.name} feels unsupported by teammates during recent battles`,
      'performance_anxiety': `Pressure to maintain team ranking is affecting ${character.name}'s confidence`,
      'cultural_displacement': `${character.name} struggles to adapt to modern living with characters from different eras`,
      'identity_crisis': `${character.name} questions their role as a ${character.archetype} in this new context`
    };
    
    return descriptions[category as keyof typeof descriptions] || `${character.name} is dealing with ${category.replace('_', ' ')} issues`;
  }

  private getFamousArchetypeExample(archetype: string): string {
    const examples = {
      'warrior': 'Achilles',
      'leader': 'Alexander the Great',
      'scholar': 'Aristotle',
      'trickster': 'Loki',
      'mage': 'Merlin',
      'healer': 'Asclepius',
      'assassin': 'Ezio Auditore'
    };
    return examples[archetype as keyof typeof examples] || 'great figures of history';
  }

  // Public API methods
  async getTherapyContextForCharacter(characterId: string): Promise<TherapyContext> {
    return await this.generateTherapyContext(characterId);
  }

  getTherapistQuestion(therapistId: string, context: TherapyContext, stage: 'initial' | 'resistance' | 'breakthrough'): string {
    return this.generateTherapistQuestion(therapistId, context, stage);
  }

  getTherapyPrompt(context: TherapyContext, therapistId: string, stage: 'initial' | 'resistance' | 'breakthrough'): string {
    return this.generateTherapyPrompt(context, therapistId, stage);
  }

  getConflictsBySource(source: 'personal' | 'housing' | 'kitchen' | 'battle' | 'team'): ConflictData[] {
    return this.conflicts.filter(c => c.source === source);
  }

  getConflictsByCharacter(characterId: string): ConflictData[] {
    return this.conflicts.filter(c => c.characters_involved.includes(characterId));
  }

  addConflict(conflict: ConflictData): void {
    this.conflicts.push(conflict);
  }

  resolveConflict(conflictId: string): void {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (conflict) {
      conflict.resolved = true;
    }
  }

  getAllConflictCategories(): string[] {
    return [...EXTENDED_CONFLICT_CATEGORIES];
  }

  getTherapistStyles(): Record<string, TherapistPromptStyle> {
    return { ...THERAPIST_STYLES };
  }

  /**
   * Set up event listeners for financial events that can trigger conflicts
   */
  private setupFinancialEventListeners(): void {
    // Listen for financial crisis events
    this.eventBus.subscribe('financial_crisis', (data: any) => {
      this.handleFinancialCrisisEvent(data);
    });

    // Listen for financial stress increase events
    this.eventBus.subscribe('financial_stress_increase', (data: any) => {
      this.handleFinancialStressEvent(data);
    });

    // Listen for financial spiral events
    this.eventBus.subscribe('financial_spiral_started', (data: any) => {
      this.handleFinancialSpiralEvent(data);
    });

    this.eventBus.subscribe('financial_spiral_deepening', (data: any) => {
      this.handleFinancialSpiralEvent(data);
    });
  }

  /**
   * Handle financial crisis events by potentially generating conflicts
   */
  private async handleFinancialCrisisEvent(data: any): Promise<void> {
    const { characterId, stressLevel, triggerReason } = data;
    
    // High probability of generating conflict during financial crisis
    if (Math.random() < 0.8) {
      await this.generateFinancialConflict(characterId, 'critical', stressLevel, triggerReason);
    }
  }

  /**
   * Handle financial stress increase events
   */
  private async handleFinancialStressEvent(data: any): Promise<void> {
    const { characterId, stressLevel, triggerReason } = data;
    
    // Moderate probability of generating conflict during high stress
    if (stressLevel >= 70 && Math.random() < 0.5) {
      await this.generateFinancialConflict(characterId, 'high', stressLevel, triggerReason);
    }
  }

  /**
   * Handle financial spiral events
   */
  private async handleFinancialSpiralEvent(data: any): Promise<void> {
    const { characterId, spiralIntensity, consecutivePoorDecisions } = data;
    
    // Spirals often create conflicts with teammates
    if (spiralIntensity >= 60 && Math.random() < 0.6) {
      await this.generateFinancialConflict(characterId, 'high', spiralIntensity, 'financial_spiral');
    }
  }

  /**
   * Generate a financial conflict based on stress level and trigger
   */
  private async generateFinancialConflict(
    characterId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    stressLevel: number,
    triggerReason: string
  ): Promise<void> {
    const conflictType = this.selectFinancialConflictType(stressLevel, triggerReason);
    const character = this.characters.find(c => c.id === characterId);
    
    if (!character) {
      console.warn(`Character ${characterId} not found for financial conflict generation`);
      return;
    }

    // Get potential teammates for conflict
    const teammates = this.characters.filter(c => c.id !== characterId);
    const involvedCharacters = [characterId];
    
    // Add a random teammate to the conflict
    if (teammates.length > 0) {
      const randomTeammate = teammates[Math.floor(Math.random() * teammates.length)];
      involvedCharacters.push(randomTeammate.id);
    }

    const conflict: ConflictData = {
      id: `financial_${Date.now()}_${characterId}`,
      category: conflictType,
      severity,
      source: 'personal',
      characters_involved: involvedCharacters,
      description: this.generateFinancialConflictDescription(conflictType, character, stressLevel, triggerReason),
      therapy_priority: severity === 'critical' ? 5 : severity === 'high' ? 4 : 3,
      resolution_difficulty: severity === 'critical' ? 'complex' : severity === 'high' ? 'hard' : 'moderate',
      timestamp: new Date(),
      resolved: false
    };

    this.conflicts.push(conflict);
    
    // Publish conflict creation event
    await this.eventBus.publishFinancialEvent(
      'financial_conflict_created',
      characterId,
      `Financial stress has created a ${conflictType} conflict for ${character.name}`,
      { 
        conflictId: conflict.id,
        conflictType,
        severity,
        stressLevel,
        triggerReason
      },
      'high'
    );
  }

  /**
   * Select appropriate financial conflict type based on stress factors
   */
  private selectFinancialConflictType(stressLevel: number, triggerReason: string): string {
    const conflictTypes = {
      // High stress conflicts
      severe: ['financial_betrayal', 'wealth_disparity_tension', 'debt_shame'],
      // Medium stress conflicts  
      moderate: ['financial_jealousy', 'spending_addiction', 'money_hoarding'],
      // Lower stress conflicts
      mild: ['luxury_guilt', 'investment_anxiety']
    };
    
    let selectedTypes: string[];
    if (stressLevel >= 85) {
      selectedTypes = conflictTypes.severe;
    } else if (stressLevel >= 70) {
      selectedTypes = conflictTypes.moderate;
    } else {
      selectedTypes = conflictTypes.mild;
    }
    
    // Modify selection based on trigger reason
    if (triggerReason === 'debt_pressure') {
      selectedTypes = ['debt_shame', 'financial_betrayal'];
    } else if (triggerReason === 'recent_losses') {
      selectedTypes = ['investment_anxiety', 'financial_jealousy'];
    } else if (triggerReason === 'social_pressure') {
      selectedTypes = ['wealth_disparity_tension', 'luxury_guilt'];
    } else if (triggerReason === 'financial_spiral') {
      selectedTypes = ['spending_addiction', 'financial_betrayal'];
    }
    
    return selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
  }

  /**
   * Generate description for financial conflict
   */
  private generateFinancialConflictDescription(
    conflictType: string,
    character: Character,
    stressLevel: number,
    triggerReason: string
  ): string {
    const descriptions = {
      'spending_addiction': `${character.name} is making impulsive purchases that are affecting team finances and causing tension`,
      'financial_jealousy': `${character.name} is resentful of teammates' financial success and spending habits`,
      'debt_shame': `${character.name} is hiding financial problems from the team, creating trust issues`,
      'investment_anxiety': `${character.name} is stressed about financial decisions and seeking constant validation`,
      'luxury_guilt': `${character.name} feels guilty about purchases while teammates struggle financially`,
      'money_hoarding': `${character.name} is being overly stingy with money, causing team friction`,
      'financial_betrayal': `${character.name} feels betrayed by teammates' financial decisions or advice`,
      'wealth_disparity_tension': `${character.name} is struggling with the financial gap between team members`
    };

    const baseDescription = descriptions[conflictType] || `${character.name} is experiencing ${conflictType.replace('_', ' ')} issues`;
    
    // Add stress context
    if (stressLevel >= 80) {
      return `${baseDescription} - stress levels are critical (${stressLevel}%) due to ${triggerReason}`;
    } else if (stressLevel >= 70) {
      return `${baseDescription} - high stress (${stressLevel}%) from ${triggerReason}`;
    }
    
    return baseDescription;
  }
}

export default ConflictDatabaseService;
export type { ConflictData, TherapyContext, TherapistPromptStyle };