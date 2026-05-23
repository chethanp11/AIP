# Capability: Narrative Generation

*   **Location**: `capabilities/narrative_generation/`
*   **Status**: Placeholder Interface

## 📌 Description
Translates tabular datasets, key performance metric results, and trend lists into high-quality, professional, business-grounded narrative text.

## ⚙️ Expected Interface Contract

### Input JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "NarrativeGenerationInput",
  "type": "object",
  "properties": {
    "metricsData": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "metricId": { "type": "string" },
          "value": { "type": "number" },
          "comparisonValue": { "type": "number" },
          "dimensions": { "type": "object" }
        },
        "required": ["metricId", "value"]
      }
    },
    "templateStyle": {
      "type": "string",
      "enum": ["executive_brief", "bulleted_alerts", "detailed_qa"]
    },
    "maxWords": {
      "type": "integer"
    }
  },
  "required": ["metricsData", "templateStyle"]
}
```

### Output JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "NarrativeGenerationOutput",
  "type": "object",
  "properties": {
    "generatedNarrative": {
      "type": "string",
      "description": "Markdown formatted analytical narrative text."
    },
    "wordCount": {
      "type": "integer"
    }
  },
  "required": ["generatedNarrative", "wordCount"]
}
```
