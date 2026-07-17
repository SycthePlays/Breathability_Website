'use client';

// Client-only map component — Leaflet touches `window`, so this is loaded
// via next/dynamic with ssr:false from app/dashboard/page.js.

import { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  Tooltip,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { categorizeAqi, categorizeScore, ROUTE_COLORS } from '../lib/aqiCategories';

const JAKARTA_CENTER = [-6.2088, 106.8456];

// Default Leaflet marker PNGs don't survive bundling; divIcons keep the
// pins on-brand instead of patching image paths.
function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:18px;height:18px;border-radius:50% 50% 50% 0;
      background:${color};transform:rotate(-45deg);
      border:2px solid #fff;box-shadow:0 2px 6px rgba(38,50,56,0.35);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
  });
}

// Google-Maps-style blue dot: pulsing marker + translucent accuracy ring,
// kept fresh via watchPosition. Renders nothing until the user grants
// location permission (and quietly stays hidden if they deny it).
const USER_DOT_ICON = L.divIcon({
  className: '',
  html: '<div class="user-location-dot"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function UserLocationDot() {
  const [pos, setPos] = useState(null); // { lat, lon, accuracy }

  useEffect(() => {
    if (!navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition(
      (p) =>
        setPos({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          accuracy: p.coords.accuracy,
        }),
      () => setPos(null), // denied/unavailable — just don't render the dot
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!pos) return null;
  return (
    <>
      {pos.accuracy > 30 && (
        <Circle
          center={[pos.lat, pos.lon]}
          radius={pos.accuracy}
          pathOptions={{
            color: '#1a73e8',
            fillColor: '#1a73e8',
            fillOpacity: 0.08,
            weight: 1,
            opacity: 0.3,
          }}
        />
      )}
      <Marker position={[pos.lat, pos.lon]} icon={USER_DOT_ICON} interactive={false} zIndexOffset={500} />
    </>
  );
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

// Re-fits the viewport whenever a new set of routes arrives.
function FitRoutes({ routes }) {
  const map = useMap();
  useEffect(() => {
    if (!routes?.length) return;
    const allCoords = routes.flatMap((r) =>
      (r.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon])
    );
    if (allCoords.length) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
    }
  }, [routes, map]);
  return null;
}

// Overlay data arrives as a prop: the dashboard fetches it in the same
// user action as a route search (quota rule: no API calls on page load).
export default function MapView({
  start,
  destination,
  routes = [],
  overlay = [],
  selectedIndex = 0,
  onSelectRoute,
  onMapClick,
  onMoveStart,
  onMoveDestination,
}) {
  return (
    <MapContainer center={JAKARTA_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onMapClick={onMapClick} />
      <FitRoutes routes={routes} />
      <UserLocationDot />

      {/* AQI overlay — one translucent circle per kecamatan, colored by the
          composite score (live AQI + vegetation + traffic + population) */}
      {overlay.map((p) => {
        const cat = categorizeScore(p.compositeScore);
        return (
          <Circle
            key={p.name}
            center={[p.lat, p.lon]}
            radius={1500}
            pathOptions={{
              color: cat.color,
              fillColor: cat.color,
              fillOpacity: 0.22,
              weight: 1,
              opacity: 0.45,
            }}
          >
            <Tooltip direction="center" opacity={0.95}>
              <div style={{ textAlign: 'center', fontFamily: 'inherit' }}>
                <strong>{p.name}</strong>
                <br />
                Breathability {Math.round(p.compositeScore)} · {cat.label}
                {p.liveAqi != null && (
                  <>
                    <br />
                    <span style={{ opacity: 0.75 }}>Live AQI {Math.round(p.liveAqi)}</span>
                  </>
                )}
              </div>
            </Tooltip>
          </Circle>
        );
      })}

      {/* Ranked route polylines — unselected routes fade back */}
      {routes.map((route, i) => {
        const coords = (route.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon]);
        const isSelected = i === selectedIndex;
        return (
          <Polyline
            key={route.id ?? i}
            positions={coords}
            pathOptions={{
              color: ROUTE_COLORS[i % ROUTE_COLORS.length],
              weight: isSelected ? 6 : 4,
              opacity: isSelected ? 0.95 : 0.45,
            }}
            eventHandlers={{ click: () => onSelectRoute?.(i) }}
          />
        );
      })}

      {start && (
        <Marker
          position={[start.lat, start.lon]}
          icon={pinIcon('#006a63')}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              onMoveStart?.({ lat, lon: lng });
            },
          }}
        >
          <Tooltip>Start</Tooltip>
        </Marker>
      )}

      {destination && (
        <Marker
          position={[destination.lat, destination.lon]}
          icon={pinIcon('#ba1a1a')}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              onMoveDestination?.({ lat, lon: lng });
            },
          }}
        >
          <Tooltip>Destination</Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}
