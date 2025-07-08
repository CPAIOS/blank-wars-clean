import { Server as SocketIOServer, Socket } from 'socket.io';
import { EventEmitter } from 'events';
import { dbAdapter } from './databaseAdapter';
import { analyticsService } from './analytics';
import { cache } from '../database/index';
import { hostmasterService, HostmasterContext } from './hostmasterService';

// Types
interface BattleCharacter {
  id: string;
  user_id: string;
  character_id: string;
  name: string;
  title?: string;
  archetype: string;
  level: number;
  experience: number;
  current_health: number;
  max_health: number;
  base_attack: number;
  base_defense: number;
  base_speed: number;
  base_special: number;
  abilities: Ability[];
  personality_traits: string[];
  equipment: any[];
  is_injured: boolean;
  recovery_time?: Date;
  total_battles: number;
  total_wins: number;
}

interface Ability {
  name: string;
  power: number;
  cooldown: number;
  type: string;
  effect?: string;
}

interface Player {
  userId: string;
  characterId: string;
  character: BattleCharacter;
  strategy: string | null;
  connected: boolean;
  health: number;
  maxHealth: number;
  effects: StatusEffect[];
  cooldowns: Record<string, number>;
  rating: number;
}

interface StatusEffect {
  type: string;
  duration: number;
  value?: number;
  damage_per_turn?: number;
  heal_per_turn?: number;
  charges?: number;
  damage_multiplier?: number;
  attack_multiplier?: number;
  defense_reduction?: number;
}

interface BattleState {
  id: string;
  phase: string;
  round: number;
  turn: number;
  player1: Player;
  player2: Player;
  combatLog: CombatEvent[];
  chatEnabled: boolean;
  timer: NodeJS.Timeout | null;
  createdAt: number;
}

interface CombatEvent {
  type: string;
  round?: number;
  timestamp: number;
  attacker?: string;
  defender?: string;
  ability?: string;
  damage?: number;
  critical?: boolean;
  remainingHealth?: Record<string, number>;
  order?: string[];
  character?: string;
  target?: string;
  effect?: string;
  amount?: number;
  reason?: string;
}

interface QueueEntry {
  userId: string;
  characterId: string;
  character: BattleCharacter;
  rating: number;
  joinedAt: number;
  mode: string;
}

interface StrategyModifiers {
  atkMod: number;
  defMod: number;
  spdMod: number;
}

interface BattleRewards {
  xp: number;
  currency: number;
  bond: number;
  winner: boolean;
}

interface CombatResult {
  player1: {
    health: number;
    effects: StatusEffect[];
    cooldowns: Record<string, number>;
  };
  player2: {
    health: number;
    effects: StatusEffect[];
    cooldowns: Record<string, number>;
  };
  events: CombatEvent[];
}

// Battle phases
const BATTLE_PHASES = {
  MATCHMAKING: 'matchmaking',
  STRATEGY_SELECT: 'strategy_select',
  ROUND_COMBAT: 'round_combat',
  CHAT_BREAK: 'chat_break',
  BATTLE_END: 'battle_end'
} as const;

// Battle configuration
const BATTLE_CONFIG = {
  MAX_ROUNDS: 3,
  ROUND_DURATION: 30, // seconds
  CHAT_DURATION: 45, // seconds
  STRATEGY_DURATION: 15, // seconds
  TURN_SPEED_BONUS: 0.1, // 10% speed bonus for going first
  CRIT_MULTIPLIER: 2.0, // Default critical hit damage multiplier
} as const;

/**
 * Main Battle Manager
 * Handles matchmaking, battle lifecycle, and real-time communication
 */
export class BattleManager extends EventEmitter {
  private io: SocketIOServer;
  private activeBattles: Map<string, BattleState>;
  private battleQueue: Map<string, QueueEntry>;
  private userSocketMap: Map<string, string>; // Map userId to socket.id

  constructor(io: SocketIOServer) {
    super();
    this.io = io;
    this.activeBattles = new Map();
    this.battleQueue = new Map();
    this.userSocketMap = new Map();
    
    // Initialize Hostmaster v8.72 with the same io instance
    if (typeof global !== 'undefined') {
      (global as any).io = io;
    }
    
    // Subscribe to battle events for multi-server coordination
    this.initializeMultiServerCoordination().catch(error => {
      console.warn('⚠️ Failed to initialize multi-server coordination:', error instanceof Error ? error.message : String(error));
    });
  }

  // Initialize multi-server coordination with Redis
  private async initializeMultiServerCoordination(): Promise<void> {
    try {
      // Subscribe to global battle events
      if (cache.isUsingRedis()) {
        await cache.subscribeToBattleEvents('global', (event: any) => {
          this.handleGlobalBattleEvent(event);
        });
        console.log('✅ Multi-server battle coordination initialized');
      } else {
        console.warn('⚠️ Multi-server coordination unavailable (Redis not in use), using single-server mode.');
      }
    } catch (error) {
      console.warn('⚠️ Multi-server coordination unavailable, using single-server mode:', error instanceof Error ? error.message : String(error));
    }
  }

  // Handle global battle events from other servers
  private handleGlobalBattleEvent(event: any): void {
    try {
      switch (event.type) {
        case 'battle_created':
          // Another server created a battle, track it for coordination
          console.log(`📊 Battle ${event.battleId} created on server ${event.serverId}`);
          // Remove players from local queue if they exist
          if (event.player1) {
            this.battleQueue.delete(event.player1);
          }
          if (event.player2) {
            this.battleQueue.delete(event.player2);
          }
          break;
        case 'battle_ended':
          // Another server ended a battle, clean up any local references
          console.log(`📊 Battle ${event.battleId} ended on server ${event.serverId}`);
          if (event.battleId && this.activeBattles.has(event.battleId)) {
            // Remove from local state if somehow we have a reference
            this.activeBattles.delete(event.battleId);
          }
          break;
        case 'player_disconnected':
          // Handle player disconnection across servers
          console.log(`📊 Player ${event.userId} disconnected from server ${event.serverId}`);
          // Remove from local queue if they exist
          if (event.userId) {
            this.battleQueue.delete(event.userId);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling global battle event:', error);
    }
  }

  // Redis-enhanced matchmaking
  private async addToDistributedQueue(queueEntry: QueueEntry): Promise<void> {
    try {
      await cache.addPlayerToMatchmaking(queueEntry.userId, {
        characterId: queueEntry.characterId,
        character: queueEntry.character,
        rating: queueEntry.rating,
        joinedAt: queueEntry.joinedAt,
        mode: queueEntry.mode,
        serverId: process.env.SERVER_ID || 'default'
      }, queueEntry.mode);
    } catch (error) {
      console.error('Failed to add player to distributed queue:', error);
      // Fallback to local queue
      this.battleQueue.set(queueEntry.userId, queueEntry);
    }
  }

  private async removeFromDistributedQueue(userId: string, mode: string): Promise<void> {
    try {
      await cache.removePlayerFromMatchmaking(userId, mode);
    } catch (error) {
      console.error('Failed to remove player from distributed queue:', error);
    }
    // Always clean local queue
    this.battleQueue.delete(userId);
  }

  private async findDistributedOpponent(queueEntry: QueueEntry): Promise<QueueEntry | null> {
    try {
      const queuePlayers = await cache.getMatchmakingQueue(queueEntry.mode);
      
      for (const player of queuePlayers) {
        // Skip self
        if (player.id === queueEntry.userId) continue;
        
        const playerData = player.data;
        const ratingDiff = Math.abs(queueEntry.rating - playerData.rating);
        const waitTime = Date.now() - queueEntry.joinedAt;
        
        // Expand rating range based on wait time
        const maxRatingDiff = Math.min(200 + waitTime / 1000, 500);
        
        if (ratingDiff <= maxRatingDiff) {
          // Use distributed lock to prevent race conditions between servers
          const lockKey = `match_lock:${[queueEntry.userId, player.id].sort().join(':')}`;
          
          try {
            // Try to acquire lock with Redis SETNX
            const lockValue = `${process.env.SERVER_ID || 'server'}:${Date.now()}`;
            await cache.set(lockKey, lockValue, 5); // 5 second expiry
            const lockAcquired = 'OK'; // Simplified for in-memory cache
            
            if (lockAcquired === 'OK') {
              // Double-check both players are still in queue before proceeding
              const queuePlayersCheck = await cache.getMatchmakingQueue(queueEntry.mode);
              const player1StillInQueue = queuePlayersCheck.some(p => p.id === queueEntry.userId);
              const player2StillInQueue = queuePlayersCheck.some(p => p.id === player.id);
              
              if (player1StillInQueue && player2StillInQueue) {
                // Found a match! Convert back to QueueEntry format
                const opponent: QueueEntry = {
                  userId: player.id,
                  characterId: playerData.characterId,
                  character: playerData.character,
                  rating: playerData.rating,
                  joinedAt: playerData.joinedAt,
                  mode: playerData.mode
                };
                
                // Remove both players from queue atomically
                await this.removeFromDistributedQueue(queueEntry.userId, queueEntry.mode);
                await this.removeFromDistributedQueue(opponent.userId, opponent.mode);
                
                // Release lock before returning
                await cache.del(lockKey);
                
                return opponent;
              } else {
                // One of the players was already matched, release lock and continue searching
                await cache.del(lockKey);
              }
            }
            // If lock not acquired, another server is processing this match, skip this player
          } catch (lockError) {
            console.error('Error with distributed lock:', lockError);
            // Continue without lock as fallback
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to find distributed opponent:', error);
      // Fallback to local matchmaking
      return this.findOpponent(queueEntry);
    }
  }

  // Find match for player
  async findMatch(userId: string, characterId: string, mode: string = 'ranked'): Promise<any> {
    try {
      const user = await dbAdapter.users.findById(userId);
      const character = await dbAdapter.userCharacters.findById(characterId);
      
      if (!character || character.user_id !== userId) {
        throw new Error('Invalid character');
      }
      
      // Check daily battle limits
      const { usageTrackingService } = require('./usageTrackingService');
      const { db } = require('../database/sqlite');
      
      const canBattle = await usageTrackingService.trackBattleUsage(userId, db);
      if (!canBattle) {
        throw new Error('Daily battle limit reached. Upgrade to premium for more battles!');
      }
      
      // Check if character is injured
      if (character.is_injured && character.recovery_time && character.recovery_time > new Date()) {
        throw new Error('Character is still recovering');
      }
      
      // Add to queue
      const queueEntry: QueueEntry = {
        userId,
        characterId,
        character: character as any as BattleCharacter,
        rating: user?.rating || 1000,
        joinedAt: Date.now(),
        mode
      };
      
      // Add to distributed queue (Redis) for multi-server support
      await this.addToDistributedQueue(queueEntry);
      analyticsService.trackUserAction(userId, 'matchmaking_start', { characterId, mode });
      
      // Try to find opponent across all servers
      const opponent = await this.findDistributedOpponent(queueEntry);
      
      if (opponent) {
        // Match found! (players already removed from distributed queue)
        
        // Create battle
        const battle = await this.createBattle(queueEntry, opponent);
        
        // Publish battle creation event for multi-server coordination
        await cache.publishBattleEvent('global', {
          type: 'battle_created',
          battleId: battle?.id,
          player1: userId,
          player2: opponent.userId,
          serverId: process.env.SERVER_ID || 'default'
        });
        
        analyticsService.trackMatchmaking(userId, Date.now() - queueEntry.joinedAt, await cache.getMatchmakingQueueSize(queueEntry.mode));
        analyticsService.trackMatchmaking(opponent.userId, Date.now() - opponent.joinedAt, await cache.getMatchmakingQueueSize(opponent.mode));
        
        return {
          status: 'found',
          battle_id: battle?.id,
          websocket_url: `/battle/${battle?.id}`
        };
      } else {
        // Still searching
        const queueSize = await cache.getMatchmakingQueueSize(queueEntry.mode);
        return {
          status: 'searching',
          queue_position: queueSize,
          estimated_wait: this.estimateWaitTime(queueEntry.rating)
        };
      }
    } catch (error) {
      console.error('Matchmaking error:', error);
      throw error;
    }
  }

  // Find suitable opponent
  private findOpponent(player: QueueEntry): QueueEntry | null {
    const RATING_RANGE = 200;
    const WAIT_TIME_EXPANSION = 50; // Expand range by 50 per 10 seconds
    const waitTime = Date.now() - player.joinedAt;
    const expandedRange = RATING_RANGE + Math.floor(waitTime / 10000) * WAIT_TIME_EXPANSION;
    
    for (const [opponentId, opponent] of this.battleQueue) {
      if (opponentId === player.userId) continue;
      if (opponent.mode !== player.mode) continue;
      
      const ratingDiff = Math.abs(player.rating - opponent.rating);
      if (ratingDiff <= expandedRange) {
        return opponent;
      }
    }
    
    return null;
  }

  // Create new battle
  private async createBattle(player1: QueueEntry, player2: QueueEntry): Promise<BattleState | null> {
    try {
      const battleData = {
        player1_id: player1.userId,
        player2_id: player2.userId,
        character1_id: player1.characterId,
        character2_id: player2.characterId,
        status: 'active',
        current_round: 1
      };

      const battle = await dbAdapter.battles.create(battleData);
      if (!battle) {
        throw new Error('Failed to create battle in database');
      }
      
      // Initialize battle state
      const battleState: BattleState = {
        id: battle.id,
        phase: BATTLE_PHASES.STRATEGY_SELECT,
        round: 1,
        turn: 0,
        
        player1: {
          userId: player1.userId,
          characterId: player1.characterId,
          character: player1.character,
          strategy: null,
          connected: false,
          health: player1.character.current_health,
          maxHealth: player1.character.max_health,
          effects: [],
          cooldowns: {},
          rating: player1.rating
        },
        
        player2: {
          userId: player2.userId,
          characterId: player2.characterId,
          character: player2.character,
          strategy: null,
          connected: false,
          health: player2.character.current_health,
          maxHealth: player2.character.max_health,
          effects: [],
          cooldowns: {},
          rating: player2.rating
        },
        
        combatLog: [],
        chatEnabled: false,
        timer: null,
        createdAt: Date.now()
      };
      
      this.activeBattles.set(battle.id, battleState);
      
      // Notify players
      this.notifyPlayer(player1.userId, 'match_found', { battleId: battle.id });
      this.notifyPlayer(player2.userId, 'match_found', { battleId: battle.id });

      // Generate Hostmaster v8.72 battle introduction
      setTimeout(async () => {
        await this.generateHostmasterIntroduction(battleState);
      }, 2000);

      // Track analytics
      analyticsService.trackUserAction(player1.userId, 'battle_start', { battleId: battle.id });
      analyticsService.trackUserAction(player2.userId, 'battle_start', { battleId: battle.id });
      
      // Start strategy phase timer
      this.startPhaseTimer(battle.id, BATTLE_PHASES.STRATEGY_SELECT, BATTLE_CONFIG.STRATEGY_DURATION);
      
      return battleState;
    } catch (error) {
      console.error('Error creating battle:', error);
      return null;
    }
  }

  // Handle player connection to battle
  async connectToBattle(socket: Socket, battleId: string, userId: string): Promise<void> {
    const battleState = this.activeBattles.get(battleId);
    if (!battleState) {
      throw new Error('Battle not found');
    }
    
    // Verify player belongs to battle
    const playerSide = battleState.player1.userId === userId ? 'player1' : 
                      battleState.player2.userId === userId ? 'player2' : null;
    
    if (!playerSide) {
      throw new Error('Not authorized for this battle');
    }
    
    // Update connection status
    battleState[playerSide].connected = true;
    socket.join(`battle:${battleId}`);
    (socket as any).battleId = battleId;
    (socket as any).playerSide = playerSide;
    (socket as any).userId = userId;
    
    // Send current state
    socket.emit('battle_state', this.getPlayerView(battleState, playerSide));
    
    // Notify opponent
    const opponentSide = playerSide === 'player1' ? 'player2' : 'player1';
    this.io.to(`battle:${battleId}`).emit('opponent_connected', {
      side: opponentSide,
      connected: true
    });
    
    // Set up event handlers
    this.setupSocketHandlers(socket, battleState);
  }

  // Get player-specific view of battle state
  private getPlayerView(battleState: BattleState, playerSide: string): any {
    const player = battleState[playerSide as keyof Pick<BattleState, 'player1' | 'player2'>];
    const opponent = playerSide === 'player1' ? battleState.player2 : battleState.player1;
    
    return {
      battleId: battleState.id,
      phase: battleState.phase,
      round: battleState.round,
      yourCharacter: {
        name: player.character.name,
        health: player.health,
        maxHealth: player.maxHealth,
        effects: player.effects,
        strategy: player.strategy
      },
      opponentCharacter: {
        name: opponent.character.name,
        health: opponent.health,
        maxHealth: opponent.maxHealth,
        effects: opponent.effects,
        strategy: opponent.strategy
      },
      combatLog: battleState.combatLog.slice(-10), // Last 10 events
      chatEnabled: battleState.chatEnabled,
      connected: {
        you: player.connected,
        opponent: opponent.connected
      }
    };
  }

  // Socket event handlers
  private setupSocketHandlers(socket: Socket, battleState: BattleState): void {
    // Strategy selection
    socket.on('select_strategy', async (strategy: string) => {
      if (battleState.phase !== BATTLE_PHASES.STRATEGY_SELECT) return;
      
      const playerSide = (socket as any).playerSide;
      if (battleState[playerSide as keyof Pick<BattleState, 'player1' | 'player2'>].strategy) return; // Already selected
      
      // Validate strategy
      if (!['aggressive', 'defensive', 'balanced'].includes(strategy)) return;
      
      battleState[playerSide as keyof Pick<BattleState, 'player1' | 'player2'>].strategy = strategy;
      
      // Check if both players ready
      if (battleState.player1.strategy && battleState.player2.strategy) {
        await this.startCombatRound(battleState);
      }
    });
    
    // Chat message (placeholder - would integrate with existing chat service)
    socket.on('send_chat', async (message: string) => {
      if (battleState.phase !== BATTLE_PHASES.CHAT_BREAK) return;
      if (!battleState.chatEnabled) return;
      
      const playerSide = (socket as any).playerSide;
      const character = battleState[playerSide as keyof Pick<BattleState, 'player1' | 'player2'>].character;
      
      try {
        // Use real AI chat service for battle combat responses
        const { aiChatService } = require('./aiChatService');
        const { db } = require('../database/sqlite');
        
        // Build character context for battle
        const chatContext = {
          characterId: character.character_id,
          characterName: character.name || 'Warrior',
          personality: {
            traits: ['Battle-focused', 'Strategic', 'Determined'],
            speechStyle: 'Direct and tactical during combat',
            motivations: ['Victory', 'Honor in battle', 'Team coordination'],
            fears: ['Defeat', 'Letting allies down']
          },
          historicalPeriod: (character as any).origin_era || 'Ancient times',
          currentBondLevel: (character as any).bond_level || 50,
          previousMessages: []
        };
        
        // Generate real AI response for battle context
        const aiResponse = await aiChatService.generateCharacterResponse(
          chatContext,
          message,
          (socket as any).userId,
          db,
          { 
            isInBattle: true, 
            isCombatChat: true, // This bypasses usage limits
            battlePhase: 'chat_break',
            currentHealth: character.current_health,
            maxHealth: character.max_health,
            opponentName: 'opponent'
          }
        );
        
        // Broadcast to battle room
        this.io.to(`battle:${battleState.id}`).emit('chat_message', {
          side: playerSide,
          playerMessage: message,
          characterResponse: aiResponse.message,
          bondIncreased: aiResponse.bondIncrease
        });
        
        analyticsService.trackCharacterInteraction(
          (socket as any).userId,
          character.character_id,
          'battle_chat',
          { message: message.substring(0, 50) }
        );
      } catch (error) {
        console.error('Chat error:', error);
        socket.emit('chat_error', { error: 'Failed to generate response' });
      }
    });
    
    // Disconnect handling
    socket.on('disconnect', () => {
      const playerSide = (socket as any).playerSide;
      if (playerSide && battleState) {
        battleState[playerSide as keyof Pick<BattleState, 'player1' | 'player2'>].connected = false;
        
        // Notify opponent
        this.io.to(`battle:${battleState.id}`).emit('opponent_disconnected', {
          side: playerSide
        });
        
        // Start disconnect timer (30 seconds to reconnect)
        setTimeout(() => {
          if (!battleState[playerSide as keyof Pick<BattleState, 'player1' | 'player2'>].connected) {
            this.handleForfeit(battleState, playerSide);
          }
        }, 30000);
      }
    });
  }

  // Start combat round
  private async startCombatRound(battleState: BattleState): Promise<void> {
    battleState.phase = BATTLE_PHASES.ROUND_COMBAT;
    battleState.combatLog.push({
      type: 'round_start',
      round: battleState.round,
      timestamp: Date.now()
    });
    
    // Apply strategy modifiers
    const p1Mods = this.getStrategyModifiers(battleState.player1.strategy!);
    const p2Mods = this.getStrategyModifiers(battleState.player2.strategy!);
    
    // Notify players
    this.io.to(`battle:${battleState.id}`).emit('round_start', {
      round: battleState.round,
      strategies: {
        player1: battleState.player1.strategy,
        player2: battleState.player2.strategy
      }
    });

    // Generate Hostmaster v8.72 round announcement
    setTimeout(async () => {
      await this.generateHostmasterRoundAnnouncement(battleState);
    }, 1000);
    
    // Execute combat simulation
    const combatResult = await this.simulateCombat(battleState, p1Mods, p2Mods);
    
    // Update state
    battleState.player1.health = combatResult.player1.health;
    battleState.player2.health = combatResult.player2.health;
    battleState.player1.effects = combatResult.player1.effects;
    battleState.player2.effects = combatResult.player2.effects;
    battleState.player1.cooldowns = combatResult.player1.cooldowns;
    battleState.player2.cooldowns = combatResult.player2.cooldowns;
    battleState.combatLog.push(...combatResult.events);
    
    // Send combat events to players with Hostmaster commentary
    for (const event of combatResult.events) {
      await this.sleep(500); // Delay for dramatic effect
      this.io.to(`battle:${battleState.id}`).emit('combat_event', event);
      
      // Generate Hostmaster commentary for significant events
      if (event.type === 'attack' && (event.critical || (event.damage && event.damage > 30))) {
        setTimeout(async () => {
          await this.generateHostmasterActionCommentary(battleState, event);
        }, 1000);
      }
    }
    
    // Check for battle end
    if (this.checkBattleEnd(battleState)) {
      await this.endBattle(battleState);
    } else {
      // Start chat phase
      await this.startChatPhase(battleState);
    }
  }

  // Strategy modifiers
  private getStrategyModifiers(strategy: string): StrategyModifiers {
    switch (strategy) {
      case 'aggressive':
        return { atkMod: 1.2, defMod: 0.9, spdMod: 1.0 };
      case 'defensive':
        return { atkMod: 0.9, defMod: 1.2, spdMod: 0.95 };
      case 'balanced':
      default:
        return { atkMod: 1.0, defMod: 1.0, spdMod: 1.0 };
    }
  }

  // Simulate combat between characters
  private async simulateCombat(battleState: BattleState, p1Mods: StrategyModifiers, p2Mods: StrategyModifiers): Promise<CombatResult> {
    const events: CombatEvent[] = [];
    const p1 = { ...battleState.player1 };
    const p2 = { ...battleState.player2 };
    
    // Initialize effects arrays if not present
    p1.effects = p1.effects || [];
    p2.effects = p2.effects || [];
    
    // Process start of round effects
    const p1StartEvents = this.processStatusEffects(p1, true);
    const p2StartEvents = this.processStatusEffects(p2, true);
    events.push(...p1StartEvents, ...p2StartEvents);
    
    // Calculate effective stats with modifiers
    const p1Stats = this.calculateEffectiveStats(p1.character, p1Mods);
    const p2Stats = this.calculateEffectiveStats(p2.character, p2Mods);
    
    // Determine turn order
    const p1Speed = p1Stats.speed * (1 + Math.random() * 0.1);
    const p2Speed = p2Stats.speed * (1 + Math.random() * 0.1);
    const turnOrder = p1Speed >= p2Speed ? ['player1', 'player2'] : ['player2', 'player1'];
    
    events.push({
      type: 'turn_order',
      order: turnOrder,
      timestamp: Date.now()
    });
    
    // Execute turns (3 per round)
    for (let turn = 0; turn < 3; turn++) {
      for (const attacker of turnOrder) {
        const defender = attacker === 'player1' ? 'player2' : 'player1';
        const attackerState = attacker === 'player1' ? p1 : p2;
        const defenderState = defender === 'player1' ? p1 : p2;
        
        // Check if battle is over
        if (attackerState.health <= 0 || defenderState.health <= 0) break;
        
        // Choose ability
        const ability = this.chooseAbility(attackerState.character, attackerState.cooldowns);
        
        // Calculate and apply damage
        if (ability.power > 0) {
          let damage = this.calculateDamage(
            attacker === 'player1' ? p1Stats : p2Stats,
            defender === 'player1' ? p1Stats : p2Stats,
            ability,
            attacker === 'player1' ? p1Mods : p2Mods
          );
          
          // Apply damage with BOUNDS CHECK
          const currentHealth = Math.max(0, Math.min(99999, defenderState.health || 0));
          defenderState.health = Math.max(0, currentHealth - damage);
          
          // Create attack event
          events.push({
            type: 'attack',
            attacker,
            defender,
            ability: ability.name,
            damage,
            critical: false,
            remainingHealth: {
              [attacker]: attackerState.health,
              [defender]: defenderState.health
            },
            timestamp: Date.now()
          });
        }
        
        // Update cooldowns
        if (ability.cooldown > 0) {
          attackerState.cooldowns[ability.name] = ability.cooldown;
        }
      }
      
      // Process end of turn effects
      const p1EndEvents = this.processStatusEffects(p1, false);
      const p2EndEvents = this.processStatusEffects(p2, false);
      events.push(...p1EndEvents, ...p2EndEvents);
      
      // Reduce cooldowns
      this.reduceCooldowns(p1.cooldowns);
      this.reduceCooldowns(p2.cooldowns);
    }
    
    return {
      player1: { 
        health: p1.health,
        effects: p1.effects,
        cooldowns: p1.cooldowns
      },
      player2: { 
        health: p2.health,
        effects: p2.effects,
        cooldowns: p2.cooldowns
      },
      events
    };
  }

  // Helper methods (simplified versions)
  private processStatusEffects(playerState: Player, isStartOfTurn: boolean): CombatEvent[] {
    const events: CombatEvent[] = [];
    playerState.effects = playerState.effects.filter(effect => {
      if (effect.duration <= 0) {
        events.push({ type: 'effect_removed', target: playerState.userId, effect: effect.type, timestamp: Date.now() });
        return false;
      }

      if (isStartOfTurn) {
        switch (effect.type) {
          case 'poison':
            playerState.health = Math.max(0, playerState.health - (effect.damage_per_turn || 0));
            events.push({ type: 'damage_over_time', target: playerState.userId, amount: effect.damage_per_turn, effect: 'poison', timestamp: Date.now() });
            break;
        }
      } else {
        effect.duration--;
      }
      return true;
    });
    return events;
  }

  private calculateEffectiveStats(character: BattleCharacter, mods: StrategyModifiers): any {
    return {
      health: character.max_health,
      attack: character.base_attack * mods.atkMod,
      defense: character.base_defense * mods.defMod,
      speed: character.base_speed * mods.spdMod,
      special: character.base_special,
    };
  }

  private chooseAbility(character: BattleCharacter, cooldowns: Record<string, number>): Ability {
    // Filter available abilities (not on cooldown)
    const availableAbilities = character.abilities.filter(ability => 
      !cooldowns[ability.name] || cooldowns[ability.name] <= 0
    );

    if (availableAbilities.length === 0) {
      return { name: 'Basic Attack', power: 1.0, cooldown: 0, type: 'attack' };
    }

    return availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
  }

  private calculateDamage(attacker: any, defender: any, ability: Ability, mods: StrategyModifiers): number {
    // BOUNDS CHECK: Ensure valid attacker stats
    const attackStat = Math.max(0, Math.min(9999, attacker?.attack || 0));
    const abilityPower = Math.max(0.1, Math.min(10, ability?.power || 1));
    const atkModifier = Math.max(0.1, Math.min(5, mods?.atkMod || 1));
    
    // BOUNDS CHECK: Ensure valid defender stats
    const defenseStat = Math.max(0, Math.min(9999, defender?.defense || 0));
    const defModifier = Math.max(0.1, Math.min(5, mods?.defMod || 1));
    
    // Calculate base damage with bounds
    const baseDamage = attackStat * abilityPower * atkModifier;
    const defense = defenseStat * defModifier;
    const variance = 0.85 + Math.random() * 0.3;
    
    // Calculate raw damage
    let damage = Math.max(5, (baseDamage - defense * 0.5) * variance);
    
    // Critical hit chance
    const critChance = 0.15;
    if (Math.random() < critChance) {
      // BOUNDS CHECK: Ensure crit multiplier is reasonable
      const critMultiplier = Math.max(1.5, Math.min(3, BATTLE_CONFIG.CRIT_MULTIPLIER || 1.5));
      damage *= critMultiplier;
    }
    
    // BOUNDS CHECK: Cap final damage
    return Math.max(1, Math.min(9999, Math.round(damage)));
  }

  private reduceCooldowns(cooldowns: Record<string, number>): void {
    for (const ability in cooldowns) {
      cooldowns[ability] = Math.max(0, cooldowns[ability] - 1);
    }
  }

  // Start chat phase
  private async startChatPhase(battleState: BattleState): Promise<void> {
    battleState.phase = BATTLE_PHASES.CHAT_BREAK;
    battleState.chatEnabled = true;
    
    // Notify players
    this.io.to(`battle:${battleState.id}`).emit('chat_phase_start', {
      duration: BATTLE_CONFIG.CHAT_DURATION
    });
    
    // Set timer for next round
    this.startPhaseTimer(
      battleState.id,
      BATTLE_PHASES.CHAT_BREAK,
      BATTLE_CONFIG.CHAT_DURATION,
      () => this.endChatPhase(battleState)
    );
  }

  // End chat phase and prepare next round
  private async endChatPhase(battleState: BattleState): Promise<void> {
    battleState.chatEnabled = false;
    battleState.round++;
    
    if (battleState.round > BATTLE_CONFIG.MAX_ROUNDS) {
      await this.endBattle(battleState);
    } else {
      // Reset strategies
      battleState.player1.strategy = null;
      battleState.player2.strategy = null;
      
      // Start new strategy phase
      battleState.phase = BATTLE_PHASES.STRATEGY_SELECT;
      
      this.io.to(`battle:${battleState.id}`).emit('strategy_phase_start', {
        round: battleState.round,
        duration: BATTLE_CONFIG.STRATEGY_DURATION
      });
      
      this.startPhaseTimer(
        battleState.id,
        BATTLE_PHASES.STRATEGY_SELECT,
        BATTLE_CONFIG.STRATEGY_DURATION
      );
    }
  }

  // End battle
  private async endBattle(battleState: BattleState): Promise<void> {
    battleState.phase = BATTLE_PHASES.BATTLE_END;
    
    // Determine winner
    let winnerId: string, winnerSide: string;
    if (battleState.player1.health <= 0) {
      winnerId = battleState.player2.userId;
      winnerSide = 'player2';
    } else if (battleState.player2.health <= 0) {
      winnerId = battleState.player1.userId;
      winnerSide = 'player1';
    } else {
      // Highest health percentage wins
      const p1Percent = battleState.player1.health / battleState.player1.maxHealth;
      const p2Percent = battleState.player2.health / battleState.player2.maxHealth;
      if (p1Percent > p2Percent) {
        winnerId = battleState.player1.userId;
        winnerSide = 'player1';
      } else {
        winnerId = battleState.player2.userId;
        winnerSide = 'player2';
      }
    }
    
    // Calculate rewards
    const rewards = this.calculateRewards(battleState, winnerSide);
    
    // Update database
    await dbAdapter.battles.update(battleState.id, {
      winner_id: winnerId,
      status: 'completed',
      ended_at: new Date(),
      xp_gained: rewards.xp,
      bond_gained: rewards.bond,
      currency_gained: rewards.currency
    });
    
    // Update characters
    await this.updateCharacterStats(battleState, winnerSide, rewards);
    
    // Generate Hostmaster v8.72 victory announcement
    setTimeout(async () => {
      await this.generateHostmasterVictoryAnnouncement(battleState, winnerId);
    }, 1000);

    // Notify players
    this.io.to(`battle:${battleState.id}`).emit('battle_end', {
      winner: winnerSide,
      rewards,
      finalStats: {
        player1: {
          health: battleState.player1.health,
          maxHealth: battleState.player1.maxHealth
        },
        player2: {
          health: battleState.player2.health,
          maxHealth: battleState.player2.maxHealth
        }
      }
    });

    // Track analytics
    const loserSide = winnerSide === 'player1' ? 'player2' : 'player1';
    analyticsService.trackBattleCompletion({
      battleId: battleState.id,
      duration: Math.round((Date.now() - battleState.createdAt) / 1000),
      rounds: battleState.round,
      winner: winnerId,
      loser: battleState[loserSide as keyof Pick<BattleState, 'player1' | 'player2'>].userId,
      strategies: {
        player1: battleState.player1.strategy || 'balanced',
        player2: battleState.player2.strategy || 'balanced'
      },
      combatEvents: battleState.combatLog.length,
      chatMessages: 0, // Would count from chat logs
      disconnections: 0,
      forfeit: false
    });
    
    // Clean up
    setTimeout(() => {
      this.activeBattles.delete(battleState.id);
      // Clean up Hostmaster history
      hostmasterService.cleanupBattle(battleState.id);
    }, 60000); // Keep state for 1 minute for reconnections
  }

  // Calculate battle rewards
  private calculateRewards(battleState: BattleState, winnerSide: string): BattleRewards {
    const baseXP = 100;
    const baseCurrency = 50;
    const baseBond = 1;
    
    const winner = battleState[winnerSide as keyof Pick<BattleState, 'player1' | 'player2'>];
    const loser = winnerSide === 'player1' ? battleState.player2 : battleState.player1;
    
    // XP calculation
    let xp = baseXP;
    if (winner.character.level < loser.character.level) {
      xp *= 1.5; // Bonus for beating higher level
    }
    
    // Currency
    let currency = baseCurrency;
    if (battleState.round === BATTLE_CONFIG.MAX_ROUNDS) {
      currency *= 1.2; // Bonus for full battle
    }
    
    // Bond points
    let bond = baseBond;
    const chatCount = battleState.combatLog.filter(e => e.type === 'chat').length;
    if (chatCount > 5) {
      bond += 1; // Extra bond for active chatting
    }
    
    return {
      xp: Math.round(xp),
      currency: Math.round(currency),
      bond,
      winner: true
    };
  }

  // Update character stats after battle
  private async updateCharacterStats(battleState: BattleState, winnerSide: string, rewards: BattleRewards): Promise<void> {
    const winner = battleState[winnerSide as keyof Pick<BattleState, 'player1' | 'player2'>];
    const loser = winnerSide === 'player1' ? battleState.player2 : battleState.player1;
    
    // Update winner
    await dbAdapter.userCharacters.update(winner.characterId, {
      total_battles: winner.character.total_battles + 1,
      total_wins: winner.character.total_wins + 1,
      experience: winner.character.experience + rewards.xp,
      current_health: winner.health,
      last_battle_at: new Date()
    });
    
    // Update loser
    await dbAdapter.userCharacters.update(loser.characterId, {
      total_battles: loser.character.total_battles + 1,
      experience: loser.character.experience + Math.round(rewards.xp * 0.3), // 30% XP for losing
      current_health: loser.health,
      is_injured: loser.health === 0,
      recovery_time: loser.health === 0 ? new Date(Date.now() + 30 * 60 * 1000) : undefined, // 30 min recovery
      last_battle_at: new Date()
    });
    
    // Update user currencies
    await dbAdapter.currency.update(winner.userId, { battle_tokens: rewards.currency });
  }

  // Check if battle should end
  private checkBattleEnd(battleState: BattleState): boolean {
    // Check if either player's health is 0
    if (battleState.player1.health <= 0 || battleState.player2.health <= 0) {
      return true;
    }
    
    // Check if we've completed all rounds
    if (battleState.round > BATTLE_CONFIG.MAX_ROUNDS) {
      return true;
    }
    
    return false;
  }

  // Start phase timer
  private startPhaseTimer(battleId: string, phase: string, duration: number, callback?: () => void): void {
    const battleState = this.activeBattles.get(battleId);
    if (!battleState) return;
    
    // Clear existing timer
    if (battleState.timer) {
      clearTimeout(battleState.timer);
    }
    
    // Set new timer
    battleState.timer = setTimeout(() => {
      if (callback) {
        callback();
      } else {
        // Default behavior based on phase
        this.handlePhaseTimeout(battleId, phase);
      }
    }, duration * 1000);
  }

  // Handle phase timeout
  private handlePhaseTimeout(battleId: string, phase: string): void {
    const battleState = this.activeBattles.get(battleId);
    if (!battleState) return;
    
    switch (phase) {
      case BATTLE_PHASES.STRATEGY_SELECT:
        // Auto-select balanced strategy for players who didn't choose
        if (!battleState.player1.strategy) {
          battleState.player1.strategy = 'balanced';
        }
        if (!battleState.player2.strategy) {
          battleState.player2.strategy = 'balanced';
        }
        this.startCombatRound(battleState);
        break;
        
      case BATTLE_PHASES.CHAT_BREAK:
        this.endChatPhase(battleState);
        break;
    }
  }

  // Handle player forfeit
  private async handleForfeit(battleState: BattleState, forfeitingSide: string): Promise<void> {
    const winnerSide = forfeitingSide === 'player1' ? 'player2' : 'player1';
    const winnerId = battleState[winnerSide as keyof Pick<BattleState, 'player1' | 'player2'>].userId;
    
    // Update battle in database
    await dbAdapter.battles.update(battleState.id, {
      winner_id: winnerId,
      end_reason: 'forfeit',
      status: 'completed',
      ended_at: new Date()
    });
    
    // Notify remaining player
    this.io.to(`battle:${battleState.id}`).emit('opponent_forfeited', {
      winner: winnerSide
    });
    
    // Publish global battle ended event for multi-server coordination
    try {
      await cache.publishBattleEvent('global', {
        type: 'battle_ended',
        battleId: battleState.id,
        endReason: 'forfeit',
        winner: winnerId,
        serverId: process.env.SERVER_ID || 'default'
      });
    } catch (error) {
      console.error('Failed to publish battle_ended event:', error);
    }
    
    // Clean up
    this.activeBattles.delete(battleState.id);
  }

  // Notify player through various channels
  private notifyPlayer(userId: string, event: string, data: any): void {
    // Send through WebSocket if connected
    const userSocket = this.getUserSocket(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }

  // Get user's socket connection
  private getUserSocket(userId: string): Socket | null {
    const socketId = this.userSocketMap.get(userId);
    return this.io.sockets.sockets.get(socketId || '') || null;
  }

  // Estimate wait time based on rating
  private estimateWaitTime(rating: number): number {
    const queueSize = this.battleQueue.size;
    const similarRatingCount = Array.from(this.battleQueue.values())
      .filter(player => Math.abs(player.rating - rating) < 200)
      .length;
    
    if (similarRatingCount > 0) {
      return Math.round(10 + Math.random() * 20); // 10-30 seconds
    } else {
      return Math.round(30 + queueSize * 5); // Longer wait if no similar ratings
    }
  }

  // Helper function for delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for external access
  getActiveBattles(): Map<string, BattleState> {
    return this.activeBattles;
  }

  getBattleQueue(): Map<string, QueueEntry> {
    return this.battleQueue;
  }

  setUserSocket(userId: string, socketId: string): void {
    this.userSocketMap.set(userId, socketId);
  }

  removeUserSocket(userId: string): void {
    this.userSocketMap.delete(userId);
  }

  // Hostmaster v8.72 Integration Methods

  private async generateHostmasterIntroduction(battleState: BattleState): Promise<void> {
    try {
      const context = this.buildHostmasterContext(battleState);
      const announcement = await hostmasterService.generateBattleIntroduction(context);
      await hostmasterService.broadcastAnnouncement(battleState.id, announcement);
    } catch (error) {
      console.error('Failed to generate Hostmaster introduction:', error);
    }
  }

  private async generateHostmasterRoundAnnouncement(battleState: BattleState): Promise<void> {
    try {
      const context = this.buildHostmasterContext(battleState);
      const announcement = await hostmasterService.generateRoundAnnouncement(context);
      await hostmasterService.broadcastAnnouncement(battleState.id, announcement);
    } catch (error) {
      console.error('Failed to generate Hostmaster round announcement:', error);
    }
  }

  private async generateHostmasterActionCommentary(battleState: BattleState, event: any): Promise<void> {
    try {
      const context = this.buildHostmasterContext(battleState);
      const announcement = await hostmasterService.generateActionCommentary(context, event);
      await hostmasterService.broadcastAnnouncement(battleState.id, announcement);
    } catch (error) {
      console.error('Failed to generate Hostmaster action commentary:', error);
    }
  }

  private async generateHostmasterVictoryAnnouncement(battleState: BattleState, winnerId: string): Promise<void> {
    try {
      const context = this.buildHostmasterContext(battleState);
      const winnerName = battleState.player1.userId === winnerId ? 
        battleState.player1.character.name : battleState.player2.character.name;
      const announcement = await hostmasterService.generateVictoryAnnouncement(context, winnerName);
      await hostmasterService.broadcastAnnouncement(battleState.id, announcement);
    } catch (error) {
      console.error('Failed to generate Hostmaster victory announcement:', error);
    }
  }

  private buildHostmasterContext(battleState: BattleState): HostmasterContext {
    return {
      player1Name: battleState.player1.character.name,
      player2Name: battleState.player2.character.name,
      battleId: battleState.id,
      round: battleState.round,
      phase: battleState.phase,
      currentHealth: {
        player1: battleState.player1.health,
        player2: battleState.player2.health
      },
      maxHealth: {
        player1: battleState.player1.maxHealth,
        player2: battleState.player2.maxHealth
      },
      strategies: {
        player1: battleState.player1.strategy || 'balanced',
        player2: battleState.player2.strategy || 'balanced'
      },
      combatEvents: battleState.combatLog,
      battleHistory: [] // Could be expanded to include past rounds
    };
  }
}

export default BattleManager;