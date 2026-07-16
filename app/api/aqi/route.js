import { NextResponse } from 'next/server';
import { getCompositeAqi, getCompositeAqiBatch } from '../../../lib/aqiEngine';

// GET /api/aqi?lat=-6.2&lon=106.8
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat'));
  const lon = parseFloat(searchParams.get('lon'));

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json(
      { error: 'lat and lon query params are required' },
      { status: 400 }
    );
  }

  try {
    const result = await getCompositeAqi(lat, lon);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/aqi  { points: [{lat, lon}, ...] } — batch scoring, used by the
// dashboard to refresh the map overlay in the same user action as a route
// search (never on page load; that's the quota rule).
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const points = body?.points;

  if (
    !Array.isArray(points) ||
    !points.length ||
    points.some((p) => typeof p?.lat !== 'number' || typeof p?.lon !== 'number')
  ) {
    return NextResponse.json(
      { error: 'points must be a non-empty array of {lat, lon}' },
      { status: 400 }
    );
  }

  if (points.length > 100) {
    return NextResponse.json({ error: 'too many points (max 100)' }, { status: 400 });
  }

  try {
    const results = await getCompositeAqiBatch(points);
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
