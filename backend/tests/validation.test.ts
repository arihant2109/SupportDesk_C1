import { Role } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/app';
import { authHeader, loginAs } from './helpers';

const app = createApp();

describe('Validation limits', () => {
  it('rejects ticket title longer than 255 characters', async () => {
    const { token } = await loginAs(app, Role.agent);

    const response = await request(app)
      .post('/api/tickets')
      .set(authHeader(token))
      .send({
        title: 'a'.repeat(256),
        description: 'Valid description',
        priority: 'low',
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects user password shorter than 8 characters', async () => {
    const { token } = await loginAs(app, Role.admin);

    const response = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({
        name: 'Short Password User',
        email: 'short-pass@test.local',
        password: 'short',
        role: 'viewer',
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });
});
