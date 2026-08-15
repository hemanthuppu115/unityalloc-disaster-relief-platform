/**
 * UnityAlloc — Smart Resource Allocation & Volunteer Coordination
 * JavaScript Application Controller (Vanilla ES6+)
 * Reactive REST Integration with Spring Boot (/api/v1/...) & Database
 */

const API_BASE_URL = '/api/v1';

// Standalone Fallback Seed Data (Ensures 100% smooth display on Vercel)
const MOCK_NEEDS_SEED = [
  { id: 106, title: "AIIMS Trauma Relief Shelter - Oxygen & Blood Supply", description: "Urgent request for 20 Type-D Oxygen Cylinders and 4 Units O-Negative Blood Packets for emergency victims.", category: "Medical", urgency: "CRITICAL", urgencyScore: 96, address: "AIIMS Trauma Wing, Ring Road, Delhi", latitude: 28.5672, longitude: 77.21, status: "PENDING", createdAt: new Date().toISOString() },
  { id: 107, title: "Fortis Emergency Care - 4 Units B-Positive Blood Needed", description: "Critical surgery in progress. Requesting B-Positive blood donors to report immediately to Blood Bank Wing B.", category: "Medical", urgency: "CRITICAL", urgencyScore: 95, address: "Fortis Escorts Heart Institute, Okhla Road, Delhi", latitude: 28.5421, longitude: 77.2643, status: "RESOLVED", createdAt: new Date().toISOString() },
  { id: 108, title: "Yamuna Bank Relief Camp - Clean Water & Rations", description: "Severe water contamination reported. Requesting 500L clean drinking water cans, ORS packets, and dry rations.", category: "Food & Water", urgency: "CRITICAL", urgencyScore: 91, address: "Yamuna Bank Metro Relief Ground, East Delhi", latitude: 28.6225, longitude: 77.2612, status: "PENDING", createdAt: new Date().toISOString() },
  { id: 109, title: "Grand Plaza Kitchen - 120 Fresh Surplus Meals Available", description: "120 freshly prepared rice & dal meal boxes available for immediate redistribution to nearby relief camps.", category: "Food & Water", urgency: "HIGH", urgencyScore: 88, address: "Grand Plaza Banquet Kitchen, Connaught Place, Delhi", latitude: 28.631, longitude: 77.219, status: "PENDING", createdAt: new Date().toISOString() },
  { id: 111, title: "Anand Vihar Transit Center - Waterproof Tarps & Blankets", description: "Over 150 displaced families awaiting shelter. Urgent requirement for heavy-duty plastic tarp sheets and thermal blankets.", category: "Shelter", urgency: "MEDIUM", urgencyScore: 82, address: "Anand Vihar ISBT Sector, Delhi", latitude: 28.6469, longitude: 77.3161, status: "PENDING", createdAt: new Date().toISOString() }
];

const MOCK_VOLUNTEERS_SEED = [
  { id: 16, name: "Ravi Kumar", phone: "+91 98765 43210", skills: "Medical Aid, First Aid, CPR, Trauma Support", latitude: 28.6139, longitude: 77.2090, isAvailable: true, activeTasksCount: 1, rating: 4.9 },
  { id: 17, name: "Ananya Sharma", phone: "+91 98123 45678", skills: "Food Distribution, Relief Supply Logistics, Shelter Management", latitude: 28.6225, longitude: 77.2612, isAvailable: true, activeTasksCount: 0, rating: 4.8 },
  { id: 18, name: "Vikram Singh", phone: "+91 98999 11223", skills: "Emergency Transport, Heavy Vehicle Driving, Search & Rescue, Logistics", latitude: 28.5693, longitude: 77.2427, isAvailable: true, activeTasksCount: 0, rating: 4.9 },
  { id: 19, name: "Priya Patel", phone: "+91 98450 67890", skills: "Pediatric Care, Nursing, Medical Aid, Elder Care", latitude: 28.5421, longitude: 77.2643, isAvailable: true, activeTasksCount: 0, rating: 4.7 }
];

const MOCK_INVENTORY_SEED = [
  { id: 1, name: "Type-D Oxygen Cylinders", quantity: 45, category: "Medical", unit: "Cylinders", status: "AVAILABLE" },
  { id: 2, name: "O-Negative Blood Packets", quantity: 12, category: "Medical", unit: "Units", status: "AVAILABLE" },
  { id: 3, name: "Emergency Food Ration Packs", quantity: 250, category: "Food Rations", unit: "Boxes", status: "AVAILABLE" },
  { id: 4, name: "Heavy-Duty Tarpaulins", quantity: 80, category: "Shelter", unit: "Sheets", status: "AVAILABLE" }
];

const MOCK_TASKS_SEED = [
  { id: 501, volunteerName: "Ravi Kumar", needTitle: "AIIMS Trauma Relief Shelter - Oxygen & Blood Supply", status: "EN_ROUTE", assignedAt: new Date().toISOString() }
];

const MOCK_SURVEYS_SEED = [
  { id: 1, responderName: "Field Team Bravo", locationText: "Mayur Vihar Sector 1", urgencyScore: 92, status: "PROCESSED", summary: "Flood damage recon survey completed." }
];

// Global Application State
let state = {
  needs: [],
  volunteers: [],
  surveys: [],
  inventory: [],
  tasks: [],
  activity: [],
  stats: {},
  activeFilter: 'ALL',
  searchQuery: '',
  selectedNeedId: null,
  pendingNeedPayload: null
};

// Generic Fetch Wrapper
async function fetchJson(endpoint, options = {}) {
  const token = localStorage.getItem('unityalloc_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json().catch(() => ({}));
  } catch (error) {
    console.warn(`API Call Notice [${endpoint}]:`, error.message);
    // Don't show toast for read GET requests on standalone hosting
    if (options.method && options.method !== 'GET') {
      showToast(error.message || 'Network operation failed', 'danger');
    }
    throw error;
  }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initUserSession();
  initKeyboardShortcuts();
  initLiveSync();
  loadAllData();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('unityalloc_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('unityalloc_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.innerHTML = theme === 'dark'
      ? '<i class="fa-solid fa-sun" style="color: var(--accent-amber);"></i> <span>Light Mode</span>'
      : '<i class="fa-solid fa-moon" style="color: var(--primary);"></i> <span>Dark Mode</span>';
  }
}

// Role & User Session Management
let currentActiveRole = localStorage.getItem('unityalloc_role') || 'DISPATCHER';

function initUserSession() {
  const savedUser = localStorage.getItem('unityalloc_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.role) {
        currentActiveRole = user.role.toUpperCase();
      }
      const displayEl = document.getElementById('user-name-display');
      if (displayEl) displayEl.textContent = `${user.name} (${currentActiveRole})`;
    } catch (e) {
      console.warn('Failed to parse user session');
    }
  }
  applyRoleDashboard(currentActiveRole);
}

function setRoleView(role) {
  loginAsDemo(role);
}

function loginAsDemo(role) {
  const roleUpper = (role || 'DISPATCHER').toUpperCase();
  let user;

  if (roleUpper === 'VOLUNTEER') {
    user = {
      id: 1,
      name: 'Ravi Kumar',
      email: 'ravi@resq.org',
      role: 'VOLUNTEER'
    };
  } else {
    user = {
      id: 99,
      name: 'NGO Lead Dispatcher',
      email: 'admin@resq.org',
      role: 'DISPATCHER'
    };
  }

  localStorage.setItem('unityalloc_user', JSON.stringify(user));
  localStorage.setItem('unityalloc_role', roleUpper);
  
  applyRoleDashboard(roleUpper);
  closeModal('auth-modal');
  showToast(`Signed in successfully as ${user.name} (${user.role})`, 'success');
  loadAllData();
}

function enterDashboard(role) {
  const roleUpper = (role || 'DISPATCHER').toUpperCase();
  loginAsDemo(roleUpper);
  const targetTab = roleUpper === 'VOLUNTEER' ? 'volunteer-portal' : 'command-center';
  switchTab(targetTab);
}

function switchLandingDemoTab(viewType) {
  const volunteerBtn = document.getElementById('demo-tab-volunteer');
  const dispatcherBtn = document.getElementById('demo-tab-dispatcher');
  const container = document.getElementById('demo-mockup-container');
  
  if (!container) return;

  if (viewType === 'volunteer') {
    if (volunteerBtn) { volunteerBtn.className = 'btn btn-sm btn-primary'; }
    if (dispatcherBtn) { dispatcherBtn.className = 'btn btn-sm btn-outline'; }
    container.innerHTML = `
      <div style="padding: 1.25rem;">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.25rem;">
          <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); text-align: center;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">Total Tasks</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">42</div>
          </div>
          <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); text-align: center;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">In Progress</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-amber);">8</div>
          </div>
          <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); text-align: center;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">Completed</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-emerald);">34</div>
          </div>
          <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); text-align: center;">
            <div style="font-size: 0.7rem; color: var(--text-muted);">Hours Contributed</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-cyan);">120</div>
          </div>
        </div>
        <div style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.6rem; color: var(--text-muted);">My Active Dispatches</div>
        <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.85rem; font-weight: 700;"><i class="fa-solid fa-truck-medical" style="color: var(--accent-emerald);"></i> AIIMS Trauma Relief Shelter</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Status: <strong style="color: var(--accent-cyan);">EN_ROUTE 🚚</strong> &bull; ETA 12 Mins</div>
          </div>
          <span class="badge badge-emerald">STEP 2 OF 4</span>
        </div>
        <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.85rem; font-weight: 700;"><i class="fa-solid fa-hand-holding-droplet" style="color: var(--primary);"></i> Yamuna Bank Water Distribution</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Status: <strong style="color: var(--accent-emerald);">ACCEPTED ✅</strong></div>
          </div>
          <span class="badge badge-high">ASSIGNED</span>
        </div>
      </div>`;
  } else {
    if (volunteerBtn) { volunteerBtn.className = 'btn btn-sm btn-outline'; }
    if (dispatcherBtn) { dispatcherBtn.className = 'btn btn-sm btn-primary'; }
    container.innerHTML = `
      <div style="padding: 1.25rem;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.25rem;">
          <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); text-align: center; border-left: 3px solid var(--accent-rose);">
            <div style="font-size: 0.7rem; color: var(--text-muted);">Critical Urgent Needs</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-rose);">24</div>
          </div>
          <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); text-align: center; border-left: 3px solid var(--accent-amber);">
            <div style="font-size: 0.7rem; color: var(--text-muted);">Active Field Units</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-amber);">18</div>
          </div>
          <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); text-align: center; border-left: 3px solid var(--accent-emerald);">
            <div style="font-size: 0.7rem; color: var(--text-muted);">Standby Volunteers</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-emerald);">94</div>
          </div>
        </div>
        <div style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.6rem; color: var(--text-muted);">Real-Time Emergency Feed</div>
        <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.85rem; font-weight: 700;"><i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-rose);"></i> Flood Relief Shelter — Oxygen Deficit</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">AI Match Fit: <strong style="color: var(--accent-emerald);">98% (Ravi Kumar)</strong></div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="enterDashboard('DISPATCHER')">Auto-Dispatch</button>
        </div>
        <div class="glass" style="padding: 0.75rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.85rem; font-weight: 700;"><i class="fa-solid fa-boxes-stacked" style="color: var(--accent-amber);"></i> Relief Depot Stock Alert</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Type-D Oxygen Cylinders: <strong>14 Units Remaining</strong></div>
          </div>
          <span class="badge badge-amber">LOW STOCK</span>
        </div>
      </div>`;
  }
}

function updateLandingSimulator() {
  const skillSelect = document.getElementById('sim-skill-select');
  const distSlider = document.getElementById('sim-dist-slider');
  const distDisplay = document.getElementById('sim-dist-val');
  const matchScoreDisplay = document.getElementById('sim-match-score');
  const responseTimeDisplay = document.getElementById('sim-response-time');
  const taskTitleDisplay = document.getElementById('sim-task-title');

  if (!skillSelect || !distSlider) return;
  const dist = parseInt(distSlider.value || '5');
  if (distDisplay) distDisplay.textContent = `${dist} km`;

  const skill = skillSelect.value;
  let matchScore = 98 - Math.floor(dist * 0.8);
  if (matchScore < 72) matchScore = 72;

  let responseTime = 5 + Math.floor(dist * 1.5);

  let taskTitle = 'AIIMS Trauma Relief Center — Emergency Medical Dispatch';
  if (skill.includes('Food')) taskTitle = 'East Delhi Relief Shelter — Ration Box Distribution';
  else if (skill.includes('Rescue')) taskTitle = 'Yamuna Riverbank — Evacuation Logistics';
  else if (skill.includes('Survey')) taskTitle = 'Field Recon — Paper Survey Digitization & Need Ingestion';

  if (matchScoreDisplay) matchScoreDisplay.textContent = `${matchScore}%`;
  if (responseTimeDisplay) responseTimeDisplay.textContent = `${responseTime} mins`;
  if (taskTitleDisplay) taskTitleDisplay.textContent = taskTitle;
}

function applyRoleDashboard(role) {
  const normalizedRole = (role || 'DISPATCHER').toUpperCase();
  currentActiveRole = normalizedRole;

  // 1. Update User Badge Display
  const savedUser = localStorage.getItem('unityalloc_user');
  let userName = normalizedRole === 'VOLUNTEER' ? 'Ravi Kumar' : 'NGO Lead Dispatcher';
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      if (u.name) userName = u.name;
    } catch {}
  }

  const userBadge = document.getElementById('user-name-display');
  if (userBadge) {
    userBadge.textContent = `${userName} (${normalizedRole})`;
  }

  // 2. Filter Navigation Buttons with strict data-roles
  const navBtns = document.querySelectorAll('.nav-btn[data-roles]');
  navBtns.forEach(btn => {
    const rolesStr = btn.getAttribute('data-roles') || '';
    const allowedRoles = rolesStr.split(',').map(r => r.trim());
    if (allowedRoles.includes(normalizedRole)) {
      btn.style.display = 'inline-flex';
    } else {
      btn.style.display = 'none';
    }
  });

  // 3. Filter Header Action Buttons with data-roles
  const actionBtns = document.querySelectorAll('.header-actions [data-roles]');
  actionBtns.forEach(btn => {
    const rolesStr = btn.getAttribute('data-roles') || '';
    const allowedRoles = rolesStr.split(',').map(r => r.trim());
    if (allowedRoles.includes(normalizedRole)) {
      btn.style.display = 'inline-flex';
    } else {
      btn.style.display = 'none';
    }
  });

  // 4. Force Redirect to Role Dashboard if on restricted tab
  const activeSec = document.querySelector('.view-section.active');
  const currentTabId = activeSec ? activeSec.id : '';
  const hqTabs = ['command-center', 'smart-match', 'volunteer-hub', 'relief-inventory', 'active-tasks', 'analytics'];
  
  if (normalizedRole === 'VOLUNTEER' && hqTabs.includes(currentTabId)) {
    switchTab('volunteer-portal');
  } else if ((normalizedRole === 'DISPATCHER' || normalizedRole === 'ADMIN') && currentTabId === 'volunteer-portal') {
    switchTab('command-center');
  }
}

// Navigation Tab Switcher
function switchTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

  const targetBtn = document.querySelector(`.nav-btn[onclick="switchTab('${tabId}')"]`);
  const targetSec = document.getElementById(tabId);

  if (targetBtn) targetBtn.classList.add('active');
  if (targetSec) targetSec.classList.add('active');

  playChime('click');

  if (tabId === 'smart-match') {
    populateMatchNeedDropdown();
    runSmartMatching();
  } else if (tabId === 'gis-map') {
    setTimeout(renderGisMap, 100);
  } else if (tabId === 'analytics') {
    renderAnalyticsDashboard();
  } else if (tabId === 'volunteer-portal') {
    renderVolunteerPortal();
  }
}

// Data Fetcher
async function loadAllData() {
  try {
    const [needs, volunteers, surveys, inventory, tasks, stats] = await Promise.all([
      fetchJson('/needs').catch(() => MOCK_NEEDS_SEED),
      fetchJson('/volunteers').catch(() => MOCK_VOLUNTEERS_SEED),
      fetchJson('/surveys').catch(() => MOCK_SURVEYS_SEED),
      fetchJson('/inventory').catch(() => MOCK_INVENTORY_SEED),
      fetchJson('/tasks').catch(() => MOCK_TASKS_SEED),
      fetchJson('/stats').catch(() => ({}))
    ]);

    state.needs = (needs && needs.length) ? needs : MOCK_NEEDS_SEED;
    state.volunteers = (volunteers && volunteers.length) ? volunteers : MOCK_VOLUNTEERS_SEED;
    state.surveys = (surveys && surveys.length) ? surveys : MOCK_SURVEYS_SEED;
    state.inventory = (inventory && inventory.length) ? inventory : MOCK_INVENTORY_SEED;
    state.tasks = (tasks && tasks.length) ? tasks : MOCK_TASKS_SEED;
    state.stats = stats || {};

    updateStats();
    renderNeedsGrid();
    renderSurveysTable();
    renderVolunteersGrid();
    renderInventoryTable();
    renderActiveTasksTable();
    renderVolunteerPortal();
    applyRoleAccessibility();
    populateMatchNeedDropdown();
    loadActivityLogs();
  } catch (err) {
    console.warn('Fallback initialization:', err);
    state.needs = MOCK_NEEDS_SEED;
    state.volunteers = MOCK_VOLUNTEERS_SEED;
    state.surveys = MOCK_SURVEYS_SEED;
    state.inventory = MOCK_INVENTORY_SEED;
    state.tasks = MOCK_TASKS_SEED;

    updateStats();
    renderNeedsGrid();
    renderSurveysTable();
    renderVolunteersGrid();
    renderInventoryTable();
    renderActiveTasksTable();
    renderVolunteerPortal();
    applyRoleAccessibility();
    populateMatchNeedDropdown();
  }
}

// Statistics Overview Updater with Animated Number Transitions
function updateStats() {
  const activeNeeds = state.needs.filter(n => n.status !== 'RESOLVED');
  const criticalCount = activeNeeds.filter(n => n.urgency === 'CRITICAL').length;
  const unassignedCount = activeNeeds.filter(n => n.status === 'PENDING' || n.status === 'VERIFIED' || !n.status).length;
  const activeVols = state.volunteers.filter(v => v.isAvailable !== false).length;
  const activeDispatches = state.tasks.filter(t => t.status !== 'COMPLETED').length;
  const totalStockQuantity = state.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

  animateCounter('stat-critical-needs', criticalCount);
  animateCounter('stat-unassigned-needs', unassignedCount);
  animateCounter('stat-active-volunteers', activeVols);
  animateCounter('stat-active-dispatches', activeDispatches);
  animateCounter('stat-inventory-items', totalStockQuantity);
}

function animateCounter(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const startValue = parseInt(el.textContent) || 0;
  if (startValue === targetValue) {
    el.textContent = targetValue;
    return;
  }

  const duration = 400;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
    el.textContent = currentValue;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = targetValue;
    }
  }

  requestAnimationFrame(step);
}

// Real-Time Activity Feed Loader
async function loadActivityLogs() {
  const container = document.getElementById('activity-feed-container');
  if (!container) return;

  try {
    const logs = await fetchJson('/activity').catch(() => []);
    state.activity = logs || [];

    if (state.activity.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">No recent activity logs recorded.</div>`;
      return;
    }

    container.innerHTML = state.activity.map(log => {
      let iconClass = 'fa-info-circle';
      let iconColor = 'var(--accent-cyan)';
      if (log.type === 'NEED_CREATED') { iconClass = 'fa-triangle-exclamation'; iconColor = 'var(--accent-rose)'; }
      else if (log.type === 'VOLUNTEER_DISPATCHED') { iconClass = 'fa-paper-plane'; iconColor = 'var(--primary)'; }
      else if (log.type === 'TASK_COMPLETED') { iconClass = 'fa-circle-check'; iconColor = 'var(--accent-emerald)'; }
      else if (log.type === 'SURVEY_CONVERTED') { iconClass = 'fa-file-signature'; iconColor = 'var(--accent-amber)'; }

      const timeAgo = formatTimeAgo(log.timestamp);

      return `
        <div class="activity-item">
          <i class="fa-solid ${iconClass}" style="color: ${iconColor}; font-size: 1rem;"></i>
          <div style="flex: 1;">
            <div>${escapeHtml(log.description)}</div>
          </div>
          <span class="mono" style="font-size: 0.75rem; color: var(--text-muted);">${timeAgo}</span>
        </div>
      `;
    }).join('');
  } catch {
    container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">Activity log feed updated.</div>`;
  }
}

// --- VIEW 1: NEEDS GRID RENDERER ---
function renderNeedsGrid() {
  const container = document.getElementById('needs-cards-container');
  if (!container) return;

  let filtered = state.needs;

  if (state.activeFilter !== 'ALL') {
    if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(state.activeFilter)) {
      filtered = filtered.filter(n => n.urgency === state.activeFilter);
    } else if (state.activeFilter === 'UNASSIGNED') {
      filtered = filtered.filter(n => n.status === 'PENDING' || n.status === 'VERIFIED' || !n.status || (n.status !== 'RESOLVED' && n.status !== 'IN_PROGRESS'));
    } else {
      filtered = filtered.filter(n => n.category === state.activeFilter);
    }
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(n => 
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.description && n.description.toLowerCase().includes(q)) ||
      (n.address && n.address.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <i class="fa-solid fa-circle-check" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent-emerald);"></i>
        <h3>No Emergency Needs Found</h3>
        <p>No active needs match the selected filter criteria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(need => {
    const urgencyScore = need.urgencyScore || 85;
    const urgencyClass = urgencyScore >= 90 ? 'badge-critical' : urgencyScore >= 75 ? 'badge-high' : urgencyScore >= 50 ? 'badge-medium' : 'badge-low';
    const fillGradient = urgencyScore >= 90 ? 'linear-gradient(90deg, #f43f5e, #ef4444)' : urgencyScore >= 75 ? 'linear-gradient(90deg, #f59e0b, #eab308)' : 'linear-gradient(90deg, #06b6d4, #10b981)';

    const isResolved = need.status === 'RESOLVED';
    const isInProgress = need.status === 'IN_PROGRESS';

    // Inventory Shortage Check for Need Category
    const matchingStock = state.inventory.filter(item => need.category && item.category && item.category.toLowerCase().includes(need.category.toLowerCase()));
    const totalStockAvailable = matchingStock.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const hasShortage = totalStockAvailable < 20;

    const titleHtml = highlightMatches(need.title, state.searchQuery);
    const descHtml = highlightMatches(need.description, state.searchQuery);
    const addrHtml = highlightMatches(need.address || 'Field Location', state.searchQuery);
    const addrText = need.address || 'Field Location';

    return `
      <div class="card glass">
        <div>
          <div class="card-header">
            <span class="badge ${urgencyClass}">${need.urgency || 'HIGH'}</span>
            <span class="mono" style="font-size: 0.75rem; color: var(--accent-cyan);">${need.category || 'General'}</span>
          </div>

          <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem; line-height: 1.3;">${titleHtml}</h3>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.75rem;">${descHtml}</p>

          <div class="click-copy-target" onclick="copyToClipboard('${escapeHtml(addrText)}', this)" style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;" title="Click to copy address">
            <i class="fa-solid fa-location-dot" style="color: var(--accent-rose);"></i> ${addrHtml}
          </div>

          ${hasShortage ? `<div style="margin-bottom: 0.75rem;"><span class="badge-shortage"><i class="fa-solid fa-boxes-packing"></i> Stock Shortage Alert (${totalStockAvailable} units left)</span></div>` : ''}

          <div class="urgency-bar-wrapper">
            <div class="urgency-meta">
              <span>Urgency Index</span>
              <span class="mono" style="font-weight: 700;">${urgencyScore} / 100</span>
            </div>
            <div class="urgency-bar">
              <div class="urgency-fill" style="width: ${urgencyScore}%; background: ${fillGradient};"></div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          ${!isResolved ? `
            <button class="btn btn-primary" style="flex: 1; font-size: 0.8rem;" onclick="triggerSmartMatchForNeed(${need.id})">
              <i class="fa-solid fa-bolt"></i> ${isInProgress ? 'Re-Assign' : 'Auto-Assign'}
            </button>
          ` : `<span class="badge badge-low" style="flex: 1; text-align: center; padding: 0.6rem;"><i class="fa-solid fa-check-double"></i> RESOLVED</span>`}
          <button class="btn btn-outline" style="font-size: 0.8rem;" onclick="openEditNeedModal(${need.id})" title="Edit Need">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-danger" style="font-size: 0.8rem;" onclick="deleteNeed(${need.id})" title="Delete Need">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function filterNeeds(filterKey, element) {
  state.activeFilter = filterKey;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (element) {
    element.classList.add('active');
  } else {
    const chipMatch = document.querySelector(`.chip[data-filter="${filterKey}"]`);
    if (chipMatch) chipMatch.classList.add('active');
  }
  renderNeedsGrid();
}

function filterNeedsFromStat(filterKey) {
  switchTab('command-center');
  filterNeeds(filterKey, null);

  const container = document.getElementById('needs-cards-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const label = filterKey === 'CRITICAL' ? 'Critical Needs' : filterKey === 'UNASSIGNED' ? 'Unassigned Needs' : filterKey;
  showToast(`Filtered dashboard to show ${label}`, 'info');
}

function handleNeedsSearch() {
  state.searchQuery = document.getElementById('needs-search-input').value;
  renderNeedsGrid();
}

// --- VIEW 2: PAPER SURVEYS TABLE RENDERER ---
function renderSurveysTable() {
  const tbody = document.getElementById('surveys-table-body');
  if (!tbody) return;

  if (state.surveys.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No paper surveys ingested yet. Click <strong>+ Scan Paper Survey</strong> to ingest.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.surveys.map(survey => {
    let parsed = survey.extractedJson;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { parsed = { location: 'Sector 4', category: 'General', urgency_score: 80, description: survey.extractedJson }; }
    }

    const isVerified = survey.verificationStatus === 'VERIFIED';
    const statusBadge = isVerified 
      ? '<span class="badge badge-low"><i class="fa-solid fa-check"></i> Verified</span>' 
      : '<span class="badge badge-high"><i class="fa-solid fa-clock"></i> Pending Review</span>';

    return `
      <tr>
        <td class="mono" style="font-size: 0.85rem; color: var(--primary);">${survey.surveyNumber || 'SRV-' + survey.id}</td>
        <td><strong>${escapeHtml(parsed?.location || 'Sector 4')}</strong></td>
        <td style="max-width: 320px; font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(parsed?.description || survey.notes || '')}</td>
        <td class="mono"><strong>${parsed?.urgency_score || 85}</strong> / 100</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${!isVerified ? `<button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="verifySurvey(${survey.id})"><i class="fa-solid fa-check-double"></i> Verify & Convert</button>` : `<span style="font-size: 0.8rem; color: var(--text-muted);">Converted</span>`}
            <button class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="deleteSurvey(${survey.id})" title="Delete Survey">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// --- VIEW 3: SMART MATCHING ENGINE & MATCH REASONING ---
function populateMatchNeedDropdown() {
  const select = document.getElementById('match-need-select');
  if (!select) return;

  if (state.needs.length === 0) {
    select.innerHTML = '<option value="">No community needs available</option>';
    return;
  }

  select.innerHTML = state.needs.map(n => `
    <option value="${n.id}" ${state.selectedNeedId === n.id ? 'selected' : ''}>
      [Urgency ${n.urgencyScore || 85}] ${escapeHtml(n.title)}
    </option>
  `).join('');

  if (!state.selectedNeedId && state.needs.length > 0) {
    state.selectedNeedId = state.needs[0].id;
  }
}

function triggerSmartMatchForNeed(needId) {
  state.selectedNeedId = needId;
  switchTab('smart-match');
}

async function runSmartMatching() {
  const select = document.getElementById('match-need-select');
  const tbody = document.getElementById('matching-results-body');
  if (!select || !tbody) return;

  const needId = select.value || state.selectedNeedId;
  if (!needId) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">Please select a community need to run matching.</td></tr>`;
    return;
  }

  try {
    const result = await fetchJson('/tasks/auto-assign', {
      method: 'POST',
      body: JSON.stringify({ needId: Number(needId), distanceWeight: 0.4, skillWeight: 0.4, urgencyWeight: 0.2 })
    });

    const ranked = result.rankedVolunteers || [];
    if (ranked.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No available volunteers found for dispatch.</td></tr>`;
      return;
    }

    tbody.innerHTML = ranked.map((item, idx) => {
      const vol = item.volunteer;
      const score = item.matchScore || 85;
      const dist = item.distanceKm || 1.5;
      const skillScore = item.skillScore || 90;
      const scoreColor = score >= 85 ? 'var(--accent-emerald)' : score >= 70 ? 'var(--accent-cyan)' : 'var(--accent-amber)';

      const isTopMatch = idx === 0;

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span class="mono" style="font-weight: 800; font-size: 1.1rem; color: var(--primary);">#${idx + 1}</span>
              <div>
                <strong>${escapeHtml(vol.name)}</strong> ${isTopMatch ? '<span class="badge badge-low" style="font-size: 0.65rem;">RECOMMENDED</span>' : ''}
                <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(vol.skills)}</div>
                <div style="font-size: 0.7rem; color: var(--accent-cyan); margin-top: 0.2rem;">
                  <i class="fa-solid fa-circle-info"></i> Reason: ${dist}km away (${item.proximityScore || 90}% dist fit) • ${skillScore}% skill match
                </div>
              </div>
            </div>
          </td>
          <td class="mono">${dist} km</td>
          <td><span class="badge badge-low">${skillScore}% Fit</span></td>
          <td>
            <span class="mono" style="font-size: 1.1rem; font-weight: 800; color: ${scoreColor};">${score}%</span>
          </td>
          <td>
            <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="dispatchTask(${needId}, ${vol.id}, ${score})">
              <i class="fa-solid fa-paper-plane"></i> Dispatch Volunteer
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--accent-rose);">Matching calculation failed. Check backend status.</td></tr>`;
  }
}

async function dispatchTask(needId, volunteerId, matchScore) {
  try {
    await fetchJson('/tasks/dispatch', {
      method: 'POST',
      body: JSON.stringify({ needId, volunteerId, matchScore, status: 'ACCEPTED' })
    });
    triggerCelebration();
    showToast('Volunteer dispatched successfully! Task status updated to ACCEPTED.', 'success');
    loadAllData();
  } catch (err) {
    showToast('Dispatch failed: ' + err.message, 'danger');
  }
}

// --- VIEW 4: VOLUNTEERS GRID RENDERER ---
function renderVolunteersGrid() {
  const container = document.getElementById('volunteers-grid-container');
  if (!container) return;

  if (state.volunteers.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No volunteers registered yet. Click <strong>+ Register Volunteer</strong> to add.</div>`;
    return;
  }

  container.innerHTML = state.volunteers.map(vol => `
    <div class="card glass">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="width: 48px; height: 48px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--primary), var(--accent-cyan)); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800;">
            ${vol.name ? vol.name.charAt(0).toUpperCase() : 'V'}
          </div>
          <div>
            <h3 style="font-size: 1.05rem;">${escapeHtml(vol.name)}</h3>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(vol.phone || '+91 98765 00000')}</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.35rem;">
          <button class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="openEditVolunteerModal(${vol.id})" title="Edit Volunteer">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="deleteVolunteer(${vol.id})" title="Delete Volunteer">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">SKILLS & SPECIALIZATIONS</div>
        <div style="font-size: 0.875rem; font-weight: 600;">${escapeHtml(vol.skills || 'General Assistance')}</div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
        <span class="badge ${vol.isAvailable !== false ? 'badge-low' : 'badge-high'}">${vol.isAvailable !== false ? 'AVAILABLE' : 'DISPATCHED'}</span>
        <span class="mono" style="font-size: 0.85rem; font-weight: 700; color: var(--accent-amber);"><i class="fa-solid fa-star"></i> ${vol.rating || '4.9'}</span>
      </div>
    </div>
  `).join('');
}

// --- VIEW 5: RELIEF INVENTORY TABLE RENDERER ---
function renderInventoryTable() {
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody) return;

  if (state.inventory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No inventory stock items recorded. Click <strong>+ Add Supply Item</strong> to add stock.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.inventory.map(item => {
    const isLowStock = (item.quantity || 0) <= (item.minThreshold || 10);
    const stockBadge = isLowStock
      ? `<span class="badge badge-critical"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock (${item.quantity})</span>`
      : `<span class="badge badge-low"><i class="fa-solid fa-box"></i> Adequate (${item.quantity})</span>`;

    return `
      <tr>
        <td><strong>${escapeHtml(item.itemName)}</strong></td>
        <td><span class="chip">${escapeHtml(item.category || 'Relief')}</span></td>
        <td class="mono">${stockBadge}</td>
        <td class="mono">${item.minThreshold || 10} ${escapeHtml(item.unit || 'Units')}</td>
        <td style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-solid fa-warehouse"></i> ${escapeHtml(item.location || 'Central Depot')}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="openEditInventoryModal(${item.id})" title="Edit Item">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="deleteInventoryItem(${item.id})" title="Delete Item">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// --- VIEW 6: ACTIVE TASKS TABLE & DISPATCH TIMELINE ---
function renderActiveTasksTable() {
  const tbody = document.getElementById('active-tasks-table-body');
  if (!tbody) return;

  if (state.tasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No active task dispatches found. Use Smart Match to dispatch tasks.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.tasks.map(task => {
    const isCompleted = task.status === 'COMPLETED';
    const status = task.status || 'ACCEPTED';

    let badgeClass = 'badge-high';
    if (status === 'COMPLETED') badgeClass = 'badge-low';
    else if (status === 'EN_ROUTE') badgeClass = 'badge-medium';
    else if (status === 'ON_SITE' || status === 'IN_PROGRESS') badgeClass = 'badge-high';

    return `
      <tr>
        <td class="mono" style="font-size: 0.85rem; color: var(--primary);">TASK-${task.id}</td>
        <td class="mono">NEED-${task.needId}</td>
        <td class="mono">VOL-${task.volunteerId}</td>
        <td class="mono"><strong>${task.matchScore || 85}%</strong></td>
        <td><span class="badge ${badgeClass}">${status}</span></td>
        <td>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            <button class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="openTimelineModal(${task.id})" title="View Dispatch Timeline">
              <i class="fa-solid fa-clock-rotate-left"></i> Timeline
            </button>
            ${!isCompleted ? `
              ${status === 'ACCEPTED' ? `<button class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="updateTaskStatus(${task.id}, 'EN_ROUTE')">En Route</button>` : ''}
              ${status === 'EN_ROUTE' ? `<button class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="updateTaskStatus(${task.id}, 'ON_SITE')">On Site</button>` : ''}
              ${status === 'ON_SITE' ? `<button class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="updateTaskStatus(${task.id}, 'IN_PROGRESS')">In Progress</button>` : ''}
              <button class="btn btn-primary" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" onclick="updateTaskStatus(${task.id}, 'COMPLETED')">
                <i class="fa-solid fa-check"></i> Complete
              </button>
            ` : `<span style="font-size: 0.8rem; color: var(--text-muted);">Resolved</span>`}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateTaskStatus(taskId, nextStatus) {
  try {
    await fetchJson(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus })
    });
    showToast(`Task status updated to ${nextStatus}!`, 'success');
    loadAllData();
  } catch (err) {
    showToast('Failed to update status: ' + err.message, 'danger');
  }
}

function openTimelineModal(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  const container = document.getElementById('timeline-modal-content');
  if (!task || !container) return;

  const isAccepted = !!task.acceptedAt || true;
  const isEnRoute = !!task.enRouteAt;
  const isOnSite = !!task.onSiteAt;
  const isInProgress = !!task.inProgressAt;
  const isCompleted = task.status === 'COMPLETED';

  container.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <div style="font-size: 0.9rem; color: var(--text-muted);">Task Assignment #${task.id} (Need #${task.needId} $\\leftrightarrow$ Vol #${task.volunteerId})</div>
      <div style="font-size: 1.1rem; font-weight: 700;">Current Mission Status: <span class="badge badge-low">${task.status}</span></div>
    </div>

    <div class="timeline-stepper">
      <div class="timeline-step ${isAccepted ? 'completed' : ''}">
        <div class="step-icon"><i class="fa-solid fa-paper-plane"></i></div>
        <div class="step-info">
          <div class="step-title">Dispatch Accepted</div>
          <div class="step-time">${task.acceptedAt ? formatTime(task.acceptedAt) : 'Logged on dispatch'}</div>
        </div>
      </div>

      <div class="timeline-step ${isEnRoute ? 'completed' : ''}">
        <div class="step-icon"><i class="fa-solid fa-truck-fast"></i></div>
        <div class="step-info">
          <div class="step-title">En Route to Disaster Location</div>
          <div class="step-time">${task.enRouteAt ? formatTime(task.enRouteAt) : 'Pending update'}</div>
        </div>
      </div>

      <div class="timeline-step ${isOnSite ? 'completed' : ''}">
        <div class="step-icon"><i class="fa-solid fa-location-dot"></i></div>
        <div class="step-info">
          <div class="step-title">Arrived On Site</div>
          <div class="step-time">${task.onSiteAt ? formatTime(task.onSiteAt) : 'Pending arrival'}</div>
        </div>
      </div>

      <div class="timeline-step ${isInProgress ? 'completed' : ''}">
        <div class="step-icon"><i class="fa-solid fa-hands-holding-circle"></i></div>
        <div class="step-info">
          <div class="step-title">Relief Operation In Progress</div>
          <div class="step-time">${task.inProgressAt ? formatTime(task.inProgressAt) : 'Pending operation'}</div>
        </div>
      </div>

      <div class="timeline-step ${isCompleted ? 'completed' : ''}">
        <div class="step-icon"><i class="fa-solid fa-circle-check"></i></div>
        <div class="step-info">
          <div class="step-title">Mission Completed & Need Resolved</div>
          <div class="step-time">${task.completedAt ? formatTime(task.completedAt) : 'Awaiting completion'}</div>
        </div>
      </div>
    </div>
  `;

  openModal('timeline-modal');
}

// --- FORM CREATE & DUPLICATE CHECK HANDLERS ---
async function handleCreateNeed(e) {
  e.preventDefault();
  const payload = {
    title: document.getElementById('need-title').value.trim(),
    category: document.getElementById('need-category').value,
    urgency: document.getElementById('need-urgency').value,
    address: document.getElementById('need-address').value.trim(),
    description: document.getElementById('need-description').value.trim(),
    urgencyScore: document.getElementById('need-urgency').value === 'CRITICAL' ? 95 : 80
  };

  // Duplicate Check
  try {
    const dupCheck = await fetchJson('/needs/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ title: payload.title, address: payload.address })
    });

    if (dupCheck.duplicateFound && dupCheck.existingNeed) {
      state.pendingNeedPayload = payload;
      const warnContainer = document.getElementById('duplicate-warning-content');
      if (warnContainer) {
        warnContainer.innerHTML = `
          <p style="margin-bottom: 0.75rem;">${dupCheck.message}</p>
          <div class="card glass" style="padding: 1rem; border-left: 3px solid var(--accent-amber);">
            <strong>${escapeHtml(dupCheck.existingNeed.title)}</strong>
            <div style="font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(dupCheck.existingNeed.address)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">Status: ${dupCheck.existingNeed.status}</div>
          </div>
        `;
      }
      openModal('duplicate-warning-modal');
      return;
    }
  } catch (err) {
    console.warn('Duplicate check skipped:', err);
  }

  await executeCreateNeed(payload);
}

async function confirmCreateNeedAnyway() {
  if (state.pendingNeedPayload) {
    closeModal('duplicate-warning-modal');
    await executeCreateNeed(state.pendingNeedPayload);
    state.pendingNeedPayload = null;
  }
}

async function executeCreateNeed(payload) {
  try {
    await fetchJson('/needs', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Emergency Community Need logged successfully!', 'success');
    closeModal('report-need-modal');
    loadAllData();
  } catch (err) {
    showToast('Failed to submit need: ' + err.message, 'danger');
  }
}

function openEditNeedModal(id) {
  const need = state.needs.find(n => n.id === id);
  if (!need) return;
  document.getElementById('edit-need-id').value = need.id;
  document.getElementById('edit-need-title').value = need.title || '';
  document.getElementById('edit-need-category').value = need.category || 'Medical';
  document.getElementById('edit-need-urgency').value = need.urgency || 'HIGH';
  document.getElementById('edit-need-address').value = need.address || '';
  document.getElementById('edit-need-description').value = need.description || '';
  openModal('edit-need-modal');
}

async function handleUpdateNeed(e) {
  e.preventDefault();
  const id = document.getElementById('edit-need-id').value;
  const payload = {
    title: document.getElementById('edit-need-title').value.trim(),
    category: document.getElementById('edit-need-category').value,
    urgency: document.getElementById('edit-need-urgency').value,
    address: document.getElementById('edit-need-address').value.trim(),
    description: document.getElementById('edit-need-description').value.trim(),
    urgencyScore: document.getElementById('edit-need-urgency').value === 'CRITICAL' ? 95 : 80
  };

  try {
    await fetchJson(`/needs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Community Emergency Need updated successfully!', 'success');
    closeModal('edit-need-modal');
    loadAllData();
  } catch (err) {
    showToast('Failed to update need: ' + err.message, 'danger');
  }
}

async function handleCreateSurvey(e) {
  e.preventDefault();
  const payload = {
    surveyorName: document.getElementById('surveyor-name').value.trim(),
    location: document.getElementById('survey-location').value.trim(),
    notes: document.getElementById('survey-notes').value.trim(),
    extractedJson: JSON.stringify({
      location: document.getElementById('survey-location').value.trim(),
      category: 'Medical',
      urgency_score: 92,
      description: document.getElementById('survey-notes').value.trim()
    })
  };

  try {
    await fetchJson('/surveys', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Paper survey scan ingested & digitized!', 'success');
    closeModal('scan-survey-modal');
    loadAllData();
  } catch (err) {
    showToast('Failed to ingest survey: ' + err.message, 'danger');
  }
}

async function handleCreateVolunteer(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('vol-name').value.trim(),
    phone: document.getElementById('vol-phone').value.trim(),
    skills: document.getElementById('vol-skills').value.trim(),
    isAvailable: true,
    rating: 4.9,
    latitude: 28.6139,
    longitude: 77.2090
  };

  try {
    await fetchJson('/volunteers', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Field Volunteer registered successfully!', 'success');
    closeModal('add-volunteer-modal');
    loadAllData();
  } catch (err) {
    showToast('Failed to register volunteer: ' + err.message, 'danger');
  }
}

function openEditVolunteerModal(id) {
  const vol = state.volunteers.find(v => v.id === id);
  if (!vol) return;
  document.getElementById('edit-vol-id').value = vol.id;
  document.getElementById('edit-vol-name').value = vol.name || '';
  document.getElementById('edit-vol-phone').value = vol.phone || '';
  document.getElementById('edit-vol-skills').value = vol.skills || '';
  openModal('edit-volunteer-modal');
}

async function handleUpdateVolunteer(e) {
  e.preventDefault();
  const id = document.getElementById('edit-vol-id').value;
  const payload = {
    name: document.getElementById('edit-vol-name').value.trim(),
    phone: document.getElementById('edit-vol-phone').value.trim(),
    skills: document.getElementById('edit-vol-skills').value.trim()
  };

  try {
    await fetchJson(`/volunteers/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Volunteer profile updated successfully!', 'success');
    closeModal('edit-volunteer-modal');
    loadAllData();
  } catch (err) {
    showToast('Failed to update volunteer: ' + err.message, 'danger');
  }
}

async function handleCreateInventory(e) {
  e.preventDefault();
  const payload = {
    itemName: document.getElementById('inv-name').value.trim(),
    category: document.getElementById('inv-category').value,
    quantity: Number(document.getElementById('inv-quantity').value),
    unit: document.getElementById('inv-unit').value.trim(),
    location: document.getElementById('inv-location').value.trim(),
    minThreshold: 15
  };

  try {
    await fetchJson('/inventory', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Relief stock item added to inventory!', 'success');
    closeModal('add-inventory-modal');
    loadAllData();
  } catch (err) {
    showToast('Failed to add inventory item: ' + err.message, 'danger');
  }
}

function openEditInventoryModal(id) {
  const item = state.inventory.find(i => i.id === id);
  if (!item) return;
  document.getElementById('edit-inv-id').value = item.id;
  document.getElementById('edit-inv-name').value = item.itemName || '';
  document.getElementById('edit-inv-category').value = item.category || 'Medical';
  document.getElementById('edit-inv-quantity').value = item.quantity || 0;
  document.getElementById('edit-inv-unit').value = item.unit || '';
  document.getElementById('edit-inv-location').value = item.location || '';
  openModal('edit-inventory-modal');
}

async function handleUpdateInventory(e) {
  e.preventDefault();
  const id = document.getElementById('edit-inv-id').value;
  const payload = {
    itemName: document.getElementById('edit-inv-name').value.trim(),
    category: document.getElementById('edit-inv-category').value,
    quantity: Number(document.getElementById('edit-inv-quantity').value),
    unit: document.getElementById('edit-inv-unit').value.trim(),
    location: document.getElementById('edit-inv-location').value.trim(),
    minThreshold: 15
  };

  try {
    await fetchJson(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Relief stock item updated successfully!', 'success');
    closeModal('edit-inventory-modal');
    loadAllData();
  } catch (err) {
    showToast('Failed to update stock item: ' + err.message, 'danger');
  }
}

async function verifySurvey(id) {
  try {
    const survey = state.surveys.find(s => s.id === id);
    await fetchJson(`/surveys/verify/${id}`, { method: 'POST', body: JSON.stringify({ status: 'VERIFIED' }) });
    
    if (survey) {
      let parsed = survey.extractedJson;
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch { parsed = {}; }
      }
      await fetchJson('/needs', {
        method: 'POST',
        body: JSON.stringify({
          title: `Survey Report [${survey.surveyNumber || 'SRV-' + survey.id}]: ${parsed.location || 'Field Loc'}`,
          category: parsed.category || 'Medical',
          urgency: 'CRITICAL',
          address: parsed.location || 'Sector Relief Ground',
          description: parsed.description || survey.notes || 'Converted from verified paper survey.',
          urgencyScore: parsed.urgency_score || 90
        })
      });
    }

    showToast('Survey verified & converted to active emergency need!', 'success');
    loadAllData();
  } catch (err) {
    showToast('Survey verification failed', 'danger');
  }
}

async function deleteNeed(id) {
  if (!confirm('Are you sure you want to delete this community need?')) return;
  try {
    await fetchJson(`/needs/${id}`, { method: 'DELETE' });
    showToast('Need deleted from registry.', 'success');
    loadAllData();
  } catch (err) {
    showToast('Failed to delete need', 'danger');
  }
}

async function deleteVolunteer(id) {
  if (!confirm('Delete this volunteer profile?')) return;
  try {
    await fetchJson(`/volunteers/${id}`, { method: 'DELETE' });
    showToast('Volunteer profile deleted.', 'success');
    loadAllData();
  } catch (err) {
    showToast('Failed to delete volunteer', 'danger');
  }
}

async function deleteSurvey(id) {
  if (!confirm('Delete this paper survey scan?')) return;
  try {
    await fetchJson(`/surveys/${id}`, { method: 'DELETE' });
    showToast('Paper survey scan deleted.', 'success');
    loadAllData();
  } catch (err) {
    showToast('Failed to delete survey', 'danger');
  }
}

async function deleteInventoryItem(id) {
  if (!confirm('Delete this item from relief stock?')) return;
  try {
    await fetchJson(`/inventory/${id}`, { method: 'DELETE' });
    showToast('Inventory item deleted', 'success');
    loadAllData();
  } catch (err) {
    showToast('Failed to delete inventory item', 'danger');
  }
}

// --- AUTH MODAL HANDLERS ---
function openAuthModal() {
  openModal('auth-modal');
}

function switchAuthTab(tab) {
  document.getElementById('auth-tab-signin').classList.toggle('active', tab === 'signin');
  document.getElementById('auth-tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('signin-form').style.display = tab === 'signin' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
}

async function handleSignIn(e) {
  e.preventDefault();
  const email = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value;

  try {
    const res = await fetchJson('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      localStorage.setItem('unityalloc_token', res.token);
      if (res.user) {
        localStorage.setItem('unityalloc_user', JSON.stringify(res.user));
        document.getElementById('user-name-display').textContent = `${res.user.name} (${res.user.role})`;
        applyRoleDashboard(res.user.role);
      }
      showToast('Sign in successful! Welcome to UnityAlloc.', 'success');
      closeModal('auth-modal');
    }
  } catch (err) {
    showToast('Sign in failed: ' + err.message, 'danger');
  }
}

async function handleSignUp(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('signup-name').value.trim(),
    email: document.getElementById('signup-email').value.trim(),
    password: document.getElementById('signup-password').value,
    role: document.getElementById('signup-role').value
  };

  try {
    const res = await fetchJson('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) {
      localStorage.setItem('unityalloc_token', res.token);
      if (res.user) {
        localStorage.setItem('unityalloc_user', JSON.stringify(res.user));
        document.getElementById('user-name-display').textContent = `${res.user.name} (${res.user.role})`;
        applyRoleDashboard(res.user.role);
      }
      showToast('Account registered successfully!', 'success');
      closeModal('auth-modal');
      loadAllData();
    }
  } catch (err) {
    showToast('Registration failed: ' + err.message, 'danger');
  }
}

// --- AI COPILOT DRAWER HANDLERS ---
function toggleAiChat() {
  const drawer = document.getElementById('ai-chat-drawer');
  if (drawer) {
    drawer.classList.toggle('active');
  }
}

async function handleSendAiMessage(e) {
  e.preventDefault();
  const input = document.getElementById('ai-chat-input');
  const msgContainer = document.getElementById('chat-messages-container');
  if (!input || !msgContainer || !input.value.trim()) return;

  const userText = input.value.trim();
  input.value = '';

  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.textContent = userText;
  msgContainer.appendChild(userBubble);
  msgContainer.scrollTop = msgContainer.scrollHeight;

  const botBubble = document.createElement('div');
  botBubble.className = 'chat-bubble bot';
  botBubble.textContent = 'Analyzing command system context...';
  msgContainer.appendChild(botBubble);
  msgContainer.scrollTop = msgContainer.scrollHeight;

  try {
    const res = await fetchJson('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: userText })
    });
    let replyHtml = (res.reply || 'No response received.').replace(/\n/g, '<br>');
    
    // Add interactive action buttons if query involves critical needs or auto matching
    if (userText.toLowerCase().includes('critical') || userText.toLowerCase().includes('need')) {
      replyHtml += `<div style="margin-top: 0.5rem;"><button class="btn btn-primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="switchTab('command-center'); filterNeeds('CRITICAL');"><i class="fa-solid fa-filter"></i> View Critical Needs</button></div>`;
    } else if (userText.toLowerCase().includes('match') || userText.toLowerCase().includes('volunteer')) {
      replyHtml += `<div style="margin-top: 0.5rem;"><button class="btn btn-primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="switchTab('smart-match');"><i class="fa-solid fa-brain"></i> Open Match Engine</button></div>`;
    }

    botBubble.innerHTML = replyHtml;
    msgContainer.scrollTop = msgContainer.scrollHeight;
  } catch (err) {
    botBubble.textContent = 'AI service response error. Try again.';
  }
}

// Modal Toggle Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function handleBackdropClick(event, modalId) {
  if (event.target && event.target.id === modalId) {
    closeModal(modalId);
  }
}

// Notification Toast Generator
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}" style="color: ${type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)'}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Helpers
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString();
  } catch {
    return String(isoStr);
  }
}

function formatTimeAgo(isoStr) {
  if (!isoStr) return 'Just now';
  try {
    const date = new Date(isoStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return 'Recently';
  }
}

// --- INTERACTIVE ENGINE MODULES ---

// 1. Global Keyboard Shortcuts Handler
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Esc key: Close open active modals or drawer
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
      const drawer = document.getElementById('ai-chat-drawer');
      if (drawer && drawer.classList.contains('active')) drawer.classList.remove('active');
      return;
    }

    // Question mark (?) key to view shortcuts modal
    if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      openModal('shortcuts-modal');
      return;
    }

    if (e.altKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'n') {
        e.preventDefault();
        openModal('report-need-modal');
      } else if (key === 'c') {
        e.preventDefault();
        toggleAiChat();
      } else if (key === 's') {
        e.preventDefault();
        openModal('scan-survey-modal');
      } else if (key === 'v') {
        e.preventDefault();
        openModal('register-volunteer-modal');
      } else if (key === 'r') {
        e.preventDefault();
        triggerManualSync();
      } else if (key === 'k') {
        e.preventDefault();
        openModal('shortcuts-modal');
      }
    }
  });
}

// 2. Interactive AI Copilot Quick Prompt Filler
function sendQuickPrompt(promptText) {
  const input = document.getElementById('ai-chat-input');
  if (!input) return;
  input.value = promptText;
  const form = input.closest('form');
  if (form) {
    const event = new Event('submit', { cancelable: true, bubbles: true });
    form.dispatchEvent(event);
  }
}

// 3. Click to Copy with Floating Toast Popover
function copyToClipboard(text, targetElement) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    if (targetElement) {
      const popover = document.createElement('div');
      popover.className = 'copy-toast-popover';
      popover.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      targetElement.style.position = 'relative';
      targetElement.appendChild(popover);
      setTimeout(() => popover.remove(), 1200);
    } else {
      showToast(`Copied to clipboard: "${text}"`, 'success');
    }
  }).catch(() => {
    showToast('Failed to copy text', 'danger');
  });
}

// 4. Real-Time Search Keyword Highlighting Helper
function highlightMatches(text, query) {
  if (!text) return '';
  if (!query || !query.trim()) return escapeHtml(text);

  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
}

// 5. Particle Celebration Sparkle Burst Effect
function triggerCelebration() {
  const canvas = document.getElementById('celebration-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  for (let i = 0; i < 45; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.6) * 14,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1
    });
  }

  let animationFrame;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeParticles = 0;

    particles.forEach(p => {
      if (p.alpha > 0.02) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.alpha *= 0.94;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        activeParticles++;
      }
    });

    if (activeParticles > 0) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  animate();
}

// 6. Interactive Live Auto-Sync Engine
let liveSyncTimer = null;
function initLiveSync() {
  if (liveSyncTimer) clearInterval(liveSyncTimer);
  // Auto refresh every 15 seconds
  liveSyncTimer = setInterval(() => {
    loadAllData();
  }, 15000);
}

function triggerManualSync() {
  const icon = document.getElementById('sync-icon');
  if (icon) icon.classList.add('spin-icon');

  loadAllData().then(() => {
    showToast('Dashboard data synchronized with server!', 'success');
  }).finally(() => {
    if (icon) {
      setTimeout(() => icon.classList.remove('spin-icon'), 800);
    }
  });
}

// --- ADVANCED ENTERPRISE MODULES ---

// 1. Live GIS Relief Map Renderer (Leaflet.js Integration)
let leafletMap = null;
let leafletMarkersGroup = null;

function renderGisMap() {
  const container = document.getElementById('leaflet-map-container');
  if (!container || typeof L === 'undefined') return;

  if (!leafletMap) {
    // Center map around Delhi NCR default coords
    leafletMap = L.map('leaflet-map-container').setView([28.6139, 77.2090], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | UnityAlloc GIS'
    }).addTo(leafletMap);
    leafletMarkersGroup = L.layerGroup().addTo(leafletMap);
  } else {
    leafletMap.invalidateSize();
    leafletMarkersGroup.clearLayers();
  }

  // Render Emergency Needs Pins (Red / Orange / Cyan)
  state.needs.forEach(need => {
    const lat = need.latitude || (28.6139 + (Math.random() - 0.5) * 0.08);
    const lng = need.longitude || (77.2090 + (Math.random() - 0.5) * 0.08);
    const isCrit = need.urgency === 'CRITICAL';
    const color = isCrit ? '#f43f5e' : need.urgency === 'HIGH' ? '#f59e0b' : '#06b6d4';

    const marker = L.circleMarker([lat, lng], {
      radius: isCrit ? 12 : 9,
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85
    });

    marker.bindPopup(`
      <div style="font-family: sans-serif; padding: 0.2rem;">
        <span class="badge ${isCrit ? 'badge-critical' : 'badge-high'}">${need.urgency || 'HIGH'}</span>
        <h4 style="margin: 0.4rem 0 0.2rem 0; font-size: 0.95rem;">${escapeHtml(need.title)}</h4>
        <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.4rem;">${escapeHtml(need.address || 'Field Location')}</div>
        <button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; width: 100%;" onclick="triggerSmartMatchForNeed(${need.id})">
          <i class="fa-solid fa-bolt"></i> Auto-Assign
        </button>
      </div>
    `);

    leafletMarkersGroup.addLayer(marker);
  });

  // Render Responders Pins (Green)
  state.volunteers.forEach(vol => {
    const lat = vol.latitude || (28.6139 + (Math.random() - 0.5) * 0.08);
    const lng = vol.longitude || (77.2090 + (Math.random() - 0.5) * 0.08);

    const marker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#10b981',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85
    });

    marker.bindPopup(`
      <div style="font-family: sans-serif; padding: 0.2rem;">
        <span class="badge badge-low"><i class="fa-solid fa-user"></i> Responder</span>
        <h4 style="margin: 0.4rem 0 0.2rem 0; font-size: 0.95rem;">${escapeHtml(vol.name)}</h4>
        <div style="font-size: 0.75rem; color: #64748b;">${escapeHtml(vol.skills)}</div>
        <div style="font-size: 0.75rem; color: #06b6d4; margin-top: 0.2rem;">${escapeHtml(vol.phone || '+91 98765 00000')}</div>
      </div>
    `);

    leafletMarkersGroup.addLayer(marker);
  });
}

// 2. Operational Analytics & Visual Insights Renderer
function renderAnalyticsDashboard() {
  const wUrgency = document.getElementById('urgency-analytics-widget');
  const wDispatch = document.getElementById('dispatch-analytics-widget');
  const wInventory = document.getElementById('inventory-analytics-widget');

  if (!wUrgency || !wDispatch || !wInventory) return;

  const totalNeeds = state.needs.length || 1;
  const critCount = state.needs.filter(n => n.urgency === 'CRITICAL').length;
  const highCount = state.needs.filter(n => n.urgency === 'HIGH').length;
  const medCount = state.needs.filter(n => n.urgency === 'MEDIUM').length;
  const lowCount = state.needs.filter(n => n.urgency === 'LOW' || !n.urgency).length;

  wUrgency.innerHTML = `
    <div class="analytics-bar-item">
      <div class="analytics-bar-label"><span>Critical Needs (${critCount})</span><span>${Math.round((critCount/totalNeeds)*100)}%</span></div>
      <div class="analytics-progress-track"><div class="analytics-progress-fill" style="width: ${(critCount/totalNeeds)*100}%; background: var(--accent-rose);"></div></div>
    </div>
    <div class="analytics-bar-item">
      <div class="analytics-bar-label"><span>High Urgency (${highCount})</span><span>${Math.round((highCount/totalNeeds)*100)}%</span></div>
      <div class="analytics-progress-track"><div class="analytics-progress-fill" style="width: ${(highCount/totalNeeds)*100}%; background: var(--accent-amber);"></div></div>
    </div>
    <div class="analytics-bar-item">
      <div class="analytics-bar-label"><span>Medium Urgency (${medCount})</span><span>${Math.round((medCount/totalNeeds)*100)}%</span></div>
      <div class="analytics-progress-track"><div class="analytics-progress-fill" style="width: ${(medCount/totalNeeds)*100}%; background: var(--accent-cyan);"></div></div>
    </div>
    <div class="analytics-bar-item">
      <div class="analytics-bar-label"><span>Low Urgency (${lowCount})</span><span>${Math.round((lowCount/totalNeeds)*100)}%</span></div>
      <div class="analytics-progress-track"><div class="analytics-progress-fill" style="width: ${(lowCount/totalNeeds)*100}%; background: var(--accent-emerald);"></div></div>
    </div>
  `;

  const totalTasks = state.tasks.length || 1;
  const pendingT = state.tasks.filter(t => t.status === 'PENDING' || t.status === 'ACCEPTED').length;
  const inProgT = state.tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'EN_ROUTE' || t.status === 'ON_SITE').length;
  const compT = state.tasks.filter(t => t.status === 'COMPLETED').length;

  wDispatch.innerHTML = `
    <div class="analytics-bar-item">
      <div class="analytics-bar-label"><span>Pending / Accepted (${pendingT})</span><span>${Math.round((pendingT/totalTasks)*100)}%</span></div>
      <div class="analytics-progress-track"><div class="analytics-progress-fill" style="width: ${(pendingT/totalTasks)*100}%; background: var(--primary);"></div></div>
    </div>
    <div class="analytics-bar-item">
      <div class="analytics-bar-label"><span>Field Responders En Route (${inProgT})</span><span>${Math.round((inProgT/totalTasks)*100)}%</span></div>
      <div class="analytics-progress-track"><div class="analytics-progress-fill" style="width: ${(inProgT/totalTasks)*100}%; background: var(--accent-cyan);"></div></div>
    </div>
    <div class="analytics-bar-item">
      <div class="analytics-bar-label"><span>Dispatches Completed (${compT})</span><span>${Math.round((compT/totalTasks)*100)}%</span></div>
      <div class="analytics-progress-track"><div class="analytics-progress-fill" style="width: ${(compT/totalTasks)*100}%; background: var(--accent-emerald);"></div></div>
    </div>
  `;

  if (state.inventory.length === 0) {
    wInventory.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">No inventory stock recorded yet.</div>`;
  } else {
    wInventory.innerHTML = state.inventory.slice(0, 4).map(item => {
      const maxQty = Math.max(item.quantity * 1.5, 100);
      const pct = Math.min(Math.round((item.quantity / maxQty) * 100), 100);
      const isLow = item.quantity < (item.minThreshold || 20);
      return `
        <div class="analytics-bar-item">
          <div class="analytics-bar-label"><span>${escapeHtml(item.itemName)}</span><span class="mono">${item.quantity} ${escapeHtml(item.unit || 'units')}</span></div>
          <div class="analytics-progress-track"><div class="analytics-progress-fill" style="width: ${pct}%; background: ${isLow ? 'var(--accent-rose)' : 'var(--accent-emerald)'};"></div></div>
        </div>
      `;
    }).join('');
  }
}

// 3. One-Click Field Manifest & CSV Export Engine (Blob-Based)
function exportNeedsCsv() {
  if (!state.needs || state.needs.length === 0) {
    showToast('No emergency needs data available to export', 'danger');
    return;
  }
  let csv = "Need_ID,Title,Category,Urgency,Urgency_Score,Address,Status,Description,Created_At\n";
  state.needs.forEach(n => {
    csv += `"${n.id}","${(n.title||'').replace(/"/g, '""')}","${n.category||''}","${n.urgency||''}","${n.urgencyScore||85}","${(n.address||'').replace(/"/g, '""')}","${n.status||''}","${(n.description||'').replace(/"/g, '""')}","${n.createdAt||''}"\n`;
  });
  triggerCsvDownload(csv, `UnityAlloc_Needs_Report_${new Date().toISOString().slice(0,10)}.csv`);
  playChime('success');
  showToast('Emergency Needs CSV exported successfully!', 'success');
}

function exportDispatchesCsv() {
  if (!state.tasks || state.tasks.length === 0) {
    // If no active dispatches exist yet, fallback to exporting Emergency Needs CSV!
    exportNeedsCsv();
    return;
  }

  let csv = "Dispatch_ID,Need_ID,Volunteer_ID,Match_Score,Status,Assigned_Timestamp\n";
  state.tasks.forEach(t => {
    csv += `"${t.id}","${t.needId}","${t.volunteerId}","${t.matchScore || 85}","${t.status}","${t.assignedAt || ''}"\n`;
  });

  triggerCsvDownload(csv, `UnityAlloc_Dispatches_Report_${new Date().toISOString().slice(0,10)}.csv`);
  playChime('success');
  showToast('Dispatches CSV report downloaded!', 'success');
}

function exportInventoryCsv() {
  if (!state.inventory || state.inventory.length === 0) {
    showToast('No inventory stock available for CSV export', 'danger');
    return;
  }

  let csv = "Item_ID,Item_Name,Category,Quantity,Unit,Depot_Location\n";
  state.inventory.forEach(i => {
    csv += `"${i.id}","${(i.itemName||'').replace(/"/g, '""')}","${i.category||''}","${i.quantity||0}","${i.unit||''}","${(i.location||'').replace(/"/g, '""')}"\n`;
  });

  triggerCsvDownload(csv, `UnityAlloc_Inventory_Report_${new Date().toISOString().slice(0,10)}.csv`);
  playChime('success');
  showToast('Inventory Stock CSV report downloaded!', 'success');
}

function exportVolunteersCsv() {
  if (!state.volunteers || state.volunteers.length === 0) {
    showToast('No volunteer data available for CSV export', 'danger');
    return;
  }

  let csv = "Volunteer_ID,Name,Phone,Skills,Availability,Rating\n";
  state.volunteers.forEach(v => {
    csv += `"${v.id}","${(v.name||'').replace(/"/g, '""')}","${v.phone||''}","${(v.skills||'').replace(/"/g, '""')}","${v.isAvailable ? 'Available' : 'Busy'}","${v.rating||5.0}"\n`;
  });

  triggerCsvDownload(csv, `UnityAlloc_Volunteers_Report_${new Date().toISOString().slice(0,10)}.csv`);
  playChime('success');
  showToast('Volunteers CSV report downloaded!', 'success');
}

function triggerCsvDownload(csvString, fileName) {
  try {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error('CSV Download Failed:', e);
    showToast('CSV Export failed. Check browser download permissions.', 'danger');
  }
}

// 4. Web Audio API Operational Sound Synthesizer
let audioContext = null;
let audioEnabled = localStorage.getItem('unityalloc_audio') !== 'false';

function toggleAudioChimes() {
  audioEnabled = !audioEnabled;
  localStorage.setItem('unityalloc_audio', audioEnabled);
  const btnIcon = document.getElementById('audio-icon');
  if (btnIcon) {
    btnIcon.className = audioEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    btnIcon.style.color = audioEnabled ? 'var(--primary)' : 'var(--text-muted)';
  }
  showToast(`Operational Audio Chimes ${audioEnabled ? 'Enabled' : 'Muted'}`, 'info');
  if (audioEnabled) playChime('click');
}

function playChime(type = 'click') {
  if (!audioEnabled) return;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);

    const now = audioContext.currentTime;
    if (type === 'click') {
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'alert') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    // Silent fail if Web Audio not supported
  }
}

// 5. AI Copilot Speech Recognition (Web Speech API)
let speechRecognition = null;
let isRecordingSpeech = false;

function toggleSpeechRecognition() {
  const input = document.getElementById('ai-chat-input');
  const micBtn = document.getElementById('mic-btn');
  const micIcon = document.getElementById('mic-icon');
  if (!input || !micBtn) return;

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    showToast('Speech Recognition API is not supported in your browser.', 'danger');
    return;
  }

  if (isRecordingSpeech && speechRecognition) {
    speechRecognition.stop();
    return;
  }

  speechRecognition = new SpeechRec();
  speechRecognition.continuous = false;
  speechRecognition.interimResults = false;
  speechRecognition.lang = 'en-US';

  speechRecognition.onstart = () => {
    isRecordingSpeech = true;
    micBtn.classList.add('mic-recording');
    input.placeholder = 'Listening... Speak now...';
    showToast('Voice dictation active. Speak your command...', 'info');
  };

  speechRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
    showToast(`Voice transcribed: "${transcript}"`, 'success');
  };

  speechRecognition.onerror = (event) => {
    showToast('Speech recognition error: ' + event.error, 'danger');
  };

  speechRecognition.onend = () => {
    isRecordingSpeech = false;
    micBtn.classList.remove('mic-recording');
    input.placeholder = 'Ask AI Copilot or dictate voice input...';
  };

  speechRecognition.start();
}

// 6. Dynamic Role-Based Accessibility Controller
function applyRoleAccessibility() {
  applyRoleDashboard(currentActiveRole);
}

// 7. Field Volunteer Responder Portal Renderer
function renderVolunteerPortal() {
  const taskContainer = document.getElementById('volunteer-assigned-tasks-container');
  const needsContainer = document.getElementById('volunteer-nearby-needs-container');

  if (!taskContainer || !needsContainer) return;

  const savedUser = localStorage.getItem('unityalloc_user');
  let currentUserId = null;
  if (savedUser) {
    try { currentUserId = JSON.parse(savedUser).id; } catch {}
  }

  // Filter tasks for current user or fallback to active dispatches for demo
  let assignedTasks = state.tasks.filter(t => currentUserId ? t.volunteerId === currentUserId : true);
  if (assignedTasks.length === 0 && state.tasks.length > 0) {
    assignedTasks = state.tasks.slice(0, 2);
  }

  if (assignedTasks.length === 0) {
    taskContainer.innerHTML = `
      <div class="glass" style="padding: 2rem; text-align: center; border-radius: var(--radius-lg); color: var(--text-muted);">
        <i class="fa-solid fa-clipboard-check" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent-emerald);"></i>
        <h3>No Active Dispatches Assigned</h3>
        <p>You are currently standby for dispatch. You will receive real-time notifications when assigned to an emergency operation.</p>
      </div>
    `;
  } else {
    taskContainer.innerHTML = assignedTasks.map(task => {
      const need = state.needs.find(n => n.id === task.needId) || { title: 'Emergency Relief Dispatch #' + task.needId, address: 'Ring Road Sector 4', urgency: 'HIGH', category: 'Medical' };
      const currentStatus = (task.status || 'ACCEPTED').toUpperCase();

      return `
        <div class="volunteer-task-card glass">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div>
              <span class="badge ${need.urgency === 'CRITICAL' ? 'badge-critical' : 'badge-high'}">${need.urgency || 'HIGH'}</span>
              <span class="mono" style="font-size: 0.75rem; color: var(--accent-cyan); margin-left: 0.5rem;">Dispatch #${task.id}</span>
              <h3 style="margin-top: 0.5rem; font-size: 1.15rem;">${escapeHtml(need.title)}</h3>
            </div>
            <span class="badge badge-low" style="font-size: 0.8rem;">Status: ${currentStatus}</span>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            <i class="fa-solid fa-location-dot" style="color: var(--accent-rose);"></i> ${escapeHtml(need.address || 'Field Location')}
          </div>

          <div style="font-size: 0.85rem; margin-bottom: 1rem;">
            <strong style="color: var(--accent-amber);">Match Score:</strong> <span class="mono">${task.matchScore || 90}% Fit</span>
          </div>

          <!-- Status Stepper Control -->
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem;">Update Task Status:</div>
          <div class="status-step-bar">
            <button class="step-btn ${currentStatus === 'ACCEPTED' ? 'current' : 'completed'}" onclick="updateTaskStatus(${task.id}, 'ACCEPTED')">
              1. Accepted
            </button>
            <button class="step-btn ${currentStatus === 'EN_ROUTE' ? 'current' : currentStatus === 'ON_SITE' || currentStatus === 'COMPLETED' ? 'completed' : ''}" onclick="updateTaskStatus(${task.id}, 'EN_ROUTE')">
              2. En Route 🚚
            </button>
            <button class="step-btn ${currentStatus === 'ON_SITE' ? 'current' : currentStatus === 'COMPLETED' ? 'completed' : ''}" onclick="updateTaskStatus(${task.id}, 'ON_SITE')">
              3. On Site 📍
            </button>
            <button class="step-btn ${currentStatus === 'COMPLETED' ? 'current' : ''}" onclick="updateTaskStatus(${task.id}, 'COMPLETED')">
              4. Complete ✅
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Nearby Community Needs for Volunteers
  const activeNeeds = state.needs.filter(n => n.status !== 'RESOLVED').slice(0, 4);
  if (activeNeeds.length === 0) {
    needsContainer.innerHTML = `<div style="grid-column: 1/-1; color: var(--text-muted); padding: 1.5rem; text-align: center;">No nearby emergency needs reported.</div>`;
    return;
  }

  needsContainer.innerHTML = activeNeeds.map(need => `
    <div class="card glass">
      <div class="card-header">
        <span class="badge ${need.urgency === 'CRITICAL' ? 'badge-critical' : 'badge-high'}">${need.urgency || 'HIGH'}</span>
        <span class="mono" style="font-size: 0.75rem; color: var(--accent-cyan);">${need.category || 'General'}</span>
      </div>
      <h4 style="margin-bottom: 0.4rem;">${escapeHtml(need.title)}</h4>
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.75rem;">${escapeHtml(need.description)}</p>
      <div style="font-size: 0.8rem; color: var(--text-muted);">
        <i class="fa-solid fa-location-dot" style="color: var(--accent-rose);"></i> ${escapeHtml(need.address || 'Field Sector')}
      </div>
    </div>
  `).join('');
}

// Task Status Transition Updater
async function updateTaskStatus(taskId, newStatus) {
  try {
    await fetchJson(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    if (newStatus === 'COMPLETED') {
      triggerCelebration();
      playChime('success');
      showToast(`Dispatch #${taskId} completed successfully! Emergency need marked RESOLVED.`, 'success');
    } else {
      playChime('click');
      showToast(`Dispatch #${taskId} status updated to ${newStatus}`, 'info');
    }

    loadAllData();
  } catch (err) {
    showToast('Failed to update task status: ' + err.message, 'danger');
  }
}
