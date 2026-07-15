import { Priority, Role, Status } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/app';
import { authHeader, createTestTicket, loginAs, seedTestUsers } from './helpers';

const app = createApp();

describe('Ticket search and filter', () => {
  let token: string;

  beforeEach(async () => {
    const { priya, arjun } = await seedTestUsers();
    const auth = await loginAs(app, Role.agent, priya.email);
    token = auth.token;

    await createTestTicket({
      title: 'Login page throws 500 error on submit',
      description: 'Login fails after submit',
      priority: Priority.critical,
      status: Status.open,
      createdById: priya.id,
    });

    await createTestTicket({
      title: 'Export to CSV missing last column',
      description: 'CSV export truncates the last field',
      priority: Priority.high,
      status: Status.in_progress,
      createdById: priya.id,
      assignedToId: arjun.id,
    });
  });

  it('filters tickets by search keyword', async () => {
    const response = await request(app)
      .get('/api/tickets?search=login')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.tickets).toHaveLength(1);
    expect(response.body.tickets[0].title).toContain('Login');
  });

  it('filters tickets by status', async () => {
    const response = await request(app)
      .get('/api/tickets?status=open')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.tickets).toHaveLength(1);
    expect(response.body.tickets[0].status).toBe('open');
  });

  it('combines search and status filters', async () => {
    const response = await request(app)
      .get('/api/tickets?search=export&status=in_progress')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.tickets).toHaveLength(1);
    expect(response.body.tickets[0].title).toContain('Export');
  });

  it('returns empty array when no matches are found', async () => {
    const response = await request(app)
      .get('/api/tickets?search=onboarding')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.tickets).toEqual([]);
  });

  it('rejects invalid status query value', async () => {
    const response = await request(app)
      .get('/api/tickets?status=invalid')
      .set(authHeader(token));

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('VALIDATION_ERROR');
  });
});
