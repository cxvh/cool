"use strict";
window.requestAnimFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function (callback) {
    window.setTimeout(callback, 1e3 / 60);
  };
let accuracy = 1;
let gravity = 50;
let clothY = 35;
let clothX = 140;
let spacing = 9;
let tearDist = 80;
let friction = 0.99;
let bounce = 0.5;

let textScaling = 3;
let textLeftCenter = 20;
let blocks = [
  [],
  [],
  [2, 3, 5, 6, 7, 9, 10, 11, 13, 16, 19, 22, 26, 27, 29, 30, 31, 33, 34, 35],
  [1, 4, 6, 10, 13, 16, 19, 22, 25, 27, 29, 32, 34],
  [1, 6, 10, 13, 16, 19, 22, 24, 27, 29, 32, 34],
  [2, 3, 6, 10, 13, 16, 19, 20, 21, 22, 24, 27, 29, 30, 31, 34],
  [4, 6, 10, 13, 16, 19, 22, 24, 25, 26, 27, 29, 31, 34],
  [1, 4, 6, 10, 13, 16, 19, 22, 24, 27, 29, 32, 34],
  [2, 3, 6, 9, 10, 11, 13, 14, 16, 17, 19, 22, 24, 27, 29, 32, 34]
];

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = 500;

ctx.strokeStyle = "#555";

let mouse = {
  cut: 8,
  influence: 36,
  down: false,
  button: 1,
  x: 0,
  y: 0,
  px: 0,
  py: 0
};

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.pinX = null;
    this.pinY = null;

    this.constraints = [];
  }

  update(delta) {
    if (this.pinX && this.pinY) return this;

    if (mouse.down) {
      let dx = this.x - mouse.x;
      let dy = this.y - mouse.y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (mouse.button === 1 && dist < mouse.influence) {
        this.px = this.x - (mouse.x - mouse.px);
        this.py = this.y - (mouse.y - mouse.py);
      } else if (mouse.button === 2) {
        this.py = this.py - 10;
      } else {
        if (this.pinX == null) {
          if (dist < mouse.influence) {
            this.pinX = mouse.x * Math.floor(Math.random() * 25) + 1 / 10;
            this.pinY = mouse.y * Math.floor(Math.random() * 25) + 1 / 10;
          }
        } else this.pin_y = this.pin_x = null;
      }
    }

    this.addForce(0, gravity);

    let nx = this.x + (this.x - this.px) * friction + this.vx * delta;
    let ny = this.y + (this.y - this.py) * friction + this.vy * delta;

    this.px = this.x;
    this.py = this.y;

    this.x = nx;
    this.y = ny;

    this.vy = this.vx = 0;

    if (this.x >= canvas.width) {
      this.px = canvas.width + (canvas.width - this.px) * bounce;
      this.x = canvas.width;
    } else if (this.x <= 0) {
      this.px *= -1 * bounce;
      this.x = 0;
    }

    if (this.y >= canvas.height) {
      this.py = canvas.height + (canvas.height - this.py) * bounce;
      this.y = canvas.height;
    } else if (this.y <= 0) {
      this.py *= -1 * bounce;
      this.y = 0;
    }

    return this;
  }

  draw() {
    if (!this.constraints.length) return;

    ctx.beginPath();
    ctx.strokeStyle =
      "rgb(" +
      Math.floor((255 * this.y) / canvas.height) +
      "," +
      Math.floor((255 * this.x) / canvas.width) +
      ",255)";

    let i = this.constraints.length;
    while (i--) this.constraints[i].draw();

    ctx.stroke();
  }

  resolve() {
    if (this.pinX && this.pinY) {
      this.x = this.pinX;
      this.y = this.pinY;
      return;
    }

    this.constraints.forEach((constraint) => constraint.resolve());
  }

  attach(point) {
    this.constraints.push(new Constraint(this, point));
  }

  free(constraint) {
    this.constraints.splice(this.constraints.indexOf(constraint), 1);
  }

  addForce(x, y) {
    this.vx += x;
    this.vy += y;
  }

  pin(pinx, piny) {
    this.pinX = pinx;
    this.pinY = piny;
  }
}

class Constraint {
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = spacing;
  }

  resolve() {
    let dx = this.p1.x - this.p2.x;
    let dy = this.p1.y - this.p2.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.length) return;

    let diff = (this.length - dist) / dist;

    if (dist > tearDist) this.p1.free(this);

    let mul = diff * 0.5 * (1 - this.length / dist);

    let px = dx * mul;
    let py = dy * mul;

    !this.p1.pinX && (this.p1.x += px);
    !this.p1.pinY && (this.p1.y += py);
    !this.p2.pinX && (this.p2.x -= px);
    !this.p2.pinY && (this.p2.y -= py);

    return this;
  }

  draw() {
    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.lineTo(this.p2.x, this.p2.y);
  }
}

class Cloth {
  constructor(free) {
    this.points = [];

    let startX = canvas.width / 2 - (clothX * spacing) / 2;

    for (let y = 0; y <= clothY; y++) {
      for (let x = 0; x <= clothX; x++) {
        let point = new Point(startX + x * spacing, 20 + y * spacing);
        !free && y === 0 && point.pin(point.x, point.y);
        x !== 0 && point.attach(this.points[this.points.length - 1]);
        y !== 0 && point.attach(this.points[x + (y - 1) * (clothX + 1)]);

        this.points.push(point);
      }
    }
  }

  update(delta) {
    let i = accuracy;

    while (i--) {
      this.points.forEach((point) => {
        point.resolve();
      });
    }

    // ctx.beginPath()
    this.points.forEach((point) => {
      point.update(delta * delta).draw();
    });
    // ctx.stroke()
  }
}

function setMouse(e) {
  let rect = canvas.getBoundingClientRect();
  mouse.px = mouse.x;
  mouse.py = mouse.y;
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
}

canvas.onmousedown = (e) => {
  mouse.button = e.which;
  mouse.down = true;
  setMouse(e);
};

canvas.onmousemove = setMouse;

canvas.onmouseup = () => (mouse.down = false);

canvas.onmouseleave = () => (mouse.down = false);

canvas.oncontextmenu = (e) => e.preventDefault();

let cloth = new Cloth();

function zeroG() {
  gravity = 0;
  cloth = new Cloth(true);
}

(function update(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  cloth.update(0.016);

  window.requestAnimFrame(update);
})(0);
