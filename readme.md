# Presto TOU Pricing API

> A full-stack Time-of-Use (TOU) pricing system for EV chargers — backend API, admin dashboard, and customer-facing price lookup.

**Assignment:** Design a schema + REST API to store and expose TOU pricing per individual EV charger, with support for timezones and bulk updates.

**Scope delivered:** Everything in the assignment, both optional bonuses (timezones + bulk updates), *plus* a polished admin dashboard and a customer-facing web app.

---

## What's inside

| Tier | Stack | Port |
|---|---|---|
| **Backend API** | Node.js 22 (ESM) · Express 5 · Sequelize · Postgres 16 · Zod · Luxon · Pino | `4000` |
| **Admin Dashboard** | React 18 · Vite · TypeScript · Tailwind · shadcn-style UI · TanStack Query · Recharts · Framer Motion · cmdk | `5173` |
| **Customer App** | React 18 · Vite · TypeScript · Tailwind · TanStack Query · Recharts · Framer Motion | `5174` |

---

## Repository layout

```
Presto/
├── backend/            # Node.js + Express + Sequelize API
│   ├── src/
│   │   ├── routes/         # Express routers
│   │   ├── controllers/    # Request/response handling
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access
│   │   ├── models/         # Sequelize models
│   │   ├── middleware/     # Error handler, validator
│   │   ├── utils/          # time/timezone + period validation
│   │   ├── validators/     # Zod schemas
│   │   └── server.js
│   ├── migrations/
│   ├── seeders/
│   └── tests/              # Jest + Supertest (43 tests)
├── admin-dashboard/    # React admin UI
├── customer-app/       # React customer-facing UI
├── docs/
│   ├── schema.md           # DB schema + ER diagram
│   ├── api.md              # Full endpoint contracts
│   └── design-decisions.md # Why these choices
├── postman/
│   └── presto-tou.postman_collection.json
└── README.md
```

---

## Quickstart (local, no Docker)

**Requirements:** Node.js ≥ 22, PostgreSQL ≥ 14.

### 1. Backend

```bash
cd backend
npm install

# Create the database (one-time)
createdb presto_tou

# Configure connection (edit if your Postgres setup differs)
cp .env.example .env

# Run migrations + seed demo data
npm run db:reset

# Start the API
npm start
# → http://localhost:4000
```

Verify with:
```bash
curl http://localhost:4000/api/v1/health
# {"status":"ok","checks":{"database":"up"},...}
```

### 2. Admin dashboard

```bash
cd admin-dashboard
npm install
npm run dev
# → http://localhost:5173
```

The dashboard proxies `/api` → `http://localhost:4000` automatically (see `vite.config.ts`).

### 3. Customer app

```bash
cd customer-app
npm install
npm run dev
# → http://localhost:5174
```

---

## What you can do

### Customer app (`:5174`)
- Pick any charger, see its **current price** with timezone-correct math
- Pick a custom datetime to see what the price *will be* then
- View today's full 24-hour pricing curve with the current time marked

### Admin dashboard (`:5173`)
- **Stations** — create/edit/delete with IANA timezone picker
- **Chargers** — grouped by station, full CRUD
- **Pricing Schedules** — the hero flow:
  - Visual 24h timeline bar colored by price tier
  - Live Recharts curve that updates as you edit periods
  - Gap/overlap/coverage validation with inline error messages
  - Schedule history: activate, deactivate, clone, delete
- **Bulk Operations** — 4-step wizard to apply one schedule to many chargers with per-charger success/failure reporting
- `Cmd+K` command palette · dark/light toggle · live API health indicator

---

## Seeded demo data

Running `npm run db:reset` in `backend/` creates:

| Station | Timezone | Currency | Chargers |
|---|---|---|---|
| Bandra Kurla EV Hub | `Asia/Kolkata` | INR | 3 |
| Venice Beach Supercharge | `America/Los_Angeles` | USD | 3 |
| Kings Cross FastCharge | `Europe/London` | GBP | 3 |
| Darling Harbour ChargePoint | `Australia/Sydney` | AUD | 3 |

Each charger has the exact **7-period schedule** from the assignment PDF, scaled by a regional multiplier so you can see price variation across stations.

---

## Testing

```bash
cd backend
npm test
# → 43/43 tests passing across 4 suites
```

Covers unit tests (time math, period validation), pricing endpoint integration, admin CRUD, and bulk operations (full / partial / total failure paths).

---

## Key design decisions (quick version)

> Full rationale: [`docs/design-decisions.md`](docs/design-decisions.md)

- **Postgres, not Mongo** — the assignment explicitly asks for a relational, normalized schema; TOU data is inherently relational; billing needs exact decimals + referential integrity.
- **Native `TIME` type** — with the convention that `end ≤ start` means "wraps past midnight," enforced in service-layer validation.
- **Pricing schedules layer** — decouples charger identity from pricing history. Lets you version pricing, future-date new rates, and keep audit trail.
- **Timezones live on stations** — TOU is about *local* time-of-day behavior. Timezone stored as IANA string, all conversions via Luxon.
- **Bulk = per-charger transactions + best-effort report** — one bad charger doesn't poison the whole batch. Response includes `succeeded[]` and `failed[]` so operators know exactly what happened.

---

## Documentation

- [`docs/schema.md`](docs/schema.md) — database schema, ER diagram, field-by-field reference
- [`docs/api.md`](docs/api.md) — every endpoint with request/response contracts and curl examples
- [`docs/design-decisions.md`](docs/design-decisions.md) — architectural rationale
- [`postman/presto-tou.postman_collection.json`](postman/presto-tou.postman_collection.json) — importable Postman collection

---

## License

Built as a take-home exercise for Presto, 2026.
