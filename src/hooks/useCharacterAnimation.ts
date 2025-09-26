import { useState, useEffect, useRef } from 'react';

export type CharacterState = 'standing' | 'walking';
export type CharacterDirection = 'left' | 'right';

export interface UseCharacterAnimationOptions {
  characterName: string;
  walkingFrameCount?: number;
  frameDuration?: number; // Duration each frame is shown in ms
}

export interface CharacterAnimationResult {
  currentSprite: string;
  isAnimating: boolean;
  shouldFlip: boolean;
}

export const useCharacterAnimation = (
  state: CharacterState,
  direction: CharacterDirection,
  options: UseCharacterAnimationOptions
): CharacterAnimationResult => {
  const {
    characterName,
    walkingFrameCount = 3,
    frameDuration = 200
  } = options;

  const [currentFrame, setCurrentFrame] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  useEffect(() => {
    if (state === 'walking') {
      setIsAnimating(true);
      
      const animate = (currentTime: number) => {
        if (currentTime - lastFrameTimeRef.current >= frameDuration) {
          setCurrentFrame(prev => (prev % walkingFrameCount) + 1);
          lastFrameTimeRef.current = currentTime;
        }
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsAnimating(false);
      setCurrentFrame(1); // Reset to first frame when not walking
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, frameDuration, walkingFrameCount]);

  const currentSprite = state === 'standing' 
    ? `/images/${characterName}/standing.png`
    : `/images/${characterName}/walking_${currentFrame}.png`;

  // Determine if the character should be flipped (facing left)
  const shouldFlip = direction === 'left';

  return {
    currentSprite,
    isAnimating,
    shouldFlip
  };
};
