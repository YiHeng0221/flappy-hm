import { Application } from "pixi.js";
import { DAY_NIGHT_CYCLE, DAY_COLOR, NIGHT_COLOR } from "../constants/gameConfig";
import { interpolateColor } from "../utils/colorUtils";

export class DayNightCycle {
  private app: Application;
  private counter: number = 0;

  constructor(app: Application) {
    this.app = app;
  }

  public update() {
    this.counter = (this.counter + 1) % DAY_NIGHT_CYCLE;
    const dayNightRatio = Math.sin((this.counter / DAY_NIGHT_CYCLE) * Math.PI * 2);
    const currentColor = interpolateColor(DAY_COLOR, NIGHT_COLOR, (dayNightRatio + 1) / 2);
    this.app.renderer.background.color = currentColor;
  }

  public reset() {
    this.counter = 0;
  }
} 