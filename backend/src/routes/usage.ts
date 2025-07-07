import express from 'express';
import { usageTrackingService } from '../services/usageTrackingService';
import { AuthRequest } from '../types/index';
import { authenticateToken } from '../services/auth';
import { db } from '../database/sqlite';

const router = express.Router();

// Get user's current usage status
router.get('/status', async (req: AuthRequest, res) => {
  try {
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Try to authenticate but don't fail if it doesn't work
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        user = decoded;
      } catch (err) {
        // Token invalid, continue as guest
      }
    }

    if (user) {
      // Return actual usage status for authenticated user
      const usageStatus = usageTrackingService.getUserUsageStatus(user);
      res.json(usageStatus);
    } else {
      // Return default usage status for guest users
      res.json({
        canChat: true,
        canGenerateImage: true,
        canBattle: true,
        remainingChats: 5,
        remainingImages: 1,
        remainingBattles: 3,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    }
  } catch (error) {
    console.error('Error getting usage status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tier limits for all subscription tiers
router.get('/limits', async (req, res) => {
  try {
    const limits = usageTrackingService.getTierLimits();
    res.json(limits);
  } catch (error) {
    console.error('Error getting tier limits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Track image generation usage
router.post('/track-image', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Use imported database connection
    
    const success = await usageTrackingService.trackImageUsage(user.id, db);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(429).json({ error: 'Daily image generation limit reached' });
    }
  } catch (error) {
    console.error('Error tracking image usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;