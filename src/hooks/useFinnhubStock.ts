import { useEffect, useState, useRef, useCallback } from "react";
import { useStock } from "../context/StockContext";
import { StockPrice, FinnhubQuote, StockDataPoint } from "../types/stock";
import {
  generateMockStockData,
  initializeWithPrePopulatedData,
} from "../utils/mockData";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
// const POLLING_INTERVAL = process.env.REACT_APP_POLLING_INTERVAL ? parseInt(process.env.REACT_APP_POLLING_INTERVAL) : 60000;
const POLLING_INTERVAL = 60000;

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

  // Reset accumulated data (useful when changing symbols or starting fresh)
  const resetAccumulatedData = useCallback(() => {
    setAccumulatedMinuteData([]);
    accumulatedDataRef.current = [];
  }, []);

  const fetchStockData = async (): Promise<Omit<
    StockPrice,
    "minuteData"
  > | null> => {
    try {
      // For demo purposes, we'll use mock data by default
      // In production, replace this with actual Finnhub API call
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch stock data");
      }

      const data: FinnhubQuote = await response.json();

      const changeOverDay = data.c - data.pc;
      const changeOverDayPercent = (changeOverDay / data.pc) * 100;

      return {
        symbol,
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
    // setIsLoading(true);
    setError(null);

    try {
      let newStockData: StockPrice;

      if (useMockData) {
        // Use mock data for demo
        newStockData = generateMockStockData();
      } else {
        // Use real Finnhub API
        const data = await fetchStockData();
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
      }

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
      initializeWithPrePopulatedData(299);
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
