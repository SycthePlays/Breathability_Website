import { getCompositeAqiBatch } from './aqiEngine';

// Public OSRM demo servers — free, no key, but rate-limited and meant for
// light/demo use only. Default is the FOSSGIS foot-profile instance since
// Breathability plans walks; override with OSRM_BASE_URL (e.g. a
// self-hosted OSRM or GraphHopper) before relying on this beyond the
// hackathon. The classic driving demo is
// https://router.project-osrm.org/route/v1/driving.
const OSRM_BASE =
  process.env.OSRM_BASE_URL ||
  'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

// Sampling density along each candidate for AQI exposure. Samples are
// effectively free now: live AQI snaps to ≤6 cached city anchors (see
// aqiEngine), and the fine texture comes from local IDW interpolation of
// the vegetation/traffic/population signals — so dense sampling costs CPU,
// not Open-Meteo quota. Aim for one sample every ~250m, with sane bounds.
const SAMPLE_EVERY_METERS = 250;
const MIN_SAMPLES = 4;
const MAX_SAMPLES = 40;

// Rank score weights: exposure matters more than speed — that's the
// product — but time still breaks ties so the "cleanest" pick can't be
// an absurd detour.
const RANK_WEIGHTS = { exposure: 0.6, duration: 0.4 };

function samplePoints(coordinates, distanceMeters) {
  if (!coordinates?.length) return [];
  const count = Math.min(
    MAX_SAMPLES,
    Math.max(MIN_SAMPLES, Math.round((distanceMeters || 0) / SAMPLE_EVERY_METERS))
  );
  const points = [];
  for (let i = 0; i < count; i++) {
    // Evenly spaced interior fractions (skip the shared endpoints so
    // samples actually differentiate the candidates).
    const frac = (i + 1) / (count + 1);
    const [lon, lat] = coordinates[Math.floor(frac * (coordinates.length - 1))];
    points.push({ lat, lon });
  }
  return points;
}

// Scores every candidate's samples in ONE batched engine call (≤6 anchor
// fetches total, shared across all routes). Returns per-route averages.
async function averageExposures(candidates) {
  const perRoute = candidates.map((route) =>
    samplePoints(route.geometry?.coordinates, route.distance)
  );
  const flat = perRoute.flat();
  if (!flat.length) return candidates.map(() => null);

  let results;
  try {
    results = await getCompositeAqiBatch(flat);
  } catch {
    return candidates.map(() => null);
  }

  const averages = [];
  let cursor = 0;
  for (const points of perRoute) {
    const slice = results.slice(cursor, cursor + points.length);
    cursor += points.length;
    const scores = slice.filter(Boolean).map((r) => r.compositeScore);
    averages.push(
      scores.length ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null
    );
  }
  return averages;
}

function normalizeAcross(values) {
  const present = values.filter((v) => v != null);
  const min = Math.min(...present);
  const max = Math.max(...present);
  return values.map((v) => {
    if (v == null) return 0.5; // neutral when a signal is missing
    if (max === min) return 0.5;
    return (v - min) / (max - min);
  });
}

// Fetches alternative candidate routes from OSRM, samples composite AQI
// along each, then re-ranks by exposure + duration. Returns the top 3,
// best first, each labeled Cleanest Path / Balanced / Fastest.
export async function getRankedRoutes(start, destination) {
  const coords = `${start.lon},${start.lat};${destination.lon},${destination.lat}`;
  const url = `${OSRM_BASE}/${coords}?alternatives=3&overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Routing request failed: ${res.status}`);
  }

  const data = await res.json();
  const candidates = (data.routes || []).slice(0, 3);
  if (!candidates.length) return [];

  const exposures = await averageExposures(candidates);

  const exposureNorm = normalizeAcross(exposures);
  const durationNorm = normalizeAcross(candidates.map((r) => r.duration));

  const ranked = candidates
    .map((route, i) => ({
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      geometry: route.geometry,
      avgAqiExposure: exposures[i] != null ? Math.round(exposures[i]) : null,
      rankScore:
        exposureNorm[i] * RANK_WEIGHTS.exposure + durationNorm[i] * RANK_WEIGHTS.duration,
    }))
    .sort((a, b) => a.rankScore - b.rankScore);

  // Labels describe what each option is best at, not just its rank.
  const cleanestIdx = ranked.reduce(
    (best, r, i) =>
      (r.avgAqiExposure ?? Infinity) < (ranked[best].avgAqiExposure ?? Infinity) ? i : best,
    0
  );
  const fastestIdx = ranked.reduce(
    (best, r, i) => (r.durationSeconds < ranked[best].durationSeconds ? i : best),
    0
  );

  return ranked.map((route, i) => {
    let label = 'Balanced';
    if (i === cleanestIdx && i === fastestIdx) label = 'Cleanest & Fastest';
    else if (i === cleanestIdx) label = 'Cleanest Path';
    else if (i === fastestIdx) label = 'Fastest';
    return { id: i, label, ...route };
  });
}
