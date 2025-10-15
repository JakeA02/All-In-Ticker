import React from 'react';
import { useCharacterAnimation, CharacterState, CharacterDirection } from '../hooks/useCharacterAnimation';

export interface PixelCharacterProps {
  characterName: string;
  x: number;
  y: number;
  state: CharacterState;
  direction?: CharacterDirection;
  size?: number;
  walkingFrameCount?: number;
  frameDuration?: number;
  speedMultiplier?: number;
}

export const PixelCharacter: React.FC<PixelCharacterProps> = ({
  characterName,
  x,
  y,
  state,
  direction = 'right',
  size = 32,
  walkingFrameCount = 3,
  frameDuration = 200,
  speedMultiplier = 1.0
}) => {
  const { currentSprite, shouldFlip } = useCharacterAnimation(state, direction, {
    characterName,
    walkingFrameCount,
    frameDuration,
    speedMultiplier
  });

  return (
    <image
      href={currentSprite}
      x={x - size / 2} // Center the character on the position
      y={y - size / 2}
      width={size}
      height={size}
      style={{
        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
        imageRendering: 'pixelated', // Preserve pixel art crisp edges
        transform: shouldFlip ? `scaleX(-1)` : undefined,
        transformOrigin: `${x}px ${y}px` // Flip around character center
      }}
    />
  );
};
