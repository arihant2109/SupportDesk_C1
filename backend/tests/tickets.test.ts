import request from 'supertest';
import { Role } from '@prisma/client';
import { createApp } from '../src/app';
import { authHeader, createTestTicket, loginAs, seedTestUsers } from './helpers';

const app = createApp();

describe('Tickets API', () => {
  it('creates a ticket with valid body', async () => {
    const { priya } = await seedTestUsers();
    const { token } = await loginAs(app, Role.agent, priya.email);

    const response = await request(app)
      .post('/api/tickets')
      .set(authHeader(token))
      .send({
        title: 'Checkout button unresponsive',
        description: 'Button does not respond on Safari',
        priority: 'high',
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Checkout button unresponsive');
    expect(response.body.status).toBe('open');
    expect(response.body.createdById).toBe(priya.id);
  });

  it('rejects ticket creation when title is missing', async () => {
    const { priya } = await seedTestUsers();
    const { token } = await loginAs(app, Role.agent, priya.email);

    const response = await request(app)
      .post('/api/tickets')
      .set(authHeader(token))
      .send({
        description: 'Missing title',
        priority: 'high',
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects ticket creation with invalid priority', async () => {
    const { priya } = await seedTestUsers();
    const { token } = await loginAs(app, Role.agent, priya.email);

    const response = await request(app)
      .post('/api/tickets')
      .set(authHeader(token))
      .send({
        title: 'Invalid priority ticket',
        description: 'Priority is invalid',
        priority: 'urgent',
      });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects unauthenticated ticket creation', async () => {
    const response = await request(app).post('/api/tickets').send({
      title: 'No auth ticket',
      description: 'Should fail',
      priority: 'high',
    });

    expect(response.status).toBe(401);
  });

  it('lists tickets', async () => {
    const { priya } = await seedTestUsers();
    await createTestTicket({ createdById: priya.id });
    const { token } = await loginAs(app, Role.agent, priya.email);

    const response = await request(app).get('/api/tickets').set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.tickets).toHaveLength(1);
  });

  it('returns ticket detail with comments', async () => {
    const { priya } = await seedTestUsers();
    const ticket = await createTestTicket({ createdById: priya.id });
    const { token } = await loginAs(app, Role.agent, priya.email);

    await request(app)
      .post(`/api/tickets/${ticket.id}/comments`)
      .set(authHeader(token))
      .send({
        message: 'Investigating now',
      });

    const response = await request(app)
      .get(`/api/tickets/${ticket.id}`)
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(1);
  });

  it('returns 404 for missing ticket', async () => {
    const { token } = await loginAs(app, Role.agent);

    const response = await request(app)
      .get('/api/tickets/00000000-0000-4000-8000-000000000099')
      .set(authHeader(token));

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('NOT_FOUND');
  });

  it('updates supplied ticket fields', async () => {
    const { priya, arjun } = await seedTestUsers();
    const ticket = await createTestTicket({ createdById: priya.id });
    const { token } = await loginAs(app, Role.agent, priya.email);

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .set(authHeader(token))
      .send({
        title: 'Updated ticket title',
        assignedToId: arjun.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Updated ticket title');
    expect(response.body.assignedTo.id).toBe(arjun.id);
    expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
      new Date(ticket.updatedAt).getTime()
    );
  });

  it('creates a comment on a ticket', async () => {
    const { priya } = await seedTestUsers();
    const ticket = await createTestTicket({ createdById: priya.id });
    const { token } = await loginAs(app, Role.agent, priya.email);

    const createResponse = await request(app)
      .post(`/api/tickets/${ticket.id}/comments`)
      .set(authHeader(token))
      .send({
        message: 'Thanks for the update',
      });

    expect(createResponse.status).toBe(201);

    const detailResponse = await request(app)
      .get(`/api/tickets/${ticket.id}`)
      .set(authHeader(token));
    expect(detailResponse.body.comments).toHaveLength(1);
  });

  it('rejects invalid ticket id format', async () => {
    const { token } = await loginAs(app, Role.agent);

    const response = await request(app)
      .get('/api/tickets/not-a-uuid')
      .set(authHeader(token));

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });

  it('returns valid transitions for a status', async () => {
    const { token } = await loginAs(app, Role.agent);

    const response = await request(app)
      .get('/api/tickets/transitions?status=open')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.transitions).toEqual(['in_progress', 'cancelled']);
  });
});
