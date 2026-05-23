# UX Flows: AIP Analyst Operating System

This document outlines the core user experience models, screen layouts, form integrations, and user interaction sequences within the **AIM Intelligence Platform (AIP)**.

---

## 🔑 1. Analyst Authentication Gate

1.  **Login Overlay**: When loading the platform, a premium backdrop-blur lock grid blocks all workspaces.
2.  **Authentication Form**: The analyst inputs credentials (username: `analyst`, password: `password`).
3.  **Token Handshake**: Submitting the form posts to `/api/v1/auth/login`. The server responds with a secure Bearer token (`AIP-ANALYST-SESSION-...`).
4.  **OS Access Unlock**: The UI shell stores this token in session memory, slides away the overlay, and reveals the sidebar navigation panel.

```
┌────────────────────────────────────────────────────────┐
│                   AIP Login Interface                  │
├────────────────────────────────────────────────────────┤
│  Username: [ analyst                                ]  │
│  Password: [ ••••••••                               ]  │
│                                                        │
│  [        Authenticate & Unlock Banking OS       ]     │
└────────────────────────────────────────────────────────┘
```

---

## 📁 2. Reporting Suite Workspaces (Split Canvases)

The Reporting Suite layout uses an advanced tab-based workspace system:

### A. PRISM (Catalog Rationalization)
*   **Interaction**: Analyst clicks "Audit and Rationalize Catalog".
*   **Response**: The system queries active SQL statements, runs query parsing and Jaccard similarity indexing, and populates a result grid identifying duplication rates, owner segments, and recommended consolidation strategies.

### B. Report Building Workspace
*   **Interaction**: Hosts a split-pane layout.
    -   *Left Panel*: A directory of 4 pre-compiled sample reports (NIM, LCR, Credit Risk, Branch Efficiency) alongside parameter custom inputs.
    -   *Right Panel*: A responsive HTML canvas that dynamically compiles and renders reports styled with visual statistics cards, compliant tables, and analytical notes retrieved from the live LMS database.

### C. Conversational BI Assistant
*   **Interaction**: A chat portal where the analyst type queries (e.g. "Scan card CAC trends").
*   **Response**: The BI Agent parses the natural language, queries LMS balances, and renders structured Markdown replies side-by-side with dynamic Vega-Lite chart visualizations.

### D. Proactive Insights alerts feed
*   **Interaction**: Analyst refreshes the alert monitor feed. The system executes statistical Z-score checks across ledger streams, immediately highlighting anomalies (e.g. NIM compression or NPL spikes) with red alert badges and contextual playbooks.

---

## 📈 3. Business Analytics Sandbox (Monte Carlo & RCA)

### A. What-if Analysis Slider Matrix
The sandbox features a dynamic dual-column interactive panel:
1.  *Control Sliders Panel*: Analyst slides variables:
    -   **Average Loan Rate**: `1.0%` to `15.0%`
    -   **Average Deposit Rate**: `0.1%` to `8.0%`
    -   **Assets Under Management**: `$1.0B` to `$50.0B`
    -   **Default NPL Rate**: `0.1%` to `10.0%`
2.  *Projected Outputs Panel*: The system calculates mathematical relationships grounded in KMS formulas and immediately updates visual indicators:
    -   **Projected NIM**: styled color-coded score.
    -   **Interest Revenues & Expenses**: total balance comparisons.
    -   **Net Spread Profit & Default Costs**: green/blue metric cards.

```
┌───────────────────────────────┐ ┌────────────────────────────────┐
│   Scenario Variables Sliders  │ │    Projected Balance Outputs   │
├───────────────────────────────┤ ├────────────────────────────────┤
│  Loan Rate:    ---●---  6.5%  │ │  Projected NIM:    3.60%       │
│  Deposit Rate: --●----  2.5%  │ │  Revenue:          $552.5M     │
│  Assets AUM:   -----●-  10B   │ │  Expense:          $225.0M     │
│  Default Rate: -●-----  1.5%  │ │  Net Spread:       $251.0M     │
└───────────────────────────────┘ └────────────────────────────────┘
```

---

## ⚡ 4. Workflow Automation Console (DAG Tracing)

1.  **Pipeline Designer**: Analyst selects a Trigger Event, wires it to a Capability Task, configures a Notification channel, and clicks "Compile & Run Pipeline".
2.  **Orchestration Console**: A real-time, terminal-style tracer displays capability execution logs sequence.
3.  **Human-in-the-Loop Approvals**: If the pipeline triggers an approval rule, execution pauses. The analyst navigates to the Approvals Feed, reviews the transaction statistics, and clicks "Approve / Reject" to resume or abort the stateful pipeline run.

---

## 📜 5. Observability Telemetry & Logs Column

*   **Capabilities Registry**: A detailed index of all 8 registered stateless capability schemas.
*   **System Audit Telemetry**: Renders logs tables tracing agent workflows. Highlights calling Agent, input params, outputs, execution duration, and the masked analyst session token (`AIP-AN***`) for deep audit security compliance.
