// This module is the only owner of post storage and ID generation.
// When storage moves to Prisma, this implementation changes; the repository
// contract and the service/controller behavior stay the same.
const posts = new Map([
  [1, { id: 1, title: 'First post', body: 'Repository boundaries protect change.', authorId: 7 }],
  [2, { id: 2, title: 'Second post', body: 'Services should speak in domain language.', authorId: 8 }],
]);

let nextId = 3;

function findAll() {
  return Array.from(posts.values(), (post) => ({ ...post }));
}

function findById(id) {
  return posts.get(Number(id)) || null;
}

function create(fields) {
  const record = { id: nextId++, ...fields };
  posts.set(record.id, record);
  return record;
}

function update(id, patch) {
  const record = findById(id);
  if (!record) return null;

  const updated = { ...record, ...patch, id: record.id };
  posts.set(record.id, updated);
  return updated;
}

function remove(id) {
  return posts.delete(Number(id));
}

module.exports = { findAll, findById, create, update, remove };
