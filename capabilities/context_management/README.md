# Capability: Context Management

*   **Location**: `capabilities/context_management/`
*   **Status**: Placeholder Interface

## 📌 Description
Tracks and persists analytical conversation histories, user settings, active session variables, and temporary workflow execution contexts.

## ⚙️ Expected Interface Contract

### Input JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ContextManagementInput",
  "type": "object",
  "properties": {
    "sessionId": {
      "type": "string",
      "description": "Unique session identifier"
    },
    "action": {
      "type": "string",
      "enum": ["get", "set", "clear"]
    },
    "key": {
      "type": "string"
    },
    "value": {
      "type": "object",
      "description": "Context value payload (if action is 'set')"
    }
  },
  "required": ["sessionId", "action"]
}
```

### Output JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ContextManagementOutput",
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "sessionId": { "type": "string" },
    "payload": {
      "type": "object",
      "description": "The returned context state"
    }
  },
  "required": ["success", "sessionId"]
}
```
