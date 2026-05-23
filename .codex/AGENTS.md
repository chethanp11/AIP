# Codex Instruction: AI Developer Agent Guidelines

Welcome, **AI Coding Agent**! 

This file is your operational instruction sheet for working in the **AIP (AIM Intelligence Platform)** repository. AIP is an **agent-native codebase**, meaning it has been structurally optimized for collaborative engineering between human developers and autonomous AI software agents. 

Read and follow these rules strictly whenever you are asked to modify, debug, or expand this codebase.

---

## 🗂️ Repo Structure Map & Target Locations

Keep your file creations and edits restricted to these specific boundaries:

*   **Stateless Cognitive Core**: All reusable, atomic tools and logic must go under `/capabilities/`.
    *   *Rule*: Never implement workflow-specific conditions or state persistence inside a capability.
*   **Stateful Workflows**: All business processes, custom schedulers, event triggers, and dynamic DAGs must go under `/workflows/`.
    *   *Rule*: Workflows must compose existing shared capabilities. Do not duplicate basic utility code here.
*   **Data Models & Semantics**: Custom metric trees, semantic schemas, and YAML definitions go under `/knowledge/`.
*   **Common Infrastructure**: Database connectors, security utilities, caching layers, and telemetry go under `/platform-core/`.
*   **UI Components**: Keep dynamic web views, components, and layouts under `/ui/`.

---

## 📐 Coding Standards & Code Generation Guidelines

When generating or editing code, strictly adhere to the following technical standards:

### 1. Zero Untyped Boundaries
*   Every public-facing function or module boundary must have strict, statically verifiable types.
    *   **TypeScript**: Require full interface definitions. Use `unknown` or custom union types rather than `any`.
    *   **Python**: Require full PEP 484 type hints. Leverage `Pydantic` for data validation contracts.

### 2. Pure Separation of CSS (For Frontend Modules)
*   Do not inject ad-hoc utility styles inside components unless requested.
*   Place variables and modular classes inside standard, clean Vanilla CSS files (e.g. `/ui/src/styles/`).
*   Leverage modern CSS properties (such as HSL tailoring, Backdrop-filters, Container Queries, `:has()`) to deliver state-of-the-art visuals.

### 3. Idempotent & Stateless Capabilities
*   All code under `/capabilities/` must be designed as pure mathematical transformations. Given the same inputs, it must return the same outputs without reading or writing persistent state (unless explicitly dealing with external MCP storage).

### 4. Preservation of Documentation Integrity
*   **Do not delete comments**: Maintain all existing comments, design annotations, or docstrings unless you are explicitly asked to rewrite a module.
*   **Maintain Codex references**: Keep `.codex/` files and directory READMEs in sync whenever you alter an interface or add new capabilities.

---

## 🔄 Step-by-Step Workflow for Code Additions

### Adding a New Shared Capability
If you are asked to add a new capability (e.g., `capabilities/new_tool`):
1.  **Define Interfaces**: Create `interface.ts` (or `interface.py`) specifying input/output data shapes using strict typing or schemas.
2.  **Stateless Code**: Implement the functional logic under `capabilities/new_tool/index.ts` (or `main.py`).
3.  **Local Readme**: Create a local `README.md` defining how to invoke the capability and detailing the performance profiles or model requirements.
4.  **Registration**: Update the global catalog at `docs/context/capability_catalog.md` with your new entry.

### Adding a New Stateful Workflow
If you are asked to add a new workflow (e.g., `workflows/reporting/new_workflow`):
1.  **Map Requirements**: Verify which capabilities are needed. If any are missing, design them as stateless capabilities first.
2.  **Implementation**: Write the orchestrator code under `workflows/reporting/new_workflow/`. Maintain state tracking using standard `platform-core` database/cache interfaces.
3.  **Local Readme**: Add a local `README.md` with execution guides, triggers, and expected outputs.

---

## 🚨 Critical Agent Guardrails

> [!WARNING]
> **Framework Scaffolding Rule**: Do not create generic, bloated framework templates (e.g., standard Next.js starter templates or complex Python boilerplate) unless the user explicitly requests it. Focus on minimal, clean, high-efficiency implementations.

> [!IMPORTANT]
> **No Inter-Capability Imports**: Never import one capability folder's files directly into another capability folder. This creates hard couplings. Use the orchestration layer to link them.

> [!TIP]
> **Aesthetic Excellence**: If you are asked to create visual mockups or UI components under `/ui/`, always prioritize rich, modern web aesthetics. Use smooth micro-animations, glassmorphism backdrop-filters, custom typography, and harmonious colors.

---

*Let's build a beautiful, robust platform together.*
