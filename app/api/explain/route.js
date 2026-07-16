import { NextResponse } from 'next/server';
import { explainRouteChoice } from '../../../lib/groqClient';

// POST /api/explain  { routes: [...], chosenIndex: 0 }
export async function POST(request) {
  const body = await request.json();
  const { routes, chosenIndex } = body || {};

  if (!routes || chosenIndex === undefined) {
    return NextResponse.json(
      { error: 'routes[] and chosenIndex are required' },
      { status: 400 }
    );
  }

  try {
    const explanation = await explainRouteChoice(routes, chosenIndex);
    return NextResponse.json({ explanation });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
