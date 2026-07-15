import { Role, Status } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { idParamSchema } from '../schemas/commonSchemas';
import {
  createCommentSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  transitionsQuerySchema,
  updateStatusSchema,
  updateTicketSchema,
} from '../schemas/ticketSchemas';
import { getValidNextStatuses } from '../services/stateMachine';
import {
  addComment,
  createTicket,
  getTicketById,
  listTickets,
  updateTicket,
  updateTicketStatus,
} from '../services/ticketService';
import { getParamId } from '../utils/params';

const ticketsRouter = Router();

const readRoles = [Role.admin, Role.agent, Role.viewer] as Role[];
const writeRoles = [Role.admin, Role.agent] as Role[];

ticketsRouter.use(authenticate);

ticketsRouter.get(
  '/',
  requireRole(...readRoles),
  validate(listTicketsQuerySchema, 'query'),
  async (req, res, next) => {
    try {
      const result = await listTickets(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

ticketsRouter.get(
  '/transitions',
  requireRole(...readRoles),
  validate(transitionsQuerySchema, 'query'),
  async (req, res) => {
    const { status } = req.query as { status: Status };
    res.json({ transitions: getValidNextStatuses(status) });
  }
);

ticketsRouter.post(
  '/',
  requireRole(...writeRoles),
  validate(createTicketSchema),
  async (req, res, next) => {
    try {
      const ticket = await createTicket(req.body, req.user!.id);
      res.status(201).json(ticket);
    } catch (error) {
      next(error);
    }
  }
);

ticketsRouter.get(
  '/:id',
  requireRole(...readRoles),
  validate(idParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const ticket = await getTicketById(getParamId(req.params.id));
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }
);

ticketsRouter.patch(
  '/:id',
  requireRole(...writeRoles),
  validate(idParamSchema, 'params'),
  validate(updateTicketSchema),
  async (req, res, next) => {
    try {
      const ticket = await updateTicket(getParamId(req.params.id), req.body);
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }
);

ticketsRouter.patch(
  '/:id/status',
  requireRole(...writeRoles),
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema),
  async (req, res, next) => {
    try {
      const ticket = await updateTicketStatus(
        getParamId(req.params.id),
        req.body,
        req.user!.id
      );
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }
);

ticketsRouter.post(
  '/:id/comments',
  requireRole(...writeRoles),
  validate(idParamSchema, 'params'),
  validate(createCommentSchema),
  async (req, res, next) => {
    try {
      const comment = await addComment(
        getParamId(req.params.id),
        req.body,
        req.user!.id
      );
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }
);

export default ticketsRouter;
