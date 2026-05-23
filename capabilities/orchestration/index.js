import { invoke_capability } from '../../platform-core/intelligence.js';

export default {
  name: 'orchestration',
  config: {
    description: 'Sequentially executes modular capability steps in a workflow pipeline, returning execution traces.',
    inputSchema: {
      steps: 'array of objects'
    },
    outputSchema: {
      success: 'boolean',
      traces: 'array of objects'
    }
  },
  handler: async (input) => {
    const steps = input.steps || [];
    const traces = [];
    let success = true;
    
    console.log(`[Orchestrator] Executing custom DAG with ${steps.length} sequential nodes.`);
    
    // Iterate and execute each node in the DAG sequence
    for (const step of steps) {
      const stepStartTime = Date.now();
      try {
        console.log(`[Orchestrator] Executing node: ${step.id} (Capability: ${step.capability})`);
        const output = await invoke_capability(step.capability, step.input);
        
        traces.push({
          stepId: step.id,
          capability: step.capability,
          status: 'completed',
          durationMs: Date.now() - stepStartTime,
          output
        });
      } catch (err) {
        success = false;
        traces.push({
          stepId: step.id,
          capability: step.capability,
          status: 'failed',
          durationMs: Date.now() - stepStartTime,
          error: err.message
        });
        console.error(`[Orchestrator] Node ${step.id} failed execution. Terminating sequence.`);
        break; // Stop execution on node failure
      }
    }
    
    return {
      success,
      traces
    };
  }
};
