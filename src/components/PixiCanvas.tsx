import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';

interface PixiCanvasProps {
  width?: number;
  height?: number;
}

export const PixiCanvas: React.FC<PixiCanvasProps> = ({ 
  width: propWidth, 
  height: propHeight 
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [dimensions, setDimensions] = useState({
    width: propWidth || window.innerWidth,
    height: propHeight || window.innerHeight
  });

  const width = propWidth || dimensions.width;
  const height = propHeight || dimensions.height;

  // Handle window resize
  useEffect(() => {
    if (propWidth && propHeight) return;

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [propWidth, propHeight]);

  // Initialize PIXI application - minimal setup for future animations
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0xFFFFFF,
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
