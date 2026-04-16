# Presto TOU — Admin Dashboard

React 18 + Vite + TypeScript + Tailwind + shadcn-style primitives.

## Setup

```bash
npm install
npm run dev
# → http://localhost:5173
```

Requires the backend running on `http://localhost:4000`. Vite's dev proxy forwards `/api/*` to it (see `vite.config.ts`).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |

## Key pages

| Route | Purpose |
|---|---|
| `/` | Overview — KPIs, stations list, quick actions |
| `/stations` | Full CRUD for stations with IANA timezone picker |
| `/chargers` | CRUD for chargers, grouped by station |
| `/schedules` | Charger picker |
| `/schedules/:chargerId` | **Visual pricing editor** — timeline bar, live Recharts curve, per-period inputs, history drawer |
| `/bulk` | 4-step wizard for bulk schedule updates |

## Highlights

- **Visual 24h timeline** — each period rendered as a colored segment, color tier by price
- **Live price curve** — Recharts stepped area chart updates as you edit
- **Inline validation** — gap/overlap/coverage checked as you type, exactly matching backend rules
- **Dark mode by default** with instant toggle
- **`Cmd+K` command palette** for fast navigation
- **Optimistic UX** — TanStack Query invalidation strategy keeps everything in sync after mutations

## Architecture

```
src/
├── api/          # Typed API client (fetch wrapper + per-resource modules)
├── hooks/        # TanStack Query hooks (one per resource)
├── pages/        # Route components
├── components/
│   ├── ui/              # shadcn-style primitives
│   ├── layout/          # Sidebar, Topbar, CommandPalette, AppShell
│   ├── pricing-editor/  # The visual schedule editor
│   ├── stations/        # Station dialogs
│   ├── chargers/        # Charger dialogs
│   └── common/          # ConfirmDialog
├── types/api.ts  # TypeScript types matching the backend contract
├── lib/utils.ts  # cn(), formatPrice()
└── main.tsx      # React Router + QueryClient setup
```
