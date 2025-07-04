import { io, Socket } from 'socket.io-client';

// Types matching the backend
interface BattleUser {
  id: string;
  username: string;
  rating: number;
}

interface BattleCharacter {
  id: string;
  name: string;
  title?: string;
  nickname?: string;
  level: number;
  current_health: number;
  max_health: number;
  abilities: Array<{
    name: string;
    damage_multiplier: number;
    cooldown: number;
    effect?: string;
  }>;
}

interface BattleMatchResult {
  status: 'waiting' | 'found' | 'failed';
  battle_id?: string;
  opponent?: BattleUser;
  character?: BattleCharacter;
  message?: string;
}

interface BattleState {
  id: string;
  status: 'matchmaking' | 'strategy_select' | 'round_combat' | 'chat_break' | 'completed';
  current_round: number;
  player1: BattleUser;
  player2: BattleUser;
  character1: BattleCharacter;
  character2: BattleCharacter;
  timer?: number;
}

// Event handlers type
type BattleEventHandlers = {
  onAuthenticated?: (user: BattleUser) => void;
  onMatchFound?: (result: BattleMatchResult) => void;
  onBattleStateUpdate?: (state: BattleState) => void;
  onBattleStart?: (battleData: any) => void;
  onRoundStart?: (roundData: any) => void;
  onRoundEnd?: (roundData: any) => void;
  onBattleEnd?: (result: any) => void;
  onChatMessage?: (message: any) => void;
  onError?: (error: string) => void;
  onDisconnected?: () => void;
};

class BattleWebSocketService {
  private socket: Socket | null = null;
  private handlers: BattleEventHandlers = {};
  private authenticated = false;
  private currentUser: BattleUser | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    // Only connect in browser environment
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
    
    this.socket = io(serverUrl, {
      transports: ['websocket'],
      timeout: 10000,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to battle server');
      this.reconnectAttempts = 0;
      
      // Authentication will be handled externally via authenticateWithToken()
      // No auto-authentication with mock tokens
    });

    this.socket.on('authenticate', (user: BattleUser) => {
      console.log('✅ Authenticated as:', user.username);
      this.authenticated = true;
      this.currentUser = user;
      this.handlers.onAuthenticated?.(user);
    });

    this.socket.on('match_result', (result: BattleMatchResult) => {
      console.log('⚔️ Match result:', result);
      this.handlers.onMatchFound?.(result);
    });

    this.socket.on('battle_found', (data: any) => {
      console.log('🎮 Battle found:', data);
      this.handlers.onMatchFound?.(data);
    });

    this.socket.on('battle_state_update', (state: BattleState) => {
      console.log('🔄 Battle state update:', state);
      this.handlers.onBattleStateUpdate?.(state);
    });

    this.socket.on('battle_start', (data: any) => {
      console.log('🚀 Battle starting:', data);
      this.handlers.onBattleStart?.(data);
    });

    this.socket.on('round_start', (data: any) => {
      console.log('⏰ Round starting:', data);
      this.handlers.onRoundStart?.(data);
    });

    this.socket.on('round_end', (data: any) => {
      console.log('🏁 Round ended:', data);
      this.handlers.onRoundEnd?.(data);
    });

    this.socket.on('battle_end', (result: any) => {
      console.log('🎊 Battle ended:', result);
      this.handlers.onBattleEnd?.(result);
    });

    this.socket.on('chat_response', (response: any) => {
      console.log('💬 Chat response received:', response);
      this.handlers.onChatMessage?.(response);
    });

    this.socket.on('chat_message', (message: any) => {
      console.log('💬 Chat message:', message);
      this.handlers.onChatMessage?.(message);
    });

    this.socket.on('battle_error', (error: any) => {
      console.error('❌ Battle error:', error);
      this.handlers.onError?.(error.error || error.message || 'Unknown error');
    });

    this.socket.on('match_error', (error: any) => {
      console.error('❌ Match error:', error);
      this.handlers.onError?.(error.error || error.message || 'Matchmaking failed');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 Disconnected:', reason);
      this.authenticated = false;
      this.currentUser = null;
      this.handlers.onDisconnected?.();
      
      // Auto-reconnect unless manually disconnected
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting attempt ${this.reconnectAttempts}...`);
        setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error.message);
      this.handlers.onError?.(`Connection failed: ${error.message}`);
    });
  }

  // Public methods
  public setEventHandlers(handlers: BattleEventHandlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  public clearEventHandlers() {
    this.handlers = {};
  }

  public authenticate(token: string) {
    if (!this.socket) return;
    this.socket.emit('auth', token);
  }

  // Authenticate with JWT token from auth context
  public authenticateWithToken(accessToken: string | null) {
    if (!accessToken) {
      console.warn('⚠️ No access token provided for WebSocket authentication');
      return;
    }
    
    if (!this.socket) {
      console.warn('⚠️ WebSocket not connected, cannot authenticate');
      return;
    }

    console.log('🔐 Authenticating WebSocket with JWT token');
    this.socket.emit('auth', accessToken);
  }

  public findMatch(characterId?: string, mode: 'casual' | 'ranked' = 'casual') {
    if (!this.socket || !this.authenticated) {
      this.handlers.onError?.('Not connected or authenticated');
      return;
    }

    if (characterId) {
      this.socket.emit('find_match', { characterId, mode });
    } else {
      // Use legacy find_battle for automatic character selection
      this.socket.emit('find_battle');
    }
  }

  public joinBattle(battleId: string) {
    if (!this.socket || !this.authenticated) {
      this.handlers.onError?.('Not connected or authenticated');
      return;
    }
    this.socket.emit('join_battle', { battleId });
  }

  public selectStrategy(strategy: 'aggressive' | 'defensive' | 'balanced') {
    if (!this.socket || !this.authenticated) {
      this.handlers.onError?.('Not connected or authenticated');
      return;
    }
    this.socket.emit('select_strategy', { strategy });
  }

  public sendChatMessage(data: any) {
    if (!this.socket || !this.authenticated) {
      this.handlers.onError?.('Not connected or authenticated');
      return;
    }
    // Use the correct event name and include character data
    this.socket.emit('chat_message', data);
  }

  public disconnect() {
    if (this.socket) {
      // MEMORY LEAK FIX: Remove all listeners before disconnecting
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.authenticated = false;
    this.currentUser = null;
    this.handlers = {}; // Clear handlers to prevent memory leaks
  }

  // Getters
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public isAuthenticated(): boolean {
    return this.authenticated;
  }

  public getCurrentUser(): BattleUser | null {
    return this.currentUser;
  }
}

// Singleton instance
let battleWebSocketInstance: BattleWebSocketService | null = null;

export const getBattleWebSocket = (): BattleWebSocketService => {
  if (!battleWebSocketInstance) {
    battleWebSocketInstance = new BattleWebSocketService();
  }
  return battleWebSocketInstance;
};

// Export singleton getter for lazy initialization
export const battleWebSocket = {
  get instance() {
    return getBattleWebSocket();
  },
  // Proxy methods to maintain API compatibility
  setEventHandlers: (handlers: BattleEventHandlers) => getBattleWebSocket().setEventHandlers(handlers),
  clearEventHandlers: () => getBattleWebSocket().clearEventHandlers(),
  authenticate: (token: string) => getBattleWebSocket().authenticate(token),
  authenticateWithToken: (accessToken: string | null) => getBattleWebSocket().authenticateWithToken(accessToken),
  findMatch: (characterId?: string, mode?: 'casual' | 'ranked') => getBattleWebSocket().findMatch(characterId, mode),
  joinBattle: (battleId: string) => getBattleWebSocket().joinBattle(battleId),
  selectStrategy: (strategy: 'aggressive' | 'defensive' | 'balanced') => getBattleWebSocket().selectStrategy(strategy),
  sendChatMessage: (message: string) => getBattleWebSocket().sendChatMessage(message),
  disconnect: () => getBattleWebSocket().disconnect(),
  isConnected: () => getBattleWebSocket().isConnected(),
  isAuthenticated: () => getBattleWebSocket().isAuthenticated(),
  getCurrentUser: () => getBattleWebSocket().getCurrentUser(),
};

export default BattleWebSocketService;
export type { BattleUser, BattleCharacter, BattleMatchResult, BattleState, BattleEventHandlers };