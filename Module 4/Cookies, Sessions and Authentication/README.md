# LU48 Starter — Session Authentication

This exercise implements cookie-based sessions with Express, Prisma, and SQLite.

## Setup

Run these commands from this assignment directory:

```bash
cp .env.example .env
npm install
npm run setup
npm run dev
```

Set `COOKIE_SECRET` in `.env` to a unique random value of at least 32 characters. Keep `COOKIE_SECURE=false` for local HTTP development. In production, serve the app over HTTPS and set `NODE_ENV=production` and `COOKIE_SECURE=true`. Never commit `.env`.

Seeded demo account: `sam@example.com` / `SessionDemo!48`.

## Endpoints

- `POST /auth/login` — accepts JSON `{ "email": "...", "password": "..." }`; verifies the password with bcrypt, creates a random opaque server-side session, sets a signed `sid` cookie, and returns safe user fields.
- `GET /auth/me` — returns the authenticated user's safe identity after validating the signed cookie and live server-side session.
- `POST /auth/logout` — destroys the server-side session, clears the cookie, and returns `204 No Content`. Repeated logout calls are safe.

All unauthenticated or expired-session requests to `GET /auth/me` receive a generic `401`. Login uses the same generic `401` for an unknown email and a wrong password. Password hashes and session IDs are never returned in JSON.

## Verify with curl

In a second terminal, from this directory:

```bash
# Log in and save the signed cookie.
curl -i -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"sam@example.com","password":"SessionDemo!48"}' \
  http://localhost:3000/auth/login

# Reuse the cookie to fetch the current identity.
curl -i -b cookies.txt http://localhost:3000/auth/me

# Log out and clear the saved cookie.
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/auth/logout

# The previous session should no longer authenticate.
curl -i -b cookies.txt http://localhost:3000/auth/me
```

You can also use Postman with its cookie jar enabled.

## Session storage note

The session store is an in-memory `Map` for this local learning exercise. It removes expired sessions during reads and stores only the user ID and expiry. Sessions are lost when the process restarts and are not shared across multiple app instances. For production, replace it with a shared expiring store such as Redis, use HTTPS, and keep the cookie signing secret in a proper secret manager.
