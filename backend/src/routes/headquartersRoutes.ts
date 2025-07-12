import { Router, Request, Response } from 'express';
import { authenticateToken } from '../services/auth';
import { HeadquartersService } from '../services/headquartersService';
import { AuthRequest } from '../types';

const router = Router();
const headquartersService = new HeadquartersService();

router.post('/upgrade-character-slots', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { cost } = req.body; // Cost would be determined by frontend or config

    const updatedUser = await headquartersService.upgradeCharacterSlotCapacity(userId, cost);

    return res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// Get user headquarters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const headquarters = await headquartersService.getHeadquarters(userId);

    return res.json({ success: true, headquarters });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Save user headquarters
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { headquarters } = req.body;
    
    await headquartersService.saveHeadquarters(userId, headquarters);

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Purchase bed
router.post('/purchase-bed', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { roomId, bedData } = req.body;
    
    await headquartersService.purchaseBed(userId, roomId, bedData);

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/real-estate-chat', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { selectedAgent, competingAgents, userMessage, currentTeamStats, conversationHistory } = req.body;

    const response = await headquartersService.handleRealEstateChat(userId, {
      selectedAgent,
      competingAgents,
      userMessage,
      currentTeamStats,
      conversationHistory,
    });

    return res.json({ success: true, messages: response });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
