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
  Popup,
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

// Hands the live Leaflet instance up to the parent — the drag-and-drop
// rating chip needs it to convert a screen drop point into lat/lon.
function MapRefBinder({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);
  return null;
}

// Ratings expire after 24h, so absolute dates are pointless — show the
// age instead ("3h ago").
function timeAgo(iso) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

const HOSPITAL_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:26px;height:26px;border-radius:6px;background:#ba1a1a;color:#fff;
    display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:16px;font-family:sans-serif;
    border:2px solid #fff;box-shadow:0 2px 8px rgba(186,26,26,0.5);
  ">H</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// Zooms to the emergency route (or straight to the hospital) the moment
// emergency mode activates.
function FitEmergency({ emergency }) {
  const map = useMap();
  useEffect(() => {
    if (!emergency) return;
    const coords = (emergency.route?.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon]);
    if (coords.length) {
      map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
    } else if (emergency.hospital) {
      map.setView([emergency.hospital.lat, emergency.hospital.lon], 14);
    }
  }, [emergency, map]);
  return null;
}

// Gold star pill for a community walk rating.
function ratingIcon(rating) {
  return L.divIcon({
    className: '',
    html: `<div style="
      display:flex;align-items:center;gap:2px;
      background:#f9a825;color:#fff;font-weight:700;font-size:12px;
      padding:2px 8px;border-radius:9999px;border:2px solid #fff;
      box-shadow:0 2px 6px rgba(38,50,56,0.35);white-space:nowrap;
    ">★ ${rating}</div>`,
    iconSize: [44, 22],
    iconAnchor: [22, 11],
  });
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

// Pans (and gently zooms in, never out) to a start/destination point the
// moment it's set or moved — by search, pin-drop, marker-drag, or "My
// location" — so the picked point is always easy to find on screen
// without the user having to manually scroll/zoom to it.
function FlyToPoint({ point }) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.flyTo([point.lat, point.lon], Math.max(map.getZoom(), 15), { duration: 0.8 });
    // Re-run only when the actual coordinates change, not on every
    // unrelated re-render (label edits, etc).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point?.lat, point?.lon, map]);
  return null;
}

// Re-fits the viewport whenever a new set of routes arrives — and also
// when `emergencyActive` flips from true to false, so exiting emergency
// mode brings the previous walking route back into view instead of
// leaving the map zoomed in on the hospital.
function FitRoutes({ routes, emergencyActive }) {
  const map = useMap();
  useEffect(() => {
    if (!routes?.length) return;
    const allCoords = routes.flatMap((r) =>
      (r.geometry?.coordinates || []).map(([lon, lat]) => [lat, lon])
    );
    if (allCoords.length) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
    }
  }, [routes, emergencyActive, map]);
  return null;
}

// Overlay data arrives as a prop: the dashboard fetches it in the same
// user action as a route search (quota rule: no API calls on page load).
export default function MapView({
  start,
  destination,
  routes = [],
  overlay = [],
  ratings = [],
  ratingDraft = null,
  emergency = null,
  selectedIndex = 0,
  onSelectRoute,
  onMapClick,
  onMoveStart,
  onMoveDestination,
  onMapReady,
}) {
  return (
    <MapContainer center={JAKARTA_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onMapClick={onMapClick} />
      <FlyToPoint point={start} />
      <FlyToPoint point={destination} />
      <FitRoutes routes={routes} emergencyActive={!!emergency} />
      <UserLocationDot />
      <MapRefBinder onMapReady={onMapReady} />

      {/* Community walk ratings — gold star pills with comment popups */}
      {ratings.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lon]} icon={ratingIcon(r.rating)}>
          <Popup>
            <div style={{ maxWidth: 220, fontFamily: 'inherit' }}>
              <div style={{ color: '#f9a825', fontSize: 16, letterSpacing: 2 }}>
                {'★'.repeat(r.rating)}
                <span style={{ color: '#bdc9c6' }}>{'★'.repeat(5 - r.rating)}</span>
              </div>
              {r.comment && (
                <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.45 }}>{r.comment}</div>
              )}
              <div style={{ marginTop: 4, fontSize: 11, opacity: 0.6 }}>
                {timeAgo(r.created_at)} · pins last 24h
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Pending pin while the rating form is open */}
      {ratingDraft && (
        <Marker
          position={[ratingDraft.lat, ratingDraft.lon]}
          icon={ratingIcon('?')}
          interactive={false}
          opacity={0.75}
        />
      )}

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

      <FitEmergency emergency={emergency} />

      {/* Emergency: fastest route to the nearest ER, on top of everything */}
      {emergency?.route?.geometry && (
        <Polyline
          positions={emergency.route.geometry.coordinates.map(([lon, lat]) => [lat, lon])}
          pathOptions={{ color: '#ba1a1a', weight: 7, opacity: 0.95 }}
        />
      )}
      {emergency?.hospital && (
        <Marker
          position={[emergency.hospital.lat, emergency.hospital.lon]}
          icon={HOSPITAL_ICON}
          zIndexOffset={1000}
        >
          <Tooltip permanent direction="top" offset={[0, -14]}>
            {emergency.hospital.name}
          </Tooltip>
        </Marker>
      )}

      {/* Ranked route polylines — hidden during an emergency so the red
          route is unambiguous; unselected routes fade back otherwise */}
      {!emergency && routes.map((route, i) => {
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
