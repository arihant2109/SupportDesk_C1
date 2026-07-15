import rateLimit from 'express-rate-limit';

export const loginRateLimit =
  process.env.NODE_ENV === 'test'
    ? (_req: unknown, _res: unknown, next: () => void) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          error: 'TOO_MANY_REQUESTS',
          message: 'Too many login attempts. Please try again later.',
        },
      });
