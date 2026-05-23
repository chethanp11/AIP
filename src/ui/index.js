/**
 * AIM Intelligence Platform Shell Controller
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
});

// ==========================================================================
// 🔑 CENTRAL AUTHENTICATION CONTROL CONSOLE (ANALYST LOGIN)
// ==========================================================================
function setupAuthHandler() {
  const loginForm = document.getElementById('login-form');
  const loginScreen = document.getElementById('auth-login-screen');
  const mainAppShell = document.getElementById('main-app-shell');
  const loginErrorMsg = document.getElementById('login-error-msg');
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

  function checkAuthStatus() {
    const key = localStorage.getItem('AIP_API_KEY') || '';
    if (key.startsWith('AIP-')) {
      if (loginScreen) loginScreen.classList.add('hide');
      if (mainAppShell) mainAppShell.classList.remove('hide');
      if (lockOverlay) lockOverlay.classList.add('hide');
      
      refreshPlatformTelemetry();
      reloadActiveIframes();
    } else {
      if (loginScreen) loginScreen.classList.remove('hide');
      if (mainAppShell) mainAppShell.classList.add('hide');
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
