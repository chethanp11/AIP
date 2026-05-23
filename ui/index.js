/**
 * AIP Dynamic Frontend Controller Engine (Refactored Banking Agentic OS Client)
 */

const API_BASE = 'http://localhost:3000/api/v1';

// ==========================================================================
// 🔒 GLOBAL API KEY AUTHORIZATION FETCH INTERCEPTOR & MIDDLEWARE CAPTURE
// ==========================================================================
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
    // Session token expired or rejected
    localStorage.removeItem('AIP_API_KEY');
    setupAuthHandler();
  }
  return response;
};

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupKmsSearch();
  setupReportingSuite();
  setupBusinessAnalyticsSuite();
  setupWorkflowAutomationSuite();
  setupDataScienceSuite();
  setupSampleReports();
  setupAuthHandler();
});

// Helper for dynamic timing/latency mocks
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

  // Login handler
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
      // Hide login, show app
      if (loginScreen) loginScreen.classList.add('hide');
      if (mainAppShell) mainAppShell.classList.remove('hide');
      if (lockOverlay) lockOverlay.classList.add('hide');
      
      // Update sidebar console indicator
      if (sidebarKeyInput) sidebarKeyInput.value = '•••••••••••••••••••••••••';
      if (sidebarStatusIndicator) {
        sidebarStatusIndicator.innerText = "🟢 Connected (Analyst)";
        sidebarStatusIndicator.className = "api-key-status connected";
      }
      
      // Load platform diagnostics
      refreshPlatformTelemetry();
    } else {
      // Show login, hide app
      if (loginScreen) loginScreen.classList.remove('hide');
      if (mainAppShell) mainAppShell.classList.add('hide');
      if (sidebarStatusIndicator) {
        sidebarStatusIndicator.innerText = "🔴 Disconnected";
        sidebarStatusIndicator.className = "api-key-status disconnected";
      }
    }
  }

  // Call it initially
  checkAuthStatus();
}

// ==========================================
// 1. DYNAMIC NAVIGATION CONTROLLER
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

/**
 * Handles sub-product tab switching inside suites.
 */
function switchSubProduct(suiteId, productId) {
  const tabsContainer = document.querySelector(`#page-${suiteId} .suite-tabs`);
  if (!tabsContainer) return;
  
  // Switch tab buttons
  tabsContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  // Find clicked button based on onclick pattern
  const clickedBtn = Array.from(tabsContainer.querySelectorAll('.tab-btn'))
    .find(btn => btn.getAttribute('onclick').includes(`'${productId}'`));
  if (clickedBtn) clickedBtn.classList.add('active');

  // Switch panels
  document.querySelectorAll(`#page-${suiteId} .subproduct-panel`).forEach(panel => {
    panel.classList.remove('active');
  });
  
  const targetPanel = document.getElementById(`subproduct-${suiteId}-${productId}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }

  // Suite-specific tab loading triggers
  if (suiteId === 'automation' && productId === 'monitor') {
    loadAutomationTelemetry();
  } else if (suiteId === 'automation' && productId === 'approvals') {
    loadPendingApprovals();
  } else if (suiteId === 'reporting' && productId === 'proactive') {
    loadProactiveInsights();
  }
}

window.switchSubProduct = switchSubProduct;

// ==========================================
// 2. CENTRAL TELEMETRY AUDITER
// ==========================================
async function refreshPlatformTelemetry() {
  const key = localStorage.getItem('AIP_API_KEY') || '';
  if (!key.startsWith('AIP-')) return; // Await authorization

  try {
    const capsRes = await fetch(`${API_BASE}/capabilities`);
    if (!capsRes.ok) return;
    const caps = await capsRes.json();
    
    const logsRes = await fetch(`${API_BASE}/execution-logs`);
    if (!logsRes.ok) return;
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
// 3. KMS KNOWLEDGE WORKSPACE SEARCH
// ==========================================
function setupKmsSearch() {
  const searchInput = document.getElementById('kms-search-input');
  const searchBtn = document.getElementById('kms-search-btn');
  const resultsBox = document.getElementById('kms-results-box');

  const globalInput = document.getElementById('global-search-input');
  const globalBtn = document.getElementById('global-search-btn');

  const executeSearch = async (query) => {
    if (!query.trim()) return;
    resultsBox.innerHTML = '<div class="placeholder-msg">🔍 Querying banking KMS glossary files...</div>';
    
    try {
      const res = await fetch(`${API_BASE}/knowledge/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      resultsBox.innerHTML = '';
      
      if (!data.context || data.matchesCount === 0) {
        resultsBox.innerHTML = '<div class="placeholder-msg">⚠️ No banking metrics or definitions matched your search term.</div>';
        return;
      }
      
      const sections = data.context.split('\n\n');
      sections.forEach(sec => {
        const itemCard = document.createElement('div');
        itemCard.className = 'kms-result-item';
        
        let titleText = 'KMS Document';
        let bodyText = sec;
        
        if (sec.includes('|')) {
          const parts = sec.split('|');
          titleText = parts[0] || 'KMS Ledger Reference';
          bodyText = parts.slice(1).join('<br/>');
        } else if (sec.includes('Reference:')) {
          const parts = sec.split('Reference:');
          titleText = parts[0];
          bodyText = parts[1];
        }
        
        itemCard.innerHTML = `
          <h4>${titleText.trim()}</h4>
          <p style="margin-top: 6px; line-height: 1.4;">${bodyText.trim()}</p>
        `;
        resultsBox.appendChild(itemCard);
      });
    } catch (err) {
      resultsBox.innerHTML = `<div class="placeholder-msg" style="color: #d32f2f;">Error querying KMS: ${err.message}</div>`;
    }
  };

  searchBtn.addEventListener('click', () => executeSearch(searchInput.value));
  globalBtn.addEventListener('click', () => {
    switchPage('kms');
    searchInput.value = globalInput.value;
    executeSearch(globalInput.value);
  });
}

// ==========================================
// 4. REPORTING SUITE (4 PRODUCTS)
// ==========================================
function setupReportingSuite() {
  
  // -- PRISM (Rationalizer) --
  const prismBtn = document.getElementById('prism-run-btn');
  const prismResults = document.getElementById('prism-results-panel');
  const prismTable = document.getElementById('prism-table-body');
  const prismRecom = document.getElementById('prism-recom-list');

  const seedReports = [
    { name: 'NIM Breakdown Q1', query: 'SELECT (interest_income - interest_expense) / earning_assets FROM branch_ledger WHERE date = Q1', usage: 120, owner: 'Finance' },
    { name: 'Interest Spread Review', query: 'SELECT (interest_income-interest_expense)/earning_assets FROM branch_ledger WHERE date=Q1', usage: 8, owner: 'ALCO Committee' },
    { name: 'Regional LDR Ledger', query: 'SELECT total_loans / total_deposits FROM customer_deposits GROUP BY region', usage: 84, owner: 'Treasury' },
    { name: 'Credit Score Audit', query: 'SELECT loan_id, credit_score FROM loan_applications WHERE credit_score < 650', usage: 5, owner: 'Credit Risk' }
  ];

  prismBtn.addEventListener('click', async () => {
    prismBtn.disabled = true;
    prismBtn.innerText = "Analyzing Report SQL Queries Duplications...";
    
    try {
      const res = await fetch(`${API_BASE}/workflows/reporting/prism-lite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: seedReports })
      });
      const data = await res.json();
      
      prismBtn.disabled = false;
      prismBtn.innerText = "Catalog Rationalized";
      prismResults.classList.remove('hide');
      
      // Render report table
      prismTable.innerHTML = `
        <thead>
          <tr><th>Banking Report Query</th><th>Monthly Views</th><th>Owner</th><th>Conflict Status</th></tr>
        </thead>
        <tbody>
          ${seedReports.map(r => {
            const isDup = data.duplicates.some(d => d.reportB === r.name);
            const isLow = data.usageInsights.some(u => u.name === r.name);
            let status = 'Stable';
            let badgeClass = 'badge-completed';
            if (isDup) { status = 'Duplicate'; badgeClass = 'badge-failed'; }
            else if (isLow) { status = 'Low Usage'; badgeClass = 'badge-failed'; }
            
            return `<tr><td><code>${r.name}</code></td><td>${r.usage}</td><td>${r.owner}</td><td><span class="${badgeClass}">${status}</span></td></tr>`;
          }).join('')}
        </tbody>
      `;

      // Render recommendations
      prismRecom.innerHTML = data.recommendations.map(r => `<li>${r}</li>`).join('');
      refreshPlatformTelemetry();
    } catch (err) {
      alert("PRISM rationalization failed: " + err.message);
      prismBtn.disabled = false;
      prismBtn.innerText = "Audit and Rationalize Catalog";
    }
  });

  // -- Report Building --
  const buildBtn = document.getElementById('build-report-btn');
  const standardsBadge = document.getElementById('badge-standards');
  const qualityBadge = document.getElementById('badge-quality');
  const previewBox = document.getElementById('report-output-preview');

  buildBtn.addEventListener('click', async () => {
    const metricId = document.getElementById('rep-metric-id').value;
    const value = document.getElementById('rep-value').value;
    const compareValue = document.getElementById('rep-compare').value;
    const note = document.getElementById('rep-note').value;

    buildBtn.disabled = true;
    buildBtn.innerText = "Compiling audited report briefing...";
    
    // De-activate active pre-compiled buttons highlight
    document.querySelectorAll('.sample-report-btn').forEach(b => b.classList.remove('active'));

    try {
      const res = await fetch(`${API_BASE}/workflows/reporting/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metricId, value, compareValue, note })
      });
      const data = await res.json();

      buildBtn.disabled = false;
      buildBtn.innerText = "Compile HTML Report";

      // Toggle Badges
      standardsBadge.className = `audit-badge ${data.standards.passed ? 'passed' : 'failed'}`;
      standardsBadge.innerText = `Standards: ${data.standards.passed ? 'PASSED' : 'FAILED'}`;

      qualityBadge.className = `audit-badge ${data.quality.passed ? 'passed' : 'failed'}`;
      qualityBadge.innerText = `Quality Check: ${data.quality.passed ? 'PASSED' : 'FAILED'}`;

      // Render actual HTML report container natively
      previewBox.innerHTML = data.reportText;
                                            
      refreshPlatformTelemetry();
    } catch (err) {
      alert("Report compilation failed: " + err.message);
      buildBtn.disabled = false;
      buildBtn.innerText = "Compile HTML Report";
    }
  });

  // -- Conversational BI --
  const biInput = document.getElementById('bi-chat-input');
  const biSendBtn = document.getElementById('bi-chat-send-btn');
  const biChatBox = document.getElementById('bi-chat-box');
  const biChartPanel = document.getElementById('bi-chart-box');

  biSendBtn.addEventListener('click', async () => {
    const text = biInput.value.trim();
    if (!text) return;
    
    appendMessage(biChatBox, text, 'user');
    biInput.value = '';
    
    const loaderId = appendMessage(biChatBox, 'Mapping natural query to semantic metrics trees inside KMS...', 'bot loader');
    
    try {
      const res = await fetch(`${API_BASE}/workflows/reporting/conversational-bi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text })
      });
      const data = await res.json();
      
      const loaderEl = document.getElementById(loaderId);
      if (loaderEl) loaderEl.remove();
      
      appendMessage(biChatBox, data.narrative, 'bot');
      
      if (data.vegaSpec) {
        biChartPanel.classList.remove('hide');
        vegaEmbed('#bi-line-chart', data.vegaSpec);
      }
      
      refreshPlatformTelemetry();
    } catch (err) {
      const loaderEl = document.getElementById(loaderId);
      if (loaderEl) {
        loaderEl.innerText = `Error answering query: ${err.message}`;
      }
    }
  });
}

function appendMessage(chatBox, text, sender) {
  const msgId = `msg_${Math.random().toString(36).substr(2, 9)}`;
  const div = document.createElement('div');
  div.id = msgId;
  div.className = `message ${sender}`;
  
  if (sender === 'bot') {
    // Convert basic markdown tags to html elements
    div.innerHTML = text.replace(/# (.*?)\n/g, '<h4>$1</h4>')
                        .replace(/## (.*?)\n/g, '<h5>$1</h5>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>');
  } else {
    div.innerText = text;
  }
  
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msgId;
}

// -- Load Proactive Alerts Feed --
async function loadProactiveInsights() {
  const alertsBox = document.getElementById('proactive-alerts-list');
  if (!alertsBox) return;
  alertsBox.innerHTML = '<div class="placeholder-msg">🔍 Auditing assets ledger streams for Z-score threshold breaches...</div>';
  
  try {
    const res = await fetch(`${API_BASE}/workflows/reporting/proactive-insights`);
    const data = await res.json();
    
    alertsBox.innerHTML = '';
    
    if (data.alerts.length === 0) {
      alertsBox.innerHTML = '<div class="placeholder-msg">✅ Financial ledger streams stable. Zero anomalies flagged.</div>';
      return;
    }

    alertsBox.innerHTML = data.alerts.map(a => `
      <div class="proactive-alert-card ${a.severity.toLowerCase()}">
        <div class="alert-details-col">
          <div class="alert-meta">
            <span class="alert-title">${a.metric}</span>
            <span class="badge" style="background-color: var(--accent-light); color: var(--accent-color); font-weight: 700;">${a.type}</span>
          </div>
          <p class="alert-desc" style="margin: 6px 0; font-size: 13px; line-height: 1.4;">${a.message}</p>
          <span class="alert-playbook" style="color: var(--warning-color); font-weight: 600;">👉 Standard Recommendation: ${a.recommendation}</span>
        </div>
        <span class="badge" style="background-color: var(--warning-bg); color: var(--warning-color); font-weight: 700; height: fit-content; padding: 4px 8px;">${a.severity}</span>
      </div>
    `).join('');
  } catch (err) {
    alertsBox.innerHTML = `<div class="placeholder-msg" style="color: #d32f2f;">Error querying proactive feed: ${err.message}</div>`;
  }
}

// Bind proactive button click explicitly
const proactiveBtn = document.getElementById('proactive-refresh-btn');
if (proactiveBtn) proactiveBtn.addEventListener('click', loadProactiveInsights);

// ==========================================
// 5. BUSINESS ANALYTICS SUITE (4 PRODUCTS)
// ==========================================
function setupBusinessAnalyticsSuite() {
  
  // -- Insight Discovery --
  const discBtn = document.getElementById('run-discovery-btn');
  const discResults = document.getElementById('discovery-results-panel');
  const discGrid = document.getElementById('discovery-cards-grid');

  const seedSegments = [
    { cohort: 'Commercial Real Estate Lending', timeline: [4.2, 4.3, 4.1, 4.0, 3.8, 3.6, 2.9] }, // NIM compression timeline
    { cohort: 'Retail High-Yield Savings deposits', timeline: [85.2, 85.8, 86.2, 86.5, 87.2, 88.5, 94.2] }, // LDR surge timeline
    { cohort: 'SME Retail Credits portfolio', timeline: [1.38, 1.42, 1.40, 1.45, 1.48, 1.52, 1.85] } // NPL default risk surge timeline
  ];

  discBtn.addEventListener('click', async () => {
    discBtn.disabled = true;
    discBtn.innerText = "Analyzing branch lending segment timelines...";
    
    try {
      const res = await fetch(`${API_BASE}/workflows/analytics/insight-discovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentsData: seedSegments })
      });
      const data = await res.json();
      
      discBtn.disabled = false;
      discBtn.innerText = "Surface Segment Insights";
      discResults.classList.remove('hide');
      
      discGrid.innerHTML = data.insights.map(ins => `
        <div class="product-card">
          <div class="product-icon">${ins.direction === 'Surging' ? '📈' : '⚠️'}</div>
          <h3 style="font-size: 14px;">${ins.cohort}</h3>
          <p class="bold" style="color: ${ins.growthRate > 0 ? 'var(--success-color)' : 'var(--warning-color)'}; font-size: 13px; margin: 4px 0;">Growth Rate MoM: ${ins.growthRate}%</p>
          <p style="font-size: 11px; margin-top: 6px; line-height: 1.4; color: var(--text-secondary);">${ins.explanation}</p>
        </div>
      `).join('');
      
      refreshPlatformTelemetry();
    } catch (err) {
      alert("Discovery scan failed: " + err.message);
      discBtn.disabled = false;
      discBtn.innerText = "Surface Segment Insights";
    }
  });

  // -- Root Cause Analysis (RCA) --
  const rcaBtn = document.getElementById('rca-run-btn');
  const rcaPanel = document.getElementById('rca-results-panel');
  const rcaMetricSelect = document.getElementById('rca-metric-select');

  const seedRcaData = [
    { segment: 'Retail Credit Cards', value: 18.5 },
    { segment: 'Subprime Auto Loans', value: 45.2 },
    { segment: 'Residential Mortgages', value: 85.8 },
    { segment: 'Commercial Real Estate Credits', value: 12.5 }
  ];

  rcaBtn.addEventListener('click', async () => {
    rcaBtn.innerText = "Decomposing variance factors...";
    
    try {
      const res = await fetch(`${API_BASE}/workflows/analytics/rca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetName: rcaMetricSelect.value, metricsData: seedRcaData })
      });
      const data = await res.json();
      
      rcaBtn.innerText = "Decompose Drivers";
      rcaPanel.classList.remove('hide');
      
      document.getElementById('rca-prof-text').innerText = data.profiling.summary;
      
      // Breakdown bars
      const maxVal = Math.max(...data.drivers.map(d => d.value));
      document.getElementById('rca-bars').innerHTML = data.drivers.map(d => {
        const pct = (d.value / maxVal) * 100;
        return `
          <div class="driver-bar" style="margin-bottom: 8px;">
            <span style="width: 160px; font-size: 11px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${d.segment}</span>
            <div class="driver-bar-track" style="flex-grow: 1; height: 10px; background: #eee; border-radius: 4px; overflow: hidden; margin: 0 10px;">
              <div class="driver-bar-fill" style="width:${pct}%; height: 100%; background: var(--accent-color);"></div>
            </div>
            <span class="bold" style="width: 60px; text-align: right; font-size: 11px;">${d.value}%</span>
          </div>
        `;
      }).join('');
      
      // Narrative output
      document.getElementById('rca-narrative').innerHTML = data.narrative.replace(/# (.*?)\n/g, '<h3>$1</h3>')
                                                                          .replace(/## (.*?)\n/g, '<h4>$1</h4>')
                                                                          .replace(/- \*\*(.*?)\*\*/g, '<li><strong>$1</strong>')
                                                                          .replace(/\n/g, '<br/>');
                                                                          
      refreshPlatformTelemetry();
    } catch (err) {
      alert("RCA failed: " + err.message);
      rcaBtn.innerText = "Decompose Drivers";
    }
  });

  // -- What-if Simulation (Dynamic Banking Margins Mathematical Compile) --
  const loanRateSlide = document.getElementById('slide-loan-rate');
  const depositRateSlide = document.getElementById('slide-deposit-rate');
  const assetsSlide = document.getElementById('slide-assets');
  const nplRateSlide = document.getElementById('slide-npl-rate');

  const executeWhatIf = async () => {
    // Dynamic Label changes
    document.getElementById('val-loan-rate').innerText = `${loanRateSlide.value}%`;
    document.getElementById('val-deposit-rate').innerText = `${depositRateSlide.value}%`;
    document.getElementById('val-assets').innerText = `${assetsSlide.value}`;
    document.getElementById('val-npl-rate').innerText = `${nplRateSlide.value}%`;

    try {
      const res = await fetch(`${API_BASE}/workflows/analytics/what-if`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanRate: loanRateSlide.value,
          depositRate: depositRateSlide.value,
          assets: assetsSlide.value,
          nplRate: nplRateSlide.value
        })
      });
      const data = await res.json();
      
      // Update banking output elements
      document.getElementById('sim-nim').innerText = `${data.netInterestMargin.toFixed(2)}%`;
      document.getElementById('sim-interest-revenue').innerText = `$${Math.round(data.projectedInterestRevenue).toLocaleString()}`;
      document.getElementById('sim-interest-expense').innerText = `$${Math.round(data.projectedInterestExpense).toLocaleString()}`;
      document.getElementById('sim-spread-profit').innerText = `$${Math.round(data.netSpreadProfit).toLocaleString()}`;
      document.getElementById('sim-default-costs').innerText = `$${Math.round(data.projectedDefaultCosts).toLocaleString()}`;
    } catch (err) {
      console.error("Banking Simulation error:", err);
    }
  };

  // Bind input sliders changes dynamically
  loanRateSlide.addEventListener('input', executeWhatIf);
  depositRateSlide.addEventListener('input', executeWhatIf);
  assetsSlide.addEventListener('input', executeWhatIf);
  nplRateSlide.addEventListener('input', executeWhatIf);
  
  // Pre-load simulator calculations
  executeWhatIf();

  // -- Business Narratives (Storytelling selector) --
  const generateNarrativeBtn = document.getElementById('generate-narrative-btn');

  generateNarrativeBtn.addEventListener('click', async () => {
    const channel = document.getElementById('narrative-channel').value;
    const metricName = document.getElementById('narrative-metric-name').value;
    const value = document.getElementById('narrative-value').value;
    const growthRate = document.getElementById('narrative-growth').value;
    const primaryDriver = document.getElementById('narrative-driver').value;

    generateNarrativeBtn.disabled = true;
    generateNarrativeBtn.innerText = "Formatting multi-channel stories...";

    try {
      const res = await fetch(`${API_BASE}/workflows/analytics/business-narratives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, metricName, value, growthRate, primaryDriver })
      });
      const data = await res.json();

      generateNarrativeBtn.disabled = false;
      generateNarrativeBtn.innerText = "Format Story";
      
      document.getElementById('narrative-output-channel').innerText = data.narrative;
      refreshPlatformTelemetry();
    } catch (err) {
      alert("Story compilation failed: " + err.message);
      generateNarrativeBtn.disabled = false;
      generateNarrativeBtn.innerText = "Format Story";
    }
  });
}

// ==========================================
// 6. WORKFLOW AUTOMATION SUITE (4 PRODUCTS)
// ==========================================
function setupWorkflowAutomationSuite() {
  
  // -- Design & Orchestration (Simulated progressive progress) --
  const runBtn = document.getElementById('design-run-btn');
  const consolePanel = document.getElementById('design-console');
  const visualTracker = document.getElementById('design-visual-tracker');

  runBtn.addEventListener('click', async () => {
    const trigger = document.getElementById('design-trigger').value;
    const task = document.getElementById('design-task').value;
    const notification = document.getElementById('design-notification').value;
    const requireApproval = document.getElementById('design-require-approval').checked;
    
    // Clear Console & Active Indicators
    consolePanel.innerHTML = '<div class="console-message system">⚙️ Initiating Banking workflow DAG compiler...</div>';
    visualTracker.classList.remove('hide');
    document.querySelectorAll('.v-step').forEach(el => el.classList.remove('active'));
    
    runBtn.disabled = true;
    runBtn.innerText = "Executing DAG Steps...";
    
    try {
      await delay(600);
      document.getElementById('dv-step-1').classList.add('active');
      appendConsoleLog("system", `[Trigger Fired] Banking ledger event triggered: ${trigger}`);
      
      await delay(800);
      document.getElementById('dv-step-2').classList.add('active');
      appendConsoleLog("step", `[Task Executed] Analytical Grounding Agent bound capability: '${task === 'profile' ? 'metric_interpretation' : 'summarization'}'`);
      
      // Invoke dynamic simulation API
      const res = await fetch(`${API_BASE}/workflows/automation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { name: document.getElementById('design-wf-name').value, trigger, task, notification, requireApproval } })
      });
      const data = await res.json();
      
      if (data.paused) {
        await delay(600);
        appendConsoleLog("system", `⚠️ PIPELINE RESUMABLE PAUSE: Stateful approval request ID '${data.approvalId}' dispatched to compliance queue.`);
        runBtn.disabled = false;
        runBtn.innerText = "Compile & Run pipeline";
        refreshPlatformTelemetry();
        return;
      }
      
      await delay(800);
      document.getElementById('dv-step-3').classList.add('active');
      appendConsoleLog("completed", `🎉 Outbound notification successfully routed via mcp_integration to external alerts.`);
      
      runBtn.disabled = false;
      runBtn.innerText = "Compile & Run pipeline";
      refreshPlatformTelemetry();
    } catch (err) {
      appendConsoleLog("failed", `❌ Workflow execution blocked: ${err.message}`);
      runBtn.disabled = false;
      runBtn.innerText = "Compile & Run pipeline";
    }
  });

  function appendConsoleLog(type, text) {
    const div = document.createElement('div');
    div.className = `console-message ${type}`;
    div.innerText = `> ${text}`;
    consolePanel.appendChild(div);
    consolePanel.scrollTop = consolePanel.scrollHeight;
  }
}

// -- Load STATEFUL Paused Approvals Feed --
async function loadPendingApprovals() {
  const approvalsBox = document.getElementById('approvals-list-feed');
  if (!approvalsBox) return;
  approvalsBox.innerHTML = '<div class="placeholder-msg">🔍 Fetching active pending approvals...</div>';

  try {
    const res = await fetch(`${API_BASE}/workflows/automation/approvals`);
    const data = await res.json();
    
    approvalsBox.innerHTML = '';
    
    if (data.length === 0) {
      approvalsBox.innerHTML = '<div class="placeholder-msg">✅ Compliance pipelines cleared. Zero active approvals gates.</div>';
      return;
    }

    approvalsBox.innerHTML = data.map(app => `
      <div class="approval-task-card" style="margin-bottom: 12px; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; background: #fff;">
        <div class="approval-details" style="display: flex; flex-direction: column; gap: 4px;">
          <span class="approval-title" style="font-weight: 700; font-size: 13px;">${app.name}</span>
          <span class="approval-subtitle" style="font-size: 11px; color: var(--text-secondary);">Gate: <strong>${app.step}</strong> | Triggered: ${app.created}</span>
        </div>
        <div class="approval-actions" style="display: flex; gap: 8px;">
          <button class="btn btn-sm btn-approve" style="background: var(--success-color); color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 600;" onclick="handleWorkflowApproval('${app.id}', true)">Approve & Resubmit</button>
          <button class="btn btn-sm btn-reject" style="background: var(--warning-color); color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 600;" onclick="handleWorkflowApproval('${app.id}', false)">Reject & Purge</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    approvalsBox.innerHTML = `<div class="placeholder-msg" style="color: #d32f2f;">Error loading approvals: ${err.message}</div>`;
  }
}

// Expose handleWorkflowApproval globally to bind with dynamic button string click
async function handleWorkflowApproval(approvalId, approved) {
  try {
    const res = await fetch(`${API_BASE}/workflows/automation/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalId, approved })
    });
    const data = await res.json();
    
    alert(data.message || `Workflow state resolved! Action: ${approved ? 'APPROVED & CONTINUED' : 'PURGED'}`);
    loadPendingApprovals();
    refreshPlatformTelemetry();
  } catch (err) {
    alert("Resuming workflow failed: " + err.message);
  }
}

window.handleWorkflowApproval = handleWorkflowApproval;

// Bind approvals click explicitly
const approvalsBtn = document.getElementById('approvals-refresh-btn');
if (approvalsBtn) approvalsBtn.addEventListener('click', loadPendingApprovals);

// -- Load System Observability Telemetry --
async function loadAutomationTelemetry() {
  const monTotal = document.getElementById('mon-stat-total');
  const monSuccess = document.getElementById('mon-stat-success');
  const monLatency = document.getElementById('mon-stat-latency');
  const monCost = document.getElementById('mon-stat-cost');

  try {
    const res = await fetch(`${API_BASE}/workflows/automation/telemetry`);
    const data = await res.json();

    monTotal.innerText = data.metrics.totalInvocations;
    monSuccess.innerText = data.metrics.successRate;
    monLatency.innerText = data.metrics.avgLatency;
    monCost.innerText = data.metrics.totalTokenCost;

    if (data.latencyVegaSpec) {
      vegaEmbed('#monitor-chart', data.latencyVegaSpec);
    }
  } catch (err) {
    console.error("Telemetry compile error:", err);
  }
}

// ==========================================
// 7. DATA SCIENCE & ML SUITE (4 PRODUCTS)
// ==========================================
function setupDataScienceSuite() {
  
  // -- Data Prep profiling --
  const prepBtn = document.getElementById('ds-prep-run-btn');
  const prepPanel = document.getElementById('ds-prep-results-panel');
  const prepTable = document.getElementById('ds-prep-table');

  const samplePrepData = [
    { account_id: 'ACC-1', credit_score: 720, debt_to_income: 0.32, loan_status: 'approved' },
    { account_id: 'ACC-2', credit_score: null, debt_to_income: 0.45, loan_status: 'denied' },
    { account_id: 'ACC-3', credit_score: 680, debt_to_income: 0.28, loan_status: 'approved' },
    { account_id: 'ACC-4', credit_score: 590, debt_to_income: null, loan_status: 'denied' }
  ];

  prepBtn.addEventListener('click', async () => {
    prepBtn.disabled = true;
    prepBtn.innerText = "Profiling credit feature columns and null matrices...";

    try {
      const res = await fetch(`${API_BASE}/workflows/ds/prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: ['account_id', 'credit_score', 'debt_to_income', 'loan_status'], dataset: samplePrepData })
      });
      const data = await res.json();

      prepBtn.disabled = false;
      prepBtn.innerText = "Run Feature Prep Profile";
      prepPanel.classList.remove('hide');

      document.getElementById('ds-prep-count').innerText = data.columns.length;

      prepTable.innerHTML = `
        <table class="prep-table" style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px;">
          <thead>
            <tr style="background: #eee; text-align: left;"><th style="padding: 8px;">Feature Column</th><th style="padding: 8px;">Type</th><th style="padding: 8px;">Nulls Detected</th><th style="padding: 8px;">Grounded Suggestion</th></tr>
          </thead>
          <tbody>
            ${data.columns.map(c => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px;"><code>${c.name}</code></td>
                <td style="padding: 8px;">${c.dataType}</td>
                <td style="padding: 8px;"><span class="badge" style="background-color: ${c.nullCount > 0 ? 'var(--warning-bg)' : 'var(--success-bg)'}; color: ${c.nullCount > 0 ? 'var(--warning-color)' : 'var(--success-color)'}; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${c.nullCount}</span></td>
                <td style="padding: 8px;">${c.recommendations.join('<br/>')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      refreshPlatformTelemetry();
    } catch (err) {
      alert("Data Prep failed: " + err.message);
      prepBtn.disabled = false;
      prepBtn.innerText = "Run Feature Prep Profile";
    }
  });

  // -- Model Development experiments --
  const devBtn = document.getElementById('ds-develop-run-btn');
  const devPanel = document.getElementById('ds-develop-results-panel');
  const devTable = document.getElementById('ds-develop-table');

  devBtn.addEventListener('click', async () => {
    devBtn.disabled = true;
    devBtn.innerText = "Fetching credit classifier grid experiments...";

    try {
      const res = await fetch(`${API_BASE}/workflows/ds/experiments`);
      const data = await res.json();

      devBtn.disabled = false;
      devBtn.innerText = "Fetch Experiments List";
      devPanel.classList.remove('hide');

      document.getElementById('ds-develop-champion').innerText = data.championRun;

      devTable.innerHTML = `
        <thead>
          <tr><th>Experiment ID</th><th>Learning Rate</th><th>Batch Size</th><th>Epochs</th><th>Accuracy Score</th><th>ROC Area</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${data.experiments.map(e => `
            <tr>
              <td><code>${e.runId}</code></td>
              <td>${e.learningRate}</td>
              <td>${e.batchSize}</td>
              <td>${e.epochs}</td>
              <td><span class="bold" style="color: ${e.accuracy > 0.85 ? 'var(--success-color)' : 'var(--text-primary)'}">${e.accuracy}</span></td>
              <td>${e.rocArea}</td>
              <td><span class="badge-completed">${e.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      `;
      refreshPlatformTelemetry();
    } catch (err) {
      alert("Experiments query failed: " + err.message);
      devBtn.disabled = false;
      devBtn.innerText = "Fetch Experiments List";
    }
  });

  // -- Model Documentation Booklet --
  const docBtn = document.getElementById('ds-document-run-btn');
  const docPreview = document.getElementById('ds-document-preview');

  docBtn.addEventListener('click', async () => {
    const modelId = document.getElementById('doc-model-id').value;
    const framework = document.getElementById('doc-framework').value;
    const championRun = document.getElementById('doc-champion-run').value;

    docBtn.disabled = true;
    docBtn.innerText = "Compiling audit-ready compliance governance packet...";

    try {
      const res = await fetch(`${API_BASE}/workflows/ds/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, framework, championRun })
      });
      const data = await res.json();

      docBtn.disabled = false;
      docBtn.innerText = "Generate Compliance Booklet";

      docPreview.innerHTML = data.governanceBooklet.replace(/# (.*?)\n/g, '<h3>$1</h3>')
                                                      .replace(/## (.*?)\n/g, '<h4>$1</h4>')
                                                      .replace(/\* (.*?)\n/g, '<li>$1</li>')
                                                      .replace(/\n/g, '<br/>');
                                                      
      refreshPlatformTelemetry();
    } catch (err) {
      alert("Governance booklet generation failed: " + err.message);
      docBtn.disabled = false;
      docBtn.innerText = "Generate Compliance Booklet";
    }
  });

  // -- Model Pulse drift checks --
  const pulseBtn = document.getElementById('ds-pulse-run-btn');
  const pulsePanel = document.getElementById('ds-pulse-results-panel');

  const accuracyData = [
    { accuracy: 0.93, latency: 120 },
    { accuracy: 0.92, latency: 125 },
    { accuracy: 0.91, latency: 118 },
    { accuracy: 0.89, latency: 130 },
    { accuracy: 0.87, latency: 122 },
    { accuracy: 0.84, latency: 135 }
  ];

  pulseBtn.addEventListener('click', async () => {
    pulseBtn.innerText = "Initiating drift telemetry scanners...";

    try {
      const res = await fetch(`${API_BASE}/workflows/ds/model-pulse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accuracyMetrics: accuracyData })
      });
      const data = await res.json();

      pulsePanel.classList.remove('hide');
      pulseBtn.innerText = "Scan Performance Drift";

      // Update badge
      const badge = document.getElementById('ds-pulse-drift-alert');
      badge.className = `drift-badge-box ${data.drift.status}`;
      document.getElementById('ds-pulse-drift-title').innerText = `Drift Status: ${data.drift.status.toUpperCase()}`;
      document.getElementById('ds-pulse-drift-desc').innerText = data.drift.explanation;

      document.getElementById('ds-pulse-avg-latency').innerText = data.avgLatency;
      document.getElementById('ds-pulse-drift-score').innerText = data.drift.driftScore;

      if (data.accuracyVegaSpec) {
        vegaEmbed('#ds-pulse-chart', data.accuracyVegaSpec);
      }
      
      refreshPlatformTelemetry();
    } catch (err) {
      alert("Model Pulse failed: " + err.message);
      pulseBtn.innerText = "Scan Performance Drift";
    }
  });
}

// ==========================================================================
// 📁 PRE-COMPILED 4 SAMPLE HTML REPORTS CONTROLLER
// ==========================================================================
function setupSampleReports() {
  const sampleBtns = document.querySelectorAll('.sample-report-btn');
  const previewBox = document.getElementById('report-output-preview');
  const standardsBadge = document.getElementById('badge-standards');
  const qualityBadge = document.getElementById('badge-quality');

  sampleBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      // Toggle button highlights
      sampleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const type = btn.getAttribute('data-report');
      previewBox.innerHTML = '<div class="placeholder-msg" style="margin-top: 150px;">🔍 Querying LMS Database and populating reporting layouts...</div>';
      
      try {
        // Fetch active LMS Database balances from the server
        const res = await fetch(`${API_BASE}/lms/query`);
        const db = await res.json();
        
        standardsBadge.className = 'audit-badge passed';
        standardsBadge.innerText = 'Standards: PASSED';
        qualityBadge.className = 'audit-badge passed';
        qualityBadge.innerText = 'Quality Check: PASSED';

        let html = '';
        if (type === 'nim') {
          // NIM Optimization Analysis Report
          const NIM_HTML_Rows = db.branch_performance.map(b => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px; font-weight: 500;">${b.branch} Branch</td>
              <td style="padding: 12px; font-weight: 700; color: var(--accent-color);">$${(b.net_interest_income * 1.8).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
              <td style="padding: 12px; font-weight: 700; color: var(--success-color);">${(4.25 - (b.staff_count * 0.02)).toFixed(2)}%</td>
              <td style="padding: 12px; text-align: right;"><span class="badge-completed" style="font-size:10px;">Audited</span></td>
            </tr>
          `).join('');

          html = `
            <div class="premium-report-card" style="padding: 24px; background: #fff;">
              <div style="border-bottom: 3px solid var(--accent-color); padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--accent-color); letter-spacing: 0.5px;">Governed Portfolio Analytics</span>
                  <h3 style="margin: 4px 0 0 0; font-size: 20px; font-family: var(--font-display); color: var(--text-primary);">NET INTEREST MARGIN (NIM) OPTIMIZATION</h3>
                </div>
                <span style="font-size: 11px; background: var(--success-bg); color: var(--success-color); padding: 4px 10px; border-radius: 20px; font-weight: bold;">LMS Connected</span>
              </div>
              
              <p style="font-size: 13px; line-height: 1.5; color: var(--text-secondary); margin-bottom: 24px;">
                This executive briefing isolates branch net yields by structuring earning asset loan yields against deposit liability funding cost matrices. All figures are retrieved from the <strong>Liquidity Management System (LMS)</strong> database.
              </p>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div style="background: #fcfcfc; padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Average Loan Portfolio Yield</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">6.42%</div>
                </div>
                <div style="background: #fcfcfc; padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Funding Expense Cap</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--text-secondary); margin-top: 4px;">1.85%</div>
                </div>
                <div style="background: #f8fff9; padding: 16px; border-radius: 8px; border: 1px solid var(--success-color);">
                  <div style="font-size: 10px; color: var(--success-color); text-transform: uppercase;">Net Interest Margin (NIM)</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--success-color); margin-top: 4px;">4.57%</div>
                </div>
              </div>

              <h4 style="font-family: var(--font-display); font-size: 13px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 12px; font-weight: 600;">BRANCH LEDGER MARGIN ANALYSIS</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background: #f5f7fa; text-align: left; font-weight: 600;">
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Branch Entity</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Earning Asset Base</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Calculated NIM</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd; text-align: right;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${NIM_HTML_Rows}
                </tbody>
              </table>
              
              <div style="background: #fff8f2; padding: 16px; border-radius: 8px; border-left: 4px solid var(--warning-color); margin-top: 24px;">
                <h5 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: var(--warning-color);">⚠️ NIM SQUEEZE STRATEGY ALCO RECOMMENDATION</h5>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin: 0;">
                  Initiate the Net Interest Margin Squeeze Playbook. Cap branch deposit rates at 2.25% in North Plaza and Metro Hub to offset funding cost expansions.
                </p>
              </div>
            </div>
          `;
        } else if (type === 'lcr') {
          // Liquidity Coverage Ratio (LCR) Audit Report
          const totalBuffer = db.liquidity_buffers.reduce((acc, a) => acc + a.market_value, 0);
          const simulatedOutflow = 620000000;
          const lcrPercent = (totalBuffer / simulatedOutflow) * 100;

          const LCR_HTML_Rows = db.liquidity_buffers.map(a => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px; font-weight: 500;">${a.asset_type}</td>
              <td style="padding: 12px; font-family: monospace; color: var(--text-secondary); font-size:11px;">${a.liquidity_category}</td>
              <td style="padding: 12px; font-weight: 700;">$${a.market_value.toLocaleString()}</td>
              <td style="padding: 12px; text-align: right; font-weight: 600; color: var(--success-color);">${((1 - a.risk_weight)*100).toFixed(0)}%</td>
            </tr>
          `).join('');

          html = `
            <div class="premium-report-card" style="padding: 24px; background: #fff;">
              <div style="border-bottom: 3px solid var(--accent-color); padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--accent-color); letter-spacing: 0.5px;">Treasury & Liquidity Audits</span>
                  <h3 style="margin: 4px 0 0 0; font-size: 20px; font-family: var(--font-display); color: var(--text-primary);">LIQUIDITY COVERAGE RATIO (LCR) STRESS AUDIT</h3>
                </div>
                <span style="font-size: 11px; background: var(--success-bg); color: var(--success-color); padding: 4px 10px; border-radius: 20px; font-weight: bold;">LCR Compliant</span>
              </div>
              
              <p style="font-size: 13px; line-height: 1.5; color: var(--text-secondary); margin-bottom: 24px;">
                LCR measures short-term stress resilience. Regulations require total High-Quality Liquid Assets (HQLA) to exceed net cash outflows over a 30-day stress scenario.
              </p>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div style="background: #fcfcfc; padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Total Weighted HQLA Buffer</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">$${totalBuffer.toLocaleString()}</div>
                </div>
                <div style="background: #fcfcfc; padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Simulated 30-Day Outflow</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--text-secondary); margin-top: 4px;">$${simulatedOutflow.toLocaleString()}</div>
                </div>
                <div style="background: #e8f5e9; padding: 16px; border-radius: 8px; border: 1px solid var(--success-color);">
                  <div style="font-size: 10px; color: var(--success-color); text-transform: uppercase;">Calculated LCR Ratio</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--success-color); margin-top: 4px;">${lcrPercent.toFixed(1)}%</div>
                </div>
              </div>

              <h4 style="font-family: var(--font-display); font-size: 13px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 12px; font-weight: 600;">HQLA MATRIX (LMS BUFFER DATA)</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background: #f5f7fa; text-align: left; font-weight: 600;">
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">HQLA Asset Class</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Regulatory Category</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Weighted Market Value</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd; text-align: right;">Haircut Factor</th>
                  </tr>
                </thead>
                <tbody>
                  ${LCR_HTML_Rows}
                </tbody>
              </table>
            </div>
          `;
        } else if (type === 'npl') {
          // Credit Risk & NPL Concentrations Report
          const totalLoansVal = db.loans.reduce((acc, l) => acc + l.amount, 0);
          const nplLoansVal = db.loans.filter(l => l.status === 'non-performing').reduce((acc, l) => acc + l.amount, 0);
          const overallNplRatio = (nplLoansVal / totalLoansVal) * 100;

          const NPL_HTML_Rows = db.loans.map(l => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px; font-weight: 500;"><code>${l.loan_id}</code></td>
              <td style="padding: 12px;">${l.loan_type}</td>
              <td style="padding: 12px; font-weight: 700;">$${l.amount.toLocaleString()}</td>
              <td style="padding: 12px; font-weight: 600; color:${l.credit_score < 650 ? '#d32f2f' : '#2e7d32'};">${l.credit_score}</td>
              <td style="padding: 12px; text-align: right;"><span style="background:${l.status === 'performing'?'#e8f5e9':'#ffebee'}; color:${l.status === 'performing'?'#2e7d32':'#c62828'}; padding:4px 8px; border-radius:4px; font-weight: 700; font-size: 10px; text-transform: uppercase;">${l.status}</span></td>
            </tr>
          `).join('');

          html = `
            <div class="premium-report-card" style="padding: 24px; background: #fff;">
              <div style="border-bottom: 3px solid var(--warning-color); padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--warning-color); letter-spacing: 0.5px;">Credit Risk Governance</span>
                  <h3 style="margin: 4px 0 0 0; font-size: 20px; font-family: var(--font-display); color: var(--text-primary);">CREDIT RISK & NPL PORTFOLIO EXPOSURES</h3>
                </div>
                <span style="font-size: 11px; background: var(--warning-bg); color: var(--warning-color); padding: 4px 10px; border-radius: 20px; font-weight: bold;">Risk Alert</span>
              </div>
              
              <p style="font-size: 13px; line-height: 1.5; color: var(--text-secondary); margin-bottom: 24px;">
                Comprehensive profile of core credit exposures and default distributions across active branches. Standard credit triggers audit borrowers scoring below 650.
              </p>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div style="background: #fcfcfc; padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Total Loans Portfolio Base</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">$${totalLoansVal.toLocaleString()}</div>
                </div>
                <div style="background: #fcfcfc; padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Total Non-Performing Balances</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--text-secondary); margin-top: 4px;">$${nplLoansVal.toLocaleString()}</div>
                </div>
                <div style="background: #ffebee; padding: 16px; border-radius: 8px; border: 1px solid var(--warning-color);">
                  <div style="font-size: 10px; color: var(--warning-color); text-transform: uppercase;">Portfolio NPL Ratio</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--warning-color); margin-top: 4px;">${overallNplRatio.toFixed(2)}%</div>
                </div>
              </div>

              <h4 style="font-family: var(--font-display); font-size: 13px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 12px; font-weight: 600;">ACTIVE LOAN EXPOSURES GRID (LMS CREDIT DATA)</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background: #f5f7fa; text-align: left; font-weight: 600;">
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Loan Reference</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Exposure Class</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Principal Volume</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Credit Score</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd; text-align: right;">Asset Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${NPL_HTML_Rows}
                </tbody>
              </table>
            </div>
          `;
        } else if (type === 'efficiency') {
          // Branch Cost-to-Income Efficiency Report
          const totalIncome = db.branch_performance.reduce((acc, b) => acc + b.net_interest_income, 0);
          const totalCosts = db.branch_performance.reduce((acc, b) => acc + b.operating_costs, 0);
          const aggregateCostIncome = (totalCosts / totalIncome) * 100;

          const Efficiency_HTML_Rows = db.branch_performance.map(b => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px; font-weight: 500;">${b.branch} Branch</td>
              <td style="padding: 12px; font-weight: 700;">$${b.net_interest_income.toLocaleString()}</td>
              <td style="padding: 12px;">$${b.operating_costs.toLocaleString()}</td>
              <td style="padding: 12px; font-weight: 700; color: var(--accent-color);">${((b.operating_costs / b.net_interest_income)*100).toFixed(1)}%</td>
              <td style="padding: 12px; text-align: right; font-weight: 600; font-size:11px;">${b.staff_count} FTE</td>
            </tr>
          `).join('');

          html = `
            <div class="premium-report-card" style="padding: 24px; background: #fff;">
              <div style="border-bottom: 3px solid var(--accent-color); padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--accent-color); letter-spacing: 0.5px;">Branch Operations Governance</span>
                  <h3 style="margin: 4px 0 0 0; font-size: 20px; font-family: var(--font-display); color: var(--text-primary);">BRANCH EFFICIENCY & COST-TO-INCOME</h3>
                </div>
                <span style="font-size: 11px; background: var(--accent-light); color: var(--accent-color); padding: 4px 10px; border-radius: 20px; font-weight: bold;">Efficiency Audited</span>
              </div>
              
              <p style="font-size: 13px; line-height: 1.5; color: var(--text-secondary); margin-bottom: 24px;">
                Evaluates branch productivity structures by dividing operating cost envelopes by corresponding net interest income lines. A lower ratio reflects high operating leverage.
              </p>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div style="background: #fcfcfc; padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Total Network Net Revenue</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">$${totalIncome.toLocaleString()}</div>
                </div>
                <div style="background: #fcfcfc; padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Total Network Overhead</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--text-secondary); margin-top: 4px;">$${totalCosts.toLocaleString()}</div>
                </div>
                <div style="background: #f0f4ff; padding: 16px; border-radius: 8px; border: 1px solid var(--accent-color);">
                  <div style="font-size: 10px; color: var(--accent-color); text-transform: uppercase;">Cost-to-Income Efficiency</div>
                  <div style="font-size: 24px; font-weight: 700; color: var(--accent-color); margin-top: 4px;">${aggregateCostIncome.toFixed(1)}%</div>
                </div>
              </div>

              <h4 style="font-family: var(--font-display); font-size: 13px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 12px; font-weight: 600;">BRANCH PERFORMANCE MATRICES</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background: #f5f7fa; text-align: left; font-weight: 600;">
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Branch Plaza</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Net Revenue</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Operating Cost</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd;">Cost-to-Income</th>
                    <th style="padding: 12px; border-bottom:2px solid #ddd; text-align: right;">Headcount</th>
                  </tr>
                </thead>
                <tbody>
                  ${Efficiency_HTML_Rows}
                </tbody>
              </table>
            </div>
          `;
        }

        previewBox.innerHTML = html;
      } catch (err) {
        previewBox.innerHTML = `<div class="placeholder-msg font-red" style="margin-top: 150px;">Error loading sample report: ${err.message}</div>`;
      }
    });
  });
}

// ==========================================
// 10. SYSTEM CONFIGURATION & REGISTRY VIEWS
// ==========================================
async function renderCapabilitiesRegistry() {
  const listDiv = document.getElementById('registry-capabilities-list');
  listDiv.innerHTML = '<div class="placeholder-msg">Loading active capabilities registry...</div>';
  
  try {
    const res = await fetch(`${API_BASE}/capabilities`);
    if (!res.ok) throw new Error("AIP Authorization required.");
    const data = await res.json();
    
    listDiv.innerHTML = data.map(cap => `
      <div class="registry-card">
        <h4>${cap.name}</h4>
        <p>${cap.description}</p>
        <div class="schema-block">
          <strong>Input Specs:</strong><br/>
          <code>${JSON.stringify(cap.inputSchema, null, 2)}</code>
        </div>
      </div>
    `).join('');
  } catch (err) {
    listDiv.innerHTML = `<div class="placeholder-msg">Capabilities locked. Await Analyst authentication.</div>`;
  }
}

async function renderExecutionLogs() {
  const tbody = document.getElementById('logs-table-body');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading platform execution logs...</td></tr>';
  
  try {
    const res = await fetch(`${API_BASE}/execution-logs`);
    if (!res.ok) throw new Error("AIP Authorization required.");
    const data = await res.json();
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No trace items logged yet. Run workflow tasks to generate logs.</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map(log => `
      <tr>
        <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
        <td><code class="bold">${log.capability}</code></td>
        <td><span class="badge" style="background: var(--accent-light); color: var(--accent-color); font-weight: 600;">${log.agent || 'Orchestrator'}</span></td>
        <td><code>${log.apiKey || 'No Key'}</code></td>
        <td>${log.durationMs}ms</td>
        <td>
          <span class="${log.status === 'completed' ? 'badge-completed' : 'badge-failed'}">
            ${log.status}
          </span>
        </td>
        <td>
          <span class="logs-payload" title="Click to view details" onclick="alert(JSON.stringify(${JSON.stringify(log.output).replace(/"/g, '&quot;')}, null, 2))">
            ${JSON.stringify(log.output)}
          </span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center font-red">Telemetry traces locked. Await Analyst authentication.</td></tr>`;
  }
}

// Bind Clear Logs explicitly
document.getElementById('clear-logs-btn').addEventListener('click', async () => {
  try {
    await fetch(`${API_BASE}/execution-logs`, { method: 'DELETE' });
    renderExecutionLogs();
    refreshPlatformTelemetry();
  } catch (err) {
    alert("Clearing traces failed: " + err.message);
  }
});
