import { useEffect, useRef, useCallback } from "react";
// PixiJS v8
import { Application, Graphics, Text, Sprite, Texture, Assets, Container, ParticleContainer } from "pixi.js";
import { GRAVITY, PIPE_INTERVAL, PIPE_SPEED, PIPE_GAP, DAY_COLOR } from "../constants/gameConfig";
import { CloudSystem } from "./CloudSystem";
import { DayNightCycle } from "./DayNightCycle";
import { GameUI } from "./GameUI";
import { useParticleSystem } from "../hooks/useParticleSystem";
import { useGameState } from "../hooks/useGameState";
import { useGameControls } from "../hooks/useGameControls";
import { checkBirdPipeCollision, checkBirdGroundCollision } from "../utils/collisionDetection";

// 遊戲設定常數
const JUMP_VELOCITY = -8; // 跳躍初速度

// 粒子系統設定
const PARTICLE_COUNT = 50; // 粒子數量
const PARTICLE_LIFETIME = 60; // 粒子生命週期（幀數）
const PARTICLE_SPEED = 2; // 粒子移動速度

// 背景設定
const CLOUD_COUNT = 5; // 雲朵數量
const CLOUD_SPEED = 0.5; // 雲朵移動速度

// 晝夜循環設定
const DAY_NIGHT_CYCLE = 3000; // 晝夜循環時間（幀數）
const NIGHT_COLOR = 0x000033; // 夜晚顏色（深藍）

// RWD: 畫布高度 = 視窗高度，寬度 = 視窗寬度
export default function FlappyBirdGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const tickerRef = useRef<any>(null);
  const gameContainerRef = useRef<Container | null>(null);
  const gameLoopRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef(false);
  const gameStateRef = useRef({
    score: 0,
    isDead: false,
    velocity: 0
  });

  const {
    gameState: { score, isDead, velocity },
    incrementScore,
    setVelocity,
    die,
    restart
  } = useGameState();

  const handleJump = useCallback((velocity: number) => {
    setVelocity(velocity);
    gameStateRef.current.velocity = velocity;
  }, [setVelocity]);

  const handleRestart = useCallback(() => {
    restart();
    gameStateRef.current.isDead = false;
    gameStateRef.current.velocity = 0;
  }, [restart]);

  const { handlePointerDown } = useGameControls({
    isDead,
    onJump: handleJump,
    onRestart: handleRestart
  });

  useEffect(() => {
    let pipeTimer: number;

    const cleanup = () => {
      if (pipeTimer) {
        clearInterval(pipeTimer);
      }

      // 先移除遊戲循環
      if (gameLoopRef.current && tickerRef.current) {
        tickerRef.current.remove(gameLoopRef.current);
        gameLoopRef.current = null;
      }

      // 清理遊戲容器
      if (gameContainerRef.current) {
        gameContainerRef.current.destroy({ children: true });
        gameContainerRef.current = null;
      }

      // 清理應用程序
      if (appRef.current) {
        // 先停止 ticker
        if (tickerRef.current) {
          tickerRef.current.stop();
          tickerRef.current = null;
        }
        
        // 然後銷毀應用程序
        appRef.current.destroy(true, true);
        appRef.current = null;
      }

      // 最後清理 DOM
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };

    const initGame = async () => {
      if (!containerRef.current || isInitializedRef.current) return;
      isInitializedRef.current = true;

      // 清理舊的實例
      cleanup();

      const canvas = document.createElement('canvas');
      const app = new Application();
      await app.init({
        canvas,
        resizeTo: containerRef.current,
        backgroundColor: DAY_COLOR,
        antialias: true,
      });

      appRef.current = app;
      tickerRef.current = app.ticker;
      containerRef.current.appendChild(app.canvas as unknown as Node);

      // 場景大小
      let width = app.renderer.width;
      let height = app.renderer.height;
      let groundY = height - 80;

      // 創建遊戲主容器
      const gameContainer = new Container();
      gameContainerRef.current = gameContainer;
      app.stage.addChild(gameContainer);

      // 創建背景容器
      const backgroundContainer = new Container();
      app.stage.addChild(backgroundContainer);
      app.stage.setChildIndex(backgroundContainer, 0);

      // 創建 UI 容器
      const uiContainer = new Container();
      app.stage.addChild(uiContainer);

      // 創建粒子容器
      const particleContainer = new Container();
      gameContainer.addChild(particleContainer);

      // 初始化各個系統
      const cloudSystem = new CloudSystem({ container: backgroundContainer, width, height });
      const dayNightCycle = new DayNightCycle(app);
      const gameUI = new GameUI({ container: uiContainer, width, height });
      const { createParticleBurst, updateParticles } = useParticleSystem(particleContainer);

      // 地面
      const ground = new Graphics();
      ground.rect(0, 0, width, 80).fill(0x6C1C0C);
      ground.y = groundY;
      gameContainer.addChild(ground);

      // 建立鳥
      await Assets.load('/heromama.png');
      const birdTexture = Texture.from('/heromama.png');
      let bird = new Sprite(birdTexture);
      bird.anchor.set(0.5);
      bird.scale.set(1);
      bird.x = width * 0.35;
      bird.y = height / 2;
      gameContainer.addChild(bird);
      gameContainer.setChildIndex(bird, gameContainer.children.length - 1);

      // 管子容器
      const pipes: { top: Graphics; bottom: Graphics; passed: boolean }[] = [];

      // 生成管子
      function spawnPipe() {
        const gapY = Math.random() * (height - PIPE_GAP - 200) + 100;
        const topPipe = new Graphics();
        topPipe.rect(0, 0, 60, gapY - PIPE_GAP / 2).fill(0x988C80);
        topPipe.x = width + 60;
        topPipe.y = 0;

        const bottomPipe = new Graphics();
        bottomPipe.rect(0, 0, 60, height - gapY - PIPE_GAP / 2 - 80).fill(0x988C80);
        bottomPipe.x = width + 60;
        bottomPipe.y = gapY + PIPE_GAP / 2;

        gameContainer.addChild(topPipe);
        gameContainer.addChild(bottomPipe);

        pipes.push({ top: topPipe, bottom: bottomPipe, passed: false });
      }

      // 遊戲控制
      (app.canvas as HTMLCanvasElement).addEventListener("pointerdown", () => {
        if (gameStateRef.current.isDead) {
          handleRestart();
          gameUI.hideGameOver();
          pipes.forEach(pipe => {
            gameContainer.removeChild(pipe.top);
            gameContainer.removeChild(pipe.bottom);
          });
          pipes.length = 0;
          bird.y = height / 2;
          setVelocity(0);
          gameStateRef.current.velocity = 0;
          pipeTimer = window.setInterval(spawnPipe, PIPE_INTERVAL);
          return;
        }
        handleJump(-8);
        createParticleBurst(bird.x, bird.y);
      });

      // 更新函數
      pipeTimer = window.setInterval(spawnPipe, PIPE_INTERVAL);

      const gameLoop = () => {
        if (gameStateRef.current.isDead) return;

        // 更新各個系統
        dayNightCycle.update();
        cloudSystem.update();
        updateParticles();

        // 更新鳥的位置
        gameStateRef.current.velocity += GRAVITY;
        bird.y += gameStateRef.current.velocity;

        // 碰撞檢測
        if (checkBirdGroundCollision(bird, groundY)) {
          bird.y = groundY - 20;
          gameStateRef.current.isDead = true;
          die();
          gameUI.showGameOver();
          clearInterval(pipeTimer);
          return;
        }

        // 更新管子
        pipes.forEach((pipe, index) => {
          pipe.top.x -= PIPE_SPEED;
          pipe.bottom.x -= PIPE_SPEED;

          if (!pipe.passed && pipe.top.x + 60 < bird.x) {
            pipe.passed = true;
            gameStateRef.current.score += 1;
            incrementScore();
            gameUI.updateScore(gameStateRef.current.score);
          }

          if (pipe.top.x + 60 < 0) {
            gameContainer.removeChild(pipe.top);
            gameContainer.removeChild(pipe.bottom);
            pipes.splice(index, 1);
          }

          if (checkBirdPipeCollision(bird, pipe)) {
            gameStateRef.current.isDead = true;
            die();
            gameUI.showGameOver();
            clearInterval(pipeTimer);
          }
        });
      };

      gameLoopRef.current = gameLoop;
      tickerRef.current.add(gameLoop);
    };

    initGame();

    return () => {
      isInitializedRef.current = false;
      cleanup();
    };
  }, []); // 只在組件掛載和卸載時執行

  return (
    <div ref={containerRef} className="relative w-full h-[100dvh] overflow-hidden" />
  );
} 