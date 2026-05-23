"""
Product 9: Workflow Design Console (Stateful Agentic AI)
Assigned Banking Agent: Workflow Designer Agent
"""

from typing import Dict, Any

def validate_pipeline_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validates structural layout and steps parameters for custom pipelines configuration."""
    name = config.get('name', 'Custom Alert')
    trigger = config.get('trigger')
    task = config.get('task')
    notification = config.get('notification')
    
    errors = []
    if not trigger:
        errors.append("Pipeline configuration requires a valid Trigger Event trigger source.")
    if not task:
        errors.append("Pipeline configuration requires a valid active Capability Task target.")
    if not notification:
        errors.append("Pipeline configuration requires an outbound MCP Notification channel.")
        
    passed = len(errors) == 0
    
    return {
        'structuralValid': passed,
        'errors': errors,
        'compiledConfig': {
            'name': name,
            'trigger': trigger,
            'task': task,
            'notification': notification,
            'requireApproval': config.get('requireApproval', False)
        } if passed else None
    }
