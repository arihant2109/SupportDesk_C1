import request from 'supertest';
import { Role } from '@prisma/client';
import { createApp } from '../src/app';
import { authHeader, createTestUser, loginAs } from './helpers';

const app = createApp();

describe('Auth API', () => {
  it('logs in with valid credentials', async () => {
    const user = await createTestUser({
      email: 'auth-valid@test.local',
      role: Role.agent,
    });

    const response = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: process.env.SEED_DEFAULT_PASSWORD ?? 'ChangeMe123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(user.email);
  });

  it('rejects invalid password', async () => {
    const user = await createTestUser({
      email: 'auth-invalid@test.local',
      role: Role.agent,
    });

    const response = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('UNAUTHORIZED');
  });

  it('rejects protected route without token', async () => {
    const response = await request(app).get('/api/tickets');
    expect(response.status).toBe(401);
  });

  it('returns current user from /me', async () => {
    const { token, user } = await loginAs(app, Role.admin);

    const response = await request(app)
      .get('/api/auth/me')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(user.id);
  });
});
