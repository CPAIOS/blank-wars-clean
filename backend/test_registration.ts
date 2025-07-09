import { AuthService } from './src/services/auth';
import { initializeDatabase } from './src/database/index';

async function testRegistration() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Creating auth service...');
    const authService = new AuthService();
    
    console.log('Attempting registration...');
    const result = await authService.register({
      username: 'testuser999',
      email: 'test999@example.com',
      password: 'password123'
    });
    
    console.log('Registration successful:', result.user.username);
  } catch (error) {
    console.error('Registration failed:', error instanceof Error ? error.message : String(error));
  }
}

testRegistration();