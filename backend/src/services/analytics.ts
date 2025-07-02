/**
 * Analytics Service for Battle System
 * Tracks battle performance, user engagement, and system metrics
 */

interface BattleAnalytics {
  battleId: string;
  duration: number;
  rounds: number;
  winner: string;
  loser: string;
  strategies: {
    player1: string;
    player2: string;
  };
  combatEvents: number;
  chatMessages: number;
  disconnections: number;
  forfeit: boolean;
}

interface UserAnalytics {
  userId: string;
  action: string;
  data: Record<string, any>;
  timestamp: Date;
}

class AnalyticsService {
  private events: UserAnalytics[] = [];
  private battleMetrics: BattleAnalytics[] = [];

  /**
   * Track user action
   */
  trackUserAction(userId: string, action: string, data: Record<string, any> = {}): void {
    this.events.push({
      userId,
      action,
      data,
      timestamp: new Date()
    });

    // Log important events
    if (['battle_start', 'battle_end', 'matchmaking_start'].includes(action)) {
      console.log(`📊 Analytics: User ${userId} - ${action}`, data);
    }
  }

  /**
   * Track battle completion
   */
  trackBattleCompletion(analytics: BattleAnalytics): void {
    this.battleMetrics.push(analytics);
    
    console.log(`⚔️ Battle Analytics: ${analytics.battleId}`, {
      duration: `${analytics.duration}s`,
      rounds: analytics.rounds,
      winner: analytics.winner,
      strategies: analytics.strategies,
      forfeit: analytics.forfeit
    });

    // Track user-level analytics
    this.trackUserAction(analytics.winner, 'battle_won', {
      battleId: analytics.battleId,
      duration: analytics.duration,
      rounds: analytics.rounds,
      opponentStrategy: analytics.strategies.player1 === analytics.winner ? analytics.strategies.player2 : analytics.strategies.player1
    });

    this.trackUserAction(analytics.loser, 'battle_lost', {
      battleId: analytics.battleId,
      duration: analytics.duration,
      rounds: analytics.rounds,
      opponentStrategy: analytics.strategies.player1 === analytics.loser ? analytics.strategies.player2 : analytics.strategies.player1
    });
  }

  /**
   * Track matchmaking metrics
   */
  trackMatchmaking(userId: string, waitTime: number, queueSize: number): void {
    this.trackUserAction(userId, 'matchmaking_complete', {
      waitTime,
      queueSize,
      timestamp: new Date()
    });

    console.log(`🎯 Matchmaking: User ${userId} waited ${waitTime}s (queue: ${queueSize})`);
  }

  /**
   * Track character interaction
   */
  trackCharacterInteraction(userId: string, characterId: string, interactionType: string, data: Record<string, any> = {}): void {
    this.trackUserAction(userId, 'character_interaction', {
      characterId,
      interactionType,
      ...data
    });
  }

  /**
   * Track system performance
   */
  trackSystemPerformance(metric: string, value: number, unit: string): void {
    console.log(`📈 System Metric: ${metric} = ${value}${unit}`);
    
    // Store for monitoring (in production, send to monitoring service)
    this.events.push({
      userId: 'system',
      action: 'performance_metric',
      data: { metric, value, unit },
      timestamp: new Date()
    });
  }

  /**
   * Get user analytics summary
   */
  getUserAnalytics(userId: string): UserAnalytics[] {
    return this.events.filter(event => event.userId === userId);
  }

  /**
   * Get battle analytics summary
   */
  getBattleAnalytics(limit = 10): BattleAnalytics[] {
    return this.battleMetrics.slice(-limit);
  }

  /**
   * Get system health metrics
   */
  getSystemMetrics(): Record<string, any> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(event => event.timestamp >= last24h);
    const recentBattles = this.battleMetrics.filter(battle => 
      new Date(battle.battleId.split('_')[1]) >= last24h
    );

    return {
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      totalBattles: this.battleMetrics.length,
      recentBattles: recentBattles.length,
      averageBattleDuration: recentBattles.length > 0 
        ? recentBattles.reduce((sum, b) => sum + b.duration, 0) / recentBattles.length 
        : 0,
      activeUsers: new Set(recentEvents.map(e => e.userId)).size,
      topActions: this.getTopActions(recentEvents)
    };
  }

  /**
   * Helper: Get most common actions
   */
  private getTopActions(events: UserAnalytics[]): Record<string, number> {
    const actionCounts: Record<string, number> = {};
    
    events.forEach(event => {
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
    });

    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [action, count]) => ({ ...obj, [action]: count }), {});
  }

  /**
   * Clear old analytics data (for memory management)
   */
  cleanup(olderThanDays = 7): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const beforeCount = this.events.length;
    this.events = this.events.filter(event => event.timestamp >= cutoff);
    
    const removed = beforeCount - this.events.length;
    if (removed > 0) {
      console.log(`🧹 Analytics cleanup: Removed ${removed} old events`);
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Auto-cleanup old data every 6 hours
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    analyticsService.cleanup();
  }, 6 * 60 * 60 * 1000);
}

export default analyticsService;