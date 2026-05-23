import { invoke_capability } from '../../platform-core/intelligence.js';

/**
 * Product 1: Data Preparation Workflow
 * Performs statistical profiling scans and feature recommendations.
 */
export async function data_preparation_workflow(columns, dataset) {
  console.log(`[Workflow: Data Science - Prep] Profiling banking credit features for ${columns.length} columns.`);

  const profiles = {};
  
  columns.forEach(col => {
    profiles[col] = {
      name: col,
      nullCount: 0,
      dataType: 'numeric',
      recommendations: []
    };
  });

  dataset.forEach(row => {
    columns.forEach(col => {
      const val = row[col];
      if (val === null || val === undefined || val === '') {
        profiles[col].nullCount++;
      }
      if (isNaN(val) && typeof val !== 'number') {
        profiles[col].dataType = 'categorical';
      }
    });
  });

  columns.forEach(col => {
    const prof = profiles[col];
    if (prof.nullCount > 0) {
      prof.recommendations.push(`Impute ${prof.nullCount} missing cells using median value replacement.`);
    }
    if (prof.dataType === 'categorical') {
      prof.recommendations.push("Apply One-Hot Encoding vectorization for banking categories.");
    } else {
      prof.recommendations.push("Standardize continuous metrics using MinMax Scaling.");
    }
  });

  return {
    columns: columns.map(c => profiles[c]),
    rowCount: dataset.length
  };
}

/**
 * Product 2: Model Development
 * Tracks hyperparameter combinations and validation scores across credit risk classifier experimental runs.
 */
export async function get_model_experiments_workflow() {
  console.log(`[Workflow: Data Science - Develop] Compiling credit risk classification experiments.`);
  
  // Seed credit classifier training runs data
  const experiments = [
    { runId: 'run_xgb_credit_001', learningRate: 0.01, batchSize: 32, epochs: 50, accuracy: 0.89, rocArea: 0.92, status: 'completed' },
    { runId: 'run_xgb_credit_002', learningRate: 0.05, batchSize: 64, epochs: 80, accuracy: 0.84, rocArea: 0.88, status: 'completed' },
    { runId: 'run_xgb_credit_003', learningRate: 0.001, batchSize: 32, epochs: 100, accuracy: 0.93, rocArea: 0.96, status: 'completed' },
    { runId: 'run_xgb_credit_004', learningRate: 0.1, batchSize: 128, epochs: 30, accuracy: 0.72, rocArea: 0.76, status: 'completed' }
  ];

  return {
    experiments,
    totalCount: experiments.length,
    championRun: 'run_xgb_credit_003'
  };
}

/**
 * Product 3: Model Documentation (Model Governance)
 * Generates an audit-ready Model Governance Document package detailing parameters and schemas for compliance.
 */
export async function generate_model_documentation_workflow(modelId, framework, championRun) {
  console.log(`[Workflow: Data Science - Document] Compiling regulatory compliance package for credit model: ${modelId}`);

  const metadata = `Model ID: ${modelId} | Framework: ${framework} | Champion Training Run: ${championRun}`;
  
  // Reuse summarization capability to distill metadata details
  const summary = await invoke_capability('summarization', { text: metadata });

  const documentationMarkdown = `# Model Governance & Compliance Booklet
  
## 🏷️ Credit Risk Model Registration Details
* **Model ID**: ${modelId}
* **Model Class**: XGBoost Credit Defaults Classifier
* **Development Framework**: ${framework}
* **Champion Training Run ID**: ${championRun}
* **Deployment Date**: ${new Date().toLocaleDateString()}

## 🔒 Compliance & Lineage Audit
* **Data Origin**: Internal Banking Ledger Datasets (Core Warehouses Layer 3).
* **KMS Grounding Policy**: Model features must bind strictly to verified KMS semantic metric calculations to prevent leaks.
* **Audit Summary**: ${summary.summary}

## 📊 Evaluation Statistics
* **Target Prediction Baseline ROC-AUC**: 96%
* **Baseline Latency Constraints**: <150ms
* **Fair Lending Bias Index**: Passed (Disparate Impact Ratio > 0.80)`;

  return {
    modelId,
    governanceBooklet: documentationMarkdown
  };
}

/**
 * Product 4: Model Pulse Workflow (Drift Monitor)
 * Periodically visualizes models performance and triggers concept drift alerts.
 */
export async function model_pulse_workflow(accuracyMetrics) {
  console.log(`[Workflow: Data Science - Pulse] Auditing prediction drift for credit classifier.`);

  const trends = accuracyMetrics.map(m => m.accuracy || 0);
  const latency = accuracyMetrics.map(m => m.latency || 0);
  
  const statisticalReport = await invoke_capability('metric_interpretation', {
    metricId: 'Model Accuracy',
    trends,
    analysisType: 'anomaly'
  });

  const trainingBaseline = 0.93; // Matches our champion run 0.93 accuracy
  const latestAccuracy = trends[trends.length - 1] || 0.85;
  const driftDetected = latestAccuracy < (trainingBaseline - 0.05);

  let driftStatus = 'stable';
  let driftExplanation = 'Credit prediction performance remains within normal limits.';
  
  if (driftDetected) {
    driftStatus = 'warning';
    driftExplanation = `⚠️ Concept Drift Detected! Latest default prediction accuracy (${latestAccuracy}) has drifted significantly below the approved regulatory baseline (${trainingBaseline}). Retraining required.`;
  }

  const accuracyViz = await invoke_capability('visualization', {
    chartType: 'line',
    trends
  });

  return {
    drift: {
      status: driftStatus,
      explanation: driftExplanation,
      driftScore: parseFloat(Math.abs(trainingBaseline - latestAccuracy).toFixed(3))
    },
    performanceReport: statisticalReport,
    accuracyVegaSpec: accuracyViz.vegaSpec,
    avgLatency: parseFloat((latency.reduce((a, b) => a + b, 0) / latency.length || 0).toFixed(1)) + 'ms'
  };
}
