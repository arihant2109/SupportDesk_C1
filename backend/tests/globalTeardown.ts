import { prisma } from '../src/lib/prisma';

export default async function globalTeardown() {
  await prisma.$disconnect();
}
