const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db/prisma');

const router = express.Router();
const COST_FACTOR = Math.min(14, Math.max(10, Number.parseInt(process.env.BCRYPT_COST || '12', 10) || 12));
const INVALID_CREDENTIALS = {
  error: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
  },
};

// A valid precomputed bcrypt hash keeps the missing-account path doing
// comparable work to the wrong-password path. It contains no real credential.
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.8Wj0P7VqVfYqG5l8ZxQ4Q0p3b7w8J6uK';

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function isUniqueConstraintError(error) {
  return error && error.code === 'P2002';
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (![name, email, password].every(isNonEmptyString)) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Name, email, and password are required' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    if (!normalizedName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Provide a valid name and email address' },
      });
    }

    // The unique database constraint is authoritative; this pre-check gives
    // the expected 409 response for the common duplicate case.
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' },
      });
    }

    const passwordHash = await bcrypt.hash(password, COST_FACTOR);
    const user = await prisma.user.create({
      data: { name: normalizedName, email: normalizedEmail, passwordHash },
      select: { id: true, name: true, email: true },
    });

    return res.status(201).json({ data: publicUser(user) });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return res.status(409).json({
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' },
      });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Email and password are required' },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Provide a valid email address' },
      });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
    const passwordMatches = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordMatches) {
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    return res.status(200).json({ data: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
