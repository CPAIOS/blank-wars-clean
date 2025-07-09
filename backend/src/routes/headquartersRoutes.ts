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

export default router;
