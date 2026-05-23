# Capability: Knowledge Retrieval

*   **Location**: `capabilities/knowledge_retrieval/`
*   **Status**: Placeholder Interface

## 📌 Description
Responsible for querying, searching, and reading semantic metrics, glossary words, and schemas from the Knowledge Management System (KMS) located under `/knowledge/`.

## ⚙️ Expected Interface Contract

### Input JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KnowledgeRetrievalInput",
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The search term or metric name to retrieve definitions for."
    },
    "focusAreas": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["metrics", "glossary", "schemas"]
      }
    }
  },
  "required": ["query", "focusAreas"]
}
```

### Output JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "KnowledgeRetrievalOutput",
  "type": "object",
  "properties": {
    "matchedEntities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string" },
          "definition": { "type": "string" },
          "references": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["id", "type", "definition"]
      }
    },
    "groundingPromptContext": {
      "type": "string"
    }
  },
  "required": ["matchedEntities", "groundingPromptContext"]
}
```
