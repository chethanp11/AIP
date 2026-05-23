export default {
  name: 'summarization',
  config: {
    description: 'Compresses large paragraphs, logs, or analysis outputs into high-density bullet summaries.',
    inputSchema: {
      text: 'string'
    },
    outputSchema: {
      summary: 'string'
    }
  },
  handler: async (input) => {
    const rawText = input.text || '';
    if (rawText.length === 0) {
      return { summary: 'No text provided to summarize.' };
    }
    
    // Core MVP compression: extracts sentences and builds condensed bullet points
    const sentences = rawText.split(/[.!\n]+/).map(s => s.trim()).filter(s => s.length > 5);
    const keyTakeaways = sentences.slice(0, 3).map(s => `• ${s}.`);
    
    return {
      summary: keyTakeaways.length > 0 
        ? keyTakeaways.join('\n') 
        : '• Insufficient text length to generate structural bullet summary.'
    };
  }
};
