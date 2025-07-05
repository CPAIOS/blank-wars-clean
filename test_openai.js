require('dotenv').config({ path: './backend/.env' });

console.log('Testing OpenAI API...');
console.log('API Key present:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
console.log('API Key length:', process.env.OPENAI_API_KEY?.length || 0);

const OpenAI = require('openai');
const cleanApiKey = process.env.OPENAI_API_KEY?.replace(/\s/g, '').trim();

const openai = new OpenAI({
  apiKey: cleanApiKey,
});

async function testOpenAI() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are Dracula complaining about sleeping under a kitchen table.' },
        { role: 'user', content: 'How did you sleep last night?' }
      ],
      temperature: 0.9,
      max_tokens: 100,
    });

    console.log('\n✅ OpenAI API is working!');
    console.log('Response:', response.choices[0]?.message?.content);
  } catch (error) {
    console.error('\n❌ OpenAI API Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

testOpenAI();