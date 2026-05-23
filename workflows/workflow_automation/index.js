import { invoke_capability, get_logs } from '../../platform-core/intelligence.js';

// Stateful in-memory approvals table
export const pausedApprovals = [];

/**
 * Product 3: Task Automation (Approval Routing Engine)
 * Exposes paused approvals.
 */
export function get_active_approvals() {
  return pausedApprovals;
}

/**
 * Resumes a statefully paused workflow step following manual User confirmation.
 */
export async function resume_approval_workflow(approvalId, approved) {
  console.log(`[Workflow: Automation - Task] Resuming paused approval run: ${approvalId} | Approved: ${approved}`);
  
  const idx = pausedApprovals.findIndex(a => a.id === approvalId);
  if (idx === -1) {
    throw new Error(`Active approval task not found: ${approvalId}`);
  }

  const approval = pausedApprovals[idx];
  pausedApprovals.splice(idx, 1); // Remove from paused list

  if (!approved) {
    return {
      success: false,
      message: `Workflow Run [${approval.name}] rejected by Banking Compliance Officer. Pipeline terminated.`,
      traces: [
        { stepId: 'step_manual_approval', capability: 'user_action', status: 'rejected', durationMs: 0 }
      ]
    };
  }

  // Resume the workflow by triggering the outbound MCP notification
  const notification = approval.config.notification;
  const task = approval.config.task;
  const name = approval.config.name;

  const steps = [{
    id: 'step_resume_notification',
    capability: 'mcp_integration',
    input: {
      serverName: notification === 'slack' ? 'slack' : 'pagerduty',
      toolName: notification === 'slack' ? 'post_message' : 'trigger_incident',
      arguments: {
        channel: '#banking-alerts',
        text: `🔔 Workflow Run [${name}] APPROVED by Analyst. Resumed pipeline task [${task}] successfully.`
      }
    }
  }];

  const executionResult = await invoke_capability('orchestration', { steps });

  return {
    workflowName: name,
    trigger: approval.config.trigger,
    task,
    notification,
    success: executionResult.success,
    traces: [
      { stepId: 'step_manual_approval', capability: 'user_action', status: 'approved', durationMs: 120 },
      ...executionResult.traces
    ]
  };
}

/**
 * Product 2: Workflow Orchestration Simulator
 * Initiates the custom DAG sequence. Stateful triggers automatically pause 
 * for approval if the configuration requires human verification.
 */
export async function run_custom_workflow_workflow(config) {
  const { name = 'Custom Alert', trigger, task, notification, requireApproval = false } = config;
  console.log(`[Workflow: Automation - Orchestration] Compiling banking automation pipeline. Require Approval: ${requireApproval}`);

  const steps = [];

  // Stage 1: Banking Analytics Task Execution
  if (task === 'profile') {
    steps.push({
      id: 'step_profiling',
      capability: 'metric_interpretation',
      input: {
        metricId: 'npl_ratio',
        trends: [1.42, 1.45, 1.38, 1.49, 1.55, 1.62, 1.85],
        analysisType: 'anomaly'
      }
    });
  } else {
    steps.push({
      id: 'step_summarize_logs',
      capability: 'summarization',
      input: {
        text: "Banking automation trigger has initiated successfully. Initial balance checks verified with zero regulatory flags."
      }
    });
  }

  // Stage 2: Narrative Generation
  steps.push({
    id: 'step_build_alert_narrative',
    capability: 'narrative_generation',
    input: {
      templateId: 'briefing_brief',
      variables: {
        metricName: 'LDR Liquidity Pipeline',
        metricValue: '85.8%',
        compareValue: '82.5%',
        metricFormula: 'loan_to_deposit_ratio',
        explanation: 'Custom workflow triggered via event: ' + trigger,
        summaryText: 'Automatic alert created via user-configured DAG notification rules.'
      }
    }
  });

  // If approval routing is required, pause execution here and store approval state
  if (requireApproval === true || requireApproval === 'true') {
    // Run initial steps
    const firstLeg = await invoke_capability('orchestration', { steps });
    
    const approvalId = `app_${Math.random().toString(36).substr(2, 9)}`;
    const approvalTask = {
      id: approvalId,
      name,
      step: 'Outbound Notification Gate',
      status: 'paused',
      created: new Date().toLocaleTimeString(),
      config: { name, trigger, task, notification }
    };
    
    pausedApprovals.push(approvalTask);
    console.log(`[Workflow: Automation] Pipeline paused. Created approval request: ${approvalId}`);
    
    return {
      paused: true,
      approvalId,
      traces: [
        ...firstLeg.traces,
        { stepId: 'step_manual_approval', capability: 'user_action', status: 'paused', durationMs: 0 }
      ]
    };
  }

  // Otherwise, run to completion by executing outbound alert immediately
  steps.push({
    id: 'step_send_notification',
    capability: 'mcp_integration',
    input: {
      serverName: notification === 'slack' ? 'slack' : 'pagerduty',
      toolName: notification === 'slack' ? 'post_message' : 'trigger_incident',
      arguments: {
        channel: '#banking-alerts',
        text: `🔔 Custom Workflow [${name}] triggered immediately! Pipeline executed task [${task}] successfully.`
      }
    }
  });

  const executionResult = await invoke_capability('orchestration', { steps });

  return {
    paused: false,
    success: executionResult.success,
    traces: executionResult.traces
  };
}

/**
 * Product 4: Monitoring (Telemetry Aggregator)
 * Scans active platform logs and calculates performance metrics for monitoring.
 */
export async function get_telemetry_workflow() {
  const logs = get_logs() || [];
  
  const total = logs.length;
  const completed = logs.filter(l => l.status === 'completed').length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;
  
  const totalDuration = logs.reduce((acc, l) => acc + (l.durationMs || 0), 0);
  const avgLatency = total > 0 ? parseFloat((totalDuration / total).toFixed(1)) : 0;
  
  // Custom mock values for monitoring telemetry trends
  const latencyTrend = total > 0 ? logs.map(l => l.durationMs || 1) : [2, 1, 3, 2, 1];
  const costTrend = total > 0 ? logs.map((_, idx) => (idx + 1) * 0.05) : [0.05, 0.10, 0.15];

  // Render vega spec using visualization capability
  const spec = await invoke_capability('visualization', {
    chartType: 'bar',
    trends: latencyTrend
  });

  return {
    metrics: {
      totalInvocations: total,
      successRate: `${successRate}%`,
      avgLatency: `${avgLatency}ms`,
      totalTokenCost: `$${(total * 0.05).toFixed(2)}`
    },
    latencyVegaSpec: spec.vegaSpec
  };
}
