'use strict';
// auth/passport.js — Google OAuth strategy

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { users, nextId } = require('../data');

/**
 * Map a verified Google profile to a local Threadbase user.
 *
 * Lookup order matters: Google's stable subject (profile.id) is the
 * authoritative identity; verified email is only a one-time linking
 * fallback for an existing local account.
 */
async function verifyCallback(accessToken, refreshToken, profile, done) {
  try {
    const googleId = profile.id;
    const email = profile.emails[0].value;

    // 1. Returning OAuth user: match the stable Google subject first.
    let user = users.find((candidate) => candidate.googleId === googleId);
    if (user) return done(null, user);

    // 2. Existing local account: link only when Google verified the email.
    user = users.find((candidate) => candidate.email === email);
    if (user) {
      if (profile._json.email_verified !== true) {
        return done(null, false);
      }

      user.googleId = googleId;
      return done(null, user);
    }

    // 3. New account: assign the lowest privilege by default.
    const newUser = {
      id: nextId(),
      googleId,
      email,
      name: profile.displayName,
      role: 'member',
    };
    users.push(newUser);
    return done(null, newUser);
  } catch (err) {
    return done(err);
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID     || 'test-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
      callbackURL:  '/auth/google/callback',
    },
    verifyCallback,
  ),
);

// verifyCallback is exported so tests can call it directly without a real browser.
module.exports = { passport, verifyCallback };
