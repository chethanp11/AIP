import fs from 'fs';
import path from 'path';

export default {
  name: 'knowledge_retrieval',
  config: {
    description: 'Searches and compiles semantic metric glossary and term definitions from the KMS folder.',
    inputSchema: {
      question: 'string'
    },
    outputSchema: {
      context: 'string',
      matchesCount: 'number'
    }
  },
  handler: async (input) => {
    const query = (input.question || '').toLowerCase();
    
    // Resolve paths to KMS data
    const glossaryPath = path.resolve('knowledge/metrics_glossary.json');
    const termsPath = path.resolve('knowledge/business_terms.json');
    const articlesPath = path.resolve('knowledge/knowledge_articles.json');
    
    let matches = [];
    
    // Load and search files
    if (fs.existsSync(glossaryPath)) {
      const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
      glossary.forEach(item => {
        if (item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)) {
          matches.push(`Metric: ${item.name} | Formula: ${item.formula} | Description: ${item.description}`);
        }
      });
    }
    
    if (fs.existsSync(termsPath)) {
      const terms = JSON.parse(fs.readFileSync(termsPath, 'utf8'));
      terms.forEach(item => {
        if (item.term.toLowerCase().includes(query) || item.definition.toLowerCase().includes(query)) {
          matches.push(`Business Term: ${item.term} | Definition: ${item.definition}`);
        }
      });
    }
    
    if (fs.existsSync(articlesPath)) {
      const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
      articles.forEach(item => {
        if (item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query)) {
          matches.push(`Article: ${item.title} | Content: ${item.content}`);
        }
      });
    }
    
    // Fallback context if no match is found
    if (matches.length === 0) {
      matches.push("No highly specific metric matched. Grounded default banking metrics returned: Net Interest Margin (NIM), Non-Performing Loans (NPL), Loan-to-Deposit Ratio (LDR).");
    }
    
    return {
      context: matches.join('\n\n'),
      matchesCount: matches.length
    };
  }
};
