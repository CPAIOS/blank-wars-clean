import { Router } from 'express';
import { UserService } from '../services/userService';
import { authenticateToken } from '../services/auth';
import { dbAdapter } from '../services/databaseAdapter';
import { AuthRequest } from '../types';

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

// Get user's characters
router.get('/characters', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.id;
    
    // Get user's actual characters from database
    const userCharacters = await dbAdapter.userCharacters.findByUserId(userId);
    
    if (userCharacters.length === 0) {
      // User has no characters yet - they need to open packs to get characters
      return res.json({ 
        success: true, 
        characters: [],
        message: 'No characters owned. Open packs to get characters!'
      });
    }
    
    console.log('🔍 [/characters] Getting characters for user:', userId);
    console.log('📊 [/characters] Found characters:', userCharacters.length);
    console.log('🔍 [/characters] First character sample:', userCharacters[0] ? JSON.stringify(userCharacters[0], null, 2) : 'None');
    
    // Characters from JOIN already have psychStats from characters table
    const charactersWithPsychStats = userCharacters.map(character => {
      // psychstats from JSONB column is already parsed as object in PostgreSQL
      const psychStats = (character as any).psychstats || {};
      
      return {
        ...character,
        psychStats: {
          training: psychStats.training || 50,
          teamPlayer: psychStats.teamPlayer || 50,
          ego: psychStats.ego || 50,
          mentalHealth: psychStats.mentalHealth || 80,
          communication: psychStats.communication || 50
        },
        traditionalStats: {
          strength: character.base_attack,
          speed: character.base_speed,
          dexterity: character.base_defense,
          stamina: character.base_health,
          intelligence: character.base_special,
          charisma: 50,
          spirit: 50
        },
        temporaryStats: {
          strength: 0,
          speed: 0,
          dexterity: 0,
          stamina: 0,
          intelligence: 0,
          charisma: 0,
          spirit: 0
        }
      };
    });
    
    return res.json({
      success: true,
      characters: charactersWithPsychStats
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