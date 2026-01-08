import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany();
  console.log('Users in DB:', users.map(u => ({ login: u.login, role: u.role })));
  process.exit(0);
}

checkUsers();
