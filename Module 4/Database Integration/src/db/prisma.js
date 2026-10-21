require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// A single client owns the connection pool for this application process.
const prisma = new PrismaClient();

module.exports = prisma;
