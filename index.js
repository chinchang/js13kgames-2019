import { Particle } from "./particle.js";

const DEBUG = true;
let cellSize = parseInt(
  window.getComputedStyle(document.documentElement).getPropertyValue("--unit")
);
const W = window.innerWidth;
const H = window.innerHeight;
let grid = [];
let input = [];
let n = 6;
const levels = {
  0: { n: 3, mines: 2 },
  1: { n: 6, mines: 8 },
  2: { n: 12, mines: 20 }
};
const screens = [...document.querySelectorAll(".screen")];
let hasGameStarted = false;
let currentScreen = "mainmenu";
let startTime;
let entities = [];

function random(a, b) {
  return a + ~~(Math.random() * (b - a));
}

function changeScreen(name) {
  screens.forEach(screen => screen.classList.remove("visible"));
  document.querySelector(`[data-screen="${name}"]`).classList.add("visible");
  currentScreen = name;
  hideMessage();
}

function logField(arr) {
  console.log("Field:");
  for (let y = 0; y < n; y++) {
    console.log(arr[y]);
    console.log("---");
  }
}

function makeTile({ isHole, isFake }) {
  // const isHole = hole || Math.random() > 0.7;
  const t = document.createElement(isFake || isHole ? "div" : "button");
  t.classList.add("tile");
  if (isHole) {
    t.classList.add("hole");
    t.tileType = "hole";
  }
  return t;
}
function gen(level) {
  n = levels[level].n;
  const numMines = levels[level].mines;
  cellSize = ~~((Math.min(W, H) * 0.8) / n);
  document.documentElement.style.setProperty("--unit", `${cellSize}px`);
  tileContainer.style.left = `${cellSize * n * 0.15}px`;
  tileContainer.style.width = `${cellSize * n}px`;
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

  Array.from(tileContainer.children).map(i => i.remove());
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
        isFake: j === n
      });
      t.style.top = `${j * cellSize}px`;
      t.style.left = `${i * cellSize}px`;
      t.count = 0;
      t.posX = i;
      t.posY = j;
      if (!t.className.match(/(hole|cover)/)) {
        t.setAttribute("aria-label", `Row ${j + 1}, Column ${i + 1}`);
      }
      const offset = -10;
      t.style.transform = `translate(${offset}px, -${offset}px)`;
      t.style.transitionDelay = `${(j * n + i) * 0.02}s`; //`${Math.random() * 0.5}s`;
      t.style.setProperty("--blast-delay", `${Math.random() * 0.3}s`);
      t.style.transitionTimingFunction =
        "0.25s cubic-bezier(0, 0.6, 0.6, 1.34)";
      t.style.opacity = 0;
      setTimeout(() => {
        t.style.transform = `translate(0px, 0px)`;
        t.style.opacity = 1;
      }, 1);
      setTimeout(() => {
        t.style.transitionTimingFunction = null;
        t.style.transitionDelay = null;
        t.style.transitionDuration = null;
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
      tileContainer.append(t);
    }
  // logField(grid);
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
  const el = document.createElement("div");
  el.setAttribute("role", "alert");
  el.className = "message";
  document.body.append(el);
  el.innerHTML = `<div class="message__text">${msg}</div>`;

  await wait(10);
  document.body.classList.add("message-anim-1");
  await wait(430);
  document.body.classList.add("message-anim-2");
}
async function hideMessage() {
  document.body.classList.remove("message-anim-2");
  if (document.querySelector(".message")) {
    document.querySelector(".message").remove();
  }
  document.body.classList.remove("message-anim-1");
}
function setupGame(e, level) {
  if (e) {
    level = parseInt(e.target.dataset.level, 10);
    e.stopPropagation();
  }
  gen(level);
  changeScreen("game");
  showMessage("Click/Tap anywhere to start");
}

async function startGame() {
  hideMessage();
  document.body.classList.add("bomb-place-anim-1");

  await wait(500);

  document.body.classList.add("bomb-place-anim-2");
  shake({ time: 0.5 });

  await wait(500);

  document.body.classList.add("bomb-place-anim-3");
  document.body.classList.add("game-started");
  hasGameStarted = true;
  startTime = Date.now();
}

function setTileValue(el, value, diff = 1) {
  input[el.posX][el.posY] =
    value !== undefined ? value : input[el.posX][el.posY] + diff;
  input[el.posX][el.posY] %= 9;
  if (input[el.posX][el.posY] < 0) {
    input[el.posX][el.posY] = 8;
  }
  el.textContent = [1, 2, 3, 4, 5, 6, 7, 8][input[el.posX][el.posY] - 1];

  // shake tile
  shake({ time: 0.3, el, shakeIntensity: 5 });
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
    hasGameStarted = false;
    setTimeout(() => {
      showMessage(
        `<p>You completed the level in <strong>${time} seconds!</strong></p>
              <p><button class="btn" onclick="window.changeScreen('menu')">Back to menu</button></p>`
      );
    }, 10);

    winBlast();
  }
}
function tileClickHandler(e) {
  if (!hasGameStarted) return;
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
  await wait(500);
  blast({
    n: 30,
    minX: (W * 3) / 4 - 50,
    maxX: (W * 3) / 4 + 50,
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
    if (!hasGameStarted) {
      startGame();
    }
    tileClickHandler(e);
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
      if (
        !nextEl.classList.contains("hole") &&
        !nextEl.className.match(/cover/)
      ) {
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
      if (
        !nextEl.classList.contains("hole") &&
        !nextEl.className.match(/cover/)
      ) {
        break;
      }
    }
    nextEl.focus();
  }
}

window.onkeyup = e => {
  // console.log(e.key);
  const target = e.target;

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

function tweetScore() {
  window.open(
    `http://twitter.com/share?url=${location.href}&text=🎮 I reached level ${time} of Key Battle 🔥.&count=horiztonal&hashtags=js13k,game,indiedev&via=chinchang457&related=chinchang457`
  );
}

function gameLoop() {
  entities.map(e => {
    e.update();
    e.draw();
    if (e.alpha < 0) {
      e.dead = true;
      e.destroy();
    }
  });
  entities = entities.filter(e => !e.dead);
  requestAnimationFrame(gameLoop);
}

gameLoop();
window.setupGame = setupGame;
window.changeScreen = changeScreen;

// setupGame(null, 0);
