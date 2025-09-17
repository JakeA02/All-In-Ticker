import { StockPrice, StockDataPoint } from '../types/stock';

// Mock data generator for testing
// export const generateMockStockData = (): StockPrice => {
//   const basePrice = 150;
//   const volatility = 0.02; // 2% volatility
  
//   // Generate a random price change
//   const randomChange = (Math.random() - 0.5) * 2 * volatility * basePrice;
//   const previousClose = basePrice + (Math.random() - 0.5) * 10;
//   const current = previousClose + randomChange;
  
//   const change = current - previousClose;
//   const changePercent = (change / previousClose) * 100;

//   return {
//     symbol: 'MOCK',
//     current: Math.round(current * 100) / 100,
//     previousClose: Math.round(previousClose * 100) / 100,
//     change: Math.round(change * 100) / 100,
//     changePercent: Math.round(changePercent * 100) / 100,
//     timestamp: Date.now(),
//   };
// };

// Persistent state for simulating real-time data
let currentSimulatedPrice = 150;
let simulatedDataPoints: StockDataPoint[] = [];
let lastFetchTime = 0;
let dailyTrendStrength = (Math.random() - 0.5) * 0.002; // Overall daily trend

// Reset simulation for a new day
export const resetSimulation = () => {
  currentSimulatedPrice = 150;
  simulatedDataPoints = [];
  lastFetchTime = 0;
  dailyTrendStrength = (Math.random() - 0.5) * 0.002;
};

// Generate the next minute's stock price (simulates real-time fetching)
export const generateNextStockPoint = (): StockDataPoint => {
  const now = Date.now();
  const volatility = 0.002; // Slightly higher volatility for more interesting movement
  
  // Add some random walk with daily trend
  const randomChange = (Math.random() - 0.5) * volatility * currentSimulatedPrice;
  const trendChange = dailyTrendStrength * currentSimulatedPrice;
  currentSimulatedPrice = currentSimulatedPrice + randomChange + trendChange;
  
  // Ensure price stays positive
  currentSimulatedPrice = Math.max(currentSimulatedPrice, 1);
  
  const newPoint: StockDataPoint = {
    price: Math.round(currentSimulatedPrice * 100) / 100,
    timestamp: now
  };
  
  simulatedDataPoints.push(newPoint);
  lastFetchTime = now;
  
  return newPoint;
};

// Get all accumulated data points
export const getAllSimulatedPoints = (): StockDataPoint[] => {
  return [...simulatedDataPoints];
};

// Generate mock data using discrete real-time simulation
export const generateMockStockData = (): StockPrice => {
  // Generate the next data point
  const newPoint = generateNextStockPoint();
  const allPoints = getAllSimulatedPoints();
  
  // Use first point as previous close if we have one, otherwise use a base price
  const previousClose = allPoints.length > 1 ? allPoints[0].price : 150;
  const current = newPoint.price;
  
  const change = current - previousClose;
  const changePercent = (change / previousClose) * 100;
  const changeOverDay = current - previousClose;
  const changeOverDayPercent = (changeOverDay / previousClose) * 100;
  return {
    symbol: 'MOCK',
    current: Math.round(current * 100) / 100,
    previousClose: Math.round(previousClose * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    timestamp: newPoint.timestamp,
    minuteData: allPoints,
    changeOverDay,
    changeOverDayPercent,
  };
};

// Generate mock data with specific trend for testing
export const generateMockStockDataWithTrend = (trend: 'up' | 'down' | 'neutral'): StockPrice => {
  // Adjust the daily trend strength based on the requested trend
  switch (trend) {
    case 'up':
      dailyTrendStrength = Math.random() * 0.003 + 0.001; // Positive trend
      break;
    case 'down':
      dailyTrendStrength = -(Math.random() * 0.003 + 0.001); // Negative trend
      break;
    case 'neutral':
      dailyTrendStrength = (Math.random() - 0.5) * 0.0005; // Very small trend
      break;
  }
  
  // Generate the next data point with the adjusted trend
  return generateMockStockData();
};
