import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  { name: 'Priya Sharma', email: 'priya.sharma@supportdesk.local', role: Role.agent },
  { name: 'Arjun Mehta', email: 'arjun.mehta@supportdesk.local', role: Role.agent },
  { name: 'Rohan Das', email: 'rohan.das@supportdesk.local', role: Role.agent },
  { name: 'Admin User', email: 'admin@supportdesk.local', role: Role.admin },
  { name: 'Viewer User', email: 'viewer@supportdesk.local', role: Role.viewer },
];

async function main() {
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (!defaultPassword) {
    throw new Error('SEED_DEFAULT_PASSWORD environment variable is required for seeding');
  }

  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        isActive: true,
      },
      create: {
        ...user,
        passwordHash,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${users.length} users`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
