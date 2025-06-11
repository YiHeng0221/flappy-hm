import { Container, Sprite, Texture } from "pixi.js";
import { PARTICLE_LIFETIME } from "../constants/gameConfig";
import { useRef, useCallback } from "react";

interface Particle {
  sprite: Sprite;
  vx: number;
  vy: number;
  life: number;
}

export function useParticleSystem(initialContainer: Container | null) {
  const containerRef = useRef<Container | null>(initialContainer);
  const particlesRef = useRef<Particle[]>([]);

  const setParticleContainer = useCallback((newContainer: Container | null) => {
    containerRef.current = newContainer;
  }, []);

  const createParticle = useCallback((x: number, y: number) => {
    if (!containerRef.current) return;
    const particle = new Sprite(Texture.WHITE);
    particle.tint = 0xFFFFFF;
    particle.alpha = 0.8;
    particle.width = 4;
    particle.height = 4;
    particle.x = x;
    particle.y = y;
    containerRef.current.addChild(particle);

    particlesRef.current.push({
      sprite: particle,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 2,
      life: PARTICLE_LIFETIME
    });
  }, []);

  const updateParticles = useCallback(() => {
    if (!containerRef.current) return;
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const particle = particlesRef.current[i];
      particle.sprite.x += particle.vx;
      particle.sprite.y += particle.vy;
      particle.life--;
      particle.sprite.alpha = particle.life / PARTICLE_LIFETIME;

      if (particle.life <= 0) {
        containerRef.current.removeChild(particle.sprite);
        particlesRef.current.splice(i, 1);
      }
    }
  }, []);

  const createParticleBurst = useCallback((x: number, y: number, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      createParticle(x, y);
    }
  }, [createParticle]);

  return {
    createParticle,
    createParticleBurst,
    updateParticles,
    setParticleContainer
  };
} 