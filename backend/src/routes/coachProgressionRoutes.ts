import express from 'express';
import { authenticateToken } from '../services/auth';
import { CoachProgressionService } from '../services/coachProgressionService';

const router = express.Router();

// GET /api/coach-progression - Get user's coach progression
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const progression = await CoachProgressionService.getCoachProgression(userId);
    
    if (!progression) {
      return res.status(404).json({ error: 'Coach progression not found' });
    }

    // Calculate level progress
    const currentLevelXP = CoachProgressionService.calculateXPForLevel(progression.coachLevel);
    const nextLevelXP = CoachProgressionService.calculateXPForLevel(progression.coachLevel + 1);
    const progressInCurrentLevel = progression.coachExperience - currentLevelXP;
    const xpToNextLevel = nextLevelXP - progression.coachExperience;

    // Calculate coach bonuses
    const bonuses = CoachProgressionService.calculateCoachBonuses(progression);

    res.json({
      progression: {
        ...progression,
        progressInCurrentLevel,
        xpToNextLevel,
        nextLevelXP,
        currentLevelXP
      },
      bonuses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting coach progression:', error);
    res.status(500).json({ error: 'Failed to get coach progression' });
  }
});

// GET /api/coach-progression/xp-history - Get XP event history
router.get('/xp-history', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const history = await CoachProgressionService.getXPHistory(userId, limit);
    
    res.json({
      history,
      count: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting XP history:', error);
    res.status(500).json({ error: 'Failed to get XP history' });
  }
});

// GET /api/coach-progression/skills - Get coach skills
router.get('/skills', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const skills = await CoachProgressionService.getCoachSkills(userId);
    
    res.json({
      skills,
      count: skills.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting coach skills:', error);
    res.status(500).json({ error: 'Failed to get coach skills' });
  }
});

// POST /api/coach-progression/award-xp - Award XP (internal use)
router.post('/award-xp', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { eventType, xpAmount, description, eventSubtype, battleId, characterId } = req.body;
    
    if (!eventType || !xpAmount || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await CoachProgressionService.awardXP(
      userId,
      eventType,
      xpAmount,
      description,
      eventSubtype,
      battleId,
      characterId
    );

    res.json({
      success: true,
      xpAwarded: xpAmount,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
      oldLevel: result.oldLevel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error awarding XP:', error);
    res.status(500).json({ error: 'Failed to award XP' });
  }
});

// POST /api/coach-progression/award-battle-xp - Award battle XP
router.post('/award-battle-xp', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { isWin, battleId, characterId, bonusMultiplier, bonusReason } = req.body;
    
    if (typeof isWin !== 'boolean' || !battleId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await CoachProgressionService.awardBattleXP(
      userId,
      isWin,
      battleId,
      characterId,
      bonusMultiplier || 1.0,
      bonusReason
    );

    res.json({
      success: true,
      battleResult: isWin ? 'win' : 'loss',
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
      oldLevel: result.oldLevel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error awarding battle XP:', error);
    res.status(500).json({ error: 'Failed to award battle XP' });
  }
});

// POST /api/coach-progression/award-psychology-xp - Award psychology management XP
router.post('/award-psychology-xp', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { psychologyEventType, xpAmount, description, battleId, characterId } = req.body;
    
    if (!psychologyEventType || !xpAmount || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await CoachProgressionService.awardPsychologyXP(
      userId,
      psychologyEventType,
      xpAmount,
      description,
      battleId,
      characterId
    );

    res.json({
      success: true,
      psychologyEvent: psychologyEventType,
      xpAwarded: xpAmount,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
      oldLevel: result.oldLevel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error awarding psychology XP:', error);
    res.status(500).json({ error: 'Failed to award psychology XP' });
  }
});

// POST /api/coach-progression/award-character-development-xp - Award character development XP
router.post('/award-character-development-xp', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { developmentType, xpAmount, description, characterId } = req.body;
    
    if (!developmentType || !xpAmount || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await CoachProgressionService.awardCharacterDevelopmentXP(
      userId,
      developmentType,
      xpAmount,
      description,
      characterId
    );

    res.json({
      success: true,
      developmentType,
      xpAwarded: xpAmount,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
      oldLevel: result.oldLevel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error awarding character development XP:', error);
    res.status(500).json({ error: 'Failed to award character development XP' });
  }
});

// POST /api/coach-progression/award-gameplan-adherence-xp - Award gameplan adherence XP
router.post('/award-gameplan-adherence-xp', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { adherenceRate, deviationsBlocked, averageDeviationSeverity, battleId } = req.body;
    
    if (typeof adherenceRate !== 'number' || typeof deviationsBlocked !== 'number' || !averageDeviationSeverity || !battleId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await CoachProgressionService.awardGameplanAdherenceXP(
      userId,
      adherenceRate,
      deviationsBlocked,
      averageDeviationSeverity,
      battleId
    );

    res.json({
      success: true,
      adherenceRate,
      deviationsBlocked,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
      oldLevel: result.oldLevel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error awarding gameplan adherence XP:', error);
    res.status(500).json({ error: 'Failed to award gameplan adherence XP' });
  }
});


// POST /api/coach-progression/award-team-chemistry-xp - Award team chemistry XP
router.post('/award-team-chemistry-xp', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { chemistryImprovement, finalChemistry, battleId } = req.body;
    
    if (typeof chemistryImprovement !== 'number' || typeof finalChemistry !== 'number' || !battleId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await CoachProgressionService.awardTeamChemistryXP(
      userId,
      chemistryImprovement,
      finalChemistry,
      battleId
    );

    res.json({
      success: true,
      chemistryImprovement,
      finalChemistry,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
      oldLevel: result.oldLevel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error awarding team chemistry XP:', error);
    res.status(500).json({ error: 'Failed to award team chemistry XP' });
  }
});

// GET /api/coach-progression/leaderboard - Get coach leaderboard
router.get('/leaderboard', authenticateToken, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await CoachProgressionService.getCoachLeaderboard(limit);
    
    res.json({
      leaderboard: result,
      count: result.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting coach leaderboard:', error);
    res.status(500).json({ error: 'Failed to get coach leaderboard' });
  }
});

export default router;