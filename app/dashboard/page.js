'use client';

import dynamic from 'next/dynamic';
import styles from './dashboard.module.css';

// Loaded client-side only — Leaflet needs the browser window.
const MapView = dynamic(() => import('../../components/MapView'), {
  ssr: false,
});

// Mobile-first layout: map + panel stack vertically below 768px (panel
// becomes a capped, scrollable strip so the map keeps most of the
// screen), side-by-side above it. See dashboard.module.css.
export default function Dashboard() {
  return (
    <main className={styles.dashboard}>
      <div className={styles.mapPane}>
        <MapView />
      </div>

      <aside className={styles.sidePanel}>
        <h2>Route options</h2>
        <p>
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
