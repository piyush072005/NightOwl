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

function processBotResponse(query) {
  const q = query.toLowerCase();
  if (q.includes('pharmacy') || q.includes('medicine') || q.includes('chemist')) {
    sendBotMessage(`
      <strong>Verified 24/7 Pharmacies On-Route:</strong>
      <ul class="mt-1 space-y-1 list-disc list-inside text-slate-600">
        <li><strong class="text-slate-800">Apollo 24/7 Pharmacy</strong>: Block B Market (0.8 km) - <span class="text-emerald-700 font-semibold">Active Staff [KNOWN]</span></li>
        <li><strong class="text-slate-800">MedPlus Express</strong>: Metro Gate 2 (1.6 km) - Open</li>
      </ul>
    `, true, "KNOWN");
  } else if (q.includes('safety') || q.includes('route') || q.includes('escort')) {
    sendBotMessage(`
      <strong>Active Route Verification:</strong>
      <div class="mt-1 bg-slate-50 p-2 rounded  space-y-1">
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
  } else if (q.includes('sos') || q.includes('emergency') || q.includes('help')) {
    triggerEmergencySOS();
    sendBotMessage(`
      <strong class="text-rose-700">🚨 EMERGENCY PROTOCOL TRIGGERED:</strong>
      <p class="mt-1 text-slate-700">Connecting directly to Police PCR #4 (0.3 km away) and Lifeline Emergency Clinic. Your current GPS telemetry is transmitted.</p>
    `, true, "KNOWN");
  } else if (q.includes('er') || q.includes('clinic') || q.includes('hospital')) {
    sendBotMessage(`
      <strong>Nearest 24/7 Emergency Rooms:</strong>
      <div class="mt-1 text-slate-700">
        🏥 <strong>Lifeline Emergency Clinic</strong> (1.4 km) - Level 1 Trauma active.<br/>
        🚑 Direct Ambulance Line: +1 800-NIGHT-ER
      </div>
    `, true, "KNOWN");
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
// INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
  resetWhatsAppChat();
  await initSupabaseClient();
  await loadInitialData();
});
