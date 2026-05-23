"""
Product 16: Model Pulse (Stateful Agentic AI)
Assigned Banking Agent: Model Pulse Agent
"""

from typing import List, Dict, Any
from shared.intelligence import invoke_capability

async def run_model_pulse_workflow(accuracy_metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
    print("[Workflow: Data Science - Pulse] Auditing prediction drift for credit classifier.")

    trends = [m.get('accuracy', 0.0) or 0.0 for m in accuracy_metrics]
    latencies = [m.get('latency', 0.0) or 0.0 for m in accuracy_metrics]
    
    statistical_report = await invoke_capability('metric_interpretation', {
        'metricId': 'Model Accuracy',
        'trends': trends,
        'analysisType': 'anomaly'
    })

    training_baseline = 0.93  # Matches champion run XGBoost baseline accuracy
    latest_accuracy = trends[-1] if trends else 0.85
    drift_detected = latest_accuracy < (training_baseline - 0.05)

    drift_status = 'stable'
    drift_explanation = 'Credit prediction performance remains within normal limits.'
    
    if drift_detected:
        drift_status = 'warning'
        drift_explanation = f"⚠️ Concept Drift Detected! Latest default prediction accuracy ({latest_accuracy}) has drifted significantly below the approved regulatory baseline ({training_baseline}). Retraining required."

    accuracy_viz = await invoke_capability('visualization', {
        'chartType': 'line',
        'trends': trends
    })

    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0

    return {
        'drift': {
            'status': drift_status,
            'explanation': drift_explanation,
            'driftScore': round(abs(training_baseline - latest_accuracy), 3)
        },
        'performanceReport': statistical_report,
        'accuracyVegaSpec': accuracy_viz.get('vegaSpec'),
        'avgLatency': f"{round(avg_latency, 1)}ms"
    }
