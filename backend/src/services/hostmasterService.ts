import { aiChatService } from './aiChatService';
import { Server as SocketIOServer } from 'socket.io';

export interface HostmasterContext {
  player1Name: string;
  player2Name: string;
  battleId: string;
  round: number;
  phase: string;
  currentHealth: { player1: number; player2: number };
  maxHealth: { player1: number; player2: number };
  strategies: { player1: string; player2: string };
  combatEvents: Array<{
    type: string;
    attacker?: string;
    defender?: string;
    ability?: string;
    damage?: number;
    critical?: boolean;
  }>;
  battleHistory: string[];
}

export interface HostmasterAnnouncement {
  text: string;
  type: 'intro' | 'round' | 'action' | 'victory' | 'defeat' | 'special';
  priority: 'low' | 'normal' | 'high';
  delay?: number;
  metadata?: {
    player?: string;
    eventType?: string;
    intensity?: 'low' | 'medium' | 'high';
  };
}

/**
 * Hostmaster v8.72 - AI-Powered Battle Announcer
 * Generates dynamic, contextual battle announcements using OpenAI
 */
export class HostmasterService {
  private io: SocketIOServer;
  private announcementHistory: Map<string, string[]> = new Map();
  private characterPersonalities: Map<string, string> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.initializePersonalities();
  }

  private initializePersonalities(): void {
    // Initialize known character personalities for better announcements
    this.characterPersonalities.set('Achilles', 'legendary Greek warrior known for his pride and fierce combat prowess');
    this.characterPersonalities.set('Joan of Arc', 'divine French maiden warrior driven by faith and justice');
    this.characterPersonalities.set('Merlin', 'wise and powerful wizard with ancient magic');
    this.characterPersonalities.set('Cleopatra', 'cunning Egyptian queen with strategic brilliance');
    this.characterPersonalities.set('Loki', 'trickster god with shapeshifting abilities and silver tongue');
    this.characterPersonalities.set('Fenrir', 'monstrous wolf prophesied to devour gods');
    this.characterPersonalities.set('Sherlock Holmes', 'brilliant detective with unmatched deductive reasoning');
    this.characterPersonalities.set('Sun Tzu', 'master strategist and philosopher of warfare');
  }

  /**
   * Generate AI-powered battle introduction
   */
  async generateBattleIntroduction(context: HostmasterContext): Promise<HostmasterAnnouncement> {
    const prompt = this.buildIntroPrompt(context);
    
    try {
      const response = await aiChatService.generateCharacterResponse(
        {
          characterId: 'hostmaster',
          characterName: 'Hostmaster',
          personality: {
            traits: ['Dramatic', 'Energetic', 'Knowledgeable', 'Entertaining'],
            speechStyle: 'Theatrical sports announcer with historical knowledge',
            motivations: ['Exciting the audience', 'Honoring the warriors', 'Creating memorable moments'],
            fears: ['Boring battles', 'Disappointing spectators']
          },
          historicalPeriod: 'Timeless arena master'
        },
        prompt,
        'hostmaster_ai',
        null,
        { isInBattle: true, isCombatChat: true }
      );

      // Store in history
      this.addToHistory(context.battleId, response.message);

      return {
        text: response.message,
        type: 'intro',
        priority: 'high',
        metadata: {
          intensity: 'high',
          eventType: 'battle_start'
        }
      };
    } catch (error) {
      console.error('Failed to generate AI introduction:', error);
      return this.getFallbackIntroduction(context);
    }
  }

  /**
   * Generate AI-powered round announcement
   */
  async generateRoundAnnouncement(context: HostmasterContext): Promise<HostmasterAnnouncement> {
    const prompt = this.buildRoundPrompt(context);
    
    try {
      const response = await aiChatService.generateCharacterResponse(
        {
          characterId: 'hostmaster',
          characterName: 'Hostmaster',
          personality: {
            traits: ['Dramatic', 'Energetic', 'Analytical', 'Passionate'],
            speechStyle: 'Theatrical sports announcer building tension',
            motivations: ['Building excitement', 'Analyzing strategy', 'Hyping the crowd'],
            fears: ['Missing key moments', 'Understating drama']
          }
        },
        prompt,
        'hostmaster_ai',
        null,
        { isInBattle: true, isCombatChat: true }
      );

      this.addToHistory(context.battleId, response.message);

      return {
        text: response.message,
        type: 'round',
        priority: 'high',
        delay: 1000,
        metadata: {
          intensity: 'high',
          eventType: 'round_start'
        }
      };
    } catch (error) {
      console.error('Failed to generate AI round announcement:', error);
      return this.getFallbackRoundAnnouncement(context);
    }
  }

  /**
   * Generate AI-powered combat action commentary
   */
  async generateActionCommentary(context: HostmasterContext, event: any): Promise<HostmasterAnnouncement> {
    const prompt = this.buildActionPrompt(context, event);
    
    try {
      const response = await aiChatService.generateCharacterResponse(
        {
          characterId: 'hostmaster',
          characterName: 'Hostmaster',
          personality: {
            traits: ['Reactive', 'Descriptive', 'Exciting', 'Knowledgeable'],
            speechStyle: 'Play-by-play sports announcer with combat expertise',
            motivations: ['Capturing the action', 'Explaining techniques', 'Building excitement'],
            fears: ['Missing dramatic moments', 'Boring commentary']
          }
        },
        prompt,
        'hostmaster_ai',
        null,
        { isInBattle: true, isCombatChat: true }
      );

      this.addToHistory(context.battleId, response.message);

      return {
        text: response.message,
        type: 'action',
        priority: 'normal',
        delay: 500,
        metadata: {
          intensity: event.critical ? 'high' : 'medium',
          eventType: event.type,
          player: event.attacker
        }
      };
    } catch (error) {
      console.error('Failed to generate AI action commentary:', error);
      return this.getFallbackActionCommentary(context, event);
    }
  }

  /**
   * Generate AI-powered victory announcement
   */
  async generateVictoryAnnouncement(context: HostmasterContext, winner: string): Promise<HostmasterAnnouncement> {
    const prompt = this.buildVictoryPrompt(context, winner);
    
    try {
      const response = await aiChatService.generateCharacterResponse(
        {
          characterId: 'hostmaster',
          characterName: 'Hostmaster',
          personality: {
            traits: ['Celebratory', 'Respectful', 'Dramatic', 'Honorable'],
            speechStyle: 'Grand ceremonial announcer honoring victory',
            motivations: ['Celebrating the winner', 'Honoring both fighters', 'Creating memorable moments'],
            fears: ['Dishonoring the fighters', 'Anticlimactic endings']
          }
        },
        prompt,
        'hostmaster_ai',
        null,
        { isInBattle: true, isCombatChat: true }
      );

      this.addToHistory(context.battleId, response.message);

      return {
        text: response.message,
        type: 'victory',
        priority: 'high',
        delay: 2000,
        metadata: {
          intensity: 'high',
          eventType: 'victory',
          player: winner
        }
      };
    } catch (error) {
      console.error('Failed to generate AI victory announcement:', error);
      return this.getFallbackVictoryAnnouncement(context, winner);
    }
  }

  /**
   * Generate contextual special moment announcements
   */
  async generateSpecialMomentAnnouncement(context: HostmasterContext, momentType: string, data: any): Promise<HostmasterAnnouncement> {
    const prompt = this.buildSpecialMomentPrompt(context, momentType, data);
    
    try {
      const response = await aiChatService.generateCharacterResponse(
        {
          characterId: 'hostmaster',
          characterName: 'Hostmaster',
          personality: {
            traits: ['Observant', 'Exciting', 'Knowledgeable', 'Dramatic'],
            speechStyle: 'Expert commentator highlighting special moments',
            motivations: ['Capturing unique moments', 'Educating audience', 'Building drama'],
            fears: ['Missing significance', 'Understating importance']
          }
        },
        prompt,
        'hostmaster_ai',
        null,
        { isInBattle: true, isCombatChat: true }
      );

      this.addToHistory(context.battleId, response.message);

      return {
        text: response.message,
        type: 'special',
        priority: 'normal',
        delay: 1000,
        metadata: {
          intensity: 'medium',
          eventType: momentType
        }
      };
    } catch (error) {
      console.error('Failed to generate AI special moment announcement:', error);
      return this.getFallbackSpecialMomentAnnouncement(momentType);
    }
  }

  /**
   * Broadcast announcement to battle participants
   */
  async broadcastAnnouncement(battleId: string, announcement: HostmasterAnnouncement): Promise<void> {
    try {
      // Send to battle room
      this.io.to(`battle:${battleId}`).emit('hostmaster_announcement', {
        text: announcement.text,
        type: announcement.type,
        priority: announcement.priority,
        delay: announcement.delay || 0,
        metadata: announcement.metadata || {}
      });

      console.log(`📢 Hostmaster v8.72 announced: "${announcement.text.substring(0, 50)}..."`);
    } catch (error) {
      console.error('Failed to broadcast announcement:', error);
    }
  }

  // Private helper methods for building AI prompts

  private buildIntroPrompt(context: HostmasterContext): string {
    const p1Description = this.characterPersonalities.get(context.player1Name) || 'legendary warrior';
    const p2Description = this.characterPersonalities.get(context.player2Name) || 'formidable fighter';

    return `You are the Hostmaster, the legendary arena announcer. You're introducing an epic battle between ${context.player1Name} (${p1Description}) and ${context.player2Name} (${p2Description}). 

This is Battle ID ${context.battleId}. Create a dramatic, exciting introduction that:
- Welcomes the audience to the arena
- Introduces both warriors with respect for their legendary status
- Builds anticipation for the coming battle
- Uses theatrical language worthy of legendary figures

Keep it to 2-3 sentences, dramatic but not overly long. End with something that signals the battle is about to begin!`;
  }

  private buildRoundPrompt(context: HostmasterContext): string {
    const healthStatus = this.getHealthStatus(context);
    const strategyNote = context.strategies.player1 && context.strategies.player2 ? 
      `${context.player1Name} chose ${context.strategies.player1} strategy, while ${context.player2Name} selected ${context.strategies.player2}.` : '';

    return `You are the Hostmaster announcing the start of Round ${context.round}. 

Current situation:
- ${healthStatus}
- ${strategyNote}
- Previous rounds have been intense

Create a dramatic announcement that:
- Announces the round number
- Notes the current state of both fighters
- Builds tension for what's to come
- Encourages both warriors

Keep it to 2-3 sentences, energetic and engaging!`;
  }

  private buildActionPrompt(context: HostmasterContext, event: any): string {
    const attacker = event.attacker === 'player1' ? context.player1Name : context.player2Name;
    const defender = event.defender === 'player1' ? context.player1Name : context.player2Name;
    const critical = event.critical ? 'It was a CRITICAL HIT!' : '';
    const damage = event.damage || 0;

    return `You are the Hostmaster providing live commentary on a combat action in Round ${context.round}.

What just happened:
- ${attacker} used ${event.ability || 'a basic attack'} against ${defender}
- The attack dealt ${damage} damage
- ${critical}
- ${defender} has ${event.remainingHealth?.[event.defender] || 'unknown'} health remaining

Provide exciting play-by-play commentary that:
- Describes the action vividly
- Shows the impact and consequences
- Maintains the drama and energy
- Respects both fighters' legendary status

Keep it to 1-2 sentences, punchy and exciting!`;
  }

  private buildVictoryPrompt(context: HostmasterContext, winner: string): string {
    const loser = winner === context.player1Name ? context.player2Name : context.player1Name;
    const battleSummary = `The battle lasted ${context.round} rounds with incredible displays of skill and power.`;

    return `You are the Hostmaster announcing the victory in this epic battle.

Battle Summary:
- Winner: ${winner}
- Defeated: ${loser}
- ${battleSummary}
- Both warriors fought with honor and legendary skill

Create a grand victory announcement that:
- Celebrates the winner's triumph
- Honors both fighters for their courage
- Captures the epic nature of the battle
- Shows respect for the legendary status of both warriors

Keep it to 2-3 sentences, celebratory yet respectful!`;
  }

  private buildSpecialMomentPrompt(context: HostmasterContext, momentType: string, data: any): string {
    const specialMoments: Record<string, string> = {
      'comeback': `${data.player} has made an incredible comeback from near defeat!`,
      'perfect_health': `${data.player} has maintained perfect health throughout the battle!`,
      'close_match': 'Both warriors are nearly equal in strength - this could go either way!',
      'ability_showcase': `${data.player} just demonstrated the true power of ${data.ability}!`,
      'strategic_mastery': `${data.player}'s ${data.strategy} strategy is proving highly effective!`
    };

    const moment = specialMoments[momentType] || `Something special is happening in Round ${context.round}!`;

    return `You are the Hostmaster commenting on a special moment in the battle.

Special Moment: ${moment}

Create an announcement that:
- Highlights the significance of this moment
- Shows your expertise as an announcer
- Builds excitement for what comes next
- Respects the legendary nature of the fighters

Keep it to 1-2 sentences, insightful and dramatic!`;
  }

  private getHealthStatus(context: HostmasterContext): string {
    const p1Percent = Math.round((context.currentHealth.player1 / context.maxHealth.player1) * 100);
    const p2Percent = Math.round((context.currentHealth.player2 / context.maxHealth.player2) * 100);

    if (p1Percent === p2Percent) {
      return `Both warriors remain evenly matched at ${p1Percent}% health`;
    } else if (p1Percent > p2Percent) {
      return `${context.player1Name} leads with ${p1Percent}% health to ${context.player2Name}'s ${p2Percent}%`;
    } else {
      return `${context.player2Name} leads with ${p2Percent}% health to ${context.player1Name}'s ${p1Percent}%`;
    }
  }

  private addToHistory(battleId: string, announcement: string): void {
    if (!this.announcementHistory.has(battleId)) {
      this.announcementHistory.set(battleId, []);
    }
    const history = this.announcementHistory.get(battleId)!;
    history.push(announcement);
    
    // Keep only last 10 announcements
    if (history.length > 10) {
      history.shift();
    }
  }

  // Fallback methods for when AI fails

  private getFallbackIntroduction(context: HostmasterContext): HostmasterAnnouncement {
    return {
      text: `Ladies and gentlemen, welcome to the arena! Witness the legendary battle between ${context.player1Name} and ${context.player2Name}! Let the combat begin!`,
      type: 'intro',
      priority: 'high'
    };
  }

  private getFallbackRoundAnnouncement(context: HostmasterContext): HostmasterAnnouncement {
    return {
      text: `Round ${context.round} begins! Both warriors prepare for the next clash!`,
      type: 'round',
      priority: 'high'
    };
  }

  private getFallbackActionCommentary(context: HostmasterContext, event: any): HostmasterAnnouncement {
    const attacker = event.attacker === 'player1' ? context.player1Name : context.player2Name;
    const critical = event.critical ? 'Critical hit! ' : '';
    return {
      text: `${critical}${attacker} strikes with ${event.ability || 'devastating power'}!`,
      type: 'action',
      priority: 'normal'
    };
  }

  private getFallbackVictoryAnnouncement(context: HostmasterContext, winner: string): HostmasterAnnouncement {
    return {
      text: `Victory to ${winner}! What an incredible display of legendary combat!`,
      type: 'victory',
      priority: 'high'
    };
  }

  private getFallbackSpecialMomentAnnouncement(momentType: string): HostmasterAnnouncement {
    return {
      text: `The crowd roars as something special happens in the arena!`,
      type: 'special',
      priority: 'normal'
    };
  }

  /**
   * Clean up battle history when battle ends
   */
  public cleanupBattle(battleId: string): void {
    this.announcementHistory.delete(battleId);
  }
}

// Export singleton instance
export const hostmasterService = new HostmasterService(global.io);