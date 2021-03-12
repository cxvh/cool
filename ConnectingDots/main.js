"use strict";

const PI2 = 2 * Math.PI;
function map(s, a1, a2, b1, b2) {
  return b1 + ((s - a1) * (b2 - b1)) / (a2 - a1);
}

class Connect {
  constructor() {
    ctx.lineWidth = 0.1;

    this.connectArea = {
      maxConnectionLength: 80,
      connectAreaRadius: 130,
      x: 0,
      y: 0,
      destX: 0,
      destY: 0
    };

    this.bounds = {
      top: 2,
      left: 2,
      right: 0,
      bottom: 0
    };

    this.dots = [];

    this.resize();
    this.connectArea.x = this.centerX;
    this.connectArea.y = this.centerY;
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.centerX = (this.width / 2) | 0;
    this.centerY = (this.height / 2) | 0;

    canvas.width = this.width;
    canvas.height = this.height;

    this.connectArea.destX = this.centerX;
    this.connectArea.destY = this.centerY;

    this.bounds.right = this.width - 2;
    this.bounds.bottom = this.height - 2;

    this.colorCounter = 0;
    this.dotCount = ((this.width * this.height) / 3000) | 0;

    if (this.dotCount > this.dots.length) {
      for (let i = this.dotCount - this.dots.length; i > 0; i--) {
        this.dots.push(
          new Dot(
            this.width,
            this.height,
            (this.colorCounter += 2) < 360
              ? this.colorCounter
              : (this.colorCounter = 0)
          )
        );
      }
    } else if (this.dotCount < this.dots.length) {
      this.dots.splice(0, this.dotCount - this.dots.length);

      for (let i = 0; i < this.dotCount; i++) {
        if (
          this.dots[i].y < this.bounds.top ||
          this.dots[i].y > this.bounds.bottom ||
          this.dots[i].x < this.bounds.left ||
          this.dots[i].x > this.bounds.right
        ) {
          this.dots[i].x = (Math.random() * this.width) | 0;
          this.dots[i].y = (Math.random() * this.height) | 0;
        }
      }
    }
  }

  onMove(evt) {
    this.connectArea.destX =
      evt.clientX || (evt.touches && evt.touches[0].pageX);
    this.connectArea.destY =
      evt.clientY || (evt.touches && evt.touches[0].pageY);
  }

  onLeave(evt) {
    this.connectArea.destX = this.centerX;
    this.connectArea.destY = this.centerY;
  }

  connectDots() {
    for (let i = 0; i < this.dotCount; i++) {
      for (let j = i + 1; j < this.dotCount; j++) {
        let dot1 = this.dots[i];
        let dot2 = this.dots[j];

        let xDiff = Math.abs(dot1.x - dot2.x);
        let yDiff = Math.abs(dot1.y - dot2.y);
        let xDiffArea = Math.abs(dot1.x - this.connectArea.x);
        let yDiffArea = Math.abs(dot1.y - this.connectArea.y);

        if (
          xDiff < this.connectArea.maxConnectionLength &&
          yDiff < this.connectArea.maxConnectionLength &&
          xDiffArea < this.connectArea.connectAreaRadius &&
          yDiffArea < this.connectArea.connectAreaRadius
        ) {
          let gradient = ctx.createLinearGradient(
            dot1.x,
            dot1.y,
            dot2.x,
            dot1.y
          );
          gradient.addColorStop(0, dot1.color);
          gradient.addColorStop(1, dot2.color);

          ctx.beginPath();
          ctx.moveTo(dot1.x, dot1.y);
          ctx.lineTo(dot2.x, dot2.y);
          ctx.strokeStyle = gradient;
          ctx.stroke();
        }
      }
    }
  }

  update() {
    ctx.globalCompositeOperation = "hard-light";
    ctx.fillStyle = "rgba(20,20,20,0.2)";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.globalCompositeOperation = "source-over";
    //  ctx.clearRect(0, 0, this.width, this.height)

    let distX = this.connectArea.destX - this.connectArea.x;
    if (distX > 5 || distX < 5) this.connectArea.x += (distX / 10) | 0;
    let distY = this.connectArea.destY - this.connectArea.y;
    if (distX > 5 || distX < 5) this.connectArea.y += (distY / 10) | 0;

    for (let i = 0; i < this.dotCount; i++) this.dots[i].update(this.bounds);
    this.connectDots();

    for (let i = 0; i < this.dotCount; i++) this.dots[i].draw();
  }
}

class Dot {
  constructor(width, height, color) {
    this.x = (Math.random() * width) | 0;
    this.y = (Math.random() * height) | 0;
    this.vx = (Math.random() - 0.7) / 2;
    this.vy = (Math.random() - 0.7) / 2;
    this.radius = Math.random() * 2 + 0.3;
    this.color = "hsla(" + color + ",80%,50%," + this.radius * 0.5 + ")";
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, PI2);
    ctx.fill();
  }

  update(bounds) {
    if (this.y < bounds.top || this.y > bounds.bottom) this.vy = -this.vy;
    else if (this.x < bounds.left || this.x > bounds.right) this.vx = -this.vx;
    this.x += this.vx;
    this.y += this.vy;
  }
}

let canvas = document.getElementById("connect");
let ctx = canvas.getContext("2d");

let connect = new Connect();

canvas.onmousemove = (evt) => connect.onMove(evt);
canvas.onmouseleave = (evt) => connect.onLeave(evt);
canvas.ontouchstart = (evt) => connect.onMove(evt);
canvas.ontouchmove = (evt) => connect.onLeave(evt);

window.onresize = () => connect.resize();
(function update() {
  requestAnimationFrame(update);
  connect.update();
})();
