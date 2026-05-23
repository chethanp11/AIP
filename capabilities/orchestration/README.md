# Capability: Orchestration

*   **Location**: `capabilities/orchestration/`
*   **Status**: Placeholder Interface

## 📌 Description
Coordinates the step-by-step execution of modular workflows, schedules task queues, resolves operational execution paths, and manages validation gates.

## ⚙️ Expected Interface Contract

### Input JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "OrchestrationInput",
  "type": "object",
  "properties": {
    "workflowId": {
      "type": "string"
    },
    "executionDag": {
      "type": "object",
      "properties": {
        "steps": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "capability": { "type": "string" },
              "dependsOn": { "type": "array", "items": { "type": "string" } },
              "parameters": { "type": "object" }
            },
            "required": ["id", "capability"]
          }
        }
      },
      "required": ["steps"]
    }
  },
  "required": ["workflowId", "executionDag"]
}
```

### Output JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "OrchestrationOutput",
  "type": "object",
  "properties": {
    "workflowId": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["completed", "running", "failed", "paused_for_approval"]
    },
    "executionLogs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "stepId": { "type": "string" },
          "status": { "type": "string" },
          "durationMs": { "type": "number" },
          "error": { "type": "string" }
        }
      }
    }
  },
  "required": ["workflowId", "status"]
}
```
