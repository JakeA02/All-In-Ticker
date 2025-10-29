import React, { useEffect, useState } from "react";
import { StockProvider } from "./context/StockContext";
import { PixiCanvas } from "./components/PixiCanvas";
import { StockCurveChart } from "./components/StockCurveChart";
import { apiClient } from "./utils/apiClient";
import "./App.css";

const App: React.FC = () => {
  const [isMarketClosed, setIsMarketClosed] = useState(false);

  const fetchMarketStatus = async () => {
    try {
      const data = await apiClient.getMarketStatus();
      setIsMarketClosed(
        !data.isOpen && process.env.REACT_APP_USE_MOCK_DATA !== "true"
      );
    } catch (error) {
      console.error("Error fetching market status:", error);
      // In development or when API fails, assume market is open (show the app)
      setIsMarketClosed(false);
    }
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
