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
 * Product 1: Insight Discovery Workflow
 * Scans segment lines and highlights cohorts displaying significant MoM shifts.
 */
export async function insight_discovery_workflow(segmentsData) {
  console.log(`[Workflow: Analytics - Discovery] Surfacing banking segment micro-trends.`);
  
  const surfacedInsights = [];

  for (const item of segmentsData) {
    const interpreter = await invoke_capability('metric_interpretation', {
      metricId: item.cohort,
      trends: item.timeline || [],
      analysisType: 'anomaly'
    });

    if (Math.abs(interpreter.growthRate) > 5) { // 5% shift in credit segments is very material
      surfacedInsights.push({
        cohort: item.cohort,
        growthRate: interpreter.growthRate,
        direction: interpreter.growthRate > 0 ? 'Surging' : 'Declining',
        explanation: interpreter.explanation,
        status: 'Material Discovery'
      });
    }
  }

  return {
    insights: surfacedInsights,
    totalScanned: segmentsData.length
  };
}

/**
 * Product 2: Root Cause Analysis (RCA)
 * Decomposes metric variance across segment dimensions (e.g. loan portfolios).
 */
export async function root_cause_analysis_workflow(datasetName, metricsData) {
  console.log(`[Workflow: Analytics - RCA] Running RCA drivers scan for banking portfolio: ${datasetName}`);

  const rowCount = metricsData.length;
  let missingValues = 0;
  
  metricsData.forEach(row => {
    Object.keys(row).forEach(key => {
      if (row[key] === null || row[key] === undefined || row[key] === '') {
        missingValues++;
      }
    });
  });

  const trendVector = metricsData.map(row => row.value || 0);
  const interpretation = await invoke_capability('metric_interpretation', {
    metricId: datasetName,
    trends: trendVector,
    analysisType: 'anomaly'
  });

  const contributions = {};
  metricsData.forEach(row => {
    const dim = row.segment || 'Unknown Portfolio Segment';
    contributions[dim] = (contributions[dim] || 0) + (row.value || 0);
  });

  const sortedSegments = Object.keys(contributions).map(key => ({
    segment: key,
    value: parseFloat(contributions[key].toFixed(2))
  })).sort((a, b) => b.value - a.value);

  const primaryDriver = sortedSegments[0] 
    ? `${sortedSegments[0].segment} (Total: ${sortedSegments[0].value})`
    : 'Unknown Driver';

  const generateResult = await invoke_capability('narrative_generation', {
    templateId: 'rca_template',
    variables: {
      metricName: datasetName,
      missingCount: missingValues.toString(),
      featureSuggestion: rowCount > 5 ? 'Recommend clustering branches by local interest rate sensitivity.' : 'Recommend standard LDR tracking.',
      driversList: `Primary portfolio segment driver identified as: '${primaryDriver}'. Growth rate of overall trend: ${interpretation.growthRate}%.`,
      summary: interpretation.explanation
    }
  });

  return {
    profiling: {
      rowCount,
      missingValues,
      summary: `Analyzed ${rowCount} ledger entries. Detected ${missingValues} missing values across dimensions.`
    },
    drivers: sortedSegments,
    primaryDriver,
    narrative: generateResult.narrative
  };
}

/**
 * Product 3: What-if Analysis Workflow (Banking Simulator)
 * Simulates interest margins sensitivity and returns projected KPIs aligned to KMS math structures.
 */
export async function what_if_analysis_workflow(loanRate, depositRate, assets, nplRate) {
  console.log(`[Workflow: Analytics - What-if] Simulating banking interest rate margins and profits.`);

  // Query LMS Tables to establish baseline balances if assets is omitted
  const depositsData = getLmsTable('deposits');
  const loansData = getLmsTable('loans');

  const lmsDepositsTotal = depositsData.reduce((acc, d) => acc + d.amount, 0) / 1000000000;
  const lmsLoansTotal = loansData.reduce((acc, l) => acc + l.amount, 0) / 1000000000;

  const lRate = parseFloat(loanRate) || 6.5;
  const dRate = parseFloat(depositRate) || 2.5;
  
  // Earning assets base (defaulting to LMS data total or simulated input assets)
  const totalAssets = parseFloat(assets) || (lmsDepositsTotal > 0 ? lmsDepositsTotal / 0.90 : 10.0);
  const defRate = parseFloat(nplRate) || 1.5;

  // Convert assets from billions to dollars
  const assetsInDollars = totalAssets * 1000000000;

  // Active earning assets (e.g. outstanding loans portfolio) is assumed to be 85% of assets
  const loanPortfolio = assetsInDollars * 0.85;
  // Core deposit liabilities are assumed to be 90% of assets
  const depositLiabilities = assetsInDollars * 0.90;

  // 1. Projected Interest Revenue = loanPortfolio * (lRate / 100)
  const projectedInterestRevenue = parseFloat((loanPortfolio * (lRate / 100)).toFixed(2));

  // 2. Projected Interest Expense = depositLiabilities * (dRate / 100)
  const projectedInterestExpense = parseFloat((depositLiabilities * (dRate / 100)).toFixed(2));

  // 3. Projected Default Costs = loanPortfolio * (defRate / 100) * 0.60 (60% Loss Given Default)
  const projectedDefaultCosts = parseFloat((loanPortfolio * (defRate / 100) * 0.60).toFixed(2));

  // 4. Net Spread Profit = Projected Interest Revenue - Projected Interest Expense - Projected Default Costs
  const netSpreadProfit = parseFloat((projectedInterestRevenue - projectedInterestExpense - projectedDefaultCosts).toFixed(2));

  // 5. Net Interest Margin (NIM) = (Projected Interest Revenue - Projected Interest Expense) / assetsInDollars * 100
  const netInterestMargin = assetsInDollars > 0 
    ? parseFloat((((projectedInterestRevenue - projectedInterestExpense) / assetsInDollars) * 100).toFixed(2))
    : 0;

  return {
    projectedInterestRevenue,
    projectedInterestExpense,
    projectedDefaultCosts,
    netSpreadProfit,
    netInterestMargin
  };
}

/**
 * Product 4: Business Narratives Workflow
 * Renders data statistics into markdown analysis briefs tailored for selected target channels.
 */
export async function generate_business_narratives_workflow(channel, metricName, value, growthRate, primaryDriver) {
  console.log(`[Workflow: Analytics - Narratives] Compiling stories for channel: ${channel}`);

  const systemPrompt = `You are an expert Chief Communications Officer for a tier-1 banking organization.
Your objective is to compile an executive analysis copy for the target channel (${channel.toUpperCase()}).
Keep your tone highly professional, precise, and authoritative. Highlight the driver (${primaryDriver}) and margins variance.`;

  const userPrompt = `Synthesize a narrative summary report:
- Target channel: ${channel}
- Audited Metric Name: ${metricName}
- Metric Value: ${value}
- Growth Rate: ${growthRate}% MoM
- Primary Asset Driver: ${primaryDriver}
Ensure it includes appropriate markdown elements matching corporate presentation decks standard.`;

  let tailoredNarrative = '';
  
  // Call OpenAI API
  const aiNarrative = await callLLM(systemPrompt, userPrompt);
  if (aiNarrative) {
    tailoredNarrative = aiNarrative;
    console.log('[Workflow: Analytics - Narratives] Live OpenAI executive story generated successfully.');
  } else {
    console.log('[Workflow: Analytics - Narratives] OpenAI key offline, using high-fidelity local narrative templates.');
    
    const variables = {
      metricName,
      metricValue: value,
      compareValue: `${parseFloat(value) / (1 + parseFloat(growthRate)/100)}`,
      metricFormula: 'net_interest_margin',
      explanation: `Root cause drivers analysis isolated the core factor behind margin shift to be: ${primaryDriver}. Growth computed at ${growthRate}% in the latest cycle.`,
      summaryText: `Corporate narrative brief synthesized automatically for target channel: ${channel.toUpperCase()}.`
    };

    const generation = await invoke_capability('narrative_generation', {
      templateId: 'briefing_brief',
      variables
    });

    tailoredNarrative = generation.narrative;
    if (channel === 'slack') {
      tailoredNarrative = `🚨 *AIP Banking Alert: ${metricName}* 🚨\n\nLatest evaluated status: *${value}* (growth: *${growthRate}% MoM*).\n\n*Key Diagnostics:* ${variables.explanation}\n\n_CC: @asset-liability-committee_`;
    } else if (channel === 'board') {
      tailoredNarrative = `# Board Executive Review: ${metricName}\n\n## 📝 Portfolio Margin Performance\nDuring this evaluation period, **${metricName}** registered **${value}**, reflecting a **${growthRate}% MoM** transition.\n\n## 📊 Asset-Liability Diagnostics\n* Primary variance driver was identified in: **${primaryDriver}**.\n* Calculation models align directly to regulatory standards and KMS definitions.`;
    }
  }

  return {
    channel,
    narrative: tailoredNarrative
  };
}
