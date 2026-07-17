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

// OSRM's alternatives are best-effort — for many start/destination pairs
// it returns just one or two. To keep a consistent three options, extra
// candidates are synthesized by routing through a detour waypoint placed
// perpendicular to the straight line's midpoint (alternating sides,
// growing offsets), then deduplicated against what OSRM already gave us.
async function fetchOsrm(coordsStr, params) {
  const res = await fetch(`${OSRM_BASE}/${coordsStr}?${params}`);
  if (!res.ok) {
    throw new Error(`Routing request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.routes || [];
}

function routeMidpoint(route) {
  const coords = route.geometry?.coordinates || [];
  if (!coords.length) return null;
  const [lon, lat] = coords[Math.floor(coords.length / 2)];
  return { lat, lon };
}

function isDistinct(candidate, existing) {
  for (const other of existing) {
    const distDiff =
      Math.abs(candidate.distance - other.distance) / Math.max(other.distance, 1);
    const m1 = routeMidpoint(candidate);
    const m2 = routeMidpoint(other);
    const midApartKm =
      m1 && m2 ? haversineKm(m1.lat, m1.lon, m2.lat, m2.lon) : Infinity;
    // Same length AND same middle → it's the same street sequence.
    if (distDiff < 0.02 && midApartKm < 0.25) return false;
  }
  return true;
}

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

async function gatherCandidates(start, destination) {
  const direct = `${start.lon},${start.lat};${destination.lon},${destination.lat}`;
  const candidates = (
    await fetchOsrm(direct, 'alternatives=3&overview=full&geometries=geojson')
  ).slice(0, 3);

  if (candidates.length >= 3) return candidates;

  // Synthesize detours: waypoints offset perpendicular to the midpoint of
  // the straight line, scaled to the trip (400m floor, 2.5km cap).
  const midLat = (start.lat + destination.lat) / 2;
  const midLon = (start.lon + destination.lon) / 2;
  const straightKm = haversineKm(start.lat, start.lon, destination.lat, destination.lon);
  const offsetKm = Math.min(Math.max(straightKm * 0.18, 0.4), 2.5);

  // Unit vector perpendicular to the start→destination direction, in
  // degrees (lon scaled by cos(lat) so offsets are truly sideways).
  const latScale = Math.cos((midLat * Math.PI) / 180);
  let dx = (destination.lon - start.lon) * latScale;
  let dy = destination.lat - start.lat;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perp = { lat: -dx / len, lon: dy / len / latScale };
  const kmPerDeg = 111;

  for (const side of [1, -1, 2, -2]) {
    if (candidates.length >= 3) break;
    const via = {
      lat: midLat + perp.lat * (offsetKm / kmPerDeg) * side,
      lon: midLon + perp.lon * (offsetKm / kmPerDeg) * side,
    };
    try {
      const [detour] = await fetchOsrm(
        `${start.lon},${start.lat};${via.lon},${via.lat};${destination.lon},${destination.lat}`,
        'overview=full&geometries=geojson'
      );
      if (detour && isDistinct(detour, candidates)) {
        candidates.push(detour);
      }
    } catch {
      // demo OSRM hiccup on one detour — keep trying the other side
    }
  }

  return candidates.slice(0, 3);
}

// Reader-friendly identities: routes are always presented best-first as
// Route A / B / C with a plain-language note, plus trait chips for what
// each is best at.
const RANK_NOTES = [
  'Best choice — the strongest balance of clean air and travel time.',
  'Solid alternative — a reasonable trade-off if Route A doesn’t suit.',
  'Backup option — the weakest air-to-time balance of the three.',
];

// Fetches (and if needed synthesizes) three candidate routes, samples
// composite AQI along each, then re-ranks by exposure + duration.
// Returns best-first as Route A / B / C.
export async function getRankedRoutes(start, destination) {
  const candidates = await gatherCandidates(start, destination);
  if (!candidates.length) return [];

  const exposures = await averageExposures(candidates);

  // When the candidates' air exposure is effectively tied (all anchored to
  // the same live reading and passing similar districts), a sub-3-point
  // spread is noise, not signal — let travel time decide the ranking
  // instead of amplifying the noise with the 0.6 exposure weight.
  const present = exposures.filter((v) => v != null);
  const exposureSpread = present.length ? Math.max(...present) - Math.min(...present) : 0;
  const exposureMeaningful = exposureSpread >= 3;

  const exposureNorm = exposureMeaningful
    ? normalizeAcross(exposures)
    : exposures.map(() => 0.5);
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

  // Trait chips describe what each option is best at; the A/B/C rank and
  // note describe how they compare overall. Traits are only awarded when
  // the difference is real: "Cleanest air" needs a ≥3-point exposure
  // spread, "Fastest" needs a ≥3-minute lead over the slowest.
  const cleanestIdx = ranked.reduce(
    (best, r, i) =>
      (r.avgAqiExposure ?? Infinity) < (ranked[best].avgAqiExposure ?? Infinity) ? i : best,
    0
  );
  const fastestIdx = ranked.reduce(
    (best, r, i) => (r.durationSeconds < ranked[best].durationSeconds ? i : best),
    0
  );
  const durationSpread =
    Math.max(...ranked.map((r) => r.durationSeconds)) -
    Math.min(...ranked.map((r) => r.durationSeconds));

  return ranked.map((route, i) => {
    const traits = [];
    if (exposureMeaningful && i === cleanestIdx) traits.push('Cleanest air');
    if (durationSpread >= 180 && i === fastestIdx) traits.push('Fastest');
    if (!traits.length) traits.push(exposureMeaningful ? 'Balanced' : 'Similar air');
    return {
      id: i,
      label: `Route ${String.fromCharCode(65 + i)}`, // Route A, B, C
      note: RANK_NOTES[i] ?? RANK_NOTES[RANK_NOTES.length - 1],
      traits,
      ...route,
    };
  });
}
