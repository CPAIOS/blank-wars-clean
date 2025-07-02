import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabase, query, cache } from './database/index';
import { BattleManager } from './services/battleService';
import { dbAdapter } from './services/databaseAdapter';
import { AuthService, authenticateToken } from './services/auth';
import { aiChatService } from './services/aiChatService';
import jwt from 'jsonwebtoken';
import { apiLimiter, authLimiter, battleLimiter, wsLimiter } from './middleware/rateLimiter';
import cookieParser from 'cookie-parser';
import { skipCsrf, getCsrfToken, csrfErrorHandler } from './middleware/csrf';

// Load environment variables
config();

// Initialize services
const authService = new AuthService();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// SECURITY: Add request timeout middleware  
app.use((req, res, next) => {
  const timeout = 30000; // 30 seconds
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        message: 'Request took too long to process'
      });
    }
  }, timeout);
  
  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));
  
  next();
});

// Apply rate limiting to all routes
app.use('/api/', apiLimiter);

// Apply CSRF protection to state-changing routes
app.use('/api/', skipCsrf(['/health', '/api/auth/refresh']));

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Blank Wars API Server',
    version: '1.0.0',
    status: 'running',
  });
});

// Authentication endpoints
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Use real authentication service
    const { user, tokens } = await authService.register({ username, email, password });
    
    // Give new user a starter character (Robin Hood)
    const starterCharacter = await dbAdapter.userCharacters.create({
      user_id: user.id,
      character_id: 'char_003', // Robin Hood
      nickname: 'My Robin Hood'
    });
    
    return res.status(201).json({
      success: true,
      user,
      starterCharacter: starterCharacter ? {
        id: starterCharacter.id,
        name: starterCharacter.name,
        title: starterCharacter.title,
        nickname: starterCharacter.nickname,
        level: starterCharacter.level
      } : null,
      tokens
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Use real authentication service
    const { user, tokens } = await authService.login({ email, password });
    
    return res.json({
      success: true,
      user,
      tokens
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Refresh tokens endpoint
app.post('/api/auth/refresh', authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required'
      });
    }
    
    const tokens = await authService.refreshTokens(refreshToken);
    
    return res.json({
      success: true,
      tokens
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req: any, res) => {
  try {
    await authService.logout(req.user.id);
    
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

// Get user profile endpoint
app.get('/api/auth/profile', authenticateToken, async (req: any, res) => {
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

// Get characters endpoint
app.get('/api/characters', async (req, res) => {
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

// Get user's characters
app.get('/api/user/characters', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const userCharacters = await dbAdapter.userCharacters.findByUserId(userId);
    return res.json({
      success: true,
      characters: userCharacters
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get battle status
app.get('/api/battles/status', async (req, res) => {
  try {
    const queueSize = battleManager.getBattleQueue().size;
    const activeBattles = battleManager.getActiveBattles().size;
    
    return res.json({
      success: true,
      status: {
        queueSize,
        activeBattles,
        serverTime: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's active battles
app.get('/api/user/battles', authenticateToken, async (req: any, res) => {
  try {
    // SECURITY: Use authenticated user ID from JWT, not headers
    const userId = req.user.id;
    
    const activeBattles = await dbAdapter.battles.findActiveByUserId(userId);
    return res.json({
      success: true,
      battles: activeBattles
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize Battle Manager
const battleManager = new BattleManager(io);

// Helper function to authenticate user from token
async function authenticateSocket(token: string): Promise<{ id: string; username: string; rating: number } | null> {
  try {
    // Use real JWT verification only
    const jwtSecret = process.env.JWT_ACCESS_SECRET!;
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (decoded.type !== 'access') {
      return null;
    }
    
    const user = await authService.getProfile(decoded.userId);
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      rating: user.rating || 1000
    };
  } catch (error) {
    console.error('Socket authentication error:', error);
    return null;
  }
}

// Apply rate limiting middleware to WebSocket connections
// TEMPORARILY DISABLED FOR DEMO - Re-enable for production
/*
io.use((socket, next) => {
  const req = socket.request as any;
  req.ip = socket.handshake.address;
  
  wsLimiter(req, {} as any, (err?: any) => {
    if (err) {
      return next(new Error('Rate limit exceeded'));
    }
    next();
  });
});
*/

// Socket.io handlers with battle system integration
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Send immediate connection confirmation
  socket.emit('connection_established', { 
    message: 'Connected to Blank Wars server',
    socketId: socket.id 
  });
  
  let authenticatedUser: { id: string; username: string } | null = null;
  
  // Per-socket rate limiting for events
  const eventRateLimits = new Map<string, number>();
  const checkEventRateLimit = (eventName: string, limitPerMinute: number = 30): boolean => {
    const key = `${socket.id}:${eventName}`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    const lastEvent = eventRateLimits.get(key) || 0;
    if (now - lastEvent < (60000 / limitPerMinute)) {
      return false; // Rate limited
    }
    
    eventRateLimits.set(key, now);
    return true;
  };

  // Authentication
  socket.on('auth', async (token: string) => {
    try {
      const user = await authenticateSocket(token);
      if (user) {
        authenticatedUser = user;
        (socket as any).userId = user.id;
        battleManager.setUserSocket(user.id, socket.id);
        socket.emit('auth_success', { userId: user.id, username: user.username });
        console.log(`👤 User authenticated: ${user.username} (${user.id})`);
      } else {
        socket.emit('auth_error', { error: 'Invalid token' });
        socket.disconnect();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { error: 'Authentication failed' });
      socket.disconnect();
    }
  });

  // Legacy authenticate event removed for security
  socket.on('authenticate', async (data) => {
    console.log(`🚫 Legacy authentication attempt blocked: ${data.username}`);
    socket.emit('authenticated', { 
      success: false, 
      error: 'Legacy authentication disabled. Please use proper JWT authentication.' 
    });
  });

  // Matchmaking with rate limiting
  socket.on('find_match', async (data) => {
    if (!authenticatedUser) {
      socket.emit('match_error', { error: 'Not authenticated' });
      return;
    }

    // Rate limit matchmaking requests (max 10 per minute)
    if (!checkEventRateLimit('find_match', 10)) {
      socket.emit('match_error', { error: 'Rate limit exceeded. Please wait before searching again.' });
      return;
    }

    try {
      console.log(`⚔️ Matchmaking request from ${authenticatedUser.username}:`, data);
      
      const result = await battleManager.findMatch(
        authenticatedUser.id,
        data.characterId,
        data.mode || 'ranked'
      );
      
      socket.emit('match_result', result);
    } catch (error) {
      console.error('Matchmaking error:', error);
      socket.emit('match_error', { error: (error as Error).message });
    }
  });

  // Legacy find_battle event
  socket.on('find_battle', async (data) => {
    if (!authenticatedUser) {
      socket.emit('battle_error', { error: 'Not authenticated' });
      return;
    }

    try {
      console.log(`⚔️ Legacy battle request from ${authenticatedUser.username}`);
      
      // Try to find user's characters
      const userCharacters = await dbAdapter.userCharacters.findByUserId(authenticatedUser.id);
      
      if (userCharacters.length === 0) {
        socket.emit('battle_found', { 
          error: 'No characters found. Please acquire a character first.',
          battleId: null 
        });
        return;
      }

      // Use first available character
      const result = await battleManager.findMatch(
        authenticatedUser.id,
        userCharacters[0].id,
        'casual'
      );
      
      socket.emit('battle_found', { 
        battleId: result.status === 'found' ? result.battle_id : null,
        status: result.status
      });
    } catch (error) {
      console.error('Legacy battle error:', error);
      socket.emit('battle_found', { 
        error: (error as Error).message,
        battleId: null 
      });
    }
  });

  // Join battle
  socket.on('join_battle', async (battleId: string) => {
    if (!authenticatedUser) {
      socket.emit('battle_error', { error: 'Not authenticated' });
      return;
    }

    // Rate limit battle joins (max 20 per minute)
    if (!checkEventRateLimit('join_battle', 20)) {
      socket.emit('battle_error', { error: 'Rate limit exceeded. Please wait before joining another battle.' });
      return;
    }

    try {
      console.log(`🎮 ${authenticatedUser.username} joining battle ${battleId}`);
      await battleManager.connectToBattle(socket, battleId, authenticatedUser.id);
    } catch (error) {
      console.error('Join battle error:', error);
      socket.emit('battle_error', { error: (error as Error).message });
    }
  });

  // Chat message with dynamic AI responses
  socket.on('chat_message', async (data) => {
    console.log('🎯 CHAT MESSAGE RECEIVED:', JSON.stringify(data, null, 2));
    
    // Rate limit chat messages (max 60 per minute)
    if (!checkEventRateLimit('chat_message', 60)) {
      console.log('❌ Chat rate limited');
      socket.emit('chat_error', { error: 'Rate limit exceeded. Please slow down your messages.' });
      return;
    }

    console.log(`💬 Chat message from ${authenticatedUser?.username || 'anonymous'}:`, data.message);
    
    try {
      // Extract character data from request
      const { message, character, characterData, previousMessages, battleContext } = data;
      
      // Prepare chat context for AI service
      const chatContext = {
        characterId: character,
        characterName: characterData?.name || character,
        personality: characterData?.personality || {
          traits: ['Mysterious', 'Wise'],
          speechStyle: 'Thoughtful and measured',
          motivations: ['Knowledge', 'Victory'],
          fears: ['Defeat', 'Ignorance']
        },
        historicalPeriod: characterData?.historicalPeriod,
        mythology: characterData?.mythology,
        currentBondLevel: characterData?.bondLevel,
        previousMessages
      };
      
      // Generate AI response
      const response = await aiChatService.generateCharacterResponse(
        chatContext,
        message,
        battleContext
      );
      
      // Add realistic typing delay
      setTimeout(() => {
        socket.emit('chat_response', {
          character: character,
          message: response.message,
          bondIncrease: response.bondIncrease,
        });
      }, 500 + Math.random() * 1500);
      
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback to simple response if AI fails
      setTimeout(() => {
        socket.emit('chat_response', {
          character: data.character,
          message: "I must gather my thoughts... Ask me again, warrior.",
          bondIncrease: false,
        });
      }, 1000);
    }
  });

  // Battle system events are handled by BattleManager.setupSocketHandlers()
  // when a player joins a battle

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    if (authenticatedUser) {
      battleManager.removeUserSocket(authenticatedUser.id);
      console.log(`👤 User ${authenticatedUser.username} disconnected`);
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  return res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// CSRF error handler
app.use(csrfErrorHandler);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  
  return res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// Server startup
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start the server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Blank Wars API Server running!`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`💾 Database: SQLite (development mode)`);
      console.log(`🎮 Ready to serve battles and chats!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

export { app, io };