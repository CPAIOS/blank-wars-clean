import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import { query, cache } from '../database';
import { User, AuthRequest } from '../types';

// Load environment variables
config();

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';
const SALT_ROUNDS = 12;

export class AuthService {
  private accessSecret: string;
  private refreshSecret: string;

  constructor() {
    // SECURITY: Never use default JWT secrets
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
    }
    
    this.accessSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    
    // Ensure secrets are strong enough
    if (this.accessSecret.length < 32 || this.refreshSecret.length < 32) {
      throw new Error('JWT secrets must be at least 32 characters long');
    }
  }

  // Generate tokens
  private generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId, type: 'access' }, this.accessSecret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign({ userId, type: 'refresh' }, this.refreshSecret, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    return { accessToken, refreshToken };
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Register new user
  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    const { username, email, password } = userData;

    // Validate input
    if (!username || !email || !password) {
      throw new Error('Missing required fields');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const userId = uuidv4();
    await query(
      `INSERT INTO users (id, username, email, password_hash, subscription_tier, level, experience, total_battles, total_wins, rating)
       VALUES (?, ?, ?, ?, 'free', 1, 0, 0, 0, 1000)`,
      [userId, username, email, passwordHash]
    );

    // Get the created user
    const result = await query(
      'SELECT id, username, email, subscription_tier, level, experience, total_battles, total_wins, rating, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    const user = result.rows[0];
    const tokens = this.generateTokens(userId);

    // Assign starter character (Robin Hood) to new user
    await this.assignStarterCharacter(userId);

    // Cache user session
    await cache.set(`user:${userId}`, JSON.stringify(user), 900); // 15 minutes

    return { user, tokens };
  }

  // Login user
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    const { email, password } = credentials;

    // Find user
    const result = await query(
      `SELECT id, username, email, password_hash, subscription_tier, subscription_expires_at, 
              level, experience, total_battles, total_wins, rating, created_at, updated_at 
       FROM users WHERE email = ?`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Remove password hash from user object
    delete user.password_hash;

    const tokens = this.generateTokens(user.id);

    // Cache user session
    await cache.set(`user:${user.id}`, JSON.stringify(user), 900); // 15 minutes

    return { user, tokens };
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshSecret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if user still exists
      const result = await query('SELECT id FROM users WHERE id = ?', [decoded.userId]);
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return this.generateTokens(decoded.userId);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Get user profile
  async getProfile(userId: string): Promise<User> {
    // Try cache first
    const cached = await cache.get(`user:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const result = await query(
      `SELECT id, username, email, subscription_tier, subscription_expires_at,
              level, experience, total_battles, total_wins, rating, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];
    
    // Cache for future requests
    await cache.set(`user:${userId}`, JSON.stringify(user), 900);
    
    return user;
  }

  // Assign starter character (Robin Hood) to new user
  private async assignStarterCharacter(userId: string): Promise<void> {
    const robinHoodId = 'char_003'; // Robin Hood
    const userCharacterId = uuidv4();
    
    try {
      await query(
        `INSERT INTO user_characters (
          id, user_id, character_id, level, experience, bond_level,
          total_battles, total_wins, current_health, max_health,
          is_injured, acquired_at, acquired_from
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`,
        [
          userCharacterId,
          userId,
          robinHoodId,
          1,              // level
          0,              // experience
          0,              // bond_level
          0,              // total_battles
          0,              // total_wins
          85,             // current_health (Robin Hood's base health)
          85,             // max_health
          false,          // is_injured
          'starter'       // acquired_from
        ]
      );
      
      console.log(`Assigned starter character Robin Hood to user ${userId}`);
    } catch (error) {
      console.error('Failed to assign starter character:', error);
      // Don't throw here to avoid breaking registration flow
    }
  }

  // Logout (invalidate tokens)
  async logout(userId: string): Promise<void> {
    await cache.del(`user:${userId}`);
  }
}

// Middleware to authenticate requests
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // SECURITY: Read token from httpOnly cookie instead of Authorization header
    const token = req.cookies.accessToken;

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    
    if (decoded.type !== 'access') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    // Get user from cache or database
    const authService = new AuthService();
    const user = await authService.getProfile(decoded.userId);
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
      if (decoded.type === 'access') {
        const authService = new AuthService();
        req.user = await authService.getProfile(decoded.userId);
      }
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  
  next();
};