import React, { useState, useEffect, useMemo } from 'react';
import { StockDataPoint } from '../types/stock';
import { scaleTime, scaleLinear } from '@visx/scale';

interface WorkmanProps {
  width: number;
  height: number;
  margin: number;
  graphWidth: number;
  graphHeight: number;
  xScale: ReturnType<typeof scaleTime<number>>;
  yScale: ReturnType<typeof scaleLinear<number>>;
  newDataPoint: StockDataPoint | null;
  onAnimationComplete?: () => void;
}

interface WorkmanPosition {
  x: number;
  y: number;
}

type AnimationPhase = 'idle' | 'movingToX' | 'movingToY' | 'waiting' | 'returning';

export const Workman: React.FC<WorkmanProps> = ({
  width,
  height,
  margin,
  graphWidth,
  graphHeight,
  xScale,
  yScale,
  newDataPoint,
  onAnimationComplete
}) => {
  // Memoize rest position to prevent unnecessary re-renders
  const restPosition: WorkmanPosition = useMemo(() => ({
    x: margin + graphWidth - 10,
    y: margin + graphHeight - 10
  }), [margin, graphWidth, graphHeight]);

  const [position, setPosition] = useState<WorkmanPosition>(restPosition);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [targetDataPoint, setTargetDataPoint] = useState<StockDataPoint | null>(null);

  // Animation parameters
  const ANIMATION_DURATION = 1000; // 1 second for each movement
  const WAIT_DURATION = 5000; // 5 seconds wait at data point

  // Update position when rest position changes (e.g., graph resize)
  useEffect(() => {
    if (animationPhase === 'idle') {
      setPosition(restPosition);
    }
  }, [restPosition, animationPhase]);

  useEffect(() => {
    if (newDataPoint && animationPhase === 'idle') {

      setTargetDataPoint(newDataPoint);
      setAnimationPhase('movingToX');
    }
  }, [newDataPoint, animationPhase]);

  useEffect(() => {
    
    if (!targetDataPoint || animationPhase === 'idle') return;

    const targetX = margin + 10 + (xScale(new Date(targetDataPoint.timestamp)) ?? 0);
    const targetY = margin + (yScale(targetDataPoint.price) ?? 0);


    let animationFrame: number;
    let startTime: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;

      switch (animationPhase) {
        case 'movingToX': {
          const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          
          const newX = restPosition.x + (targetX - restPosition.x) * easeProgress;

          setPosition(prev => ({
            x: newX,
            y: prev.y
          }));

          if (progress >= 1) {
            setAnimationPhase('movingToY');
            startTime = 0;
          } else {
            animationFrame = requestAnimationFrame(animate);
          }
          break;
        }

        case 'movingToY': {
          const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          
          const newY = restPosition.y + (targetY - restPosition.y) * easeProgress;
          
          
          
          setPosition(prev => ({
            x: prev.x,
            y: newY
          }));

          if (progress >= 1) {
            setAnimationPhase('waiting');
            startTime = 0;
          } else {
            animationFrame = requestAnimationFrame(animate);
          }
          break;
        }

        case 'waiting': {
          if (elapsed >= WAIT_DURATION) {
            setAnimationPhase('returning');
            startTime = 0;
          } else {
            animationFrame = requestAnimationFrame(animate);
          }
          break;
        }

        case 'returning': {
          const progress = Math.min(elapsed / (ANIMATION_DURATION * 1.5), 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          
          setPosition(prev => {
            const newX = prev.x + (restPosition.x - prev.x) * easeProgress;
            const newY = prev.y + (restPosition.y - prev.y) * easeProgress;

            
            return { x: newX, y: newY };
          });

          if (progress >= 1) {
            setPosition(restPosition);
            setAnimationPhase('idle');
            setTargetDataPoint(null);
            onAnimationComplete?.();
          } else {
            animationFrame = requestAnimationFrame(animate);
          }
          break;
        }

        default:
          break;
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [animationPhase, targetDataPoint, xScale, yScale, margin, restPosition.x, restPosition.y, onAnimationComplete, ANIMATION_DURATION, WAIT_DURATION]);

  return (
    <g className="workman-overlay">
      <circle
        cx={position.x}
        cy={position.y}
        r={6}
        fill="#2196F3"
        stroke="#1976D2"
        strokeWidth={2}
        style={{
          filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
          transition: animationPhase === 'idle' ? 'all 0.3s ease' : 'none'
        }}
      />
      {/* Optional: Add a small label */}
      <text
        x={position.x}
        y={position.y - 12}
        textAnchor="middle"
        fontSize={8}
        fill="#2196F3"
        fontWeight="bold"
        style={{ userSelect: 'none' }}
      >
        W
      </text>
    </g>
  );
};
