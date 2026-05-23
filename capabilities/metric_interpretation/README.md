# Capability: Metric Interpretation

*   **Location**: `capabilities/metric_interpretation/`
*   **Status**: Placeholder Interface

## 📌 Description
Executes quantitative analytics calculations, identifies anomalies in time-series trends, conducts variance audits, and performs root-cause driver scans.

## ⚙️ Expected Interface Contract

### Input JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MetricInterpretationInput",
  "type": "object",
  "properties": {
    "metricId": {
      "type": "string"
    },
    "timeSeries": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "timestamp": { "type": "string" },
          "value": { "type": "number" }
        },
        "required": ["timestamp", "value"]
      }
    },
    "analysisType": {
      "type": "string",
      "enum": ["anomaly_detection", "variance_analysis", "trend_projection"]
    }
  },
  "required": ["metricId", "timeSeries", "analysisType"]
}
```

### Output JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MetricInterpretationOutput",
  "type": "object",
  "properties": {
    "metricId": { "type": "string" },
    "analysisType": { "type": "string" },
    "insights": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "description": { "type": "string" },
          "severity": { "type": "string", "enum": ["low", "medium", "high"] }
        },
        "required": ["type", "description"]
      }
    },
    "metadata": {
      "type": "object",
      "description": "Additional raw calculation arrays and confidence scores."
    }
  },
  "required": ["metricId", "analysisType", "insights"]
}
```
