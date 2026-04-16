# Presto TOU Backend

Node.js 22 (ESM) + Express 5 + Sequelize + Postgres.

## Setup

```bash
# 1. Install deps
npm install

# 2. Configure
cp .env.example .env
# Edit .env if your Postgres setup differs

# 3. Create the database
createdb presto_tou

# 4. Run migrations + seed demo data
npm run db:reset

# 5. Start the server
npm start
# → http://localhost:4000
```

## Scripts

| Script | Purpose |
|---|---|
| `npm start` | Start production server |
| `npm run dev` | Start with `node --watch` for auto-restart |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Load seed data |
| `npm run db:reset` | Drop all, re-migrate, re-seed |
| `npm test` | Run Jest test suite (43 tests) |

## Environment variables

See `.env.example`:

| Var | Default | Notes |
|---|---|---|
| `PORT` | `4000` | HTTP port |
| `DB_HOST` | `localhost` | |
| `DB_PORT` | `5432` | |
| `DB_NAME` | `presto_tou` | |
| `DB_USER` | — | Your Postgres role |
| `DB_PASSWORD` | — | Leave blank for trust auth |
| `LOG_LEVEL` | `info` | `silent`, `error`, `warn`, `info`, `debug` |

## Layout

```
src/
├── routes/           # Express routers
├── controllers/      # req/res → service
├── services/         # Business logic
├── repositories/     # Data access helpers
├── models/           # Sequelize models
├── middleware/       # Error handler, Zod validator
├── utils/            # time.js (timezone), periodValidation.js, logger.js
├── validators/       # Zod schemas for each endpoint
├── config/           # Sequelize DB config (.js + .cjs for CLI)
├── app.js            # Express app factory
└── server.js         # Bootstrap
```

## Testing

```bash
# Create the test DB (one-time)
createdb presto_tou_test
psql -d presto_tou_test -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'

# Run tests
npm test
```

Test suites:

- `tests/time.test.js` — pure unit tests for time/timezone/period helpers
- `tests/pricing.integration.test.js` — customer endpoints (GET current, GET schedule)
- `tests/admin.integration.test.js` — stations, chargers, schedules CRUD
- `tests/bulk.integration.test.js` — bulk apply with success/failure mixes

## API reference

See [`../docs/api.md`](../docs/api.md) for full endpoint contracts.

Quick smoke test:

```bash
# Health
curl http://localhost:4000/api/v1/health

# List chargers
curl http://localhost:4000/api/v1/chargers

# Current price for a charger
CHARGER_ID=$(psql -d presto_tou -tAc "SELECT id FROM chargers LIMIT 1")
curl "http://localhost:4000/api/v1/chargers/$CHARGER_ID/pricing/current"
```
