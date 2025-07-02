// Quick test script to validate OpenAI API connection
const { config } = require('dotenv');
const OpenAI = require('openai');

// Load environment variables
config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  console.log('🔑 Testing OpenAI API...');
  console.log('API Key present:', !!process.env.OPENAI_API_KEY);
  console.log('API Key length:', process.env.OPENAI_API_KEY?.length || 0);
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are Achilles, the legendary Greek hero.' },
        { role: 'user', content: 'Hello, how are you?' }
      ],
      max_tokens: 50
    });
    
    console.log('✅ OpenAI API working!');
    console.log('Response:', response.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ OpenAI API Error:');
    console.error('Error message:', error.message);
    console.error('Error type:', error.constructor.name);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testOpenAI();