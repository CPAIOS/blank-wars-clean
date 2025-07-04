import { useState, useEffect, useCallback } from 'react';
import { battleWebSocket } from '@/services/battleWebSocket';
import { Lobby, LobbyMember } from '@/types/lobby';
import { UserProfile } from '@/types/user';

interface UseLobbyProps {
  userProfile: UserProfile | null;
}

export function useLobby({ userProfile }: UseLobbyProps) {
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [publicLobbies, setPublicLobbies] = useState<Lobby[]>([]);

  const handleLobbyUpdate = useCallback((lobby: Lobby) => {
    setCurrentLobby(lobby);
    setLobbyError(null);
  }, []);

  const handleLobbyError = useCallback((error: string) => {
    setLobbyError(error);
  }, []);

  const handleLobbyClosed = useCallback((data: { lobbyId: string }) => {
    if (currentLobby?.id === data.lobbyId) {
      setCurrentLobby(null);
      setLobbyError('Lobby closed by host.');
    }
    setPublicLobbies(prev => prev.filter(lobby => lobby.id !== data.lobbyId));
  }, [currentLobby]);

  const handlePublicLobbiesList = useCallback((lobbies: Lobby[]) => {
    setPublicLobbies(lobbies);
  }, []);

  useEffect(() => {
    battleWebSocket.setEventHandlers({
      onLobbyUpdate: handleLobbyUpdate,
      onLobbyError: handleLobbyError,
      onLobbyClosed: handleLobbyClosed,
      onPublicLobbiesList: handlePublicLobbiesList,
    });

    // Request public lobbies list on mount
    battleWebSocket.instance.emit('list_public_lobbies');

    return () => {
      battleWebSocket.clearEventHandlers();
    };
  }, [handleLobbyUpdate, handleLobbyError, handleLobbyClosed, handlePublicLobbiesList]);

  const createLobby = useCallback((name: string, maxMembers: number, isPrivate: boolean) => {
    if (!userProfile) {
      setLobbyError('User profile not available');
      return;
    }
    battleWebSocket.instance.emit('create_lobby', { name, maxMembers, isPrivate });
  }, [userProfile]);

  const joinLobby = useCallback((lobbyId: string) => {
    if (!userProfile) {
      setLobbyError('User profile not available');
      return;
    }
    battleWebSocket.instance.emit('join_lobby', { lobbyId });
  }, [userProfile]);

  const leaveLobby = useCallback(() => {
    if (currentLobby) {
      battleWebSocket.instance.emit('leave_lobby', currentLobby.id);
      setCurrentLobby(null);
    }
  }, [currentLobby]);

  const setReady = useCallback((isReady: boolean) => {
    if (currentLobby) {
      battleWebSocket.instance.emit('set_ready', { lobbyId: currentLobby.id, isReady });
    }
  }, [currentLobby]);

  const startBattle = useCallback(() => {
    if (currentLobby && userProfile && currentLobby.hostId === userProfile.userId) {
      battleWebSocket.instance.emit('start_battle', currentLobby.id);
    }
  }, [currentLobby, userProfile]);

  const updateLobbySettings = useCallback((updates: Partial<Lobby>) => {
    if (currentLobby && userProfile && currentLobby.hostId === userProfile.userId) {
      battleWebSocket.instance.emit('update_lobby_settings', { lobbyId: currentLobby.id, updates });
    }
  }, [currentLobby, userProfile]);

  const kickMember = useCallback((memberId: string) => {
    if (currentLobby && userProfile && currentLobby.hostId === userProfile.userId) {
      battleWebSocket.instance.emit('kick_member', { lobbyId: currentLobby.id, memberId });
    }
  }, [currentLobby, userProfile]);

  return {
    currentLobby,
    lobbyError,
    publicLobbies,
    createLobby,
    joinLobby,
    leaveLobby,
    setReady,
    startBattle,
    updateLobbySettings,
    kickMember,
  };
}