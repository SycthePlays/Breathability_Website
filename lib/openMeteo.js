// Open-Meteo Air Quality API — free for non-commercial use, no key required,
// rate-limited to 10,000 calls/day (counted per location, so a batched
// request for N points costs N against the quota but only one HTTP
// round-trip). See docs/PROJECT_PLAN.md for the usage-limit breakdown.
//
// Quota discipline: nothing in the app calls this on page load or on a
// timer. Fetches happen only when the user presses "Find Routes" (or the
// landing snapshot's first visit in an hour), and every result is cached
// server-side for ~1h below, matching Open-Meteo's hourly update cadence.

const OPEN_METEO_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

// ~11m grid: two points inside the same 4-decimal cell share a cache entry.
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map(); // "lat,lon" (4dp) -> { data, expiresAt }

function cacheKey(lat, lon) {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

function readCache(lat, lon) {
  const hit = cache.get(cacheKey(lat, lon));
  if (hit && hit.expiresAt > Date.now()) return hit.data;
  return null;
}

function writeCache(lat, lon, data) {
  // Bounded so a long-running server can't grow this without limit.
  if (cache.size > 5000) cache.clear();
  cache.set(cacheKey(lat, lon), { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function parseEntry(item) {
  const current = item?.current;
  // Hourly forecast (CAMS, up to 2 days) rides along in the same request
  // and cache entry — time-based predictions cost zero extra quota.
  // timezone=UTC is requested, so times arrive like "2026-07-17T05:00";
  // normalize to real ISO by appending Z.
  const times = item?.hourly?.time ?? [];
  const values = item?.hourly?.us_aqi ?? [];
  const hourly = times.map((t, i) => ({
    time: `${t}:00Z`, // "2026-07-17T05:00" -> "2026-07-17T05:00:00Z"
    usAqi: values[i] ?? null,
  }));
  return {
    usAqi: current?.us_aqi ?? null,
    pm25: current?.pm2_5 ?? null,
    pm10: current?.pm10 ?? null,
    fetchedAt: current?.time ?? null,
    hourly,
  };
}

// Forecast lookup on a cached entry: the hourly value covering `when`
// (floored to the hour). Falls back to the current reading when the
// target is outside the forecast window.
export function forecastAt(entry, when) {
  if (!entry?.hourly?.length) return entry?.usAqi ?? null;
  const target = new Date(when);
  target.setUTCMinutes(0, 0, 0);
  const key = target.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
  const hit = entry.hourly.find((h) => h.time.slice(0, 16) === key);
  return hit?.usAqi ?? entry.usAqi ?? null;
}

// Fetch live AQI for many points in ONE HTTP request. Returns results in
// the same order as `points`. Cached points are served locally and only
// the misses go out over the network.
export async function fetchLiveAqiBatch(points) {
  const results = new Array(points.length).fill(null);
  const misses = [];

  points.forEach((p, i) => {
    const cached = readCache(p.lat, p.lon);
    if (cached) results[i] = cached;
    else misses.push({ ...p, index: i });
  });

  if (misses.length) {
    const lats = misses.map((p) => p.lat.toFixed(4)).join(',');
    const lons = misses.map((p) => p.lon.toFixed(4)).join(',');
    const url =
      `${OPEN_METEO_BASE}?latitude=${lats}&longitude=${lons}` +
      `&current=us_aqi,pm2_5,pm10&hourly=us_aqi&forecast_days=2&timezone=UTC`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed: ${res.status}`);
    }

    const data = await res.json();
    // Multi-location requests return an array; a single location returns
    // a bare object.
    const items = Array.isArray(data) ? data : [data];

    misses.forEach((miss, j) => {
      const parsed = parseEntry(items[j]);
      writeCache(miss.lat, miss.lon, parsed);
      results[miss.index] = parsed;
    });
  }

  return results;
}

export async function fetchLiveAqi(lat, lon) {
  const [result] = await fetchLiveAqiBatch([{ lat, lon }]);
  return result;
}
