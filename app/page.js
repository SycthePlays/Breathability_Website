// Opening page — placeholder content. Replace with the real design in
// Antigravity; the point of this stub is a working CTA into /dashboard
// and a spot for a live AQI snapshot once the /api/aqi route is wired up.

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem' }}>
      <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Breathability</h1>
      <p style={{ fontSize: '1.1rem', color: '#333' }}>
        Find the route with the freshest air, not just the shortest one.
      </p>

      <p style={{ color: '#666', lineHeight: 1.6 }}>
        Breathability scores Jakarta&rsquo;s air quality by combining live air
        quality readings with vegetation coverage, traffic density, and
        population density, then routes you around the worst of it.
      </p>

      {/* TODO: live AQI snapshot, e.g. "Jakarta right now: Moderate" — pull from /api/aqi */}

      <a
        href="/dashboard"
        style={{
          display: 'inline-block',
          marginTop: '1.5rem',
          padding: '0.75rem 1.5rem',
          background: '#111',
          color: '#fff',
          borderRadius: 8,
          textDecoration: 'none',
        }}
      >
        Open the map
      </a>

      <footer style={{ marginTop: '4rem', fontSize: '0.85rem', color: '#999' }}>
        Air quality data via Open-Meteo. Vegetation, traffic, and population
        signals sourced separately — see docs/PROJECT_PLAN.md.
      </footer>
    </main>
  );
}
