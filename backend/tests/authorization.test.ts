import { Role } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/app';
import { authHeader, createTestTicket, loginAs } from './helpers';

const app = createApp();

describe('Role-based authorization', () => {
  it('prevents viewer from creating tickets', async () => {
    const { token } = await loginAs(app, Role.viewer);

    const response = await request(app)
      .post('/api/tickets')
      .set(authHeader(token))
      .send({
        title: 'Viewer ticket',
        description: 'Should be blocked',
        priority: 'low',
      });

    expect(response.status).toBe(403);
  });

  it('prevents viewer from changing ticket status', async () => {
    const { token: agentToken } = await loginAs(app, Role.agent);
    const { token: viewerToken } = await loginAs(app, Role.viewer);

    const createResponse = await request(app)
      .post('/api/tickets')
      .set(authHeader(agentToken))
      .send({
        title: 'Status test ticket',
        description: 'Viewer cannot transition',
        priority: 'medium',
      });

    const ticketId = createResponse.body.id;

    const response = await request(app)
      .patch(`/api/tickets/${ticketId}/status`)
      .set(authHeader(viewerToken))
      .send({ status: 'in_progress' });

    expect(response.status).toBe(403);
  });

  it('prevents viewer from updating ticket fields', async () => {
    const { token: agentToken } = await loginAs(app, Role.agent);
    const { token: viewerToken } = await loginAs(app, Role.viewer);

    const createResponse = await request(app)
      .post('/api/tickets')
      .set(authHeader(agentToken))
      .send({
        title: 'Patch test ticket',
        description: 'Viewer cannot patch',
        priority: 'medium',
      });

    const response = await request(app)
      .patch(`/api/tickets/${createResponse.body.id}`)
      .set(authHeader(viewerToken))
      .send({ title: 'Blocked update' });

    expect(response.status).toBe(403);
  });

  it('allows viewer to list tickets', async () => {
    const { token, user } = await loginAs(app, Role.viewer);
    await createTestTicket({ createdById: user.id });

    const response = await request(app)
      .get('/api/tickets')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.tickets.length).toBeGreaterThanOrEqual(1);
  });
});
