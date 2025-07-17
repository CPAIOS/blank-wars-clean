#!/usr/bin/env node

// Simple test runner for financial system integration
import FinancialSystemIntegrationTest from './financialSystemIntegrationTest';

async function runTests() {
  console.log('🚀 Starting Financial System Integration Tests...\n');
  
  const testSuite = new FinancialSystemIntegrationTest();
  
  try {
    const results = await testSuite.runIntegrationTest();
    
    console.log('\n📊 Generating Test Report...\n');
    const report = testSuite.generateTestReport(results);
    console.log(report);
    
    if (results.success) {
      console.log('🎉 All tests passed! Financial system integration is working correctly.');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed. Please check the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test suite failed to run:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export default runTests;