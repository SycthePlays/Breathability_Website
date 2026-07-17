// Jakarta reference dataset — one row per kecamatan (district), 44 total,
// carrying the three slower-changing signals of the composite AQI model.
// This is the local fallback for Supabase's area_reference table (and the
// source for supabase/migrations/0002_seed_jakarta_areas.sql): identical
// shape, so the engine can use either interchangeably.
//
// PROVENANCE / METHOD (curated approximations, hackathon-grade):
//
// population_score — anchored to BPS-Statistics DKI Jakarta district-level
//   population density (jakarta.bps.go.id, "Kepadatan Penduduk menurut
//   Kecamatan"). Mapping: score ≈ min(100, density_per_km2 / 450), so
//   ~45,000/km² (Johar Baru, the densest district in Indonesia) ≈ 100 and
//   the near-empty Thousand Islands ≈ 3-5. density_km2 keeps the raw
//   BPS-order-of-magnitude figure the score was derived from.
//
// vegetation_score — greenness 0-100 (higher = greener; the engine inverts
//   it before weighting). Anchored to DKI green-open-space studies: city
//   vegetated cover fell to ~19.5% by 2020, North/West Jakarta lowest,
//   South Jakarta + the eastern/southern fringe (Jagakarsa, Cipayung,
//   around Ragunan/TMII) highest; Kramat Jati measured at ~19.7% RTH
//   (Pleiades NDVI study). Score ≈ 2 × local green-cover %, later to be
//   replaced by real Sentinel-2 NDVI zonal means (~10m native resolution).
//
// traffic_score — congestion proxy 0-100 (higher = worse air from
//   vehicles). Anchored to TomTom Traffic Index for Jakarta (59.8%
//   congestion, ~22.8 km/h peak average) and its named worst corridors:
//   Sudirman-Thamrin (Tanah Abang/Menteng/Setiabudi), Gatot Subroto
//   (Setiabudi/Mampang/Pancoran), Cawang-MT Haryono (Jatinegara/Kramat
//   Jati/Pancoran), Grogol-S.Parman (Grogol Petamburan/Palmerah), and the
//   port truck routes (Tanjung Priok/Koja/Cilincing/Cakung).
//
// Replace any column wholesale as real pipelines land (NDVI zonal stats,
// BPS API, TomTom/Google traffic tiles) — the engine only assumes 0-100.

export const JAKARTA_AREAS = [
  // ---- Central Jakarta (Jakarta Pusat) ----
  { name: 'Gambir',             city: 'Central Jakarta', lat: -6.1754, lon: 106.8272, density_km2: 4500,  population_score: 10,  vegetation_score: 35, traffic_score: 75 },
  { name: 'Sawah Besar',        city: 'Central Jakarta', lat: -6.1605, lon: 106.8340, density_km2: 25000, population_score: 55,  vegetation_score: 12, traffic_score: 70 },
  { name: 'Kemayoran',          city: 'Central Jakarta', lat: -6.1629, lon: 106.8560, density_km2: 27000, population_score: 60,  vegetation_score: 20, traffic_score: 65 },
  { name: 'Senen',              city: 'Central Jakarta', lat: -6.1783, lon: 106.8420, density_km2: 22000, population_score: 50,  vegetation_score: 15, traffic_score: 75 },
  { name: 'Cempaka Putih',      city: 'Central Jakarta', lat: -6.1809, lon: 106.8700, density_km2: 25000, population_score: 55,  vegetation_score: 18, traffic_score: 65 },
  { name: 'Johar Baru',         city: 'Central Jakarta', lat: -6.1830, lon: 106.8550, density_km2: 45000, population_score: 100, vegetation_score: 8,  traffic_score: 60 },
  { name: 'Tanah Abang',        city: 'Central Jakarta', lat: -6.2036, lon: 106.8112, density_km2: 20000, population_score: 45,  vegetation_score: 15, traffic_score: 90 },
  { name: 'Menteng',            city: 'Central Jakarta', lat: -6.1950, lon: 106.8320, density_km2: 11000, population_score: 25,  vegetation_score: 45, traffic_score: 80 },

  // ---- North Jakarta (Jakarta Utara) ----
  { name: 'Penjaringan',        city: 'North Jakarta',   lat: -6.1130, lon: 106.7680, density_km2: 10000, population_score: 25,  vegetation_score: 18, traffic_score: 70 },
  { name: 'Pademangan',         city: 'North Jakarta',   lat: -6.1290, lon: 106.8330, density_km2: 15000, population_score: 35,  vegetation_score: 22, traffic_score: 65 },
  { name: 'Tanjung Priok',      city: 'North Jakarta',   lat: -6.1180, lon: 106.8730, density_km2: 14000, population_score: 35,  vegetation_score: 10, traffic_score: 85 },
  { name: 'Koja',               city: 'North Jakarta',   lat: -6.1130, lon: 106.9080, density_km2: 22000, population_score: 50,  vegetation_score: 8,  traffic_score: 75 },
  { name: 'Kelapa Gading',      city: 'North Jakarta',   lat: -6.1600, lon: 106.9050, density_km2: 11000, population_score: 30,  vegetation_score: 20, traffic_score: 70 },
  { name: 'Cilincing',          city: 'North Jakarta',   lat: -6.1210, lon: 106.9440, density_km2: 11000, population_score: 30,  vegetation_score: 12, traffic_score: 80 },

  // ---- West Jakarta (Jakarta Barat) ----
  { name: 'Tambora',            city: 'West Jakarta',    lat: -6.1450, lon: 106.8020, density_km2: 42000, population_score: 95,  vegetation_score: 5,  traffic_score: 70 },
  { name: 'Taman Sari',         city: 'West Jakarta',    lat: -6.1440, lon: 106.8180, density_km2: 25000, population_score: 55,  vegetation_score: 8,  traffic_score: 70 },
  { name: 'Grogol Petamburan',  city: 'West Jakarta',    lat: -6.1620, lon: 106.7900, density_km2: 18000, population_score: 45,  vegetation_score: 12, traffic_score: 80 },
  { name: 'Palmerah',           city: 'West Jakarta',    lat: -6.1930, lon: 106.7950, density_km2: 28000, population_score: 65,  vegetation_score: 12, traffic_score: 75 },
  { name: 'Kebon Jeruk',        city: 'West Jakarta',    lat: -6.1900, lon: 106.7700, density_km2: 20000, population_score: 45,  vegetation_score: 18, traffic_score: 70 },
  { name: 'Kembangan',          city: 'West Jakarta',    lat: -6.1930, lon: 106.7380, density_km2: 15000, population_score: 35,  vegetation_score: 25, traffic_score: 65 },
  { name: 'Cengkareng',         city: 'West Jakarta',    lat: -6.1480, lon: 106.7350, density_km2: 20000, population_score: 45,  vegetation_score: 15, traffic_score: 70 },
  { name: 'Kalideres',          city: 'West Jakarta',    lat: -6.1270, lon: 106.7050, density_km2: 15000, population_score: 35,  vegetation_score: 20, traffic_score: 65 },

  // ---- South Jakarta (Jakarta Selatan) ----
  { name: 'Kebayoran Baru',     city: 'South Jakarta',   lat: -6.2440, lon: 106.8000, density_km2: 11000, population_score: 25,  vegetation_score: 40, traffic_score: 80 },
  { name: 'Kebayoran Lama',     city: 'South Jakarta',   lat: -6.2440, lon: 106.7770, density_km2: 19000, population_score: 45,  vegetation_score: 22, traffic_score: 70 },
  { name: 'Pesanggrahan',       city: 'South Jakarta',   lat: -6.2560, lon: 106.7480, density_km2: 17000, population_score: 40,  vegetation_score: 30, traffic_score: 60 },
  { name: 'Cilandak',           city: 'South Jakarta',   lat: -6.2900, lon: 106.8000, density_km2: 13000, population_score: 30,  vegetation_score: 35, traffic_score: 65 },
  { name: 'Pasar Minggu',       city: 'South Jakarta',   lat: -6.2840, lon: 106.8340, density_km2: 14000, population_score: 35,  vegetation_score: 40, traffic_score: 65 },
  { name: 'Jagakarsa',          city: 'South Jakarta',   lat: -6.3250, lon: 106.8230, density_km2: 14000, population_score: 35,  vegetation_score: 45, traffic_score: 55 },
  { name: 'Mampang Prapatan',   city: 'South Jakarta',   lat: -6.2500, lon: 106.8230, density_km2: 18000, population_score: 45,  vegetation_score: 18, traffic_score: 80 },
  { name: 'Pancoran',           city: 'South Jakarta',   lat: -6.2520, lon: 106.8450, density_km2: 17000, population_score: 40,  vegetation_score: 20, traffic_score: 85 },
  { name: 'Tebet',              city: 'South Jakarta',   lat: -6.2260, lon: 106.8520, density_km2: 23000, population_score: 55,  vegetation_score: 25, traffic_score: 75 },
  { name: 'Setiabudi',          city: 'South Jakarta',   lat: -6.2190, lon: 106.8300, density_km2: 15000, population_score: 35,  vegetation_score: 20, traffic_score: 90 },

  // ---- East Jakarta (Jakarta Timur) ----
  { name: 'Matraman',           city: 'East Jakarta',    lat: -6.2040, lon: 106.8620, density_km2: 30000, population_score: 70,  vegetation_score: 12, traffic_score: 70 },
  { name: 'Pulogadung',         city: 'East Jakarta',    lat: -6.1840, lon: 106.9000, density_km2: 17000, population_score: 40,  vegetation_score: 12, traffic_score: 75 },
  { name: 'Jatinegara',         city: 'East Jakarta',    lat: -6.2250, lon: 106.8700, density_km2: 25000, population_score: 55,  vegetation_score: 12, traffic_score: 80 },
  { name: 'Duren Sawit',        city: 'East Jakarta',    lat: -6.2300, lon: 106.9100, density_km2: 17000, population_score: 40,  vegetation_score: 18, traffic_score: 65 },
  { name: 'Kramat Jati',        city: 'East Jakarta',    lat: -6.2740, lon: 106.8660, density_km2: 22000, population_score: 50,  vegetation_score: 20, traffic_score: 75 },
  { name: 'Makasar',            city: 'East Jakarta',    lat: -6.2680, lon: 106.8930, density_km2: 9000,  population_score: 25,  vegetation_score: 30, traffic_score: 70 },
  { name: 'Cakung',             city: 'East Jakarta',    lat: -6.1840, lon: 106.9520, density_km2: 12000, population_score: 30,  vegetation_score: 12, traffic_score: 75 },
  { name: 'Ciracas',            city: 'East Jakarta',    lat: -6.3230, lon: 106.8870, density_km2: 11000, population_score: 30,  vegetation_score: 35, traffic_score: 60 },
  { name: 'Cipayung',           city: 'East Jakarta',    lat: -6.3260, lon: 106.9060, density_km2: 9000,  population_score: 25,  vegetation_score: 45, traffic_score: 55 },
  { name: 'Pasar Rebo',         city: 'East Jakarta',    lat: -6.3110, lon: 106.8530, density_km2: 11000, population_score: 30,  vegetation_score: 35, traffic_score: 65 },

  // ---- Thousand Islands (Kepulauan Seribu) ----
  { name: 'Kepulauan Seribu Selatan', city: 'Thousand Islands', lat: -5.8500, lon: 106.6000, density_km2: 2500, population_score: 5, vegetation_score: 60, traffic_score: 5 },
  { name: 'Kepulauan Seribu Utara',   city: 'Thousand Islands', lat: -5.6500, lon: 106.5700, density_km2: 1500, population_score: 3, vegetation_score: 65, traffic_score: 3 },
];

// Banten province reference points — same method and scales as
// JAKARTA_AREAS above (documented in the header comment). Coverage is
// densest around Tangerang (Kota Tangerang's 13 kecamatan, all 7 of
// South Tangerang's, and Kabupaten Tangerang's main built-up districts)
// since that's the active testing ground, plus coarser anchors for
// Serang, Cilegon, Pandeglang, and Lebak.
//
// PROVENANCE anchors (curated approximations, same as Jakarta):
// - population: BPS municipal figures — South Tangerang 1.43M over
//   147.19 km² (~8,700/km² average, kecamatan range ~5k-14k); Kota
//   Tangerang ~1.9M over 164 km² (~11-12k/km²); same score mapping
//   (score ≈ density/450).
// - vegetation: South Tangerang green-space-equity study (61.2% of
//   residential areas underserved by public green space); BSD/Serpong
//   and the rural west are markedly greener than the industrial north.
// - traffic: Tangerang–Merak toll carries ~137k vehicles/day and is a
//   notorious truck corridor (Cikupa/Balaraja→Cilegon/Merak); Ciledug
//   and Ciputat corridors are long-standing commuter chokepoints;
//   Cilegon adds heavy-industry port traffic.
export const BANTEN_AREAS = [
  // ---- Kota Tangerang (13 kecamatan) ----
  { name: 'Tangerang (Kota)',   city: 'Kota Tangerang',      lat: -6.1780, lon: 106.6320, density_km2: 10000, population_score: 22, vegetation_score: 15, traffic_score: 70 },
  { name: 'Karawaci',           city: 'Kota Tangerang',      lat: -6.1850, lon: 106.6150, density_km2: 13000, population_score: 29, vegetation_score: 15, traffic_score: 70 },
  { name: 'Cibodas',            city: 'Kota Tangerang',      lat: -6.2130, lon: 106.6100, density_km2: 16000, population_score: 36, vegetation_score: 12, traffic_score: 65 },
  { name: 'Jatiuwung',          city: 'Kota Tangerang',      lat: -6.1850, lon: 106.5850, density_km2: 7500,  population_score: 17, vegetation_score: 8,  traffic_score: 75 },
  { name: 'Periuk',             city: 'Kota Tangerang',      lat: -6.1630, lon: 106.5950, density_km2: 14000, population_score: 31, vegetation_score: 12, traffic_score: 60 },
  { name: 'Batuceper',          city: 'Kota Tangerang',      lat: -6.1650, lon: 106.6580, density_km2: 8500,  population_score: 19, vegetation_score: 12, traffic_score: 70 },
  { name: 'Neglasari',          city: 'Kota Tangerang',      lat: -6.1520, lon: 106.6400, density_km2: 7000,  population_score: 16, vegetation_score: 15, traffic_score: 70 },
  { name: 'Benda',              city: 'Kota Tangerang',      lat: -6.1350, lon: 106.6600, density_km2: 5500,  population_score: 12, vegetation_score: 18, traffic_score: 75 },
  { name: 'Cipondoh',           city: 'Kota Tangerang',      lat: -6.1830, lon: 106.6800, density_km2: 11000, population_score: 24, vegetation_score: 20, traffic_score: 70 },
  { name: 'Pinang',             city: 'Kota Tangerang',      lat: -6.2050, lon: 106.6650, density_km2: 10000, population_score: 22, vegetation_score: 18, traffic_score: 60 },
  { name: 'Karang Tengah',      city: 'Kota Tangerang',      lat: -6.1950, lon: 106.7000, density_km2: 12000, population_score: 27, vegetation_score: 12, traffic_score: 70 },
  { name: 'Ciledug',            city: 'Kota Tangerang',      lat: -6.2270, lon: 106.7080, density_km2: 21000, population_score: 47, vegetation_score: 10, traffic_score: 85 },
  { name: 'Larangan',           city: 'Kota Tangerang',      lat: -6.2220, lon: 106.7330, density_km2: 20000, population_score: 44, vegetation_score: 10, traffic_score: 75 },

  // ---- Kota Tangerang Selatan (7 kecamatan) ----
  { name: 'Serpong',            city: 'Tangerang Selatan',   lat: -6.3200, lon: 106.6650, density_km2: 7500,  population_score: 17, vegetation_score: 35, traffic_score: 60 },
  { name: 'Serpong Utara',      city: 'Tangerang Selatan',   lat: -6.2850, lon: 106.6650, density_km2: 9000,  population_score: 20, vegetation_score: 28, traffic_score: 65 },
  { name: 'Pondok Aren',        city: 'Tangerang Selatan',   lat: -6.2700, lon: 106.7150, density_km2: 13500, population_score: 30, vegetation_score: 20, traffic_score: 70 },
  { name: 'Ciputat',            city: 'Tangerang Selatan',   lat: -6.3100, lon: 106.7400, density_km2: 13000, population_score: 29, vegetation_score: 22, traffic_score: 85 },
  { name: 'Ciputat Timur',      city: 'Tangerang Selatan',   lat: -6.2900, lon: 106.7600, density_km2: 13000, population_score: 29, vegetation_score: 20, traffic_score: 75 },
  { name: 'Pamulang',           city: 'Tangerang Selatan',   lat: -6.3430, lon: 106.7380, density_km2: 12500, population_score: 28, vegetation_score: 25, traffic_score: 70 },
  { name: 'Setu',               city: 'Tangerang Selatan',   lat: -6.3450, lon: 106.6800, density_km2: 5500,  population_score: 12, vegetation_score: 35, traffic_score: 50 },

  // ---- Kabupaten Tangerang (main built-up districts) ----
  { name: 'Kelapa Dua',         city: 'Kabupaten Tangerang', lat: -6.2450, lon: 106.6280, density_km2: 9000,  population_score: 20, vegetation_score: 25, traffic_score: 65 },
  { name: 'Curug',              city: 'Kabupaten Tangerang', lat: -6.2650, lon: 106.5600, density_km2: 6500,  population_score: 14, vegetation_score: 30, traffic_score: 65 },
  { name: 'Cikupa',             city: 'Kabupaten Tangerang', lat: -6.2350, lon: 106.5080, density_km2: 7000,  population_score: 16, vegetation_score: 20, traffic_score: 75 },
  { name: 'Balaraja',           city: 'Kabupaten Tangerang', lat: -6.2000, lon: 106.4600, density_km2: 4500,  population_score: 10, vegetation_score: 30, traffic_score: 70 },
  { name: 'Pasar Kemis',        city: 'Kabupaten Tangerang', lat: -6.1700, lon: 106.5300, density_km2: 12000, population_score: 27, vegetation_score: 18, traffic_score: 65 },
  { name: 'Tigaraksa',          city: 'Kabupaten Tangerang', lat: -6.2700, lon: 106.4700, density_km2: 4000,  population_score: 9,  vegetation_score: 40, traffic_score: 45 },
  { name: 'Teluknaga',          city: 'Kabupaten Tangerang', lat: -6.0980, lon: 106.6380, density_km2: 4000,  population_score: 9,  vegetation_score: 30, traffic_score: 50 },
  { name: 'Kosambi',            city: 'Kabupaten Tangerang', lat: -6.1050, lon: 106.6850, density_km2: 4500,  population_score: 10, vegetation_score: 25, traffic_score: 55 },
  { name: 'Cisauk',             city: 'Kabupaten Tangerang', lat: -6.3400, lon: 106.6400, density_km2: 5000,  population_score: 11, vegetation_score: 35, traffic_score: 50 },

  // ---- Serang / Cilegon / rural west (coarse anchors) ----
  { name: 'Kota Serang',        city: 'Serang',              lat: -6.1200, lon: 106.1500, density_km2: 2600,  population_score: 6,  vegetation_score: 35, traffic_score: 55 },
  { name: 'Ciruas',             city: 'Kabupaten Serang',    lat: -6.1450, lon: 106.2300, density_km2: 2000,  population_score: 4,  vegetation_score: 40, traffic_score: 60 },
  { name: 'Kramatwatu',         city: 'Kabupaten Serang',    lat: -6.0750, lon: 106.1000, density_km2: 2000,  population_score: 4,  vegetation_score: 35, traffic_score: 60 },
  { name: 'Kota Cilegon',       city: 'Cilegon',             lat: -6.0170, lon: 106.0540, density_km2: 2500,  population_score: 6,  vegetation_score: 15, traffic_score: 80 },
  { name: 'Anyar',              city: 'Kabupaten Serang',    lat: -6.3300, lon: 105.9200, density_km2: 1000,  population_score: 2,  vegetation_score: 55, traffic_score: 45 },
  { name: 'Pandeglang',         city: 'Pandeglang',          lat: -6.3150, lon: 106.1070, density_km2: 600,   population_score: 2,  vegetation_score: 75, traffic_score: 30 },
  { name: 'Rangkasbitung',      city: 'Lebak',               lat: -6.3600, lon: 106.2450, density_km2: 1500,  population_score: 3,  vegetation_score: 65, traffic_score: 40 },
];

// Combined reference set the engine interpolates over.
export const REFERENCE_AREAS = [...JAKARTA_AREAS, ...BANTEN_AREAS];

// Rough bounding check: is this point plausibly inside DKI Jakarta's
// mainland area? (Kept for the Jakarta-only overlay filter.)
export function isInJakarta(lat, lon) {
  return lat >= -6.42 && lat <= -6.05 && lon >= 106.65 && lon <= 107.02;
}

// Banten box: Tangerang region through Serang/Cilegon down to
// Pandeglang/Lebak's northern towns.
export function isInBanten(lat, lon) {
  return lat >= -6.45 && lat <= -5.9 && lon >= 105.8 && lon <= 106.78;
}

// Full service area — where interpolation applies; everywhere else falls
// back to neutral slow signals. Note Depok/Bekasi/Bogor (West Java) are
// deliberately excluded: no reference data there yet.
export function isInServiceArea(lat, lon) {
  return isInJakarta(lat, lon) || isInBanten(lat, lon);
}
