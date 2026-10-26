import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import geospatialRoutes from './routes/geospatialRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Mount Geospatial, Routing & Chat Routes
app.use('/api/geospatial', geospatialRoutes);
app.use('/api', geospatialRoutes);

// Supabase client instance (server-side)
let supabase = null;

function initSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (url && key && url.startsWith('http') && !url.includes('your-project-id')) {
    try {
      supabase = createClient(url, key, {
        auth: { persistSession: false }
      });
      console.log('✅ Supabase server client initialized successfully with URL:', url);
    } catch (err) {
      console.warn('⚠️ Supabase client initialization error:', err.message);
      supabase = null;
    }
  } else {
    supabase = null;
    console.log('ℹ️ Running in Local Mock / Fallback mode. Configure SUPABASE_URL and SUPABASE_ANON_KEY to connect to Supabase.');
  }
}

initSupabase();

// In-Memory Fallback Store (used seamlessly when Supabase is not configured yet)
const memoryStore = {
  profile: {
    scout_name: 'Community Route Scout',
    handle: '@Scout_Hub',
    rep_score: 480,
    scout_level: 3,
    reports_filed: 128,
    badge_title: 'Verified Night Pioneer'
  },
  reports: [
    {
      id: 'mock-1',
      scout_name: '@Rhea_K',
      road_condition: 'construction',
      condition_title: 'Road is under Construction',
      landmark_note: 'Bypass East Arterial Segment #12',
      photo_url: '',
      epistemic_status: 'PROBABLE',
      impact_desc: 'Underpass streetlights on Bypass East operating on reduced 50% backup power.',
      created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString()
    },
    {
      id: 'mock-2',
      scout_name: '@Dev_M',
      road_condition: 'safe_light',
      condition_title: 'Road is safe and proper lighting',
      landmark_note: 'Central Square tea stall & commuters active',
      photo_url: '',
      epistemic_status: 'KNOWN',
      impact_desc: 'Corridor lighting raised to 92%. Active patrolled lane verified.',
      created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString()
    }
  ],
  checkpoints: [
    {
      id: 'cp-1',
      node_name: 'Sector 62 Hub Exit',
      node_type: 'Departure Gate',
      lighting_percent: '100% High Mast',
      community_vouch: 'CCTV + 24/7 Chai Kiosk (Vouched by 8 Scouts)',
      epistemic_status: 'KNOWN'
    },
    {
      id: 'cp-2',
      node_name: 'Central Square Junction',
      node_type: 'Major Arterial',
      lighting_percent: '90% Sodium Halide',
      community_vouch: 'Active Night Market & Rickshaw Stand',
      epistemic_status: 'KNOWN'
    },
    {
      id: 'cp-3',
      node_name: 'Bypass East Underpass',
      node_type: 'Connecting Link',
      lighting_percent: '50% Dimmed Grid',
      community_vouch: 'Dimmed Grid - Warning: Use Northern Footbridge',
      epistemic_status: 'PROBABLE'
    },
    {
      id: 'cp-4',
      node_name: 'Block B Market Haven',
      node_type: 'Safe Haven Zone',
      lighting_percent: '100% Commercial Lit',
      community_vouch: 'Apollo 24/7 Pharmacist & Guard on Duty',
      epistemic_status: 'KNOWN'
    }
  ],
  commutes: [],
  sosAlerts: []
};

// ==========================================
// API ROUTES
// ==========================================

// 1. System Health & Configuration Endpoint
app.get('/api/health', async (req, res) => {
  let supabaseConnected = false;
  let supabaseError = null;

  if (supabase) {
    try {
      const { error } = await supabase.from('corridor_checkpoints').select('id').limit(1);
      if (!error) {
        supabaseConnected = true;
      } else {
        supabaseError = error.message;
      }
    } catch (e) {
      supabaseError = e.message;
    }
  }

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    supabase: {
      isConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      isConnected: supabaseConnected,
      url: process.env.SUPABASE_URL || null,
      error: supabaseError
    }
  });
});

// 2. Client Config Endpoint (Allows browser to safely access public URL & Anon Key)
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// 3. Save / Update Config Endpoint (Useful for in-browser setup modal)
app.post('/api/config', (req, res) => {
  const { supabaseUrl, supabaseAnonKey } = req.body;
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(400).json({ error: 'supabaseUrl and supabaseAnonKey are required' });
  }

  process.env.SUPABASE_URL = supabaseUrl.trim();
  process.env.SUPABASE_ANON_KEY = supabaseAnonKey.trim();

  // Save to .env file on disk
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = `PORT=${PORT}\nSUPABASE_URL=${supabaseUrl.trim()}\nSUPABASE_ANON_KEY=${supabaseAnonKey.trim()}\nSUPABASE_SERVICE_ROLE_KEY=\n`;
    fs.writeFileSync(envPath, envContent, 'utf-8');
    initSupabase();
    return res.json({ success: true, message: 'Configuration saved to .env and client re-initialized!' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to write to .env: ' + err.message });
  }
});

// 4. Scout Profile & Stats
app.get('/api/profile', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('scout_profiles').select('*').limit(1).single();
      if (!error && data) {
        return res.json(data);
      }
    } catch (e) {
      console.warn('Error reading profile from Supabase:', e.message);
    }
  }
  res.json(memoryStore.profile);
});

// 5. Corridor Checkpoints
app.get('/api/checkpoints', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('corridor_checkpoints').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return res.json(data);
      }
    } catch (e) {
      console.warn('Error reading checkpoints from Supabase:', e.message);
    }
  }
  res.json(memoryStore.checkpoints);
});

// 6. Scout Ground Truth Reports
app.get('/api/reports', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('scout_reports').select('*').order('created_at', { ascending: false }).limit(50);
      if (!error && data) {
        return res.json(data);
      }
    } catch (e) {
      console.warn('Error reading reports from Supabase:', e.message);
    }
  }
  res.json(memoryStore.reports);
});

app.post('/api/reports', async (req, res) => {
  const {
    scout_name = 'Community Route Scout',
    road_condition,
    condition_title,
    landmark_note,
    photo_url,
    geo_lat = 28.629000,
    geo_lng = 77.369000,
    rep_points_awarded = 25,
    epistemic_status = 'KNOWN',
    impact_desc
  } = req.body;

  if (!road_condition || !condition_title) {
    return res.status(400).json({ error: 'road_condition and condition_title are required' });
  }

  const newReport = {
    scout_name,
    road_condition,
    condition_title,
    landmark_note: landmark_note || '',
    photo_url: photo_url || '',
    geo_lat,
    geo_lng,
    rep_points_awarded,
    epistemic_status,
    impact_desc: impact_desc || ''
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('scout_reports').insert([newReport]).select().single();
      if (error) throw error;

      // Increment scout points in Supabase
      await supabase.rpc('increment_scout_points', { pts: rep_points_awarded }).catch(async () => {
        // Fallback standard update
        const { data: p } = await supabase.from('scout_profiles').select('id, rep_score, reports_filed').limit(1).single();
        if (p) {
          await supabase.from('scout_profiles').update({
            rep_score: p.rep_score + rep_points_awarded,
            reports_filed: p.reports_filed + 1,
            updated_at: new Date().toISOString()
          }).eq('id', p.id);
        }
      });

      return res.status(201).json({ success: true, report: data, storage: 'supabase' });
    } catch (e) {
      console.warn('Supabase insert failed, falling back to in-memory:', e.message);
    }
  }

  // Fallback to in-memory store
  const fallbackReport = {
    id: 'rep-' + Date.now(),
    ...newReport,
    created_at: new Date().toISOString()
  };
  memoryStore.reports.unshift(fallbackReport);
  memoryStore.profile.rep_score += rep_points_awarded;
  memoryStore.profile.reports_filed += 1;

  res.status(201).json({ success: true, report: fallbackReport, storage: 'in-memory' });
});

// 7. Commute Safe Route Intakes
app.get('/api/commutes', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('commute_intakes').select('*').order('created_at', { ascending: false });
      if (!error && data) return res.json(data);
    } catch (e) {
      console.warn('Error reading commutes:', e.message);
    }
  }
  res.json(memoryStore.commutes);
});

app.post('/api/commutes', async (req, res) => {
  const {
    worker_role,
    shift_departure_time,
    target_arrival_time,
    start_location,
    destination_location,
    transport_mode,
    synthesized_route,
    risk_level = 'Low (Patrolled)',
    epistemic_tag = 'KNOWN'
  } = req.body;

  const record = {
    worker_role,
    shift_departure_time,
    target_arrival_time,
    start_location,
    destination_location,
    transport_mode,
    synthesized_route: synthesized_route || `Patrolled corridor from ${start_location} to ${destination_location}`,
    risk_level,
    epistemic_tag
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('commute_intakes').insert([record]).select().single();
      if (!error && data) return res.status(201).json({ success: true, intake: data, storage: 'supabase' });
    } catch (e) {
      console.warn('Supabase commute insert error:', e.message);
    }
  }

  const fallback = { id: 'commute-' + Date.now(), ...record, created_at: new Date().toISOString() };
  memoryStore.commutes.unshift(fallback);
  res.status(201).json({ success: true, intake: fallback, storage: 'in-memory' });
});

// 8. Emergency SOS Broadcast
app.post('/api/sos', async (req, res) => {
  const {
    user_identifier = 'Commuter #8841',
    location_name = 'Sector 62 Tech Park Transit Corridor',
    geo_lat = 28.629200,
    geo_lng = 77.369800,
    assigned_police_unit = 'Police PCR #4 (0.3 km away)',
    emergency_dispatch_type = '112 / 100 Initiated'
  } = req.body;

  const alertRecord = {
    user_identifier,
    location_name,
    geo_lat,
    geo_lng,
    assigned_police_unit,
    emergency_dispatch_type,
    alert_status: 'DISPATCHED'
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('sos_alerts').insert([alertRecord]).select().single();
      if (!error && data) return res.status(201).json({ success: true, alert: data, storage: 'supabase' });
    } catch (e) {
      console.warn('Supabase SOS insert error:', e.message);
    }
  }

  const fallback = { id: 'sos-' + Date.now(), ...alertRecord, created_at: new Date().toISOString() };
  memoryStore.sosAlerts.unshift(fallback);
  res.status(201).json({ success: true, alert: fallback, storage: 'in-memory' });
});

// Serve frontend SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function startServer(portToTry) {
  const HOST = '0.0.0.0';
  const server = app.listen(portToTry, HOST, () => {
    console.log(`\n======================================================`);
    console.log(`🌙 NightOwl Full Stack Server running at:`);
    console.log(`👉 http://${HOST}:${portToTry}`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${portToTry} is in use. Trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
