import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { logger } from '@minidiscord/common';
import { config } from '../config';

let redis: Redis | null = null;

try {
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't infinitely retry if Redis is down
  });
  
  redis.on('error', (err) => {
    logger.warn(`Gateway Redis connection error (Rate limiter will fail-open): ${err.message}`);
  });
} catch (err: any) {
  logger.warn(`Failed to initialize Redis for rate limiting: ${err.message}`);
}

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!redis || redis.status !== 'ready') {
    // Fail-open if Redis is down
    return next();
  }

  // Rate limit by User ID if authenticated, else IP
  const identifier = (req as any).user?.sub || req.ip || 'unknown-ip';
  const key = `rate:api:${identifier}`;
  
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, config.rateLimit.windowSeconds);
    }
    
    if (current > config.rateLimit.maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    next();
  } catch (err: any) {
    logger.error(`Rate limit redis error, failing open: ${err.message}`);
    next();
  }
};
