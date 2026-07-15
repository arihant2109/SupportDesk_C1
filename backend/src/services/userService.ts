import { prisma } from '../lib/prisma';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { CreateUserInput, UpdateUserInput } from '../schemas/userSchemas';
import { hashPassword } from './authService';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function listAllUsersForAdmin() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: userSelect,
  });
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existing) {
    throw new ValidationError(['Email already in use']);
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      isActive: true,
    },
    select: userSelect,
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (input.email && input.email.toLowerCase() !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw new ValidationError(['Email already in use']);
    }
  }

  const passwordHash = input.password ? await hashPassword(input.password) : undefined;

  return prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(passwordHash ? { passwordHash } : {}),
    },
    select: userSelect,
  });
}

export async function deactivateUser(id: string, actingUserId: string) {
  if (id === actingUserId) {
    throw new ValidationError(['Cannot deactivate your own account']);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.isActive) {
    return prisma.user.findUniqueOrThrow({
      where: { id },
      select: userSelect,
    });
  }

  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: userSelect,
  });
}

export async function ensureActiveUserExists(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new NotFoundError('User not found');
  }

  return user;
}
