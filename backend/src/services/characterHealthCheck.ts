import { autoEnsureCharacters } from '../database/productionSafeSeeding';

class CharacterHealthCheck {
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 10 * 60 * 1000; // Check every 10 minutes
  
  constructor() {
    console.log('🩺 Character Health Check service initialized');
  }
  
  // Start periodic health checks
  public startHealthChecks(): void {
    if (this.checkInterval) {
      console.log('🩺 Health checks already running');
      return;
    }
    
    console.log(`🩺 Starting character health checks (every ${this.CHECK_INTERVAL_MS / 1000 / 60} minutes)`);
    
    // Do initial check immediately
    this.performHealthCheck();
    
    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.CHECK_INTERVAL_MS);
  }
  
  // Stop periodic health checks
  public stopHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🩺 Character health checks stopped');
    }
  }
  
  // Perform a single health check
  private async performHealthCheck(): Promise<void> {
    try {
      console.log('🩺 Performing character health check...');
      await autoEnsureCharacters();
      console.log('✅ Character health check completed');
    } catch (error) {
      console.error('❌ Character health check failed:', error);
    }
  }
  
  // Manual health check (can be called via API)
  public async manualHealthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🩺 Manual character health check requested');
      await autoEnsureCharacters();
      return {
        success: true,
        message: 'Character health check completed successfully'
      };
    } catch (error) {
      console.error('❌ Manual character health check failed:', error);
      return {
        success: false,
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Singleton instance
export const characterHealthCheck = new CharacterHealthCheck();

// Health checks should be started manually after database initialization
// characterHealthCheck.startHealthChecks();