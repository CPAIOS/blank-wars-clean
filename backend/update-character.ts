#!/usr/bin/env ts-node

// Script to update character name from Vega-X to Space Cyborg
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateCharacterName() {
  try {
    console.log('🔄 Updating character name from "Vega-X" to "Space Cyborg"...');
    
    const result = await pool.query(`
      UPDATE characters 
      SET name = 'Space Cyborg' 
      WHERE id = 'space_cyborg';
    `);
    
    console.log(`✅ Updated ${result.rowCount} character(s)`);
    
    // Verify the update
    const verifyResult = await pool.query(`
      SELECT id, name FROM characters WHERE id = 'space_cyborg';
    `);
    
    console.log('📊 Verification:');
    console.table(verifyResult.rows);
    
  } catch (error) {
    console.error('❌ Database update error:', error);
  } finally {
    await pool.end();
  }
}

updateCharacterName();