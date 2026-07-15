import { Role, Status } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/app';
import { authHeader, createTestTicket, loginAs, seedTestUsers } from './helpers';

const app = createApp();

describe('Ticket status state machine', () => {
  const validTransitions: Array<{ from: Status; to: Status }> = [
    { from: Status.open, to: Status.in_progress },
    { from: Status.open, to: Status.cancelled },
    { from: Status.in_progress, to: Status.resolved },
    { from: Status.in_progress, to: Status.cancelled },
    { from: Status.resolved, to: Status.closed },
  ];

  const invalidTransitions: Array<{ from: Status; to: Status }> = [
    { from: Status.open, to: Status.resolved },
    { from: Status.open, to: Status.closed },
    { from: Status.in_progress, to: Status.open },
    { from: Status.resolved, to: Status.open },
    { from: Status.resolved, to: Status.in_progress },
    { from: Status.closed, to: Status.open },
    { from: Status.cancelled, to: Status.open },
  ];

  it.each(validTransitions)(
    'allows transition from $from to $to',
    async ({ from, to }) => {
      const { priya } = await seedTestUsers();
      const ticket = await createTestTicket({
        createdById: priya.id,
        status: from,
      });
      const { token } = await loginAs(app, Role.agent, priya.email);

      const response = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set(authHeader(token))
        .send({ status: to });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(to);
    }
  );

  it.each(invalidTransitions)(
    'rejects transition from $from to $to',
    async ({ from, to }) => {
      const { priya } = await seedTestUsers();
      const ticket = await createTestTicket({
        createdById: priya.id,
        status: from,
      });
      const { token } = await loginAs(app, Role.agent, priya.email);

      const response = await request(app)
        .patch(`/api/tickets/${ticket.id}/status`)
        .set(authHeader(token))
        .send({ status: to });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe('INVALID_TRANSITION');
    }
  );

  it('rejects transition to the current status', async () => {
    const { priya } = await seedTestUsers();
    const ticket = await createTestTicket({
      createdById: priya.id,
      status: Status.open,
    });
    const { token } = await loginAs(app, Role.agent, priya.email);

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set(authHeader(token))
      .send({ status: Status.open });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('INVALID_TRANSITION');
  });

  it('rejects invalid status casing', async () => {
    const { priya } = await seedTestUsers();
    const ticket = await createTestTicket({ createdById: priya.id });
    const { token } = await loginAs(app, Role.agent, priya.email);

    const response = await request(app)
      .patch(`/api/tickets/${ticket.id}/status`)
      .set(authHeader(token))
      .send({ status: 'Open' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when ticket does not exist', async () => {
    const { token } = await loginAs(app, Role.agent);

    const response = await request(app)
      .patch('/api/tickets/00000000-0000-4000-8000-000000000099/status')
      .set(authHeader(token))
      .send({ status: Status.in_progress });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('NOT_FOUND');
  });
});
