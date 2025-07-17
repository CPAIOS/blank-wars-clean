import express from 'express';
import { authenticateToken } from '../services/auth';
import { aiChatService } from '../services/aiChatService';
import { db } from '../database/index';

// Character psychology data (same as social routes)
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
  },
  'loki': {
    name: 'Loki',
    personality: {
      traits: ['Cunning', 'Charismatic', 'Unpredictable', 'Intelligent'],
      speechStyle: 'Witty and mischievous',
      motivations: ['Change', 'Recognition', 'Freedom'],
      fears: ['Being bound', 'Rejection', 'Stagnation']
    },
    historicalPeriod: 'Norse Mythology',
    mythology: 'Norse mythology'
  },
  'einstein': {
    name: 'Albert Einstein',
    personality: {
      traits: ['Brilliant', 'Curious', 'Imaginative', 'Pacifist'],
      speechStyle: 'Thoughtful and philosophical',
      motivations: ['Understanding', 'Peace', 'Knowledge'],
      fears: ['Ignorance', 'Violence', 'Waste of potential']
    },
    historicalPeriod: 'Modern Era',
    mythology: 'Historical scientist'
  }
};

const router = express.Router();

// POST /api/coaching/performance - Character performance coaching
router.post('/performance', authenticateToken, async (req: any, res) => {
  try {
    const { characterId, userMessage, context } = req.body;
    
    // Get character personality data
    const characterData = characterPsychologyData[characterId];
    if (!characterData) {
      return res.status(400).json({ error: 'Character not found' });
    }

    // Build performance coaching prompt with character's perspective
    const coachingPrompt = `You are acting as a performance coach to help the user improve their abilities and mindset. The user said: "${userMessage}"

    Based on your personality and experiences, provide coaching advice that:
    - Reflects your unique perspective and wisdom
    - Addresses their specific concern or question
    - Offers practical guidance they can apply
    - Shows your character's coaching style (analytical, inspiring, strategic, etc.)
    - Stays true to your historical background and personality traits
    
    Keep your response focused, actionable, and in character (2-3 sentences max).`;

    // Use existing AI service with coaching context
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
      coachingPrompt,
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
    console.error('Performance coaching error:', error);
    res.status(500).json({ error: 'Failed to generate coaching response' });
  }
});

// POST /api/coaching/individual - Individual coaching sessions
router.post('/individual', authenticateToken, async (req: any, res) => {
  try {
    const { characterId, message, type, intensity, context } = req.body;
    
    // Get character personality data
    const characterData = characterPsychologyData[characterId];
    if (!characterData) {
      return res.status(400).json({ error: 'Character not found' });
    }

    // Build individual coaching prompt based on session type
    let coachingPrompt = '';
    switch (type) {
      case 'motivation':
        coachingPrompt = `The user needs motivational coaching. They said: "${message}". Provide encouragement and motivation that fits your personality and background. Be inspiring but authentic to your character.`;
        break;
      case 'strategy':
        coachingPrompt = `The user wants strategic advice. They said: "${message}". Share strategic insights based on your experience and personality. Give them tactical guidance they can use.`;
        break;
      case 'mindset':
        coachingPrompt = `The user needs mindset coaching. They said: "${message}". Help them develop the right mental approach using your unique perspective and wisdom.`;
        break;
      case 'skills':
        coachingPrompt = `The user wants to improve their skills. They said: "${message}". Provide specific guidance for skill development based on your expertise and character traits.`;
        break;
      default:
        coachingPrompt = `The user is seeking individual coaching guidance. They said: "${message}". Provide helpful coaching advice that reflects your personality and experience.`;
    }

    // Add intensity context
    if (intensity) {
      coachingPrompt += ` The coaching intensity should be ${intensity} - adjust your approach accordingly.`;
    }

    coachingPrompt += ` Keep your response conversational and practical (2-3 sentences).`;

    // Use existing AI service
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
      coachingPrompt,
      req.user.id,
      db,
      { isInBattle: false }
    );

    res.json({
      message: response.message,
      character: characterData.name,
      characterId,
      type,
      intensity,
      timestamp: new Date().toISOString(),
      bondIncrease: response.bondIncrease
    });

  } catch (error) {
    console.error('Individual coaching error:', error);
    res.status(500).json({ error: 'Failed to generate individual coaching response' });
  }
});

// POST /api/coaching/team-management - Team conflict resolution
router.post('/team-management', authenticateToken, async (req: any, res) => {
  try {
    const { characterId, issue, choice, context } = req.body;
    
    // Get character personality data
    const characterData = characterPsychologyData[characterId];
    if (!characterData) {
      return res.status(400).json({ error: 'Character not found' });
    }

    // Build team management coaching prompt
    let coachingPrompt = `You are helping with team management and conflict resolution. 

    Issue: ${issue?.title || 'Team dynamics challenge'}
    User's approach: "${choice}"
    
    Based on your leadership experience and personality, provide guidance on:
    - Whether this approach will be effective
    - What potential consequences to consider  
    - Alternative strategies that might work better
    - How to handle team dynamics based on your experience
    
    Give practical advice that reflects your leadership style and wisdom (2-3 sentences).`;

    // Use existing AI service with team management context
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
      coachingPrompt,
      req.user.id,
      db,
      { isInBattle: false }
    );

    res.json({
      message: response.message,
      character: characterData.name,
      characterId,
      issue: issue?.title,
      choice,
      timestamp: new Date().toISOString(),
      bondIncrease: response.bondIncrease
    });

  } catch (error) {
    console.error('Team management coaching error:', error);
    res.status(500).json({ error: 'Failed to generate team management response' });
  }
});

// POST /api/coaching/equipment - Equipment advisor coaching
router.post('/equipment', authenticateToken, async (req: any, res) => {
  try {
    const { characterId, userMessage, context } = req.body;
    
    // Get character personality data
    const characterData = characterPsychologyData[characterId];
    if (!characterData) {
      return res.status(400).json({ error: 'Character not found' });
    }

    // Build equipment advisor prompt with character's perspective
    const equipmentPrompt = `You are acting as an equipment advisor to help the user choose and optimize their gear. The user said: "${userMessage}"

    Context: 
    - Character Level: ${context?.level || 1}
    - Character Archetype: ${context?.archetype || 'warrior'}
    - Current Equipment: ${context?.currentEquipment ? JSON.stringify(context.currentEquipment) : 'None specified'}
    - Available Equipment: ${context?.availableEquipment ? 'Multiple options available' : 'Standard options'}

    Based on your personality and expertise, provide equipment advice that:
    - Reflects your unique perspective on gear and combat
    - Addresses their specific equipment question or concern
    - Offers practical recommendations for their level and archetype
    - Shows your character's approach to equipment strategy
    - Stays true to your historical background and personality traits
    
    Keep your response focused, actionable, and in character (2-3 sentences max).`;

    // Use existing AI service with equipment context
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
      equipmentPrompt,
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
    console.error('Equipment coaching error:', error);
    res.status(500).json({ error: 'Failed to generate equipment advice' });
  }
});

// POST /api/coaching/skills - Skill development coaching
router.post('/skills', authenticateToken, async (req: any, res) => {
  try {
    const { characterId, userMessage, context } = req.body;
    
    // Get character personality data
    const characterData = characterPsychologyData[characterId];
    if (!characterData) {
      return res.status(400).json({ error: 'Character not found' });
    }

    // Build skill development prompt with character's perspective
    const skillsPrompt = `You are acting as a skill development coach to help the user improve their abilities and combat techniques. The user said: "${userMessage}"

    Context:
    - Character Level: ${context?.level || 1}
    - Current Skills: ${context?.currentSkills ? JSON.stringify(context.currentSkills) : 'Basic abilities'}
    - Skill Focus: ${context?.skillFocus || 'general development'}
    - Available Skill Points: ${context?.skillPoints || 0}

    Based on your personality and combat experience, provide skill advice that:
    - Reflects your unique approach to abilities and skill development
    - Addresses their specific skill question or learning goal
    - Offers practical guidance for skill progression
    - Shows your character's philosophy on training and abilities
    - Stays true to your historical background and combat style
    
    Keep your response focused, actionable, and in character (2-3 sentences max).`;

    // Use existing AI service with skills context
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
      skillsPrompt,
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
    console.error('Skills coaching error:', error);
    res.status(500).json({ error: 'Failed to generate skill development advice' });
  }
});

// POST /api/coaching/group-activity - Group activity chat responses
router.post('/group-activity', authenticateToken, async (req: any, res) => {
  try {
    const { characterId, characterName, coachMessage, eventType, context } = req.body;
    
    // Get character personality data - try both direct match and name-based lookup
    let characterData = characterPsychologyData[characterId];
    if (!characterData) {
      // Try to find by name if direct ID lookup fails
      const nameKey = Object.keys(characterPsychologyData).find(key => 
        characterPsychologyData[key].name.toLowerCase() === characterName.toLowerCase()
      );
      if (nameKey) {
        characterData = characterPsychologyData[nameKey];
      }
    }
    
    if (!characterData) {
      // Create a basic fallback for unknown characters
      characterData = {
        name: characterName,
        personality: {
          traits: ['Friendly', 'Cooperative', 'Team-oriented'],
          speechStyle: 'Casual and collaborative',
          motivations: ['Team success', 'Personal growth', 'Friendship'],
          fears: ['Letting the team down', 'Conflict', 'Isolation']
        },
        historicalPeriod: 'Modern Era',
        mythology: 'Contemporary character'
      };
    }

    // Build group activity prompt based on event type and coach message
    let activityPrompt = '';
    
    switch (eventType.toLowerCase()) {
      case 'team dinner':
      case 'dinner':
        activityPrompt = `You are participating in a team dinner event. The coach just said: "${coachMessage}". 
        Respond as if you're having a casual meal with your teammates. Share personal thoughts, ask questions about others, 
        or comment on the food and atmosphere. Keep it friendly and team-bonding focused.`;
        break;
        
      case 'weekend retreat':
      case 'retreat':
        activityPrompt = `You are at a team weekend retreat. The coach just said: "${coachMessage}". 
        Respond thoughtfully about team dynamics, personal growth, or the retreat activities. 
        This is a deeper bonding experience, so be more reflective and open.`;
        break;
        
      case 'board game night':
      case 'game_night':
        activityPrompt = `You are playing board games with the team. The coach just said: "${coachMessage}". 
        Respond with enthusiasm about the games, strategy discussions, or friendly competitive banter. 
        Show your personality through how you approach games and teamwork.`;
        break;
        
      case 'group therapy session':
      case 'group_therapy':
        activityPrompt = `You are in a group therapy session with your teammates. The coach just said: "${coachMessage}". 
        Respond with vulnerability and honesty appropriate for therapy. Share feelings, concerns, or insights 
        about team dynamics and personal challenges. Be supportive of others.`;
        break;
        
      case 'meditation & mindfulness':
      case 'meditation':
        activityPrompt = `You are in a group meditation and mindfulness session. The coach just said: "${coachMessage}". 
        Respond with calm reflection, insights about inner peace, or observations about mindfulness. 
        Keep your tone peaceful and centered.`;
        break;
        
      case 'victory celebration':
      case 'celebration':
        activityPrompt = `You are celebrating a team victory! The coach just said: "${coachMessage}". 
        Respond with joy, pride in the team's accomplishments, and celebration energy. 
        Share what the victory means to you and praise your teammates.`;
        break;
        
      default:
        activityPrompt = `You are participating in a team activity: ${eventType}. The coach just said: "${coachMessage}". 
        Respond appropriately for this group activity, showing your personality and team spirit.`;
    }
    
    // Add character context
    activityPrompt += `
    
    Response Guidelines:
    - Stay true to your personality traits: ${characterData.personality.traits.join(', ')}
    - Use your characteristic speech style: ${characterData.personality.speechStyle}
    - Consider recent conversation context if provided
    - Keep responses conversational and team-appropriate (1-2 sentences)
    - Show genuine engagement with the group activity
    - React to what the coach said in a natural way`;

    // Add recent conversation context if available
    if (context?.recentMessages && context.recentMessages.length > 0) {
      const recentContext = context.recentMessages.slice(-3).map((msg: any) => 
        `${msg.sender}: ${msg.message}`
      ).join('\n');
      activityPrompt += `\n\nRecent conversation:\n${recentContext}`;
    }

    // Use existing AI service with group activity context
    const response = await aiChatService.generateCharacterResponse(
      {
        characterId: characterId || characterName.toLowerCase().replace(/\s+/g, '_'),
        characterName: characterData.name,
        personality: characterData.personality,
        historicalPeriod: characterData.historicalPeriod,
        mythology: characterData.mythology,
        currentBondLevel: context?.bondLevel || 60, // Slightly higher for group activities
        previousMessages: context?.recentMessages || []
      },
      activityPrompt,
      req.user.id,
      db,
      { isInBattle: false }
    );

    res.json({
      message: response.message,
      character: characterData.name,
      characterId: characterId || characterName.toLowerCase().replace(/\s+/g, '_'),
      eventType,
      timestamp: new Date().toISOString(),
      bondIncrease: response.bondIncrease
    });

  } catch (error) {
    console.error('Group activity coaching error:', error);
    res.status(500).json({ error: 'Failed to generate group activity response' });
  }
});

// GET /api/coaching/progression - Coach progression data
router.get('/progression', authenticateToken, async (req: any, res) => {
  try {
    // Return basic coach progression data
    res.json({
      success: true,
      data: {
        level: 1,
        xp: 0,
        nextLevelXp: 100,
        totalXp: 0,
        bonuses: {
          characterDevelopment: 0,
          trainingEfficiency: 0,
          bondingSpeed: 0
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/coaching/xp-history - XP history
router.get('/xp-history', authenticateToken, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/coaching/leaderboard - Leaderboard
router.get('/leaderboard', authenticateToken, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;