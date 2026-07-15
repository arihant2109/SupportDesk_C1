import dotenv from 'dotenv';
import { createApp } from './app';
import { validateConfig } from './lib/config';
import { prisma } from './lib/prisma';

dotenv.config();
validateConfig();

const app = createApp();
const port = Number(process.env.PORT) || 3001;

const server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
