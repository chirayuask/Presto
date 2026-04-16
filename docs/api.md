# API Reference

Base URL: `http://localhost:4000/api/v1`

All requests/responses use JSON. All list/get/update responses have the shape:

```json
{ "data": { ... } }  or  { "data": [ ... ] }
```

Error responses:

```json
{ "error": { "code": "STRING_CODE", "message": "human-readable", "details": ... } }
```

Common error codes: `VALIDATION_ERROR` (400), `CHARGER_NOT_FOUND` (404), `STATION_NOT_FOUND` (404), `SCHEDULE_NOT_FOUND` (404), `SCHEDULE_GAP` (409), `INVALID_PERIODS` (400), `INTERNAL_ERROR` (500).

---

## Health

### `GET /health`

```bash
curl http://localhost:4000/api/v1/health
```

```json
{
  "status": "ok",
  "uptimeSeconds": 123,
  "latencyMs": 2,
  "checks": { "database": "up" },
  "timestamp": "2026-04-17T08:30:00.000Z"
}
```

---

## Pricing (customer-facing)

### `GET /chargers/:chargerId/pricing/current`

Get the price that applies **right now** (or at a specified instant) for one charger. Times are resolved in the station's local timezone.

**Query params:**

| Name | Type | Notes |
|---|---|---|
| `at` | ISO-8601 datetime | Optional. Omit for "now". Must include zone offset (`+05:30`) or `Z`. |

**Example:**

```bash
curl "http://localhost:4000/api/v1/chargers/$CHARGER_ID/pricing/current?at=2026-04-17T14:30:00%2B05:30"
```

**Response:**

```json
{
  "data": {
    "chargerId": "447e107e-...",
    "stationId": "aa06ea3a-...",
    "stationName": "Bandra Kurla EV Hub",
    "timezone": "Asia/Kolkata",
    "queriedAt": "2026-04-17T14:30:00.000+05:30",
    "localDate": "2026-04-17",
    "localTime": "14:30",
    "scheduleId": "32814400-...",
    "period": {
      "id": "128a59c4-...",
      "startTime": "14:00",
      "endTime": "18:00",
      "pricePerKwh": 0.285,
      "currency": "INR"
    }
  }
}
```

Errors: `404 CHARGER_NOT_FOUND`, `404 SCHEDULE_NOT_FOUND`, `400 VALIDATION_ERROR`.

### `GET /chargers/:chargerId/pricing/schedule`

Full 24-hour schedule for one charger on a specific date.

**Query params:**

| Name | Type | Notes |
|---|---|---|
| `date` | `YYYY-MM-DD` | Optional. Defaults to today in the station's timezone. |

**Response:**

```json
{
  "data": {
    "chargerId": "...",
    "stationId": "...",
    "stationName": "Bandra Kurla EV Hub",
    "timezone": "Asia/Kolkata",
    "date": "2026-04-17",
    "schedule": {
      "id": "...",
      "name": "Default TOU Schedule",
      "currency": "INR",
      "effectiveFrom": "2026-01-01"
    },
    "periods": [
      { "id": "...", "startTime": "00:00", "endTime": "06:00", "pricePerKwh": 0.1425, "currency": "INR" },
      { "id": "...", "startTime": "06:00", "endTime": "12:00", "pricePerKwh": 0.19, "currency": "INR" },
      { "id": "...", "startTime": "12:00", "endTime": "14:00", "pricePerKwh": 0.2375, "currency": "INR" },
      { "id": "...", "startTime": "14:00", "endTime": "18:00", "pricePerKwh": 0.285, "currency": "INR" },
      { "id": "...", "startTime": "18:00", "endTime": "20:00", "pricePerKwh": 0.2375, "currency": "INR" },
      { "id": "...", "startTime": "20:00", "endTime": "22:00", "pricePerKwh": 0.19, "currency": "INR" },
      { "id": "...", "startTime": "22:00", "endTime": "00:00", "pricePerKwh": 0.1425, "currency": "INR" }
    ],
    "totalCoverageMinutes": 1440
  }
}
```

`totalCoverageMinutes: 1440` confirms the periods tile the full day.

---

## Stations

### `GET /stations`

| Query param | Type | Notes |
|---|---|---|
| `timezone` | string | Filter by IANA zone |
| `search` | string | Name substring (ILIKE) |

```bash
curl "http://localhost:4000/api/v1/stations?timezone=Asia/Kolkata"
```

Response items include `chargerCount`.

### `GET /stations/:id`

Returns the station with nested `chargers[]` array.

### `POST /stations`

```json
{
  "name": "Bandra Kurla EV Hub",
  "address": "BKC, Mumbai",
  "timezone": "Asia/Kolkata"
}
```

→ `201 Created` with the station resource.

### `PATCH /stations/:id`

Partial update — send only fields you want to change.

### `DELETE /stations/:id`

→ `204 No Content`. Cascades to chargers, schedules, and periods.

---

## Chargers

### `GET /chargers`

| Query param | Type |
|---|---|
| `stationId` | UUID |
| `search` | string (serial or label) |

Response includes embedded `station: { id, name, timezone }`.

### `GET /chargers/:id`

Full charger resource with station embed.

### `POST /chargers`

```json
{
  "stationId": "uuid",
  "serialNumber": "BKC-01",
  "label": "Bay 1",
  "connectorType": "CCS2",
  "powerKw": 150
}
```

### `PATCH /chargers/:id`, `DELETE /chargers/:id`

Standard semantics.

---

## Pricing schedules

### `GET /chargers/:chargerId/schedules`

All schedules for a charger, newest `effective_from` first. Each includes its `periods[]`.

### `POST /chargers/:chargerId/schedules`

Create a schedule. If `isActive` is `true` (default), any previously active schedule on that charger is transactionally set to `isActive=false`.

```json
{
  "name": "Default TOU",
  "currency": "USD",
  "effectiveFrom": "2026-04-01",
  "isActive": true,
  "periods": [
    { "startTime": "00:00", "endTime": "06:00", "pricePerKwh": 0.15 },
    { "startTime": "06:00", "endTime": "12:00", "pricePerKwh": 0.20 },
    { "startTime": "12:00", "endTime": "14:00", "pricePerKwh": 0.25 },
    { "startTime": "14:00", "endTime": "18:00", "pricePerKwh": 0.30 },
    { "startTime": "18:00", "endTime": "20:00", "pricePerKwh": 0.25 },
    { "startTime": "20:00", "endTime": "22:00", "pricePerKwh": 0.20 },
    { "startTime": "22:00", "endTime": "00:00", "pricePerKwh": 0.15 }
  ]
}
```

Rejected with `400 INVALID_PERIODS` if:
- Periods don't cover the full day
- Periods overlap
- Periods have a gap
- More than one wrapping (post-midnight) period

### `GET /schedules/:id`

Single schedule with periods.

### `PATCH /schedules/:id`

Update metadata:

```json
{ "name": "Renamed", "isActive": true, "currency": "EUR", "effectiveFrom": "2026-05-01" }
```

Setting `isActive: true` deactivates any other active schedule on the same charger.

### `PUT /schedules/:id/periods`

Replace **all** periods on a schedule in one transaction. Validates before writing.

```json
{
  "periods": [
    { "startTime": "00:00", "endTime": "12:00", "pricePerKwh": 0.40 },
    { "startTime": "12:00", "endTime": "00:00", "pricePerKwh": 0.20 }
  ]
}
```

### `DELETE /schedules/:id`

→ `204`. Cascades to periods.

### `POST /schedules/:id/clone`

```json
{ "targetChargerId": "uuid", "effectiveFrom": "2026-06-01", "isActive": true }
```

All fields optional:
- Omit `targetChargerId` to clone back to the same charger.
- `effectiveFrom` defaults to the source schedule's value.
- `isActive` defaults to `false` (clone stays inactive by default).

---

## Bulk operations

### `POST /pricing/bulk`

Apply one schedule template to many chargers. Each charger gets its own transaction — partial failures are reported, not rolled back globally.

```json
{
  "chargerIds": ["uuid1", "uuid2", "uuid3"],
  "schedule": {
    "name": "Q2 pricing",
    "currency": "USD",
    "effectiveFrom": "2026-04-01",
    "periods": [
      { "startTime": "00:00", "endTime": "08:00", "pricePerKwh": 0.10 },
      { "startTime": "08:00", "endTime": "20:00", "pricePerKwh": 0.35 },
      { "startTime": "20:00", "endTime": "00:00", "pricePerKwh": 0.15 }
    ]
  },
  "activateImmediately": true
}
```

**Status codes:**

| Status | Meaning |
|---|---|
| `200 OK` | All chargers updated |
| `207 Multi-Status` | Some succeeded, some failed |
| `422 Unprocessable Entity` | All failed (but request itself was valid) |
| `400 Bad Request` | Periods fail global validation → no DB writes attempted |

**Response:**

```json
{
  "data": {
    "total": 3,
    "succeededCount": 2,
    "failedCount": 1,
    "succeeded": [
      { "chargerId": "uuid1", "scheduleId": "..." },
      { "chargerId": "uuid3", "scheduleId": "..." }
    ],
    "failed": [
      { "chargerId": "uuid2", "error": { "code": "CHARGER_NOT_FOUND", "message": "Charger does not exist" } }
    ]
  }
}
```

`chargerIds` is deduplicated server-side.

### `POST /pricing/bulk/by-station`

Same semantics, resolves chargers from `stationIds[]`:

```json
{
  "stationIds": ["stationUuid1", "stationUuid2"],
  "schedule": { ... }
}
```

Each row in `succeeded` / `failed` also includes `stationId`.

---

## Meta

### `GET /timezones`

Helper for UIs that need an IANA zone picker.

```json
{
  "data": [
    { "zone": "Asia/Kolkata", "offset": "GMT+05:30" },
    { "zone": "America/Los_Angeles", "offset": "GMT-07:00" },
    ...
  ]
}
```
