import { H } from "./utils";

export class Particle {
  constructor({
    width = 15,
    height = 15,
    x = 0,
    y = 0,
    rotationX = 0,
    rotationY = 0,
    rotationZ = 0,
    angularSpeed = { x: 10, y: 10, z: 10 },
    alpha = 1,
    vx = 0,
    vy = 0,
    friction = 1,
    isConfetti = false,
    classes = "",
    color = "red",
    gravity = 0,
    alphaSpeed = -0.01,
    scale = 1,
    timeToDie = 0.6
  }) {
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
    this.isConfetti = isConfetti;
    this.angularSpeed = angularSpeed;
    this.friction = friction;
    this.color = color;
    this.gravity = gravity;
    this.alphaSpeed = alphaSpeed;
    this.scale = scale;

    this.timeToDie = timeToDie;
    this.el = document.createElement("div");
    this.el.classList.add("particle");
    if (classes) {
      this.el.classList.add(classes);
    }
    this.el.style.backgroundColor = color;
    this.el.style.width = `${this.width}px`;
    this.el.style.height = `${this.height}px`;
    this.draw();
    window.particleContainer.append(this.el);
  }

  destroy() {
    this.el.remove();
  }
  hasHitEnd() {
    return this.alpha < 0 || this.y > H;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;

    if (this.isConfetti) {
      if (Math.random() > 0.5) {
        this.rotationX += this.angularSpeed.x;
      }
      if (Math.random() > 0.8) {
        this.rotationY += this.angularSpeed.y;
      }
      if (Math.random() > 0.3) {
        this.rotationZ += this.angularSpeed.z;
      }
    }
    this.timeToDie -= 1 / 60;
    if (this.timeToDie < 0) {
      this.alpha += this.alphaSpeed;
    }
  }
  draw() {
    this.el.style.transform = `translate(${this.x}px, ${this.y}px) rotate3d(1,1,1,${this.rotationX}deg)  scale(${this.scale})`;
    this.el.style.opacity = this.alpha;
  }
}
