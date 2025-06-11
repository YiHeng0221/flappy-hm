import { useCallback } from 'react';
import { JUMP_VELOCITY } from '../constants/gameConfig';

interface GameControlsProps {
  isDead: boolean;
  onJump: (velocity: number) => void;
  onRestart: () => void;
}

export function useGameControls({ isDead, onJump, onRestart }: GameControlsProps) {
  const handlePointerDown = useCallback(() => {
    if (isDead) {
      onRestart();
      return;
    }
    onJump(JUMP_VELOCITY);
  }, [isDead, onJump, onRestart]);

  return {
    handlePointerDown,
  };
} 