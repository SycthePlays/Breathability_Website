'use client';

import { useEffect, useRef, useState } from 'react';

// Address search with debounced autocomplete via Photon (komoot) —
// free, no key, CORS-enabled, backed by OpenStreetMap data. Results are
// biased toward Jakarta. A search bar is much easier one-handed on
// mobile than pin-dropping, which is why this exists at all — but the
// pin-drop button on the right still arms map-click mode for that field.
const PHOTON_BASE = 'https://photon.komoot.io/api/';
const JAKARTA_BIAS = { lat: -6.2088, lon: 106.8456 };

function formatLabel(feature) {
  const p = feature.properties || {};
  return [p.name, p.district || p.city, p.state]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(', ');
}

export default function LocationSearchInput({
  icon,
  iconClass = 'text-primary',
  placeholder,
  value,
  onSelect,
  pinArmed,
  onTogglePin,
  onFocus,
}) {
  const [text, setText] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Keep the visible text in sync when the location is set externally
  // (map click, marker drag, "use my location").
  useEffect(() => {
    setText(value || '');
  }, [value]);

  useEffect(() => {
    const close = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setText(q);
    clearTimeout(debounceRef.current);
    if (q.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `${PHOTON_BASE}?q=${encodeURIComponent(q)}&lat=${JAKARTA_BIAS.lat}&lon=${JAKARTA_BIAS.lon}&limit=5&lang=en`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data.features || []);
        setOpen(true);
      } catch {
        // network hiccup — keep whatever suggestions we had
      }
    }, 300);
  };

  const pick = (feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const label = formatLabel(feature);
    setText(label);
    setOpen(false);
    onSelect({ lat, lon, label });
  };

  return (
    <div className="relative" ref={containerRef}>
      <span
        className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] ${iconClass}`}
      >
        {icon}
      </span>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        onFocus={() => {
          onFocus?.();
          if (suggestions.length) setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full pl-10 pr-12 py-3 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/70 border border-secondary-container/50 rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
      />
      <button
        type="button"
        onClick={onTogglePin}
        title="Drop a pin on the map"
        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
          pinArmed
            ? 'bg-primary text-white'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">pin_drop</span>
      </button>

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant/30 rounded-lg breathable-shadow z-[1000] max-h-56 overflow-y-auto list-none m-0 p-1">
          {suggestions.map((f, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(f)}
                className="w-full text-left px-3 py-2 rounded hover:bg-surface-container text-body-md font-body-md text-on-surface flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-outline text-[16px]">
                  location_on
                </span>
                <span className="truncate">{formatLabel(f)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
