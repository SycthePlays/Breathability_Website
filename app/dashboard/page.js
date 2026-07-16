'use client';

import dynamic from 'next/dynamic';

// Loaded client-side only — Leaflet needs the browser window.
const MapView = dynamic(() => import('../../components/MapView'), {
  ssr: false,
});

export default function Dashboard() {
  return (
    <main style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1 }}>
        <MapView />
      </div>

      <aside
        style={{
          width: 320,
          padding: '1.5rem',
          borderLeft: '1px solid #eee',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ fontSize: '1.1rem' }}>Route options</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Set a start and destination on the map to see up to 3 ranked
          routes here, each with distance, time, and AQI exposure.
        </p>

        {/* TODO: start/destination inputs -> POST /api/routes */}
        {/* TODO: render returned routes, selection state synced with the map */}
        {/* TODO: on selection, POST /api/explain and show the Groq explanation */}
      </aside>
    </main>
  );
}
