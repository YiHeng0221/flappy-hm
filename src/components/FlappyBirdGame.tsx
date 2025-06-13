"use client";

import { useEffect, useRef, useCallback } from "react";
import { Application, Graphics, Sprite, Texture, Assets, Container, Ticker } from "pixi.js";
import { GRAVITY, PIPE_INTERVAL, PIPE_SPEED, PIPE_GAP, DAY_COLOR } from "../constants/gameConfig";
import { CloudSystem } from "./CloudSystem";
import { DayNightCycle } from "./DayNightCycle";
import { GameUI } from "./GameUI";
import { useParticleSystem } from "../hooks/useParticleSystem";
import { useGameState } from "../hooks/useGameState";
import { checkBirdPipeCollision, checkBirdGroundCollision } from "../utils/collisionDetection";



// RWD: 畫布高度 = 視窗高度，寬度 = 視窗寬度
export default function FlappyBirdGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const tickerRef = useRef<Ticker | null>(null);
  const gameContainerRef = useRef<Container | null>(null);
  const gameLoopRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const gameUIRef = useRef<GameUI | null>(null);
  const gameStateRef = useRef<{
    score: number;
    isDead: boolean;
    velocity: number;
  }>({
    score: 0,
    isDead: false,
    velocity: 0
  });

  const {
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
    gameStateRef.current.score = 0;
    if (gameUIRef.current) {
      gameUIRef.current.updateScore(0);
    }
  }, [restart]);

  const { createParticleBurst, updateParticles, setParticleContainer } = useParticleSystem(null);

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
      const width = app.renderer.width;
      const height = app.renderer.height;
      const groundY = height - 80;

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
      setParticleContainer(particleContainer);

      // 初始化各個系統
      const cloudSystem = new CloudSystem({ container: backgroundContainer, width, height });
      const dayNightCycle = new DayNightCycle(app);
      const gameUI = new GameUI({ container: uiContainer, width, height });
      gameUIRef.current = gameUI;

      // 地面
      const ground = new Graphics();
      ground.rect(0, 0, width, 80).fill(0x6C1C0C);
      ground.y = groundY;
      gameContainer.addChild(ground);

      // 建立鳥
      await Assets.load('/heromama.png');
      const birdTexture = Texture.from('/heromama.png');
      const bird = new Sprite(birdTexture);
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
        const bottomPipe = new Graphics();

        // 繪製管子主體
        topPipe.rect(0, 0, 60, gapY - PIPE_GAP / 2).fill(0x988C80);
        bottomPipe.rect(0, 0, 60, height - gapY - PIPE_GAP / 2 - 80).fill(0x988C80);

        // 添加窗戶
        const windowSize = 12;
        const windowSpacing = 20;
        const windowRows = Math.floor((gapY - PIPE_GAP / 2) / windowSpacing);
        const windowCols = 2;

        // 在頂部管子添加窗戶
        for (let row = 0; row < windowRows; row++) {
          for (let col = 0; col < windowCols; col++) {
            const windowX = 10 + col * 20;
            const windowY = 10 + row * windowSpacing;
            topPipe.rect(windowX, windowY, windowSize, windowSize).fill(0xFFFF00);
          }
        }

        // 在底部管子添加窗戶
        const bottomWindowRows = Math.floor((height - gapY - PIPE_GAP / 2 - 80) / windowSpacing);
        for (let row = 0; row < bottomWindowRows; row++) {
          for (let col = 0; col < windowCols; col++) {
            const windowX = 10 + col * 20;
            const windowY = 10 + row * windowSpacing;
            bottomPipe.rect(windowX, windowY, windowSize, windowSize).fill(0xFFFF00);
          }
        }

        topPipe.x = width + 60;
        topPipe.y = 0;
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
  }, [die, handleJump, handleRestart, incrementScore, setVelocity, createParticleBurst, updateParticles, setParticleContainer]);

  return (
    <div ref={containerRef} className="relative w-full h-[100dvh] overflow-hidden" />
  );
} 