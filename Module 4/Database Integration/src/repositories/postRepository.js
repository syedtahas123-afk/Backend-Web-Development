const prisma = require('../db/prisma');

function databaseError(error) {
  // Translate database failures into safe application errors at the boundary.
  if (error && error.code === 'P2002') {
    const conflict = new Error('A record with those unique values already exists');
    conflict.statusCode = 409;
    return conflict;
  }
  if (error && (error.code === 'P2003' || error.code === 'P2014')) {
    const invalidRelation = new Error('A referenced record does not exist or the relationship is invalid');
    invalidRelation.statusCode = 422;
    return invalidRelation;
  }
  if (error && error.code === 'P2025') return null;
  return error;
}

async function withDatabaseErrors(operation) {
  try {
    return await operation();
  } catch (error) {
    const mapped = databaseError(error);
    if (mapped === null) return null;
    throw mapped;
  }
}

async function findAll() {
  return withDatabaseErrors(() => prisma.post.findMany({ orderBy: { id: 'asc' } }));
}

async function findById(id) {
  return withDatabaseErrors(() => prisma.post.findUnique({ where: { id: Number(id) } }));
}

async function create(fields) {
  return withDatabaseErrors(() => prisma.post.create({
    data: {
      title: fields.title,
      body: fields.body || '',
      authorId: fields.authorId === undefined ? undefined : Number(fields.authorId),
    },
  }));
}

async function update(id, patch) {
  return withDatabaseErrors(async () => {
    const existing = await prisma.post.findUnique({ where: { id: Number(id) } });
    if (!existing) return null;

    try {
      return await prisma.post.update({
        where: { id: Number(id) },
        data: {
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.body !== undefined ? { body: patch.body } : {}),
        },
      });
    } catch (error) {
      if (error && error.code === 'P2025') return null;
      throw error;
    }
  });
}

async function remove(id) {
  return withDatabaseErrors(async () => {
    const result = await prisma.post.deleteMany({ where: { id: Number(id) } });
    return result.count > 0;
  });
}

module.exports = { findAll, findById, create, update, remove };
