import { Lobby, LobbyMember } from '../types/lobby';
import { UserProfile } from '../types/user';

const lobbies: Lobby[] = [];

export class LobbyService {
  createLobby(name: string, hostProfile: UserProfile, maxMembers: number, isPrivate: boolean): Lobby {
    const newLobby: Lobby = {
      id: `lobby_${Date.now()}`,
      name,
      hostId: hostProfile.userId,
      members: [{ profile: hostProfile, isReady: false }],
      maxMembers,
      isPrivate,
      createdAt: new Date(),
    };
    lobbies.push(newLobby);
    return newLobby;
  }

  getLobbyById(lobbyId: string): Lobby | undefined {
    return lobbies.find(l => l.id === lobbyId);
  }

  listPublicLobbies(): Lobby[] {
    return lobbies.filter(l => !l.isPrivate);
  }

  joinLobby(lobbyId: string, userProfile: UserProfile): Lobby | undefined {
    const lobby = this.getLobbyById(lobbyId);
    if (lobby && lobby.members.length < lobby.maxMembers && !lobby.members.some(m => m.profile.userId === userProfile.userId)) {
      const newMember: LobbyMember = { profile: userProfile, isReady: false };
      lobby.members.push(newMember);
      return lobby;
    }
    return undefined;
  }

  leaveLobby(lobbyId: string, userId: string): Lobby | undefined {
    const lobby = this.getLobbyById(lobbyId);
    if (lobby) {
      lobby.members = lobby.members.filter(member => member.profile.userId !== userId);
      // If host leaves, transfer host or close lobby
      if (lobby.hostId === userId) {
        if (lobby.members.length > 0) {
          lobby.hostId = lobby.members[0].profile.userId; // Transfer host to first member
        } else {
          // No members left, remove lobby
          const index = lobbies.findIndex(l => l.id === lobbyId);
          if (index > -1) { lobbies.splice(index, 1); }
          return undefined; // Lobby closed
        }
      }
      return lobby;
    }
    return undefined;
  }

  setMemberReady(lobbyId: string, userId: string, isReady: boolean): Lobby | undefined {
    const lobby = this.getLobbyById(lobbyId);
    if (lobby) {
      const member = lobby.members.find(m => m.profile.userId === userId);
      if (member) {
        member.isReady = isReady;
        return lobby;
      }
    }
    return undefined;
  }

  updateLobbySettings(lobbyId: string, hostId: string, updates: Partial<Lobby>): Lobby | undefined {
    const lobby = this.getLobbyById(lobbyId);
    if (lobby && lobby.hostId === hostId) {
      if (updates.name !== undefined) lobby.name = updates.name;
      if (updates.maxMembers !== undefined) lobby.maxMembers = updates.maxMembers;
      if (updates.isPrivate !== undefined) lobby.isPrivate = updates.isPrivate;
      return lobby;
    }
    return undefined;
  }

  removeMember(lobbyId: string, hostId: string, memberIdToRemove: string): Lobby | undefined {
    const lobby = this.getLobbyById(lobbyId);
    if (lobby && lobby.hostId === hostId && lobby.hostId !== memberIdToRemove) {
      lobby.members = lobby.members.filter(m => m.profile.userId !== memberIdToRemove);
      return lobby;
    }
    return undefined;
  }

  // Placeholder for battle start logic
  canStartBattle(lobbyId: string, hostId: string): boolean {
    const lobby = this.getLobbyById(lobbyId);
    if (!lobby || lobby.hostId !== hostId) return false;
    // All members must be ready and at least 2 members
    return lobby.members.length >= 2 && lobby.members.every(m => m.isReady);
  }
}