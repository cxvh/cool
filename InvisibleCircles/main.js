/*

  Thanks for checking this pen out.
  
  First part is the Overlay class. This is used to show thr circles.
  It needs a canvas to draw on and accepts an optional config object.
  
  You should hook up the class to the requestAnimationFrame function 
  and set a resize listener for it. (example at the end)
  
  The second part makes this into a library you can use it by 
  adding the "circleEffect" attribute to any element

*/

/**********************************************
  things that should be in js
**********************************************/
const TAU = 2 * Math.PI;
const rand = (min, max, decimals = 0) =>
  (Math.random() * (max - min) + min).toFixed(decimals) * 1;
const map = (s, a1, a2, b1, b2) =>
  Math.min(Math.max(b1 + ((s - a1) * (b2 - b1)) / (a2 - a1), b2), b1);

const cursor = { x: 0, y: 0, active: false };
addEventListener("mousemove", function (e) {
  cursor.x = e.clientX;
  cursor.y = e.clientY;
  cursor.active = true;
});
addEventListener("mouseout", function (e) {
  if (e.toElement == null && e.relatedTarget == null) cursor.active = false;
});

/**********************************************
  Overlay (needs functions from above)
**********************************************/
class Overlay {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");

    // config defaults --------------

    this.config = Object.assign(
      {
        // dots
        minRadius: 7,
        maxRadius: 340,
        moveSpeed: 0.3,
        growSpeed: 15,
        countDivider: 25000,

        // lines
        maxLength: 150,

        // background
        color: "#fff",
        clear: 0.7 // alpha
      },
      config
    );

    // --------------

    this.dots = [];

    this.onResize(this.canvas.width, this.canvas.height);
  }

  onResize(width, height) {
    this.width = this.canvas.width = width;
    this.height = this.canvas.height = height;

    let targetCount = ((width * height) / this.config.countDivider) | 0;

    // push more dots
    for (let i = this.dots.length; i < targetCount; i++)
      this.dots.push({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-this.config.moveSpeed, this.config.moveSpeed, 3),
        vy: rand(-this.config.moveSpeed, this.config.moveSpeed, 3),
        r: this.config.minRadius
      });

    // remove the dot overhead
    if (targetCount < this.dots.length) {
      this.dots.splice(0, this.dots.length - targetCount);

      for (let i = 0, dot; (dot = this.dots[i]); i++) {
        if (dot.x < 0 || dot.x > width || dot.y < 0 || dot.y > height) {
          dot.x = rand(0, width);
          dot.y = rand(0, height);
        }
      }
    }
  }

  update() {
    const ctx = this.ctx;
    const config = this.config;

    // draw white
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = config.color;
    ctx.fillRect(0, 0, this.width, this.height);

    // draw negative
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = ctx.strokeStyle = "rgba(0,0,0," + config.clear + ")";

    // draw circles and lines
    for (let i = 0, dot; (dot = this.dots[i]); i++) {
      // move point ( = add it's velocity)
      dot.x += dot.vx;
      dot.y += dot.vy;

      // wall collision
      if (dot.x < 0 || dot.x > this.width) dot.vx *= -1;
      if (dot.y < 0 || dot.y > this.height) dot.vy *= -1;

      // if cursor is on screen and over the canvas
      if (
        cursor.active &&
        cursor.x > this.canvas.offsetLeft &&
        cursor.x < this.canvas.offsetLeft + this.width &&
        cursor.y > this.canvas.offsetTop &&
        cursor.y < this.canvas.offsetTop + this.height
      ) {
        // calculate size
        const distanceToCursor =
          (cursor.x - this.canvas.offsetLeft - dot.x) ** 2 +
          (cursor.y - this.canvas.offsetTop - dot.y) ** 2;

        var targetRadius = map(
          distanceToCursor,
          0,
          (this.width * this.height) / 2,
          config.maxRadius,
          config.minRadius
        );
      } else var targetRadius = config.minRadius;

      // calculate new size for this interval
      dot.r = dot.r + (targetRadius - dot.r) / config.growSpeed;

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, TAU);
      ctx.fill();

      // draw the connecting lines
      for (let j = i + 1, dot2; (dot2 = this.dots[j]); j++) {
        // the circles are too far apart
        if (
          Math.abs(dot.x - dot2.x) > config.maxLength ||
          Math.abs(dot.y - dot2.y) > config.maxLength
        )
          continue;

        // circles are touching so no lines
        if (
          (dot.x - dot2.x) ** 2 + (dot.y - dot2.y) ** 2 <=
          (dot.r + dot2.r) ** 2
        )
          continue;

        // the lines start at the circumference of the circle

        let angle = Math.atan2(dot2.y - dot.y, dot2.x - dot.x);

        ctx.beginPath();

        ctx.moveTo(
          dot.x + dot.r * Math.cos(angle),
          dot.y + dot.r * Math.sin(angle)
        );

        angle -= Math.PI;

        ctx.lineTo(
          dot2.x + dot2.r * Math.cos(angle),
          dot2.y + dot2.r * Math.sin(angle)
        );

        ctx.stroke();
      }
    }
  }
}

/**********************************************
  initialize
  also second part to the code
/**********************************************/
const overlays = [];

(function () {
  // for all elements with tag "circleEffect"
  const elements = document.getElementsByTagName("*");
  for (let i = 0, element; (element = elements[i]); i++) {
    if (element.getAttribute("circleEffect") === null) continue;

    // create new canvas
    let canvas = document.createElement("canvas");
    canvas.width = element.offsetWidth;
    canvas.height = element.offsetHeight;

    canvas.style.position = "absolute";
    canvas.style.top = element.offsetTop + "px";
    canvas.style.left = element.offsetLeft + "px";
    canvas.style.opacity = ".95";

    // and add it to the dom
    element.parentNode.insertBefore(canvas, element.nextSibling);

    // store
    overlays.push({
      origin: element,
      overlay: new Overlay(canvas)
    });
  }
})();

/*
  hook up resize listener and requestAnimationFrame
*/
addEventListener("resize", function (e) {
  for (let set of overlays)
    set.overlay.onResize(set.origin.offsetWidth, set.origin.offsetHeight);
});
(function update() {
  requestAnimationFrame(update);
  for (let set of overlays) set.overlay.update();

  // write some text
  let overlay = overlays[0].overlay;
  overlay.ctx.textAlign = "center";
  overlay.ctx.font = "7em Barlow Condensed";
  overlay.ctx.fillText("cxvh.com", overlay.width / 2, overlay.height / 2);
  overlay.ctx.font = "2em Barlow Condensed";
  overlay.ctx.fillText(
    "鼠标悬停看效果",
    overlay.width / 2,
    overlay.height / 2 + 50
  );
})();
