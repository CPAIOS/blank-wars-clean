import { HealingService } from './healingService';
import { ResurrectionService } from './resurrectionService';

export class HealingScheduler {
  private static instance: HealingScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): HealingScheduler {
    if (!HealingScheduler.instance) {
      HealingScheduler.instance = new HealingScheduler();
    }
    return HealingScheduler.instance;
  }

  /**
   * Start the healing scheduler to process completed sessions
   */
  start(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log('⚕️ Healing scheduler is already running');
      return;
    }

    console.log(`⚕️ Starting healing scheduler (checking every ${intervalMinutes} minutes)`);
    
    this.intervalId = setInterval(async () => {
      try {
        await this.processHealingTasks();
      } catch (error) {
        console.error('❌ Error in healing scheduler:', error);
      }
    }, intervalMinutes * 60 * 1000);

    this.isRunning = true;

    // Run once immediately
    this.processHealingTasks().catch(error => {
      console.error('❌ Error in initial healing task processing:', error);
    });
  }

  /**
   * Stop the healing scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⚕️ Healing scheduler stopped');
  }

  /**
   * Process all healing-related tasks
   */
  private async processHealingTasks(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Processing healing tasks...');
      
      // Process completed healing sessions
      await HealingService.processCompletedHealingSessions();
      
      // Check for characters eligible for natural resurrection
      await ResurrectionService.processNaturalResurrections();
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Healing task processing completed in ${processingTime}ms`);
      
    } catch (error) {
      console.error('❌ Error processing healing tasks:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; intervalId: boolean } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null
    };
  }

  /**
   * Force process healing tasks (for manual triggering)
   */
  async forceProcess(): Promise<void> {
    console.log('🔧 Manually triggering healing task processing...');
    await this.processHealingTasks();
  }
}

// Export singleton instance
export const healingScheduler = HealingScheduler.getInstance();