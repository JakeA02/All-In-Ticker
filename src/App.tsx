import React, { useEffect, useState } from "react";
import { StockProvider } from "./context/StockContext";
import { PixiCanvas } from "./components/PixiCanvas";
import { StockCurveChart } from "./components/StockCurveChart";
import "./App.css";

const App: React.FC = () => {
  const [isMarketClosed, setIsMarketClosed] = useState(false);

  const fetchMarketStatus = async () => {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/market-status?exchange=US&token=${process.env.REACT_APP_FINNHUB_API_KEY}`
    );
    const data = await response.json();
    setIsMarketClosed(!data.isOpen && !process.env.REACT_APP_USE_MOCK_DATA);
  };
  useEffect(() => {
    fetchMarketStatus();
  }, []);

  setInterval(async () => {
    fetchMarketStatus();
  }, 60000);

  return (
    <StockProvider>
      <div className="App">
        <div className="canvas-container">
          {/* Stock curve chart as the base layer */}
          {!isMarketClosed ? (
            <>
              <StockCurveChart showControls={false} />
              <PixiCanvas />
            </>
          ) : (
            <img
              className="markets-closed-image"
              src="/images/All-In-End-Screen.png"
              alt="Markets Closed"
            />
          )}
        </div>
      </div>
    </StockProvider>
  );
};

export default App;
