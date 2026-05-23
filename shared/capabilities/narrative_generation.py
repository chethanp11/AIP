"""
Narrative Generation Capability
"""

import os
import json
from typing import Dict, Any

config = {
    'description': 'Formats metrics variables and text summaries into standard Markdown templates from the KMS.',
    'inputSchema': {
        'templateId': 'string',
        'variables': 'object'
    },
    'outputSchema': {
        'narrative': 'string'
    }
}

def handler(input_params: Dict[str, Any]) -> Dict[str, Any]:
    template_id = input_params.get('templateId', 'briefing_brief') or 'briefing_brief'
    variables = input_params.get('variables', {}) or {}
    
    # Resolve templates path (now under src/kms/)
    templates_path = os.path.abspath('src/kms/analytical_templates.json')
    template_structure = "# Performance Briefing\n\nMetric Value: :metricValue\nSummary: :summaryText"
    
    if os.path.exists(templates_path):
        try:
            with open(templates_path, 'r', encoding='utf-8') as f:
                templates = json.load(f)
                template = next((t for t in templates if t.get('id') == template_id), None)
                if template:
                    template_structure = template.get('structure', template_structure)
        except Exception as e:
            print(f"[Narrative Cap Error] Templates read failed: {str(e)}")

    # Replace keys in template with variables
    narrative = template_structure
    for key, val in variables.items():
        placeholder = f":{key}"
        narrative = narrative.replace(placeholder, str(val))
        
    return {
        'narrative': narrative
    }
