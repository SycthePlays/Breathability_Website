import { NextResponse } from 'next/server';
import { getCompositeAqi } from '../../../lib/aqiEngine';

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
