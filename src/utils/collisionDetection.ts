import { Graphics } from "pixi.js";
import { BIRD_SIZE, PIPE_WIDTH } from "../constants/gameConfig";

interface Bird {
  x: number;
  y: number;
}

interface Pipe {
  top: Graphics;
  bottom: Graphics;
}

export function checkBirdPipeCollision(bird: Bird, pipe: Pipe): boolean {
  const birdLeft = bird.x - BIRD_SIZE / 2;
  const birdRight = bird.x + BIRD_SIZE / 2;
  const birdTop = bird.y - BIRD_SIZE / 2;
  const birdBottom = bird.y + BIRD_SIZE / 2;

  const pipeLeft = pipe.top.x;
  const pipeRight = pipe.top.x + PIPE_WIDTH;
  const pipeTopBottom = pipe.top.y + pipe.top.height;
  const pipeBottomTop = pipe.bottom.y;

  // 檢查水平重疊
  if (birdRight < pipeLeft || birdLeft > pipeRight) {
    return false;
  }

  // 檢查垂直重疊
  return birdTop < pipeTopBottom || birdBottom > pipeBottomTop;
}

export function checkBirdGroundCollision(bird: Bird, groundY: number): boolean {
  return bird.y + BIRD_SIZE / 2 >= groundY;
} 