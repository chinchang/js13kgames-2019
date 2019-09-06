import { Particle } from "./particle";
import { W, H, random } from "./utils.js";

export class Bomb {
  constructor({
    width = 100,
    height = 100,
    x = 0,
    y = 0,
    rotationX = 0,
    rotationY = 0,
    rotationZ = 0,
    angularSpeed = { x: 10, y: 10, z: 10 },
    alpha = 0,
    vx = 0,
    vy = 0,
    classes = "",
    gravity = 0.2,
    alphaSpeed = 0.01,
    scale = 1,
    timeToDie = 0.6
  }) {
    this.type = "bomb";
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.rotationX = rotationX;
    this.rotationY = rotationY;
    this.rotationZ = rotationZ;
    this.alpha = alpha;
    this.vx = vx;
    this.vy = vy;
    this.angularSpeed = angularSpeed;
    this.gravity = gravity;
    this.alphaSpeed = alphaSpeed;
    this.scale = scale;

    this.timeToDie = timeToDie;

    this.bounces = random(1, 4);
    this.el = document.createElement("div");
    this.el.classList.add("bomb");
    this.el.textContent = "💣";
    if (classes) {
      this.el.classList.add(classes);
    }
    this.el.style.width = `${this.width}px`;
    this.el.style.height = `${this.height}px`;
    document.querySelector('[data-screen="menu"]').append(this.el);
  }

  destroy() {
    this.el.remove();
  }
  hasHitEnd() {
    return this.y + this.height === H;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;

    if (this.y + this.height > H) {
      this.bounces--;
      if (this.bounces) {
        this.y = H - this.height - 1;
        // this.gravity = 0;
        this.vy = -this.vy * 0.5;
      } else {
        this.y = H - this.height;
        this.gravity = 0;
        this.vy = 0;
      }
    }

    if (this.alpha < 1) {
      this.alpha += this.alphaSpeed;
    }
  }
  draw() {
    this.el.style.transform = `translate(${this.x}px, ${this.y}px) rotate3d(1,1,1,${this.rotationX}deg)  scale(${this.scale})`;
    this.el.style.opacity = this.alpha;
  }
}
