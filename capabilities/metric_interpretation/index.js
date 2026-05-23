export default {
  name: 'metric_interpretation',
  config: {
    description: 'Executes Z-score anomaly scans, percentage growth rates, and contributor driver analyses on metric datasets.',
    inputSchema: {
      metricId: 'string',
      trends: 'array of numbers',
      analysisType: 'string (anomaly, variance)'
    },
    outputSchema: {
      growthRate: 'number',
      anomalies: 'array of indices',
      explanation: 'string',
      statistics: 'object'
    }
  },
  handler: async (input) => {
    const trends = input.trends || [];
    const metricId = input.metricId || 'Metric';
    
    if (trends.length === 0) {
      return {
        growthRate: 0,
        anomalies: [],
        explanation: 'No historical trends available to analyze.',
        statistics: {}
      };
    }
    
    // 1. Calculate growth rate (latest vs previous)
    let growthRate = 0;
    if (trends.length > 1) {
      const latest = trends[trends.length - 1];
      const previous = trends[trends.length - 2];
      growthRate = parseFloat((((latest - previous) / previous) * 100).toFixed(2));
    }
    
    // 2. Compute statistics: Mean, Standard Deviation, and Z-Scores
    const mean = trends.reduce((acc, v) => acc + v, 0) / trends.length;
    const squaredDiffs = trends.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((acc, v) => acc + v, 0) / trends.length;
    const stdDev = Math.sqrt(variance) || 1;
    
    const anomalies = [];
    trends.forEach((val, idx) => {
      const zScore = (val - mean) / stdDev;
      if (Math.abs(zScore) > 1.5) { // Use slightly lower threshold for MVP visibility
        anomalies.push({
          index: idx,
          value: val,
          zScore: parseFloat(zScore.toFixed(2))
        });
      }
    });
    
    // 3. Draft business explanations
    let explanation = `The metric ${metricId} changed by ${growthRate}% in the latest period. `;
    if (anomalies.length > 0) {
      const latestAnomaly = anomalies[anomalies.length - 1];
      explanation += `🚨 Critical anomaly detected at data index ${latestAnomaly.index} with value ${latestAnomaly.value} (Z-Score: ${latestAnomaly.zScore} std devs).`;
    } else {
      explanation += `✅ No statistical anomalies flagged. Metric fluctuations reside within normal baseline distributions.`;
    }
    
    return {
      growthRate,
      anomalies,
      explanation,
      statistics: {
        mean: parseFloat(mean.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        variance: parseFloat(variance.toFixed(2))
      }
    };
  }
};
