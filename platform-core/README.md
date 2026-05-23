# Platform Core

This directory contains the shared, internal, low-level foundation libraries, base classes, utilities, and security rules that support the operations of capabilities and workflows.

## 📁 Directory Scope
*   **Base Agents**: Core prompt routers, standard retry loops, context-window managers, and error handling frameworks.
*   **Security & Telemetry**: Authentication adapters, authorization validators, structural telemetry loggers, and distributed span tracers.
*   **Database & Storage Adaptors**: Governed connector utilities to databases (BigQuery, Snowflake, etc.) and semantic caching layers.
*   **Protocol Handlers**: Standard parser protocols (JSON-RPC adapters, MCP helpers).

## ⚠️ Guidelines
1.  Code in `platform-core/` should be generic and not possess suite-specific business logic.
2.  Maintain exhaustive test coverage for all security and protocol adapter code.
