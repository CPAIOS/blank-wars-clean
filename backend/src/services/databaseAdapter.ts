import { db, query } from '../database/index';

/**
 * Database adapter layer to bridge battle system expectations 
 * with existing SQLite implementation
 */

// Types for battle system compatibility
interface User {
  id: string;
  username: string;
  email: string;
  rating: number;
  total_battles: number;
  total_wins: number;
  subscription_tier: string;
  level: number;
  experience: number;
  character_slot_capacity: number; // Added for dynamic character slots
}

interface UserCharacter {
  id: string;
  user_id: string;
  character_id: string;
  serial_number: string;
  nickname?: string;
  level: number;
  experience: number;
  bond_level: number;
  total_battles: number;
  total_wins: number;
  current_health: number;
  max_health: number;
  is_injured: boolean;
  recovery_time?: Date;
  equipment: any[];
  enhancements: any[];
  conversation_memory: any[];
  significant_memories: any[];
  personality_drift: Record<string, any>;
  acquired_at: Date;
  last_battle_at?: Date;
  // Character fields from JOIN
  name?: string;
  title?: string;
  archetype?: string;
  origin_era?: string;
  rarity?: string;
  base_health?: number;
  base_attack?: number;
  base_defense?: number;
  base_speed?: number;
  base_special?: number;
  personality_traits?: string[];
  conversation_style?: string;
  backstory?: string;
  emotional_range?: string[];
  conversation_topics?: string[];
  dialogue_intro?: string;
  dialogue_victory?: string;
  dialogue_defeat?: string;
  dialogue_bonding?: string;
  avatar_emoji?: string;
  artwork_url?: string;
  abilities?: any[];
}

interface Battle {
  id: string;
  player1_id: string;
  player2_id: string;
  character1_id: string;
  character2_id: string;
  status: string;
  current_round: number;
  turn_count: number;
  p1_strategy?: string;
  p2_strategy?: string;
  winner_id?: string;
  end_reason?: string;
  combat_log: any[];
  chat_logs: any[];
  xp_gained: number;
  bond_gained: number;
  currency_gained: number;
  started_at: Date;
  ended_at?: Date;
}

interface Character {
  id: string;
  name: string;
  title?: string;
  archetype: string;
  origin_era?: string;
  origin_location?: string;
  rarity: string;
  base_health: number;
  base_attack: number;
  base_defense: number;
  base_speed: number;
  base_special: number;
  personality_traits: string[];
  conversation_style?: string;
  backstory?: string;
  emotional_range?: string[];
  conversation_topics: string[];
  dialogue_intro?: string;
  dialogue_victory?: string;
  dialogue_defeat?: string;
  dialogue_bonding?: string;
  avatar_emoji?: string;
  artwork_url?: string;
  abilities: any[];
  created_at: Date;
}

/**
 * Database adapter that provides ORM-style methods expected by battle system
 */
export const dbAdapter = {
  users: {
    async findById(id: string): Promise<User | null> {
      try {
        const result = await query('SELECT *, character_slot_capacity FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error finding user by ID:', error);
        return null;
      }
    },

    async update(id: string, data: Partial<User>): Promise<boolean> {
      try {
        // SECURITY: Whitelist allowed fields to prevent SQL injection
        const allowedFields = ['username', 'email', 'rating', 'total_battles', 'total_wins', 
          'subscription_tier', 'level', 'experience', 'character_slot_capacity'];
        
        const updates = Object.entries(data)
          .filter(([key]) => allowedFields.includes(key))
          .map(([key]) => `${key} = ?`);
        
        if (updates.length === 0) return false;
        
        const values = Object.entries(data)
          .filter(([key]) => allowedFields.includes(key))
          .map(([, value]) => value);
        
        await query(
          `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [...values, id]
        );
        return true;
      } catch (error) {
        console.error('Error updating user:', error);
        return false;
      }
    },

    async findByEmail(email: string): Promise<User | null> {
      try {
        const result = await query('SELECT *, character_slot_capacity FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error finding user by email:', error);
        return null;
      }
    },

    async create(data: Partial<User> & { id: string, username: string, email: string }): Promise<User | null> {
      try {
        await query(`
          INSERT INTO users (
            id, username, email, subscription_tier, level, experience,
            total_battles, total_wins, rating, character_slot_capacity
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          data.id,
          data.username,
          data.email,
          data.subscription_tier || 'free',
          data.level || 1,
          data.experience || 0,
          data.total_battles || 0,
          data.total_wins || 0,
          data.rating || 1000,
          data.character_slot_capacity || 12
        ]);

        const result = await query('SELECT * FROM users WHERE id = $1', [data.id]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error creating user:', error);
        return null;
      }
    }
  },

  userCharacters: {
    async findById(id: string): Promise<UserCharacter | null> {
      try {
        const result = await query(`
          SELECT uc.*, c.name, c.title, c.archetype, c.origin_era, c.rarity,
                 c.base_health, c.base_attack, c.base_defense, c.base_speed, c.base_special,
                 c.personality_traits, c.conversation_style, c.backstory, c.conversation_topics,
                 c.avatar_emoji, c.artwork_url, c.abilities
          FROM user_characters uc
          JOIN characters c ON uc.character_id = c.id
          WHERE uc.id = ?
        `, [id]);
        
        if (result.rows[0]) {
          const row = result.rows[0];
          return {
            ...row,
            equipment: JSON.parse(row.equipment || '[]'),
            enhancements: JSON.parse(row.enhancements || '[]'),
            conversation_memory: JSON.parse(row.conversation_memory || '[]'),
            significant_memories: JSON.parse(row.significant_memories || '[]'),
            personality_drift: JSON.parse(row.personality_drift || '{}'),
            personality_traits: JSON.parse(row.personality_traits || '[]'),
            conversation_topics: JSON.parse(row.conversation_topics || '[]'),
                        abilities: JSON.parse(row.abilities || '[]')
          };
        }
        return null;
      } catch (error) {
        console.error('Error finding user character by ID:', error);
        return null;
      }
    },

    async update(id: string, data: Partial<UserCharacter>): Promise<boolean> {
      try {
        // SECURITY: Whitelist allowed fields to prevent SQL injection
        const allowedFields = ['nickname', 'level', 'experience', 'bond_level', 
          'total_battles', 'total_wins', 'current_health', 'max_health', 
          'is_injured', 'recovery_time', 'equipment', 'enhancements', 
          'conversation_memory', 'significant_memories', 'personality_drift', 
          'last_battle_at'];
        
        const updates: Record<string, any> = {};
        
        // Filter and process allowed fields
        Object.entries(data).forEach(([key, value]) => {
          if (allowedFields.includes(key)) {
            // Convert arrays/objects to JSON strings for storage
            if (['equipment', 'enhancements', 'conversation_memory', 
                 'significant_memories', 'personality_drift'].includes(key)) {
              updates[key] = JSON.stringify(value);
            } else {
              updates[key] = value;
            }
          }
        });
        
        if (Object.keys(updates).length === 0) return false;
        
        const fields = Object.keys(updates).map(key => `${key} = ?`);
        const values = Object.values(updates);
        
        await query(
          `UPDATE user_characters SET ${fields.join(', ')} WHERE id = $1`,
          [...values, id]
        );
        return true;
      } catch (error) {
        console.error('Error updating user character:', error);
        return false;
      }
    },

    async findByUserId(userId: string): Promise<UserCharacter[]> {
      try {
        const result = await query(`
          SELECT uc.*, c.name, c.title, c.archetype, c.origin_era, c.rarity,
                 c.base_health, c.base_attack, c.base_defense, c.base_speed, c.base_special,
                 c.personality_traits, c.conversation_style, c.backstory, c.conversation_topics,
                 c.avatar_emoji, c.artwork_url, c.abilities
          FROM user_characters uc
          JOIN characters c ON uc.character_id = c.id
          WHERE uc.user_id = ?
          ORDER BY uc.acquired_at DESC
        `, [userId]);
        
        return result.rows.map((row: any) => ({
          ...row,
          equipment: JSON.parse(row.equipment || '[]'),
          enhancements: JSON.parse(row.enhancements || '[]'),
          conversation_memory: JSON.parse(row.conversation_memory || '[]'),
          significant_memories: JSON.parse(row.significant_memories || '{}'),
          personality_drift: JSON.parse(row.personality_drift || '{}'),
          personality_traits: JSON.parse(row.personality_traits || '[]'),
          conversation_topics: JSON.parse(row.conversation_topics || '[]'),
          abilities: JSON.parse(row.abilities || '[]')
        }));
      } catch (error) {
        console.error('Error finding user characters:', error);
        return [];
      }
    },

    async create(data: Partial<UserCharacter> & { character_id: string, user_id: string }): Promise<UserCharacter | null> {
      try {
        const id = `userchar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const serialNumber = `${data.character_id.slice(-3)}-${Date.now().toString().slice(-6)}`;
        
        // Get the base character data for health values
        const charResult = await query('SELECT * FROM characters WHERE id = $1', [data.character_id]);
        if (!charResult.rows[0]) {
          throw new Error('Character not found');
        }
        const character = charResult.rows[0];
        
        await query(`
          INSERT INTO user_characters (
            id, user_id, character_id, serial_number, nickname,
            level, experience, bond_level, total_battles, total_wins,
            current_health, max_health, is_injured, equipment, enhancements,
            conversation_memory, significant_memories, personality_drift
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          data.user_id,
          data.character_id,
          serialNumber,
          data.nickname || null,
          data.level || 1,
          data.experience || 0,
          data.bond_level || 0,
          data.total_battles || 0,
          data.total_wins || 0,
          character.base_health,
          character.base_health,
          0, // is_injured (0 = false)
          JSON.stringify(data.equipment || []),
          JSON.stringify(data.enhancements || []),
          JSON.stringify(data.conversation_memory || []),
          JSON.stringify(data.significant_memories || []),
          JSON.stringify(data.personality_drift || {})
        ]);

        return await this.findById(id);
      } catch (error) {
        console.error('Error creating user character:', error);
        return null;
      }
    },

    async findByUserIdAndCharacterId(userId: string, characterId: string): Promise<UserCharacter | null> {
      try {
        const result = await query(`
          SELECT uc.*, c.name, c.title, c.archetype, c.origin_era, c.rarity,
                 c.base_health, c.base_attack, c.base_defense, c.base_speed, c.base_special,
                 c.personality_traits, c.conversation_style, c.backstory, c.conversation_topics,
                 c.avatar_emoji, c.artwork_url, c.abilities
          FROM user_characters uc 
          JOIN characters c ON uc.character_id = c.id
          WHERE uc.user_id = ? AND uc.character_id = ?
        `, [userId, characterId]);
        
        if (result.rows[0]) {
          const row = result.rows[0];
          return {
            ...row,
            equipment: JSON.parse(row.equipment || '[]'),
            enhancements: JSON.parse(row.enhancements || '[]'),
            conversation_memory: JSON.parse(row.conversation_memory || '[]'),
            significant_memories: JSON.parse(row.significant_memories || '[]'),
            personality_drift: JSON.parse(row.personality_drift || '{}'),
            personality_traits: JSON.parse(row.personality_traits || '[]'),
            conversation_topics: JSON.parse(row.conversation_topics || '[]'),
                        abilities: JSON.parse(row.abilities || '[]')
          };
        }
        return null;
      } catch (error) {
        console.error('Error finding user character by user and character ID:', error);
        return null;
      }
    }
  },

  battles: {
    async create(data: Partial<Battle>): Promise<Battle | null> {
      try {
        const id = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await query(`
          INSERT INTO battles (
            id, player1_id, player2_id, character1_id, character2_id,
            status, current_round, turn_count, combat_log, chat_logs,
            xp_gained, bond_gained, currency_gained, started_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          id,
          data.player1_id,
          data.player2_id,
          data.character1_id,
          data.character2_id,
          data.status || 'active',
          data.current_round || 1,
          data.turn_count || 0,
          JSON.stringify(data.combat_log || []),
          JSON.stringify(data.chat_logs || []),
          data.xp_gained || 0,
          data.bond_gained || 0,
          data.currency_gained || 0
        ]);

        return await this.findById(id);
      } catch (error) {
        console.error('Error creating battle:', error);
        return null;
      }
    },

    async findById(id: string): Promise<Battle | null> {
      try {
        const result = await query('SELECT * FROM battles WHERE id = $1', [id]);
        if (result.rows[0]) {
          const row = result.rows[0];
          return {
            ...row,
            combat_log: JSON.parse(row.combat_log || '[]'),
            chat_logs: JSON.parse(row.chat_logs || '[]')
          };
        }
        return null;
      } catch (error) {
        console.error('Error finding battle by ID:', error);
        return null;
      }
    },

    async update(id: string, data: Partial<Battle>): Promise<boolean> {
      try {
        // SECURITY: Whitelist allowed fields to prevent SQL injection
        const allowedFields = ['status', 'current_round', 'turn_count', 
          'p1_strategy', 'p2_strategy', 'winner_id', 'end_reason', 
          'combat_log', 'chat_logs', 'xp_gained', 'bond_gained', 
          'currency_gained', 'ended_at'];
        
        const updates: Record<string, any> = {};
        
        // Filter and process allowed fields
        Object.entries(data).forEach(([key, value]) => {
          if (allowedFields.includes(key)) {
            // Convert arrays to JSON strings for storage
            if (['combat_log', 'chat_logs'].includes(key)) {
              updates[key] = JSON.stringify(value);
            } else {
              updates[key] = value;
            }
          }
        });
        
        if (Object.keys(updates).length === 0) return false;
        
        const fields = Object.keys(updates).map(key => `${key} = ?`);
        const values = Object.values(updates);
        
        await query(
          `UPDATE battles SET ${fields.join(', ')} WHERE id = $1`,
          [...values, id]
        );
        return true;
      } catch (error) {
        console.error('Error updating battle:', error);
        return false;
      }
    },

    async findActiveByUserId(userId: string): Promise<Battle[]> {
      try {
        const result = await query(`
          SELECT * FROM battles 
          WHERE (player1_id = ? OR player2_id = ?) 
            AND status IN ('matchmaking', 'active', 'paused')
          ORDER BY started_at DESC
        `, [userId, userId]);
        
        return result.rows.map((row: any) => ({
          ...row,
          combat_log: JSON.parse(row.combat_log || '[]'),
          chat_logs: JSON.parse(row.chat_logs || '[]')
        }));
      } catch (error) {
        console.error('Error finding active battles:', error);
        return [];
      }
    }
  },

  characters: {
    async findById(id: string): Promise<Character | null> {
      try {
        const result = await query('SELECT * FROM characters WHERE id = $1', [id]);
        if (result.rows[0]) {
          const row = result.rows[0];
          return {
            ...row,
            personality_traits: JSON.parse(row.personality_traits || '[]'),
            conversation_topics: JSON.parse(row.conversation_topics || '[]'),
            emotional_range: JSON.parse(row.emotional_range || '[]'),
            abilities: JSON.parse(row.abilities || '[]')
          };
        }
        return null;
      } catch (error) {
        console.error('Error finding character by ID:', error);
        return null;
      }
    },

    async findAll(): Promise<Character[]> {
      try {
        const result = await query('SELECT * FROM characters ORDER BY rarity DESC, name ASC');
        return result.rows.map((row: any) => ({
          ...row,
          personality_traits: JSON.parse(row.personality_traits || '[]'),
          conversation_topics: JSON.parse(row.conversation_topics || '[]'),
          emotional_range: JSON.parse(row.emotional_range || '[]'),
          abilities: JSON.parse(row.abilities || '[]')
        }));
      } catch (error) {
        console.error('Error finding all characters:', error);
        return [];
      }
    }
  },

  // Currency operations
  currency: {
    async findByUserId(userId: string): Promise<{ battle_tokens: number; premium_currency: number } | null> {
      try {
        const result = await query('SELECT * FROM user_currency WHERE user_id = ?', [userId]);
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error finding user currency:', error);
        return null;
      }
    },

    async update(userId: string, data: { battle_tokens?: number; premium_currency?: number }): Promise<boolean> {
      try {
        // Insert or update currency record
        const existing = await this.findByUserId(userId);
        
        if (existing) {
          // SECURITY: Whitelist allowed fields to prevent SQL injection
          const allowedFields = ['battle_tokens', 'premium_currency'];
          const updates = Object.entries(data)
            .filter(([key]) => allowedFields.includes(key))
            .map(([key]) => `${key} = ?`);
          
          if (updates.length === 0) return false;
          
          const values = Object.entries(data)
            .filter(([key]) => allowedFields.includes(key))
            .map(([, value]) => value);
          
          await query(
            `UPDATE user_currency SET ${updates.join(', ')} WHERE user_id = ?`,
            [...values, userId]
          );
        } else {
          await query(
            `INSERT INTO user_currency (user_id, battle_tokens, premium_currency) VALUES (?, ?, ?)`,
            [userId, data.battle_tokens || 100, data.premium_currency || 0]
          );
        }
        return true;
      } catch (error) {
        console.error('Error updating user currency:', error);
        return false;
      }
    }
  },

  // Raw query access for custom operations
  query
};

export default dbAdapter;