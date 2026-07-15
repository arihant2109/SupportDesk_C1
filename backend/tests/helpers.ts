import bcrypt from 'bcryptjs';
import { Priority, Role, Status } from '@prisma/client';
import request from 'supertest';
import { Express } from 'express';
import { prisma } from '../src/lib/prisma';

const TEST_PASSWORD = process.env.SEED_DEFAULT_PASSWORD ?? 'ChangeMe123!';

export async function createTestUser(overrides?: {
  name?: string;
  email?: string;
  role?: Role;
  password?: string;
  isActive?: boolean;
}) {
  const passwordHash = await bcrypt.hash(overrides?.password ?? TEST_PASSWORD, 10);

  return prisma.user.create({
    data: {
      name: overrides?.name ?? 'Test User',
      email: overrides?.email ?? `user-${Date.now()}-${Math.random()}@test.local`,
      role: overrides?.role ?? Role.agent,
      passwordHash,
      isActive: overrides?.isActive ?? true,
    },
  });
}

export async function seedTestUsers() {
  const priya = await createTestUser({
    name: 'Priya Sharma',
    email: 'priya@test.local',
    role: Role.agent,
  });

  const arjun = await createTestUser({
    name: 'Arjun Mehta',
    email: 'arjun@test.local',
    role: Role.agent,
  });

  return { priya, arjun };
}

export async function loginAs(
  app: Express,
  role: Role = Role.agent,
  existingEmail?: string
) {
  let user;

  if (existingEmail) {
    user = await prisma.user.findUnique({ where: { email: existingEmail } });
    if (!user) {
      throw new Error(`User not found: ${existingEmail}`);
    }
  } else {
    user = await createTestUser({
      email: `${role}-${Date.now()}@test.local`,
      role,
      name: `${role} user`,
    });
  }

  const response = await request(app).post('/api/auth/login').send({
    email: user.email,
    password: TEST_PASSWORD,
  });

  return {
    user,
    token: response.body.token as string,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function createTestTicket(overrides: {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  createdById: string;
  assignedToId?: string | null;
}) {
  return prisma.ticket.create({
    data: {
      title: overrides.title ?? 'Login page throws 500 error on submit',
      description: overrides.description ?? 'Steps to reproduce the login failure',
      priority: overrides.priority ?? Priority.high,
      status: overrides.status ?? Status.open,
      createdById: overrides.createdById,
      assignedToId: overrides.assignedToId ?? null,
    },
  });
}
