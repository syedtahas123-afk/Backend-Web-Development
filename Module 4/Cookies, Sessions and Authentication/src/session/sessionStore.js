// Learning-only store. Use a shared expiring store (for example Redis) in production.
const sessions = new Map();

async function create(sessionId, { userId, expiresAt }) {
  if (typeof sessionId !== 'string' || !sessionId || !Number.isInteger(userId)) {
    throw new TypeError('A session id and valid user id are required');
  }

  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
    throw new TypeError('Session expiry must be in the future');
  }

  sessions.set(sessionId, { userId, expiresAt: expiry });
}

async function get(sessionId) {
  if (typeof sessionId !== 'string' || !sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }

  return { userId: session.userId, expiresAt: session.expiresAt };
}

async function destroy(sessionId) {
  if (typeof sessionId === 'string' && sessionId) {
    sessions.delete(sessionId);
  }
}

module.exports = { create, get, destroy };
