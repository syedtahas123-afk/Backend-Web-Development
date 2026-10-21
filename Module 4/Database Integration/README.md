# Database Integration

Replace the in-memory post repository with PostgreSQL through Prisma while keeping the API contract behind the repository boundary.

## Setup

1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database you control. Never commit `.env` or real credentials.
3. Format and validate the schema, generate Prisma Client, and apply the migration:

   ```bash
   npm run prisma:format
   npm run prisma:validate
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   npm start
   ```

For an already provisioned database/CI deployment, use `npm run prisma:deploy` instead of `prisma:migrate`. Seed data is repeatable and is intended for local development only.

## API

- `GET /posts`
- `GET /posts/:id`
- `POST /posts` (requires `title` and a valid `authorId`)
- `PATCH /posts/:id`
- `DELETE /posts/:id`

Responses retain the existing `{ data }` shape and not-found status. Constraint failures return safe application messages; raw database details are not exposed.
