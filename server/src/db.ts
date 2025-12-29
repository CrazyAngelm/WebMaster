// 📁 server/src/db.ts - Prisma Client instance
// 🎯 Core function: Exports a singleton Prisma client for database access
// 🔗 Key dependencies: @prisma/client
// 💡 Usage: Imported by controllers to interact with the database

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

