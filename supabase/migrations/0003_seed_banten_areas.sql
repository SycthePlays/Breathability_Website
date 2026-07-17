-- Seed area_reference with Banten province reference points (Tangerang
-- region dense, Serang/Cilegon/Pandeglang/Lebak coarse). Values mirror
-- BANTEN_AREAS in lib/jakartaAreas.js — that file documents provenance
-- (BPS municipal density, South Tangerang green-space-equity study,
-- Tangerang–Merak toll congestion). Keep the two in sync.

insert into area_reference (name, lat, lon, vegetation_score, traffic_score, population_score) values
  -- Kota Tangerang
  ('Tangerang (Kota)',   -6.1780, 106.6320, 15, 70, 22),
  ('Karawaci',           -6.1850, 106.6150, 15, 70, 29),
  ('Cibodas',            -6.2130, 106.6100, 12, 65, 36),
  ('Jatiuwung',          -6.1850, 106.5850, 8,  75, 17),
  ('Periuk',             -6.1630, 106.5950, 12, 60, 31),
  ('Batuceper',          -6.1650, 106.6580, 12, 70, 19),
  ('Neglasari',          -6.1520, 106.6400, 15, 70, 16),
  ('Benda',              -6.1350, 106.6600, 18, 75, 12),
  ('Cipondoh',           -6.1830, 106.6800, 20, 70, 24),
  ('Pinang',             -6.2050, 106.6650, 18, 60, 22),
  ('Karang Tengah',      -6.1950, 106.7000, 12, 70, 27),
  ('Ciledug',            -6.2270, 106.7080, 10, 85, 47),
  ('Larangan',           -6.2220, 106.7330, 10, 75, 44),
  -- Kota Tangerang Selatan
  ('Serpong',            -6.3200, 106.6650, 35, 60, 17),
  ('Serpong Utara',      -6.2850, 106.6650, 28, 65, 20),
  ('Pondok Aren',        -6.2700, 106.7150, 20, 70, 30),
  ('Ciputat',            -6.3100, 106.7400, 22, 85, 29),
  ('Ciputat Timur',      -6.2900, 106.7600, 20, 75, 29),
  ('Pamulang',           -6.3430, 106.7380, 25, 70, 28),
  ('Setu',               -6.3450, 106.6800, 35, 50, 12),
  -- Kabupaten Tangerang
  ('Kelapa Dua',         -6.2450, 106.6280, 25, 65, 20),
  ('Curug',              -6.2650, 106.5600, 30, 65, 14),
  ('Cikupa',             -6.2350, 106.5080, 20, 75, 16),
  ('Balaraja',           -6.2000, 106.4600, 30, 70, 10),
  ('Pasar Kemis',        -6.1700, 106.5300, 18, 65, 27),
  ('Tigaraksa',          -6.2700, 106.4700, 40, 45, 9),
  ('Teluknaga',          -6.0980, 106.6380, 30, 50, 9),
  ('Kosambi',            -6.1050, 106.6850, 25, 55, 10),
  ('Cisauk',             -6.3400, 106.6400, 35, 50, 11),
  -- Serang / Cilegon / rural west
  ('Kota Serang',        -6.1200, 106.1500, 35, 55, 6),
  ('Ciruas',             -6.1450, 106.2300, 40, 60, 4),
  ('Kramatwatu',         -6.0750, 106.1000, 35, 60, 4),
  ('Kota Cilegon',       -6.0170, 106.0540, 15, 80, 6),
  ('Anyar',              -6.3300, 105.9200, 55, 45, 2),
  ('Pandeglang',         -6.3150, 106.1070, 75, 30, 2),
  ('Rangkasbitung',      -6.3600, 106.2450, 65, 40, 3)
on conflict (name) do update set
  lat = excluded.lat,
  lon = excluded.lon,
  vegetation_score = excluded.vegetation_score,
  traffic_score = excluded.traffic_score,
  population_score = excluded.population_score,
  updated_at = now();
