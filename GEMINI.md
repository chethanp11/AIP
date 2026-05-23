# GEMINI.md: Gemini Agent Command Center
## AIM Intelligence Platform (AIP)

Welcome, **Gemini Coding Agent**! 

This document serves as your operational dashboard, conceptual anchor, and command center for developing, maintaining, and expanding the **AIM Intelligence Platform (AIP)**. Ground yourself in these guidelines before executing any task on this codebase.

---

## 🎯 1. Concept Grounding: What is AIP?

AIP is **not** a chatbot, a BI dashboard, or a single workflow utility. It is a unified **governed analytics operating system** for analytics professionals.

AIP enforces a strict value chain:
```
  ┌────────────────────────────────────────────────────────┐
  │                   Knowledge Layer (KMS)                │
  │     (Metrics Glossary, Business Terms, Playbooks)      │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                    Intelligence Layer                  │
  │     (Registry, Context tracking, Routing Engine)       │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                  Reusable Capabilities                 │
  │         (Summarization, Visual, Interpretation)        │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                    Application Suites                  │
  │     (Reporting, Analytics, Automation, and DS/ML)      │
  └──────────────────────────┬─────────────────────────────┘
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                   Analytical Outcomes                  │
  │           (Traceable, Non-Hallucinated Decisions)      │
  └────────────────────────────────────────────────────────┘
```

---

## 🗂️ 2. Custom Agent Skills Catalog

To accelerate development and align your coding steps, three custom agent skills have been defined under `.gemini/skills/`. When performing relevant tasks, view these files to inherit their expert rules:

1.  **[AIP Capability Builder](file:///.gemini/skills/aip-capability-builder/SKILL.md)**:
    *   *Trigger*: When asked to create or modify a stateless capability under `capabilities/`.
    *   *Guidelines*: Enforces statelessness, schema typing, registry registrations, and validation rules.
2.  **[AIP Workflow Composer](file:///.gemini/skills/aip-workflow-composer/SKILL.md)**:
    *   *Trigger*: When asked to compile or coordinate product workflows under `workflows/`.
    *   *Guidelines*: Guides stateful routing, capabilities compositions, step logging, and error handling.
3.  **[AIP KMS Grounder](file:///.gemini/skills/aip-kms-grounder/SKILL.md)**:
    *   *Trigger*: When asked to modify or add seed configurations under `knowledge/`.
    *   *Guidelines*: Establishes metric formulas syntax rules, duplicates checking, and Jaccard overlaps scanning.

---

## 💻 3. Operational Command Center

### Running the App locally
To start the Express server and serve the dynamic SPA UI:
```bash
npm install
npm start
```
*   **Port**: `http://localhost:3000`
*   **Static UI Files**: `/ui` folder
*   **Backend Entry Point**: `/platform-core/server.js`

### Active Platform API Endpoints
*   `GET /api/v1/capabilities`: List all registered shared capabilities.
*   `POST /api/v1/capabilities/invoke`: Invokes a capability dynamically.
*   `GET /api/v1/execution-logs`: Displays traces audit logs.
*   `GET /api/v1/knowledge/search?q=...`: Scans KMS configurations.
*   `POST /api/v1/workflows/reporting/conversational-bi`: Run Conversational BI.
*   `POST /api/v1/workflows/reporting/prism-lite`: Run inventory rationalization.
*   `POST /api/v1/workflows/analytics/rca`: Run automated RCA.
*   `POST /api/v1/workflows/ds/prep`: Run data prep profiler.
*   `POST /api/v1/workflows/ds/model-pulse`: Run drift tracking.
*   `POST /api/v1/workflows/automation/run`: Run custom DAG simulation.

---

## 🚨 Core Rules for Gemini Agent

1.  **No Duplicate Logic**: If a workflow needs data profiling, statistics, or chart specifications, **do not write local math in the workflow**. You must invoke `metric_interpretation` or `visualization` via the capability registry!
2.  **Stateless Capabilities**: Never write persistent files, session variables, or caches inside a capability. State tracking resides solely in the `platform-core` session memory or the database.
3.  **Preserve Living Docs**: Ensure all changes are immediately compiled into `walkthrough.md` or `system_requirements.md` in sync.
4.  **Premium Light Theme Aesthetics**: When adding HTML or CSS variables inside `/ui`, prioritize smooth transitions, tailored HSL colors, glassmorphic backdrop-filters, and Outfit/Inter display typography.

*Now, proceed to the custom skills and execute AIP missions.*
