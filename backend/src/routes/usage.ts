import express from 'express';
import { usageTrackingService } from '../services/usageTrackingService';
import { AuthRequest } from '../types/index';
import { authenticateToken } from '../services/auth';
import { db } from '../database/sqlite';

const router = express.Router();

// Get user's current usage status
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const usageStatus = usageTrackingService.getUserUsageStatus(user);
    res.json(usageStatus);
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