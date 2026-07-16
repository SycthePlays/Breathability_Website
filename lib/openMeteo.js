// Open-Meteo Air Quality API — free for non-commercial use, no key required,
// rate-limited to 10,000 calls/day. See docs/PROJECT_PLAN.md for the full
// usage-limit breakdown before this goes past hackathon scale.

const OPEN_METEO_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export async function fetchLiveAqi(lat, lon) {
  const url = `${OPEN_METEO_BASE}?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Open-Meteo request failed: ${res.status}`);
  }

  const data = await res.json();

  return {
    usAqi: data.current?.us_aqi ?? null,
    pm25: data.current?.pm2_5 ?? null,
    pm10: data.current?.pm10 ?? null,
    fetchedAt: data.current?.time ?? null,
  };
}
