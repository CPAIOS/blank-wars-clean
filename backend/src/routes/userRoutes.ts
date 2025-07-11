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

// Get user's characters (requires authentication)
router.get('/characters', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
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