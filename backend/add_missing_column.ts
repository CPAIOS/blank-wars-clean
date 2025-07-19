import { query } from './src/database';

async function addMissingColumn() {
  try {
    console.log('🔧 Adding missing columns to user_characters table...');
    
    // Add psychstats column if it doesn't exist
    await query(`
      ALTER TABLE user_characters 
      ADD COLUMN IF NOT EXISTS psychstats JSONB
    `);
    console.log('✅ psychstats column added successfully');
    
    // Add battle_count column if it doesn't exist
    await query(`
      ALTER TABLE user_characters 
      ADD COLUMN IF NOT EXISTS battle_count INTEGER DEFAULT 0
    `);
    console.log('✅ battle_count column added successfully');
    
    // Add other missing columns if they don't exist
    await query(`
      ALTER TABLE user_characters 
      ADD COLUMN IF NOT EXISTS health INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS max_health INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS strength INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS vitality INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS speed INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS intelligence INTEGER DEFAULT 50
    `);
    console.log('✅ stat columns added successfully');
    
    // Add index for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_characters_psychstats 
      ON user_characters USING gin(psychstats)
    `);
    console.log('✅ Index created successfully');
    
    console.log('🎉 Database migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

addMissingColumn();