import express from 'express';
import { trainingService, trainingActivities } from '../services/trainingService';
import { db } from '../database';

const router = express.Router();

// Get available training activities
router.get('/activities', async (req, res) => {
  try {
    res.json({
      success: true,
      activities: trainingActivities
    });
  } catch (error) {
    console.error('Error fetching training activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training activities'
    });
  }
});

// Start training session
router.post('/start', async (req, res) => {
  try {
    const { characterId, activityId, userId, gymTier = 'community' } = req.body;

    if (!characterId || !activityId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: characterId, activityId, userId'
      });
    }

    const result = await trainingService.startTraining(characterId, activityId, userId, gymTier, db);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error starting training:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start training'
    });
  }
});

// Complete training session
router.post('/complete', async (req, res) => {
  try {
    const { sessionId, characterId } = req.body;

    if (!sessionId || !characterId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, characterId'
      });
    }

    const result = await trainingService.completeTraining(sessionId, characterId);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error completing training:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete training'
    });
  }
});

// Get character training state
router.get('/character/:characterId/state', async (req, res) => {
  try {
    const { characterId } = req.params;
    
    // Get character training data from database
    const query = `
      SELECT * FROM character_training_state 
      WHERE characterId = $1
    `;
    
    const result = await db.query(query, [characterId]);
    const state = result.rows[0];

    res.json({
      success: true,
      state: state || {
        characterId,
        trainingPoints: 0,
        mentalHealth: 100,
        stressLevel: 0,
        focusLevel: 50,
        trainingHistory: [],
        availableActivities: trainingActivities.map(a => a.id),
        completedSessions: 0,
        specializations: []
      }
    });
  } catch (error) {
    console.error('Error fetching character training state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch character training state'
    });
  }
});

export default router;