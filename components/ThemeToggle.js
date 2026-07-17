'use client';

import { useEffect, useState } from 'react';

// Light/dark switch. The inline script in app/layout.js applies the saved
// theme before first paint; this component just reflects and flips it.
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('breathability:theme', next ? 'dark' : 'light');
    } catch {
      // storage unavailable — theme still applies for this visit
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors"
    >
      <span className="material-symbols-outlined text-[20px]">
        {dark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
