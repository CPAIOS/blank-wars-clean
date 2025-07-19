#!/usr/bin/env ts-node

// Simple script to query the database for character names
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function queryCharacters() {
  try {
    console.log('🔍 Querying characters with Vega/space/cyborg names...');
    
    const result = await pool.query(`
      SELECT id, name FROM characters 
      WHERE name ILIKE '%vega%' 
         OR id ILIKE '%vega%' 
         OR id ILIKE '%space%' 
         OR id ILIKE '%cyborg%'
         OR name ILIKE '%space%'
         OR name ILIKE '%cyborg%'
      ORDER BY id;
    `);
    
    console.log('📊 Found characters:');
    console.table(result.rows);
    
    if (result.rows.length === 0) {
      console.log('🔍 No matches found. Let me check all characters...');
      const allResult = await pool.query('SELECT id, name FROM characters ORDER BY id LIMIT 20;');
      console.log('📊 First 20 characters in database:');
      console.table(allResult.rows);
    }
    
  } catch (error) {
    console.error('❌ Database query error:', error);
  } finally {
    await pool.end();
  }
}

queryCharacters();