import { Router } from 'express';
import { dbAdapter } from '../services/databaseAdapter';
import { authenticateToken } from '../services/auth';
import { AuthRequest } from '../types';

const router = Router();

// Get all characters
router.get('/', async (req, res) => {
  console.log('🎯 [/api/characters] Hit characterRoutes.ts - returning ALL characters');
  try {
    const characters = await dbAdapter.characters.findAll();
    return res.json({
      success: true,
      characters
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update character financial data
router.put('/:id/financials', authenticateToken, async (req: AuthRequest, res) => {
  console.log('🎯 [PUT /api/characters/:id/financials] Updating character financial data');
  try {
    const { id } = req.params;
    const { wallet, financial_stress, coach_trust_level } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Verify the character belongs to the authenticated user
    const userCharacter = await dbAdapter.userCharacters.findById(id);
    if (!userCharacter) {
      return res.status(404).json({
        success: false,
        error: 'Character not found'
      });
    }

    if (userCharacter.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - character does not belong to user'
      });
    }

    // Validate financial data
    const financialData: any = {};
    if (wallet !== undefined) {
      if (typeof wallet !== 'number' || wallet < 0) {
        return res.status(400).json({
          success: false,
          error: 'Wallet must be a non-negative number'
        });
      }
      financialData.wallet = wallet;
    }
    
    if (financial_stress !== undefined) {
      if (typeof financial_stress !== 'number' || financial_stress < 0 || financial_stress > 100) {
        return res.status(400).json({
          success: false,
          error: 'Financial stress must be a number between 0 and 100'
        });
      }
      financialData.financial_stress = financial_stress;
    }

    if (coach_trust_level !== undefined) {
      if (typeof coach_trust_level !== 'number' || coach_trust_level < 0 || coach_trust_level > 100) {
        return res.status(400).json({
          success: false,
          error: 'Coach trust level must be a number between 0 and 100'
        });
      }
      financialData.coach_trust_level = coach_trust_level;
    }

    if (Object.keys(financialData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid financial data provided'
      });
    }

    // Update the character's financial data
    const success = await dbAdapter.userCharacters.update(id, financialData);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update character financial data'
      });
    }

    // Return updated character data
    const updatedCharacter = await dbAdapter.userCharacters.findById(id);
    return res.json({
      success: true,
      character: updatedCharacter
    });

  } catch (error: any) {
    console.error('Error updating character financials:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;