# System Design Document: AIP for Banking Analytics

## 🏗️ 1. Core Architectural Overview

The **AIM Intelligence Platform (AIP)** leverages a modular, decoupled architecture consisting of a premium **HTML/CSS/JS SPA Client** and a unified **Python (FastAPI) Backend**.

The system segregates logic into distinct layers:
1.  **Stateful Suites Layer (`src/`)**: 4 product suites containing 16 independent agentic modules driven by localized expert personas.
2.  **Shared Capabilities Layer (`shared/`)**: Decoupled, stateless utility blocks (e.g. `summarization.py`, `visualization.py`) registered inside a central registry.
3.  **Knowledge Grounding Layer (`src/kms/`)**: Provides canonical metrics indexes and glossary terminology templates.
4.  **Data Layer (`data/`)**: A fast, zero-dependency file-based database containing deposits, loans, assets, and branch sheets.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AIP SPA Client (ui/)                           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (HTTP / Bearer Auth Token: AIP-...)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FastAPI API Gateway (src/main.py)                  │
│       - Session Authentication & token verification middleware          │
│       - Thread-safe Context Tracing (using Python's contextvars)        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ Grounding Index │         │ Agentic Suites  │         │   Capabilities  │
│ (src/kms/index) │         │ (src/<suites>/) │         │    Registry     │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Shared Intelligence Registry (shared/)               │
│    - call_llm completions  •  Trace Auditing logs  •  Env loaders       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 2. Thread-Safe Request Context Tracing

To enforce strict banking governance, every analytics step registers:
1.  Which **Specialized AI Agent** ran the step.
2.  The signature of the authorized **Analyst API Key** (Bearer token starting with `AIP-`).

In Python, we achieve this through **`contextvars`** (context variables). This ensures thread-safe, request-scoped context propagation across asynchronous callbacks:
*   When a request hits `authMiddleware` in FastAPI, the token and the matching Suite Agent persona are written to `active_agent_context`.
*   Every downstream capability call (such as a metrics summary or standard audit check) reads this variable to stamp audit trail traces dynamically.
*   Token values are automatically masked (e.g., `AIP-ANALYST-SESSION-AOG0WLT3T` is audited as `AIP-AN***`) before being appended to the `execution-logs` database.

---

## ⚡ 3. Zero-Dependency Intelligence Core

To keep the platform lightweight and reliable, we bypass bulky heavy frameworks (like LangChain) in favor of a native, zero-dependency core:
*   **Env Variable Loader**: Implemented via custom file parsing to isolate environment configurations at runtime.
*   **OpenAI Completions Client (`call_llm`)**: Operates on top of Python's standard `urllib.request` library. It makes HTTP POST requests to `api.openai.com/v1/chat/completions` utilizing the API key loaded from `.env`.
*   **Offline Heuristic Fallback Engine**: If the OpenAI key is missing or invalid, workflows seamlessly drop back to high-fidelity, deterministic local Z-score anomaly scorers and HTML layout builders, ensuring 100% service availability.

---

## 📊 4. Database Grounding & LMS Connector

The platform integrates directly with the local **Liquidity Management System (LMS)** database at `data/lms_database.json`:
*   The database is file-based and contains structured arrays representing four ledgers: `deposits`, `loans`, `liquidity_buffers`, and `branch_performance`.
*   Stateful workflows query this JSON directly utilizing native Python dictionary operations, mimicking sub-second relational SQL indexes without requiring platform-dependent DB drivers.

---

## 🌐 5. Unified API Gateway Endpoints Route Map

FastAPI routes are grouped under `/api/v1` and protected by security middleware:

| Route Path | Method | Access Persona | Action |
| :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | Public | Authenticates analyst, returns session token |
| `/lms/query` | `GET` | Analyst | Queries active LMS ledger arrays |
| `/knowledge/search` | `GET` | Grounding Agent | Searches KMS glossary playbooks |
| `/capabilities` | `GET` | Platform Routing | Lists active registered modules |
| `/capabilities/invoke`| `POST` | Platform Routing | Dynamically triggers a stateless task |
| `/execution-logs` | `GET` | Platform Routing | Retrieves audit trail trace telemetry |
| `/execution-logs` | `DELETE`| Platform Routing | Purges trace audit databases |
| `/workflows/reporting/prism-lite` | `POST` | PRISM Agent | Audits report query overlap metrics |
| `/workflows/reporting/build` | `POST` | Builder Agent | Renders dynamic HTML reports from LMS |
| `/workflows/reporting/conversational-bi`| `POST` | BI Agent | Answers NLQ grounded in formulas |
| `/workflows/reporting/proactive-insights`| `GET` | Monitor Agent | Generates Z-score anomaly alerts |
