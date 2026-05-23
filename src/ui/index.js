/**
 * AIP Dynamic Shell Controller (Micro-Frontend Shell Platform)
 */

const API_BASE = '/api/v1';

// Authed Fetch Interceptor matching standard session storage
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
  const apiKey = localStorage.getItem('AIP_API_KEY') || '';
  if (url.includes('/api/v1')) {
    options.headers = options.headers || {};
    if (apiKey) {
      options.headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }
  const response = await originalFetch(url, options);
  if (response.status === 401 && !url.includes('/auth/login')) {
    localStorage.removeItem('AIP_API_KEY');
    setupAuthHandler();
  }
  return response;
};

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupAuthHandler();
  setupHeaderSearch();
  setupRegistryLogger();
});

// ==========================================================================
// 🔑 CENTRAL AUTHENTICATION CONTROL CONSOLE (ANALYST LOGIN)
// ==========================================================================
function setupAuthHandler() {
  const loginForm = document.getElementById('login-form');
  const loginScreen = document.getElementById('auth-login-screen');
  const mainAppShell = document.getElementById('main-app-shell');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const sidebarKeyInput = document.getElementById('api-key-input');
  const sidebarStatusIndicator = document.getElementById('api-key-status-indicator');
  const lockOverlay = document.getElementById('auth-lock-overlay');

  if (loginForm && !loginForm.dataset.listenerBound) {
    loginForm.dataset.listenerBound = 'true';
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value.trim();
      
      try {
        const res = await originalFetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success && data.token) {
          localStorage.setItem('AIP_API_KEY', data.token);
          loginErrorMsg.classList.add('hide');
          checkAuthStatus();
        } else {
          loginErrorMsg.innerText = data.error || 'Invalid credentials.';
          loginErrorMsg.classList.remove('hide');
        }
      } catch (err) {
        loginErrorMsg.innerText = `Authentication server offline: ${err.message}`;
        loginErrorMsg.classList.remove('hide');
      }
    });
  }

  // Handle sidebar API Key changes
  if (sidebarKeyInput && !sidebarKeyInput.dataset.listenerBound) {
    sidebarKeyInput.dataset.listenerBound = 'true';
    sidebarKeyInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val.startsWith('AIP-')) {
        localStorage.setItem('AIP_API_KEY', val);
        checkAuthStatus();
      }
    });
  }

  function checkAuthStatus() {
    const key = localStorage.getItem('AIP_API_KEY') || '';
    if (key.startsWith('AIP-')) {
      if (loginScreen) loginScreen.classList.add('hide');
      if (mainAppShell) mainAppShell.classList.remove('hide');
      if (lockOverlay) lockOverlay.classList.add('hide');
      
      if (sidebarKeyInput && sidebarKeyInput.value !== '•••••••••••••••••••••••••') {
        sidebarKeyInput.value = '•••••••••••••••••••••••••';
      }
      if (sidebarStatusIndicator) {
        sidebarStatusIndicator.innerText = "🟢 Connected (Analyst)";
        sidebarStatusIndicator.className = "api-key-status connected";
      }
      
      refreshPlatformTelemetry();
      reloadActiveIframes();
    } else {
      if (loginScreen) loginScreen.classList.remove('hide');
      if (mainAppShell) mainAppShell.classList.add('hide');
      if (sidebarStatusIndicator) {
        sidebarStatusIndicator.innerText = "🔴 Disconnected";
        sidebarStatusIndicator.className = "api-key-status disconnected";
      }
      if (sidebarKeyInput) sidebarKeyInput.value = '';
    }
  }

  checkAuthStatus();
}

// Force reload of active iframes when key state transitions (to fetch successfully)
function reloadActiveIframes() {
  document.querySelectorAll('iframe').forEach(iframe => {
    iframe.src = iframe.src;
  });
}

// ==========================================
// 🧭 DYNAMIC NAVIGATION CONTROLLER
// ==========================================
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.getAttribute('data-page');
      switchPage(pageId);
    });
  });
}

function switchPage(pageId) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (activeNav) activeNav.classList.add('active');

  document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
  const activePage = document.getElementById(`page-${pageId}`);
  if (activePage) activePage.classList.add('active');

  if (pageId === 'registry') {
    renderCapabilitiesRegistry();
  } else if (pageId === 'logs') {
    renderExecutionLogs();
  }
  
  refreshPlatformTelemetry();
}

window.switchPage = switchPage;

function switchSubProduct(suiteId, productId) {
  const tabsContainer = document.querySelector(`#page-${suiteId} .suite-tabs`);
  if (!tabsContainer) return;
  
  tabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const clickedBtn = Array.from(tabsContainer.querySelectorAll('.tab-btn'))
    .find(btn => btn.getAttribute('onclick').includes(`'${productId}'`));
  if (clickedBtn) clickedBtn.classList.add('active');

  document.querySelectorAll(`#page-${suiteId} .subproduct-panel`).forEach(panel => {
    panel.classList.remove('active');
  });
  
  const targetPanel = document.getElementById(`subproduct-${suiteId}-${productId}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
    // Force reload active panel iframe
    const iframe = targetPanel.querySelector('iframe');
    if (iframe) iframe.src = iframe.src;
  }
  
  refreshPlatformTelemetry();
}

window.switchSubProduct = switchSubProduct;

// ==========================================
// 🔎 HEADER GLOBAL SEARCH REDIRECTOR
// ==========================================
function setupHeaderSearch() {
  const globalInput = document.getElementById('global-search-input');
  const globalBtn = document.getElementById('global-search-btn');

  globalBtn.addEventListener('click', () => {
    const q = globalInput.value.trim();
    if (!q) return;
    
    // Switch to KMS page and pass query to embedded KMS iframe
    switchPage('kms');
    const kmsIframe = document.querySelector('#page-kms iframe');
    if (kmsIframe) {
      kmsIframe.src = `/ui/kms?q=${encodeURIComponent(q)}`;
    }
  });
}

// ==========================================
// 📊 CENTRAL TELEMETRY AUDITER
// ==========================================
async function refreshPlatformTelemetry() {
  const key = localStorage.getItem('AIP_API_KEY') || '';
  if (!key.startsWith('AIP-')) return;

  try {
    const capsRes = await fetch(`${API_BASE}/capabilities`);
    const caps = await capsRes.json();
    
    const logsRes = await fetch(`${API_BASE}/execution-logs`);
    const logs = await logsRes.json();
    
    const capsVal = document.getElementById('stats-caps-count');
    if (capsVal) capsVal.innerText = caps.length;
    
    const logsVal = document.getElementById('stats-logs-count');
    if (logsVal) logsVal.innerText = logs.length;
  } catch (error) {
    console.error("Telemetry query failed:", error);
  }
}

// ==========================================
// ⚙️ SHARED REGISTRY & SYSTEM TRACE LOGS
// ==========================================
function setupRegistryLogger() {
  const clearBtn = document.getElementById('clear-logs-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      await fetch(`${API_BASE}/execution-logs`, { method: 'DELETE' });
      renderExecutionLogs();
      refreshPlatformTelemetry();
    });
  }
}

async function renderCapabilitiesRegistry() {
  const table = document.getElementById('registry-table-body');
  table.innerHTML = '<tr><td colspan="3" style="text-align:center;">Loading capabilities registry...</td></tr>';
  
  try {
    const res = await fetch(`${API_BASE}/capabilities`);
    const data = await res.json();
    
    table.innerHTML = `
      <thead>
        <tr><th>Capability Name</th><th>Grounded Description</th><th>Input Schema Mapping</th></tr>
      </thead>
      <tbody>
        ${data.map(c => `
          <tr>
            <td><strong><code>${c.name}</code></strong></td>
            <td>${c.description}</td>
            <td><code style="font-size:10px;">${JSON.stringify(c.inputSchema)}</code></td>
          </tr>
        `).join('')}
      </tbody>
    `;
  } catch(err) {
    table.innerHTML = `<tr><td colspan="3" style="color:red;">Failed to retrieve registry: ${err.message}</td></tr>`;
  }
}

async function renderExecutionLogs() {
  const table = document.getElementById('logs-table-body');
  table.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading trace logs...</td></tr>';
  
  try {
    const res = await fetch(`${API_BASE}/execution-logs`);
    const data = await res.json();
    
    table.innerHTML = `
      <thead>
        <tr><th>Timestamp</th><th>Audited Agent</th><th>Invoked Capability</th><th>API Key</th><th>Duration</th><th>Outcome</th></tr>
      </thead>
      <tbody>
        ${data.map(l => `
          <tr>
            <td><span style="font-size:11px; color:var(--text-secondary);">${l.timestamp}</span></td>
            <td><span class="badge badge-completed">${l.agent}</span></td>
            <td><code>${l.capability}</code></td>
            <td><code>${l.apiKey}</code></td>
            <td>${l.durationMs}ms</td>
            <td><span style="color:${l.status === 'completed' ? 'green' : 'red'}; font-weight:600;">${l.status.toUpperCase()}</span></td>
          </tr>
        `).join('')}
      </tbody>
    `;
  } catch(err) {
    table.innerHTML = `<tr><td colspan="6" style="color:red;">Failed to retrieve trace logs: ${err.message}</td></tr>`;
  }
}
