import { Router } from 'express';
import { dbAdapter } from '../services/databaseAdapter';

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

export default router;