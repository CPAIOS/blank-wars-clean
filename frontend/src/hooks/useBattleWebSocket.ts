'use client';

import { useEffect, useRef } from 'react';
import { battleWebSocket } from '@/services/battleWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import type { BattleEventHandlers } from '@/services/battleWebSocket';

export function useBattleWebSocket(handlers?: Partial<BattleEventHandlers>) {
  // Safely access auth context with error boundary
  let authData;
  try {
    authData = useAuth();
  } catch (error) {
    console.warn('useBattleWebSocket: AuthContext not available, running in standalone mode');
    authData = { tokens: null, isAuthenticated: false };
  }
  
  const { tokens, isAuthenticated } = authData;
  const isConnected = useRef(false);

  useEffect(() => {
    if (isAuthenticated && tokens?.accessToken && !isConnected.current) {
      // Set up event handlers if provided
      // Connect handler for authentication
      const connectHandler = () => {
        console.log('🔌 WebSocket connected, authenticating...');
        // Authenticate with JWT token
        battleWebSocket.authenticateWithToken(tokens.accessToken);
      };

      // Set up basic connection handler only
      battleWebSocket.setEventHandlers({
        onConnect: connectHandler
      });

      // If already connected, authenticate immediately
      if (battleWebSocket.isConnected()) {
        battleWebSocket.authenticateWithToken(tokens.accessToken);
      }

      isConnected.current = true;
    }

    return () => {
      // Cleanup on unmount or when auth changes
      if (!isAuthenticated && isConnected.current) {
        battleWebSocket.disconnect();
        isConnected.current = false;
      }
    };
  }, [isAuthenticated, tokens?.accessToken]);

  // Update handlers when they change (separate useEffect)
  useEffect(() => {
    if (isConnected.current && handlers) {
      battleWebSocket.setEventHandlers({
        ...handlers,
        onAuthenticated: (data: any) => {
          console.log('✅ WebSocket authenticated:', data);
          handlers?.onAuthenticated?.(data);
        },
        onError: (error: string) => {
          console.error('❌ WebSocket error:', error);
          handlers?.onError?.(error);
        }
      });
    }

    return () => {
      // Cleanup: Remove event handlers when component unmounts or handlers change
      if (isConnected.current) {
        battleWebSocket.clearEventHandlers();
      }
    };
  }, [handlers]);

  // Provide WebSocket interface
  return {
    isConnected: isConnected.current && battleWebSocket.isConnected(),
    isAuthenticated: battleWebSocket.isAuthenticated(),
    findMatch: battleWebSocket.findMatch.bind(battleWebSocket),
    joinBattle: battleWebSocket.joinBattle.bind(battleWebSocket),
    selectStrategy: battleWebSocket.selectStrategy.bind(battleWebSocket),
    sendChat: battleWebSocket.sendChatMessage.bind(battleWebSocket),
    socket: battleWebSocket.getSocket(), // Expose socket for custom chat functionality
    disconnect: () => {
      battleWebSocket.disconnect();
      isConnected.current = false;
    }
  };
}