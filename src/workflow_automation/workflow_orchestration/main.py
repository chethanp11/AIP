"""
Product 10: Workflow Orchestration Engine (Stateful Agentic AI)
Assigned Banking Agent: Platform Routing Agent
"""

import random
import string
import time
from typing import Dict, Any
from shared.intelligence import invoke_capability
from src.workflow_automation.task_automation.main import paused_approvals

async def run_custom_workflow(config: Dict[str, Any]) -> Dict[str, Any]:
    name = config.get('name', 'Custom Alert') or 'Custom Alert'
    trigger = config.get('trigger', 'weekly_schedule')
    task = config.get('task', 'profile')
    notification = config.get('notification', 'slack')
    require_approval = config.get('requireApproval', False)
    
    # Handle string boolean representations from frontend requests
    if isinstance(require_approval, str):
        require_approval = require_approval.lower() == 'true'

    print(f"[Workflow: Automation - Orchestration] Compiling banking automation pipeline. Require Approval: {require_approval}")

    steps = []

    # Stage 1: Banking Analytics Task Execution
    if task == 'profile':
        steps.append({
            'id': 'step_profiling',
            'capability': 'metric_interpretation',
            'input': {
                'metricId': 'npl_ratio',
                'trends': [1.42, 1.45, 1.38, 1.49, 1.55, 1.62, 1.85],
                'analysisType': 'anomaly'
            }
        })
    else:
        steps.append({
            'id': 'step_summarize_logs',
            'capability': 'summarization',
            'input': {
                'text': "Banking automation trigger has initiated successfully. Initial balance checks verified with zero regulatory flags."
            }
        })

    # Stage 2: Narrative Generation
    steps.append({
        'id': 'step_build_alert_narrative',
        'capability': 'narrative_generation',
        'input': {
            'templateId': 'briefing_brief',
            'variables': {
                'metricName': 'LDR Liquidity Pipeline',
                'metricValue': '85.8%',
                'compareValue': '82.5%',
                'metricFormula': 'loan_to_deposit_ratio',
                'explanation': f"Custom workflow triggered via event: {trigger}",
                'summaryText': 'Automatic alert created via user-configured DAG notification rules.'
            }
        }
    })

    # If approval routing is required, pause execution here and store approval state
    if require_approval:
        # Run initial steps first leg
        first_leg = await invoke_capability('orchestration', {'steps': steps})
        
        approval_id = 'app_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=9))
        approval_task = {
            'id': approval_id,
            'name': name,
            'step': 'Outbound Notification Gate',
            'status': 'paused',
            'created': time.strftime('%H:%M:%S', time.localtime()),
            'config': {'name': name, 'trigger': trigger, 'task': task, 'notification': notification}
        }
        
        paused_approvals.append(approval_task)
        print(f"[Workflow: Automation] Pipeline paused. Created approval request: {approval_id}")
        
        return {
            'paused': True,
            'approvalId': approval_id,
            'traces': [
                *first_leg.get('traces', []),
                {'stepId': 'step_manual_approval', 'capability': 'user_action', 'status': 'paused', 'durationMs': 0}
            ]
        }

    # Otherwise, run to completion by executing outbound alert immediately
    steps.append({
        'id': 'step_send_notification',
        'capability': 'mcp_integration',
        'input': {
            'serverName': 'slack' if notification == 'slack' else 'pagerduty',
            'toolName': 'post_message' if notification == 'slack' else 'trigger_incident',
            'arguments': {
                'channel': '#banking-alerts',
                'text': f"🔔 Custom Workflow [{name}] triggered immediately! Pipeline executed task [{task}] successfully."
            }
        }
    })

    execution_result = await invoke_capability('orchestration', {'steps': steps})

    return {
        'paused': False,
        'success': execution_result.get('success', False),
        'traces': execution_result.get('traces', [])
    }
