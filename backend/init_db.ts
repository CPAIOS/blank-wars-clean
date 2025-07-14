import { initializeDatabase } from './src/database/index';

async function initDB() {
  console.log('🔄 Initializing database...');
  await initializeDatabase();
  console.log('✅ Database initialized successfully');
}

initDB().catch(console.error);