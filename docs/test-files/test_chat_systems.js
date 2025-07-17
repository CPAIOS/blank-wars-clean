#!/usr/bin/env node

const { io } = require('socket.io-client');

console.log('🧪 Blank Wars Chat Systems Test');
console.log('================================');

// Configuration
const BACKEND_URL = 'http://localhost:3006';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test data
const testCharacters = [
  {
    id: 'sherlock_holmes',
    name: 'Sherlock Holmes',
    personality: {
      traits: ['Analytical', 'Observant', 'Eccentric'],
      speechStyle: 'Precise and deductive',
      motivations: ['Truth', 'Justice', 'Intellectual challenge'],
      fears: ['Boredom', 'Mediocrity']
    },
    historicalPeriod: 'Victorian England',
    mythology: 'Literary detective fiction'
  },
  {
    id: 'count_dracula', 
    name: 'Count Dracula',
    personality: {
      traits: ['Aristocratic', 'Dramatic', 'Nocturnal'],
      speechStyle: 'Formal and theatrical',
      motivations: ['Power', 'Survival', 'Dominance'],
      fears: ['Sunlight', 'Holy symbols', 'Garlic']
    },
    historicalPeriod: 'Medieval Transylvania',
    mythology: 'Gothic horror'
  }
];

class ChatSystemTester {
  constructor() {
    this.results = {
      kitchenChat: { status: 'pending', details: null },
      individualChat: { status: 'pending', details: null },
      battleChat: { status: 'pending', details: null },
      connection: { status: 'pending', details: null }
    };
    this.socket = null;
  }

  async runAllTests() {
    console.log('\n📡 Testing socket connection...');
    await this.testConnection();
    
    if (this.results.connection.status === 'success') {
      console.log('\n🍽️ Testing Kitchen Table chat...');
      await this.testKitchenChat();
      
      console.log('\n👤 Testing individual character chat...');
      await this.testIndividualChat();
      
      console.log('\n⚔️ Testing battle chat...');
      await this.testBattleChat();
    }
    
    this.printResults();
    
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  async testConnection() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.results.connection = {
          status: 'failed',
          details: 'Connection timeout'
        };
        resolve();
      }, 5000);

      this.socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.results.connection = {
          status: 'success',
          details: `Connected with ID: ${this.socket.id}`
        };
        console.log('✅ Socket connected:', this.socket.id);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        this.results.connection = {
          status: 'failed',
          details: `Connection error: ${error.message}`
        };
        resolve();
      });

      this.socket.on('connection_established', (data) => {
        console.log('🔗 Connection established:', data);
      });
    });
  }

  async testKitchenChat() {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        this.results.kitchenChat = {
          status: 'failed',
          details: 'Socket not connected'
        };
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        this.results.kitchenChat = {
          status: 'failed',
          details: 'Kitchen chat timeout - no response received'
        };
        resolve();
      }, TEST_TIMEOUT);

      const conversationId = `test_kitchen_${Date.now()}`;
      const testCharacter = testCharacters[0];

      // Set up response listener
      this.socket.on('kitchen_conversation_response', (data) => {
        if (data.conversationId === conversationId) {
          clearTimeout(timeout);
          
          if (data.error) {
            this.results.kitchenChat = {
              status: 'failed',
              details: `Kitchen chat error: ${data.error || data.message}`
            };
          } else {
            this.results.kitchenChat = {
              status: 'success',
              details: `Response received: "${data.message.substring(0, 100)}..."`
            };
          }
          resolve();
        }
      });

      // Send kitchen chat request
      console.log('📤 Sending kitchen chat request...');
      this.socket.emit('kitchen_chat_request', {
        conversationId,
        characterId: testCharacter.id,
        prompt: 'Test kitchen conversation prompt',
        trigger: 'Someone is making coffee and it smells terrible',
        context: {
          teammates: ['Dracula', 'Joan of Arc'],
          coach: 'Coach',
          livingConditions: {
            apartmentTier: 'spartan_apartment',
            roomTheme: null,
            sleepsOnCouch: false,
            sleepsUnderTable: false
          }
        }
      });
    });
  }

  async testIndividualChat() {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        this.results.individualChat = {
          status: 'failed',
          details: 'Socket not connected'
        };
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        this.results.individualChat = {
          status: 'failed',
          details: 'Individual chat timeout - no response received'
        };
        resolve();
      }, TEST_TIMEOUT);

      const testCharacter = testCharacters[1];

      // Try to find individual chat handlers
      this.socket.on('chat_response', (data) => {
        clearTimeout(timeout);
        
        if (data.error) {
          this.results.individualChat = {
            status: 'failed',
            details: `Individual chat error: ${data.error}`
          };
        } else {
          this.results.individualChat = {
            status: 'success',
            details: `Response received: "${data.message.substring(0, 100)}..."`
          };
        }
        resolve();
      });

      this.socket.on('chat_error', (data) => {
        clearTimeout(timeout);
        this.results.individualChat = {
          status: 'failed',
          details: `Individual chat error: ${data.error}`
        };
        resolve();
      });

      // Send individual character chat message
      console.log('📤 Sending individual chat message...');
      this.socket.emit('chat_message', {
        character: testCharacter.id,
        message: 'Hello, how are you feeling about the upcoming battle?',
        characterData: testCharacter
      });
    });
  }

  async testBattleChat() {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        this.results.battleChat = {
          status: 'failed',
          details: 'Socket not connected'
        };
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        this.results.battleChat = {
          status: 'failed',
          details: 'Battle chat timeout - no response received'
        };
        resolve();
      }, TEST_TIMEOUT);

      const testCharacter = testCharacters[0];

      // Set up response listener for team chat
      this.socket.on('team_chat_response', (data) => {
        clearTimeout(timeout);
        
        this.results.battleChat = {
          status: 'success',
          details: `Response received: "${data.message.substring(0, 100)}..."`
        };
        resolve();
      });

      this.socket.on('team_chat_error', (data) => {
        clearTimeout(timeout);
        this.results.battleChat = {
          status: 'failed',
          details: `Battle chat error: ${data.error}`
        };
        resolve();
      });

      // Send team/battle chat message
      console.log('📤 Sending battle chat message...');
      this.socket.emit('team_chat_message', {
        message: 'What strategy should we use in this battle?',
        character: testCharacter.id,
        characterId: testCharacter.id,
        characterData: testCharacter,
        battleContext: {
          isInBattle: true,
          currentHealth: 80,
          maxHealth: 100,
          opponentName: 'Test Opponent',
          battlePhase: 'combat'
        }
      });
    });
  }

  printResults() {
    console.log('\n📋 Chat Systems Test Results');
    console.log('============================');
    
    Object.entries(this.results).forEach(([system, result]) => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'failed' ? '❌' : '⏳';
      console.log(`${icon} ${system}: ${result.status.toUpperCase()}`);
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    });

    const successCount = Object.values(this.results).filter(r => r.status === 'success').length;
    const totalCount = Object.keys(this.results).length;
    
    console.log(`\n📊 Summary: ${successCount}/${totalCount} systems working`);
    
    if (successCount === totalCount) {
      console.log('🎉 All chat systems are operational!');
    } else {
      console.log('⚠️ Some chat systems need attention.');
    }
  }
}

// Run the tests
const tester = new ChatSystemTester();
tester.runAllTests().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});