/**
 * Map-Aware Chat Service for NightOwl
 * Understands location-aware user intent, executes geospatial tools, and returns
 * structured explanations along with map rendering actions.
 */

import { geocodeLocation } from './geocodingService.js';
import { findNearbyPlaces, getEmergencyServices } from './placesService.js';
import { calculateRoute } from './routingService.js';
import { compareRouteAlternatives } from './safetyScoringService.js';
import { searchTransit, fetchLiveBusPositions, DELHI_POPULAR_BUS_ROUTES } from './transitService.js';
import { DELHI_SAFETY_REPORTS, isWithinDelhi, DELHI_EMERGENCY_SERVICES } from './delhiData.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Handles an incoming chat message from the user.
 * @param {Object} params
 * @param {string} params.message - The text message sent by the user
 * @param {Object} [params.userLocation] - Explicitly shared { lat, lng } if granted
 * @param {Object} [params.context] - Conversation context (e.g. active route)
 */
export async function processChatQuery({ message, userLocation, context = {} }) {
  if (!message || typeof message !== 'string') {
    return {
      success: false,
      reply: 'Please enter a query or request.',
      text: 'Please enter a query or request.',
      tag: 'KNOWN',
      mapAction: null,
      dataSource: 'NightOwl System'
    };
  }

  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. ROUTE PLANNING INTENTS
  // e.g.: "route from X to Y", "safest route to Connaught Place", "how do I get to AIIMS from Hauz Khas"
  const routePatterns = [
    /(?:route|navigate|directions|path|travel|go|drive|walk)\s+(?:from\s+)?(.+?)\s+(?:to|towards)\s+(.+)/i,
    /(?:how\s+to\s+reach|how\s+do\s+i\s+get\s+to)\s+(.+?)\s+from\s+(.+)/i,
    /(?:safest|fastest|best)\s+route\s+(?:to\s+)?(.+)/i
  ];

  let originStr = null;
  let destStr = null;

  for (const pat of routePatterns) {
    const match = text.match(pat);
    if (match) {
      if (match.length >= 3) {
        originStr = match[1].trim();
        destStr = match[2].trim();
      } else if (match.length === 2) {
        destStr = match[1].trim();
        originStr = userLocation ? 'my location' : null;
      }
      break;
    }
  }

  if (destStr) {
    // If origin is "my location" or "here"
    let startCoords = null;
    let startLabel = 'Origin';

    if (!originStr || originStr.includes('my location') || originStr.includes('here') || originStr.includes('current')) {
      if (userLocation && userLocation.lat && userLocation.lng) {
        startCoords = { lat: userLocation.lat, lng: userLocation.lng };
        startLabel = 'Your Current GPS Location';
      } else {
        // Default origin if location not granted
        startCoords = { lat: 28.6280, lng: 77.3649 };
        startLabel = 'Noida Sector 62 Hub (Default Origin)';
      }
    } else {
      const geoOrigin = await geocodeLocation(originStr);
      if (geoOrigin) {
        startCoords = { lat: geoOrigin.lat, lng: geoOrigin.lng };
        startLabel = geoOrigin.name;
      }
    }

    const geoDest = await geocodeLocation(destStr);
    if (!geoDest) {
      return {
        success: false,
        reply: `I couldn't locate "<strong>${escapeHtml(destStr)}</strong>" in the Delhi NCR area. Could you please specify a nearby metro station or landmark?`,
        text: `I couldn't locate "<strong>${escapeHtml(destStr)}</strong>" in the Delhi NCR area. Could you please specify a nearby metro station or landmark?`,
        tag: 'UNKNOWN',
        mapAction: null,
        dataSource: 'Delhi Geospatial Geocoding'
      };
    }

    const destCoords = { lat: geoDest.lat, lng: geoDest.lng };
    const destLabel = geoDest.name;

    // Check Delhi boundary
    const isDestInDelhi = isWithinDelhi(destCoords.lat, destCoords.lng);

    // Determine travel mode (walking or driving)
    const mode = (lower.includes('walk') || lower.includes('foot') || lower.includes('pedestrian')) ? 'walking' : 'driving';

    try {
      const rawRoutes = await calculateRoute({
        startLat: startCoords.lat,
        startLng: startCoords.lng,
        endLat: destCoords.lat,
        endLng: destCoords.lng,
        mode
      });

      const scoredRoutes = compareRouteAlternatives(rawRoutes);
      const recommended = scoredRoutes.find(r => r.isSafest) || scoredRoutes[0];
      const fastest = scoredRoutes.find(r => r.isFastest) || scoredRoutes[0];

      let boundaryNotice = '';
      if (!isDestInDelhi) {
        boundaryNotice = `<div class="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded mt-1 border border-amber-200">ℹ️ Note: Destination lies outside NCT of Delhi boundary. NightOwl safety telemetry is optimized for Delhi NCT corridors.</div>`;
      }

      let responseHtml = `
        <strong>Safety-Informed Route Synthesized:</strong>
        <div class="mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
          <div class="flex justify-between items-center pb-1 border-b border-slate-200">
            <span class="font-bold text-slate-900">${escapeHtml(startLabel)} → ${escapeHtml(destLabel)}</span>
            <span class="font-mono font-bold text-amber-700">${recommended.durationMins} mins (${recommended.distanceKm} km)</span>
          </div>
          <div class="text-emerald-800 font-semibold">
            🛡️ Safety Score: <strong>${recommended.safety.safetyScore}/100</strong> (${recommended.safety.ratingLabel})
          </div>
          <p class="text-slate-600">${recommended.safety.summaryText}</p>
          <div class="pt-1 text-[11px] text-slate-600">
            ${escapeHtml(recommended.recommendationReason)}
          </div>
          ${boundaryNotice}
        </div>
      `;

      return {
        success: true,
        reply: responseHtml,
        text: responseHtml,
        tag: recommended.safety.epistemicStatus || 'KNOWN',
        dataSource: 'OSRM Engine & Delhi Police / Ground-Truth Safety Corridors',
        mapAction: {
          type: 'RENDER_ROUTE',
          origin: { label: startLabel, ...startCoords },
          destination: { label: destLabel, ...destCoords },
          routes: scoredRoutes,
          selectedRouteIndex: recommended.routeIndex,
          mode
        }
      };
    } catch (err) {
      return {
        success: false,
        reply: `Error calculating route between ${startLabel} and ${destLabel}: ${err.message}`,
        text: `Error calculating route between ${startLabel} and ${destLabel}: ${err.message}`,
        tag: 'OUTDATED',
        mapAction: null,
        dataSource: 'Routing Service'
      };
    }
  }

  // 2. OFFICIAL EMERGENCY SERVICES / HELPLINES / CATS AMBULANCE INTENTS
  if (lower.includes('emergency helpline') || lower.includes('cats') || lower.includes('helpline') || lower.includes('ambulance number') || lower.includes('women helpline') || lower.includes('fire service')) {
    const services = DELHI_EMERGENCY_SERVICES;
    const items = services.map(s =>
      `<li class="p-1.5 bg-white border border-slate-200 rounded text-xs">
        <div class="flex justify-between items-center">
          <strong>${escapeHtml(s.shortName)}</strong>
          <a href="${s.callAction}" class="px-2 py-0.5 bg-rose-600 text-white rounded font-mono font-bold hover:bg-rose-700">📞 ${s.tollFreeNumber}</a>
        </div>
        <div class="text-slate-500 text-[11px] mt-0.5">${escapeHtml(s.description)}</div>
      </li>`
    ).join('');

    const html = `
      <strong>Delhi Official Emergency Response Helplines:</strong>
      <ul class="mt-2 space-y-1.5">
        ${items}
      </ul>
      <p class="mt-2 text-[11px] text-slate-600">All numbers operate 24 hours daily, toll-free across Delhi NCT. CATS ambulance dispatch is managed under DGHS.</p>
    `;

    return {
      success: true,
      reply: html,
      text: html,
      tag: 'KNOWN',
      dataSource: 'Govt. of NCT of Delhi Official Directories (cats.delhi.gov.in, delhipolice.gov.in)',
      mapAction: {
        type: 'SHOW_EMERGENCY_PANEL',
        services
      }
    };
  }

  // 3. NEARBY EMERGENCY / MEDICAL / PHARMACY INTENTS
  if (lower.includes('pharmacy') || lower.includes('chemist') || lower.includes('medicine')) {
    const originLat = userLocation?.lat || 28.6280;
    const originLng = userLocation?.lng || 77.3649;

    const places = findNearbyPlaces({ lat: originLat, lng: originLng, category: 'pharmacy', radiusKm: 15, limit: 4, verifiedOnly: true });
    const items = places.results.map(p =>
      `<li class="p-1.5 bg-white border border-slate-200 rounded text-xs space-y-0.5">
        <div class="flex justify-between items-start">
          <strong class="text-emerald-950">${escapeHtml(p.name)}</strong>
          <span class="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">Verified 24/7</span>
        </div>
        <div class="text-slate-600 text-[11px]">${escapeHtml(p.address || '')} (${p.distanceKm} km away)</div>
        <div class="text-slate-700 text-[11px]">📞 <a href="${p.callAction || 'tel:' + p.phone}" class="font-mono text-emerald-700 hover:underline">${p.phone}</a></div>
        <div class="text-[10px] text-slate-600 italic">${escapeHtml(p.disclaimer)}</div>
      </li>`
    ).join('');

    const reply = `
      <strong>Verified 24/7 Pharmacies & Medical Shops in Delhi:</strong>
      <div class="text-[11px] text-slate-600 mb-1.5">Source: Delhi Govt 24-Hours Medical Shops Registry (delhi.gov.in)</div>
      <ul class="space-y-1.5">
        ${items || '<li>No 24/7 pharmacies found within search radius.</li>'}
      </ul>
      <p class="mt-2 text-[11px] text-slate-600">Always call ahead to confirm specific medicine formulation stocks.</p>
    `;

    return {
      success: true,
      reply,
      text: reply,
      tag: 'KNOWN',
      dataSource: 'Delhi Govt 24-Hours Medical Shops Registry',
      mapAction: {
        type: 'SHOW_PLACES',
        category: 'pharmacy',
        places: places.results
      }
    };
  }

  if (lower.includes('hospital') || lower.includes('trauma') || lower.includes('doctor') || lower.includes('clinic') || lower.includes('casualty')) {
    const originLat = userLocation?.lat || 28.6280;
    const originLng = userLocation?.lng || 77.3649;

    const places = findNearbyPlaces({ lat: originLat, lng: originLng, category: 'hospital', radiusKm: 15, limit: 4 });
    const items = places.results.map(h =>
      `<li class="p-1.5 bg-white border border-slate-200 rounded text-xs space-y-0.5">
        <div class="flex justify-between items-start">
          <strong class="text-rose-950">${escapeHtml(h.name)}</strong>
          <span class="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-semibold">${h.hasTraumaCenter ? 'Apex Trauma + Casualty' : '24/7 Casualty'}</span>
        </div>
        <div class="text-slate-600 text-[11px]">${escapeHtml(h.address || '')} (${h.distanceKm} km)</div>
        <div class="text-slate-700 text-[11px] flex justify-between">
          <span>📞 Emergency: <a href="tel:${h.emergencyPhone}" class="font-mono text-rose-700 hover:underline">${h.emergencyPhone}</a></span>
          <span>🚑 CATS: <a href="tel:102" class="font-mono text-rose-700 font-bold hover:underline">102</a></span>
        </div>
        <div class="text-[10px] text-slate-600 italic">${escapeHtml(h.disclaimer)}</div>
      </li>`
    ).join('');

    const reply = `
      <strong>Verified 24/7 Emergency Casualty Hospitals in Delhi:</strong>
      <div class="text-[11px] text-slate-600 mb-1.5">Source: DGHS Emergency Medical Care & Delhi Govt Hospital Registry</div>
      <ul class="space-y-1.5">
        ${items}
      </ul>
      <p class="mt-2 text-[11px] text-slate-600">Casualty departments operate 24 hours daily. For acute intake, contact the casualty line or dispatch CATS Ambulance at <strong>102</strong>.</p>
    `;

    return {
      success: true,
      reply,
      text: reply,
      tag: 'KNOWN',
      dataSource: 'DGHS Emergency Medical Care & Delhi Govt Hospital Directory',
      mapAction: {
        type: 'SHOW_PLACES',
        category: 'hospital',
        places: places.results
      }
    };
  }

  // 4. POLICE / SECURITY / PCR INTENTS
  if (lower.includes('police') || lower.includes('station') || lower.includes('pcr') || lower.includes('safety booth') || lower.includes('cop')) {
    const originLat = userLocation?.lat || 28.6280;
    const originLng = userLocation?.lng || 77.3649;

    const places = findNearbyPlaces({ lat: originLat, lng: originLng, category: 'police', radiusKm: 12, limit: 3 });
    const items = places.results.map(p =>
      `<li class="p-1.5 bg-white border border-slate-200 rounded text-xs space-y-0.5">
        <div class="flex justify-between items-start">
          <strong>${escapeHtml(p.name)}</strong>
          <span class="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">PCR Active</span>
        </div>
        <div class="text-slate-600 text-[11px]">${escapeHtml(p.jurisdiction)} (${p.distanceKm} km away)</div>
        <div class="text-slate-700 text-[11px]">Direct: ${p.phone} • Emergency: <a href="tel:112" class="font-bold text-blue-700 font-mono">112 / 100</a></div>
      </li>`
    ).join('');

    const reply = `
      <strong>Delhi Police Stations & PCR Patrol Nodes:</strong>
      <ul class="mt-1.5 space-y-1.5">
        ${items}
      </ul>
      <div class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
        Emergency ERSS: <a href="tel:112" class="font-bold font-mono">112</a> • Women Safety: <a href="tel:1091" class="font-bold font-mono">1091</a> • Senior Citizen: <a href="tel:1291" class="font-bold font-mono">1291</a>
      </div>
    `;

    return {
      success: true,
      reply,
      text: reply,
      tag: 'KNOWN',
      dataSource: 'Delhi Police ERSS (delhipolice.gov.in)',
      mapAction: {
        type: 'SHOW_PLACES',
        category: 'police',
        places: places.results
      }
    };
  }

  // 5. METRO / TRANSIT INTENTS
  if (lower.includes('metro') || lower.includes('train') || lower.includes('dmrc')) {
    const originLat = userLocation?.lat || 28.6280;
    const originLng = userLocation?.lng || 77.3649;

    const places = findNearbyPlaces({ lat: originLat, lng: originLng, category: 'metro', radiusKm: 10, limit: 4 });
    const items = places.results.map(m =>
      `<li class="p-1.5 bg-white border border-slate-200 rounded text-xs space-y-0.5">
        <div class="flex justify-between items-start">
          <strong>${escapeHtml(m.name)}</strong>
          <span class="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">Safe Haven: ${m.safeHavenRating}</span>
        </div>
        <div class="text-slate-600 text-[11px]">${escapeHtml(m.line)} (${m.distanceKm} km)</div>
        <div class="text-slate-600 text-[11px]">Last Train: <span class="font-mono font-semibold">${m.lastTrain}</span> • CCTV Coverage: ${m.cctvCoverage}</div>
      </li>`
    ).join('');

    const reply = `
      <strong>Nearest Delhi Metro (DMRC) Safe Haven Stations:</strong>
      <ul class="mt-1.5 space-y-1.5">
        ${items}
      </ul>
      <p class="mt-2 text-[11px] text-slate-600">Note: DMRC passenger operations typically pause between 11:45 PM and 05:15 AM.</p>
    `;

    return {
      success: true,
      reply,
      text: reply,
      tag: 'KNOWN',
      dataSource: 'Delhi Metro Rail Corporation (DMRC)',
      mapAction: {
        type: 'SHOW_PLACES',
        category: 'metro',
        places: places.results
      }
    };
  }

  // 6. BUS / OTD TRANSIT INTENTS (Official Delhi Open Transit Data)
  if (lower.includes('bus') || lower.includes('transit') || lower.includes('dtc') || lower.includes('otd')) {
    // Check if live tracking specifically was requested
    const isLiveQuery = lower.includes('live') || lower.includes('track') || lower.includes('gps') || lower.includes('position');
    let liveResult = null;

    if (isLiveQuery) {
      liveResult = await fetchLiveBusPositions();
    }

    const transitInfo = searchTransit(text);
    const routesHtml = transitInfo.routes.slice(0, 3).map(r =>
      `<div class="p-1.5 bg-white border border-slate-200 rounded text-xs space-y-0.5">
        <div class="flex justify-between items-center">
          <strong>🚌 Route ${escapeHtml(r.routeNumber)}: ${escapeHtml(r.routeName)}</strong>
          ${r.isNightRoute ? '<span class="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded">Night Bus</span>' : ''}
        </div>
        <div class="text-slate-600 text-[11px]">${escapeHtml(r.startTerminal)} ↔ ${escapeHtml(r.endTerminal)}</div>
        <div class="text-slate-600 text-[11px]">Night Freq: ~${r.frequencyNightMins}m • Last Bus: ${r.lastBus}</div>
      </div>`
    ).join('');

    let liveFeedNotice = '';
    if (liveResult) {
      if (liveResult.status === 'SUCCESS') {
        liveFeedNotice = `<div class="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs mt-1.5">📡 <strong>Live OTD Feed Connected:</strong> ${liveResult.vehiclesCount} active buses tracked in Delhi bounds.</div>`;
      } else {
        liveFeedNotice = `<div class="p-2 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs mt-1.5">ℹ️ <strong>Live Bus Tracking Status:</strong> ${escapeHtml(liveResult.message)}<div class="mt-1 text-[11px] text-slate-600">Register at <a href="https://otd.delhi.gov.in/register/" target="_blank" class="underline text-blue-700">otd.delhi.gov.in</a> and set <code>DELHI_OTD_API_KEY</code>. Static timetables and stop networks are fully active below.</div></div>`;
      }
    } else {
      liveFeedNotice = `<div class="text-[11px] text-slate-600 mt-1">Official OTD GTFS static schedules active. For live GPS vehicle positions, toggle Live Buses on the map.</div>`;
    }

    const reply = `
      <strong>Delhi Open Transit Data (DTC / DIMTS Cluster):</strong>
      <div class="mt-1.5 space-y-1.5">
        ${routesHtml || '<div>DTC & DIMTS cluster routes integrated via Delhi Open Transit Data (otd.delhi.gov.in).</div>'}
      </div>
      ${liveFeedNotice}
    `;

    return {
      success: true,
      reply,
      text: reply,
      tag: 'PROBABLE',
      dataSource: 'Delhi Open Transit Data (otd.delhi.gov.in)',
      mapAction: {
        type: 'SHOW_PLACES',
        category: 'bus',
        places: transitInfo.busStops
      }
    };
  }

  // 7. HAZARDS / INCIDENTS / SAFETY ALERTS
  if (lower.includes('hazard') || lower.includes('closure') || lower.includes('incident') || lower.includes('dark') || lower.includes('underpass')) {
    const hazards = DELHI_SAFETY_REPORTS.filter(r => r.road_condition === 'unsafe' || r.road_condition === 'construction');
    const items = hazards.map(h =>
      `<div class="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
        <div class="font-bold text-amber-900">⚠️ ${escapeHtml(h.condition_title)}</div>
        <div class="text-slate-700 text-[11px] mt-0.5">${escapeHtml(h.impact_desc)}</div>
        <div class="text-slate-600 text-[10px] mt-1">Filed by ${escapeHtml(h.scout_name)} [${h.epistemic_status}]</div>
      </div>`
    ).join('');

    const reply = `
      <strong>Active Delhi Caution & Hazard Advisories:</strong>
      <div class="mt-1.5 space-y-2">
        ${items}
      </div>
    `;

    return {
      success: true,
      reply,
      text: reply,
      tag: 'KNOWN',
      dataSource: 'Ground-Truth Scout Network & Traffic Advisories',
      mapAction: {
        type: 'SHOW_PLACES',
        category: 'hazard',
        places: hazards.map(h => ({ ...h, name: h.condition_title, category: 'hazard' }))
      }
    };
  }

  // 8. EMERGENCY SOS INTENTS
  if (lower.includes('sos') || lower.includes('emergency') || lower.includes('panic') || lower.includes('attack') || lower.includes('danger')) {
    const reply = `
      <strong class="text-rose-700">🚨 EMERGENCY PROTOCOL TRIGGERED:</strong>
      <p class="mt-1 text-slate-700">Immediate access to Delhi official dispatch helplines:</p>
      <div class="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900 space-y-1">
        <div class="flex justify-between items-center">
          <span>• <strong>Police ERSS:</strong> 112 / 100</span>
          <a href="tel:112" class="px-2 py-0.5 bg-rose-700 text-white rounded font-mono font-bold hover:bg-rose-800">Call 112</a>
        </div>
        <div class="flex justify-between items-center">
          <span>• <strong>CATS Ambulance:</strong> 102 / 1099</span>
          <a href="tel:102" class="px-2 py-0.5 bg-rose-700 text-white rounded font-mono font-bold hover:bg-rose-800">Call 102</a>
        </div>
        <div class="flex justify-between items-center">
          <span>• <strong>Women Helpline:</strong> 1091 / 181</span>
          <a href="tel:1091" class="px-2 py-0.5 bg-rose-700 text-white rounded font-mono font-bold hover:bg-rose-800">Call 1091</a>
        </div>
        <div class="flex justify-between items-center">
          <span>• <strong>Fire & Rescue:</strong> 101</span>
          <a href="tel:101" class="px-2 py-0.5 bg-rose-700 text-white rounded font-mono font-bold hover:bg-rose-800">Call 101</a>
        </div>
      </div>
      <p class="mt-2 text-[11px] text-slate-600">Police stations and emergency casualty centres have been highlighted on the map.</p>
    `;

    return {
      success: true,
      reply,
      text: reply,
      tag: 'KNOWN',
      dataSource: 'Govt of NCT of Delhi Emergency Response Systems',
      mapAction: {
        type: 'SHOW_PLACES',
        category: 'police'
      }
    };
  }

  // 9. DEFAULT INFORMATIVE FALLBACK
  const defaultReply = `
    <strong>Delhi Safety & Mobility Intelligence:</strong>
    <p class="mt-1 text-slate-700">I can assist with real Delhi road routing, nearby 24/7 emergency facilities, bus tracking, and safety assessments:</p>
    <ul class="mt-1 space-y-1 text-slate-600 list-disc list-inside text-xs">
      <li><em>"Safest route from AIIMS to Connaught Place"</em></li>
      <li><em>"Find nearby 24/7 pharmacy"</em></li>
      <li><em>"Show emergency hospitals with trauma center"</em></li>
      <li><em>"Show official emergency helplines"</em></li>
      <li><em>"Where is the nearest police station?"</em></li>
      <li><em>"Show nearest metro station"</em></li>
      <li><em>"Check live Delhi buses"</em></li>
    </ul>
  `;

  return {
    success: true,
    reply: defaultReply,
    text: defaultReply,
    tag: 'KNOWN',
    dataSource: 'NightOwl Delhi Knowledge Engine',
    mapAction: null
  };
}
