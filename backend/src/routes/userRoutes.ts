import { Router } from 'express';
import { UserService } from '../services/userService';
import { authenticateToken } from '../services/auth';
import { dbAdapter } from '../services/databaseAdapter';
import { query } from '../database';

const router = Router();
const userService = new UserService();

// Get user profile by ID
router.get('/users/:id/profile', async (req, res) => {
  const profile = await userService.findUserProfile(req.params.id);
  if (profile) {
    res.json(profile);
  } else {
    res.status(404).send('Profile not found');
  }
});

// Update user profile (requires authentication)
router.put('/users/profile', authenticateToken, async (req: any, res) => {
  const userId = req.user.id; // Assuming userId is attached by authenticateToken middleware
  const updates = req.body;
  try {
    const updatedProfile = await userService.updateUserProfile(userId, updates);
    if (updatedProfile) {
      res.json(updatedProfile);
    } else {
      res.status(404).send('User profile not found');
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send friend request (requires authentication)
router.post('/friends/add', authenticateToken, async (req: any, res) => {
  const { targetUserId } = req.body;
  const userId1 = req.user.id; // Sender
  try {
    const friendship = await userService.addFriend(userId1, targetUserId);
    if (friendship) {
      res.status(201).json(friendship);
    } else {
      res.status(400).send('Could not send friend request');
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request (requires authentication)
router.post('/friends/accept/:friendshipId', authenticateToken, async (req: any, res) => {
  const { friendshipId } = req.params;
  // In a real app, verify req.user.id matches userId2 of the friendship
  try {
    const friendship = await userService.acceptFriendRequest(friendshipId);
    if (friendship) {
      res.json(friendship);
    } else {
      res.status(404).send('Friend request not found or not pending');
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reject friend request (requires authentication)
router.post('/friends/reject/:friendshipId', authenticateToken, async (req: any, res) => {
  const { friendshipId } = req.params;
  // In a real app, verify req.user.id matches userId2 of the friendship
  try {
    const friendship = await userService.rejectFriendRequest(friendshipId);
    if (friendship) {
      res.json(friendship);
    } else {
      res.status(404).send('Friend request not found or not pending');
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's friends (requires authentication)
router.get('/friends', authenticateToken, async (req: any, res) => {
  try {
    const friends = await userService.getFriends(req.user.id);
    res.json(friends);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's pending friend requests (requires authentication)
router.get('/friends/pending', authenticateToken, async (req: any, res) => {
  try {
    const pendingRequests = await userService.getPendingFriendRequests(req.user.id);
    res.json(pendingRequests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/users/search', async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).send('Search query is required');
  }
  try {
    const users = await userService.searchUsers(query);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint
router.get('/test', async (req: any, res) => {
  res.json({ success: true, message: 'Test endpoint working' });
});

// Get user's characters (AUTHENTICATED ENDPOINT)
router.get('/characters', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    console.log('👤 [/characters] Getting characters for authenticated user:', userId);
    
    // Get user's actual owned characters from user_characters table
    console.log('🔍 [/characters] Querying user_characters table for user:', userId);
    const userCharacters = await query(
      `SELECT uc.*, c.* FROM user_characters uc 
       JOIN characters c ON uc.character_id = c.id 
       WHERE uc.user_id = ?`,
      [userId]
    );
    if (userCharacters.rows.length === 0) {
      console.log('⚠️ [/characters] No characters found for user:', userId);
      return res.json({
        success: true,
        characters: [],
        message: 'No characters found. Complete registration to get your starter pack!'
      });
    }
    
    // Transform database rows to proper character format
    const characters = userCharacters.rows.map(row => ({
      // User character data
      id: row.id, // user_characters.id
      user_id: row.user_id,
      character_id: row.character_id,
      serial_number: row.serial_number,
      nickname: row.nickname,
      level: row.level || 1,
      experience: row.experience || 0,
      bond_level: row.bond_level || 0,
      total_battles: row.total_battles || 0,
      total_wins: row.total_wins || 0,
      current_health: row.current_health || row.base_health,
      max_health: row.max_health || row.base_health,
      is_injured: row.is_injured || false,
      recovery_time: row.recovery_time,
      equipment: row.equipment ? JSON.parse(row.equipment) : [],
      enhancements: row.enhancements ? JSON.parse(row.enhancements) : [],
      conversation_memory: row.conversation_memory ? JSON.parse(row.conversation_memory) : [],
      significant_memories: row.significant_memories ? JSON.parse(row.significant_memories) : [],
      personality_drift: row.personality_drift ? JSON.parse(row.personality_drift) : {},
      acquired_at: row.acquired_at,
      last_battle_at: row.last_battle_at,
      
      // Character template data
      name: row.name,
      title: row.title,
      avatar_emoji: row.avatar_emoji,
      archetype: row.archetype,
      rarity: row.rarity,
      origin_era: row.origin_era,
      personality_traits: row.personality_traits ? JSON.parse(row.personality_traits) : [],
      conversation_topics: row.conversation_topics ? JSON.parse(row.conversation_topics) : [],
      conversation_style: row.conversation_style,
      backstory: row.backstory,
      base_health: row.base_health,
      base_attack: row.base_attack,
      base_defense: row.base_defense,
      base_speed: row.base_speed
    }));
      
    console.log('✅ [/characters] Found', characters.length, 'characters for user:', userId);
    
    return res.json({
      success: true,
      characters: characters
    });
  } catch (error: any) {
    console.error('❌ Error getting user characters:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/team-stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const teamStats = await userService.getTeamStats(userId);
    res.json(teamStats);
  } catch (error: any) {
    console.error('Failed to fetch team stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add conversation to character memory
router.post('/characters/:characterId/conversation', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { characterId } = req.params;
    const { player_message, character_response, context, bond_increase = false } = req.body;

    console.log('💬 [conversation] Saving conversation for user:', userId, 'character:', characterId);

    // Verify user owns this character
    const ownershipCheck = await query(
      'SELECT id FROM user_characters WHERE user_id = ? AND character_id = ?',
      [userId, characterId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Character not found or not owned by user'
      });
    }

    const userCharacterId = ownershipCheck.rows[0].id;

    // Get current conversation memory, bond level, and user subscription tier
    const currentData = await query(
      `SELECT uc.conversation_memory, uc.bond_level, u.subscription_tier 
       FROM user_characters uc 
       JOIN users u ON uc.user_id = u.id 
       WHERE uc.id = ?`,
      [userCharacterId]
    );

    const currentConversation = currentData.rows[0].conversation_memory 
      ? JSON.parse(currentData.rows[0].conversation_memory) 
      : [];
    const currentBondLevel = currentData.rows[0].bond_level || 0;
    const subscriptionTier = currentData.rows[0].subscription_tier || 'free';

    // Create new conversation entry
    const newConversationEntry = {
      player_message,
      character_response,
      timestamp: new Date().toISOString(),
      context: context || null,
      bond_increase
    };

    // Determine memory limit based on subscription tier
    const memoryLimits = {
      free: 20,        // Free tier: 20 conversations
      premium: 50,     // Premium tier: 50 conversations
      legendary: 100   // Legendary tier: 100 conversations
    };
    const memoryLimit = memoryLimits[subscriptionTier as keyof typeof memoryLimits] || memoryLimits.free;

    // Add to conversation memory (keep last N conversations based on subscription tier)
    const updatedConversation = [...currentConversation, newConversationEntry].slice(-memoryLimit);

    // Update bond level if applicable
    const newBondLevel = bond_increase ? Math.min(currentBondLevel + 1, 100) : currentBondLevel;

    // Save to database
    await query(
      `UPDATE user_characters 
       SET conversation_memory = ?, bond_level = ?, last_interaction_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [JSON.stringify(updatedConversation), newBondLevel, userCharacterId]
    );

    console.log('✅ [conversation] Saved conversation, bond level:', newBondLevel);

    res.json({
      success: true,
      bond_level: newBondLevel,
      conversation_count: updatedConversation.length,
      bond_increased: bond_increase
    });

  } catch (error: any) {
    console.error('❌ Error saving conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get character conversation history
router.get('/characters/:characterId/conversations', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { characterId } = req.params;
    const { limit = 20 } = req.query;

    console.log('📚 [conversations] Getting conversation history for user:', userId, 'character:', characterId);

    // Verify user owns this character and get conversation memory
    const result = await query(
      `SELECT uc.conversation_memory, uc.bond_level, c.name as character_name 
       FROM user_characters uc 
       JOIN characters c ON uc.character_id = c.id 
       WHERE uc.user_id = ? AND uc.character_id = ?`,
      [userId, characterId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Character not found or not owned by user'
      });
    }

    const { conversation_memory, bond_level, character_name } = result.rows[0];
    const conversations = conversation_memory ? JSON.parse(conversation_memory) : [];

    // Return most recent conversations (limited)
    const recentConversations = conversations.slice(-parseInt(limit as string));

    console.log('✅ [conversations] Found', conversations.length, 'total conversations');

    res.json({
      success: true,
      character_name,
      bond_level,
      conversations: recentConversations,
      total_conversations: conversations.length
    });

  } catch (error: any) {
    console.error('❌ Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update character bond level directly
router.put('/characters/:characterId/bond', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { characterId } = req.params;
    const { bond_change, reason } = req.body;

    console.log('💖 [bond] Updating bond level for user:', userId, 'character:', characterId, 'change:', bond_change);

    // Verify user owns this character
    const result = await query(
      'SELECT id, bond_level FROM user_characters WHERE user_id = ? AND character_id = ?',
      [userId, characterId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Character not found or not owned by user'
      });
    }

    const { id: userCharacterId, bond_level: currentBondLevel } = result.rows[0];
    const newBondLevel = Math.max(0, Math.min(100, (currentBondLevel || 0) + bond_change));

    // Update bond level
    await query(
      'UPDATE user_characters SET bond_level = ? WHERE id = ?',
      [newBondLevel, userCharacterId]
    );

    console.log('✅ [bond] Updated bond level:', currentBondLevel, '->', newBondLevel);

    res.json({
      success: true,
      old_bond_level: currentBondLevel,
      new_bond_level: newBondLevel,
      change: bond_change,
      reason
    });

  } catch (error: any) {
    console.error('❌ Error updating bond level:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;