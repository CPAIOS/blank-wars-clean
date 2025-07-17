#!/usr/bin/env node

/**
 * Test script for all chat APIs in Blank Wars
 * Tests HTTP endpoints and provides WebSocket test guidance
 */

const https = require('https');

const BASE_URL = 'https://blank-wars-clean-production.up.railway.app';

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testChatAPIs() {
  console.log('🧪 Testing Blank Wars Chat APIs\n');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test 1: Training Activities API
  console.log('1️⃣ Testing Training Activities API...');
  try {
    const response = await makeRequest('/api/training/activities');
    if (response.status === 200 && response.data.success) {
      console.log('✅ Training Activities API - Working');
      console.log(`   Found ${response.data.activities.length} training activities`);
      results.passed.push('Training Activities API');
    } else {
      console.log('❌ Training Activities API - Failed');
      results.failed.push('Training Activities API');
    }
  } catch (error) {
    console.log('❌ Training Activities API - Error:', error.message);
    results.failed.push('Training Activities API');
  }

  // Test 2: Confessional Interview API (HOSTMASTER)
  console.log('\n2️⃣ Testing Confessional Interview API (HOSTMASTER)...');
  try {
    const testData = {
      context: { 
        livingConditions: { name: 'cramped quarters' },
        teamDynamics: 'tense',
        recentEvents: 'conflict over bathroom schedule'
      },
      userResponse: 'I am feeling very stressed about living with my teammates'
    };
    
    const response = await makeRequest('/api/confessional-interview', 'POST', testData);
    if (response.status === 200 && response.data.hostmasterResponse) {
      if (response.data.hostmasterResponse.includes('Spill the tea')) {
        console.log('⚠️ Confessional Interview API - Using fallback response (AI service failed)');
        results.warnings.push('Confessional Interview API - AI service not working');
      } else {
        console.log('✅ Confessional Interview API - AI Working');
        console.log(`   Response: "${response.data.hostmasterResponse.substring(0, 50)}..."`);
        results.passed.push('Confessional Interview API');
      }
    } else {
      console.log('❌ Confessional Interview API - Failed');
      results.failed.push('Confessional Interview API');
    }
  } catch (error) {
    console.log('❌ Confessional Interview API - Error:', error.message);
    results.failed.push('Confessional Interview API');
  }

  // Test 3: Confessional Character Response API
  console.log('\n3️⃣ Testing Confessional Character Response API...');
  try {
    const testData = {
      characterContext: {
        characterId: 'achilles',
        characterName: 'Achilles',
        personality: {
          traits: ['brave', 'proud', 'honorable'],
          speechStyle: 'heroic and passionate',
          motivations: ['honor', 'glory'],
          fears: ['dishonor']
        }
      },
      prompt: 'How do you feel about living in these cramped quarters with other legendary figures?'
    };
    
    const response = await makeRequest('/api/confessional-character-response', 'POST', testData);
    if (response.status === 200 && response.data.message) {
      if (response.data.message.includes('not sure what to say')) {
        console.log('⚠️ Confessional Character Response API - Using fallback response (AI service failed)');
        results.warnings.push('Confessional Character Response API - AI service not working');
      } else {
        console.log('✅ Confessional Character Response API - AI Working');
        console.log(`   Achilles said: "${response.data.message.substring(0, 60)}..."`);
        results.passed.push('Confessional Character Response API');
      }
    } else {
      console.log('❌ Confessional Character Response API - Failed');
      results.failed.push('Confessional Character Response API');
    }
  } catch (error) {
    console.log('❌ Confessional Character Response API - Error:', error.message);
    results.failed.push('Confessional Character Response API');
  }

  // Test 4: Characters API (needed for chat)
  console.log('\n4️⃣ Testing Characters API...');
  try {
    const response = await makeRequest('/api/user/characters');
    if (response.status === 200 && response.data.success && response.data.characters) {
      console.log('✅ Characters API - Working');
      console.log(`   Found ${response.data.characters.length} characters available for chat`);
      results.passed.push('Characters API');
    } else {
      console.log('❌ Characters API - Failed');
      results.failed.push('Characters API');
    }
  } catch (error) {
    console.log('❌ Characters API - Error:', error.message);
    results.failed.push('Characters API');
  }

  // Summary
  console.log('\n📊 CHAT API TEST RESULTS');
  console.log('========================');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️ Warnings: ${results.warnings.length}`);
  
  if (results.passed.length > 0) {
    console.log('\n✅ Working APIs:');
    results.passed.forEach(api => console.log(`   • ${api}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed APIs:');
    results.failed.forEach(api => console.log(`   • ${api}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    results.warnings.forEach(warning => console.log(`   • ${warning}`));
  }

  console.log('\n🔌 WebSocket Chat APIs (require frontend testing):');
  console.log('   • chat_message - Main character conversations');
  console.log('   • kitchen_chat_request - Kitchen/living area chat');
  console.log('   • team_chat_message - Battle team chat');
  console.log('   • These require Socket.io connection and authentication');

  // Check for potential OpenAI API key issues
  if (results.warnings.length > 0) {
    console.log('\n🔑 LIKELY ISSUE: OpenAI API Key');
    console.log('   The fallback responses suggest the OpenAI API key might be:');
    console.log('   • Missing from Railway environment variables');
    console.log('   • Invalid or expired');
    console.log('   • Rate limited');
    console.log('   • Check OPENAI_API_KEY in Railway dashboard');
  }

  return {
    totalTests: 4,
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length
  };
}

// Run the tests
testChatAPIs().then(summary => {
  console.log(`\n🏁 Complete: ${summary.passed}/${summary.totalTests} APIs working properly`);
  process.exit(summary.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});