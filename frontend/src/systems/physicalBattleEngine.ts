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
}

export class PhysicalBattleEngine {
  
  // ============= PHYSICAL COMBAT CORE =============
  
  static executePhysicalAction(
    attacker: BattleCharacter,
    target: BattleCharacter,
    action: ExecutedAction,
    battleState: BattleState
  ): PhysicalActionOutcome {
    
    // SAFETY: Null pointer protection
    if (!attacker || !target || !action || !battleState) {
      throw new Error('Invalid parameters for physical action execution');
    }
    
    // 1. Calculate Base Physical Damage
    const baseDamage = this.calculateBaseDamage(attacker, action);
    
    // 2. Apply Weapon Stats
    const weaponDamage = this.calculateWeaponDamage(attacker, action);
    
    // 3. Apply Physical Stats (Strength, etc.)
    const strengthBonus = this.calculateStrengthBonus(attacker);
    
    // 4. Calculate Armor Defense
    const armorReduction = this.calculateArmorDefense(target);
    
    // 5. PSYCHOLOGY MODIFIER - This is where psychology affects combat
    const psychologyModifier = this.calculatePsychologyModifier(attacker, target, battleState);
    
    // 6. Final Damage Calculation with BOUNDS CHECKING
    const rawDamage = (baseDamage + weaponDamage + strengthBonus - armorReduction) * psychologyModifier;
    // BOUNDS CHECK: Cap damage between 1 and 9999
    const totalDamage = Math.max(1, Math.min(9999, Math.floor(rawDamage)));
    
    // 7. Apply Damage to Target with safety checks
    // BOUNDS CHECK: Ensure valid health values
    const currentHealth = Math.max(0, Math.min(99999, target?.currentHealth || 0));
    const newHealth = Math.max(0, currentHealth - totalDamage);
    const healthChange = Math.min(currentHealth, totalDamage); // Can't lose more health than you have
    if (target) {
      target.currentHealth = newHealth;
    }
    
    // 8. Check for Status Effects
    const statusEffects = this.calculateStatusEffects(attacker, target, action, totalDamage);
    
    // 9. Check for Counter Attacks
    const counterAttack = this.checkCounterAttack(target, attacker, totalDamage);
    
    const damageBreakdown = [
      `Base: ${baseDamage}`,
      `Weapon: +${weaponDamage}`,
      `Strength: +${strengthBonus}`,
      `Armor: -${armorReduction}`,
      `Psychology: ×${psychologyModifier.toFixed(2)}`
    ];
    
    return {
      success: totalDamage > 0,
      damage: totalDamage,
      effects: [],
      criticalResult: this.wasCriticalHit(attacker, psychologyModifier),
      narrativeDescription: this.generatePhysicalCombatNarrative(
        attacker, target, action, totalDamage, psychologyModifier
      ),
      audienceReaction: this.generateAudienceReaction(totalDamage, healthChange),
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
      counterAttackTriggered: counterAttack
    };
  }
  
  // ============= DAMAGE CALCULATION METHODS =============
  
  static calculateBaseDamage(attacker: BattleCharacter, action: ExecutedAction): number {
    // BOUNDS CHECK: Ensure attacker and stats exist
    if (!attacker?.character?.combatStats) {
      console.warn('Invalid attacker or missing combat stats');
      return 0;
    }
    
    // BOUNDS CHECK: Ensure attack stat is valid
    const baseAttack = Math.max(0, Math.min(9999, attacker.character.combatStats.attack || 0));
    
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
    const weapon = attacker?.character?.equipment?.weapon;
    if (!weapon) return 0;
    
    // BOUNDS CHECK: Cap weapon attack value
    const weaponAttack = Math.max(0, Math.min(999, weapon.stats?.atk || 0));
    
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
    // BOUNDS CHECK: Ensure valid defense stat
    const baseDefense = Math.max(0, Math.min(999, target?.character?.combatStats?.defense || 0));
    
    // Get equipped armor stats
    const armor = target?.character?.equipment?.armor;
    // BOUNDS CHECK: Cap armor defense value
    const armorDefense = Math.max(0, Math.min(999, armor?.stats?.def || 0));
    
    // BOUNDS CHECK: Cap total defense
    return Math.max(0, Math.min(999, baseDefense + armorDefense));
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
  
  static calculateWeaponCompatibility(attacker: BattleCharacter, weapon: { type: string; attributes?: string[] }): number {
    // Check if weapon is preferred for this character archetype
    const archetype = attacker.character.archetype;
    
    // This would be based on equipment system data
    const compatibilityMap: Record<string, string[]> = {
      'warrior': ['sword', 'hammer', 'spear', 'shield'],
      'mage': ['staff', 'orb', 'tome'],
      'assassin': ['dagger', 'bow', 'knife'],
      'trickster': ['whip', 'claws', 'sonic'],
      'detective': ['cane', 'revolver', 'magnifying_glass']
    };
    
    const preferredWeapons = compatibilityMap[archetype] || [];
    const isCompatible = preferredWeapons.includes(weapon.type);
    
    return isCompatible ? 10 : -5; // Bonus for compatible weapons, penalty for incompatible
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
  
  // Legacy compatibility method
  static performGameplanAdherenceCheck(character: BattleCharacter, plannedAction?: PlannedAction): GameplanAdherenceCheck {
    return this.performGameplanAdherenceCheck(character, plannedAction);
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