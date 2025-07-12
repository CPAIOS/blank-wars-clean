import { query } from './src/database/index';
import { v4 as uuidv4 } from 'uuid';

/**
 * Script to check and fix character assignments for users
 * Ensures all 17 characters are assigned to user accounts
 */

async function fixCharacterAssignments() {
  try {
    console.log('🔍 Starting character assignment troubleshooting...\n');

    // Step 1: Check master characters table
    console.log('Step 1: Checking master characters table...');
    const allCharacters = await query('SELECT id, name, archetype FROM characters ORDER BY name');
    console.log(`✅ Found ${allCharacters.rows.length} characters in master table:`);
    allCharacters.rows.forEach((char: any) => {
      console.log(`   - ${char.name} (${char.id}) - ${char.archetype}`);
    });

    if (allCharacters.rows.length !== 17) {
      console.log(`⚠️  WARNING: Expected 17 characters, found ${allCharacters.rows.length}`);
      console.log('   Running database seeding might be needed...');
    }

    // Step 2: Check all users
    console.log('\nStep 2: Checking user accounts...');
    const allUsers = await query('SELECT id, username, email FROM users');
    console.log(`✅ Found ${allUsers.rows.length} user(s):`);
    allUsers.rows.forEach((user: any) => {
      console.log(`   - ${user.username} (${user.email}) - ID: ${user.id}`);
    });

    // Step 3: Check character assignments per user
    console.log('\nStep 3: Checking character assignments per user...');
    for (const user of allUsers.rows) {
      const userChars = await query(`
        SELECT uc.character_id, c.name, c.archetype 
        FROM user_characters uc 
        JOIN characters c ON uc.character_id = c.id 
        WHERE uc.user_id = ?
        ORDER BY c.name
      `, [user.id]);

      console.log(`\n👤 User: ${user.username}`);
      console.log(`   Assigned characters: ${userChars.rows.length}/17`);
      
      if (userChars.rows.length > 0) {
        userChars.rows.forEach((char: any) => {
          console.log(`   ✅ ${char.name} (${char.character_id}) - ${char.archetype}`);
        });
      }

      // Find missing characters
      const assignedCharIds = userChars.rows.map((char: any) => char.character_id);
      const missingChars = allCharacters.rows.filter((char: any) => 
        !assignedCharIds.includes(char.id)
      );

      if (missingChars.length > 0) {
        console.log(`   ❌ Missing ${missingChars.length} characters:`);
        missingChars.forEach((char: any) => {
          console.log(`      - ${char.name} (${char.id}) - ${char.archetype}`);
        });

        // Ask for confirmation before fixing
        console.log(`\n🔧 Would you like to assign the missing characters to ${user.username}?`);
        console.log('   This will give them all 17 characters with level 1 stats.');
        
        // Auto-assign for troubleshooting (you can modify this logic)
        console.log('   Auto-assigning missing characters...');
        
        for (const missingChar of missingChars) {
          const userCharId = uuidv4();
          const serialNumber = `AUTO-${missingChar.id.toUpperCase()}-${Date.now()}`;
          
          // Get character's base stats for initial assignment
          const charDetails = await query('SELECT * FROM characters WHERE id = ?', [missingChar.id]);
          const char = charDetails.rows[0];
          
          await query(`
            INSERT INTO user_characters (
              id, user_id, character_id, serial_number,
              level, experience, bond_level,
              current_health, max_health,
              total_battles, total_wins
            ) VALUES (?, ?, ?, ?, 1, 0, 0, ?, ?, 0, 0)
          `, [
            userCharId, 
            user.id, 
            missingChar.id, 
            serialNumber,
            char.base_health,
            char.base_health
          ]);
          
          console.log(`      ✅ Assigned ${missingChar.name} to ${user.username}`);
        }
      } else {
        console.log(`   ✅ All characters already assigned!`);
      }
    }

    // Step 4: Final verification
    console.log('\n🎯 Step 4: Final verification...');
    for (const user of allUsers.rows) {
      const finalCount = await query(`
        SELECT COUNT(*) as count 
        FROM user_characters 
        WHERE user_id = ?
      `, [user.id]);
      
      console.log(`   ${user.username}: ${finalCount.rows[0].count}/17 characters assigned`);
    }

    console.log('\n✅ Character assignment troubleshooting completed!');
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Test the Training > Activities tab');
    console.log('   3. Check if all 17 characters now appear');

  } catch (error) {
    console.error('❌ Error during character assignment fix:', error);
  }
}

// Run the script
fixCharacterAssignments();