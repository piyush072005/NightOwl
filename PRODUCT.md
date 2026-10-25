# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

1. **Night-Shift Commuters & Workers (Consumers)**: Healthcare professionals (nurses, hospital staff), night security guards, factory operators, delivery partners, IT/BPO night support personnel, and city sanitation crew commuting during night-time transit lulls (12:00 AM – 5:00 AM).
2. **Community Route Scouts (Providers)**: Vouched on-the-ground contributors who report live road conditions, lighting levels, physical hazards, water logging, construction barriers, and verified open havens.

## Product Purpose

NightShift synthesizes safe, empirically verified night transit corridors. It eliminates nighttime safety uncertainty ("night hallucinations") by combining real-time crowd telemetry, sensor data, and immediate emergency SOS dispatch to police and 24/7 medical facilities.

## Positioning

Unlike conventional navigation engines that optimize purely for travel time or distance, NightShift optimizes for **empirical epistemic safety**—prioritizing illuminated corridors, verified 24/7 commercial havens, and active police patrol presence backed by recent human ground truth.

## Operating Context

- **Time Window**: Late night and early dawn (12:00 AM to 5:00 AM) when public transit frequency drops and isolated underpasses become high-risk.
- **Physical Environment**: Urban transit corridors, connecting underpasses, arterial highways, metro feeder stations, and safe havens (24/7 pharmacies, open clinics, lighted hubs).
- **Interface Workflows**: Dual-mode WhatsApp-style interactive conversational intake (Consumer route planning vs. Scout ground-truth reporting) paired with an operations decision canvas.

## Capabilities and Constraints

- **Epistemic Classification**: Strict categorization of intelligence into `KNOWN` (verified sensor / GPS < 5m), `PROBABLE` (historical patrol / recent report), `OUTDATED` (> 45m signal gap), and `UNKNOWN` (fallback safe anchor).
- **Ground-Truth Intake**: Scout reporting with road condition tags (`safe_light`, `unsafe`, `construction`, `water_logging`), landmark notes, and photo proof verification.
- **Shift Route Synthesizer**: Cohort-aware route synthesis matching departure/arrival times, risk level, and transport mode (cab, bus, two-wheeler, walking).
- **Emergency SOS Dispatch**: Rapid 1-click broadcast relaying real-time GPS telemetry to local police PCR units and emergency clinic networks.
- **Full-Stack Persistence**: Realtime data sync and storage with Supabase (PostgreSQL tables: `scout_reports`, `commute_intakes`, `sos_alerts`, `corridor_checkpoints`, `scout_profiles`, `chat_messages`) with automatic local in-memory fallback.

## Brand Commitments

- **Tone & Identity**: Vigilant, empirical, reassuring, utilitarian, and high-trust. Avoids fear-mongering while never downplaying safety hazards.
- **Palette & Tokens**: Night operational aesthetic—dark navigation slate (`slate-900`/`slate-800`), safety amber (`amber-500`/`amber-600`), WhatsApp conversational emeralds (`wa-teal`, `wa-green`), and clear epistemic badges.

## Evidence on Hand

- Fully functional interactive operations dashboard (`public/index.html`) with WhatsApp conversational assistant.
- Supabase database schema (`supabase/schema.sql`) with real-time websocket publication and 6 relational tables.
- Node.js / Express backend API (`server.js`) serving REST endpoints with dual Supabase and in-memory fallback support.

## Product Principles

1. **Empirical Ground Truth Over Prediction**: Never hallucinate safety status. If a corridor lacks fresh data, mark it explicitly as `PROBABLE` or `UNKNOWN` rather than guessing.
2. **Dual-Sided Accountability**: Incentivize scout telemetry with transparent reputation tracking (+25 pts) and verified photo proof stamps.
3. **Frictionless Emergency Escalation**: Emergency SOS must be triggerable in one tap from any screen, bypassing normal conversational flow to dispatch telemetry immediately.
4. **Resilient Architecture**: Zero-downtime operation—if the cloud database is disconnected or unconfigured, the system gracefully operates in demo mode without crashing.
