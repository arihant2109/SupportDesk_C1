import jwt from 'jsonwebtoken';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

export function validateConfig(): void {
  requireEnv('JWT_SECRET');

  const expiresIn = process.env.JWT_EXPIRES_IN ?? '24h';
  try {
    jwt.sign({ test: true }, 'test-secret', { expiresIn } as jwt.SignOptions);
  } catch {
    throw new Error('JWT_EXPIRES_IN environment variable is invalid');
  }
}

export function getCorsOrigin(): string {
  return process.env.CORS_ORIGIN ?? 'http://localhost:3000';
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN ?? '24h';
}
