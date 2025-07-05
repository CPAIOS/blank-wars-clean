import { Router } from 'express';
import { dbAdapter } from '../services/databaseAdapter';
import { authenticateToken } from '../services/auth';

// Create a factory function that accepts battleManager
export const createBattleRouter = (battleManager: any) => {
  const router = Router();

  // Get battle status
  router.get('/status', async (req, res) => {
    try {
      const queueSize = battleManager.getBattleQueue().size;
      const activeBattles = battleManager.getActiveBattles().size;
      
      return res.json({
        success: true,
        status: {
          queueSize,
          activeBattles,
          serverTime: new Date().toISOString()
        }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get user's battles (requires authentication)
  router.get('/user', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      const activeBattles = await dbAdapter.battles.findActiveByUserId(userId);
      return res.json({
        success: true,
        battles: activeBattles
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
};

// Default export for compatibility
const router = Router();

// Get user's battles (requires authentication)
router.get('/user', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const activeBattles = await dbAdapter.battles.findActiveByUserId(userId);
    return res.json({
      success: true,
      battles: activeBattles
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;