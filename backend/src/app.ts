import cors from 'cors';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import path from 'path';
import { getCorsOrigin } from './lib/config';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import ticketsRouter from './routes/tickets';
import usersRouter from './routes/users';

function setupSwagger(app: express.Application) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const swaggerUi = require('swagger-ui-express');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { parse } = require('yaml');
    const openApiPath = path.resolve(__dirname, '../openapi.yaml');

    if (fs.existsSync(openApiPath)) {
      const openApiDocument = parse(fs.readFileSync(openApiPath, 'utf8'));
      app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('Swagger setup skipped:', error instanceof Error ? error.message : error);
    }
  }
}

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: getCorsOrigin(),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  setupSwagger(app);

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/tickets', ticketsRouter);

  app.use(errorHandler);

  return app;
}
