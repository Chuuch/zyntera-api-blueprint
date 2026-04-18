import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createServer } from '../server.js';

const app = createServer();

describe('Auth API Integration Tests', () => {
    it('GET /api/v1/me should return 401 when no session exists', async () => {
        const response = await request(app).get('/api/v1/me');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('GET /api/v1/auth/get-session should be handled by Better Auth', async () => {
        const response = await request(app).get('/api/v1/auth/get-session');
        expect(response.status).toBe(200);
    });
});