import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

// Shared fixed header — used on the landing page and the dashboard.
// `active` marks the current nav item ('home' | 'map'). Sized down on
// mobile so the logo, theme toggle, and CTA never collide.
export default function TopNav({ active = 'home' }) {
  const linkClass = (key) =>
    key === active
      ? 'text-primary font-bold border-b-2 border-primary pb-1 text-label-md font-label-md'
      : 'text-on-surface-variant text-label-md font-label-md hover:text-primary transition-colors duration-200';

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center gap-2 px-3 sm:px-container-margin h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="flex items-center gap-1.5 sm:gap-base min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="Breathability"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-md object-cover flex-shrink-0"
        />
        <Link
          href="/"
          className="font-display text-lg sm:text-headline-md font-bold text-primary no-underline truncate"
        >
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
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <ThemeToggle />
        {active !== 'map' && (
          <Link
            href="/dashboard"
            className="bg-primary text-on-primary font-label-md text-label-md px-3 py-2 sm:px-6 rounded-lg hover:opacity-80 transition-opacity no-underline whitespace-nowrap"
          >
            <span className="hidden sm:inline">Go to Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>
        )}
      </div>
    </header>
  );
}
