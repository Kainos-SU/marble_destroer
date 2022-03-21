import "./style.css";

import { Application, Renderer } from "pixi.js";
import { InteractionManager } from "@pixi/interaction";
import { Text, TextStyle } from "@pixi/text";
import "@pixi/math-extras";
import Button from "./Button";

import PlayGrid from "./PlayGrid";

const titleStyle = new TextStyle({
  align: "center",
  fontFamily: "sans-serif",
  fontSize: 45,
  fill: ["#FFFFFF"],
});

const scoreStyle = new TextStyle({
  align: "left",
  fontFamily: "sans-serif",
  fontSize: 40,
  fill: ["#FFFFFF"],
});

Renderer.registerPlugin("interaction", InteractionManager);

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const GRID_HEIGHT = 6;
const GRID_WIDTH = 6;
const GRID_GAP = 5;

const GRID_MARBLE_SIZE = Math.floor(
  (WIDTH > HEIGHT
    ? HEIGHT / GRID_WIDTH - 2 * GRID_GAP
    : WIDTH / GRID_WIDTH - 2 * GRID_GAP) / 2
);

const button = new Button("Start Game");

const score = new Text("Score: 0", scoreStyle);
score.y = 15;
score.x = WIDTH - 200;

const title = new Text("Marble Destroer!", titleStyle);

title.x = WIDTH / 2 - title.width / 2;
title.y = HEIGHT / 4 - title.height / 2;

const app = new Application({
  width: WIDTH,
  height: HEIGHT,
});
app.stage.interactive = true;
button.getButton().x = WIDTH / 2 - button.getButton().width / 2;
button.getButton().y = HEIGHT / 2 - button.getButton().height / 2;

app.stage.addChild(button.getButton());
app.stage.addChild(title);

PlayGrid.initPlayGrid(GRID_WIDTH, GRID_HEIGHT, GRID_MARBLE_SIZE, GRID_GAP);

PlayGrid.setHookOnScoreChange(
  (gameScore) => (score.text = `Score: ${gameScore}`)
);

button.setCallbackOnPress(() => {
  app.stage.addChild(score);
  app.stage.addChild(PlayGrid.getGridInstance().getGraphics());
  const gridInstance = PlayGrid.getGridInstance().getGraphics();

  gridInstance.x =
    WIDTH / 2 - (GRID_WIDTH * (GRID_MARBLE_SIZE + GRID_GAP * 2)) / 2;
  PlayGrid.getGridInstance().getGraphics().y = HEIGHT / 3;
  button.destroy();
  title.destroy();
  app.ticker.add(() => {
    PlayGrid.getGridInstance().update();
  });
});

const container = document.querySelector<HTMLDivElement>("#app")!;

container.append(app.view);
