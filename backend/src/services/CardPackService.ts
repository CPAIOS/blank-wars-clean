// backend/src/services/CardPackService.ts

import { query } from '../database/index';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface CardPack {
  id: string;
  pack_type: string;
  pack_series: string;
  pack_name: string;
  cards_count: number;
  guaranteed_rarity: string;
  rarity_weights: { [key: string]: number };
  price_usd: number;
  price_gems: number;
}

interface Character {
  id: string;
  name: string;
  rarity: string;
  base_health: number; // Added base_health for user_characters insertion
  // Add other character properties as needed for the pack opening display
}

interface MintedCard {
  serialNumber: string;
  characterId: string;
  characterName: string;
  characterRarity: string;
}

export class CardPackService {
  private readonly QR_SECRET: string;

  constructor() {
    if (!process.env.QR_SECRET) {
      throw new Error('QR_SECRET environment variable is not set.');
    }
    this.QR_SECRET = process.env.QR_SECRET;
  }

  private signData(data: object): string {
    const payload = JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.QR_SECRET)
      .update(payload)
      .digest('hex');
  }

  private async getRandomCharacterByRarity(rarity: string): Promise<Character | undefined> {
    // In a real scenario, this would involve more sophisticated logic
    // to pick a character based on rarity weights and available characters.
    // For now, a simple random selection from characters of that rarity.
    try {
      const result = await query(
        'SELECT id, name, rarity, base_health FROM characters WHERE rarity = $1 ORDER BY RANDOM() LIMIT 1',
        [rarity]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting random character for rarity ${rarity}:`, error);
      return undefined;
    }
  }

  public async getPackDetails(packType: string): Promise<CardPack | undefined> {
    try {
      const result = await query('SELECT * FROM card_packs WHERE pack_type = $1', [packType]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching pack details for ${packType}:`, error);
      return undefined;
    }
  }

  public async mintDigitalCards(userId: string, packType: string): Promise<MintedCard[]> {
    const packDetails = await this.getPackDetails(packType);
    if (!packDetails) {
      throw new Error(`Pack type ${packType} not found.`);
    }

    const mintedCards: MintedCard[] = [];
    const charactersToMint: { rarity: string; character?: Character }[] = [];

    // Determine characters based on rarity weights and guaranteed rarity
    // This is a simplified version; a real implementation would use the rarity_weights
    // to randomly select characters based on their rarity.
    for (let i = 0; i < packDetails.cards_count; i++) {
      if (i === 0 && packDetails.guaranteed_rarity) {
        charactersToMint.push({ rarity: packDetails.guaranteed_rarity });
      } else {
        // Simple random rarity for now, will need to implement proper rarity_weights logic
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
        const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
        charactersToMint.push({ rarity: randomRarity });
      }
    }

    for (const charToMint of charactersToMint) {
      const character = await this.getRandomCharacterByRarity(charToMint.rarity);
      if (character) {
        const serialNumber = uuidv4().replace(/-/g, '').substring(0, 20); // Generate a unique serial
        const qrData = { s: serialNumber, c: character.id, p: packDetails.id, t: Date.now() }; // Use packDetails.id
        const signature = this.signData(qrData);

        await query(
          `INSERT INTO qr_codes (id, serial_number, character_id, pack_id, signature, is_redeemed, valid_from, valid_until)
           VALUES ($1, $2, $3, $4, $5, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 years')`,
          [uuidv4(), serialNumber, character.id, packDetails.id, signature]
        );

        mintedCards.push({
          serialNumber,
          characterId: character.id,
          characterName: character.name,
          characterRarity: character.rarity,
        });
      } else {
        console.warn(`Could not find character for rarity ${charToMint.rarity}. Skipping.`);
      }
    }

    return mintedCards;
  }

  public async getMintedCardsForUser(userId: string): Promise<MintedCard[]> {
    try {
      const result = await query(
        `SELECT
           qc.serial_number,
           c.id AS character_id,
           c.name AS character_name,
           c.rarity AS character_rarity,
           c.base_health
         FROM qr_codes qc
         JOIN characters c ON qc.character_id = c.id
         WHERE qc.redeemed_by = $1 AND qc.is_redeemed = FALSE
         ORDER BY qc.acquired_at DESC`,
        [userId]
      );
      return result.rows.map((row: any) => ({
        serialNumber: row.serial_number,
        characterId: row.character_id,
        characterName: row.character_name,
        characterRarity: row.character_rarity,
        baseHealth: row.base_health, // Include base_health for frontend display if needed
      }));
    } catch (error) {
      console.error(`Error getting minted cards for user ${userId}:`, error);
      throw error;
    }
  }

  public async redeemDigitalCard(userId: string, serialNumber: string): Promise<Character | undefined> {
    try {
      // 1. Find the QR code and check if it's valid and not redeemed
      const qrCodeResult = await query(
        'SELECT * FROM qr_codes WHERE serial_number = $1 AND is_redeemed = FALSE AND valid_until > CURRENT_TIMESTAMP',
        [serialNumber]
      );
      const qrCode = qrCodeResult.rows[0];

      if (!qrCode) {
        throw new Error('Invalid or already redeemed serial number, or expired.');
      }

      // 2. Verify signature (optional, but good for security if we implement it fully)
      // const expectedSignature = this.signData({ s: qrCode.serial_number, c: qrCode.character_id, p: qrCode.pack_id, t: qrCode.created_at.getTime() });
      // if (expectedSignature !== qrCode.signature) {
      //   throw new Error('Invalid QR code signature.');
      // }

      // 3. Mark QR code as redeemed
      await query(
        'UPDATE qr_codes SET is_redeemed = TRUE, redeemed_by = $1, redeemed_at = CURRENT_TIMESTAMP WHERE id = $2',
        [userId, qrCode.id]
      );

      // 4. Add character to user's collection
      const characterResult = await query(
        'SELECT id, name, rarity, base_health FROM characters WHERE id = $1',
        [qrCode.character_id]
      );
      const character = characterResult.rows[0];

      if (!character) {
        throw new Error('Character not found for this serial number.');
      }

      // Check if user already has this specific serial number
      const existingUserChar = await query(
        'SELECT id FROM user_characters WHERE user_id = $1 AND serial_number = $2',
        [userId, serialNumber]
      );

      if (existingUserChar.rows.length === 0) {
        await query(
          `INSERT INTO user_characters (user_id, character_id, serial_number, acquired_at, current_health, max_health)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $4)`,
          [userId, character.id, serialNumber, character.base_health] // Assuming base_health from characters table
        );
      } else {
        console.warn(`User ${userId} already has character ${character.id} with serial ${serialNumber}. Skipping insertion.`);
      }

      return character;
    } catch (error) {
      console.error('Error redeeming digital card:', error);
      throw error;
    }
  }
}

export const cardPackService = new CardPackService();