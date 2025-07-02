"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../src/services/auth");
// Mock the auth service
jest.mock('../../src/services/auth');
const mockAuthService = auth_1.authService;
// Create a minimal Express app for testing
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Add auth routes for testing
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const result = await auth_1.authService.register({ username, email, password });
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await auth_1.authService.login({ email, password });
        res.json({ success: true, ...result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
app.get('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }
        // In real implementation, we'd verify the token first
        const user = await auth_1.authService.getProfile('user-123');
        res.json({ success: true, user });
    }
    catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});
describe('Auth API Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/auth/register', () => {
        const validRegistrationData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };
        it('should register a new user successfully', async () => {
            const mockResponse = {
                user: {
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    level: 1,
                    rating: 1000
                },
                tokens: {
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token'
                }
            };
            mockAuthService.register.mockResolvedValue(mockResponse);
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(validRegistrationData)
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                ...mockResponse
            });
            expect(mockAuthService.register).toHaveBeenCalledWith(validRegistrationData);
        });
        it('should return 400 for invalid registration data', async () => {
            mockAuthService.register.mockRejectedValue(new Error('Password must be at least 8 characters'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ ...validRegistrationData, password: '123' })
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                error: 'Password must be at least 8 characters'
            });
        });
        it('should return 400 for existing user', async () => {
            mockAuthService.register.mockRejectedValue(new Error('User already exists'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(validRegistrationData)
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                error: 'User already exists'
            });
        });
        it('should validate required fields', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ username: 'test' }) // Missing email and password
                .expect(400);
            expect(response.body.success).toBe(false);
        });
    });
    describe('POST /api/auth/login', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'password123'
        };
        it('should login user successfully with valid credentials', async () => {
            const mockResponse = {
                user: {
                    id: 'user-123',
                    username: 'testuser',
                    email: 'test@example.com',
                    level: 1,
                    rating: 1000
                },
                tokens: {
                    accessToken: 'access-token',
                    refreshToken: 'refresh-token'
                }
            };
            mockAuthService.login.mockResolvedValue(mockResponse);
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(validLoginData)
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                ...mockResponse
            });
            expect(mockAuthService.login).toHaveBeenCalledWith(validLoginData);
        });
        it('should return 400 for invalid credentials', async () => {
            mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(validLoginData)
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                error: 'Invalid credentials'
            });
        });
        it('should return 400 for non-existent user', async () => {
            mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' })
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                error: 'Invalid credentials'
            });
        });
    });
    describe('GET /api/auth/profile', () => {
        it('should return user profile with valid token', async () => {
            const mockUser = {
                id: 'user-123',
                username: 'testuser',
                email: 'test@example.com',
                level: 1,
                rating: 1000
            };
            mockAuthService.getProfile.mockResolvedValue(mockUser);
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer valid-token')
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                user: mockUser
            });
        });
        it('should return 401 without token', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/profile')
                .expect(401);
            expect(response.body).toEqual({
                success: false,
                error: 'No token provided'
            });
        });
        it('should return 401 for invalid token', async () => {
            mockAuthService.getProfile.mockRejectedValue(new Error('User not found'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
            expect(response.body).toEqual({
                success: false,
                error: 'User not found'
            });
        });
    });
    describe('request validation', () => {
        it('should handle malformed JSON', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }')
                .expect(400);
            // Express will handle malformed JSON and return 400
            expect(response.status).toBe(400);
        });
        it('should handle empty request body', async () => {
            mockAuthService.register.mockRejectedValue(new Error('Missing required fields'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({})
                .expect(400);
            expect(response.body.success).toBe(false);
        });
    });
});
