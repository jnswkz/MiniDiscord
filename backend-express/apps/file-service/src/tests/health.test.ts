import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Health Endpoints', () => {
  it('GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('file-service');
  });
});
