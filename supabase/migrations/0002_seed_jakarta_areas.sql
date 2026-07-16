-- Seed area_reference with the 44 DKI Jakarta kecamatan and their three
-- slow-signal scores. Values mirror lib/jakartaAreas.js exactly — that file
-- documents the provenance (BPS density, RTH/NDVI studies, TomTom
-- congestion) and the 0-100 mappings. Keep the two in sync until the app
-- reads exclusively from Supabase.

alter table area_reference
  add constraint area_reference_name_key unique (name);

insert into area_reference (name, lat, lon, vegetation_score, traffic_score, population_score) values
  -- Central Jakarta
  ('Gambir',             -6.1754, 106.8272, 35, 75, 10),
  ('Sawah Besar',        -6.1605, 106.8340, 12, 70, 55),
  ('Kemayoran',          -6.1629, 106.8560, 20, 65, 60),
  ('Senen',              -6.1783, 106.8420, 15, 75, 50),
  ('Cempaka Putih',      -6.1809, 106.8700, 18, 65, 55),
  ('Johar Baru',         -6.1830, 106.8550, 8,  60, 100),
  ('Tanah Abang',        -6.2036, 106.8112, 15, 90, 45),
  ('Menteng',            -6.1950, 106.8320, 45, 80, 25),
  -- North Jakarta
  ('Penjaringan',        -6.1130, 106.7680, 18, 70, 25),
  ('Pademangan',         -6.1290, 106.8330, 22, 65, 35),
  ('Tanjung Priok',      -6.1180, 106.8730, 10, 85, 35),
  ('Koja',               -6.1130, 106.9080, 8,  75, 50),
  ('Kelapa Gading',      -6.1600, 106.9050, 20, 70, 30),
  ('Cilincing',          -6.1210, 106.9440, 12, 80, 30),
  -- West Jakarta
  ('Tambora',            -6.1450, 106.8020, 5,  70, 95),
  ('Taman Sari',         -6.1440, 106.8180, 8,  70, 55),
  ('Grogol Petamburan',  -6.1620, 106.7900, 12, 80, 45),
  ('Palmerah',           -6.1930, 106.7950, 12, 75, 65),
  ('Kebon Jeruk',        -6.1900, 106.7700, 18, 70, 45),
  ('Kembangan',          -6.1930, 106.7380, 25, 65, 35),
  ('Cengkareng',         -6.1480, 106.7350, 15, 70, 45),
  ('Kalideres',          -6.1270, 106.7050, 20, 65, 35),
  -- South Jakarta
  ('Kebayoran Baru',     -6.2440, 106.8000, 40, 80, 25),
  ('Kebayoran Lama',     -6.2440, 106.7770, 22, 70, 45),
  ('Pesanggrahan',       -6.2560, 106.7480, 30, 60, 40),
  ('Cilandak',           -6.2900, 106.8000, 35, 65, 30),
  ('Pasar Minggu',       -6.2840, 106.8340, 40, 65, 35),
  ('Jagakarsa',          -6.3250, 106.8230, 45, 55, 35),
  ('Mampang Prapatan',   -6.2500, 106.8230, 18, 80, 45),
  ('Pancoran',           -6.2520, 106.8450, 20, 85, 40),
  ('Tebet',              -6.2260, 106.8520, 25, 75, 55),
  ('Setiabudi',          -6.2190, 106.8300, 20, 90, 35),
  -- East Jakarta
  ('Matraman',           -6.2040, 106.8620, 12, 70, 70),
  ('Pulogadung',         -6.1840, 106.9000, 12, 75, 40),
  ('Jatinegara',         -6.2250, 106.8700, 12, 80, 55),
  ('Duren Sawit',        -6.2300, 106.9100, 18, 65, 40),
  ('Kramat Jati',        -6.2740, 106.8660, 20, 75, 50),
  ('Makasar',            -6.2680, 106.8930, 30, 70, 25),
  ('Cakung',             -6.1840, 106.9520, 12, 75, 30),
  ('Ciracas',            -6.3230, 106.8870, 35, 60, 30),
  ('Cipayung',           -6.3260, 106.9060, 45, 55, 25),
  ('Pasar Rebo',         -6.3110, 106.8530, 35, 65, 30),
  -- Thousand Islands
  ('Kepulauan Seribu Selatan', -5.8500, 106.6000, 60, 5, 5),
  ('Kepulauan Seribu Utara',   -5.6500, 106.5700, 65, 3, 3)
on conflict (name) do update set
  lat = excluded.lat,
  lon = excluded.lon,
  vegetation_score = excluded.vegetation_score,
  traffic_score = excluded.traffic_score,
  population_score = excluded.population_score,
  updated_at = now();
