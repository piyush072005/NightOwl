/**
 * Geocoding Service for Delhi NCR
 * Fast local landmark matching with OpenStreetMap Nominatim fallback and LRU in-memory caching.
 */

import { POPULAR_DELHI_LOCATIONS, DELHI_METRO_STATIONS, DELHI_HOSPITALS, DELHI_POLICE_STATIONS } from './delhiData.js';

const cache = new Map();

/**
 * Searches Delhi locations by query string.
 */
export async function geocodeLocation(query) {
  if (!query || typeof query !== 'string') {
    return null;
  }

  const cleanQuery = query.trim().toLowerCase();
  if (cache.has(cleanQuery)) {
    return cache.get(cleanQuery);
  }

  // 1. Check local catalog
  const allKnownPlaces = [
    ...POPULAR_DELHI_LOCATIONS,
    ...DELHI_METRO_STATIONS.map(m => ({ name: `${m.name} Metro Station`, lat: m.lat, lng: m.lng, type: 'Metro Station' })),
    ...DELHI_HOSPITALS.map(h => ({ name: h.name, lat: h.lat, lng: h.lng, type: 'Hospital' })),
    ...DELHI_POLICE_STATIONS.map(p => ({ name: p.name, lat: p.lat, lng: p.lng, type: 'Police Station' }))
  ];

  // Exact or contains match
  const directMatch = allKnownPlaces.find(p => {
    const pName = p.name.toLowerCase();
    return pName.includes(cleanQuery) || cleanQuery.includes(pName);
  });

  if (directMatch) {
    const result = {
      name: directMatch.name,
      lat: directMatch.lat,
      lng: directMatch.lng,
      type: directMatch.type || 'Landmark',
      source: 'delhi_curated_db',
      confidence: 0.98
    };
    cache.set(cleanQuery, result);
    return result;
  }

  // Common aliases
  const aliasMap = {
    'cp': { name: 'Connaught Place', lat: 28.6328, lng: 77.2195 },
    'connaught place': { name: 'Connaught Place', lat: 28.6328, lng: 77.2195 },
    'india gate': { name: 'India Gate', lat: 28.6129, lng: 77.2295 },
    'aiims delhi': { name: 'AIIMS New Delhi', lat: 28.5672, lng: 77.2100 },
    'aiims': { name: 'AIIMS New Delhi', lat: 28.5672, lng: 77.2100 },
    'kashmere gate': { name: 'Kashmere Gate ISBT', lat: 28.6675, lng: 77.2285 },
    'isbt': { name: 'Kashmere Gate ISBT', lat: 28.6675, lng: 77.2285 },
    'hauz khas': { name: 'Hauz Khas', lat: 28.5431, lng: 77.2065 },
    'sector 62': { name: 'Noida Sector 62', lat: 28.6280, lng: 77.3649 },
    'sec 62': { name: 'Noida Sector 62', lat: 28.6280, lng: 77.3649 },
    'sector 18, rohini': { name: 'Sector 18, Rohini', lat: 28.7420, lng: 77.1330 },
    'sector 18 rohini': { name: 'Sector 18, Rohini', lat: 28.7420, lng: 77.1330 },
    'rohini sector 18': { name: 'Sector 18, Rohini', lat: 28.7420, lng: 77.1330 },
    'rohini': { name: 'Sector 18, Rohini', lat: 28.7420, lng: 77.1330 },
    'block b': { name: 'Block B Market Sector 62', lat: 28.6295, lng: 77.3670 },
    'block c': { name: 'Block C Sector 62', lat: 28.6250, lng: 77.3610 },
    'new delhi': { name: 'New Delhi Railway Station', lat: 28.6431, lng: 77.2223 },
    'ndls': { name: 'New Delhi Railway Station', lat: 28.6431, lng: 77.2223 },
    'anand vihar': { name: 'Anand Vihar ISBT', lat: 28.6469, lng: 77.3160 },
    'chandni chowk': { name: 'Chandni Chowk', lat: 28.6578, lng: 77.2301 },
    'saket': { name: 'Saket City Centre', lat: 28.5273, lng: 77.2117 },
    'dwarka': { name: 'Dwarka Sector 21', lat: 28.5522, lng: 77.0583 },
    'lajpat nagar': { name: 'Lajpat Nagar Central Market', lat: 28.5695, lng: 77.2435 },
    'central sec': { name: 'Central Secretariat', lat: 28.6147, lng: 77.2119 }
  };

  for (const [alias, data] of Object.entries(aliasMap)) {
    if (cleanQuery.includes(alias)) {
      const result = {
        name: data.name,
        lat: data.lat,
        lng: data.lng,
        type: 'Landmark',
        source: 'delhi_alias_index',
        confidence: 0.95
      };
      cache.set(cleanQuery, result);
      return result;
    }
  }

  // 2. Query OpenStreetMap Nominatim with timeout and Delhi bounding box
  try {
    const encoded = encodeURIComponent(`${query}, Delhi, India`);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=1&viewbox=76.85,28.88,77.50,28.40&bounded=0`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);

    const resp = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NightOwl-Delhi-Safety-Intelligence/1.0 (contact: ops@nightowl.delhi)'
      }
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const result = {
          name: item.display_name.split(',').slice(0, 3).join(', ').trim(),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type || 'Location',
          source: 'osm_nominatim',
          confidence: 0.85
        };
        cache.set(cleanQuery, result);
        return result;
      }
    }
  } catch (err) {
    // If external service fails or times out, fallback to closest popular Delhi location
    console.warn(`[Geocoding] External lookup failed for "${query}": ${err.message}`);
  }

  // 3. Fallback to Central Delhi
  const fallback = {
    name: `${query.charAt(0).toUpperCase() + query.slice(1)} (Delhi NCR Area)`,
    lat: 28.6139,
    lng: 77.2090,
    type: 'Approximated Area',
    source: 'delhi_regional_fallback',
    confidence: 0.40
  };
  cache.set(cleanQuery, fallback);
  return fallback;
}

/**
 * Reverse geocodes coordinates to a recognizable Delhi landmark.
 */
export async function reverseGeocode(lat, lng) {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (cache.has(key)) return cache.get(key);

  // Find closest known Delhi place
  const places = [
    ...POPULAR_DELHI_LOCATIONS,
    ...DELHI_METRO_STATIONS,
    ...DELHI_HOSPITALS
  ];

  let closest = places[0];
  let minDistance = Infinity;

  for (const p of places) {
    const d = Math.hypot(p.lat - lat, p.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = p;
    }
  }

  // ~0.015 degrees is roughly 1.5 km
  const placeName = minDistance < 0.02
    ? `Near ${closest.name}`
    : `Delhi NCR (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;

  const res = { name: placeName, lat, lng, source: 'proximity_catalog' };
  cache.set(key, res);
  return res;
}

/**
 * Returns autocomplete suggestions as the user types in From / To fields.
 */
export async function getSuggestions(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return [];
  }
  const q = query.trim().toLowerCase();
  const allKnownPlaces = [
    ...POPULAR_DELHI_LOCATIONS,
    ...DELHI_METRO_STATIONS.map(m => ({ name: `${m.name} Metro Station`, lat: m.lat, lng: m.lng, type: 'Metro Station' })),
    ...DELHI_HOSPITALS.map(h => ({ name: h.name, lat: h.lat, lng: h.lng, type: 'Hospital' })),
    ...DELHI_POLICE_STATIONS.map(p => ({ name: p.name, lat: p.lat, lng: p.lng, type: 'Police Station' }))
  ];

  // Match prefix or substring in local catalog
  const matches = allKnownPlaces.filter(p => p.name.toLowerCase().includes(q));
  const unique = [];
  const seen = new Set();
  for (const m of matches) {
    const key = m.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ name: m.name, lat: m.lat, lng: m.lng, type: m.type || 'Location' });
    }
    if (unique.length >= 6) break;
  }

  // If local results are few and query length >= 3, query OpenStreetMap Nominatim with low limit
  if (unique.length < 3 && q.length >= 3) {
    try {
      const encoded = encodeURIComponent(`${query}, Delhi, India`);
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=3&viewbox=76.85,28.88,77.50,28.40&bounded=0`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const resp = await fetch(nominatimUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'NightOwl-Delhi-Safety-Intelligence/1.0' }
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const data = await resp.json();
        for (const item of data) {
          const simpleName = item.display_name.split(',').slice(0, 2).join(', ').trim();
          const key = simpleName.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push({
              name: simpleName,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              type: item.type || 'Location'
            });
          }
          if (unique.length >= 6) break;
        }
      }
    } catch (e) {
      // ignore Nominatim timeout
    }
  }

  return unique;
}
