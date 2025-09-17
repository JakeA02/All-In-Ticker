import { useEffect, useState } from 'react';
import { useStock } from '../context/StockContext';
import { StockPrice, FinnhubQuote } from '../types/stock';
import { generateMockStockData } from '../utils/mockData';

const FINNHUB_API_KEY = 'your_finnhub_api_key_here'; // Replace with actual API key
const POLLING_INTERVAL = 5000; // 1 minute (60 seconds)

export const useFinnhubStock = (symbol: string = 'AAPL') => {
  const { useMockData } = useStock();
  const [stockData, setStockData] = useState<StockPrice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = async (): Promise<StockPrice | null> => {
    try {
      // For demo purposes, we'll use mock data by default
      // In production, replace this with actual Finnhub API call
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      
      const data: FinnhubQuote = await response.json();
      
      return {
        symbol,
        current: data.c,
        previousClose: data.pc,
        change: data.c - data.pc,
        changePercent: ((data.c - data.pc) / data.pc) * 100,
        timestamp: data.t * 1000, // Convert to milliseconds
      };
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  };

  const updateStockData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let newStockData: StockPrice;
      
      if (useMockData) {
        // Use mock data for demo
        newStockData = generateMockStockData();
      } else {
        // Use real Finnhub API
        const data = await fetchStockData();
        if (!data) throw new Error('No data received');
        newStockData = data;
      }

      setStockData(newStockData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Stock data update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    updateStockData();

    // Set up polling
    const interval = setInterval(updateStockData, POLLING_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [symbol, useMockData]);

  return {
    stockData,
    isLoading,
    error,
    refetch: updateStockData,
  };
};
