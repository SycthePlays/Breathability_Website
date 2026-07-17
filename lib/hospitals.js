// Curated hospitals with 24-hour emergency rooms (IGD) across DKI Jakarta
// and the Banten service area. A static bundled list on purpose: an
// emergency feature must answer instantly and cannot depend on a flaky
// third-party lookup (OSM hospital data is often missing phone numbers).
//
// IMPORTANT: phone numbers are main/ER lines compiled from public
// listings and can go stale — verify before demo day. The national
// ambulance line 119 (PSC 119) and general emergency 112 are always the
// authoritative first call and are surfaced first in the UI.

export const EMERGENCY_NUMBERS = [
  { name: 'Ambulance (PSC 119)', phone: '119' },
  { name: 'National emergency', phone: '112' },
];

export const HOSPITALS = [
  // ---- Central Jakarta ----
  { name: 'RSCM (Cipto Mangunkusumo)', area: 'Senen, Central Jakarta', lat: -6.1866, lon: 106.8471, phone: '0211500135' },
  { name: 'RSPAD Gatot Soebroto', area: 'Senen, Central Jakarta', lat: -6.1760, lon: 106.8365, phone: '0213441008' },
  { name: 'RSUD Tarakan', area: 'Gambir, Central Jakarta', lat: -6.1685, lon: 106.8106, phone: '0213503150' },
  // ---- North Jakarta ----
  { name: 'RSUD Koja', area: 'Koja, North Jakarta', lat: -6.1156, lon: 106.9003, phone: '02143938478' },
  { name: 'RS Pluit', area: 'Penjaringan, North Jakarta', lat: -6.1275, lon: 106.7930, phone: '0216685006' },
  { name: 'RS Mitra Keluarga Kelapa Gading', area: 'Kelapa Gading, North Jakarta', lat: -6.1560, lon: 106.9090, phone: '02145852700' },
  // ---- West Jakarta ----
  { name: 'Siloam Hospitals Kebon Jeruk', area: 'Kebon Jeruk, West Jakarta', lat: -6.1918, lon: 106.7735, phone: '1500911' },
  { name: 'RSUD Cengkareng', area: 'Cengkareng, West Jakarta', lat: -6.1435, lon: 106.7345, phone: '02154372874' },
  { name: 'RS Hermina Daan Mogot', area: 'Kalideres, West Jakarta', lat: -6.1665, lon: 106.7480, phone: '0215408989' },
  // ---- South Jakarta ----
  { name: 'RSUP Fatmawati', area: 'Cilandak, South Jakarta', lat: -6.2925, lon: 106.7930, phone: '0217501524' },
  { name: 'RS Pondok Indah', area: 'Kebayoran Lama, South Jakarta', lat: -6.2820, lon: 106.7845, phone: '0217657525' },
  // ---- East Jakarta ----
  { name: 'RSUP Persahabatan', area: 'Pulogadung, East Jakarta', lat: -6.1968, lon: 106.8877, phone: '0214891708' },
  { name: 'RS Premier Jatinegara', area: 'Jatinegara, East Jakarta', lat: -6.2158, lon: 106.8705, phone: '0212800888' },
  { name: 'RSUD Budhi Asih', area: 'Kramat Jati, East Jakarta', lat: -6.2585, lon: 106.8635, phone: '0218090282' },
  { name: 'RSUD Pasar Rebo', area: 'Pasar Rebo, East Jakarta', lat: -6.3084, lon: 106.8551, phone: '0218400109' },
  // ---- Kota Tangerang ----
  { name: 'RSU Kabupaten Tangerang', area: 'Tangerang', lat: -6.1765, lon: 106.6280, phone: '0215523507' },
  { name: 'Siloam Hospitals Lippo Village', area: 'Karawaci, Tangerang', lat: -6.2247, lon: 106.5993, phone: '1500911' },
  { name: 'RS Sari Asih Ciledug', area: 'Ciledug, Tangerang', lat: -6.2265, lon: 106.7130, phone: '0217333430' },
  // ---- Tangerang Selatan / Kab. Tangerang ----
  { name: 'Eka Hospital BSD', area: 'Serpong, Tangerang Selatan', lat: -6.3009, lon: 106.6664, phone: '02125655555' },
  { name: 'RS Premier Bintaro', area: 'Pondok Aren, Tangerang Selatan', lat: -6.2761, lon: 106.7286, phone: '02127625500' },
  { name: 'OMNI Hospitals Alam Sutera', area: 'Serpong Utara, Tangerang Selatan', lat: -6.2410, lon: 106.6540, phone: '02129779999' },
  { name: 'Bethsaida Hospital Gading Serpong', area: 'Kelapa Dua, Kab. Tangerang', lat: -6.2400, lon: 106.6290, phone: '02129309999' },
  // ---- Serang / Cilegon / rural Banten ----
  { name: 'RSUD dr. Drajat Prawiranegara', area: 'Kota Serang', lat: -6.1155, lon: 106.1550, phone: '0254200528' },
  { name: 'RS Krakatau Medika', area: 'Cilegon', lat: -6.0125, lon: 106.0530, phone: '0254396333' },
  { name: 'RSUD Berkah Pandeglang', area: 'Pandeglang', lat: -6.3120, lon: 106.1030, phone: '0253201042' },
  { name: 'RSUD dr. Adjidarmo', area: 'Rangkasbitung, Lebak', lat: -6.3585, lon: 106.2470, phone: '0252201313' },
];

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// The n nearest ER hospitals to a point, closest first.
export function nearestHospitals(lat, lon, n = 3) {
  return HOSPITALS.map((h) => ({ ...h, distKm: haversineKm(lat, lon, h.lat, h.lon) }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, n);
}
