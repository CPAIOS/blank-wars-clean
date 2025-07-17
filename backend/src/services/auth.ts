import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import { query, cache } from '../database';
import { User, AuthRequest } from '../types';
// import { PackService } from './packService'; // Temporarily disabled

// Load environment variables
config();

const ACCESS_TOKEN_EXPIRY = '4h';
const REFRESH_TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 12;

export class AuthService {
  private accessSecret: string;
  private refreshSecret: string;
  // private packService: PackService; // Temporarily disabled

  constructor() {
    // SECURITY: Never use default JWT secrets
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
    }
    
    this.accessSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET;
    // this.packService = new PackService(); // Temporarily disabled
    
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
    claimToken?: string; // Optional claim token for gifted packs
  }): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    const { username, email, password, claimToken } = userData;

    console.log('🔄 Starting registration for:', username, email);

    // Validate input
    if (!username || !email || !password) {
      throw new Error('Missing required fields');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    console.log('✅ Input validation passed');

    // Check if user exists
    console.log('🔍 Checking for existing user...');
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    console.log('✅ User doesn\'t exist, proceeding with registration');

    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await this.hashPassword(password);
    console.log('✅ Password hashed successfully');

    // Create user
    console.log('👤 Creating user in database...');
    const userId = uuidv4();
    await query(
      `INSERT INTO users (id, username, email, password_hash, subscription_tier, level, experience, total_battles, total_wins, rating, character_slot_capacity)
       VALUES ($1, $2, $3, $4, 'free', 1, 0, 0, 0, 1000, 12)`,
      [userId, username, email, passwordHash]
    );

    console.log('✅ User created successfully');

    // Get the created user
    console.log('📋 Fetching created user data...');
    const result = await query(
      'SELECT id, username, email, subscription_tier, level, experience, total_battles, total_wins, rating, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    console.log('✅ User data fetched successfully');

    console.log('🔑 Generating tokens...');
    const tokens = this.generateTokens(userId);
    console.log('✅ Tokens generated successfully');

    // --- NEW CHARACTER ASSIGNMENT LOGIC ---
    // TODO: Re-implement character assignment after fixing PackService dependency
    // For now, just log the claimToken for debugging
    if (claimToken) {
      console.log(`Claim token provided for user ${userId}: ${claimToken}`);
    }
    // --- END NEW CHARACTER ASSIGNMENT LOGIC ---

    // Cache user session - skip caching to avoid timeout
    // await cache.set(`user:${userId}`, JSON.stringify(user), 900); // 15 minutes
    // Temporarily disabled to test if cache is causing timeout

    console.log('🎉 Registration completed successfully for:', username);

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
       FROM users WHERE email = $1`,
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
    // await cache.set(`user:${user.id}`, JSON.stringify(user), 900); // 15 minutes
    // Temporarily disabled to test if cache is causing timeout

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
      const result = await query('SELECT id FROM users WHERE id = $1', [decoded.userId]);
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
    // const cached = await cache.get(`user:${userId}`);
    // if (cached) {
    //   return JSON.parse(cached);
    // }

    // Fetch from database
    const result = await query(
      `SELECT id, username, email, subscription_tier, subscription_expires_at,
              level, experience, total_battles, total_wins, rating, created_at, updated_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];
    
    // Cache for future requests
    // await cache.set(`user:${userId}`, JSON.stringify(user), 900);
    
    return user;
  }

  // Logout (invalidate tokens)
  async logout(userId: string): Promise<void> {
    // await cache.del(`user:${userId}`);
    // Temporarily disabled to test if cache is causing timeout
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