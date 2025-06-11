import { useState, useCallback } from 'react';

interface GameState {
  score: number;
  isDead: boolean;
  velocity: number;
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    isDead: false,
    velocity: 0,
  });

  const incrementScore = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + 1,
    }));
  }, []);

  const setVelocity = useCallback((velocity: number) => {
    setGameState(prev => ({
      ...prev,
      velocity,
    }));
  }, []);

  const die = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isDead: true,
    }));
  }, []);

  const restart = useCallback(() => {
    setGameState({
      score: 0,
      isDead: false,
      velocity: 0,
    });
  }, []);

  return {
    gameState,
    incrementScore,
    setVelocity,
    die,
    restart,
  };
} 