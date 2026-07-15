import { Prisma, Status } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { InvalidTransitionError, NotFoundError } from '../errors/AppError';
import {
  CreateCommentInput,
  CreateTicketInput,
  ListTicketsQuery,
  UpdateStatusInput,
  UpdateTicketInput,
} from '../schemas/ticketSchemas';
import { canTransition } from './stateMachine';
import { ensureActiveUserExists } from './userService';

const ticketInclude = {
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
    },
  },
};

export async function createTicket(input: CreateTicketInput, userId: string) {
  await ensureActiveUserExists(userId);

  if (input.assignedToId) {
    await ensureActiveUserExists(input.assignedToId);
  }

  return prisma.ticket.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      createdById: userId,
      assignedToId: input.assignedToId ?? null,
    },
    include: ticketInclude,
  });
}

export async function listTickets(query: ListTicketsQuery) {
  const where: Prisma.TicketWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.assignedToId) {
    where.assignedToId = query.assignedToId;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const sortField = query.sort ?? 'createdAt';
  const sortOrder = query.order ?? 'desc';

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total, page, limit };
}

export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: ticketInclude,
  });

  if (!ticket) {
    throw new NotFoundError('Ticket not found');
  }

  return ticket;
}

export async function updateTicket(id: string, input: UpdateTicketInput) {
  await getTicketById(id);

  if (input.assignedToId) {
    await ensureActiveUserExists(input.assignedToId);
  }

  return prisma.ticket.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
    },
    include: ticketInclude,
  });
}

export async function updateTicketStatus(id: string, input: UpdateStatusInput, userId: string) {
  await ensureActiveUserExists(userId);

  const ticket = await getTicketById(id);

  if (!canTransition(ticket.status, input.status)) {
    throw new InvalidTransitionError(ticket.status, input.status);
  }

  return prisma.ticket.update({
    where: { id },
    data: { status: input.status },
    include: ticketInclude,
  });
}

export async function addComment(ticketId: string, input: CreateCommentInput, userId: string) {
  await getTicketById(ticketId);
  await ensureActiveUserExists(userId);

  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: {
        ticketId,
        message: input.message,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await tx.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return comment;
  });
}
