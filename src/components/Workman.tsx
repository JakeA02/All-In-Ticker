import React, { useState, useEffect, useMemo } from 'react';
import { StockDataPoint } from '../types/stock';
import { scaleTime, scaleLinear } from '@visx/scale';
import { PixelCharacter } from './PixelCharacter';
import { CharacterState, CharacterDirection } from '../hooks/useCharacterAnimation';
import { currentCharacterStockData } from '../utils/CharacterStockData';

interface WorkmanProps {
  width: number;
  height: number;
  margin: number;
  graphWidth: number;
  graphHeight: number;
  xScale: ReturnType<typeof scaleTime<number>>;
  yScale: ReturnType<typeof scaleLinear<number>>;
  newDataPoint: StockDataPoint | null;
  onBuildingComplete?: () => void;
}

interface WorkmanPosition {
  x: number;
  y: number;
}

type AnimationPhase = 'idle' | 'movingToX' | 'movingToY' | 'waiting' | 'returningToY' | 'returningToX';

export const Workman: React.FC<WorkmanProps> = ({
  width,
  height,
  margin,
  graphWidth,
  graphHeight,
  xScale,
  yScale,
  newDataPoint,
  onBuildingComplete
}) => { 
  // Memoize rest position to prevent unnecessary re-renders
  const restPosition: WorkmanPosition = useMemo(() => ({
    x: margin + graphWidth - 20,
    y: margin + graphHeight - 35
  }), [margin, graphWidth, graphHeight]);

  const [position, setPosition] = useState<WorkmanPosition>(restPosition);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [targetDataPoint, setTargetDataPoint] = useState<StockDataPoint | null>(null);

  // Add ladder-related state
  const [showLadder, setShowLadder] = useState<boolean>(false);
  const [ladderHeight, setLadderHeight] = useState<number>(0);
  const [ladderX, setLadderX] = useState<number>(0);

  // Animation parameters
  const ANIMATION_DURATION = 1000; // 1 second for each movement
  const WAIT_DURATION = 5000; // 5 seconds wait at data point

  // Map animation phases to character states
  const getCharacterState = (phase: AnimationPhase): CharacterState => {
    switch (phase) {
      case 'movingToX':
      case 'movingToY':
      case 'returningToY':
      case 'returningToX':
        return 'walking';
      case 'idle':
      case 'waiting':
      default:
        return 'standing';
    }
  };

  // Determine character direction based on animation phase
  const getCharacterDirection = (phase: AnimationPhase): CharacterDirection => {
    switch (phase) {
      case 'returningToX': // Moving left back to rest position
      case 'returningToY': // Coming down the ladder (facing left)
        return 'left';
      case 'movingToX':   // Moving right to data point
      case 'movingToY':   // Going up the ladder (facing right)
      case 'idle':
      case 'waiting':
      default:
        return 'right';
    }
  };

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
    let startPosition: WorkmanPosition | null = null;

    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
        // Capture the starting position for this animation phase
        startPosition = { ...position };
      }
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
            // Calculate ladder before moving to Y
            calculateLadder(position.y, targetY, targetX);
            setAnimationPhase('movingToY');
            startTime = 0;
            startPosition = null;
          } else {
            animationFrame = requestAnimationFrame(animate);
          }
          break;
        }

        case 'movingToY': {
          if (!startPosition) break;
          
          const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          
          const newY = startPosition.y + (targetY - startPosition.y) * easeProgress;
          
          setPosition(prev => ({
            x: prev.x,
            y: newY
          }));

          if (progress >= 1) {
            setAnimationPhase('waiting');
            startTime = 0;
            startPosition = null; // Reset for next phase
          } else {
            animationFrame = requestAnimationFrame(animate);
          }
          break;
        }

        case 'waiting': {
          if (elapsed >= WAIT_DURATION) {
            setAnimationPhase('returningToY');
            startTime = 0;
            startPosition = null; // Reset for next phase
          } else {
            animationFrame = requestAnimationFrame(animate);
          }
          break;
        }

        case 'returningToY': {
          if (!startPosition) break;
          onBuildingComplete?.();
          
          const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          
          const newY = startPosition.y + (restPosition.y - startPosition.y) * easeProgress;
          
          setPosition(prev => ({
            x: prev.x, // Keep current X position
            y: newY    // Move to rest Y position
          }));

          if (progress >= 1) {
            setShowLadder(false); // Hide ladder when returning
            setAnimationPhase('returningToX');
            startTime = 0; // Reset start time for next phase
            startPosition = null; // Reset start position for next phase
          } else {
            animationFrame = requestAnimationFrame(animate);
          }
          break;
        }

        case 'returningToX': {
          if (!startPosition) break;
          
          const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          
          const newX = startPosition.x + (restPosition.x - startPosition.x) * easeProgress;
          
          setPosition(prev => ({
            x: newX,   // Move to rest X position
            y: prev.y  // Keep current Y position
          }));

          if (progress >= 1) {
            setPosition(restPosition);
            setAnimationPhase('idle');
            setTargetDataPoint(null);
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
  }, [animationPhase, targetDataPoint, xScale, yScale, margin, restPosition.x, restPosition.y, onBuildingComplete, ANIMATION_DURATION, WAIT_DURATION]);

  // Calculate ladder properties when starting Y movement
  const calculateLadder = (startY: number, targetY: number, x: number) => {
    const height = Math.abs(targetY - startY);
    setLadderHeight(height);
    setLadderX(x);
    setShowLadder(height > 20); // Only show ladder for significant Y movements
  };

  const ChipStack = () => {
    const chipPath = `/images/chips/mystack.png`;
    return (
      <image
      href={chipPath}
      x={margin + graphWidth - 10}
      y={margin + graphHeight - 30}
      width={35}
      height={35}
    />
    )
  }
  // Ladder rendering function
  const renderLadder = () => {
    if (!showLadder || ladderHeight === 0) return null;

    const rungs = Math.floor(ladderHeight / 15); // Rung every 15 pixels
    const ladderWidth = 12;
    const startY = Math.min(position.y, targetDataPoint ? margin + (yScale(targetDataPoint.price) ?? 0) : position.y);

    return (
      <g className="ladder">
        {/* Left rail */}
        <line
          x1={ladderX - ladderWidth/2}
          y1={startY}
          x2={ladderX - ladderWidth/2}
          y2={startY + ladderHeight}
          stroke="#8B4513"
          strokeWidth={2}
        />
        {/* Right rail */}
        <line
          x1={ladderX + ladderWidth/2}
          y1={startY}
          x2={ladderX + ladderWidth/2}
          y2={startY + ladderHeight}
          stroke="#8B4513"
          strokeWidth={2}
        />
        {/* Rungs */}
        {Array.from({ length: rungs }, (_, i) => (
          <line
            key={i}
            x1={ladderX - ladderWidth/2}
            y1={startY + (i + 1) * (ladderHeight / (rungs + 1))}
            x2={ladderX + ladderWidth/2}
            y2={startY + (i + 1) * (ladderHeight / (rungs + 1))}
            stroke="#8B4513"
            strokeWidth={1.5}
          />
        ))}
      </g>
    );
  };

  return (
    <g className="workman-overlay">
      {/* Render ladder first (behind workman) */}
      {renderLadder()}

      {/* Pixel character workman */}
      <PixelCharacter
        characterName={currentCharacterStockData()?.character ?? 'charlie'}
        x={position.x}
        y={position.y}
        state={getCharacterState(animationPhase)}
        direction={getCharacterDirection(animationPhase)}
        size={84}
        frameDuration={300}
      />
      <ChipStack />
    </g>
  );
};
