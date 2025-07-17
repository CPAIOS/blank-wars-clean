import { Router } from 'express';
import { CharacterEchoService } from '../services/characterEchoService';
import { authenticateToken } from '../services/auth';
import { AuthRequest } from '../types';
import { query } from '../database';

const router = Router();
const echoService = new CharacterEchoService();

// Get all echoes for the current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await query(
      'SELECT character_template_id as character_id, echo_count as count FROM user_character_echoes WHERE user_id = $1 AND echo_count > 0',
      [req.user.id]
    );

    const echoes = result.rows.map((row: any) => ({
      character_id: row.character_id,
      count: row.count
    }));

    res.json({ echoes });
  } catch (error: any) {
    console.error('Error fetching user echoes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get echo count for a specific character
router.get('/:characterId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { characterId } = req.params;
    const count = await echoService.getEchoCount(req.user.id, characterId);
    
    res.json({ count });
  } catch (error: any) {
    console.error('Error fetching echo count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Spend echoes for character ascension
router.post('/ascend', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { userCharacterId, echoesToSpend } = req.body;
    
    if (!userCharacterId || !echoesToSpend) {
      return res.status(400).json({ error: 'User character ID and echoes to spend are required' });
    }

    // Get the character to find the template ID
    const characterResult = await query(
      'SELECT character_id FROM user_characters WHERE id = $1 AND user_id = $2',
      [userCharacterId, req.user.id]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const characterTemplateId = characterResult.rows[0].character_id;
    
    // Check if user has enough echoes
    const currentEchoes = await echoService.getEchoCount(req.user.id, characterTemplateId);
    if (currentEchoes < echoesToSpend) {
      return res.status(400).json({ error: 'Not enough echoes' });
    }

    // Perform ascension
    const success = await echoService.ascendCharacter(req.user.id, userCharacterId, echoesToSpend);
    
    if (success) {
      // Spend the echoes
      await echoService.spendEchoes(req.user.id, characterTemplateId, echoesToSpend);
      const remainingEchoes = await echoService.getEchoCount(req.user.id, characterTemplateId);
      
      res.json({ 
        success: true, 
        remainingEchoes,
        message: 'Character ascended successfully!'
      });
    } else {
      res.status(500).json({ error: 'Failed to ascend character' });
    }
  } catch (error: any) {
    console.error('Error ascending character:', error);
    res.status(500).json({ error: error.message });
  }
});

// Spend echoes for ability rank up
router.post('/rankup', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { userCharacterId, abilityId, echoesToSpend } = req.body;
    
    if (!userCharacterId || !abilityId || !echoesToSpend) {
      return res.status(400).json({ error: 'User character ID, ability ID, and echoes to spend are required' });
    }

    // Get the character to find the template ID
    const characterResult = await query(
      'SELECT character_id FROM user_characters WHERE id = $1 AND user_id = $2',
      [userCharacterId, req.user.id]
    );

    if (characterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const characterTemplateId = characterResult.rows[0].character_id;
    
    // Check if user has enough echoes
    const currentEchoes = await echoService.getEchoCount(req.user.id, characterTemplateId);
    if (currentEchoes < echoesToSpend) {
      return res.status(400).json({ error: 'Not enough echoes' });
    }

    // Perform ability rank up
    const success = await echoService.rankUpAbility(req.user.id, userCharacterId, abilityId, echoesToSpend);
    
    if (success) {
      // Spend the echoes
      await echoService.spendEchoes(req.user.id, characterTemplateId, echoesToSpend);
      const remainingEchoes = await echoService.getEchoCount(req.user.id, characterTemplateId);
      
      res.json({ 
        success: true, 
        remainingEchoes,
        message: 'Ability ranked up successfully!'
      });
    } else {
      res.status(500).json({ error: 'Failed to rank up ability' });
    }
  } catch (error: any) {
    console.error('Error ranking up ability:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generic spend echoes endpoint
router.post('/spend', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { characterId, amount, action } = req.body;
    
    if (!characterId || !amount || !action) {
      return res.status(400).json({ error: 'Character ID, amount, and action are required' });
    }

    // Check if user has enough echoes
    const currentEchoes = await echoService.getEchoCount(req.user.id, characterId);
    if (currentEchoes < amount) {
      return res.status(400).json({ error: 'Not enough echoes' });
    }

    // Spend the echoes
    const success = await echoService.spendEchoes(req.user.id, characterId, amount);
    
    if (success) {
      const remainingEchoes = await echoService.getEchoCount(req.user.id, characterId);
      res.json({ 
        success: true, 
        remainingEchoes,
        message: `Spent ${amount} echoes on ${action}`
      });
    } else {
      res.status(500).json({ error: 'Failed to spend echoes' });
    }
  } catch (error: any) {
    console.error('Error spending echoes:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;