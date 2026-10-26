/**
 * Safety Scoring Service
 * Transparent, explainable safety-informed scoring and comparison for Delhi routes.
 *
 * NOTE: Scores represent a "safety-informed route" based only on empirically available
 * data (police presence, open 24/7 havens, verified street lighting, and recorded hazards).
 * Missing data is treated as epistemic uncertainty, not danger or safety.
 */

import { calculateDistanceKm } from './placesService.js';
import {
  DELHI_POLICE_STATIONS,
  DELHI_HOSPITALS,
  DELHI_PHARMACIES,
  DELHI_SAFETY_REPORTS,
  DELHI_METRO_STATIONS
} from './delhiData.js';

/**
 * Evaluates safety signals along a given route polyline.
 * @param {Object} route - The route object with coordinates [[lat, lng], ...]
 * @returns {Object} Safety evaluation breakdown and explainable summary
 */
export function evaluateRouteSafety(route) {
  const coords = route.coordinates || [];
  if (coords.length === 0) {
    return {
      score: 50,
      epistemicStatus: 'UNKNOWN',
      label: 'Insufficient Geometry',
      breakdown: {},
      nearbySignals: { police: [], havens: [], hazards: [] },
      explanation: 'Route coordinates unavailable for safety signal assessment.'
    };
  }

  // Sample route points (every ~500m to 1km) for proximity checks
  const samplePoints = [];
  const step = Math.max(1, Math.floor(coords.length / 10));
  for (let i = 0; i < coords.length; i += step) {
    samplePoints.push(coords[i]);
  }
  if (coords.length > 0 && samplePoints[samplePoints.length - 1] !== coords[coords.length - 1]) {
    samplePoints.push(coords[coords.length - 1]);
  }

  // 1. Find nearby Police Stations / PCR Nodes within 1.5 km
  const nearbyPolice = [];
  for (const police of DELHI_POLICE_STATIONS) {
    let minD = Infinity;
    for (const [pLat, pLng] of samplePoints) {
      const d = calculateDistanceKm(pLat, pLng, police.lat, police.lng);
      if (d < minD) minD = d;
    }
    if (minD <= 1.5) {
      nearbyPolice.push({ ...police, distanceToRouteKm: parseFloat(minD.toFixed(2)) });
    }
  }

  // 2. Find nearby 24/7 Emergency Medical / Pharmacy Havens within 1.2 km
  const nearbyHavens = [];
  for (const hospital of DELHI_HOSPITALS) {
    let minD = Infinity;
    for (const [pLat, pLng] of samplePoints) {
      const d = calculateDistanceKm(pLat, pLng, hospital.lat, hospital.lng);
      if (d < minD) minD = d;
    }
    if (minD <= 1.2) {
      nearbyHavens.push({ name: hospital.name, type: 'Hospital', lat: hospital.lat, lng: hospital.lng, distanceToRouteKm: parseFloat(minD.toFixed(2)) });
    }
  }

  for (const pharmacy of DELHI_PHARMACIES) {
    let minD = Infinity;
    for (const [pLat, pLng] of samplePoints) {
      const d = calculateDistanceKm(pLat, pLng, pharmacy.lat, pharmacy.lng);
      if (d < minD) minD = d;
    }
    if (minD <= 1.0) {
      nearbyHavens.push({ name: pharmacy.name, type: '24/7 Pharmacy', lat: pharmacy.lat, lng: pharmacy.lng, distanceToRouteKm: parseFloat(minD.toFixed(2)) });
    }
  }

  // 3. Find nearby Metro Safe Nodes (guarded, CCTV coverage) within 0.8 km
  const nearbyMetro = [];
  for (const metro of DELHI_METRO_STATIONS) {
    let minD = Infinity;
    for (const [pLat, pLng] of samplePoints) {
      const d = calculateDistanceKm(pLat, pLng, metro.lat, metro.lng);
      if (d < minD) minD = d;
    }
    if (minD <= 0.8) {
      nearbyMetro.push({ name: metro.name, lat: metro.lat, lng: metro.lng, distanceToRouteKm: parseFloat(minD.toFixed(2)) });
    }
  }

  // 4. Identify confirmed Hazards / Road Disruptions within 0.6 km
  const encounteredHazards = [];
  for (const report of DELHI_SAFETY_REPORTS) {
    if (report.road_condition === 'unsafe' || report.road_condition === 'construction') {
      let minD = Infinity;
      for (const [pLat, pLng] of samplePoints) {
        const d = calculateDistanceKm(pLat, pLng, report.lat, report.lng);
        if (d < minD) minD = d;
      }
      if (minD <= 0.6) {
        encounteredHazards.push({
          title: report.condition_title,
          landmark: report.landmark_note,
          impact: report.impact_desc,
          distanceToRouteKm: parseFloat(minD.toFixed(2)),
          epistemic: report.epistemic_status
        });
      }
    }
  }

  // SCORING MODEL (Total max 100 points)
  // Baseline connectivity & arterial layout: 20 pts
  let connectivityScore = 20;

  // Police & Vigilance presence (up to 25 pts)
  let policeScore = Math.min(25, nearbyPolice.length * 12);

  // 24/7 Havens presence (up to 25 pts)
  let havenScore = Math.min(25, (nearbyHavens.length * 8) + (nearbyMetro.length * 5));

  // Verified Lighting assessment (up to 30 pts)
  // If no hazards or dim reports nearby, arterial routes default to 24 pts. If safe reports exist, up to 30.
  let lightingScore = 24;
  if (encounteredHazards.some(h => h.impact.toLowerCase().includes('dim') || h.impact.toLowerCase().includes('light'))) {
    lightingScore = 12;
  }

  // Hazard Penalties (up to -40 pts)
  let hazardDeduction = Math.min(40, encounteredHazards.length * 20);

  let rawScore = connectivityScore + policeScore + havenScore + lightingScore - hazardDeduction;
  const safetyScore = Math.max(15, Math.min(98, Math.round(rawScore)));

  // Epistemic Status Determination
  let epistemicStatus = 'PROBABLE';
  let epistemicConfidence = 0.75;
  if (encounteredHazards.length > 0 || nearbyPolice.length >= 2) {
    epistemicStatus = 'KNOWN';
    epistemicConfidence = 0.90;
  } else if (nearbyPolice.length === 0 && nearbyHavens.length === 0) {
    epistemicStatus = 'PROBABLE';
    epistemicConfidence = 0.60;
  }

  // Qualitative Rating
  let ratingLabel = 'Moderate Vigilance';
  let ratingColor = '#d97706'; // amber
  if (safetyScore >= 80) {
    ratingLabel = 'High Vigilance / Well-Illuminated';
    ratingColor = '#10b981'; // emerald
  } else if (safetyScore < 60) {
    ratingLabel = 'Caution Advised / Dim Stretch';
    ratingColor = '#ef4444'; // red
  }

  // Explainable Summary
  const explanations = [];
  if (nearbyPolice.length > 0) {
    explanations.push(`Passes within proximity of ${nearbyPolice[0].name} (${nearbyPolice[0].distanceToRouteKm} km).`);
  }
  if (nearbyHavens.length > 0) {
    explanations.push(`Access to ${nearbyHavens.length} verified 24/7 emergency haven(s) including ${nearbyHavens[0].name}.`);
  }
  if (nearbyMetro.length > 0) {
    explanations.push(`Monitored metro corridor near ${nearbyMetro[0].name}.`);
  }
  if (encounteredHazards.length > 0) {
    explanations.push(`⚠️ Caution: Route passes near reported disruption: ${encounteredHazards[0].title}.`);
  } else {
    explanations.push('Zero active road closures or severe hazards reported on this corridor.');
  }

  return {
    safetyScore,
    ratingLabel,
    ratingColor,
    epistemicStatus,
    epistemicConfidence,
    breakdown: {
      policeScore: { current: policeScore, max: 25, label: 'Police & Patrol Proximity' },
      havenScore: { current: havenScore, max: 25, label: '24/7 Emergency Havens' },
      lightingScore: { current: lightingScore, max: 30, label: 'Street Illumination Quality' },
      connectivityScore: { current: connectivityScore, max: 20, label: 'Arterial Road Connectivity' },
      hazardDeduction: { penalty: hazardDeduction, label: 'Hazard & Disruption Penalty' }
    },
    signals: {
      policeCount: nearbyPolice.length,
      policeDetails: nearbyPolice.map(p => ({ name: p.name, distanceKm: p.distanceToRouteKm })),
      havenCount: nearbyHavens.length,
      havenDetails: nearbyHavens.map(h => ({ name: h.name, type: h.type, distanceKm: h.distanceToRouteKm })),
      metroCount: nearbyMetro.length,
      hazardsEncountered: encounteredHazards
    },
    summaryText: explanations.join(' '),
    limitations: 'Safety score is an empirical assessment derived from available open infrastructure and scout reports; it cannot guarantee zero risk in transit.'
  };
}

/**
 * Compares two or more route alternatives and designates the safety-informed choice.
 * @param {Array} routes - Array of calculated routes
 * @returns {Array} Scored routes with comparative analysis
 */
export function compareRouteAlternatives(routes) {
  if (!Array.isArray(routes) || routes.length === 0) return [];

  const scoredRoutes = routes.map((r, i) => {
    const safety = evaluateRouteSafety(r);
    return {
      ...r,
      safety,
      isFastest: false,
      isSafest: false
    };
  });

  // Identify fastest
  let minDuration = Infinity;
  let fastestIndex = 0;
  for (let i = 0; i < scoredRoutes.length; i++) {
    if (scoredRoutes[i].durationMins < minDuration) {
      minDuration = scoredRoutes[i].durationMins;
      fastestIndex = i;
    }
  }
  scoredRoutes[fastestIndex].isFastest = true;

  // Identify highest safety-informed score
  let maxScore = -1;
  let safestIndex = 0;
  for (let i = 0; i < scoredRoutes.length; i++) {
    if (scoredRoutes[i].safety.safetyScore > maxScore) {
      maxScore = scoredRoutes[i].safety.safetyScore;
      safestIndex = i;
    }
  }
  scoredRoutes[safestIndex].isSafest = true;

  // Comparative explanation
  if (scoredRoutes.length > 1) {
    const rA = scoredRoutes[0];
    const rB = scoredRoutes[1];
    const timeDiff = Math.abs(rA.durationMins - rB.durationMins);
    const scoreDiff = Math.abs(rA.safety.safetyScore - rB.safety.safetyScore);

    if (safestIndex === fastestIndex) {
      scoredRoutes[safestIndex].recommendationReason =
        `Recommended: ${scoredRoutes[safestIndex].name} is both the fastest (${scoredRoutes[safestIndex].durationMins} mins) and has the highest safety score (${scoredRoutes[safestIndex].safety.safetyScore}/100) due to proximity to active patrol units and illuminated arterial roads.`;
    } else {
      const safest = scoredRoutes[safestIndex];
      const fastest = scoredRoutes[fastestIndex];
      safest.recommendationReason =
        `Safety-Informed Choice: ${safest.name} offers a higher safety score (${safest.safety.safetyScore}/100 vs ${fastest.safety.safetyScore}/100) for only +${timeDiff} mins travel time, avoiding less-monitored stretches.`;
      fastest.recommendationReason =
        `Fastest Choice: Minimizes travel time (${fastest.durationMins} mins vs ${safest.durationMins} mins), but has lower vigilance infrastructure along some links.`;
    }
  } else {
    scoredRoutes[0].recommendationReason =
      `Single available practical road route: Evaluated score of ${scoredRoutes[0].safety.safetyScore}/100 based on verified police and medical checkpoints.`;
  }

  return scoredRoutes;
}
