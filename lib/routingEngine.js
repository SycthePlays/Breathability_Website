// Public OSRM demo server — free, no key, but rate-limited and meant for
// light/demo use only. Swap OSRM_BASE for a self-hosted OSRM instance or
// GraphHopper before relying on this beyond the hackathon.
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

// Fetches alternative candidate routes from OSRM, then re-ranks by a
// combined AQI + distance score before returning the top 3.
export async function getRankedRoutes(start, destination) {
  const coords = `${start.lon},${start.lat};${destination.lon},${destination.lat}`;
  const url = `${OSRM_BASE}/${coords}?alternatives=true&overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Routing request failed: ${res.status}`);
  }

  const data = await res.json();
  const candidates = data.routes || [];

  // TODO: for each candidate, sample getCompositeAqi() at points along
  // route.geometry.coordinates and average them into avgAqiExposure,
  // then sort candidates by a weighted combination of exposure and
  // distance before slicing to the top 3.
  return candidates.slice(0, 3).map((route, index) => ({
    id: index,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
    avgAqiExposure: null,
  }));
}
