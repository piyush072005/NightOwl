# NightShift - Full Stack Safety & Operations Dashboard (Supabase Integration)

A full-stack, real-time operations hub for night-time worker safety and community route intelligence, powered by **Express.js**, **Node.js**, **Vanilla JavaScript**, **Tailwind CSS**, and **Supabase (PostgreSQL + Realtime)**.

---

## 🌟 Key Features
- **Full Stack Architecture**: Express.js server providing REST API endpoints with dual support for Supabase cloud database and local fallback mode.
- **Supabase Integration**:
  - Live data persistence for **Route Scout Ground Truth reports**, **Commute Intakes**, **Emergency SOS dispatches**, and **Corridor Checkpoints**.
  - **Supabase Realtime WebSockets**: Instant live updates across multiple screens when any scout files a report or an SOS beacon is triggered.
  - Built-in in-browser **Supabase Setup Modal** to configure API credentials on the fly.
- **Community Ground Truth Telemetry**: Route scout submission flow with photo proof preview, road condition ratings (safe, unsafe, construction, flood/water logging), and gamified reputation score tracking.
- **Shift Commute Safe Route Synthesizer**: Intelligent corridor calculation based on worker cohort (nurses, security guards, delivery partners, etc.), departure hour, and transport mode.
- **Emergency SOS Dispatch**: Rapid panic alert button logging GPS coordinates to the database and broadcasting emergency signals.
- **Epistemic Tagging System**: Reliable ground truth classifications (`KNOWN`, `PROBABLE`, `OUTDATED`, `UNKNOWN`) to avoid night safety hallucinations.

---

## 📁 Project Structure
```
nightshift2/
├── .env                              # Environment variables (Supabase URL & Anon Key)
├── .env.example                      # Template for environment variables
├── package.json                      # Node dependencies & npm scripts
├── server.js                         # Express backend API & Supabase server client
├── supabase/
│   ├── schema.sql                    # 1-Click SQL script to generate all tables & RLS
│   └── README_SUPABASE_SETUP.md      # Detailed step-by-step guide to generating tables
├── public/
│   ├── index.html                    # Dashboard UI with live Supabase status
│   └── js/
│       └── app.js                    # Frontend logic & Supabase Realtime client
└── new1.html                         # Original static HTML file preserved for reference
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
Or for auto-reloading development:
```bash
npm run dev
```

Visit the dashboard in your browser:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🗄️ How to Generate the Tables in Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and create/select a project.
2. In the left navigation, click **SQL Editor** (`>_`).
3. Click **+ New Query**.
4. Open [supabase/schema.sql](supabase/schema.sql) from this project, copy all the SQL code, and paste it into the editor.
5. Click **Run**.
6. That's it! All 6 tables (`scout_reports`, `commute_intakes`, `sos_alerts`, `corridor_checkpoints`, `scout_profiles`, `chat_messages`), RLS security policies, and Realtime publications are created instantly.

For a detailed walkthrough, see [supabase/README_SUPABASE_SETUP.md](supabase/README_SUPABASE_SETUP.md).

---

## 🔌 Connecting Supabase to NightShift

1. In your Supabase Dashboard, go to **Project Settings** > **API**.
2. Copy your **Project URL** and **anon public key**.
3. Open `http://localhost:3000` and click the **"Setup Supabase (Demo Mode)"** button in the header.
4. Paste the credentials and click **"Save & Connect Supabase"**.
5. The status badge will change to **🟢 Supabase Connected** and live database synchronization will be active!

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Check backend & Supabase connection health |
| `GET` | `/api/config` | Read public Supabase configuration |
| `POST` | `/api/config` | Update & persist Supabase URL and Anon Key |
| `GET` | `/api/checkpoints` | Fetch verified corridor checkpoints & safe havens |
| `GET` | `/api/profile` | Get current scout reputation, score & badge |
| `GET` | `/api/reports` | Get recent ground-truth intel reports |
| `POST` | `/api/reports` | Submit a new ground-truth intel report (+25 pts) |
| `GET` | `/api/commutes` | Get commute safe route intakes |
| `POST` | `/api/commutes` | Synthesize & store a safe shift commute corridor |
| `POST` | `/api/sos` | Broadcast an Emergency SOS panic alert |
