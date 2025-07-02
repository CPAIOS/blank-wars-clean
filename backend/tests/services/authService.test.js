"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../src/services/auth");
const database_1 = require("../../src/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock dependencies
jest.mock('../../src/database', () => ({
    query: jest.fn(),
    db: {},
    cache: {}
}));
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
    let authService;
    let mockQuery;
    let mockBcrypt;
    let mockJwt;
    
    beforeEach(() => {
        jest.clearAllMocks();
        // Get fresh mock references after clearing
        mockQuery = require('../../src/database').query;
        mockBcrypt = require('bcrypt');
        mockJwt = require('jsonwebtoken');
        authService = new auth_1.AuthService();
    });
    describe('register', () => {
        const validUserData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };
        it('should successfully register a new user', async () => {
            // Mock existing user check (no existing user)
            mockQuery.mockResolvedValueOnce({ rows: [] });
            // Mock password hashing
            mockBcrypt.hash.mockResolvedValue('hashedpassword123');
            // Mock user creation
            mockQuery.mockResolvedValueOnce({ rows: [] });
            // Mock user retrieval
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                subscription_tier: 'free',
                level: 1,
                experience: 0,
                total_battles: 0,
                total_wins: 0,
                rating: 1000,
                created_at: new Date(),
                updated_at: new Date()
            };
            mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
            // Mock starter character assignment
            mockQuery.mockResolvedValueOnce({ rows: [] });
            // Mock token generation
            mockJwt.sign
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');
            const result = await authService.register(validUserData);
            expect(result).toEqual({
                user: mockUser,
                tokens: {
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token'
                }
            });
            // Verify password was hashed
            expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 12);
            // Verify starter character was assigned
            expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO user_characters'), expect.arrayContaining([
                expect.any(String), // userCharacterId
                expect.any(String), // userId
                'char_003', // Robin Hood ID
                1, // level
                0, // experience
                0, // bond_level
                0, // total_battles
                0, // total_wins
                85, // current_health
                85, // max_health
                false, // is_injured
                'starter' // acquired_from
            ]));
        });
        it('should throw error for existing user', async () => {
            // Mock existing user found
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-user' }] });
            await expect(authService.register(validUserData))
                .rejects.toThrow('User already exists');
        });
        it('should throw error for weak password', async () => {
            const weakPasswordData = { ...validUserData, password: '123' };
            await expect(authService.register(weakPasswordData))
                .rejects.toThrow('Password must be at least 8 characters');
        });
        it('should throw error for missing fields', async () => {
            const incompleteData = { username: 'test', email: '', password: 'password123' };
            await expect(authService.register(incompleteData))
                .rejects.toThrow('Missing required fields');
        });
    });
    describe('login', () => {
        const validCredentials = {
            email: 'test@example.com',
            password: 'password123'
        };
        it('should successfully login with valid credentials', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                password_hash: 'hashedpassword',
                subscription_tier: 'free',
                level: 1,
                experience: 0,
                total_battles: 0,
                total_wins: 0,
                rating: 1000,
                created_at: new Date(),
                updated_at: new Date()
            };
            // Mock user lookup
            mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
            // Mock password verification
            mockBcrypt.compare.mockResolvedValue(true);
            // Mock token generation
            mockJwt.sign
                .mockReturnValueOnce('access-token')
                .mockReturnValueOnce('refresh-token');
            const result = await authService.login(validCredentials);
            expect(result).toEqual({
                user: {
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    subscription_tier: 'free',
                    level: 1,
                    experience: 0,
                    total_battles: 0,
                    total_wins: 0,
                    rating: 1000,
                    created_at: mockUser.created_at,
                    updated_at: mockUser.updated_at
                },
                tokens: {
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token'
                }
            });
        });
        it('should throw error for non-existent user', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            await expect(authService.login(validCredentials))
                .rejects.toThrow('Invalid credentials');
        });
        it('should throw error for invalid password', async () => {
            const mockUser = {
                id: 'user-123',
                password_hash: 'hashedpassword',
                email: 'test@example.com'
            };
            mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
            mockBcrypt.compare.mockResolvedValue(false);
            await expect(authService.login(validCredentials))
                .rejects.toThrow('Invalid credentials');
        });
    });
    describe('getProfile', () => {
        it('should return user profile for valid token', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                subscription_tier: 'free',
                level: 1,
                experience: 0,
                total_battles: 0,
                total_wins: 0,
                rating: 1000,
                created_at: new Date(),
                updated_at: new Date()
            };
            mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
            const result = await authService.getProfile('user-123');
            expect(result).toEqual(mockUser);
        });
        it('should throw error for non-existent user', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            await expect(authService.getProfile('non-existent'))
                .rejects.toThrow('User not found');
        });
    });
});
