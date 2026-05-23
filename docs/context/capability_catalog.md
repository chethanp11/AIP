# AIP Shared Capability & Foundations Catalog

This catalog outlines the foundation layers and shared core capabilities of the **AIM Intelligence Platform (AIP)**. AIP separates stateful, product-specific workflows from these stateless, highly reusable baseline capabilities.

---

## 🏗️ The 3 Foundation Layers

AIP's architecture is structured upon three distinct, directional layers that power all application suites.

```mermaid
graph TD
    subgraph Layer 1 [Knowledge Management System KMS]
        KMS_SR[Semantic Retrieval]
        KMS_MD[Metadata Engine]
        KMS_GL[Glossary System]
        KMS_LN[Lineage Tracker]
        KMS_TP[Templates Registry]
        KMS_KP[Knowledge Packaging]
        KMS_KS[Knowledge Search]
        KMS_CR[Context Retrieval]
    end

    subgraph Layer 2 [Intelligence Layer]
        INT_OR[Orchestration]
        INT_CM[Context Management]
        INT_KR[Knowledge Retrieval]
        INT_RS[Reasoning Engine]
        INT_SM[Session Management]
        INT_EC[Execution Coordination]
        INT_MC[MCP Integration]
        INT_CR[Capability Routing]
    end

    subgraph Layer 3 [Data Layer]
        DAT_ED[(Enterprise Datasets)]
        DAT_FL[Files Storage]
        DAT_OP[(Operational Systems)]
        DAT_AA[(Analytical Assets)]
    end

    Layer 2 --> Layer 1
    Layer 2 --> Layer 3
```

### 🧠 Foundation Layer 1: Knowledge Management System (KMS)
*   **Purpose**: Provides the unified institutional knowledge foundation. KMS ensures that all analytical reasoning, metric calculations, and business queries are grounded in structured, version-controlled definitions. KMS powers all suites.
*   **Layer Capabilities**:
    *   **Semantic Retrieval**: Maps natural language concepts and expressions to structured dictionary items using vector embeddings.
    *   **Metadata**: Manages tags, ownership, and structural schemas for all analytical assets.
    *   **Glossary**: The central record of enterprise terminology, definitions, and acronym synonyms.
    *   **Lineage**: Maps mathematical calculations and database schemas, tracking source-to-target dependencies.
    *   **Templates**: Holds reusable layouts, visual patterns, and reporting syntaxes.
    *   **Knowledge Packaging**: Compiles metric sub-trees, glossary lists, and playbooks into deployable configurations.
    *   **Knowledge Search**: Centralized search index for discovering metadata, metrics, and report definitions.
    *   **Context Retrieval**: Locates and retrieves historical context, decisions, and documentation relevant to active sessions.

### ⚡ Foundation Layer 2: Intelligence Layer
*   **Purpose**: Provides shared platform intelligence, cognitive routing, session tracking, and external integration.
*   **Layer Capabilities**:
    *   **Orchestration**: Directs multi-step execution graphs and coordinates task sequences.
    *   **Context Management**: Tracks active filters, conversation state, and parameters across a session.
    *   **Knowledge Retrieval**: The active gateway that retrieves KMS facts to ground LLM prompts.
    *   **Reasoning**: Structured reasoning patterns (chain-of-thought, self-correction) that analyze data outputs.
    *   **Session Management**: Handles session lifecycles, states, and user profile bounds.
    *   **Execution Coordination**: Manages the runtime dependencies and data streams between capabilities.
    *   **MCP Integration**: Safety client standardizing connections to enterprise assets via Model Context Protocol.
    *   **Capability Routing**: Dynamically resolves and routes task requests to the optimal capability folder.

### 💾 Foundation Layer 3: Data Layer
*   **Purpose**: Provides secure, unified analytical data access across all corporate data types.
*   **Constraints**: Strictly internal; **no external third-party integrations required**.
*   **Layer Capabilities**:
    *   **Enterprise Datasets**: Interface adapters to governed data warehouses and query engines (e.g. BigQuery, Snowflake, ClickHouse).
    *   **Files**: Access to internal blob storage (e.g. parquet tables, csv files, pdf briefs).
    *   **Operational Systems**: Read-only bridges to transactional corporate databases.
    *   **Analytical Assets**: Connectors to pre-computed dashboards, database views, and analytics models.

---

## ⚙️ Shared Capability Framework Specifications

Capabilities under `/capabilities/` represent stateless atomic implementations of the Intelligence Layer's requirements. They must:
- Expose strictly defined interfaces (JSON Schemas or typed contracts).
- Remain reusable across all suites.
- Avoid any workflow or product-specific ownership.

| Capability Folder | Core API Service | Input/Output Standard |
| :--- | :--- | :--- |
| **`knowledge_retrieval/`** | Retrieves matching semantic context and metric definitions from KMS. | Input: `Query` & `Scope` | Output: `GroundingContext` |
| **`context_management/`** | Standardizes session variable reads, updates, and memory pruning. | Input: `SessionID` & `Action` | Output: `SessionState` |
| **`narrative_generation/`**| Compiles data arrays and structures into fluent markdown reports. | Input: `MetricsData` & `Style` | Output: `MarkdownText` |
| **`summarization/`** | Condenses text assets, logs, or reports using rapid models. | Input: `SourceText` & `Ratio` | Output: `SummarizedText` |
| **`metric_interpretation/`**| Python statistical audits (anomaly flagging, variance scans). | Input: `TimeSeries` & `AnalysisType` | Output: `StatisticalInsights` |
| **`visualization/`** | Generates valid Vega-Lite visualization JSON specifications. | Input: `Data` & `ChartType` | Output: `VegaLiteJSONSpec` |
| **`orchestration/`** | Custom DAG execution client with run-time dependency routers. | Input: `WorkflowDAG` & `State` | Output: `ExecutionLogs` |
| **`mcp_integration/`** | MCP client handling secure JSON-RPC tool and resource calls. | Input: `Server` & `Tool` & `Args` | Output: `ToolContent` |
