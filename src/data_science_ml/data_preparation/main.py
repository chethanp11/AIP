"""
Product 13: Data Preparation Workspace (Stateful Agentic AI)
Assigned Banking Agent: Data Prep Profiler Agent
"""

from typing import List, Dict, Any

def run_data_preparation_workflow(columns: List[str], dataset: List[Dict[str, Any]]) -> Dict[str, Any]:
    print(f"[Workflow: Data Science - Prep] Profiling banking credit features for {len(columns)} columns.")

    profiles = {}
    for col in columns:
        profiles[col] = {
            'name': col,
            'nullCount': 0,
            'dataType': 'numeric',
            'recommendations': []
        }

    for row in dataset:
        for col in columns:
            val = row.get(col)
            if val is None or val == '':
                profiles[col]['nullCount'] += 1
            else:
                # Check for numeric type
                try:
                    float(val)
                except ValueError:
                    profiles[col]['dataType'] = 'categorical'

    for col in columns:
        prof = profiles[col]
        if prof['nullCount'] > 0:
            prof['recommendations'].append(f"Impute {prof['nullCount']} missing cells using median value replacement.")
            
        if prof['dataType'] == 'categorical':
            prof['recommendations'].append("Apply One-Hot Encoding vectorization for banking categories.")
        else:
            prof['recommendations'].append("Standardize continuous metrics using MinMax Scaling.")

    return {
        'columns': [profiles[c] for c in columns],
        'rowCount': len(dataset)
    }
