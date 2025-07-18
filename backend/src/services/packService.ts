import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';

type CharacterRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
import { dbAdapter } from './databaseAdapter';
import { CharacterEchoService } from './characterEchoService';

interface PackContent {
  character_id: string;
  is_granted: boolean;
}

interface PackGenerationRules {
  guaranteed_rarity?: CharacterRarity;
  rarity_weights: { [key in CharacterRarity]?: number };
  count: number;
}

export class PackService {
  private packRules: { [key: string]: PackGenerationRules } = {
    standard_starter: {
      count: 3,
      rarity_weights: {
        common: 0.7,
        uncommon: 0.25,
        rare: 0.05,
      },
    },
    premium_starter: {
      count: 5,
      guaranteed_rarity: 'rare',
      rarity_weights: {
        common: 0.4,
        uncommon: 0.3,
        rare: 0.2,
        epic: 0.08,
        legendary: 0.02,
      },
    },
    // Add more pack types as needed
  };

  private characterEchoService: CharacterEchoService;

  constructor() {
    this.characterEchoService = new CharacterEchoService();
  }

  // Load characters from database by rarity
  private async getCharactersByRarity(rarity: CharacterRarity): Promise<any[]> {
    const result = await query(
      'SELECT id, name, rarity FROM characters WHERE rarity = $1',
      [rarity]
    );
    return result.rows;
  }

  // Load all characters from database
  private async getAllCharacters(): Promise<any[]> {
    const result = await query('SELECT id, name, rarity FROM characters');
    return result.rows;
  }

  // Generates a new pack based on predefined rules
  async generatePack(packType: string): Promise<string> {
    const rules = this.packRules[packType];
    if (!rules) {
      throw new Error(`Pack type ${packType} not found.`);
    }

    const packId = uuidv4();
    const charactersToGrant: string[] = [];

    // Handle guaranteed rarity first
    if (rules.guaranteed_rarity) {
      const guaranteedChar = await this.getRandomCharacterByRarity(rules.guaranteed_rarity);
      if (guaranteedChar) {
        charactersToGrant.push(guaranteedChar);
      }
    }

    // Fill the rest based on rarity weights, avoiding duplicates
    let attempts = 0;
    const maxAttempts = rules.count * 10; // Prevent infinite loops
    
    while (charactersToGrant.length < rules.count && attempts < maxAttempts) {
      const randomChar = await this.getRandomCharacterByWeights(rules.rarity_weights);
      if (randomChar && !charactersToGrant.includes(randomChar)) {
        charactersToGrant.push(randomChar);
      }
      attempts++;
    }

    // Fallback: if we still don't have enough characters, pick random ones from all available
    if (charactersToGrant.length < rules.count) {
      console.warn(`⚠️ Pack generation fallback activated for ${packType}. Using random character selection.`);
      const allCharacters = await this.getAllCharacters();
      const availableCharacters = allCharacters.filter(char => !charactersToGrant.includes(char.id));
      
      while (charactersToGrant.length < rules.count && availableCharacters.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCharacters.length);
        const selectedChar = availableCharacters.splice(randomIndex, 1)[0];
        charactersToGrant.push(selectedChar.id);
      }
    }

    // Create pack record
    await query(
      `INSERT INTO claimable_packs (id, pack_type) VALUES ($1, $2)`,
      [packId, packType]
    );

    // Insert pack contents
    for (const charId of charactersToGrant) {
      await query(
        `INSERT INTO claimable_pack_contents (pack_id, character_id) VALUES ($1, $2)`,
        [packId, charId]
      );
    }

    return packId; // Return the claim token
  }

  // Creates a gift pack with specific characters
  async createGiftPack(characterIds: string[]): Promise<string> {
    const packId = uuidv4();
    await query(
      `INSERT INTO claimable_packs (id, pack_type) VALUES ($1, $2)`,
      [packId, 'gift_pack']
    );

    for (const charId of characterIds) {
      await query(
        `INSERT INTO claimable_pack_contents (pack_id, character_id) VALUES ($1, $2)`,
        [packId, charId]
      );
    }
    return packId;
  }

  // Claims a pack for a user, handling duplicates as echoes
  async claimPack(userId: string, claimToken: string): Promise<{ grantedCharacters: string[]; echoesGained: { character_id: string; count: number }[] }> {
    const packResult = await query(
      'SELECT id, pack_type FROM claimable_packs WHERE id = $1 AND is_claimed = FALSE',
      [claimToken]
    );

    if (packResult.rows.length === 0) {
      throw new Error('Invalid or already claimed pack.');
    }

    const pack = packResult.rows[0];

    const contentsResult = await query(
      'SELECT character_id FROM claimable_pack_contents WHERE pack_id = $1',
      [pack.id]
    );

    const charactersInPack = contentsResult.rows.map((row: any) => row.character_id);
    const grantedCharacters: string[] = [];
    const echoesGained: { character_id: string; count: number }[] = [];

    for (const charId of charactersInPack) {
      const existingCharacter = await dbAdapter.userCharacters.findByUserIdAndCharacterId(userId, charId);

      if (existingCharacter) {
        // Character already owned, convert to echo
        await this.characterEchoService.addEcho(userId, charId, 1);
        const existingEcho = echoesGained.find(e => e.character_id === charId);
        if (existingEcho) {
          existingEcho.count++;
        } else {
          echoesGained.push({ character_id: charId, count: 1 });
        }
      } else {
        // Grant new character
        const newCharacter = await dbAdapter.userCharacters.create({
          user_id: userId,
          character_id: charId,
          nickname: 'New Character', // Default nickname
        });
        if (newCharacter) {
          grantedCharacters.push(newCharacter.character_id);
        }
      }
    }

    // Mark pack as claimed
    await query(
      'UPDATE claimable_packs SET is_claimed = TRUE, claimed_by_user_id = $1, claimed_at = CURRENT_TIMESTAMP WHERE id = $2',
      [userId, pack.id]
    );

    return { grantedCharacters, echoesGained };
  }

  private async getRandomCharacterByRarity(rarity: CharacterRarity): Promise<string | undefined> {
    const availableCharacters = await this.getCharactersByRarity(rarity);
    if (availableCharacters.length === 0) {
      return undefined;
    }
    const randomIndex = Math.floor(Math.random() * availableCharacters.length);
    return availableCharacters[randomIndex].id;
  }

  private async getRandomCharacterByWeights(weights: { [key in CharacterRarity]?: number }): Promise<string | undefined> {
    let totalWeight = 0;
    const rarityPool: { rarity: CharacterRarity; weight: number }[] = [];

    // Build available rarity pool (only include rarities that have characters)
    for (const rarity in weights) {
      const weight = weights[rarity as CharacterRarity];
      if (weight) {
        const charactersInRarity = await this.getCharactersByRarity(rarity as CharacterRarity);
        if (charactersInRarity.length > 0) {
          totalWeight += weight;
          rarityPool.push({ rarity: rarity as CharacterRarity, weight });
        }
      }
    }

    if (rarityPool.length === 0) {
      return undefined;
    }

    let random = Math.random() * totalWeight;
    for (const entry of rarityPool) {
      if (random < entry.weight) {
        const charactersInRarity = await this.getCharactersByRarity(entry.rarity);
        const randomIndex = Math.floor(Math.random() * charactersInRarity.length);
        return charactersInRarity[randomIndex].id;
      }
      random -= entry.weight;
    }
    return undefined;
  }
}
