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

export default router;