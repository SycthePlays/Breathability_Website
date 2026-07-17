import { NextResponse } from 'next/server';
import { getHourlyForecast } from '../../../lib/aqiEngine';

// GET /api/forecast?lat=-6.2&lon=106.8 — next-24h composite score curve
// for a point, plus the cleanest upcoming hour. Fired from the same
// "Find Routes" action as everything else (anchor already cached), never
// on page load.
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
    const forecast = await getHourlyForecast(lat, lon, 24);
    return NextResponse.json(forecast);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
