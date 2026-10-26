/**
 * Comprehensive Automated Verification Suite for NightOwl
 * Delhi Safety & Mobility Intelligence Platform
 */

import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting NightOwl Delhi Platform Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Health Endpoint
  await test('GET /api/health returns online status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'online');
    assert.ok(data.timestamp);
  });

  // 2. Geocoding
  await test('GET /api/geospatial/search resolves Connaught Place', async () => {
    const res = await fetch(`${BASE_URL}/api/geospatial/search?q=Connaught%20Place`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.lat > 28.5 && data.lat < 28.8);
    assert.ok(data.lng > 77.1 && data.lng < 77.4);
    assert.ok(data.confidence >= 0.8);
  });

  await test('GET /api/geospatial/search handles empty query with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/geospatial/search?q=`);
    assert.strictEqual(res.status, 400);
  });

  // 3. Reverse Geocoding
  await test('GET /api/geospatial/reverse identifies landmark', async () => {
    const res = await fetch(`${BASE_URL}/api/geospatial/reverse?lat=28.6328&lng=77.2195`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.name.includes('Connaught Place'));
  });

  // 4. Nearby Places & Havens
  await test('GET /api/geospatial/nearby returns hospitals with distance', async () => {
    const res = await fetch(`${BASE_URL}/api/geospatial/nearby?lat=28.5672&lng=77.2100&category=hospital&radius=10`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.results.length > 0);
    assert.strictEqual(data.results[0].category, 'hospital');
    assert.ok(typeof data.results[0].distanceKm === 'number');
    assert.strictEqual(data.results[0].emergencyOpen, true);
  });

  await test('GET /api/geospatial/nearby returns 24/7 pharmacies', async () => {
    const res = await fetch(`${BASE_URL}/api/geospatial/nearby?lat=28.6295&lng=77.3670&category=pharmacy&radius=5`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.results.length > 0);
    assert.strictEqual(data.results[0].open247, true);
  });

  // 5. Road Routing & Safety Scoring
  await test('POST /api/geospatial/route calculates routes and safety scores', async () => {
    const res = await fetch(`${BASE_URL}/api/geospatial/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startLat: 28.6280,
        startLng: 77.3649, // Noida Sec 62
        endLat: 28.6328,
        endLng: 77.2195, // Connaught Place
        mode: 'driving'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.routes.length >= 1);
    const r0 = data.routes[0];
    assert.ok(r0.coordinates.length > 2);
    assert.ok(r0.distanceKm > 10);
    assert.ok(r0.durationMins > 10);
    assert.ok(r0.safety.safetyScore >= 0 && r0.safety.safetyScore <= 100);
    assert.ok(r0.safety.breakdown);
    assert.ok(r0.safety.summaryText);
  });

  await test('POST /api/geospatial/route rejects invalid coordinates', async () => {
    const res = await fetch(`${BASE_URL}/api/geospatial/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startLat: 'not_a_number' })
    });
    assert.strictEqual(res.status, 400);
  });

  // 6. Transit Adapter
  await test('GET /api/geospatial/transit returns static bus & metro overview', async () => {
    const res = await fetch(`${BASE_URL}/api/geospatial/transit`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.popularRoutes.length > 0);
    assert.ok(data.liveTracking.notice);
  });

  await test('GET /api/geospatial/transit/live safely handles unconfigured key', async () => {
    const res = await fetch(`${BASE_URL}/api/geospatial/transit/live?route=414`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.authorized, false);
    assert.ok(data.message.includes('DELHI_OTD_API_KEY'));
  });

  // 7. Map-Aware Chatbot
  await test('POST /api/chat understands route intent and emits RENDER_ROUTE action', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Find safest route from Hauz Khas to AIIMS New Delhi'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.text.includes('Safety-Informed Route Synthesized'));
    assert.ok(data.mapAction);
    assert.strictEqual(data.mapAction.type, 'RENDER_ROUTE');
    assert.ok(data.mapAction.routes.length > 0);
  });

  await test('POST /api/chat handles pharmacy request and emits SHOW_PLACES action', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Where is the nearest open pharmacy?'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.text.includes('Pharmacies'));
    assert.ok(data.mapAction);
    assert.strictEqual(data.mapAction.type, 'SHOW_PLACES');
    assert.strictEqual(data.mapAction.category, 'pharmacy');
  });

  await test('POST /api/chat handles emergency SOS intent safely', async () => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Emergency SOS! Need immediate help'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.text.includes('EMERGENCY PROTOCOL TRIGGERED') || data.text.includes('Emergency'));
  });

  // 8. Official Delhi Emergency Services
  await test('GET /api/delhi/emergency-services returns verified helplines', async () => {
    const res = await fetch(`${BASE_URL}/api/delhi/emergency-services`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.services.length >= 5);
    const cats = data.services.find(s => s.id === 'em-cats');
    assert.ok(cats, 'CATS Ambulance must be present');
    assert.strictEqual(cats.tollFreeNumber, '102');
    const police = data.services.find(s => s.id === 'em-police');
    assert.ok(police, 'Delhi Police must be present');
    assert.strictEqual(police.tollFreeNumber, '112');
    const women = data.services.find(s => s.id === 'em-women');
    assert.ok(women, 'Women helpline must be present');
    assert.strictEqual(women.tollFreeNumber, '1091');
  });

  // 9. Verified Delhi Hospitals
  await test('GET /api/delhi/hospitals returns casualty departments', async () => {
    const res = await fetch(`${BASE_URL}/api/delhi/hospitals`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.hospitals.length >= 5);
    const aiims = data.hospitals.find(h => h.id === 'h-aiims');
    assert.ok(aiims);
    assert.strictEqual(aiims.emergencyDeptOpen247, true);
    assert.ok(aiims.emergencyPhone);
    assert.ok(aiims.ambulanceLine);
  });

  // 10. Verified 24-Hour Pharmacies
  await test('GET /api/delhi/pharmacies returns 24/7 medical shops', async () => {
    const res = await fetch(`${BASE_URL}/api/delhi/pharmacies?verifiedOnly=true`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.pharmacies.length >= 5);
    for (const p of data.pharmacies) {
      assert.strictEqual(p.verified247, true);
      assert.ok(p.phone);
      assert.ok(p.officialSource);
    }
  });

  // 11. Delhi OTD Live Bus Tracking Endpoint
  await test('GET /api/delhi/buses/live reports unconfigured status honestly', async () => {
    const res = await fetch(`${BASE_URL}/api/delhi/buses/live`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    if (data.status === 'LIVE_FEED_UNAVAILABLE') {
      assert.strictEqual(data.feedConfigured, false);
      assert.ok(data.instructions.portal.includes('otd.delhi.gov.in'));
      assert.strictEqual(data.vehiclesCount, 0);
      assert.ok(data.staticFallback);
    } else {
      assert.strictEqual(data.status, 'SUCCESS');
      assert.ok(Array.isArray(data.vehicles));
    }
  });

  // 12. Delhi Static Transit Stops & Routes
  await test('GET /api/delhi/transit/stops returns static network', async () => {
    const res = await fetch(`${BASE_URL}/api/delhi/transit/stops`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.stops.length > 0);
    assert.ok(data.metroStations.length > 0);
  });

  // 13. Delhi Status Endpoint
  await test('GET /api/delhi/status returns boundary and dataset health', async () => {
    const res = await fetch(`${BASE_URL}/api/delhi/status`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ACTIVE');
    assert.strictEqual(data.bounds.minLat, 28.40);
    assert.strictEqual(data.bounds.maxLat, 28.88);
    assert.strictEqual(data.bounds.minLng, 76.85);
    assert.strictEqual(data.bounds.maxLng, 77.40);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite failed to execute:', err);
  process.exit(1);
});
