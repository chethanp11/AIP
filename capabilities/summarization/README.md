# Capability: Summarization

*   **Location**: `capabilities/summarization/`
*   **Status**: Placeholder Interface

## 📌 Description
Responsible for compressing large text payloads, historical log lists, conversational histories, or extensive business papers into atomic bullet summaries.

## ⚙️ Expected Interface Contract

### Input JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SummarizationInput",
  "type": "object",
  "properties": {
    "sourceText": {
      "type": "string",
      "description": "The raw input text content to summarize."
    },
    "summaryType": {
      "type": "string",
      "enum": ["one_liner", "key_takeaways", "structural_bullets"]
    },
    "bulletLimit": {
      "type": "integer"
    }
  },
  "required": ["sourceText", "summaryType"]
}
```

### Output JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SummarizationOutput",
  "type": "object",
  "properties": {
    "summaryText": {
      "type": "string"
    },
    "compressedRatio": {
      "type": "number",
      "description": "The ratio of summary characters divided by original characters."
    }
  },
  "required": ["summaryText"]
}
```
