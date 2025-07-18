import { query } from './src/database/index';

/**
 * Migration to move psychological stats from user_characters to characters table
 * These stats belong with the base character template data, not user-specific data
 */

async function migratePsychStatsToCharacters() {
  try {
    console.log('🔧 Moving psychological stats from user_characters to characters table...\n');

    // Add psychStats columns to characters table
    const columnsToAdd = [
      { name: 'training', defaultValue: 75, description: 'How well they follow coaching (0-100)' },
      { name: 'team_player', defaultValue: 70, description: 'Natural cooperation inclination (0-100)' }, 
      { name: 'ego', defaultValue: 60, description: 'Need for personal glory (0-100)' },
      { name: 'mental_health', defaultValue: 85, description: 'Current psychological state (0-100)' },
      { name: 'communication', defaultValue: 80, description: 'Team coordination ability (0-100)' }
    ];

    console.log('Adding psychStats columns to characters table...');
    for (const column of columnsToAdd) {
      try {
        await query(`ALTER TABLE characters ADD COLUMN ${column.name} INTEGER DEFAULT ${column.defaultValue}`);
        console.log(`✅ Added ${column.name} to characters table`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Column ${column.name} already exists in characters table`);
        } else {
          throw error;
        }
      }
    }

    // Set default values for existing characters
    console.log('\nSetting default psychStats values for existing characters...');
    for (const column of columnsToAdd) {
      const result = await query(`UPDATE characters SET ${column.name} = ${column.defaultValue} WHERE ${column.name} IS NULL`);
      console.log(`✅ Updated ${result.rowCount || 0} characters with default ${column.name} values`);
    }

    // Remove psychStats columns from user_characters table
    console.log('\nRemoving psychStats columns from user_characters table...');
    for (const column of columnsToAdd) {
      try {
        await query(`ALTER TABLE user_characters DROP COLUMN ${column.name}`);
        console.log(`✅ Removed ${column.name} from user_characters table`);
      } catch (error: any) {
        if (error.message.includes('does not exist')) {
          console.log(`⚠️  Column ${column.name} does not exist in user_characters table`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('PsychStats are now in the characters table where they belong.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migratePsychStatsToCharacters()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migratePsychStatsToCharacters };