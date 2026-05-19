import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { db } from '../models/inMemoryDb';

// Mock google client to prevent actual network calls
vi.mock('google-auth-library', () => {
  return {
    OAuth2Client: vi.fn().mockImplementation(() => ({
      generateAuthUrl: vi.fn().mockReturnValue('http://mock-google-url'),
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: () => ({ email: 'google@test.com', name: 'Google User', picture: 'http://pic', nonce: 'test-nonce' })
      }),
      getToken: vi.fn().mockResolvedValue({
        tokens: { id_token: 'mock-id-token' }
      })
    }))
  };
});

describe('User Service - Auth API', () => {
  beforeEach(() => {
    // Clear DB except admin
    db.users.clear();
    db.usersByEmail.clear();
    db.users.set('admin-123', {
      id: 'admin-123',
      email: 'admin@minidiscord.local',
      passwordHash: 'seeded-no-login',
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ONLINE',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    db.usersByEmail.set('admin@minidiscord.local', 'admin-123');
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', name: 'Test User' });
      
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('test@test.com');
    expect(res.body.data.token).toBeDefined();
    
    // Should set cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('access_token=');
  });

  it('should login an existing user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', name: 'Test User' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
      
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('test@test.com');
    expect(res.body.data.token).toBeDefined();
  });

  it('should get current user from token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', name: 'Test User' });
      
    const token = registerRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@test.com');
  });

  it('should restrict admin route to ADMIN role', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', name: 'Test User' });
      
    const token = registerRes.body.data.token;

    // Normal user
    const resUser = await request(app)
      .get('/api/demo/admin')
      .set('Authorization', `Bearer ${token}`);
      
    expect(resUser.status).toBe(403);
  });
});
