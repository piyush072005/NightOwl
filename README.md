# NightOwl — Delhi Safety & Mobility Intelligence Platform

A full-stack, map-aware urban mobility and night-time safety platform for Delhi NCR commuters, healthcare workers, security personnel, and community scouts.

Powered by **Express.js**, **Node.js 22**, **Leaflet & OpenStreetMap**, **OSRM Road Network Routing**, **Delhi Open Transit Data (OTD)**, and **Supabase (PostgreSQL + Realtime)**.

---

## 🌟 Core Platform Capabilities

1. **Interactive Delhi Safety & Mobility Map**:
   - Centered on Delhi NCR (`28.6139° N, 77.2090° E`).
   - OpenStreetMap tile layer with attribution, responsive sizing, and custom category badges.
   - User Geolocation with explicit browser permission prompt and live pulsing beacon.
   - Filterable facility layers:
     - 🚇 **Delhi Metro Stations** (interchanges, last train timetables, CCTV status)
     - 🚌 **Delhi Bus Terminals & Stops** (DTC routes, night frequency, shelters)
     - 🏥 **24/7 Hospitals & Trauma Centers** (AIIMS, Safdarjung, RML, LNJP, Max, Fortis)
     - 💊 **24/7 Verified Pharmacies** (Apollo, MedPlus, Guardian, Wellness Forever)
     - 👮 **Delhi Police Stations & PCR Units** (112 emergency dispatch nodes)
     - ⚡ **EV Fast Charging Superhubs** (Tata Power EZ, Statiq, BluSmart)
     - ⚠️ **Verified Hazard & Caution Zones** (dim underpasses, construction barriers, road diversions)

2. **Safety-Informed Road Route Engine**:
   - Real road-network polyline calculation using OSRM driving & walking profiles with road-corridor fallback.
   - Transparent, multi-signal scoring model (0–100):
     - **Police Proximity Score** (≤1.5 km of patrol nodes)
     - **24/7 Haven Coverage** (open pharmacies and trauma clinics)
     - **Verified Street Illumination** (scout ground-truth reports)
     - **Hazard & Disruption Penalty** (active closures or 50% dimmed underpasses)
   - Alternative Route Comparison:
     - Recommends the **Safety-Informed Route** vs. the **Fastest Route** with clear tradeoffs in time and vigilance.
     - Interactive polyline selection on map and detailed score breakdown matrix.

3. **Map-Aware Conversational Assistant**:
   - Location-aware natural language processing integrated into the WhatsApp interface.
   - Understands route queries (*"Safest route from Noida Sector 62 to Connaught Place"*, *"Walk from Hauz Khas to AIIMS"*).
   - Returns concise explanations, triggers route rendering, places pins, and adjusts map viewport.
   - Answers facility queries (*"Find nearby 24/7 pharmacy"*, *"Show emergency hospitals"*, *"Where is the nearest police station?"*).
   - Safe emergency SOS protocol linking directly to police PCR units and emergency contacts.

4. **Delhi Open Transit Data (OTD) Adapter**:
   - Supports static GTFS schedules, circular routes (TMS, OMS), and metro lines.
   - Configurable live GPS vehicle stream adapter using `DELHI_OTD_API_KEY`.
   - Clear distinction between static and authorized real-time feeds.

---

## 📁 Project Structure

```
NightOwl/
├── .env.example                      # Template for environment variables
├── package.json                      # Dependencies and npm scripts (dev, test, start)
├── server.js                         # Unified Express server & API gateway on port 3000
├── routes/
│   └── geospatialRoutes.js           # REST endpoints for search, nearby, routes, transit & chat
├── services/
│   ├── delhiData.js                  # Curated Delhi NCR landmarks, hospitals, police, metro, pharmacies
│   ├── geocodingService.js           # Fast local matching + OpenStreetMap Nominatim with caching
│   ├── placesService.js              # Haversine spatial radius filtering across categories
│   ├── routingService.js             # OSRM road routing engine + Delhi arterial synthesizer fallback
│   ├── safetyScoringService.js       # Transparent, explainable safety scoring & route comparison
│   ├── transitService.js             # Delhi Open Transit Data (OTD) adapter (static + live feed)
│   └── chatService.js                # Map-aware NLP engine emitting structured map actions
├── public/
│   ├── index.html                    # Dashboard UI with Leaflet map container & WhatsApp simulator
│   └── js/
│       └── app.js                    # Client-side map initialization, layer controls & realtime sync
├── test/
│   └── test_platform.js              # Automated test suite verifying all 13 core capabilities
└── supabase/
    ├── schema.sql                    # SQL script to generate 6 tables, RLS & Realtime triggers
    └── README_SUPABASE_SETUP.md      # Supabase setup guide
```

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
npm run dev
# or: npm start
```
Open **`http://localhost:3000`** in your browser.

### 3. Run Automated Tests
```bash
npm test
```

---

## 🔑 Environment Variables (.env)

| Variable | Description |
|---|---|
| `PORT` | Web server port (defaults to 3000) |
| `DELHI_OTD_API_KEY` | *(Optional)* API key from `otd.delhi.gov.in` for authorized live bus GPS stream |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini API key for advanced generative reasoning |
| `SUPABASE_URL` | *(Optional)* Supabase project URL (in-memory fallback active when empty) |
| `SUPABASE_ANON_KEY` | *(Optional)* Supabase anon public key |
