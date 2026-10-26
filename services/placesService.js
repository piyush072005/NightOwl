/**
 * Places Service
 * Nearby spatial query service for Delhi hospitals, pharmacies, emergency services,
 * police stations, metro stations, bus stops, EV chargers, and safety reports.
 */

import {
  DELHI_METRO_STATIONS,
  DELHI_HOSPITALS,
  DELHI_PHARMACIES,
  DELHI_POLICE_STATIONS,
  DELHI_BUS_STOPS,
  DELHI_EV_CHARGERS,
  DELHI_SAFETY_REPORTS,
  DELHI_EMERGENCY_SERVICES,
  isWithinDelhi
} from './delhiData.js';

/**
 * Calculates Haversine distance in kilometers between two lat/lng points.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns official Delhi emergency helpline services (CATS, Police, Women Safety, Fire, DDMA).
 */
export function getEmergencyServices() {
  return {
    source: 'Govt. of NCT of Delhi Official Directories (cats.delhi.gov.in, delhipolice.gov.in, dfs.delhigovt.nic.in)',
    verifiedDate: '2026-10',
    count: DELHI_EMERGENCY_SERVICES.length,
    services: DELHI_EMERGENCY_SERVICES
  };
}

/**
 * Returns verified Delhi hospitals with emergency casualty departments.
 */
export function getDelhiHospitalsList({ traumaOnly = false, search = '' } = {}) {
  let list = DELHI_HOSPITALS;
  if (traumaOnly) {
    list = list.filter(h => h.hasTraumaCenter);
  }
  if (search) {
    const q = search.toLowerCase().trim();
    list = list.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q) ||
      h.ownership.toLowerCase().includes(q)
    );
  }
  return {
    source: 'Delhi Government Hospital Directory & DGHS Emergency Medical Care',
    verifiedDate: '2026-10',
    notice: '24-hour casualty active. Bed vacancy requires direct casualty confirmation with triage desk.',
    count: list.length,
    hospitals: list
  };
}

/**
 * Returns Delhi medical shops with strict 24/7 vs daytime verification.
 */
export function getDelhiPharmaciesList({ verified247Only = false, search = '' } = {}) {
  let list = DELHI_PHARMACIES;
  if (verified247Only) {
    list = list.filter(p => p.verified247 === true);
  }
  if (search) {
    const q = search.toLowerCase().trim();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    );
  }
  return {
    source: 'Delhi Government 24-Hours Medical Shops Registry (delhi.gov.in/page/medical-shops24-hours-0)',
    verifiedDate: '2026-10',
    notice: 'Verified 24/7 shops operate round-the-clock. Call counter prior to travel to confirm specific medicine formulations.',
    count: list.length,
    pharmacies: list
  };
}

/**
 * Finds facilities near a given coordinate.
 */
export function findNearbyPlaces({ lat, lng, category = 'all', radiusKm = 5.0, limit = 20, verifiedOnly = false }) {
  if (lat == null || lng == null) {
    throw new Error('lat and lng are required parameters.');
  }

  const numericLat = parseFloat(lat);
  const numericLng = parseFloat(lng);
  const maxRadius = parseFloat(radiusKm) || 5.0;
  const isDelhi = isWithinDelhi(numericLat, numericLng);

  let combined = [];

  if (category === 'all' || category === 'hospital') {
    combined.push(...DELHI_HOSPITALS.map(h => ({
      ...h,
      emergencyOpen: h.emergencyDeptOpen247 !== false,
      category: 'hospital',
      typeLabel: h.hasTraumaCenter ? '24/7 Apex Trauma & Casualty' : '24/7 Emergency Casualty Hospital',
      icon: 'fa-hospital',
      color: '#e11d48'
    })));
  }

  if (category === 'all' || category === 'pharmacy') {
    let pharms = DELHI_PHARMACIES;
    if (verifiedOnly) {
      pharms = pharms.filter(p => p.verified247);
    }
    combined.push(...pharms.map(p => ({
      ...p,
      open247: p.verified247 === true,
      category: 'pharmacy',
      typeLabel: p.verified247 ? 'Verified 24/7 Medical Shop' : 'Daytime Chemist (Unverified Night Status)',
      icon: 'fa-kit-medical',
      color: p.verified247 ? '#10b981' : '#f59e0b'
    })));
  }

  if (category === 'all' || category === 'police') {
    combined.push(...DELHI_POLICE_STATIONS.map(p => ({
      ...p,
      category: 'police',
      typeLabel: 'Delhi Police Station / PCR Post',
      icon: 'fa-shield-halved',
      color: '#0284c7'
    })));
  }

  if (category === 'all' || category === 'metro') {
    combined.push(...DELHI_METRO_STATIONS.map(m => ({
      ...m,
      category: 'metro',
      typeLabel: 'Delhi Metro Station',
      icon: 'fa-train-subway',
      color: '#6366f1'
    })));
  }

  if (category === 'all' || category === 'bus') {
    combined.push(...DELHI_BUS_STOPS.map(b => ({
      ...b,
      category: 'bus',
      typeLabel: 'Delhi Bus Terminal / Stop',
      icon: 'fa-bus',
      color: '#f59e0b'
    })));
  }

  if (category === 'all' || category === 'ev_charging') {
    combined.push(...DELHI_EV_CHARGERS.map(ev => ({
      ...ev,
      category: 'ev_charging',
      typeLabel: 'EV Charging Station',
      icon: 'fa-bolt',
      color: '#14b8a6'
    })));
  }

  if (category === 'all' || category === 'safety_report' || category === 'hazard') {
    combined.push(...DELHI_SAFETY_REPORTS.map(r => ({
      ...r,
      name: r.condition_title,
      category: r.road_condition === 'unsafe' || r.road_condition === 'construction' ? 'hazard' : 'safety_report',
      typeLabel: r.road_condition === 'unsafe' ? 'Reported Hazard Zone' : 'Verified Safe Corridor Note',
      icon: r.road_condition === 'unsafe' ? 'fa-triangle-exclamation' : 'fa-circle-check',
      color: r.road_condition === 'unsafe' ? '#ef4444' : '#10b981'
    })));
  }

  // Calculate distance for all matching places
  const withDistance = combined.map(item => {
    const dist = calculateDistanceKm(numericLat, numericLng, item.lat, item.lng);
    return {
      ...item,
      distanceKm: parseFloat(dist.toFixed(2)),
      distanceMeters: Math.round(dist * 1000)
    };
  });

  // Filter within radius and sort ascending
  const filtered = withDistance
    .filter(item => item.distanceKm <= maxRadius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, parseInt(limit, 10) || 20);

  return {
    origin: { lat: numericLat, lng: numericLng },
    isWithinDelhi: isDelhi,
    radiusKm: maxRadius,
    category,
    count: filtered.length,
    results: filtered,
    attribution: 'Delhi Open Transit Data, DGHS Emergency Directory, Delhi Police ERSS & OSM Contributors',
    lastUpdated: new Date().toISOString()
  };
}
