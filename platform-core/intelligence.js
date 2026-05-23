/**
 * AIP Intelligence Layer & Shared Capabilities Registry
 * 
 * Provides centralized routing, capability registration, dynamic invocation, 
 * session context access, and execution logs auditing.
 */

import { AsyncLocalStorage } from 'async_hooks';
import fs from 'fs';
import path from 'path';

// ==========================================================================
// ⚙️ ZERO-DEPENDENCY NATIVE .ENV LOADER
// ==========================================================================
try {
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) return;
      const match = trimmedLine.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        // Remove surrounding quotes
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value.trim();
      }
    });
    console.log('[Intelligence] Processed local environment configs successfully.');
  }
} catch (e) {
  console.warn('[Intelligence] Reliance on system environment variables, local .env parse failed:', e.message);
}

// AsyncLocalStorage to maintain request-scoped Agent and API Key context
export const agentContextStorage = new AsyncLocalStorage();

// In-memory databases
const capabilityRegistry = new Map();
const executionLogs = [];
const activeSessions = new Map();

/**
 * Registers an atomic shared capability.
 * @param {string} name - Capability name (e.g. 'summarization')
 * @param {object} config - Configuration, description, and schemas
 * @param {function} handler - The stateless logic executable
 */
export function register_capability(name, config, handler) {
  if (capabilityRegistry.has(name)) {
    console.warn(`[Intelligence] Overwriting registered capability: ${name}`);
  }
  capabilityRegistry.set(name, {
    name,
    description: config.description,
    inputSchema: config.inputSchema,
    outputSchema: config.outputSchema,
    handler
  });
  console.log(`[Intelligence] Capability registered successfully: ${name}`);
}

/**
 * Dynamically invokes a capability, tracing and auditing execution status.
 * @param {string} name - The registered capability name
 * @param {object} input - Input parameters passing JSON validation rules
 * @returns {Promise<any>} The output result
 */
export async function invoke_capability(name, input) {
  const capability = capabilityRegistry.get(name);
  if (!capability) {
    throw new Error(`Capability not found in registry: ${name}`);
  }

  const startTime = Date.now();
  const store = agentContextStorage.getStore() || {};
  const currentAgent = store.agent || 'Orchestrator Agent';
  console.log(`[Intelligence] Invoking capability: ${name} (Executing Agent: ${currentAgent})`);

  try {
    // Run the capability handler
    const result = await capability.handler(input);
    const duration = Date.now() - startTime;

    // Log the successful execution
    log_execution(name, input, result, duration, 'completed');
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    log_execution(name, input, { error: error.message }, duration, 'failed');
    throw error;
  }
}

/**
 * Lists all capabilities currently active in the registry.
 * @returns {Array<object>} List of capability metadata objects
 */
export function list_capabilities() {
  return Array.from(capabilityRegistry.values()).map(cap => ({
    name: cap.name,
    description: cap.description,
    inputSchema: cap.inputSchema,
    outputSchema: cap.outputSchema
  }));
}

/**
 * Audits and persists a capability run.
 */
function log_execution(capability, input, output, duration, status) {
  // Retrieve request-scoped context
  const store = agentContextStorage.getStore() || {};
  const callingAgent = store.agent || 'Orchestration Supervisor Agent';
  const apiKey = store.apiKey || '';

  // Mask the API Key for security (e.g. AIP-BANK-SECURE-2026 -> AIP-BA***)
  let maskedKey = 'No Key';
  if (apiKey && apiKey.startsWith('AIP-')) {
    maskedKey = apiKey.slice(0, 6) + '***';
  }

  const logEntry = {
    id: `log_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    capability,
    input,
    output,
    durationMs: duration,
    status,
    agent: callingAgent,
    apiKey: maskedKey
  };
  executionLogs.push(logEntry);
  console.log(`[Intelligence Audit] Capability: ${capability} | Agent: ${callingAgent} | Key: ${maskedKey} | Duration: ${duration}ms | Status: ${status}`);
}

/**
 * Retrieves execution logs history.
 * @returns {Array<object>}
 */
export function get_logs() {
  return executionLogs;
}

/**
 * Dynamically purges all active execution trace logs.
 * @returns {boolean}
 */
export function clear_logs() {
  executionLogs.length = 0;
  return true;
}

// ==========================================================================
// 🚀 NATIVE OPENAI LLM API CLIENT
// ==========================================================================
/**
 * Triggers live GPT completion query calls to the OpenAI endpoint.
 * @param {string} systemPrompt 
 * @param {string} userPrompt 
 * @param {boolean} jsonMode 
 * @returns {Promise<string|null>} The parsed completion text, or null if key is missing/unauthorized
 */
export async function callLLM(systemPrompt, userPrompt, jsonMode = false) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here' || !apiKey.startsWith('sk-')) {
    console.log('[Intelligence AI] Live OpenAI API Key missing or default, using mock heuristics.');
    return null;
  }

  try {
    const startTime = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Intelligence AI] OpenAI endpoint error: ${response.status} | ${errText}`);
      return null;
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    console.log(`[Intelligence AI] OpenAI call succeeded in ${duration}ms (tokens: ${data.usage.total_tokens})`);
    return data.choices[0].message.content;
  } catch (error) {
    console.warn('[Intelligence AI] OpenAI fetch exception:', error.message);
    return null;
  }
}

/**
 * Simple in-memory session manager context helper.
 */
export const sessionManager = {
  get: (sessionId) => {
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, {
        id: sessionId,
        created: new Date().toISOString(),
        filters: { period: 'Q1-2026' }
      });
    }
    return activeSessions.get(sessionId);
  },
  set: (sessionId, payload) => {
    activeSessions.set(sessionId, {
      id: sessionId,
      updated: new Date().toISOString(),
      ...payload
    });
    return activeSessions.get(sessionId);
  },
  clear: (sessionId) => {
    return activeSessions.delete(sessionId);
  }
};
