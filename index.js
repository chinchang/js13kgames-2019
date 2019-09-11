import { Particle } from "./particle.js";
import { Bomb } from "./bomb.js";
import { W, H, setStyle, random, createElement } from "./utils.js";
import { playSound, playWinSound } from "./sfx.js";

const DEBUG = true;
let cellSize = parseInt(
  window.getComputedStyle(document.documentElement).getPropertyValue("--unit")
);
let grid = [];
let input = [];
let n = 6;
const levels = {
  0: { n: 3, mines: 2 },
  1: { n: 6, mines: 8 },
  2: { n: 12, mines: 20 }
};
const screens = [...document.querySelectorAll(".screen")];
const GAME_STATES = {
  NOT_STARTED: "notStarted",
  STARTED: "started",
  ENDED: "ended"
};
let gameState = GAME_STATES.NOT_STARTED;
let currentScreen = "menu";
let startTime;
let entities = [];
let currentLevel;
const HIGHSCORE_KEY = "bms-high-score";
const LAST_SCORE_KEY = "bms-last-score";
let highScore = (window.localStorage.getItem(HIGHSCORE_KEY) &&
  JSON.parse(window.localStorage.getItem(HIGHSCORE_KEY))) || {
  0: 0,
  1: 0
};
let lastGameScore;
console.log(highScore);
const sounds = {
  laser: [
    0,
    0,
    0.20186369123006712,
    0.08864788869394417,
    0.3533138312310672,
    0.730741378990208,
    0.2,
    -0.18340614838729788,
    0,
    0,
    0,
    0,
    0,
    0.13312363811900763,
    0.13711016008646912,
    0,
    0,
    0,
    1,
    0,
    0,
    0.1086867241891986,
    0,
    0.5
  ]
};

function updateScoreUi(score) {
  easyHighScoreEl.textContent = highScore[0] ? `${highScore[0]}s` : "-";
  hardHighScoreEl.textContent = highScore[1] ? `${highScore[1]}s` : "-";
}
function changeScreen(name) {
  screens.forEach(screen => screen.classList.remove("visible"));
  document.querySelector(`[data-screen="${name}"]`).classList.add("visible");
  currentScreen = name;

  // cleanup
  hideMessage();

  window.removeEventListener("keyup", gameStartTriggerHandler);
  window.removeEventListener("click", gameStartTriggerHandler);

  if (name !== "game") {
    grid = [];
    input = [];
    timeEl.textContent = "0 seconds";
    document.body.classList.remove(
      "bomb-place-anim-1",
      "bomb-place-anim-2",
      "bomb-place-anim-3",
      "game-started"
    );

    Array.from(tileContainer.children).map(i => i.remove());
    gameState = GAME_STATES.NOT_STARTED;
  }
}

function logField(arr) {
  console.log("Field:");
  for (let y = 0; y < n; y++) {
    console.log(arr[y]);
    console.log("---");
  }
}

function makeTile({ isHole, isFake, isDummy }) {
  // const isHole = hole || Math.random() > 0.7;
  const t = createElement(
    isFake || isHole || isDummy ? "div" : "button",
    "tile"
  );
  if (isHole) {
    t.classList.add("hole");
    t.tileType = "hole";
  }
  if (t.tagName === "BUTTON") {
    t.setAttribute("type", "button");
  }
  return t;
}

function gen(level, container = window.tileContainer, isDummy) {
  n = levels[level].n;
  const numMines = levels[level].mines;
  cellSize = ~~((Math.min(W, H) * 0.8) / n);
  document.documentElement.style.setProperty("--unit", `${cellSize}px`);
  setStyle(container, {
    // left: `${cellSize * n * 0.15}px`,
    width: `${cellSize * n}px`,
    height: `${cellSize * n}px`
  });
  let minesPos = [];
  while (minesPos.length < numMines) {
    let cellIndex = random(0, n * n);
    if (!minesPos.includes(cellIndex)) {
      minesPos.push(cellIndex);
    }
  }
  minesPos = minesPos.map(pos => {
    return { y: ~~(pos / n), x: pos % n };
  });

  Array.from(container.children).map(i => i.remove());
  grid = [];
  for (var i = 0; i < n; i++) {
    grid[i] = [];
    input[i] = [];
    for (var j = 0; j < n; j++) {
      grid[i][j] = 0;
      input[i][j] = 0;
    }
  }
  for (var j = 0; j < n + 1; j++)
    for (var i = 0; i < n; i++) {
      const t = makeTile({
        isHole: minesPos.some(pos => pos.x === i && pos.y === j),
        isFake: j === n,
        isDummy
      });
      t.style.top = `${j * cellSize}px`;
      t.style.left = `${i * cellSize}px`;
      t.count = 0;
      t.posX = i;
      t.posY = j;
      if (!t.className.match(/(hole|cover)/)) {
        setTileLabel(t, j + 1, i + 1, 0);
      }
      if (t.className.match(/hole/)) {
        setTileLabel(t, j + 1, i + 1, "Bomb");
        t.setAttribute("tabindex", 0);
      }
      const offset = -10;
      setStyle(t, {
        transform: `translate(${offset}px, -${offset}px)`,
        transitionDelay: `${(j * n + i) * 0.02}s`, //`${Math.random() * 0.5}s`,
        transitionTimingFunction: "0.25s cubic-bezier(0, 0.6, 0.6, 1.34)",
        opacity: 0
      });
      t.style.setProperty("--blast-delay", `${Math.random() * 0.3}s`),
        setTimeout(() => {
          setStyle(t, { transform: `translate(0px, 0px)`, opacity: 1 });
        }, 1);
      setTimeout(() => {
        setStyle(t, {
          transitionTimingFunction: null,
          transitionDelay: null,
          transitionDuration: null
        });
      }, 2000);
      if (j === n) {
        t.setAttribute("class", "tile cover");
      } else {
        if (t.tileType === "hole") {
          grid[i][j] = -1;
          // iterate around the current cell (i,j)
          for (let x = -1; x <= 1; x++)
            for (let y = -1; y <= 1; y++) {
              if (
                (x === 0 && y === 0) ||
                i + x < 0 ||
                j + y < 0 ||
                i + x > n - 1 ||
                j + y > n - 1 ||
                grid[i + x][j + y] === -1
              )
                continue;
              grid[i + x][j + y] = grid[i + x][j + y] + 1;
            }
        }
      }
      container.append(t);
    }
}

function checkWin() {
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n + 1; j++) {
      if (grid[i][j] === -1) continue;

      if (grid[i][j] !== input[i][j]) {
        return false;
      }
    }
  }
  return true;
}
function addClassLater(el, claz, delay) {
  setTimeout();
}
function wait(duration) {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}

async function showMessage(msg) {
  const el = createElement("div", "message");
  el.setAttribute("role", "alert");
  document.body.append(el);
  el.innerHTML = `<div class="message__text">${msg}</div>`;

  await wait(10);
  document.body.classList.add("message-anim-1");
  await wait(430);
  document.body.classList.add("message-anim-2");
  playSound("powerup");
}
async function hideMessage() {
  document.body.classList.remove("message-anim-2");
  if (document.querySelector(".message")) {
    document.querySelector(".message").remove();
  }
  document.body.classList.remove("message-anim-1");
}
function setupGame(e, level) {
  async function rotateCamera() {
    const el = document.querySelector('[data-screen="game"]');
    el.style.transition = "none";
    el.style.perspectiveOrigin = `1170px ${H / 2}px`;
    await wait(10);
    el.style.transition = null;
    el.style.perspectiveOrigin = `${W / 2}px ${H / 2}px`;
  }
  if (e) {
    level = parseInt(e.currentTarget.dataset.level, 10);
    e.stopPropagation();
  }
  currentLevel = level;
  gen(level);
  rotateCamera();
  changeScreen("game");

  showMessage("Click/Tap anywhere or press any key to start").then(() => {
    window.addEventListener("keyup", gameStartTriggerHandler, { once: true });
    window.addEventListener("click", gameStartTriggerHandler, { once: true });
  });
}

function gameStartTriggerHandler() {
  if (gameState === GAME_STATES.NOT_STARTED) {
    startGame();
  }
}

async function startGame() {
  hideMessage();
  const bombs = Array.from(document.querySelectorAll(".tile.hole"));

  document.body.classList.add("bomb-place-anim-1");

  bombs.forEach(bomb => {
    setTimeout(() => {
      playSound("laser");
    }, random(0, 600));
  });

  await wait(500);

  document.body.classList.add("bomb-place-anim-2");
  shake({ time: 0.5 });
  bombs.forEach(bomb => {
    const bound = bomb.getBoundingClientRect();
    for (let i = random(5, 8); i--; ) {
      entities.push(
        new Particle({
          height: random(5, 15),
          width: random(5, 15),
          x: random(bound.left, bound.left + bound.width),
          y: random(bound.top, bound.top + bound.height),
          vx: random(-10, 10),
          vy: -random(20, 55),
          isConfetti: true,
          gravity: 0.2,
          friction: 0.88,
          alphaSpeed: -0.025,
          scale: 0.3 + Math.random(0, 1),
          angularSpeed: { x: random(-5, 5), y: 0, z: 0 },
          color: "#f00",
          timeToDie: 0.7
        })
      );
    }

    setTimeout(() => {
      playSound("explosion");
    }, random(0, 500));
  });

  await wait(500);

  document.body.classList.add("bomb-place-anim-3");
  document.body.classList.add("game-started");
  gameState = GAME_STATES.STARTED;
  startTime = Date.now();
}
function setTileLabel(el, row, col, value) {
  el.setAttribute("aria-label", `Row ${row}, Column ${col}, Value ${value}`);
}
function setTileValue(el, value, diff = 1) {
  input[el.posX][el.posY] =
    value !== undefined ? value : input[el.posX][el.posY] + diff;
  input[el.posX][el.posY] %= 9;
  if (input[el.posX][el.posY] < 0) {
    input[el.posX][el.posY] = 8;
  }
  el.textContent = [1, 2, 3, 4, 5, 6, 7, 8][input[el.posX][el.posY] - 1];
  setTileLabel(el, el.posY + 1, el.posX + 1, input[el.posX][el.posY]);

  // shake tile
  shake({ time: 0.3, el, shakeIntensity: 5 });

  playSound("hit");

  // blast on tile
  const bound = el.getBoundingClientRect();
  for (let i = random(5, 15); i--; ) {
    entities.push(
      new Particle({
        height: 20,
        width: 20,
        x: random(bound.left, bound.left + bound.width),
        y: random(bound.top, bound.top + bound.height),
        vx: random(-10, 10),
        vy: -random(20, 55),
        isConfetti: true,
        gravity: 0.2,
        friction: 0.88,
        alphaSpeed: -0.025,
        scale: 0.3 + Math.random(0, 1),
        angularSpeed: { x: random(-5, 5), y: 0, z: random(-20, 25) },
        color: "#5d6f41",
        timeToDie: 0.4
      })
    );
  }

  if (checkWin()) {
    const time = (Date.now() - startTime) / 1000;
    gameState = GAME_STATES.ENDED;
    setTimeout(async () => {
      await showMessage(
        `<p>You completed the level in <strong>${time} seconds!</strong></p>
        <p>
          <button class="btn" onclick="window.changeScreen('menu')">👈🏽 Back to menu</button>
          <button class="btn" onclick="window.tweetScore(${lastGameScore}, ${currentLevel})">🐦 Tweet your score!</button>
        </p>`
      );
      document.querySelector(".message button").focus();
    }, 10);

    winBlast();
    playWinSound();
    saveScores(time);
  }
}
function tileClickHandler(e) {
  if (gameState !== GAME_STATES.STARTED) return;
  const el = e.target;
  if (el.className.match(/tile/) && el.tagName === "BUTTON") {
    setTileValue(el, undefined, e.button === 0 ? 1 : -1);
  }
}
window.oncontextmenu = e => {
  if (e.target.className.match(/tile/)) {
    tileClickHandler(e);
    return false; // cancel default menu
  }
};

function blast({ n = 20, minX = 0, maxX = W, minY = 0, maxY = H, ...props }) {
  for (let i = n; i--; ) {
    entities.push(
      new Particle({
        x: minX === maxX ? minX : random(minX, maxX),
        y: minY === maxY ? minY : random(minY, maxY),
        vy: -random(40, 60),
        vx: random(-40, 40),
        isConfetti: true,
        gravity: 0.5,
        friction: 0.88,
        color: `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)} )`,
        ...props
      })
    );
  }
}

async function winBlast() {
  blast({
    n: 30,
    minX: W / 4 - 50,
    maxX: W / 4 + 50,
    minY: 100,
    maxY: H - 100
  });
  playSound("winExplosion");
  await wait(500);
  blast({
    n: 30,
    minX: (W * 3) / 4 - 50,
    maxX: (W * 3) / 4 + 50,
    minY: 100,
    maxY: H - 100
  });
  playSound("winExplosion");

  await wait(1500);
  playSound("winExplosion");

  blast({
    n: 20,
    minX: W / 2 - 200,
    maxX: W / 2 + 200,
    minY: 100,
    maxY: H - 100
  });
}
window.onclick = e => {
  // winBlast();
  if (!grid.length) {
    return;
  }
  if (currentScreen === "game") {
    if (gameState === GAME_STATES.STARTED) {
      tileClickHandler(e);
    }
  }
};

function navigate(el, dir) {
  function getVerticalEl(el, x, y) {
    return el.parentElement.children[y * n + x];
  }

  if (dir === "right" || dir === "left") {
    let nextEl = el;
    const fnName =
      dir === "right" ? "nextElementSibling" : "previousElementSibling";
    while (
      (nextEl = nextEl[fnName]
        ? nextEl[fnName]
        : el.parentElement.children[dir === "right" ? 0 : n * n - 1])
    ) {
      if (!nextEl.className.match(/cover/)) {
        break;
      }
    }
    nextEl.focus();
  } else if (dir === "up" || dir === "down") {
    let nextEl = el;
    const diff = dir === "down" ? 1 : -1;
    while (
      (nextEl =
        nextEl.posY + diff < n && nextEl.posY + diff >= 0
          ? getVerticalEl(nextEl, nextEl.posX, nextEl.posY + diff)
          : getVerticalEl(nextEl, nextEl.posX, dir === "down" ? 0 : n - 1))
    ) {
      if (!nextEl.className.match(/cover/)) {
        break;
      }
    }
    nextEl.focus();
  }
}

window.onkeyup = e => {
  // console.log(e.key);
  const target = e.target;

  if (gameState !== GAME_STATES.STARTED) {
    return;
  }

  if (!target.className.match(/tile/)) {
    if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) {
      tileContainer.querySelector(".tile:not(.cover):not(.hole)").focus();
    }
  }

  let num = parseInt(e.key, 10);
  if (!isNaN(num)) {
    setTileValue(target, num);
  }

  if (e.key === "ArrowRight") {
    navigate(e.target, "right");
  } else if (e.key === "ArrowLeft") {
    navigate(e.target, "left");
  } else if (e.key === "ArrowDown") {
    navigate(e.target, "down");
  } else if (e.key === "ArrowUp") {
    navigate(e.target, "up");
  }

  // to prevent scrolling
  if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
  }
};

function shake({ time, el = document.body, shakeIntensity = 15 }) {
  let shakeTime = time;
  function shakeRepeater() {
    shakeTime -= 1 / 60;
    // el.style.left = `${random(-shakeIntensity, shakeIntensity)}px`;
    // el.style.top = `${random(-shakeIntensity, shakeIntensity)}px`;
    el.style.transform = `translate(${random(
      -shakeIntensity,
      shakeIntensity
    )}px,${random(-shakeIntensity, shakeIntensity)}px)`;

    if (shakeTime > 0) {
      requestAnimationFrame(shakeRepeater);
    } else {
      el.style.transform = null;

      // el.style.marginLeft = null;
      // el.style.marginTop = null;
    }
  }
  shakeRepeater();
}

function menuBombBlast(bomb) {
  const bound = bomb.getBoundingClientRect();

  for (let i = random(5, 20); i--; ) {
    entities.push(
      new Particle({
        height: random(5, 15),
        width: random(5, 15),
        x: random(bound.left, bound.left + bound.width),
        y: random(bound.top, bound.top + bound.height),
        vx: random(-10, 10),
        vy: -random(20, 55),
        isConfetti: true,
        gravity: 0.4,
        friction: 0.88,
        alphaSpeed: -0.025,
        scale: 0.3 + Math.random(0, 1),
        angularSpeed: { x: random(-5, 5), y: 0, z: 0 },
        color: "yellow",
        timeToDie: 0.7
      })
    );
  }
}
function saveScores(score) {
  if (score < highScore[currentLevel] || !highScore[currentLevel]) {
    highScore[currentLevel] = score;
    window.localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(highScore));
    updateScoreUi();
  }
  lastGameScore = score;
}
function tweetScore(score, level) {
  const words = ["Yay!", "Wohoo!", "Yuhoo!", "Check it out!", "Rad!"];
  window.open(
    `http://twitter.com/share?url=${location.href}&text=🎮 ${
      words[random(0, words.length)]
    } I finished "Repeewsenim" in just ${score} seconds in ${
      level ? "hard" : "easy"
    } mode! 🔥&hashtags=js13k,indiedev&related=chinchang457`
  );
}

function gameLoop() {
  const now = Date.now();

  if (currentScreen === "menu" && Math.random() < 0.005) {
    entities.push(
      new Bomb({
        x: random(0, W),
        y: random(0, H / 2)
      })
    );
  }

  if (gameState === GAME_STATES.STARTED) {
    const time = (~~(now - startTime) / 1000).toFixed(1);
    window.timeEl.textContent = `${time} seconds`;
  }
  entities.map(e => {
    e.update();
    e.draw();
    if (e.hasHitEnd && e.hasHitEnd()) {
      e.dead = true;

      if (e.type === "bomb") {
        menuBombBlast(e.el);
      }
      e.destroy();
    }
  });
  entities = entities.filter(e => !e.dead);
  requestAnimationFrame(gameLoop);
}

function insertCloseButtonInDetails() {
  const els = document.querySelectorAll("details");
  els.forEach(el => {
    el.innerHTML += `<p><button class="btn">Close</button></p>`;
    el.querySelector("button").addEventListener("click", () => {
      el.open = false;
    });
  });
}
function init() {
  // menu gameboard
  gen(0, window.menuTileContainer, true);
  gameLoop();
  updateScoreUi();
  insertCloseButtonInDetails();
  window.setupGame = setupGame;
  window.changeScreen = changeScreen;
  window.tweetScore = tweetScore;
}
// playWinSound();

init();
