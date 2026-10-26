import express from 'express';
import { geocodeLocation, reverseGeocode, getSuggestions } from '../services/geocodingService.js';
import {
  findNearbyPlaces,
  getEmergencyServices,
  getDelhiHospitalsList,
  getDelhiPharmaciesList
} from '../services/placesService.js';
import { calculateRoute } from '../services/routingService.js';
import { compareRouteAlternatives } from '../services/safetyScoringService.js';
import {
  getTransitOverview,
  searchTransit,
  fetchLiveBusPositions,
  DELHI_POPULAR_BUS_ROUTES
} from '../services/transitService.js';
import { processChatQuery } from '../services/chatService.js';
import { DELHI_BOUNDS, DELHI_BUS_STOPS, DELHI_METRO_STATIONS, isWithinDelhi } from '../services/delhiData.js';

const router = express.Router();

// 1. Search Delhi Locations / Landmarks
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  try {
    const result = await geocodeLocation(query.trim());
    if (!result) {
      return res.status(404).json({ error: 'Location not found in Delhi NCR area.' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Geocoding service error: ' + err.message });
  }
});

// 1.1 Autocomplete Suggestions
router.get('/suggestions', async (req, res) => {
  const query = req.query.q || '';
  try {
    const suggestions = await getSuggestions(query);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: 'Suggestions error: ' + err.message });
  }
});

// 2. Reverse Geocode Coordinates
router.get('/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Valid "lat" and "lng" parameters are required.' });
  }

  try {
    const result = await reverseGeocode(lat, lng);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Reverse geocoding error: ' + err.message });
  }
});

// 3. Nearby Facilities (hospitals, pharmacies, police, metro, bus, hazards)
router.get('/nearby', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const category = (req.query.category || 'all').toLowerCase();
  const radiusKm = parseFloat(req.query.radius) || 5.0;
  const limit = parseInt(req.query.limit, 10) || 20;
  const verifiedOnly = req.query.verifiedOnly === 'true';

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Valid numeric "lat" and "lng" parameters are required.' });
  }

  try {
    const data = findNearbyPlaces({ lat, lng, category, radiusKm, limit, verifiedOnly });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Calculate Road Routes & Safety-Informed Scoring
router.post('/route', async (req, res) => {
  const { startLat, startLng, endLat, endLng, mode = 'driving' } = req.body;

  const sLat = parseFloat(startLat);
  const sLng = parseFloat(startLng);
  const eLat = parseFloat(endLat);
  const eLng = parseFloat(endLng);

  if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) {
    return res.status(400).json({ error: 'startLat, startLng, endLat, and endLng must be valid numbers.' });
  }

  try {
    const rawRoutes = await calculateRoute({
      startLat: sLat,
      startLng: sLng,
      endLat: eLat,
      endLng: eLng,
      mode
    });

    const scoredRoutes = compareRouteAlternatives(rawRoutes);

    res.json({
      success: true,
      origin: { lat: sLat, lng: sLng, isWithinDelhi: isWithinDelhi(sLat, sLng) },
      destination: { lat: eLat, lng: eLng, isWithinDelhi: isWithinDelhi(eLat, eLng) },
      mode,
      routesCount: scoredRoutes.length,
      routes: scoredRoutes,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Route calculation error: ' + err.message });
  }
});

// 5. Transit Information & Timetables
router.get('/transit', (req, res) => {
  const query = req.query.q;
  if (query) {
    res.json(searchTransit(query));
  } else {
    res.json(getTransitOverview());
  }
});

// 6. Live Bus Positions (Official Delhi Open Transit Data GTFS-Realtime Adapter)
const handleLiveBuses = async (req, res) => {
  const route = req.query.route;
  try {
    const result = await fetchLiveBusPositions(route);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Live bus tracking error: ' + err.message });
  }
};
router.get('/transit/live', handleLiveBuses);
router.get('/buses/live', handleLiveBuses);
router.get('/delhi/buses/live', handleLiveBuses);

// 7. Official Emergency Helplines (CATS Ambulance 102/1099, Police 112, Women Helpline 1091, Fire 101, DDMA 1077)
const handleEmergencyServices = (req, res) => {
  res.json(getEmergencyServices());
};
router.get('/emergency-services', handleEmergencyServices);
router.get('/delhi/emergency-services', handleEmergencyServices);

// 8. Verified Delhi Hospitals with 24-Hour Casualty Departments
const handleHospitals = (req, res) => {
  const traumaOnly = req.query.traumaOnly === 'true';
  const search = req.query.q || '';
  res.json(getDelhiHospitalsList({ traumaOnly, search }));
};
router.get('/hospitals', handleHospitals);
router.get('/delhi/hospitals', handleHospitals);

// 9. Verified Delhi 24-Hour Medical Shops & Pharmacies
const handlePharmacies = (req, res) => {
  const verified247Only = req.query.verifiedOnly === 'true';
  const search = req.query.q || '';
  res.json(getDelhiPharmaciesList({ verified247Only, search }));
};
router.get('/pharmacies', handlePharmacies);
router.get('/delhi/pharmacies', handlePharmacies);

// 10. Static Delhi Transit Stops & Routes
router.get('/delhi/transit/stops', (req, res) => {
  res.json({
    count: DELHI_BUS_STOPS.length,
    stops: DELHI_BUS_STOPS,
    metroCount: DELHI_METRO_STATIONS.length,
    metroStations: DELHI_METRO_STATIONS
  });
});

router.get('/delhi/transit/routes', (req, res) => {
  res.json({
    count: DELHI_POPULAR_BUS_ROUTES.length,
    routes: DELHI_POPULAR_BUS_ROUTES
  });
});

// 11. Delhi System & Data Status
router.get('/delhi/status', (req, res) => {
  const otdApiKey = process.env.DELHI_OTD_API_KEY;
  const isKeyConfigured = Boolean(otdApiKey && otdApiKey.length > 5 && !otdApiKey.includes('YOUR_'));

  res.json({
    city: 'New Delhi, NCT of Delhi, India',
    bounds: DELHI_BOUNDS,
    status: 'ACTIVE',
    datasets: {
      emergencyServices: { verifiedCount: 6, verifiedDate: '2026-10' },
      hospitals: { count: 11, casualtyActive247: true, source: 'DGHS Emergency Medical Care' },
      pharmacies: { count: 11, roundTheClockVerified: 10, source: 'Delhi Govt 24-Hours Medical Shops Registry' },
      transitStops: { busStops: DELHI_BUS_STOPS.length, metroStations: DELHI_METRO_STATIONS.length },
      otdLiveTracking: {
        configured: isKeyConfigured,
        feedUrl: 'https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb',
        status: isKeyConfigured ? 'AUTHORIZED_LIVE_FEED' : 'STATIC_ONLY_UNAUTHORIZED'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// 12. Map-Aware Chatbot Endpoint
router.post('/chat', async (req, res) => {
  const { message, userLocation, context } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Field "message" is required.' });
  }

  try {
    const reply = await processChatQuery({
      message,
      userLocation,
      context
    });
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: 'Chat processing error: ' + err.message });
  }
});

export default router;
