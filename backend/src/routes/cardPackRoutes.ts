
import { Router } from 'express';
import { cardPackService } from '../services/CardPackService';
import { authenticateToken } from '../services/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/minted-cards', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const userId = req.user.id;
    const mintedCards = await cardPackService.getMintedCardsForUser(userId);
    res.json(mintedCards);
  } catch (error: any) {
    console.error('Error fetching minted cards:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
