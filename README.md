# Spendcheck

A private, single-user finance dashboard — scan monthly spend, browse transactions, and track trends without a spreadsheet.

**Live**: https://codetopolymath.github.io/finance/

## Product

Read-only by design: transactions are ingested elsewhere and land in Supabase; this app's only job is to make sense of them fast.

- **Dashboard** — month income/spend/net, category breakdown, recent transactions
- **Transactions** — search + filter by category/type/date range, grouped by day
- **Insights** — daily/weekly spend trend, top vendors

## Stack

- **Frontend**: Vite + React 19 + TypeScript, TanStack Query, React Router (`HashRouter`, static-hosting-safe)
- **UI**: Tailwind v4 + shadcn/ui (Radix primitives), Recharts for charts
- **Backend**: Supabase (Postgres + Auth) — no custom server, the client talks to Supabase directly
- **Hosting**: GitHub Pages, built and deployed by GitHub Actions on every push to `main`

## Design system

Tokens live in `src/index.css` as CSS custom properties (light + OS-driven dark mode), consumed via Tailwind's `@theme inline`. The category-breakdown chart uses a dedicated, fixed 8-hue categorical palette (`--category-1..8`) validated for lightness, chroma, and colorblind-safe separation — categories beyond 8 fold into a single "Other" bucket rather than generating or reusing hues. Numbers use `tabular-nums` wherever columns need to align.

## Security model

The Supabase anon key is public by necessity (it ships in the client bundle) — access control lives in the database, not the key:

- **Auth**: GitHub OAuth via Supabase Auth (`src/lib/auth-context.tsx`) gates the whole app
- **Authorization**: Row Level Security on `transactions` restricts reads to one allow-listed email, enforced in Postgres regardless of who holds the anon key

## Local development

```bash
cp .env.example .env.local   # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

`npm run build` type-checks then builds; `npm run lint` runs Oxlint.

## Deployment

`.github/workflows/deploy.yml` builds with the `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` repo variables and publishes `dist/` straight to GitHub Pages — no manual build step, no committed build output.
