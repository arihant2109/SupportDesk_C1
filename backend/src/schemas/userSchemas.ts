import { Role } from '@prisma/client';
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(100),
  email: z.string().trim().email('email must be valid').max(255),
  password: z.string().min(8, 'password must be at least 8 characters'),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(100).optional(),
    email: z.string().trim().email('email must be valid').max(255).optional(),
    password: z.string().min(8, 'password must be at least 8 characters').optional(),
    role: z.nativeEnum(Role).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
