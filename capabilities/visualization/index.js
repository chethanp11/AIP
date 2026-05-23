export default {
  name: 'visualization',
  config: {
    description: 'Compiles raw historical arrays and chart choices into standardized Vega-Lite JSON specs.',
    inputSchema: {
      chartType: 'string (bar, line)',
      trends: 'array of numbers',
      labels: 'array of strings (optional)'
    },
    outputSchema: {
      vegaSpec: 'object'
    }
  },
  handler: async (input) => {
    const trends = input.trends || [];
    const chartType = input.chartType || 'line';
    const labels = input.labels || trends.map((_, idx) => `P-${idx + 1}`);
    
    // Map trends and labels to Vega values array
    const values = trends.map((val, idx) => ({
      period: labels[idx],
      value: val
    }));
    
    const vegaSpec = {
      "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
      "description": "AIP Auto Generated Spec",
      "width": "container",
      "height": 220,
      "data": {
        "values": values
      },
      "mark": chartType === 'bar' ? 'bar' : 'line',
      "encoding": {
        "x": {
          "field": "period",
          "type": "nominal",
          "axis": { "labelAngle": 0 }
        },
        "y": {
          "field": "value",
          "type": "quantitative"
        }
      }
    };
    
    return {
      vegaSpec
    };
  }
};
