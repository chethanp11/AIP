"""
Knowledge Retrieval Capability (SQLite Vector & Graph RAG Patched)
"""

import os
from typing import Dict, Any
from src.kms.index import search_kms_vector_and_graph

config = {
    'description': 'Searches and compiles semantic regulations from the in-memory SQLite Vector & Graph Database.',
    'inputSchema': {
        'question': 'string'
    },
    'outputSchema': {
        'context': 'string',
        'matchesCount': 'number'
    }
}

def handler(input_params: Dict[str, Any]) -> Dict[str, Any]:
    query = (input_params.get('question', '') or '').strip()
    if not query:
        return {
            'context': "Grounding default metrics: Basel III LCR and Net Interest Margin rules.",
            'matchesCount': 0
        }
        
    try:
        # Trigger live Vector similarity & Graph traversal RAG search!
        res = search_kms_vector_and_graph(query)
        return {
            'context': res['context'],
            'matchesCount': len(res['matched_chunks'])
        }
    except Exception as e:
        print(f"[Knowledge Retrieval Capability] RAG search error: {str(e)}")
        return {
            'context': f"Offline fallback. Grounding error: {str(e)}",
            'matchesCount': 0
        }
