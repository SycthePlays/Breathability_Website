import { supabase, supabaseAdmin } from './supabaseClient';
import { fetchLiveAqiBatch } from './openMeteo';
import { JAKARTA_AREAS, isInJakarta } from './jakartaAreas';

// Composite AQI = weighted sum of four 0-100 signals. Live AQI is the only
// ground-truth measurement, so it carries most of the weight; the other
// three correct for the space between monitoring points. Tune against
// independent local reporting once real pipelines replace the curated
// reference data (see lib/jakartaAreas.js for provenance).
const WEIGHTS = {
  liveAqi: 0.55,
  vegetation: 0.15, // inverted: more vegetation lowers the score
  traffic: 0.2,
  population: 0.1,
};

// Live-AQI anchor points — one per mainland administrative city. Open-Meteo
// air quality rides on the CAMS model (~11 km native resolution), so
// fetching live AQI at every sample point costs quota without adding
// information. All live reads snap to the nearest anchor: a whole
// "Find Routes" press costs AT MOST 6 quota units (one HTTP request), and
// anchors are cached for ~1h in openMeteo.js. The fine spatial texture
// (the ~10m goal) comes from interpolating the slow signals below.
const LIVE_ANCHORS = [
  { name: 'Central Jakarta', lat: -6.1805, lon: 106.8284 },
  { name: 'North Jakarta', lat: -6.1214, lon: 106.8845 },
  { name: 'West Jakarta', lat: -6.1683, lon: 106.7589 },
  { name: 'East Jakarta', lat: -6.2251, lon: 106.9004 },
  { name: 'South Jakarta', lat: -6.2615, lon: 106.8106 },
  { name: 'Kebayoran', lat: -6.2437, lon: 106.7834 },
];

// IDW settings: blend the k nearest kecamatan centroids with inverse-square
// falloff. Interpolation is continuous, so two points ~10m apart get their
// own values — resolution is bounded by the input layers (Sentinel-2 NDVI
// can genuinely hit ~10m; BPS population is kelurahan-level), not by any
// storage grid. See docs/PROJECT_PLAN.md for the resolution discussion.
const IDW_NEIGHBORS = 4;
const IDW_POWER = 2;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function normalize(value, min, max) {
  if (value === null || value === undefined) return 50; // neutral fallback
  const clamped = Math.min(Math.max(value, min), max);
  return ((clamped - min) / (max - min)) * 100;
}

// Reference rows come from Supabase's area_reference when configured and
// populated, falling back to the bundled lib/jakartaAreas.js dataset
// (identical shape) otherwise — the app never needs credentials to work.
let areaCache = { rows: null, fetchedAt: 0 };
const AREA_CACHE_TTL_MS = 10 * 60 * 1000;

async function getReferenceAreas() {
  const now = Date.now();
  if (areaCache.rows && now - areaCache.fetchedAt < AREA_CACHE_TTL_MS) {
    return areaCache.rows;
  }
  let rows = JAKARTA_AREAS;
  try {
    const { data, error } = await supabase
      .from('area_reference')
      .select('name, lat, lon, vegetation_score, traffic_score, population_score')
      .limit(1000);
    if (!error && data?.length) rows = data;
  } catch {
    // keep the local dataset
  }
  areaCache = { rows, fetchedAt: now };
  return rows;
}

// Inverse-distance-weighted blend of the three slow signals from the k
// nearest reference points. A point on a centroid gets that district's
// exact values; everywhere else gets a smooth mix, so scores vary
// continuously along a route instead of jumping at district borders.
function interpolateSlowSignals(lat, lon, areas) {
  if (!isInJakarta(lat, lon) || !areas.length) {
    return { vegetation: 50, traffic: 50, population: 50, nearestArea: null };
  }

  const nearest = areas
    .map((a) => ({ ...a, distKm: haversineKm(lat, lon, a.lat, a.lon) }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, IDW_NEIGHBORS);

  // Within ~10m of a centroid: use it directly (also avoids a
  // divide-by-zero blowup in the IDW weights).
  if (nearest[0].distKm < 0.01) {
    const a = nearest[0];
    return {
      vegetation: a.vegetation_score,
      traffic: a.traffic_score,
      population: a.population_score,
      nearestArea: a.name,
    };
  }

  let wSum = 0;
  let veg = 0;
  let traf = 0;
  let pop = 0;
  for (const a of nearest) {
    const w = 1 / a.distKm ** IDW_POWER;
    wSum += w;
    veg += w * a.vegetation_score;
    traf += w * a.traffic_score;
    pop += w * a.population_score;
  }

  return {
    vegetation: veg / wSum,
    traffic: traf / wSum,
    population: pop / wSum,
    nearestArea: nearest[0].name,
  };
}

function nearestAnchor(lat, lon) {
  let best = LIVE_ANCHORS[0];
  let bestDist = Infinity;
  for (const a of LIVE_ANCHORS) {
    const d = haversineKm(lat, lon, a.lat, a.lon);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best;
}

function compositeScore(live, slow) {
  const liveScore = normalize(live?.usAqi, 0, 200);
  return Math.round(
    liveScore * WEIGHTS.liveAqi +
      (100 - slow.vegetation) * WEIGHTS.vegetation +
      slow.traffic * WEIGHTS.traffic +
      slow.population * WEIGHTS.population
  );
}

// Score many points in one shot. Live AQI: one batched Open-Meteo request
// covering only the unique anchors involved (≤6 quota units, ~1h cached).
// Slow signals: free local interpolation per exact point. Nothing here
// runs on page load or a timer — callers fire this on explicit user
// actions only (the routing button, one landing snapshot per hour).
export async function getCompositeAqiBatch(points) {
  const areas = await getReferenceAreas();

  // Snap each point to its live anchor. Out-of-Jakarta points keep their
  // own coordinates (no anchor represents them).
  const anchored = points.map((p) =>
    isInJakarta(p.lat, p.lon) ? nearestAnchor(p.lat, p.lon) : { lat: p.lat, lon: p.lon }
  );

  // Deduplicate the live fetch by anchor coordinates.
  const uniqueKeys = [...new Set(anchored.map((a) => `${a.lat},${a.lon}`))];
  const uniquePoints = uniqueKeys.map((k) => {
    const [lat, lon] = k.split(',').map(Number);
    return { lat, lon };
  });
  const liveResults = await fetchLiveAqiBatch(uniquePoints);
  const liveByKey = new Map(uniqueKeys.map((k, i) => [k, liveResults[i]]));

  const computedAt = new Date().toISOString();

  return points.map((p, i) => {
    const live = liveByKey.get(`${anchored[i].lat},${anchored[i].lon}`);
    const slow = interpolateSlowSignals(p.lat, p.lon, areas);
    const result = {
      lat: p.lat,
      lon: p.lon,
      compositeScore: compositeScore(live, slow),
      liveAqi: live?.usAqi ?? null,
      pm25: live?.pm25 ?? null,
      pm10: live?.pm10 ?? null,
      signals: {
        vegetation: Math.round(slow.vegetation),
        traffic: Math.round(slow.traffic),
        population: Math.round(slow.population),
      },
      nearestArea: slow.nearestArea,
      computedAt,
    };
    persistToCache(result);
    return result;
  });
}

export async function getCompositeAqi(lat, lon) {
  const [result] = await getCompositeAqiBatch([{ lat, lon }]);
  return result;
}

// Best-effort write to aqi_score_cache — RLS only allows public reads, so
// this needs the service-role client and is silently skipped without it.
function persistToCache(result) {
  if (!supabaseAdmin) return;
  supabaseAdmin
    .from('aqi_score_cache')
    .insert({
      lat: result.lat,
      lon: result.lon,
      composite_score: result.compositeScore,
      live_aqi: result.liveAqi,
    })
    .then(() => {}, () => {});
}
