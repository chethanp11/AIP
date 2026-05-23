"""
Product 11: Task Automation & Approvals routing (Stateful Agentic AI)
Assigned Banking Agent: Approval Routing Agent
"""

from typing import List, Dict, Any
from shared.intelligence import invoke_capability

# Stateful in-memory paused approvals table
paused_approvals: List[Dict[str, Any]] = []

def get_active_approvals() -> List[Dict[str, Any]]:
    """Retrieves list of actively paused compliance pipeline gates."""
    return paused_approvals

async def resume_approval_workflow(approval_id: str, approved: bool) -> Dict[str, Any]:
    print(f"[Workflow: Automation - Task] Resuming paused approval run: {approval_id} | Approved: {approved}")
    
    idx = next((i for i, a in enumerate(paused_approvals) if a['id'] == approval_id), -1)
    if idx == -1:
        raise ValueError(f"Active approval task not found: {approval_id}")

    approval = paused_approvals.pop(idx)

    if not approved:
        return {
            'success': False,
            'message': f"Workflow Run [{approval['name']}] rejected by Banking Compliance Officer. Pipeline terminated.",
            'traces': [
                {'stepId': 'step_manual_approval', 'capability': 'user_action', 'status': 'rejected', 'durationMs': 0}
            ]
        }

    # Resume the workflow by triggering the outbound MCP notification
    config = approval['config']
    notification = config.get('notification')
    task = config.get('task')
    name = config.get('name')

    steps = [{
        'id': 'step_resume_notification',
        'capability': 'mcp_integration',
        'input': {
            'serverName': 'slack' if notification == 'slack' else 'pagerduty',
            'toolName': 'post_message' if notification == 'slack' else 'trigger_incident',
            'arguments': {
                'channel': '#banking-alerts',
                'text': f"🔔 Workflow Run [{name}] APPROVED by Analyst. Resumed pipeline task [{task}] successfully."
            }
        }
    }]

    execution_result = await invoke_capability('orchestration', {'steps': steps})

    return {
        'workflowName': name,
        'trigger': config.get('trigger'),
        'task': task,
        'notification': notification,
        'success': execution_result.get('success', False),
        'traces': [
            {'stepId': 'step_manual_approval', 'capability': 'user_action', 'status': 'approved', 'durationMs': 120},
            *execution_result.get('traces', [])
        ]
    }
