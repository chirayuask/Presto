# Database Schema

Four normalized tables, all in PostgreSQL. Designed for:

- **Charger-specific pricing** — every charger can have its own schedule
- **Pricing versioning** — multiple schedules per charger, one active at a time
- **Timezone correctness** — timezone lives on the station, inherited by chargers
- **Full-day coverage** — periods tile [00:00, 24:00) with no gaps or overlaps

---

## ER Diagram

```
                      ┌──────────────────────┐
                      │      stations        │
                      │──────────────────────│
                      │  id          PK      │
                      │  name                │
                      │  address             │
                      │  timezone  (IANA)    │
                      └──────────┬───────────┘
                                 │ 1:N
                                 ▼
                      ┌──────────────────────┐
                      │      chargers        │
                      │──────────────────────│
                      │  id          PK      │
                      │  station_id  FK      │
                      │  serial_number UQ    │
                      │  label               │
                      │  connector_type      │
                      │  power_kw            │
                      └──────────┬───────────┘
                                 │ 1:N
                                 ▼
                      ┌──────────────────────┐
                      │  pricing_schedules   │
                      │──────────────────────│
                      │  id          PK      │
                      │  charger_id  FK      │
                      │  name                │
                      │  currency            │
                      │  effective_from      │
                      │  is_active           │
                      └──────────┬───────────┘
                                 │ 1:N
                                 ▼
                      ┌──────────────────────┐
                      │  pricing_periods     │
                      │──────────────────────│
                      │  id          PK      │
                      │  schedule_id FK      │
                      │  start_time  TIME    │
                      │  end_time    TIME    │
                      │  price_per_kwh       │
                      │  UQ(schedule_id,     │
                      │     start_time)      │
                      └──────────────────────┘
```

Cascade rule: deleting a station cascades through chargers → schedules → periods.

---

## Tables

### `stations`

Physical locations that host one or more chargers.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` (PK) | `gen_random_uuid()` default |
| `name` | `VARCHAR(200)` NOT NULL | Display name |
| `address` | `VARCHAR(500)` | Free-form |
| `timezone` | `VARCHAR(64)` NOT NULL | **IANA zone** (e.g. `Asia/Kolkata`). Drives all TOU time math for chargers at this station. |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | Auto-managed |

**Indexes:** `(timezone)` for timezone-filtered admin queries.

### `chargers`

Individual EV charging endpoints.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` (PK) | |
| `station_id` | `UUID` (FK → stations, ON DELETE CASCADE) | |
| `serial_number` | `VARCHAR(100)` UNIQUE NOT NULL | Operator-assigned identifier |
| `label` | `VARCHAR(200)` | Human-friendly (e.g. "Bay 1") |
| `connector_type` | `VARCHAR(50)` | e.g. "CCS2", "CHAdeMO" |
| `power_kw` | `DECIMAL(6,2)` | Rated power, e.g. 150.00 |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | |

**Indexes:** `(station_id)`.

### `pricing_schedules`

A pricing plan bound to one charger. Enables versioning and future-dating.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` (PK) | |
| `charger_id` | `UUID` (FK → chargers, ON DELETE CASCADE) | |
| `name` | `VARCHAR(200)` | e.g. "Summer 2026" |
| `currency` | `CHAR(3)` NOT NULL DEFAULT `'USD'` | ISO 4217 |
| `effective_from` | `DATE` NOT NULL | Earliest date this schedule applies |
| `is_active` | `BOOLEAN` NOT NULL DEFAULT `true` | Only one `is_active=true` per charger at a time (enforced in service layer) |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | |

**Indexes:** `(charger_id)`, `(charger_id, is_active)`, `(effective_from)`.

**Invariant:** when a new schedule is created with `isActive=true`, the service transactionally sets any previously-active schedule on the same charger to `isActive=false`.

### `pricing_periods`

Time-of-day price slices within a schedule.

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID` (PK) | |
| `schedule_id` | `UUID` (FK → pricing_schedules, ON DELETE CASCADE) | |
| `start_time` | `TIME` NOT NULL | e.g. `14:00` |
| `end_time` | `TIME` NOT NULL | If `end_time <= start_time`, period wraps past midnight |
| `price_per_kwh` | `DECIMAL(10,4)` NOT NULL | CHECK ≥ 0 |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | |

**Indexes:** `(schedule_id)`, UNIQUE `(schedule_id, start_time)`.

**Constraint:** `CHECK (price_per_kwh >= 0)`.

---

## Period semantics

A schedule's periods must **tile the full 24-hour day** with no gaps and no overlaps.

- `start_time` is **inclusive**, `end_time` is **exclusive**.
- `end_time = '00:00'` represents midnight-end-of-day (minute 1440).
- A period with `end_time <= start_time` wraps past midnight. Example: `22:00 → 00:00` covers 22:00, 23:00.
- **At most one** period in a schedule may wrap.

All of this is enforced in [`backend/src/utils/periodValidation.js`](../backend/src/utils/periodValidation.js) before any write to `pricing_periods`.

---

## Why this shape?

- **Four tables over one denormalized JSON blob** — normalization lets you query "all chargers paying > X during peak hours" with standard SQL, keeps updates atomic, and enforces integrity at the DB level.
- **`pricing_schedules` layer** — decouples charger identity from pricing over time. You can preview, version, roll back, and future-date schedules without touching charger records.
- **Native `TIME` columns** — purpose-built in Postgres. The midnight-wrap convention is a single rule the service layer enforces, and it avoids the ambiguity of `TIME` being `00:00:00`–`23:59:59.999`.
- **Timezone on stations, not chargers** — chargers at the same station share a zone by definition. Inheritance simplifies the data model.
- **`DECIMAL(10,4)` for price** — exact money math. Never use `FLOAT` for billing.
