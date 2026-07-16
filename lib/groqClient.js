// Groq — free tier, no key cost, ~30 requests/min and ~14,400/day (varies
// by model, applies org-wide). One explanation call per route selection
// stays well within that for a hackathon demo.
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

export async function explainRouteChoice(routes, chosenIndex) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set — see .env.example.');
  }

  const chosen = routes[chosenIndex];
  const others = routes.filter((_, i) => i !== chosenIndex);

  const prompt = `A route-planning app for Jakarta picked route ${chosenIndex + 1} of ${routes.length}.
Chosen route: ${JSON.stringify(chosen)}
Other options: ${JSON.stringify(others)}
In 2-3 short sentences, explain in plain language why this route balances air quality and travel time better than the alternatives. Do not mention JSON, code, or field names.`;

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
  return data.choices?.[0]?.message?.content ?? null;
}
