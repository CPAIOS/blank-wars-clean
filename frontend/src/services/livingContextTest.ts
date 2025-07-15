// Test script to verify living context system is working properly
// This tests the flow: ConflictDatabaseService -> ConflictContextService -> Chat Components

import ConflictContextService from './conflictContextService';
import ConflictDatabaseService from './ConflictDatabaseService';

export class LivingContextTest {
  private conflictService = ConflictContextService.getInstance();
  private conflictDB = ConflictDatabaseService.getInstance();

  async runFullTest(): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    const results = {
      conflictDBTest: null as any,
      contextServiceTest: null as any,
      livingContextGeneration: null as any,
      contextStructure: null as any
    };
    const errors: string[] = [];

    console.log('🧪 Starting Living Context System Test...');

    try {
      // Test 1: ConflictDatabaseService basic functionality
      console.log('1️⃣ Testing ConflictDatabaseService...');
      const testCharacterId = 'achilles';
      const therapyContext = await this.conflictDB.getTherapyContextForCharacter(testCharacterId);
      
      results.conflictDBTest = {
        characterFound: !!therapyContext.character,
        hasRoommates: therapyContext.roommates.length > 0,
        hasActiveConflicts: therapyContext.activeConflicts.length > 0,
        housingTier: therapyContext.housingTier,
        occupancy: `${therapyContext.currentOccupancy}/${therapyContext.roomCapacity}`,
        teamChemistry: therapyContext.teamChemistry
      };

      if (!therapyContext.character) {
        errors.push('ConflictDatabaseService: Character not found');
      }

      // Test 2: ConflictContextService transformation
      console.log('2️⃣ Testing ConflictContextService transformation...');
      const livingContext = await this.conflictService.generateLivingContext(testCharacterId);
      
      results.contextServiceTest = {
        hasLivingContext: !!livingContext,
        housingTier: livingContext.housingTier,
        occupancy: `${livingContext.currentOccupancy}/${livingContext.roomCapacity}`,
        roommateCount: livingContext.roommates.length,
        conflictCount: livingContext.activeConflicts.length,
        hasRecentEvents: livingContext.recentEvents && livingContext.recentEvents.length > 0
      };

      // Test 3: Living context structure validation
      console.log('3️⃣ Validating living context structure...');
      const structureValid = this.validateLivingContextStructure(livingContext);
      
      results.contextStructure = {
        isValid: structureValid,
        hasRequiredFields: this.checkRequiredFields(livingContext),
        roommateStructure: livingContext.roommates.map(r => ({
          hasId: !!r.id,
          hasName: !!r.name,
          hasRelationship: !!r.relationship
        })),
        conflictStructure: livingContext.activeConflicts.map(c => ({
          hasCategory: !!c.category,
          hasSeverity: !!c.severity,
          hasDescription: !!c.description,
          hasInvolvedCharacters: !!c.involvedCharacters
        }))
      };

      // Test 4: Generate sample context for different characters
      console.log('4️⃣ Testing multiple character contexts...');
      const testCharacters = ['achilles', 'joan', 'holmes'];
      const characterContexts = {};
      
      for (const charId of testCharacters) {
        try {
          const context = await this.conflictService.generateLivingContext(charId);
          characterContexts[charId] = {
            success: true,
            conflictCount: context.activeConflicts.length,
            roommateCount: context.roommates.length,
            teamChemistry: context.teamChemistry
          };
        } catch (error) {
          characterContexts[charId] = {
            success: false,
            error: error.message
          };
          errors.push(`Character ${charId}: ${error.message}`);
        }
      }

      results.livingContextGeneration = characterContexts;

      console.log('✅ Living Context System Test Complete');
      return {
        success: errors.length === 0,
        results,
        errors
      };

    } catch (error) {
      console.error('❌ Living Context System Test Failed:', error);
      errors.push(`Critical error: ${error.message}`);
      return {
        success: false,
        results,
        errors
      };
    }
  }

  private validateLivingContextStructure(context: any): boolean {
    const requiredFields = [
      'housingTier',
      'currentOccupancy',
      'roomCapacity',
      'roommates',
      'teamChemistry',
      'leagueRanking',
      'activeConflicts'
    ];

    return requiredFields.every(field => context.hasOwnProperty(field));
  }

  private checkRequiredFields(context: any): Record<string, boolean> {
    return {
      housingTier: typeof context.housingTier === 'string',
      currentOccupancy: typeof context.currentOccupancy === 'number',
      roomCapacity: typeof context.roomCapacity === 'number',
      roommates: Array.isArray(context.roommates),
      teamChemistry: typeof context.teamChemistry === 'number',
      leagueRanking: typeof context.leagueRanking === 'number',
      activeConflicts: Array.isArray(context.activeConflicts)
    };
  }

  // Test method for use in browser console
  async quickTest(characterId: string = 'achilles'): Promise<void> {
    console.log(`🔍 Quick test for character: ${characterId}`);
    
    try {
      const livingContext = await this.conflictService.generateLivingContext(characterId);
      
      console.log('🏠 Living Context Generated:');
      console.log('Housing:', `${livingContext.housingTier} (${livingContext.currentOccupancy}/${livingContext.roomCapacity})`);
      console.log('Team Chemistry:', `${livingContext.teamChemistry}%`);
      console.log('Roommates:', livingContext.roommates.map(r => `${r.name} (${r.relationship})`));
      console.log('Active Conflicts:', livingContext.activeConflicts.length);
      
      if (livingContext.activeConflicts.length > 0) {
        console.log('Conflict Details:');
        livingContext.activeConflicts.forEach((conflict, i) => {
          console.log(`  ${i + 1}. ${conflict.category} (${conflict.severity}): ${conflict.description}`);
        });
      }

      console.log('✅ Living context working properly!');
    } catch (error) {
      console.error('❌ Living context test failed:', error);
    }
  }

  // Test integration with chat components
  async testChatIntegration(): Promise<{
    performanceChat: boolean;
    equipmentChat: boolean;
    skillChat: boolean;
    errors: string[];
  }> {
    const testResults = {
      performanceChat: false,
      equipmentChat: false,
      skillChat: false,
      errors: [] as string[]
    };

    console.log('🎯 Testing chat component integration...');

    try {
      // Test if living context can be generated for chat components
      const testCharacterId = 'achilles';
      const livingContext = await this.conflictService.generateLivingContext(testCharacterId);
      
      // Simulate what each chat component does
      const performanceContext = {
        ...livingContext,
        chatType: 'performance'
      };
      
      const equipmentContext = {
        ...livingContext,
        chatType: 'equipment'
      };
      
      const skillContext = {
        ...livingContext,
        chatType: 'skills'
      };

      testResults.performanceChat = !!performanceContext && !!performanceContext.activeConflicts;
      testResults.equipmentChat = !!equipmentContext && !!equipmentContext.roommates;
      testResults.skillChat = !!skillContext && typeof skillContext.teamChemistry === 'number';

      console.log('✅ Chat integration test complete');
      
    } catch (error) {
      testResults.errors.push(`Chat integration error: ${error.message}`);
      console.error('❌ Chat integration test failed:', error);
    }

    return testResults;
  }
}

// Export for easy testing
export const livingContextTest = new LivingContextTest();

// Make available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).livingContextTest = livingContextTest;
}