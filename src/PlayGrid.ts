import { Graphics } from "@pixi/graphics";
import { Container } from "@pixi/display";
import { Point } from "pixi.js";
import { InteractionEvent } from "@pixi/interaction";

type DefaultsValues =
  | "GRID_COLUMNS"
  | "GRID_ROWS"
  | "GRID_GAP"
  | "GRID_MARBLE_SIZE";

const DEFAULTS_VALUES: Record<DefaultsValues, number> = {
  GRID_COLUMNS: 6,
  GRID_ROWS: 6,
  GRID_GAP: 5,
  GRID_MARBLE_SIZE: 50,
};

type SingleMarble = {
  color: number;
  x: number;
  y: number;
  marked: boolean;
};

export default class PlayGrid {
  private container: Container;
  private mask: Graphics;
  private marbles: Graphics;

  private GRID_COLUMNS: number;
  private GRID_ROWS: number;
  private GRID_GAP: number;
  private GRID_MARBLE_SIZE: number;
  private GRID_WIDTH: number;
  private GRID_HEIGHT: number;
  private GRID_STEP_SIZE: number;
  private static DROP_SPEED = 10;
  private static MIN_STRICK_SIZE = 3;

  private static ON_SCORE_UPDATE: (score: number) => void = (score) =>
    console.log("Current score: ", score);

  private cursorPosition?: Point;

  private static availableColors: Array<number> = [
    0xffff00, 0x0000ff, 0x00ff00, 0xff0000, 0x990099,
  ];

  private marbleArray: Array<SingleMarble | undefined> = [];

  private isSync: boolean = false;
  private deletingMarbles: boolean = false;
  private score: number = 0;

  private isInitialyze: boolean = false;

  private currentColor?: SingleMarble;
  private marbleStrick: Array<SingleMarble> = [];

  private static PlayGridInstance: PlayGrid | undefined;

  private constructor(
    columns: number,
    rows: number,
    marbleSize: number,
    marblesGap: number
  ) {
    this.GRID_COLUMNS = columns;
    this.GRID_ROWS = rows;
    this.GRID_GAP = marblesGap;
    this.GRID_MARBLE_SIZE = marbleSize;

    this.GRID_WIDTH = (marblesGap * 2 + marbleSize) * columns;
    this.GRID_HEIGHT = (marblesGap * 2 + marbleSize) * rows;

    this.container = new Container();
    this.container.y = 150;
    this.marbles = new Graphics();
    this.mask = new Graphics();
    this.container.mask = this.mask;
    // Дрючить в сраку, того засранця, який зобов'язує шоб маска була непрозора
    // Я пів дня убив на те шоб зрозуміти чого не проацюють натиснення на об'єкти
    this.mask.beginFill(0xffffff, 1);
    this.mask.drawRect(0, 0, this.GRID_WIDTH, this.GRID_HEIGHT);
    // this.mask.endFill();

    this.GRID_STEP_SIZE = this.GRID_MARBLE_SIZE + 2 * this.GRID_GAP;

    for (let i = 0; i < this.GRID_COLUMNS * this.GRID_ROWS; ++i) {
      this.marbleArray.push(this.getRandomMarble(i));
    }

    this.marbles.interactive = false;
    this.container.interactive = true;

    this.marbles.on("pointerdown", (event: InteractionEvent) => {
      this.isSync = false;
      const eventCoordinates: Point = this.getLocalCoordinates(
        event.data.global
      );
      const index = this.getIndexFromCoordinates(eventCoordinates);
      if (!this.marbleStrick.length) {
        this.container.on("pointermove", this.setCursorPosition.bind(this));
      } 
      const marble = this.marbleArray[index];
      this.setCurrentColor(marble);
    });

    this.container.on("pointerup", () => {
      this.removeMarbles();
      this.container.removeAllListeners("pointermove");
      this.setCurrentColor(undefined);
      return;
    });

    this.marbles.on("pointermove", (event: InteractionEvent) => {
      console.log(event);
      if (!this.currentColor) {
        return;
      }
      const localCoordinates = this.getLocalCoordinates(event.data.global);
      const index = this.getIndexFromCoordinates(localCoordinates);
      const marble = this.marbleArray[index];
      if (!marble) {
        return;
      }
      const { x, y } = this.getTwoDimentionalIndex(index);
      const { x: currentX, y: currentY } = this.getTwoDimentionalIndex(
        this.marbleArray.indexOf(this.currentColor)
      );
      const onSameAxis = x === currentX || y === currentY;
      if (marble.color === this.currentColor.color && onSameAxis) {
        this.setCurrentColor(marble);
      }
    });

    this.container.addChild(this.mask);
    this.container.addChild(this.marbles);
  }

  private setCurrentColor(marble: SingleMarble | undefined) {
    if (!marble) {
      this.currentColor = undefined;
      return;
    }
    if (this.currentColor && !this.marbleStrick.includes(marble)) {
      this.marbleStrick.push(marble);
    }
    if (!this.marbleStrick.length) {
      this.marbleStrick.push(marble);
    }
    this.currentColor = marble;
    marble.marked = true;
  }

  private getIndexFromCoordinates(coordinates: Point): number {
    const x: number = Math.ceil(coordinates.x / this.GRID_STEP_SIZE) - 1;
    const y: number = Math.ceil(coordinates.y / this.GRID_STEP_SIZE) - 1;
    return y * this.GRID_COLUMNS + x;
  }

  private getLocalCoordinates(input: Point): Point {
    const containerPosition: Point = new Point(
      this.container.position.x,
      this.container.position.y
    );
    return input.subtract(containerPosition);
  }

  private getOneDimentionalIndex(x: number, y: number): number {
    return y * this.GRID_COLUMNS + x;
  }

  private getTwoDimentionalIndex(index: number): { x: number; y: number } {
    return {
      x: index % this.GRID_COLUMNS,
      y: Math.floor(index / this.GRID_COLUMNS),
    };
  }

  private getRandomMarble(index: number): SingleMarble {
    const color: number =
      PlayGrid.availableColors[
        Math.floor(Math.random() * PlayGrid.availableColors.length)
      ];
    const x: number =
      (index % this.GRID_COLUMNS) * this.GRID_STEP_SIZE +
      (this.GRID_GAP + this.GRID_MARBLE_SIZE / 2);
    const y: number = -this.GRID_MARBLE_SIZE;
    return { color, x, y, marked: false };
  }

  public static setHookOnScoreChange(hook: (score: number) => void): void {
    PlayGrid.ON_SCORE_UPDATE = hook;
  }

  public static initPlayGrid(
    columns: number,
    rows: number,
    marbleSize: number,
    marblesGap: number
  ): PlayGrid {
    PlayGrid.PlayGridInstance = new PlayGrid(
      columns,
      rows,
      marbleSize,
      marblesGap
    );
    return PlayGrid.PlayGridInstance;
  }

  public static setDropSpeed(timePerTick: number) {
    PlayGrid.DROP_SPEED = timePerTick;
  }

  public static setMinStrick(strick: number) {
    PlayGrid.MIN_STRICK_SIZE = strick;
  }

  public static setColors(colors: Array<number>) {
    if (colors.includes(0)) {
      throw new Error("Array includes EMPTY value!");
    }
    PlayGrid.availableColors = colors;
  }

  public static getGridInstance(): PlayGrid {
    if (!PlayGrid.PlayGridInstance) {
      console.error("PlayGridInstance not initialize, set defaults");
      PlayGrid.PlayGridInstance = new PlayGrid(
        DEFAULTS_VALUES.GRID_COLUMNS,
        DEFAULTS_VALUES.GRID_ROWS,
        DEFAULTS_VALUES.GRID_MARBLE_SIZE,
        DEFAULTS_VALUES.GRID_GAP
      );
    }
    return PlayGrid.PlayGridInstance;
  }

  public getGraphics(): Container {
    return PlayGrid.PlayGridInstance?.container as Container;
  }

  private setCursorPosition(event: InteractionEvent) {
    const mousePosition = this.getLocalCoordinates(event.data.global);
    if (
      this.cursorPosition?.x === mousePosition.x &&
      this.cursorPosition?.y === mousePosition.y
    ) {
      return;
    }
    this.isSync = false;
    this.cursorPosition = mousePosition;
  }

  private drawMarble(marble: SingleMarble) {
    if (marble.marked) {
      this.marbles.lineStyle(3, 0xffffff, 1);
    }
    this.marbles.beginFill(marble.color, 1);
    this.marbles.drawCircle(marble.x, marble.y, this.GRID_MARBLE_SIZE / 2);
    this.marbles.endFill();
    this.marbles.lineStyle(0);
  }

  private animateMarbles(): boolean {
    let isFinished = true;
    for (let i = this.marbleArray.length - 1; i >= 0; --i) {
      const marble = this.marbleArray[i];
      if (!marble) {
        continue;
      }
      const { x, y } = this.getTwoDimentionalIndex(i);
      if (y < this.GRID_COLUMNS - 1) {
        const prevMarble =
          this.marbleArray[
            this.getOneDimentionalIndex(
              x,
              y === this.GRID_COLUMNS - 1 ? y : y + 1
            )
          ];
        if (!prevMarble && !this.deletingMarbles) {
          throw new Error("Doesnt find previous marble!");
        }
        const dropCurent =
          marble.y > this.GRID_MARBLE_SIZE / 2 ||
          (prevMarble && prevMarble.y > this.GRID_MARBLE_SIZE / 2);
        if (this.isInitialyze && !dropCurent) {
          continue;
        }
      }
      const endY: number =
        Math.floor(i / this.GRID_COLUMNS) * this.GRID_STEP_SIZE +
        (this.GRID_GAP + this.GRID_MARBLE_SIZE / 2);
      const endX: number =
        (i % this.GRID_COLUMNS) * this.GRID_STEP_SIZE +
        (this.GRID_GAP + this.GRID_MARBLE_SIZE / 2);
      if (Math.abs(marble.y - endY) < PlayGrid.DROP_SPEED) {
        marble.y = endY;
      } else {
        marble.y +=
          marble.y > endY ? -PlayGrid.DROP_SPEED : PlayGrid.DROP_SPEED;
      }
      if (Math.abs(marble.x - endX) < PlayGrid.DROP_SPEED) {
        marble.x = endX;
      } else {
        marble.x +=
          marble.x > endX ? -PlayGrid.DROP_SPEED : PlayGrid.DROP_SPEED;
      }

      const marbleNotVisible =
        marble.y < this.GRID_MARBLE_SIZE / 2 + this.GRID_GAP;
      isFinished = isFinished && marble.y === endY;

      this.drawMarble(marble);

      if (this.isInitialyze) {
        continue;
      }

      if (marbleNotVisible) {
        return false;
      }
    }
    return isFinished;
  }

  private removeMarbles() {
    this.isSync = false;
    this.cursorPosition = undefined;
    const score = this.marbleStrick.length;
    if (score < PlayGrid.MIN_STRICK_SIZE) {
      this.marbleStrick.forEach((marble) => (marble.marked = false));
      this.marbleStrick = [];
      return;
    }
    this.marbles.interactive = false;
    this.deletingMarbles = true;
    const interval = setInterval(() => {
      this.isSync = false;
      if (!this.marbleStrick.length) {
        this.marbles.interactive = true;
        this.deletingMarbles = false;
        clearInterval(interval);
        return;
      }
      const marble = this.marbleStrick.pop() as SingleMarble;
      marble.marked = false;
      const index = this.marbleArray.indexOf(marble);
      this.marbleArray[index] = undefined;
      this.score++;
      PlayGrid.ON_SCORE_UPDATE(this.score);
    }, 1000);
  }

  private updateMarbleArray() {
    let unChanged = true;
    for (let i = this.marbleArray.length - 1; i >= 0; --i) {
      const marble = this.marbleArray[i];
      if (marble) {
        continue;
      }
      unChanged = false;
      let numberOfEmptyCells = 1;
      const { x, y } = this.getTwoDimentionalIndex(i);
      let emptyIndex = i;
      for (let j = y - 1; j >= 0; --j) {
        const index = this.getOneDimentionalIndex(x, j);
        const swapMarble = this.marbleArray[index];
        if (swapMarble) {
          this.marbleArray[emptyIndex] = swapMarble;
          this.marbleArray[index] = undefined;
          let { x, y } = this.getTwoDimentionalIndex(emptyIndex);
          emptyIndex = this.getOneDimentionalIndex(x, y - 1);
        } else {
          numberOfEmptyCells++;
        }
      }
      for (let j = 0; j < numberOfEmptyCells; ++j) {
        const index = this.getOneDimentionalIndex(x, j);
        this.marbleArray[index] = this.getRandomMarble(index);
      }
    }
    this.isSync = unChanged;
  }

  private drawConnections() {
    this.marbles.lineStyle(Math.floor(this.GRID_MARBLE_SIZE / 5), 0xffffff, 1);
    this.marbles.moveTo(this.marbleStrick[0].x, this.marbleStrick[0].y);
    for (const marble of this.marbleStrick) {
      const x = marble.x;
      const y = marble.y;
      this.marbles.beginFill();
      this.marbles.lineTo(x, y);
      this.marbles.endFill();
      this.marbles.moveTo(marble.x, marble.y);
    }
    if (this.cursorPosition && !this.deletingMarbles) {
      this.marbles.lineTo(this.cursorPosition.x, this.cursorPosition.y);
    }
    this.marbles.lineStyle(0, 0xffffff, 1);
  }

  public update() {
    if (this.isSync) {
      return;
    }
    if (!this.isInitialyze) {
      this.marbles.clear();
      const animationIsFinished = this.animateMarbles();
      this.marbles.interactive = animationIsFinished;
      this.isInitialyze = animationIsFinished;
      this.isSync = animationIsFinished;
      return;
    }
    if (!this.deletingMarbles) {
      this.updateMarbleArray();
    }
    this.marbles.geometry.clear();
    if (this.marbleStrick.length) {
      this.drawConnections();
    }
    this.isSync = this.animateMarbles();
  }
}
