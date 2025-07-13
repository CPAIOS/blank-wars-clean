import { Router } from 'express';
import { UserService } from '../services/userService';
import { authenticateToken } from '../services/auth';
import { dbAdapter } from '../services/databaseAdapter';

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

// Get user's characters (temporarily bypassed auth for demo)
router.get('/characters', async (req: any, res) => {
  try {
    console.log('🔍 [/characters] Auth check - req.user:', req.user ? 'Present' : 'None');
    console.log('🔍 [/characters] Headers:', Object.keys(req.headers));
    
    // For demo purposes, create demo characters if no user is authenticated
    const userId = req.user?.id || 'demo-user';
    console.log('🔍 [/characters] Using userId:', userId);
    
    // If no authenticated user, return demo characters with required UserCharacter structure
    if (!req.user?.id) {
      console.log('🎭 [/characters] No auth - returning demo characters');
      const basicCharacters = await dbAdapter.characters.findAll();
      const demoUserCharacters = basicCharacters.map(char => ({
        id: `demo-${char.id}`,
        user_id: 'demo-user',
        character_id: char.id,
        serial_number: null,
        nickname: null,
        level: 1,
        experience: 0,
        bond_level: 0,
        total_battles: 0,
        total_wins: 0,
        current_health: char.base_health,
        max_health: char.base_health,
        is_injured: false,
        recovery_time: null,
        equipment: [],
        enhancements: [],
        conversation_memory: [],
        significant_memories: [],
        personality_drift: {},
        acquired_at: new Date(),
        last_battle_at: null,
        // Include character data (excluding id to avoid conflict)
        name: char.name,
        title: char.title,
        avatar_emoji: char.avatar_emoji,
        archetype: char.archetype,
        rarity: char.rarity,
        origin_era: char.origin_era,
        personality_traits: char.personality_traits,
        conversation_topics: char.conversation_topics,
        conversation_style: char.conversation_style,
        backstory: char.backstory,
        base_health: char.base_health,
        base_attack: char.base_attack,
        base_defense: char.base_defense,
        base_speed: char.base_speed
      }));
      
      return res.json({
        success: true,
        characters: demoUserCharacters
      });
    }
    console.log('🔍 [/characters] Getting characters for user:', userId);
    
    const userCharacters = await dbAdapter.userCharacters.findByUserId(userId);
    console.log('📊 [/characters] Found characters:', userCharacters.length);
    console.log('🔍 [/characters] First character sample:', userCharacters[0] ? JSON.stringify(userCharacters[0], null, 2) : 'None');
    
    return res.json({
      success: true,
      characters: userCharacters
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