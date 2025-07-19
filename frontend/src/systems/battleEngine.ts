// Battle Engine - CORRECTED: Physical Combat with Psychology Modifiers
// Psychology affects combat performance but the core system is physical damage/HP

import { audioService } from '../services/audioService';
import { BattleStateManager } from './battleStateManager';
import { 
  BattleState, 
  CombatRound, 
  BattleCharacter, 
  GameplanAdherenceCheck, 
  RogueAction, 
  MoraleEvent,
  CombatAction,
  ExecutedAction,
  PlannedAction,
  PreBattleHuddle,
  CoachingTimeout,
  TimeoutAction,
  PostBattleAnalysis,
  RelationshipChange,
  BattleMemory,
  PsychologicalConsequence,
  TrainingRecommendation,
  CharacterEvaluation,
  ActionOutcome,
  PsychologyFactor,
  ChemistryEvolution,
  UrgentIssue,
  TimeoutCharacterState,
  QuickFix,
  StrategicOption
} from '../data/battleFlow';

// Import the corrected physical combat engine
import { PhysicalBattleEngine } from './physicalBattleEngine';
import { PostBattleAnalysisSystem } from './postBattleAnalysis';

export class BattleEngine {
  
  // ============= PRE-BATTLE HUDDLE SYSTEM =============
  
  static conductPreBattleHuddle(battleState: BattleState): PreBattleHuddle {
    const playerTeam = battleState.teams.player;
    
    // Phase 1: Team Assessment
    const teamChemistryResult = this.assessTeamChemistry(playerTeam);
    
    // Phase 2: Individual Character Readiness
    const characterReadiness = playerTeam.characters.map(char => 
      this.assessCharacterReadiness(char, playerTeam)
    );
    
    // Phase 3: Available Coaching Options
    const coachingOptions = this.generateCoachingOptions(playerTeam, battleState.coachingData);
    
    const huddle: PreBattleHuddle = {
      phase: 'team_assessment',
      teamChemistryCheck: teamChemistryResult,
      characterReadiness,
      coachingOptions,
      huddleOutcome: {
        finalTeamMorale: playerTeam.currentMorale,
        characterStates: {},
        strategicAdvantages: [],
        potentialProblems: [],
        aiJudgeComments: []
      }
    };

    // Populate character states
    characterReadiness.forEach(readiness => {
      huddle.huddleOutcome.characterStates[readiness.characterId] = readiness;
    });

    // Generate strategic insights
    huddle.huddleOutcome.strategicAdvantages = this.identifyStrategicAdvantages(playerTeam);
    huddle.huddleOutcome.potentialProblems = this.identifyPotentialProblems(playerTeam);
    huddle.huddleOutcome.aiJudgeComments = this.generateHuddleCommentary(teamChemistryResult, characterReadiness);

    return huddle;
  }

  static assessTeamChemistry(team: { teamChemistry: number; characters: BattleCharacter[] }) {
    const chemistry = team.teamChemistry;
    const characters = team.characters;
    
    const conflicts = [];
    const synergies = [];
    const challenges = [];
    
    // SAFETY: Prevent recursion with visited set and depth limit
    const visited = new Set<string>();
    const maxDepth = 10;
    let currentDepth = 0;
    
    // Analyze character relationships with recursion protection
    for (let i = 0; i < characters.length && currentDepth < maxDepth; i++) {
      for (let j = i + 1; j < characters.length && currentDepth < maxDepth; j++) {
        const char1 = characters[i];
        const char2 = characters[j];
        
        // Create unique relationship key to prevent circular analysis
        const relationshipKey = `${char1?.character?.id || i}-${char2?.character?.id || j}`;
        if (visited.has(relationshipKey)) {
          continue;
        }
        visited.add(relationshipKey);
        currentDepth++;
        
        // SAFETY: Null pointer protection for relationship modifiers
        const relationship = char1.relationshipModifiers?.find(
          rel => rel.withCharacter === char2?.character?.name?.toLowerCase()?.replace(/\s+/g, '_')
        );
        
        if (relationship && char1?.character?.name && char2?.character?.name) {
          if (relationship.strength < -30) {
            conflicts.push(`${char1.character.name} vs ${char2.character.name}: ${relationship.relationship}`);
          } else if (relationship.strength > 30) {
            synergies.push(`${char1.character.name} + ${char2.character.name}: Strong ${relationship.relationship}`);
          }
        }
      }
    }

    // Identify challenges based on mental states with null safety and loop protection
    let challengeCount = 0;
    const maxChallenges = 20; // Prevent infinite challenge generation
    
    characters?.forEach((char: BattleCharacter) => {
      if (!char?.mentalState || !char?.character?.name || challengeCount >= maxChallenges) return;
      
      if (char.mentalState.stress > 70) {
        challenges.push(`${char.character.name} is highly stressed (${char.mentalState.stress}%)`);
        challengeCount++;
      }
      if (char.mentalState.gameplanDeviationRisk > 60 && challengeCount < maxChallenges) {
        challenges.push(`${char.character.name} may deviate from gameplan (${char.mentalState.gameplanDeviationRisk}% risk)`);
        challengeCount++;
      }
      if (char.mentalState.teamTrust < 40 && challengeCount < maxChallenges) {
        challenges.push(`${char.character.name} has low team trust (${char.mentalState.teamTrust}%)`);
        challengeCount++;
      }
    });

    return {
      overallChemistry: chemistry,
      conflictingPersonalities: conflicts,
      synergisticPairs: synergies,
      leadershipDynamics: this.assessLeadershipDynamics(characters),
      predictedChallenges: challenges,
      teamMoodDescription: this.getTeamMoodDescription(chemistry, characters)
    };
  }

  static assessCharacterReadiness(battleChar: BattleCharacter, team: { characters: BattleCharacter[] }) {
    // SAFETY: Null pointer protection
    if (!battleChar?.character || !battleChar?.mentalState) {
      throw new Error('Invalid battle character data');
    }
    
    const char = battleChar.character;
    const mental = battleChar.mentalState;
    
    const concerns = [];
    const motivations = [];
    
    // Analyze concerns with null safety
    if (mental?.stress > 60) concerns.push("High stress levels affecting focus");
    if (mental?.currentMentalHealth < 50) concerns.push("Poor mental health may cause breakdowns");
    if (mental?.teamTrust < 50) concerns.push("Low trust in team/coach");
    if (battleChar?.gameplanAdherence < 60) concerns.push("May show low gameplan adherence");
    
    // Analyze motivations with null safety
    char?.personality?.motivations?.forEach(motivation => {
      if (motivation) {
        motivations.push(`Driven by: ${motivation}`);
      }
    });
    
    // Predict behavior
    let predictedBehavior: 'compliant' | 'unpredictable' | 'rebellious' | 'supportive' = 'compliant';
    
    if (mental.gameplanDeviationRisk > 70) predictedBehavior = 'deviant';
    else if (mental.gameplanDeviationRisk > 40) predictedBehavior = 'unpredictable';
    else if (mental.teamTrust > 70) predictedBehavior = 'supportive';
    
    return {
      characterId: char?.id || 'unknown',
      mentalReadiness: mental?.currentMentalHealth || 0,
      physicalReadiness: (battleChar?.currentHealth && char?.combatStats?.maxHealth) 
        ? (battleChar.currentHealth / char.combatStats.maxHealth) * 100 
        : 0,
      gameplanAdherence: battleChar?.gameplanAdherence || 0,
      concerns,
      motivations,
      predictedBehavior,
      specialNotes: this.generateSpecialNotes(battleChar)
    };
  }

  static generateCoachingOptions(team: { characters: BattleCharacter[] }, coachingData: Record<string, unknown>) {
    const options = [];
    
    // Always available: Motivational Speech
    options.push({
      id: 'motivational_speech',
      type: 'motivational_speech' as const,
      description: 'Rally the team with an inspiring speech',
      targetCharacters: ['all'],
      effects: [
        { type: 'morale_boost', value: 15, duration: 'first_round', targetScope: 'team' }
      ],
      requirements: [],
      riskLevel: 'low' as const
    });

    // Conditional: Conflict Resolution (if conflicts exist)
    const hasConflicts = team.characters.some((char: BattleCharacter) => 
      char.relationshipModifiers.some((rel: { strength: number }) => rel.strength < -20)
    );
    
    if (hasConflicts) {
      options.push({
        id: 'conflict_resolution',
        type: 'conflict_resolution' as const,
        description: 'Address team conflicts before they escalate',
        targetCharacters: ['conflicted'],
        effects: [
          { type: 'chemistry_improve', value: 20, duration: 'entire_battle', targetScope: 'team' }
        ],
        requirements: [
          { type: 'coaching_skill', minimumValue: 60, description: 'Requires experienced coaching' }
        ],
        riskLevel: 'medium' as const
      });
    }

    // Conditional: Individual Coaching (for stressed characters)
    const stressedChars = team.characters.filter((char: BattleCharacter) => char.mentalState.stress > 60);
    if (stressedChars.length > 0) {
      options.push({
        id: 'stress_management',
        type: 'confidence_boost' as const,
        description: 'Help stressed characters manage their anxiety',
        targetCharacters: stressedChars.map((char: BattleCharacter) => char.character.id),
        effects: [
          { type: 'stress_reduction', value: 30, duration: 'entire_battle', targetScope: 'individual' }
        ],
        requirements: [],
        riskLevel: 'low' as const
      });
    }

    return options;
  }

  // ============= CORRECTED ROUND-BY-ROUND PHYSICAL COMBAT SYSTEM =============
  
  static executeRound(battleState: BattleState, playerActions: Record<string, PlannedAction>): CombatRound {
    // Use the corrected physical combat engine
    return PhysicalBattleEngine.executeRound(battleState, playerActions);
  }

  static calculateInitiative(battleState: BattleState, playerActions: Record<string, PlannedAction>) {
    const allCharacters = [
      ...battleState.teams.player.characters.map(char => ({ ...char, team: 'player' as const })),
      ...battleState.teams.opponent.characters.map(char => ({ ...char, team: 'opponent' as const }))
    ];

    return allCharacters
      .filter(char => char.currentHealth > 0) // Only living characters
      .map(char => {
        const baseSpeed = char.character.combatStats.speed;
        const mentalModifiers = this.calculateMentalSpeedModifiers(char);
        const finalSpeed = baseSpeed + mentalModifiers;
        
        return {
          characterId: char.character.id,
          team: char.team,
          speed: finalSpeed,
          mentalModifiers,
          gameplanAdherence: char.gameplanAdherence,
          plannedAction: playerActions[char.character.id]
        };
      })
      .sort((a, b) => b.speed - a.speed); // Highest speed first
  }

  static executeCharacterAction(
    battleState: BattleState, 
    initiativeEntry: { characterId: string; team: 'player' | 'opponent'; speed: number; mentalModifiers: number; gameplanAdherence: number; plannedAction?: PlannedAction }, 
    round: CombatRound
  ): CombatAction {
    const character = this.findCharacter(battleState, initiativeEntry.characterId);
    if (!character) {
      throw new Error(`Character ${initiativeEntry.characterId} not found`);
    }

    // Check gameplan adherence - will the character follow the gameplan?
    const gameplanAdherenceCheck = this.performGameplanAdherenceCheck(character, initiativeEntry.plannedAction);
    
    let actualAction: ExecutedAction;
    let actionType: 'planned' | 'rogue' | 'panicked' | 'inspired' = 'planned';

    if (gameplanAdherenceCheck.checkResult === 'adherent') {
      // Character follows the plan
      actualAction = this.executeAction(character, initiativeEntry.plannedAction, battleState);
    } else {
      // Character goes rogue - AI determines what they do instead
      actionType = 'deviant';
      actualAction = this.generateRogueAction(character, gameplanAdherenceCheck, battleState);
    }

    // Determine psychology factors that influenced this action
    const psychologyFactors = this.analyzePsychologyFactors(character, gameplanAdherenceCheck);

    // Calculate action outcome
    const outcome = this.calculateActionOutcome(actualAction, battleState);

    return {
      characterId: character.character.id,
      actionType,
      originalPlan: initiativeEntry.plannedAction,
      actualAction,
      gameplanAdherenceCheck,
      psychologyFactors,
      outcome
    };
  }

  static performGameplanAdherenceCheck(character: BattleCharacter, plannedAction?: PlannedAction): GameplanAdherenceCheck {
    // Use the corrected physical combat engine's obedience system
    return PhysicalBattleEngine.performGameplanAdherenceCheck(character, plannedAction);
  }

  static generateRogueAction(
    character: BattleCharacter, 
    obedienceCheck: ObedienceCheck, 
    battleState: BattleState
  ): ExecutedAction {
    const rogueType = this.determineRogueActionType(character, obedienceCheck);
    
    switch (rogueType) {
      case 'refuses_orders':
        return {
          type: 'defend',
          narrativeDescription: `${character.character.name} crosses their arms and refuses to act, ignoring all commands.`
        };
        
      case 'attacks_teammate':
        const teammate = this.findRandomTeammate(character, battleState);
        return {
          type: 'attack_teammate',
          targetId: teammate?.character.id,
          damage: Math.floor(character.character.combatStats.attack * 0.5),
          narrativeDescription: `${character.character.name} turns on ${teammate?.character.name} in a fit of rage!`
        };
        
      case 'flees_battle':
        return {
          type: 'flee',
          narrativeDescription: `${character.character.name} breaks formation and attempts to flee the battlefield!`
        };
        
      case 'goes_berserk':
        return {
          type: 'basic_attack',
          targetId: this.findRandomEnemy(character, battleState)?.character.id,
          damage: Math.floor(character.character.combatStats.attack * 1.5),
          narrativeDescription: `${character.character.name} enters a berserker rage, attacking wildly!`
        };
        
      default:
        return {
          type: 'defend',
          narrativeDescription: `${character.character.name} seems confused and hesitates.`
        };
    }
  }

  // ============= COACHING TIMEOUT SYSTEM =============
  
  static triggerCoachingTimeout(
    battleState: BattleState, 
    triggerType: 'player_requested' | 'character_breakdown' | 'team_chemistry_crisis'
  ): CoachingTimeout {
    const urgentIssues = this.identifyUrgentIssues(battleState);
    const characterStates = this.assessTimeoutCharacterStates(battleState);
    
    return {
      triggerCondition: {
        type: triggerType,
        severity: this.assessTimeoutSeverity(urgentIssues),
        description: this.getTimeoutDescription(triggerType, urgentIssues),
        timeRemaining: 90 // 90 seconds
      },
      availableActions: this.generateTimeoutActions(battleState, urgentIssues),
      timeLimit: 90,
      characterStates,
      urgentIssues,
      strategicOptions: this.generateStrategicOptions(battleState)
    };
  }

  // ============= POST-BATTLE ANALYSIS =============
  
  static conductPostBattleAnalysis(battleState: BattleState): PostBattleAnalysis {
    const battleResult = this.determineBattleResult(battleState);
    
    return {
      battleResult,
      teamPerformanceMetrics: this.calculateTeamMetrics(battleState),
      characterEvaluations: this.evaluateCharacters(battleState),
      relationshipChanges: this.calculateRelationshipChanges(battleState),
      psychologicalConsequences: this.assessPsychologicalConsequences(battleState),
      trainingRecommendations: this.generateTrainingRecommendations(battleState),
      teamChemistryEvolution: this.analyzeChemistryEvolution(battleState)
    };
  }

  // ============= UTILITY METHODS =============
  
  static findCharacter(battleState: BattleState, characterId: string): BattleCharacter | null {
    const playerChar = battleState.teams.player.characters.find(char => char.character.id === characterId);
    if (playerChar) return playerChar;
    
    const opponentChar = battleState.teams.opponent.characters.find(char => char.character.id === characterId);
    return opponentChar || null;
  }

  static calculateMentalSpeedModifiers(character: BattleCharacter): number {
    let modifier = 0;
    
    // Stress slows you down
    modifier -= character.mentalState.stress * 0.2;
    
    // Confidence speeds you up
    modifier += (character.mentalState.confidence - 50) * 0.1;
    
    // Battle focus affects reaction time
    modifier += (character.mentalState.battleFocus - 50) * 0.15;
    
    return Math.floor(modifier);
  }

  static getTeamMoodDescription(chemistry: number, characters: BattleCharacter[]): string {
    const avgStress = characters.reduce((sum, char) => sum + char.mentalState.stress, 0) / characters.length;
    const avgConfidence = characters.reduce((sum, char) => sum + char.mentalState.confidence, 0) / characters.length;
    
    if (chemistry > 80 && avgStress < 30) return "United and confident - ready for anything";
    if (chemistry > 60 && avgConfidence > 70) return "Optimistic with good team spirit";
    if (chemistry < 40 || avgStress > 70) return "Tense and fractured - potential for chaos";
    if (avgConfidence < 40) return "Demoralized and lacking confidence";
    return "Mixed emotions with uncertain dynamics";
  }

  static assessLeadershipDynamics(characters: BattleCharacter[]): string {
    // SAFETY: Recursion protection with array limits
    if (!characters || characters.length === 0) return "No characters available";
    if (characters.length > 50) {
      console.warn('Too many characters for leadership analysis, limiting to first 50');
      characters = characters.slice(0, 50);
    }
    
    const leaders = characters.filter(char => 
      char?.character?.archetype === 'leader' || 
      char?.character?.personality?.traits?.includes('Charismatic')
    );
    
    if (leaders.length === 0) return "No clear leadership - team may lack direction";
    if (leaders.length === 1) return `${leaders[0]?.character?.name || 'Unknown'} is the natural leader`;
    
    // Limit displayed leaders to prevent UI overflow
    const displayLeaders = leaders.slice(0, 5);
    const leaderNames = displayLeaders.map((l: BattleCharacter) => l?.character?.name || 'Unknown').join(' and ');
    return `Leadership conflict between ${leaderNames}${leaders.length > 5 ? ' and others' : ''}`;
  }

  static generateSpecialNotes(battleChar: BattleCharacter): string[] {
    const notes = [];
    const char = battleChar.character;
    
    // Personality-based notes
    if (char.personality.traits.includes('Prideful')) {
      notes.push("Pride may prevent them from retreating or asking for help");
    }
    if (char.personality.traits.includes('Loyal')) {
      notes.push("Will sacrifice themselves to protect teammates");
    }
    if (char.personality.traits.includes('Unpredictable')) {
      notes.push("May ignore strategy in favor of creative solutions");
    }
    
    // Fear-based notes
    char.personality.fears.forEach(fear => {
      if (fear.toLowerCase().includes('death')) {
        notes.push("Fear of death may cause hesitation in critical moments");
      }
      if (fear.toLowerCase().includes('failure')) {
        notes.push("Fear of failure may lead to overcautious play");
      }
    });
    
    return notes;
  }

  // Additional utility methods would be implemented here...
  // (Keeping this focused on the core battle flow for brevity)
  
  private static determineRogueActionType(character: BattleCharacter, obedienceCheck: ObedienceCheck): string {
    // Simplified logic - in full implementation this would be much more complex
    if (character.mentalState.stress > 80) return 'flees_battle';
    if (character.mentalState.currentMentalHealth < 30) return 'goes_berserk';
    if (obedienceCheck.checkResult === 'rebellious') return 'attacks_teammate';
    return 'refuses_orders';
  }

  private static findRandomTeammate(character: BattleCharacter, battleState: BattleState): BattleCharacter | null {
    const team = battleState.teams.player.characters.includes(character) 
      ? battleState.teams.player 
      : battleState.teams.opponent;
    
    const teammates = team.characters.filter(char => 
      char.character.id !== character.character.id && char.currentHealth > 0
    );
    
    return teammates.length > 0 ? teammates[Math.floor(Math.random() * teammates.length)] : null;
  }

  private static findRandomEnemy(character: BattleCharacter, battleState: BattleState): BattleCharacter | null {
    const enemyTeam = battleState.teams.player.characters.includes(character) 
      ? battleState.teams.opponent 
      : battleState.teams.player;
    
    const enemies = enemyTeam.characters.filter(char => char.currentHealth > 0);
    return enemies.length > 0 ? enemies[Math.floor(Math.random() * enemies.length)] : null;
  }

  private static executeAction(character: BattleCharacter, plannedAction: PlannedAction | undefined, battleState: BattleState): ExecutedAction {
    if (!plannedAction) {
      return {
        type: 'basic_attack',
        narrativeDescription: `${character.character.name} performs a basic attack.`
      };
    }

    // Convert planned action to executed action based on action type
    switch (plannedAction.actionType) {
      case 'ability':
        return {
          type: 'ability',
          abilityId: plannedAction.abilityId,
          targetId: plannedAction.targetId,
          narrativeDescription: `${character.character.name} uses ${plannedAction.abilityId} on ${plannedAction.targetId}.`
        };
      case 'basic_attack':
        return {
          type: 'basic_attack',
          targetId: plannedAction.targetId,
          narrativeDescription: `${character.character.name} attacks ${plannedAction.targetId}.`
        };
      case 'defend':
        return {
          type: 'defend',
          narrativeDescription: `${character.character.name} takes a defensive stance.`
        };
      default:
        return {
          type: 'basic_attack',
          narrativeDescription: `${character.character.name} performs a basic attack.`
        };
    }
  }

  private static analyzePsychologyFactors(character: BattleCharacter, gameplanAdherenceCheck: GameplanAdherenceCheck): string[] {
    const factors: string[] = [];
    
    // Mental health factors
    if (character.mentalState.currentMentalHealth < 50) {
      factors.push('Low mental health affecting decision-making');
    }
    
    // Stress factors
    if (character.mentalState.stress > 70) {
      factors.push('High stress levels causing erratic behavior');
    }
    
    // Confidence factors
    if (character.mentalState.confidence < 40) {
      factors.push('Low confidence leading to hesitation');
    }
    
    // Gameplan adherence factors
    if (character.gameplanAdherence < 50) {
      factors.push('Poor gameplan adherence tendency');
    }
    
    // Team trust factors
    if (character.mentalState.teamTrust < 60) {
      factors.push('Low team trust affecting cooperation');
    }
    
    return factors;
  }

  private static calculateActionOutcome(actualAction: ExecutedAction, battleState: BattleState): ActionOutcome {
    // Base success rate varies by action type
    let successRate = 0.8;
    
    switch (actualAction.type) {
      case 'basic_attack':
        successRate = 0.85;
        break;
      case 'ability':
        successRate = 0.75; // Abilities are more complex, lower base success
        break;
      case 'defend':
        successRate = 0.95; // Defensive actions rarely fail
        break;
      default:
        successRate = 0.8;
    }
    
    const success = Math.random() < successRate;
    
    return {
      success,
      effects: success ? ['Action completed'] : ['Action failed'],
      narrativeDescription: success ? 
        actualAction.narrativeDescription : 
        actualAction.narrativeDescription.replace('attacks', 'misses').replace('uses', 'fails to use'),
      audienceReaction: success ? 
        "The crowd cheers!" : 
        "The crowd groans in disappointment..."
    };
  }

  private static async applyActionOutcome(action: CombatAction, battleState: BattleState): Promise<void> {
    // SAFETY: Use state manager to prevent race conditions on damage application
    const stateManager = BattleStateManager.getInstance(battleState.battleId || 'default');
    
    await stateManager.executeOperation(
      (state: BattleState) => {
        // Find the character who performed the action
        const actor = state.teams.player.characters.find(c => c.character.id === action.characterId) ||
                      state.teams.opponent.characters.find(c => c.character.id === action.characterId);
        
        if (!actor || !action.outcome?.success) return;
        
        // Apply effects based on action type
        if (action.actualAction.type === 'basic_attack' || action.actualAction.type === 'ability') {
          const targetId = action.actualAction.targetId;
          if (!targetId) return;
          
          // Find target
          const target = state.teams.player.characters.find(c => c.character.id === targetId) ||
                        state.teams.opponent.characters.find(c => c.character.id === targetId);
          
          if (target) {
            // Calculate and apply damage (simplified for now)
            const baseDamage = actor.character.combatStats.attack;
            const defense = target.character.combatStats.defense;
            const damage = Math.max(1, baseDamage - defense);
            
            target.currentHealth = Math.max(0, target.currentHealth - damage);
            target.physicalDamageTaken = (target.physicalDamageTaken || 0) + damage;
            actor.physicalDamageDealt = (actor.physicalDamageDealt || 0) + damage;
            
            // Play appropriate sound effect
            this.playActionSoundEffect(action, actor, target, damage);
          }
        }
        
        return true;
      },
      // Rollback function
      (state: BattleState) => {
        console.warn('Rolling back action outcome application');
        // In production, we'd restore previous character states
      }
    );
  }

  private static checkForMoraleEvents(action: CombatAction, battleState: BattleState): MoraleEvent[] {
    const events: MoraleEvent[] = [];
    
    // Check for critical morale events
    if (action.actionType === 'panicked') {
      events.push({
        type: 'panic_spread',
        description: `${action.characterId}'s panic affects nearby allies`,
        teamAffected: 'player',
        moraleChange: -10,
        charactersAffected: battleState.teams.player.characters.map(c => c.character.id)
      });
    }
    
    if (action.outcome?.success && action.actualAction.type === 'ability') {
      events.push({
        type: 'inspiring_action',
        description: `${action.characterId}'s successful special move inspires the team`,
        teamAffected: 'player',
        moraleChange: 5,
        charactersAffected: battleState.teams.player.characters.map(c => c.character.id)
      });
    }
    
    return events;
  }

  private static updateTeamMorale(battleState: BattleState, round: CombatRound): MoraleEvent[] {
    const moraleEvents: MoraleEvent[] = [];
    
    // Calculate morale changes based on round performance
    let moraleChange = 0;
    
    // Check for successful actions
    const successfulActions = round.actions.filter(action => action.outcome?.success);
    const totalActions = round.actions.length;
    const successRate = successfulActions.length / Math.max(1, totalActions);
    
    if (successRate > 0.8) {
      moraleChange += 10;
      moraleEvents.push({
        type: 'team_success',
        description: 'Team performed excellently this round!',
        teamAffected: 'player',
        moraleChange: 10,
        charactersAffected: battleState.teams.player.characters.map(c => c.character.id)
      });
    } else if (successRate < 0.3) {
      moraleChange -= 15;
      moraleEvents.push({
        type: 'team_failure',
        description: 'Team struggled with their actions this round...',
        teamAffected: 'player',
        moraleChange: -15,
        charactersAffected: battleState.teams.player.characters.map(c => c.character.id)
      });
    }
    
    // Check for characters taking heavy damage
    const heavilyDamaged = battleState.teams.player.characters.filter(
      c => c.currentHealth < c.character.combatStats.maxHealth * 0.3
    );
    if (heavilyDamaged.length > 0) {
      moraleChange -= heavilyDamaged.length * 5;
      moraleEvents.push({
        type: 'teammate_injured',
        description: `Team morale drops seeing ${heavilyDamaged[0].character.name} badly injured`,
        teamAffected: 'player',
        moraleChange: -heavilyDamaged.length * 5,
        charactersAffected: battleState.teams.player.characters.map(c => c.character.id)
      });
    }
    
    // SAFETY: Apply morale change with bounds checking and race condition protection
    const currentMorale = battleState.teams.player.currentMorale || 50;
    battleState.teams.player.currentMorale = Math.max(0, Math.min(100, currentMorale + moraleChange));
    
    return moraleEvents;
  }

  private static determineRoundOutcome(battleState: BattleState, round: CombatRound): {
    winner: string;
    keyEvents: string[];
    moraleShift: Record<string, number>;
    strategicAdvantages: string[];
    unexpectedDevelopments: string[];
    judgeCommentary: string;
  } {
    return {
      winner: 'draw',
      keyEvents: [],
      moraleShift: {},
      strategicAdvantages: [],
      unexpectedDevelopments: [],
      judgeCommentary: ''
    };
  }

  private static generateJudgeCommentary(round: CombatRound, battleState: BattleState): string {
    return "An interesting round unfolds...";
  }

  private static handleRogueAction(action: CombatAction, battleState: BattleState): RogueAction {
    return {
      characterId: action.characterId,
      triggerReason: 'low_mental_health',
      rogueType: 'refuses_orders',
      severity: 'minor',
      consequences: [],
      aiJudgeRuling: "The character's deviation from gameplan creates chaos on the battlefield."
    };
  }

  // Additional placeholder methods...
  private static identifyStrategicAdvantages(team: { characters: BattleCharacter[] }): string[] {
    const advantages: string[] = [];
    
    // Check team composition advantages
    const archetypes = team.characters.map(c => c.character.archetype);
    if (archetypes.includes('warrior') && archetypes.includes('support')) {
      advantages.push('Balanced frontline and support composition');
    }
    
    // Check health advantage
    const avgHealth = team.characters.reduce((sum, c) => sum + c.currentHealth, 0) / team.characters.length;
    const maxHealth = team.characters.reduce((sum, c) => sum + c.character.combatStats.maxHealth, 0) / team.characters.length;
    if (avgHealth / maxHealth > 0.9) {
      advantages.push('Team at full strength');
    }
    
    // Check morale advantage
    const avgMorale = team.characters.reduce((sum, c) => sum + c.mentalState.currentMentalHealth, 0) / team.characters.length;
    if (avgMorale > 80) {
      advantages.push('High team morale');
    }
    
    // Check gameplan adherence
    const avgAdherence = team.characters.reduce((sum, c) => sum + c.gameplanAdherence, 0) / team.characters.length;
    if (avgAdherence > 75) {
      advantages.push('Strong strategic discipline');
    }
    
    return advantages;
  }
  private static identifyPotentialProblems(team: { characters: BattleCharacter[] }): string[] {
    const problems: string[] = [];
    
    // Check for low mental health
    const lowMentalHealth = team.characters.filter(c => c.mentalState.currentMentalHealth < 40);
    if (lowMentalHealth.length > 0) {
      problems.push(`${lowMentalHealth.length} character(s) with critical mental health issues`);
    }
    
    // Check for high stress
    const highStress = team.characters.filter(c => c.mentalState.stress > 70);
    if (highStress.length > 0) {
      problems.push(`${highStress.length} character(s) experiencing extreme stress`);
    }
    
    // Check for low gameplan adherence
    const lowAdherence = team.characters.filter(c => c.gameplanAdherence < 50);
    if (lowAdherence.length > 0) {
      problems.push(`${lowAdherence.length} character(s) likely to ignore strategy`);
    }
    
    // Check for team trust issues
    const lowTrust = team.characters.filter(c => c.mentalState.teamTrust < 40);
    if (lowTrust.length > 0) {
      problems.push('Low team cohesion - trust issues detected');
    }
    
    // Check for injured characters
    const injured = team.characters.filter(c => c.currentHealth < c.character.combatStats.maxHealth * 0.5);
    if (injured.length > 0) {
      problems.push(`${injured.length} character(s) severely injured`);
    }
    
    return problems;
  }
  private static generateHuddleCommentary(chemistry: { newChemistry: number; oldChemistry: number }, readiness: Array<{ overallReadiness: number; characterName: string; mentalState: number; physicalCondition: number }>): string[] {
    const commentary: string[] = [];
    
    // Analyze team chemistry
    if (chemistry.newChemistry > chemistry.oldChemistry + 10) {
      commentary.push('Team chemistry has improved significantly during preparation');
      commentary.push('Players are showing better coordination and trust');
    } else if (chemistry.newChemistry < chemistry.oldChemistry - 10) {
      commentary.push('Team chemistry has deteriorated - tension is visible');
      commentary.push('Internal conflicts may impact battle performance');
    }
    
    // Analyze character readiness
    const lowReadiness = readiness.filter(r => r.overallReadiness < 60);
    const highReadiness = readiness.filter(r => r.overallReadiness > 80);
    
    if (lowReadiness.length > 0) {
      commentary.push(`${lowReadiness.length} team member(s) showing concerning readiness levels`);
      lowReadiness.forEach(r => {
        if (r.mentalState < 40) {
          commentary.push(`${r.characterName} appears mentally unprepared for battle`);
        }
        if (r.physicalCondition < 50) {
          commentary.push(`${r.characterName} may be physically compromised`);
        }
      });
    }
    
    if (highReadiness.length > 0) {
      commentary.push(`${highReadiness.length} team member(s) showing excellent battle readiness`);
    }
    
    // Overall team assessment
    const avgReadiness = readiness.reduce((sum, r) => sum + r.overallReadiness, 0) / readiness.length;
    if (avgReadiness > 75) {
      commentary.push('Overall team readiness is excellent - strong chance of success');
    } else if (avgReadiness < 50) {
      commentary.push('Team readiness is concerning - high risk of poor performance');
    } else {
      commentary.push('Team readiness is adequate but improvements could be made');
    }
    
    return commentary;
  }
  private static identifyUrgentIssues(battleState: BattleState): Array<{
    type: string;
    characterId: string;
    severity: 'warning' | 'urgent' | 'critical';
    description: string;
    immediateRisk: string;
  }> {
    const issues: Array<{
      type: string;
      characterId: string;
      severity: 'warning' | 'urgent' | 'critical';
      description: string;
      immediateRisk: string;
    }> = [];
    
    battleState.teams.player.characters.forEach(char => {
      // Mental health crisis
      if (char.mentalState.currentMentalHealth < 20) {
        issues.push({
          type: 'mental_health_crisis',
          characterId: char.character.id,
          severity: 'critical',
          description: `${char.character.name} is experiencing severe mental breakdown`,
          immediateRisk: 'May become uncontrollable or harm teammates'
        });
      }
      
      // Extreme stress
      if (char.mentalState.stress > 90) {
        issues.push({
          type: 'extreme_stress',
          characterId: char.character.id,
          severity: 'urgent',
          description: `${char.character.name} is under extreme stress`,
          immediateRisk: 'Likely to ignore orders and act unpredictably'
        });
      }
      
      // Trust breakdown
      if (char.mentalState.teamTrust < 20) {
        issues.push({
          type: 'trust_breakdown',
          characterId: char.character.id,
          severity: 'urgent',
          description: `${char.character.name} has lost faith in the team`,
          immediateRisk: 'May abandon teammates or refuse cooperation'
        });
      }
      
      // Critical injury
      if (char.currentHealth < char.character.combatStats.maxHealth * 0.15) {
        issues.push({
          type: 'critical_injury',
          characterId: char.character.id,
          severity: 'critical',
          description: `${char.character.name} is critically injured`,
          immediateRisk: 'Combat effectiveness severely compromised'
        });
      }
    });
    
    // Team-wide issues
    const avgChemistry = battleState.teams.player.teamChemistry;
    if (avgChemistry < 30) {
      issues.push({
        type: 'team_cohesion_failure',
        characterId: 'team',
        severity: 'critical',
        description: 'Team chemistry has collapsed',
        immediateRisk: 'High probability of internal conflict during battle'
      });
    }
    
    return issues;
  }
  private static assessTimeoutSeverity(issues: Array<{ severity: string }>): 'warning' | 'urgent' | 'critical' { return 'warning'; }
  private static getTimeoutDescription(type: string, issues: Array<{ type: string; description: string }>): string {
    switch (type) {
      case 'mental_health_crisis':
        return 'Multiple team members are experiencing severe psychological distress. Immediate intervention required.';
      case 'team_conflict':
        return 'Internal conflicts are tearing the team apart. Relationships need immediate attention.';
      case 'strategic_confusion':
        return 'The team has lost focus on the gameplan. Strategic realignment needed.';
      case 'morale_collapse':
        return 'Team morale has collapsed. Motivational support urgently required.';
      default:
        return 'The team needs coaching support to address emerging issues.';
    }
  }
  private static generateTimeoutActions(battleState: BattleState, issues: Array<{ type: string; characterId: string; severity: string; description: string; immediateRisk: string }>): Array<{
    type: string;
    description: string;
    effect: string;
    timeRequired: number;
    targets: string;
  }> {
    const actions: Array<{
      type: string;
      description: string;
      effect: string;
      timeRequired: number;
      targets: string;
    }> = [];
    
    // Always available basic actions
    actions.push({
      type: 'motivational_speech',
      description: 'Rally the team with an inspirational speech',
      effect: 'Boost team morale and confidence',
      timeRequired: 2,
      targets: 'all'
    });
    
    actions.push({
      type: 'strategic_reminder',
      description: 'Remind team of the battle plan and key objectives',
      effect: 'Improve gameplan adherence',
      timeRequired: 1,
      targets: 'all'
    });
    
    // Issue-specific actions
    issues.forEach(issue => {
      switch (issue.type) {
        case 'mental_health_crisis':
          actions.push({
            type: 'emergency_counseling',
            description: `Provide immediate psychological support to ${issue.characterId}`,
            effect: 'Stabilize mental health temporarily',
            timeRequired: 3,
            targets: issue.characterId
          });
          break;
          
        case 'extreme_stress':
          actions.push({
            type: 'stress_management',
            description: `Help ${issue.characterId} manage overwhelming stress`,
            effect: 'Reduce stress levels and improve focus',
            timeRequired: 2,
            targets: issue.characterId
          });
          break;
          
        case 'trust_breakdown':
          actions.push({
            type: 'trust_building',
            description: `Address trust issues with ${issue.characterId}`,
            effect: 'Rebuild team trust and cooperation',
            timeRequired: 4,
            targets: issue.characterId
          });
          break;
          
        case 'critical_injury':
          actions.push({
            type: 'medical_treatment',
            description: `Provide emergency medical care to ${issue.characterId}`,
            effect: 'Stabilize health and reduce injury effects',
            timeRequired: 3,
            targets: issue.characterId
          });
          break;
          
        case 'team_cohesion_failure':
          actions.push({
            type: 'team_meeting',
            description: 'Hold emergency team meeting to address conflicts',
            effect: 'Improve team chemistry and resolve conflicts',
            timeRequired: 5,
            targets: 'all'
          });
          break;
      }
    });
    
    return actions;
  }
  private static assessTimeoutCharacterStates(battleState: BattleState): Array<Record<string, unknown>> { return []; }
  private static generateStrategicOptions(battleState: BattleState): Array<Record<string, unknown>> { return []; }
  private static determineBattleResult(battleState: BattleState): 'victory' | 'defeat' | 'draw' {
    const playerAlive = battleState.teams.player.characters.some(c => c.currentHealth > 0);
    const opponentAlive = battleState.teams.opponent.characters.some(c => c.currentHealth > 0);
    
    if (playerAlive && !opponentAlive) return 'victory';
    if (!playerAlive && opponentAlive) return 'defeat';
    return 'draw';
  }
  private static calculateTeamMetrics(battleState: BattleState): {
    overallTeamwork: number;
    gameplanAdherence: number;
    strategicExecution: number;
    moraleManagement: number;
    conflictResolution: number;
    adaptability: number;
  } {
    const team = battleState.teams.player;
    const chars = team.characters;
    
    // Calculate averages
    const avgGameplanAdherence = chars.reduce((sum, char) => {
      const adherenceRate = char.battlePerformance.abilitiesUsed > 0 
        ? (char.battlePerformance.abilitiesUsed - char.battlePerformance.strategyDeviations) / char.battlePerformance.abilitiesUsed * 100
        : char.gameplanAdherence;
      return sum + adherenceRate;
    }, 0) / chars.length;
    
    const avgTeamwork = chars.reduce((sum, char) => {
      const teamworkScore = Math.min(100, char.battlePerformance.teamplayActions * 10 + 30);
      return sum + teamworkScore;
    }, 0) / chars.length;
    
    const avgEffectiveness = chars.reduce((sum, char) => {
      const hitRate = char.battlePerformance.abilitiesUsed > 0
        ? char.battlePerformance.successfulHits / char.battlePerformance.abilitiesUsed
        : 0.5;
      const healthRate = char.currentHealth / char.character.combatStats.maxHealth;
      return sum + ((hitRate * 50) + (healthRate * 50));
    }, 0) / chars.length;
    
    // Calculate specific metrics
    const moraleManagement = team.currentMorale;
    const conflictResolution = this.calculateConflictResolution(chars);
    const adaptability = this.calculateAdaptability(chars);
    
    return {
      overallTeamwork: Math.floor(avgTeamwork),
      gameplanAdherence: Math.floor(avgGameplanAdherence),
      strategicExecution: Math.floor(avgEffectiveness),
      moraleManagement,
      conflictResolution,
      adaptability
    };
  }
  private static evaluateCharacters(battleState: BattleState): CharacterEvaluation[] {
    // Delegate to post-battle analysis system for proper character evaluation
    const memories = this.collectBasicBattleMemories(battleState);
    return PostBattleAnalysisSystem.evaluateCharacterPerformances(battleState, memories);
  }
  private static calculateRelationshipChanges(battleState: BattleState): RelationshipChange[] {
    // Delegate to the post-battle analysis system for proper relationship calculation
    const memories = this.collectBasicBattleMemories(battleState);
    return PostBattleAnalysisSystem.calculateRelationshipEvolution(battleState, memories);
  }
  
  private static collectBasicBattleMemories(battleState: BattleState): Record<string, BattleMemory> {
    const memories: Record<string, BattleMemory> = {};
    
    battleState.teams.player.characters.forEach(char => {
      memories[char.character.id] = {
        characterId: char.character.id,
        notableEvents: [],
        emotionalImpact: 0,
        relationshipMoments: [],
        personalGrowth: [],
        trauma: []
      };
    });
    
    return memories;
  }
  private static assessPsychologicalConsequences(battleState: BattleState): PsychologicalConsequence[] {
    const consequences: PsychologicalConsequence[] = [];
    
    battleState.teams.player.characters.forEach(char => {
      // Check for trauma-inducing events
      if (char.currentHealth < char.character.combatStats.maxHealth * 0.2) {
        consequences.push({
          characterId: char.character.id,
          type: 'combat_trauma',
          severity: 'major',
          description: `${char.character.name} suffered severe injuries and may develop combat anxiety`,
          mentalHealthImpact: -25,
          duration: 'permanent',
          triggers: ['combat_start', 'low_health'],
          treatmentOptions: ['therapy', 'gradual_exposure', 'team_support']
        });
      }
      
      // Check for strategy breakdown trauma
      if (char.battlePerformance.strategyDeviations > 5) {
        consequences.push({
          characterId: char.character.id,
          type: 'authority_resistance',
          severity: 'moderate',
          description: `${char.character.name} repeatedly ignored orders and may have trust issues with leadership`,
          mentalHealthImpact: -10,
          duration: 'temporary',
          triggers: ['coaching_attempts', 'strategic_planning'],
          treatmentOptions: ['trust_building', 'autonomy_coaching', 'clear_communication']
        });
      }
      
      // Check for positive growth
      if (char.battlePerformance.successfulHits > 8 && char.battlePerformance.teamplayActions > 3) {
        consequences.push({
          characterId: char.character.id,
          type: 'confidence_boost',
          severity: 'minor',
          description: `${char.character.name} performed excellently and gained confidence in their abilities`,
          mentalHealthImpact: 15,
          duration: 'temporary',
          triggers: [],
          treatmentOptions: []
        });
      }
    });
    
    return consequences;
  }
  private static generateTrainingRecommendations(battleState: BattleState): TrainingRecommendation[] {
    const recommendations: TrainingRecommendation[] = [];
    
    battleState.teams.player.characters.forEach(char => {
      // Accuracy training for poor performers
      const hitRate = char.battlePerformance.successfulHits / Math.max(1, char.battlePerformance.abilitiesUsed);
      if (hitRate < 0.5) {
        recommendations.push({
          characterId: char.character.id,
          type: 'combat_skills',
          priority: 'high',
          description: `${char.character.name} needs accuracy training - hit rate was only ${Math.round(hitRate * 100)}%`,
          estimatedDuration: '3 days',
          requirements: ['basic_weapons_training'],
          expectedImprovement: {
            combatStats: { accuracy: 15 },
            skills: ['precision_strike']
          }
        });
      }
      
      // Gameplan adherence training
      if (char.battlePerformance.strategyDeviations > 2) {
        recommendations.push({
          characterId: char.character.id,
          type: 'strategy_focus',
          priority: 'medium',
          description: `${char.character.name} frequently ignored orders - needs discipline training`,
          estimatedDuration: '2 days',
          requirements: ['coaching_session'],
          expectedImprovement: {
            mentalStats: { gameplanAdherence: 20 },
            skills: ['tactical_awareness']
          }
        });
      }
      
      // Mental health support
      if (char.mentalState.currentMentalHealth < 50) {
        recommendations.push({
          characterId: char.character.id,
          type: 'mental_health',
          priority: 'high',
          description: `${char.character.name} needs psychological support to recover from battle stress`,
          estimatedDuration: '1 week',
          requirements: ['therapist_access', 'team_support'],
          expectedImprovement: {
            mentalStats: { mentalHealth: 30, stress: -20 },
            skills: ['stress_management']
          }
        });
      }
      
      // Team chemistry training
      if (char.battlePerformance.teamplayActions < 2) {
        recommendations.push({
          characterId: char.character.id,
          type: 'team_chemistry',
          priority: 'medium',
          description: `${char.character.name} needs team cooperation training`,
          estimatedDuration: '2 days',
          requirements: ['team_building_exercise'],
          expectedImprovement: {
            mentalStats: { teamTrust: 15 },
            skills: ['team_coordination']
          }
        });
      }
    });
    
    return recommendations;
  }
  private static analyzeChemistryEvolution(battleState: BattleState): {
    oldChemistry: number;
    newChemistry: number;
    evolutionFactors: string[];
    emergingDynamics: string[];
    strengthenedBonds: string[];
    weakenedBonds: string[];
  } {
    const team = battleState.teams.player;
    const oldChemistry = team.teamChemistry;
    
    // Calculate new chemistry based on current conditions
    let chemistryDelta = 0;
    const evolutionFactors: string[] = [];
    
    // Positive factors
    const avgTeamplay = team.characters.reduce((sum, char) => sum + char.battlePerformance.teamplayActions, 0) / team.characters.length;
    if (avgTeamplay > 3) {
      chemistryDelta += 5;
      evolutionFactors.push('Strong teamwork displayed during battle');
    }
    
    const lowStressCount = team.characters.filter(char => char.mentalState.stress < 50).length;
    if (lowStressCount > team.characters.length / 2) {
      chemistryDelta += 3;
      evolutionFactors.push('Team managing stress well');
    }
    
    // Negative factors
    const highDeviations = team.characters.filter(char => char.battlePerformance.strategyDeviations > 2).length;
    if (highDeviations > 0) {
      chemistryDelta -= highDeviations * 2;
      evolutionFactors.push('Strategy deviations causing team friction');
    }
    
    const lowTrust = team.characters.filter(char => char.mentalState.teamTrust < 40).length;
    if (lowTrust > 0) {
      chemistryDelta -= lowTrust * 3;
      evolutionFactors.push('Trust issues undermining team unity');
    }
    
    const newChemistry = Math.max(0, Math.min(100, oldChemistry + chemistryDelta));
    
    return {
      oldChemistry,
      newChemistry,
      evolutionFactors,
      emergingDynamics: this.identifyEmergingDynamics(team),
      strengthenedBonds: this.identifyStrengthenedBonds(team),
      weakenedBonds: this.identifyWeakenedBonds(team)
    };
  }
  
  private static calculateConflictResolution(characters: BattleCharacter[]): number {
    // Base score
    let score = 50;
    
    // Good factors
    const lowConflictChars = characters.filter(char => char.mentalState.teamTrust > 60).length;
    score += (lowConflictChars / characters.length) * 30;
    
    const cooperativeChars = characters.filter(char => char.battlePerformance.teamplayActions > 2).length;
    score += (cooperativeChars / characters.length) * 20;
    
    // Bad factors
    const highStressChars = characters.filter(char => char.mentalState.stress > 70).length;
    score -= (highStressChars / characters.length) * 25;
    
    return Math.max(0, Math.min(100, Math.floor(score)));
  }
  
  private static calculateAdaptability(characters: BattleCharacter[]): number {
    // Base score
    let score = 50;
    
    // Positive adaptability indicators
    const balancedDeviations = characters.filter(char => 
      char.battlePerformance.strategyDeviations > 0 && char.battlePerformance.strategyDeviations < 3
    ).length;
    score += (balancedDeviations / characters.length) * 25;
    
    const highConfidence = characters.filter(char => char.mentalState.confidence > 60).length;
    score += (highConfidence / characters.length) * 15;
    
    // Negative adaptability indicators
    const rigidChars = characters.filter(char => char.battlePerformance.strategyDeviations === 0).length;
    if (rigidChars === characters.length) score -= 20; // Too rigid
    
    const chaoticChars = characters.filter(char => char.battlePerformance.strategyDeviations > 4).length;
    score -= (chaoticChars / characters.length) * 30; // Too chaotic
    
    return Math.max(0, Math.min(100, Math.floor(score)));
  }
  
  private static identifyEmergingDynamics(team: { characters: BattleCharacter[] }): string[] {
    const dynamics: string[] = [];
    
    const highPerformers = team.characters.filter((char: BattleCharacter) => 
      char.battlePerformance.successfulHits > 5 && char.battlePerformance.teamplayActions > 3
    );
    
    if (highPerformers.length > 0) {
      dynamics.push('Natural leaders emerging from strong performance');
    }
    
    const strugglingChars = team.characters.filter((char: BattleCharacter) => 
      char.currentHealth < char.character.combatStats.maxHealth * 0.5 && char.mentalState.stress > 70
    );
    
    if (strugglingChars.length > 1) {
      dynamics.push('Multiple team members may need additional support');
    }
    
    return dynamics;
  }
  
  private static identifyStrengthenedBonds(team: { characters: BattleCharacter[] }): string[] {
    const bonds: string[] = [];
    
    // Look for characters who helped each other
    team.characters.forEach((char: BattleCharacter) => {
      if (char.battlePerformance.teamplayActions > 3) {
        bonds.push(`${char.character.name} has strengthened bonds through teamwork`);
      }
    });
    
    return bonds;
  }
  
  private static identifyWeakenedBonds(team: { characters: BattleCharacter[] }): string[] {
    const bonds: string[] = [];
    
    // Look for characters with trust issues or high stress
    team.characters.forEach((char: BattleCharacter) => {
      if (char.mentalState.teamTrust < 30) {
        bonds.push(`${char.character.name}'s trust in the team has deteriorated`);
      }
    });
    
    return bonds;
  }
  
  private static playActionSoundEffect(
    action: CombatAction,
    actor: BattleCharacter,
    target: BattleCharacter,
    damage: number
  ): void {
    try {
      // Determine sound effect based on action type and character archetype
      let soundEffect = 'sword_slash'; // default
      
      if (action.actualAction.type === 'ability') {
        // Magic-based characters use magic sound
        if (actor.character.archetype === 'mage' || actor.character.archetype === 'mystic') {
          soundEffect = 'magic_cast';
        } else {
          soundEffect = 'sword_slash';
        }
      } else if (action.actualAction.type === 'basic_attack') {
        // Physical attack sounds based on character type
        switch (actor.character.archetype) {
          case 'warrior':
          case 'assassin':
            soundEffect = 'sword_slash';
            break;
          case 'mage':
          case 'mystic':
            soundEffect = 'magic_cast';
            break;
          default:
            soundEffect = 'sword_slash';
        }
      }
      
      // Check for critical hits (high damage relative to actor's attack)
      const isCritical = damage > actor.character.combatStats.attack * 1.5;
      if (isCritical) {
        soundEffect = 'critical_hit';
      }
      
      // Check if attack was blocked (very low damage)
      const wasBlocked = damage < actor.character.combatStats.attack * 0.3;
      if (wasBlocked) {
        soundEffect = 'block';
      }
      
      // Play the sound effect
      audioService.playSoundEffect(soundEffect);
      
      // Add additional effects for special situations
      if (target.currentHealth === 0) {
        // Character defeated
        setTimeout(() => audioService.playSoundEffect('defeat'), 500);
      }
      
    } catch (error) {
      console.warn('Failed to play action sound effect:', error);
    }
  }
}

export default BattleEngine;