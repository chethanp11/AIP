# Capability: MCP Integration

*   **Location**: `capabilities/mcp_integration/`
*   **Status**: Placeholder Interface

## 📌 Description
Establishes bi-directional communication channels using the Model Context Protocol (MCP) to plug third-party corporate APIs, custom databases, and external cognitive utilities into AIP.

## ⚙️ Expected Interface Contract

### Input JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MCPIntegrationInput",
  "type": "object",
  "properties": {
    "serverName": {
      "type": "string",
      "description": "Identifier of the target MCP Server."
    },
    "toolName": {
      "type": "string",
      "description": "The specific tool exposed by the server to execute."
    },
    "arguments": {
      "type": "object",
      "description": "Arguments payload matching the tool's JSON-schema."
    }
  },
  "required": ["serverName", "toolName", "arguments"]
}
```

### Output JSON Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MCPIntegrationOutput",
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "content": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["text", "image", "resource"] },
          "text": { "type": "string" },
          "annotations": { "type": "object" }
        },
        "required": ["type"]
      }
    },
    "error": { "type": "string" }
  },
  "required": ["success"]
}
```
