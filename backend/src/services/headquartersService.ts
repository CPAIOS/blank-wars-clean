import { query } from '../database';
import { User } from '../types';

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
}
