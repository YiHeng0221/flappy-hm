import { Container, Sprite, Texture } from "pixi.js";
import { PARTICLE_LIFETIME } from "../constants/gameConfig";

interface Particle {
  sprite: Sprite;
  vx: number;
  vy: number;
  life: number;
}

export function useParticleSystem(container: Container) {
  const particles: Particle[] = [];

  const createParticle = (x: number, y: number) => {
    const particle = new Sprite(Texture.WHITE);
    particle.tint = 0xFFFFFF;
    particle.alpha = 0.8;
    particle.width = 4;
    particle.height = 4;
    particle.x = x;
    particle.y = y;
    container.addChild(particle);

    particles.push({
      sprite: particle,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 2,
      life: PARTICLE_LIFETIME
    });
  };

  const updateParticles = () => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.sprite.x += particle.vx;
      particle.sprite.y += particle.vy;
      particle.life--;
      particle.sprite.alpha = particle.life / PARTICLE_LIFETIME;

      if (particle.life <= 0) {
        container.removeChild(particle.sprite);
        particles.splice(i, 1);
      }
    }
  };

  const createParticleBurst = (x: number, y: number, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      createParticle(x, y);
    }
  };

  return {
    createParticle,
    createParticleBurst,
    updateParticles
  };
} 