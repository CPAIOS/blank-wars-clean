// Physical Battle Engine - CORRECTED Implementation
// This fixes the fundamental misunderstanding: Psychology affects combat performance, it IS NOT the combat itself

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
  PostBattleAnalysis,
  ActionOutcome
} from '../data/battleFlow';
import { calculateFinalStats } from '../data/characterEquipment';
import { calculateDeviationRisk, generatePsychologyState } from '../data/characterPsychology';
import { makeJudgeDecision, judgePersonalities, JudgeDecision, JudgePersonality } from '../data/aiJudgeSystem';

export interface PhysicalDamageCalculation {
  baseDamage: number;
  weaponDamage: number;
  strengthBonus: number;
  armorReduction: number;
  psychologyModifier: number; // This is where psychology affects combat
  finalDamage: number;
  damageBreakdown: string[];
}

export interface PhysicalActionOutcome extends ActionOutcome {
  physicalDamage: PhysicalDamageCalculation;
  healthChange: number;
  armorDamage: number;
  statusEffectsApplied: string[];
  counterAttackTriggered: boolean;
  psychologyDeviation?: {
    character: BattleCharacter;
    deviationRisk: number;
    triggeredAction?: string;
    riskFactors: string[];
  };
  judgeDecision?: {
    decision: JudgeDecision;
    judge: JudgePersonality;
    triggeredByDeviation: boolean;
    aiGeneratedAction?: string;
  };
}

export class PhysicalBattleEngine {
  
  // ============= PHYSICAL COMBAT CORE =============
  
  static executePhysicalAction(
    attacker: BattleCharacter,
    target: BattleCharacter,
    action: ExecutedAction,
    battleState: BattleState,
    currentJudge?: JudgePersonality
  ): PhysicalActionOutcome {
    
    // SAFETY: Null pointer protection
    if (!attacker || !target || !action || !battleState) {
      throw new Error('Invalid parameters for physical action execution');
    }
    
    // 0. JUDGE DECISION SYSTEM - Check for psychology deviations and judge rulings
    const judgeResult = this.processJudgeDecision(attacker, action, battleState, currentJudge);
    const finalAction = judgeResult.modifiedAction;
    const judgeDecision = judgeResult.judgeDecision;
    
    // Update target if judge redirected the action
    let finalTarget = target;
    if (judgeResult.judgeTriggered && judgeDecision) {
      const effect = judgeDecision.mechanicalEffect;
      if (effect.type === 'redirect_attack' && effect.target === 'teammate') {
        const teammate = this.findTeammate(attacker, battleState);
        if (teammate) {
          // Find the BattleCharacter for this teammate
          const teammateBC = battleState.teams.player.characters.find(c => c.character.id === teammate.id) ||
                           battleState.teams.opponent.characters.find(c => c.character.id === teammate.id);
          if (teammateBC) {
            finalTarget = teammateBC;
            console.log(`💥 FRIENDLY FIRE: ${attacker.character.name} attacks teammate ${finalTarget.character.name}!`);
          }
        }
      }
    }
    
    // 1. Calculate Base Physical Damage (using final action from judge)
    const baseDamage = this.calculateBaseDamage(attacker, finalAction);
    
    // 2. Apply Weapon Stats
    const weaponDamage = this.calculateWeaponDamage(attacker, finalAction);
    
    // 3. Apply Physical Stats (Strength, etc.)
    const strengthBonus = this.calculateStrengthBonus(attacker);
    
    // 4. Calculate Armor Defense (using final target from judge)
    const armorReduction = this.calculateArmorDefense(finalTarget);
    
    // 5. PSYCHOLOGY MODIFIER - This is where psychology affects combat
    const psychologyModifier = this.calculatePsychologyModifier(attacker, finalTarget, battleState);
    
    // 6. JUDGE EFFECTS MODIFIER - Apply judge decision effects to damage
    let judgeDamageModifier = 1.0;
    let judgeTargetOverride: BattleCharacter | null = null;
    
    if (judgeResult.judgeTriggered && judgeDecision) {
      const effect = judgeDecision.mechanicalEffect;
      
      // Apply judge effect to damage calculation
      if (effect.type === 'damage' && effect.amount) {
        // Judge sets specific damage amount
        judgeDamageModifier = effect.amount / baseDamage;
      } else if (effect.type === 'redirect_attack' && effect.amount) {
        // Judge modifies damage for redirected attacks
        judgeDamageModifier = effect.amount / (baseDamage || 1);
      } else if (effect.type === 'skip_turn') {
        // Judge nullifies damage
        judgeDamageModifier = 0;
      }
    }
    
    // 7. Final Damage Calculation with BOUNDS CHECKING
    const rawDamage = (baseDamage + weaponDamage + strengthBonus - armorReduction) * psychologyModifier * judgeDamageModifier;
    // BOUNDS CHECK: Cap damage between 0 and 9999 (judges can reduce to 0)
    const totalDamage = Math.max(0, Math.min(9999, Math.floor(rawDamage)));
    
    // 8. Apply Damage to Final Target with safety checks
    // BOUNDS CHECK: Ensure valid health values  
    const currentHealth = Math.max(0, Math.min(99999, finalTarget?.currentHealth || 0));
    const newHealth = Math.max(0, currentHealth - totalDamage);
    const healthChange = Math.min(currentHealth, totalDamage); // Can't lose more health than you have
    if (finalTarget) {
      finalTarget.currentHealth = newHealth;
    }
    
    // 9. Check for Status Effects
    const statusEffects = this.calculateStatusEffects(attacker, finalTarget, finalAction, totalDamage);
    
    // 10. Check for Counter Attacks
    const counterAttack = this.checkCounterAttack(finalTarget, attacker, totalDamage);
    
    // 11. PSYCHOLOGY MONITORING - Check for deviations triggered by HP loss
    const psychologyDeviation = this.monitorPsychologyState(finalTarget, battleState);
    
    const damageBreakdown = [
      `Base: ${baseDamage}`,
      `Weapon: +${weaponDamage}`,
      `Strength: +${strengthBonus}`,
      `Armor: -${armorReduction}`,
      `Psychology: ×${psychologyModifier.toFixed(2)}`,
      ...(judgeResult.judgeTriggered ? [`Judge: ×${judgeDamageModifier.toFixed(2)}`] : [])
    ];
    
    return {
      success: totalDamage > 0,
      damage: totalDamage,
      effects: [],
      criticalResult: this.wasCriticalHit(attacker, psychologyModifier),
      narrativeDescription: judgeResult.judgeTriggered && judgeDecision ? 
        judgeDecision.narrative : 
        this.generatePhysicalCombatNarrative(attacker, finalTarget, finalAction, totalDamage, psychologyModifier),
      audienceReaction: judgeResult.judgeTriggered ? 
        "The crowd reacts to the judge's unexpected ruling!" :
        this.generateAudienceReaction(totalDamage, healthChange),
      physicalDamage: {
        baseDamage,
        weaponDamage,
        strengthBonus,
        armorReduction,
        psychologyModifier,
        finalDamage: totalDamage,
        damageBreakdown
      },
      healthChange,
      armorDamage: Math.floor(totalDamage * 0.1), // Armor degrades
      statusEffectsApplied: statusEffects,
      counterAttackTriggered: counterAttack,
      psychologyDeviation,
      judgeDecision: judgeResult.judgeTriggered ? {
        decision: judgeDecision!,
        judge: judgeResult.judge!,
        triggeredByDeviation: true,
        aiGeneratedAction: judgeResult.judgeTriggered ? this.generateBasicRogueAction(attacker, psychologyDeviation) : undefined
      } : undefined
    };
  }
  
  // ============= JUDGE INTEGRATION SYSTEM =============
  
  static processJudgeDecision(
    attacker: BattleCharacter,
    action: ExecutedAction,
    battleState: BattleState,
    currentJudge?: JudgePersonality,
    aiGeneratedAction?: string
  ): {
    judgeDecision?: JudgeDecision;
    judge?: JudgePersonality;
    modifiedAction: ExecutedAction;
    judgeTriggered: boolean;
  } {
    
    // Use provided judge or default to Judge Wisdom for consistent results
    const activeJudge = currentJudge || judgePersonalities.find(j => j.name === 'Judge Wisdom') || judgePersonalities[0];
    
    // Check if we have a psychology deviation that requires judge interpretation
    const psychDeviation = this.monitorPsychologyState(attacker, battleState);
    
    if (psychDeviation && psychDeviation.deviationRisk > 70) {
      // High deviation risk triggers judge decision
      
      // Create deviation event for judge system
      const deviationEvent = {
        type: this.mapDeviationToType(psychDeviation.triggeredAction || 'mild_insubordination'),
        severity: this.getDeviationSeverity(psychDeviation.deviationRisk),
        description: `${attacker.character.name}: ${psychDeviation.riskFactors.join(', ')}`,
        character: attacker.character as any, // Type cast for compatibility
        psychologyFactors: psychDeviation.riskFactors
      };
      
      // Create battle context for judge
      const battleContext = {
        currentRound: battleState.currentRound,
        opponentCharacter: this.findOpponent(attacker, battleState),
        teammateCharacter: this.findTeammate(attacker, battleState),
        arenaCondition: 'pristine' as const // TODO: Make this dynamic
      };
      
      // Generate AI action if not provided
      const actionForJudge = aiGeneratedAction || this.generateBasicRogueAction(attacker, psychDeviation);
      
      // Get judge decision!
      const judgeDecision = makeJudgeDecision(
        deviationEvent,
        attacker.character as any, // Type cast for compatibility  
        battleContext,
        activeJudge,
        actionForJudge
      );
      
      // Modify action based on judge ruling
      const modifiedAction = this.applyJudgeRulingToAction(action, judgeDecision, battleState);
      
      console.log(`⚖️ JUDGE RULING: ${activeJudge.name} - ${judgeDecision.ruling}`);
      console.log(`🎭 NARRATIVE: ${judgeDecision.narrative}`);
      
      return {
        judgeDecision,
        judge: activeJudge,
        modifiedAction,
        judgeTriggered: true
      };
    }
    
    // No judge intervention needed
    return {
      modifiedAction: action,
      judgeTriggered: false
    };
  }
  
  static mapDeviationToType(triggeredAction: string): any {
    const deviationMap: Record<string, string> = {
      'berserker_rage_all': 'berserker_rage',
      'reckless_assault': 'berserker_rage', 
      'ignore_strategy': 'strategy_override',
      'mild_insubordination': 'minor_insubordination'
    };
    
    return deviationMap[triggeredAction] || 'minor_insubordination';
  }
  
  static getDeviationSeverity(riskLevel: number): 'minor' | 'moderate' | 'major' | 'extreme' {
    if (riskLevel >= 90) return 'extreme';
    if (riskLevel >= 80) return 'major'; 
    if (riskLevel >= 65) return 'moderate';
    return 'minor';
  }
  
  static findOpponent(character: BattleCharacter, battleState: BattleState): any {
    const isPlayer = battleState.teams.player.characters.includes(character);
    const opponentTeam = isPlayer ? battleState.teams.opponent : battleState.teams.player;
    return opponentTeam.characters[0]?.character || null;
  }
  
  static findTeammate(character: BattleCharacter, battleState: BattleState): any {
    const isPlayer = battleState.teams.player.characters.includes(character);
    const playerTeam = isPlayer ? battleState.teams.player : battleState.teams.opponent;
    const teammate = playerTeam.characters.find(c => c.character.id !== character.character.id);
    return teammate?.character || null;
  }
  
  static generateBasicRogueAction(character: BattleCharacter, psychDeviation: any): string {
    const actions = [
      "I lose control and attack wildly!",
      "I see red and strike at everything around me!",
      "I abandon all strategy and fight with pure instinct!",
      "I lash out in frustration at whoever is closest!",
      "I refuse to follow orders and do what I want!"
    ];
    
    return actions[Math.floor(Math.random() * actions.length)];
  }
  
  static applyJudgeRulingToAction(
    originalAction: ExecutedAction,
    judgeDecision: JudgeDecision,
    battleState: BattleState
  ): ExecutedAction {
    const effect = judgeDecision.mechanicalEffect;
    
    // Modify action based on judge effect
    switch (effect.type) {
      case 'redirect_attack':
        if (effect.target === 'teammate') {
          // Find a teammate to attack instead
          const attacker = this.findCharacter(battleState, originalAction.characterId || '');
          const teammate = this.findTeammate(attacker!, battleState);
          if (teammate) {
            return {
              ...originalAction,
              targetId: teammate.id,
              narrativeDescription: `${judgeDecision.narrative} - Attack redirected to teammate!`
            };
          }
        } else if (effect.target === 'all') {
          return {
            ...originalAction,
            target: 'all',
            narrativeDescription: `${judgeDecision.narrative} - Berserker rage affects everyone!`
          };
        }
        break;
        
      case 'skip_turn':
        return {
          ...originalAction,
          type: 'defend', // Convert to defensive action
          narrativeDescription: judgeDecision.narrative
        };
        
      case 'environmental':
        return {
          ...originalAction,
          target: 'environment',
          narrativeDescription: `${judgeDecision.narrative} - Environmental destruction!`
        };
    }
    
    // Default: return action with judge narrative
    return {
      ...originalAction,
      narrativeDescription: judgeDecision.narrative
    };
  }

  // ============= PSYCHOLOGY MONITORING SYSTEM =============
  
  static monitorPsychologyState(
    character: BattleCharacter,
    battleState: BattleState
  ): {
    character: BattleCharacter;
    deviationRisk: number;
    triggeredAction?: string;
    riskFactors: string[];
  } | undefined {
    try {
      // Create temporary psychology state for deviation calculation
      const tempPsychState = {
        mentalStability: character.mentalState?.currentMentalHealth || 70,
        stress: character.mentalState?.stress || 30,
        confidence: character.mentalState?.confidence || 70,
        teamHarmony: character.mentalState?.teamTrust || 70,
        strategicAlignment: character.gameplanAdherence || 70,
        volatility: 50 // Base volatility
      };
      
      // Get teammates for relationship calculations
      const teammates = battleState.teams.player.characters
        .filter(char => char.character.id !== character.character.id)
        .map(char => char.character as any); // Type cast to work around interface mismatch
      
      // Calculate deviation risk with enhanced HP triggers
      const deviationData = calculateDeviationRisk(
        character.character as any, // Type cast to work around interface mismatch
        tempPsychState,
        { healingFacilities: false, restConditions: false, mentalHealthSupport: false },
        teammates
      );
      
      const riskThreshold = 65; // Characters deviate above 65% risk
      
      if (deviationData.currentRisk > riskThreshold) {
        console.log(`🧠 PSYCHOLOGY TRIGGER: ${character.character.name} deviation risk: ${deviationData.currentRisk}%`);
        console.log(`Risk factors: ${deviationData.riskFactors.join(', ')}`);
        
        // Generate berserker action for high-risk characters
        const triggeredAction = this.generateDeviationAction(character, deviationData.currentRisk);
        
        return {
          character,
          deviationRisk: deviationData.currentRisk,
          triggeredAction,
          riskFactors: deviationData.riskFactors
        };
      }
      
      return undefined;
    } catch (error) {
      console.warn('Psychology monitoring failed:', error);
      return undefined;
    }
  }
  
  static generateDeviationAction(character: BattleCharacter, riskLevel: number): string {
    const hpPercentage = character.currentHealth / (character.character.combatStats?.maxHealth || 100);
    
    if (hpPercentage <= 0.1 && riskLevel > 80) {
      return 'berserker_rage_all'; // Attack everyone in desperation
    } else if (hpPercentage <= 0.25 && riskLevel > 70) {
      return 'reckless_assault'; // Abandon defense, all-out attack
    } else if (riskLevel > 75) {
      return 'ignore_strategy'; // Stop following gameplan
    } else {
      return 'mild_insubordination'; // Minor deviation
    }
  }
  
  // Check if character should follow gameplan or deviate based on psychology + HP
  static checkGameplanAdherence(
    character: BattleCharacter,
    plannedAction: ExecutedAction,
    battleState: BattleState
  ): {
    willFollow: boolean;
    deviatedAction?: ExecutedAction;
    reason: string;
    adherenceScore: number;
  } {
    const hpPercentage = character.currentHealth / (character.character.combatStats?.maxHealth || 100);
    let adherenceScore = character.gameplanAdherence || 70; // Base adherence
    const reasons: string[] = [];
    
    // HP-based adherence modifiers
    if (hpPercentage <= 0.1) {
      adherenceScore -= 50; // Near death = very low adherence
      reasons.push('Near-death desperation');
    } else if (hpPercentage <= 0.25) {
      adherenceScore -= 30; // Critical HP = low adherence
      reasons.push('Critical injuries affecting judgment');
    } else if (hpPercentage <= 0.5) {
      adherenceScore -= 15; // Wounded = reduced adherence
      reasons.push('Pain and frustration');
    }
    
    // Mental state modifiers
    const stress = character.mentalState?.stress || 0;
    const confidence = character.mentalState?.confidence || 70;
    
    if (stress > 70) {
      adherenceScore -= 20;
      reasons.push('High stress levels');
    }
    
    if (confidence < 30) {
      adherenceScore -= 15;
      reasons.push('Low confidence in strategy');
    }
    
    // Archetype-based modifiers (simplified for now)
    const archetype = character.character.archetype;
    if (archetype === 'beast' || archetype === 'monster') {
      adherenceScore -= 10; // Wild types less likely to follow plans
      reasons.push('Wild nature resisting structure');
    }
    
    const willFollow = adherenceScore > 50;
    let deviatedAction: ExecutedAction | undefined;
    
    if (!willFollow) {
      // Generate deviation action based on current state
      if (hpPercentage <= 0.15) {
        // Desperate attack on anyone
        deviatedAction = {
          characterId: character.character.id,
          type: 'basic_attack',
          target: 'random_enemy', // Will be resolved by battle system
          timestamp: Date.now()
        };
        reasons.push('Desperate all-out assault');
      } else if (stress > 80) {
        // Panic - defensive action
        deviatedAction = {
          characterId: character.character.id,
          type: 'defend',
          target: character.character.id,
          timestamp: Date.now()
        };
        reasons.push('Panic response - going defensive');
      } else {
        // General insubordination - ignore planned action, do basic attack
        deviatedAction = {
          characterId: character.character.id,
          type: 'basic_attack',
          target: plannedAction.target,
          timestamp: Date.now()
        };
        reasons.push('Rejecting coaching strategy');
      }
    }
    
    return {
      willFollow,
      deviatedAction,
      reason: reasons.join('; '),
      adherenceScore: Math.max(0, adherenceScore)
    };
  }
  
  // Check for team chemistry breakdown causing friendly fire
  static checkTeamChemistryBreakdown(
    attacker: BattleCharacter,
    originalTarget: BattleCharacter,
    battleState: BattleState
  ): {
    friendlyFireTriggered: boolean;
    newTarget?: BattleCharacter;
    reason: string;
  } {
    const teammates = battleState.teams.player.characters
      .filter(char => char.character.id !== attacker.character.id);
    
    if (teammates.length === 0) {
      return { friendlyFireTriggered: false, reason: 'No teammates available' };
    }
    
    const hpPercentage = attacker.currentHealth / (attacker.character.combatStats?.maxHealth || 100);
    const teamChemistry = battleState.teams.player.teamChemistry || 70;
    
    let friendlyFireRisk = 0;
    const reasons: string[] = [];
    
    // Base risk from poor team chemistry
    if (teamChemistry < 30) {
      friendlyFireRisk += 25;
      reasons.push('Extremely poor team chemistry');
    } else if (teamChemistry < 50) {
      friendlyFireRisk += 15;
      reasons.push('Poor team relationships');
    }
    
    // HP-based frustration increases friendly fire risk
    if (hpPercentage <= 0.1) {
      friendlyFireRisk += 30; // Near death = lash out at anyone
      reasons.push('Near-death frustration');
    } else if (hpPercentage <= 0.25) {
      friendlyFireRisk += 20;
      reasons.push('Critical injuries causing anger');
    }
    
    // High stress increases friendly fire
    const stress = attacker.mentalState?.stress || 0;
    if (stress > 80) {
      friendlyFireRisk += 20;
      reasons.push('Extreme stress levels');
    }
    
    // Low team trust
    const teamTrust = attacker.mentalState?.teamTrust || 70;
    if (teamTrust < 30) {
      friendlyFireRisk += 15;
      reasons.push('Complete loss of trust in teammates');
    }
    
    // Archetype-based modifiers
    const archetype = attacker.character.archetype;
    if (archetype === 'berserker') {
      friendlyFireRisk += 10;
      reasons.push('Berserker rage affecting judgment');
    }
    
    const friendlyFireTriggered = friendlyFireRisk > 40; // 40% threshold for friendly fire
    
    if (friendlyFireTriggered && teammates.length > 0) {
      // Select teammate with worst relationship or random if no relationship data
      const targetTeammate = teammates[Math.floor(Math.random() * teammates.length)];
      
      console.log(`💥 FRIENDLY FIRE: ${attacker.character.name} attacks teammate ${targetTeammate.character.name}! Risk: ${friendlyFireRisk}%`);
      console.log(`Reasons: ${reasons.join(', ')}`);
      
      return {
        friendlyFireTriggered: true,
        newTarget: targetTeammate,
        reason: reasons.join('; ')
      };
    }
    
    return {
      friendlyFireTriggered: false,
      reason: `Team chemistry holding (risk: ${friendlyFireRisk}%)`
    };
  }

  // Master psychology integration function - call this before executing any action
  static processPsychologyEffects(
    character: BattleCharacter,
    plannedAction: ExecutedAction,
    battleState: BattleState
  ): {
    finalAction: ExecutedAction;
    psychologyEvents: string[];
    deviationTriggered: boolean;
    friendlyFireTriggered: boolean;
  } {
    const events: string[] = [];
    let finalAction = plannedAction;
    let deviationTriggered = false;
    let friendlyFireTriggered = false;
    
    // 1. Check gameplan adherence first
    const adherenceCheck = this.checkGameplanAdherence(character, plannedAction, battleState);
    
    if (!adherenceCheck.willFollow && adherenceCheck.deviatedAction) {
      finalAction = adherenceCheck.deviatedAction;
      deviationTriggered = true;
      events.push(`🧠 STRATEGY DEVIATION: ${character.character.name} - ${adherenceCheck.reason}`);
      events.push(`   Adherence Score: ${adherenceCheck.adherenceScore}% (abandoned planned action)`);
    }
    
    // 2. Check for team chemistry breakdown (friendly fire)
    if (finalAction.type === 'basic_attack' || finalAction.type === 'ability') {
      const originalTarget = battleState.teams.opponent.characters.find(char => 
        char.character.id === finalAction.targetId
      );
      
      if (originalTarget) {
        const chemistryCheck = this.checkTeamChemistryBreakdown(character, originalTarget, battleState);
        
        if (chemistryCheck.friendlyFireTriggered && chemistryCheck.newTarget) {
          finalAction = {
            ...finalAction,
            targetId: chemistryCheck.newTarget.character.id
          };
          friendlyFireTriggered = true;
          events.push(`💥 FRIENDLY FIRE: ${character.character.name} attacks teammate instead!`);
          events.push(`   Reason: ${chemistryCheck.reason}`);
        }
      }
    }
    
    return {
      finalAction,
      psychologyEvents: events,
      deviationTriggered,
      friendlyFireTriggered
    };
  }

  // ============= DAMAGE CALCULATION METHODS =============
  
  static calculateBaseDamage(attacker: BattleCharacter, action: ExecutedAction): number {
    // BOUNDS CHECK: Ensure attacker and stats exist
    if (!attacker?.character?.combatStats) {
      console.warn('Invalid attacker or missing combat stats');
      return 0;
    }
    
    // Use final stats that include equipment bonuses!
    const finalStats = calculateFinalStats(attacker.character);
    const finalAttack = Math.max(0, Math.min(9999, finalStats.attack || 0));
    
    console.log(`🗡️ COMBAT DEBUG: ${attacker.character.name} final attack: ${finalAttack} (base: ${attacker.character.combatStats.attack}, weapon bonus included)`);
    
    // BOUNDS CHECK: Ensure attack stat is valid
    const baseAttack = finalAttack;
    
    switch (action.type) {
      case 'basic_attack':
        return baseAttack;
      case 'ability':
        // Find the ability and get its power
        const ability = attacker.character.abilities.find((a: { id: string }) => a.id === action.abilityId);
        const abilityPower = ability?.power || 0;
        // BOUNDS CHECK: Cap ability power
        const cappedPower = Math.max(0, Math.min(999, abilityPower));
        return Math.min(9999, baseAttack + cappedPower);
      case 'defend':
        return 0; // Defensive actions don't deal damage
      default:
        return Math.floor(baseAttack * 0.5); // Reduced damage for other actions
    }
  }
  
  static calculateWeaponDamage(attacker: BattleCharacter, action: ExecutedAction): number {
    // Get equipped weapon stats from equipment system
    const weapon = attacker?.character?.equippedItems?.weapon;
    if (!weapon || !weapon.stats || !weapon.stats.atk) return 0;
    
    // BOUNDS CHECK: Cap weapon attack value
    const weaponAttack = Math.max(0, Math.min(999, weapon.stats.atk));
    
    // Weapon compatibility with character archetype
    const compatibilityBonus = this.calculateWeaponCompatibility(attacker, weapon);
    
    // BOUNDS CHECK: Cap total weapon damage
    return Math.max(0, Math.min(999, weaponAttack + compatibilityBonus));
  }
  
  static calculateStrengthBonus(attacker: BattleCharacter): number {
    // BOUNDS CHECK: Ensure valid strength stat
    const strength = Math.max(0, Math.min(999, attacker?.character?.baseStats?.strength || 0));
    // BOUNDS CHECK: Cap strength bonus
    return Math.max(0, Math.min(500, Math.floor(strength * 0.5))); // Each point of strength adds 0.5 damage
  }
  
  static calculateArmorDefense(target: BattleCharacter): number {
    // Use final stats that include equipment bonuses!
    const finalStats = calculateFinalStats(target.character);
    const finalDefense = Math.max(0, Math.min(999, finalStats.defense || 0));
    
    console.log(`🛡️ DEFENSE DEBUG: ${target.character.name} final defense: ${finalDefense} (base: ${target.character.combatStats.defense}, armor bonus included)`);
    
    // BOUNDS CHECK: Cap total defense
    return finalDefense;
  }
  
  // ============= PSYCHOLOGY MODIFIER - THE KEY FIX =============
  
  static calculatePsychologyModifier(
    attacker: BattleCharacter, 
    target: BattleCharacter, 
    battleState: BattleState
  ): number {
    let modifier = 1.0; // Start at normal performance
    
    // ATTACKER PSYCHOLOGY EFFECTS
    const attackerMental = attacker.mentalState;
    
    // Confidence affects damage output
    if (attackerMental.confidence > 75) modifier += 0.2; // High confidence = +20% damage
    else if (attackerMental.confidence < 40) modifier -= 0.3; // Low confidence = -30% damage
    
    // Stress reduces accuracy and damage
    if (attackerMental.stress > 70) modifier -= 0.25; // High stress = -25% performance
    else if (attackerMental.stress < 30) modifier += 0.1; // Low stress = +10% performance
    
    // Mental health affects overall combat ability
    if (attackerMental.currentMentalHealth < 50) {
      modifier -= (50 - attackerMental.currentMentalHealth) * 0.01; // -1% per point below 50
    }
    
    // Battle focus affects precision
    if (attackerMental.battleFocus > 80) modifier += 0.15; // Sharp focus = +15% damage
    else if (attackerMental.battleFocus < 40) modifier -= 0.2; // Poor focus = -20% damage
    
    // Team trust affects performance when fighting alongside teammates
    const teamMorale = battleState.globalMorale.player;
    if (teamMorale > 70 && attackerMental.teamTrust > 70) {
      modifier += 0.1; // Good team synergy = +10% damage
    } else if (teamMorale < 40 || attackerMental.teamTrust < 30) {
      modifier -= 0.15; // Poor team dynamics = -15% damage
    }
    
    // RELATIONSHIP MODIFIERS
    const relationship = attacker.relationshipModifiers.find(
      rel => rel.withCharacter === target.character.name.toLowerCase().replace(/\s+/g, '_')
    );
    
    if (relationship) {
      switch (relationship.relationship) {
        case 'enemy':
          modifier += 0.1; // Fighting enemies is motivating
          break;
        case 'rival':
          modifier += 0.05; // Slight boost from competition
          break;
        case 'ally':
          // This is problematic - reluctant to hurt allies
          if (attacker.character.id !== target.character.id) { // Friendly fire
            modifier -= 0.4; // Huge penalty for attacking allies
          }
          break;
      }
    }
    
    // Ensure modifier stays within reasonable bounds
    return Math.max(0.1, Math.min(2.0, modifier));
  }
  
  // ============= PHYSICAL COMBAT SUPPORT METHODS =============
  
  static calculateWeaponCompatibility(attacker: BattleCharacter, weapon: { type?: string; attributes?: string[] }): number {
    // Check if weapon is preferred for this character archetype
    const archetype = attacker.character.archetype;
    const weaponType = weapon.type;
    
    // If weapon has no type, return neutral (no bonus/penalty)
    if (!weaponType) return 0;
    
    // This would be based on equipment system data
    const compatibilityMap: Record<string, string[]> = {
      'warrior': ['sword', 'hammer', 'spear', 'shield'],
      'mage': ['staff', 'orb', 'tome'],
      'assassin': ['dagger', 'bow', 'knife'],
      'trickster': ['whip', 'claws', 'sonic'],
      'detective': ['cane', 'revolver', 'magnifying_glass']
    };
    
    const preferredWeapons = compatibilityMap[archetype] || [];
    const isCompatible = preferredWeapons.includes(weaponType);
    
    return isCompatible ? 10 : 0; // Bonus for compatible weapons, neutral for others
  }
  
  static calculateStatusEffects(
    attacker: BattleCharacter,
    target: BattleCharacter,
    action: ExecutedAction,
    damage: number
  ): string[] {
    const effects: string[] = [];
    
    // Critical hits can cause status effects
    if (this.wasCriticalHit(attacker, 1.0)) {
      effects.push('stunned'); // Critical hits stun
    }
    
    // High damage can cause injuries
    if (damage > target.character.combatStats.maxHealth * 0.3) {
      effects.push('injured');
    }
    
    // Psychological effects from taking damage
    if (damage > target.character.combatStats.maxHealth * 0.5) {
      // Major damage affects mental state
      target.mentalState.confidence = Math.max(0, target.mentalState.confidence - 15);
      target.mentalState.stress = Math.min(100, target.mentalState.stress + 20);
      effects.push('shaken');
    }
    
    return effects;
  }
  
  static checkCounterAttack(
    target: BattleCharacter,
    attacker: BattleCharacter,
    damageTaken: number
  ): boolean {
    // Only if target is still alive and has good reflexes
    if (target.currentHealth <= 0) return false;
    
    const speed = target.character.combatStats.speed;
    const mentalFocus = target.mentalState.battleFocus;
    
    // Psychology affects counter-attack chance
    const baseChance = speed * 0.001; // Base chance from speed
    const psychologyBonus = mentalFocus * 0.0005; // Focus improves reaction
    const damageBonus = damageTaken > 50 ? 0.1 : 0; // Desperation counter
    
    const totalChance = baseChance + psychologyBonus + damageBonus;
    
    return Math.random() < totalChance;
  }
  
  static wasCriticalHit(attacker: BattleCharacter, psychologyModifier: number): boolean {
    const baseCritChance = attacker.character.combatStats.criticalChance || 0.05;
    
    // Psychology affects crit chance
    const mentalBonus = attacker.mentalState.battleFocus > 80 ? 0.02 : 0;
    const confidenceBonus = attacker.mentalState.confidence > 75 ? 0.01 : 0;
    
    const totalCritChance = baseCritChance + mentalBonus + confidenceBonus;
    
    return Math.random() < totalCritChance;
  }
  
  static generatePhysicalCombatNarrative(
    attacker: BattleCharacter,
    target: BattleCharacter,
    action: ExecutedAction,
    damage: number,
    psychologyModifier: number
  ): string {
    const attackerName = attacker.character.name;
    const targetName = target.character.name;
    
    let narrative = '';
    
    // Base action narrative
    switch (action.type) {
      case 'basic_attack':
        narrative = `${attackerName} strikes ${targetName} with their weapon`;
        break;
      case 'ability':
        narrative = `${attackerName} uses a special ability against ${targetName}`;
        break;
      default:
        narrative = `${attackerName} attacks ${targetName}`;
    }
    
    // Add psychology effects to narrative
    if (psychologyModifier > 1.2) {
      narrative += ', fighting with exceptional determination';
    } else if (psychologyModifier < 0.8) {
      narrative += ', but their strikes lack conviction';
    }
    
    // Add damage result
    if (damage > target.character.combatStats.maxHealth * 0.4) {
      narrative += `, dealing devastating damage (${damage})!`;
    } else if (damage > target.character.combatStats.maxHealth * 0.2) {
      narrative += `, landing a solid hit (${damage})!`;
    } else {
      narrative += `, but the attack is largely deflected (${damage}).`;
    }
    
    return narrative;
  }
  
  static generateAudienceReaction(damage: number, healthChange: number): string {
    if (healthChange <= 0) return "The crowd holds its breath...";
    
    if (damage > 100) return "The crowd erupts in amazement at the devastating blow!";
    if (damage > 50) return "The audience cheers at the powerful strike!";
    if (damage > 20) return "The crowd murmurs appreciatively.";
    return "The audience watches intently...";
  }
  
  // ============= GAMEPLAN ADHERENCE CHECK - PSYCHOLOGY AFFECTS FOLLOWING STRATEGY =============
  
  static performGameplanAdherenceCheck(character: BattleCharacter, plannedAction?: PlannedAction): GameplanAdherenceCheck {
    // This is WHERE psychology matters - will they follow the coach's strategy?
    const baseAdherence = character.gameplanAdherence;
    const mentalHealthModifier = (character.mentalState.currentMentalHealth - 50) * 0.5;
    const teamChemistryModifier = (character.mentalState.teamTrust - 50) * 0.3;
    const stressModifier = -character.mentalState.stress * 0.4;
    
    // Relationship modifiers
    let relationshipModifier = 0;
    character.relationshipModifiers.forEach(rel => {
      if (rel.relationship === 'enemy' && rel.strength < -50) {
        relationshipModifier -= 20; // Presence of enemies affects focus
      } else if (rel.relationship === 'ally' && rel.strength > 50) {
        relationshipModifier += 10; // Presence of allies increases trust in strategy
      }
    });

    const finalAdherence = Math.max(0, Math.min(100, 
      baseAdherence + mentalHealthModifier + teamChemistryModifier + stressModifier + relationshipModifier
    ));

    // Determine result
    let checkResult: 'follows_strategy' | 'slight_deviation' | 'improvises' | 'goes_rogue';
    if (finalAdherence >= 80) checkResult = 'follows_strategy';
    else if (finalAdherence >= 60) checkResult = 'slight_deviation';
    else if (finalAdherence >= 30) checkResult = 'improvises';
    else checkResult = 'goes_rogue';

    let reasoning = `${character.character.name} `;
    if (checkResult === 'follows_strategy') reasoning += "follows the coach's strategy precisely.";
    else if (checkResult === 'slight_deviation') reasoning += "mostly follows the plan with minor adjustments.";
    else if (checkResult === 'improvises') reasoning += "adapts the strategy based on their assessment.";
    else reasoning += "completely ignores the gameplan and acts independently.";

    if (character.mentalState.stress > 70) reasoning += " High stress is affecting their decision-making.";
    if (character.mentalState.currentMentalHealth < 40) reasoning += " Poor mental health clouds their judgment.";

    return {
      baseAdherence,
      mentalHealthModifier,
      teamChemistryModifier,
      relationshipModifier,
      stressModifier,
      finalAdherence,
      checkResult,
      reasoning
    };
  }
  
  
  // ============= INTEGRATION WITH EXISTING BATTLE FLOW =============
  
  static executeRound(battleState: BattleState, playerActions: Record<string, PlannedAction>): CombatRound {
    const round: CombatRound = {
      roundNumber: ++battleState.currentRound,
      initiative: this.calculateInitiative(battleState, playerActions),
      actions: [],
      moraleEvents: [],
      rogueActions: [],
      roundOutcome: {
        winner: 'draw',
        keyEvents: [],
        moraleShift: {},
        strategicAdvantages: [],
        unexpectedDevelopments: [],
        judgeCommentary: ''
      },
      teamMoraleChanges: []
    };

    // Execute actions in initiative order
    for (const initiativeEntry of round.initiative) {
      const action = this.executeCharacterAction(
        battleState, 
        initiativeEntry, 
        round
      );
      
      round.actions.push(action);
      
      // Apply physical combat results
      this.applyPhysicalCombatResults(action, battleState);
      
      // Check for morale events
      const moraleEvents = this.checkForMoraleEvents(action, battleState);
      round.moraleEvents.push(...moraleEvents);
    }

    return round;
  }
  
  static executeCharacterAction(
    battleState: BattleState, 
    initiativeEntry: { characterId: string; team: 'player' | 'opponent'; speed: number; plannedAction?: PlannedAction }, 
    round: CombatRound
  ): CombatAction {
    const character = this.findCharacter(battleState, initiativeEntry.characterId);
    if (!character) {
      throw new Error(`Character ${initiativeEntry.characterId} not found`);
    }

    // Check if character will follow strategy (psychology affects gameplan compliance)
    const gameplanCheck = this.performGameplanAdherenceCheck(character, initiativeEntry.plannedAction);
    
    let actualAction: ExecutedAction;
    let actionType: 'planned' | 'improvised' | 'panicked' | 'inspired' = 'planned';

    if (gameplanCheck.checkResult === 'follows_strategy') {
      // Character follows the coach's plan exactly
      actualAction = this.convertPlannedToExecuted(initiativeEntry.plannedAction);
    } else {
      // Character improvises - but this affects STRATEGY, not combat mechanics
      actionType = 'improvised';
      actualAction = this.generateImprovisedAction(character, gameplanCheck, battleState);
    }

    // Find target
    const target = this.findTarget(actualAction, battleState);
    
    // Execute PHYSICAL combat
    const outcome = target ? 
      this.executePhysicalAction(character, target, actualAction, battleState) :
      this.executeNonCombatAction(character, actualAction, battleState);

    return {
      characterId: character.character.id,
      actionType,
      originalPlan: initiativeEntry.plannedAction,
      actualAction,
      gameplanCheck,
      psychologyFactors: [],
      outcome
    };
  }
  
  // ============= UTILITY METHODS =============
  
  static findCharacter(battleState: BattleState, characterId: string): BattleCharacter | null {
    const playerChar = battleState.teams.player.characters.find(char => char.character.id === characterId);
    if (playerChar) return playerChar;
    
    const opponentChar = battleState.teams.opponent.characters.find(char => char.character.id === characterId);
    return opponentChar || null;
  }
  
  static findTarget(action: ExecutedAction, battleState: BattleState): BattleCharacter | null {
    if (!action.targetId) return null;
    return this.findCharacter(battleState, action.targetId);
  }
  
  static convertPlannedToExecuted(planned?: PlannedAction): ExecutedAction {
    if (!planned) {
      return {
        type: 'basic_attack',
        narrativeDescription: 'Performs a basic attack'
      };
    }
    
    return {
      type: planned.type,
      targetId: planned.targetId,
      abilityId: planned.abilityId,
      narrativeDescription: `Executes planned ${planned.type}`
    };
  }
  
  static generateImprovisedAction(
    character: BattleCharacter, 
    gameplanCheck: GameplanAdherenceCheck, 
    battleState: BattleState
  ): ExecutedAction {
    // Improvised actions are about strategy adaptation, not magical psychology
    
    if (character.mentalState.stress > 80) {
      return {
        type: 'flee',
        narrativeDescription: `${character.character.name} panics and tries to retreat!`
      };
    }
    
    if (character.mentalState.currentMentalHealth < 30) {
      return {
        type: 'basic_attack',
        targetId: this.findRandomEnemy(character, battleState)?.character.id,
        narrativeDescription: `${character.character.name} attacks wildly in a berserker rage!`
      };
    }
    
    return {
      type: 'defend',
      narrativeDescription: `${character.character.name} ignores the gameplan and plays defensively.`
    };
  }
  
  private static findRandomEnemy(character: BattleCharacter, battleState: BattleState): BattleCharacter | null {
    const enemyTeam = battleState.teams.player.characters.includes(character) 
      ? battleState.teams.opponent 
      : battleState.teams.player;
    
    const enemies = enemyTeam.characters.filter(char => char.currentHealth > 0);
    return enemies.length > 0 ? enemies[Math.floor(Math.random() * enemies.length)] : null;
  }
  
  private static calculateInitiative(battleState: BattleState, playerActions: Record<string, PlannedAction>) {
    const allCharacters = [
      ...battleState.teams.player.characters.map(char => ({ ...char, team: 'player' as const })),
      ...battleState.teams.opponent.characters.map(char => ({ ...char, team: 'opponent' as const }))
    ];

    return allCharacters
      .filter(char => char.currentHealth > 0)
      .map(char => {
        const baseSpeed = char.character.combatStats.speed;
        // Psychology affects initiative through stress/focus
        const mentalSpeedModifier = this.calculateMentalSpeedModifiers(char);
        const finalSpeed = baseSpeed + mentalSpeedModifier;
        
        return {
          characterId: char.character.id,
          team: char.team,
          speed: finalSpeed,
          mentalModifiers: mentalSpeedModifier,
          gameplanAdherence: char.gameplanAdherence,
          plannedAction: playerActions[char.character.id]
        };
      })
      .sort((a, b) => b.speed - a.speed);
  }
  
  private static calculateMentalSpeedModifiers(character: BattleCharacter): number {
    let modifier = 0;
    
    // Psychology affects reaction time and initiative
    modifier -= character.mentalState.stress * 0.2; // Stress slows you down
    modifier += (character.mentalState.confidence - 50) * 0.1; // Confidence speeds you up
    modifier += (character.mentalState.battleFocus - 50) * 0.15; // Focus affects reaction time
    
    return Math.floor(modifier);
  }
  
  private static applyPhysicalCombatResults(action: CombatAction, battleState: BattleState): void {
    // Physical combat results are already applied in executePhysicalAction
    // This can handle additional effects like status conditions, team morale changes, etc.
  }
  
  private static checkForMoraleEvents(action: CombatAction, battleState: BattleState): MoraleEvent[] {
    const events: MoraleEvent[] = [];
    
    // Check if someone was defeated
    const target = this.findTarget(action.actualAction, battleState);
    if (target && target.currentHealth <= 0) {
      events.push({
        eventType: 'ally_down',
        description: `${target.character.name} has been defeated!`,
        moraleImpact: -20,
        affectedTeam: 'player', // This would be determined by which team the target is on
        triggeringCharacter: action.characterId,
        cascadeEffects: []
      });
    }
    
    return events;
  }
  
  private static executeNonCombatAction(
    character: BattleCharacter, 
    action: ExecutedAction, 
    battleState: BattleState
  ): PhysicalActionOutcome {
    // Handle non-combat actions like defend, flee, etc.
    return {
      success: true,
      damage: 0,
      effects: [],
      narrativeDescription: action.narrativeDescription,
      audienceReaction: "The crowd watches the defensive maneuver...",
      physicalDamage: {
        baseDamage: 0,
        weaponDamage: 0,
        strengthBonus: 0,
        armorReduction: 0,
        psychologyModifier: 1,
        finalDamage: 0,
        damageBreakdown: ['No damage - defensive action']
      },
      healthChange: 0,
      armorDamage: 0,
      statusEffectsApplied: [],
      counterAttackTriggered: false
    };
  }
}

export default PhysicalBattleEngine;