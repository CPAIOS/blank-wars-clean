#!/usr/bin/env ts-node

/**
 * Export Local SQLite Database to Production PostgreSQL
 * This script will:
 * 1. Read all data from local SQLite database
 * 2. Clear production PostgreSQL database 
 * 3. Import all data to production PostgreSQL
 */

import Database from 'better-sqlite3';
import { Pool } from 'pg';

// Local SQLite database
const localDb = new Database('./data/blankwars.db');

// Production PostgreSQL database - you'll need to set this
const PRODUCTION_DATABASE_URL = 'postgresql://postgres:password@railway.app:5432/railway'; // Replace with actual Railway PostgreSQL URL

const productionDb = new Pool({
  connectionString: PRODUCTION_DATABASE_URL
});

async function exportLocalToProduction() {
  try {
    console.log('🚀 Starting local to production database export...\n');

    // Define tables to export in dependency order
    const tables = [
      'users',
      'characters', 
      'user_characters',
      'user_currency',
      'user_headquarters',
      'headquarters_rooms',
      'room_beds',
      'user_character_echoes',
      'coach_progression',
      'coach_xp_events',
      'coach_skills',
      'claimable_packs',
      'claimable_pack_contents',
      'battles',
      'user_friendships'
    ];

    for (const tableName of tables) {
      await exportTable(tableName);
    }

    console.log('\n✅ Database export completed successfully!');
    console.log('🎮 Your local game data is now available in production!');

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    localDb.close();
    await productionDb.end();
  }
}

async function exportTable(tableName: string) {
  try {
    console.log(`📊 Exporting table: ${tableName}`);

    // Get local data
    const localData = localDb.prepare(`SELECT * FROM ${tableName}`).all();
    console.log(`   📥 Found ${localData.length} records in local ${tableName}`);

    if (localData.length === 0) {
      console.log(`   ⏭️  Skipping empty table ${tableName}`);
      return;
    }

    // Clear production table
    await productionDb.query(`DELETE FROM ${tableName}`);
    console.log(`   🗑️  Cleared production ${tableName}`);

    // Insert data into production
    if (localData.length > 0) {
      const columns = Object.keys(localData[0]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const columnList = columns.join(', ');
      
      const insertSQL = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`;
      
      let inserted = 0;
      for (const row of localData) {
        try {
          const values = columns.map(col => {
            const value = row[col];
            // Handle JSON strings and other data types
            if (typeof value === 'object' && value !== null) {
              return JSON.stringify(value);
            }
            return value;
          });
          
          await productionDb.query(insertSQL, values);
          inserted++;
        } catch (error) {
          console.warn(`   ⚠️  Failed to insert row in ${tableName}:`, error.message);
        }
      }
      
      console.log(`   ✅ Inserted ${inserted}/${localData.length} records into production ${tableName}`);
    }

  } catch (error) {
    // Log error but continue with other tables
    console.error(`   ❌ Error exporting ${tableName}:`, error.message);
    
    // If table doesn't exist, skip it
    if (error.message.includes('no such table') || error.message.includes('does not exist')) {
      console.log(`   ⏭️  Table ${tableName} doesn't exist, skipping...`);
      return;
    }
    
    throw error;
  }
}

// Run the export
if (require.main === module) {
  exportLocalToProduction()
    .then(() => {
      console.log('\n🎉 Export completed! Your local data is now in production.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Export failed:', error);
      process.exit(1);
    });
}