
import { Router } from 'express';
import { paymentService } from '../services/PaymentService';
import { authenticateToken } from '../services/auth';
import { AuthRequest } from '../types';

const router = Router();

// Note: Changed to use AuthRequest to satisfy type checking for req.user
router.post('/create-checkout-session', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // packType instead of priceId to match the service
    const { packType, quantity } = req.body; 
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = req.user.id;

    const session = await paymentService.createCheckoutSession(userId, packType, quantity);

    // Return the full URL for easier frontend redirection
    res.json({ url: session?.url }); 
  } catch (error: any) {
    console.error('Error in create-checkout-session route:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
