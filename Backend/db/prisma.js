// Prisma client singleton for PostgreSQL connection
const { PrismaClient } = require('@prisma/client');

// Prisma Client with connection pooling and query logging
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;

