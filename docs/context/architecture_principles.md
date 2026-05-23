# AIP Architecture & Design Principles

This document defines the strict engineering guidelines and architectural boundaries for the **AIM Intelligence Platform (AIP)** codebase. All developers and AI agents must adhere to these principles to maintain codebase sanity, testability, and agent-native execution.

---

## 📐 1. Repository Layer Boundaries

To prevent dependency cycles and bloated modules, the codebase enforces a strict directional dependency rule:

```
┌────────────────────────────────────────────────────────┐
│                        ui/                             │
└─────────────────────────┬──────────────────────────────┘
                          │ (Queries state & triggers)
                          ▼
┌────────────────────────────────────────────────────────┐
│                    workflows/                          │
│   (Stateful pipelines, event triggers, DAG runs)        │
└─────────────────────────┬──────────────────────────────┘
                          │ (Composes & coordinates)
                          ▼
┌────────────────────────────────────────────────────────┐
│                   capabilities/                        │
│   (Stateless atomic transforms & cognitive tasks)      │
└───────────┬──────────────────────────────┬─────────────┘
            │ (Grounds operations)         │ (Shared libraries)
            ▼                              ▼
┌───────────────────────┐      ┌─────────────────────────┐
│      knowledge/       │      │     platform-core/      │
│  (Semantic definitions,│      │ (Telemetry, base agents,│
│   metric trees, schemas)│      │  security, db connectors)│
└───────────────────────┘      └─────────────────────────┘
```

### 🚫 Rules of Importation
1.  **Workflows -> Capabilities**: Workflows *may* import capabilities. Capabilities *must never* import workflows.
2.  **Stateless Capabilities**: A capability under `capabilities/` must be stateless. It should accept inputs, perform an operation (e.g., text parsing, chart generation, mathematical calculation), and return outputs.
3.  **No Inter-Capability Imports**: Capabilities must remain completely decoupled. For example, `capabilities/narrative_generation` should never import `capabilities/visualization` directly. If a task requires both, the coordination must happen at the **Workflow** level or through the **Orchestration** capability.
4.  **Shared Foundation**: Common utilities, database adapters, telemetry, and base classes reside solely in `platform-core/`. Neither capabilities nor workflows should implement custom low-level database queries or telemetry drivers.

---

## 🛠️ 2. Core Architectural Principles

### A. Separation between Workflows and Reusable Capabilities
*   **Capabilities are stateless utilities**: They publish public contracts (e.g., JSON schemas or strongly typed interfaces). They do not know who is calling them or why.
*   **Workflows are stateful compositions**: They map user-facing business logic to sequences of capability calls. They handle execution logs, session persistence, error recovery, and Human-in-the-Loop interruptions.

### B. Knowledge-Grounded Execution (KMS)
*   **Rule**: Never write analytical prompts or calculations that execute unguided.
*   **Execution Pattern**: Before any LLM/cognitive function computes an analytical narrative, it must first run a structured query through the `capabilities/knowledge_retrieval` module to fetch the accurate, version-controlled business definition from `knowledge/`.

### C. Agent-Native Codebase
*   **Why**: AIP is built to be run and maintained by human engineers in partnership with autonomous AI software agents.
*   **Implementation**:
    *   Every directory must contain an explicit `README.md` explaining its purpose and interfaces.
    *   Code must be highly structured, using typed parameters (e.g., TypeScript or Pydantic models).
    *   Avoid complex metaprogramming or dynamic class creation that obfuscates code paths from static analysis tools.

### D. Model Context Protocol (MCP) Native
*   **Why**: To support custom integrations and modular capability scaling.
*   **Implementation**: All core analytical engines inside AIP communicate internally using JSON-RPC based Model Context Protocol packets. This enables capabilities inside `/capabilities/mcp_integration` to act as standard bridges to external systems.

---

## 🧪 3. Verification & Testing Standards

To maintain standard execution quality across all layers, the following test types must be implemented for any new component:

1.  **Unit Tests (Stateless)**:
    *   Target: `capabilities/`
    *   Rule: Must use mock data inputs. Since capabilities are stateless, unit testing should verify output contracts given precise, edge-case input parameters.
2.  **Workflow Integration Tests (Stateful)**:
    *   Target: `workflows/`
    *   Rule: Test pipeline execution DAGs. Verify that error-handling, state tracking, and retry logic are successfully triggered.
3.  **Knowledge Assertions**:
    *   Target: `knowledge/`
    *   Rule: Programmatic checks that verify all metric trees are valid DAGs, semantic references exist, and schemas parse correctly.
