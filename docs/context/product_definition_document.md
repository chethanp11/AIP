# Product Definition Document (PDD)
## AIM Intelligence Platform (AIP) for Banking Analytics

---

## 👁️ 1. Product Vision

The **AIM Intelligence Platform (AIP)** is a unified enterprise agentic analytics intelligence platform designed specifically for the **Banking Analytics** organization to improve how financial analytics professionals perform analytical work.

AIP combines:
*   **Reporting Capabilities**
*   **Business Analytics Capabilities**
*   **Workflow Execution Capabilities**
*   **Data Science and Machine Learning Capabilities**
*   **Enterprise Knowledge Utilization**
*   **Shared Intelligence Services**

into a single governed banking analytics ecosystem.

AIP is designed to reduce fragmentation across analytical processes by bringing analytical execution, intelligence generation, workflow automation, and institutional knowledge together into one platform.

> [!IMPORTANT]
> The objective of AIP is not simply AI enablement. 
> The objective is to **create an Agentic AI Operating Layer for Banking Analytics, where 16 specialized Banking AI Agents utilize secure API keys to execute governed, compliant, non-hallucinatory outcomes.**

---

## ⚠️ 2. Problem Statement

Banking analytics organizations operate within highly fragmented and strictly regulated environments:

*   **Reporting Problems**: Manual report builds and duplicate spreadsheets trigger compliance issues. Non-Performing Loan (NPL) ratios and Net Interest Margins (NIM) are reported inconsistently across different risk teams.
*   **Business Analytics Problems**: Dragging query times and repeated context gathering when analyzing margin contractions or liquidity ratios, with zero automated root cause deconstructions.
*   **Workflow Problems**: Disconnected alerts and manual approvals routing trigger operational delays in liquidity audits. No structural lineage trace for audit logs.
*   **Data Science & ML Problems**: Fragile deployment tracking, weak explainability records for credit rating classifiers, and concept drift decays going unnoticed.
*   **Knowledge Problems**: Crucial regulatory definitions, playbooks, and metric logic residing in isolated wikis, leading to duplicate calculations and knowledge dependency on individuals.

---

## 👥 3. Target Users

AIP Banking OS is built for:
*   **Primary Users**: Credit risk analysts, treasury analysts, data scientists training credit classifiers, reporting analysts, and analytics managers.
*   **Secondary Users**: Portfolio managers, risk officers, and chief financial decision makers.
*   **Platform Consumers**: Stateful pipeline triggers, Core Banking ledger API loops, and corporate risk systems.

---

## 📐 4. Product Philosophy & Agentic Auth

AIP follows six core principles:
1.  **Platform First**: Products are built on top of a shared capability registry.
2.  **Reusable Intelligence**: 16 stateless core capabilities remain decoupled.
3.  **Knowledge Grounded Execution**: All calculations are grounded in the KMS metrics tree (NPL, NIM, LDR).
4.  **Workflow Orientation**: The capabilities compose into automated loops.
5.  **Modularity**: Composition of elements is standard.
6.  **Governed Agentic Execution**: **All activities are executed by 16 specialized Banking AI Agents who must authenticate using a secure, verified API Key (Bearer Header starting with 'AIP-'). Every invocation details which agent executed the step and the token signature used.**

---

## 🏗️ 5. Platform Structure

AIP is structured as 4 Stateful Suites, powered by the central **KMS**, **Intelligence Operating Layer**, and **Data Layer**:

```
                  ┌────────────────────────────────────────────────────────┐
                  │              AIP UI Shell (Banking OS)                 │
                  │              [Secure API Key Console]                  │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
      ┌──────────────────────┬───────────────┴───────────────┬──────────────────────┐
      ▼                      ▼                               ▼                      ▼
┌──────────────┐      ┌──────────────┐                ┌──────────────┐       ┌──────────────┐
│  Reporting   │      │   Business   │                │   Workflow   │       │ Data Science │
│    Suite     │      │  Analytics   │                │  Automation  │       │   & ML       │
│ - PRISM      │      │ - Discovery  │                │ - Design     │       │ - Prep       │
│ - Builder    │      │ - RCA        │                │ - Orchestrate│       │ - Develop    │
│ - NLQ Chat   │      │ - What-if    │                │ - Approvals  │       │ - Document   │
│ - Proactive  │      │ - Story      │                │ - Monitor    │       │ - Pulse      │
└──────┬───────┘      └──────┬───────┘                └──────┬───────┘       └──────┬───────┘
       │                     │                               │                      │
       └─────────────────────┼───────────────────────────────┴──────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                      Intelligence Layer OS (Auth Middleware Check)                │
│   Orchestration  •  Context Management  •  Knowledge Retrieval  •  Routing  •  MCP│
└────────────────────────────┬───────────────────────────────┬──────────────────────┘
                             │                               │
                             ▼                               ▼
┌──────────────────────────────────────────────────┐ ┌──────────────────────────────┐
│        Knowledge Management System (KMS)         │ │          Data Layer          │
│  Lineage  •  Glossary  •  Templates  •  Retrieval│ │  Datasets  •  Files  •  Assets│
└──────────────────────────────────────────────────┘ └──────────────────────────────┘
```

---

## 📊 6. The 16 Specialized Banking AI Agents

Each sub-product is executed by a dedicated Agent persona requiring secure API key validation:

### Suite 1: Reporting Suite (Executed by Reporting Agents)
1.  **PRISM Agent (Rationalize)**: Audits query duplication and overlap metrics across financial reports.
2.  **Report Builder Agent**: Co-writes regulatory reports, enforcing style standards and math quality checks.
3.  **Conversational BI Agent**: Grounded Banking NLQ chat assistant explaining KPI shifts.
4.  **Proactive Monitor Agent**: Constantly audits metrics streams to flag NIM or NPL anomalies.

### Suite 2: Business Analytics Suite (Executed by Analytics Agents)
5.  **Insight Discovery Agent**: Surfaces demographic segments and cohorts showing significant MoM balance shifts.
6.  **RCA Diagnostic Agent**: Decomposes Net Interest Margin variance contributors.
7.  **What-if Simulator Agent**: Simulates loan rates and deposit volume sensitivities on projected earnings.
8.  **Narrative Storyteller Agent**: Compiles story summaries tailored for Slack or Board Review packs.

### Suite 3: Workflow Automation Suite (Executed by Automation Agents)
9.  **Workflow Designer Agent**: Visual DAG pipeline builder wiring capabilities to triggers.
10. **Orchestrator Agent**: Stateful sequential execution supervisor tracking runtime traces.
11. **Task Automation Agent**: Acknowledges and routes approvals gates (Approval Routing Console).
12. **System Monitor Agent**: Aggregates latencies, token costs, and success rates telemetry indicators.

### Suite 4: Data Science & ML Suite (Executed by DS/ML Agents)
13. **Data Prep Agent**: Profiles missing cell counts and suggests transformations aligned to KMS metrics.
14. **Model Developer Agent**: Tracks validation parameters and ROC evaluation matrices across training runs.
15. **Model Documenter Agent**: Automatically compiles compliant model governance booklets.
16. **Model Pulse Agent**: Continuously tracks model inference accuracies and flags concepts drift.

---

## 🔒 7. Strategic Differentiator & Governance

Traditional systems bolt chat boxes onto raw databases, resulting in hallucinations and compliance risks. AIP for Banking Analytics guarantees:
1.  **Strict Grounding**: Prompt boundaries are locked to metrics defined in KMS.
2.  **Explicit Traceability**: Execution logs audit which specialized **Agent** ran each step, the exact duration, and verify the authorized **API Key Bearer token** signature.
3.  **Idempotency**: Shared capabilities remain stateless, while stateful approval pipelines prevent automated actions executing without analyst audits.
