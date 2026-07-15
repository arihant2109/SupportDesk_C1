import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getJwtExpiresIn } from '../lib/config';
import { AppError } from '../errors/AppError';
import { AuthUser } from '../types/express';
import { LoginInput } from '../schemas/authSchemas';

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

// passwordHash is included only for the login check — never returned to callers
const loginSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  passwordHash: true,
} as const;

export function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}
export function signToken(user: AuthUser): string {
  const options: SignOptions = {
    expiresIn: getJwtExpiresIn() as SignOptions['expiresIn'],
  };

  return jwt.sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    options
  );
}
export function verifyToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      sub: string;
      name: string;
      email: string;
      role: Role;
    };

    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: loginSelect,
  });

  if (!user || !user.isActive) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const authUser = toAuthUser(user);
  const token = signToken(authUser);

  return { token, user: authUser };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user || !user.isActive) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  return toAuthUser(user);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
