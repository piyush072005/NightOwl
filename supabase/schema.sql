-- ==============================================================================
-- NIGHTSHIFT OPERATIONS HUB - SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project (or create a new one)
-- 3. In the left navigation, click on "SQL Editor"
-- 4. Click "New query", paste all contents of this file, and click "Run" (Ctrl+Enter)
-- 5. All tables, indexes, RLS policies, realtime triggers, and seed data will be created!
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. SCOUT PROFILES & GAMIFICATION TABLE
-- Tracks community scouts, reputation points, ranks, and report totals
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scout_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scout_name TEXT NOT NULL DEFAULT 'Community Route Scout',
    handle TEXT DEFAULT '@Scout_Hub',
    rep_score INTEGER NOT NULL DEFAULT 480,
    scout_level INTEGER NOT NULL DEFAULT 3,
    reports_filed INTEGER NOT NULL DEFAULT 128,
    badge_title TEXT DEFAULT 'Verified Night Pioneer',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. SCOUT GROUND TRUTH REPORTS TABLE
-- Real-time road observation intel filed by community scouts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scout_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scout_name TEXT NOT NULL DEFAULT 'Anonymous Scout',
    road_condition TEXT NOT NULL CHECK (road_condition IN ('safe_light', 'unsafe', 'construction', 'water_logging')),
    condition_title TEXT NOT NULL,
    landmark_note TEXT,
    photo_url TEXT,
    geo_lat NUMERIC(9,6) DEFAULT 28.629000,
    geo_lng NUMERIC(9,6) DEFAULT 77.369000,
    rep_points_awarded INTEGER DEFAULT 25,
    epistemic_status TEXT DEFAULT 'KNOWN' CHECK (epistemic_status IN ('KNOWN', 'PROBABLE', 'OUTDATED', 'UNKNOWN')),
    impact_desc TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. COMMUTE INTAKES TABLE
-- Night worker safe corridor calculation requests
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commute_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_role TEXT NOT NULL,
    shift_departure_time TEXT NOT NULL,
    target_arrival_time TEXT NOT NULL,
    start_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    transport_mode TEXT NOT NULL,
    risk_level TEXT DEFAULT 'Low (Patrolled)',
    synthesized_route TEXT,
    epistemic_tag TEXT DEFAULT 'KNOWN',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. EMERGENCY SOS ALERTS TABLE
-- Incident broadcasts triggered by night commuters or route scouts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sos_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT DEFAULT 'Commuter #8841',
    location_name TEXT NOT NULL DEFAULT 'Sector 62 Tech Park Transit Corridor',
    geo_lat NUMERIC(9,6) DEFAULT 28.629200,
    geo_lng NUMERIC(9,6) DEFAULT 77.369800,
    assigned_police_unit TEXT DEFAULT 'Police PCR #4 (0.3 km away)',
    emergency_dispatch_type TEXT DEFAULT '112 / 100 Initiated',
    alert_status TEXT DEFAULT 'DISPATCHED' CHECK (alert_status IN ('ACTIVE', 'DISPATCHED', 'RESOLVED')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. CORRIDOR CHECKPOINTS & HAVENS TABLE
-- Physical route waypoints, street lighting status, and 24/7 havens
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS corridor_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_name TEXT NOT NULL,
    node_type TEXT NOT NULL,
    lighting_percent TEXT NOT NULL,
    community_vouch TEXT NOT NULL,
    is_open_24_7 BOOLEAN DEFAULT true,
    epistemic_status TEXT NOT NULL DEFAULT 'KNOWN',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. CHAT MESSAGES LOG TABLE
-- WhatsApp Safe Corridor Assistant simulation and conversational records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot', 'system')),
    message_text TEXT NOT NULL,
    tag TEXT DEFAULT 'KNOWN',
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enabling RLS and providing public access for development / prototype dashboard
-- ------------------------------------------------------------------------------
ALTER TABLE scout_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE commute_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous read and write access
CREATE POLICY "Public Read scout_profiles" ON scout_profiles FOR SELECT USING (true);
CREATE POLICY "Public Update scout_profiles" ON scout_profiles FOR UPDATE USING (true);
CREATE POLICY "Public Insert scout_profiles" ON scout_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read scout_reports" ON scout_reports FOR SELECT USING (true);
CREATE POLICY "Public Insert scout_reports" ON scout_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read commute_intakes" ON commute_intakes FOR SELECT USING (true);
CREATE POLICY "Public Insert commute_intakes" ON commute_intakes FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read sos_alerts" ON sos_alerts FOR SELECT USING (true);
CREATE POLICY "Public Insert sos_alerts" ON sos_alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read corridor_checkpoints" ON corridor_checkpoints FOR SELECT USING (true);
CREATE POLICY "Public Insert corridor_checkpoints" ON corridor_checkpoints FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update corridor_checkpoints" ON corridor_checkpoints FOR UPDATE USING (true);

CREATE POLICY "Public Read chat_messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Public Insert chat_messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- ENABLE SUPABASE REALTIME
-- Enables live push updates over websockets whenever a new report or SOS arrives
-- ------------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE scout_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE commute_intakes;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE scout_profiles;

-- ------------------------------------------------------------------------------
-- SEED INITIAL DATA
-- ------------------------------------------------------------------------------
INSERT INTO scout_profiles (scout_name, handle, rep_score, scout_level, reports_filed, badge_title)
VALUES ('Community Route Scout', '@Scout_Hub', 480, 3, 128, 'Verified Night Pioneer')
ON CONFLICT DO NOTHING;

INSERT INTO corridor_checkpoints (node_name, node_type, lighting_percent, community_vouch, epistemic_status)
VALUES
('Sector 62 Hub Exit', 'Departure Gate', '100% High Mast', 'CCTV + 24/7 Chai Kiosk (Vouched by 8 Scouts)', 'KNOWN'),
('Central Square Junction', 'Major Arterial', '90% Sodium Halide', 'Active Night Market & Rickshaw Stand', 'KNOWN'),
('Bypass East Underpass', 'Connecting Link', '50% Dimmed Grid', 'Dimmed Grid - Warning: Use Northern Footbridge', 'PROBABLE'),
('Block B Market Haven', 'Safe Haven Zone', '100% Commercial Lit', 'Apollo 24/7 Pharmacist & Guard on Duty', 'KNOWN')
ON CONFLICT DO NOTHING;

INSERT INTO scout_reports (scout_name, road_condition, condition_title, landmark_note, epistemic_status, impact_desc)
VALUES
('@Rhea_K', 'construction', 'Road is under Construction', 'Bypass East Arterial Segment #12', 'PROBABLE', 'Underpass streetlights on Bypass East operating on reduced 50% power.'),
('@Dev_M', 'safe_light', 'Road is safe and proper lighting', 'Central Square tea stall & commuters active', 'KNOWN', 'Corridor lighting raised to 92%. Active patrolled lane verified.')
ON CONFLICT DO NOTHING;
