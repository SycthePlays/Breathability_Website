'use client';

// Emergency mode for breathing distress (asthma etc.):
// - one press finds the nearest 24h ER and draws the fastest route to it
// - the phone dialer opens automatically with the hospital's number
//   pre-filled (a website cannot legally/technically place the call
//   itself — one tap on the green button connects it)
// - 119 ambulance and share-my-location are one tap away
//
// This is an aid, not a medical device: 119 is always presented as the
// authoritative option.

function mapsLink(lat, lon) {
  return `https://maps.google.com/?q=${lat.toFixed(6)},${lon.toFixed(6)}`;
}

function shareText(location, hospital) {
  return (
    `EMERGENCY - I'm having a breathing emergency and need help. ` +
    `My location: ${mapsLink(location.lat, location.lon)} ` +
    `Heading to: ${hospital.name} (${hospital.area}).`
  );
}

export function EmergencyButton({ onActivate, busy }) {
  return (
    <button
      type="button"
      onClick={onActivate}
      disabled={busy}
      title="Emergency: route me to the nearest ER and call for help"
      className="absolute bottom-6 left-3 sm:left-6 z-[500] w-16 h-16 rounded-full bg-error text-on-error font-bold text-sm tracking-widest breathable-shadow border-4 border-on-error/30 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-60"
      style={{ boxShadow: '0 4px 20px rgba(186,26,26,0.45)' }}
    >
      {busy ? (
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
      ) : (
        'SOS'
      )}
    </button>
  );
}

// Emergency mode, rendered IN PLACE OF the route panel (sidebar on
// desktop, bottom sheet on mobile) — never as an overlay on top of the
// map. This keeps the map (with the red route + hospital pin) fully
// visible on both layouts, and pressing Exit just unmounts this in favor
// of RoutePanel again: `start`/`destination`/`routes` were never touched,
// so the walk the user was already planning reappears exactly as it was
// — no re-fetch, no extra API calls, no reset to the beginning.
export function EmergencySidebar({ emergency, onClose }) {
  if (!emergency) return null;
  const { hospital, alternatives = [], route, location, emergencyNumbers = [] } = emergency;
  const etaMin = route ? Math.round(route.durationSeconds / 60) : null;
  const distKm = route
    ? (route.distanceMeters / 1000).toFixed(1)
    : hospital.distKm.toFixed(1);

  return (
    <div className="flex flex-col gap-base h-full">
      <div className="bg-error text-on-error rounded-xl px-4 py-3 flex items-center justify-between breathable-shadow">
        <span className="font-label-md text-label-md font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">emergency</span>
          EMERGENCY MODE
        </span>
        <button
          type="button"
          onClick={onClose}
          title="Cancel — return to your route"
          className="text-on-error/90 hover:text-on-error text-label-sm font-label-sm underline"
        >
          Exit
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border-2 border-error p-card-padding breathable-shadow">
        <p className="m-0 mb-1 text-label-sm font-label-sm text-error font-bold">
          If symptoms are severe, call 119 now.
        </p>
        <h3 className="m-0 font-headline-md text-headline-md text-on-surface">{hospital.name}</h3>
        <p className="m-0 mt-0.5 text-label-sm font-label-sm text-on-surface-variant">
          {hospital.area} · {distKm} km away
          {etaMin != null && ` · ~${etaMin} min on foot — take a vehicle if you can`}
        </p>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <a
            href={`tel:${hospital.phone}`}
            className="col-span-2 bg-error text-on-error rounded-lg py-3 text-center font-label-md text-label-md font-bold no-underline flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            Call {hospital.name.split(' ').slice(0, 2).join(' ')} ER
          </a>
          {emergencyNumbers.map((n) => (
            <a
              key={n.phone}
              href={`tel:${n.phone}`}
              className="bg-surface-container-high text-on-surface rounded-lg py-2.5 text-center font-label-sm text-label-sm font-bold no-underline"
            >
              {n.name} · {n.phone}
            </a>
          ))}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText(location, hospital))}`}
            target="_blank"
            rel="noreferrer"
            className="bg-secondary-container text-on-secondary-container rounded-lg py-2.5 text-center font-label-sm text-label-sm font-bold no-underline"
          >
            Share location (WA)
          </a>
          <a
            href={`sms:?&body=${encodeURIComponent(shareText(location, hospital))}`}
            className="bg-secondary-container text-on-secondary-container rounded-lg py-2.5 text-center font-label-sm text-label-sm font-bold no-underline"
          >
            Share location (SMS)
          </a>
        </div>
      </div>

      {alternatives.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-card-padding breathable-shadow">
          <p className="m-0 mb-2 text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
            Other nearby ERs
          </p>
          <div className="space-y-2">
            {alternatives.map((h) => (
              <div key={h.name} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-body-md font-body-md text-on-surface truncate">{h.name}</div>
                  <div className="text-label-sm font-label-sm text-on-surface-variant">
                    {h.distKm.toFixed(1)} km · {h.area}
                  </div>
                </div>
                <a
                  href={`tel:${h.phone}`}
                  className="bg-surface-container-high text-error font-bold text-label-sm font-label-sm no-underline flex items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-lg"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  Call
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-label-sm font-label-sm text-on-surface-variant px-1 m-0">
        Not in danger? Press <strong>Exit</strong> above to return to your walk — nothing about
        your route was changed.
      </p>
    </div>
  );
}
