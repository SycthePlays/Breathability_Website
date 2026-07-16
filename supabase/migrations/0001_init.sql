-- Reference points across Jakarta carrying the three slower-changing
-- signals (vegetation, traffic, population). Start coarse — one row per
-- kelurahan/sub-district centroid is plenty for the hackathon MVP — and
-- densify later. See docs/PROJECT_PLAN.md for the resolution discussion.
create table if not exists area_reference (
  id bigint generated always as identity primary key,
  name text not null,
  lat double precision not null,
  lon double precision not null,
  vegetation_score numeric not null default 50, -- 0-100, from NDVI satellite data
  traffic_score numeric not null default 50,     -- 0-100, higher = more congested
  population_score numeric not null default 50,  -- 0-100, higher = denser
  updated_at timestamptz not null default now()
);

-- On-demand cache of computed composite AQI scores. Populated by
-- lib/aqiEngine.js at query time, not precomputed city-wide. Short TTL
-- keeps it aligned with Open-Meteo's hourly update cadence.
create table if not exists aqi_score_cache (
  id bigint generated always as identity primary key,
  lat double precision not null,
  lon double precision not null,
  composite_score numeric not null,
  live_aqi numeric,
  computed_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour')
);

create index if not exists aqi_score_cache_coords_idx
  on aqi_score_cache (lat, lon);

-- Row Level Security — the app is stateless with no accounts, so both
-- tables are readable by anyone via the anon key. Writes should go
-- through the service role key from server-side code only.
alter table area_reference enable row level security;
alter table aqi_score_cache enable row level security;

create policy "Public read access" on area_reference
  for select using (true);

create policy "Public read access" on aqi_score_cache
  for select using (true);
