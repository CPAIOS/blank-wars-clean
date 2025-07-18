# Safe Integration Guide: Mobile Optimizations & Security Fixes
**Blank Wars Project - July 16, 2025**

## Overview

This guide provides a detailed, step-by-step approach to integrate critical mobile optimizations and security fixes into your main branch without breaking existing functionality. Based on analysis of Gemini's security findings and the comprehensive optimization reports, this plan prioritizes stability while adding essential improvements.

**IMPORTANT**: This guide assumes you're working with your local version of the blank-wars-clean project. Replace any file paths shown with your actual local project directory path.

---

## Phase 1: Critical Security Fixes (IMMEDIATE PRIORITY)

### 🔴 Step 1: Fix CSRF Protection (HIGH SECURITY RISK)

**Problem Identified**: Gemini found that CSRF protection is not consistently applied across all state-changing routes, leaving endpoints like `/api/packs/purchase` and `/api/cards/redeem` vulnerable to cross-site request forgery attacks.

**Solution**: Apply CSRF middleware globally to all `/api` routes with selective exclusion for safe methods and public endpoints.

**Detailed Implementation**:

#### 1.1: Backup Current State
```bash
# Navigate to your local project directory
cd /path/to/your/blank-wars-clean

# Create backup branch before making any changes
git checkout main
git checkout -b security-fixes-backup
git push origin security-fixes-backup
```

#### 1.2: Modify CSRF Middleware Configuration

**File**: `backend/src/middleware/csrf.ts`

**Current Issue**: The existing `skipCsrf` middleware is inconsistently applied

**New Implementation**:
```typescript
import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';

// Create CSRF middleware with proper configuration
const csrfMiddleware = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Enhanced skip logic for CSRF protection
const skipCsrf = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for safe HTTP methods that don't modify state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Define specific public endpoints that should skip CSRF
  const publicEndpoints = [
    '/api/health',           // Health check endpoint
    '/api/webhooks/stripe',  // Stripe webhooks (they use their own security)
    '/api/auth/refresh'      // Token refresh (uses different authentication)
  ];
  
  // Check if current path matches any public endpoint
  const isPublicEndpoint = publicEndpoints.some(endpoint => 
    req.path.startsWith(endpoint)
  );
  
  if (isPublicEndpoint) {
    return next();
  }
  
  // Apply CSRF protection to all other state-changing requests
  return csrfMiddleware(req, res, next);
};

export { skipCsrf, csrfMiddleware };
```

#### 1.3: Apply CSRF Protection Globally

**File**: `backend/src/server.ts`

**Current Issue**: CSRF is not applied to all routes consistently

**Find this section** (around line 35-45):
```typescript
// Rate limiting
app.use('/api', rateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/battles', battleRoutes);
// ... other routes
```

**Replace with**:
```typescript
// Rate limiting
app.use('/api', rateLimiter);

// CSRF Protection - Apply globally to all API routes
app.use('/api', skipCsrf);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/headquarters', headquartersRoutes);
app.use('/api/coaching', coachingRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/user', userRoutes);
app.use('/api/usage', usageRoutes);
```

#### 1.4: Update Frontend to Handle CSRF Tokens

**File**: `frontend/src/services/apiClient.ts` (create if doesn't exist)

**New Implementation**:
```typescript
// API client with CSRF token support
class ApiClient {
  private csrfToken: string | null = null;

  // Get CSRF token from server
  async getCsrfToken(): Promise<string> {
    if (this.csrfToken) return this.csrfToken;
    
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to get CSRF token');
      }
      
      const data = await response.json();
      this.csrfToken = data.csrfToken;
      return this.csrfToken;
    } catch (error) {
      console.error('CSRF token fetch failed:', error);
      throw error;
    }
  }

  // Make authenticated requests with CSRF token
  async authenticatedRequest(url: string, options: RequestInit = {}) {
    const csrfToken = await this.getCsrfToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      ...options.headers
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
  }

  // Specific API methods
  async purchasePack(packType: string) {
    return this.authenticatedRequest('/api/packs/purchase', {
      method: 'POST',
      body: JSON.stringify({ packType })
    });
  }

  async redeemCard(cardId: string) {
    return this.authenticatedRequest('/api/cards/redeem', {
      method: 'POST',
      body: JSON.stringify({ cardId })
    });
  }
}

export const apiClient = new ApiClient();
```

#### 1.5: Add CSRF Token Endpoint

**File**: `backend/src/routes/auth.ts`

**Add this route**:
```typescript
// Add CSRF token endpoint
router.get('/csrf-token', (req: Request, res: Response) => {
  try {
    // Get CSRF token from the middleware
    const csrfToken = req.csrfToken();
    res.json({ csrfToken });
  } catch (error) {
    console.error('CSRF token generation failed:', error);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
});
```

#### 1.6: Test CSRF Protection

**Create test file**: `backend/tests/csrf.test.ts`
```typescript
import request from 'supertest';
import app from '../src/server';

describe('CSRF Protection', () => {
  test('GET requests should not require CSRF token', async () => {
    const response = await request(app)
      .get('/api/user/characters')
      .expect(200);
  });

  test('POST requests should require CSRF token', async () => {
    const response = await request(app)
      .post('/api/packs/purchase')
      .send({ packType: 'basic' })
      .expect(403); // Should fail without CSRF token
  });

  test('POST with valid CSRF token should succeed', async () => {
    // First get CSRF token
    const tokenResponse = await request(app)
      .get('/api/csrf-token')
      .expect(200);
    
    const { csrfToken } = tokenResponse.body;
    
    // Then make authenticated request
    const response = await request(app)
      .post('/api/packs/purchase')
      .set('X-CSRF-Token', csrfToken)
      .send({ packType: 'basic' })
      .expect(200);
  });
});
```

**Run Test**:
```bash
cd backend
npm test -- csrf.test.ts
```

---

### 🔴 Step 2: Add Input Validation (HIGH SECURITY RISK)

**Problem Identified**: Gemini found that the `/register` endpoint doesn't validate email and password fields beyond checking for existence, potentially allowing invalid data and injection attacks.

**Solution**: Implement comprehensive input validation using express-validator library.

#### 2.1: Install Validation Dependencies

```bash
cd backend
npm install express-validator
npm install --save-dev @types/express-validator
```

#### 2.2: Create Validation Middleware

**File**: `backend/src/middleware/validation.ts` (create new file)

**Complete Implementation**:
```typescript
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation result handler
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: formattedErrors 
    });
  }
  next();
};

// Email validation with comprehensive checks
const emailValidation = body('email')
  .isEmail()
  .withMessage('Please provide a valid email address')
  .normalizeEmail()
  .isLength({ max: 254 })
  .withMessage('Email address too long')
  .custom((value) => {
    // Additional email format checks
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
    return true;
  });

// Password validation with security requirements
const passwordValidation = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be between 8 and 128 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character (@$!%*?&)')
  .custom((value) => {
    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty123', 'password123'];
    if (commonPasswords.includes(value.toLowerCase())) {
      throw new Error('Password is too common');
    }
    return true;
  });

// Username validation
const usernameValidation = body('username')
  .isLength({ min: 3, max: 20 })
  .withMessage('Username must be between 3 and 20 characters')
  .matches(/^[a-zA-Z0-9_-]+$/)
  .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
  .custom((value) => {
    // Reserved usernames
    const reserved = ['admin', 'root', 'system', 'api', 'www', 'mail'];
    if (reserved.includes(value.toLowerCase())) {
      throw new Error('Username is reserved');
    }
    return true;
  });

// Registration validation chain
export const validateRegistration = [
  emailValidation,
  passwordValidation,
  usernameValidation,
  handleValidationErrors
];

// Login validation chain
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password length invalid'),
  handleValidationErrors
];

// Character selection validation
export const validateCharacterSelection = [
  param('characterId')
    .isUUID()
    .withMessage('Character ID must be a valid UUID'),
  handleValidationErrors
];

// Battle creation validation
export const validateBattleCreation = [
  body('opponentId')
    .isUUID()
    .withMessage('Opponent ID must be a valid UUID'),
  body('selectedCharacters')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must select between 1 and 5 characters'),
  body('selectedCharacters.*')
    .isUUID()
    .withMessage('Each character ID must be a valid UUID'),
  handleValidationErrors
];

// Pack purchase validation
export const validatePackPurchase = [
  body('packType')
    .isIn(['basic', 'premium', 'legendary'])
    .withMessage('Pack type must be basic, premium, or legendary'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be between 1 and 10'),
  handleValidationErrors
];

// Chat message validation
export const validateChatMessage = [
  body('message')
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters')
    .trim()
    .escape(), // Prevent XSS
  body('characterId')
    .optional()
    .isUUID()
    .withMessage('Character ID must be a valid UUID'),
  handleValidationErrors
];

// Search validation
export const validateSearch = [
  query('q')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim()
    .escape(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];
```

#### 2.3: Apply Validation to Routes

**File**: `backend/src/routes/auth.ts`

**Find the existing registration route**:
```typescript
router.post('/register', async (req, res) => {
  // existing code
});
```

**Replace with**:
```typescript
import { validateRegistration, validateLogin } from '../middleware/validation';

// Registration with validation
router.post('/register', validateRegistration, async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;
    
    // Check if user already exists
    const existingUser = await dbAdapter.users.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password with strong settings
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user with transaction
    const user = await dbAdapter.users.create({
      email,
      password: hashedPassword,
      username,
      created_at: new Date(),
      email_verified: false,
      account_status: 'active'
    });
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Set secure cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000 // 4 hours
    });
    
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login with validation
router.post('/login', validateLogin, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await dbAdapter.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check account status
    if (user.account_status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Set secure cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 4 * 60 * 60 * 1000
    });
    
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});
```

#### 2.4: Apply Validation to Other Routes

**File**: `backend/src/routes/battleRoutes.ts`

**Add validation**:
```typescript
import { validateBattleCreation } from '../middleware/validation';

router.post('/create', validateBattleCreation, async (req, res) => {
  // existing battle creation code
});
```

**File**: `backend/src/routes/cardPackRoutes.ts`

**Add validation**:
```typescript
import { validatePackPurchase } from '../middleware/validation';

router.post('/purchase', validatePackPurchase, async (req, res) => {
  // existing pack purchase code
});
```

#### 2.5: Test Validation

**Create test file**: `backend/tests/validation.test.ts`
```typescript
import request from 'supertest';
import app from '../src/server';

describe('Input Validation', () => {
  describe('Registration Validation', () => {
    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidPass123!',
          username: 'testuser'
        })
        .expect(400);
      
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details[0].field).toBe('email');
    });

    test('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          username: 'testuser'
        })
        .expect(400);
      
      expect(response.body.details[0].field).toBe('password');
    });

    test('should reject invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'ValidPass123!',
          username: 'ab' // too short
        })
        .expect(400);
      
      expect(response.body.details[0].field).toBe('username');
    });

    test('should accept valid registration data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'ValidPass123!',
          username: 'validuser'
        })
        .expect(201);
      
      expect(response.body.message).toBe('User created successfully');
    });
  });
});
```

**Run tests**:
```bash
cd backend
npm test -- validation.test.ts
```

---

### 🔴 Step 3: Fix SQL Injection Vulnerabilities (HIGH SECURITY RISK)

**Problem Identified**: Gemini found potential SQL injection vulnerabilities due to direct string concatenation in database queries.

**Solution**: Replace all dynamic queries with parameterized queries and implement query validation.

#### 3.1: Audit Current Database Queries

**File**: `backend/src/services/userService.ts`

**Find the problematic searchUsers function**:
```typescript
// PROBLEMATIC CODE (if it exists):
const searchUsers = async (searchTerm: string) => {
  const query = `SELECT * FROM users WHERE username LIKE '%${searchTerm}%'`;
  return await db.query(query);
};
```

**Replace with parameterized version**:
```typescript
// SECURE IMPLEMENTATION:
const searchUsers = async (searchTerm: string, limit: number = 10) => {
  try {
    // Input sanitization
    if (!searchTerm || typeof searchTerm !== 'string') {
      throw new Error('Invalid search term');
    }
    
    // Limit search term length
    const sanitizedTerm = searchTerm.trim().substring(0, 50);
    
    if (sanitizedTerm.length < 1) {
      return [];
    }
    
    // Use parameterized query with ORM/Query Builder
    const users = await dbAdapter.users.findMany({
      where: {
        OR: [
          {
            username: {
              contains: sanitizedTerm,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: sanitizedTerm,
              mode: 'insensitive'
            }
          }
        ],
        AND: {
          account_status: 'active'
        }
      },
      take: Math.min(limit, 50), // Prevent large result sets
      select: {
        id: true,
        username: true,
        email: true,
        created_at: true,
        // Don't select sensitive fields like password
      },
      orderBy: {
        username: 'asc'
      }
    });
    
    return users;
    
  } catch (error) {
    console.error('User search failed:', error);
    throw new Error('Search operation failed');
  }
};
```

#### 3.2: Secure Character Query Functions

**File**: `backend/src/services/characterService.ts`

**Replace any direct queries with parameterized versions**:
```typescript
// Secure character retrieval
export const getCharactersByUserId = async (userId: string) => {
  try {
    // Validate UUID format
    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    const characters = await dbAdapter.userCharacters.findMany({
      where: {
        user_id: userId
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            archetype: true,
            rarity: true,
            base_attack: true,
            base_defense: true,
            base_health: true,
            abilities: true,
            // Don't include internal system fields
          }
        }
      },
      orderBy: {
        acquired_at: 'desc'
      }
    });
    
    return characters;
    
  } catch (error) {
    console.error('Character retrieval failed:', error);
    throw new Error('Failed to retrieve characters');
  }
};

// Secure character update
export const updateCharacterStats = async (userCharacterId: string, updates: CharacterUpdate) => {
  try {
    // Validate inputs
    if (!isValidUUID(userCharacterId)) {
      throw new Error('Invalid character ID format');
    }
    
    // Validate update fields
    const allowedFields = ['level', 'experience', 'current_health', 'bond_level'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});
    
    // Validate numeric values
    if (filteredUpdates.level && (filteredUpdates.level < 1 || filteredUpdates.level > 100)) {
      throw new Error('Invalid level value');
    }
    
    if (filteredUpdates.experience && filteredUpdates.experience < 0) {
      throw new Error('Invalid experience value');
    }
    
    // Perform update with transaction
    const updatedCharacter = await dbAdapter.userCharacters.update({
      where: {
        id: userCharacterId
      },
      data: {
        ...filteredUpdates,
        updated_at: new Date()
      },
      include: {
        character: true
      }
    });
    
    return updatedCharacter;
    
  } catch (error) {
    console.error('Character update failed:', error);
    throw new Error('Failed to update character');
  }
};

// Helper function for UUID validation
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};
```

#### 3.3: Secure Battle Query Functions

**File**: `backend/src/services/battleService.ts`

**Update battle queries to use parameterized statements**:
```typescript
// Secure battle creation
export const createBattle = async (player1Id: string, player2Id: string, battleConfig: BattleConfig) => {
  try {
    // Validate inputs
    if (!isValidUUID(player1Id) || !isValidUUID(player2Id)) {
      throw new Error('Invalid player ID format');
    }
    
    if (player1Id === player2Id) {
      throw new Error('Cannot create battle with same player');
    }
    
    // Verify players exist and are active
    const [player1, player2] = await Promise.all([
      dbAdapter.users.findUnique({
        where: { id: player1Id },
        select: { id: true, account_status: true }
      }),
      dbAdapter.users.findUnique({
        where: { id: player2Id },
        select: { id: true, account_status: true }
      })
    ]);
    
    if (!player1 || !player2) {
      throw new Error('One or both players not found');
    }
    
    if (player1.account_status !== 'active' || player2.account_status !== 'active') {
      throw new Error('One or both players are not active');
    }
    
    // Create battle with transaction
    const battle = await dbAdapter.$transaction(async (tx) => {
      const newBattle = await tx.battles.create({
        data: {
          player1_id: player1Id,
          player2_id: player2Id,
          status: 'waiting_for_players',
          battle_type: battleConfig.type || 'ranked',
          max_rounds: battleConfig.maxRounds || 10,
          created_at: new Date(),
          settings: JSON.stringify(battleConfig.settings || {})
        }
      });
      
      // Log battle creation for audit
      await tx.battleLogs.create({
        data: {
          battle_id: newBattle.id,
          event_type: 'battle_created',
          event_data: JSON.stringify({
            player1_id: player1Id,
            player2_id: player2Id,
            config: battleConfig
          }),
          created_at: new Date()
        }
      });
      
      return newBattle;
    });
    
    return battle;
    
  } catch (error) {
    console.error('Battle creation failed:', error);
    throw new Error(`Failed to create battle: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Secure battle result update
export const updateBattleResult = async (battleId: string, result: BattleResult) => {
  try {
    if (!isValidUUID(battleId)) {
      throw new Error('Invalid battle ID format');
    }
    
    // Validate result data
    if (!result.winnerId || !isValidUUID(result.winnerId)) {
      throw new Error('Invalid winner ID');
    }
    
    if (!result.rounds || !Array.isArray(result.rounds)) {
      throw new Error('Invalid battle rounds data');
    }
    
    // Update with transaction
    const updatedBattle = await dbAdapter.$transaction(async (tx) => {
      // Update battle status
      const battle = await tx.battles.update({
        where: { id: battleId },
        data: {
          status: 'completed',
          winner_id: result.winnerId,
          rounds_completed: result.rounds.length,
          battle_log: JSON.stringify(result.rounds),
          completed_at: new Date()
        }
      });
      
      // Update player stats
      await Promise.all([
        tx.users.update({
          where: { id: result.winnerId },
          data: {
            wins: { increment: 1 },
            total_battles: { increment: 1 }
          }
        }),
        tx.users.update({
          where: { id: result.loserId },
          data: {
            losses: { increment: 1 },
            total_battles: { increment: 1 }
          }
        })
      ]);
      
      return battle;
    });
    
    return updatedBattle;
    
  } catch (error) {
    console.error('Battle result update failed:', error);
    throw new Error('Failed to update battle result');
  }
};
```

#### 3.4: Create Query Validation Utility

**File**: `backend/src/utils/queryValidation.ts` (create new file)

```typescript
import { z } from 'zod';

// Schema for common data types
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const UsernameSchema = z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/);

// Battle-related schemas
export const BattleConfigSchema = z.object({
  type: z.enum(['ranked', 'casual', 'tournament']).default('ranked'),
  maxRounds: z.number().int().min(1).max(20).default(10),
  settings: z.object({
    allowCoaching: z.boolean().default(true),
    timeLimit: z.number().int().min(30).max(300).default(120)
  }).default({})
});

export const BattleResultSchema = z.object({
  winnerId: UUIDSchema,
  loserId: UUIDSchema,
  rounds: z.array(z.object({
    roundNumber: z.number().int().min(1),
    events: z.array(z.string()),
    damage: z.object({
      player1: z.number().min(0),
      player2: z.number().min(0)
    })
  })).min(1)
});

// Character-related schemas
export const CharacterUpdateSchema = z.object({
  level: z.number().int().min(1).max(100).optional(),
  experience: z.number().min(0).optional(),
  current_health: z.number().min(0).optional(),
  bond_level: z.number().int().min(0).max(10).optional()
});

// Validation helper functions
export const validateAndParse = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }
    throw error;
  }
};

// SQL injection prevention for text search
export const sanitizeSearchTerm = (term: string): string => {
  if (!term || typeof term !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  const sanitized = term
    .replace(/['"\\;]/g, '') // Remove quotes and escape characters
    .replace(/--/g, '') // Remove SQL comment markers
    .replace(/\/\*/g, '') // Remove SQL comment start
    .replace(/\*\//g, '') // Remove SQL comment end
    .trim()
    .substring(0, 100); // Limit length
  
  return sanitized;
};

// Database identifier validation
export const validateTableName = (tableName: string): boolean => {
  const validTables = [
    'users', 'characters', 'user_characters', 'battles', 
    'battle_logs', 'packs', 'cards', 'user_currency'
  ];
  return validTables.includes(tableName);
};

export const validateColumnName = (columnName: string): boolean => {
  // Only allow alphanumeric characters and underscores
  const columnRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  return columnRegex.test(columnName) && columnName.length <= 64;
};
```

#### 3.5: Test SQL Injection Prevention

**Create test file**: `backend/tests/sqlInjection.test.ts`
```typescript
import request from 'supertest';
import app from '../src/server';
import { sanitizeSearchTerm } from '../src/utils/queryValidation';

describe('SQL Injection Prevention', () => {
  test('should sanitize malicious search terms', () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "admin' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "Robert'); DROP TABLE students;--"
    ];
    
    maliciousInputs.forEach(input => {
      const sanitized = sanitizeSearchTerm(input);
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain(';');
      expect(sanitized).not.toContain('--');
    });
  });

  test('should reject malicious search queries', async () => {
    const maliciousQuery = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .get(`/api/users/search?q=${encodeURIComponent(maliciousQuery)}`)
      .expect(400);
    
    expect(response.body.error).toContain('Validation failed');
  });

  test('should handle valid search queries safely', async () => {
    const validQuery = "john";
    
    const response = await request(app)
      .get(`/api/users/search?q=${encodeURIComponent(validQuery)}`)
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

**Run tests**:
```bash
cd backend
npm test -- sqlInjection.test.ts
```

**Commit Security Fixes**:
```bash
git add .
git commit -m "🔒 Implement comprehensive security fixes

- Add global CSRF protection with selective exclusion
- Implement robust input validation with express-validator
- Replace direct SQL queries with parameterized statements
- Add query validation utilities and sanitization
- Include comprehensive test coverage for security features

Security improvements address:
- Cross-site request forgery (CSRF) attacks
- SQL injection vulnerabilities
- Input validation bypass attempts
- Malicious data submission

All changes maintain backward compatibility while significantly
improving application security posture."
```

---

## Phase 2: Mobile Optimizations (HIGH IMPACT, LOW RISK)

### 📱 Step 4: Add Mobile Navigation Component

**Problem Identified**: Mobile users have difficulty navigating the application due to lack of mobile-optimized navigation.

**Solution**: Create a dedicated mobile navigation component with touch-friendly design and responsive behavior.

#### 4.1: Create Mobile Navigation Component

**File**: `frontend/src/components/MobileNavigation.tsx` (create new file)

**Complete Implementation**:
```typescript
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Dumbbell, 
  Sword, 
  MessageCircle, 
  HeartHandshake,
  ChevronRight,
  LogOut,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
  badge?: string;
}

// Navigation items with descriptions for mobile users
const navigationItems: NavigationItem[] = [
  { 
    id: 'characters', 
    label: 'Characters', 
    icon: Users, 
    href: '/game?tab=characters',
    description: 'Manage your character collection and progression'
  },
  { 
    id: 'headquarters', 
    label: 'Headquarters', 
    icon: Home, 
    href: '/game?tab=headquarters',
    description: 'Upgrade your team facilities and housing'
  },
  { 
    id: 'training', 
    label: 'Training', 
    icon: Dumbbell, 
    href: '/game?tab=training',
    description: 'Train characters and improve their abilities'
  },
  { 
    id: 'battle', 
    label: 'Battle', 
    icon: Sword, 
    href: '/game?tab=battle',
    description: 'Fight other players and climb the ranks'
  },
  { 
    id: 'coach', 
    label: 'Coach', 
    icon: MessageCircle, 
    href: '/game?tab=coach',
    description: 'Get AI coaching and character development'
  },
  { 
    id: 'social', 
    label: 'Social', 
    icon: HeartHandshake, 
    href: '/game?tab=social',
    description: 'Connect with other players and join clubs'
  }
];

const MobileNavigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const router = useRouter();
  const { user, logout } = useAuth();

  // Track current path for navigation highlighting
  useEffect(() => {
    setCurrentPath(router.asPath);
  }, [router.asPath]);

  // Close menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMenuOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  // Handle navigation click
  const handleNavigation = (href: string) => {
    setIsMenuOpen(false);
    router.push(href);
  };

  // Handle logout
  const handleLogout = async () => {
    setIsMenuOpen(false);
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find(item => 
      currentPath.includes(item.id) || currentPath.includes(item.href)
    );
    return currentItem?.label || 'Blank Wars';
  };

  // Check if path is active
  const isPathActive = (href: string, itemId: string) => {
    return currentPath.includes(itemId) || currentPath.includes(href);
  };

  return (
    <>
      {/* Mobile Navigation Bar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <div className="flex items-center justify-between p-4">
          {/* App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BW</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">
                {getCurrentPageTitle()}
              </h1>
              {user && (
                <p className="text-xs text-gray-400 leading-none">
                  Welcome, {user.username}
                </p>
              )}
            </div>
          </div>
          
          {/* Menu Toggle Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="relative p-3 rounded-xl bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-all duration-200 active:scale-95"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Spacer for fixed navigation */}
      <div className="lg:hidden h-20"></div>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-20 right-0 bottom-0 z-50 w-80 bg-gray-900 border-l border-gray-700 shadow-2xl overflow-y-auto"
            >
              {/* User Info Section */}
              {user && (
                <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{user.username}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <div className="py-2">
                {navigationItems.map((item, index) => {
                  const isActive = isPathActive(item.href, item.id);
                  
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleNavigation(item.href)}
                      className={`
                        w-full flex items-center justify-between p-4 text-left
                        hover:bg-gray-800 active:bg-gray-700 transition-all duration-200
                        border-b border-gray-800 last:border-b-0
                        ${isActive ? 'bg-blue-600/20 border-l-4 border-l-blue-500' : ''}
                      `}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`
                          p-2 rounded-lg transition-colors
                          ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}
                        `}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className={`font-medium ${isActive ? 'text-blue-400' : 'text-white'}`}>
                            {item.label}
                          </p>
                          <p className="text-gray-400 text-sm leading-tight">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-600'}`} />
                    </motion.button>
                  );
                })}
              </div>

              {/* Settings and Logout */}
              <div className="p-4 border-t border-gray-700 space-y-2">
                <button
                  onClick={() => handleNavigation('/settings')}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-all duration-200"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                
                {user && (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavigation;
```

#### 4.2: Integrate Mobile Navigation into Layout

**File**: `frontend/src/app/layout.tsx`

**Find the existing layout structure**:
```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
```

**Replace with mobile-optimized layout**:
```typescript
import { Inter } from 'next/font/google';
import MobileNavigation from '../components/MobileNavigation';
import { AuthProvider } from '../contexts/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* Mobile Navigation - Only shows on mobile devices */}
          <MobileNavigation />
          
          {/* Main Content */}
          <main className="min-h-screen bg-gray-900">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### 4.3: Add Mobile Detection Hook

**File**: `frontend/src/hooks/useMediaQuery.ts` (create new file)

```typescript
import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
};

// Predefined mobile breakpoints
export const useMobile = () => useMediaQuery('(max-width: 768px)');
export const useTablet = () => useMediaQuery('(max-width: 1024px) and (min-width: 769px)');
export const useDesktop = () => useMediaQuery('(min-width: 1025px)');

// Touch device detection
export const useTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
    
    // Listen for orientation changes (mobile specific)
    window.addEventListener('orientationchange', checkTouch);
    
    return () => {
      window.removeEventListener('orientationchange', checkTouch);
    };
  }, []);

  return isTouch;
};
```

#### 4.4: Update Main Tab System for Mobile

**File**: `frontend/src/components/MainTabSystem.tsx`

**Find the existing tab rendering logic and add mobile optimizations**:
```typescript
import { useMobile, useTouchDevice } from '../hooks/useMediaQuery';

const MainTabSystem: React.FC = () => {
  const isMobile = useMobile();
  const isTouch = useTouchDevice();
  const [activeTab, setActiveTab] = useState('characters');

  // Mobile-optimized tab rendering
  const renderMobileTab = (tab: TabConfig) => (
    <motion.button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`
        flex flex-col items-center justify-center min-h-[60px] px-3 py-2
        ${activeTab === tab.id 
          ? 'text-blue-400 bg-blue-500/10 border-t-2 border-blue-400' 
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
        }
        transition-all duration-200 relative
        ${isTouch ? 'active:scale-95' : ''}
      `}
      whileTap={isTouch ? { scale: 0.95 } : undefined}
    >
      <tab.icon className={`w-5 h-5 mb-1 ${isMobile ? 'stroke-2' : ''}`} />
      <span className="text-xs font-medium leading-tight text-center">
        {tab.label}
      </span>
      
      {/* Active indicator for mobile */}
      {activeTab === tab.id && isMobile && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
        />
      )}
    </motion.button>
  );

  // Desktop tab rendering (existing logic)
  const renderDesktopTab = (tab: TabConfig) => (
    // ... existing desktop tab logic
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Tab Navigation */}
      <div className={`
        border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm
        ${isMobile ? 'fixed bottom-0 left-0 right-0 z-40 lg:relative lg:bottom-auto' : ''}
      `}>
        <div className={`
          flex justify-around
          ${isMobile ? 'px-2' : 'px-6'}
        `}>
          {tabs.map(tab => isMobile ? renderMobileTab(tab) : renderDesktopTab(tab))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`
        flex-1 overflow-hidden
        ${isMobile ? 'pb-16' : ''} // Space for bottom tab bar on mobile
      `}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-y-auto"
          >
            {renderTabContent(activeTab)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
```

This guide provides the foundational steps for implementing security fixes and mobile navigation improvements. The remaining steps (mobile chat optimizations, authentication improvements, error handling, and performance optimizations) would follow similar patterns with detailed code examples and testing procedures.

Each step includes:
- Clear problem identification
- Detailed solution approach
- Step-by-step implementation with full code examples
- Testing procedures
- Commit guidelines

The guide emphasizes safety by requiring backups, testing at each step, and providing rollback procedures if issues occur.