"""
Product 12: Observability Monitoring Telemetry (Stateful Agentic AI)
Assigned Banking Agent: System Monitor Agent
"""

from typing import Dict, Any
from shared.intelligence import invoke_capability, get_logs

async def run_monitoring_workflow() -> Dict[str, Any]:
    logs = get_logs() or []
    
    total = len(logs)
    completed = len([l for l in logs if l.get('status') == 'completed'])
    success_rate = int((completed / total) * 100) if total > 0 else 100
    
    total_duration = sum(l.get('durationMs', 0) or 0 for l in logs)
    avg_latency = round(total_duration / total, 1) if total > 0 else 0.0
    
    latency_trend = [l.get('durationMs', 1) or 1 for l in logs] if total > 0 else [2, 1, 3, 2, 1]
    
    # Compile Vega chart bar specifications
    spec = await invoke_capability('visualization', {
        'chartType': 'bar',
        'trends': latency_trend
    })
    
    return {
        'metrics': {
            'totalInvocations': total,
            'successRate': f"{success_rate}%",
            'avgLatency': f"{avg_latency}ms",
            'totalTokenCost': f"${(total * 0.05):.2f}"
        },
        'latencyVegaSpec': spec.get('vegaSpec')
    }
