
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  level: number;
  xp: number;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}
