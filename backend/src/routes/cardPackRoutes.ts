
import { Router } from 'express';
import { cardPackService } from '../services/CardPackService';
import { PackService } from '../services/packService';
import { authenticateToken } from '../services/auth';
import { AuthRequest } from '../types';

const router = Router();
const packService = new PackService();

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

// Generate a new pack (for purchases or gifts)
router.post('/generate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { packType } = req.body;
    if (!packType) {
      return res.status(400).json({ error: 'Pack type is required' });
    }

    const claimToken = await packService.generatePack(packType);
    res.json({ claimToken });
  } catch (error: any) {
    console.error('Error generating pack:', error);
    res.status(500).json({ error: error.message });
  }
});

// Claim a pack for the current user
router.post('/claim', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { claimToken } = req.body;
    if (!claimToken) {
      return res.status(400).json({ error: 'Claim token is required' });
    }

    const result = await packService.claimPack(req.user.id, claimToken);
    res.json(result);
  } catch (error: any) {
    console.error('Error claiming pack:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a gift pack (admin or special endpoint)
router.post('/gift', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { characterIds } = req.body;
    if (!characterIds || !Array.isArray(characterIds)) {
      return res.status(400).json({ error: 'Character IDs array is required' });
    }

    const claimToken = await packService.createGiftPack(characterIds);
    res.json({ claimToken });
  } catch (error: any) {
    console.error('Error creating gift pack:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
