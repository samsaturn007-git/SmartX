export interface AQIPrediction {
  nextHour: number;
  nextDay: number;
  confidence: number;
}

function calculateSeasonalWeight(date: Date): number {
  const month = date.getMonth();
  // Winter months have higher weight due to pollution
  if (month <= 1 || month === 11) return 1.2;
  // Monsoon months have lower weight due to rain washing
  if (month >= 6 && month <= 8) return 0.8;
  return 1;
}

function calculateTimeWeight(hour: number): number {
  // Peak pollution hours
  if (hour >= 7 && hour <= 10) return 1.15; // Morning rush
  if (hour >= 17 && hour <= 20) return 1.2; // Evening rush
  // Clean hours
  if (hour >= 1 && hour <= 4) return 0.8;
  return 1;
}

export async function predictAQI(historicalData: number[]): Promise<AQIPrediction> {
  if (historicalData.length < 24) {
    throw new Error('Insufficient historical data for prediction');
  }

  const now = new Date();
  const currentHour = now.getHours();

  // Calculate weighted moving average
  const weights = historicalData.slice(-24).map((_, index) => {
    const hour = (currentHour - (23 - index) + 24) % 24;
    return calculateTimeWeight(hour) * calculateSeasonalWeight(now);
  });

  const weightedSum = historicalData
    .slice(-24)
    .reduce((sum, value, index) => sum + value * weights[index], 0);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const weightedAverage = weightedSum / weightSum;

  // Calculate trend using exponential moving average
  const alpha = 0.2; // Smoothing factor
  const ema = historicalData.slice(-24).reduce((ema, value) => {
    return alpha * value + (1 - alpha) * ema;
  }, historicalData[0]);

  // Calculate volatility for confidence
  const variance = historicalData
    .slice(-24)
    .reduce((sum, value) => sum + Math.pow(value - weightedAverage, 2), 0) / 24;
  const volatility = Math.sqrt(variance);
  
  // Normalize confidence between 0.6 and 0.95
  const confidence = Math.max(0.6, Math.min(0.95, 1 - (volatility / weightedAverage)));

  // Predict next values using weighted average and trend
  const trend = ema - weightedAverage;
  const nextHourWeight = calculateTimeWeight((currentHour + 1) % 24);
  const nextHour = Math.round(
    Math.max(0, Math.min(500, weightedAverage + trend * nextHourWeight))
  );

  // For next day, consider seasonal factors more heavily
  const seasonalTrend = trend * calculateSeasonalWeight(now);
  const nextDay = Math.round(
    Math.max(0, Math.min(500, weightedAverage + seasonalTrend * 24))
  );

  return {
    nextHour,
    nextDay,
    confidence: Number(confidence.toFixed(2))
  };
}