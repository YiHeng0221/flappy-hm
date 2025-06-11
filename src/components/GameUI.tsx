import { Container, Text } from "pixi.js";

interface GameUIProps {
  container: Container;
  width: number;
  height: number;
}

export class GameUI {
  private container: Container;
  private width: number;
  private height: number;
  private scoreText: Text;
  private scoreTextBorder: Text;
  private gameOverText: Text | null = null;
  private gameOverTextBorder: Text | null = null;

  constructor({ container, width, height }: GameUIProps) {
    this.container = container;
    this.width = width;
    this.height = height;

    // 創建分數文字
    this.scoreText = new Text({
      text: "0",
      style: {
        fill: 0x000000,
        fontSize: 48,
        fontFamily: "Arial",
        fontWeight: "bold",
        align: "center",
      },
    });
    this.scoreText.anchor.set(0.5, 0);
    this.scoreText.x = width / 2;
    this.scoreText.y = 20;

    this.scoreTextBorder = new Text({
      text: "0",
      style: {
        fill: 0xffffff,
        fontSize: 48,
        fontFamily: "Arial",
        fontWeight: "bold",
        align: "center",
      },
    });
    this.scoreTextBorder.anchor.set(0.5, 0);
    this.scoreTextBorder.x = width / 2;
    this.scoreTextBorder.y = 20;

    container.addChild(this.scoreText);
    container.addChild(this.scoreTextBorder);
  }

  public updateScore(score: number) {
    this.scoreText.text = String(score);
    this.scoreTextBorder.text = String(score);
  }

  public showGameOver() {
    if (this.gameOverText && this.gameOverTextBorder) return;

    this.gameOverText = new Text({
      text: "Game Over\nTap to Restart",
      style: {
        fill: 0x000000,
        fontSize: 36,
        fontFamily: "Arial",
        fontWeight: "bold",
        align: "center",
      },
    });
    this.gameOverText.anchor.set(0.5);
    this.gameOverText.x = this.width / 2;
    this.gameOverText.y = this.height / 2 - 60;

    this.gameOverTextBorder = new Text({
      text: "Game Over\nTap to Restart",
      style: {
        fill: 0xffffff,
        fontSize: 36,
        fontFamily: "Arial",
        fontWeight: "bold",
        align: "center",
      },
    });
    this.gameOverTextBorder.anchor.set(0.5);
    this.gameOverTextBorder.x = this.width / 2;
    this.gameOverTextBorder.y = this.height / 2 - 60;

    this.container.addChild(this.gameOverText);
    this.container.addChild(this.gameOverTextBorder);
  }

  public hideGameOver() {
    if (this.gameOverText && this.gameOverTextBorder) {
      this.container.removeChild(this.gameOverText);
      this.container.removeChild(this.gameOverTextBorder);
      this.gameOverText = null;
      this.gameOverTextBorder = null;
    }
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.scoreText.x = width / 2;
    this.scoreTextBorder.x = width / 2;

    if (this.gameOverText && this.gameOverTextBorder) {
      this.gameOverText.x = width / 2;
      this.gameOverText.y = height / 2 - 60;
      this.gameOverTextBorder.x = width / 2;
      this.gameOverTextBorder.y = height / 2 - 60;
    }
  }
} 