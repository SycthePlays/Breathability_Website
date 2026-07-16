import { supabase } from './supabaseClient';
import { fetchLiveAqi } from './openMeteo';

// Starting weights — live AQI is the only ground-truth measurement, so it
// carries most of the weight. The other three correct for the space
// between monitoring points. Tune once real Jakarta data is loaded.
const WEIGHTS = {
  liveAqi: 0.55,
  vegetation: 0.15, // inverted below: more vegetation lowers the score
  traffic: 0.2,
  population: 0.1,
};

function normalize(value, min, max) {
  if (value === null || value === undefined) return 50; // neutral fallback
  const clamped = Math.min(Math.max(value, min), max);
  return ((clamped - min) / (max - min)) * 100;
}

// Computed on demand for a single point, not precomputed across the whole
// city — see docs/PROJECT_PLAN.md for why. Result is meant to be cached
// in aqi_score_cache by the caller for ~1hr, matching Open-Meteo's cadence.
export async function getCompositeAqi(lat, lon) {
  const live = await fetchLiveAqi(lat, lon);

  // TODO: replace with a real nearest-neighbor / interpolation lookup against
  // area_reference once vegetation/traffic/population data is loaded in.
  const { data: nearestArea } = await supabase
    .from('area_reference')
    .select('vegetation_score, traffic_score, population_score')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  const liveScore = normalize(live.usAqi, 0, 200);
  const vegetationScore = 100 - (nearestArea?.vegetation_score ?? 50);
  const trafficScore = nearestArea?.traffic_score ?? 50;
  const populationScore = nearestArea?.population_score ?? 50;

  const composite =
    liveScore * WEIGHTS.liveAqi +
    vegetationScore * WEIGHTS.vegetation +
    trafficScore * WEIGHTS.traffic +
    populationScore * WEIGHTS.population;

  return {
    lat,
    lon,
    compositeScore: Math.round(composite),
    liveAqi: live.usAqi,
    computedAt: new Date().toISOString(),
  };
}
