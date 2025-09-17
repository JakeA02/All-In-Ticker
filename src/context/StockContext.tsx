import React, { createContext, useContext, useState, ReactNode } from 'react';
import { StockContextType, StockPrice } from '../types/stock';

const StockContext = createContext<StockContextType | undefined>(undefined);

interface StockProviderProps {
  children: ReactNode;
}

export const StockProvider: React.FC<StockProviderProps> = ({ children }) => {
  const [stockData, setStockData] = useState<StockPrice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState<boolean>(process.env.REACT_APP_USE_MOCK_DATA === 'true');

  const value: StockContextType = {
    stockData,
    isLoading,
    error,
    useMockData,
    setUseMockData,
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
};

export const useStock = (): StockContextType => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

// Export for direct access to context (useful for updating from hooks)
export const StockContextRaw = StockContext;
