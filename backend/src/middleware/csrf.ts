import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';

// Configure CSRF protection with minimal configuration
const csrfProtection = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'csrf-secret-change-in-production',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
  },
  getSessionIdentifier: (req: Request) => req.ip || 'anonymous',
});

// Export middleware
export const csrfMiddleware = csrfProtection.doubleCsrfProtection;

// Export error for comparison
export const invalidCsrfTokenError = csrfProtection.invalidCsrfTokenError;

// Endpoint to get CSRF token
export const getCsrfToken = (req: Request, res: Response) => {
  try {
    const csrfToken = csrfProtection.generateCsrfToken(req, res);
    res.json({ csrfToken });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
};

// Skip CSRF for certain routes (e.g., public endpoints)
export const skipCsrf = (paths: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('🔒 CSRF Check - Path:', req.path, 'Skip paths:', paths);
    if (paths.some(path => req.path.startsWith(path))) {
      console.log('✅ CSRF Skipped for:', req.path);
      return next();
    }
    console.log('🚫 CSRF Required for:', req.path);
    return csrfMiddleware(req, res, next);
  };
};

// Error handler for CSRF failures
export const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err === invalidCsrfTokenError || err.code === 'EBADCSRFTOKEN' || err.message?.includes('CSRF')) {
    res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Your request was rejected due to invalid security token. Please refresh and try again.'
    });
  } else {
    next(err);
  }
};