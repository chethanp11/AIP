import fs from 'fs';
import path from 'path';

export default {
  name: 'narrative_generation',
  config: {
    description: 'Formats metrics variables and text summaries into standard Markdown templates from the KMS.',
    inputSchema: {
      templateId: 'string',
      variables: 'object'
    },
    outputSchema: {
      narrative: 'string'
    }
  },
  handler: async (input) => {
    const { templateId = 'briefing_brief', variables = {} } = input;
    
    // Resolve templates path
    const templatesPath = path.resolve('knowledge/analytical_templates.json');
    let templateStructure = "# Performance Briefing\n\nMetric Value: :metricValue\nSummary: :summaryText";
    
    if (fs.existsSync(templatesPath)) {
      const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
      const template = templates.find(t => t.id === templateId);
      if (template) {
        templateStructure = template.structure;
      }
    }
    
    // Replace keys in template with inputs variables
    let narrative = templateStructure;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`:${key}`, 'g');
      narrative = narrative.replace(regex, variables[key]);
    });
    
    return {
      narrative
    };
  }
};
