import React from 'react';
import { useStock } from '../context/StockContext';
import { generateMockStockDataWithTrend, resetSimulation } from '../utils/mockData';

export const ControlPanel: React.FC = () => {
  const { useMockData, setUseMockData } = useStock();

  const handleMockDataToggle = () => {
    setUseMockData(!useMockData);
  };

  const simulateStockChange = (trend: 'up' | 'down' | 'neutral') => {
    // This is for testing purposes - in a real app, this would be handled by the polling hook
    const mockData = generateMockStockDataWithTrend(trend);
    console.log('Simulated stock change:', mockData);
    // The actual data update will be handled by the polling hook
  };

  const handleResetSimulation = () => {
    resetSimulation();
    console.log('Simulation reset - starting fresh');
  };

  return (
    <div className="control-panel">
      <h3>Controls</h3>
      
      <div className="control-group">
        <label>
          <input
            type="checkbox"
            checked={useMockData}
            onChange={handleMockDataToggle}
          />
          Use Mock Data (for demo)
        </label>
      </div>

      {useMockData && (
        <div className="control-group">
          <h4>Simulation Controls:</h4>
          <div className="button-group">
            <button 
              onClick={handleResetSimulation}
              className="btn btn-warning"
              style={{ marginBottom: '10px', width: '100%' }}
            >
              🔄 Reset Simulation
            </button>
          </div>
          <h4>Test Stock Movements:</h4>
          <div className="button-group">
            <button 
              onClick={() => simulateStockChange('up')}
              className="btn btn-success"
            >
              📈 Simulate Up
            </button>
            <button 
              onClick={() => simulateStockChange('down')}
              className="btn btn-danger"
            >
              📉 Simulate Down
            </button>
            <button 
              onClick={() => simulateStockChange('neutral')}
              className="btn btn-neutral"
            >
              ➡️ Simulate Neutral
            </button>
          </div>
        </div>
      )}

      <div className="info-section">
        <h4>How it works:</h4>
        <ul>
          <li>📈 Smooth curve line showing price movement</li>
          <li>⏱️ New data point every 1 minute (discrete fetching)</li>
          <li>📊 Real-time price updates with VSX curves</li>
          <li>🎮 Toggle mock data for testing</li>
          <li>🔄 Reset simulation to start fresh</li>
          <li>📉 Jagged, realistic stock movement patterns</li>
        </ul>
      </div>
    </div>
  );
};
