import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';
import { validate } from '../middleware/validate';
import { idParamSchema } from '../schemas/commonSchemas';
import { createUserSchema, updateUserSchema } from '../schemas/userSchemas';
import {
  createUser,
  deactivateUser,
  listAllUsersForAdmin,
  listUsers,
  updateUser,
} from '../services/userService';
import { getParamId } from '../utils/params';

const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get('/', async (req, res, next) => {
  try {
    if (req.user!.role === Role.admin) {
      const users = await listAllUsersForAdmin();
      res.json(users);
      return;
    }

    const users = await listUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.post(
  '/',
  requireRole(Role.admin),
  validate(createUserSchema),
  async (req, res, next) => {
    try {
      const user = await createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.patch(
  '/:id',
  requireRole(Role.admin),
  validate(idParamSchema, 'params'),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const user = await updateUser(getParamId(req.params.id), req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

usersRouter.delete(
  '/:id',
  requireRole(Role.admin),
  validate(idParamSchema, 'params'),
  async (req, res, next) => {
    try {
      const user = await deactivateUser(getParamId(req.params.id), req.user!.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

export default usersRouter;
