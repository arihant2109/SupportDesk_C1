import { Priority, Status } from '@prisma/client';
import { z } from 'zod';

export const prioritySchema = z.nativeEnum(Priority);
export const statusSchema = z.nativeEnum(Status);

export const createTicketSchema = z.object({
  title: z.string().trim().min(3, 'title must be at least 3 characters').max(255),
  description: z.string().trim().min(1, 'description is required').max(10000),
  priority: prioritySchema,
  assignedToId: z.string().uuid('assignedToId must be a valid user id').optional().nullable(),
});

export const updateTicketSchema = z
  .object({
    title: z.string().trim().min(3, 'title must be at least 3 characters').max(255).optional(),
    description: z.string().trim().min(1, 'description is required').max(10000).optional(),
    priority: prioritySchema.optional(),
    assignedToId: z.string().uuid('assignedToId must be a valid user id').nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const updateStatusSchema = z.object({
  status: statusSchema,
});

export const createCommentSchema = z.object({
  message: z.string().trim().min(1, 'message is required').max(5000),
});

export const listTicketsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  assignedToId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(['createdAt', 'updatedAt', 'title', 'priority', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const transitionsQuerySchema = z.object({
  status: statusSchema,
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
