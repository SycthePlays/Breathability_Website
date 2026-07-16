# Breathability

Find the route with the freshest air in Jakarta — not just the shortest one.

See [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md) for the full project
description, architecture decisions, and build plan.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Groq keys
npm run dev
```

Open http://localhost:3000.

## Stack

- Next.js (App Router) + Leaflet for the frontend and map
- Supabase (Postgres) for the area reference data and AQI score cache
- Open-Meteo for live air quality data (free, non-commercial tier)
- OSRM for route generation, re-ranked by AQI exposure
- Groq for the route-explanation chatbot

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project's Settings > API
- `GROQ_API_KEY` — from console.groq.com

Open-Meteo and the OSRM demo server need no key.

## Database setup

Run `supabase/migrations/0001_init.sql` against your Supabase project
(via the SQL editor in the dashboard, or the Supabase CLI) before the
`/api/aqi` route will return real data.

## Deploying

Import this repo into Vercel, add the environment variables above in the
Vercel project settings, and deploy. No other config needed — Next.js is
detected automatically.
