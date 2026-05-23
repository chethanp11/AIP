# Capability: Visualization

*   **Location**: `capabilities/visualization/`
*   **Status**: Placeholder Interface

## 📌 Description
Translates relational datasets or aggregated metrics vectors into dynamic, declarative visualization directives (e.g. Vega-Lite specifications) ready for frontend rendering.

## ⚙️ Expected Interface Contract

### Input JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VisualizationInput",
  "type": "object",
  "properties": {
    "data": {
      "type": "array",
      "items": { "type": "object" }
    },
    "chartType": {
      "type": "string",
      "enum": ["bar", "line", "scatter", "metric_tree", "heatmap"]
    },
    "mapping": {
      "type": "object",
      "properties": {
        "x": { "type": "string" },
        "y": { "type": "string" },
        "color": { "type": "string" }
      },
      "required": ["x", "y"]
    }
  },
  "required": ["data", "chartType", "mapping"]
}
```

### Output JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VisualizationOutput",
  "type": "object",
  "properties": {
    "vegaSpec": {
      "type": "object",
      "description": "Full valid Vega-Lite visualization JSON directive."
    },
    "recommendedLayout": {
      "type": "string",
      "enum": ["full_width", "card_half", "sidebar"]
    }
  },
  "required": ["vegaSpec"]
}
```
