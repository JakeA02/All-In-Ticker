export interface StockDataPoint {
  price: number;
  timestamp: number;
}

export interface StockPrice {
  symbol: string;
  current: number;
  previousClose: number;
  change: number;
  changePercent: number;
  timestamp: number;
  minuteData?: StockDataPoint[]; // 390 points for full trading day (9:30 AM - 4:00 PM)
  changeOverDay: number;
  changeOverDayPercent: number;
}

export interface StockContextType {
  stockData: StockPrice | null;
  isLoading: boolean;
  error: string | null;
  useMockData: boolean;
  setUseMockData: (useMock: boolean) => void;
}

export interface FinnhubQuote {
  c: number; // Current price
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}
