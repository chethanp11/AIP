# AIP Core Glossary

This glossary defines the standard terminology and conceptual models used across the **AIM Intelligence Platform (AIP)**. Consistent usage of these terms is required in all documentation, codebase schemas, API contracts, and AI agent prompts.

---

## 🔤 Core Terms

### 1. Capability
*   **Definition**: A highly modular, stateless, atomic service designed to perform a single, specialized cognitive or utility function.
*   **Examples**: `capabilities/narrative_generation`, `capabilities/visualization`.
*   **Key Rule**: Capabilities must be stateless, strictly typed, and should not contain business-specific workflow logic. They are the reusable Lego blocks of the platform.

### 2. Workflow
*   **Definition**: A stateful, end-to-end orchestration that combines multiple capabilities, human-in-the-loop approvals, and external integration steps to achieve a specific business outcome.
*   **Examples**: `workflows/reporting/monthly_financials`, `workflows/workflow_automation/anomaly_response`.
*   **Key Rule**: Workflows maintain state (e.g., execution history, approvals) and represent user-facing products or automated pipelines.

### 3. Knowledge Management System (KMS)
*   **Definition**: The cognitive repository of the platform, storing version-controlled, declarative files representing metric trees, semantic models, data dictionary metadata, and organizational heuristics.
*   **Key Rule**: All intelligence operations must resolve dynamic questions (e.g., "how is gross margin calculated?") against the KMS rather than letting LLMs guess.

### 4. Metric Tree
*   **Definition**: A structured, hierarchical DAG (Directed Acyclic Graph) representing how different key performance indicators (KPIs) relate to and influence one another.
*   **Example**: `Net Profit` is a parent node dependent on `Revenue` and `Operating Expenses`. `Revenue` is dependent on `Average Order Value (AOV)` and `Orders`.

### 5. Semantic Model
*   **Definition**: A declarative layer written in YAML/JSON that maps raw database tables and fields to meaningful business entities, relationships, and granular metrics.

### 6. Intelligence Layer
*   **Definition**: The cognitive routing layer that interfaces with LLMs, SLMs (Small Language Models), embedding engines, and vector databases. It handles prompt compilation, safety filters, context windows, and token budgets.

### 7. Model Context Protocol (MCP)
*   **Definition**: An open-standard integration layer that allows AIP to expose internal tools to external LLM providers, and conversely, import third-party analytical utilities as native plug-in capabilities.

### 8. Cognitive Index
*   **Definition**: The metadata index stored inside the `.codex/` folder. It provides a structured map of the system's capabilities, schemas, workflows, and developer roles, optimized for parsing by autonomous AI engineering agents.

### 9. Context Management
*   **Definition**: The capability that tracks session history, user preferences, past chat chains, and temporary execution states. It ensures that multi-step analytical sessions retain consistent memory.

### 10. Narrative Generation
*   **Definition**: The process of translating raw data, charts, and metrics into structured, human-readable text stories (e.g., executive summaries, weekly updates) using natural language generation guided by KMS definitions.
