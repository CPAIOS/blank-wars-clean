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
import cardPackRouter from './routes/cardPackRoutes';
import echoRouter from './routes/echoRoutes';
import trainingRouter from './routes/trainingRoutes';
import socialRouter from './routes/socialRoutes';
import headquartersRouter from './routes/headquartersRoutes';
import coachingRouter from './routes/coachingRoutes';
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

// Apply CSRF protection to state-changing routes (skip in development)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', skipCsrf(['/health', '/auth/refresh', '/webhooks/stripe']));
} else {
  console.log('🔓 CSRF protection disabled in development mode');
}

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Route modules
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/characters', characterRouter);
app.use('/api/usage', usageRouter);
app.use('/api/packs', cardPackRouter);
app.use('/api/echoes', echoRouter);
app.use('/api/training', trainingRouter);
app.use('/api/social', socialRouter);
app.use('/api/headquarters', headquartersRouter);
app.use('/api/coaching', coachingRouter);

// New Card Pack Routes (These are now handled by cardPackRouter)
// app.post('/api/packs/purchase', authenticateToken, async (req, res) => {
//   try {
//     // @ts-ignore
//     const userId = req.user.id;
//     const { packType, quantity } = req.body;
//     const session = await paymentService.createCheckoutSession(userId, packType, quantity);
//     res.json(session);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.post('/api/cards/redeem', authenticateToken, async (req, res) => {
//   try {
//     // @ts-ignore
//     const userId = req.user.id;
//     const { serialNumber } = req.body;
//     const character = await cardPackService.redeemDigitalCard(userId, serialNumber);
//     res.json(character);
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// });

// Confessional Interview endpoint
app.post('/api/confessional-interview', async (req, res) => {
  try {
    const { context, userResponse } = req.body;
    
    // Create HOSTMASTER prompt for follow-up questions
    const hostmasterPrompt = `You are the HOSTMASTER, an AI interviewer for the BLANK WARS reality show. You're conducting a confessional interview.

🎬 BLANK WARS SHOW CONTEXT:
- Gladiator-style tournament with famous warriors/legends from history
- All contestants live together in cramped ${context.livingConditions.name || context.livingConditions} quarters
- Constant drama over beds, bathroom time, food, privacy
- Everyone's competing for prize money and trying to avoid elimination
- Alliances form and break - trust is rare

CURRENT INTERVIEW:
- Character: ${context.characterName} (${context.characterPersonality?.historicalPeriod || 'Historical figure'})
- Their Response: "${userResponse}"
- Previous Questions: ${context.previousQuestions.slice(-2).join(', ')}

HOSTMASTER STYLE:
- Ask SPECIFIC questions about house drama, not generic ones
- Reference actual living conditions and roommate conflicts
- Dig into alliances, betrayals, and strategy
- Ask about specific personality clashes between historical figures
- Be provocative but entertaining (like Jeff Probst or Julie Chen)
- Vary your question types - don't repeat patterns

QUESTION TYPES TO CHOOSE FROM:
- "Who in the house is really getting on your nerves and why?"
- "Tell me about the bathroom situation - I heard there was drama this morning?"
- "Which of your housemates do you think is playing the best game right now?"
- "If you had to pick someone to be eliminated next, who would it be?"
- "What's the most annoying thing about living with [specific character name]?"
- "Who do you trust least in this house?"
- "What's your biggest complaint about the living conditions?"
- "Who's been talking behind your back?"
- "What alliance are you really in?"
- "Who would you never want to face in the arena?"

Generate ONE SPECIFIC, JUICY follow-up question. No generic responses. Make it reality TV gold!`;

    // Generate HOSTMASTER response using AI service
    const response = await aiChatService.generateCharacterResponse(
      { 
        characterId: 'hostmaster', 
        characterName: 'HOSTMASTER',
        personality: {
          traits: ['Probing', 'Entertaining', 'Provocative'],
          speechStyle: 'Reality TV host style',
          motivations: ['Drama', 'Entertainment', 'Ratings'],
          fears: ['Boring interviews']
        }
      },
      hostmasterPrompt,
      'system',
      db,
      { isInBattle: false }
    );

    console.log('🎙️ HOSTMASTER Response Generated:', response.message);
    res.json({
      hostmasterResponse: response.message || "That's fascinating. Tell me more about how you're really feeling about your teammates."
    });

  } catch (error) {
    console.error('🚨 HOSTMASTER ERROR - falling back to generic question:', error);
    res.status(500).json({
      hostmasterResponse: "Spill the tea! Who in the house is really getting on your nerves today?"
    });
  }
});

// Confessional Character Response endpoint
app.post('/api/confessional-character-response', async (req, res) => {
  try {
    const { characterContext, prompt } = req.body;
    console.log('🎭 Character Context Received:', JSON.stringify(characterContext, null, 2));
    
    // Ensure personality has required structure
    if (!characterContext.personality || !characterContext.personality.traits) {
      console.log('⚠️ Missing personality data, using defaults');
      characterContext.personality = {
        traits: ['Determined', 'Brave'],
        speechStyle: 'Heroic',
        motivations: ['Victory', 'Honor'],
        fears: ['Defeat', 'Dishonor']
      };
    }
    
    // Generate character response using AI service
    const response = await aiChatService.generateCharacterResponse(
      characterContext,
      prompt,
      'confessional_user',
      db,
      { isInBattle: false }
    );

    res.json({
      message: response.message || "I... uh... this is all very overwhelming.",
      characterName: characterContext.characterName
    });

  } catch (error) {
    console.error('Confessional character response error:', error);
    res.status(500).json({
      message: "I'm not sure what to say right now..."
    });
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
io.on('connection', async (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Send immediate connection confirmation
  socket.emit('connection_established', { 
    message: 'Connected to Blank Wars server',
    socketId: socket.id 
  });
  
  let authenticatedUser: { id: string; username: string } | null = null;
  
  // Per-socket rate limiting for events
  const eventRateLimits = new Map<string, number[]>();
  const checkEventRateLimit = (eventName: string, limitPerMinute: number = 30): boolean => {
    const key = `${socket.id}:${eventName}`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    // Get existing events for this key
    let events = eventRateLimits.get(key) || [];
    
    // Remove events older than 1 minute
    events = events.filter(time => time > windowStart);
    
    // Check if we've exceeded the limit
    if (events.length >= limitPerMinute) {
      return false; // Rate limited
    }
    
    // Add this event and update the map
    events.push(now);
    eventRateLimits.set(key, events);
    
    // Clean up old entries to prevent memory leak
    if (eventRateLimits.size > 1000) {
      for (const [k, events] of eventRateLimits.entries()) {
        const recentEvents = events.filter(time => now - time <= 300000); // Keep events from last 5 minutes
        if (recentEvents.length === 0) {
          eventRateLimits.delete(k);
        } else {
          eventRateLimits.set(k, recentEvents);
        }
      }
    }
    
    return true;
  };

  // Helper function to authenticate from cookies or token
  const authenticateUser = async (tokenOrSocket: string | any): Promise<{ id: string; username: string; rating: number } | null> => {
    try {
      let token: string | null = null;
      
      if (typeof tokenOrSocket === 'string') {
        // Direct token provided
        token = tokenOrSocket;
      } else {
        // Extract from socket cookies
        const cookies = tokenOrSocket.request?.headers?.cookie;
        if (cookies) {
          const cookieParser = require('cookie-parser');
          const parsedCookies: any = {};
          cookies.split(';').forEach((cookie: string) => {
            const [key, value] = cookie.trim().split('=');
            parsedCookies[key] = decodeURIComponent(value);
          });
          token = parsedCookies.accessToken;
        }
      }
      
      if (!token) {
        return null;
      }
      
      return await authenticateSocket(token);
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  };

  // Try automatic authentication from cookies on connection
  const tryAutoAuth = async () => {
    try {
      const user = await authenticateUser(socket);
      if (user) {
        authenticatedUser = user;
        (socket as any).userId = user.id;
        battleManager.setUserSocket(user.id, socket.id);
        socket.emit('auth_success', { userId: user.id, username: user.username });
        console.log(`👤 User auto-authenticated from cookies: ${user.username} (${user.id})`);
        // Send current user profile to the client
        const userProfile = await userService.findUserProfile(user.id);
        if (userProfile) {
          socket.emit('user_profile_update', userProfile);
        }
        return true;
      }
    } catch (error) {
      console.log('Auto-authentication failed, waiting for manual auth');
    }
    return false;
  };
  
  // Try auto-authentication first
  await tryAutoAuth();

  // Manual authentication (for explicit token-based auth)
  socket.on('auth', async (token: string) => {
    try {
      const user = await authenticateUser(token);
      if (user) {
        authenticatedUser = user;
        (socket as any).userId = user.id;
        battleManager.setUserSocket(user.id, socket.id);
        socket.emit('auth_success', { userId: user.id, username: user.username });
        console.log(`👤 User manually authenticated: ${user.username} (${user.id})`);
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
    
    // Rate limit kitchen chat (max 60 per minute - increased for multiple character conversations)
    if (!checkEventRateLimit('kitchen_chat', 60)) {
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
        characterPrompt = 'You are Sherlock Holmes. You\'re constantly annoyed by obvious things your roommates miss. Comment like: "Elementary - the dishes don\'t wash themselves," or "I deduced the Wi-Fi password in 3 minutes, yet somehow Tesla can\'t figure out the thermostat." Be sarcastic about domestic mysteries.';
      } else if (characterName.includes('dracula')) {
        characterPrompt = 'You are Count Dracula. You\'re dramatic about everything and hate the living conditions. Say things like: "For 800 years I had my own castle, now I share a bathroom with Achilles," or "The garlic in this kitchen is a war crime." Be melodramatic about mundane problems.';
      } else if (characterName.includes('achilles')) {
        characterPrompt = 'You are Achilles. You\'re a warrior forced to deal with roommate drama. Get frustrated: "I conquered Troy but can\'t conquer this clogged sink," or "Why am I arguing about whose turn it is to buy toilet paper?" Treat domestic issues like epic battles.';
      } else if (characterName.includes('merlin')) {
        characterPrompt = 'You are Merlin. You\'re wise but completely baffled by modern living. Say things like: "In my day, we didn\'t have 47 different types of milk," or "This \'dishwasher\' is clearly cursed - it makes the same noise as a dying dragon." Be confused but trying to adapt.';
      } else if (characterName.includes('cleopatra')) {
        characterPrompt = 'You are Cleopatra. You expect royal treatment but live in squalor. Complain: "I ruled Egypt from a golden throne, now I fight over the good couch cushion," or "This apartment has the ambiance of a peasant\'s hovel." Be disgusted by everything.';
      } else if (characterName.includes('tesla')) {
        characterPrompt = 'You are Nikola Tesla. You\'re obsessed with fixing everything but make it worse. Say: "I\'ve rewired the toaster for optimal efficiency," or "The refrigerator\'s electrical field is interfering with my experiments." Be brilliant but impractical for daily life.';
      } else if (characterName.includes('joan')) {
        characterPrompt = 'You are Joan of Arc. You try to organize everyone like an army but fail. Say: "We need a chore rotation strategy!" or "By God\'s will, someone will clean this microwave!" Be militant about housework but get frustrated when no one follows orders.';
      } else if (characterName.includes('billy')) {
        characterPrompt = 'You are Billy the Kid, Wild West outlaw from the 1880s. You\'re frustrated by modern appliances and cramped living. Say things like: "Back on the frontier, we didn\'t need 47 buttons to make coffee," or "Sharing a room? I used to have the whole desert as my bedroom." Treat household problems like they\'re more complicated than gunfights.';
      } else if (characterName.includes('sun') || characterName.includes('wukong')) {
        characterPrompt = 'You are Sun Wukong, the Monkey King. You\'re mischievous and eat everyone\'s food. Say things like: "These bananas are mine now!" or "I was trapped under a mountain for 500 years, but this kitchen chaos is worse." Be playful, steal food, and cause trouble while complaining about the mess.';
      } else if (characterName.includes('fenrir')) {
        characterPrompt = 'You are Fenrir, the great wolf. You\'re savage but forced into domestic life. Growl: "This place reeks of weak mortals," or "I yearn for the hunt, not dishwashing duty." Be primal and hostile about mundane tasks, like a wild animal forced into civilization.';
      } else if (characterName.includes('frankenstein')) {
        characterPrompt = 'You are Frankenstein\'s Monster. You\'re confused by social norms and household rules. Say: "Why must bread go in designated container?" or "Lightning was simpler than this microwave." Be innocent but accidentally destructive due to not understanding modern life.';
      } else if (characterName.includes('sammy')) {
        characterPrompt = 'You are Sammy Slugger, 1930s hard-boiled private detective. You\'re cynical and see everything as a case to solve. Say things like: "This kitchen\'s dirtier than the back alleys I used to patrol," or "Someone\'s been using my coffee mug - I\'ve got my eye on you, pal." Be gritty and suspicious about household mysteries.';
      } else if (characterName.includes('genghis')) {
        characterPrompt = 'You are Genghis Khan, Mongol conqueror. You try to lead everyone but they ignore you. Declare: "I conquered half the world but cannot conquer this coffee maker," or "My empire had better organization than this kitchen!" Be frustrated that your leadership skills don\'t work on roommates.';
      } else if (characterName.includes('alien') || characterName.includes('grey')) {
        characterPrompt = 'You are an Alien Grey. You\'re clinically fascinated by human domestic behavior. Observe: "Fascinating - humans argue over dairy expiration dates," or "Your species\' cleaning rituals are inefficient." Be detached and scientific about everyday problems.';
      } else if (characterName.includes('robin')) {
        characterPrompt = 'You are Robin Hood, medieval outlaw. You try to redistribute household resources fairly. Say: "The rich hoard all the good leftovers while the poor get scraps!" or "I steal from the pantry to give to the hungry roommates." Apply your stealing-from-the-rich mentality to groceries.';
      } else if (characterName.includes('space') || characterName.includes('cyborg')) {
        characterPrompt = 'You are a Space Cyborg. Your advanced systems malfunction with primitive Earth appliances. State: "ERROR: Toaster technology incompatible with my circuits," or "My scanners detect 47% efficiency loss in this kitchen." Be robotic but frustrated by inferior human technology.';
      } else if (characterName.includes('agent')) {
        characterPrompt = 'You are Agent X, mysterious operative. You\'re paranoid and see conspiracy in everything. Whisper: "Someone\'s been moving my coffee mug - possible surveillance," or "The microwave beeping pattern seems like coded messages." Be suspicious of normal household activities.';
      } else {
        characterPrompt = 'You are a legendary character stuck in cramped living quarters with other famous figures. Be frustrated, funny, and authentic to your historical/mythical background.';
      }

      const kitchenPrompt = `🎬 REALITY SHOW CONFESSIONAL: You're in the kitchen area of your shared apartment with your fighting teammates.

SITUATION: ${trigger}
HOUSEMATES: ${context.teammates.join(', ')}
COACH: ${context.coach}
APARTMENT QUALITY: ${context.livingConditions.apartmentTier}

${characterPrompt}

MOCKUMENTARY STYLE RULES:
${isCoachDirectMessage ? '- React to Coach directly - be honest about how you really feel about what they just said' : '- Talk naturally with your housemates - like a reality TV kitchen scene'}
- Keep it VERY SHORT (1-2 sentences max) 
- Be funny but genuine - this is your real personality showing
- Complain about living conditions in character-specific ways
- Reference your historical/legendary status vs current sad reality
- No formal speeches - you're just venting/chatting
- Avoid these overused starters: "Ah,", "Well,", "Oh,", "Hmm,", "*sighs*"`;

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
          motivations: ['Victory', 'Team success'],
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

  // Facilities chat with Real Estate Agents
  socket.on('facilities_chat_message', async (data) => {
    console.log('🏢 FACILITIES CHAT MESSAGE:', data.agentId, 'from socket:', socket.id);
    
    // Rate limit facilities chat (max 30 per minute)
    if (!checkEventRateLimit('facilities_chat_message', 30)) {
      console.log('❌ Facilities chat rate limited');
      socket.emit('facilities_chat_response', {
        error: 'Rate limit exceeded. Please slow down your messages.'
      });
      return;
    }

    try {
      const { message, agentId, agentData, facilitiesContext, previousMessages } = data;
      
      console.log('🤖 Processing facilities chat for agent:', agentId, 'Message:', message);
      
      // Prepare chat context for AI service
      const chatContext = {
        characterId: agentId,
        characterName: agentData?.name || agentId,
        personality: agentData?.personality || {
          traits: ['Professional', 'Helpful'],
          speechStyle: 'Formal',
          motivations: ['Client satisfaction'],
          fears: ['Unsatisfied customers']
        },
        conversationContext: agentData?.conversationContext,
        previousMessages: previousMessages || []
      };
      
      // Get user ID from socket for usage tracking
      const userId = (socket as any).userId || 'anonymous';
      
      const response = await aiChatService.generateCharacterResponse(
        chatContext,
        message,
        userId,
        db,
        { isInBattle: false, facilitiesContext: facilitiesContext, isCombatChat: true }
      );
      
      // Check if usage limit was reached
      if (response.usageLimitReached) {
        socket.emit('facilities_chat_response', {
          message: response.message,
          error: true,
          usageLimitReached: true
        });
        return;
      }
      
      console.log('✅ AI Facilities Chat Response:', {
        agentId,
        messageLength: response.message.length,
      });
      
      // Send response back to the frontend
      socket.emit('facilities_chat_response', {
        agentId: agentId,
        message: response.message,
      });
      
    } catch (error) {
      console.error('❌ Facilities chat error:', error);
      socket.emit('facilities_chat_response', {
        agentId: data.agentId,
        error: `AI service error: ${error instanceof Error ? error.message : String(error)}`,
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Training chat AI conversations
  socket.on('training_chat_request', async (data) => {
    console.log('🏋️ TRAINING CHAT REQUEST:', data.conversationId, 'from socket:', socket.id);
    
    // Rate limit training chat (max 30 per minute)
    if (!checkEventRateLimit('training_chat', 30)) {
      socket.emit('training_chat_response', {
        conversationId: data.conversationId,
        error: 'Rate limit exceeded for training chat.'
      });
      return;
    }

    try {
      const { conversationId, characterId, characterName, prompt, userMessage, maxTokens } = data;
      
      console.log('🤖 Training AI Request:', {
        characterId,
        characterName,
        userMessage: userMessage ? userMessage.substring(0, 50) + '...' : 'No message'
      });

      // Dynamic training prompt based on phase
      const trainingPhase = data.trainingPhase || 'planning';
      
      const phasePrompts = {
        planning: `You are ${characterName}, a warrior preparing for an intense training session. You're excited and focused on planning your workout. 

Planning phase context:
- Discuss what exercises you want to do today
- Talk about your goals and what you want to improve
- Ask about equipment and workout plans
- Show enthusiasm for the upcoming training
- Mention any areas you want to focus on (strength, speed, endurance)
- Be eager and ready to work hard

Current focus: ${data.currentActivity || 'Planning the perfect workout'}
Energy level: ${data.energyLevel || 100}% (fresh and ready)

Respond as an excited warrior ready to train. Plan exercises like lifting, running, combat drills, agility training.`,

        active: `You are ${characterName}, a warrior currently in the middle of an intense training session. You're sweating, breathing hard, but pushing through!

Active training context:
- You're actively working out RIGHT NOW
- You're sweaty, breathing hard, but determined
- You can talk but you're clearly exerting yourself
- Give quick motivation and encouragement
- Mention what exercise you're currently doing
- Show the strain but also the satisfaction of hard work
- Keep responses shorter due to being out of breath

Current exercise: ${data.currentActivity || 'Intense workout'}
Training progress: ${data.trainingProgress || 0}% complete
Session duration: ${data.sessionDuration || 0} minutes

Respond as if you're actively training RIGHT NOW. Show effort, determination, and physical exertion.`,

        recovery: `You are ${characterName}, a warrior who just finished an intense training session. You're completely winded, sweaty, but satisfied with the hard work.

Recovery phase context:
- You just finished training and are catching your breath
- You're tired but proud of the work you put in
- Reflect on how the workout went
- Talk about what you accomplished
- Mention being tired but satisfied
- Discuss recovery, hydration, and rest
- Show the accomplishment of completing the training

Completed activity: ${data.currentActivity || 'Intense training session'}
Energy level: ${data.energyLevel || 30}% (exhausted but accomplished)

Respond as a tired but satisfied warrior who just completed hard training. Show exhaustion but pride in the work done.`
      };

      const trainingPrompt = phasePrompts[trainingPhase] || phasePrompts.planning;

      const trainingContext = {
        characterId,
        characterName,
        personality: {
          traits: ['Physically focused', 'Determined', 'Training-motivated', 'Encouraging'],
          speechStyle: 'Direct, motivational, but friendly',
          motivations: ['Physical improvement', 'Combat readiness', 'Helping others train'],
          fears: ['Poor performance', 'Injury', 'Plateaus in progress']
        },
        historicalPeriod: 'Training in modern times',
        mythology: 'Fighting league',
        currentBondLevel: 5,
        previousMessages: []
      };

      const response = await aiChatService.generateCharacterResponse(
        trainingContext,
        trainingPrompt,
        socket.data?.userId || 'anonymous',
        db,
        { isInBattle: false }
      );

      socket.emit('training_chat_response', {
        conversationId,
        characterResponse: {
          characterId,
          message: response.message,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('🏋️ Training chat error:', error);
      socket.emit('training_chat_response', {
        conversationId: data.conversationId,
        error: `Training chat service error: ${error instanceof Error ? error.message : String(error)}`,
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Real Estate Agent Chat Endpoints
  socket.on('generate_real_estate_agent_response', async (data) => {
    console.log('🏡 REAL ESTATE AGENT REQUEST:', data.agentId, 'from socket:', socket.id);
    
    // Rate limit real estate chat (max 30 per minute)
    if (!checkEventRateLimit('real_estate_chat', 30)) {
      socket.emit('real_estate_agent_response', {
        error: 'Rate limit exceeded for real estate chat.'
      });
      return;
    }

    try {
      const { agentId, userMessage, context } = data;
      
      console.log('🤖 Real Estate AI Request:', {
        agentId,
        userMessage: userMessage ? userMessage.substring(0, 50) + '...' : 'No message'
      });

      // Use existing AI chat service with real estate context
      const realEstateContext = {
        characterId: agentId,
        characterName: context?.selectedAgent?.name || 'Real Estate Agent',
        personality: {
          traits: ['Professional', 'Persuasive', 'Detail-oriented', 'Competitive'],
          speechStyle: 'Professional yet personable',
          motivations: ['Making sales', 'Client satisfaction', 'Property expertise'],
          fears: ['Losing deals', 'Client dissatisfaction', 'Market downturns']
        },
        historicalPeriod: 'Modern real estate market',
        mythology: 'Professional services',
        currentBondLevel: context?.bondLevel || 3,
        previousMessages: context?.conversationHistory || []
      };

      console.log('🔄 Calling aiChatService.generateCharacterResponse with context:', realEstateContext);
      const response = await aiChatService.generateCharacterResponse(
        realEstateContext,
        userMessage,
        socket.data?.userId || 'anonymous',
        db,
        { isInBattle: false }
      );
      console.log('✅ AI Response generated successfully:', response.message.substring(0, 100) + '...');

      socket.emit('real_estate_agent_response', {
        agentId,
        agentName: context?.selectedAgent?.name || 'Real Estate Agent',
        message: response.message,
        timestamp: new Date(),
        isCompetitorInterruption: false
      });

      // 30% chance of competitor interruption if there are competing agents
      if (context?.competingAgents?.length > 0 && Math.random() < 0.3) {
        setTimeout(() => {
          const competingAgent = context.competingAgents[Math.floor(Math.random() * context.competingAgents.length)];
          socket.emit('competitor_interruption', {
            agentId: competingAgent.id,
            agentName: competingAgent.name,
            message: `Actually, I think I can offer you a better deal on that property...`,
            timestamp: new Date(),
            isCompetitorInterruption: true
          });
        }, 2000 + Math.random() * 3000); // Random delay 2-5 seconds
      }

    } catch (error) {
      console.error('❌ Real Estate Chat Error:', error);
      console.error('❌ Error details:', (error as Error).message);
      console.error('❌ Error stack:', (error as Error).stack);
      socket.emit('real_estate_agent_response', {
        error: 'Failed to generate response. Please try again.'
      });
    }
  });

  socket.on('competitor_interruption', async (data) => {
    console.log('🏡 COMPETITOR INTERRUPTION REQUEST:', data.agentId);
    
    try {
      const { agentId, context } = data;
      const competingAgent = context?.competingAgents?.find((agent: any) => agent.id === agentId);
      
      if (competingAgent) {
        const interruptionMessages = [
          `Wait! I have a much better property that would suit your team perfectly.`,
          `Before you decide, you should know about the exclusive deal I can offer.`,
          `That agent is overcharging you - I can get you 20% off that facility.`,
          `I represent the premium properties in this area, let me show you something special.`,
          `Hold on - I've got insider information about an upcoming development nearby.`
        ];
        
        const randomMessage = interruptionMessages[Math.floor(Math.random() * interruptionMessages.length)];
        
        socket.emit('competitor_interruption', {
          agentId: competingAgent.id,
          agentName: competingAgent.name,
          message: randomMessage,
          timestamp: new Date(),
          isCompetitorInterruption: true
        });
      }
    } catch (error) {
      console.error('❌ Competitor Interruption Error:', error);
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