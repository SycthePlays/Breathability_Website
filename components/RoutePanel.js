'use client';

import LocationSearchInput from './LocationSearchInput';
import { categorizeAqi, ROUTE_COLORS } from '../lib/aqiCategories';

function formatDistance(meters) {
  if (meters == null) return '—';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
  if (seconds == null) return '—';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function RoutePanel({
  start,
  destination,
  onSelectStart,
  onSelectDestination,
  onSwap,
  pinMode,
  onTogglePin,
  onUseMyLocation,
  onFindRoutes,
  loading,
  error,
  routes,
  selectedIndex,
  onSelectRoute,
  explanation,
  explainLoading,
}) {
  return (
    <div className="flex flex-col gap-base h-full">
      {/* Routing form */}
      <div className="bg-surface-container-lowest p-card-padding rounded-xl breathable-shadow border border-outline-variant/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">route</span>
            <h2 className="font-headline-md text-headline-md text-primary m-0">Route Search</h2>
          </div>
          <button
            type="button"
            onClick={onUseMyLocation}
            title="Use my current location as start"
            className="flex items-center gap-1 text-label-sm font-label-sm text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">my_location</span>
            My location
          </button>
        </div>

        <div className="space-y-3">
          <LocationSearchInput
            icon="trip_origin"
            iconClass="text-primary"
            placeholder="Start — search or drop a pin"
            value={start?.label}
            onSelect={onSelectStart}
            pinArmed={pinMode === 'start'}
            onTogglePin={() => onTogglePin('start')}
          />

          <div className="flex justify-center -my-4 relative z-10">
            <button
              type="button"
              onClick={onSwap}
              title="Swap start and destination"
              className="bg-surface-container-high p-1 rounded-full border border-outline-variant hover:bg-primary-fixed-dim transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                swap_vert
              </span>
            </button>
          </div>

          <LocationSearchInput
            icon="location_on"
            iconClass="text-error"
            placeholder="Destination — search or drop a pin"
            value={destination?.label}
            onSelect={onSelectDestination}
            pinArmed={pinMode === 'dest'}
            onTogglePin={() => onTogglePin('dest')}
          />
        </div>

        {pinMode && (
          <p className="text-label-sm font-label-sm text-primary mt-3 mb-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">touch_app</span>
            Tap the map to set the {pinMode === 'start' ? 'start' : 'destination'} point.
          </p>
        )}

        <button
          type="button"
          onClick={onFindRoutes}
          disabled={!start || !destination || loading}
          className="w-full mt-4 bg-primary text-white font-label-md text-label-md py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
            {loading ? 'progress_activity' : 'directions_walk'}
          </span>
          {loading ? 'Finding routes…' : 'Find Routes'}
        </button>

        {error && (
          <p className="text-error text-label-sm font-label-sm mt-3 mb-0 bg-error-container/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Ranked route cards */}
      {routes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-label-md text-label-md text-on-surface-variant px-1 uppercase tracking-wider m-0">
            Recommended Routes
          </h3>

          {routes.map((route, i) => {
            const isSelected = i === selectedIndex;
            const cat = categorizeAqi(route.avgAqiExposure);
            return (
              <button
                key={route.id ?? i}
                type="button"
                onClick={() => onSelectRoute(i)}
                className={`w-full text-left rounded-xl p-card-padding cursor-pointer transition-all active:scale-[0.98] border-2 ${
                  isSelected
                    ? 'bg-primary-container/20 border-primary'
                    : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container-high'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    {i === 0 && (
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-1 inline-block">
                        Best Choice
                      </span>
                    )}
                    <h4 className="font-headline-md text-headline-md text-on-surface m-0 flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: ROUTE_COLORS[i % ROUTE_COLORS.length] }}
                      />
                      {route.label}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${cat.textClass}`}>
                      {route.avgAqiExposure != null
                        ? `AQI ${Math.round(route.avgAqiExposure)}`
                        : 'AQI —'}
                    </div>
                    <div className="text-on-surface-variant text-label-sm font-label-sm">
                      {cat.label}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant text-body-md">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {formatDuration(route.durationSeconds)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">distance</span>
                    {formatDistance(route.distanceMeters)}
                  </span>
                </div>
              </button>
            );
          })}

          {/* AI explanation panel */}
          <div className="bg-inverse-surface text-inverse-on-surface rounded-xl p-card-padding relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  smart_toy
                </span>
              </div>
              <span className="font-label-md text-label-md">Breathability AI</span>
            </div>
            <p className="text-body-md font-body-md text-outline-variant relative z-10 leading-relaxed m-0 min-h-[48px]">
              {explainLoading ? 'Analyzing your routes…' : explanation || 'Select a route to see why it wins.'}
            </p>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[80px]">waves</span>
            </div>
          </div>
        </div>
      )}

      {routes.length === 0 && !loading && (
        <p className="text-on-surface-variant text-body-md font-body-md px-1">
          Set a start and destination — by search or by dropping pins on the map — to see up to 3
          ranked routes with distance, time, and AQI exposure.
        </p>
      )}
    </div>
  );
}
