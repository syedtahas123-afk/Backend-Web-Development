const bcrypt = require('bcryptjs');
const users = require('../repositories/userRepository');

const COST_FACTOR = Math.min(14, Math.max(10, Number.parseInt(process.env.BCRYPT_COST || '12', 10) || 12));
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGva5v3d7wV1x7j7eK';

class AuthError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const invalidCredentials = () => new AuthError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

async function register({ name, email, password }) {
  if (![name, email, password].every(nonEmpty)) {
    throw new AuthError(400, 'INVALID_INPUT', 'Name, email, and password are required');
  }
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedName || !validEmail(normalizedEmail)) {
    throw new AuthError(400, 'INVALID_INPUT', 'Provide a valid name and email address');
  }
  if (await users.findByEmail(normalizedEmail)) {
    throw new AuthError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  }
  const passwordHash = await bcrypt.hash(password, COST_FACTOR);
  const user = await users.create({ name: normalizedName, email: normalizedEmail, passwordHash });
  return publicUser(user);
}

async function login({ email, password }) {
  if (!nonEmpty(email) || !nonEmpty(password)) {
    throw new AuthError(400, 'INVALID_INPUT', 'Email and password are required');
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!validEmail(normalizedEmail)) {
    throw new AuthError(400, 'INVALID_INPUT', 'Provide a valid email address');
  }
  const user = await users.findByEmail(normalizedEmail);
  const matches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !matches) throw invalidCredentials();
  return publicUser(user);
}

module.exports = { register, login, AuthError, invalidCredentials };
