import Link from 'next/link';
import TopNav from '../components/TopNav';
import LiveSnapshot from '../components/LiveSnapshot';

// Landing page — merged from the desktop and mobile mockups
// (breathability_landing_desktop / breathability_landing_mobile).
// Mobile-first: single column with 24px margins, sticky bottom CTA;
// desktop gets the centered hero and 4-column pillar grid.

const PILLARS = [
  {
    icon: 'air',
    title: 'Live Air Quality',
    body: 'Real-time sensor data from global monitoring stations tracking PM2.5 and PM10 levels.',
  },
  {
    icon: 'forest',
    title: 'Vegetation Density',
    body: 'Satellite analysis of canopy cover and park paths to find naturally oxygenated corridors.',
  },
  {
    icon: 'traffic',
    title: 'Traffic Flow',
    body: 'Congestion signals to steer you clear of high-emission zones and stale air pockets.',
  },
  {
    icon: 'groups',
    title: 'Population Density',
    body: 'Heatmaps of human activity used to ensure your path remains quiet, clean, and spacious.',
  },
];

const STEPS = [
  {
    title: 'Set Destination',
    body: 'Search for your work, gym, or park — or drop pins straight on the map. We analyze live air quality data instantly.',
  },
  {
    title: 'Compare Routes',
    body: 'See the AQI exposure of every option. We highlight the healthiest path, not just the fastest one.',
  },
  {
    title: 'Walk Smarter',
    body: 'Follow the recommended route and let our AI explain exactly why it beats the alternatives today.',
  },
];

export default function Home() {
  return (
    <div className="mesh-gradient-bg text-on-background min-h-screen">
      <TopNav active="home" />

      <main className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden px-container-margin pt-16 md:pt-24 pb-section-gap flex flex-col items-center text-center max-w-7xl mx-auto">
          <LiveSnapshot variant="pill" />

          <h1 className="font-display font-bold text-on-surface mt-6 max-w-4xl leading-tight text-[clamp(28px,6vw,48px)] tracking-tight">
            Find the route with the <span className="text-primary">freshest air</span>, not just
            the shortest one.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-gutter">
            Personalized pathfinding for the health-conscious. We analyze atmospheric data in
            real-time to guide you through Jakarta with clinical precision — no account needed.
          </p>

          <div className="mt-8 md:mt-section-gap flex flex-col sm:flex-row gap-gutter">
            <Link
              href="/dashboard"
              className="bg-primary px-8 py-4 rounded-lg text-white font-label-md font-bold text-lg hover:bg-primary/90 transition-all shadow-lg hover:scale-105 no-underline"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="border border-primary text-primary px-8 py-4 rounded-lg font-label-md font-bold text-lg hover:bg-primary/5 transition-all no-underline"
            >
              Explore Map
            </Link>
          </div>

          {/* Live data card as the hero visual — real data beats a mockup image */}
          <div className="mt-section-gap w-full max-w-md relative">
            <LiveSnapshot variant="card" />
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl -z-10" />
          </div>
        </section>

        {/* How it works — the four data pillars */}
        <section id="how-it-works" className="px-container-margin py-section-gap bg-surface-container-low/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-section-gap">
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface m-0">
                Precision planning for sensitive lungs.
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                Every route is scored using four environmental signals.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="bg-surface-container-lowest p-card-padding rounded-xl breathable-shadow border border-outline-variant/10 hover:border-primary/30 transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-primary-container/20 rounded-lg flex items-center justify-center mb-gutter">
                    <span className="material-symbols-outlined text-primary text-3xl">{p.icon}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-2 mt-0">{p.title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant m-0">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Three steps */}
        <section id="about" className="py-section-gap px-container-margin">
          <div className="max-w-md md:max-w-3xl mx-auto">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-8 text-center">
              Breathe easier in 3 steps
            </h2>
            <div className="space-y-8 md:space-y-12">
              {STEPS.map((step, i) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-headline-md">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-primary font-bold mb-1 mt-0">
                      {step.title}
                    </h4>
                    <p className="font-body-md text-body-md text-on-surface-variant m-0">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer — data attribution required by the free-tier sources */}
      <footer className="w-full py-section-gap px-container-margin flex flex-col md:flex-row justify-between items-start md:items-center gap-gutter bg-surface-container-low border-t border-outline-variant/30 pb-28 md:pb-section-gap">
        <div className="flex flex-col gap-base">
          <span className="font-display text-label-md font-bold text-on-surface">Breathability</span>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-sm m-0">
            © 2026 Breathability. Air quality data by Open-Meteo. Routing by OSRM &amp;
            OpenStreetMap contributors.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-gutter gap-y-2">
          <a className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm transition-all" href="https://open-meteo.com/">
            Open-Meteo
          </a>
          <a className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm transition-all" href="https://project-osrm.org/">
            OSRM
          </a>
          <a className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm transition-all" href="https://www.openstreetmap.org/copyright">
            OpenStreetMap
          </a>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 w-full p-4 glass-panel border-t border-outline-variant/20 z-50 md:hidden">
        <Link
          href="/dashboard"
          className="bg-primary text-on-primary w-full h-12 rounded-lg font-label-md shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2 no-underline"
        >
          Start Route
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            navigation
          </span>
        </Link>
      </div>
    </div>
  );
}
