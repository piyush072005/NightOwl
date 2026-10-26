/**
 * NightOwl Decision Dashboard - Full Stack & Supabase Integration Client
 */

let supabaseClient = null;
let scoutRepScore = 480;
let totalReportsFiled = 128;
let selectedProofImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='100' viewBox='0 0 160 100'><rect width='160' height='100' fill='%231e293b'/><circle cx='80' cy='25' r='14' fill='%23fbbf24' opacity='0.85'/><path d='M0 75 Q40 68 80 72 T160 70 L160 100 L0 100 Z' fill='%23334155'/><line x1='30' y1='55' x2='30' y2='80' stroke='%2394a3b8' stroke-width='3'/><circle cx='30' cy='52' r='4' fill='%23fef08a'/><line x1='130' y1='52' x2='130' y2='80' stroke='%2394a3b8' stroke-width='3'/><circle cx='130' cy='49' r='4' fill='%23fef08a'/><text x='10' y='92' fill='%23e2e8f0' font-size='9' font-family='sans-serif'>CAM-REC 02:30 AM</text></svg>";

const timelineData = [
  {
    time: "12:00 AM",
    eta: "12:38 AM (38 mins)",
    badge: "KNOWN • ACTIVE REGULAR TRANSIT",
    title: "Mid-Shift High Frequency Route",
    desc: "Subway lines and major feeder buses are still active with short waiting times. Streetlights operate at 100% capacity.",
    risk: "Minimal Risk",
    riskClass: "text-emerald-700",
    weather: "Clear, Mild (17°C)",
    transport: "Metro + Bus Active",
    emergency: "5 Clinics Open",
    radarTag: "KNOWN",
    lightPercent: "95%",
    lightText: "95% Fully Lit Mainways",
    kpiLighting: "95% Lit",
    kpiEpistemic: "KNOWN"
  },
  {
    time: "01:30 AM",
    eta: "02:14 AM (44 mins)",
    badge: "KNOWN • MODERATE WATCH",
    title: "Transition Window Transit Corridor",
    desc: "Metro operations closing. Shared shuttles and last feeder loop available along main avenue. Patrol frequency normal.",
    risk: "Low Risk",
    riskClass: "text-emerald-700",
    weather: "Clear, Cool (15°C)",
    transport: "Feeder Loop Active",
    emergency: "3 Clinics Open",
    radarTag: "KNOWN",
    lightPercent: "75%",
    lightText: "75% Well-Lit",
    kpiLighting: "88% Lit",
    kpiEpistemic: "KNOWN"
  },
  {
    time: "02:30 AM",
    eta: "03:02 AM (47 mins)",
    badge: "KNOWN • SECURE PLAN ACTIVE",
    title: "Optimized 02:15 AM Transit & Safety Route",
    desc: "Public transit frequency is minimal at this hour. The engine has synthesized a well-lit route avoiding isolated underpasses, leveraging 24/7 patrol checkpoints and active open pharmacies along the corridor.",
    risk: "Low (Patrolled)",
    riskClass: "text-emerald-700",
    weather: "Clear, Dry (14°C)",
    transport: "2 Cabs Nearby",
    emergency: "2 Open Clinics",
    radarTag: "PROBABLE",
    lightPercent: "50%",
    lightText: "50% Dim (Backup Power)",
    kpiLighting: "84% Lit",
    kpiEpistemic: "KNOWN"
  },
  {
    time: "03:45 AM",
    eta: "04:37 AM (52 mins)",
    badge: "PROBABLE • ELEVATED CAUTION",
    title: "Night Transit Lull Escorted Pathway",
    desc: "Peak quiet hour with reduced cab availability. Walking via illuminated arterial corridor advised; patrol van station nearby.",
    risk: "Moderate (Stick to Path)",
    riskClass: "text-amber-700",
    weather: "Slight Fog (13°C)",
    transport: "1 Cab on Demand",
    emergency: "2 Clinics Open",
    radarTag: "PROBABLE",
    lightPercent: "40%",
    lightText: "40% Main St. Active",
    kpiLighting: "76% Lit",
    kpiEpistemic: "PROBABLE"
  },
  {
    time: "05:00 AM",
    eta: "05:32 AM (32 mins)",
    badge: "KNOWN • DAWN TRANSIT RESUMPTION",
    title: "Early Dawn Rapid Connect Route",
    desc: "First morning municipal buses commence service. Street vendors active and daylight commencement reduces route isolation.",
    risk: "Low Risk",
    riskClass: "text-emerald-700",
    weather: "Brisk, Dawn (14°C)",
    transport: "Early Morning Buses",
    emergency: "All Hospitals Open",
    radarTag: "KNOWN",
    lightPercent: "100%",
    lightText: "100% Daybreak / Full Light",
    kpiLighting: "98% Lit",
    kpiEpistemic: "KNOWN"
  }
];

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, isAlert = false) {
  const toast = document.getElementById('live-toast');
  const toastText = document.getElementById('toast-text');
  if (!toast || !toastText) return;

  toastText.innerHTML = message;
  toast.className = `fixed top-16 right-5 z-50 transform transition-all duration-300 translate-y-0 opacity-100 ${isAlert ? 'bg-rose-900 border-rose-500' : 'bg-slate-900 border-slate-700'
    } text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border flex items-center gap-2`;

  setTimeout(() => {
    toast.className = 'fixed top-16 right-5 z-50 transform transition-all duration-300 translate-y-[-20px] opacity-0 pointer-events-none bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2';
  }, 4000);
}

// ==========================================
// SUPABASE CLIENT INITIALIZATION & STATUS
// ==========================================
async function initSupabaseClient() {
  try {
    const configRes = await fetch('/api/config');
    const { supabaseUrl, supabaseAnonKey } = await configRes.json();

    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http') && !supabaseUrl.includes('your-project-id')) {
      if (window.supabase) {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase Browser Client Connected:', supabaseUrl);
        updateSupabaseUIStatus(true, supabaseUrl);
        setupRealtimeSubscriptions();
        return;
      }
    }
    updateSupabaseUIStatus(false);
  } catch (err) {
    console.warn('Supabase config check error:', err);
    updateSupabaseUIStatus(false);
  }
}

function updateSupabaseUIStatus(isConnected, url = '') {
  const dot = document.getElementById('supabase-status-dot');
  const text = document.getElementById('supabase-status-text');
  const btn = document.getElementById('supabase-status-btn');

  const modalDot = document.getElementById('modal-status-dot');
  const modalTitle = document.getElementById('modal-status-title');
  const modalDesc = document.getElementById('modal-status-desc');

  if (isConnected) {
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    if (text) text.textContent = 'Supabase Connected';
    if (btn) btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-2xs cursor-pointer active:scale-95 bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100';

    if (modalDot) modalDot.className = 'w-3 h-3 rounded-full bg-emerald-500';
    if (modalTitle) modalTitle.textContent = 'Supabase Database Online & Connected';
    if (modalDesc) modalDesc.textContent = `Connected to ${url} with live WebSocket Realtime enabled`;
  } else {
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-500 ';
    if (text) text.textContent = 'Setup Supabase (Demo Mode)';
    if (btn) btn.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-2xs cursor-pointer active:scale-95 bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100';

    if (modalDot) modalDot.className = 'w-3 h-3 rounded-full bg-amber-500';
    if (modalTitle) modalTitle.textContent = 'Running in Local Demo Mode';
    if (modalDesc) modalDesc.textContent = 'Enter your Supabase credentials below to connect to a live database.';
  }
}

// Setup Supabase Realtime Channels
function setupRealtimeSubscriptions() {
  if (!supabaseClient) return;

  const channel = supabaseClient.channel('NightOwl-live-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scout_reports' }, payload => {
      console.log('⚡ Realtime Scout Report received:', payload.new);
      showToast(`⚡ <strong>New Scout Report:</strong> ${payload.new.condition_title} by ${payload.new.scout_name}`);
      appendScoutReportToFeed(payload.new, true);
      totalReportsFiled += 1;
      updateMetricsUI();
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_alerts' }, payload => {
      console.log('🚨 Realtime SOS Alert received:', payload.new);
      showToast(`🚨 <strong>EMERGENCY SOS:</strong> ${payload.new.location_name} - Dispatched to ${payload.new.assigned_police_unit}`, true);
    })
    .subscribe((status) => {
      console.log('Supabase Realtime subscription status:', status);
    });
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadInitialData() {
  // Load Checkpoints
  try {
    const res = await fetch('/api/checkpoints');
    const checkpoints = await res.json();
    renderCheckpointsTable(checkpoints);
  } catch (e) {
    console.warn('Failed loading checkpoints:', e);
  }

  // Load Profile & Rep Score
  try {
    const res = await fetch('/api/profile');
    const profile = await res.json();
    if (profile) {
      scoutRepScore = profile.rep_score || 480;
      totalReportsFiled = profile.reports_filed || 128;
      updateMetricsUI();
      if (document.getElementById('header-scout-title')) {
        document.getElementById('header-scout-title').textContent = profile.scout_name;
      }
      if (document.getElementById('sidebar-badge-title')) {
        document.getElementById('sidebar-badge-title').textContent = profile.badge_title || 'Verified Night Pioneer';
      }
    }
  } catch (e) {
    console.warn('Failed loading profile:', e);
  }

  // Load Recent Reports
  try {
    const res = await fetch('/api/reports');
    const reports = await res.json();
    renderReportsList(reports);
  } catch (e) {
    console.warn('Failed loading reports:', e);
  }
}

function renderCheckpointsTable(checkpoints) {
  const tbody = document.getElementById('checkpoints-tbody');
  if (!tbody || !checkpoints || !checkpoints.length) return;

  tbody.innerHTML = checkpoints.map(cp => `
    <tr class="hover:bg-slate-50/80">
      <td class="py-2.5 px-3.5 font-bold text-slate-900">${cp.node_name}</td>
      <td class="py-2.5 px-3.5 text-slate-500">${cp.node_type}</td>
      <td class="py-2.5 px-3.5">
        <span class="${cp.lighting_percent.includes('100%') || cp.lighting_percent.includes('90%') ? 'text-emerald-800' : 'text-amber-800'} font-bold">
          ${cp.lighting_percent}
        </span>
      </td>
      <td class="py-2.5 px-3.5 text-slate-700">${cp.community_vouch}</td>
      <td class="py-2.5 px-3.5 text-right">
        <span class="px-2 py-0.5 rounded-md text-xs font-bold ${cp.epistemic_status === 'KNOWN' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
    } border">${cp.epistemic_status}</span>
      </td>
    </tr>
  `).join('');

  const countBadge = document.getElementById('checkpoint-count-badge');
  if (countBadge) countBadge.textContent = `${checkpoints.length} Verified Checkpoints`;
}

function renderReportsList(reports) {
  const container = document.getElementById('scout-reports-list');
  if (!container) return;

  if (!reports || reports.length === 0) {
    container.innerHTML = '<div class="text-xs text-slate-500 py-3 text-center">No reports filed tonight yet.</div>';
    return;
  }

  container.innerHTML = '';
  reports.slice(0, 10).forEach(r => appendScoutReportToFeed(r, false));
}

function appendScoutReportToFeed(report, prepend = true) {
  const container = document.getElementById('scout-reports-list');
  if (!container) return;

  const timeFormatted = report.created_at ? new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';

  let conditionBadge = '';
  if (report.road_condition === 'safe_light') {
    conditionBadge = '<span class="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-bold">Safe & Lit</span>';
  } else if (report.road_condition === 'unsafe') {
    conditionBadge = '<span class="text-xs bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-md font-bold">Unsafe Hazard</span>';
  } else if (report.road_condition === 'construction') {
    conditionBadge = '<span class="text-xs bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md font-bold">Construction</span>';
  } else {
    conditionBadge = '<span class="text-xs bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-md font-bold">Water Logging</span>';
  }

  const item = document.createElement('div');
  item.className = 'py-2.5 flex items-start justify-between gap-2.5 text-xs';
  item.innerHTML = `
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        <span class="font-bold text-slate-900">${report.scout_name || 'Scout'}</span>
        ${conditionBadge}
        <span class="text-xs text-slate-500 font-mono">${timeFormatted}</span>
      </div>
      <div class="text-slate-700 text-xs leading-normal">${report.condition_title}</div>
      ${report.landmark_note ? `<div class="text-xs text-slate-500 italic">"${report.landmark_note}"</div>` : ''}
    </div>
    <span class="px-2 py-0.5 rounded-md text-xs font-bold ${report.epistemic_status === 'KNOWN' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
    } border">${report.epistemic_status || 'KNOWN'}</span>
  `;

  if (prepend && container.firstChild) {
    container.insertBefore(item, container.firstChild);
  } else {
    container.appendChild(item);
  }
}

function updateMetricsUI() {
  const repEl = document.getElementById('header-scout-rep');
  if (repEl) repEl.textContent = `Scout Hub • Rep ${scoutRepScore} pts (Level 3)`;

  const kpiReports = document.getElementById('kpi-intel-reports');
  if (kpiReports) kpiReports.textContent = `${totalReportsFiled} Reports`;

  const sideRepCount = document.getElementById('sidebar-report-count');
  if (sideRepCount) sideRepCount.textContent = `${totalReportsFiled} tonight`;

  const kpiSub = document.getElementById('kpi-reports-sub');
  if (kpiSub) kpiSub.textContent = `${totalReportsFiled} Synced with DB`;
}

// ==========================================
// SIMULATED HOUR PROGRESSION
// ==========================================
function setSimulatedHour(timeStr, index) {
  const data = timelineData[index];
  document.getElementById('live-night-clock').textContent = data.time;
  document.getElementById('timeline-current-hour').textContent = data.time;
  document.getElementById('badge-status').textContent = data.badge;
  document.getElementById('plan-title').textContent = data.title;
  document.getElementById('plan-eta').innerHTML = data.eta;
  document.getElementById('plan-description').textContent = data.desc;

  document.getElementById('metric-risk').innerHTML = `<i class="fa-solid fa-shield ${data.riskClass}"></i> ${data.risk}`;
  document.getElementById('metric-weather').innerHTML = `<i class="fa-solid fa-cloud-moon text-sky-600"></i> ${data.weather}`;
  document.getElementById('metric-transport').innerHTML = `<i class="fa-solid fa-taxi text-amber-800"></i> ${data.transport}`;
  document.getElementById('metric-emergency').innerHTML = `<i class="fa-solid fa-hospital text-purple-600"></i> ${data.emergency}`;

  document.getElementById('radar-tag').textContent = data.radarTag;
  document.getElementById('light-status-text').textContent = data.lightText;
  document.getElementById('lighting-bar').style.width = data.lightPercent;

  document.getElementById('kpi-lighting').textContent = data.kpiLighting;
  document.getElementById('kpi-epistemic').textContent = data.kpiEpistemic;

  const buttons = document.querySelectorAll('.timeline-step');
  buttons.forEach((btn, idx) => {
    if (idx === index) {
      btn.className = "timeline-step active-timeline bg-amber-500 text-slate-950 font-bold border-2 border-amber-600 py-2 px-1 rounded-lg text-center shadow-2xs transition cursor-pointer";
      btn.querySelector('span:first-child').className = "block text-xs font-mono font-bold text-slate-950";
      btn.querySelector('span:last-child').className = "block text-xs text-slate-900 font-semibold mt-0.5";
    } else {
      btn.className = "timeline-step bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2 px-1 rounded-lg text-center transition cursor-pointer";
      btn.querySelector('span:first-child').className = "block text-xs font-mono font-semibold text-slate-700";
      btn.querySelector('span:last-child').className = "block text-xs text-slate-500 mt-0.5";
    }
  });
}

async function refreshCheckpoints() {
  const ping = document.getElementById('ping-text');
  if (ping) ping.textContent = "Sensor ping: Just now";

  const radarTag = document.getElementById('radar-tag');
  if (radarTag) {
    radarTag.classList.remove('telemetry-beacon');
    void radarTag.offsetWidth;
    radarTag.classList.add('telemetry-beacon');
  }

  await loadInitialData();
  showToast("Checkpoints and havens re-synchronized from database.");
}

// ==========================================
// EMERGENCY SOS (SUPABASE SYNC)
// ==========================================
function triggerEmergencySOS() {
  document.getElementById('sos-modal').classList.remove('hidden');
}

function closeSOSModal() {
  document.getElementById('sos-modal').classList.add('hidden');
}

async function confirmSOSCall() {
  closeSOSModal();

  try {
    const res = await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_identifier: 'Commuter #' + Math.floor(1000 + Math.random() * 9000),
        location_name: 'Sector 62 Tech Park Transit Corridor',
        geo_lat: 28.629200,
        geo_lng: 77.369800,
        assigned_police_unit: 'Police PCR #4 (0.3 km away)',
        emergency_dispatch_type: '112 / 100 Initiated'
      })
    });
    const data = await res.json();
    console.log('SOS Broadcast stored:', data);
    showToast("🚨 Emergency SOS recorded to Supabase & broadcasted to PCR #4!", true);
  } catch (err) {
    console.warn('SOS broadcast API error:', err);
  }

  sendBotMessage("⚠️ <strong class='text-rose-700'>EMERGENCY SOS BROADCAST CONFIRMED:</strong> Live GPS coordinates dispatched to Police PCR #4 (0.3 km away) and Emergency Hubs (Recorded in Supabase Table <code>sos_alerts</code>).");
}

// ==========================================
// WHATSAPP CHAT FLOW & INTEL SUBMISSIONS
// ==========================================
function getCurrentTimeStr() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

function handleSendButtonClick() {
  const input = document.getElementById('whatsapp-input');
  const text = input.value.trim();
  if (text) {
    sendChatMessage(text);
    input.value = '';
  }
}

function sendUserBubble(text) {
  const container = document.getElementById('chat-messages-container');
  const time = getCurrentTimeStr();
  const userMsg = document.createElement('div');
  userMsg.className = "flex flex-col items-end animate-message-enter";
  userMsg.innerHTML = `
    <div class="bg-[#d9fdd3] text-slate-800 text-xs rounded-xl rounded-tr-xs px-3 py-2 max-w-[85%] shadow-2xs border border-emerald-200/70">
      <div class="font-normal leading-relaxed text-slate-800">${text}</div>
      <div class="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500 font-mono">
        <span>${time}</span>
        <i class="fa-solid fa-check-double text-sky-600 text-xs"></i>
      </div>
    </div>
  `;
  container.appendChild(userMsg);
  container.scrollTop = container.scrollHeight;
}

function sendChatMessage(text) {
  sendUserBubble(text);
  setTimeout(() => {
    processBotResponse(text);
  }, 600);
}

function handleQuickReply(actionText) {
  sendChatMessage(actionText);
}

function simulateShareLiveLocation() {
  sendChatMessage("📍 Shared live GPS coordinate: Sector 62 Main Crossing (Active for 60m)");
}

function sendBotMessage(htmlContent, isCard = false, customTag = "KNOWN") {
  const container = document.getElementById('chat-messages-container');
  const time = getCurrentTimeStr();
  const botMsg = document.createElement('div');
  botMsg.className = "flex flex-col items-start w-full animate-message-enter";

  botMsg.innerHTML = `
    <div class="bg-white text-slate-900 text-xs rounded-xl rounded-tl-xs p-3.5 max-w-[95%] shadow-xs  space-y-2">
      <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <span class="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
          <i class="fa-solid fa-shield-halved text-emerald-700"></i> NightOwl Engine
        </span>
        <span class="px-2 py-0.5 rounded-md text-xs font-bold ${customTag === 'KNOWN' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : (customTag === 'PROBABLE' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300')
    } border">${customTag}</span>
      </div>
      <div class="text-slate-800 leading-normal text-xs">${htmlContent}</div>
      <div class="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500 font-mono">
        <span>${time}</span>
      </div>
    </div>
  `;
  container.appendChild(botMsg);
  container.scrollTop = container.scrollHeight;
}

function selectChatRole(role) {
  if (role === 'consumer') {
    sendUserBubble("I'm joining as a Consumer");
    setTimeout(() => {
      const container = document.getElementById('chat-messages-container');
      const time = getCurrentTimeStr();
      const botMsg = document.createElement('div');
      botMsg.className = "flex flex-col items-start w-full animate-message-enter";
      botMsg.innerHTML = `
        <div class="bg-white text-slate-900 text-xs rounded-xl rounded-tl-xs p-4 max-w-[96%] w-full shadow-xs  space-y-2.5">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span class="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
              <i class="fa-solid fa-shield-halved text-emerald-700"></i> NightOwl Engine
            </span>
            <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">INTAKE</span>
          </div>
          <p class="text-slate-700 leading-normal text-xs">
            Great! Let's configure your safe shift commute. Please share your shift details:
          </p>
          <div class="bg-slate-50 p-3 space-y-2.5 font-sans" id="chat-intake-card">
            <div>
              <label class="block text-xs font-bold text-slate-800 uppercase mb-1">Worker Cohort</label>
              <select id="inchat-worker-role" class="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600">
                <option value="Hospital Nurse">Hospital Nurse / Healthcare</option>
                <option value="Security Guard">Night Security Guard</option>
                <option value="Factory Operator">Factory Shift Operator</option>
                <option value="Delivery Partner">Delivery Partner</option>
                <option value="IT BPO Professional">IT Support / BPO Commuter</option>
                <option value="Sanitation Crew">City Sanitation Crew</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold text-slate-800 uppercase mb-1">Shift End</label>
                <input type="time" id="inchat-shift-end" value="02:15" class="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono font-medium focus:ring-1 focus:ring-emerald-600">
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-800 uppercase mb-1">Target Arrival</label>
                <input type="time" id="inchat-shift-arr" value="03:00" class="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-mono font-medium focus:ring-1 focus:ring-emerald-600">
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-800 uppercase mb-1">Route Corridor</label>
              <div class="relative">
                <span class="absolute left-2.5 top-2 text-xs text-amber-800"><i class="fa-solid fa-location-dot"></i></span>
                <input type="text" id="inchat-start-loc" value="Sector 62 Tech Park" placeholder="Start Hub" class="w-full bg-white border border-slate-300 rounded pl-7 pr-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-emerald-600">
              </div>
              <div class="relative">
                <span class="absolute left-2.5 top-2 text-xs text-emerald-800"><i class="fa-solid fa-route"></i></span>
                <input type="text" id="inchat-end-loc" value="Block C Residential" placeholder="Destination" class="w-full bg-white border border-slate-300 rounded pl-7 pr-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-emerald-600">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-800 uppercase mb-1">Transport Mode</label>
              <select id="inchat-transport-mode" class="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600">
                <option value="Cab / Auto">Last-Mile Cab / Auto</option>
                <option value="Night Bus">Night Feeder Bus</option>
                <option value="Two-Wheeler">Two-Wheeler / Scooter</option>
                <option value="Walking">Walking (Illuminated Nodes Only)</option>
              </select>
            </div>
            <button onclick="handleInChatCommuteSubmit()" type="button" class="w-full bg-[#0d6357] hover:bg-[#06443c] text-white font-bold py-2 px-3 rounded shadow-xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-95">
              <i class="fa-solid fa-compass text-xs"></i> Compute & Synthesize Safe Route (Syncs to DB)
            </button>
          </div>
          <div class="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500 font-mono">
            <span>${time}</span>
          </div>
        </div>
      `;
      container.appendChild(botMsg);
      container.scrollTop = container.scrollHeight;
    }, 500);
  } else if (role === 'provider') {
    sendUserBubble("I'm joining as a Provider (Route Scout)");
    setTimeout(() => {
      const container = document.getElementById('chat-messages-container');
      const time = getCurrentTimeStr();
      const botMsg = document.createElement('div');
      botMsg.className = "flex flex-col items-start w-full animate-message-enter";
      botMsg.innerHTML = `
        <div class="bg-white text-slate-900 text-xs rounded-xl rounded-tl-xs p-4 max-w-[98%] w-full shadow-xs  space-y-3">
          <div class="flex items-center justify-between pb-1.5 border-b border-amber-100">
            <span class="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
              <i class="fa-solid fa-shield-halved text-amber-700"></i> Route Scout Ground Truth Report
            </span>
            <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">TELEMETRY INTAKE</span>
          </div>
          <p class="text-slate-700 leading-normal text-xs">
            Select the real-time road condition on your corridor section to anchor live commuter safety:
          </p>
          <div class="space-y-2 text-xs" id="road-condition-options">
            <label class="flex items-center p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer transition">
              <input type="radio" name="road_condition" value="safe_light" checked class="text-emerald-700 focus:ring-emerald-600 h-4 w-4 border-slate-300">
              <div class="ml-2.5 flex items-center gap-2 flex-grow">
                <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs flex-shrink-0">
                  <i class="fa-solid fa-lightbulb"></i>
                </span>
                <span class="font-bold text-slate-900 text-xs">Road is safe and proper lighting</span>
              </div>
              <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 ml-1">Safe</span>
            </label>

            <label class="flex items-center p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-400 cursor-pointer transition">
              <input type="radio" name="road_condition" value="unsafe" class="text-rose-700 focus:ring-rose-600 h-4 w-4 border-slate-300">
              <div class="ml-2.5 flex items-center gap-2 flex-grow">
                <span class="w-6 h-6 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-xs flex-shrink-0">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                </span>
                <span class="font-bold text-slate-900 text-xs">Road is unsafe</span>
              </div>
              <span class="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 ml-1">Hazard</span>
            </label>

            <label class="flex items-center p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-400 cursor-pointer transition">
              <input type="radio" name="road_condition" value="construction" class="text-amber-700 focus:ring-amber-600 h-4 w-4 border-slate-300">
              <div class="ml-2.5 flex items-center gap-2 flex-grow">
                <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs flex-shrink-0">
                  <i class="fa-solid fa-person-digging"></i>
                </span>
                <span class="font-bold text-slate-900 text-xs">Road is under Construction</span>
              </div>
              <span class="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 ml-1">Barrier</span>
            </label>

            <label class="flex items-center p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-400 cursor-pointer transition">
              <input type="radio" name="road_condition" value="water_logging" class="text-sky-700 focus:ring-sky-600 h-4 w-4 border-slate-300">
              <div class="ml-2.5 flex items-center gap-2 flex-grow">
                <span class="w-6 h-6 rounded-full bg-sky-100 text-sky-900 flex items-center justify-center text-xs flex-shrink-0">
                  <i class="fa-solid fa-water"></i>
                </span>
                <span class="font-bold text-slate-900 text-xs">Water logging</span>
              </div>
              <span class="text-xs font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-300 ml-1">Flood</span>
            </label>
          </div>

          <!-- Photo Proof Submission Section -->
          <div class="bg-slate-50 p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <i class="fa-solid fa-camera text-emerald-700"></i> Submit a photo as proof
              </span>
              <span class="text-xs text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">Required Proof</span>
            </div>

            <div class="border-2 border-dashed border-slate-300 rounded-lg p-2.5 bg-white flex flex-col items-center justify-center text-center gap-2 hover:border-emerald-600 transition cursor-pointer relative" onclick="triggerMockPhotoCycle()">
              <div class="flex items-center gap-3 w-full">
                <div class="w-14 h-12 rounded border border-slate-200 overflow-hidden bg-slate-900 flex-shrink-0 relative group shadow-2xs">
                  <img id="scout-preview-img" src="${selectedProofImage}" class="w-full h-full object-cover" alt="Proof Preview">
                  <span class="absolute bottom-0 inset-x-0 bg-slate-950/80 text-xs text-white text-center font-mono py-0.5">REC 02:30</span>
                </div>
                <div class="text-left flex-grow">
                  <div class="text-xs font-bold text-slate-900 flex items-center gap-1" id="scout-preview-title">
                    <i class="fa-solid fa-circle-check text-emerald-700 text-xs"></i> photo_proof_corridor_cam02.jpg
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Geo-stamp: 28.629° N, 77.369° E</span>
                    <span class="text-emerald-800 font-bold cursor-pointer underline hover:text-emerald-900">Tap to cycle snapshot</span>
                  </div>
                </div>
                <button type="button" class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-md text-xs border border-slate-200 flex-shrink-0" title="Snap live camera">
                  <i class="fa-solid fa-camera-rotate text-slate-700"></i>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Optional Landmark Note</label>
              <input type="text" id="scout-optional-note" placeholder="e.g. Near Bypass East ramp pole #14, streetlamps operating at 100%" class="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600">
            </div>
          </div>

          <button onclick="handleProviderGroundTruthSubmit()" type="button" class="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 px-3 rounded-lg shadow-xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-95">
            <i class="fa-solid fa-bolt text-amber-200"></i> Submit Ground-Truth Intel to Supabase (+25 pts)
          </button>

          <div class="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500 font-mono">
            <span>${time}</span>
          </div>
        </div>
      `;
      container.appendChild(botMsg);
      container.scrollTop = container.scrollHeight;
    }, 500);
  }
}

function triggerMockPhotoCycle() {
  const samples = [
    {
      name: "photo_proof_corridor_cam02.jpg",
      svg: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='100' viewBox='0 0 160 100'><rect width='160' height='100' fill='%231e293b'/><circle cx='80' cy='25' r='14' fill='%23fbbf24' opacity='0.85'/><path d='M0 75 Q40 68 80 72 T160 70 L160 100 L0 100 Z' fill='%23334155'/><line x1='30' y1='55' x2='30' y2='80' stroke='%2394a3b8' stroke-width='3'/><circle cx='30' cy='52' r='4' fill='%23fef08a'/><line x1='130' y1='52' x2='130' y2='80' stroke='%2394a3b8' stroke-width='3'/><circle cx='130' cy='49' r='4' fill='%23fef08a'/><text x='10' y='92' fill='%23e2e8f0' font-size='9' font-family='sans-serif'>CAM-REC 02:30 AM</text></svg>"
    },
    {
      name: "live_snap_bypass_underpass.jpg",
      svg: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='100' viewBox='0 0 160 100'><rect width='160' height='100' fill='%230f172a'/><rect x='15' y='30' width='130' height='50' rx='6' fill='%231e293b' stroke='%23f59e0b' stroke-width='2'/><path d='M25 65 L45 35 L55 35 L35 65 Z' fill='%23f59e0b'/><path d='M65 65 L85 35 L95 35 L75 65 Z' fill='%23f59e0b'/><path d='M105 65 L125 35 L135 35 L115 65 Z' fill='%23f59e0b'/><text x='15' y='92' fill='%23fbbf24' font-size='9' font-family='sans-serif'>BARRIER SENSOR ACTIVE</text></svg>"
    },
    {
      name: "street_lighting_checkpoint_b.jpg",
      svg: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='100' viewBox='0 0 160 100'><rect width='160' height='100' fill='%23022c22'/><circle cx='80' cy='40' r='26' fill='%2334d399' opacity='0.3'/><circle cx='80' cy='40' r='14' fill='%236ee7b7' opacity='0.85'/><path d='M10 85 L150 85' stroke='%2310b981' stroke-width='4'/><text x='12' y='94' fill='%23a7f3d0' font-size='9' font-family='sans-serif'>ILLUMINATION 94%</text></svg>"
    }
  ];
  const currentImg = document.getElementById('scout-preview-img');
  const currentTitle = document.getElementById('scout-preview-title');
  const nextIdx = (samples.findIndex(s => s.name === (currentTitle ? currentTitle.textContent.trim().replace(/^.*photo/, 'photo') : '')) + 1) % samples.length;
  const chosen = samples[nextIdx];
  if (currentImg) currentImg.src = chosen.svg;
  if (currentTitle) currentTitle.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-800 text-xs"></i> ${chosen.name}`;
  selectedProofImage = chosen.svg;
}

// SUBMIT GROUND TRUTH REPORT (POST TO SUPABASE & API)
async function handleProviderGroundTruthSubmit() {
  const radios = document.getElementsByName('road_condition');
  let selectedCondition = 'safe_light';
  for (const r of radios) {
    if (r.checked) {
      selectedCondition = r.value;
      break;
    }
  }
  const note = (document.getElementById('scout-optional-note') && document.getElementById('scout-optional-note').value.trim()) || 'Bypass East Arterial Segment #12';

  let conditionBadge = "";
  let conditionText = "";
  let impactDesc = "";

  if (selectedCondition === 'safe_light') {
    conditionText = "Road is safe and proper lighting";
    conditionBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><i class="fa-solid fa-lightbulb"></i> Road Safe & Proper Lighting</span>`;
    impactDesc = "Corridor lighting raised to 92%. Active patrolled lane verified.";
  } else if (selectedCondition === 'unsafe') {
    conditionText = "Road is unsafe";
    conditionBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300"><i class="fa-solid fa-triangle-exclamation"></i> Road is Unsafe</span>`;
    impactDesc = "Caution alert pushed to active commuters. Direct escort waypoint active.";
  } else if (selectedCondition === 'construction') {
    conditionText = "Road is under Construction";
    conditionBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"><i class="fa-solid fa-person-digging"></i> Road Under Construction</span>`;
    impactDesc = "Arterial detour via Central Square engaged. Avoid pedestrian lane.";
  } else {
    conditionText = "Water logging";
    conditionBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300"><i class="fa-solid fa-water"></i> Water Logging Hazard</span>`;
    impactDesc = "Surface water warning broadcasted. Two-wheelers advised to take elevated flyover.";
  }

  // Display user bubble in WhatsApp chat
  const container = document.getElementById('chat-messages-container');
  const time = getCurrentTimeStr();
  const userMsg = document.createElement('div');
  userMsg.className = "flex flex-col items-end w-full animate-message-enter";
  userMsg.innerHTML = `
    <div class="bg-[#d9fdd3] text-slate-800 text-xs rounded-xl rounded-tr-xs p-3 max-w-[88%] shadow-2xs border border-emerald-200/80 space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wide">Route Observation Filed</span>
        ${conditionBadge}
      </div>
      <div class="text-[11.5px] font-semibold text-slate-900">${conditionText}</div>
      <div class="bg-white/80 p-2 flex items-center gap-2.5">
        <div class="w-16 h-12 rounded border border-slate-300 overflow-hidden bg-slate-900 flex-shrink-0 shadow-2xs">
          <img src="${selectedProofImage}" class="w-full h-full object-cover" alt="Attached Proof">
        </div>
        <div class="text-left text-[10.5px]">
          <div class="font-bold text-slate-800">📸 Photo Proof Attached</div>
          <div class="text-slate-500 text-xs font-mono mt-0.5">Note: "${note}"</div>
        </div>
      </div>
      <div class="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500 font-mono">
        <span>${time}</span>
        <i class="fa-solid fa-check-double text-sky-600 text-xs"></i>
      </div>
    </div>
  `;
  container.appendChild(userMsg);
  container.scrollTop = container.scrollHeight;

  // Send to Full Stack API / Supabase Database
  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scout_name: 'Community Route Scout',
        road_condition: selectedCondition,
        condition_title: conditionText,
        landmark_note: note,
        photo_url: selectedProofImage,
        rep_points_awarded: 25,
        epistemic_status: selectedCondition === 'safe_light' ? 'KNOWN' : 'PROBABLE',
        impact_desc: impactDesc
      })
    });
    const result = await response.json();
    console.log('Report saved:', result);

    scoutRepScore += 25;
    totalReportsFiled += 1;
    updateMetricsUI();
    showToast(`✅ Intel saved to Supabase (Table: <code>scout_reports</code>) +25 pts!`);
  } catch (e) {
    console.warn('Error saving report to API:', e);
  }

  // Ack
  setTimeout(() => {
    const time2 = getCurrentTimeStr();
    const botMsg = document.createElement('div');
    botMsg.className = "flex flex-col items-start w-full space-y-2 animate-message-enter";
    botMsg.innerHTML = `
      <div class="bg-white text-slate-900 text-xs rounded-xl rounded-tl-xs p-4 max-w-[96%] w-full shadow-xs  space-y-2.5">
        <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <span class="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
            <i class="fa-solid fa-shield-halved text-emerald-700"></i> NightOwl Engine
          </span>
          <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">KNOWN • STORED IN SUPABASE</span>
        </div>

        <div class="space-y-1">
          <p class="text-slate-900 text-xs font-bold flex items-center gap-1.5">
            <i class="fa-solid fa-circle-check text-emerald-700"></i> Photo proof verified & telemetry broadcasted!
          </p>
          <p class="text-xs text-slate-700 leading-relaxed">
            Your ground-truth report has anchored the live safety graph for <strong>1,428 active night commuters</strong>. ${impactDesc}
          </p>
        </div>

        <div class="bg-emerald-50 p-3 text-xs space-y-1.5">
          <div class="flex justify-between items-center">
            <span class="text-emerald-950 font-semibold">Epistemic Status:</span>
            <span class="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">[KNOWN] DB Ground Truth</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-emerald-950 font-semibold">Reputation Awarded:</span>
            <span class="font-bold text-amber-900 flex items-center gap-1"><i class="fa-solid fa-trophy text-amber-800"></i> +25 Scout Points</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-emerald-950 font-semibold">Total Scout Rep:</span>
            <span class="font-mono font-bold text-slate-900">${scoutRepScore} pts (Rank #4)</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500 font-mono">
          <span>${time2}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-1.5 pt-0.5 max-w-[96%]">
        <button class="bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold transition shadow-xs flex items-center gap-1 cursor-pointer" onclick="selectChatRole('provider')">
          <i class="fa-solid fa-plus text-amber-700 text-xs"></i> Log Another Spot
        </button>
        <button class="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-full text-xs font-semibold transition shadow-xs flex items-center gap-1 cursor-pointer" onclick="selectChatRole('consumer')">
          <i class="fa-solid fa-route text-sky-700 text-xs"></i> View Safe Corridor
        </button>
      </div>
    `;
    container.appendChild(botMsg);
    container.scrollTop = container.scrollHeight;
  }, 600);
}

// SUBMIT COMMUTE INTAKE (POST TO SUPABASE & API)
async function handleInChatCommuteSubmit() {
  const role = document.getElementById('inchat-worker-role').value;
  const startLoc = document.getElementById('inchat-start-loc').value || 'Sector 62 Tech Park';
  const endLoc = document.getElementById('inchat-end-loc').value || 'Block C';
  const endVal = document.getElementById('inchat-shift-end').value || '02:15';
  const arrVal = document.getElementById('inchat-shift-arr').value || '03:00';
  const mode = document.getElementById('inchat-transport-mode').value;

  sendUserBubble(`Heading home from <strong>${startLoc}</strong> to <strong>${endLoc}</strong> at ${endVal} (${mode}).`);

  // Update central dashboard plan
  const badge = document.getElementById('badge-status');
  badge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300";
  badge.textContent = "KNOWN • OPTIMIZED CORRIDOR ACTIVE";

  document.getElementById('plan-title').textContent = `${endVal} Shift Departure: ${startLoc} → ${endLoc}`;
  document.getElementById('plan-eta').innerHTML = `${arrVal} <span class="text-xs font-medium text-slate-500">(45 mins)</span>`;
  document.getElementById('plan-description').textContent = `Synthesized corridor for ${role}. The engine has synthesized a well-lit corridor avoiding isolated underpasses, leveraging 24/7 patrol checkpoints and active open pharmacies along the arterial route.`;

  // Send to Full Stack API / Supabase
  try {
    const res = await fetch('/api/commutes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worker_role: role,
        shift_departure_time: endVal,
        target_arrival_time: arrVal,
        start_location: startLoc,
        destination_location: endLoc,
        transport_mode: mode,
        risk_level: 'Low (Patrolled)',
        epistemic_tag: 'KNOWN'
      })
    });
    const result = await res.json();
    console.log('Commute saved to database:', result);
    showToast('Safe commute route calculated and stored in Supabase (Table: <code>commute_intakes</code>)');
  } catch (e) {
    console.warn('Commute save error:', e);
  }

  // Render Bot Response
  setTimeout(() => {
    const container = document.getElementById('chat-messages-container');
    const time = getCurrentTimeStr();
    const botMsg = document.createElement('div');
    botMsg.className = "flex flex-col items-start w-full space-y-2 animate-message-enter";

    botMsg.innerHTML = `
      <div class="bg-white text-slate-900 text-xs rounded-xl rounded-tl-xs p-3.5 max-w-[95%] shadow-xs  space-y-2">
        <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <span class="font-bold text-emerald-800 flex items-center gap-1 text-xs">
            <i class="fa-solid fa-shield-halved text-emerald-700"></i> NightOwl Engine
          </span>
          <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">KNOWN</span>
        </div>
        <p class="text-slate-800 leading-normal text-xs">
          Safe route synthesized for <strong>${role}</strong>. Avoid bypass underpass. Recommended: <strong class="text-slate-950 font-bold">Patrolled Arterial Corridor</strong>.
        </p>

        <div class="bg-slate-50 p-2.5 space-y-1.5 font-sans text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-600 font-medium">Route:</span>
            <span class="font-bold text-slate-900">Arterial Corridor (45m ETA)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-600 font-medium">Risk Assessment:</span>
            <span class="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Low [KNOWN]</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-600 font-medium">Live Transport:</span>
            <span class="font-bold text-amber-900">2 Cabs Nearby</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-600 font-medium">Haven:</span>
            <span class="text-slate-900 font-bold">Apollo 24/7 (0.8 km)</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500 font-mono">
          <span>${time}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-1.5 pt-0.5 max-w-[95%]">
        <button class="bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-full text-xs font-semibold transition shadow-xs flex items-center gap-1 cursor-pointer" onclick="handleQuickReply('Request Live Escort Ping')">
          <i class="fa-solid fa-satellite-dish text-emerald-700 text-xs"></i> Escort Ping
        </button>
        <button class="bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 px-2.5 py-1 rounded-full text-xs font-semibold transition shadow-xs flex items-center gap-1 cursor-pointer" onclick="handleQuickReply('Find Nearest 24/7 ER')">
          <i class="fa-solid fa-kit-medical text-sky-700 text-xs"></i> Nearest ER
        </button>
        <button class="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full text-xs font-semibold transition shadow-xs flex items-center gap-1 cursor-pointer" onclick="handleQuickReply('Share Live SOS Location')">
          <i class="fa-solid fa-location-arrow text-rose-700 text-xs"></i> SOS Location
        </button>
      </div>
    `;
    container.appendChild(botMsg);
    container.scrollTop = container.scrollHeight;
  }, 600);
}

async function processBotResponse(query) {
  const q = query.toLowerCase();

  // If Emergency SOS explicitly mentioned, open emergency modal immediately
  if (q.includes('sos') || q.includes('emergency broadcast') || q.includes('panic')) {
    triggerEmergencySOS();
    sendBotMessage(`
      <strong class="text-rose-700">🚨 EMERGENCY PROTOCOL TRIGGERED:</strong>
      <p class="mt-1 text-slate-700">Connecting directly to Police PCR #4 (0.3 km away) and Lifeline Emergency Clinic. Your current GPS telemetry is transmitted.</p>
    `, true, "KNOWN");
    return;
  }

  // Call the server-side map-aware intelligence engine
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        userLocation: currentUserLocation,
        context: { activeRoute: currentActiveRoute }
      })
    });

    if (response.ok) {
      const data = await response.json();
      sendBotMessage(data.text, true, data.tag || "KNOWN");

      // Synchronize map with chatbot recommendation
      if (data.mapAction) {
        executeMapAction(data.mapAction);
      }
      return;
    }
  } catch (err) {
    console.warn('[ChatBot] Server-side chat query failed, using local fallback:', err.message);
  }

  // Local fallback keyword handler
  if (q.includes('pharmacy') || q.includes('medicine') || q.includes('chemist')) {
    sendBotMessage(`
      <strong>Verified 24/7 Pharmacies On-Route:</strong>
      <ul class="mt-1 space-y-1 list-disc list-inside text-slate-600">
        <li><strong class="text-slate-800">Apollo 24/7 Pharmacy</strong>: Block B Market (0.8 km) - <span class="text-emerald-700 font-semibold">Active Staff [KNOWN]</span></li>
        <li><strong class="text-slate-800">MedPlus Express</strong>: Metro Gate 2 (1.6 km) - Open</li>
      </ul>
    `, true, "KNOWN");
    if (typeof toggleMapLayer === 'function') toggleMapLayer('pharmacy', true);
  } else if (q.includes('safety') || q.includes('route') || q.includes('escort')) {
    sendBotMessage(`
      <strong>Active Route Verification:</strong>
      <div class="mt-1 bg-slate-50 p-2 rounded space-y-1">
        <div>🛣️ <strong>Recommended:</strong> Patrolled Arterial Corridor (Well-lit, 2 active PCR units)</div>
        <div>⚠️ <strong>Avoid:</strong> Underpass Bypass Rd (50% Dimmed [PROBABLE])</div>
        <div>👮 <strong>Nearest Security Node:</strong> Central Square Booth (300m)</div>
      </div>
    `, true, "KNOWN");
  } else if (q.includes('cab') || q.includes('transit') || q.includes('bus')) {
    sendBotMessage(`
      <strong>Night Transit Availability Radar:</strong>
      <p class="mt-1 text-slate-600">🚖 <strong>2 App Cabs Available</strong> within 4 mins of Sector 62 Hub. Night bus #414 frequency is reduced (next arrival at 03:20 AM).</p>
    `, true, "PROBABLE");
  } else if (q.includes('er') || q.includes('clinic') || q.includes('hospital')) {
    sendBotMessage(`
      <strong>Nearest 24/7 Emergency Rooms:</strong>
      <div class="mt-1 text-slate-700">
        🏥 <strong>Lifeline Emergency Clinic</strong> (1.4 km) - Level 1 Trauma active.<br/>
        🚑 Direct Ambulance Line: +1 800-NIGHT-ER
      </div>
    `, true, "KNOWN");
    if (typeof toggleMapLayer === 'function') toggleMapLayer('hospital', true);
  } else {
    sendBotMessage(`
      Telemetry verified for <strong class="text-slate-800">Sector 62 to Block C</strong> corridor. Checkpoints recorded in Supabase, and 2 emergency havens remain open.
    `, false, "KNOWN");
  }
}

function resetWhatsAppChat() {
  const container = document.getElementById('chat-messages-container');
  const time = getCurrentTimeStr();
  container.innerHTML = `
    <div class="flex justify-center my-0.5">
      <span class="text-xs font-semibold tracking-wider text-slate-900 bg-white shadow-xs px-3 py-1 rounded-full uppercase border border-slate-300 font-bold">
        Shift Safe Channel • Live
      </span>
    </div>

    <div class="flex flex-col items-start w-full">
      <div class="bg-white text-slate-900 text-xs rounded-xl rounded-tl-xs p-4 max-w-[96%] w-full shadow-xs  space-y-3">
        <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <span class="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
            <i class="fa-solid fa-shield-halved text-emerald-700"></i> NightOwl Engine
          </span>
          <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">LIVE</span>
        </div>

        <p class="text-slate-800 leading-normal text-xs">
          Hello! Welcome to <strong class="text-slate-950 font-bold">NightOwl Operations</strong>. Are you joining as a <strong class="text-emerald-800 font-bold">Provider (Route Scout)</strong> or a <strong class="text-emerald-800 font-bold">Consumer</strong> tonight?
        </p>

        <div class="grid grid-cols-1 gap-2.5 pt-1">
          <button onclick="selectChatRole('consumer')" class="text-left p-3 rounded-lg border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 transition shadow-xs group cursor-pointer active:scale-98">
            <div class="flex items-start gap-2.5">
              <span class="w-8 h-8 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                <i class="fa-solid fa-users"></i>
              </span>
              <div class="flex-grow">
                <div class="flex items-center justify-between">
                  <div class="font-bold text-xs text-slate-950">Join as Consumer</div>
                  <span class="text-xs font-bold text-emerald-900 bg-emerald-200 px-2 py-0.2 rounded">Select</span>
                </div>
                <p class="text-xs text-slate-700 mt-0.5 leading-snug">Commuter or night worker requesting safe corridor routing & live telemetry</p>
              </div>
            </div>
          </button>

          <button onclick="selectChatRole('provider')" class="text-left p-3 rounded-lg border-2 border-amber-400 bg-amber-50 hover:bg-amber-100 transition shadow-xs group cursor-pointer active:scale-98">
            <div class="flex items-start gap-2.5">
              <span class="w-8 h-8 rounded-md bg-amber-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                <i class="fa-solid fa-bolt"></i>
              </span>
              <div class="flex-grow">
                <div class="flex items-center justify-between">
                  <div class="font-bold text-xs text-slate-950">Join as Provider (Route Scout)</div>
                  <span class="text-xs font-bold text-amber-900 bg-amber-200 px-2 py-0.2 rounded">Select</span>
                </div>
                <p class="text-xs text-slate-700 mt-0.5 leading-snug">Community Route Scout: Share live road conditions, lighting, open havens & hazards</p>
              </div>
            </div>
          </button>
        </div>

        <div class="flex items-center justify-end gap-1 mt-1 text-xs text-slate-500 font-mono">
          <span>${time}</span>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// SUPABASE MODAL & CONFIG MANAGEMENT
// ==========================================
function openSupabaseModal() {
  document.getElementById('supabase-modal').classList.remove('hidden');
  checkBackendHealth();
}

function closeSupabaseModal() {
  document.getElementById('supabase-modal').classList.add('hidden');
}

async function checkBackendHealth() {
  try {
    const res = await fetch('/api/health');
    const health = await res.json();
    if (health.supabase && health.supabase.isConnected) {
      updateSupabaseUIStatus(true, health.supabase.url);
    } else {
      updateSupabaseUIStatus(false);
      if (health.supabase && health.supabase.error) {
        const desc = document.getElementById('modal-status-desc');
        if (desc) desc.textContent = 'Supabase error: ' + health.supabase.error;
      }
    }
  } catch (err) {
    updateSupabaseUIStatus(false);
  }
}

async function saveSupabaseConfig() {
  const url = document.getElementById('cfg-supabase-url').value.trim();
  const key = document.getElementById('cfg-supabase-key').value.trim();

  if (!url || !key) {
    alert('Please enter both Supabase Project URL and Anon Public Key.');
    return;
  }

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supabaseUrl: url, supabaseAnonKey: key })
    });
    const result = await res.json();
    if (result.success) {
      showToast('✅ Supabase credentials saved! Re-initializing client...');
      await initSupabaseClient();
      await checkBackendHealth();
      await loadInitialData();
    } else {
      alert('Error: ' + (result.error || 'Failed saving credentials'));
    }
  } catch (err) {
    alert('Failed to save config: ' + err.message);
  }
}

async function copySQLSchema() {
  const sql = `-- NightOwl Operations Supabase Schema
-- Run this in your Supabase SQL Editor:
-- (Check supabase/schema.sql in the project root for full schema)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS scout_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scout_name TEXT NOT NULL DEFAULT 'Community Route Scout',
    handle TEXT DEFAULT '@Scout_Hub',
    rep_score INTEGER NOT NULL DEFAULT 480,
    scout_level INTEGER NOT NULL DEFAULT 3,
    reports_filed INTEGER NOT NULL DEFAULT 128,
    badge_title TEXT DEFAULT 'Verified Night Pioneer',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scout_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scout_name TEXT NOT NULL DEFAULT 'Anonymous Scout',
    road_condition TEXT NOT NULL,
    condition_title TEXT NOT NULL,
    landmark_note TEXT,
    photo_url TEXT,
    geo_lat NUMERIC(9,6) DEFAULT 28.629000,
    geo_lng NUMERIC(9,6) DEFAULT 77.369000,
    rep_points_awarded INTEGER DEFAULT 25,
    epistemic_status TEXT DEFAULT 'KNOWN',
    impact_desc TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS sos_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier TEXT DEFAULT 'Commuter #8841',
    location_name TEXT NOT NULL DEFAULT 'Sector 62 Tech Park Transit Corridor',
    geo_lat NUMERIC(9,6) DEFAULT 28.629200,
    geo_lng NUMERIC(9,6) DEFAULT 77.369800,
    assigned_police_unit TEXT DEFAULT 'Police PCR #4 (0.3 km away)',
    emergency_dispatch_type TEXT DEFAULT '112 / 100 Initiated',
    alert_status TEXT DEFAULT 'DISPATCHED',
    created_at TIMESTAMPTZ DEFAULT now()
);

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

ALTER TABLE scout_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE commute_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridor_checkpoints ENABLE ROW LEVEL SECURITY;

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

ALTER PUBLICATION supabase_realtime ADD TABLE scout_reports, sos_alerts, commute_intakes, scout_profiles;
`;

  try {
    await navigator.clipboard.writeText(sql);
    showToast('📋 SQL schema copied to clipboard! Paste it into the Supabase SQL Editor.');
  } catch (e) {
    prompt('Copy the SQL script below:', sql);
  }
}

// ==========================================
// DELHI INTERACTIVE SAFETY & MOBILITY MAP ENGINE
// ==========================================

/**
 * Safely escapes HTML special characters.
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let delhiMap = null;
let mapLayers = {
  metro: null,
  bus: null,
  hospital: null,
  pharmacy: null,
  police: null,
  ev_charging: null,
  hazard: null,
  live_buses: null
};
let activeLayersState = {
  metro: true,
  bus: true,
  hospital: true,
  pharmacy: true,
  police: true,
  ev_charging: true,
  hazard: true,
  live_buses: false
};

const liveBusMarkers = new Map();
let liveBusPollingTimer = null;
const BUS_POLL_INTERVAL_MS = 15000;

let routePolylineLayers = [];
let routeMarkerLayers = [];
let userLocationMarker = null;
let currentUserLocation = null;
let currentActiveRoute = null;
let currentRouteAlternatives = [];
let selectedRouteIndex = 0;

/**
 * Initializes the Leaflet map centered on Delhi NCR.
 */
function initDelhiMap() {
  const mapContainer = document.getElementById('delhi-map');
  if (!mapContainer) return;
  if (delhiMap) return; // Prevent duplicate initialization

  if (typeof L === 'undefined') {
    console.error('Leaflet library (L) is not loaded.');
    updateMapStatusPill('Leaflet library not ready', 'rose');
    return;
  }

  try {
    // Delhi NCR Center: 28.6139° N, 77.2090° E (Central Delhi)
    delhiMap = L.map('delhi-map', {
      center: [28.6139, 77.2090],
      zoom: 12,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: true
    });

    // OpenStreetMap standard tile layer
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors • DMRC &amp; Delhi OTD',
      maxZoom: 19
    }).addTo(delhiMap);

    tileLayer.on('tileerror', function() {
      console.warn('OSM Tile load warning — connection slow or offline');
      updateMapStatusPill('Offline Tile Cache', 'amber');
    });

    // Initialize layer groups for facilities & live buses
    for (const key of Object.keys(activeLayersState)) {
      mapLayers[key] = L.layerGroup();
      if (activeLayersState[key]) {
        mapLayers[key].addTo(delhiMap);
      }
    }

    // Force Leaflet to recalculate container dimensions once rendered
    setTimeout(() => { if (delhiMap) delhiMap.invalidateSize(); }, 200);
    setTimeout(() => { if (delhiMap) delhiMap.invalidateSize(); }, 600);

    window.addEventListener('resize', () => {
      if (delhiMap) delhiMap.invalidateSize();
    });

    // Load facility markers across Delhi
    loadDelhiMapPlaces();

    // Trigger an initial preview route calculation between Sector 62 and Connaught Place
    setTimeout(() => {
      calculateAndRenderMapRoute('Noida Sector 62', 'Connaught Place', 'driving', false);
    }, 400);

    updateMapStatusPill('OpenStreetMap Live Active', 'emerald');
  } catch (err) {
    console.error('Failed to initialize Delhi map:', err);
    updateMapStatusPill('Map initialization error', 'rose');
  }
}

/**
 * Updates the map status badge pill in the card header.
 */
function updateMapStatusPill(statusText, variant = 'emerald') {
  const pill = document.getElementById('map-status-pill');
  if (!pill) return;
  
  if (variant === 'emerald') {
    pill.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
    pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ${escapeHtml(statusText)}`;
  } else if (variant === 'amber') {
    pill.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300';
    pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> ${escapeHtml(statusText)}`;
  } else {
    pill.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300';
    pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> ${escapeHtml(statusText)}`;
  }
}

/**
 * Creates SVG DivIcons for map markers.
 */
function createCustomMarkerIcon(category, iconClass, bgColor, textColor = 'text-white', size = 26) {
  const html = `
    <div class="custom-map-icon ${bgColor} ${textColor}" style="width: ${size}px; height: ${size}px;">
      <i class="fa-solid ${iconClass}" style="font-size: ${Math.round(size * 0.44)}px;"></i>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-divicon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

/**
 * Loads Delhi places & safety checkpoints from backend.
 */
async function loadDelhiMapPlaces() {
  try {
    const res = await fetch('/api/geospatial/nearby?lat=28.6139&lng=77.2090&category=all&radius=35&limit=100');
    if (!res.ok) throw new Error('API returned ' + res.status);
    const data = await res.json();
    const places = data.results || [];

    // Clear all existing facility layers
    for (const key of Object.keys(mapLayers)) {
      if (mapLayers[key]) mapLayers[key].clearLayers();
    }

    places.forEach(p => {
      let icon = null;
      let popupContent = '';

      if (p.category === 'metro') {
        icon = createCustomMarkerIcon('metro', 'fa-train-subway', 'bg-indigo-600', 'text-white', 24);
        popupContent = `
          <div class="space-y-1">
            <div class="font-bold text-slate-900">${escapeHtml(p.name)}</div>
            <div class="text-[11px] text-indigo-700 font-semibold">${escapeHtml(p.line || 'Delhi Metro')}</div>
            <div class="text-[10px] text-slate-500">Gates: ${p.gates || 4} • CCTV: ${p.cctvCoverage || '95%'}</div>
            <div class="pt-1 flex gap-1">
              <button onclick="setAsDestination('${escapeHtml(p.name)}', ${p.lat}, ${p.lng})" class="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold border border-indigo-200 cursor-pointer">Set as Dest</button>
            </div>
          </div>
        `;
      } else if (p.category === 'bus') {
        icon = createCustomMarkerIcon('bus', 'fa-bus', 'bg-amber-500', 'text-slate-950', 24);
        popupContent = `
          <div class="space-y-1">
            <div class="font-bold text-slate-900">${escapeHtml(p.name)}</div>
            <div class="text-[11px] text-amber-800 font-medium">Routes: ${(p.routes || []).join(', ')}</div>
            <div class="text-[10px] text-slate-500">Lighting: ${p.lightingRating || '90%'} • Shelter: Yes</div>
            <div class="pt-1">
              <button onclick="setAsDestination('${escapeHtml(p.name)}', ${p.lat}, ${p.lng})" class="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded text-[10px] font-bold border border-amber-300 cursor-pointer">Set as Dest</button>
            </div>
          </div>
        `;
      } else if (p.category === 'hospital') {
        icon = createCustomMarkerIcon('hospital', 'fa-hospital', 'bg-rose-600', 'text-white', 26);
        popupContent = `
          <div class="space-y-1.5 p-0.5">
            <div class="flex items-center justify-between gap-2 border-b border-rose-100 pb-1">
              <span class="font-bold text-slate-900">${escapeHtml(p.name)}</span>
              <span class="text-[9px] bg-rose-100 text-rose-800 px-1 py-0.2 rounded font-bold uppercase">24/7 Casualty</span>
            </div>
            <div class="text-[11px] text-slate-600">${escapeHtml(p.address || '')}</div>
            <div class="text-[10px] text-rose-900 bg-rose-50 p-1.5 rounded space-y-0.5">
              <div>📞 Casualty Desk: <a href="tel:${p.emergencyPhone || p.phone}" class="font-mono font-bold text-rose-700 underline">${p.emergencyPhone || p.phone}</a></div>
              <div>🚑 CATS Ambulance: <a href="tel:102" class="font-mono font-bold text-rose-700 underline">102</a> (Toll-Free)</div>
            </div>
            <div class="text-[9px] text-slate-500 italic">${escapeHtml(p.disclaimer || '24-hour emergency casualty confirmed.')}</div>
            <div class="pt-1 flex gap-1">
              <button onclick="setAsDestination('${escapeHtml(p.name)}', ${p.lat}, ${p.lng})" class="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition shadow-2xs cursor-pointer">Route to Emergency</button>
              <a href="tel:${p.emergencyPhone || p.phone}" class="px-2 py-0.5 bg-white hover:bg-rose-50 text-rose-700 rounded text-[10px] font-bold border border-rose-300 transition">Call Casualty</a>
            </div>
          </div>
        `;
      } else if (p.category === 'pharmacy') {
        icon = createCustomMarkerIcon('pharmacy', 'fa-kit-medical', p.verified247 ? 'bg-emerald-600' : 'bg-amber-600', 'text-white', 24);
        popupContent = `
          <div class="space-y-1.5 p-0.5">
            <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
              <span class="font-bold text-slate-900">${escapeHtml(p.name)}</span>
              <span class="text-[9px] ${p.verified247 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} px-1 py-0.2 rounded font-bold">${p.verified247 ? 'Verified 24/7' : 'Daytime Only'}</span>
            </div>
            <div class="text-[11px] text-slate-600">${escapeHtml(p.address || '')}</div>
            <div class="text-[10px] text-slate-700">
              📞 Direct Call: <a href="${p.callAction || 'tel:' + p.phone}" class="font-mono font-bold text-emerald-700 underline">${p.phone}</a>
            </div>
            <div class="text-[9px] text-slate-500 italic">${escapeHtml(p.disclaimer || 'Please confirm formulation availability before travelling.')}</div>
            <div class="pt-1 flex gap-1">
              <button onclick="setAsDestination('${escapeHtml(p.name)}', ${p.lat}, ${p.lng})" class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition shadow-2xs cursor-pointer">Route Here</button>
              <a href="${p.callAction || 'tel:' + p.phone}" class="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-300 transition">Call Store</a>
            </div>
          </div>
        `;
      } else if (p.category === 'police') {
        icon = createCustomMarkerIcon('police', 'fa-shield-halved', 'bg-sky-600', 'text-white', 25);
        popupContent = `
          <div class="space-y-1.5 p-0.5">
            <div class="flex items-center justify-between gap-2 border-b border-sky-100 pb-1">
              <span class="font-bold text-slate-900">${escapeHtml(p.name)}</span>
              <span class="text-[9px] bg-sky-100 text-sky-800 px-1 py-0.2 rounded font-bold uppercase">PCR Post</span>
            </div>
            <div class="text-[11px] text-sky-900 font-medium">${escapeHtml(p.jurisdiction || 'Delhi Police')}</div>
            <div class="text-[10px] text-slate-700 bg-sky-50 p-1.5 rounded space-y-0.5">
              <div>🚨 Unified Emergency: <a href="tel:112" class="font-mono font-bold text-sky-700 underline">112 / 100</a></div>
              <div>🛡️ Women In Distress: <a href="tel:1091" class="font-mono font-bold text-sky-700 underline">1091</a></div>
            </div>
            <div class="pt-1 flex gap-1">
              <button onclick="setAsDestination('${escapeHtml(p.name)}', ${p.lat}, ${p.lng})" class="px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-[10px] font-bold transition shadow-2xs cursor-pointer">Route Here</button>
              <a href="tel:112" class="px-2 py-0.5 bg-white hover:bg-sky-50 text-sky-700 rounded text-[10px] font-bold border border-sky-300 transition">Dial 112</a>
            </div>
          </div>
        `;
      } else if (p.category === 'ev_charging') {
        icon = createCustomMarkerIcon('ev_charging', 'fa-bolt', 'bg-teal-600', 'text-white', 22);
        popupContent = `
          <div class="space-y-1">
            <div class="font-bold text-slate-900">${escapeHtml(p.name)}</div>
            <div class="text-[11px] text-teal-800 font-medium">${escapeHtml(p.type || 'Fast Charger')} (${p.powerKw || '60 kW'})</div>
            <div class="text-[10px] text-slate-500">24/7 Access Hub</div>
          </div>
        `;
      } else if (p.category === 'hazard') {
        icon = createCustomMarkerIcon('hazard', 'fa-triangle-exclamation', 'bg-rose-500 ring-2 ring-rose-300', 'text-white', 28);
        popupContent = `
          <div class="space-y-1">
            <div class="font-bold text-rose-900 flex items-center gap-1">⚠️ Hazard Advisory</div>
            <div class="text-[11px] text-slate-800 font-semibold">${escapeHtml(p.name)}</div>
            <div class="text-[10px] text-slate-600">${escapeHtml(p.impact_desc || p.impact || '')}</div>
            <span class="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-mono text-[9px] font-bold">${p.epistemic_status || 'KNOWN'}</span>
          </div>
        `;
      }

      if (icon && mapLayers[p.category]) {
        const marker = L.marker([p.lat, p.lng], { icon }).bindPopup(popupContent);
        mapLayers[p.category].addLayer(marker);
      }
    });
  } catch (err) {
    console.warn('Could not load all map places:', err.message);
  }
}

/**
 * Toggles visibility of a specific facility or live bus layer on the map.
 */
function toggleMapLayer(category, forceShow = null) {
  if (!delhiMap || !mapLayers[category]) return;

  const btn = document.getElementById(`btn-layer-${category}`);
  const newState = forceShow !== null ? forceShow : !activeLayersState[category];
  activeLayersState[category] = newState;

  if (newState) {
    delhiMap.addLayer(mapLayers[category]);
    if (btn) {
      btn.classList.remove('inactive');
      btn.classList.add('active');
    }

    // Special logic for live bus stream
    if (category === 'live_buses') {
      fetchAndRenderLiveBuses(true);
      if (!liveBusPollingTimer) {
        liveBusPollingTimer = setInterval(() => {
          if (activeLayersState.live_buses) {
            fetchAndRenderLiveBuses(false);
          }
        }, BUS_POLL_INTERVAL_MS);
      }
    }
  } else {
    delhiMap.removeLayer(mapLayers[category]);
    if (btn) {
      btn.classList.add('inactive');
      btn.classList.remove('active');
    }

    if (category === 'live_buses' && liveBusPollingTimer) {
      clearInterval(liveBusPollingTimer);
      liveBusPollingTimer = null;
    }
  }
}

/**
 * Fetches and updates live Delhi bus positions from the official OTD endpoint.
 * In-place marker updates keyed by vehicleId prevent duplicate markers.
 */
async function fetchAndRenderLiveBuses(userInitiated = false) {
  const badge = document.getElementById('live-buses-count-badge');
  const dot = document.getElementById('live-bus-feed-dot');
  const statusEl = document.getElementById('live-bus-refresh-status');
  const lastSyncEl = document.getElementById('live-bus-last-sync');

  try {
    const res = await fetch('/api/geospatial/delhi/buses/live');
    if (!res.ok) throw new Error('Live bus endpoint returned status ' + res.status);
    const data = await res.json();

    const timestampStr = new Date().toLocaleTimeString();
    if (lastSyncEl) lastSyncEl.textContent = `Last ping: ${timestampStr}`;

    if (data.status === 'SUCCESS' && Array.isArray(data.vehicles)) {
      const liveVehicles = data.vehicles;
      if (badge) badge.textContent = liveVehicles.length;
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
      if (statusEl) statusEl.textContent = `${liveVehicles.length} buses live in Delhi bounds`;

      const seenVehicleIds = new Set();

      for (const v of liveVehicles) {
        seenVehicleIds.add(v.vehicleId);
        const popupHtml = `
          <div class="space-y-1 p-0.5">
            <div class="flex items-center justify-between border-b border-emerald-100 pb-1">
              <span class="font-bold text-slate-900">🚌 DTC Bus: Route ${escapeHtml(v.routeId)}</span>
              <span class="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-mono font-bold">LIVE OTD</span>
            </div>
            <div class="text-[11px] text-slate-600">Vehicle ID: <span class="font-mono font-bold">${escapeHtml(v.vehicleId)}</span></div>
            ${v.speedKmph != null ? `<div class="text-[10px] text-slate-600">Speed: <strong>${v.speedKmph} km/h</strong></div>` : ''}
            <div class="text-[9px] text-slate-400">Position recorded: ${new Date(v.timestamp).toLocaleTimeString()}</div>
          </div>
        `;

        if (liveBusMarkers.has(v.vehicleId)) {
          // In-place update to prevent duplicate markers
          const marker = liveBusMarkers.get(v.vehicleId);
          marker.setLatLng([v.lat, v.lng]);
          marker.setPopupContent(popupHtml);
        } else {
          // Create new bus marker
          const busIcon = createCustomMarkerIcon('live_buses', 'fa-bus-simple', 'bg-emerald-600 ring-2 ring-emerald-300', 'text-white', 24);
          const marker = L.marker([v.lat, v.lng], { icon: busIcon }).bindPopup(popupHtml);
          mapLayers.live_buses.addLayer(marker);
          liveBusMarkers.set(v.vehicleId, marker);
        }
      }

      // Remove vehicles that are no longer in feed
      for (const [vId, marker] of liveBusMarkers.entries()) {
        if (!seenVehicleIds.has(vId)) {
          mapLayers.live_buses.removeLayer(marker);
          liveBusMarkers.delete(vId);
        }
      }

      if (userInitiated) {
        showToast(`📡 Live OTD Feed: ${liveVehicles.length} active buses streaming.`);
      }
    } else {
      // Feed is unconfigured or unauthorized (Honest reporting without faking coordinates)
      if (badge) badge.textContent = '0';
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400';
      if (statusEl) statusEl.textContent = 'Key Required (Register at otd.delhi.gov.in)';

      // Clear any remaining markers
      if (mapLayers.live_buses) {
        mapLayers.live_buses.clearLayers();
        liveBusMarkers.clear();
      }

      if (userInitiated) {
        showToast('ℹ️ Live GPS tracking requires DELHI_OTD_API_KEY from otd.delhi.gov.in. Static schedules active.');
        openOTDKeyModal();
      }
    }
  } catch (err) {
    console.warn('Error fetching live bus feed:', err.message);
    if (statusEl) statusEl.textContent = 'OTD gateway temporarily unavailable';
  }
}

function openOTDKeyModal() {
  const modal = document.getElementById('otd-key-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeOTDKeyModal() {
  const modal = document.getElementById('otd-key-modal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Recenters the map to Central Delhi.
 */
function recenterDelhiMap() {
  if (delhiMap) {
    delhiMap.flyTo([28.6139, 77.2090], 12, { duration: 1.0 });
  }
}

/**
 * Explicit user GPS location request with browser permission prompt.
 */
function getUserCurrentLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', true);
    return;
  }

  showToast('Requesting GPS location permission...');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      currentUserLocation = { lat, lng };

      if (!delhiMap) return;

      // Update or create user location marker with pulsing beacon
      if (userLocationMarker) {
        userLocationMarker.setLatLng([lat, lng]);
      } else {
        const beaconIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute w-8 h-8 rounded-full bg-sky-500/30 animate-ping"></span>
              <span class="relative w-4 h-4 rounded-full bg-sky-600 border-2 border-white shadow-md"></span>
            </div>
          `,
          className: 'user-gps-divicon',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        userLocationMarker = L.marker([lat, lng], { icon: beaconIcon, zIndexOffset: 1000 })
          .bindPopup('<strong class="text-sky-900">📍 You Are Here</strong><br/><span class="text-xs text-slate-500">Live Browser GPS</span>')
          .addTo(delhiMap);
      }

      delhiMap.flyTo([lat, lng], 14, { duration: 1.2 });
      
      const originInput = document.getElementById('route-origin-input');
      if (originInput) originInput.value = 'My Location (GPS)';

      showToast('📍 Live GPS location acquired and centered!');
    },
    (err) => {
      console.warn('Geolocation denied or failed:', err.message);
      showToast('Location permission denied or unavailable. Using default origin.', true);
    },
    { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
  );
}

/**
 * Quick destination helper for popup clicks.
 */
function setAsDestination(name, lat, lng) {
  const destInput = document.getElementById('route-dest-input');
  if (destInput) destInput.value = name;
  handleCalculateRouteButton();
}

/**
 * Sets a preset route.
 */
function setQuickRoute(origin, dest) {
  const o = document.getElementById('route-origin-input');
  const d = document.getElementById('route-dest-input');
  if (o) o.value = origin;
  if (d) d.value = dest;
  handleCalculateRouteButton();
}

/**
 * Button handler for manual route calculate button.
 */
function handleCalculateRouteButton() {
  const originVal = (document.getElementById('route-origin-input')?.value || '').trim();
  const destVal = (document.getElementById('route-dest-input')?.value || '').trim();
  const modeVal = document.getElementById('route-mode-select')?.value || 'driving';

  if (!originVal || !destVal) {
    showToast('Please provide both an origin and destination.', true);
    return;
  }

  calculateAndRenderMapRoute(originVal, destVal, modeVal, true);
}

/**
 * Calculates road-network routes, scores safety, and renders polylines and markers.
 */
async function calculateAndRenderMapRoute(originQuery, destQuery, mode = 'driving', notifyToast = true) {
  const loadingOverlay = document.getElementById('map-loading-overlay');
  const loadingText = document.getElementById('map-loading-text');
  if (loadingOverlay) loadingOverlay.classList.remove('hidden');
  if (loadingText) loadingText.textContent = `Finding route: ${originQuery} → ${destQuery}...`;

  try {
    // 1. Geocode Origin
    let startCoords = null;
    let startLabel = originQuery;
    if (originQuery.toLowerCase().includes('my location') && currentUserLocation) {
      startCoords = currentUserLocation;
      startLabel = 'Current GPS Location';
    } else {
      const geoOriginRes = await fetch(`/api/geospatial/search?q=${encodeURIComponent(originQuery)}`);
      if (!geoOriginRes.ok) throw new Error(`Could not find origin "${originQuery}"`);
      const geoOrigin = await geoOriginRes.json();
      startCoords = { lat: geoOrigin.lat, lng: geoOrigin.lng };
      startLabel = geoOrigin.name;
    }

    // 2. Geocode Destination
    const geoDestRes = await fetch(`/api/geospatial/search?q=${encodeURIComponent(destQuery)}`);
    if (!geoDestRes.ok) throw new Error(`Could not find destination "${destQuery}"`);
    const geoDest = await geoDestRes.json();
    const destCoords = { lat: geoDest.lat, lng: geoDest.lng };
    const destLabel = geoDest.name;

    // 3. Request Route & Safety Score
    const routeRes = await fetch('/api/geospatial/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startLat: startCoords.lat,
        startLng: startCoords.lng,
        endLat: destCoords.lat,
        endLng: destCoords.lng,
        mode
      })
    });

    if (!routeRes.ok) throw new Error('Route calculation failed on server');
    const routeData = await routeRes.json();
    const routes = routeData.routes || [];

    if (routes.length === 0) {
      throw new Error('No usable road route found between these locations.');
    }

    currentRouteAlternatives = routes;
    selectedRouteIndex = 0;
    currentActiveRoute = routes[0];

    // Render on Leaflet Map
    renderRoutesOnMap(routes, startCoords, startLabel, destCoords, destLabel);

    // Update Comparison Panel
    renderRouteComparisonPanel(routes, 0);

    // Synchronize Center Dashboard Header Card (#plan-status-card)
    syncDashboardRouteCard(routes[0], startLabel, destLabel);

    if (notifyToast) {
      showToast(`🛣️ Road route computed: ${routes[0].durationMins} mins • Safety score ${routes[0].safety.safetyScore}/100`);
    }
  } catch (err) {
    console.error('Route calculation error:', err);
    showToast(err.message, true);
  } finally {
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }
}

/**
 * Draws polylines and markers on the Leaflet map.
 */
function renderRoutesOnMap(routes, origin, originLabel, destination, destLabel) {
  if (!delhiMap) return;

  // Clear previous polylines & markers
  routePolylineLayers.forEach(l => delhiMap.removeLayer(l));
  routePolylineLayers = [];
  routeMarkerLayers.forEach(m => delhiMap.removeLayer(m));
  routeMarkerLayers = [];

  // Drop Origin & Destination Pins
  const originIcon = createCustomMarkerIcon('origin', 'fa-location-dot', 'bg-sky-600 ring-2 ring-sky-300', 'text-white', 28);
  const destIcon = createCustomMarkerIcon('dest', 'fa-flag-checkered', 'bg-emerald-600 ring-2 ring-emerald-300', 'text-white', 28);

  const mOrigin = L.marker([origin.lat, origin.lng], { icon: originIcon, zIndexOffset: 800 })
    .bindPopup(`<strong>Origin:</strong> ${escapeHtml(originLabel)}`)
    .addTo(delhiMap);
  routeMarkerLayers.push(mOrigin);

  const mDest = L.marker([destination.lat, destination.lng], { icon: destIcon, zIndexOffset: 800 })
    .bindPopup(`<strong>Destination:</strong> ${escapeHtml(destLabel)}`)
    .addTo(delhiMap);
  routeMarkerLayers.push(mDest);

  // Render Polylines for each alternative
  routes.forEach((route, idx) => {
    const isSafest = route.isSafest;
    const isSelected = idx === selectedRouteIndex;

    const polyColor = isSelected
      ? (isSafest ? '#059669' : '#0284c7') // emerald for safest, sky for alternative selected
      : '#94a3b8'; // muted slate for unselected alternative

    const polyWeight = isSelected ? 6 : 4;
    const polyDash = isSelected ? null : '6, 8';
    const polyOpacity = isSelected ? 0.95 : 0.65;

    const polyline = L.polyline(route.coordinates, {
      color: polyColor,
      weight: polyWeight,
      opacity: polyOpacity,
      dashArray: polyDash,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(delhiMap);

    polyline.bindTooltip(
      `<strong>${escapeHtml(route.name)}</strong>: ${route.durationMins}m • Score ${route.safety.safetyScore}/100`,
      { sticky: true, className: 'text-xs font-sans' }
    );

    polyline.on('click', () => {
      selectMapRoute(idx);
    });

    routePolylineLayers.push(polyline);
  });

  // Fit bounds to show entire route with padding
  if (routePolylineLayers.length > 0) {
    const group = L.featureGroup(routePolylineLayers);
    delhiMap.fitBounds(group.getBounds(), { padding: [40, 40] });
  }
}

/**
 * Switches the active selected route among alternatives.
 */
function selectMapRoute(index) {
  selectedRouteIndex = index;
  currentActiveRoute = currentRouteAlternatives[index];

  // Re-style polylines
  routePolylineLayers.forEach((poly, idx) => {
    const isSelected = idx === index;
    const route = currentRouteAlternatives[idx];
    const isSafest = route.isSafest;

    poly.setStyle({
      color: isSelected ? (isSafest ? '#059669' : '#0284c7') : '#94a3b8',
      weight: isSelected ? 6 : 4,
      opacity: isSelected ? 0.95 : 0.60,
      dashArray: isSelected ? null : '6, 8'
    });
    if (isSelected) poly.bringToFront();
  });

  renderRouteComparisonPanel(currentRouteAlternatives, index);
  syncDashboardRouteCard(currentActiveRoute);
}

/**
 * Synchronizes the dashboard center plan card (#plan-status-card) with computed route.
 */
function syncDashboardRouteCard(route, originLabel = 'Sector 62', destLabel = 'Connaught Place') {
  if (!route) return;

  const titleEl = document.getElementById('plan-title');
  if (titleEl) titleEl.textContent = `${getCurrentTimeStr()} Departure: ${originLabel} → ${destLabel}`;

  const etaEl = document.getElementById('plan-eta');
  if (etaEl) {
    etaEl.innerHTML = `${route.durationMins} mins <span class="text-xs font-medium text-slate-600">(${route.distanceKm} km)</span>`;
  }

  const descEl = document.getElementById('plan-description');
  if (descEl) {
    descEl.textContent = route.recommendationReason || route.safety.summaryText;
  }

  const riskEl = document.getElementById('metric-risk');
  if (riskEl) {
    riskEl.innerHTML = `<i class="fa-solid fa-shield text-emerald-800"></i> Score: ${route.safety.safetyScore}/100`;
  }

  const transportEl = document.getElementById('metric-transport');
  if (transportEl) {
    transportEl.innerHTML = `<i class="fa-solid fa-car text-amber-800"></i> ${route.mode === 'walking' ? 'Pedestrian Corridor' : 'Arterial Road'}`;
  }

  const emergencyEl = document.getElementById('metric-emergency');
  if (emergencyEl) {
    emergencyEl.innerHTML = `<i class="fa-solid fa-hospital text-purple-600"></i> ${route.safety.signals.havenCount} Havens On-Route`;
  }
}

/**
 * Renders the route comparison & safety breakdown bar under the map.
 */
function renderRouteComparisonPanel(routes, activeIdx = 0) {
  const panel = document.getElementById('route-comparison-panel');
  if (!panel) return;

  const activeRoute = routes[activeIdx] || routes[0];
  const s = activeRoute.safety;

  // Build alternatives tabs
  const tabsHtml = routes.map((r, i) => {
    const isSel = i === activeIdx;
    const badge = r.isSafest ? '🛡️ Safest' : '⚡ Fastest';
    return `
      <button onclick="selectMapRoute(${i})" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${isSel ? 'bg-white border-emerald-500 text-emerald-900 shadow-2xs' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}">
        <span>${escapeHtml(r.name)}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded font-mono ${r.isSafest ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}">${badge}</span>
        <span class="font-normal text-slate-500">(${r.durationMins}m)</span>
      </button>
    `;
  }).join('');

  panel.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="text-xs font-bold text-slate-700">Routes:</span>
        ${tabsHtml}
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold ${s.safetyScore >= 80 ? 'text-emerald-700' : 'text-amber-800'} flex items-center gap-1">
          <i class="fa-solid fa-shield-halved"></i> Safety Score: ${s.safetyScore}/100
        </span>
        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${s.epistemicStatus === 'KNOWN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${s.epistemicStatus}</span>
      </div>
    </div>

    <!-- Multi-Signal Breakdown Matrix -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
      <div class="p-2 bg-white rounded border border-slate-200">
        <span class="text-slate-500 block text-[10px] uppercase font-semibold">Police Proximity</span>
        <span class="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
          <i class="fa-solid fa-shield-halved text-sky-600 text-xs"></i> ${s.signals.policeCount} Units (≤1.5km)
        </span>
      </div>
      <div class="p-2 bg-white rounded border border-slate-200">
        <span class="text-slate-500 block text-[10px] uppercase font-semibold">24/7 Havens</span>
        <span class="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
          <i class="fa-solid fa-kit-medical text-emerald-600 text-xs"></i> ${s.signals.havenCount} Pharmacies/ER
        </span>
      </div>
      <div class="p-2 bg-white rounded border border-slate-200">
        <span class="text-slate-500 block text-[10px] uppercase font-semibold">Street Illumination</span>
        <span class="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
          <i class="fa-solid fa-lightbulb text-amber-600 text-xs"></i> ${s.breakdown.lightingScore.current}/${s.breakdown.lightingScore.max} pts
        </span>
      </div>
      <div class="p-2 bg-white rounded border border-slate-200">
        <span class="text-slate-500 block text-[10px] uppercase font-semibold">Disruptions / Hazards</span>
        <span class="font-bold ${s.signals.hazardsEncountered.length > 0 ? 'text-rose-700' : 'text-emerald-700'} flex items-center gap-1 mt-0.5">
          <i class="fa-solid fa-triangle-exclamation text-xs"></i> ${s.signals.hazardsEncountered.length} Reported
        </span>
      </div>
    </div>

    <div class="text-[11px] text-slate-600 pt-1 leading-relaxed">
      <strong>Safety Reasoning:</strong> ${escapeHtml(activeRoute.recommendationReason || s.summaryText)}
    </div>
  `;
}

/**
 * Handles map actions emitted from the map-aware chatbot.
 */
function executeMapAction(action) {
  if (!action || !delhiMap) return;

  if (action.type === 'RENDER_ROUTE') {
    const originInput = document.getElementById('route-origin-input');
    const destInput = document.getElementById('route-dest-input');
    if (originInput && action.origin) originInput.value = action.origin.label || '';
    if (destInput && action.destination) destInput.value = action.destination.label || '';

    currentRouteAlternatives = action.routes || [];
    selectedRouteIndex = action.selectedRouteIndex || 0;
    currentActiveRoute = currentRouteAlternatives[selectedRouteIndex];

    renderRoutesOnMap(
      currentRouteAlternatives,
      action.origin,
      action.origin.label || 'Origin',
      action.destination,
      action.destination.label || 'Destination'
    );

    renderRouteComparisonPanel(currentRouteAlternatives, selectedRouteIndex);
    syncDashboardRouteCard(currentActiveRoute, action.origin.label, action.destination.label);
  } else if (action.type === 'SHOW_PLACES') {
    if (action.category && typeof toggleMapLayer === 'function') {
      toggleMapLayer(action.category, true);
    }
    const places = action.places || [];
    if (places.length > 0) {
      const first = places[0];
      if (first.lat && first.lng) {
        delhiMap.flyTo([first.lat, first.lng], 13, { duration: 1.0 });
      }
    }
  } else if (action.type === 'SHOW_EMERGENCY_PANEL') {
    if (typeof toggleMapLayer === 'function') {
      toggleMapLayer('police', true);
      toggleMapLayer('hospital', true);
    }
    showToast('🚨 Official 24/7 Delhi Emergency Helplines active: CATS 102, Police 112, Women Helpline 1091.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (action.type === 'SHOW_BUSES') {
    if (typeof toggleMapLayer === 'function') {
      toggleMapLayer('live_buses', true);
    }
  }
}

// ==========================================
// INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
  resetWhatsAppChat();
  initDelhiMap();
  await initSupabaseClient();
  await loadInitialData();
});
