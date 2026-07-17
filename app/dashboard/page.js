'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './dashboard.module.css';
import TopNav from '../../components/TopNav';
import RoutePanel from '../../components/RoutePanel';
import { SCORE_LEVELS } from '../../lib/aqiCategories';
import { REFERENCE_AREAS, isInServiceArea } from '../../lib/jakartaAreas';

// Mainland district centroids (Jakarta + Banten) for the map overlay —
// the Thousand Islands sit far outside the default viewport. Scored via
// POST /api/aqi, but only when the user presses "Find Routes", never on
// page load.
const OVERLAY_AREAS = REFERENCE_AREAS.filter((a) => isInServiceArea(a.lat, a.lon));

// Everything worth keeping across a refresh lives under one key. Quota
// discipline again: a reload restores routes, overlay, and explanation
// from localStorage instead of re-calling any API.
const STORAGE_KEY = 'breathability:dashboard:v1';

// Loaded client-side only — Leaflet needs the browser window.
const MapView = dynamic(() => import('../../components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-surface-dim text-on-surface-variant font-label-md">
      Loading map…
    </div>
  ),
});

// Best-effort reverse geocode for dropped pins (Photon, free/no key).
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=en`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const p = data.features?.[0]?.properties;
    if (p?.name) return [p.name, p.district || p.city].filter(Boolean).join(', ');
  } catch {
    // fall through to coordinates
  }
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

export default function Dashboard() {
  const [start, setStart] = useState(null); // {lat, lon, label}
  const [destination, setDestination] = useState(null);
  const [pinMode, setPinMode] = useState(null); // 'start' | 'dest' | null
  const [routes, setRoutes] = useState([]);
  const [overlay, setOverlay] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);
  // Mobile bottom sheet starts collapsed so the map owns the screen (the
  // desktop sidebar ignores this entirely). It auto-expands when results
  // arrive and collapses while the user is placing a pin on the map.
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const explainSeq = useRef(0); // guards against out-of-order explain responses

  // Restore the last session once on mount — no API calls involved.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.start) setStart(saved.start);
      if (saved.destination) setDestination(saved.destination);
      if (saved.routes?.length) setRoutes(saved.routes);
      if (saved.overlay?.length) setOverlay(saved.overlay);
      if (typeof saved.selectedIndex === 'number') setSelectedIndex(saved.selectedIndex);
      if (saved.explanation) setExplanation(saved.explanation);
    } catch {
      // corrupt/old snapshot — start fresh
    }
  }, []);

  // Snapshot everything worth keeping whenever it changes.
  useEffect(() => {
    if (!start && !destination && !routes.length) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          start,
          destination,
          routes,
          overlay,
          selectedIndex,
          explanation,
          savedAt: Date.now(),
        })
      );
    } catch {
      // storage full/unavailable — persistence is best-effort
    }
  }, [start, destination, routes, overlay, selectedIndex, explanation]);

  // Changing either location invalidates the current results — this is the
  // "reset": routes and the explanation clear, and the next Find Routes
  // press computes fresh ones. The overlay stays (it's city-wide).
  const clearResults = useCallback(() => {
    setRoutes([]);
    setExplanation(null);
    setError(null);
  }, []);

  const setPoint = useCallback(
    async (field, { lat, lon, label }) => {
      clearResults();
      const resolved = label ?? (await reverseGeocode(lat, lon));
      const point = { lat, lon, label: resolved };
      if (field === 'start') setStart(point);
      else setDestination(point);
    },
    [clearResults]
  );

  const handleMapClick = useCallback(
    (coords) => {
      // Armed pin mode wins; otherwise fill start first, then destination.
      const field = pinMode ?? (!start ? 'start' : !destination ? 'dest' : null);
      if (!field) return;
      setPinMode(null);
      setPoint(field, coords);
    },
    [pinMode, start, destination, setPoint]
  );

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearResults();
        setStart({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: 'My location',
        });
      },
      () => setError('Could not read your location — check browser permissions.')
    );
  }, [clearResults]);

  const fetchExplanation = useCallback(async (allRoutes, chosenIndex) => {
    const seq = ++explainSeq.current;
    setExplainLoading(true);
    try {
      // Geometry is thousands of coordinates — strip it before it reaches
      // the LLM prompt.
      const slim = allRoutes.map(({ geometry, ...rest }) => rest);
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes: slim, chosenIndex }),
      });
      const data = await res.json();
      if (seq === explainSeq.current) {
        setExplanation(res.ok ? data.explanation : null);
      }
    } catch {
      if (seq === explainSeq.current) setExplanation(null);
    } finally {
      if (seq === explainSeq.current) setExplainLoading(false);
    }
  }, []);

  // THE single moment the app talks to external data sources: routes
  // (OSRM), composite AQI for the overlay + route sampling (Open-Meteo,
  // ≤6 cached anchor locations in one request), and the explanation.
  const handleFindRoutes = useCallback(async () => {
    if (!start || !destination) return;
    setLoading(true);
    setError(null);
    setExplanation(null);

    // Overlay refresh rides along with the same button press; its failure
    // never blocks the route result.
    const overlayPromise = fetch('/api/aqi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: OVERLAY_AREAS.map(({ lat, lon }) => ({ lat, lon })) }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) =>
        data?.results
          ? data.results.map((r, i) => ({ ...r, name: OVERLAY_AREAS[i].name }))
          : null
      )
      .catch(() => null);

    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: { lat: start.lat, lon: start.lon },
          destination: { lat: destination.lat, lon: destination.lon },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Route search failed.');
      if (!data.routes?.length) throw new Error('No routes found between these points.');
      setRoutes(data.routes);
      setSelectedIndex(0);
      setSheetExpanded(true);
      fetchExplanation(data.routes, 0);
    } catch (err) {
      setRoutes([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }

    const overlayResults = await overlayPromise;
    if (overlayResults) setOverlay(overlayResults);
  }, [start, destination, fetchExplanation]);

  const handleSelectRoute = useCallback(
    (i) => {
      setSelectedIndex(i);
      fetchExplanation(routes, i);
    },
    [routes, fetchExplanation]
  );

  const handleSwap = useCallback(() => {
    clearResults(); // reversed direction means the old routes no longer apply
    setStart(destination);
    setDestination(start);
  }, [start, destination, clearResults]);

  return (
    <>
      <TopNav active="map" />
      <main className={styles.dashboard}>
        <div className={styles.mapPane}>
          <MapView
            start={start}
            destination={destination}
            routes={routes}
            overlay={overlay}
            selectedIndex={selectedIndex}
            onSelectRoute={handleSelectRoute}
            onMapClick={handleMapClick}
            onMoveStart={(coords) => setPoint('start', coords)}
            onMoveDestination={(coords) => setPoint('dest', coords)}
          />

          {/* AQI legend — floats over the map, bottom right */}
          <div className="absolute bottom-6 right-6 glass-panel p-4 rounded-xl breathable-shadow border border-outline-variant/30 z-[500] w-44 hidden sm:block">
            <h5 className="text-label-sm font-label-sm text-on-surface mb-3 mt-0 uppercase">
              Air Score
            </h5>
            <div className="space-y-2">
              {SCORE_LEVELS.map((level, i) => (
                <div key={level.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: level.color }} />
                  <span className="text-label-sm font-label-sm text-on-surface-variant">
                    {i === 0 ? '0–40' : i === 1 ? '41–65' : '66+'} {level.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Route panel — bottom sheet on mobile, left sidebar on desktop */}
        <aside
          className={`${styles.sidePanel} ${sheetExpanded ? styles.expanded : styles.collapsed}`}
          onClick={() => {
            if (!sheetExpanded) setSheetExpanded(true);
          }}
        >
          <button
            type="button"
            className={styles.dragHandle}
            onClick={() => setSheetExpanded((v) => !v)}
            aria-label={sheetExpanded ? 'Collapse route panel' : 'Expand route panel'}
          >
            <div className={styles.dragHandleBar} />
          </button>
          <div className={`${styles.panelScroll} custom-scrollbar`}>
            <RoutePanel
              start={start}
              destination={destination}
              onSelectStart={(p) => {
                clearResults();
                setStart(p);
              }}
              onSelectDestination={(p) => {
                clearResults();
                setDestination(p);
              }}
              onSwap={handleSwap}
              pinMode={pinMode}
              onTogglePin={(field) =>
                setPinMode((cur) => {
                  const next = cur === field ? null : field;
                  // Drop the sheet out of the way while the user taps the map.
                  if (next) setSheetExpanded(false);
                  return next;
                })
              }
              onUseMyLocation={handleUseMyLocation}
              onFindRoutes={handleFindRoutes}
              loading={loading}
              error={error}
              routes={routes}
              selectedIndex={selectedIndex}
              onSelectRoute={handleSelectRoute}
              explanation={explanation}
              explainLoading={explainLoading}
            />
          </div>
        </aside>
      </main>
    </>
  );
}
