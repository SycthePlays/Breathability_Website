import { NextResponse } from 'next/server';
import { nearestHospitals, EMERGENCY_NUMBERS } from '../../../lib/hospitals';

// POST /api/emergency  { location: {lat, lon} }
//
// Emergency reroute: nearest 24h-ER hospitals to the user plus the
// FASTEST route to the closest one. Deliberately different from
// /api/routes: no alternatives, no AQI sampling, no Open-Meteo calls —
// in an asthma attack the only metric that matters is time.
const OSRM_BASE =
  process.env.OSRM_BASE_URL ||
  'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const lat = Number(body?.location?.lat);
  const lon = Number(body?.location?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: 'location {lat, lon} is required' },
      { status: 400 }
    );
  }

  const hospitals = nearestHospitals(lat, lon, 3);
  const target = hospitals[0];

  // Route to the nearest hospital; if OSRM fails, still return the
  // hospital info — the call buttons matter more than the polyline.
  let route = null;
  try {
    const url = `${OSRM_BASE}/${lon},${lat};${target.lon},${target.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const r = data.routes?.[0];
      if (r) {
        route = {
          distanceMeters: r.distance,
          durationSeconds: r.duration,
          geometry: r.geometry,
        };
      }
    }
  } catch {
    // keep route null
  }

  return NextResponse.json({
    hospital: target,
    alternatives: hospitals.slice(1),
    route,
    emergencyNumbers: EMERGENCY_NUMBERS,
  });
}
