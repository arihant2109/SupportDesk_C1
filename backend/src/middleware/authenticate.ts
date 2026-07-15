import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { getUserById, verifyToken } from '../services/authService';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const token = header.slice('Bearer '.length);
    const payload = verifyToken(token);
    const user = await getUserById(payload.id);

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
