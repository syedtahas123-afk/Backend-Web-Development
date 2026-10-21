require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Upserts make this seed safe to run repeatedly against a development database.
  await prisma.user.upsert({
    where: { id: 1 },
    update: { name: 'Community Demo User' },
    create: { id: 1, name: 'Community Demo User' },
  });

  await prisma.post.upsert({
    where: { id: 1 },
    update: { title: 'First post', body: 'The contract survives storage changes.', authorId: 1 },
    create: { id: 1, title: 'First post', body: 'The contract survives storage changes.', authorId: 1 },
  });
  await prisma.post.upsert({
    where: { id: 2 },
    update: { title: 'Second post', body: 'Migrations record database design.', authorId: 1 },
    create: { id: 2, title: 'Second post', body: 'Migrations record database design.', authorId: 1 },
  });

  // Explicit seed IDs must advance serial sequences to avoid collisions on later inserts.
  await prisma.$queryRaw`SELECT setval(pg_get_serial_sequence('"User"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "User"), 1), true)`;
  await prisma.$queryRaw`SELECT setval(pg_get_serial_sequence('"Post"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Post"), 1), true)`;
}

main()
  .catch(() => {
    console.error('Database seed failed. Check the database connection and migration status.');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
