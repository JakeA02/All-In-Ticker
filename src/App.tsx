import React, { useState } from "react";
import { StockProvider } from "./context/StockContext";
import { PixiCanvas } from "./components/PixiCanvas";
import { StockCurveChart } from "./components/StockCurveChart";
import { ControlPanel } from "./components/ControlPanel";
import "./App.css";
import { currentCharacterStockData } from "./utils/CharacterStockData";

const App: React.FC = () => {
  const [isMarketClosed, setIsMarketClosed] = useState(false);

  setInterval(() => {
    setIsMarketClosed(!currentCharacterStockData());
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

          <div className="controls-container">
            <ControlPanel />
          </div>
        </main>
      </div>
    </StockProvider>
  );
};

export default App;
