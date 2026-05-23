# Workflows: Workflow Automation Suite

This directory contains the stateful workflows that handle operational event triggering, anomaly alert compilation, and closed-loop actions.

## 📋 Standard Workflows
- **Grounded Anomaly Alert Loop**: Continuously scans metrics and compiles structured alerting contexts.
- **Incident Response Playbook Runner**: Executes a multi-system orchestration path following an incident trigger.
- **Human-In-The-Loop Verification**: Pauses pipelines to await manual confirmation before committing database updates or triggering external events.

## ⚙️ Standard Capabilities Composed
- `capabilities/orchestration`
- `capabilities/summarization`
- `capabilities/mcp_integration`
- `capabilities/context_management`
