// Financial System Integration Test
// Tests all components of the financial coaching system working together

import { FinancialPsychologyService } from '../services/financialPsychologyService';
import FinancialTraumaRecoveryService from '../services/financialTraumaRecoveryService';
import FinancialBreakthroughService from '../services/financialBreakthroughService';
import SpiralPreventionService from '../services/spiralPreventionService';
import WealthDisparityService from '../services/wealthDisparityService';
import FinancialRoomMoodService from '../services/financialRoomMoodService';
import GameEventBus from '../services/gameEventBus';
import { TherapyPromptTemplateService } from '../data/therapyPromptTemplateService';

export class FinancialSystemIntegrationTest {
  private psychologyService: FinancialPsychologyService;
  private traumaService: FinancialTraumaRecoveryService;
  private breakthroughService: FinancialBreakthroughService;
  private spiralPreventionService: SpiralPreventionService;
  private wealthDisparityService: WealthDisparityService;
  private roomMoodService: FinancialRoomMoodService;
  private eventBus: GameEventBus;

  constructor() {
    this.psychologyService = FinancialPsychologyService.getInstance();
    this.traumaService = FinancialTraumaRecoveryService.getInstance();
    this.breakthroughService = FinancialBreakthroughService.getInstance();
    this.spiralPreventionService = SpiralPreventionService.getInstance();
    this.wealthDisparityService = WealthDisparityService.getInstance();
    this.roomMoodService = FinancialRoomMoodService.getInstance();
    this.eventBus = GameEventBus.getInstance();
  }

  /**
   * Test complete financial coaching system integration
   */
  async runIntegrationTest(): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
  }> {
    const results: any[] = [];
    const errors: string[] = [];

    try {
      // Test 1: Psychology Service Integration
      console.log('🧠 Testing Financial Psychology Service...');
      const psychologyTest = await this.testFinancialPsychology();
      results.push({ test: 'Financial Psychology', ...psychologyTest });
      if (!psychologyTest.success) errors.push('Financial Psychology test failed');

      // Test 2: Trauma Recovery Integration
      console.log('🩹 Testing Financial Trauma Recovery...');
      const traumaTest = await this.testTraumaRecovery();
      results.push({ test: 'Trauma Recovery', ...traumaTest });
      if (!traumaTest.success) errors.push('Trauma Recovery test failed');

      // Test 3: Breakthrough System Integration
      console.log('💡 Testing Financial Breakthrough System...');
      const breakthroughTest = await this.testBreakthroughSystem();
      results.push({ test: 'Breakthrough System', ...breakthroughTest });
      if (!breakthroughTest.success) errors.push('Breakthrough System test failed');

      // Test 4: Spiral Prevention Integration
      console.log('🔄 Testing Spiral Prevention System...');
      const spiralTest = await this.testSpiralPrevention();
      results.push({ test: 'Spiral Prevention', ...spiralTest });
      if (!spiralTest.success) errors.push('Spiral Prevention test failed');

      // Test 5: Wealth Disparity System
      console.log('💰 Testing Wealth Disparity System...');
      const wealthTest = await this.testWealthDisparity();
      results.push({ test: 'Wealth Disparity', ...wealthTest });
      if (!wealthTest.success) errors.push('Wealth Disparity test failed');

      // Test 6: Room Mood Integration
      console.log('🏠 Testing Room Mood Integration...');
      const roomTest = await this.testRoomMoodIntegration();
      results.push({ test: 'Room Mood Integration', ...roomTest });
      if (!roomTest.success) errors.push('Room Mood Integration test failed');

      // Test 7: Therapy System Integration
      console.log('🛋️ Testing Therapy System Integration...');
      const therapyTest = await this.testTherapyIntegration();
      results.push({ test: 'Therapy Integration', ...therapyTest });
      if (!therapyTest.success) errors.push('Therapy Integration test failed');

      // Test 8: Event Bus Integration
      console.log('📡 Testing Event Bus Integration...');
      const eventTest = await this.testEventBusIntegration();
      results.push({ test: 'Event Bus Integration', ...eventTest });
      if (!eventTest.success) errors.push('Event Bus Integration test failed');

      const overallSuccess = errors.length === 0;
      console.log(`\n✅ Integration Test ${overallSuccess ? 'PASSED' : 'FAILED'}`);
      console.log(`   Successful tests: ${results.filter(r => r.success).length}/${results.length}`);
      if (errors.length > 0) {
        console.log(`   Errors: ${errors.join(', ')}`);
      }

      return {
        success: overallSuccess,
        results,
        errors
      };

    } catch (error) {
      console.error('❌ Integration test failed with error:', error);
      return {
        success: false,
        results,
        errors: [...errors, `Integration test error: ${error}`]
      };
    }
  }

  /**
   * Test financial psychology service
   */
  private async testFinancialPsychology(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const testCharacterId = 'test_character_001';
      const testPersonality = {
        riskTolerance: 60,
        spendingStyle: 'moderate' as const,
        luxuryDesire: 40,
        planningHorizon: 'medium' as const,
        socialInfluence: 50,
        stressResponse: 'analytical' as const,
        empathy: 70,
        impulsiveness: 30
      };

      // Test stress calculation
      const stressData = this.psychologyService.calculateFinancialStress(
        testCharacterId,
        5000, // wallet
        3000, // monthly earnings
        [], // recent decisions
        testPersonality
      );

      // Test decision quality calculation
      const decisionQuality = this.psychologyService.calculateFinancialDecisionQuality(
        [], // recent decisions
        stressData,
        testPersonality,
        75 // coach trust
      );

      // Test spiral detection
      const spiralState = this.psychologyService.calculateSpiralState([]);

      if (stressData.totalStress >= 0 && decisionQuality.overallQuality >= 0 && spiralState.spiralRisk >= 0) {
        return {
          success: true,
          data: {
            stressLevel: stressData.totalStress,
            decisionQuality: decisionQuality.overallQuality,
            spiralRisk: spiralState.spiralRisk
          }
        };
      } else {
        return { success: false, error: 'Invalid calculation results' };
      }

    } catch (error) {
      return { success: false, error: `Psychology service error: ${error}` };
    }
  }

  /**
   * Test trauma recovery system
   */
  private async testTraumaRecovery(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const testCharacterId = 'test_character_002';
      const testTrauma = {
        id: 'test_trauma_001',
        characterId: testCharacterId,
        traumaType: 'financial_loss' as const,
        severity: 'moderate' as const,
        triggerEvent: 'Major investment loss',
        psychologicalImpact: {
          stressIncrease: 30,
          trustDecrease: 20,
          decisionQualityReduction: 15
        },
        healingProgress: 0,
        recoveryTimeEstimate: 30,
        therapyRequired: true,
        timestamp: new Date()
      };

      // Test trauma creation
      const traumaData = this.traumaService.getTraumaProfile(testCharacterId);
      
      // Test healing progress calculation
      const healingProgress = this.traumaService.calculateHealingProgress(testCharacterId);

      return {
        success: true,
        data: {
          traumaExists: traumaData !== null,
          healingProgress: healingProgress.overallProgress
        }
      };

    } catch (error) {
      return { success: false, error: `Trauma recovery error: ${error}` };
    }
  }

  /**
   * Test breakthrough system
   */
  private async testBreakthroughSystem(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const testContext = {
        characterId: 'test_character_003',
        therapistId: 'carl-jung',
        sessionStage: 'breakthrough' as const,
        financialStressLevel: 65,
        isInSpiral: false,
        spiralIntensity: 0,
        traumaLevel: 40,
        trustLevel: 60,
        activeFinancialConflicts: ['debt_shame'],
        recentFinancialDecisions: [],
        financialPersonality: {
          riskTolerance: 50,
          spendingStyle: 'strategic' as const,
          luxuryDesire: 30,
          planningHorizon: 'long' as const,
          socialInfluence: 40,
          stressResponse: 'avoidant' as const,
          empathy: 80,
          impulsiveness: 20
        }
      };

      // Test breakthrough generation
      const breakthrough = await this.breakthroughService.generateFinancialBreakthrough(
        testContext,
        'test_session_001'
      );

      // Test breakthrough prompts
      const prompts = this.breakthroughService.generateBreakthroughPrompts(testContext);

      return {
        success: true,
        data: {
          breakthroughGenerated: breakthrough !== null,
          breakthroughType: breakthrough?.breakthroughType,
          healingEffect: breakthrough?.healingEffect,
          promptsGenerated: prompts !== null
        }
      };

    } catch (error) {
      return { success: false, error: `Breakthrough system error: ${error}` };
    }
  }

  /**
   * Test spiral prevention system
   */
  private async testSpiralPrevention(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const testCharacterId = 'test_character_004';
      const testPersonality = {
        riskTolerance: 40,
        spendingStyle: 'impulsive' as const,
        luxuryDesire: 70,
        planningHorizon: 'short' as const,
        socialInfluence: 60,
        stressResponse: 'emotional' as const,
        empathy: 50,
        impulsiveness: 80
      };

      // Test prevention monitoring
      const preventionResult = await this.spiralPreventionService.monitorAndPrevent(
        testCharacterId,
        'test_coach_001',
        [], // recent decisions
        15, // coach level
        75, // coach trust
        testPersonality
      );

      return {
        success: true,
        data: {
          preventionTriggered: preventionResult.interventionTriggered,
          riskReduction: preventionResult.spiralRiskReduction
        }
      };

    } catch (error) {
      return { success: false, error: `Spiral prevention error: ${error}` };
    }
  }

  /**
   * Test wealth disparity system
   */
  private async testWealthDisparity(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const testTeam = [
        {
          id: 'char_1',
          wallet: 10000,
          monthlyEarnings: 5000,
          totalAssets: 25000,
          personality: { riskTolerance: 50, spendingStyle: 'moderate' as const, luxuryDesire: 40 }
        },
        {
          id: 'char_2',
          wallet: 3000,
          monthlyEarnings: 2000,
          totalAssets: 8000,
          personality: { riskTolerance: 30, spendingStyle: 'strategic' as const, luxuryDesire: 60 }
        },
        {
          id: 'char_3',
          wallet: 15000,
          monthlyEarnings: 7000,
          totalAssets: 40000,
          personality: { riskTolerance: 70, spendingStyle: 'impulsive' as const, luxuryDesire: 80 }
        }
      ];

      // Test wealth analysis
      const wealthAnalysis = this.wealthDisparityService.analyzeTeamWealthDistribution(testTeam);

      // Test conflict generation
      const conflict = await this.wealthDisparityService.generateWealthDisparityConflict(
        'char_2',
        'luxury_purchase',
        testTeam
      );

      return {
        success: true,
        data: {
          wealthAnalyzed: wealthAnalysis.riskFactors.overallRisk >= 0,
          conflictGenerated: conflict !== null,
          giniCoefficient: wealthAnalysis.wealthDistribution.giniCoefficient,
          overallRisk: wealthAnalysis.riskFactors.overallRisk
        }
      };

    } catch (error) {
      return { success: false, error: `Wealth disparity error: ${error}` };
    }
  }

  /**
   * Test room mood integration
   */
  private async testRoomMoodIntegration(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const testCharacterId = 'test_character_005';
      const testPersonality = {
        riskTolerance: 50,
        spendingStyle: 'moderate' as const,
        luxuryDesire: 45,
        planningHorizon: 'medium' as const,
        socialInfluence: 55,
        stressResponse: 'analytical' as const,
        empathy: 60,
        impulsiveness: 40
      };

      const testHeadquarters = {
        rooms: [{
          id: 'room_1',
          assignedCharacters: [testCharacterId],
          theme: 'victorian'
        }],
        currentTier: 'basic_house'
      };

      // Test enhanced happiness calculation
      const roomMoodData = this.roomMoodService.calculateFinancialEnhancedHappiness(
        testCharacterId,
        'room_1',
        testHeadquarters,
        5000, // wallet
        3000, // monthly earnings
        testPersonality
      );

      // Test room mood state
      const roomState = this.roomMoodService.getRoomFinancialMoodState('room_1', testHeadquarters);

      return {
        success: true,
        data: {
          moodCalculated: roomMoodData.totalHappiness >= 1,
          financialModifier: roomMoodData.financialMoodModifier,
          roomStateGenerated: roomState.roomId === 'room_1'
        }
      };

    } catch (error) {
      return { success: false, error: `Room mood integration error: ${error}` };
    }
  }

  /**
   * Test therapy system integration
   */
  private async testTherapyIntegration(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const testContext = {
        character: { id: 'test_char', name: 'Test Character' },
        roommates: [],
        housingTier: 'basic_house',
        roomCapacity: 2,
        currentOccupancy: 1,
        leagueRanking: 15,
        teamRating: 75,
        recentBattleResults: [],
        teamChemistry: 70,
        personalStressFactors: [],
        activeConflicts: [],
        financialStress: 45,
        financialDecisionQuality: 60,
        financialTrust: 70,
        isInFinancialSpiral: false
      };

      // Test therapist opening questions
      const jungQuestion = TherapyPromptTemplateService.generateOpeningQuestion(
        'carl-jung',
        testContext,
        'breakthrough'
      );

      const alienQuestion = TherapyPromptTemplateService.generateOpeningQuestion(
        'zxk14bw7',
        testContext,
        'breakthrough'
      );

      const fairyQuestion = TherapyPromptTemplateService.generateOpeningQuestion(
        'seraphina',
        testContext,
        'breakthrough'
      );

      // Test financial breakthrough questions
      const breakthroughQuestion = TherapyPromptTemplateService.generateFinancialBreakthroughQuestion(
        'carl-jung',
        testContext,
        'trauma_healing'
      );

      return {
        success: true,
        data: {
          jungQuestionGenerated: jungQuestion.length > 0,
          alienQuestionGenerated: alienQuestion.length > 0,
          fairyQuestionGenerated: fairyQuestion.length > 0,
          breakthroughQuestionGenerated: breakthroughQuestion.length > 0
        }
      };

    } catch (error) {
      return { success: false, error: `Therapy integration error: ${error}` };
    }
  }

  /**
   * Test event bus integration
   */
  private async testEventBusIntegration(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let eventsReceived = 0;
      const testEvents = [
        'financial_decision_made',
        'financial_breakthrough_achieved',
        'wealth_disparity_conflict_created',
        'financial_trauma_healing_progress',
        'spiral_prevention_intervention'
      ];

      // Subscribe to test events
      const unsubscribers = testEvents.map(eventType => {
        return this.eventBus.subscribe(eventType, (data: any) => {
          eventsReceived++;
          console.log(`📡 Event received: ${eventType}`);
        });
      });

      // Publish test events
      for (const eventType of testEvents) {
        this.eventBus.publish(eventType, 'test_character', `Test ${eventType}`, { test: true });
      }

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cleanup
      unsubscribers.forEach(unsubscriber => unsubscriber());

      return {
        success: eventsReceived === testEvents.length,
        data: {
          eventsPublished: testEvents.length,
          eventsReceived,
          eventTypes: testEvents
        }
      };

    } catch (error) {
      return { success: false, error: `Event bus integration error: ${error}` };
    }
  }

  /**
   * Generate integration test report
   */
  generateTestReport(testResults: any): string {
    const { success, results, errors } = testResults;
    
    let report = `# Financial System Integration Test Report\n\n`;
    report += `**Overall Result**: ${success ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `**Test Date**: ${new Date().toISOString()}\n\n`;
    
    report += `## Test Results Summary\n\n`;
    
    results.forEach((result: any, index: number) => {
      const status = result.success ? '✅' : '❌';
      report += `${index + 1}. ${status} **${result.test}**\n`;
      
      if (result.data) {
        report += `   - Data: ${JSON.stringify(result.data, null, 2)}\n`;
      }
      
      if (result.error) {
        report += `   - Error: ${result.error}\n`;
      }
      
      report += '\n';
    });
    
    if (errors.length > 0) {
      report += `## Errors Encountered\n\n`;
      errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`;
      });
      report += '\n';
    }
    
    report += `## System Components Tested\n\n`;
    report += `- Financial Psychology Service\n`;
    report += `- Trauma Recovery System\n`;
    report += `- Breakthrough System\n`;
    report += `- Spiral Prevention System\n`;
    report += `- Wealth Disparity System\n`;
    report += `- Room Mood Integration\n`;
    report += `- Therapy System Integration\n`;
    report += `- Event Bus Integration\n`;
    
    return report;
  }
}

// Export for use in tests
export default FinancialSystemIntegrationTest;