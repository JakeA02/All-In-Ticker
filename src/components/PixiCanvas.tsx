import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

interface PixiCanvasProps {
  width?: number;
  height?: number;
}

export const PixiCanvas: React.FC<PixiCanvasProps> = ({ 
  width = 800, 
  height = 480 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  // Initialize PIXI application - minimal setup for future animations
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x000000,
      backgroundAlpha: 0, // Transparent background
      antialias: true,
    });

    appRef.current = app;
    canvasRef.current.appendChild(app.view as HTMLCanvasElement);

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [width, height]);

  return (
    <div className="pixi-canvas-container" style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%',
      pointerEvents: 'none' // Allow clicks to pass through to chart below
    }}>
      <div ref={canvasRef} style={{ pointerEvents: 'none' }} />
    </div>
  );
};
