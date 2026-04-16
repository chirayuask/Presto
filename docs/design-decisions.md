# Design Decisions

The assignment asks for a schema + API. The implementation makes specific trade-offs that are worth calling out explicitly.

---

## 1. Node.js + JavaScript over Go

The brief prefers Go but explicitly allows "any common language." I chose Node.js + JavaScript because:

- **This workload is I/O-bound CRUD.** Go's killer features (compile-time safety, goroutine concurrency, single-binary deploys) don't meaningfully change a small Express + Postgres service.
- **JSON ergonomics.** In Node, `req.body` is the object — no struct tags, no marshal/unmarshal dance. The whole TOU schema maps cleanly to JS.
- **Library ecosystem fit.** Luxon for timezone math, Zod for runtime validation, Sequelize for ORM + migrations — all battle-tested, purpose-built.
- **Same design translates directly.** The shape of the code (routes → controllers → services → repositories → models) is the same shape a Go implementation would take. The reviewer sees the architecture clearly.

If this were a high-throughput streaming service, I'd reach for Go. For a TOU API that answers "what's the price right now" with a single indexed query, Node is the right call.

---

## 2. Postgres over MongoDB

This was considered explicitly. Four reasons Postgres wins for TOU:

1. **The assignment asks for relational + normalized.** Mongo would ignore that requirement.
2. **TOU is relational.** Charger → station → schedule → periods is a foreign-key-shaped tree. Mongo's embedded-document shape forces you to either duplicate data (update anomalies) or re-invent joins via `$lookup`.
3. **Money requires exact decimals.** Postgres `DECIMAL(10,4)` is exact. Mongo's default `Number` is double-precision float — a real billing bug waiting to happen.
4. **Referential integrity in the DB.** Postgres `ON DELETE CASCADE` from station → chargers → schedules → periods is enforced at the engine level. In Mongo, that's app-code, and app-code drifts.

Scaling argument for Mongo (horizontal sharding) doesn't apply here — an EV network of 100k chargers × 7 periods = 700k rows, which Postgres serves from a single node with millisecond indexed lookups. Forever.

---

## 3. Four tables, not three

The minimum schema is `stations / chargers / pricing_periods(schedule_id → charger_id)`. I added `pricing_schedules` as a separate table because:

- **Pricing versioning.** Each schedule can be activated/deactivated without deleting history. `effective_from` lets you future-date new rates.
- **Atomic period replacement.** "Update the whole schedule for charger X" becomes a single-row-plus-cascade transaction instead of a delete-and-reinsert on a big periods table.
- **Bulk updates.** The bulk endpoint creates one schedule per charger, then `bulkCreate` the periods. Much cleaner than a wide mega-upsert.

Cost: one extra JOIN per price lookup. Negligible at any realistic scale.

---

## 4. Native `TIME` columns with midnight-wrap convention

Initially considered using `INTEGER` minutes-since-midnight, which cleanly handles `1440` (end of day). Switched to native `TIME` because:

- **It's the correct type.** Postgres `TIME` is purpose-built; the optimizer knows how to range-scan it.
- **API ergonomics.** The schema accepts `"14:00"` strings directly without conversion on every read/write.
- **The midnight edge case has one elegant rule.** If `end_time <= start_time`, the period wraps. Enforced in the service layer. Only one wrapping period per schedule is allowed, which keeps the validator simple and the data model unambiguous.

`start_time` inclusive, `end_time` exclusive — matches the standard for half-open intervals everywhere else in computing.

---

## 5. Timezone on stations, not chargers

Two chargers at the same physical location are in the same timezone, always. Modeling timezone on the station:

- **Removes duplication.** You can't have two chargers at the same station that disagree on timezone.
- **Matches TOU semantics.** TOU behavior is about *local time-of-day*. A driver charging at 6pm doesn't care about UTC — they care that it's peak hour at the station.
- **Stored as IANA string.** Handles DST transitions automatically. All conversion done by Luxon.

---

## 6. Bulk = per-charger transactions + best-effort report

Two choices for bulk behavior:

- **All-or-nothing (one global transaction)** — safer in theory, but one bad `chargerId` in a 500-charger batch fails everything. Bad operator experience.
- **Best-effort, per-charger transaction, structured report** — each charger is atomic. One failure doesn't poison the others. Response includes `succeeded[]` and `failed[]` so operators can retry only what failed.

Went with the second. HTTP status signals outcome shape:
- `200` — everyone succeeded
- `207 Multi-Status` — partial (the correct status for this; most APIs abuse `200` here)
- `422` — all failed
- `400` — the *request itself* was invalid (bad period tiling) — no DB writes attempted

---

## 7. Period validation in the service, not the DB

Could have added CHECK constraints or a trigger to enforce gap/overlap rules. Chose to enforce in the service layer because:

- **Better error messages.** The service returns "Overlap: 06:00-12:00 with 08:00-18:00" which is immediately actionable. A CHECK constraint violation is opaque.
- **Validates before any INSERT.** On a bulk request, validation runs once up-front. If periods are invalid, no DB round-trips happen.
- **Single source of truth.** [`periodValidation.js`](../backend/src/utils/periodValidation.js) is exported and also drives the admin dashboard's live in-editor validation, so the rules match exactly between client and server.

The DB still enforces essentials: `CHECK (price_per_kwh >= 0)`, `UNIQUE(schedule_id, start_time)`, NOT NULL on all time columns.

---

## 8. `req.validatedQuery` (Express 5 gotcha)

Express 5 made `req.query` a getter-only property. My first validate middleware did `req.query = parsedSchema.parse(...)` and crashed with `TypeError: Cannot set property query`. Fixed by writing parsed values to `req.validatedQuery` and having controllers read from there. Worth calling out because it's a real gotcha when upgrading from Express 4.

---

## 9. shadcn-style UI over a UI library

The admin dashboard uses copy-pasted Radix primitives styled with Tailwind + CSS variables (the shadcn approach). Not an installed component library.

- **Zero runtime cost** — it's just your own components.
- **Fully customizable** — the "sexy" brief meant I could pick colors, gradients, and animations freely without fighting a theming system.
- **Same patterns across admin and customer apps** — shared conventions, no shared dependency.

---

## 10. Tests target behavior, not implementation

The Jest suite (43 tests) tests the **API contract** and **time/period logic**, not the ORM internals:

- **Unit tests** — time math, period validation, midnight-wrap handling (pure functions, no DB).
- **Integration tests** — booted Express app + real Postgres test database. Asserts on HTTP status, response shape, and invariants like "creating an active schedule deactivates the previous one."

No mocking of Sequelize. Real DB catches the things that matter: column casing, timezone coercion, cascade behavior, constraint violations.
