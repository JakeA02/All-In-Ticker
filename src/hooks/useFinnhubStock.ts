import { useEffect, useState, useRef, useCallback } from "react";
import { useStock } from "../context/StockContext";
import { StockPrice, FinnhubQuote, StockDataPoint } from "../types/stock";
import {
  generateMockStockData,
  initializeWithPrePopulatedData,
} from "../utils/mockData";
import { apiClient } from "../utils/apiClient";

const POLLING_INTERVAL = process.env.REACT_APP_POLLING_INTERVAL ? parseInt(process.env.REACT_APP_POLLING_INTERVAL) : 60000;


export const useFinnhubStock = (symbol: string = "TSLA") => {
  const { useMockData } = useStock();
  const [stockData, setStockData] = useState<StockPrice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accumulatedMinuteData, setAccumulatedMinuteData] = useState<
    StockDataPoint[]
  >([]);

  // Use ref to track current accumulated data to avoid stale closures
  const accumulatedDataRef = useRef<StockDataPoint[]>([]);
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;

  // Reset accumulated data (useful when changing symbols or starting fresh)
  const resetAccumulatedData = useCallback(() => {
    setAccumulatedMinuteData([]);
    accumulatedDataRef.current = [];
  }, []);

  const fetchStockData = async (
    stockSymbol: string
  ): Promise<Omit<StockPrice, "minuteData"> | null> => {
    try {
      // Call our API endpoint instead of Finnhub directly
      const data: FinnhubQuote = await apiClient.getStockQuote(stockSymbol);

      const changeOverDay = data.c - data.pc;
      const changeOverDayPercent = (changeOverDay / data.pc) * 100;

      return {
        symbol: stockSymbol,
        current: data.c,
        previousClose: data.pc,
        change: data.c - data.pc,
        changePercent: ((data.c - data.pc) / data.pc) * 100,
        timestamp: data.t * 1000, // Convert to milliseconds
        changeOverDay,
        changeOverDayPercent,
      };
    } catch (error) {
      console.error("Error fetching stock data:", error);
      throw error;
    }
  };

  const updateStockData = useCallback(async () => {
    const requestSymbol = symbol;
    // setIsLoading(true);
    setError(null);

    try {
      let newStockData: StockPrice;

      if (useMockData) {
        // Use mock data for demo
        newStockData = generateMockStockData();
      } else {
        try {
          // Use real Finnhub API through our backend
          const data = await fetchStockData(requestSymbol);
          // Ignore stale responses from a previous symbol (e.g. hour-boundary switch)
          if (requestSymbol !== symbolRef.current) return;
          if (!data) throw new Error("No data received");

          // Create a new data point for minute data
          // Use current time for the timestamp to show when we fetched the data
          const newDataPoint: StockDataPoint = {
            price: data.current,
            timestamp: Date.now(),
          };

          // Update accumulated data using ref to avoid stale closures
          const updatedAccumulatedData = [
            ...accumulatedDataRef.current,
            newDataPoint,
          ];
          accumulatedDataRef.current = updatedAccumulatedData;
          setAccumulatedMinuteData(updatedAccumulatedData);

          // Create the final stock data with the updated minute data
          newStockData = {
            ...data,
            minuteData: updatedAccumulatedData,
          };
        } catch (apiError) {
          if (requestSymbol !== symbolRef.current) return;
          console.warn("API call failed, falling back to mock data:", apiError);
          // Fall back to mock data if API fails (e.g., in development)
          newStockData = generateMockStockData();
        }
      }

      if (requestSymbol !== symbolRef.current) return;
      setStockData(newStockData);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      console.error("Stock data update failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, useMockData]);

  useEffect(() => {
    // Reset accumulated data when symbol changes or switching between mock/real data
    resetAccumulatedData();

    // Initialize mock data with pre-populated data for testing (390 minutes = full trading day)
    if (useMockData) {
      initializeWithPrePopulatedData(15);
    }

    // Initial fetch
    updateStockData();

    // Set up polling
    const interval = setInterval(updateStockData, POLLING_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [updateStockData, resetAccumulatedData, useMockData]);

  return {
    stockData,
    isLoading,
    error,
    refetch: updateStockData,
    resetAccumulatedData,
  };
};
