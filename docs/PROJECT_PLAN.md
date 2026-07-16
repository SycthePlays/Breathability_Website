# Breathability — project plan

## What it is

Breathability is a route-planning web app for Jakarta that optimizes for air
quality, not just distance. A user sets a start and destination; the app
returns three ranked routes — cleanest, balanced, and fastest — scored by
a composite air quality index (AQI) built from four signals, and explains
the tradeoffs in plain language via a chatbot.

It's built for people managing asthma or air allergies who want to avoid
high-pollution corridors on their commute, but the core mechanic (route by
air quality, not just speed) is useful to anyone in a heavily polluted city.

No accounts, no signup — the app is fully stateless for now. A profile
layer with saved trigger sensitivities is a possible future addition, not
part of this build.

## The AQI scoring model

Four inputs combine into one composite score per location:

1. **Live AQI** (Open-Meteo Air Quality API) — the only ground-truth
   measurement, so it carries the most weight.
2. **Vegetation coverage** — NDVI from satellite imagery. More vegetation
   lowers the pollution contribution, so this signal is inverted before
   weighting.
3. **Traffic density** — a proxy for local vehicle emissions.
4. **Population density** — a proxy for local human activity/emissions.

Each signal is normalized to a 0-100 scale, then combined as a weighted
sum (starting weights: live AQI 0.55, traffic 0.2, vegetation 0.15,
population 0.1 — see `lib/aqiEngine.js`). These weights are a starting
point, not a finished model; tune them once real Jakarta data is loaded
and, ideally, once composite scores can be sanity-checked against
independent local reporting.

### Why 10m resolution is a query-time goal, not a storage plan

The original ambition was AQI accuracy down to every 10m×10m cell across
Jakarta. Jakarta's administrative area is roughly 660 km², which is about
6.6 million 10m cells — precomputing and storing a score per cell would
land well past Supabase's 500MB free-tier database limit on a single
snapshot, before any history is kept, and air quality changes hourly
regardless.

The fix: don't precompute the whole city. Store the three slower-changing
signals compactly (one row per reference point — start at kelurahan/
sub-district level, densify later) and compute the composite score only
for whatever area is actually queried — a route corridor or the visible
map bounding box — then cache that result for about an hour, matching
Open-Meteo's update cadence. 10m precision becomes an interpolation target
at query time, achievable without the storage blowup.

One honest constraint: the *output* resolution is bounded by the
*coarsest input layer*. Vegetation via free satellite imagery (e.g.
Sentinel-2) can genuinely hit ~10m. Population density in Indonesia is
typically published at kelurahan level by BPS — much coarser — so true
10m granularity across all four signals will need extra data sourcing
later if it matters beyond the demo.

## App flow

### Opening page (`/`)

A hero section states the concept in plain language ("find the route with
the freshest air, not just the shortest one"), a short block explains how
the score is built (for credibility, not technical depth), and a single
CTA leads straight into the dashboard — no signup. A live AQI snapshot
near the top is a nice-to-have hook once `/api/aqi` is wired up to render
on this page too.

### Dashboard (`/dashboard`)

Opens directly on a Leaflet map centered on Jakarta with the AQI overlay
visible. The user sets a start and destination by search or by dropping
pins. On submit, three ranked routes are drawn on the map in distinct
colors, with a side panel listing distance, time, and AQI exposure for
each. Selecting a route highlights it on the map and fills the chatbot
panel with a short explanation of why it's recommended over the other two.
Fully stateless — nothing here persists between visits.

## Core features

**Opening page**
- Hero section with plain-language headline and one-line explanation
- "How it works" block covering the four data inputs
- Live AQI snapshot/preview (stretch)
- CTA into the dashboard, no account required
- Data source attribution footer

**Dashboard**
- Leaflet map with a color-coded AQI overlay + legend
- Start/destination input via search or map pin-drop
- Route engine returning 3 ranked options (cleanest, balanced, fastest)
- Route comparison panel: distance, time, AQI exposure side by side
- Selected-route highlight state, synced between map and panel
- Groq-powered explanation panel for the currently selected route

## Tech stack

- **Next.js (App Router)** + **Leaflet/react-leaflet** — one JS codebase
  for frontend and API routes, minimal setup overhead for a small,
  mixed-skill team.
- **Supabase (Postgres)** — the `area_reference` table for the three
  slower-changing signals, and `aqi_score_cache` for on-demand computed
  scores. Schema in `supabase/migrations/0001_init.sql`.
- **Open-Meteo Air Quality API** — live AQI, PM2.5, PM10. Free for
  non-commercial use, no key required.
- **OSRM** (public demo server for now) — candidate route generation with
  alternatives, re-ranked locally by AQI exposure + distance.
- **Groq** — fast, free-tier LLM inference for the route-explanation
  chatbot, called via its OpenAI-compatible endpoint (no SDK dependency).
- **Vercel** — deployment, connected directly to this GitHub repo.

## API usage limits (checked before committing to this stack)

- **Open-Meteo**: free tier is non-commercial use, rate-limited to
  10,000 calls/day, no uptime guarantee. Nowhere near hackathon-demo
  traffic. Paid plans start at 1M calls/month (~€29/mo) if this ever
  goes further.
- **Supabase free tier**: 2 active projects, 500 MB database, 1 GB file
  storage, 5 GB egress, 50,000 monthly active users, 500,000 edge
  function invocations, 200 concurrent realtime connections, unlimited
  API requests. Projects pause after 7 days with no database activity —
  not a hackathon-day risk, but worth a ping job if there's a gap before
  judging.
- **Groq free tier**: roughly 30 requests/minute, ~30,000 tokens/minute,
  ~14,400 requests/day (varies by model, applies at the organization
  level — extra API keys don't multiply it). One explanation call per
  route selection stays well inside this.
- **OSRM public demo server**: free, no key, but rate-limited and meant
  for light/demo use only — not a long-term dependency. Swap for a
  self-hosted OSRM instance or GraphHopper before relying on this beyond
  the hackathon.

## Repo structure

```
app/
  page.js              — opening page
  dashboard/page.js     — main map + route panel
  api/aqi/route.js      — GET  composite AQI for a point
  api/routes/route.js   — POST ranked routes for start/destination
  api/explain/route.js  — POST Groq explanation for a chosen route
components/
  MapView.js             — Leaflet map, client-only
lib/
  supabaseClient.js       — Supabase client
  openMeteo.js            — live AQI fetch
  aqiEngine.js             — composite scoring
  routingEngine.js         — OSRM fetch + re-ranking (AQI sampling is a TODO)
  groqClient.js             — route-explanation prompt + call
supabase/migrations/
  0001_init.sql              — area_reference + aqi_score_cache tables
docs/
  PROJECT_PLAN.md              — this file
```

## What's stubbed vs. what's real

Everything above compiles and deploys as-is — this was verified with a
clean `npm install && npm run build` before committing. What's real:
the Open-Meteo integration, the OSRM integration, the Groq call, the
Leaflet map, and the Supabase client wiring. What's stubbed with a
`TODO` for the actual implementation work in Antigravity:

- `aqiEngine.js` currently reads the *first* row of `area_reference`
  regardless of location — needs a real nearest-neighbor or
  interpolation lookup by lat/lon.
- `routingEngine.js` returns OSRM's raw candidate routes without yet
  sampling AQI along each one or re-ranking by combined exposure +
  distance.
- The AQI overlay, route polylines, and start/destination pickers on the
  map are not yet implemented — `components/MapView.js` has TODOs marking
  where they go.
- `area_reference` has no seed data yet — vegetation, traffic, and
  population numbers for Jakarta still need to be sourced and loaded.

## Next steps

1. Source and load vegetation (NDVI), traffic, and population data into
   `area_reference` for an initial set of Jakarta reference points.
2. Implement the nearest-neighbor/interpolation lookup in `aqiEngine.js`.
3. Implement AQI sampling along route geometry in `routingEngine.js` and
   the actual re-ranking logic.
4. Build out the map overlay, route polylines, and input UI in
   `components/MapView.js` and `app/dashboard/page.js`.
5. Decide on a longer-term routing backend if usage outgrows the OSRM
   demo server.
6. (Later, if decided) add accounts and a trigger-based profile layer.

## Deferred: community/profile layer

Earlier planning included user accounts, saved trigger sensitivities
(pollen, dust, smoke, etc.), and a community feed. None of that is in
this build — it adds signup friction that isn't worth it for a 24-hour
hackathon scope. The idea is parked, not dropped: a profile could
eventually feed personalized weighting into the AQI engine (e.g.
weighting traffic-related pollutants higher for someone sensitive to
vehicle exhaust). Revisit if/when there's a reason to add accounts.
