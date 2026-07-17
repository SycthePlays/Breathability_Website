import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

// Without this, a GET handler that never reads the request is prerendered
// as STATIC at build time — the ratings list would be frozen into the
// build (and the build worker executes the Supabase call, which is what
// crashed `next build` locally). Ratings must always be fresh.
export const dynamic = 'force-dynamic';

// Community walk ratings. Reads and writes go through the anon client on
// purpose — walk_ratings has RLS allowing public select/insert (with
// range/length checks), and updates/deletes stay closed.

// GET /api/ratings — newest 300 pins.
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('walk_ratings')
      .select('id, lat, lon, rating, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) throw error;
    return NextResponse.json({ ratings: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/ratings  { lat, lon, rating: 1-5, comment?: string }
export async function POST(request) {
  const body = await request.json().catch(() => null);
  const lat = Number(body?.lat);
  const lon = Number(body?.lon);
  const rating = Number(body?.rating);
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'lat and lon are required numbers' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be an integer from 1 to 5' }, { status: 400 });
  }
  if (comment.length > 500) {
    return NextResponse.json({ error: 'comment must be 500 characters or fewer' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('walk_ratings')
      .insert({ lat, lon, rating, comment })
      .select('id, lat, lon, rating, comment, created_at')
      .single();
    if (error) throw error;
    return NextResponse.json({ rating: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
