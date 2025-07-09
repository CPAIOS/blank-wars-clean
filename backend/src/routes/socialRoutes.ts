import express from 'express';
import { authenticateToken } from '../services/auth';
import { aiChatService } from '../services/aiChatService';
import { db } from '../database/index';
// We'll need to implement character data access - for now using a simple lookup
const characterPsychologyData: Record<string, any> = {
  'sherlock_holmes': {
    name: 'Sherlock Holmes',
    personality: {
      traits: ['Analytical', 'Brilliant', 'Observant', 'Arrogant'],
      speechStyle: 'Precise and condescending',
      motivations: ['Truth', 'Intellectual challenge', 'Justice'],
      fears: ['Boredom', 'Mediocrity', 'Unsolved mysteries']
    },
    historicalPeriod: 'Victorian Era',
    mythology: 'Literary detective fiction'
  },
  'count_dracula': {
    name: 'Count Dracula',
    personality: {
      traits: ['Aristocratic', 'Manipulative', 'Charismatic', 'Ruthless'],
      speechStyle: 'Formal and theatrical',
      motivations: ['Power', 'Survival', 'Domination'],
      fears: ['Holy symbols', 'Sunlight', 'Wooden stakes']
    },
    historicalPeriod: 'Medieval/Victorian',
    mythology: 'Gothic horror'
  },
  'joan_of_arc': {
    name: 'Joan of Arc',
    personality: {
      traits: ['Devout', 'Courageous', 'Determined', 'Inspirational'],
      speechStyle: 'Passionate and righteous',
      motivations: ['Divine mission', 'French victory', 'Faith'],
      fears: ['Failing God', 'English victory', 'Betrayal']
    },
    historicalPeriod: 'Medieval France',
    mythology: 'Historical saint'
  },
  'achilles': {
    name: 'Achilles',
    personality: {
      traits: ['Prideful', 'Fierce', 'Loyal', 'Wrathful'],
      speechStyle: 'Bold and dramatic',
      motivations: ['Glory', 'Honor', 'Revenge'],
      fears: ['Dishonor', 'Being forgotten', 'Cowardice']
    },
    historicalPeriod: 'Ancient Greece',
    mythology: 'Greek mythology'
  },
  'genghis_khan': {
    name: 'Genghis Khan',
    personality: {
      traits: ['Strategic', 'Ruthless', 'Adaptive', 'Ambitious'],
      speechStyle: 'Commanding and direct',
      motivations: ['Conquest', 'Empire building', 'Unity'],
      fears: ['Weakness', 'Betrayal', 'Defeat']
    },
    historicalPeriod: 'Medieval Mongolia',
    mythology: 'Historical conqueror'
  },
  'nikola_tesla': {
    name: 'Nikola Tesla',
    personality: {
      traits: ['Brilliant', 'Eccentric', 'Visionary', 'Obsessive'],
      speechStyle: 'Technical and passionate',
      motivations: ['Scientific discovery', 'Innovation', 'Progress'],
      fears: ['Failure', 'Theft of ideas', 'Mediocrity']
    },
    historicalPeriod: 'Industrial Revolution',
    mythology: 'Historical inventor'
  },
  'cleopatra': {
    name: 'Cleopatra',
    personality: {
      traits: ['Intelligent', 'Charming', 'Cunning', 'Regal'],
      speechStyle: 'Elegant and commanding',
      motivations: ['Power', 'Egypt\'s glory', 'Legacy'],
      fears: ['Rome\'s conquest', 'Betrayal', 'Obscurity']
    },
    historicalPeriod: 'Ancient Egypt',
    mythology: 'Historical queen'
  },
  'merlin': {
    name: 'Merlin',
    personality: {
      traits: ['Wise', 'Mysterious', 'Powerful', 'Cryptic'],
      speechStyle: 'Mystical and knowing',
      motivations: ['Knowledge', 'Guidance', 'Balance'],
      fears: ['Misuse of power', 'Prophecy', 'Corruption']
    },
    historicalPeriod: 'Arthurian Legend',
    mythology: 'Celtic/Arthurian mythology'
  }
};

const router = express.Router();

// POST /api/social/ai-drama - Generate AI drama board messages
router.post('/ai-drama', authenticateToken, async (req: any, res) => {
  try {
    const { characterId, triggerType, battleHistory, rivalries, context } = req.body;
    
    // Get character personality from frontend data
    const characterData = characterPsychologyData[characterId];
    if (!characterData) {
      return res.status(400).json({ error: 'Character not found' });
    }

    // Build drama context based on trigger type
    let dramaPrompt = '';
    switch (triggerType) {
      case 'battle_victory':
        dramaPrompt = `You just won a battle against ${battleHistory?.opponent || 'an opponent'}. Generate a short, cocky trash talk message for the drama board. Be in character and reference the victory. Keep it under 100 words.`;
        break;
      case 'battle_defeat':
        dramaPrompt = `You just lost a battle to ${battleHistory?.opponent || 'an opponent'}. Generate a short, defiant or excuse-making message for the drama board. Be in character and show your reaction to the loss. Keep it under 100 words.`;
        break;
      case 'rivalry_escalation':
        dramaPrompt = `Your rivalry with ${rivalries?.target || 'another character'} has escalated. Generate a short, heated message calling them out on the drama board. Be in character and reference your ongoing conflict. Keep it under 100 words.`;
        break;
      case 'random_drama':
        dramaPrompt = `Generate a random dramatic statement or trash talk for the drama board. Be in character and create some spicy content that would stir up drama. Keep it under 100 words.`;
        break;
      default:
        dramaPrompt = 'Generate a dramatic statement for the drama board. Be in character and create engaging content.';
    }

    // Use AI service to generate response
    const response = await aiChatService.generateCharacterResponse(
      {
        characterId,
        characterName: characterData.name,
        personality: characterData.personality,
        historicalPeriod: characterData.historicalPeriod,
        mythology: characterData.mythology,
        currentBondLevel: 50
      },
      dramaPrompt,
      req.user.id,
      db,
      { isInBattle: false }
    );

    res.json({
      message: response.message,
      character: characterData.name,
      timestamp: new Date().toISOString(),
      triggerType
    });

  } catch (error) {
    console.error('AI Drama generation error:', error);
    res.status(500).json({ error: 'Failed to generate drama message' });
  }
});

// POST /api/social/lounge - Generate social lounge conversations
router.post('/lounge', authenticateToken, async (req: any, res) => {
  try {
    const { characterId, context, userMessage, conversationType } = req.body;
    
    // Get character personality from frontend data
    const characterData = characterPsychologyData[characterId];
    if (!characterData) {
      return res.status(400).json({ error: 'Character not found' });
    }

    // Build lounge conversation context
    let loungePrompt = '';
    if (conversationType === 'character_interaction') {
      loungePrompt = `You're in the social lounge with other characters. ${context?.situation || 'Generate a casual conversation response'}. Be in character and engage naturally. Keep responses conversational (2-3 sentences max).`;
    } else if (conversationType === 'user_chat') {
      loungePrompt = userMessage;
    } else {
      loungePrompt = `You're relaxing in the social lounge. ${context?.situation || 'Generate a casual comment or observation'}. Be in character and show your personality. Keep it conversational.`;
    }

    // Use AI service to generate response
    const response = await aiChatService.generateCharacterResponse(
      {
        characterId,
        characterName: characterData.name,
        personality: characterData.personality,
        historicalPeriod: characterData.historicalPeriod,
        mythology: characterData.mythology,
        currentBondLevel: context?.bondLevel || 50,
        previousMessages: context?.previousMessages || []
      },
      loungePrompt,
      req.user.id,
      db,
      { isInBattle: false }
    );

    res.json({
      message: response.message,
      character: characterData.name,
      characterId,
      timestamp: new Date().toISOString(),
      bondIncrease: response.bondIncrease
    });

  } catch (error) {
    console.error('Lounge conversation error:', error);
    res.status(500).json({ error: 'Failed to generate lounge response' });
  }
});

// POST /api/social/message-board - Generate message board AI responses
router.post('/message-board', authenticateToken, async (req: any, res) => {
  try {
    const { userMessage, context, responseType = 'random' } = req.body;
    
    // Select random characters to respond (2-3 characters)
    const availableCharacters = Object.keys(characterPsychologyData);
    const numResponses = Math.min(3, Math.floor(Math.random() * 2) + 2); // 2-3 responses
    const selectedCharacters = availableCharacters
      .sort(() => Math.random() - 0.5)
      .slice(0, numResponses);

    const responses = [];

    for (const characterId of selectedCharacters) {
      const characterData = characterPsychologyData[characterId];
      
      // Create response prompt based on user message
      const boardPrompt = `A user just posted on the community message board: "${userMessage}". 
      
      Generate a response to this post. Be in character and react authentically to what they said. 
      Your response should be:
      - Relevant to their message
      - Show your personality
      - Be conversational (1-2 sentences)
      - Either supportive, challenging, or adding your own perspective
      
      Don't just acknowledge - actually engage with their content.`;

      try {
        const response = await aiChatService.generateCharacterResponse(
          {
            characterId,
            characterName: characterData.name,
            personality: characterData.personality,
            historicalPeriod: characterData.historicalPeriod,
            mythology: characterData.mythology,
            currentBondLevel: 50
          },
          boardPrompt,
          req.user.id,
          db,
          { isInBattle: false }
        );

        responses.push({
          message: response.message,
          character: characterData.name,
          characterId,
          timestamp: new Date().toISOString(),
          bondIncrease: response.bondIncrease
        });

        // Add small delay between AI calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error generating response for ${characterId}:`, error);
        // Continue with other characters if one fails
      }
    }

    res.json({
      responses,
      originalMessage: userMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Message board response error:', error);
    res.status(500).json({ error: 'Failed to generate message board responses' });
  }
});

export default router;