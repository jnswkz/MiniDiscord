import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { signAccessToken } from '@minidiscord/common';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';

const { mockRedisInstance } = vi.hoisted(() => ({
  mockRedisInstance: {
    status: 'ready',
    incr: vi.fn(),
    expire: vi.fn(),
    on: vi.fn(),
  }
}));

// Mock ioredis
vi.mock('ioredis', () => {
  const RedisMock = vi.fn(() => mockRedisInstance);
  return { default: RedisMock };
});

import Redis from 'ioredis';

// Create a mock app using just the middlewares (skip http-proxy-middleware to avoid network calls)
const createTestApp = () => {
  const app = express();
  app.use(cookieParser());
  
  // Health
  app.get('/health', (req, res) => { res.status(200).send('OK'); });
  
  // Open Path
  app.post('/api/auth/login', authMiddleware, (req, res) => { res.status(200).send('Login'); });
  
  // Protected Path
  app.get('/api/users/me', authMiddleware, (req, res) => {
    res.status(200).json({
      headers: req.headers
    });
  });

  // Rate limited path
  app.get('/api/demo/limit', authMiddleware, rateLimitMiddleware, (req, res) => {
    res.status(200).send('Limited');
  });
  
  // Error handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    res.status(err.statusCode || 500).json({ success: false, message: err.message, code: err.message });
  });

  return app;
};

describe('API Gateway Middlewares', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe('Auth Middleware', () => {
    it('should bypass open paths (/health)', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
    });

    it('should bypass open paths (/api/auth/*)', async () => {
      const res = await request(app).post('/api/auth/login');
      expect(res.status).toBe(200);
    });

    it('should reject protected path without token', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_TOKEN');
    });

    it('should reject invalid token', async () => {
      const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });

    it('should accept valid Bearer token and inject headers', async () => {
      const token = await signAccessToken({ sub: 'user123', email: 'test@test.com', role: 'USER' });
      
      const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.headers['x-user-id']).toBe('user123');
      expect(res.body.headers['x-user-email']).toBe('test@test.com');
      expect(res.body.headers['x-user-role']).toBe('USER');
    });

    it('should accept valid cookie token', async () => {
      const token = await signAccessToken({ sub: 'user456', email: 'cookie@test.com', role: 'ADMIN' });
      
      const res = await request(app).get('/api/users/me').set('Cookie', `access_token=${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.headers['x-user-id']).toBe('user456');
    });
  });

  describe('Rate Limit Middleware', () => {
    it('should allow request if under limit', async () => {
      const redisInstance = (Redis as unknown as ReturnType<typeof vi.fn>)();
      redisInstance.incr.mockResolvedValue(1);
      
      const token = await signAccessToken({ sub: 'user123', email: 'test@test.com', role: 'USER' });
      const res = await request(app).get('/api/demo/limit').set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(redisInstance.incr).toHaveBeenCalledWith('rate:api:user123');
      expect(redisInstance.expire).toHaveBeenCalledWith('rate:api:user123', expect.any(Number));
    });

    it('should block request if over limit', async () => {
      const redisInstance = (Redis as unknown as ReturnType<typeof vi.fn>)();
      redisInstance.incr.mockResolvedValue(21); // Max is 20
      
      const token = await signAccessToken({ sub: 'user123', email: 'test@test.com', role: 'USER' });
      const res = await request(app).get('/api/demo/limit').set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(429);
      expect(res.body.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
