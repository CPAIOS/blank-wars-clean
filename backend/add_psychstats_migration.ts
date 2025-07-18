import { query } from './src/database/index';

/**
 * Migration to add psychological stats columns to user_characters table
 * These columns are required for the frontend coaching system to work properly
 */

async function addPsychStatsColumns() {
  try {
    console.log('🔧 Adding psychological stats columns to user_characters table...\n');

    // Add the missing psychStats columns
    const columnsToAdd = [
      { name: 'training', defaultValue: 75, description: 'How well they follow coaching (0-100)' },
      { name: 'team_player', defaultValue: 70, description: 'Natural cooperation inclination (0-100)' }, 
      { name: 'ego', defaultValue: 60, description: 'Need for personal glory (0-100)' },
      { name: 'mental_health', defaultValue: 85, description: 'Current psychological state (0-100)' },
      { name: 'communication', defaultValue: 80, description: 'Team coordination ability (0-100)' }
    ];

    for (const column of columnsToAdd) {
      console.log(`Adding column: ${column.name} (${column.description})`);
      
      try {
        await query(`ALTER TABLE user_characters ADD COLUMN ${column.name} INTEGER DEFAULT ${column.defaultValue}`);
        console.log(`✅ Added ${column.name} column successfully`);
      } catch (error: any) {
        if (error.message.includes('duplicate column name')) {
          console.log(`⚠️  Column ${column.name} already exists, skipping`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🔄 Setting default values for existing user_characters...');
    
    // Update existing records to have default psychStats values
    for (const column of columnsToAdd) {
      const result = await query(`UPDATE user_characters SET ${column.name} = ${column.defaultValue} WHERE ${column.name} IS NULL`);
      console.log(`✅ Updated ${result.changes || 0} records with default ${column.name} values`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('The user_characters table now has psychological stats columns.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  addPsychStatsColumns()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export { addPsychStatsColumns };