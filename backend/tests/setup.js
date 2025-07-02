"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Test setup file
const dotenv_1 = __importDefault(require("dotenv"));
// Load test environment variables
dotenv_1.default.config({ path: '.env.test' });
// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
// Mock Redis to avoid connection issues during testing
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
        hget: jest.fn().mockResolvedValue(null),
        hset: jest.fn().mockResolvedValue(1),
        hgetall: jest.fn().mockResolvedValue({}),
        hdel: jest.fn().mockResolvedValue(1),
        sadd: jest.fn().mockResolvedValue(1),
        srem: jest.fn().mockResolvedValue(1),
        smembers: jest.fn().mockResolvedValue([]),
        sismember: jest.fn().mockResolvedValue(false),
        publish: jest.fn().mockResolvedValue(0),
        subscribe: jest.fn().mockResolvedValue(undefined),
        quit: jest.fn().mockResolvedValue('OK'),
        on: jest.fn(),
    }));
});
// Global test timeout
jest.setTimeout(10000);
