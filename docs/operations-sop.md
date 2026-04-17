# Operations SOP — Presto TOU Pricing System

**Audience:** Operations team managing EV chargers and their pricing.
**Purpose:** Standard procedures for day-to-day tasks — no engineering knowledge required.

---

## 0. Before you start

### Access

- **Admin Dashboard:** `http://<host>:5173` — your main workspace
- **Customer App:** `http://<host>:5174` — what end-users see (use for spot-checks)
- **API direct:** `http://<host>:4000/api/v1` — for scripted/bulk work

### Quick health check

Open the admin dashboard. Top-right corner shows **API online** (green dot) if healthy, or **API degraded** (amber) if the backend or database is down. If degraded, stop and escalate to engineering.

### Core concepts (1-minute version)

- **Station** = a physical location (e.g. "Bandra Kurla EV Hub"). Has a **timezone**.
- **Charger** = one plug. Belongs to one station. Inherits the station's timezone.
- **Pricing Schedule** = a set of price-per-kWh rules that apply to one charger.
- **Period** = a time slice within a schedule (e.g. "06:00–12:00 → $0.20/kWh").

**Rules you cannot break:**
- A schedule's periods must cover the **full 24 hours** with no gaps and no overlaps.
- Only **one schedule per charger** is active at any time.
- Price must be **≥ 0**.
- All times are entered in the **station's local timezone**.

---

## 1. Procedure: Add a new station

**When:** Opening a new physical location.

1. Admin Dashboard → **Stations** → **New station**.
2. Fill in:
   - **Name** — public-facing name
   - **Address** — street address
   - **Timezone** — pick the IANA zone for the physical location (e.g. `Asia/Kolkata`, `America/Los_Angeles`). **This is critical** — it controls how prices are interpreted for every charger at this station.
3. Click **Create station**.
4. Verify it appears in the station list with the correct timezone badge.

**Gotcha:** you cannot change a station's timezone silently later — if you do, every charger's TOU interpretation shifts. If timezone was wrong at creation, delete and recreate (or escalate to engineering for a data fix).

---

## 2. Procedure: Add a new charger

**When:** Installing a new plug at an existing station.

**Pre-requisite:** The station must already exist.

1. Admin Dashboard → **Chargers** → **New charger**.
2. Fill in:
   - **Station** — pick the parent station
   - **Serial number** — **must be globally unique** (the system enforces this). Use your physical labeling convention.
   - **Label** — human-friendly name (e.g. "Bay 1")
   - **Connector** — e.g. `CCS2`, `CHAdeMO`, `Type 2`
   - **Power (kW)** — rated power (e.g. 150)
3. Click **Create charger**.
4. **Immediately set up pricing** (next procedure) — a charger with no active schedule will return an error when customers query it.

---

## 3. Procedure: Set initial pricing for a charger

**When:** Right after creating a new charger, or migrating existing pricing.

1. Admin Dashboard → **Chargers** → click the **Pricing** icon on the charger row.
2. The schedule editor opens with a default 7-period template pre-filled.
3. Adjust:
   - **Schedule name** — e.g. "Default TOU 2026"
   - **Currency** — pick the local currency (USD, EUR, INR, etc.)
   - **Effective from** — pick the start date
   - **Active** toggle — leave ON for immediate effect
4. Edit each period:
   - Use the **+ Add period** button or edit existing rows
   - Adjust start, end, and price per kWh for each row
5. **Watch the indicator above the timeline**:
   - ✅ **"Covers 24h"** in green → schedule is valid, save is enabled
   - ⚠️ **"XXX/1440 min"** in amber → schedule has gaps/overlaps, **save will be rejected**
6. If there are errors, a yellow box below the periods list will say exactly what's wrong (e.g. "Gap between 06:00-12:00 and 14:00-00:00"). Fix and watch the badge go green.
7. Click **Create schedule**.
8. Verify by going to the Customer App and selecting this charger — the price card should show the correct current rate.

### Period rules (memorize these)

- Start time is **inclusive**, end time is **exclusive**.
  - `06:00–12:00` means 06:00 through 11:59:59.
- To make a period end at midnight, use `00:00` as the end time.
  - `22:00–00:00` means 22:00 through 23:59:59 (wraps to midnight).
- Only **one period per schedule** may wrap past midnight.
- Every schedule must start at `00:00` and end at `00:00` (i.e. cover the full day).

---

## 4. Procedure: Change pricing on one charger

**When:** Adjusting rates on a single charger (e.g. trial pricing, special location).

### Option A — Modify the current schedule in place

Use when the change is small (e.g. a price tweak on one period).

1. Admin Dashboard → **Pricing Schedules** → pick the charger.
2. The currently active schedule is pre-loaded.
3. Edit periods as needed. The "Covers 24h" badge must stay green.
4. Click **Save changes**.

**Effect:** Immediate. Customers pay new rates from the moment you save.

### Option B — Create a new schedule (recommended for material changes)

Use when doing a meaningful pricing change — preserves history and allows rollback.

1. Open the same page as above.
2. Click **+ New schedule** (top-right).
3. Fill in name, currency, effective date, periods.
4. Leave **Active** toggle ON.
5. Click **Create schedule**.

The old schedule is automatically **deactivated** but preserved in history. To roll back, click the ⏻ icon next to the old schedule in the History panel.

---

## 5. Procedure: Bulk pricing update (many chargers at once)

**When:** Company-wide rate change, seasonal adjustment, regulatory update.

This is the most powerful flow — use it carefully.

1. Admin Dashboard → **Bulk Operations**.
2. **Step 1 — Select chargers:**
   - Filter by station if needed (dropdown at top).
   - Click individual chargers to select, or **Toggle all visible** to bulk-select.
   - Double-check the "X selected" badge.
3. **Step 2 — Design pricing:**
   - Set schedule name, currency, effective-from date.
   - Build the period structure. Same rules as single-charger setup.
4. **Step 3 — Review:**
   - Confirms the number of chargers and the pricing preview.
   - **If anything looks wrong, go back.** Nothing has been written yet.
5. Click **Apply to X chargers**.
6. **Step 4 — Result:** You'll see one of three outcomes:

   | Outcome | Meaning | Action |
   |---|---|---|
   | **All succeeded** (green) | Every charger was updated | None |
   | **Partial success** (mixed) | Some chargers failed | Expand the "Failed" list, note which ones, retry those individually |
   | **All failed** (red) | Something was wrong with the request | Don't retry blindly — escalate to engineering |

### Important bulk behavior

- **Each charger is updated in its own transaction.** If one fails, the others still succeed. This is intentional — one bad charger doesn't block 500 others.
- **Same schedule template for all selected chargers.** If you need different rates per charger or per region, run multiple bulk operations or use the station filter.
- **The previous active schedule for each charger is automatically deactivated** — you don't need to do that manually.

---

## 6. Procedure: Clone a schedule

**When:** A charger has good pricing you want to replicate.

1. Pricing Schedules page → open the source charger.
2. Click **Clone** at the top-right.
3. By default, it clones back to the same charger (as a new inactive schedule).
4. For cloning to a different charger, use the API directly (or ask engineering) — the UI currently supports self-clone only.

---

## 7. Procedure: Handle "No active pricing schedule" customer complaint

**When:** A customer reports they can't see the price for a charger.

**Diagnosis flow:**

1. In the Customer App, select the reported charger.
2. If you see a red error box saying "No active pricing schedule for charger X on YYYY-MM-DD":
   - Admin Dashboard → **Pricing Schedules** → pick that charger.
   - Check the History panel:
     - **No schedules at all** → create one (Procedure 3).
     - **Schedules exist but none active** → activate the right one using the ⏻ button.
     - **Active schedule exists but `effective_from` is in the future** → either change the effective date to today, or create a new schedule that's effective immediately.
3. Verify the fix by reloading the Customer App.

---

## 8. Procedure: Remove a charger

**When:** Retiring a physical plug.

**⚠️ This is destructive.**

1. Admin Dashboard → **Chargers** → find the row.
2. Click the 🗑️ icon.
3. Confirm the dialog.

**What gets deleted (cascade):**
- The charger itself
- All its pricing schedules
- All the periods in those schedules

**What survives:**
- The parent station
- Other chargers at the same station

If you're not 100% sure, deactivate the current schedule instead (set **Active** toggle OFF) — same operational effect without data loss.

---

## 9. Procedure: Remove a station

**Even more destructive.** Removes the station AND everything inside it.

1. Admin Dashboard → **Stations** → find the station.
2. Click 🗑️ → confirm.

**What gets deleted:** station, ALL its chargers, ALL their schedules, ALL their periods.

Consider this a last resort. For temporary closure, simply deactivate each charger's schedule.

---

## 10. Validation rules reference (quick lookup)

| Rule | Error you'll see | Fix |
|---|---|---|
| Serial number already exists | `VALIDATION_ERROR` | Pick a different serial |
| Timezone not a valid IANA zone | "Must be a valid IANA timezone" | Use the dropdown — don't type freely |
| Periods don't cover 24h | "Periods must start at 00:00" / "end at 24:00" | Add periods to fill gaps |
| Periods overlap | "Overlap: 06:00-12:00 with 08:00-18:00" | Adjust boundaries |
| Periods have a gap | "Gap between 06:00-12:00 and 14:00-00:00" | Fill the gap |
| More than one wrap | "Only one period may wrap past midnight" | Only the last period (e.g. 22:00-00:00) should wrap |
| Negative price | `CHECK constraint` error | Price must be ≥ 0 |

---

## 11. When to escalate to engineering

Escalate immediately if:

- API status indicator is amber/red for more than 5 minutes
- "All failed" result on a bulk operation
- Timezone of a station was set wrong and customers already transacted
- Pricing needs to be rolled back beyond what the History panel shows
- You need to bulk-delete multiple stations or chargers
- You need to change a charger's station (not supported in UI)
- Customer reports a price that doesn't match the UI — possible timezone or caching bug

**Don't try to fix database issues from the UI.** Escalate.

---

## 12. Audit trail

Every pricing schedule is preserved in the **History** panel even after it's deactivated or replaced. To see what price was in effect on a given date:

1. Pricing Schedules → pick the charger.
2. Scroll through the History panel — each entry shows `effective_from`, currency, and active/inactive status.
3. Click any historical schedule to inspect its periods.

**Never delete** old schedules for billing-reconciliation reasons — deactivate instead.

---

## Appendix — common operational scenarios

### "We're opening a new city with 10 stations and 40 chargers"
1. Create the 10 stations (Procedure 1) with the correct timezone.
2. Create the 40 chargers (Procedure 2).
3. Use **Bulk Operations** (Procedure 5) with the by-station filter to apply pricing to all 40 at once.

### "Regulator announced new off-peak rates effective next Monday"
1. Go to Bulk Operations.
2. Select all chargers (no filter).
3. Design the new schedule with **Effective from** = next Monday.
4. Apply. The system will activate it on that date automatically.

### "One station needs different pricing than the rest"
1. Bulk Operations → filter to that station in Step 1.
2. Apply the station-specific schedule.
3. Then run a second bulk operation for all other stations (filter = all, then manually deselect the special one) with the standard schedule.

### "Charger X has been offline but we need to update its price anyway"
Updating pricing in the admin system doesn't depend on the physical charger being online. Just do Procedure 4. When the charger comes back, it'll fetch the current price via the API.
