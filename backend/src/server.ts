// Load environment variables FIRST
import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeDatabase, query, cache, db } from './database/index';
import { BattleManager } from './services/battleService';
import { dbAdapter } from './services/databaseAdapter';
import { AuthService, authenticateToken } from './services/auth';
import { aiChatService } from './services/aiChatService';
import { UserService } from './services/userService';
import { cardPackService } from './services/CardPackService';
import { paymentService } from './services/PaymentService';
import { LobbyService } from './services/lobbyService';

// Import route modules
import authRouter from './routes/auth';
import userRouter from './routes/userRoutes';
import characterRouter from './routes/characterRoutes';
import { createBattleRouter } from './routes/battleRoutes';
import usageRouter from './routes/usage';
import jwt from 'jsonwebtoken';
import { apiLimiter, authLimiter, battleLimiter, wsLimiter } from './middleware/rateLimiter';
import cookieParser from 'cookie-parser';
import { skipCsrf, getCsrfToken, csrfErrorHandler } from './middleware/csrf';


// Initialize services
const authService = new AuthService();
const userService = new UserService();
const lobbyService = new LobbyService();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3007',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3007',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(compression());
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    await paymentService.handleWebhook(req.body, req.headers['stripe-signature'] as string);
    res.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// JSON body parser (must be after raw body for webhooks)
app.use(express.json());
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
app.use('/api/', skipCsrf(['/health', '/api/auth/refresh', '/api/webhooks/stripe']));

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Route modules
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/characters', characterRouter);
app.use('/api/usage', usageRouter);

// New Card Pack Routes
app.post('/api/packs/purchase', authenticateToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { packType, quantity } = req.body;
    const session = await paymentService.createCheckoutSession(userId, packType, quantity);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cards/redeem', authenticateToken, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { serialNumber } = req.body;
    const character = await cardPackService.redeemDigitalCard(userId, serialNumber);
    res.json(character);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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










// Initialize Battle Manager
const battleManager = new BattleManager(io);

// Battle routes (requires battleManager instance)
app.use('/api/battles', createBattleRouter(battleManager));

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
    
    // Clean up old entries to prevent memory leak
    if (eventRateLimits.size > 1000) {
      for (const [k, time] of eventRateLimits.entries()) {
        if (now - time > 300000) { // 5 minutes old
          eventRateLimits.delete(k);
        }
      }
    }
    
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
        // Send current user profile to the client
        const userProfile = await userService.findUserProfile(user.id);
        if (userProfile) {
          socket.emit('user_profile_update', userProfile);
        }
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

  // Lobby management
  socket.on('create_lobby', async (data) => {
    if (!authenticatedUser) {
      socket.emit('lobby_error', { error: 'Not authenticated' });
      return;
    }
    try {
      const userProfile = await userService.findUserProfile(authenticatedUser.id);
      if (!userProfile) {
        socket.emit('lobby_error', { error: 'User profile not found' });
        return;
      }
      const lobby = lobbyService.createLobby(data.name, userProfile, data.maxMembers, data.isPrivate);
      socket.join(lobby.id);
      io.to(lobby.id).emit('lobby_update', lobby);
      console.log(`🛋️ Lobby created: ${lobby.name} by ${authenticatedUser.username}`);
    } catch (error) {
      console.error('Create lobby error:', error);
      socket.emit('lobby_error', { error: (error as Error).message });
    }
  });

  socket.on('join_lobby', async (data) => {
    if (!authenticatedUser) {
      socket.emit('lobby_error', { error: 'Not authenticated' });
      return;
    }
    try {
      const userProfile = await userService.findUserProfile(authenticatedUser.id);
      if (!userProfile) {
        socket.emit('lobby_error', { error: 'User profile not found' });
        return;
      }
      const lobby = lobbyService.joinLobby(data.lobbyId, userProfile);
      if (lobby) {
        socket.join(lobby.id);
        io.to(lobby.id).emit('lobby_update', lobby);
        console.log(`🚪 ${authenticatedUser.username} joined lobby ${lobby.name}`);
      } else {
        socket.emit('lobby_error', { error: 'Lobby not found or full' });
      }
    } catch (error) {
      console.error('Join lobby error:', error);
      socket.emit('lobby_error', { error: (error as Error).message });
    }
  });

  socket.on('leave_lobby', async (lobbyId: string) => {
    if (!authenticatedUser) return;
    try {
      const lobby = lobbyService.leaveLobby(lobbyId, authenticatedUser.id);
      socket.leave(lobbyId);
      if (lobby) {
        io.to(lobby.id).emit('lobby_update', lobby);
      } else {
        // Lobby was closed
        io.to(lobbyId).emit('lobby_closed', { lobbyId });
      }
      console.log(`🚶 ${authenticatedUser.username} left lobby ${lobbyId}`);
    } catch (error) {
      console.error('Leave lobby error:', error);
      socket.emit('lobby_error', { error: (error as Error).message });
    }
  });

  socket.on('set_ready', async (data: { lobbyId: string; isReady: boolean }) => {
    if (!authenticatedUser) return;
    try {
      const lobby = lobbyService.setMemberReady(data.lobbyId, authenticatedUser.id, data.isReady);
      if (lobby) {
        io.to(lobby.id).emit('lobby_update', lobby);
      }
    } catch (error) {
      console.error('Set ready error:', error);
      socket.emit('lobby_error', { error: (error as Error).message });
    }
  });

  socket.on('start_battle', async (lobbyId: string) => {
    if (!authenticatedUser) return;
    try {
      if (!lobbyService.canStartBattle(lobbyId, authenticatedUser.id)) {
        socket.emit('lobby_error', { error: 'Cannot start battle: not host or not all members ready' });
        return;
      }
      const lobby = lobbyService.getLobbyById(lobbyId);
      if (!lobby) {
        socket.emit('lobby_error', { error: 'Lobby not found' });
        return;
      }

      // Placeholder for actual battle initiation
      // In a real scenario, you'd pass lobby members to battleManager
      console.log(`🚀 Battle starting from lobby ${lobby.name}!`);
      io.to(lobby.id).emit('battle_starting', { lobbyId });
      
      // For now, just signal that battle is starting
      // TODO: Implement proper lobby-to-battle flow
      io.to(lobby.id).emit('battle_started', { 
        message: 'Battle system integration pending',
        lobbyId: lobby.id 
      });
      // Remove lobby after battle starts
      lobbyService.leaveLobby(lobbyId, lobby.hostId); // Host leaves, which closes the lobby

    } catch (error) {
      console.error('Start battle error:', error);
      socket.emit('lobby_error', { error: (error as Error).message });
    }
  });

  socket.on('list_public_lobbies', () => {
    const publicLobbies = lobbyService.listPublicLobbies();
    socket.emit('public_lobbies_list', publicLobbies);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    if (authenticatedUser) {
      battleManager.removeUserSocket(authenticatedUser.id);
      console.log(`👤 User ${authenticatedUser.username} disconnected`);
    }
    
    // Clean up rate limit entries for this socket
    for (const key of eventRateLimits.keys()) {
      if (key.startsWith(`${socket.id}:`)) {
        eventRateLimits.delete(key);
      }
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
      console.log('🤖 Calling AI Chat Service with context:', {
        characterId: chatContext.characterId,
        characterName: chatContext.characterName,
        messageLength: message.length,
        apiKeyPresent: !!process.env.OPENAI_API_KEY
      });
      
      const response = await aiChatService.generateCharacterResponse(
        chatContext,
        message,
        authenticatedUser?.id || 'anonymous',
        db,
        battleContext
      );
      
      console.log('✅ AI Service Response:', {
        messageLength: response.message.length,
        bondIncrease: response.bondIncrease,
        isTemplateResponse: response.message.includes('template') || response.message.includes('fallback')
      });
      
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
      // Send error back to client instead of fake response
      socket.emit('chat_error', {
        character: data.character,
        error: 'AI service unavailable. Please try again.',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Kitchen chat AI conversations
  socket.on('kitchen_chat_request', async (data, callback) => {
    console.log('🍽️ KITCHEN CHAT REQUEST:', data.conversationId, 'from socket:', socket.id);
    
    // Rate limit kitchen chat (max 30 per minute)
    if (!checkEventRateLimit('kitchen_chat', 30)) {
      socket.emit('kitchen_conversation_response', {
        conversationId: data.conversationId,
        error: 'Rate limit exceeded for kitchen chat.'
      });
      return;
    }

    try {
      const { conversationId, characterId, prompt, trigger, context } = data;
      
      console.log('🤖 Kitchen AI Request:', {
        characterId,
        trigger: trigger.substring(0, 50) + '...',
        teammates: context.teammates,
        coach: context.coach
      });

      // Use existing AI chat service with kitchen-specific context
      const kitchenContext = {
        characterId,
        characterName: characterId.split('_')[0], // Extract base name
        personality: {
          traits: ['Frustrated', 'Adapting', 'Confused'],
          speechStyle: 'Exasperated but trying to cope',
          motivations: ['Survival', 'Team success', 'Personal comfort'],
          fears: ['Eternal cramped living', 'Coach displeasure', 'Teammate conflicts']
        },
        historicalPeriod: 'Displaced in modern times',
        mythology: 'Cross-dimensional fighting league',
        currentBondLevel: 3,
        previousMessages: []
      };

      const isCoachDirectMessage = trigger.includes('Your coach just said');
      
      const characterName = kitchenContext.characterName.toLowerCase();
      let characterPrompt = '';
      const forbiddenStarters = ['Ah,', 'Ugh,', 'Well,', 'Oh,', 'Hmm,', 'Ah, the', 'Well, the', 'Oh, the', '*sighs*', '*groans*'];
      
      if (characterName.includes('sherlock')) {
        characterPrompt = 'You are Sherlock Holmes - be witty, observant, and sometimes exasperated by your living situation. Make dry comments about your roommates\' habits.';
      } else if (characterName.includes('dracula')) {
        characterPrompt = 'You are Count Dracula - be dramatic but also frustrated about cramped living. Complain about sunlight, noise during your sleep hours, or lack of privacy.';
      } else if (characterName.includes('achilles')) {
        characterPrompt = 'You are Achilles - be bold and direct. Get annoyed by domestic problems that warriors shouldn\'t have to deal with.';
      } else if (characterName.includes('merlin')) {
        characterPrompt = 'You are Merlin - be wise but also confused by modern life. Comment on how different things were in your time.';
      } else if (characterName.includes('cleopatra')) {
        characterPrompt = 'You are Cleopatra - expect royal treatment but be stuck with peasant accommodations. Be annoyed by the lack of luxury.';
      } else if (characterName.includes('tesla')) {
        characterPrompt = 'You are Nikola Tesla - be brilliant but obsessed with fixing things that are broken in the apartment.';
      } else if (characterName.includes('joan')) {
        characterPrompt = 'You are Joan of Arc - try to keep everyone organized and working together, but get frustrated when they don\'t listen.';
      } else {
        characterPrompt = 'You are stuck in cramped living quarters with other characters. Be frustrated, funny, and authentic.';
      }

      const kitchenPrompt = `KITCHEN SITUATION: ${trigger}

Teammates: ${context.teammates.join(', ')}
Coach: ${context.coach}
Living conditions: ${context.livingConditions.apartmentTier}

${characterPrompt}

${isCoachDirectMessage ? 'Your coach just spoke to everyone. Address them as "Coach" and respond directly to what they said.' : 'You are talking with your teammates. If you mention your coach, refer to them as "Coach" in third person.'}

IMPORTANT:
- Keep responses SHORT (1-2 sentences max)
- Be funny and authentic, not formal or polite
- Complain about your living situation naturally
- React to the specific situation
- Sound like you're actually living with these people, not giving a speech`;

      // Get user ID from socket (you'll need to implement socket authentication)
      const userId = socket.data?.userId || 'anonymous';
      
      const response = await aiChatService.generateCharacterResponse(
        kitchenContext,
        kitchenPrompt,
        userId,
        db,
        { isInBattle: false }
      );
      
      // Check if usage limit was reached
      if (response.usageLimitReached) {
        socket.emit('kitchen_conversation_response', {
          conversationId,
          characterId,
          message: response.message,
          error: true,
          usageLimitReached: true
        });
        return;
      }
      
      // Post-process to catch any repetitive starters that slipped through
      let processedMessage = response.message;
      for (const forbidden of forbiddenStarters) {
        if (processedMessage.startsWith(forbidden)) {
          // Remove the forbidden starter and capitalize the next word
          processedMessage = processedMessage.substring(forbidden.length).trim();
          processedMessage = processedMessage.charAt(0).toUpperCase() + processedMessage.slice(1);
          console.log(`🔧 Removed repetitive starter: "${forbidden}" from response`);
          break;
        }
      }

      console.log('🤖 AI Response received:', processedMessage.substring(0, 50) + '...');

      // Emit response immediately
      console.log('📤 Emitting response for:', conversationId);
      socket.emit('kitchen_conversation_response', {
        conversationId,
        characterId,
        message: processedMessage,
        trigger,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Kitchen chat error:', error);
      socket.emit('kitchen_conversation_response', {
        conversationId: data.conversationId,
        characterId: data.characterId,
        message: `OpenAI service error: ${error instanceof Error ? error.message : String(error)}`,
        error: true,
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Team Chat AI Handler - CRITICAL FOR BATTLE CHAT
  socket.on('team_chat_message', async (data) => {
    console.log('🎯 TEAM CHAT MESSAGE RECEIVED:', JSON.stringify(data, null, 2));
    
    // Rate limit team chat messages (max 60 per minute)
    if (!checkEventRateLimit('team_chat_message', 60)) {
      console.log('❌ Team chat rate limited');
      socket.emit('team_chat_error', { error: 'Rate limit exceeded. Please slow down your messages.' });
      return;
    }

    try {
      // Extract character data from request
      const { message, character, characterId, characterData, previousMessages, battleContext } = data;
      
      console.log('🤖 Processing team chat for character:', characterId, 'Message:', message);
      
      // Prepare chat context for AI service
      const chatContext = {
        characterId: characterId || character,
        characterName: characterData?.name || character,
        personality: characterData?.personality || {
          traits: [characterData?.archetype || 'Mysterious'],
          speechStyle: characterData?.personality?.speechStyle || 'Thoughtful and measured',
          motivations: characterData?.personality?.motivations || ['Victory', 'Team success'],
          fears: ['Defeat', 'Letting the team down']
        },
        historicalPeriod: characterData?.historicalPeriod,
        mythology: characterData?.mythology,
        currentBondLevel: characterData?.bondLevel || 50,
        previousMessages: previousMessages || []
      };
      
      // Generate AI response using the existing AI chat service
      console.log('🤖 Calling AI Chat Service for team chat:', {
        characterId: chatContext.characterId,
        characterName: chatContext.characterName,
        messageLength: message.length,
        apiKeyPresent: !!process.env.OPENAI_API_KEY
      });
      
      // Get user ID from socket for usage tracking
      const userId = socket.data?.userId || 'anonymous';
      
      const response = await aiChatService.generateCharacterResponse(
        chatContext,
        message,
        userId,
        db,
        battleContext || { isInBattle: true }
      );
      
      // Check if usage limit was reached
      if (response.usageLimitReached) {
        socket.emit('team_chat_error', {
          error: response.message,
          usageLimitReached: true
        });
        return;
      }
      
      console.log('✅ AI Team Chat Response:', {
        characterId,
        messageLength: response.message.length,
        bondIncrease: response.bondIncrease
      });
      
      // Send response back to the frontend
      socket.emit('team_chat_response', {
        character: character,
        characterId: characterId,
        message: response.message,
        bondIncrease: response.bondIncrease,
      });
      
    } catch (error) {
      console.error('❌ Team chat error:', error);
      // Send proper error response
      socket.emit('team_chat_error', {
        character: data.character,
        characterId: data.characterId,
        error: `OpenAI service error: ${error instanceof Error ? error.message : String(error)}`,
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Battle system events are handled by BattleManager.setupSocketHandlers()
  // when a player joins a battle
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
const PORT = process.env.PORT || 3006;

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