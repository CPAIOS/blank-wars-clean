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

  // Generates a new pack based on predefined rules
  async generatePack(packType: string): Promise<string> {
    console.log(`🎁 Starting pack generation for type: ${packType}`);
    console.log(`🔍 Available pack rules:`, Object.keys(this.packRules));
    const rules = this.packRules[packType];
    if (!rules) {
      throw new Error(`Pack type ${packType} not found.`);
    }

    const packId = uuidv4();
    const charactersToGrant: string[] = [];

    // Handle guaranteed rarity first
    if (rules.guaranteed_rarity) {
      console.log(`🎯 Getting guaranteed character of rarity: ${rules.guaranteed_rarity}`);
      const guaranteedChar = await this.getRandomCharacterByRarity(rules.guaranteed_rarity);
      if (guaranteedChar) {
        charactersToGrant.push(guaranteedChar);
        console.log(`✅ Added guaranteed character: ${guaranteedChar}`);
      } else {
        console.log(`⚠️ No guaranteed character found for rarity: ${rules.guaranteed_rarity}`);
      }
    }

    // Fill the rest based on rarity weights
    console.log(`🎲 Filling remaining ${rules.count - charactersToGrant.length} slots with weighted random characters`);
    let attempts = 0;
    const maxAttempts = rules.count * 10; // Prevent infinite loops
    
    while (charactersToGrant.length < rules.count && attempts < maxAttempts) {
      attempts++;
      const randomChar = await this.getRandomCharacterByWeights(rules.rarity_weights);
      if (randomChar) {
        charactersToGrant.push(randomChar);
        console.log(`✅ Added random character: ${randomChar} (${charactersToGrant.length}/${rules.count})`);
      } else {
        console.log(`⚠️ Failed to get random character (attempt ${attempts})`);
      }
    }

    if (charactersToGrant.length < rules.count) {
      throw new Error(`Could not generate enough characters for pack. Got ${charactersToGrant.length}/${rules.count}`);
    }

    console.log(`💾 Creating pack record with ID: ${packId}`);
    // Create pack record with graceful fallback
    try {
      await query(
        `INSERT INTO claimable_packs (id, pack_type) VALUES (?, ?)`,
        [packId, packType]
      );

      // Insert pack contents
      console.log(`📦 Inserting ${charactersToGrant.length} characters into pack`);
      for (const charId of charactersToGrant) {
        const contentId = uuidv4();
        await query(
          `INSERT INTO claimable_pack_contents (id, pack_id, character_id) VALUES (?, ?, ?)`,
          [contentId, packId, charId]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table: claimable_packs') || errorMessage.includes('no such table: claimable_pack_contents')) {
        console.log('⚠️ Claimable packs tables missing, falling back to direct character assignment');
        console.log('🔄 Creating pack token for direct assignment fallback');
        // Return a special token that indicates direct assignment is needed
        return `DIRECT_ASSIGN:${charactersToGrant.join(',')}`;
      }
      console.error('❌ Unexpected error creating pack record:', error);
      throw error;
    }

    console.log(`🎉 Pack generation completed successfully: ${packId}`);
    return packId; // Return the claim token
  }

  // Creates a gift pack with specific characters
  async createGiftPack(characterIds: string[]): Promise<string> {
    const packId = uuidv4();
    await query(
      `INSERT INTO claimable_packs (id, pack_type) VALUES (?, ?)`,
      [packId, 'gift_pack']
    );

    for (const charId of characterIds) {
      const contentId = uuidv4();
      await query(
        `INSERT INTO claimable_pack_contents (id, pack_id, character_id) VALUES (?, ?, ?)`,
        [contentId, packId, charId]
      );
    }
    return packId;
  }

  // Claims a pack for a user, handling duplicates as echoes
  async claimPack(userId: string, claimToken: string): Promise<{ grantedCharacters: string[]; echoesGained: { character_id: string; count: number }[] }> {
    console.log(`🎁 Starting pack claim for user: ${userId}, token: ${claimToken}`);
    
    // Handle direct assignment fallback
    if (claimToken.startsWith('DIRECT_ASSIGN:')) {
      console.log('🔄 Using direct character assignment fallback');
      const characterIds = claimToken.replace('DIRECT_ASSIGN:', '').split(',');
      return await this.directCharacterAssignment(userId, characterIds);
    }
    const packResult = await query(
      'SELECT id, pack_type FROM claimable_packs WHERE id = ? AND is_claimed = FALSE',
      [claimToken]
    );

    if (packResult.rows.length === 0) {
      throw new Error('Invalid or already claimed pack.');
    }

    const pack = packResult.rows[0];

    const contentsResult = await query(
      'SELECT character_id FROM claimable_pack_contents WHERE pack_id = ?',
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
      'UPDATE claimable_packs SET is_claimed = TRUE, claimed_by_user_id = ?, claimed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId, pack.id]
    );

    return { grantedCharacters, echoesGained };
  }

  private async getRandomCharacterByRarity(rarity: CharacterRarity): Promise<string | undefined> {
    try {
      const result = await query(
        'SELECT id FROM characters WHERE rarity = ?',
        [rarity]
      );
      
      if (result.rows.length === 0) {
        console.log(`⚠️ No characters found with rarity: ${rarity}`);
        return undefined;
      }
      
      const randomIndex = Math.floor(Math.random() * result.rows.length);
      return result.rows[randomIndex].id;
    } catch (error) {
      console.error(`❌ Error fetching characters by rarity ${rarity}:`, error);
      return undefined;
    }
  }

  private async getRandomCharacterByWeights(weights: { [key in CharacterRarity]?: number }): Promise<string | undefined> {
    let totalWeight = 0;
    const rarityPool: { rarity: CharacterRarity; weight: number }[] = [];

    for (const rarity in weights) {
      const weight = weights[rarity as CharacterRarity];
      if (weight) {
        totalWeight += weight;
        rarityPool.push({ rarity: rarity as CharacterRarity, weight });
      }
    }

    let random = Math.random() * totalWeight;
    for (const entry of rarityPool) {
      if (random < entry.weight) {
        try {
          const result = await query(
            'SELECT id FROM characters WHERE rarity = ?',
            [entry.rarity]
          );
          
          if (result.rows.length > 0) {
            const randomIndex = Math.floor(Math.random() * result.rows.length);
            return result.rows[randomIndex].id;
          }
        } catch (error) {
          console.error(`❌ Error fetching characters by rarity ${entry.rarity}:`, error);
        }
      }
      random -= entry.weight;
    }
    return undefined;
  }

  // Direct character assignment fallback (when claimable_packs tables don't exist)
  private async directCharacterAssignment(userId: string, characterIds: string[]): Promise<{ grantedCharacters: string[]; echoesGained: { character_id: string; count: number }[] }> {
    console.log(`🎭 Direct character assignment for user: ${userId}, characters: ${characterIds.length}`);
    const grantedCharacters: string[] = [];
    const echoesGained: { character_id: string; count: number }[] = [];

    for (const charId of characterIds) {
      try {
        // Check if user already has this character
        const existingCharacter = await dbAdapter.userCharacters.findByUserIdAndCharacterId(userId, charId);

        if (existingCharacter) {
          // Character already owned, convert to echo
          console.log(`🔮 User already has character ${charId}, adding echo`);
          await this.characterEchoService.addEcho(userId, charId, 1);
          const existingEcho = echoesGained.find(e => e.character_id === charId);
          if (existingEcho) {
            existingEcho.count++;
          } else {
            echoesGained.push({ character_id: charId, count: 1 });
          }
        } else {
          // Grant new character directly
          console.log(`🎭 Granting new character ${charId} to user ${userId}`);
          const newCharacter = await dbAdapter.userCharacters.create({
            user_id: userId,
            character_id: charId,
            nickname: 'New Character', // Default nickname
          });
          if (newCharacter) {
            grantedCharacters.push(newCharacter.character_id);
            console.log(`✅ Successfully granted character: ${charId}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error assigning character ${charId}:`, error);
        // Continue with other characters
      }
    }

    console.log(`🎉 Direct assignment completed: ${grantedCharacters.length} granted, ${echoesGained.length} echoes`);
    return { grantedCharacters, echoesGained };
  }
}
