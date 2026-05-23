import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

// Import intelligence registry
import { 
  register_capability, 
  invoke_capability, 
  list_capabilities, 
  get_logs,
  clear_logs,
  agentContextStorage
} from './intelligence.js';

// Import stateless capabilities modules
import knowledgeRetrievalCap from '../capabilities/knowledge_retrieval/index.js';
import contextManagementCap from '../capabilities/context_management/index.js';
import summarizationCap from '../capabilities/summarization/index.js';
import narrativeGenerationCap from '../capabilities/narrative_generation/index.js';
import metricInterpretationCap from '../capabilities/metric_interpretation/index.js';
import visualizationCap from '../capabilities/visualization/index.js';
import orchestrationCap from '../capabilities/orchestration/index.js';
import mcpIntegrationCap from '../capabilities/mcp_integration/index.js';

// Import workflows
import { 
  conversational_bi_workflow, 
  prism_lite_workflow,
  build_report_workflow,
  get_proactive_insights_workflow
} from '../workflows/reporting/index.js';

import { 
  root_cause_analysis_workflow,
  insight_discovery_workflow,
  what_if_analysis_workflow,
  generate_business_narratives_workflow
} from '../workflows/business_analytics/index.js';

import { 
  data_preparation_workflow, 
  model_pulse_workflow,
  get_model_experiments_workflow,
  generate_model_documentation_workflow
} from '../workflows/data_science_ml/index.js';

import { 
  run_custom_workflow_workflow,
  get_active_approvals,
  resume_approval_workflow,
  get_telemetry_workflow
} from '../workflows/workflow_automation/index.js';

// Initialize and Register Capabilities
register_capability(knowledgeRetrievalCap.name, knowledgeRetrievalCap.config, knowledgeRetrievalCap.handler);
register_capability(contextManagementCap.name, contextManagementCap.config, contextManagementCap.handler);
register_capability(summarizationCap.name, summarizationCap.config, summarizationCap.handler);
register_capability(narrativeGenerationCap.name, narrativeGenerationCap.config, narrativeGenerationCap.handler);
register_capability(metricInterpretationCap.name, metricInterpretationCap.config, metricInterpretationCap.handler);
register_capability(visualizationCap.name, visualizationCap.config, visualizationCap.handler);
register_capability(orchestrationCap.name, orchestrationCap.config, orchestrationCap.handler);
register_capability(mcpIntegrationCap.name, mcpIntegrationCap.config, mcpIntegrationCap.handler);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve Static Frontend UI
app.use(express.static(path.resolve('ui')));

// =============================================================
// 🔒 Secure API Key Authorization & Context Mapping Middleware
// =============================================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const apiKey = authHeader && authHeader.split(' ')[1];
  if (!apiKey || !apiKey.startsWith('AIP-')) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid API key. Must start with 'AIP-'" });
  }
  next();
}

function runInContext(agentName) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const apiKey = authHeader && authHeader.split(' ')[1];
    agentContextStorage.run({ agent: agentName, apiKey: apiKey || '' }, () => {
      next();
    });
  };
}

// ==========================================
// 🔑 Analyst Authentication Endpoint
// ==========================================
app.post('/api/v1/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === 'analyst' && password === 'password') {
      const secureToken = 'AIP-ANALYST-SESSION-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      console.log(`[Auth Success] Authenticated Analyst. Issued secure session token: ${secureToken}`);
      res.json({ success: true, token: secureToken, role: 'Analyst' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid analyst credentials. Standard: analyst / password' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 📊 Liquidity Management System (LMS) Database Endpoints
// ==========================================
app.get('/api/v1/lms/query', authMiddleware, runInContext('Analytical Grounding Agent'), (req, res) => {
  try {
    const { table } = req.query;
    const dbPath = path.resolve('data/lms_database.json');
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: "Liquidity Management System (LMS) database file not found." });
    }
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (table) {
      if (db[table]) {
        res.json(db[table]);
      } else {
        res.status(404).json({ error: `Table '${table}' not found in LMS database.` });
      }
    } else {
      res.json(db);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 1. Centralized KMS Endpoints
// ==========================================
app.get('/api/v1/knowledge/search', authMiddleware, runInContext('Analytical Grounding Agent'), async (req, res) => {
  try {
    const query = req.query.q || '';
    const retrieval = await invoke_capability('knowledge_retrieval', { question: query });
    res.json(retrieval);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/knowledge/context', authMiddleware, runInContext('Analytical Grounding Agent'), async (req, res) => {
  try {
    const query = req.query.q || '';
    const retrieval = await invoke_capability('knowledge_retrieval', { question: query });
    res.json({ context: retrieval.context });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. Intelligence Layer & Capability Registry
// ==========================================
app.get('/api/v1/capabilities', authMiddleware, runInContext('Orchestration Supervisor Agent'), (req, res) => {
  res.json(list_capabilities());
});

app.post('/api/v1/capabilities/invoke', authMiddleware, runInContext('Orchestration Supervisor Agent'), async (req, res) => {
  try {
    const { name, input } = req.body;
    const output = await invoke_capability(name, input);
    res.json({ success: true, output });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/v1/execution-logs', authMiddleware, runInContext('Orchestration Supervisor Agent'), (req, res) => {
  res.json(get_logs());
});

app.delete('/api/v1/execution-logs', authMiddleware, runInContext('Orchestration Supervisor Agent'), (req, res) => {
  clear_logs();
  res.json({ success: true });
});

// ==========================================
// 3. Reporting Suite API Endpoints
// ==========================================
app.post('/api/v1/workflows/reporting/conversational-bi', authMiddleware, runInContext('Conversational BI Agent'), async (req, res) => {
  try {
    const { question } = req.body;
    const result = await conversational_bi_workflow(question);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/workflows/reporting/prism-lite', authMiddleware, runInContext('PRISM Agent'), async (req, res) => {
  try {
    const { reports } = req.body;
    const result = await prism_lite_workflow(reports || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/workflows/reporting/build', authMiddleware, runInContext('Report Builder Agent'), async (req, res) => {
  try {
    const { metricId, value, compareValue, note } = req.body;
    const result = await build_report_workflow(metricId, value, compareValue, note);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/workflows/reporting/proactive-insights', authMiddleware, runInContext('Proactive Monitor Agent'), async (req, res) => {
  try {
    const result = await get_proactive_insights_workflow();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 4. Business Analytics Suite API Endpoints
// ==========================================
app.post('/api/v1/workflows/analytics/rca', authMiddleware, runInContext('RCA Diagnostic Agent'), async (req, res) => {
  try {
    const { datasetName, metricsData } = req.body;
    const result = await root_cause_analysis_workflow(datasetName, metricsData || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/workflows/analytics/insight-discovery', authMiddleware, runInContext('Insight Discovery Agent'), async (req, res) => {
  try {
    const { segmentsData } = req.body;
    const result = await insight_discovery_workflow(segmentsData || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/workflows/analytics/what-if', authMiddleware, runInContext('What-if Simulator Agent'), async (req, res) => {
  try {
    const { loanRate, depositRate, assets, nplRate } = req.body;
    const result = await what_if_analysis_workflow(loanRate, depositRate, assets, nplRate);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/workflows/analytics/business-narratives', authMiddleware, runInContext('Narrative Storyteller Agent'), async (req, res) => {
  try {
    const { channel, metricName, value, growthRate, primaryDriver } = req.body;
    const result = await generate_business_narratives_workflow(channel, metricName, value, growthRate, primaryDriver);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. Data Science & ML Suite API Endpoints
// ==========================================
app.post('/api/v1/workflows/ds/prep', authMiddleware, runInContext('Data Prep Profiler Agent'), async (req, res) => {
  try {
    const { columns, dataset } = req.body;
    const result = await data_preparation_workflow(columns, dataset || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/workflows/ds/model-pulse', authMiddleware, runInContext('Model Pulse Agent'), async (req, res) => {
  try {
    const { accuracyMetrics } = req.body;
    const result = await model_pulse_workflow(accuracyMetrics || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/workflows/ds/experiments', authMiddleware, runInContext('Model Developer Agent'), async (req, res) => {
  try {
    const result = await get_model_experiments_workflow();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/workflows/ds/document', authMiddleware, runInContext('Model Documenter Agent'), async (req, res) => {
  try {
    const { modelId, framework, championRun } = req.body;
    const result = await generate_model_documentation_workflow(modelId, framework, championRun);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 6. Workflow Automation API Endpoints
// ==========================================
app.post('/api/v1/workflows/automation/run', authMiddleware, runInContext('Workflow Designer Agent'), async (req, res) => {
  try {
    const { config } = req.body;
    const result = await run_custom_workflow_workflow(config);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/workflows/automation/approvals', authMiddleware, runInContext('Orchestration Supervisor Agent'), (req, res) => {
  res.json(get_active_approvals());
});

app.post('/api/v1/workflows/automation/approve', authMiddleware, runInContext('Approval Routing Agent'), async (req, res) => {
  try {
    const { approvalId, approved } = req.body;
    const result = await resume_approval_workflow(approvalId, approved);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/workflows/automation/telemetry', authMiddleware, runInContext('System Monitor Agent'), async (req, res) => {
  try {
    const result = await get_telemetry_workflow();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 AIP Unified Analytics Platform MVP running locally`);
  console.log(`🌐 Address: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
