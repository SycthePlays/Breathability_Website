'use client';

import { useEffect, useState } from 'react';
import { categorizeAqi } from '../lib/aqiCategories';

const JAKARTA_CENTER = { lat: -6.2088, lon: 106.8456 };

// One snapshot per hour per browser: the result is cached in localStorage
// (matching Open-Meteo's hourly update cadence), so reloading the landing
// page costs zero API quota until the hour rolls over.
const STORAGE_KEY = 'breathability:snapshot:v1';
const SNAPSHOT_TTL_MS = 60 * 60 * 1000;

// Live AQI snapshot for the landing page: a hero pill plus a detail card
// with PM2.5/PM10 bars, both fed by one /api/aqi call for central Jakarta.
export default function LiveSnapshot({ variant = 'pill' }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (cached?.data && Date.now() - cached.at < SNAPSHOT_TTL_MS) {
        setData(cached.data);
        return;
      }
    } catch {
      // bad cache — fall through to a fresh fetch
    }
    fetch(`/api/aqi?lat=${JAKARTA_CENTER.lat}&lon=${JAKARTA_CENTER.lon}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((fresh) => {
        setData(fresh);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), data: fresh }));
        } catch {
          // storage unavailable — snapshot still renders
        }
      })
      .catch(() => setFailed(true));
  }, []);

  if (variant === 'pill') {
    return (
      <div className="glass-panel px-4 py-2 rounded-full border border-outline-variant/30 breathable-shadow flex items-center gap-2">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          location_on
        </span>
        <span className="font-label-md text-label-md text-on-surface">
          Jakarta&rsquo;s air right now:{' '}
          {failed ? (
            <span className="text-on-surface-variant">unavailable</span>
          ) : data ? (
            <span className={`font-bold ${categorizeAqi(data.liveAqi).textClass}`}>
              {categorizeAqi(data.liveAqi).label} ({Math.round(data.liveAqi)} AQI)
            </span>
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
        <h3 className="font-headline-md text-headline-md text-on-surface m-0">Live Snapshot</h3>
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
