// Shared AQI category mapping used by both the UI (badges, legend, route
// cards) and the map overlay. Thresholds follow the US AQI scale, colors
// follow the Clinical Clarity status tones (DESIGN.md: mint for good,
// muted gold for moderate, soft terracotta for poor).
export const AQI_LEVELS = [
  { max: 50, label: 'Good', color: '#4DB6AC', textClass: 'text-primary' },
  { max: 100, label: 'Moderate', color: '#FFD54F', textClass: 'text-secondary' },
  { max: Infinity, label: 'Unhealthy', color: '#E57373', textClass: 'text-error' },
];

// Rank colors for route polylines and card dots: cleanest = primary teal,
// balanced = muted gold, fastest = soft terracotta. Lives here (not in
// MapView) so server-rendered components can import it without pulling
// Leaflet into SSR.
export const ROUTE_COLORS = ['#006a63', '#f9a825', '#e57373'];

export function categorizeAqi(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return { label: 'Unknown', color: '#98a9a8', textClass: 'text-on-surface-variant' };
  }
  return AQI_LEVELS.find((level) => value <= level.max);
}

// The composite Breathability score is 0-100 (NOT the US AQI scale — it
// can never exceed 100), so it gets its own bands. Calibration: with
// neutral slow signals, US AQI 100 (the good/unhealthy-for-sensitive
// boundary) maps to a composite of ~50; heavy-traffic dense districts add
// 10-20 on top. Hence: ≤40 clean, 41-65 moderate, >65 poor.
export const SCORE_LEVELS = [
  { max: 40, label: 'Good', color: '#4DB6AC', textClass: 'text-primary' },
  { max: 65, label: 'Moderate', color: '#FFD54F', textClass: 'text-secondary' },
  { max: Infinity, label: 'Poor', color: '#E57373', textClass: 'text-error' },
];

export function categorizeScore(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return { label: 'Unknown', color: '#98a9a8', textClass: 'text-on-surface-variant' };
  }
  return SCORE_LEVELS.find((level) => value <= level.max);
}
