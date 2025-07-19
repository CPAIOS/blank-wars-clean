import { AuthService } from './src/services/auth';
import { initializeDatabase, query } from './src/database/index';
import { v4 as uuidv4 } from 'uuid';

async function createDevAccount() {
  try {
    console.log('🔧 Creating developer test account...');
    
    // Initialize database
    await initializeDatabase();
    
    // Create auth service
    const authService = new AuthService();
    
    // Developer account credentials
    const devCredentials = {
      username: 'devtest',
      email: 'dev@test.com',
      password: 'devpass123'
    };
    
    console.log('📝 Account Details:');
    console.log('   Username:', devCredentials.username);
    console.log('   Email:', devCredentials.email);
    console.log('   Password:', devCredentials.password);
    
    // Check if account already exists
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [devCredentials.email, devCredentials.username]
    );
    
    let userId: string;
    
    if (existing.rows.length > 0) {
      console.log('⚠️  Developer account already exists, updating it...');
      userId = existing.rows[0].id;
    } else {
      // Register new account
      console.log('🆕 Creating new developer account...');
      const result = await authService.register(devCredentials);
      userId = result.user.id;
    }
    
    // Update account with developer privileges
    console.log('🎁 Granting developer privileges...');
    
    // Set premium subscription and high level
    await query(`
      UPDATE users 
      SET 
        subscription_tier = 'legendary',
        subscription_expires_at = NOW() + INTERVAL '365 days',
        level = 100,
        experience = 999999,
        rating = 2500,
        character_slot_capacity = 50
      WHERE id = $1
    `, [userId]);
    
    // Add lots of in-game currency
    console.log('💰 Adding in-game currency...');
    
    // Check if currency record exists
    const currencyExists = await query(
      'SELECT user_id FROM user_currency WHERE user_id = $1',
      [userId]
    );
    
    if (currencyExists.rows.length > 0) {
      // Update existing currency
      await query(`
        UPDATE user_currency 
        SET 
          battle_tokens = 999999,
          premium_currency = 999999,
          last_updated = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `, [userId]);
    } else {
      // Insert new currency record
      await query(`
        INSERT INTO user_currency (user_id, battle_tokens, premium_currency)
        VALUES ($1, 999999, 999999)
      `, [userId]);
    }
    
    // Grant all characters for testing
    console.log('🎭 Granting all characters...');
    
    // Get all available characters
    const characters = await query('SELECT id FROM characters');
    
    for (const char of characters.rows) {
      // Check if user already has this character
      const hasChar = await query(
        'SELECT id FROM user_characters WHERE user_id = $1 AND character_id = $2',
        [userId, char.id]
      );
      
      if (hasChar.rows.length === 0) {
        // Grant character at high level
        const userCharId = uuidv4();
        const serialNumber = `DEV-${char.id.toUpperCase()}-${Date.now()}`;
        
        await query(`
          INSERT INTO user_characters (
            id, user_id, character_id, serial_number, 
            level, experience, bond_level, 
            current_health, max_health,
            total_battles, total_wins
          ) VALUES ($1, $2, $3, $4, 50, 99999, 100, 9999, 9999, 0, 0)
        `, [userCharId, userId, char.id, serialNumber]);
      }
    }
    
    console.log('✅ Developer account created successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: dev@test.com');
    console.log('   Password: devpass123');
    console.log('\n🎮 Account Features:');
    console.log('   - Legendary subscription (365 days)');
    console.log('   - Level 100');
    console.log('   - 999,999 Battle Tokens');
    console.log('   - 999,999 Premium Currency');
    console.log('   - All characters unlocked at level 50');
    console.log('   - 50 character slots');
    console.log('   - 2500 rating');
    
  } catch (error) {
    console.error('❌ Failed to create developer account:', error);
  }
}

createDevAccount();