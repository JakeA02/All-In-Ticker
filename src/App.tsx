import React from 'react';
import { StockProvider } from './context/StockContext';
import { PixiCanvas } from './components/PixiCanvas';
import { StockCurveChart } from './components/StockCurveChart';
import { ControlPanel } from './components/ControlPanel';
import './App.css';

const App: React.FC = () => {
  return (
    <StockProvider>
      <div className="App">
        <header className="app-header">
          <h1>AniStock</h1>
          <p>Watch your stock climb or fall in real-time!</p>
        </header>
        
        <main className="app-main">
          <div className="canvas-container" style={{ position: 'relative', width: '800px', height: '480px' }}>
            {/* Stock curve chart as the base layer */}
            <StockCurveChart width={800} height={480} showControls={true} />
            
            {/* PixiCanvas overlay for workman animation */}
            <PixiCanvas width={800} height={480} />
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
