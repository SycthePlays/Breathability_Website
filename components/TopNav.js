import Link from 'next/link';

// Shared fixed header — used on the landing page and the dashboard.
// `active` marks the current nav item ('home' | 'map').
export default function TopNav({ active = 'home' }) {
  const linkClass = (key) =>
    key === active
      ? 'text-primary font-bold border-b-2 border-primary pb-1 text-label-md font-label-md'
      : 'text-on-surface-variant text-label-md font-label-md hover:text-primary transition-colors duration-200';

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-container-margin h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="flex items-center gap-base">
        <span
          className="material-symbols-outlined text-primary text-[28px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          air
        </span>
        <Link href="/" className="font-display text-headline-md font-bold text-primary no-underline">
          Breathability
        </Link>
        <nav className="hidden md:flex ml-8 gap-gutter items-center">
          <Link className={linkClass('home')} href="/#how-it-works">
            How it works
          </Link>
          <Link className={linkClass('about')} href="/#about">
            About
          </Link>
          <Link className={linkClass('map')} href="/dashboard">
            Map
          </Link>
        </nav>
      </div>
      <Link
        href="/dashboard"
        className="bg-primary text-white font-label-md text-label-md px-6 py-2 rounded-lg hover:opacity-80 transition-opacity no-underline"
      >
        Go to Dashboard
      </Link>
    </header>
  );
}
