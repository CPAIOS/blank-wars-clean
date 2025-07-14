import Database from 'better-sqlite3';

export const migrateAddClaimablePacks = (db: Database.Database): void => {
  console.log('🔄 Running migration: add-claimable-packs');
  
  try {
    // Check if claimable_packs table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='claimable_packs'
    `).all();
    
    if (tableExists.length === 0) {
      console.log('📦 Creating claimable_packs table...');
      
      // Create claimable_packs table
      db.exec(`
        CREATE TABLE claimable_packs (
          id TEXT PRIMARY KEY,
          pack_type TEXT NOT NULL,
          is_claimed BOOLEAN DEFAULT FALSE,
          claimed_by_user_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          claimed_at DATETIME,
          
          FOREIGN KEY (claimed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      
      console.log('✅ claimable_packs table created');
    } else {
      console.log('📦 claimable_packs table already exists');
    }
    
    // Check if claimable_pack_contents table exists
    const contentsTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='claimable_pack_contents'
    `).all();
    
    if (contentsTableExists.length === 0) {
      console.log('📦 Creating claimable_pack_contents table...');
      
      // Create claimable_pack_contents table
      db.exec(`
        CREATE TABLE claimable_pack_contents (
          id TEXT PRIMARY KEY,
          pack_id TEXT NOT NULL,
          character_id TEXT NOT NULL,
          is_granted BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (pack_id) REFERENCES claimable_packs(id) ON DELETE CASCADE,
          FOREIGN KEY (character_id) REFERENCES characters(id)
        )
      `);
      
      console.log('✅ claimable_pack_contents table created');
    } else {
      console.log('📦 claimable_pack_contents table already exists');
    }
    
    console.log('✅ Migration add-claimable-packs completed successfully');
    
  } catch (error) {
    console.error('❌ Migration add-claimable-packs failed:', error);
    throw error;
  }
};