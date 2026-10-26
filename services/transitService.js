import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { DELHI_BUS_STOPS, DELHI_METRO_STATIONS, isWithinDelhi } from './delhiData.js';

// Curated static Delhi bus routes (DTC / DIMTS cluster)
export const DELHI_POPULAR_BUS_ROUTES = [
  {
    routeNumber: 'TMS (-)',
    routeName: 'Teevra Mudrika Seva (Outer Ring Road Circular)',
    startTerminal: 'Wazirpur Depot',
    endTerminal: 'Wazirpur Depot (Circular)',
    majorStops: ['Kashmere Gate', 'Anand Vihar', 'Sarai Kale Khan', 'Nehru Place', 'AIIMS', 'Dhaula Kuan', 'Punjabi Bagh'],
    frequencyNightMins: 35,
    firstBus: '05:00 AM',
    lastBus: '11:45 PM',
    isNightRoute: true
  },
  {
    routeNumber: 'OMS (+)',
    routeName: 'Mudrika Seva (Inner Ring Road Circular)',
    startTerminal: 'Uttam Nagar',
    endTerminal: 'Uttam Nagar (Circular)',
    majorStops: ['Moti Nagar', 'Karol Bagh', 'Connaught Place', 'Lajpat Nagar', 'AIIMS', 'Dhaula Kuan'],
    frequencyNightMins: 40,
    firstBus: '05:30 AM',
    lastBus: '11:30 PM',
    isNightRoute: true
  },
  {
    routeNumber: '414',
    routeName: 'Badarpur Border to Central Secretariat',
    startTerminal: 'Badarpur Border',
    endTerminal: 'Central Secretariat',
    majorStops: ['Sarita Vihar', 'Apollo Hospital', 'Ashram', 'Lajpat Nagar', 'India Gate'],
    frequencyNightMins: 50,
    firstBus: '06:00 AM',
    lastBus: '11:15 PM',
    isNightRoute: false
  },
  {
    routeNumber: '522',
    routeName: 'Lado Sarai to Inderpuri',
    startTerminal: 'Lado Sarai DDA Flats',
    endTerminal: 'Inderpuri Krishi Kunj',
    majorStops: ['Saket', 'Hauz Khas', 'AIIMS', 'Safdarjung', 'Dhaula Kuan'],
    frequencyNightMins: 45,
    firstBus: '05:45 AM',
    lastBus: '11:20 PM',
    isNightRoute: false
  },
  {
    routeNumber: 'GL-22',
    routeName: 'Anand Vihar ISBT to Karol Bagh Terminal',
    startTerminal: 'Anand Vihar ISBT',
    endTerminal: 'Karol Bagh Terminal',
    majorStops: ['Preet Vihar', 'Laxmi Nagar', 'ITO', 'Connaught Place', 'Pusa Road'],
    frequencyNightMins: 30,
    firstBus: '05:15 AM',
    lastBus: '11:50 PM',
    isNightRoute: true
  }
];

// In-memory cache for OTD live feed (respects provider's rate policies)
let liveFeedCache = {
  timestamp: 0,
  vehicles: [],
  rawCount: 0
};
const CACHE_TTL_MS = 15000; // 15 seconds

/**
 * Returns static transit information (bus stops, routes, metro stations).
 */
export function getTransitOverview() {
  const otdApiKey = process.env.DELHI_OTD_API_KEY;
  const isLiveConfigured = Boolean(otdApiKey && otdApiKey.length > 5 && !otdApiKey.includes('YOUR_'));

  return {
    portal: 'https://otd.delhi.gov.in/',
    provider: 'Delhi Open Transit Data (Government of NCT of Delhi) & DMRC',
    datasets: {
      metroStationsCount: DELHI_METRO_STATIONS.length,
      busStopsCount: DELHI_BUS_STOPS.length,
      busRoutesCount: DELHI_POPULAR_BUS_ROUTES.length
    },
    liveTracking: {
      isAvailable: isLiveConfigured,
      status: isLiveConfigured ? 'AUTHORIZED_LIVE_ACTIVE' : 'LIVE_FEED_UNAVAILABLE',
      notice: isLiveConfigured
        ? 'Live bus positions streaming via authenticated Delhi OTD feed.'
        : 'Official Delhi real-time bus tracking requires a registered private API key (DELHI_OTD_API_KEY) from otd.delhi.gov.in. Static schedules and stops are active.'
    },
    popularRoutes: DELHI_POPULAR_BUS_ROUTES,
    busStops: DELHI_BUS_STOPS,
    metroInterchanges: DELHI_METRO_STATIONS.filter(m => m.line.includes('Interchange'))
  };
}

/**
 * Searches for bus or metro lines by keyword.
 */
export function searchTransit(query) {
  if (!query) return getTransitOverview();
  const q = query.toLowerCase().trim();

  const matchingRoutes = DELHI_POPULAR_BUS_ROUTES.filter(r =>
    r.routeNumber.toLowerCase().includes(q) ||
    r.routeName.toLowerCase().includes(q) ||
    r.majorStops.some(s => s.toLowerCase().includes(q))
  );

  const matchingStops = DELHI_BUS_STOPS.filter(b =>
    b.name.toLowerCase().includes(q) ||
    b.routes.some(r => r.toLowerCase().includes(q))
  );

  const matchingMetro = DELHI_METRO_STATIONS.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.line.toLowerCase().includes(q)
  );

  return {
    query,
    routes: matchingRoutes,
    busStops: matchingStops,
    metroStations: matchingMetro,
    timestamp: new Date().toISOString()
  };
}

/**
 * Fetches real-time vehicle positions from Delhi Open Transit Data (OTD)
 * Official endpoint: /api/realtime/VehiclePositions.pb?key=YOUR_PRIVATE_KEY
 * Decodes GTFS-Realtime Protocol Buffer feed.
 *
 * If DELHI_OTD_API_KEY is not configured or placeholder:
 * Returns explicit status with instructions on obtaining access.
 * Does NOT invent or fabricate fake bus coordinates.
 */
export async function fetchLiveBusPositions(routeNumber) {
  const otdApiKey = process.env.DELHI_OTD_API_KEY;
  const isKeyConfigured = Boolean(otdApiKey && otdApiKey.length > 5 && !otdApiKey.includes('YOUR_'));

  if (!isKeyConfigured) {
    return {
      status: 'LIVE_FEED_UNAVAILABLE',
      authorized: false,
      feedConfigured: false,
      message: 'Official Delhi real-time bus tracking requires an authorized private API key (DELHI_OTD_API_KEY) from the Delhi Open Transit Data portal (otd.delhi.gov.in). NightOwl never fabricates or hallucinates live bus GPS positions.',
      instructions: {
        portal: 'https://otd.delhi.gov.in/',
        registerUrl: 'https://otd.delhi.gov.in/register/',
        docsUrl: 'https://otd.delhi.gov.in/documentation/',
        endpoint: 'https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=YOUR_PRIVATE_KEY',
        envVariable: 'DELHI_OTD_API_KEY',
        format: 'GTFS-Realtime Protocol Buffer (.pb)'
      },
      vehicles: [],
      vehiclesCount: 0,
      timestamp: new Date().toISOString(),
      staticFallback: {
        routes: routeNumber
          ? DELHI_POPULAR_BUS_ROUTES.filter(r => r.routeNumber.toLowerCase() === routeNumber.toLowerCase())
          : DELHI_POPULAR_BUS_ROUTES,
        busStops: DELHI_BUS_STOPS
      }
    };
  }

  const now = Date.now();
  // Check if cache is still fresh
  if (now - liveFeedCache.timestamp < CACHE_TTL_MS && liveFeedCache.vehicles.length > 0) {
    let filtered = liveFeedCache.vehicles;
    if (routeNumber) {
      const q = routeNumber.toLowerCase().trim();
      filtered = filtered.filter(v => (v.routeId || '').toLowerCase().includes(q));
    }
    return {
      status: 'SUCCESS',
      authorized: true,
      feedConfigured: true,
      dataSource: 'Delhi Open Transit Data (otd.delhi.gov.in)',
      cached: true,
      totalLiveVehicles: liveFeedCache.vehicles.length,
      vehiclesCount: filtered.length,
      vehicles: filtered,
      timestamp: new Date(liveFeedCache.timestamp).toISOString()
    };
  }

  // Live authorized request to official OTD Protobuf endpoint
  try {
    const url = `https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=${encodeURIComponent(otdApiKey.trim())}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/x-protobuf, application/octet-stream',
        'User-Agent': 'NightOwl-Delhi-Safety-Intelligence/2.0'
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return {
          status: 'UNAUTHORIZED',
          authorized: false,
          feedConfigured: true,
          message: 'The provided DELHI_OTD_API_KEY was rejected by the Delhi Open Transit Data server. Verify credentials at otd.delhi.gov.in.',
          vehicles: [],
          vehiclesCount: 0,
          timestamp: new Date().toISOString()
        };
      }
      throw new Error(`OTD server returned HTTP status ${res.status} (${res.statusText})`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Decode GTFS-Realtime Protocol Buffer feed
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);
    const parsedVehicles = [];

    if (feed && Array.isArray(feed.entity)) {
      for (const entity of feed.entity) {
        if (!entity.vehicle || !entity.vehicle.position) continue;
        const pos = entity.vehicle.position;
        const lat = pos.latitude;
        const lng = pos.longitude;

        // Skip missing or invalid coordinates or vehicles outside Delhi NCT bounds
        if (!lat || !lng || !isWithinDelhi(lat, lng)) continue;

        const vehicleId = entity.vehicle.vehicle?.id || entity.id;
        const routeId = entity.vehicle.trip?.routeId || entity.vehicle.vehicle?.label || 'DTC';
        const tripId = entity.vehicle.trip?.tripId || null;
        const directionId = entity.vehicle.trip?.directionId ?? null;
        const speedKmph = pos.speed != null ? Math.round(pos.speed * 3.6) : null;
        const bearing = pos.bearing != null ? Math.round(pos.bearing) : null;
        const recordTime = entity.vehicle.timestamp
          ? new Date(Number(entity.vehicle.timestamp) * 1000).toISOString()
          : new Date().toISOString();

        parsedVehicles.push({
          id: entity.id,
          vehicleId,
          routeId,
          tripId,
          directionId,
          lat,
          lng,
          bearing,
          speedKmph,
          timestamp: recordTime,
          provider: 'Delhi OTD (Official DTC/DIMTS)'
        });
      }
    }

    // Update in-memory cache
    liveFeedCache = {
      timestamp: now,
      vehicles: parsedVehicles,
      rawCount: parsedVehicles.length
    };

    let filtered = parsedVehicles;
    if (routeNumber) {
      const q = routeNumber.toLowerCase().trim();
      filtered = filtered.filter(v => (v.routeId || '').toLowerCase().includes(q));
    }

    return {
      status: 'SUCCESS',
      authorized: true,
      feedConfigured: true,
      dataSource: 'Delhi Open Transit Data (otd.delhi.gov.in)',
      cached: false,
      totalLiveVehicles: parsedVehicles.length,
      vehiclesCount: filtered.length,
      vehicles: filtered,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      status: 'FEED_FETCH_ERROR',
      authorized: true,
      feedConfigured: true,
      message: `Failed to fetch or parse official Delhi OTD live feed: ${err.message}`,
      vehicles: [],
      vehiclesCount: 0,
      timestamp: new Date().toISOString(),
      staticFallback: {
        routes: DELHI_POPULAR_BUS_ROUTES,
        busStops: DELHI_BUS_STOPS
      }
    };
  }
}
