"""
Summarization Capability
"""

import re
from typing import Dict, Any

config = {
    'description': 'Compresses large paragraphs, logs, or analysis outputs into high-density bullet summaries.',
    'inputSchema': {
        'text': 'string'
    },
    'outputSchema': {
        'summary': 'string'
    }
}

def handler(input_params: Dict[str, Any]) -> Dict[str, Any]:
    raw_text = input_params.get('text', '') or ''
    if not raw_text.strip():
        return {'summary': 'No text provided to summarize.'}

    # Extract sentences and build bullet list
    sentences = [s.strip() for s in re.split(r'[.!\n]+', raw_text) if s.strip()]
    sentences = [s for s in sentences if len(s) > 5]
    key_takeaways = [f"• {s}." for s in sentences[:3]]

    if key_takeaways:
        return {'summary': '\n'.join(key_takeaways)}
    else:
        return {'summary': '• Insufficient text length to generate structural bullet summary.'}
