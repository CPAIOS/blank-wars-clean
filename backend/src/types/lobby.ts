
import { UserProfile } from './user';

export interface Lobby {
  id: string;
  name: string;
  hostId: string;
  members: LobbyMember[];
  maxMembers: number;
  isPrivate: boolean;
  createdAt: Date;
}

export interface LobbyMember {
  profile: UserProfile;
  isReady: boolean;
}
