'use client';

import { useEffect, useState } from 'react';
import { categorizeAqi } from '../lib/aqiCategories';

// Same coordinates as the 'Central Jakarta' and 'Kota Tangerang' entries
// in lib/aqiEngine.js's LIVE_ANCHORS. Using the identical lat/lon means
// this snapshot shares the exact same server-side cache entry as the
// dashboard's route search — so if either one has already been fetched
// this hour, the other one costs zero extra Open-Meteo quota.
const AREAS = [
  { name: 'Jakarta', lat: -6.1805, lon: 106.8284 },
  { name: 'Tangerang', lat: -6.178, lon: 106.632 },
];

// One fetch per hour per browser (both areas in a single batched request):
// cached in localStorage, and the two areas then take turns on screen
// without any further network activity.
const STORAGE_KEY = 'breathability:snapshot:v2';
const SNAPSHOT_TTL_MS = 60 * 60 * 1000;
const ROTATE_MS = 5000;

// Live AQI snapshot for the landing page: a hero pill plus a detail card
// with PM2.5/PM10 bars, cycling between Jakarta and Tangerang every few
// seconds. Both fed by one batched /api/aqi call.
export default function LiveSnapshot({ variant = 'pill' }) {
  const [results, setResults] = useState(null); // [{name, ...aqiFields}, ...]
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (cached?.data && Date.now() - cached.at < SNAPSHOT_TTL_MS) {
        setResults(cached.data);
        return;
      }
    } catch {
      // bad cache — fall through to a fresh fetch
    }
    fetch('/api/aqi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: AREAS.map(({ lat, lon }) => ({ lat, lon })) }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        const merged = (data.results || []).map((r, i) => ({ ...r, name: AREAS[i].name }));
        setResults(merged);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), data: merged }));
        } catch {
          // storage unavailable — snapshot still renders
        }
      })
      .catch(() => setFailed(true));
  }, []);

  // Cycle to the next area every few seconds — pure client-side rotation
  // over already-fetched data, no additional requests.
  useEffect(() => {
    if (!results || results.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % results.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [results]);

  const data = results?.[index];

  if (variant === 'pill') {
    return (
      <div className="glass-panel px-4 py-2 rounded-full border border-outline-variant/30 breathable-shadow flex items-center gap-2 min-w-[280px] justify-center">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          location_on
        </span>
        <span
          key={data?.name ?? 'loading'}
          className="font-label-md text-label-md text-on-surface transition-opacity duration-500"
        >
          {failed ? (
            <>Air quality data unavailable</>
          ) : data ? (
            <>
              {data.name}&rsquo;s air right now:{' '}
              <span className={`font-bold ${categorizeAqi(data.liveAqi).textClass}`}>
                {categorizeAqi(data.liveAqi).label} ({Math.round(data.liveAqi)} AQI)
              </span>
            </>
          ) : (
            <span className="text-on-surface-variant">loading…</span>
          )}
        </span>
      </div>
    );
  }

  // variant === 'card' — the detailed snapshot from the mobile mockup.
  const pm25Pct = data?.pm25 != null ? Math.min((data.pm25 / 55) * 100, 100) : 0;
  const pm10Pct = data?.pm10 != null ? Math.min((data.pm10 / 150) * 100, 100) : 0;

  return (
    <div className="bg-surface-container-lowest rounded-xl p-card-padding breathable-shadow border border-outline-variant/30 w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-headline-md text-headline-md text-on-surface m-0">
          Live Snapshot{data ? ` — ${data.name}` : ''}
        </h3>
        <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label-sm text-label-sm">
          {failed ? 'Offline' : data ? 'Live' : 'Loading…'}
        </span>
      </div>
      <div className="space-y-4">
        <SnapshotBar
          label="Fine Particulates (PM2.5)"
          value={data?.pm25 != null ? `${data.pm25} µg/m³` : '—'}
          pct={pm25Pct}
        />
        <SnapshotBar
          label="Coarse Particulates (PM10)"
          value={data?.pm10 != null ? `${data.pm10} µg/m³` : '—'}
          pct={pm10Pct}
        />
        <div className="pt-2 border-t border-outline-variant/20 flex justify-between items-center">
          <span className="font-label-md text-label-md text-on-surface-variant">US AQI</span>
          <span className={`font-bold text-headline-md font-headline-md ${categorizeAqi(data?.liveAqi).textClass}`}>
            {data?.liveAqi != null ? Math.round(data.liveAqi) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function SnapshotBar({ label, value, pct }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-label-md text-label-md mb-1">
        <span className="text-on-surface-variant">{label}</span>
        <span className="text-primary font-bold">{value}</span>
      </div>
      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #4DB6AC 0%, #a9cfbc 100%)',
          }}
        />
      </div>
    </div>
  );
}
