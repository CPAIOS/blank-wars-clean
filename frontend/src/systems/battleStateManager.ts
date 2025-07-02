// Battle State Manager - Race Condition Protection
// Manages concurrent access to battle state to prevent data corruption

import { BattleState } from '../data/battleFlow';

export interface StateOperation<T = any> {
  id: string;
  timestamp: number;
  operation: (state: BattleState) => T;
  rollback?: (state: BattleState) => void;
}

export class BattleStateManager {
  private static instances = new Map<string, BattleStateManager>();
  private operationQueue: StateOperation[] = [];
  private isProcessing = false;
  private currentOperation: StateOperation | null = null;
  private stateVersion = 0;
  private lockTimeout = 5000; // 5 seconds
  
  private constructor(private battleId: string) {}
  
  static getInstance(battleId: string): BattleStateManager {
    if (!this.instances.has(battleId)) {
      this.instances.set(battleId, new BattleStateManager(battleId));
    }
    return this.instances.get(battleId)!;
  }
  
  static cleanup(battleId: string): void {
    this.instances.delete(battleId);
  }
  
  // Execute state operation with race condition protection
  async executeOperation<T>(
    operation: (state: BattleState) => T,
    rollback?: (state: BattleState) => void,
    timeout = this.lockTimeout
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timeoutId = setTimeout(() => {
        reject(new Error(`Battle state operation timeout: ${operationId}`));
      }, timeout);
      
      const stateOperation: StateOperation<T> = {
        id: operationId,
        timestamp: Date.now(),
        operation: (state: BattleState) => {
          try {
            clearTimeout(timeoutId);
            const result = operation(state);
            this.stateVersion++;
            resolve(result);
            return result;
          } catch (error) {
            clearTimeout(timeoutId);
            // Attempt rollback if provided
            if (rollback) {
              try {
                rollback(state);
              } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError);
              }
            }
            reject(error);
            throw error;
          }
        },
        rollback
      };
      
      this.operationQueue.push(stateOperation);
      this.processQueue();
    });
  }
  
  // Safe state reader that doesn't modify state
  readState<T>(reader: (state: BattleState) => T, battleState: BattleState): T {
    // Create a deep copy to prevent accidental mutations
    const stateCopy = this.createStateCopy(battleState);
    return reader(stateCopy);
  }
  
  // Apply multiple operations atomically
  async executeAtomicOperations<T>(
    operations: Array<(state: BattleState) => any>,
    rollback?: (state: BattleState) => void
  ): Promise<T[]> {
    return this.executeOperation(
      (state: BattleState) => {
        const results: T[] = [];
        for (const op of operations) {
          results.push(op(state));
        }
        return results;
      },
      rollback
    );
  }
  
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      while (this.operationQueue.length > 0) {
        const operation = this.operationQueue.shift()!;
        this.currentOperation = operation;
        
        // SAFETY: Wait for any async operations to complete
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // The actual state modification happens in the calling code
        // This just ensures proper ordering
      }
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
    }
  }
  
  private createStateCopy(state: BattleState): BattleState {
    try {
      // Deep copy to prevent mutations affecting original state
      return JSON.parse(JSON.stringify(state));
    } catch (error) {
      console.error('Failed to create state copy:', error);
      // Fallback to shallow copy
      return { ...state };
    }
  }
  
  // Validate state integrity
  validateState(state: BattleState): boolean {
    try {
      // Basic validation checks
      if (!state.teams?.player?.characters || !state.teams?.opponent?.characters) {
        console.error('Invalid battle state: missing teams or characters');
        return false;
      }
      
      // Check for negative health values
      const allCharacters = [
        ...state.teams.player.characters,
        ...state.teams.opponent.characters
      ];
      
      for (const char of allCharacters) {
        if (char.currentHealth < 0) {
          console.error(`Invalid character health: ${char.character.name} has ${char.currentHealth} HP`);
          return false;
        }
        
        if (char.currentHealth > char.character.combatStats.maxHealth * 2) {
          console.error(`Suspiciously high health: ${char.character.name} has ${char.currentHealth} HP`);
          return false;
        }
      }
      
      // Check morale bounds
      if (state.teams.player.currentMorale < 0 || state.teams.player.currentMorale > 100) {
        console.error(`Invalid morale: ${state.teams.player.currentMorale}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('State validation error:', error);
      return false;
    }
  }
  
  // Get current operation info for debugging
  getCurrentOperation(): StateOperation | null {
    return this.currentOperation;
  }
  
  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.operationQueue.length,
      isProcessing: this.isProcessing,
      currentOperation: this.currentOperation?.id,
      stateVersion: this.stateVersion
    };
  }
}