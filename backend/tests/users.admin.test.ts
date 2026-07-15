import { Role } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/app';
import { authHeader, createTestUser, loginAs } from './helpers';

const app = createApp();

describe('Admin user management', () => {
  it('allows admin to create a user', async () => {
    const { token } = await loginAs(app, Role.admin);

    const response = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({
        name: 'New Agent',
        email: 'new-agent@test.local',
        password: 'Password123!',
        role: 'agent',
      });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe('new-agent@test.local');
  });

  it('prevents agent from creating users', async () => {
    const { token } = await loginAs(app, Role.agent);

    const response = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({
        name: 'Blocked User',
        email: 'blocked@test.local',
        password: 'Password123!',
        role: 'viewer',
      });

    expect(response.status).toBe(403);
  });

  it('prevents admin from deactivating themselves', async () => {
    const { token, user: admin } = await loginAs(app, Role.admin);

    const response = await request(app)
      .delete(`/api/users/${admin.id}`)
      .set(authHeader(token));

    expect(response.status).toBe(422);
  });

  it('allows admin to deactivate another user', async () => {
    const { token, user: admin } = await loginAs(app, Role.admin);
    const target = await createTestUser({
      email: 'deactivate-me@test.local',
      role: Role.viewer,
    });

    const response = await request(app)
      .delete(`/api/users/${target.id}`)
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.isActive).toBe(false);
    expect(response.body.id).not.toBe(admin.id);
  });

  it('allows admin to patch a user', async () => {
    const { token } = await loginAs(app, Role.admin);
    const target = await createTestUser({
      email: 'patch-me@test.local',
      role: Role.agent,
    });

    const response = await request(app)
      .patch(`/api/users/${target.id}`)
      .set(authHeader(token))
      .send({ name: 'Updated Name' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated Name');
  });

  it('rejects duplicate email on create', async () => {
    const { token } = await loginAs(app, Role.admin);
    await createTestUser({ email: 'duplicate@test.local', role: Role.viewer });

    const response = await request(app)
      .post('/api/users')
      .set(authHeader(token))
      .send({
        name: 'Duplicate',
        email: 'duplicate@test.local',
        password: 'Password123!',
        role: 'viewer',
      });

    expect(response.status).toBe(422);
  });

  it('prevents agent from patching users', async () => {
    const { token } = await loginAs(app, Role.agent);
    const target = await createTestUser({ email: 'no-patch@test.local', role: Role.viewer });

    const response = await request(app)
      .patch(`/api/users/${target.id}`)
      .set(authHeader(token))
      .send({ name: 'Hacked' });

    expect(response.status).toBe(403);
  });
});
