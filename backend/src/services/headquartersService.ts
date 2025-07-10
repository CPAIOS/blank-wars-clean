import { query } from '../database';
import { User } from '../types';

export interface HeadquartersState {
  id: string;
  userId: string;
  tierId: string;
  coins: number;
  gems: number;
  unlockedThemes: string[];
  rooms: Room[];
}

export interface Room {
  id: string;
  roomId: string;
  name: string;
  theme: string | null;
  elements: string[];
  assignedCharacters: string[];
  maxCharacters: number;
  beds: Bed[];
  customImageUrl?: string;
}

export interface Bed {
  id: string;
  bedId: string;
  bedType: string;
  positionX: number;
  positionY: number;
  capacity: number;
  comfortBonus: number;
}

export class HeadquartersService {
  async upgradeCharacterSlotCapacity(userId: string, cost: number): Promise<User> {
    // In a real application, you would deduct currency here
    // For now, we'll just update the capacity

    const userResult = await query(
      'SELECT character_slot_capacity FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found.');
    }

    const currentCapacity = userResult.rows[0].character_slot_capacity;
    const newCapacity = currentCapacity + 5; // Example: Increase by 5 slots per upgrade

    await query(
      'UPDATE users SET character_slot_capacity = ? WHERE id = ?',
      [newCapacity, userId]
    );

    const updatedUserResult = await query(
      'SELECT id, username, email, subscription_tier, level, experience, total_battles, total_wins, rating, created_at, updated_at, character_slot_capacity FROM users WHERE id = ?',
      [userId]
    );

    return updatedUserResult.rows[0];
  }

  async getHeadquarters(userId: string): Promise<HeadquartersState | null> {
    const hqResult = await query(
      'SELECT * FROM user_headquarters WHERE user_id = ?',
      [userId]
    );

    if (hqResult.rows.length === 0) {
      return null;
    }

    const hq = hqResult.rows[0];
    
    // Get rooms
    const roomsResult = await query(
      'SELECT * FROM headquarters_rooms WHERE headquarters_id = ? ORDER BY room_id',
      [hq.id]
    );

    const rooms: Room[] = [];
    for (const roomRow of roomsResult.rows) {
      // Get beds for this room
      const bedsResult = await query(
        'SELECT * FROM room_beds WHERE room_id = ? ORDER BY bed_id',
        [roomRow.id]
      );

      const beds: Bed[] = bedsResult.rows.map((bed: any) => ({
        id: bed.id,
        bedId: bed.bed_id,
        bedType: bed.bed_type,
        positionX: bed.position_x,
        positionY: bed.position_y,
        capacity: bed.capacity,
        comfortBonus: bed.comfort_bonus
      }));

      rooms.push({
        id: roomRow.id,
        roomId: roomRow.room_id,
        name: roomRow.name,
        theme: roomRow.theme,
        elements: roomRow.elements ? JSON.parse(roomRow.elements) : [],
        assignedCharacters: roomRow.assigned_characters ? JSON.parse(roomRow.assigned_characters) : [],
        maxCharacters: roomRow.max_characters,
        beds,
        customImageUrl: roomRow.custom_image_url
      });
    }

    return {
      id: hq.id,
      userId: hq.user_id,
      tierId: hq.tier_id,
      coins: hq.coins,
      gems: hq.gems,
      unlockedThemes: hq.unlocked_themes ? JSON.parse(hq.unlocked_themes) : [],
      rooms
    };
  }

  async saveHeadquarters(userId: string, headquarters: any): Promise<void> {
    // Start transaction
    await query('BEGIN TRANSACTION');

    try {
      // Create or update headquarters
      const hqId = `hq_${userId}`;
      await query(
        `INSERT OR REPLACE INTO user_headquarters 
         (id, user_id, tier_id, coins, gems, unlocked_themes, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          hqId,
          userId,
          headquarters.tierId || 'spartan_apartment',
          headquarters.currency?.coins || 50000,
          headquarters.currency?.gems || 100,
          JSON.stringify(headquarters.unlockedThemes || [])
        ]
      );

      // Clear existing rooms and beds
      await query('DELETE FROM room_beds WHERE room_id IN (SELECT id FROM headquarters_rooms WHERE headquarters_id = ?)', [hqId]);
      await query('DELETE FROM headquarters_rooms WHERE headquarters_id = ?', [hqId]);

      // Insert rooms
      for (const room of headquarters.rooms || []) {
        const roomDbId = `${hqId}_${room.id}`;
        await query(
          `INSERT INTO headquarters_rooms 
           (id, headquarters_id, room_id, name, theme, elements, assigned_characters, max_characters, custom_image_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            roomDbId,
            hqId,
            room.id,
            room.name,
            room.theme,
            JSON.stringify(room.elements || []),
            JSON.stringify(room.assignedCharacters || []),
            room.maxCharacters || 2,
            room.customImageUrl
          ]
        );

        // Insert beds
        for (const bed of room.beds || []) {
          await query(
            `INSERT INTO room_beds 
             (id, room_id, bed_id, bed_type, position_x, position_y, capacity, comfort_bonus) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `${roomDbId}_${bed.id}`,
              roomDbId,
              bed.id,
              bed.type,
              bed.position?.x || 0,
              bed.position?.y || 0,
              bed.capacity,
              bed.comfortBonus
            ]
          );
        }
      }

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  async purchaseBed(userId: string, roomId: string, bedData: any): Promise<void> {
    const hq = await this.getHeadquarters(userId);
    if (!hq) {
      throw new Error('Headquarters not found');
    }

    // Check if user has enough currency
    if (hq.coins < bedData.cost.coins || hq.gems < bedData.cost.gems) {
      throw new Error('Insufficient currency');
    }

    // Deduct currency
    await query(
      'UPDATE user_headquarters SET coins = coins - ?, gems = gems - ? WHERE user_id = ?',
      [bedData.cost.coins, bedData.cost.gems, userId]
    );

    // Add bed to room
    const roomResult = await query(
      'SELECT id FROM headquarters_rooms WHERE headquarters_id = ? AND room_id = ?',
      [`hq_${userId}`, roomId]
    );

    if (roomResult.rows.length === 0) {
      throw new Error('Room not found');
    }

    const roomDbId = roomResult.rows[0].id;
    const bedDbId = `${roomDbId}_${bedData.id}`;

    await query(
      `INSERT INTO room_beds 
       (id, room_id, bed_id, bed_type, position_x, position_y, capacity, comfort_bonus) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bedDbId,
        roomDbId,
        bedData.id,
        bedData.type,
        bedData.position?.x || 0,
        bedData.position?.y || 0,
        bedData.capacity,
        bedData.comfortBonus
      ]
    );
  }
}
