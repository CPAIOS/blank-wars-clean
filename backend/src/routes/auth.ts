import { Router, Request, Response } from 'express';
import { AuthService, authenticateToken } from '../services/auth';
import { AuthRequest } from '../types';
import { dbAdapter } from '../services/databaseAdapter';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const authService = new AuthService();

// Register new user - matches server.ts exactly
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, claimToken } = req.body;
    
    // Use real authentication service
    const { user, tokens } = await authService.register({ username, email, password, claimToken });
    
    // SECURITY: Set httpOnly cookies instead of returning tokens in response
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site cookies in production
      // No domain restriction for cross-origin Railway deployment
      maxAge: 4 * 60 * 60 * 1000 // 4 hours
    });
    
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site cookies in production
      // No domain restriction for cross-origin Railway deployment
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return res.status(201).json({
      success: true,
      user
      // SECURITY: Don't return tokens in response body
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Login user - matches server.ts exactly  
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Use real authentication service
    const { user, tokens } = await authService.login({ email, password });
    
    // SECURITY: Set httpOnly cookies instead of returning tokens in response
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site cookies in production
      // No domain restriction for cross-origin Railway deployment
      maxAge: 4 * 60 * 60 * 1000 // 4 hours
    });
    
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site cookies in production
      // No domain restriction for cross-origin Railway deployment
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return res.json({
      success: true,
      user
      // SECURITY: Don't return tokens in response body
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Refresh tokens endpoint - matches server.ts exactly
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // SECURITY: Read refresh token from httpOnly cookie instead of request body
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }
    
    const tokens = await authService.refreshTokens(refreshToken);
    
    // SECURITY: Set new tokens as httpOnly cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      // No domain restriction for cross-origin Railway deployment
      maxAge: 4 * 60 * 60 * 1000 // 4 hours
    });
    
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      // No domain restriction for cross-origin Railway deployment
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    return res.json({
      success: true
      // SECURITY: Don't return tokens in response body
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Logout endpoint - matches server.ts exactly
router.post('/logout', authenticateToken, async (req: any, res: Response) => {
  try {
    await authService.logout(req.user.id);
    
    // SECURITY: Clear httpOnly cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      // No domain restriction for cross-origin Railway deployment
    });
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      // No domain restriction for cross-origin Railway deployment
    });
    
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user profile endpoint - matches server.ts exactly
router.get('/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;