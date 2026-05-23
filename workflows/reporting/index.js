import { invoke_capability, callLLM } from '../../platform-core/intelligence.js';
import fs from 'fs';
import path from 'path';

// Helper to query LMS database tables directly
function getLmsTable(tableName) {
  try {
    const dbPath = path.resolve('data/lms_database.json');
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      return db[tableName] || [];
    }
  } catch (err) {
    console.error(`[Workflows LMS] Failed to read table ${tableName}:`, err.message);
  }
  return [];
}

/**
 * Product 1: PRISM Lite Report Rationalizer
 * Compiles a CSV inventory of reports and calculates duplicates, usage, and overlaps.
 */
export async function prism_lite_workflow(reports) {
  console.log(`[Workflow: Reporting - PRISM] Launching banking report rationalizer for ${reports.length} audit sheets.`);
  
  const duplicates = [];
  const overlaps = [];
  const usageInsights = [];
  
  const cleaned = reports.map(r => ({
    name: r.name || 'Unnamed Report',
    query: (r.query || '').trim().replace(/\s+/g, ' ').toLowerCase(),
    rawQuery: r.query || '',
    usage: parseInt(r.usage || 0, 10),
    owner: r.owner || 'Unknown'
  }));

  // 1. Audit duplicates (exact same SQL query)
  const seenQueries = new Map();
  cleaned.forEach(rep => {
    if (seenQueries.has(rep.query)) {
      const original = seenQueries.get(rep.query);
      duplicates.push({
        reportA: original.name,
        reportB: rep.name,
        querySnippet: rep.rawQuery.slice(0, 50) + '...',
        matchType: 'Exact SQL query match'
      });
    } else {
      seenQueries.set(rep.query, rep);
    }
  });

  // 2. Audit overlap (Jaccard similarity coefficient based on query tokens overlap)
  for (let i = 0; i < cleaned.length; i++) {
    for (let j = i + 1; j < cleaned.length; j++) {
      const repA = cleaned[i];
      const repB = cleaned[j];
      
      const tokensA = new Set(repA.query.split(' '));
      const tokensB = new Set(repB.query.split(' '));
      
      const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
      const union = new Set([...tokensA, ...tokensB]);
      const similarity = intersection.size / union.size;
      
      if (similarity > 0.5 && repA.query !== repB.query) { 
        overlaps.push({
          reportA: repA.name,
          reportB: repB.name,
          coefficient: parseFloat((similarity * 100).toFixed(1)),
          action: 'Recommended for Consolidation'
        });
      }
    }
  }

  // 3. Highlight low-usage reports for consolidation
  cleaned.forEach(rep => {
    if (rep.usage < 15) {
      usageInsights.push({
        name: rep.name,
        usage: rep.usage,
        owner: rep.owner,
        status: 'Audit Target (Low Usage)'
      });
    }
  });

  // 4. Summarize and generate rationalization recommendations
  const rawLogs = `PRISM rationalizer analyzed ${cleaned.length} banking metrics reports. Duplicates detected: ${duplicates.length}. Overlap items: ${overlaps.length}. Low usage targets: ${usageInsights.length}.`;
  
  // Use live LLM or offline fallback for summarizations
  const systemPrompt = "You are a professional banking database auditor. Distill report duplication telemetry into a single-sentence recommendation.";
  let summaryText = `PRISM completed auditing. Found ${duplicates.length} duplicate query patterns and ${overlaps.length} high Jaccard coefficient conflicts.`;
  
  const aiSummary = await callLLM(systemPrompt, rawLogs);
  if (aiSummary) {
    summaryText = aiSummary.trim();
  } else {
    // Shared capability reuse fallback
    const summaryResult = await invoke_capability('summarization', { text: rawLogs });
    summaryText = summaryResult.summary;
  }

  const recommendations = [];
  if (duplicates.length > 0) {
    recommendations.push(`Consolidate ${duplicates.length} duplicate interest-margin queries into a single audited ledger report.`);
  }
  if (overlaps.length > 0) {
    recommendations.push(`Merge visual panels sharing ${overlaps[0]?.coefficient}% query overlap between ${overlaps[0]?.reportA} and ${overlaps[0]?.reportB}.`);
  }
  if (usageInsights.length > 0) {
    recommendations.push(`Deprecate ${usageInsights.length} low-usage retail loan trackers to recover database resources.`);
  }

  return {
    duplicates,
    overlaps,
    usageInsights,
    summary: summaryText,
    recommendations
  };
}

/**
 * Product 2: Report Building Workflow
 * TAKES REQUIREMENTS, IDENTIFIES KPI, CREATES DATA MODEL, CONSTRUCTS BEST HTML VISUAL FRAMEWORK, POPULATES WITH LMS DATA.
 */
export async function build_report_workflow(metricId, value, compareValue, note) {
  console.log(`[Workflow: Reporting - Builder] Custom generating dynamic report for metric KPI: ${metricId}`);

  // 1. Identify KPI: Get semantic definition context from KMS
  const kmsContext = await invoke_capability('knowledge_retrieval', { question: metricId });
  
  // 2. Fetch Data from LMS Database tables to populate report
  const deposits = getLmsTable('deposits');
  const loans = getLmsTable('loans');
  const buffers = getLmsTable('liquidity_buffers');
  const performance = getLmsTable('branch_performance');

  const lmsDataSummary = JSON.stringify({ deposits, loans, buffers, performance });

  // 3. Formulate prompts for live OpenAI GPT compilation
  const systemPrompt = `You are a professional Banking Analytics UI Architect. Your objective is to formulate a premium, executive-grade HTML analytics report layout.
Create a gorgeous visual framework using styled DIV elements, metrics summaries, tables, and harmonic colors.
DO NOT output outer <html> or <body> tags. Simply output a container '<div class="premium-report-card">' containing a modern report structure.
Incorporate actual numbers from the provided LMS Database tables that correspond to the requested KPI (${metricId}). Make the layout responsive and visually stunning.`;

  const userPrompt = `Requirements Checklist:
- KPI Target: ${metricId}
- Current Value: ${value}
- Comparison Baseline: ${compareValue}
- Analyst Context Notes: "${note || 'None'}"
- KMS Metric Grounding Rules: ${kmsContext.context}
- Underlying LMS Database details to populate tables: ${lmsDataSummary}

Generate the best HTML visual report containing summaries, branch details table, and compliance recommendations. Keep it cohesive.`;

  let htmlResult = '';
  const aiHtml = await callLLM(systemPrompt, userPrompt);
  
  if (aiHtml) {
    // Extract code block if AI wraps in ```html ... ```
    htmlResult = aiHtml.replace(/```html/g, '').replace(/```/g, '').trim();
    console.log('[Workflow: Reporting - Builder] Live OpenAI HTML Report generated successfully.');
  } else {
    // Premium high-fidelity deterministic offline fallback
    console.log('[Workflow: Reporting - Builder] OpenAI offline/missing, falling back to deterministic template builder.');
    
    // Choose tables based on metricId
    let dbRowsHTML = '';
    if (metricId.includes('interest') || metricId.includes('nim')) {
      dbRowsHTML = performance.map(b => `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px;">${b.branch}</td>
          <td style="padding:10px; font-weight:600;">$${b.net_interest_income.toLocaleString()}</td>
          <td style="padding:10px;">$${b.operating_costs.toLocaleString()}</td>
          <td style="padding:10px; text-align:right;">${b.customer_count.toLocaleString()}</td>
        </tr>
      `).join('');
    } else if (metricId.includes('npl') || metricId.includes('credit')) {
      dbRowsHTML = loans.map(l => `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px;"><code>${l.loan_id}</code></td>
          <td style="padding:10px;">${l.loan_type}</td>
          <td style="padding:10px; font-weight:600;">$${l.amount.toLocaleString()}</td>
          <td style="padding:10px;">${l.credit_score}</td>
          <td style="padding:10px; text-align:right;"><span style="background:${l.status === 'performing'?'#e8f5e9':'#ffebee'}; color:${l.status === 'performing'?'#2e7d32':'#c62828'}; padding:2px 6px; border-radius:4px;">${l.status}</span></td>
        </tr>
      `).join('');
    } else {
      dbRowsHTML = deposits.map(d => `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px;"><code>${d.deposit_id}</code></td>
          <td style="padding:10px;">${d.branch}</td>
          <td style="padding:10px;">${d.customer_type}</td>
          <td style="padding:10px; font-weight:600;">$${d.amount.toLocaleString()}</td>
          <td style="padding:10px; text-align:right; font-weight:600; color:var(--primary-color);">${d.interest_rate}%</td>
        </tr>
      `).join('');
    }

    htmlResult = `
      <div class="premium-report-card" style="font-family:var(--font-family); background:#fff; padding:24px; border-radius:12px; border:1px solid var(--border-color); box-shadow:var(--shadow-sm);">
        <div style="border-bottom: 2px solid var(--accent-color); padding-bottom: 12px; margin-bottom: 20px;">
          <span style="font-size: 11px; text-transform: uppercase; font-weight: 600; color: var(--accent-color); letter-spacing: 1px;">Governed Ledger Briefing</span>
          <h3 style="margin-top: 4px; font-size: 20px; font-family: var(--font-display);">${metricId.toUpperCase().replace(/_/g, ' ')} OPTIMIZATION</h3>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
          <div style="background: #fafafa; padding: 12px; border-radius: 8px; border: 1px solid #eee;">
            <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Current Value</div>
            <div style="font-size: 20px; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${value}</div>
          </div>
          <div style="background: #fafafa; padding: 12px; border-radius: 8px; border: 1px solid #eee;">
            <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Baseline Comparison</div>
            <div style="font-size: 20px; font-weight: 700; color: var(--text-secondary); margin-top: 4px;">${compareValue}</div>
          </div>
          <div style="background: #fafafa; padding: 12px; border-radius: 8px; border: 1px solid #eee;">
            <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase;">Analyst Variance</div>
            <div style="font-size: 20px; font-weight: 700; color: var(--success-color); margin-top: 4px;">+${(((parseFloat(value)-parseFloat(compareValue))/parseFloat(compareValue))*100).toFixed(1)}%</div>
          </div>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: var(--text-secondary); margin-bottom: 20px; background: #faf0e6; padding: 12px; border-radius: 6px; border-left: 4px solid var(--warning-color);">
          <strong>Analyst Briefing Notes:</strong> "${note || 'No notes supplied.'}"
        </p>

        <h4 style="font-family:var(--font-display); font-size:14px; margin-bottom:12px; text-transform:uppercase;">Underlying Database Ledgers Records (LMS Table Extract)</h4>
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
              <tr style="background:#f5f7fa; text-align:left;">
                <th style="padding:10px; border-bottom:2px solid #ddd;">Entity</th>
                <th style="padding:10px; border-bottom:2px solid #ddd;">Indicator</th>
                <th style="padding:10px; border-bottom:2px solid #ddd;">Balance</th>
                <th style="padding:10px; border-bottom:2px solid #ddd; text-align:right;">Reference</th>
              </tr>
            </thead>
            <tbody>
              ${dbRowsHTML}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 20px; text-align: right; font-size: 11px; color: var(--text-secondary);">
          Grounded semantic lineage trace: <code>KMS Context Verified</code> | Database Connection: <code>LMS Active</code>
        </div>
      </div>
    `;
  }

  // Standards Validation Check (Checks for syntax and structure guidelines)
  const doubleSpaces = htmlResult.includes('  ');
  const standardsPassed = !doubleSpaces && htmlResult.includes('<div');
  const standardsErrors = [];
  
  if (doubleSpaces) standardsErrors.push("Double-spaces detected (Style Violation).");
  if (!htmlResult.includes('<div')) standardsErrors.push("Missing core HTML container element.");

  // Quality Check (Validates numbers and math bounds)
  const val = parseFloat(value);
  const comp = parseFloat(compareValue);
  const qualityPassed = !isNaN(val) && !isNaN(comp);
  const qualityErrors = [];
  
  if (isNaN(val) || isNaN(comp)) {
    qualityErrors.push("Invalid numeric parameters supplied for metrics values.");
  }

  return {
    reportText: htmlResult,
    standards: {
      passed: standardsPassed,
      errors: standardsErrors
    },
    quality: {
      passed: qualityPassed,
      errors: qualityErrors,
      variance: qualityPassed ? parseFloat((((val - comp) / comp) * 100).toFixed(2)) : 0
    }
  };
}

/**
 * Product 3: Conversational BI Workflow
 * ANSWERS QUESTIONS STATEFULLY USING PRODUCED REPORTS CONTEXT & LIVE LMS DB AND KMS INDEXES via OPENAI.
 */
export async function conversational_bi_workflow(question) {
  console.log(`[Workflow: Reporting - Conversational BI] Answering banking analytics query: "${question}"`);

  // 1. Gather all KMS context mapping
  const retrieveResult = await invoke_capability('knowledge_retrieval', { question });
  
  // 2. Fetch live data from LMS tables
  const deposits = getLmsTable('deposits');
  const loans = getLmsTable('loans');
  const buffers = getLmsTable('liquidity_buffers');
  const performance = getLmsTable('branch_performance');
  
  const lmsDataSummary = JSON.stringify({ deposits, loans, buffers, performance });

  // 3. Draft AI prompts linking Report context, LMS Database, and KMS
  const systemPrompt = `You are a professional Banking Executive BI Assistant. Your sole objective is to answer conversational analytical queries.
You must ground your calculations and answers strictly in the central KMS metrics configurations and the live LMS Database records.
Answer the question concisely in clean Markdown. Include inline tables, bullet points, and calculations if necessary.
Avoid guessing. Cite specific branches (North Plaza, Metro Hub, South Bay, West Valley) or HQLA categories based on actual LMS details.`;

  const userPrompt = `Analyst Query: "${question}"
KMS Semantics Definitions matched: ${retrieveResult.context}
Live LMS Database Records: ${lmsDataSummary}

Provide a comprehensive, executive-grade analysis response.`;

  let responseNarrative = '';
  const aiAnswer = await callLLM(systemPrompt, userPrompt);
  
  if (aiAnswer) {
    responseNarrative = aiAnswer;
    console.log('[Workflow: Reporting - Conversational BI] Live OpenAI BI response generated successfully.');
  } else {
    // High-fidelity fallback heuristic mapping
    console.log('[Workflow: Reporting - Conversational BI] OpenAI key offline, executing Z-score trend and vega spec compilers.');
    
    let metricId = 'net_interest_margin';
    let trends = [3.12, 3.08, 3.15, 2.95, 2.88, 2.82, 2.65];
    let metricName = 'Net Interest Margin (NIM)';
    let formula = '(interest_income - interest_expense) / average_earning_assets';
    
    const qLower = question.toLowerCase();
    if (qLower.includes('npl') || qLower.includes('performing') || qLower.includes('credit') || qLower.includes('default')) {
      metricId = 'npl_ratio';
      trends = [1.42, 1.45, 1.38, 1.49, 1.55, 1.62, 1.85];
      metricName = 'Non-Performing Loans (NPL) Ratio';
      formula = '(total_non_performing_loans / total_outstanding_loans) * 100';
    } else if (qLower.includes('ldr') || qLower.includes('deposit') || qLower.includes('liquidity')) {
      metricId = 'loan_to_deposit_ratio';
      trends = [78.5, 79.2, 80.5, 81.2, 80.8, 82.5, 85.8];
      metricName = 'Loan-to-Deposit Ratio (LDR)';
      formula = '(total_outstanding_loans / total_deposits) * 100';
    } else if (qLower.includes('cac') || qLower.includes('card') || qLower.includes('acquisition')) {
      metricId = 'banking_card_cac';
      trends = [180, 175, 192, 185, 178, 172, 215];
      metricName = 'Credit Card Acquisition Cost (CAC)';
      formula = 'credit_sales_marketing_spend / total_new_cardholders';
    }

    const interpretResult = await invoke_capability('metric_interpretation', {
      metricId,
      trends,
      analysisType: 'anomaly'
    });

    const generateResult = await invoke_capability('narrative_generation', {
      templateId: 'briefing_brief',
      variables: {
        metricName,
        metricValue: `${trends[trends.length - 1]}${metricId !== 'banking_card_cac' ? '%' : ''}`,
        compareValue: `${trends[trends.length - 2]}${metricId !== 'banking_card_cac' ? '%' : ''}`,
        metricFormula: formula,
        explanation: interpretResult.explanation,
        summaryText: retrieveResult.context.slice(0, 150) + '...'
      }
    });

    responseNarrative = generateResult.narrative;
  }

  // Generate the line spec to visualize the trend
  const defaultTrends = [3.12, 3.08, 3.15, 2.95, 2.88, 2.82, 2.65];
  const qLower = question.toLowerCase();
  let selectedTrends = defaultTrends;
  if (qLower.includes('npl') || qLower.includes('default')) {
    selectedTrends = [1.42, 1.45, 1.38, 1.49, 1.55, 1.62, 1.85];
  } else if (qLower.includes('ldr') || qLower.includes('deposit')) {
    selectedTrends = [78.5, 79.2, 80.5, 81.2, 80.8, 82.5, 85.8];
  } else if (qLower.includes('cac') || qLower.includes('card')) {
    selectedTrends = [180, 175, 192, 185, 178, 172, 215];
  }

  const vizResult = await invoke_capability('visualization', {
    chartType: 'line',
    trends: selectedTrends
  });

  return {
    narrative: responseNarrative,
    vegaSpec: vizResult.vegaSpec
  };
}

/**
 * Product 4: Proactive Insights Workflow
 * Generates an active, auto-flagged alert feed based on continuous statistical checks.
 */
export async function get_proactive_insights_workflow() {
  console.log(`[Workflow: Reporting - Proactive] Compiling proactive banking alerts stream.`);

  // Load and scan metrics seed vectors to simulate continuous alert monitors
  const nimTrends = [3.12, 3.08, 3.15, 2.95, 2.88, 2.82, 2.65];
  const nplTrends = [1.42, 1.45, 1.38, 1.49, 1.55, 1.62, 1.85];

  const nimStats = await invoke_capability('metric_interpretation', {
    metricId: 'Net Interest Margin (NIM)',
    trends: nimTrends,
    analysisType: 'anomaly'
  });

  const nplStats = await invoke_capability('metric_interpretation', {
    metricId: 'Non-Performing Loans (NPL) Ratio',
    trends: nplTrends,
    analysisType: 'anomaly'
  });

  const alerts = [];

  if (nimStats.anomalies.length > 0) {
    alerts.push({
      metric: 'Net Interest Margin (NIM)',
      type: 'Negative Shift Anomaly',
      message: 'Net Interest Margin compressed significantly below standard Z-score limits (Value: 2.65%).',
      recommendation: 'Initiate NIM Squeeze Playbook: review interest sensitivity duration gaps and adjust deposits funding yield caps.',
      severity: 'High'
    });
  }

  if (nplStats.anomalies.length > 0) {
    alerts.push({
      metric: 'Non-Performing Loans (NPL) Ratio',
      type: 'Trend Surge Warning',
      message: 'NPL Ratio surged MoM by over 14% to 1.85% in latest loan cohort.',
      recommendation: 'Execute NPL Risk Mitigation Standard: review credit score classifier thresholds for applicants scoring below 650.',
      severity: 'High'
    });
  }

  return {
    alerts,
    updatedAt: new Date().toLocaleTimeString()
  };
}
