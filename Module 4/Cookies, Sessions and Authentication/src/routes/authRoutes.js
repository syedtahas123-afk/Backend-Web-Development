const crypto = require('node:crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const sessionStore = require('../session/sessionStore');
const requireSession = require('../middleware/requireSession');

const router = express.Router();
const SESSION_TTL_MS = Number.parseInt(process.env.SESSION_TTL_MS || '3600000', 10);
const COOKIE_NAME = 'sid';

if (!Number.isSafeInteger(SESSION_TTL_MS) || SESSION_TTL_MS <= 0) {
  throw new Error('SESSION_TTL_MS must be a positive integer');
}

const cookieOptions = {
  httpOnly: true,
  signed: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
  path: '/',
  maxAge: SESSION_TTL_MS,
};

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function clearCookieOptions() {
  const { maxAge, ...options } = cookieOptions;
  return options;
}

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password || email.length > 254 || password.length > 1024) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'A valid email and password are required' },
      });
    }

    const user = await userRepository.findByEmail(email);
    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await sessionStore.create(sessionId, { userId: user.id, expiresAt });

    res.cookie(COOKIE_NAME, sessionId, cookieOptions);
    return res.status(200).json({ data: { user: safeUser(user) } });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireSession, (req, res) => {
  res.status(200).json({ data: { user: req.user } });
});

router.post('/logout', async (req, res, next) => {
  try {
    const sessionId = req.signedCookies?.[COOKIE_NAME];
    if (typeof sessionId === 'string' && sessionId.length > 0) {
      await sessionStore.destroy(sessionId);
    }

    res.clearCookie(COOKIE_NAME, clearCookieOptions());
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
