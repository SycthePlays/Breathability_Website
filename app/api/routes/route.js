import { NextResponse } from 'next/server';
import { getRankedRoutes } from '../../../lib/routingEngine';

// POST /api/routes
// { start: {lat, lon}, destination: {lat, lon}, departAt?: ISO string }
// departAt scores routes with the CAMS hourly forecast for that time
// (clamped to the ~36h forecast window) instead of the current reading.
export async function POST(request) {
  const body = await request.json();
  const { start, destination, departAt } = body || {};

  if (!start || !destination) {
    return NextResponse.json(
      { error: 'start and destination are required, each as {lat, lon}' },
      { status: 400 }
    );
  }

  let depart = null;
  if (departAt) {
    const parsed = new Date(departAt);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'departAt must be an ISO datetime' }, { status: 400 });
    }
    const maxAhead = Date.now() + 36 * 3600_000;
    if (parsed.getTime() > Date.now() && parsed.getTime() <= maxAhead) {
      depart = parsed;
    }
    // Past or too-far-ahead times quietly fall back to "now" — the demo
    // should never hard-fail over a stale tab's timestamp.
  }

  try {
    const routes = await getRankedRoutes(start, destination, { departAt: depart });
    return NextResponse.json({ routes, departAt: depart ? depart.toISOString() : null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
