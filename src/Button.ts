import { Graphics } from "@pixi/graphics";
import { Text, TextStyle } from "@pixi/text";
import { InteractionEvent } from "@pixi/interaction";

export default class Button {
  private BUTTON_STYLE: TextStyle;
  private TEXT_INSTANCE: Text;
  private BUTTON_FRAME: Graphics;
  private MIN_BUTTON_SIZE = 250;
  private BUTTON_CALLBACK: (event: InteractionEvent) => void = () =>
    console.log("Test");
  public constructor(startText?: string) {
    this.BUTTON_STYLE = new TextStyle({
      align: "center",
      fontFamily: "sans-serif",
      fontSize: 50,
      fill: ["#ffffff"],
    });
    this.TEXT_INSTANCE = new Text(startText || "DUMMY", this.BUTTON_STYLE);
    this.BUTTON_FRAME = new Graphics();
    this.BUTTON_FRAME.lineStyle(3, 0xffffff, 1)
      .beginFill(0xffffff, 0.5)
      .drawRect(
        0,
        0,
        this.TEXT_INSTANCE.width >= this.MIN_BUTTON_SIZE
          ? this.TEXT_INSTANCE.width + 10
          : this.MIN_BUTTON_SIZE,
        60
      )
      .endFill()
      .addChild(this.TEXT_INSTANCE);
    this.BUTTON_FRAME.interactive = true;
    this.BUTTON_FRAME.buttonMode = true;
    this.BUTTON_FRAME.on("pointerdown", this.BUTTON_CALLBACK);
    this.BUTTON_FRAME.on("pointerover", () => {
      this.BUTTON_FRAME.geometry.clear();
      this.BUTTON_FRAME.lineStyle(3, 0xffffff, 1)
        .beginFill(0xff0000, 0.4)
        .drawRect(
          0,
          0,
          this.TEXT_INSTANCE.width >= this.MIN_BUTTON_SIZE
            ? this.TEXT_INSTANCE.width + 10
            : this.MIN_BUTTON_SIZE,
          60
        )
        .endFill();
    });
    this.BUTTON_FRAME.on("pointerout", () => {
      this.BUTTON_FRAME.geometry.clear();
      this.BUTTON_FRAME.lineStyle(3, 0xffffff, 1)
        .beginFill(0xffffff, 0.4)
        .drawRect(
          0,
          0,
          this.TEXT_INSTANCE.width >= this.MIN_BUTTON_SIZE
            ? this.TEXT_INSTANCE.width + 10
            : this.MIN_BUTTON_SIZE,
          60
        )
        .endFill();
    });
    const textWidth = this.TEXT_INSTANCE.width;
    const textHeigt = this.TEXT_INSTANCE.height;
    this.TEXT_INSTANCE.x = this.BUTTON_FRAME.width / 2 - textWidth / 2;
    this.TEXT_INSTANCE.y = this.BUTTON_FRAME.height / 2 - textHeigt / 2;
  }

  public getButton(): Graphics {
    return this.BUTTON_FRAME;
  }

  public setCallbackOnPress(callback: (event: InteractionEvent) => void) {
    this.BUTTON_FRAME.removeAllListeners("pointerdown");
    this.BUTTON_CALLBACK = callback;
    this.BUTTON_FRAME.on("pointerdown", this.BUTTON_CALLBACK);
  }

  destroy() {
    this.TEXT_INSTANCE.destroy();
    this.BUTTON_FRAME.destroy();
  }
}
