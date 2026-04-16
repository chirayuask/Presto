# Presto TOU — Customer App

Single-page, focused customer-facing UI: "what will I pay to charge right now?"

React 18 + Vite + TypeScript + Tailwind + TanStack Query + Recharts.

## Setup

```bash
npm install
npm run dev
# → http://localhost:5174
```

Requires the backend running on `http://localhost:4000`. Vite's dev proxy forwards `/api/*` to it.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build |

## The flow

1. **Pick a charger** from the dropdown
2. Choose **Now** or a **Custom** date/time
3. See the current price — big, prominent, with station + timezone context
4. See today's full 24-hour curve with the current time marked
5. Browse the per-period breakdown in card form

## Architecture

Deliberately minimal. Shares conventions with the admin app but none of its code:

```
src/
├── api/          # Typed fetch client + pricing module
├── hooks/        # TanStack Query hooks
├── pages/
│   └── HomePage.tsx  # The single page
├── components/
│   ├── ui/          # button, card, select
│   └── DayCurve.tsx # Recharts wrapper for the 24h curve
├── types/api.ts
├── lib/utils.ts
└── main.tsx
```

No routing library — one page, no links.
