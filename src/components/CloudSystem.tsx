import { Container, Graphics } from "pixi.js";
import { CLOUD_COUNT, CLOUD_SPEED } from "../constants/gameConfig";

interface CloudSystemProps {
  container: Container;
  width: number;
  height: number;
}

export class CloudSystem {
  private clouds: Container[] = [];
  private width: number;
  private height: number;

  constructor({ container, width, height }: CloudSystemProps) {
    this.width = width;
    this.height = height;
    this.initializeClouds(container);
  }

  private initializeClouds(container: Container) {
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cloud = this.createCloud();
      cloud.x = Math.random() * this.width;
      cloud.y = Math.random() * (this.height / 2);
      container.addChild(cloud);
      this.clouds.push(cloud);
    }
  }

  private createCloud(): Container {
    const cloud = new Container();
    const cloudWidth = Math.random() * 100 + 50;
    const cloudHeight = Math.random() * 50 + 25;
    
    const circles = [
      { x: 0, y: 0, radius: cloudHeight / 2 },
      { x: cloudWidth * 0.2, y: -cloudHeight * 0.1, radius: cloudHeight * 0.45 },
      { x: cloudWidth * 0.4, y: 0, radius: cloudHeight * 0.5 },
      { x: cloudWidth * 0.2, y: cloudHeight * 0.1, radius: cloudHeight * 0.4 },
      { x: cloudWidth * 0.5, y: -cloudHeight * 0.05, radius: cloudHeight * 0.35 },
      { x: cloudWidth * 0.6, y: cloudHeight * 0.05, radius: cloudHeight * 0.3 }
    ];

    circles.forEach(circle => {
      const cloudPart = new Graphics();
      cloudPart.circle(circle.x, circle.y, circle.radius).fill(0xFFFFFF);
      cloud.addChild(cloudPart);
    });

    return cloud;
  }

  public update() {
    this.clouds.forEach(cloud => {
      cloud.x -= CLOUD_SPEED;
      if (cloud.x + cloud.width < 0) {
        cloud.x = this.width;
        cloud.y = Math.random() * (this.height / 2);
      }
    });
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
} 