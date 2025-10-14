import React, { useEffect, useState } from "react";
import { StockProvider } from "./context/StockContext";
import { PixiCanvas } from "./components/PixiCanvas";
import { StockCurveChart } from "./components/StockCurveChart";
import { ControlPanel } from "./components/ControlPanel";
import "./App.css";

const App: React.FC = () => {
  const [isMarketClosed, setIsMarketClosed] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);

  const fetchMarketStatus = async () => {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/market-status?exchange=US&token=${process.env.REACT_APP_FINNHUB_API_KEY}`
    );
    const data = await response.json();
    setIsMarketClosed(!data.isOpen);
    setIsHoliday(data.holiday);
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
        <header className="app-header">
          <h1>All-In-Dex</h1>
        </header>

        <main className="app-main">
          <div
            className="canvas-container"
            style={{ position: "relative", width: "800px", height: "480px" }}
          >
            {/* Stock curve chart as the base layer */}
            {!isMarketClosed ? (
              <>
                <StockCurveChart width={800} height={480} showControls={true} />

                <PixiCanvas width={800} height={480} />
              </>
            ) : (
              <img
                className="markets-closed-image"
                src="/images/All-In-End-Screen.png"
                alt="Markets Closed"
              />
            )}
          </div>
        </main>
      </div>
    </StockProvider>
  );
};

export default App;
