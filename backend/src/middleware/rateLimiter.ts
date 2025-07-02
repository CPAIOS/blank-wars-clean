import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased for development - Limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: (req as any).rateLimit?.resetTime
    });
  }
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'You have exceeded the authentication rate limit. Please try again later.',
      retryAfter: (req as any).rateLimit?.resetTime
    });
  }
});

// Rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for battle creation
export const battleLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 battle creations per 5 minutes
  message: 'Too many battle creation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for WebSocket connections
export const wsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Increased for development - Limit each IP to 50 WebSocket connection attempts per minute
  message: 'Too many WebSocket connection attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Dynamic rate limiter based on user subscription tier
export const createDynamicLimiter = (tier: string) => {
  const limits: Record<string, number> = {
    free: 50,
    bronze: 100,
    silver: 200,
    gold: 500,
    platinum: 1000
  };

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: limits[tier] || limits.free,
    message: `Rate limit exceeded for ${tier} tier. Please upgrade your subscription for higher limits.`,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return (req as any).user?.id || req.ip;
    }
  });
};