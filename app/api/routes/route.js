import { NextResponse } from 'next/server';
import { getRankedRoutes } from '../../../lib/routingEngine';

// POST /api/routes  { start: {lat, lon}, destination: {lat, lon} }
export async function POST(request) {
  const body = await request.json();
  const { start, destination } = body || {};

  if (!start || !destination) {
    return NextResponse.json(
      { error: 'start and destination are required, each as {lat, lon}' },
      { status: 400 }
    );
  }

  try {
    const routes = await getRankedRoutes(start, destination);
    return NextResponse.json({ routes });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
