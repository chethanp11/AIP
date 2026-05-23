# Workflows: Data Science & ML Suite

This directory contains the stateful workflows that run statistical predictions, time-series forecasting, and model lifecycle executions.

## 📋 Standard Workflows
- **Predictive Metric Forecast Pipeline**: Runs weekly forecasting models on top of historical KMS metric values.
- **Model Training Grounding Pipeline**: Generates consistent feature datasets directly from semantic definitions for training.
- **Model Deployment & Validation Runner**: Registers models and validates prediction accuracy thresholds.

## ⚙️ Standard Capabilities Composed
- `capabilities/knowledge_retrieval`
- `capabilities/metric_interpretation`
- `capabilities/orchestration`
- `capabilities/mcp_integration`
