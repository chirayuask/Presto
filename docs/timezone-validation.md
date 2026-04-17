# Timezone Validation Guide

The assignment's first optional bonus asks how this system handles chargers across different timezones. This doc proves it works, and gives you copy-paste commands to verify yourself.

---

## How it works (short version)

1. **Each station stores an IANA timezone** (e.g. `Asia/Kolkata`) — not a fixed offset. This is important: IANA zones automatically handle daylight-saving transitions.
2. **Chargers inherit the timezone** from their station.
3. **When you query a price**:
   - The API receives a UTC instant (either from `?at=<iso>` or "now")
   - Luxon converts that instant into the station's local time
   - The matching pricing period is looked up against the local time-of-day
   - The response includes both the UTC-reconciled `queriedAt` and the computed `localTime` so the client can display consistently

The critical insight: **TOU pricing is about the driver's local time-of-day behavior, not UTC.** "Peak at 6pm" means 6pm where the station is, regardless of where the API request came from.

---

## Proof by example

The seed data has 4 stations in 4 different timezones, each with the same 7-period TOU structure. When you hit all four with the **same UTC instant**, you get **four different local times** and **four different prices**:

### TEST 1 — Same UTC instant, different timezones

`UTC = 2026-04-17T10:00:00Z`

| Station | Timezone | Local time | Active period | Price |
|---|---|---|---|---|
| Bandra Kurla EV Hub | `Asia/Kolkata` | **15:30** | 14:00–18:00 | 0.285 INR (peak) |
| Venice Beach Supercharge | `America/Los_Angeles` | **03:00** | 00:00–06:00 | 0.2565 USD (off-peak) |
| Kings Cross FastCharge | `Europe/London` | **11:00** | 06:00–12:00 | 0.304 GBP (morning) |
| Darling Harbour ChargePoint | `Australia/Sydney` | **20:00** | 20:00–22:00 | 0.247 AUD (evening) |

Same instant in time → four different customer experiences, each correct for their location.

### TEST 2 — Same charger, UTC instants through a full day

Mumbai charger (`Asia/Kolkata`, UTC+5:30):

| UTC instant | Local (IST) | Period | Price |
|---|---|---|---|
| 00:30 Z | 06:00 | 06:00–12:00 | 0.19 INR |
| 05:00 Z | 10:30 | 06:00–12:00 | 0.19 INR |
| 10:00 Z | 15:30 | 14:00–18:00 | 0.285 INR |
| 15:30 Z | 21:00 | 20:00–22:00 | 0.19 INR |
| 18:00 Z | 23:30 | 22:00–00:00 | 0.1425 INR |

### TEST 3 — Midnight-wrap edge case

At **23:30 local in Mumbai**, the system correctly picks the `22:00 → 00:00` period (which wraps past midnight).

### TEST 4 — DST automatic handling

LA at `UTC 2026-07-15T02:00:00Z` → local `19:00`. That's UTC−7, which is **PDT** (daylight saving), not PST. The IANA zone handles this without any calendar logic in the app.

### TEST 5 — Schedule endpoint

`GET /chargers/<sydney-charger>/pricing/schedule?date=2026-04-17` returns the full 24-hour schedule for Sydney's April 17th, including `totalCoverageMinutes: 1440` as a sanity check that the periods tile the full day with no gaps.

---

## How to validate yourself

### Prerequisites

```bash
cd backend
npm run db:reset       # clean seed data
npm start              # in another terminal
```

### Automated test suite

Run the existing Jest tests — three of them are dedicated timezone assertions:

```bash
npm test
```

Look for these names in the output:

- `returns price for instant in station timezone (14:30 IST -> peak)`
- `picks midnight-wrap period at 23:30 local`
- `interprets same UTC instant differently in different timezones`

The third one is the killer test — boots a test DB, creates the same schedule on a Mumbai charger and an LA charger, sends the same UTC instant to both, asserts they return different local times and different prices.

### Manual curl checks

```bash
# Pick any charger from your seed
CHARGER=$(psql -d presto_tou -tAc "SELECT c.id FROM chargers c JOIN stations s ON s.id=c.station_id WHERE s.name LIKE 'Bandra%' LIMIT 1")

# 1. Same UTC instant returns different local times for different stations
#    Just change 'Bandra%' to 'Venice%', 'Kings%', 'Darling%' and re-run.
curl -s "http://localhost:4000/api/v1/chargers/$CHARGER/pricing/current?at=2026-04-17T10:00:00Z" | jq '.data | {timezone, localTime, period}'

# 2. Custom timezone-aware instant
curl -s "http://localhost:4000/api/v1/chargers/$CHARGER/pricing/current?at=2026-04-17T23:30:00%2B05:30" | jq '.data | {localTime, period}'
# → { "localTime": "23:30", "period": { "startTime": "22:00", "endTime": "00:00", ... } }

# 3. DST check: LA in July (PDT = UTC-7)
LA=$(psql -d presto_tou -tAc "SELECT c.id FROM chargers c JOIN stations s ON s.id=c.station_id WHERE s.name LIKE 'Venice%' LIMIT 1")
curl -s "http://localhost:4000/api/v1/chargers/$LA/pricing/current?at=2026-07-15T02:00:00Z" | jq '.data.localTime'
# → "19:00"   (UTC-7, not UTC-8)
```

### Via the admin dashboard

1. Open `http://localhost:5173` → **Pricing Schedules** → pick any charger
2. The right-side drawer shows "Current local time: HH:MM · now paying X"
3. Compare three chargers from three different stations side by side — the local times differ by hours.

### Via the customer app

1. Open `http://localhost:5174`
2. Switch between chargers in the dropdown — the "Local time" on the price card changes per station
3. Switch to **Custom** mode and pick a UTC timestamp — each station converts it to its own local time

---

## Failure modes the system guards against

| Failure mode | How we prevent it |
|---|---|
| Storing a fixed offset instead of an IANA zone | Timezone column validated against `IANAZone.isValidZone()` on create/update. Invalid zones get `400 VALIDATION_ERROR`. |
| Using server TZ instead of station TZ | Period lookup is in `services/pricingService.js:resolveInstantInZone()` — always uses the station's timezone, never the server's. |
| DST transitions breaking peak-hour math | We store IANA zones, never offsets. Luxon handles DST automatically at conversion time. |
| Midnight edge case (period `22:00–00:00`) | `periodContainsMinute()` in `utils/time.js` handles the wrap by checking if `end <= start`, treating `00:00` as minute 1440. Covered by unit tests. |
| Admin entering `UTC+05:30` by habit | The admin UI's timezone picker is a dropdown sourced from `/api/v1/timezones`. You cannot free-type, which prevents invalid/ambiguous offset strings. |

---

## Operational note for the ops team

If you ever need to move a charger between stations with different timezones (e.g. physical relocation), **this is not a UI action** — it requires either:

1. Creating a new charger at the new station with a fresh schedule, deleting the old, or
2. Engineering-assisted schema update with an audit trail

Don't try to "fix" timezone mismatch from the admin UI. Escalate.
