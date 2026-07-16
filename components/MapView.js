'use client';

// Client-only map component — Leaflet touches `window`, so this is loaded
// via next/dynamic with ssr:false from app/dashboard/page.js.

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const JAKARTA_CENTER = [-6.2088, 106.8456];

export default function MapView() {
  return (
    <MapContainer
      center={JAKARTA_CENTER}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* TODO: AQI overlay layer, sourced from /api/aqi per visible bounding box */}
      {/* TODO: start/destination markers + ranked route polylines */}
    </MapContainer>
  );
}
