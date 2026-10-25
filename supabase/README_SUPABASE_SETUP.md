# Step-by-Step Guide: How to Generate Tables in Supabase

This guide walks you through generating and configuring all required database tables for the **NightShift Operations Hub** using Supabase.

---

## 📌 Prerequisites
1. A free account on [Supabase](https://supabase.com).
2. A new or existing project created on your Supabase dashboard.

---

## 🚀 Step 1: Open Your Supabase Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **"New Project"** (or choose an existing one).
3. Give your project a name (e.g., `NightShift-Hub`), set a strong database password, and pick a region close to your users.
4. Wait 1–2 minutes for Supabase to finish provisioning the database.

---

## 🛠️ Step 2: Open the SQL Editor & Run the Schema
The quickest, most reliable way to generate all tables, data types, constraints, Row Level Security (RLS) policies, and Realtime publications is by using the SQL Editor:

1. In the left navigation menu of your Supabase dashboard, click on the **SQL Editor** icon (`>_`).
2. Click the **"+ New query"** button at the top.
3. Open the file `supabase/schema.sql` from this project folder.
4. Copy its entire contents and paste it into the query editor window.
5. Click the green **"Run"** button (or press `Ctrl + Enter` / `Cmd + Enter`).
6. You will see a `Success. No rows returned` message. All tables are now created and seeded!

---

## 📊 Step 3: Verify the Generated Tables in Table Editor
In the left navigation menu, click on the **Table Editor** (`▦`). You will see the following 6 tables:

| Table Name | Purpose | Key Columns |
| :--- | :--- | :--- |
| `scout_reports` | Live road condition intel reported by community route scouts | `id`, `scout_name`, `road_condition`, `condition_title`, `landmark_note`, `photo_url`, `rep_points_awarded`, `epistemic_status` |
| `commute_intakes` | Safe night commute route requests submitted by shift workers | `id`, `worker_role`, `shift_departure_time`, `target_arrival_time`, `start_location`, `destination_location`, `transport_mode`, `risk_level` |
| `sos_alerts` | Emergency SOS panic alerts dispatched to police & clinics | `id`, `user_identifier`, `location_name`, `geo_lat`, `geo_lng`, `assigned_police_unit`, `alert_status` |
| `corridor_checkpoints` | Safety waypoints, lighting levels & vouched safe havens | `id`, `node_name`, `node_type`, `lighting_percent`, `community_vouch`, `is_open_24_7`, `epistemic_status` |
| `scout_profiles` | Scout gamification profiles, reputation scores & badges | `id`, `scout_name`, `handle`, `rep_score`, `scout_level`, `reports_filed`, `badge_title` |
| `chat_messages` | In-chat WhatsApp Safe Corridor conversation archive | `id`, `sender_type`, `message_text`, `tag`, `photo_url` |

---

## 🔒 Step 4: Row Level Security (RLS) & Policies
`schema.sql` automatically enables RLS and configures public read/write policies:
- `Public Read` (`SELECT USING (true)`): Allows the dashboard to fetch checkpoints, reports, and alerts.
- `Public Insert` (`INSERT WITH CHECK (true)`): Allows commuters and scouts to file reports, log safe routes, and trigger SOS alerts.

If you ever need to inspect or adjust policies:
1. In the left menu, click **Authentication** -> **Policies**.
2. Select any table to see its active policies.

---

## ⚡ Step 5: Verify Realtime Replication
`schema.sql` runs the following command to enable instant websocket push updates:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE scout_reports, sos_alerts, commute_intakes, scout_profiles;
```
To verify:
1. In the left menu, click **Database** -> **Replication**.
2. Under `Source`, click the `supabase_realtime` publication.
3. Verify that `scout_reports`, `sos_alerts`, and `commute_intakes` have replication turned on.

---

## 🔑 Step 6: Retrieve Your API Credentials
1. In the left sidebar, click the **Project Settings** (gear icon) -> **API**.
2. Find the **Project URL**:
   - Example: `https://abcdefghijklmno.supabase.co`
3. Find the **Project API Keys** -> `anon` (public):
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Copy these two values.

---

## 🔌 Step 7: Connect Your App
You can connect in either of two easy ways:

### Option A: Via the Web Dashboard (No restarts needed!)
1. Start the server (`npm start`) and open `http://localhost:3000`.
2. Click the **"Setup Supabase (Demo Mode)"** pill in the top header.
3. Paste your **Project URL** and **Anon Public Key**.
4. Click **"Save & Connect Supabase"**. The app immediately verifies the connection, writes to `.env`, and activates Realtime sync!

### Option B: Via the `.env` file
1. Open the `.env` file in the project root:
   ```env
   PORT=3000
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-public-key-here
   SUPABASE_SERVICE_ROLE_KEY=
   ```
2. Restart the app (`npm start`).
