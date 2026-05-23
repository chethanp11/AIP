import { sessionManager } from '../../platform-core/intelligence.js';

export default {
  name: 'context_management',
  config: {
    description: 'Stateless adapter to read and write temporary analytical variables for user sessions.',
    inputSchema: {
      sessionId: 'string',
      action: 'string (get, set, clear)',
      payload: 'object (optional)'
    },
    outputSchema: {
      success: 'boolean',
      sessionState: 'object'
    }
  },
  handler: async (input) => {
    const { sessionId, action, payload } = input;
    
    if (!sessionId) {
      throw new Error("Missing sessionId in context management request.");
    }
    
    if (action === 'get') {
      const state = sessionManager.get(sessionId);
      return { success: true, sessionState: state };
    } else if (action === 'set') {
      const state = sessionManager.set(sessionId, payload);
      return { success: true, sessionState: state };
    } else if (action === 'clear') {
      const success = sessionManager.clear(sessionId);
      return { success, sessionState: {} };
    } else {
      throw new Error(`Unsupported context action: ${action}`);
    }
  }
};
