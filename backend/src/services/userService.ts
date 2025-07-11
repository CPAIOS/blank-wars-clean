import { User, UserProfile, Friendship } from '../types/user';
import { dbAdapter } from './databaseAdapter';
import { query } from '../database/index';

export class UserService {
  async findUserById(id: string): Promise<User | undefined> {
    try {
      const dbUser = await dbAdapter.users.findById(id);
      if (!dbUser) return undefined;
      
      // Convert database user to UserService User type
      return {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        passwordHash: '', // Don't expose password hash
        createdAt: new Date(), // Use current date as fallback
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return undefined;
    }
  }

  async findUserProfile(userId: string): Promise<UserProfile | undefined> {
    try {
      const dbUser = await dbAdapter.users.findById(userId);
      if (!dbUser) return undefined;
      
      // Convert database user to UserProfile type
      return {
        userId: dbUser.id,
        displayName: dbUser.username, // Use username as display name
        avatarUrl: undefined, // Not in database schema yet
        bio: undefined, // Not in database schema yet
        level: dbUser.level || 1,
        xp: dbUser.experience || 0,
        character_slot_capacity: dbUser.character_slot_capacity || 12
      };
    } catch (error) {
      console.error('Error finding user profile:', error);
      return undefined;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    try {
      // Map UserProfile updates to database fields
      const dbUpdates: any = {};
      if (updates.displayName) dbUpdates.username = updates.displayName;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.xp !== undefined) dbUpdates.experience = updates.xp;
      
      const success = await dbAdapter.users.update(userId, dbUpdates);
      if (!success) return undefined;
      
      // Return updated profile
      return await this.findUserProfile(userId);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return undefined;
    }
  }

  async addFriend(userId1: string, userId2: string): Promise<Friendship | undefined> {
    try {
      // Prevent self-friending
      if (userId1 === userId2) return undefined;
      
      // Check for existing friendship
      const existing = await query(
        'SELECT * FROM user_friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
        [userId1, userId2, userId2, userId1]
      );
      
      if (existing.rows.length > 0) return undefined;
      
      // Create friendship
      const friendshipId = `f${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await query(
        'INSERT INTO user_friendships (id, user_id, friend_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [friendshipId, userId1, userId2, 'pending']
      );
      
      return {
        id: friendshipId,
        userId1,
        userId2,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding friend:', error);
      return undefined;
    }
  }

  async acceptFriendRequest(friendshipId: string): Promise<Friendship | undefined> {
    try {
      await query(
        'UPDATE user_friendships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
        ['accepted', friendshipId, 'pending']
      );
      
      const result = await query('SELECT * FROM user_friendships WHERE id = ?', [friendshipId]);
      const row = result.rows[0];
      if (!row) return undefined;
      
      return {
        id: row.id,
        userId1: row.user_id,
        userId2: row.friend_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return undefined;
    }
  }

  async rejectFriendRequest(friendshipId: string): Promise<Friendship | undefined> {
    try {
      await query(
        'UPDATE user_friendships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?',
        ['blocked', friendshipId, 'pending']
      );
      
      const result = await query('SELECT * FROM user_friendships WHERE id = ?', [friendshipId]);
      const row = result.rows[0];
      if (!row) return undefined;
      
      return {
        id: row.id,
        userId1: row.user_id,
        userId2: row.friend_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return undefined;
    }
  }

  async getFriends(userId: string): Promise<UserProfile[]> {
    try {
      const result = await query(`
        SELECT u.* FROM users u
        JOIN user_friendships f ON (f.friend_id = u.id OR f.user_id = u.id)
        WHERE (f.user_id = ? OR f.friend_id = ?) 
          AND f.status = 'accepted'
          AND u.id != ?
      `, [userId, userId, userId]);
      
      return result.rows.map((row: any) => ({
        userId: row.id,
        displayName: row.username,
        avatarUrl: undefined,
        bio: undefined,
        level: row.level || 1,
        xp: row.experience || 0
      }));
    } catch (error) {
      console.error('Error getting friends:', error);
      return [];
    }
  }

  async getPendingFriendRequests(userId: string): Promise<Friendship[]> {
    try {
      const result = await query(
        'SELECT * FROM user_friendships WHERE friend_id = ? AND status = ?',
        [userId, 'pending']
      );
      
      return result.rows.map((row: any) => ({
        id: row.id,
        userId1: row.user_id,
        userId2: row.friend_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('Error getting pending friend requests:', error);
      return [];
    }
  }

  async searchUsers(searchQuery: string): Promise<UserProfile[]> {
    try {
      const lowerCaseQuery = `%${searchQuery.toLowerCase()}%`;
      const result = await query(
        'SELECT * FROM users WHERE LOWER(username) LIKE ? OR LOWER(email) LIKE ? LIMIT 20',
        [lowerCaseQuery, lowerCaseQuery]
      );
      
      return result.rows.map((row: any) => ({
        userId: row.id,
        displayName: row.username,
        avatarUrl: undefined,
        bio: undefined,
        level: row.level || 1,
        xp: row.experience || 0
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  async getUserCharacters(userId: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT uc.id AS user_character_id, uc.serial_number, uc.nickname,
                c.id AS character_id, c.name, c.title, c.rarity, c.avatar_emoji,
                c.base_health, c.base_attack, c.base_defense, c.base_speed, c.base_special
         FROM user_characters uc
         JOIN characters c ON uc.character_id = c.id
         WHERE uc.user_id = $1`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting user characters:', error);
      return [];
    }
  }


  async getTeamStats(userId: string) {
    try {
      // Get user level and basic info
      const userResult = await query('SELECT level FROM users WHERE id = ?', [userId]);
      const user = userResult.rows[0];
      if (!user) {
        throw new Error('User not found');
      }

      // Get currency (battle_tokens for budget)
      const currencyResult = await query('SELECT battle_tokens FROM user_currency WHERE user_id = ?', [userId]);
      const currency = currencyResult.rows[0] || { battle_tokens: 0 };

      // Get total characters count
      const charactersResult = await query(
        'SELECT COUNT(*) AS totalCharacters FROM user_characters WHERE user_id = ?',
        [userId]
      );
      const totalCharacters = charactersResult.rows[0]?.totalCharacters || 0;

      // For now, return basic facilities - we can enhance this later
      const currentFacilities = ['Basic Headquarters'];

      return {
        level: user.level || 1,
        totalCharacters: totalCharacters,
        currentFacilities: currentFacilities,
        budget: currency.battle_tokens || 0,
      };
    } catch (error) {
      console.error('Error getting team stats:', error);
      throw new Error('Failed to retrieve team stats.');
    }
  }
}