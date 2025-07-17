// Battle Flow Mechanics System - CORRECTED
// Physical combat system where psychology affects performance, NOT pure psychological warfare

import { Character } from './characters';

// ============= BATTLE FLOW TYPES =============
// CORRECTED: Physical combat with psychology as modifiers, not the core combat system

export interface BattleState {
  id: string;
  phase: BattlePhase;
  teams: {
    player: BattleTeam;
    opponent: BattleTeam;
  };
  currentRound: number;
  maxRounds: number;
  globalMorale: {
    player: number; // 0-100
    opponent: number; // 0-100
  };
  battleLog: BattleLogEntry[];
  aiJudgeContext: AIJudgeContext;
  coachingData: CoachingData;
  lastUpdate: Date;
}

export type BattlePhase =
  | 'pre_battle_huddle'
  | 'combat'
  | 'coaching_timeout'
  | 'post_battle'
  | 'battle_complete'
  | 'matchmaking'
  | 'strategy-selection'
  | 'pre-battle'
  | 'round-combat'
  | 'round-end'
  | 'battle-end'
  | 'battle-cry';

export interface BattleTeam {
  characters: BattleCharacter[];
  teamChemistry: number; // 0-100
  currentMorale: number; // 0-100
  coachingCredits: number; // 0-3 per battle
  statusEffects: TeamStatusEffect[];
}

export interface BattleCharacter {
  character: Character;
  // PHYSICAL STATS - The core combat system
  currentHealth: number;
  currentMana: number;
  physicalDamageDealt: number;
  physicalDamageTaken: number;
  statusEffects: StatusEffect[];
  // PSYCHOLOGY STATS - Modifiers that affect physical combat performance
  mentalState: MentalState;
  gameplanAdherence: number; // 0-100 - how likely to follow the coach's strategy
  battlePerformance: BattlePerformance;
  relationshipModifiers: RelationshipModifier[];
  // EQUIPMENT EFFECTS - Physical combat modifiers
  equipmentBonuses: {
    attackBonus: number;
    defenseBonus: number;
    speedBonus: number;
    criticalChanceBonus: number;
  };
}

export interface MentalState {
  currentMentalHealth: number; // 0-100
  stress: number; // 0-100
  confidence: number; // 0-100
  teamTrust: number; // 0-100 - trust in teammates and coaching staff
  battleFocus: number; // 0-100
  strategyDeviationRisk: number; // 0-100 - chance to deviate from gameplan
}

export interface BattlePerformance {
  damageDealt: number;
  damageTaken: number;
  abilitiesUsed: number;
  successfulHits: number;
  criticalHits: number;
  teamplayActions: number;
  strategyDeviations: number; // Times they went off-gameplan
}

// ============= PRE-BATTLE HUDDLE SYSTEM =============

export interface PreBattleHuddle {
  phase: 'team_assessment' | 'strategy_briefing' | 'final_motivation';
  teamChemistryCheck: TeamChemistryResult;
  characterReadiness: CharacterReadiness[];
  coachingOptions: CoachingOption[];
  huddleOutcome: HuddleOutcome;
}

export interface TeamChemistryResult {
  overallChemistry: number; // 0-100
  conflictingPersonalities: string[];
  synergisticPairs: string[];
  leadershipDynamics: string;
  predictedChallenges: string[];
  teamMoodDescription: string;
}

export interface CharacterReadiness {
  characterId: string;
  mentalReadiness: number; // 0-100
  physicalReadiness: number; // 0-100
  gameplanAdherence: number; // 0-100 - likely to follow coach's strategy
  concerns: string[];
  motivations: string[];
  predictedBehavior: 'strategic' | 'unpredictable' | 'independent' | 'supportive';
  specialNotes: string[];
}

export interface CoachingOption {
  id: string;
  type: 'motivational_speech' | 'tactical_adjustment' | 'conflict_resolution' | 'confidence_boost';
  description: string;
  targetCharacters: string[];
  effects: CoachingEffect[];
  requirements: CoachingRequirement[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CoachingEffect {
  type: 'morale_boost' | 'strategy_focus_increase' | 'chemistry_improve' | 'stress_reduction';
  value: number;
  duration: 'huddle_only' | 'first_round' | 'entire_battle';
  targetScope: 'individual' | 'team' | 'specific_characters';
}

export interface HuddleOutcome {
  finalTeamMorale: number;
  characterStates: Record<string, CharacterReadiness>;
  strategicAdvantages: string[];
  potentialProblems: string[];
  aiJudgeComments: string[];
}

// ============= DYNAMIC COMBAT SYSTEM =============

export interface CombatRound {
  roundNumber: number;
  initiative: InitiativeOrder[];
  actions: CombatAction[];
  moraleEvents: MoraleEvent[];
  rogueActions: RogueAction[];
  roundOutcome: RoundOutcome;
  teamMoraleChanges: MoraleChange[];
}

export interface InitiativeOrder {
  characterId: string;
  team: 'player' | 'opponent';
  speed: number;
  mentalModifiers: number; // Stress/confidence affecting turn order
  gameplanAdherence: number; // How likely to follow strategic plan
  plannedAction?: PlannedAction;
}

export interface PlannedAction {
  type: 'ability' | 'basic_attack' | 'defend' | 'support' | 'coach_suggested';
  targetId?: string;
  abilityId?: string;
  coachingInfluence: number; // 0-100 - how much player input influenced this
}

export interface CombatAction {
  characterId: string;
  actionType: 'planned' | 'improvised' | 'panicked' | 'inspired';
  originalPlan?: PlannedAction;
  actualAction: ExecutedAction;
  gameplanCheck: GameplanAdherenceCheck;
  psychologyFactors: PsychologyFactor[];
  outcome: ActionOutcome;
}

export interface ExecutedAction {
  type: 'ability' | 'basic_attack' | 'defend' | 'help_ally' | 'flee' | 'refuse_action' | 'attack_teammate';
  targetId?: string;
  abilityId?: string;
  // PHYSICAL DAMAGE - Real combat damage, not psychological
  physicalDamage?: number;
  armorPiercing?: number;
  criticalHit?: boolean;
  effects?: ActionEffect[];
  narrativeDescription: string;
}

export interface GameplanAdherenceCheck {
  baseAdherence: number;
  mentalHealthModifier: number;
  teamChemistryModifier: number;
  relationshipModifier: number;
  stressModifier: number;
  finalAdherence: number;
  checkResult: 'follows_strategy' | 'slight_deviation' | 'improvises' | 'goes_rogue';
  reasoning: string;
}

export interface RogueAction {
  characterId: string;
  triggerReason: 'low_mental_health' | 'team_conflict' | 'stress_overload' | 'personality_clash';
  rogueType: 'ignores_strategy' | 'attacks_teammate' | 'flees_battle' | 'goes_berserk' | 'helps_enemy';
  severity: 'minor' | 'moderate' | 'severe';
  consequences: RogueConsequence[];
  aiJudgeRuling: string;
}

export interface RogueConsequence {
  type: 'damage' | 'morale_loss' | 'relationship_damage' | 'team_chemistry_loss' | 'strategic_disadvantage';
  value: number;
  affectedCharacters: string[];
  description: string;
}

// ============= MORALE SYSTEM =============

export interface MoraleEvent {
  eventType: 'victory' | 'defeat' | 'critical_hit' | 'ally_down' | 'comeback' | 'betrayal' | 'heroic_save';
  description: string;
  moraleImpact: number; // -50 to +50
  affectedTeam: 'player' | 'opponent' | 'both';
  triggeringCharacter?: string;
  cascadeEffects: CascadeEffect[];
}

export interface CascadeEffect {
  type: 'inspiration' | 'demoralization' | 'anger' | 'determination' | 'panic';
  characterIds: string[];
  statModifiers: Record<string, number>;
  behaviorChanges: string[];
}

export interface MoraleChange {
  characterId: string;
  oldMorale: number;
  newMorale: number;
  reason: string;
  effectsOnPerformance: PerformanceModifier[];
}

export interface PerformanceModifier {
  stat: 'attack' | 'defense' | 'speed' | 'accuracy' | 'critical_chance';
  modifier: number; // Percentage change
  reason: string;
}

// ============= COACHING TIMEOUT SYSTEM =============

export interface CoachingTimeout {
  triggerCondition: TimeoutTrigger;
  availableActions: TimeoutAction[];
  timeLimit: number; // seconds
  characterStates: TimeoutCharacterState[];
  urgentIssues: UrgentIssue[];
  strategicOptions: StrategicOption[];
}

export interface TimeoutTrigger {
  type: 'player_requested' | 'character_breakdown' | 'team_chemistry_crisis' | 'strategic_emergency';
  severity: 'minor' | 'moderate' | 'critical';
  description: string;
  timeRemaining: number;
}

export interface TimeoutAction {
  id: string;
  type: 'individual_coaching' | 'team_rallying' | 'conflict_mediation' | 'strategic_pivot';
  description: string;
  targetCharacters: string[];
  effects: TimeoutEffect[];
  requirements: string[];
  successChance: number; // 0-100
  timeConsumed: number;
}

export interface TimeoutEffect {
  type: 'mental_health_restore' | 'gameplan_adherence_boost' | 'chemistry_repair' | 'strategy_adjustment';
  value: number;
  duration: 'immediate' | 'next_round' | 'rest_of_battle';
  description: string;
}

export interface TimeoutCharacterState {
  characterId: string;
  currentIssues: string[];
  coachingNeeds: string[];
  receptiveness: number; // 0-100 - how open to coaching right now
  quickFixOptions: QuickFix[];
  deepIssues: string[];
}

export interface QuickFix {
  action: string;
  effect: string;
  successChance: number;
  riskLevel: string;
}

// ============= POST-BATTLE DYNAMICS =============

export interface PostBattleAnalysis {
  battleResult: 'victory' | 'defeat' | 'draw';
  teamPerformanceMetrics: TeamMetrics;
  characterEvaluations: CharacterEvaluation[];
  relationshipChanges: RelationshipChange[];
  psychologicalConsequences: PsychologicalConsequence[];
  trainingRecommendations: TrainingRecommendation[];
  teamChemistryEvolution: ChemistryEvolution;
}

export interface TeamMetrics {
  overallTeamwork: number; // 0-100
  gameplanAdherence: number; // 0-100 - how well team followed gameplan
  strategicExecution: number; // 0-100
  moraleManagement: number; // 0-100
  conflictResolution: number; // 0-100
  adaptability: number; // 0-100
}

export interface CharacterEvaluation {
  characterId: string;
  battleRating: number; // 0-100
  gameplanAdherenceScore: number; // 0-100 - how well they followed gameplan
  teamplayScore: number; // 0-100
  mentalhealthChange: number; // -50 to +50
  stressLevel: number; // 0-100
  confidenceChange: number; // -50 to +50
  notableActions: string[];
  behaviorPatterns: string[];
  growthAreas: string[];
  strengthsDisplayed: string[];
}

export interface RelationshipChange {
  character1: string;
  character2: string;
  oldRelationshipStrength: number;
  newRelationshipStrength: number;
  changeReason: string;
  battleEvents: string[];
  futureImplications: string[];
}

export interface PsychologicalConsequence {
  characterId: string;
  type: 'trauma' | 'growth' | 'bonding' | 'resentment' | 'inspiration';
  severity: 'minor' | 'moderate' | 'significant';
  description: string;
  longTermEffects: string[];
  recoveryTime: number; // battles needed to heal
  treatmentOptions: string[];
}

export interface TrainingRecommendation {
  characterId: string;
  type: 'mental_health' | 'strategy_focus' | 'team_chemistry' | 'combat_skills' | 'stress_management';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  expectedBenefit: string;
  timeRequired: number; // training sessions
}

export interface ChemistryEvolution {
  oldChemistry: number;
  newChemistry: number;
  evolutionFactors: string[];
  emergingDynamics: string[];
  strengthenedBonds: string[];
  weakenedBonds: string[];
  cultureShift: string;
}

// ============= AI JUDGE SYSTEM =============

export interface AIJudgeContext {
  battleNarrative: string;
  characterPersonalities: Record<string, string>;
  currentTensions: string[];
  previousRulings: AIRuling[];
  judgingStyle: 'strict' | 'lenient' | 'dramatic' | 'realistic';
}

export interface AIRuling {
  situation: string;
  ruling: string;
  reasoning: string;
  gameplayEffect: string;
  narrativeImpact: string;
  characterReactions: Record<string, string>;
}

// ============= UTILITY TYPES =============

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'neutral';
  description: string;
  value: number;
  duration: number;
  stackable: boolean;
}

export interface TeamStatusEffect {
  id: string;
  name: string;
  description: string;
  effects: Record<string, number>;
  duration: number;
}

export interface RelationshipModifier {
  withCharacter: string;
  relationship: 'ally' | 'rival' | 'enemy' | 'mentor' | 'student' | 'neutral';
  strength: number; // -100 to 100
  battleModifiers: Record<string, number>;
}

export interface ActionEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'special';
  value: number;
  targetId: string;
  description: string;
}

export interface ActionOutcome {
  success: boolean;
  damage?: number;
  effects: ActionEffect[];
  criticalResult?: boolean;
  narrativeDescription: string;
  audienceReaction: string;
}

export interface PsychologyFactor {
  factor: 'mental_health' | 'team_chemistry' | 'stress' | 'confidence' | 'relationship';
  impact: 'positive' | 'negative' | 'neutral';
  value: number;
  description: string;
}

export interface CoachingRequirement {
  type: 'character_trust' | 'team_chemistry' | 'time_available' | 'coaching_skill';
  minimumValue: number;
  description: string;
}

export interface RoundOutcome {
  winner: 'player' | 'opponent' | 'draw';
  keyEvents: string[];
  moraleShift: Record<string, number>;
  strategicAdvantages: string[];
  unexpectedDevelopments: string[];
  judgeCommentary: string;
}

export interface BattleLogEntry {
  timestamp: Date;
  type: 'action' | 'morale_event' | 'coaching' | 'judge_ruling' | 'phase_change';
  description: string;
  characterInvolved?: string;
  gameplayEffect: string;
  dramaticImpact: string;
}

export interface UrgentIssue {
  type: 'character_breakdown' | 'team_conflict' | 'strategy_failing' | 'morale_collapse';
  severity: 'warning' | 'urgent' | 'critical';
  description: string;
  immediateActions: string[];
  consequencesIfIgnored: string[];
}

export interface StrategicOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  characterReactions: Record<string, string>;
  implementationDifficulty: number; // 0-100
}

export interface CoachingData {
  creditsUsed: number;
  creditsRemaining: number;
  timeoutsUsed: number;
  maxTimeouts: number;
  coachingEffectiveness: number; // 0-100 - based on character trust levels
  teamRespect: number; // 0-100 - how much team respects coach
}

// ============= BATTLE FLOW FUNCTIONS =============

export class BattleFlowManager {
  static createBattle(playerTeam: Character[], opponentTeam: Character[]): BattleState {
    return {
      id: `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phase: 'pre_battle_huddle',
      teams: {
        player: this.createBattleTeam(playerTeam),
        opponent: this.createBattleTeam(opponentTeam)
      },
      currentRound: 0,
      maxRounds: 10,
      globalMorale: {
        player: 75, // Start with decent morale
        opponent: 75
      },
      battleLog: [],
      aiJudgeContext: this.initializeAIJudge(),
      coachingData: {
        creditsUsed: 0,
        creditsRemaining: 3,
        timeoutsUsed: 0,
        maxTimeouts: 2,
        coachingEffectiveness: 50,
        teamRespect: 60
      },
      lastUpdate: new Date()
    };
  }

  static createBattleTeam(characters: Character[]): BattleTeam {
    return {
      characters: characters.map(char => this.createBattleCharacter(char)),
      teamChemistry: this.calculateInitialChemistry(characters),
      currentMorale: 75,
      coachingCredits: 3,
      statusEffects: []
    };
  }

  static createBattleCharacter(character: Character): BattleCharacter {
    return {
      character,
      // PHYSICAL COMBAT INITIALIZATION - Real HP/damage tracking
      currentHealth: character.combatStats.maxHealth,
      currentMana: character.combatStats.maxMana,
      physicalDamageDealt: 0,
      physicalDamageTaken: 0,
      statusEffects: [],
      // PSYCHOLOGY INITIALIZATION - Affects combat performance
      mentalState: {
        currentMentalHealth: 80, // Affects damage modifiers
        stress: 25, // High stress reduces accuracy/damage
        confidence: 70, // Affects damage output
        teamTrust: character.bondLevel,
        battleFocus: 75, // Affects critical hit chance
        strategyDeviationRisk: Math.max(0, 100 - character.trainingLevel)
      },
      gameplanAdherence: character.trainingLevel, // How likely to follow coach's strategy
      battlePerformance: {
        damageDealt: 0, // Physical damage dealt
        damageTaken: 0, // Physical damage received
        abilitiesUsed: 0,
        successfulHits: 0,
        criticalHits: 0,
        teamplayActions: 0,
        strategyDeviations: 0 // Times they went off-gameplan
      },
      relationshipModifiers: this.calculateRelationshipModifiers(character),
      // EQUIPMENT BONUSES - Physical combat modifiers from gear
      equipmentBonuses: {
        attackBonus: character.equippedItems?.weapon?.stats.atk || 0,
        defenseBonus: character.equippedItems?.armor?.stats.def || 0,
        speedBonus: character.equippedItems?.accessory?.stats.spd || 0,
        criticalChanceBonus: character.equippedItems?.weapon?.stats.critRate || 0
      }
    };
  }

  static calculateInitialChemistry(characters: Character[]): number {
    // Calculate team chemistry based on character relationships
    let totalChemistry = 0;
    let relationshipCount = 0;

    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const char1 = characters[i];
        const char2 = characters[j];

        // Find relationship between characters
        const relationship = char1.personality.relationships.find(
          rel => rel.characterId === char2.name.toLowerCase().replace(/\s+/g, '_')
        );

        if (relationship) {
          totalChemistry += relationship.strength;
          relationshipCount++;
        } else {
          // Neutral relationship
          totalChemistry += 0;
          relationshipCount++;
        }
      }
    }

    // Convert to 0-100 scale
    const averageChemistry = relationshipCount > 0 ? totalChemistry / relationshipCount : 0;
    return Math.max(0, Math.min(100, 50 + averageChemistry));
  }

  static calculateRelationshipModifiers(character: Character): RelationshipModifier[] {
    return character.personality.relationships.map(rel => ({
      withCharacter: rel.characterId,
      relationship: rel.relationship,
      strength: rel.strength,
      battleModifiers: this.getRelationshipBattleModifiers(rel.relationship, rel.strength)
    }));
  }

  static getRelationshipBattleModifiers(relationship: string, strength: number): Record<string, number> {
    const modifier = Math.abs(strength) / 100;

    switch (relationship) {
      case 'ally':
        return {
          teamwork_bonus: modifier * 20,
          morale_support: modifier * 15,
          cooperation_chance: modifier * 30
        };
      case 'rival':
        return {
          competitive_boost: modifier * 10,
          conflict_risk: modifier * 25,
          independence_tendency: modifier * 15
        };
      case 'enemy':
        return {
          hostility: modifier * 30,
          cooperation_penalty: modifier * 40,
          conflict_escalation: modifier * 35
        };
      case 'mentor':
        return {
          wisdom_bonus: modifier * 15,
          gameplan_adherence_boost: modifier * 25,
          learning_enhancement: modifier * 20
        };
      case 'student':
        return {
          eagerness: modifier * 20,
          gameplan_adherence_boost: modifier * 15,
          growth_potential: modifier * 25
        };
      case 'neutral':
        return {
          no_special_modifiers: 0
        };
      default:
        return {};
    }
  }

  static initializeAIJudge(): AIJudgeContext {
    return {
      battleNarrative: "The battle begins with tension in the air...",
      characterPersonalities: {},
      currentTensions: [],
      previousRulings: [],
      judgingStyle: 'dramatic'
    };
  }
}

// Export all types and utilities
export default BattleFlowManager;
