import express from 'express';
import { authenticateToken } from '../services/auth';
import { HealingService } from '../services/healingService';
import { ResurrectionService } from '../services/resurrectionService';
import { query } from '../database/postgres';
import { AuthRequest } from '../types';

const router = express.Router();

/**
 * GET /api/healing/options/:characterId
 * Get healing options for an injured character
 */
router.get('/options/:characterId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    
    // Verify character belongs to user
    const characterCheck = await query(
      `SELECT user_id FROM user_characters WHERE id = $1`,
      [characterId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    if (characterCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }
    
    const options = await HealingService.getHealingOptions(characterId);
    
    res.json({
      characterId,
      healingOptions: options,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting healing options:', error);
    res.status(500).json({ error: 'Failed to get healing options' });
  }
});

/**
 * POST /api/healing/start/:characterId
 * Start a healing session for a character
 */
router.post('/start/:characterId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    const { healingType, facilityId, paymentMethod } = req.body;
    
    if (!healingType || !['natural', 'currency', 'premium', 'facility'].includes(healingType)) {
      return res.status(400).json({ error: 'Invalid healing type' });
    }
    
    // Verify character belongs to user
    const characterCheck = await query(
      `SELECT user_id FROM user_characters WHERE id = $1`,
      [characterId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    if (characterCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }
    
    const session = await HealingService.startHealingSession(
      characterId,
      healingType,
      facilityId,
      paymentMethod
    );
    
    res.json({
      success: true,
      session,
      message: `Healing session started successfully`
    });
  } catch (error) {
    console.error('Error starting healing session:', error);
    res.status(500).json({ error: error.message || 'Failed to start healing session' });
  }
});

/**
 * GET /api/healing/sessions
 * Get active healing sessions for the authenticated user
 */
router.get('/sessions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const sessions = await HealingService.getUserHealingSessions(req.user.id);
    
    res.json({
      sessions,
      count: sessions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting healing sessions:', error);
    res.status(500).json({ error: 'Failed to get healing sessions' });
  }
});

/**
 * GET /api/healing/resurrection/options/:characterId
 * Get resurrection options for a dead character
 */
router.get('/resurrection/options/:characterId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    
    // Verify character belongs to user
    const characterCheck = await query(
      `SELECT user_id FROM user_characters WHERE id = $1`,
      [characterId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    if (characterCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }
    
    const options = await ResurrectionService.getResurrectionOptions(characterId);
    const deathStats = await ResurrectionService.getCharacterDeathStats(characterId);
    
    res.json({
      characterId,
      resurrectionOptions: options,
      deathStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting resurrection options:', error);
    res.status(500).json({ error: 'Failed to get resurrection options' });
  }
});

/**
 * POST /api/healing/resurrection/:characterId
 * Execute resurrection for a dead character
 */
router.post('/resurrection/:characterId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    const { resurrectionType } = req.body;
    
    if (!resurrectionType || !['premium_instant', 'wait_penalty', 'level_reset'].includes(resurrectionType)) {
      return res.status(400).json({ error: 'Invalid resurrection type' });
    }
    
    // Verify character belongs to user
    const characterCheck = await query(
      `SELECT user_id FROM user_characters WHERE id = $1`,
      [characterId]
    );
    
    if (characterCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    if (characterCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }
    
    const result = await ResurrectionService.executeResurrection(characterId, resurrectionType);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        resurrectionType,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('Error executing resurrection:', error);
    res.status(500).json({ error: 'Failed to execute resurrection' });
  }
});

/**
 * GET /api/healing/character-status/:characterId
 * Get complete health/death status for a character
 */
router.get('/character-status/:characterId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    
    // Verify character belongs to user
    const characterResult = await query(
      `SELECT user_id, current_health, max_health, is_injured, is_dead, 
              injury_severity, recovery_time, death_timestamp, resurrection_available_at,
              death_count, level, name
       FROM user_characters uc
       LEFT JOIN characters c ON uc.character_id = c.id  
       WHERE uc.id = $1`,
      [characterId]
    );
    
    if (characterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const character = characterResult.rows[0];
    
    if (character.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }
    
    // Get available options based on character state
    let healingOptions: any[] = [];
    let resurrectionOptions: any[] = [];
    
    if (character.is_dead) {
      resurrectionOptions = await ResurrectionService.getResurrectionOptions(characterId);
    } else if (character.is_injured) {
      healingOptions = await HealingService.getHealingOptions(characterId);
    }
    
    const status = {
      characterId,
      name: character.name,
      health: {
        current: character.current_health,
        max: character.max_health,
        percentage: Math.round((character.current_health / character.max_health) * 100)
      },
      status: character.is_dead ? 'dead' : (character.is_injured ? 'injured' : 'healthy'),
      injurySeverity: character.injury_severity,
      recoveryTime: character.recovery_time,
      deathInfo: character.is_dead ? {
        deathTimestamp: character.death_timestamp,
        resurrectionAvailableAt: character.resurrection_available_at,
        deathCount: character.death_count
      } : null,
      availableOptions: {
        healing: healingOptions,
        resurrection: resurrectionOptions
      }
    };
    
    res.json(status);
  } catch (error) {
    console.error('Error getting character status:', error);
    res.status(500).json({ error: 'Failed to get character status' });
  }
});

export default router;