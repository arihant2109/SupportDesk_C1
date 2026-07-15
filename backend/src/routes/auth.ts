import { Router } from 'express';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { loginRateLimit } from '../middleware/loginRateLimit';
import { loginSchema } from '../schemas/authSchemas';
import { login } from '../services/authService';

const authRouter = Router();

authRouter.post('/login', loginRateLimit, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

export default authRouter;
