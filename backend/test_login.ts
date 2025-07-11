import { initializeDatabase, query } from './src/database/index';
import bcrypt from 'bcrypt';

async function createTestUser() {
  try {
    await initializeDatabase();
    
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the test user with a known password
    await query(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE email = ?
    `, [hashedPassword, 'test@example.com']);
    
    console.log('✅ Test user updated successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: test123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

createTestUser();