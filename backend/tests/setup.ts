import { prisma } from '../src/lib/prisma';

beforeEach(async () => {
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
});
