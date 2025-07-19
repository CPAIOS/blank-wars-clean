import express from 'express';
import { CharacterProgressionService } from '../services/characterProgressionService';
import { authenticateToken } from '../services/auth';
import { AuthRequest } from '../types';

const router = express.Router();

/**
 * GET /api/character-progression/:characterId
 * Get character's progression data
 */
router.get('/:characterId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    
    // Verify character belongs to authenticated user
    const characterCheck = await CharacterProgressionService.getCharacterProgression(characterId);
    if (!characterCheck) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (characterCheck.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }

    const progression = await CharacterProgressionService.getCharacterProgression(characterId);
    const skills = await CharacterProgressionService.getCharacterSkills(characterId);
    const abilities = await CharacterProgressionService.getCharacterAbilities(characterId);
    const experienceHistory = await CharacterProgressionService.getExperienceHistory(characterId, 20);

    res.json({
      progression,
      skills,
      abilities,
      experienceHistory
    });
  } catch (error) {
    console.error('Error getting character progression:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/character-progression/:characterId/award-xp
 * Award experience to a character
 */
router.post('/:characterId/award-xp', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    const { amount, source, description, multiplier = 1.0 } = req.body;

    if (!amount || !source || !description) {
      return res.status(400).json({ error: 'Missing required fields: amount, source, description' });
    }

    if (amount <= 0 || amount > 10000) {
      return res.status(400).json({ error: 'Experience amount must be between 1 and 10000' });
    }

    // Verify character belongs to authenticated user
    const characterCheck = await CharacterProgressionService.getCharacterProgression(characterId);
    if (!characterCheck) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (characterCheck.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }

    const result = await CharacterProgressionService.awardExperience(
      characterId,
      amount,
      source,
      description,
      multiplier
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error awarding experience:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/character-progression/:characterId/unlock-skill
 * Unlock a skill for a character
 */
router.post('/:characterId/unlock-skill', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    const { skillId, skillName, maxLevel = 10 } = req.body;

    if (!skillId || !skillName) {
      return res.status(400).json({ error: 'Missing required fields: skillId, skillName' });
    }

    // Verify character belongs to authenticated user
    const characterCheck = await CharacterProgressionService.getCharacterProgression(characterId);
    if (!characterCheck) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (characterCheck.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }

    // Check if character has enough skill points
    if (characterCheck.skillPoints < 1) {
      return res.status(400).json({ error: 'Not enough skill points to unlock this skill' });
    }

    const skill = await CharacterProgressionService.unlockSkill(characterId, skillId, skillName, maxLevel);

    // Deduct skill point (this should be handled in the service)
    // For now, we'll update it here
    // TODO: Move this logic into the service

    res.json({
      success: true,
      skill
    });
  } catch (error) {
    console.error('Error unlocking skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/character-progression/:characterId/progress-skill
 * Progress a skill by gaining experience
 */
router.post('/:characterId/progress-skill', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    const { skillId, experienceGained } = req.body;

    if (!skillId || !experienceGained) {
      return res.status(400).json({ error: 'Missing required fields: skillId, experienceGained' });
    }

    if (experienceGained <= 0 || experienceGained > 1000) {
      return res.status(400).json({ error: 'Experience gained must be between 1 and 1000' });
    }

    // Verify character belongs to authenticated user
    const characterCheck = await CharacterProgressionService.getCharacterProgression(characterId);
    if (!characterCheck) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (characterCheck.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }

    const result = await CharacterProgressionService.progressSkill(characterId, skillId, experienceGained);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error progressing skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/character-progression/:characterId/unlock-ability
 * Unlock an ability for a character
 */
router.post('/:characterId/unlock-ability', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    const { abilityId, abilityName, maxRank = 5 } = req.body;

    if (!abilityId || !abilityName) {
      return res.status(400).json({ error: 'Missing required fields: abilityId, abilityName' });
    }

    // Verify character belongs to authenticated user
    const characterCheck = await CharacterProgressionService.getCharacterProgression(characterId);
    if (!characterCheck) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (characterCheck.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }

    // Check if character has enough ability points
    if (characterCheck.abilityPoints < 1) {
      return res.status(400).json({ error: 'Not enough ability points to unlock this ability' });
    }

    const ability = await CharacterProgressionService.unlockAbility(characterId, abilityId, abilityName, maxRank);

    res.json({
      success: true,
      ability
    });
  } catch (error) {
    console.error('Error unlocking ability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/character-progression/:characterId/xp-history
 * Get character's experience gain history
 */
router.get('/:characterId/xp-history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { characterId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (limit > 200) {
      return res.status(400).json({ error: 'Limit cannot exceed 200' });
    }

    // Verify character belongs to authenticated user
    const characterCheck = await CharacterProgressionService.getCharacterProgression(characterId);
    if (!characterCheck) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (characterCheck.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this character' });
    }

    const history = await CharacterProgressionService.getExperienceHistory(characterId, limit);

    res.json({ history });
  } catch (error) {
    console.error('Error getting experience history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/character-progression/xp-calculator/:level
 * Calculate XP requirements for a specific level
 */
router.get('/xp-calculator/:level', async (req, res) => {
  try {
    const level = parseInt(req.params.level);

    if (isNaN(level) || level < 1 || level > 100) {
      return res.status(400).json({ error: 'Level must be between 1 and 100' });
    }

    const xpForLevel = CharacterProgressionService.calculateXPForLevel(level);
    const totalXpForLevel = CharacterProgressionService.calculateTotalXPForLevel(level);

    res.json({
      level,
      xpForThisLevel: xpForLevel,
      totalXpRequired: totalXpForLevel
    });
  } catch (error) {
    console.error('Error calculating XP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;