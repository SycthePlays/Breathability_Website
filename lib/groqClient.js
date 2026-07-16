// Groq — free tier, no key cost, ~30 requests/min and ~14,400/day (varies
// by model, applies org-wide). One explanation call per route selection
// stays well within that for a hackathon demo.
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

// Route geometry is thousands of coordinate pairs — never let it near the
// prompt. The client strips it too, but the server can't trust that.
function slimRoute(route) {
  if (!route) return route;
  const { geometry, ...rest } = route;
  return rest;
}

function minutes(seconds) {
  return Math.round((seconds ?? 0) / 60);
}

function km(meters) {
  return ((meters ?? 0) / 1000).toFixed(1);
}

// Deterministic fallback when GROQ_API_KEY isn't configured (or Groq is
// down) — built from the same numbers the LLM would see, so the demo
// still tells a coherent story.
function cannedExplanation(routes, chosenIndex) {
  const chosen = routes[chosenIndex];
  if (!chosen) return null;

  const others = routes.filter((_, i) => i !== chosenIndex);
  const parts = [
    `${chosen.label ?? 'This route'} covers ${km(chosen.distanceMeters)} km in about ${minutes(
      chosen.durationSeconds
    )} minutes` +
      (chosen.avgAqiExposure != null
        ? ` with an average AQI exposure of ${Math.round(chosen.avgAqiExposure)}.`
        : '.'),
  ];

  const cleanerThan = others.filter(
    (o) =>
      o.avgAqiExposure != null &&
      chosen.avgAqiExposure != null &&
      o.avgAqiExposure > chosen.avgAqiExposure
  );
  if (cleanerThan.length) {
    const worst = Math.max(...cleanerThan.map((o) => o.avgAqiExposure));
    parts.push(
      `That's up to ${Math.round(worst - chosen.avgAqiExposure)} AQI points less pollution exposure than the alternatives.`
    );
  } else if (others.length) {
    const fastest = Math.min(...others.map((o) => o.durationSeconds ?? Infinity));
    if ((chosen.durationSeconds ?? Infinity) <= fastest) {
      parts.push('It is also the quickest option available right now.');
    }
  }

  return parts.join(' ');
}

export async function explainRouteChoice(routes, chosenIndex) {
  const slim = (routes || []).map(slimRoute);
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    // No key yet — degrade gracefully instead of erroring the panel.
    return cannedExplanation(slim, chosenIndex);
  }

  const chosen = slim[chosenIndex];
  const others = slim.filter((_, i) => i !== chosenIndex);

  const prompt = `A walking-route app for Jakarta ranked ${slim.length} routes by air quality exposure and travel time. The user selected route ${chosenIndex + 1} ("${chosen?.label ?? 'unknown'}").
Selected route: ${JSON.stringify(chosen)}
Other options: ${JSON.stringify(others)}
avgAqiExposure is a 0-100 composite air pollution score (lower is cleaner air). durationSeconds and distanceMeters are travel time and length.
In 2-3 short sentences, explain in plain language why this route balances air quality and travel time compared to the alternatives. Do not mention JSON, code, or field names.`;

  try {
    const res = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq request failed: ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? cannedExplanation(slim, chosenIndex);
  } catch {
    // Rate limit or outage — the canned fallback keeps the demo alive.
    return cannedExplanation(slim, chosenIndex);
  }
}
